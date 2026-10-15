/* MARK13 — owner bootstrap, invitation records, account roles, order review. */
(() => {
 'use strict';
 const $=s=>document.querySelector(s);
 const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 let owner=false,connected=false;
 async function api(url,method='GET',data){
  const response=await fetch(url,{method,credentials:'same-origin',cache:'no-store',headers:data?{'Content-Type':'application/json',Accept:'application/json'}:{Accept:'application/json'},body:data?JSON.stringify(data):undefined});
  const result=await response.json().catch(()=>({message:'Unexpected server response.'}));
  if(!response.ok || !result.ok)throw new Error(result.message||'Unable to continue.');return result;
 }
 async function refreshAccounts(){
  const host=$('#accounts-list');
  try{
   const {accounts}=await api('/api/admin/accounts');host.replaceChildren();
   if(!accounts.length){host.append(make('p','mark13-muted','No accounts yet.'));return;}
   for(const a of accounts){
    const row=make('article','mark13-entry');row.append(make('h3','',a.name||a.email),make('p','mark13-muted',a.email));
    const group=make('div','mark13-row');
    const role=flag=>{const label=make('label','mark13-check'),check=document.createElement('input');check.type='checkbox';check.checked=!!a.roles[flag];check.dataset.role=flag;check.disabled=flag==='admin'&&!owner||a.roles.owner;label.append(check,document.createTextNode(' '+flag));return label;};
    for(const name of ['prospect','customer','admin'])group.append(role(name));
    const state=make('select','mark13-select');
    for(const v of ['invited','active','suspended']){const o=make('option','',v);o.value=v;o.selected=v===a.status;state.append(o);}
    state.disabled=a.roles.owner;
    const save=make('button','mark13-small mark13-outline','SAVE ROLES');save.type='button';save.disabled=a.roles.owner;
    const result=make('p','mark13-status','');
    save.addEventListener('click',async()=>{
     const flags=Object.fromEntries([...group.querySelectorAll('input')].map(i=>[i.dataset.role,i.checked]));
     save.disabled=true;result.textContent='Saving…';
     try{await api('/api/admin/accounts/'+encodeURIComponent(a.id),'PATCH',{isProspect:flags.prospect,isCustomer:flags.customer,isAdmin:flags.admin,status:state.value});result.textContent='Saved.';await refreshAccounts();}
     catch(e){result.textContent=e.message;save.disabled=false;}
    });
    row.append(group,state,save,result);host.append(row);
   }
  }catch(e){host.textContent='Account list unavailable: '+e.message;}
 }
 async function refreshOrders(){
  const host=$('#admin-orders-list');
  try{
   const {orders}=await api('/api/admin/orders');host.replaceChildren();
   if(!orders.length){host.append(make('p','mark13-muted','No orders submitted yet.'));return;}
   for(const o of orders){
    const row=make('article','mark13-entry');row.append(make('span','mark13-badge',o.public_ref));row.append(make('h3','',o.project_name));
    row.append(make('p','mark13-muted',o.customer_email+' · '+o.created_at+' · '+o.service.replace(/_/g,' ')));
    row.append(make('p','',o.description));if(o.design_id)row.append(make('p','mark13-muted','Design: '+o.design_id));
    const group=make('div','mark13-fields');
    const label=make('label','mark13-label','Status');const select=make('select');
    for(const s of ['submitted','reviewing','needs_details','quoted','accepted','declined','cancelled']){
     const opt=make('option','',s.replace(/_/g,' '));opt.value=s;opt.selected=s===o.status;select.append(opt);
    }label.append(select);
    const noteLabel=make('label','mark13-label','Private account update / note');const note=make('textarea');note.maxLength=1500;note.rows=2;note.value=o.admin_note||'';noteLabel.append(note);group.append(label,noteLabel);
    const button=make('button','mark13-small','SAVE ORDER UPDATE');const result=make('p','mark13-status','');
    button.addEventListener('click',async()=>{button.disabled=true;try{await api('/api/admin/orders/'+encodeURIComponent(o.id),'PATCH',{status:select.value,note:note.value});result.textContent='Status saved. No invoice or email was sent.';await refreshOrders();}catch(e){result.textContent=e.message;button.disabled=false;}});
    row.append(group,button,result);host.append(row);
   }
  }catch(e){host.textContent='Order list unavailable: '+e.message;}
 }
 async function load(){
  try{
   const list=await api('/api/admin/accounts');connected=true;
   // Server remains authoritative for privileged mutations: UI is only a convenience.
   // The current viewer's actual role is returned by a separate verified endpoint below.
   try{const {account}=await api('/api/admin/me');owner=!!account.roles.owner;$('#admin-identity').textContent='Authenticated: '+account.email+' · '+(owner?'Owner':'Administrator');}
   catch(_){owner=false;$('#admin-identity').textContent='Authenticated administrator. Account records available.';}
   $('#grant-admin').disabled=!owner;
   await Promise.all([refreshAccounts(),refreshOrders()]);
  }catch(e){$('#admin-identity').textContent='Account services unavailable: '+e.message;
   if(/account|invited|not ready|not configured/i.test(e.message))$('#admin-bootstrap').hidden=false;
  }
 }
 $('#admin-bootstrap').addEventListener('click',async()=>{
  const button=$('#admin-bootstrap');button.disabled=true;$('#admin-identity').textContent='Initializing…';
  try{await api('/api/admin/bootstrap','POST',{});button.hidden=true;await load();}
  catch(e){$('#admin-identity').textContent='Cannot initialize: '+e.message;button.disabled=false;}
 });
 $('#account-create-form').addEventListener('submit',async event=>{
  event.preventDefault();if(!event.currentTarget.reportValidity())return;
  const form=event.currentTarget,result=$('#account-form-result'),btn=form.querySelector('button[type=submit]');btn.disabled=true;
  try{
   const values=Object.fromEntries(new FormData(form));values.isCustomer=!!form.elements.isCustomer.checked;values.isAdmin=!!form.elements.isAdmin.checked;
   const response=await api('/api/admin/accounts','POST',values);
   result.textContent='Invitation created for '+response.account.email+'. Next: authorize the email in Cloudflare Access + Pages allowlist, then send the private portal link. No invitation email was sent automatically.';
   form.reset();await refreshAccounts();
  }catch(e){result.textContent='Invitation not created: '+e.message;}
  finally{btn.disabled=false;}
 });
 load();
})();
