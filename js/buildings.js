// Edificios realistas: fachadas variadas con ventanas (algunas encendidas de noche), tiendas en planta baja, pretil y
// detalles en los tejados, letreros verticales en japonés, pantallas LED animadas, templos y la puerta Sangedatsumon de Zojoji
const NM={win:[],sign:[],led:[],ledT:[]};   // materiales que cambian de día a noche (los maneja env.js)
// Textura de fachada 256×256 = 4 ventanas × 4 plantas (14,4 m × 13,2 m). em: versión luminosa (ventanas encendidas al azar)
function facade(type,em){const r=rng(71+type*13+(em?5:0));return canvasTex(256,256,(g)=>{
 const lit=(x,y,w,h,p)=>{if(!em)return;if(r()<p){const warm=r()<.65;g.fillStyle=warm?`hsl(${34+r()*14},${70+r()*20}%,${62+r()*18}%)`:`hsl(${200+r()*20},40%,${78+r()*12}%)`;g.fillRect(x,y,w,h)}};
 if(em){g.fillStyle="#000";g.fillRect(0,0,256,256)}
 for(let f=0;f<4;f++)for(let c=0;c<4;c++){const x=c*64,y=f*64;
  if(type===0){if(!em){g.fillStyle="#c8cacd";g.fillRect(x,y,64,64);const gr=g.createLinearGradient(0,y+18,0,y+64);gr.addColorStop(0,"#6b8299");gr.addColorStop(1,"#3d4f63");g.fillStyle=gr;g.fillRect(x,y+18,64,46);g.fillStyle="#2b333c";g.fillRect(x,y+18,2,46);g.fillRect(x+32,y+18,2,46)}
   else{lit(x+2,y+20,30,42,.38);lit(x+34,y+20,30,42,.38)}}
  else if(type===1){if(!em){g.fillStyle="#e7e3da";g.fillRect(x,y,64,64);g.fillStyle="#3b4a5a";g.fillRect(x+8,y+6,48,36);g.fillStyle="#5e7084";g.fillRect(x+8,y+6,20,36);g.fillStyle="#cfcac0";g.fillRect(x+2,y+42,60,5);
    g.fillStyle="#a9aeb3";g.fillRect(x+2,y+47,60,2);for(let k=0;k<12;k++)g.fillRect(x+3+k*5,y+47,1.5,16);g.fillStyle="rgba(160,166,172,.35)";g.fillRect(x+2,y+49,60,14)}
   else lit(x+8,y+6,48,36,.45)}
  else if(type===2){if(!em){g.fillStyle="#b7a58c";g.fillRect(x,y,64,64);g.strokeStyle="rgba(90,75,60,.25)";for(let k=0;k<64;k+=8){g.beginPath();g.moveTo(x,y+k);g.lineTo(x+64,y+k);g.stroke()}
    for(const wx of[10,38]){g.fillStyle="#ddd8cc";g.fillRect(x+wx-2,y+14,20,30);g.fillStyle="#43525f";g.fillRect(x+wx,y+16,16,26)}if(r()<.3){g.fillStyle="#d9d9d4";g.fillRect(x+40,y+48,18,12)}}
   else{lit(x+10,y+16,16,26,.35);lit(x+38,y+16,16,26,.35)}}
  else{if(!em){const gr=g.createLinearGradient(0,y,0,y+64);gr.addColorStop(0,"#7c9cb5");gr.addColorStop(1,"#3f5d77");g.fillStyle=gr;g.fillRect(x,y,64,64);g.fillStyle="#2a3644";g.fillRect(x,y+60,64,4);g.fillRect(x,y,2,64);g.fillRect(x+32,y,1,64)}
   else lit(x+2,y+2,62,56,.3)}}},true)}
// Planta baja con tiendas: 4 locales por repetición (14,4 m × 4 m): toldo o letrero de color, escaparate o persiana
function shopTex(em){const r=rng(em?909:907);return canvasTex(256,64,(g)=>{if(em){g.fillStyle="#000";g.fillRect(0,0,256,64)}
 for(let c=0;c<4;c++){const x=c*64,hue=r()*360|0,shut=r()<.18;
  if(!em){g.fillStyle="#d8d4cc";g.fillRect(x,0,64,64);g.fillStyle=`hsl(${hue},65%,${45+r()*15}%)`;g.fillRect(x+2,2,60,12);g.fillStyle="#fff";g.fillRect(x+8,6,20+r()*20,4);
   if(shut){g.fillStyle="#8d9196";g.fillRect(x+4,16,56,46);g.fillStyle="#767a80";for(let k=18;k<62;k+=3)g.fillRect(x+4,k,56,1)}
   else{g.fillStyle="#26323d";g.fillRect(x+4,16,56,46);for(let k=0;k<5;k++){g.fillStyle=`hsl(${r()*360},40%,${40+r()*30}%)`;g.fillRect(x+8+r()*44,30+r()*24,4+r()*6,6+r()*10)}g.fillStyle="#9aa3ab";g.fillRect(x+31,16,2,46)}}
  else{if(r()<.7){g.fillStyle=`hsl(${hue},80%,70%)`;g.fillRect(x+2,2,60,12)}if(!shut){g.fillStyle=`hsl(${40+r()*20},70%,${65+r()*15}%)`;g.fillRect(x+4,16,56,46)}}}},true)}
// Letreros verticales japoneses (texto en vertical, colores de neón)
const SIGNS=[["ラーメン","#c8102e","#fff"],["カラオケ","#1a1a1a","#ffde00"],["居酒屋","#f4e9d0","#b3121d"],["焼肉","#111","#ff5a1f"],["寿司","#fff","#0b3d91"],["薬局","#0a7d3b","#fff"],["喫茶","#5a3220","#f6d9a8"],["ホテル","#3a1f6b","#ff7ad9"],["中華","#d61f26","#ffd23f"],["酒場","#0d2b4f","#7fd4ff"]];
function signTex(i){const[t,bg,fg]=SIGNS[i];return canvasTex(64,256,(g)=>{g.fillStyle=bg;g.fillRect(0,0,64,256);g.strokeStyle=fg;g.lineWidth=3;g.strokeRect(4,4,56,248);
 g.fillStyle=fg;g.font="bold 40px 'Yu Gothic','Meiryo','Hiragino Sans',sans-serif";g.textAlign="center";g.textBaseline="middle";const ch=[...t],s=232/ch.length;ch.forEach((c,k)=>g.fillText(c,32,14+s*(k+.5)))})}
// Pantallas LED: anuncios inventados que van cambiando (se redibujan desde env.js)
const ADS=[{bg:["#ff8fc8","#ffd1e8"],t:"さくらソーダ",s:"SAKURA SODA",fg:"#7a0f45"},{bg:["#1b0f3a","#5b1fa8"],t:"アニメ祭",s:"ANIME FES 2026",fg:"#ffe55c"},{bg:["#0f1720","#e5173f"],t:"東京ドライブ",s:"TOKYO DRIVE",fg:"#fff"},{bg:["#ffcf2e","#ff7a00"],t:"一番ラーメン",s:"NEON RAMEN",fg:"#3a1200"},{bg:["#04293a","#00a6c8"],t:"超セール",s:"50% OFF",fg:"#fff"}];
function drawAd(g,w,h,tm,ph){const n=ADS.length,k=Math.floor(tm/5+ph)%n,a=ADS[k],f=(tm/5+ph)%1,gr=g.createLinearGradient(0,0,w,h);gr.addColorStop(0,a.bg[0]);gr.addColorStop(1,a.bg[1]);g.fillStyle=gr;g.fillRect(0,0,w,h);
 g.globalAlpha=.25;g.fillStyle="#fff";for(let i=0;i<6;i++){const x=((tm*40+i*70)%(w+80))-40;g.beginPath();g.arc(x,h*.25+Math.sin(tm*2+i)*20,10+i*3,0,7);g.fill()}g.globalAlpha=1;
 if(k===1){g.fillStyle="#ffe0c8";g.beginPath();g.arc(w*.2,h*.55,h*.28,0,7);g.fill();g.fillStyle="#2a1650";for(const ex of[-.08,.08]){g.beginPath();g.ellipse(w*(.2+ex),h*.52,9,13,0,0,7);g.fill()}g.fillStyle="#ff4fa3";g.fillRect(w*.08,h*.2,w*.24,h*.12)}
 g.fillStyle=a.fg;g.textAlign="center";g.textBaseline="middle";g.font="bold 46px 'Yu Gothic','Meiryo',sans-serif";g.fillText(a.t,w*(k===1?.62:.5),h*.42+Math.sin(tm*3)*3);
 g.font="bold 24px system-ui";g.fillText(a.s,w*(k===1?.62:.5),h*.75);g.fillStyle=`rgba(255,255,255,${(1-Math.abs(f-.5)*2)*.0})`;
 if(f>.92){g.fillStyle=`rgba(0,0,0,${(f-.92)/.08})`;g.fillRect(0,0,w,h)}}

const BCOL=[0xe6e2d8,0xd4d4d0,0xcfc6b4,0xb9b6ae,0xa9b1ba,0xe2dccd,0x9a958c,0xc4bfb2];
// Rectángulo orientado mínimo de una planta (para templos y puerta)
function obb(R){let best=null;for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,a=Math.atan2(R[j+1]-R[i+1],R[j]-R[i]),c=Math.cos(a),s=Math.sin(a);let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
 for(let k=0;k<R.length;k+=2){const u=R[k]*c+R[k+1]*s,v=-R[k]*s+R[k+1]*c;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)}
 const A=(u1-u0)*(v1-v0);if(!best||A<best.A){const uc=(u0+u1)/2,vc=(v0+v1)/2;best={A,a,cx:uc*c-vc*s,cz:uc*s+vc*c,hu:(u1-u0)/2,hv:(v1-v0)/2}}}return best}

function buildBuildings(){const CH=500,ch=new Map(),c=new THREE.Color(),R0=rng(3);
 const mats=[0,1,2,3].map(t=>{const m=t===3?new THREE.MeshPhongMaterial({map:facade(3),emissiveMap:facade(3,1),emissive:0xffffff,emissiveIntensity:0,vertexColors:true,envMap:SKYCUBE,reflectivity:.45,shininess:90,specular:0x8899aa})
  :new THREE.MeshLambertMaterial({map:facade(t),emissiveMap:facade(t,1),emissive:0xffffff,emissiveIntensity:0,vertexColors:true});NM.win.push(m);return m});
 const shopM=new THREE.MeshLambertMaterial({map:shopTex(),emissiveMap:shopTex(1),emissive:0xffffff,emissiveIntensity:0,vertexColors:true});NM.win.push(shopM);
 const get=k=>{let o=ch.get(k);if(!o){o={f:[0,1,2,3,4].map(()=>({p:[],n:[],u:[],c:[]})),r:{p:[],c:[]}};ch.set(k,o)}return o};
 const wall=(s,ax,az,bx,bz,y0,y1,u0,u1,v0,v1,nx,nz,col)=>{s.p.push(ax,y0,az,bx,y1,bz,bx,y0,bz,ax,y0,az,ax,y1,az,bx,y1,bz);s.u.push(u0,v0,u1,v1,u1,v0,u0,v0,u0,v1,u1,v1);for(let k=0;k<6;k++){s.n.push(nx,0,nz);s.c.push(col.r,col.g,col.b)}};
 const roofT=[],tank=[],ant=[],vs=SIGNS.map(()=>[]),leds=[[],[],[]];
 MAP.buildings.forEach((b,bi)=>{if(b.k===1||b.k===3){temple(b);return}
  let R=b.p,A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];
  if(A<0){const q=new Float32Array(R.length);for(let i=0;i<R.length;i+=2){q[i]=R[R.length-2-i];q[i+1]=R[R.length-1-i]}R=q}A=Math.abs(A)/2;
  let cx=0,cz=0;for(let i=0;i<R.length;i+=2){cx+=R[i];cz+=R[i+1]}cx/=R.length/2;cz/=R.length/2;
  const o=get(Math.floor(cx/CH)*100+Math.floor(cz/CH)),h=b.h,r=R0(),ft=b.k===2;
  const type=ft?3:h>70?3:h>25?(r<.65?0:r<.85?1:3):(r<.5?1:r<.85?2:0),s=o.f[type],uo=R0(),vo=Math.floor(R0()*4)/4;
  c.set(type===3?0xffffff:b.c!==undefined?b.c:BCOL[bi%BCOL.length]);const sc2=new THREE.Color(1,1,1);
  let per=0;for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,ax=R[i],az=R[i+1],bx=R[j],bz=R[j+1],L=Math.hypot(bx-ax,bz-az);if(L<.05)continue;const nx=(bz-az)/L,nz=-(bx-ax)/L,u0=per/14.4+uo,u1=(per+L)/14.4+uo;per+=L;
   const mx=(ax+bx)/2,mz=(az+bz)/2,shop=!ft&&h<70&&L>4&&(roadAt(mx+nx*4.5,mz+nz*4.5)>=0||roadAt(mx+nx*8,mz+nz*8)>=0);
   if(shop){wall(o.f[4],ax,az,bx,bz,0,4,u0,u1,0,1,nx,nz,sc2);wall(s,ax,az,bx,bz,4,h,u0,u1,vo+4/13.2,vo+h/13.2,nx,nz,c);
    // Letrero vertical perpendicular a la fachada y, en edificios altos, alguna pantalla LED
    if(h>8&&h<60&&R0()<.45){const t=.15+R0()*.7,sh=Math.min(9,h-5);vs[Math.floor(R0()*SIGNS.length)].push([ax+(bx-ax)*t+nx*.75,4.6,az+(bz-az)*t+nz*.75,Math.atan2(nx,nz)+PI/2,1,sh])}
    if(h>25&&L>13&&R0()<.18&&leds.flat().length<40)leds[Math.floor(R0()*3)].push([mx+nx*.35,Math.min(h-4,22),mz+nz*.35,Math.atan2(nx,nz)])}
   else wall(s,ax,az,bx,bz,0,h,u0,u1,vo,vo+h/13.2,nx,nz,c)}
  // Tejado con pretil (los edificios bajos y medianos) y detalles: aire acondicionado, depósitos de agua, antenas
  const rc=new THREE.Color(ft?0xd9dde2:0x8c8f94).offsetHSL(0,0,(bi%5-2)*.025),n0=o.r.p.length;polyFill(o.r.p,R,h);
  if(h<90&&!ft)for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length;o.r.p.push(R[i],h,R[i+1],R[j],h+.9,R[j+1],R[j],h,R[j+1],R[i],h,R[i+1],R[i],h+.9,R[i+1],R[j],h+.9,R[j+1])}
  for(let k=n0;k<o.r.p.length;k+=3)o.r.c.push(rc.r,rc.g,rc.b);
  if(A>50&&h<120&&!ft){const bb=[1e9,1e9,-1e9,-1e9];for(let i=0;i<R.length;i+=2){bb[0]=Math.min(bb[0],R[i]);bb[1]=Math.min(bb[1],R[i+1]);bb[2]=Math.max(bb[2],R[i]);bb[3]=Math.max(bb[3],R[i+1])}
   const n=Math.min(7,A/120|0)+1;for(let k=0;k<n*3&&k<20;k++){const x=bb[0]+R0()*(bb[2]-bb[0]),z=bb[1]+R0()*(bb[3]-bb[1]);if(!inPoly(R,x,z)||!inPoly(R,x+1.2,z)||!inPoly(R,x-1.2,z)||!inPoly(R,x,z+1.2)||!inPoly(R,x,z-1.2))continue;
    const q=R0();if(q<.7)roofT.push([x,h,z,R0()*PI]);else if(q<.85&&A>150)tank.push([x,h,z]);else ant.push([x,h,z]);if(roofT.length>9000)break}}});
 for(const o of ch.values()){o.f.forEach((s,t)=>s.p.length&&mkMesh(s.p,t===4?shopM:mats[t],0,{normal:s.n,uv:s.u,color:s.c},2));
  if(o.r.p.length)mkMesh(o.r.p,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide}),0,{color:o.r.c},2)}
 const gm=new THREE.MeshLambertMaterial({color:0xc9cbcc});
 inst(new THREE.BoxGeometry(1.2,.8,.8).translate(0,.4,0),gm,roofT,1);inst(new THREE.CylinderGeometry(1.1,1.1,2.4,10).translate(0,2.4,0),new THREE.MeshLambertMaterial({color:0x9db0bf}),tank,1,true);
 inst(new THREE.CylinderGeometry(.04,.06,5,4).translate(0,2.5,0),new THREE.MeshLambertMaterial({color:0x777b80}),ant,2);
 vs.forEach((l,i)=>{const t=signTex(i),m=new THREE.MeshLambertMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.15,side:THREE.DoubleSide});NM.sign.push(m);inst(new THREE.PlaneGeometry(1.1,1).translate(0,.5,0),m,l,0)});
 leds.forEach((l,i)=>{const cv=document.createElement("canvas");cv.width=320;cv.height=180;const t=new THREE.CanvasTexture(cv),m=new THREE.MeshBasicMaterial({map:t,toneMapped:false});
  NM.led.push({g:cv.getContext("2d"),t,ph:i*1.7});NM.ledT.push(m);inst(new THREE.PlaneGeometry(10,5.6).translate(0,0,.05),m,l,0);
  inst(new THREE.BoxGeometry(10.6,6.2,.3),new THREE.MeshLambertMaterial({color:0x222428}),l,0)})}

// Templos (tejado a cuatro aguas con alero grande, muros blancos con pilares rojos sobre plataforma de piedra) y puerta de dos pisos
const TMAT={};
function temple(b){if(!TMAT.wall){TMAT.wall=new THREE.MeshLambertMaterial({map:canvasTex(128,64,(g)=>{g.fillStyle="#efe9dc";g.fillRect(0,0,128,64);g.fillStyle="#b8321f";for(const x of[0,40,84,124])g.fillRect(x,0,6,64);g.fillRect(0,0,128,9);g.fillRect(0,40,128,4);g.fillStyle="#3a2a20";g.fillRect(52,22,24,42)},true)});
  TMAT.red=new THREE.MeshLambertMaterial({color:0xc23f28});TMAT.roof=new THREE.MeshLambertMaterial({color:0x3d4646,side:THREE.DoubleSide});TMAT.stone=new THREE.MeshLambertMaterial({color:0x9e9a92})}
 const o=obb(b.p),gate=b.k===3;let a=o.a,hu=o.hu,hv=o.hv;if(hv>hu){const t=hu;hu=hv;hv=t;a+=PI/2}
 const grp=new THREE.Group();grp.position.set(o.cx,CURB,o.cz);grp.rotation.y=-a;sc.add(grp);
 const box=(sx,sy,sz,y,m)=>{const me=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),m);me.position.y=y+sy/2;me.castShadow=me.receiveShadow=true;grp.add(me);return me};
 // Tejado a cuatro aguas: alero rectangular (con las esquinas algo levantadas) y cumbrera centrada
 const hip=(eu,ev,y,rh)=>{const k=Math.max(0,eu-ev),p=[[-eu,-ev],[eu,-ev],[eu,ev],[-eu,ev]],up=.5,v=[];
  const E=i=>[p[i][0],y+up,p[i][1]],T=s=>[s*k,y+rh,0],tri=(A,B,C)=>v.push(...A,...B,...C);
  tri(E(0),E(1),T(1));tri(E(0),T(1),T(-1));tri(E(2),E(3),T(-1));tri(E(2),T(-1),T(1));tri(E(1),E(2),T(1));tri(E(3),E(0),T(-1));
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(v,3));g.computeVertexNormals();const me=new THREE.Mesh(g,TMAT.roof);me.castShadow=true;grp.add(me);
  box(2*k+.6,.6,.8,y+rh-.1,TMAT.roof)};
 if(!gate){const ph=Math.min(1.4,hv*.08),wh=Math.max(3.5,Math.min(9,b.h*.55)),ov=Math.min(3.5,hv*.22);
  box(2*hu+1,ph,2*hv+1,0,TMAT.stone);box(2*hu*.9,wh,2*hv*.9,ph,TMAT.wall);hip(hu+ov,hv+ov,ph+wh,(hv+ov)*.75)}
 else{box(2*hu,7,2*hv,0,TMAT.red);hip(hu+1.6,hv+1.6,7,2.2);box(2*hu*.86,4.5,2*hv*.75,8.6,TMAT.red);hip(hu+1.8,hv+1.8,13,(hv+1.8)*.8)}}
