# 904° MARK11 — Showroom decluttering

Based on MARK10. The following presentation changes were requested:

- Preserve the 16.8 Million Colors hero, spectrum and CMYK / RGB / HEX / Pantone® C explanation.
- Remove the entire interactive Live Color Studio, including palette fields, presets, and preview.
- Remove the “Find Your Starting Point” heading and explanatory copy. Replace with “THE DESIGNS.”
- Remove all visible feature tags, tag filters, and badges from design cards. Metadata tags remain in the catalog JSON for future internal indexing; no feature tag controls are rendered.
- Keep minimal search, category and sort controls, Showroom cards, favorite shortlist and inquiry form.
- Preserve existing pages, Storefront 001, and Cloudflare Access security functions and routing from MARK10.
- Update Showroom JS/CSS cache keys to v=11.

## Test

Run `py -m http.server 8080` from 904degrees.com and open `http://localhost:8080/showroom/`. Confirm the color hero leads directly into the collection, no palette selectors or tag pills exist, search/sort work, and Storefront 001 opens.

The local Python server does not enforce Cloudflare Access. Verify protected endpoints after deploying Cloudflare Pages functions. Do not deploy without verifying the unified access policies and environment variables remain correct.
