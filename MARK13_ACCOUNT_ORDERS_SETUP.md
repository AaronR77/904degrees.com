# 904° MARK13 — Invitation Accounts & Website Orders

**Release type:** Backend-ready deployment package. Not live until D1, Cloudflare Access routes, and Cloudflare Pages bindings are configured and verified.

## What is implemented

- Verified identity from the existing Cloudflare Access JWT; no passwords or self-registration forms.
- Owner-only initialization and protected invitation/account creation from Admin.
- Role flags `is_prospect`, `is_customer`, and `is_admin`; one owner protected by database uniqueness.
- Every invited account automatically starts as a prospect; an Admin can assign the Customer role. Only the Owner can grant Admin.
- Manual approval: the invitation is an Admin-created account record. **No invitation email is automatically sent**. An Admin must add the address to matching Cloudflare Access policy and Pages email allowlists, then share the private entry URL.
- After Cloudflare authenticates the invited email, first server request activates the invited D1 account.
- Account-linked real orders via Showroom (prospects/customers) and Customer Hub (customers). Requirements and selected design are stored in D1, not sent to the browser's email app.
- Customer-specific order history; Admin order review/status/notes. Notes are visible to the ordering customer, so do not enter private internal remarks there.
- Database audit records for invitations, permission changes and order updates. D1 trigger writes order update history atomically.
- No payment capture, invoice generation, email sending, file uploads, or automatic proposals. Pricing and invoicing follow your manual scope review.

## Critical deployment precautions

- Keep the currently working Admin/Customer/Showroom Access applications and their JWT middleware enabled. **Do not remove these restrictions.**
- **Never run this against the First New Zion or BulletinSync D1 database.** Create a dedicated 904° business accounts database.
- Cloudflare Pages's `py -m http.server` only serves static files; it **cannot run Functions or D1**. Use Cloudflare Pages preview with the configured binding, or Wrangler Pages Dev with local D1, for functional ordering tests.
- An Admin/Customer/Showroom HTML page loading does NOT prove the API is configured. The submit button remains disabled until a verified D1-backed account check succeeds.
- After deployment test everything at both `904degrees.com` and `www.904degrees.com`, and the preview Pages domain. Do not enter real customer data until verified.

## 1. Create and migrate the D1 database

Cloudflare → Workers & Pages → D1 SQL Database → Create database, e.g. **`904_accounts`**.

Apply `database/accounts_orders.sql` using the SQL Console or Windows shell with Wrangler (logged into the correct Cloudflare account):

```powershell
npx.cmd wrangler d1 execute 904_accounts --remote --file=database/accounts_orders.sql
```

Run once before using MARK13. The SQL uses `IF NOT EXISTS` where supported, but test migrations on staging before applying to existing data.

## 2. Bind D1 to the 904degrees.com Pages project

Cloudflare → Workers & Pages → **904degrees.com → Settings → Bindings → Add → D1 database**.

| Setting | Value |
|---|---|
| Type | D1 database |
| Variable name | `ACCOUNTS_DB` |
| Database | `904_accounts` (the dedicated database above) |
| Environment | Production (configure Preview separately for staging) |

Bindings are available as `context.env.ACCOUNTS_DB` to Pages Functions. Redeploy for a new binding to take effect. [Cloudflare D1 / Pages documentation](https://developers.cloudflare.com/pages/functions/bindings/).

## 3. Add the Owner bootstrap setting

Pages → Settings → Variables and Secrets → Production → Add:

- Name: `ACCESS_OWNER_EMAIL`
- Type: Text
- Value: The **exact verified email** of the primary 904° Owner in the existing Admin Access Allow policy (e.g. the 904° business mailbox, **not** the backup unless that's your intended Owner identity).

Keep `ACCOUNTS_REQUIRE_RECORD` **unset** initially. Admin, Customer, and Showroom continue using the current Cloudflare Access allowlists; all new MARK13 account/order API operations *still* require a D1 record and role.

After deploying and binding D1, sign in to Admin as `ACCESS_OWNER_EMAIL`. Press **INITIALIZE OWNER ACCOUNT** exactly once. The call requires a verified Admin JWT and matching owner email. If it fails, don't disable Access to get around it; inspect Pages Functions logs.

To use your existing backup administrator email, create a second account for that address using **Invite an account**, enable **Admin privilege**, and maintain its existing Access policy/email allowlist membership.

## 4. Confirm Cloudflare Access paths

The existing Access destinations for Admin and Customer must remain. Also protect the API endpoints at BOTH apex and www:

**Admin application:**
- `904degrees.com/admin` and `www.904degrees.com/admin`
- `904degrees.com/api/admin` and `www.904degrees.com/api/admin`

**Customer application:**
- `904degrees.com/customer` and `www.904degrees.com/customer`
- `904degrees.com/api/customer` and `www.904degrees.com/api/customer`

**Showroom application** (same Showroom audience and approved invited emails):
- `904degrees.com/showroom` and `www.904degrees.com/showroom`
- `904degrees.com/api/showroom` and `www.904degrees.com/api/showroom` **NEW**

The new `/api/showroom` destinations are required: without them the order API may not receive `Cf-Access-Jwt-Assertion`. Don't add these to the Admin application; use the SAME Access application/AUD as the Showroom.

Keep existing Production variables:

- `ACCESS_TEAM_DOMAIN`
- `ACCESS_ADMIN_AUD` and `ACCESS_ADMIN_EMAILS`
- `ACCESS_CUSTOMER_AUD` and `ACCESS_CUSTOMER_EMAILS`
- `ACCESS_SHOWROOM_AUD` and `ACCESS_SHOWROOM_EMAILS`

Ensure the Audience Tags match their respective Access applications.

## 5. Invite a prospect or customer (manual in MARK13)

1. As Owner or Admin, open `/admin/` and fill **Invite an account**. The server stores the invitation with Prospect role; optionally tick Customer. Tick Admin only if logged in as the Owner.
2. Add that **exact email** to the relevant Cloudflare Access app **Allow → Emails** list and its Pages `ACCESS_*_EMAILS` CSV variable. Showroom for prospects; Showroom + Customer for customers; Admin only for authorized staff.
3. Save variables and redeploy as required by your Pages environment.
4. Personally send the invited visitor the private `/showroom/` (prospect) or `/customer/` (customer) URL. There is no automated email in this release.
5. The visitor logs in using Cloudflare's emailed one-time code. The backend matches the verified email to the D1 record and changes `invited` → `active` on first API access.
6. Check the Admin account list and submit a test order. Never use an uninvited address to test order creation on Production.

**Future unified login:** Both roles currently share a D1 account identity but still use their existing Cloudflare Access application login gates. One sign-in entrance and automatic routing will be a separate, security-tested release. Do not loosen the current allow policies until that architecture is ready.

## 6. Optional: turn on database-backed page-level role enforcement

After the database is migrated, owner bootstrapped, all test accounts present, and Access destinations verified, add Production variable:

- `ACCOUNTS_REQUIRE_RECORD` = `1` (Text)

Redeploy and verify an uninvited authenticated email is rejected from the protected page **and** direct demo URLs. When not `1`, the existing Cloudflare Access + Pages email allowlist protections remain in place, while MARK13's **order/account API endpoints always require** an active, matching D1 role.

## 7. Test plan before launch

1. Log in as the Owner through Cloudflare and verify Admin account list loads; login as backup Admin after inviting it.
2. Prospect logs in and sees entire shared Showroom; submit a new website order, see a reference.
3. Customer logs in, sees only their own orders and can submit another.
4. Admin sees both orders and updates one to `reviewing`; confirm customer sees the update.
5. Uninvited email, prospect without Customer role, suspended account, forged JWT, missing D1 binding, invalid origin, and private Pages preview URLs must **not** yield customer data or permit order creation.
6. Confirm both manual Log Out and timed expiry still work (Admin 6h, Customer 24h).
7. Review D1 `order_history` and `account_history`; no direct payment system should exist.

## Local automated checks

Requires Node.js 22+ (the test uses its built-in in-memory SQLite):

```powershell
node tools/test-mark13.mjs
```

The test signs real RSA JWTs with temporary keys in memory, mocks the certificate endpoint, exercises route permissions and validates database order/role behavior without network access or credentials.

## Limitations and next steps

- No real email invitations or unified login yet. For low-volume, in-person invitations, authorizing approved addresses manually is the supported workflow.
- No backend admin Showroom catalog editor yet; the catalog still uses `/showroom/catalog/designs.json` and the form currently accepts Storefront 001 or an unspecified design. Additional designs will need catalog and server-side order validation updates.
- No pricing, deposits, invoices, transaction processing, order confirmation emails, proposals, or automated customer notification are included. Orders are saved and visible in Admin/Customer Hub; 904° reviews and responds manually.
- Cloudflare access permissions and D1 roles are both necessary; **neither one alone** grants access to private order APIs.
