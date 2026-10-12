/* Four-to-six randomly selected procedural dimensions, followed by a last malfunction. */
(()=>{'use strict';
const PI=Math.PI;
const hash=n=>{const x=Math.sin(n*183.3+17)*43758.9;return x-Math.floor(x)};
const scenes=[
 {id:'singularity',name:'SINGULARITY // KEEP YOUR DISTANCE'},
 {id:'prehistoric',name:'EARTH // SEVERAL MILLION YEARS EARLY'},
 {id:'ocean',name:'EARTH // SOMEWHAT OVERHYDRATED'},
 {id:'ringworld',name:'GAS GIANT // INCONVENIENTLY CLOSE'},
 {id:'inverted',name:'EARTH // GRAVITY INSTALLED BACKWARDS'},
 {id:'crystal',name:'CRYSTALLINE REALITY // DO NOT TOUCH'},
 {id:'clock',name:'TIME // OUT OF WARRANTY'},
 {id:'nebula',name:'UNAUTHORIZED NEBULA // DO NOT INHALE'},
];
const jokes=[{id:'duck',name:'ERROR // DUCKS NOW CONTROL THIS UNIVERSE'},
{id:'alien',name:'ERROR // ABSOLUTELY WRONG PLANET'},
{id:'alternate',name:'ERROR // 904° FROM ANOTHER TIMELINE'},
{id:'potato',name:'ERROR // UNIVERSE HAS BECOME A POTATO'}];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
function stars(c,w,h,count=150,seed=0){for(let i=0;i<count;i++){const x=hash(i*3+seed)*w,y=hash(i*3+1+seed)*h,r=hash(i*3+2+seed)*2+.4;const alpha=.16+hash(i*5+5+seed)*.78;c.fillStyle=`rgba(231,245,255,${alpha})`;c.fillRect(x,y,r,r);}}
function gradient(c,w,h,stops){let g=c.createLinearGradient(0,0,0,h);for(const [at,color] of stops)g.addColorStop(at,color);c.fillStyle=g;c.fillRect(0,0,w,h);}
function circle(c,x,y,r,color,blur=0){c.save();c.shadowColor=color;c.shadowBlur=blur;c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,2*PI);c.fill();c.restore();}
function ellipse(c,x,y,rx,ry,rot,color){c.save();c.translate(x,y);c.rotate(rot);c.beginPath();c.ellipse(0,0,rx,ry,0,0,2*PI);c.fillStyle=color;c.fill();c.restore();}
function mountains(c,w,h,y,color,seed){c.beginPath();c.moveTo(0,h);c.lineTo(0,y);for(let x=0;x<w+w/15;x+=w/15)c.lineTo(x,y-h*(.04+hash(seed+x)*.18));c.lineTo(w,h);c.closePath();c.fillStyle=color;c.fill();}
function drawScene(c,w,h,id,time){
 const x=w*.5,y=h*.48,s=Math.min(w,h);
 switch(id){
 case 'singularity':{
 gradient(c,w,h,[[0,'#03071e'],[.5,'#160d30'],[1,'#030716']]);stars(c,w,h,210,17);const g=c.createRadialGradient(x,y,s*.13,x,y,s*.47);g.addColorStop(0,'#000');g.addColorStop(.31,'#090310');g.addColorStop(.37,'#d874ff');g.addColorStop(.43,'#724dffb9');g.addColorStop(.65,'#250b6b4f');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,w,h);circle(c,x,y,s*.135,'#000');c.save();c.translate(x,y);c.rotate(-.28+time*.08);c.beginPath();c.ellipse(0,0,s*.27,s*.1,0,0,PI*2);c.strokeStyle='#f5b6ff';c.lineWidth=s*.018;c.shadowBlur=35;c.shadowColor='#bf54ff';c.stroke();c.restore();break;}
 case 'prehistoric':{
 gradient(c,w,h,[[0,'#1a1427'],[.42,'#c35a3b'],[.78,'#f1a74b'],[1,'#451a24']]);circle(c,w*.76,h*.31,s*.12,'#ffd18b',20);mountains(c,w,h,h*.68,'#63343d',3);mountains(c,w,h,h*.81,'#241f2b',13);c.fillStyle='#12151d';c.beginPath();c.ellipse(w*.34,h*.73,s*.18,s*.11,-.1,0,PI*2);c.fill();c.beginPath();c.moveTo(w*.4,h*.71);c.quadraticCurveTo(w*.53,h*.4,w*.47,h*.36);c.quadraticCurveTo(w*.52,h*.31,w*.58,h*.38);c.quadraticCurveTo(w*.56,h*.42,w*.5,h*.405);c.quadraticCurveTo(w*.54,h*.57,w*.43,h*.76);c.fill();for(const dx of [-.085,.06]){c.fillRect(w*(.34+dx),h*.76,s*.035,h*.18);}c.beginPath();c.moveTo(w*.2,h*.73);c.lineTo(w*.08,h*.55);c.lineTo(w*.28,h*.68);c.fill();break;}
 case 'ocean':{
 gradient(c,w,h,[[0,'#202b5a'],[.35,'#9f7698'],[.55,'#edae9c'],[.56,'#294d6a'],[1,'#061f3a']]);circle(c,w*.78,h*.27,s*.11,'#f9d0aa',10);for(let i=0;i<27;i++){const bx=(i/27)*w,bw=w*.015+w*.035*hash(i+3),bh=h*(.06+hash(i*13)*.17);c.fillStyle='#1c3444';c.fillRect(bx,h*.56-bh,bw,bh);c.fillStyle='#9acbde66';for(let j=0;j<5;j++)c.fillRect(bx+3,h*.56-bh+4+j*11,2,3);}for(let i=0;i<80;i++){const xx=hash(i*3)*w,yy=h*.57+hash(i*3+1)*h*.42;c.strokeStyle=`rgba(163,214,245,${.08+hash(i*3+2)*.32})`;c.lineWidth=1;c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+s*.007+hash(i*7)*s*.065,yy);c.stroke();}break;}
 case 'ringworld':{
 gradient(c,w,h,[[0,'#070a28'],[.65,'#16113f'],[1,'#020516']]);stars(c,w,h,230,42);const px=w*.58,py=h*.5,r=s*.23;const g=c.createRadialGradient(px-r*.35,py-r*.48,r*.08,px,py,r*1.15);g.addColorStop(0,'#fbe3a0');g.addColorStop(.6,'#cd8e54');g.addColorStop(1,'#3d2445');circle(c,px,py,r,g);c.save();c.translate(px,py);c.rotate(-.28);c.strokeStyle='#e5d9bcac';c.lineWidth=s*.045;c.beginPath();c.ellipse(0,0,r*1.72,r*.45,0,PI*.8,PI*2.25);c.stroke();c.strokeStyle='#8b8ce1';c.lineWidth=s*.012;c.beginPath();c.ellipse(0,0,r*1.95,r*.51,0,0,PI*2);c.stroke();c.restore();break;}
 case 'inverted':{
 gradient(c,w,h,[[0,'#0c2121'],[.42,'#18504b'],[.66,'#41556b'],[1,'#060c2a']]);stars(c,w,h,80,53);for(let i=0;i<35;i++){const bx=(i/35)*w,bw=w*.01+w*.027*hash(i+11),bh=h*(.07+hash(i*19+2)*.35);c.fillStyle='#061419';c.fillRect(bx,0,bw,bh);c.fillStyle='#a3ff40';for(let j=10;j<bh-10;j+=12)c.fillRect(bx+3,j,Math.max(1,bw-6),2);}c.strokeStyle='#9cfaae';c.lineWidth=2;c.beginPath();c.moveTo(0,h*.64);c.quadraticCurveTo(w*.4,h*.5,w,h*.69);c.stroke();for(let i=0;i<12;i++){const xx=hash(i*8)*w,yy=h*(.55+hash(i*11)*.3);c.fillStyle='#dcffd6';c.save();c.translate(xx,yy);c.rotate(Math.PI);c.fillRect(-3,-10,6,18);circle(c,0,-12,5,'#d0f1d6');c.restore();}break;}
 case 'crystal':{
 gradient(c,w,h,[[0,'#100e2b'],[.65,'#262556'],[1,'#0d152b']]);stars(c,w,h,110,66);for(let i=0;i<28;i++){const xx=hash(i*7)*w,hh=h*(.2+hash(i*7+1)*.74),ww=s*(.035+hash(i*7+2)*.18);const base=h+40;c.beginPath();c.moveTo(xx-ww,base);c.lineTo(xx-ww*.45,base-hh*.54);c.lineTo(xx,base-hh);c.lineTo(xx+ww*.65,base-hh*.32);c.lineTo(xx+ww,base);c.closePath();c.fillStyle=`hsla(${170+hash(i*7+3)*115},85%,${35+hash(i*7+4)*40}%,.7)`;c.fill();c.strokeStyle='#dcfaff65';c.lineWidth=1.5;c.stroke();}break;}
 case 'clock':{
 gradient(c,w,h,[[0,'#0c0913'],[.6,'#322327'],[1,'#0b0b19']]);stars(c,w,h,60,74);for(let i=0;i<13;i++){const xx=hash(i*13)*w,yy=hash(i*13+1)*h,r=s*(.035+hash(i*13+2)*.14);circle(c,xx,yy,r,'#151925');c.strokeStyle='#d8b683';c.lineWidth=3;c.beginPath();c.arc(xx,yy,r,0,2*PI);c.stroke();for(let j=0;j<12;j++){const a=j*PI/6;c.beginPath();c.moveTo(xx+Math.cos(a)*r*.77,yy+Math.sin(a)*r*.77);c.lineTo(xx+Math.cos(a)*r*.88,yy+Math.sin(a)*r*.88);c.stroke();}c.strokeStyle='#fff2cc';c.beginPath();c.moveTo(xx,yy);c.lineTo(xx+Math.cos(time*.7+i)*r*.6,yy+Math.sin(time*.7+i)*r*.6);c.stroke();}break;}
 case 'nebula':{
 gradient(c,w,h,[[0,'#020716'],[.48,'#200d38'],[1,'#030a24']]);stars(c,w,h,270,82);for(let i=0;i<28;i++){const xx=hash(i*7+2)*w,yy=hash(i*7+3)*h,r=s*(.1+hash(i*7+4)*.35);let g=c.createRadialGradient(xx,yy,0,xx,yy,r);const colors=['116,44,209','47,110,220','222,65,154','59,187,178'];const rgb=colors[i%4];g.addColorStop(0,`rgba(${rgb},.18)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(xx-r,yy-r,r*2,r*2);}circle(c,w*.72,h*.23,s*.019,'#e9f5ff',21);break;}
 case 'duck':{
 gradient(c,w,h,[[0,'#060e24'],[.57,'#17384e'],[1,'#071027']]);stars(c,w,h,190,96);circle(c,w*.7,h*.24,s*.1,'#9afebc',28);c.save();c.translate(w*.49,h*.51);c.rotate(-.14);ellipse(c,0,s*.15,s*.27,s*.20,0,'#ffdb35');ellipse(c,s*.17,-s*.005,s*.12,s*.11,0,'#ffdf49');ellipse(c,s*.095,s*.16,s*.11,s*.09,0,'#ffe579');ellipse(c,s*.274,s*.01,s*.115,s*.04,0,'#ff803a');circle(c,s*.204,-s*.035,s*.018,'#061421');circle(c,s*.211,-s*.043,s*.006,'#fff');c.restore();break;}
 case 'alien':{
 gradient(c,w,h,[[0,'#06160d'],[.57,'#34742a'],[1,'#08180e']]);stars(c,w,h,80,101);circle(c,w*.24,h*.2,s*.16,'#adff7c',40);mountains(c,w,h,h*.77,'#0b2b1b',5);c.fillStyle='#020803';c.beginPath();c.ellipse(w*.52,h*.57,s*.16,s*.27,0,0,2*PI);c.fill();ellipse(c,w*.46,h*.52,s*.066,s*.038,-.4,'#afff59');ellipse(c,w*.58,h*.52,s*.066,s*.038,.4,'#afff59');break;}
 case 'alternate':{
 gradient(c,w,h,[[0,'#2a041b'],[.48,'#501039'],[1,'#09041d']]);stars(c,w,h,95,115);c.save();c.translate(x,y);c.rotate(Math.sin(time*12)*.06);c.textAlign='center';c.font=`900 ${Math.min(w*.21,h*.45)}px Oxanium,monospace`;c.shadowColor='#ff2ad6';c.shadowBlur=40;c.fillStyle='#f520c1';c.fillText('406°',0,0);c.font=`700 ${Math.min(w*.025,28)}px Oxanium,monospace`;c.fillStyle='#f9d7f0';c.fillText('COLD IDEAS. HOT LOGIC.',0,s*.13);c.restore();break;}
 case 'potato':{
 gradient(c,w,h,[[0,'#15271e'],[1,'#0c0d13']]);stars(c,w,h,140,120);c.save();c.translate(x,y);c.rotate(-.2);c.fillStyle='#987343';c.strokeStyle='#c5a36b';c.lineWidth=s*.012;c.beginPath();c.moveTo(-s*.17,-s*.13);c.bezierCurveTo(-s*.4,-s*.25,-s*.4,s*.18,-s*.13,s*.25);c.bezierCurveTo(s*.12,s*.36,s*.35,s*.17,s*.25,-s*.09);c.bezierCurveTo(s*.15,-s*.26,-s*.01,-s*.28,-s*.17,-s*.13);c.fill();c.stroke();for(let i=0;i<10;i++)circle(c,(hash(i*4)-.5)*s*.4,(hash(i*4+1)-.5)*s*.32,s*.005,'#5d442f');c.restore();break;}
 }
}
class RealityPainter{
 constructor(canvas,label,count){this.canvas=canvas;this.label=label;this.count=count;this.c=canvas.getContext('2d');if(!this.c)throw Error('Realities canvas unavailable');this.selection=shuffle([...scenes]).slice(0,4+Math.floor(Math.random()*3));this.finalJoke=jokes[Math.floor(Math.random()*jokes.length)];this.current=-1;this.transitions=shuffle(['hard','liquid','electric','fracture','hard','liquid','electric','fracture']);this.buffer=document.createElement('canvas');this.bc=this.buffer.getContext('2d');this.resize();}
 resize(){this.w=Math.max(1,Math.min(1600,Math.round(window.innerWidth*Math.min(1.35,window.devicePixelRatio||1))));this.h=Math.max(1,Math.round(this.w*window.innerHeight/window.innerWidth));this.canvas.width=this.w;this.canvas.height=this.h;this.buffer.width=this.w;this.buffer.height=this.h;}
 draw(t,reduced){
  const count=this.selection.length,scanLength=3.48,isJoke=t>=scanLength;
  const index=isJoke?count:Math.min(count-1,Math.floor(t/scanLength*count));
  const selected=isJoke?this.finalJoke:this.selection[index];
  if(this.current!==index){this.current=index;this.label.textContent=selected.name;this.count.textContent=isJoke?'DESTINATION MISMATCH // RETRYING':`UNIVERSE ${String(index+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;}
  const interval=scanLength/count,start=isJoke?scanLength:index*interval,age=t-start;
  const mix=Math.min(1,Math.max(0,age/(reduced?.28:.2)));
  const c=this.c,w=this.w,h=this.h,prev=index===count?this.selection[count-1]:this.selection[index-1];
  c.clearRect(0,0,w,h);
  if(index===0||mix>=1){drawScene(c,w,h,selected.id,t);}
  else{
   drawScene(c,w,h,prev.id,t);
   const bc=this.bc;bc.clearRect(0,0,w,h);drawScene(bc,w,h,selected.id,t);
   const mode=reduced?'fade':this.transitions[index%this.transitions.length];
   if(mode==='liquid'){
    // Horizontal wavy strips: the incoming reality flows through the old one.
    const strip=Math.max(6,Math.round(h/65));c.globalAlpha=mix;
    for(let yy=0;yy<h;yy+=strip){const dx=Math.sin(yy*.025+t*31)*w*.045*(1-mix);c.drawImage(this.buffer,0,yy,w,Math.min(strip,h-yy),dx,yy,w,Math.min(strip,h-yy));}c.globalAlpha=1;
   }else if(mode==='electric'){
    c.globalAlpha=mix;c.drawImage(this.buffer,0,0);c.globalAlpha=1;
    c.save();c.strokeStyle=`rgba(180,255,103,${(1-mix)*.9})`;c.shadowColor='#a3ff40';c.shadowBlur=18;c.lineWidth=Math.max(1,w/640);
    for(let line=0;line<5;line++){c.beginPath();const x=(line+.4)*w/5;for(let yy=0;yy<h;yy+=h/18){const xx=x+Math.sin(yy*.033+line*14+t*45)*w*.034;if(yy===0)c.moveTo(xx,yy);else c.lineTo(xx,yy);}c.stroke();}c.restore();
   }else if(mode==='fracture'){
    // Alternating shards reveal the next dimension at different moments.
    const parts=18;for(let j=0;j<parts;j++){if(mix>.04+hash(j*17+index*23)*.85){const xx=j*w/parts,ww=w/parts+1;c.drawImage(this.buffer,xx,0,ww,h,xx,0,ww,h);}}
   }else if(mode==='hard'){c.drawImage(this.buffer,0,0);}
   else{c.globalAlpha=mix;c.drawImage(this.buffer,0,0);c.globalAlpha=1;}
   if(!reduced&&mode==='hard'&&age<.035){c.fillStyle=`rgba(163,255,64,${(1-age/.035)*.24})`;c.fillRect(0,0,w,h);}
  }
  return {id:selected.id,index,count,isJoke};
 }

}
window.NDRealities=RealityPainter;
})();
