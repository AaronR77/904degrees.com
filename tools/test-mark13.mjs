/* Run: node tools/test-mark13.mjs. Uses Node 22's in-memory SQLite; no network, no credentials. */
import {DatabaseSync} from 'node:sqlite';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {webcrypto} from 'node:crypto';
import {onRequestPost as bootstrap} from '../functions/api/admin/bootstrap.js';
import {onRequestPost as invite,onRequestGet as listAccounts} from '../functions/api/admin/accounts.js';
import {onRequestPatch as patchAccount} from '../functions/api/admin/accounts/[id].js';
import {onRequestPost as createProspectOrder} from '../functions/api/showroom/orders.js';
import {onRequestGet as meProspect} from '../functions/api/showroom/me.js';
import {onRequestPost as createCustomerOrder,onRequestGet as myOrders} from '../functions/api/customer/orders.js';
import {onRequestGet as ordersAdmin} from '../functions/api/admin/orders.js';
import {onRequestPatch as patchOrder} from '../functions/api/admin/orders/[id].js';
import {onRequest as middleware} from '../functions/_middleware.js';
let checks=0;
function check(condition,message){assert.ok(condition,message);checks++;}
const sqlite=new DatabaseSync(':memory:');
sqlite.exec(readFileSync(new URL('../database/MARK13_accounts_orders.sql',import.meta.url),'utf8'));
const DB={
 prepare(sql){const stmt=sqlite.prepare(sql);let params=[];return {
  bind(...values){params=values;return this;},
  async first(){return stmt.get(...params)||null;},
  async all(){return {results:stmt.all(...params)};},
  async run(){return {meta:{changes:stmt.run(...params).changes}};},
 };},
 async batch(queries){sqlite.exec('BEGIN');try{const results=[];for(const q of queries)results.push(await q.run());sqlite.exec('COMMIT');return results;}catch(e){sqlite.exec('ROLLBACK');throw e;}}
};
const env={ACCOUNTS_DB:DB,ACCESS_OWNER_EMAIL:'owner@example.com',ACCESS_TEAM_DOMAIN:'https://sample.cloudflareaccess.com', ACCESS_ADMIN_AUD:'admin-unique-aud', ACCESS_CUSTOMER_AUD:'cust-unique-aud', ACCESS_SHOWROOM_AUD:'show-unique-aud', ACCESS_ADMIN_EMAILS:'owner@example.com,backup@example.com',ACCESS_CUSTOMER_EMAILS:'one@example.com,two@example.com,owner@example.com',ACCESS_SHOWROOM_EMAILS:'one@example.com,two@example.com,owner@example.com'};
function ctx({path='/api/admin/accounts',email='owner@example.com',area='ADMIN',method='GET',payload,origin='https://904degrees.com',id}={}){
 const headers={'accept':'application/json'};
 if(payload!==undefined){headers['Content-Type']='application/json';headers['Origin']=origin;}
 return {request:new Request('https://904degrees.com'+path,{method,headers,body:payload===undefined?undefined:JSON.stringify(payload)}),env,params:id?{id}:{},data:{accessIdentity:{email,area}},next:async()=>new Response('next')};
}
async function body(result){return result.json();}
async function expectStatus(result,status){check(result.status===status,'wanted '+status+', got '+result.status+' / '+await result.clone().text());}
const ownerCtx=ctx({path:'/api/admin/bootstrap',method:'POST',payload:{}});
await expectStatus(await bootstrap(ctx({path:'/api/admin/bootstrap',email:'other@example.com',method:'POST',payload:{}})),403);
await expectStatus(await bootstrap(ownerCtx),200);
const ownerId=(await DB.prepare("SELECT id FROM accounts WHERE is_owner=1").first()).id;
check(!!ownerId,'owner seeded');
await expectStatus(await bootstrap(ctx({path:'/api/admin/bootstrap',method:'POST',payload:{}})),200);
await expectStatus(await invite(ctx({method:'POST',payload:{email:'one@example.com',name:'One',organization:'Co One'}})),201);
await expectStatus(await invite(ctx({method:'POST',payload:{email:'two@example.com',name:'Two',isCustomer:true}})),201);
await expectStatus(await invite(ctx({method:'POST',payload:{email:'one@example.com'}})),409);
const accounts=(await body(await listAccounts(ctx()))).accounts;
check(accounts.length===3,'two invitations and owner');
const one=accounts.find(a=>a.email==='one@example.com'),two=accounts.find(a=>a.email==='two@example.com');
check(one.roles.prospect&&!one.roles.customer,'invitation automatically sets prospect');
check(two.roles.customer,'customer invitation flag');
const badAdminInvite=await invite(ctx({email:'two@example.com',method:'POST',payload:{email:'bad@example.com',isAdmin:true}}));
await expectStatus(badAdminInvite,403);
await expectStatus(await patchAccount(ctx({method:'PATCH',id:ownerId,payload:{status:'suspended'}})),403);
await expectStatus(await meProspect(ctx({path:'/api/showroom/me',email:'one@example.com',area:'SHOWROOM'})),200);
const active=await DB.prepare('SELECT status FROM accounts WHERE id=?').bind(one.id).first();check(active.status==='active','first verified login activates invited account');
const orderPayload={projectName:'New storefront',description:'Need a responsive catalog with easy updates, contact details and custom branding.',service:'new_website',organization:'Co One',designId:'storefront-001'};
let res=await createProspectOrder(ctx({path:'/api/showroom/orders',email:'one@example.com',area:'SHOWROOM',method:'POST',payload:orderPayload}));
await expectStatus(res,201);const created=await body(res.clone());check(!!created.order.reference,'order ID returned');
await expectStatus(await createProspectOrder(ctx({path:'/api/showroom/orders',email:'one@example.com',area:'SHOWROOM',method:'POST',payload:{...orderPayload,designId:'nonexistent'}})),400);
await expectStatus(await createProspectOrder(ctx({path:'/api/showroom/orders',email:'one@example.com',area:'SHOWROOM',method:'POST',origin:'https://evil.example.com',payload:orderPayload})),403);
await expectStatus(await createCustomerOrder(ctx({path:'/api/customer/orders',email:'one@example.com',area:'CUSTOMER',method:'POST',payload:orderPayload})),403);
await expectStatus(await createCustomerOrder(ctx({path:'/api/customer/orders',email:'two@example.com',area:'CUSTOMER',method:'POST',payload:orderPayload})),201);
const twoOrders=(await body(await myOrders(ctx({path:'/api/customer/orders',email:'two@example.com',area:'CUSTOMER'})))).orders;
check(twoOrders.length===1,'customer sees own one order');
const allOrders=(await body(await ordersAdmin(ctx({path:'/api/admin/orders'})))).orders;
check(allOrders.length===2,'admin sees both orders');
res=await patchOrder(ctx({path:'/api/admin/orders/'+created.order.id,id:created.order.id,method:'PATCH',payload:{status:'reviewing',note:'Discuss site map.'}}));
await expectStatus(res,200);
let history=await DB.prepare('SELECT * FROM order_history WHERE order_id=? ORDER BY id').bind(created.order.id).all();
check(history.results.length===2&&history.results[1].new_status==='reviewing','order history recorded');
res=await patchAccount(ctx({path:'/api/admin/accounts/'+one.id,id:one.id,method:'PATCH',payload:{isCustomer:true}}));
await expectStatus(res,200);
const updated=(await body(res.clone())).account;check(updated.roles.customer,'admin can promote prospect to customer');
const statuses=await DB.prepare('SELECT id,status FROM accounts').all();check(statuses.results.length===3,'no unexpected accounts');
// Test actual signed Access JWT middleware using mocked public certificates.
const pair=await webcrypto.subtle.generateKey({name:'RSASSA-PKCS1-v1_5',modulusLength:2048,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},true,['sign','verify']);
const jwk=await webcrypto.subtle.exportKey('jwk',pair.publicKey);
Object.assign(jwk,{kid:'mark13-test-key',alg:'RS256',use:'sig'});
const oldFetch=globalThis.fetch;
globalThis.fetch=async()=>new Response(JSON.stringify({keys:[jwk]}),{status:200,headers:{'Content-Type':'application/json'}});
function b64(a){return Buffer.from(a).toString('base64url');}
async function jwt(email='one@example.com',aud='show-unique-aud',bad=false){
 const header=b64(JSON.stringify({alg:'RS256',kid:'mark13-test-key',typ:'JWT'}));
 const payload=b64(JSON.stringify({iss:env.ACCESS_TEAM_DOMAIN,aud:[aud],email,iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600}));
 const sign=await webcrypto.subtle.sign('RSASSA-PKCS1-v1_5',pair.privateKey,new TextEncoder().encode(header+'.'+payload));
 return header+'.'+payload+'.'+(bad?'AAA':b64(sign));
}
async function passMiddleware(path,email,aud,bad=false){
 const request=new Request('https://904degrees.com'+path,{headers:{'Cf-Access-Jwt-Assertion':await jwt(email,aud,bad)}});
 const context={request,env:{...env,ACCOUNTS_REQUIRE_RECORD:'1'},data:{},next:async()=>new Response('allowed',{status:200})};
 const response=await middleware(context);return {response,context};
}
let mw=await passMiddleware('/showroom/','one@example.com','show-unique-aud');await expectStatus(mw.response,200);check(mw.context.data.accessIdentity.email==='one@example.com','middleware verified email supplied to handlers');
mw=await passMiddleware('/showroom/','two@example.com','admin-unique-aud');await expectStatus(mw.response,403);
mw=await passMiddleware('/showroom/','one@example.com','show-unique-aud',true);await expectStatus(mw.response,403);
mw=await passMiddleware('/admin/','one@example.com','admin-unique-aud');await expectStatus(mw.response,403);
mw=await passMiddleware('/customer/','one@example.com','cust-unique-aud');await expectStatus(mw.response,200);
mw=await passMiddleware('/showroom/','uninvited@example.com','show-unique-aud');await expectStatus(mw.response,403);
globalThis.fetch=oldFetch;
console.log(`MARK13 PASS: ${checks} assertions; actual signed JWT, route permissions, scoped orders, admin roles, order-history, CSRF tests.`);
