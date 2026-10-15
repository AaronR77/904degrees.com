import {authorizedAccount,readJson,clean,bool,publicAccount,respond,fail,bad} from '../../../_lib/core.js';
export async function onRequestPatch(context){
  try {const gate=await authorizedAccount(context,'admin');if(gate.error)return gate.error;
    const body=await readJson(context),id=context.params.id;
    const target=await gate.db.prepare('SELECT * FROM accounts WHERE id=? LIMIT 1').bind(id).first();
    if(!target)return fail(404,'account_not_found','Account not found.');
    if(target.is_owner)return fail(403,'owner_protected','Owner account cannot be edited here.');
    if(target.is_admin&&!gate.account.is_owner)return fail(403,'owner_required','Only the owner can change an Admin account.');
    const name=clean(body.name??target.display_name,120),organization=clean(body.organization??target.organization,150);
    const customer=body.isCustomer===undefined?target.is_customer:bool(body.isCustomer);
    const prospect=body.isProspect===undefined?target.is_prospect:bool(body.isProspect);
    const admin=body.isAdmin===undefined?target.is_admin:bool(body.isAdmin);
    const status=body.status===undefined?target.status:clean(body.status,20);
    if(admin&&!gate.account.is_owner)return fail(403,'owner_required','Only the owner can grant Admin access.');
    if(!['invited','active','suspended'].includes(status))return fail(400,'invalid_status','Invalid account status.');
    if(!prospect&&!customer&&!admin && status!=='suspended')return fail(400,'no_roles','Active accounts must have at least one role.');
    if(target.id===gate.account.id && (status==='suspended'||!admin))return fail(403,'self_lockout','You cannot remove your own administrative access.');
    await gate.db.batch([
      gate.db.prepare("UPDATE accounts SET display_name=?,organization=?,is_prospect=?,is_customer=?,is_admin=?,status=?,updated_at=datetime('now') WHERE id=?").bind(name,organization,prospect,customer,admin,status,id),
      gate.db.prepare('INSERT INTO account_history(account_id,actor_account_id,action,details) VALUES (?,?,?,?)').bind(id,gate.account.id,'updated','Account role/status updated'),
    ]);
    const updated=await gate.db.prepare('SELECT * FROM accounts WHERE id=?').bind(id).first();
    return respond({ok:true,account:publicAccount(updated)});
  }catch(error){return bad(error);}
}
