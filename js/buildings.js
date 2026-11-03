// Edificios realistas: fachadas variadas con ventanas (algunas encendidas de noche), tiendas en planta baja, pretil y
// detalles en los tejados, letreros verticales en japonés, pantallas LED animadas, templos y la puerta Sangedatsumon de Zojoji
const NM={win:[],sign:[],led:[],ledT:[],int:[]};   // materiales que cambian de día a noche (los maneja env.js)
// Textura de fachada 256×256 = 4 ventanas × 4 plantas (14,4 m × 13,2 m). mask: blanco donde hay cristal (para el interior)
function facade(type,mask){const r=rng(71+type*13);return canvasTex(256,256,(g)=>{
 const glass=(x,y,w,h,col)=>{g.fillStyle=mask?"#fff":col;g.fillRect(x,y,w,h)};if(mask){g.fillStyle="#000";g.fillRect(0,0,256,256)}
 for(let f=0;f<4;f++)for(let c=0;c<4;c++){const x=c*64,y=f*64;
  if(type===0){if(!mask){g.fillStyle="#c8cacd";g.fillRect(x,y,64,64);g.fillStyle="#b5b8bc";g.fillRect(x,y+14,64,3)}glass(x+3,y+19,28,44,"#3d4f63");glass(x+35,y+19,28,44,"#3d4f63")}
  else if(type===1){if(!mask){g.fillStyle="#e7e3da";g.fillRect(x,y,64,64);g.fillStyle="#cfcac0";g.fillRect(x+2,y+42,60,5)}glass(x+9,y+7,22,34,"#3b4a5a");glass(x+33,y+7,22,34,"#3b4a5a");
   if(!mask){g.fillStyle="#d6d1c8";g.fillRect(x+31,y+7,2,34);g.fillStyle="#a9aeb3";g.fillRect(x+2,y+47,60,2);for(let k=0;k<12;k++)g.fillRect(x+3+k*5,y+47,1.5,16);g.fillStyle="rgba(160,166,172,.4)";g.fillRect(x+2,y+49,60,14)}}
  else if(type===2){if(!mask){g.fillStyle="#b7a58c";g.fillRect(x,y,64,64);g.strokeStyle="rgba(90,75,60,.25)";for(let k=0;k<64;k+=8){g.beginPath();g.moveTo(x,y+k);g.lineTo(x+64,y+k);g.stroke()}for(const wx of[10,38]){g.fillStyle="#ddd8cc";g.fillRect(x+wx-2,y+14,20,30)}}
   for(const wx of[10,38])glass(x+wx,y+16,16,26,"#43525f");if(!mask&&r()<.3){g.fillStyle="#d9d9d4";g.fillRect(x+40,y+48,18,12)}}
  else{glass(x,y,64,64,"#3f5d77");if(!mask){g.fillStyle="#2a3644";g.fillRect(x,y+60,64,4);g.fillRect(x,y,2,64);g.fillRect(x+32,y,1,64)}else{g.fillStyle="#000";g.fillRect(x,y+60,64,4);g.fillRect(x,y,2,64);g.fillRect(x+32,y,1,64)}}}},true)}
// Planta baja con tiendas: 4 locales por repetición (14,4 m × 4 m): letrero de color sobre el escaparate, o persiana bajada
// Tres juegos de 4 locales (cada edificio usa uno): letrero con el nombre, escaparate con puerta y marcos, noren (cortina) en los
// restaurantes y alguna persiana bajada. Textura a 4 px/m más fina (512×128)
const SHOPKIND=[["ラーメン","#c8102e","#fff",1],["花屋","#2f8f4e","#fff",0],["カフェ","#5a3a28","#f6e2c0",0],["薬局","#1d63b8","#fff",0],["パン","#e08a1e","#fff",0],["書店","#22313f","#f4d35e",0],
 ["寿司","#f4efe4","#1d3c78",1],["居酒屋","#3a1f14","#ffb347",1],["服","#111","#fff",0],["眼鏡","#ececec","#c8102e",0],["そば","#26402a","#f1e6c8",1],["百円","#ffd400","#d0021b",0]];
const SHOPS=(()=>{const r=rng(907);return[0,1,2].map(v=>[0,1,2,3].map(c=>({k:SHOPKIND[(v*4+c)%SHOPKIND.length],shut:r()<.12,hue:r()*360|0})))})();
function shopTex(mask,v){v=v||0;return canvasTex(512,128,(g)=>{g.scale(2,2);if(mask){g.fillStyle="#000";g.fillRect(0,0,256,64)}
 SHOPS[v].forEach((s,c)=>{const x=c*64,[name,bg,fg,noren]=s.k;if(mask){if(!s.shut){g.fillStyle="#fff";g.fillRect(x+5,17,54,40);if(noren){g.fillStyle="#000";g.fillRect(x+5,17,54,11)}}return}
  g.fillStyle="#cfcac0";g.fillRect(x,0,64,64);g.fillStyle="#b9b3a8";g.fillRect(x,0,3,64);g.fillRect(x+61,0,3,64);
  // Letrero
  g.fillStyle=bg;g.fillRect(x+3,2,58,12);g.strokeStyle="rgba(0,0,0,.35)";g.lineWidth=1;g.strokeRect(x+3.5,2.5,57,11);g.fillStyle=fg;g.font="bold 9px 'Yu Gothic','Meiryo',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText(name,x+32,8.5);
  g.fillStyle="#6d6a66";g.fillRect(x+3,15,58,2);
  if(s.shut){g.fillStyle="#8d9196";g.fillRect(x+5,17,54,44);g.fillStyle="#767a80";for(let k=19;k<61;k+=3)g.fillRect(x+5,k,54,1);return}
  // Escaparate: cristal, marco metálico, puerta de dos hojas con tirador y zócalo
  g.fillStyle="#26323d";g.fillRect(x+5,17,54,40);g.fillStyle="#8e979f";g.fillRect(x+4,16,56,1.5);g.fillRect(x+4,16,1.5,45);g.fillRect(x+58.5,16,1.5,45);g.fillRect(x+22,17,1.2,44);g.fillRect(x+40.8,17,1.2,44);g.fillRect(x+31.4,17,1.2,44);
  g.fillStyle="#3b3d42";g.fillRect(x+4,57,56,4);g.fillStyle="#d8dde2";g.fillRect(x+29.5,36,1,6);g.fillRect(x+33.5,36,1,6);
  if(noren){for(let k=0;k<5;k++){g.fillStyle=k%2?bg:bg;g.fillRect(x+6+k*10.6,17,9.6,11);}g.fillStyle=fg;g.font="bold 7px 'Yu Gothic',sans-serif";g.fillText(name[0],x+32,23)}})},true)}
// Planta baja de konbini: banda blanca con franjas verde y azul y un gran escaparate de cristal
function konTex(mask){return canvasTex(256,64,(g)=>{if(mask){g.fillStyle="#000";g.fillRect(0,0,256,64);g.fillStyle="#fff";for(let c=0;c<4;c++)g.fillRect(c*64+2,18,60,44);return}
 g.fillStyle="#f4f4f2";g.fillRect(0,0,256,64);g.fillStyle="#1f9a4a";g.fillRect(0,8,256,4);g.fillStyle="#1d5fb8";g.fillRect(0,12,256,4);g.fillStyle="#cfd3d6";for(let c=0;c<5;c++)g.fillRect(c*64-1,16,3,48)},true)}
// Interior de las ventanas ("interior mapping"): cada ventana muestra una habitación con profundidad (pared del fondo, suelo, techo,
// muebles y cortinas) y el cristal refleja el cielo según el ángulo. De noche solo algunas habitaciones tienen la luz encendida
// uShop: 0 ventanas de pisos y oficinas · 1 tienda (estanterías con productos, mostrador, luces en el techo) · 2 konbini (pasillos de
// estanterías, neveras iluminadas al fondo, revistas junto al cristal, techo muy blanco). Las ventanas están hundidas en la pared:
// según el ángulo se ve el lateral del hueco (o.rec metros de profundidad), así la fachada no parece plana.
// La posición de la cámara va en uCamP: three.js no le pasa cameraPosition a los materiales Lambert
function interior(mat,o){const sh0=o.shop||0;mat.onBeforeCompile=sh=>{Object.assign(sh.uniforms,{wMask:{value:o.mask},uNight:{value:0},uSkyT:{value:new THREE.Color()},uSkyH:{value:new THREE.Color()},
  uRoom:{value:new THREE.Vector4(o.rw,o.rh,o.depth,o.lit)},uShop:{value:sh0},uCells:{value:new THREE.Vector2(4,sh0?1:4)},uRec:{value:new THREE.Vector3(o.rec||0,14.4,sh0?4:13.2)},uCamP:{value:cam.position}});mat.userData.sh=sh;
 sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vWP;varying vec3 vWN;").replace("#include <begin_vertex>","#include <begin_vertex>\nvWP=(modelMatrix*vec4(transformed,1.)).xyz;vWN=normalize(mat3(modelMatrix)*objectNormal);");
 sh.fragmentShader=sh.fragmentShader.replace("#include <common>",`#include <common>
uniform sampler2D wMask;uniform float uNight,uShop;uniform vec3 uSkyT,uSkyH,uRec,uCamP;uniform vec4 uRoom;uniform vec2 uCells;varying vec3 vWP;varying vec3 vWN;
float hR(vec2 p){return fract(sin(dot(p,vec2(41.3,289.1)))*15731.743);}`).replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
 if(texture2D(wMask,vUv).r>.5){
  // De lejos (más de 300 m) versión barata sin habitación ni hueco: cristal con la luz encendida o apagada de cada ventana
  if(length(vWP-uCamP)>300.){vec2 id=floor(vUv*uCells);float r1=hR(id+vec2(3.7,11.1)),r2=hR(id*1.37+vec2(8.3,1.9)),lit=step(r1,uRoom.w)+min(uShop,1.);
   vec3 c0=mix(vec3(.3,.32,.34),vec3(.6,.56,.5),r2),inner=c0*(uShop>.5?.8:.25)*(1.-uNight)+c0*vec3(1.,.86,.64)*min(1.,lit)*uNight*(uShop>.5?1.5:1.05);
   diffuseColor.rgb*=.12;totalEmissiveRadiance+=mix(inner,mix(uSkyH,uSkyT,.5)*(1.-uNight*.85),.3);}
  else{vec3 N=normalize(vWN),T=normalize(cross(N,vec3(0.,1.,0.))),V=normalize(vWP-uCamP);float vn=max(.08,-dot(V,N));
  vec2 uvG=vUv+vec2(-dot(V,T),V.y)*uRec.x/vn/uRec.yz;T=-T;
  if(uRec.x>0.&&texture2D(wMask,uvG).r<.5){float side=abs(dot(V,T))>abs(V.y)?.62:(V.y<0.?.5:.78);diffuseColor.rgb=diffuse*texture2D(map,uvG).rgb*side;
  #ifdef USE_COLOR
  diffuseColor.rgb*=vColor;
  #endif
  }
  else{
  vec3 rd=vec3(dot(V,T)/uRoom.x,V.y/uRoom.y,-dot(V,N)/uRoom.z);rd+=sign(rd)*1e-4+1e-5;
  vec2 cl=uvG*uCells,id=floor(cl),f=fract(cl);vec3 p=vec3(f,0.);vec3 tt=(step(0.,rd)-p)/rd;float t=min(min(tt.x,tt.y),tt.z);vec3 hp=p+rd*t;
  float r1=hR(id+vec2(3.7,11.1)),r2=hR(id*1.37+vec2(8.3,1.9)),r3=hR(id*2.11+vec2(5.,2.));
  vec3 wall=mix(vec3(.86,.83,.76),vec3(.74,.79,.84),r2)*(.8+.2*r1),col;
  if(uShop>1.5){
   // Konbini: neveras al fondo, pasillos de estanterías bajas, revistero junto al cristal y fluorescentes
   wall=vec3(.95);if(t==tt.z){col=wall;if(hp.y<.72&&hp.y>.06){float dc=fract(hp.x*7.);col=dc<.06?vec3(.6):mix(vec3(.82,.92,1.),vec3(hR(floor(vec2(hp.x*28.,hp.y*9.))),.6,.5)*.9+.1,step(.2,fract(hp.y*9.))*.55);col*=1.25;}}
   else if(t==tt.y){col=rd.y<0.?vec3(.86,.86,.84):vec3(1.);if(rd.y>0.&&fract(hp.x*5.)<.12)col=vec3(1.6);}
   else col=wall*.9;
   // Estanterías de los pasillos (bandas perpendiculares al cristal) y revistero bajo en la primera fila
   float zz=hp.z;if(t!=tt.y||rd.y<0.){for(int k=1;k<4;k++){float zk=float(k)*.24;float tk=(zk-p.z)/rd.z;vec3 q=p+rd*tk;if(tk>0.&&tk<t&&q.y<.42){float pr=hR(floor(vec2(q.x*22.,q.y*12.)+float(k)*7.));col=mix(vec3(.85),vec3(pr,hR(vec2(pr,3.)),hR(vec2(pr,9.))),step(.15,fract(q.y*12.))*.8);col*=1.-zk*.6;zz=zk;break;}}}
   if(zz==hp.z)col*=mix(1.,.8,hp.z);
  }else if(uShop>.5){
   // Tienda: estanterías con productos de colores al fondo y a los lados, mostrador y luces en el techo
   // Productos: cajas pequeñas de colores vivos con huecos, sobre baldas oscuras
   wall=mix(vec3(.78,.74,.68),vec3(.9,.9,.88),r2);
   if(t==tt.z){col=wall;if(hp.y>.1&&hp.y<.7){float sy=fract(hp.y*7.),cx=floor(hp.x*34.),cy=floor(hp.y*7.);float h1=hR(vec2(cx,cy)+id*3.1);
     col=sy<.12?vec3(.22,.2,.19):(sy<.12+.7*(.5+.5*h1)&&fract(hp.x*34.)>.12&&h1>.18?mix(vec3(.62,.6,.56),vec3(hR(vec2(cx,cy)+id+.5),hR(vec2(cy,cx)+id+2.),hR(vec2(cx+cy,3.)+id)),.62):vec3(.3,.28,.26));}}
   else if(t==tt.y){col=rd.y<0.?mix(vec3(.82,.8,.76),vec3(.6,.6,.62),step(.5,fract(hp.x*6.)+fract(hp.z*6.)*0.)):vec3(.98);if(rd.y>0.&&abs(fract(hp.z*4.)-.5)<.07)col=vec3(1.8,1.75,1.6);}
   else{col=wall*.85;if(hp.y>.1&&hp.y<.7){float sy=fract(hp.y*7.),cz=floor(hp.z*20.),cy=floor(hp.y*7.);float h1=hR(vec2(cz,cy)+id*5.3);
     col=sy<.12?vec3(.22,.2,.19):(h1>.2&&fract(hp.z*20.)>.15?mix(vec3(.62,.6,.56),vec3(hR(vec2(cz,cy)+id+4.),hR(vec2(cy,cz)+id+1.),hR(vec2(cz,cy)+id+8.)),.62):vec3(.3,.28,.26));}}
   float tc=(.35-p.z)/rd.z;vec3 q=p+rd*tc;if(tc>0.&&tc<t&&q.y<.28&&q.x>.15+r1*.2&&q.x<.55+r1*.3){col=mix(vec3(.5,.36,.25),vec3(.85),r2);t=tc;}
   col*=mix(1.,.65,hp.z);
  }else{
   if(t==tt.z){col=wall;if(hp.y<.38&&hp.x>.12+r1*.25&&hp.x<.5+r3*.4)col=mix(vec3(.35,.25,.18),vec3(.25,.3,.38),r3);}
   else if(t==tt.y)col=rd.y<0.?mix(vec3(.46,.34,.23),vec3(.62,.6,.56),r3):vec3(.95);else col=wall*.82;
   col*=mix(1.,.5,hp.z);}
  float lit=step(r1,uRoom.w)+min(uShop,1.);
  if(uShop<.5&&r2>.62){float cw=.25+.35*r3;if(f.x<cw||f.x>1.-cw*.6)col=mix(vec3(.82,.76,.6),vec3(.6,.68,.78),r3)*(lit>.5?1.:.7);}
  float fr=pow(1.-abs(dot(V,N)),3.);vec3 refl=mix(uSkyH,uSkyT,clamp(-V.y*1.5+.4,0.,1.));
  vec3 inner=col*(uShop>.5?.95:.28)*(1.-uNight)+col*vec3(1.,.86,.64)*min(1.,lit)*uNight*(uShop>1.5?1.8:uShop>.5?1.5:1.05);
  diffuseColor.rgb*=.12;totalEmissiveRadiance+=mix(inner,refl*(1.-uNight*.85),clamp(uShop>.5?.04+fr*.3:.12+fr*.65,0.,.85));}}}`)};
 mat.customProgramCacheKey=()=>"int"+sh0+o.depth+(o.rec||0);NM.int.push(mat);return mat}
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

let BALM=null,RAILM=null,DETM=null,ROOFM=null,AWP=[];const DET=[];
// Muestra el detalle cercano (balcones, pilares, aires, escaleras) solo en los bloques de 500 m próximos a la cámara
function lodUpdate(){const lv=qLevel();if(typeof treeLod==="function")treeLod();for(const d of DET){const dx=Math.max(0,Math.abs(cam.position.x-d.x)-250),dz=Math.max(0,Math.abs(cam.position.z-d.z)-250),v=lv>=1&&dx*dx+dz*dz<260*260;for(const m of d.m)m.visible=v}}
const BCOL=[0xe6e2d8,0xd4d4d0,0xcfc6b4,0xb9b6ae,0xa9b1ba,0xe2dccd,0x9a958c,0xc4bfb2];
// Rectángulo orientado mínimo de una planta (para templos y puerta)
function obb(R){let best=null;for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,a=Math.atan2(R[j+1]-R[i+1],R[j]-R[i]),c=Math.cos(a),s=Math.sin(a);let u0=1e9,u1=-1e9,v0=1e9,v1=-1e9;
 for(let k=0;k<R.length;k+=2){const u=R[k]*c+R[k+1]*s,v=-R[k]*s+R[k+1]*c;u0=Math.min(u0,u);u1=Math.max(u1,u);v0=Math.min(v0,v);v1=Math.max(v1,v)}
 const A=(u1-u0)*(v1-v0);if(!best||A<best.A){const uc=(u0+u1)/2,vc=(v0+v1)/2;best={A,a,cx:uc*c-vc*s,cz:uc*s+vc*c,hu:(u1-u0)/2,hv:(v1-v0)/2}}}return best}

function buildBuildings(){const CH=500,ch=new Map(),c=new THREE.Color(),R0=rng(3);
 const RM=[[3.6,3.3,4,.35],[3.6,3.3,3.5,.45],[3.6,3.3,3.5,.38],[3.6,3.3,6,.3]];
 const mats=[0,1,2,3].map(t=>{const m=t===3?new THREE.MeshPhongMaterial({map:facade(3),vertexColors:true,envMap:SKYCUBE,reflectivity:.25,shininess:90,specular:0x8899aa})
  :new THREE.MeshLambertMaterial({map:facade(t),vertexColors:true});NM.win.push(m);return interior(m,{mask:facade(t,1),rw:RM[t][0],rh:RM[t][1],depth:RM[t][2],lit:RM[t][3],rec:t===3?.06:.28})});
 const shopMs=[0,1,2].map(v=>interior(new THREE.MeshLambertMaterial({map:shopTex(0,v),vertexColors:true}),{mask:shopTex(1,v),rw:3.6,rh:4,depth:6,lit:1,shop:1,rec:.25}));
 const konM=interior(new THREE.MeshLambertMaterial({map:konTex(),vertexColors:true}),{mask:konTex(1),rw:3.6,rh:4,depth:9,lit:1,shop:2,rec:.15});
 const get=k=>{let o=ch.get(k);if(!o){o={f:[0,1,2,3,4,5,6,7].map(()=>({p:[],n:[],u:[],c:[]})),r:{p:[],c:[]},d:[],rl:[],x:[],xc:[],k};ch.set(k,o)}return o};
 // Detalle de fachada cercano (o.x, ver lodUpdate): cajas orientadas (pilares, aires acondicionados, rellanos) y cuadriláteros
 const tri=(A,C,col,...p)=>{A.push(...p);for(let k=0;k<p.length/3;k++)C.push(col.r,col.g,col.b)};
 const bxP=(o,x,z,ang,w,d,y0,y1,col)=>{const c=Math.cos(ang),s=Math.sin(ang),P=[[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]].map(([u,v])=>[x+u*c+v*s,z-u*s+v*c]);
  for(let i=0;i<4;i++){const a=P[i],b=P[(i+1)%4];tri(o.x,o.xc,col,a[0],y0,a[1],b[0],y0,b[1],b[0],y1,b[1],a[0],y0,a[1],b[0],y1,b[1],a[0],y1,a[1])}
  tri(o.x,o.xc,col,P[0][0],y1,P[0][1],P[1][0],y1,P[1][1],P[2][0],y1,P[2][1],P[0][0],y1,P[0][1],P[2][0],y1,P[2][1],P[3][0],y1,P[3][1])};
 const quadP=(o,col,a,b,c2,d)=>tri(o.x,o.xc,col,...a,...b,...c2,...a,...c2,...d);
 const ringX=(o,Q,y,hh,off,col)=>{const n=Q.length/2;for(let i=0;i<n;i++){const j=(i+1)%n,ax=Q[i*2],az=Q[i*2+1],bx=Q[j*2],bz=Q[j*2+1],L=Math.hypot(bx-ax,bz-az);if(L<.3)continue;const nx=(bz-az)/L*off,nz=-(bx-ax)/L*off;
  quadP(o,col,[ax+nx,y,az+nz],[bx+nx,y,bz+nz],[bx+nx,y+hh,bz+nz],[ax+nx,y+hh,az+nz]);quadP(o,col,[ax,y+hh,az],[bx,y+hh,bz],[bx+nx,y+hh,bz+nz],[ax+nx,y+hh,az+nz])}};
 const RFC=[0x464b52,0x3d5068,0x5e4436,0x6b3a30,0x4f5862,0x3a3d42],ACC=new THREE.Color(0xd9dbd6),STC=new THREE.Color(0x59616b),dk=new THREE.Color();
 const AW=AWP,KS=[],PH=[];let kon=0;
 // u va al revés que el borde para que los textos de los letreros se lean bien desde fuera
 const wall=(s,ax,az,bx,bz,y0,y1,u0,u1,v0,v1,nx,nz,col)=>{u0=-u0;u1=-u1;s.p.push(ax,y0,az,bx,y1,bz,bx,y0,bz,ax,y0,az,ax,y1,az,bx,y1,bz);s.u.push(u0,v0,u1,v1,u1,v0,u0,v0,u0,v1,u1,v1);for(let k=0;k<6;k++){s.n.push(nx,0,nz);s.c.push(col.r,col.g,col.b)}};
 const roofT=[],tank=[],ant=[],vs=SIGNS.map(()=>[]),leds=[[],[],[]];
 MAP.buildings.forEach((b,bi)=>{if(b.k===1||b.k===3){temple(b);return}
  let R=b.p,A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];
  if(A<0){const q=new Float32Array(R.length);for(let i=0;i<R.length;i+=2){q[i]=R[R.length-2-i];q[i+1]=R[R.length-1-i]}R=q}A=Math.abs(A)/2;
  let cx=0,cz=0;for(let i=0;i<R.length;i+=2){cx+=R[i];cz+=R[i+1]}cx/=R.length/2;cz/=R.length/2;
  const o=get(Math.floor(cx/CH)*100+Math.floor(cz/CH)),h=b.h,r=R0(),ft=b.k===2;
  const type=ft?0:b.dealer?3:h>70?3:h>25?(r<.65?0:r<.85?1:3):(r<.5?1:r<.85?2:0),s=o.f[type],uo=R0(),vo=Math.floor(R0()*4)/4;
  c.set(ft?0xf2f2ef:type===3?0xffffff:b.c!==undefined?b.c:BCOL[bi%BCOL.length]);const sc2=new THREE.Color(1,1,1);
  // Konbini: edificio pequeño junto a la calle (como mucho 70 en el mapa)
  const isK=!ft&&A>70&&A<700&&h<30&&kon<70&&R0()<.1;let kd=false;
  // Edificios altos y grandes: base (podio) y torre retranqueada encima
  let Rs=null,top=h;if(!ft&&h>45&&A>400){const k=.74+R0()*.1;Rs=new Float32Array(R.length);for(let i=0;i<R.length;i+=2){Rs[i]=cx+(R[i]-cx)*k;Rs[i+1]=cz+(R[i+1]-cz)*k}
   let ok=true;for(let i=0;i<Rs.length&&ok;i+=2)if(!inPoly(R,Rs[i],Rs[i+1]))ok=false;if(ok)top=Math.min(22,Math.max(9,h*.2));else Rs=null}
  let acN=0,stE=null;const balc=!ft&&(type===1||type===2&&bi%5<2||type===0&&h<40&&bi%4===0);
  let per=0;for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,ax=R[i],az=R[i+1],bx=R[j],bz=R[j+1],L=Math.hypot(bx-ax,bz-az);if(L<.05)continue;const nx=(bz-az)/L,nz=-(bx-ax)/L,u0=per/14.4+uo,u1=(per+L)/14.4+uo;per+=L;
   // Tienda: hay calle delante y entre medias no hay otro edificio pegado (si no, los toldos se meterían en el de al lado)
   const mx=(ax+bx)/2,mz=(az+bz)/2,fr=(t)=>!inBuilding(mx+nx*t,mz+nz*t),shop=!ft&&!b.dealer&&h<70&&L>4&&fr(1.5)&&fr(3)&&(roadAt(mx+nx*4.5,mz+nz*4.5)>=0||fr(6)&&roadAt(mx+nx*8,mz+nz*8)>=0||fr(6)&&fr(10)&&roadAt(mx+nx*12,mz+nz*12)>=0);
   if(shop){const K=isK&&L>7;if(K&&!kd){kd=true;kon++}
    wall(o.f[K?7:4+bi%3],ax,az,bx,bz,0,4,u0,u1,0,1,nx,nz,sc2);wall(s,ax,az,bx,bz,4,top,u0,u1,vo+4/13.2,vo+top/13.2,nx,nz,c);
    // Toldos que salen sobre la acera (uno por local, no todos) y letrero luminoso de konbini
    const ang=Math.atan2(nx,nz);if(K)KS.push([mx+nx*.2,4.15,mz+nz*.2,ang,Math.min(L*.85,14)]);
    else for(let t=1.8;t<L-1.6;t+=3.6){const q=Math.floor((u0*14.4+t)/3.6),sh=SHOPS[bi%3][((q%4)+4)%4];if(sh.shut||sh.k[3]||R0()<.35||inBuilding(ax+(bx-ax)*t/L+nx*1.3,az+(bz-az)*t/L+nz*1.3))continue;AW.push([ax+(bx-ax)*t/L+nx*.5,2.95,az+(bz-az)*t/L+nz*.5,ang,sh.hue])}
    // Letrero vertical perpendicular a la fachada y, en edificios altos, alguna pantalla LED
    // (no en fachadas con balcones: se meterían dentro)
    if(h>8&&h<60&&!balc&&R0()<.45){const t=.15+R0()*.7,sh=Math.min(9,h-5);vs[Math.floor(R0()*SIGNS.length)].push([ax+(bx-ax)*t+nx*.75,4.6,az+(bz-az)*t+nz*.75,Math.atan2(nx,nz)+PI/2,1,sh])}
    if(h>25&&L>13&&!balc&&R0()<.18&&leds.flat().length<40)leds[Math.floor(R0()*3)].push([mx+nx*.35,Math.min(h-4,22),mz+nz*.35,Math.atan2(nx,nz)])}
   else wall(s,ax,az,bx,bz,0,top,u0,u1,vo,vo+top/13.2,nx,nz,c);
   // Balcones en 3D (solo pisos de viviendas; se muestran al acercarse)
   // Aires acondicionados colgados de la fachada bajo las ventanas (pisos y edificios antiguos)
   if((type===1||type===2)&&!ft&&h<30&&L>4&&acN<12){const ang=Math.atan2(nx,nz),nf=Math.floor(top/3.3);for(let f=shop?2:1;f<nf&&acN<12;f++)for(let t=2;t<L-1.5;t+=4)if(R0()<.22){bxP(o,ax+(bx-ax)*t/L+nx*.17,az+(bz-az)*t/L+nz*.17,ang,.8,.32,f*3.3+.25,f*3.3+.83,ACC);acN++}}
   if(!shop&&L>6.5&&(!stE||L>stE[4]))stE=[ax,az,bx,bz,L,nx,nz];
   if(balc&&L>5){const f0=shop?2:1,nf=Math.min(14,Math.floor(top/3.3));for(let f=f0;f<nf;f++){const y=f*3.3+CURB-.05,ux=(bx-ax)/L,uz=(bz-az)/L,x0=ax+ux*.4,z0=az+uz*.4,x1=bx-ux*.4,z1=bz-uz*.4,ox=nx*.95,oz=nz*.95;
     o.d.push(x0,y,z0,x1,y,z1,x1+ox,y,z1+oz,x0,y,z0,x1+ox,y,z1+oz,x0+ox,y,z0+oz, x0+ox,y-.14,z0+oz,x1+ox,y-.14,z1+oz,x1+ox,y,z1+oz,x0+ox,y-.14,z0+oz,x1+ox,y,z1+oz,x0+ox,y,z0+oz);
     o.rl.push(x0+ox,y,z0+oz,x1+ox,y,z1+oz,x1+ox,y+1.05,z1+oz,x0+ox,y,z0+oz,x1+ox,y+1.05,z1+oz,x0+ox,y+1.05,z0+oz)}}}
  // Torre retranqueada sobre el podio
  if(Rs){let p2=0;for(let i=0;i<Rs.length;i+=2){const j=(i+2)%Rs.length,ax=Rs[i],az=Rs[i+1],bx=Rs[j],bz=Rs[j+1],L=Math.hypot(bx-ax,bz-az);if(L<.05)continue;
   wall(s,ax,az,bx,bz,top,h,p2/14.4+uo,(p2+L)/14.4+uo,vo+top/13.2,vo+h/13.2,(bz-az)/L,-(bx-ax)/L,c);p2+=L}
   // Terraza en el tejado del podio: barandilla de cristal alrededor
   for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length;o.rl.push(R[i],top,R[i+1],R[j],top,R[j+1],R[j],top+1.1,R[j+1],R[i],top,R[i+1],R[j],top+1.1,R[j+1],R[i],top+1.1,R[i+1])}}
  // Relieve de la fachada (solo de cerca): pilares en las esquinas y entre ventanas, y franjas horizontales entre plantas
  if((type===0||type===2)&&!ft&&h>6&&h<90){dk.copy(c).multiplyScalar(.86);const n=R.length/2;
   for(let i=0;i<n;i++){const j=(i+1)%n,x=R[i*2],z=R[i*2+1],ex=R[j*2]-x,ez=R[j*2+1]-z,L=Math.hypot(ex,ez);if(L<.3)continue;const ang=Math.atan2(-ez,ex);
    bxP(o,x,z,ang,.6,.6,0,top,dk);
    if(type===0&&L>14)for(let t=7.2;t<L-3;t+=7.2)bxP(o,x+ex/L*t+ez/L*.1,z+ez/L*t-ex/L*.1,ang,.32,.24,4,top,dk)}
   for(let y=type===0?6.6:3.3;y<top-1;y+=type===0?6.6:3.3)ringX(o,R,y,.22,.13,dk)}
  // Escalera exterior metálica (edificios bajos de pisos o antiguos): tramos en zigzag con rellanos y barandilla
  if((type===1||type===2)&&!ft&&!isK&&h>5.5&&h<17&&stE&&R0()<.35){const[ax,az,bx,bz,L,nx,nz]=stE,ux=(bx-ax)/L,uz=(bz-az)/L,ang=Math.atan2(nx,nz),t0=L/2-1.6,nf=Math.floor(top/3.3);
   const cxs=ax+ux*L/2+nx*2.4,czs=az+uz*L/2+nz*2.4;if(roadAt(cxs,czs)<0&&!inBuilding(cxs,czs)){
   const P=(t,o2,y)=>[ax+ux*t+nx*o2,y+CURB,az+uz*t+nz*o2];
   for(let f=0;f<nf;f++){const y0=f*3.3,ym=y0+1.65,y1=y0+3.3;
    quadP(o,STC,P(t0,.15,y0),P(t0+3.2,.15,ym),P(t0+3.2,1.1,ym),P(t0,1.1,y0));quadP(o,STC,P(t0+3.2,1.15,ym),P(t0,1.15,y1),P(t0,2.1,y1),P(t0+3.2,2.1,ym));
    quadP(o,STC,P(t0,2.1,y0+.95),P(t0+3.2,2.1,ym+.95),P(t0+3.2,2.1,ym+.75),P(t0,2.1,y0+.75));
    bxP(o,ax+ux*(t0+3.7)+nx*1.1,az+uz*(t0+3.7)+nz*1.1,ang,1,2.1,ym-.1,ym,STC);bxP(o,ax+ux*(t0-.5)+nx*1.1,az+uz*(t0-.5)+nz*1.1,ang,1,2.1,y1-.1,y1,STC);
    bxP(o,ax+ux*(t0+4.15)+nx*2.1,az+uz*(t0+4.15)+nz*2.1,ang,.06,.06,0,y1+1,STC)}}}
  // Casas bajas casi rectangulares: tejado a dos aguas (sin pretil ni cosas en el tejado)
  let pitch=false;
  if(!ft&&!isK&&!Rs&&type!==3&&h<=12&&A<320&&R0()<.85){const ob=obb(R);let a=ob.a,hu=ob.hu,hv=ob.hv;if(hv>hu){const t=hu;hu=hv;hv=t;a+=PI/2}
   if(4*hu*hv<A*1.3){pitch=true;const ov=.45,rh=Math.min(2.6,hv*.65),ca=Math.cos(a),sa=Math.sin(a),W2=(u,v,y)=>[ob.cx+u*ca-v*sa,y,ob.cz+u*sa+v*ca];
    const rcol=new THREE.Color(RFC[bi%RFC.length]),U=hu+ov,V=hv+ov,Ri=[];
    const P2=(arr,col,...v)=>{for(const q of v)arr.p.push(...q);for(let k=0;k<v.length;k++)arr.c.push(col.r,col.g,col.b)};
    for(const sv of[-1,1]){const e0=W2(-U,sv*V,h-.25),e1=W2(U,sv*V,h-.25),r0=W2(-U,0,h+rh),r1=W2(U,0,h+rh);P2(o.r,rcol,e0,e1,r1,e0,r1,r0)}
    for(const su of[-1,1])P2(o.r,c,W2(su*hu,-hv,h),W2(su*hu,hv,h),W2(su*hu,0,h+rh*(1-ov/V)))}}
  // Tejado (del podio y de la torre) con pretil, cornisa en los edificios bajos y medianos, y detalles en el tejado
  const rc=new THREE.Color(ft?0xd9dde2:0x8c8f94).offsetHSL(0,0,(bi%5-2)*.025),n0=o.r.p.length,RT=Rs||R;polyFill(o.r.p,R,top);if(Rs)polyFill(o.r.p,Rs,h);
  const ring=(Q,y,hh,off)=>{const n=Q.length/2,V=[];for(let i=0;i<n;i++){const pv=(i+n-1)%n,nx2=(i+1)%n;let ex=0,ez=0;for(const[a,b2]of[[pv,i],[i,nx2]]){const dx=Q[b2*2]-Q[a*2],dz=Q[b2*2+1]-Q[a*2+1],l=Math.hypot(dx,dz)||1;ex+=dz/l;ez+=-dx/l}const l=Math.hypot(ex,ez)||1;V.push(Q[i*2]+ex/l*off,Q[i*2+1]+ez/l*off)}
   for(let i=0;i<n;i++){const j=(i+1)%n;o.r.p.push(V[i*2],y,V[i*2+1],V[j*2],y+hh,V[j*2+1],V[j*2],y,V[j*2+1],V[i*2],y,V[i*2+1],V[i*2],y+hh,V[i*2+1],V[j*2],y+hh,V[j*2+1])}};
  if(h<90&&!ft&&!pitch){ring(RT,h,.9,0);if(Rs)ring(R,top,.9,0)}if(h<60&&!Rs&&type!==3&&!ft&&!pitch)ring(R,top-.55,.5,.3);
  for(let k=n0;k<o.r.p.length;k+=3)o.r.c.push(rc.r,rc.g,rc.b);
  if(pitch)return;
  if(A>120&&h<100&&!ft&&inPoly(RT,cx,cz)&&inPoly(RT,cx+2,cz+2)&&inPoly(RT,cx-2,cz-2))PH.push([cx,h,cz,R0()*PI,1,1,rc.getHex()]);
  if(A>50&&h<120&&!ft){const bb=[1e9,1e9,-1e9,-1e9];for(let i=0;i<RT.length;i+=2){bb[0]=Math.min(bb[0],RT[i]);bb[1]=Math.min(bb[1],RT[i+1]);bb[2]=Math.max(bb[2],RT[i]);bb[3]=Math.max(bb[3],RT[i+1])}
   const n=Math.min(7,A/120|0)+1;for(let k=0;k<n*3&&k<20;k++){const x=bb[0]+R0()*(bb[2]-bb[0]),z=bb[1]+R0()*(bb[3]-bb[1]);if(!inPoly(RT,x,z)||!inPoly(RT,x+1.2,z)||!inPoly(RT,x-1.2,z)||!inPoly(RT,x,z+1.2)||!inPoly(RT,x,z-1.2))continue;
    const q=R0();if(q<.7)roofT.push([x,h,z,R0()*PI]);else if(q<.85&&A>150)tank.push([x,h,z]);else ant.push([x,h,z]);if(roofT.length>9000)break}}});
 // Toldos inclinados (cada uno de su color) y letreros de konbini sobre la entrada
 if(AW.length){const m=new THREE.InstancedMesh(new THREE.BoxGeometry(3.05,.05,1),new THREE.MeshLambertMaterial({color:0xffffff}),AW.length),M=new THREE.Matrix4(),q=new THREE.Quaternion(),e=new THREE.Euler(0,0,0,"YXZ"),cc=new THREE.Color();
  AW.forEach((a,i)=>{e.set(.28,a[3],0);q.setFromEuler(e);M.compose(new THREE.Vector3(a[0],a[1]+CURB,a[2]),q,new THREE.Vector3(1,1,1));m.setMatrixAt(i,M);m.setColorAt(i,cc.setHSL(a[4]/360,.6,.45))});
  m.castShadow=m.receiveShadow=true;m.userData.q=1;sc.add(m)}
 if(KS.length){const t=canvasTex(512,64,(g)=>{g.fillStyle="#fff";g.fillRect(0,0,512,64);g.fillStyle="#1f9a4a";g.fillRect(0,40,512,10);g.fillStyle="#1d5fb8";g.fillRect(0,50,512,10);
   g.fillStyle="#1d5fb8";g.font="bold 30px 'Yu Gothic','Meiryo',sans-serif";g.textAlign="center";g.fillText("サクラマート  24H",256,32)}),km=new THREE.MeshLambertMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.3});NM.sign.push(km);
  const ks=inst(new THREE.BoxGeometry(1,.9,.25).translate(0,.45,0),km,KS,0),o3=new THREE.Object3D();KS.forEach((k,i)=>{o3.position.set(k[0],k[1],k[2]);o3.rotation.set(0,k[3],0);o3.scale.set(k[4],1,1);o3.updateMatrix();ks.setMatrixAt(i,o3.matrix)});ks.instanceMatrix.needsUpdate=true}
 for(const o of ch.values()){o.f.forEach((s,t)=>s.p.length&&mkMesh(s.p,t===7?konM:t>=4?shopMs[t-4]:mats[t],0,{normal:s.n,uv:s.u,color:s.c},2));
  if(o.r.p.length)mkMesh(o.r.p,ROOFM||(ROOFM=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})),0,{color:o.r.c},2);
  // Detalle cercano (balcones): solo visible a menos de 260 m (ver lodUpdate)
  // Detalle cercano (balcones, barandillas, pilares, franjas, aires acondicionados, escaleras): solo a menos de 260 m (ver lodUpdate)
  const ms=[],cxk=(Math.floor(o.k/100)+.5)*CH,czk=((o.k%100)+.5)*CH;
  if(o.d.length)ms.push(mkMesh(o.d,BALM||(BALM=new THREE.MeshLambertMaterial({color:0xd4d0c8,side:THREE.DoubleSide})),0,null,2));
  if(o.rl.length)ms.push(mkMesh(o.rl,RAILM||(RAILM=new THREE.MeshLambertMaterial({color:0x9aa1a8,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false}))));
  if(o.x.length)ms.push(mkMesh(o.x,DETM||(DETM=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide})),0,{color:o.xc},2));
  if(ms.length)DET.push({m:ms,x:cxk,z:czk})}
 instZ(new THREE.BoxGeometry(3.4,2.8,3.4).translate(0,1.4,0),new THREE.MeshLambertMaterial({color:0xffffff}),PH,1,true);
 const gm=new THREE.MeshLambertMaterial({color:0xc9cbcc});
 instZ(new THREE.BoxGeometry(1.2,.8,.8).translate(0,.4,0),gm,roofT,1);instZ(new THREE.CylinderGeometry(1.1,1.1,2.4,10).translate(0,2.4,0),new THREE.MeshLambertMaterial({color:0x9db0bf}),tank,1,true);
 instZ(new THREE.CylinderGeometry(.04,.06,5,4).translate(0,2.5,0),new THREE.MeshLambertMaterial({color:0x777b80}),ant,2);
 vs.forEach((l,i)=>{const t=signTex(i),m=new THREE.MeshLambertMaterial({map:t,emissiveMap:t,emissive:0xffffff,emissiveIntensity:.15,side:THREE.DoubleSide});NM.sign.push(m);inst(new THREE.PlaneGeometry(1.1,1).translate(0,.5,0),m,l,0)});
 leds.forEach((l,i)=>{const cv=document.createElement("canvas");cv.width=320;cv.height=180;const t=new THREE.CanvasTexture(cv),m=new THREE.MeshBasicMaterial({map:t,toneMapped:false});
  NM.led.push({g:cv.getContext("2d"),t,ph:i*1.7});NM.ledT.push(m);inst(new THREE.PlaneGeometry(10,5.6).translate(0,0,.05),m,l,0);
  // Halo de luz alrededor de la pantalla por la noche (se suma al resplandor del postproceso)
  if(!NM.ledGlow)NM.ledGlow=new THREE.MeshBasicMaterial({map:canvasTex(256,160,(g)=>{g.filter="blur(12px)";g.fillStyle="#fff";g.fillRect(28,28,200,104);g.filter="none";g.clearRect(44,40,168,80)}),
   transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,color:0xcfe0ff,toneMapped:false});
  inst(new THREE.PlaneGeometry(13.5,8.4).translate(0,0,.08),NM.ledGlow,l,0);
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
