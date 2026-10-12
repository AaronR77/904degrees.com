/*
 * 904° MARK06 — Access perimeter for Cloudflare Pages.
 *
 * This runs BEFORE serving static files or Functions at protected URLs.
 * No configuration, no token, bad signature, wrong audience, or an email
 * absent from the appropriate allowlist => DENY. There is no dev bypass.
 *
 * Cloudflare Access supplies the signed Cf-Access-Jwt-Assertion header.
 * Its identity token is verified here, rather than trusting a bare email header.
 */

const KEY_CACHE_MS = 5 * 60 * 1000;
const MAX_TOKEN_LENGTH = 16384;
const decoder = new TextDecoder();
const keyCaches = new Map();

function deny() {
  return new Response('904° — Access denied. This area requires approved sign-in.\n', {
    status: 403,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

function b64urlBytes(input) {
  if (!/^[A-Za-z0-9_-]+$/.test(input)) throw new Error('Invalid base64url');
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - base64.length % 4) % 4));
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

function parsePart(part) {
  return JSON.parse(decoder.decode(b64urlBytes(part)));
}

function allowedEmails(csv) {
  return new Set(String(csv || '')
    .split(',').map(email => email.trim().toLowerCase()).filter(Boolean));
}

function exactTeamDomain(raw) {
  if (!raw) return null;
  try {
    const value = new URL(String(raw));
    if (value.protocol !== 'https:' || value.username || value.password || value.port ||
        value.pathname !== '/' || value.search || value.hash ||
        !/^[a-z0-9-]+\.cloudflareaccess\.com$/i.test(value.hostname)) return null;
    return value.origin;
  } catch (_) { return null; }
}

async function publicKeys(issuer) {
  const cached = keyCaches.get(issuer);
  if (cached && Date.now() < cached.until) return cached.keys;

  // The hostname is strictly validated above and is NOT read from any JWT.
  const response = await fetch(issuer + '/cdn-cgi/access/certs', {
    headers: { Accept: 'application/json' },
    redirect: 'error',
    signal: AbortSignal.timeout(3500),
  });
  if (!response.ok) throw new Error('Access certificate endpoint unavailable');
  const document = await response.json();
  if (!Array.isArray(document.keys) || document.keys.length === 0 || document.keys.length > 10) {
    throw new Error('Missing Access keys');
  }
  const keys = document.keys.filter(key => key && key.kty === 'RSA' &&
    typeof key.kid === 'string' && (!key.alg || key.alg === 'RS256') &&
    (!key.use || key.use === 'sig'));
  if (!keys.length) throw new Error('No valid Access verification keys');
  keyCaches.set(issuer, { keys, until: Date.now() + KEY_CACHE_MS });
  return keys;
}

async function verifyAccessJwt(token, issuer, audience) {
  if (!token || token.length > MAX_TOKEN_LENGTH) return null;
  const chunks = token.split('.');
  if (chunks.length !== 3) return null;
  const [headerSegment, payloadSegment, signatureSegment] = chunks;
  const header = parsePart(headerSegment);
  if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid) return null;
  const keys = await publicKeys(issuer);
  const key = keys.find(item => item.kid === header.kid);
  if (!key) return null;

  const publicKey = await crypto.subtle.importKey(
    'jwk', key, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']
  );
  const signedContent = new TextEncoder().encode(headerSegment + '.' + payloadSegment);
  const verified = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5', publicKey, b64urlBytes(signatureSegment), signedContent
  );
  if (!verified) return null;

  const claims = parsePart(payloadSegment);
  const current = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (claims.iss !== issuer || !audiences.includes(audience) ||
      !Number.isInteger(claims.exp) || claims.exp <= current ||
      (claims.nbf !== undefined && (!Number.isInteger(claims.nbf) || claims.nbf > current)) ||
      (claims.iat !== undefined && (!Number.isInteger(claims.iat) || claims.iat > current + 60)) ||
      typeof claims.email !== 'string') return null;
  return claims;
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
  if (!issuer || !audience || addresses.size === 0) return deny();

  try {
    const jwt = context.request.headers.get('Cf-Access-Jwt-Assertion');
    const identity = await verifyAccessJwt(jwt, issuer, audience);
    if (!identity || !addresses.has(identity.email.trim().toLowerCase())) return deny();

    // Cloudflare Access determines the session validity. For the browser
    // auto-logout timer, do not extend a single JWT beyond its own expiration
    // or the selected role's maximum age from token issuance.
    const limitSeconds = area === 'ADMIN' ? 6 * 3600 : 24 * 3600;
    const issued = Number.isInteger(identity.iat) ? identity.iat : null;
    const expires = issued === null ? identity.exp : Math.min(identity.exp, issued + limitSeconds);
    if (expires <= Math.floor(Date.now() / 1000)) return deny();

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
    // These routes should never be stored in intermediary or browser caches.
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'private, no-store');
    headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
    headers.set('X-Content-Type-Options', 'nosniff');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  } catch (_) {
    // Certificate retrieval failures, malformed tokens and internal errors
    // must not expose protected content.
    return deny();
  }
}
