# 904° MARK13.1 — Login Time Remaining

This patch adds a real, updating `H:MM:SS Login Time Remaining` countdown to the protected Admin Portal, Customer Hub, Showroom, and Storefront 001 design detail view.

- The countdown is **not** a new client-side session. The `portal-session.js` script fetches the verified expiration from existing protected `/api/admin/session`, `/api/customer/session`, or `/showroom/session` endpoints. The Pages Functions middleware continues checking Cloudflare Access JWT signature, email, audience, and expiration on each request.
- The page refreshes the display every second, rechecks when a backgrounded tab comes into focus, and redirects to the Cloudflare logout endpoint on session expiry. No session duration or Cloudflare settings were changed.
- A fresh browser page session begins by displaying `Checking login time…` until the protected endpoint responds. Network errors display `Login time unavailable` rather than inventing time. Local static-server preview cannot report real signed-session time.
- Admin remains capped at 6 hours, Customer and Showroom at 24 hours by existing middleware; earlier expiry in Cloudflare Access still wins.
- Showroom live-demo merchant pages are untouched to preserve the original demo's storefront look; the 904° design detail view has the timer.
- This is a UI/clock patch; it does not implement automatic invitations, new registrations, or email delivery. Do not deploy the existing MARK13 accounts/orders system to live customers until the registration flow is implemented and tested.

## Database filename

The original MARK13 schema filename is normalized in this package to `database/accounts_orders.sql`, matching the filename confirmed in the current 904° D1 install. **The schema is unchanged and does not need to be executed again.**

## Local checks

Use the JS syntax validator (`node --check portal/assets/portal-session.js`), and verify the countdown with a properly configured Cloudflare Pages preview of the protected site. Opening under `py -m http.server` cannot reach the protected Cloudflare session endpoint.
