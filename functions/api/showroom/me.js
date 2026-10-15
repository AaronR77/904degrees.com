import {authorizedAccount,publicAccount,respond,bad} from '../../_lib/core.js';
export async function onRequestGet(context){try{const gate=await authorizedAccount(context,'showroom');if(gate.error)return gate.error;return respond({ok:true,account:publicAccount(gate.account)});}catch(error){return bad(error);}}
