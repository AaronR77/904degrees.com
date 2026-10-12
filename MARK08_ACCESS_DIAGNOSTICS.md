# 904° MARK08 — Safe Access Diagnostics

This is the complete MARK07 site with a **single logic change** to the Pages middleware:
access denials now emit fixed, non-sensitive diagnostic reason codes to **Cloudflare Pages Functions logs**.
The client still receives the same generic 403 message; **there is no security bypass**.

## What to do

1. Deploy this complete website package through the existing GitHub-linked Cloudflare Pages project.
2. In Cloudflare > Workers & Pages > 904degrees.com > Logs / Real-time logs, start live logs for production.
3. Reproduce the Admin access denial once by browsing to https://www.904degrees.com/admin/ while authenticated via Cloudflare Access.
4. Locate the `904_ACCESS_DENIAL` log entry. It will look like:
   `904_ACCESS_DENIAL {"area":"ADMIN","reason":"jwt_issuer_mismatch"}`.
5. Share the **reason code only**, not the JWT/cookies/logged headers or any application secrets.

## Examples of diagnostic codes

- `config_issuer_invalid`: Pages Team Domain missing/invalid.
- `config_audience_missing` / `config_emails_missing`: incomplete Pages configuration.
- `jwt_missing`: no Cloudflare Access token reached the middleware.
- `cert_fetch_failed` / `cert_http_error` / `cert_keys_missing`: verification key download failed.
- `jwt_kid_not_found` / `jwt_crypto_error`: unable to find/import a key for signature validation.
- `jwt_signature_invalid`: token signature verification failed.
- `jwt_issuer_mismatch`: token issuer did not match configured Team Domain.
- `jwt_audience_mismatch`: token audience did not match the application AUD setting.
- `email_not_allowlisted`: signed-in email differs from configured allowed addresses.
- `area_session_expired`: application-side 6h Admin / 24h Customer session limit reached.
- `internal_verification_error`: a different error occurred in verification.

No email, token, issuer, audience, IP, signing material, or secret value is printed by this middleware.
Use the reason code to investigate the precise configuration or compatibility problem.

## Safety

- Cloudflare Access still controls login to protected routes.
- Pages Functions still independently verify the signed JWT, issuer, audience, allowlist and expiry.
- The existing denied response stays HTTP 403 with `no-store`.
- Protected pages remain inaccessible in case of missing config/verification errors.
- `Fail closed` should remain enabled under Cloudflare Pages Runtime.

MARK08 is a diagnostic release only; no public UX or private customer features were changed.
