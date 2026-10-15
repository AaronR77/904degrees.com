# 904° MARK10 — Showroom & Live Color Studio

## What's included

- Showroom main floor leads with **16.8 MILLION COLORS**, **CMYK / RGB / HEX / Pantone® C**, and "904° Style" messaging.
- Live Color Studio with primary, secondary and accent colors, optional tertiary, native color pickers, editable HEX values, editable RGB channel numbers, approximate CMYK, optional Pantone® C reference, palette presets, and a copy-palette control. This is **only a preview**; it does not change the real storefront or customer accounts.
- One shared data-driven catalog populated from `showroom/catalog/designs.json`: published designs only, search, category, multi-tag AND filters, sorting, shortlist, demo links, responsive preview.
- `Storefront 001` is relocated to `showroom/storefront-001/`, with design details at `showroom/storefront-001/design/`.
- Root `demo/` folder removed. `_redirects` moves old `/demo/liquorstore/*` and `/showroom/design-001/` URLs to the new protected destinations.
- Server-side Cloudflare Pages protection for **every URL under `/showroom/`**, including catalog JSON, demos, media, and detail pages. Existing Admin and Customer middleware remains.
- Visitors can prepare inquiry email messages. **This is not a server-side inquiry submission** and does not store anything in customer accounts yet.

## IMPORTANT — Configure Cloudflare Access BEFORE deploying to production

The new `/showroom/` Pages middleware is intentionally **fail closed**. It will return HTTP 403 until a Cloudflare Access app is configured to pass tokens and its production variables are set. It does **not** expose the showroom publicly while waiting for account work.

1. In Cloudflare Zero Trust > Access controls > Applications, create a new **self-hosted** application named **904° Showroom** with public hostnames:
   - `904degrees.com` path `showroom`
   - `www.904degrees.com` path `showroom`
2. Configure **One-time PIN**, and an **Allow** policy for explicitly invited addresses only (include your owner and any approved customer emails). Do not allow Everyone or an entire unrestricted domain. Set the application session duration to 24 hours.
3. Copy that new application's **Audience (AUD) Tag**. In Workers & Pages > 904degrees.com > Settings > Variables and Secrets > Production, add:
   - `ACCESS_SHOWROOM_AUD` = the Showroom app AUD Tag (Text or Secret)
   - `ACCESS_SHOWROOM_EMAILS` = comma-separated approved verified email addresses (Text or Secret)
4. **Keep the existing** `ACCESS_TEAM_DOMAIN`, `ACCESS_ADMIN_AUD`, `ACCESS_ADMIN_EMAILS`, `ACCESS_CUSTOMER_AUD`, and `ACCESS_CUSTOMER_EMAILS` intact. Keep Pages Functions in **Fail closed** mode.
5. Deploy AFTER saving the new production variables. Make sure `_routes.json`, `_headers`, `_redirects`, and the entire `functions/` folder are included in the published output.
6. Test in clean private sessions:
   - Uninvited email: `/showroom/`, `/showroom/storefront-001/`, `/showroom/catalog/designs.json`, and `/showroom/storefront-001/content/catalog.json` must remain inaccessible.
   - Invited email: reach the Showroom, Storefront 001 and every category page.
   - Admin and Customer: confirm both existing routes still respect their six-hour and 24-hour application sessions respectively.
   - `904degrees-com.pages.dev/showroom/` must fail closed without a valid signed Access token; do not assume Access redirects protect pages.dev.
   - Old URLs redirect into the protected Showroom, not to public files.

**This is an intermediate security gate, not the final unified-login/account-flag system.** The desired single login with `is_admin`, `is_customer`, and `is_prospect` in server-side D1, invitation acceptance, Admin catalog publishing UI, and customer-account-linked inquiries still require future backend implementation and integration. Do not represent them as live.

## Local test

Extract this ZIP into the website repo preserving its `.git` directory. From the directory containing `index.html`:

```powershell
py -m http.server 8080
```

Open `http://localhost:8080/showroom/`, click presets, type a HEX color or RGB channels, enable/disable tertiary, and try the tags/search. Open Storefront 001 and test departments, categories, search and age acknowledgment.

**Local Python's HTTP server does not enforce Cloudflare Access or Pages Functions.** Browser-level local access is for layout/function tests only; never use it as proof of live authorization.

Validate design metadata:

```powershell
node tools/validate-showroom.mjs
```

## Add another design

1. Create a new folder under `showroom/`, such as `storefront-002/` (or another family like `church-001/`). Include its own site and assets.
2. Add a unique design record to `showroom/catalog/designs.json` with `id`, `number`, `name`, `subtitle`, `description`, `category`, `demoPath`, `detailPath`, `tags`, `featured`, `order`, `updated`, and `published`.
3. Use existing tag vocabulary in `tagGroups`. Expand `tagGroups` when a genuinely new capability is introduced. Do not apply "Shopping Cart" to a design with nonfunctional checkout.
4. Add an actual detail page at the supplied `detailPath`, run `node tools/validate-showroom.mjs`, test locally, then publish through the existing GitHub/Pages workflow.
5. A secure Admin catalog manager and CMS are planned after the unified account/role backend. Currently adding designs is a repository content update, **not** a live Admin publishing tool.

## Notes

- 16,777,216 colors describes 24-bit RGB; CMYK conversions displayed by the studio are only approximations. Pantone® C is a brand/reference input, **not** a computed match or an official licensed Pantone lookup.
- The Nondescript Door remains the existing MARK09 animation in this package. Its newly discussed silent green-screen/boot/login redesign is **a separate future implementation**; MARK10 does not claim to replace the functioning authentication system.
- Logout remains `/cdn-cgi/access/logout`, using the same Cloudflare Access session infrastructure.
- Browser session shortlists and color previews do not grant permissions or change backend records.
