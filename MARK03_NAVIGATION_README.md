# MARK03 navigation and showroom update

- Homepage degree dropdown now includes The Nondescript Door; the existing joke link and Activated Handyman Services remain.
- Footer degree symbol remains beside the email, copyright underneath.
- Portal-area header navigation displays Portal and Admin only.
- Customer Hub and Showroom links are intentionally NOT exposed as authenticated header items until backend sign-in and server-verified permissions exist. The Portal landing page still provides local preview access to both.
- All public showroom pricing and Design #001 price cards are removed. Pricing is reserved for emailed quotes/letterhead.
- This is a static front-end test build. Admin and Customer pages are public informational placeholders, NOT secured private portals. Do not place customer data in them.
- Test with `py -m http.server 8080` from the website root.
