/* 904° Nondescript Door — dependency-free WebGL cinematic / Canvas2D fallback. */
(()=>{'use strict';
const rand=(i)=>{const x=Math.sin(i*127.1+34.17)*43758.5453123;return x-Math.floor(x)};
const quadV=`attribute vec2 aPos;varying vec2 uv;void main(){uv=aPos*.5+.5;gl_Position=vec4(aPos,0.,1.);}`;
const quadF=`precision highp float;varying vec2 uv;uniform float T;uniform float POWER;uniform float ASPECT;uniform float PLAID;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
void main(){
  vec2 p=(uv-.5)*vec2(ASPECT,1.);float r=length(p)+.0001;float a=atan(p.y,p.x);float depth=1./(r+.19);float intensity=POWER;
  float twist=.27*sin(a*3.-T*.36+depth*1.35);
  float rings=pow(max(0.,cos(depth*6.1-T*(1.05+intensity*2.0)+twist)),19.);
  float breaks=smoothstep(-.55,.3,sin(a*8.4+depth*1.15-T*.24));
  rings*=breaks*smoothstep(.11,.37,r);
  float ribbon=pow(max(0.,cos(a*3.3+depth*.93-T*.19+sin(depth*1.9)*.45)),18.)*smoothstep(.26,.8,r);
  float wall=pow(max(0.,sin(depth*2.45+T*.75+a*2.)),5.)*smoothstep(.28,.9,r);
  float arc=pow(max(0.,sin(a*18.+sin(depth*5.-T*2.)*3.+T*.3)),45.);
  arc*=pow(max(0.,sin(depth*7.8+T*2.1+sin(a*5.))),5.)*smoothstep(.33,.8,r)*( .2+intensity*.9 );
  float glow=exp(-r*4.5)*( .09+intensity*.08 );
  vec3 col=vec3(.008,.016,.009)+vec3(.012,.035,.016)*(depth*.08);
  col+=vec3(.10,.27,.046)*(ribbon*.75+wall*.12)+vec3(.32,.84,.12)*(rings*.72+arc*.85);
  col+=vec3(.60,1.,.34)*ribbon*.11+vec3(.07,.16,.05)*glow;
  col+=vec3(.035,.05,.055)*(1.-smoothstep(.15,1.65,r));
  float x=(p.x/(.2+depth*.11))*20.0+T*13.0;float y=(p.y/(.2+depth*.11))*22.0-T*11.0;
  float gx=1.-smoothstep(.02,.19,abs(sin(x)));float gy=1.-smoothstep(.02,.19,abs(sin(y)));
  float wx=1.-smoothstep(.08,.28,abs(sin(x*.35+.8)));float wy=1.-smoothstep(.08,.28,abs(sin(y*.35+.4)));
  vec3 plaidColor=vec3(.008,.014,.008)+vec3(.52,1.,.12)*clamp(gx*.94+gy*.94+wx*.28+wy*.28,0.,1.);
  plaidColor+=vec3(.05,.12,.015)*pow(max(0.,cos(x*.22)*cos(y*.2)),3.);
  col=mix(col,plaidColor,PLAID);
  col*=1.-smoothstep(.85,1.54,r)*.45;
  gl_FragColor=vec4(col,1.);
}`;
const starV=`attribute vec4 aStar;uniform float DIST;uniform float ASPECT;uniform float SPEED;varying float B;void main(){float z=fract(aStar.z-DIST);float tail=aStar.w;float delta=(.005+SPEED*.055)*tail;float zz=clamp(z+delta,.02,1.);vec2 xy=aStar.xy*(.29/(zz+.15));gl_Position=vec4(xy.x/ASPECT,xy.y,0.,1.);gl_PointSize=clamp((1.5+SPEED*2.5)/(zz+.27),1.,8.);B=pow(1.-zz,1.3)*(1.-tail*.5);}`;
const starF=`precision mediump float;varying float B;uniform float STRENGTH;void main(){gl_FragColor=vec4(.75,.94,1.,B*STRENGTH);}`;
function compile(gl,type,code){const s=gl.createShader(type);gl.shaderSource(s,code);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error('Shader compilation: '+gl.getShaderInfoLog(s));return s;}
function program(gl,v,f){const p=gl.createProgram();gl.attachShader(p,compile(gl,gl.VERTEX_SHADER,v));gl.attachShader(p,compile(gl,gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error('Shader link: '+gl.getProgramInfoLog(p));return p;}
class WarpRenderer{
 constructor(canvas,onError,reduced){this.canvas=canvas;this.onError=onError;this.reduced=reduced;this.gl=null;this.ctx=null;this.quality=1;this.sampleAt=0;this.frames=0;this.lastSample=0;this.is2d=false;this.width=1;this.height=1;this.pixelRatio=1;this.maxStars=window.innerWidth<750?800:1600;this.isLost=false;this.stars=[];}
 init(){if(this.reduced){this.fallback();return '2d';}
  let gl;try{gl=this.canvas.getContext('webgl',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance'});if(!gl)throw Error('WebGL unavailable');this.gl=gl;this.initGL();this.canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();this.isLost=true;this.onError(new Error('Graphics context lost'));});this.canvas.addEventListener('webglcontextrestored',()=>{if(!this.isLost)return;});}catch(e){this.gl=null;const fresh=this.canvas.cloneNode(false);this.canvas.replaceWith(fresh);this.canvas=fresh;this.fallback();return '2d';}
 this.resize();return 'webgl';}
 initGL(){const gl=this.gl;this.bgP=program(gl,quadV,quadF);this.starP=program(gl,starV,starF);this.bgLoc={a:gl.getAttribLocation(this.bgP,'aPos'),t:gl.getUniformLocation(this.bgP,'T'),power:gl.getUniformLocation(this.bgP,'POWER'),aspect:gl.getUniformLocation(this.bgP,'ASPECT'),plaid:gl.getUniformLocation(this.bgP,'PLAID')};this.starLoc={a:gl.getAttribLocation(this.starP,'aStar'),dist:gl.getUniformLocation(this.starP,'DIST'),aspect:gl.getUniformLocation(this.starP,'ASPECT'),speed:gl.getUniformLocation(this.starP,'SPEED'),strength:gl.getUniformLocation(this.starP,'STRENGTH')};this.quad=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);let verts=[];for(let i=0;i<this.maxStars;i++){const ang=rand(i*7+4)*6.283;const dist=Math.sqrt(rand(i*7+5))*3.25+.2;const x=Math.cos(ang)*dist,y=Math.sin(ang)*dist,z=.025+rand(i*7+6)*.95;verts.push(x,y,z,0,x,y,z,1);}this.starBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,this.starBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW);gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);}
 fallback(){this.is2d=true;const ctx=this.canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas 2D unavailable');this.ctx=ctx;this.stars=Array.from({length:550},(_,i)=>({x:rand(i*5+1)*2-1,y:rand(i*5+2)*2-1,z:rand(i*5+3),size:rand(i*5+4)*1.6+.5}));this.resize();}
 resize(){this.width=Math.max(1,window.innerWidth);this.height=Math.max(1,window.innerHeight);this.pixelRatio=Math.min(window.devicePixelRatio||1,1.7);this.applyResolution();}
 applyResolution(){const scale=this.pixelRatio*this.quality;this.canvas.width=Math.max(1,Math.round(this.width*scale));this.canvas.height=Math.max(1,Math.round(this.height*scale));if(this.gl)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);}
 tune(ts){if(!this.lastSample)this.lastSample=ts;this.frames++;if(ts-this.lastSample<1900)return;const fps=this.frames/((ts-this.lastSample)/1000);this.frames=0;this.lastSample=ts;let quality=this.quality;if(fps<28&&this.quality>.55)quality=Math.max(.55,this.quality-.12);if(fps>52&&this.quality<1)quality=Math.min(1,this.quality+.045);if(Math.abs(quality-this.quality)>.02){this.quality=quality;this.applyResolution();}}
 draw(t,ts){if(t>=8)return;if(this.isLost)return;this.tune(ts);if(this.gl)this.drawGL(t);else this.draw2d(t);}
 drawGL(t){const gl=this.gl,speed=Math.min(1,Math.pow(Math.max(0,t)/7,1.25)),plaid=t>=6?Math.min(1,(t-6)*3):0;gl.disable(gl.BLEND);gl.useProgram(this.bgP);gl.bindBuffer(gl.ARRAY_BUFFER,this.quad);gl.enableVertexAttribArray(this.bgLoc.a);gl.vertexAttribPointer(this.bgLoc.a,2,gl.FLOAT,false,0,0);gl.uniform1f(this.bgLoc.t,t);gl.uniform1f(this.bgLoc.power,speed);gl.uniform1f(this.bgLoc.aspect,this.width/this.height);gl.uniform1f(this.bgLoc.plaid,plaid);gl.drawArrays(gl.TRIANGLES,0,6);gl.enable(gl.BLEND);gl.useProgram(this.starP);gl.bindBuffer(gl.ARRAY_BUFFER,this.starBuffer);gl.enableVertexAttribArray(this.starLoc.a);gl.vertexAttribPointer(this.starLoc.a,4,gl.FLOAT,false,0,0);gl.uniform1f(this.starLoc.dist,t*.035+t*t*.045);gl.uniform1f(this.starLoc.aspect,this.width/this.height);gl.uniform1f(this.starLoc.speed,speed);gl.uniform1f(this.starLoc.strength,1.-plaid*.65);gl.lineWidth(1);gl.drawArrays(gl.LINES,0,Math.max(140,Math.floor(this.maxStars*this.quality))*2);}
 draw2d(t){const c=this.ctx,w=this.canvas.width,h=this.canvas.height;const x=w/2,y=h/2;const p=Math.min(1,t/6),plaid=t>=6;const g=c.createRadialGradient(x,y,20,x,y,Math.max(w,h)*.75);g.addColorStop(0,'#010501');g.addColorStop(.43,'#06150b');g.addColorStop(1,'#010301');c.fillStyle=g;c.fillRect(0,0,w,h);
 if(this.reduced){c.save();c.globalAlpha=.25;c.strokeStyle='#a3ff40';c.lineWidth=2;for(let k=0;k<4;k++){c.beginPath();c.ellipse(x,y,w*(.08+k*.1),h*(.08+k*.1),t*.015,0,Math.PI*2);c.stroke();}c.restore();return;}
 const dist=t*.08+t*t*.04;const s=Math.min(w,h);for(const v of this.stars.slice(0,Math.floor(this.stars.length*this.quality))){const zz=((v.z-dist)%1+1)%1;const size=.12/(zz+.045);const px=x+v.x*s*size,py=y+v.y*s*size;if(px<-30||px>w+30||py<-30||py>h+30)continue;const l=2+p*24/(zz+.2);c.strokeStyle=`rgba(212,246,255,${Math.min(.95,(1-zz)*.95)*(plaid?.3:1)})`;c.lineWidth=v.size*this.pixelRatio;c.beginPath();c.moveTo(px,py);c.lineTo(px+(px-x)*l/200,py+(py-y)*l/200);c.stroke();}
 c.save();c.translate(x,y);c.rotate(t*.11);for(let i=0;i<7;i++){const z=((i/7+dist*.2)%1);const rx=(z+.05)*w*.63,ry=(z+.05)*h*.68;c.beginPath();c.ellipse(0,0,rx,ry,Math.sin(t*.16+i)*.1,-Math.PI*.15,Math.PI*1.55);c.lineWidth=(1+p*3)*this.pixelRatio;c.setLineDash([22*this.pixelRatio,12*this.pixelRatio,36*this.pixelRatio,20*this.pixelRatio]);c.strokeStyle=`rgba(163,255,64,${(.17+p*.29)*(1-z)})`;c.shadowColor='#a3ff40';c.shadowBlur=18*this.pixelRatio;c.stroke();}c.restore();c.setLineDash([]);c.shadowBlur=0;
 // Side-wall plasma ribbons and irregular branching electrical arcs also exist in 2D fallback.
 for(const side of [-1,1]){const phase=t*.18+side*1.4;const xx=x+side*w*(.34+Math.sin(phase)*.035);c.save();c.shadowColor='#a3ff40';c.shadowBlur=15*this.pixelRatio;c.strokeStyle=`rgba(163,255,64,${.2+p*.43})`;c.lineWidth=(1.5+p*2.5)*this.pixelRatio;c.beginPath();c.moveTo(xx-side*w*.09,-30);c.bezierCurveTo(xx+side*w*.12,h*.2,xx-side*w*.08,h*.56,xx+side*w*.04,h+30);c.stroke();if(p>.3){c.strokeStyle=`rgba(206,255,160,${.25+p*.55})`;c.lineWidth=(.7+p*1.1)*this.pixelRatio;c.beginPath();for(let k=0;k<11;k++){const yy=k/10*h;const zig=side*(w*(.03+.02*Math.sin(k*12+t*7))+Math.sin(k*20+t*23)*w*.01);const px=xx+zig;if(k===0)c.moveTo(px,yy);else c.lineTo(px,yy);}c.stroke();}c.restore();}
 if(plaid){c.globalAlpha=Math.min(1,(t-6)*3);c.fillStyle='#050605ee';c.fillRect(0,0,w,h);c.lineWidth=3*this.pixelRatio;c.strokeStyle='#a3ff40';const interval=Math.max(20,Math.min(w,h)*.055);for(let i=-2;i<w/interval+2;i++){const xx=((i*interval+(t-6)*200)%w);c.beginPath();c.moveTo(xx,0);c.lineTo(xx,h);c.stroke();}for(let i=-2;i<h/interval+2;i++){const yy=((i*interval+(t-6)*170)%h);c.beginPath();c.moveTo(0,yy);c.lineTo(w,yy);c.stroke();}c.globalAlpha=1;}}
 destroy(){if(this.gl){const g=this.gl;try{g.deleteBuffer(this.quad);g.deleteBuffer(this.starBuffer);g.deleteProgram(this.bgP);g.deleteProgram(this.starP);}catch(_){}}}
}
window.NDRenderer=WarpRenderer;
})();
