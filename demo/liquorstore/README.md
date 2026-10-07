# Bottle & Barrel storefront

This is the first complete storefront under `/demo/liquorstore/`. It runs as a static website with its sample catalog in `content/catalog.json`; the shared editor will later replace that local content source with tenant-scoped data and upload handling.

## Pages

- `/demo/liquorstore/` — home, hero feature, department entry points, and featured products
- `/demo/liquorstore/wine/`
- `/demo/liquorstore/spirits/`
- `/demo/liquorstore/beer/`
- `/demo/liquorstore/gifts/`

Every page shares the sticky header, responsive search, department hamburger menu, age acknowledgement, product filters, price sorting, and common footer. The category URLs are separate HTML pages with the same product listing template. Product cards are capped at three columns on wide screens, two on standard tablet/mobile widths, and three on short landscape screens.

## Local preview

Serve the parent website directory so `/demo/...` absolute paths resolve. From the project root, a simple static preview is:

```sh
python -m http.server 8000 --directory public
```

Then open `http://localhost:8000/demo/liquorstore/`. The sample catalog is illustrative. No cart, checkout, or online ordering is included.

## Content contract for the future adaptive editor

- Store settings and every product field are listed in `editor-manifest.json`.
- Product rows have stable IDs and fields for category/subcategory, brand, size, description, cents-based price, availability, published state, display order, image path, and image alt text.
- Home features live in `content/hero-slides.json`. One slide is rendered as a static hero. Multiple slides reveal controls and rotate every seven seconds; reduced-motion settings disable automatic rotation.
- Put hero graphics in `images/rotators/`.
- Put product images in `images/catalog/wine/`, `images/catalog/spirits/`, `images/catalog/beer/`, or `images/catalog/gifts/`.
- Put non-product graphics in `images/decorative/`.

When the editor upload service is connected, it should use these same virtual collection paths in R2 object keys: `liquorstore/rotators/`, `liquorstore/catalog/<department>/`, and `liquorstore/decorative/`. Each upload should keep its destination collection, product/slide ID, and alt text in its media record.

## Reference notes

The shopping patterns are informed by Total Wine’s catalog pages: clear result counts and sort selection, a price min/max range with common price bands, and refinements such as product type, category, brand, and size. Bottle & Barrel uses its own layout, copy, color palette, and visual identity.
