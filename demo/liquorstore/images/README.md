# Bottle & Barrel image organization

Keep storefront artwork separated by purpose:

- `rotators/` — homepage hero and seasonal feature graphics, such as `hero-01.webp`.
- `catalog/wine/`, `catalog/spirits/`, `catalog/beer/`, `catalog/gifts/` — product photos organized by department. Product records should retain an image key/path plus descriptive alt text.
- `decorative/` — non-product details such as section textures, small illustrations, and decorative accents.

The site reads hero slides from `../content/hero-slides.json`. Each slide has a stable `id`, eyebrow, title, text, caption, subcaption, optional image path, and alt text. One slide renders as a static hero; controls and timed rotation appear only when there are multiple slides. Uploaded hero graphics should map to `images/rotators/`; product photos to the matching `images/catalog/<department>/`; decorative uploads to `images/decorative/`.

For the later editor/R2 connection, retain the same virtual prefixes in media object keys: `liquorstore/rotators/`, `liquorstore/catalog/<department>/`, and `liquorstore/decorative/`. This lets managed uploads stay organized even when the assets live in R2 instead of the deployed static folder.
