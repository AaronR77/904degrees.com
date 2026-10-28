/* MARK11.1 timing and interaction tests for the purely cinematic Door.
 * Run: node tools/test-door-mark111.mjs. Simulated clock, no browser or network required.
 */
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const code = readFileSync(new URL('../nondescript/assets/cinematic.js',import.meta.url),'utf8');
function setup(reduced=false){
 let now=0, seq=0, next=null, navigatedAt=-1, destination='';
 const tasks=new Map(), elements={};
 const make=id=>elements[id]={
   id, hidden:id==='decision'||id==='return-message'||id==='hello', textContent:'',disabled:false,
   handlers:{}, classList:{values:new Set(),add(x){this.values.add(x);},remove(x){this.values.delete(x);},toggle(x,on){on?this.values.add(x):this.values.delete(x);}},
   focus(){},addEventListener(name,fn){this.handlers[name]=fn;},click(){this.handlers.click?.();}
 };
 for(const id of ['terminal-code','decision','choice-yes','choice-no','typed-choice','return-message','hello','flash','sr-status','door-controls','startup-prompt'])make(id);
 const listeners={};
 const document={getElementById:id=>elements[id], body:{classList:{values:new Set(),add(x){this.values.add(x);}}},addEventListener:(name,fn)=>listeners[name]=fn};
 const window={matchMedia:()=>({matches:reduced}),setTimeout(fn,ms){const id=++seq;tasks.set(id,{at:now+ms,fn});return id},location:{replace(to){destination=to;navigatedAt=now;}}};
 const clearTimeout=id=>tasks.delete(id);
 runInNewContext(code,{window,document,clearTimeout,location:window.location});
 function runTo(t){
  while(true){
   let best=null,id=null;
   for(const [k,v] of tasks){if(v.at<=t&&(!best||v.at<best.at)){best=v;id=k;}}
   if(!best)break;
   tasks.delete(id);now=best.at;best.fn();
  }
  now=t;
 }
 function untilDecision(){let t=0;while(elements.decision.hidden){t+=100;runTo(t);if(t>30000)throw Error('decision never displayed')}return now;}
 return {get now(){return now},get navigatedAt(){return navigatedAt},get destination(){return destination},get elements(){return elements},runTo,untilDecision,keydown:key=>listeners.keydown({key,altKey:false,ctrlKey:false,metaKey:false,repeat:false,preventDefault(){}})};
}
let t=setup();let at=t.untilDecision();assert(at>8000);
assert(t.elements['terminal-code'].textContent.includes('namespace NineZeroFour.SortOfSecretEntrance'));
t.keydown('Y');t.runTo(at+500);
assert(t.elements.hello.hidden,'hello should not yet be visible while flashes finish');
t.runTo(at+530);assert(!t.elements.hello.hidden,'hello must be visible after flashes');
assert(t.elements['sr-status'].textContent.includes('Hello World'));
t.runTo(at+530+3499);assert(t.navigatedAt<0,'hello held for less than 3.5 seconds');
t.runTo(at+530+3500);assert.equal(t.destination,'/portal/');

t=setup();at=t.untilDecision();t.elements['choice-no'].click();
assert(t.elements['return-message'].textContent==='' && !t.elements['return-message'].hidden);
t.runTo(at+5500);assert(t.navigatedAt<0,'no branch too short');
t.runTo(at+5700);assert.equal(t.destination,'/portal/');

t=setup();at=t.untilDecision();t.runTo(at+119999);assert(t.navigatedAt<0,'inactivity fired early');
t.runTo(at+120000);assert.equal(t.elements['typed-choice'].textContent,'N');
t.runTo(at+125700);assert.equal(t.destination,'/portal/');

t=setup(true);at=t.untilDecision();t.keydown('Y');t.runTo(at);assert(!t.elements.hello.hidden,'reduced motion should omit flashes');
t.runTo(at+3500);assert.equal(t.destination,'/portal/');
console.log('MARK11.1 Door PASS: Y, N, 120-second inactivity, 3.5-second Hello World, reduced motion.');
