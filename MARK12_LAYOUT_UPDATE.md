# MARK12 — Showroom layout polish

Baseline: MARK11. No changes to the authentication middleware, Cloudflare Access configuration, or admin/customer pages.

## Adjustments

- The Showroom **Your Shortlist** corner watermark now uses `/assets/904_Logo_Lime.png` as a CSS alpha mask, producing a muted single-color rendering of the *official* master logo. The original image asset is untouched. No hard-coded `904°` text watermark remains.
- The Showroom search field, Category selector and Sort selector now share a bottom-aligned grid row. Their input/select controls are all exactly 52px tall on desktop. Existing responsive wrapping remains for tablet/phone widths.
- The HTML and JS/CSS asset reference is versioned to `?v=12` to avoid Firefox cached CSS.

## Test

Run `py -m http.server 8080` from the `904degrees.com` directory, then visit `http://localhost:8080/showroom/` and scroll to the catalog and the Your Shortlist panel.

The local Python server previews static pages only: it **does not run Cloudflare Pages Functions** and therefore cannot exercise server-side Access controls. Test the Access gates separately after deployment.

## Next development phase (not implemented in MARK12)

Unified invitation-based user accounts, D1 role flags (`is_admin`, `is_customer`, `is_prospect`), account-linked project requests, customer order intake, and a server-side quote/approval workflow. Cloudflare Access remains authoritative for authentication; user roles and order ownership must be enforced server-side.
