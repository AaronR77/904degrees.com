/*
 * 904° MARK08 — Cloudflare Access perimeter and server-only denial diagnostics.
 *
 * Fail closed on missing configuration, absent/invalid JWT, expired session,
 * mismatched Access application audience, or unauthorized email.
 *
 * DIAGNOSTICS: log only a fixed failure category and ADMIN/CUSTOMER area.
 * Never log tokens, JWT contents, signing keys, email addresses, configured
 * audience tags, or the Access team domain. Client response stays generic.
 */

const KEY_CACHE_MS = 5 * 60 * 1000;
const MAX_TOKEN_LENGTH = 16384;
const decoder = new TextDecoder();
const keyCaches = new Map();

function deny(area, reason) {
  // Cloudflare Pages > Real-time logs: filter by 904_ACCESS_DENIAL.
  // No PII, tokens, or authorization configuration values leave the Worker.
  console.warn('904_ACCESS_DENIAL', JSON.stringify({ area, reason }));
  return new Response('904° — Access denied. This area requires approved sign-in.\n', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function b64urlBytes(input) {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) throw new Error('bad-base64url');
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function parsePart(part) {
  return JSON.parse(decoder.decode(b64urlBytes(part)));
}

function allowedEmails(csv) {
  return new Set(String(csv || '').split(',')
    .map(email => email.trim().toLowerCase()).filter(Boolean));
}

function exactTeamDomain(raw) {
  if (!raw) return null;
  try {
    const value = new URL(String(raw));
    if (value.protocol !== 'https:' || value.username || value.password || value.port ||
      value.pathname !== '/' || value.search || value.hash ||
      !/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(value.hostname)) return null;
    return value.origin;
  } catch (_) {
    return null;
  }
}

class AccessDiagnosticError extends Error {
  constructor(reason) {
    super('Access verification failed');
    this.reason = reason;
  }
}

async function publicKeys(issuer) {
  const cached = keyCaches.get(issuer);
  if (cached && Date.now() < cached.until) return cached.keys;

  let response;
  try {
    response = await fetch(issuer + '/cdn-cgi/access/certs', {
      headers: { Accept: 'application/json' },
      redirect: 'error',
      signal: AbortSignal.timeout(3500),
    });
  } catch (_) {
    throw new AccessDiagnosticError('cert_fetch_failed');
  }
  if (!response.ok) throw new AccessDiagnosticError('cert_http_error');
  let document;
  try {
    document = await response.json();
  } catch (_) {
    throw new AccessDiagnosticError('cert_json_invalid');
  }
  if (!Array.isArray(document.keys) || !document.keys.length || document.keys.length > 10) {
    throw new AccessDiagnosticError('cert_keys_missing');
  }
  const keys = document.keys.filter(key => key && key.kty === 'RSA' &&
    typeof key.kid === 'string' && (!key.alg || key.alg === 'RS256') &&
    (!key.use || key.use === 'sig'));
  if (!keys.length) throw new AccessDiagnosticError('cert_rsa_keys_missing');
  keyCaches.set(issuer, { keys, until: Date.now() + KEY_CACHE_MS });
  return keys;
}

async function verifyAccessJwt(token, issuer, audience) {
  if (!token) return { reason: 'jwt_missing' };
  if (token.length > MAX_TOKEN_LENGTH) return { reason: 'jwt_too_large' };
  const chunks = token.split('.');
  if (chunks.length !== 3) return { reason: 'jwt_structure_invalid' };
  const [headerSegment, payloadSegment, signatureSegment] = chunks;
  let header;
  try { header = parsePart(headerSegment); }
  catch (_) { return { reason: 'jwt_header_invalid' }; }
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) {
    return { reason: 'jwt_header_algorithm_invalid' };
  }
  const keys = await publicKeys(issuer);
  const key = keys.find(item => item.kid === header.kid);
  if (!key) return { reason: 'jwt_kid_not_found' };

  let verified;
  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
    );
    verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5', publicKey, b64urlBytes(signatureSegment),
      new TextEncoder().encode(headerSegment + '.' + payloadSegment)
    );
  } catch (_) {
    return { reason: 'jwt_crypto_error' };
  }
  if (!verified) return { reason: 'jwt_signature_invalid' };

  let claims;
  try { claims = parsePart(payloadSegment); }
  catch (_) { return { reason: 'jwt_payload_invalid' }; }
  const current = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== issuer) return { reason: 'jwt_issuer_mismatch' };
  if (!audiences.includes(audience)) return { reason: 'jwt_audience_mismatch' };
  if (!Number.isInteger(claims.exp) || claims.exp <= current) return { reason: 'jwt_expired_or_invalid' };
  if (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > current)) {
    return { reason: 'jwt_not_yet_valid' };
  }
  if (claims.iat !== undefined && (!Number.isInteger(claims.iat) || claims.iat > current + 60)) {
    return { reason: 'jwt_issued_at_invalid' };
  }
  if (typeof claims.email !== 'string') return { reason: 'jwt_email_missing' };
  return { identity: claims };
}

export async function onRequest(context) {
  const path = new URL(context.request.url).pathname;
  const area = /^\/(?:admin|api\/admin)(?:\/|$)/.test(path) ? 'ADMIN' :
    /^\/(?:customer|api\/customer)(?:\/|$)/.test(path) ? 'CUSTOMER' : null;
  if (!area) return context.next();

  const env = context.env || {};
  const issuer = exactTeamDomain(env.ACCESS_TEAM_DOMAIN);
  const audience = String(env[`ACCESS_${area}_AUD`] || '').trim();
  const addresses = allowedEmails(env[`ACCESS_${area}_EMAILS`]);
  if (!issuer) return deny(area, 'config_issuer_invalid');
  if (!audience) return deny(area, 'config_audience_missing');
  if (!addresses.size) return deny(area, 'config_emails_missing');

  try {
    const jwt = context.request.headers.get('Cf-Access-Jwt-Assertion');
    const checked = await verifyAccessJwt(jwt, issuer, audience);
    if (!checked.identity) return deny(area, checked.reason);
    const identity = checked.identity;
    if (!addresses.has(identity.email.trim().toLowerCase())) return deny(area, 'email_not_allowlisted');

    const limitSeconds = area === 'ADMIN' ? 6 * 3600 : 24 * 3600;
    const issued = Number.isInteger(identity.iat) ? identity.iat : null;
    const expires = issued === null ? identity.exp : Math.min(identity.exp, issued + limitSeconds);
    if (expires <= Math.floor(Date.now() / 1000)) return deny(area, 'area_session_expired');

    if (path === `/api/${area.toLowerCase()}/session`) {
      return new Response(JSON.stringify({ area: area.toLowerCase(), expiresAt: expires * 1000 }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'private, no-store',
          'X-Robots-Tag': 'noindex, nofollow, noarchive',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    }
    const response = await context.next();
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (error) {
    return deny(area, error instanceof AccessDiagnosticError ? error.reason : 'internal_verification_error');
  }
}
