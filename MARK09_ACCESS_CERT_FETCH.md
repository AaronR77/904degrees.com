# 904° MARK09 — Cloudflare Access Certificate Fetch Fix

MARK09 is based on MARK08, preserving all web pages, logout controls, Nondescript Door effects, and fail-closed Admin/Customer JWT validation. **Only the certificate retrieval options in `functions/_middleware.js` were changed.**

## Why this update

MARK08 recorded `904_ACCESS_DENIAL {"area":"ADMIN","reason":"cert_fetch_failed"}`. The user opened `https://904-degrees.cloudflareaccess.com/cdn-cgi/access/certs` directly in a browser and confirmed it returned `keys`, `public_cert`, and `public_certs`, so the publicly accessible endpoint was responding correctly in a browser. MARK08 blocked redirects and imposed a 3.5-second abort on the outbound Worker fetch. Those settings could cause fetch failure and are stricter than Cloudflare's recommended simple remote JWKS pattern.

MARK09 removes the `redirect: 'error'` and short abort option, and uses a standard Worker fetch to the canonical HTTPS URL. Certificate caching remains five minutes. **All token signature, issuer, audience, expiry and email checks remain unchanged and mandatory.** The site never trusts mere existence of the token.

## Next steps

1. Make a backup and copy **the contents of this archive's `904degrees.com` folder** into your existing GitHub repository root. Keep `.git` untouched.
2. Inspect changes and commit/push with GitHub Desktop. You should see a modified `functions/_middleware.js` and this readme; the other files are unchanged from MARK08.
3. Wait for successful Production deployment in Cloudflare Pages.
4. In a fresh private browser session, authenticate normally at `https://www.904degrees.com/admin/`. No tokens or codes should be shared.
5. If access still fails, check the live Pages Function logs for `904_ACCESS_DENIAL` and send **only the reason code**. Possible codes include `cert_fetch_network_error`, `cert_fetch_timeout`, `cert_http_error`, `cert_json_invalid`, `jwt_issuer_mismatch`, `jwt_audience_mismatch`, or `email_not_allowlisted`.

The fix is a compatibility change, **not a guaranteed solution**. Cloudflare's infrastructure can return different network errors from the browser and from a Pages Function. Do not relax Access policies or disable fail-closed to work around denial.

## Cloudflare config reminder

Production env vars: `ACCESS_ADMIN_AUD`, `ACCESS_ADMIN_EMAILS`, `ACCESS_CUSTOMER_AUD`, `ACCESS_CUSTOMER_EMAILS`, `ACCESS_TEAM_DOMAIN`. Keep secret values private. Pages Functions fail-closed stays enabled. Protect `www` and non-`www` protected routes with Cloudflare Access.
