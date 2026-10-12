# 904° — MARK06 Portal Security (Cloudflare Pages + Access)

**Status:** Code is staged and locally tested. **It is NOT authenticated just because you unzip it.** Production security requires configuring Cloudflare Access and Cloudflare Pages environment variables. Do not turn on private data features until production access tests pass.

## What changed from MARK05

- Added `functions/_middleware.js` with server-side JWT signature validation, issuer and audience checks, expiration checks, and exact email allowlists.
- Added `_routes.json` so protected paths execute through Pages Functions instead of being served as unguarded static files.
- Added `_headers` with safe security headers and no-store/noindex for protected paths.
- Updated the public `/portal/` wording and links for protected destinations.
- Preserved the homepage, cinematic Nondescript Door, Design Showroom, demos, and unrelated First New Zion paths.
- Protects `/admin`, `/admin/*`, `/customer`, `/customer/*`, `/api/admin/*`, and `/api/customer/*`.
- All other paths stay public, including `/portal/`, `/showroom/` and `/nondescript/`.

## Important limitation

This is **an access perimeter**, not the finished 904° multi-tenant customer portal. No customer-specific dashboard data, role management UI, billing, files, or project records are activated. Every future API method must validate both authentication and authorization (organization membership, permissions, object ownership) on the server. No credentials or customer records are present in this package.

## Cloudflare Access setup (do this BEFORE publishing MARK06)

1. Open Cloudflare dashboard > Zero Trust > **Integrations > Identity providers**. If **One-time PIN** is not configured, add it. This sends single-use login codes to approved email addresses; no separate authenticator app is required for this temporary gate. **An email PIN alone is not two-factor authentication.**
2. Go to **Access controls > Applications** and create a **self-hosted public application** named `904° Administration` on hostname `904degrees.com`. Configure path entries for `/admin`, `/admin/*`, and `/api/admin/*`. Set an **Allow** policy limited to the exact owner/staff email addresses you trust. Choose the One-time PIN login method. **Do not add Everyone, all Gmail users, or a wildcard email domain to the policy.**
3. Create a separate self-hosted public application named `904° Customer Hub` with paths `/customer`, `/customer/*`, and `/api/customer/*`. Allow ONLY specific approved customer emails. If there are no customers yet, leave customer emails unapproved and keep the Pages allowlist empty. You may optionally add your owner email to both lists solely for testing.
4. Locate **Application Audience (AUD) Tag** for each application in its Access settings. You'll need those two different values.
5. Find your Cloudflare Access team hostname, which looks like `https://YOUR-TEAM.cloudflareaccess.com`.
6. Go to Cloudflare dashboard > Workers & Pages > your **904degrees.com Pages project** > Settings > Variables and Secrets. Set these **production** text variables:

   | Variable | Value |
   |---|---|
   | `ACCESS_TEAM_DOMAIN` | `https://YOUR-TEAM.cloudflareaccess.com` (your actual team URL, no trailing path) |
   | `ACCESS_ADMIN_AUD` | Admin application's Audience tag |
   | `ACCESS_ADMIN_EMAILS` | Comma-separated **exact** approved admin email(s), e.g. `aaron@904degrees.com` only if that's your sign-in address |
   | `ACCESS_CUSTOMER_AUD` | Customer application's different Audience tag |
   | `ACCESS_CUSTOMER_EMAILS` | Comma-separated exact approved customer emails. Leave unset to deny everyone initially. |

   These variables are read **only by the Pages Function** and are not embedded into webpage JavaScript. They're configuration settings, not user passwords. Each Access policy still needs to allow the same sign-in address.

7. **Publish from the Git-linked project (or with Wrangler), not by dragging HTML files into Cloudflare Pages.** Pages Functions must be deployed with the `functions` folder and `_routes.json`. Use the existing `904degrees.com` repo root (folder containing `index.html`) as the Pages build output/root.
8. Cloudflare Pages must redeploy after variable changes. In GitHub Desktop, verify the changed files, commit, and push to the production branch linked to Pages. Wait for a successful deployment.

## Mandatory live tests — release is NOT approved until all pass

- Incognito: `/`, `/portal/`, `/showroom/`, `/nondescript/` load normally without sign-in.
- Incognito: `/admin/` prompts for Cloudflare Access authentication; an unapproved email is **denied**.
- Approved admin email receives a PIN and can open `/admin/`; opening `/customer/` still requires its own specific permissions.
- A random, unauthenticated direct URL such as `/admin/index.html` or `/api/admin/test` must not expose HTML or API content.
- `/customer/` must be unavailable to all except customer-approved addresses. If `ACCESS_CUSTOMER_EMAILS` is empty, it deliberately returns HTTP 403 for everybody, even if their identity is valid.
- Check your project's `*.pages.dev` production and preview URLs: protected paths must also return HTTP 403 without a correctly signed, correct-audience token. This protects against custom-domain Access bypass via alternate hostnames.
- Test on a phone and in Firefox. The Nondescript Door should run as before and redirect to `/portal/`.

### If `/admin/` returns 403 after you successfully signed in

Check that the Cloudflare Access application Audience tag matches `ACCESS_ADMIN_AUD`, the Pages `ACCESS_TEAM_DOMAIN` has the exact team URL, and `ACCESS_ADMIN_EMAILS` contains your actual authenticated email. Confirm that the Cloudflare Pages deployment includes `functions/_middleware.js` and `_routes.json`, and that Pages variables were deployed to **production**. Fail-closed HTTP 403 is expected until all configuration values are correct.

### If the login prompt doesn't appear at all

Access may not be configured for the hostname/path, or you may be using a `pages.dev` hostname. In both cases the Pages Function must **still deny** unauthorized protected requests. Do not proceed with private records until the Access login screen and token validation both pass on the real domain.

### Local tests

`py -m http.server 8080` serves only static files and **does not run Cloudflare Pages Functions**. Therefore `/admin/` and `/customer/` are not protected on localhost using that command. Only publish/test the perimeter on Cloudflare Pages (or its local Wrangler Pages development environment). Never consider a Python static server a test of live security.

## References

- Cloudflare Access apps: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/
- Access application paths: https://developers.cloudflare.com/cloudflare-one/access-controls/policies/app-paths/
- Email one-time PIN: https://developers.cloudflare.com/cloudflare-one/integrations/identity-providers/one-time-pin/
- Signed Access JWT validation: https://developers.cloudflare.com/cloudflare-one/access-controls/applications/http-apps/authorization-cookie/validating-json/
- Pages Functions middleware: https://developers.cloudflare.com/pages/functions/middleware/
- Pages Functions routing: https://developers.cloudflare.com/pages/functions/routing/
