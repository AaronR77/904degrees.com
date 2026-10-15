import {dbOf,principal,accountFor,readJson,respond,fail,bad} from '../../_lib/core.js';
/* Explicit, one-time owner bootstrap. Must have verified ADMIN Access AND exact owner email env. */
export async function onRequestPost(context){
  try {
    await readJson(context,256);
    const db=dbOf(context), who=principal(context);
    if(!db)return fail(503,'accounts_not_configured','Configure ACCOUNTS_DB and apply the migration first.');
    const ownerEmail=String(context.env?.ACCESS_OWNER_EMAIL||'').trim().toLowerCase();
    if(!ownerEmail||!who?.email||who.area!=='ADMIN'||who.email.toLowerCase()!==ownerEmail)return fail(403,'owner_required','Owner verification failed.');
    const existing=await db.prepare('SELECT id FROM accounts WHERE is_owner=1 LIMIT 1').first();
    if(existing){const current=await accountFor(db,who.email);return current?.is_owner ? respond({ok:true,alreadyInitialized:true}):fail(409,'owner_already_created','An owner has already been initialized.');}
    const id=crypto.randomUUID();
    try{
      await db.prepare("INSERT INTO accounts(id,email,display_name,is_prospect,is_customer,is_admin,is_owner,status) SELECT ?,?,'904° Owner',1,1,1,1,'active' WHERE NOT EXISTS (SELECT 1 FROM accounts WHERE is_owner=1)").bind(id,ownerEmail).run();
    }catch(_){return fail(409,'owner_already_created','An owner already exists.');}
    return respond({ok:true,created:true});
  }catch(error){return bad(error);}
}
