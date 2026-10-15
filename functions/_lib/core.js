/* MARK13: shared database, validation and response utilities. Never trust identity fields from JSON. */
const noStore = {'Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff'};
export function respond(data, status=200) { return new Response(JSON.stringify(data),{status,headers:{...noStore,'Content-Type':'application/json; charset=utf-8'}}); }
export function fail(status, code, message) { return respond({ok:false,code,message}, status); }
export function dbOf(context) {
  const db=context.env?.ACCOUNTS_DB;
  if (!db || typeof db.prepare!=='function') return null;
  return db;
}
export async function readJson(context, max=12000) {
  const request=context.request;
  const origin=request.headers.get('origin');
  // Modern same-origin fetch() POST/PATCH supplies Origin. Explicitly reject unverified cross-origin writes.
  if (!origin || origin!==new URL(request.url).origin) throw Object.assign(new Error('The request origin is not permitted.'),{status:403,code:'origin_denied'});
  if (!/^application\/json(?:\s*;|\s*$)/i.test(request.headers.get('content-type')||'')) throw Object.assign(new Error('Send JSON.'),{status:415,code:'json_required'});
  if (Number(request.headers.get('content-length')||0)>max) throw Object.assign(new Error('Request is too large.'),{status:413,code:'too_large'});
  const raw=await request.text();
  if (raw.length>max) throw Object.assign(new Error('Request is too large.'),{status:413,code:'too_large'});
  let body; try {body=JSON.parse(raw);} catch {throw Object.assign(new Error('Invalid JSON.'),{status:400,code:'invalid_json'});}
  if (!body || typeof body!=='object' || Array.isArray(body)) throw Object.assign(new Error('Expected a JSON object.'),{status:400,code:'invalid_body'});
  return body;
}
export function str(value,max=500){return typeof value==='string' ? value.trim().slice(0,max+1):'';}
export function clean(value,max=500){const valueStr=str(value,max);if(valueStr.length>max)throw Object.assign(new Error(`Text must be ${max} characters or fewer.`),{status:400,code:'field_too_long'});return valueStr;}
export function bad(error) { if(error?.status) return fail(error.status,error.code||'invalid_request',error.message); console.error('904_MARK13_API_ERROR',error?.name||'unknown');return fail(503,'service_unavailable','This feature is temporarily unavailable. Try again later.'); }
export async function accountFor(db,email){return db.prepare('SELECT * FROM accounts WHERE email = ? COLLATE NOCASE LIMIT 1').bind(email).first();}
export function principal(context){return context.data?.accessIdentity || null;}
export async function authorizedAccount(context,role){
  const db=dbOf(context),identity=principal(context);
  if(!db) return {error:fail(503,'accounts_not_configured','Account services have not been activated yet.')};
  if(!identity?.email) return {error:fail(403,'not_authenticated','Approved Cloudflare Access sign-in is required.')};
  const account=await accountFor(db,identity.email);
  if(!account || account.status==='suspended')return {error:fail(403,'not_invited','This account has not been invited or is disabled.')};
  if(account.status==='invited'){
    await db.prepare("UPDATE accounts SET status = 'active', updated_at=datetime('now') WHERE id = ? AND status = 'invited'").bind(account.id).run();
    account.status='active';
  }
  if(role==='admin' && !account.is_admin) return {error:fail(403,'admin_required','Administrative access required.')};
  if(role==='customer' && !(account.is_customer||account.is_admin))return {error:fail(403,'customer_required','A customer account is required.')};
  if(role==='showroom' && !(account.is_prospect||account.is_customer||account.is_admin))return {error:fail(403,'prospect_required','An invitation is required.')};
  return {db,account};
}
export function publicAccount(a){return {id:a.id,email:a.email,name:a.display_name,organization:a.organization,status:a.status,roles:{prospect:!!a.is_prospect,customer:!!a.is_customer,admin:!!a.is_admin,owner:!!a.is_owner}};}
export function validEmail(email){return /^[^\s@<>]{1,64}@[^\s@<>]{1,190}\.[^\s@<>]{2,}$/.test(email);}
export function bool(value){return value===true?1:0;}
