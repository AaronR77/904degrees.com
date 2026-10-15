import {authorizedAccount,readJson,clean,bad,respond,fail} from './core.js';
const allowedServices=new Set(['new_website','redesign','content_editor','additional_work','other']);
export async function createOrder(context,role){
  try {
    const gate=await authorizedAccount(context,role);if(gate.error)return gate.error;
    const {db,account}=gate;
    const data=await readJson(context);
    const project=clean(data.projectName,120), description=clean(data.description,3000);
    const organization=clean(data.organization,150),timeline=clean(data.desiredTimeline,140);
    const service=clean(data.service,30);
    const designId=clean(data.designId||'',70)||null;
    if(!project || description.length<20 || !allowedServices.has(service))return fail(400,'invalid_order','Provide a project name, service, and at least 20 characters of requirements.');
    if(designId && designId!=='storefront-001')return fail(400,'unknown_design','That design is not available for orders yet. Choose Custom/Unspecified.');
    const recent=await db.prepare("SELECT COUNT(*) AS n FROM orders WHERE account_id = ? AND created_at >= datetime('now','-1 day')").bind(account.id).first();
    if(Number(recent?.n||0)>=5)return fail(429,'order_limit','You have submitted several requests today. Please contact 904° for additional assistance.');
    const id=crypto.randomUUID();
    const ref='904-'+id.slice(0,8).toUpperCase();
    await db.batch([
      db.prepare('INSERT INTO orders (id,public_ref,account_id,design_id,service,project_name,organization,description,desired_timeline) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,ref,account.id,designId,service,project,organization,description,timeline),
      db.prepare('INSERT INTO order_history (order_id,actor_account_id,action,new_status) VALUES (?,?,?,?)').bind(id,account.id,'submitted','submitted'),
    ]);
    return respond({ok:true,order:{id,reference:ref,status:'submitted',projectName:project}},201);
  }catch(error){return bad(error);}
}
export async function listOwnOrders(context){
  try {
    const gate=await authorizedAccount(context,'customer');if(gate.error)return gate.error;
    const {db,account}=gate;
    const items=await db.prepare('SELECT id,public_ref,design_id,service,project_name,organization,description,desired_timeline,status,admin_note,created_at,updated_at FROM orders WHERE account_id=? ORDER BY created_at DESC LIMIT 100').bind(account.id).all();
    return respond({ok:true,orders:items.results||[]});
  }catch(error){return bad(error);}
}
