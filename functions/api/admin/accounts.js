import {authorizedAccount,readJson,clean,validEmail,bool,publicAccount,respond,fail,bad} from '../../_lib/core.js';
export async function onRequestGet(context){
  try {const gate=await authorizedAccount(context,'admin');if(gate.error)return gate.error;
    const list=await gate.db.prepare('SELECT * FROM accounts ORDER BY created_at DESC LIMIT 200').all();
    return respond({ok:true,accounts:(list.results||[]).map(publicAccount)});
  }catch(error){return bad(error);}
}
export async function onRequestPost(context){
  try {const gate=await authorizedAccount(context,'admin');if(gate.error)return gate.error;
    const body=await readJson(context);
    const email=clean(body.email,254).toLowerCase(),name=clean(body.name||'',120),organization=clean(body.organization||'',150);
    if(!validEmail(email))return fail(400,'invalid_email','Enter a valid email address.');
    // Prospects are ALWAYS included in an invitation. Only Owner can grant administrative privileges.
    const customer=bool(body.isCustomer),admin=bool(body.isAdmin);
    if(admin&&!gate.account.is_owner)return fail(403,'owner_required','Only the Owner may grant Admin privileges.');
    const id=crypto.randomUUID();
    try{
      await gate.db.batch([
        gate.db.prepare("INSERT INTO accounts(id,email,display_name,organization,is_prospect,is_customer,is_admin,is_owner,status,invited_by) VALUES (?,?,?,?,1,?,?,0,'invited',?)").bind(id,email,name,organization,customer,admin,gate.account.id),
        gate.db.prepare('INSERT INTO account_history(account_id,actor_account_id,action,details) VALUES (?,?,?,?)').bind(id,gate.account.id,'invited','Prospect invitation created'),
      ]);
    }catch(error){if(String(error?.message||'').includes('UNIQUE'))return fail(409,'already_exists','That email already has an account.');throw error;}
    return respond({ok:true,account:{id,email,name,organization,status:'invited',roles:{prospect:true,customer:!!customer,admin:!!admin}},nextStep:'Authorize this exact email in your Cloudflare Access policy and Pages allowlist, then send a private portal link. Email is not automatically sent.'},201);
  }catch(error){return bad(error);}
}
