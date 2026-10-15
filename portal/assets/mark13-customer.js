/* MARK13 — customer account and order history; APIs enforce identity server-side. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const create=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 let ready=false;
 async function api(url,method='GET',data){
  const response=await fetch(url,{method,credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json',Accept:'application/json'}:{Accept:'application/json'},body:data?JSON.stringify(data):undefined});
  const result=await response.json().catch(()=>({message:'An unexpected response was received.'}));
  if(!response.ok || !result.ok)throw new Error(result.message||'Service unavailable.');
  return result;
 }
 async function load(){
  try{
   const profile=await api('/api/customer/me');
   $('#customer-identity').textContent=(profile.account.name||'Invited customer')+' · '+profile.account.email;
   ready=true;$('#customer-order-submit').disabled=false;
   await refresh();
  }catch(e){ $('#customer-identity').textContent='Account not ready: '+e.message;$('#customer-order-submit').disabled=true;$('#customer-orders').textContent='Order history unavailable until your account is activated.'; }
 }
 async function refresh(){
  const host=$('#customer-orders');
  try{
   const {orders}=await api('/api/customer/orders');host.replaceChildren();
   if(!orders.length){host.append(create('p','mark13-muted','No orders yet. Submit your first project request.'));return;}
   for(const order of orders){
    const row=create('article','mark13-entry');
    row.append(create('span','mark13-badge',order.status.replace(/_/g,' ').toUpperCase()),create('h3','',order.project_name));
    row.append(create('p','mark13-muted',order.public_ref+' · '+order.created_at));
    row.append(create('p','',order.description));
    if(order.admin_note)row.append(create('p','mark13-muted','904° update: '+order.admin_note));
    host.append(row);
   }
  }catch(e){host.textContent='Order history unavailable: '+e.message;}
 }
 $('#customer-order-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!ready||!event.currentTarget.reportValidity())return;
  const button=$('#customer-order-submit'),status=$('#customer-order-result');button.disabled=true;status.textContent='Submitting securely…';
  try{const result=await api('/api/customer/orders','POST',Object.fromEntries(new FormData(event.currentTarget)));
   status.textContent='Order '+result.order.reference+' received. Scope review is next; invoicing happens afterward.';
   event.currentTarget.reset();await refresh();
  }catch(e){status.textContent='Order was not submitted: '+e.message;status.classList.add('mark13-error');}
  finally{button.disabled=!ready;}
 });
 load();
})();
