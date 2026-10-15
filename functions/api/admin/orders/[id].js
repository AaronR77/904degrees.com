import {authorizedAccount,readJson,clean,respond,fail,bad} from '../../../_lib/core.js';
const statuses=new Set(['submitted','reviewing','needs_details','quoted','accepted','declined','cancelled']);
export async function onRequestPatch(context){
  try {const gate=await authorizedAccount(context,'admin');if(gate.error)return gate.error;
    const body=await readJson(context);const id=context.params.id;
    const old=await gate.db.prepare('SELECT id,status FROM orders WHERE id=? LIMIT 1').bind(id).first();
    if(!old)return fail(404,'order_not_found','Order not found.');
    const status=clean(body.status,30),note=clean(body.note??'',1500);
    if(!statuses.has(status))return fail(400,'invalid_status','Unknown order status.');
    // Avoid overwriting simultaneous changes by using an optimistic status condition.
    const result=await gate.db.prepare("UPDATE orders SET status=?,admin_note=?,last_actor_id=?,updated_at=datetime('now') WHERE id=? AND status=?").bind(status,note,gate.account.id,id,old.status).run();
    if(!result.meta?.changes)return fail(409,'order_changed','Order changed while being edited. Refresh and try again.');
    // D1 schema trigger records the audit entry in the SAME transaction as the update.
    return respond({ok:true,id,status});
  }catch(error){return bad(error);}
}
