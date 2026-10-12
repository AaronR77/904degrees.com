# 904° MARK07 — Protected Portal Logout & Session Timers

**This is the complete MARK06 + MARK07 website**, not a stand-alone patch.
MARK07 preserves the Nondescript Door cinematic, public Portal, Showroom,
existing demo and related files. No Cloudflare Pages settings are embedded.

## New behavior

- The homepage contact email is now **lime green at the bottom-right**; copyright remains at the bottom-left beside the existing degree dropdown. The homepage CSS version is bumped to avoid stale Firefox styles.

- Protected **Admin** and **Customer** headers each have a visible, mobile-friendly **Log Out** button.
- Clicking **Log Out** navigates to Cloudflare's documented application-domain endpoint:
  `/cdn-cgi/access/logout` (works on apex and `www` domains; no front-end-only fake logout).
- Pages middleware validates signed Access JWTs and exposes only the verified session deadline
  at `/api/admin/session` or `/api/customer/session`, under the already-protected paths.
- Browser auto-logout checks that deadline while the page is open, including after tab wake-up.
- The server-side session deadline is bounded by the signed token's own expiry and, where an
  `iat` claim is present, by 6h Admin / 24h Customer from token issuance.
- All other private routes remain protected by signed-token verification and exact allowlists.

## IMPORTANT: Set the two different Cloudflare session durations

Zero Trust > Access controls > Applications > choose application > Details:

- `904° Admin Portal` — **6 hours**.
- `904° Customer Hub` — **24 hours**.

For both Access policies, leave policy session duration **Same as application session duration**
(or explicitly set the matching duration). An explicit policy duration overrides application
session duration. If the same user accesses both apps, manual Cloudflare logout can log them
out of both. Cloudflare may silently renew an application token if its **global SSO** session
remains active. If you require a new email PIN after six hours for Admin, also review the
**global session duration** under Zero Trust > Access controls > Access settings.
A six-hour global SSO session does **not** shorten an already-issued 24-hour Customer
application token; it affects subsequent SSO reauthentication.

## Deployment

Deploy with GitHub-linked Cloudflare Pages (or Wrangler), preserving the `functions` folder,
`_routes.json`, and the existing five production variables:

- `ACCESS_TEAM_DOMAIN`
- `ACCESS_ADMIN_AUD`, `ACCESS_ADMIN_EMAILS`
- `ACCESS_CUSTOMER_AUD`, `ACCESS_CUSTOMER_EMAILS`

Also retain the Cloudflare Pages **Fail closed** setting. Your Access applications must cover
both apex and www hostnames and the `/admin`, `/customer`, `/api/admin`, `/api/customer`
paths. Before storing customer information, add per-customer/tenant server authorization.

## Test after deployed

1. Open `/admin/` via a **fresh private window** on the *real* Cloudflare domain. Authenticate.
2. Confirm header displays **Log Out**. Click it; expect Cloudflare logout, not the Admin page.
3. Revisit `/admin/` in a new tab; verify Access requires an authorized session.
4. Repeat for `/customer/`, including mobile width.
5. Verify `/api/admin/session` and `/api/customer/session` require Access and cannot be read
   by unauthorized visitors. Signed token expiry comes only from Pages middleware.
6. Confirm Admin app = **6h** and Customer app = **24h** in Cloudflare (they were previously 24h).
7. Check `/portal/`, `/showroom/`, `/nondescript/` remain public.
8. Access JWTs may be revoked after a short propagation delay; a logout should not be
   considered a substitute for revoking users who should permanently lose access.

**Local note:** `py -m http.server 8080` serves HTML but does not run Cloudflare
Access or Pages Functions. The button will render locally, but its real logout behavior
and automatic expiry require the deployed Pages Function + Access. Do not regard local
static-server behavior as a security test.
