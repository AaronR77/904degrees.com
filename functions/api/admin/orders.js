import {authorizedAccount,respond,bad} from '../../_lib/core.js';
export async function onRequestGet(context){
  try {const gate=await authorizedAccount(context,'admin');if(gate.error)return gate.error;
    const list=await gate.db.prepare('SELECT o.id,o.public_ref,o.design_id,o.service,o.project_name,o.organization,o.description,o.desired_timeline,o.status,o.admin_note,o.created_at,o.updated_at,a.email AS customer_email,a.display_name AS customer_name FROM orders o JOIN accounts a ON a.id=o.account_id ORDER BY o.created_at DESC LIMIT 200').all();
    return respond({ok:true,orders:list.results||[]});
  }catch(error){return bad(error);}
}
