/* 904° // THE NONDESCRIPT DOOR
   Approved Release 1, October 2026. Fully local animation/audio code; no tracking.
   Timeline is synchronized to one monotonic clock, independent of frame rate.
*/
(()=>{'use strict';
const $=id=>document.getElementById(id);const destination='/portal/';const endAt=23.35;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));const ease=x=>1-Math.pow(1-clamp(x),3);
class NondescriptDoor{
 constructor(){this.ready=false;this.isDone=false;this.error=false;this.elapsed=0;this.lastFrame=0;this.hiddenAt=0;this.renderer=null;this.soundtrack=new window.NDAudio();this.reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;this.stage='loading';this.controls=$('controls');this.lastInteraction=0;this.stageElements=['charging','warp-hud','reboot','recovery','dimensional','assembly','emergency'].map($);this.sourceOrigin=null;this.startedAt=0;this.rift=null;this.pendingArrival=null;this.lastLogoLine=-1;this.lastTermLine=-1;this.emergencyStarted=0;this.dimensionIndex=-1;this.animate=this.animate.bind(this);}
 async init(){
  this.installControls();this.prepareOrigin();this.startLoader();
  window.addEventListener('resize',()=>{try{this.renderer?.resize();this.rift?.resize();}catch(e){this.fail(e);}}, {passive:true});
  window.addEventListener('visibilitychange',()=>{if(document.hidden){this.hiddenAt=performance.now();if(this.soundtrack.ctx?.state==='running')this.soundtrack.ctx.suspend().catch(()=>{});}else if(this.hiddenAt){const pause=performance.now()-this.hiddenAt;this.startedAt+=pause;this.emergencyStarted+=this.error?pause:0;this.hiddenAt=0;if(this.soundtrack.enabled&&this.soundtrack.ctx)this.soundtrack.ctx.resume().catch(()=>{});}});
  try{
   let r=new window.NDRenderer($('space'),e=>this.fail(e),this.reduced);r.init();this.renderer=r;
   const img=new Image();img.src='/assets/904_Logo_Lime.png';await Promise.race([new Promise(resolve=>{img.onload=resolve;img.onerror=resolve;if(img.complete)resolve();}),new Promise(resolve=>setTimeout(resolve,1600))]);
   const spent=performance.now()-this.loadingAt;if(spent<1200)await new Promise(resolve=>setTimeout(resolve,1200-spent));
   if(this.isDone)return;
   this.pendingArrival=$('arrival-preview');this.pendingArrival.addEventListener('load',()=>{try{if(this.pendingArrival.contentWindow.location.pathname==='/portal/'&&this.pendingArrival.contentDocument.querySelector('main'))this.pendingArrival.classList.add('loaded');}catch(_){}});this.pendingArrival.src=destination;
   try{this.rift=new window.NDRealities($('reality-canvas'),$('dimension-label'),$('dimension-count'));}catch(e){throw e;}
   this.ready=true;this.startCinematic();
  }catch(e){this.fail(e);}
 }
 installControls(){
  $('skip').addEventListener('click',e=>{e.preventDefault();this.arrive();});
  $('sound').addEventListener('click',()=>{if(this.soundtrack.enabled){this.soundtrack.setEnabled(false);this.setSoundUI('off');}else{this.soundtrack.setEnabled(true);this.soundtrack.start().then(ok=>this.setSoundUI(ok?'on':'unavailable')).catch(()=>this.setSoundUI('unavailable'));}});
  const onActivity=()=>{if(this.isDone)return;this.controls.classList.remove('is-hidden');this.lastInteraction=performance.now();};
  document.addEventListener('pointermove',onActivity,{passive:true});document.addEventListener('pointerdown',onActivity,{passive:true});document.addEventListener('focusin',onActivity);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'||(e.key.toLowerCase()==='s'&&!e.repeat&&!e.altKey&&!e.ctrlKey&&!e.metaKey)){e.preventDefault();this.arrive();}else onActivity();});
  this.controls.addEventListener('pointerenter',onActivity);
  this.lastInteraction=performance.now();
 }
 setSoundUI(status){const b=$('sound'),s=$('sound-symbol'),l=$('sound-label');if(status==='off'){s.textContent='◖×';l.textContent='SOUND OFF';b.setAttribute('aria-label','Unmute soundtrack');b.setAttribute('aria-pressed','true');}else if(status==='unavailable'){s.textContent='◖×';l.textContent='AUDIO UNAVAILABLE';b.setAttribute('aria-label','Retry soundtrack');b.setAttribute('aria-pressed','false');}else{s.textContent='◖))';l.textContent='SOUND ON';b.setAttribute('aria-label','Mute soundtrack');b.setAttribute('aria-pressed','false');}}
 prepareOrigin(){try{const raw=sessionStorage.getItem('nd-door-origin');sessionStorage.removeItem('nd-door-origin');if(!raw)return;const v=JSON.parse(raw);if(Date.now()-v.at>20000)return;this.sourceOrigin=v;}catch(_){}}
 startLoader(){this.loadingAt=performance.now();this.show('charging');$('charging-status').textContent='Locating enough energy to make a poor decision...';if(this.sourceOrigin&&$('gate').animate){const v=this.sourceOrigin,dx=v.x-innerWidth/2,dy=v.y-innerHeight*.43;try{const launchAnim=$('gate').animate([{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.12)`,opacity:.75},{transform:'translate(-50%,-50%) scale(1)',opacity:1}],{duration:1000,easing:'cubic-bezier(.12,.65,.2,1)',fill:'both'});launchAnim.finished.then(()=>launchAnim.cancel()).catch(()=>{});}catch(_){}}
  const meter=$('charge-progress');meter.animate([{width:'3%'},{width:'93%'}],{duration:1200,fill:'forwards',easing:'ease-out'});
 }
 startCinematic(){this.startedAt=performance.now();this.elapsed=0;this.show('warp');$('sr-status').textContent='Hyperspace descent initiated. Press Escape or use Skip to enter the Portal immediately.';
  // The click on the homepage link may allow audio; browsers sometimes block autoplay on navigation.
  this.soundtrack.start().then(ok=>{if(!ok)this.setSoundUI('unavailable');}).catch(()=>this.setSoundUI('unavailable'));
  this.raf=requestAnimationFrame(this.animate);
 }
 show(stage){if(this.stage===stage)return;this.stage=stage;for(const el of this.stageElements)el.classList.remove('visible');if(stage==='warp'){$('warp-hud').classList.add('visible');}else if(stage!=='blackout'){$(stage==='loading'?'charging':stage).classList.add('visible');} $('space').style.opacity=stage==='warp'?'1':'0';}
 updateWarp(t){this.show('warp');if(t<1.72){$('charging').classList.add('visible');$('charging').style.background=`rgba(0,3,0,${Math.max(0,.92-t*.7)})`;$('charging').querySelector('.charging-copy').style.opacity='0';const grow=1+Math.pow(t/1.72,2.3)*18;$('gate').style.transform=`translate(-50%,-50%) scale(${grow})`;$('gate').style.opacity=String(clamp(1-t/1.72));}else $('charging').classList.remove('visible');
  const plaid=clamp((t-6)*5);$('plaid').style.opacity=String(plaid*.84);$('plaid').style.transform=t>7.63?`scale(${Math.max(.001,1-(t-7.63)/.37)}) rotate(${Math.min(14,(t-7.63)*35)}deg)`:`scale(${1.13+t*.02}) translate(${Math.sin(t*9)*3}px,${Math.cos(t*5)*3}px)`;
  $('fx-flash').style.opacity=String(t>7.84?clamp((t-7.84)/.1)*(1-clamp((t-7.96)/.04))*.9:t>5.8&&t<6.1?.37*(1-Math.abs(5.95-t)/.15):0);
  $('speed-meter').textContent=t<2?'VELOCITY // UNREASONABLE':t<4?'VELOCITY // ABOVE LIGHTSPEED':t<6?'VELOCITY // LEGALLY QUESTIONABLE':'VELOCITY // LUDICROUS';
 }
 updateReboot(t){this.show('reboot');$('fx-flash').style.opacity='0';$('plaid').style.opacity='0';const p=clamp(t/4);const logo=$('reboot-logo');const frames=[
  {at:0,text:'INITIALIZING REALITY...\nCHECKING PHYSICAL CONSTANTS..... PENDING',status:'REBOOT SEQUENCE STARTED'},
  {at:.22,text:'LOADING SPACETIME................ OK\nINSTALLING COMMON SENSE........... FAILED',status:'RESTORING UNIVERSE...'},
  {at:.45,text:'MEMORY CHECK..................... 404\nCONNECTION TO KNOWN UNIVERSE...... LOST',status:'CRITICAL SYSTEM INSTABILITY'},
  {at:.72,text:'SYSTEM ROLLBACK................... FAILED\nSEARCHING FOR ORIGINAL REALITY.... 0 FOUND',status:'REALITY.EXE HAS STOPPED RESPONDING'},
  {at:.88,text:'FATAL ERROR: DESTINATION NOT FOUND\nRESTARTING EMERGENCY RECOVERY...',status:'BOOT FAILURE // INITIATING EMERGENCY MODE'}];
  let idx=0;for(let i=0;i<frames.length;i++)if(p>=frames[i].at)idx=i;
  if(this.lastLogoLine!==idx){this.lastLogoLine=idx;$('reboot-status').textContent=frames[idx].status;$('reboot-lines').textContent=frames[idx].text;}
  const bootPercent=p<.58?(p/.58)*72:p<.82?72-((p-.58)/.24)*44:28;$('reboot-progress').firstElementChild.style.width=String(bootPercent)+'%';
  const glitch=p>.21?(p-.21)*2.5:0;const displacement=this.reduced?0:Math.sin(t*47)*glitch*7;logo.style.transform=`translate(${displacement}px,${this.reduced?0:Math.cos(t*31)*glitch*3}px) skewX(${this.reduced?0:glitch*1.5*Math.sin(t*28)}deg)`;
  logo.style.filter=`brightness(${1+glitch*.23}) contrast(${1+glitch*.9}) drop-shadow(${glitch*7}px 1px 1px #a3ff40) drop-shadow(${-glitch*7}px -1px 1px #6bfff0)`;
  logo.style.opacity=String(!this.reduced&&p>.9&&Math.floor(t*16)%3===0?.45:1);
 }
 updateRecovery(t){this.show('recovery');const p=clamp(t/5);const frames=[
 {at:0,lines:'C:\\REALITY> BOOT /SAFE\nInitializing emergency recovery utility...\nDetected operating system: UNKNOWN'},
 {at:.16,lines:'C:\\REALITY> UPGRADE FUTURE.EXE\nInstalling FUTURE.EXE............ 42%\nERROR: Future not found.'},
 {at:.34,lines:'C:\\REALITY> ROLLBACK /FORCE\nRolling back to 1987........... OK\nInstalling FUTURE.EXE............ 86%\nERROR: Past refusing to cooperate.'},
 {at:.56,lines:'C:\\REALITY> PATCH --desperate\nApplying emergency patch....... OK\nBribing physical constants..... ACCEPTED'},
 {at:.77,lines:'C:\\REALITY> RESTART PORTAL.SYS\nRestoring space-time geometry... OK\nInterface reconstruction....... OK\nWARNING: No guarantee is expressed or implied.'},
 {at:.91,lines:'C:\\REALITY> PORTAL --OPEN\nSYSTEM STATUS: TECHNICALLY FUNCTIONAL\nDimensional coordinates: SEARCHING...'}];
 let idx=0;for(let i=0;i<frames.length;i++)if(p>=frames[i].at)idx=i;if(idx!==this.lastTermLine){this.lastTermLine=idx;$('terminal-lines').textContent=frames[idx].lines;}
 $('term-clock').textContent=`00:00:${String(Math.floor(t)).padStart(2,'0')}`;
 const reveal=$('recovery-reveal');reveal.style.opacity=String(clamp((p-.70)/.24)*.91);
 if(this.reduced){reveal.querySelectorAll('.rec-circle').forEach(e=>e.style.animation='none');}
 }
 updateDimensions(t){this.show('dimensional');const p=clamp(t/4);const w=ease(clamp(p/.15));const left=50-50*w,right=50+50*w;const jitter=this.reduced?0:Math.sin(t*31)*1.7;let points=[`${left}% 0%`,`${right}% 0%`,`${right+1*w}% 13%`,`${right-2*w}% 24%`,`${right+2*w}% 39%`,`${right-1*w}% 52%`,`${right+2*w}% 67%`,`${right-1*w}% 81%`,`${right}% 100%`,`${left}% 100%`,`${left-2*w}% 87%`,`${left+2*w}% 73%`,`${left-2*w}% 58%`,`${left+1*w}% 41%`,`${left-2*w}% 27%`,`${left+1*w}% 13%`];
 $('rift-window').style.clipPath=`polygon(${points.join(',')})`;$('rift-window').style.filter=this.reduced?'none':`hue-rotate(${Math.sin(t*4)*7}deg) brightness(${1+Math.abs(Math.sin(t*8))*.07})`;const scene=this.rift.draw(t,this.reduced);
 $('rift-glow').style.opacity=String(.5+.5*Math.sin(t*3)**2);
 if(scene.isJoke){$('dimension-count').textContent='DESTINATION MISMATCH // CORRECTING...';}
 }
 buildAssembly(){const parent=$('assembly-tiles');if(parent.children.length)return;for(let i=0;i<24;i++){const cell=document.createElement('span');cell.style.setProperty('--dx',`${((i%6)-2.5)*30}px`);cell.style.setProperty('--dy',`${(Math.floor(i/6)-1.5)*28}px`);cell.style.setProperty('--rotate',`${(i%2?1:-1)*(6+i%4*2)}deg`);cell.style.transitionDelay=`${Math.round(Math.sin(i*15)*115+135)}ms`;parent.appendChild(cell);}}
 updateAssembly(t){this.show('assembly');this.buildAssembly();if(t>.18){$('assembly-tiles').classList.add('assembled');} $('arrival-label').style.opacity=t>.4?'0':'1';}
 animate(ts){if(this.isDone||this.error)return;if(document.hidden){this.raf=requestAnimationFrame(this.animate);return;}
  let t=(ts-this.startedAt)/1000;this.elapsed=t;
  try{
   if(t<8){this.updateWarp(t);this.renderer.draw(t,ts);}
   else if(t<9.5){this.show('blackout');$('plaid').style.opacity='0';$('fx-flash').style.opacity='0';}
   else if(t<13.5)this.updateReboot(t-9.5);
   else if(t<18.5)this.updateRecovery(t-13.5);
   else if(t<22.5)this.updateDimensions(t-18.5);
   else if(t<endAt)this.updateAssembly(t-22.5);
   else{this.arrive();return;}
   this.soundtrack.update(t);
   if(ts-this.lastInteraction>2900&&!this.controls.matches(':focus-within'))this.controls.classList.add('is-hidden');
  }catch(e){this.fail(e);return;}
  this.raf=requestAnimationFrame(this.animate);
 }
 fail(error){if(this.isDone||this.error)return;this.error=true;cancelAnimationFrame(this.raf);this.soundtrack.stop();$('space').style.opacity='0';$('fx-flash').style.opacity='0';$('plaid').style.opacity='0';this.show('emergency');this.controls.classList.remove('is-hidden');this.emergencyStarted=performance.now();$('sr-status').textContent='A graphics failure occurred. The Portal is still available.';
  const possibilities=[['GRAPHICS ENGINE........... LEFT REALITY','LOCATING MISSING PIXELS..... FAILED','PIXELS HAVE DECLINED TO COMMENT.'],['CRITICAL ERROR............ 904°','CONTACTING TECH SUPPORT..... BUSY','TECH SUPPORT IS IN ANOTHER DIMENSION.'],['RENDERING CONTEXT.......... LOST','BLAMING THE INTERN.......... SUCCESS','THE INTERN IS A SENTIENT TOASTER.'],['DISPLAY SUBSYSTEM.......... MELTED','DEFRAGMENTING THE UNIVERSE.. FAILED','THE WARRANTY DOES NOT COVER THIS.']];const lines=possibilities[Math.floor(Math.random()*possibilities.length)];$('emergency-lines').textContent=lines[0]+'\n';const update=()=>{if(this.isDone)return;const delta=performance.now()-this.emergencyStarted;if(delta>=650)$('emergency-lines').textContent=lines.slice(0,2).join('\n');if(delta>=1650)$('emergency-lines').textContent=lines.join('\n')+'\n\nERROR: COMPUTER HAS NO IDEA WHAT HAPPENED.';if(delta>=4000){this.arrive();return;}this.emergencyTimer=setTimeout(update,130);};this.emergencyTimer=setTimeout(update,100);
  if(location.hostname==='localhost'||location.hostname==='127.0.0.1')console.warn('[904° Cinematic] emergency recovery:',error);
 }
 arrive(){if(this.isDone)return;this.isDone=true;cancelAnimationFrame(this.raf);clearTimeout(this.emergencyTimer);this.soundtrack.stop();this.renderer?.destroy();location.replace(destination);}
}
let app;document.addEventListener('DOMContentLoaded',()=>{app=new NondescriptDoor();app.init();if((location.hostname==='localhost'||location.hostname==='127.0.0.1')&&new URLSearchParams(location.search).has('ndtest')){window.NDDebug={jump(t){if(!app.ready)return false;app.startedAt=performance.now()-t*1000;return true;},fail(){app.fail(new Error('Manual test'));},app};}});
})();
