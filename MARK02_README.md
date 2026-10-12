# 904° MARK02 — Portal front-end integration

## Included
- Original homepage preserved, with top-right Customer Portal link and fixed bottom-left glowing degree symbol/contact email/copyright.
- Existing Activated, First New Zion, and liquor-store demo files retained.
- `/portal/` shared entrance; `/showroom/` searchable design catalog; `/showroom/design-001/` live responsive iframe; `/customer/` and `/admin/` development landing pages; `/nondescript/` animated secret door.
- Showroom favorites use `sessionStorage` (tab-local). Inquiries open an email draft; the visitor must send it.

## Security and functionality boundaries
- **Not a production customer portal.** No user authentication, organization isolation, staff role enforcement, private files, billing, account invitations, or admin mutations are implemented.
- Do not add private customer records to these static pages or assume hiding links protects routes.
- A real production portal needs Workers/D1 server-side sessions, authorization checks on every protected request, R2 object access controls, Stripe backend/webhooks, email workflows, audit logging, and testing.
- The liquor-store demo is preserved unchanged. Its editor manifest is NOT a secure customer editor.
- The existing First New Zion site and its separate admin code are retained unchanged.

## Test locally
Run a local static HTTP server from the **repository root** (not from `/portal/`) so absolute URLs resolve:

```powershell
py -m http.server 8080
```

Open `http://localhost:8080/`, then check `/portal/`, `/showroom/`, `/showroom/design-001/`, `/customer/`, `/admin/`, `/nondescript/`, `/demo/liquorstore/`, `/activated/`, and `/firstnewzion/`.

## Deployment
- Create the MARK02 branch before copying.
- This archive intentionally excludes `.git` and backup `.bak-*` files; copy the **contents** of its `904degrees.com/` folder over the existing repository root without deleting `.git`.
- Commit and test on the branch before merging or deploying to production.
- Verify your Cloudflare Pages build/output configuration and any existing Workers routing before pushing.
