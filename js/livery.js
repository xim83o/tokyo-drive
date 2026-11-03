// Calcomanías y pintura (estilo Motorfest): color de carrocería, llantas, cristales tintados, franjas, dorsal y pegatinas colocables.
// Todo se proyecta sobre la carrocería del modelo (DecalGeometry), así sirve para cualquier coche. Se guarda por coche en el navegador.
// Los diseños de las pegatinas (estilo anime incluido) están dibujados por código: son propios, sin problemas de derechos
const LIVDEF=()=>({c:undefined,wc:undefined,tint:0,st:0,sc:0xffffff,num:0,nc:0xffffff,stk:[]});
let LIV=[0,1,2,3].map(LIVDEF);
try{const s=JSON.parse(localStorage.getItem("td-liv")||"null");if(Array.isArray(s))LIV=s.map(o=>Object.assign(LIVDEF(),o))}catch(e){}
const saveLiv=()=>{try{localStorage.setItem("td-liv",JSON.stringify(LIV))}catch(e){}};
const PAL8=[0xf2f2f2,0x1b1c20,0x8a9097,0xe5173f,0xff7a1a,0xf5b800,0x2fae5a,0x2a6cff,0x6b3fd1,0xff6fb5,0x00b8c8,0x5a3a22];
// --- Diseños de las pegatinas (lienzo 256×256 con fondo transparente) ---
const STK=[
 {n:"Chica anime",d:g=>{g.fillStyle="#3b2a6b";g.beginPath();g.ellipse(128,112,92,96,0,0,7);g.fill();g.fillStyle="#ffe2cc";g.beginPath();g.ellipse(128,140,70,74,0,0,7);g.fill();
  g.fillStyle="#3b2a6b";g.beginPath();g.moveTo(52,110);g.quadraticCurveTo(128,40,204,110);g.lineTo(180,96);g.lineTo(160,124);g.lineTo(140,92);g.lineTo(116,124);g.lineTo(98,94);g.lineTo(76,124);g.closePath();g.fill();
  for(const x of[100,156]){g.fillStyle="#fff";g.beginPath();g.ellipse(x,146,15,20,0,0,7);g.fill();g.fillStyle="#e2337a";g.beginPath();g.ellipse(x,150,11,15,0,0,7);g.fill();g.fillStyle="#2a0f2a";g.beginPath();g.ellipse(x,152,6,9,0,0,7);g.fill();g.fillStyle="#fff";g.beginPath();g.arc(x-4,143,4,0,7);g.fill()}
  g.fillStyle="rgba(255,110,140,.45)";for(const x of[86,170]){g.beginPath();g.ellipse(x,172,12,6,0,0,7);g.fill()}g.strokeStyle="#a0405a";g.lineWidth=3;g.beginPath();g.arc(128,178,9,.2,PI-.2);g.stroke();
  g.fillStyle="#ff5a8a";g.beginPath();g.moveTo(186,70);g.lineTo(214,58);g.lineTo(206,86);g.closePath();g.fill()}},
 {n:"Gato",d:g=>{g.fillStyle="#f6f1e8";g.strokeStyle="#222";g.lineWidth=6;g.beginPath();g.moveTo(54,110);g.lineTo(70,40);g.lineTo(110,82);g.lineTo(146,82);g.lineTo(186,40);g.lineTo(202,110);g.quadraticCurveTo(212,210,128,212);g.quadraticCurveTo(44,210,54,110);g.closePath();g.fill();g.stroke();
  g.fillStyle="#222";for(const x of[98,158]){g.beginPath();g.ellipse(x,136,9,13,0,0,7);g.fill()}g.fillStyle="#ff8aa8";g.beginPath();g.moveTo(120,158);g.lineTo(136,158);g.lineTo(128,168);g.closePath();g.fill();
  g.beginPath();g.moveTo(128,168);g.quadraticCurveTo(116,182,104,174);g.moveTo(128,168);g.quadraticCurveTo(140,182,152,174);g.stroke();for(const s of[-1,1])for(const k of[0,1]){g.beginPath();g.moveTo(128+s*40,160+k*12);g.lineTo(128+s*84,152+k*20);g.stroke()}}},
 {n:"Sakura",d:g=>{const fl=(x,y,r)=>{for(let k=0;k<5;k++){const a=k/5*PI*2-PI/2;g.fillStyle="#ffb7d0";g.beginPath();g.ellipse(x+Math.cos(a)*r*.55,y+Math.sin(a)*r*.55,r*.42,r*.3,a,0,7);g.fill()}g.fillStyle="#e2477d";g.beginPath();g.arc(x,y,r*.16,0,7);g.fill()};
  fl(100,110,80);fl(186,170,52);fl(70,200,34);fl(200,64,30)}},
 {n:"Ola",d:g=>{g.fillStyle="#f4ecd8";g.beginPath();g.arc(128,128,118,0,7);g.fill();g.fillStyle="#1d3c78";g.beginPath();g.moveTo(10,190);g.quadraticCurveTo(60,60,170,70);g.quadraticCurveTo(110,90,120,140);g.quadraticCurveTo(140,110,170,120);g.quadraticCurveTo(150,150,246,190);g.lineTo(246,246);g.lineTo(10,246);g.closePath();g.fill();
  g.fillStyle="#f4ecd8";for(let k=0;k<6;k++){g.beginPath();g.arc(170-k*14,74+k*6,6,0,7);g.fill()}g.globalCompositeOperation="destination-in";g.beginPath();g.arc(128,128,118,0,7);g.fill();g.globalCompositeOperation="source-over";g.strokeStyle="#1d3c78";g.lineWidth=6;g.beginPath();g.arc(128,128,115,0,7);g.stroke()}},
 {n:"Rayo",d:g=>{g.fillStyle="#ffd400";g.strokeStyle="#1b1b1b";g.lineWidth=8;g.beginPath();g.moveTo(150,10);g.lineTo(60,140);g.lineTo(122,140);g.lineTo(96,246);g.lineTo(200,100);g.lineTo(136,100);g.closePath();g.fill();g.stroke()}},
 {n:"Estrella",d:g=>{g.fillStyle="rgba(120,200,255,.6)";g.beginPath();g.moveTo(20,236);g.lineTo(120,120);g.lineTo(140,140);g.closePath();g.fill();g.fillStyle="#fff36b";g.strokeStyle="#2a2a2a";g.lineWidth=6;g.beginPath();
  for(let k=0;k<10;k++){const a=k/10*PI*2-PI/2,r=k%2?40:92;g.lineTo(156+Math.cos(a)*r,100+Math.sin(a)*r)}g.closePath();g.fill();g.stroke()}},
 {n:"疾風 (vendaval)",d:g=>{g.fillStyle="#111";g.font="bold 118px 'Yu Mincho','MS Mincho','Yu Gothic',serif";g.textAlign="center";g.textBaseline="middle";g.strokeStyle="#fff";g.lineWidth=14;g.strokeText("疾風",128,132);g.fillText("疾風",128,132)}},
 {n:"東京",d:g=>{g.font="bold 112px 'Yu Gothic','Meiryo',sans-serif";g.textAlign="center";g.textBaseline="middle";g.strokeStyle="#e5173f";g.lineWidth=16;g.strokeText("東京",128,132);g.fillStyle="#fff";g.fillText("東京",128,132)}},
 {n:"Llamas",d:g=>{const f=(c,s)=>{g.fillStyle=c;g.beginPath();g.moveTo(0,240);for(let k=0;k<=8;k++){const x=k*32;g.quadraticCurveTo(x+8,240-s*(60+((k*37)%5)*28),x+16,200-s*20);g.quadraticCurveTo(x+24,230,x+32,236)}g.lineTo(256,256);g.lineTo(0,256);g.closePath();g.fill()};f("#ff3b1f",1.8);f("#ff9a1f",1.2);f("#ffe14a",.6)}},
 {n:"Kitsune",d:g=>{g.fillStyle="#fff";g.strokeStyle="#111";g.lineWidth=6;g.beginPath();g.moveTo(50,60);g.lineTo(96,96);g.lineTo(160,96);g.lineTo(206,60);g.lineTo(196,140);g.lineTo(128,226);g.lineTo(60,140);g.closePath();g.fill();g.stroke();
  g.fillStyle="#d61f26";for(const s of[-1,1]){g.beginPath();g.moveTo(128+s*28,134);g.quadraticCurveTo(128+s*56,118,128+s*66,136);g.quadraticCurveTo(128+s*48,140,128+s*28,134);g.fill();g.beginPath();g.moveTo(128+s*58,72);g.lineTo(128+s*70,96);g.lineTo(128+s*46,96);g.closePath();g.fill()}
  g.beginPath();g.arc(128,110,8,0,7);g.fill();g.fillStyle="#111";g.beginPath();g.ellipse(128,206,9,6,0,0,7);g.fill()}},
 {n:"Cuadros",d:g=>{for(let y=0;y<4;y++)for(let x=0;x<8;x++){g.fillStyle=(x+y)%2?"#111":"#fff";g.fillRect(x*32,64+y*32,32,32)}}},
 {n:"Corazón",d:g=>{g.fillStyle="#ff3b6b";g.strokeStyle="#fff";g.lineWidth=10;g.beginPath();g.moveTo(128,220);g.bezierCurveTo(10,140,40,30,128,84);g.bezierCurveTo(216,30,246,140,128,220);g.closePath();g.fill();g.stroke()}}];
// Pegatinas de imágenes de licencia libre (textures/stickers, ver CREDITOS.txt): se recorta cada personaje de la hoja original.
// round: insignia redonda con borde blanco (para recortes con fondo)
const IMGS={};
function imgStk(n,src,cr,round,cred){return{n,cred,src,d:g=>{const im=IMGS[src];if(!im||!im.complete||!im.naturalWidth)return;const[x,y,w,h]=cr,k=Math.min(240/w,240/h),dw=w*k,dh=h*k;
 if(round){g.save();g.beginPath();g.arc(128,128,118,0,7);g.clip();g.drawImage(im,x,y,w,h,128-dw/2,128-dh/2,dw,dh);g.restore();g.strokeStyle="#fff";g.lineWidth=10;g.beginPath();g.arc(128,128,118,0,7);g.stroke()}
 else g.drawImage(im,x,y,w,h,128-dw/2,128-dh/2,dw,dh)}}}
STK.push(imgStk("Hachi chibi","textures/stickers/hachi-chibi.png",[0,0,285,390]),imgStk("Hachi chibi guiño","textures/stickers/hachi-chibi.png",[570,0,285,390]),imgStk("Hachi chibi risa","textures/stickers/hachi-chibi.png",[855,400,285,390]),
 imgStk("Hachi","textures/stickers/hachi.png",[0,20,430,620]),imgStk("Hachi guiño","textures/stickers/hachi.png",[830,20,430,620]),
 imgStk("Chica anime (Niabot, CC BY 3.0)","textures/stickers/anime-girl-niabot.svg",[505,10,330,330],true,"«Anime Girl» de Niabot, CC BY 3.0"));
const STKT=[];const stkTex=i=>STKT[i]||(STKT[i]=canvasTex(256,256,g=>STK[i].d(g)));
// Imágenes propias del jugador: se reducen a 256 px y se guardan solo en su navegador (td-stk). En las pegatinas van como ci (id)
let CUS=[];try{CUS=JSON.parse(localStorage.getItem("td-stk")||"[]")}catch(e){}
const saveCus=()=>{try{localStorage.setItem("td-stk",JSON.stringify(CUS));return true}catch(e){return false}};
const CUST={};
function cusTex(id){if(CUST[id])return CUST[id];const c=CUS.find(q=>q.id===id),t=canvasTex(256,256,()=>{});CUST[id]=t;if(c){const im=new Image();im.onload=()=>{t.image.getContext("2d").drawImage(im,0,0,256,256);t.needsUpdate=true};im.src=c.url}return t}
function addCus(file,done){const rd2=new FileReader();rd2.onload=()=>{const im=new Image();im.onload=()=>{const cv=document.createElement("canvas");cv.width=cv.height=256;const g=cv.getContext("2d"),k=Math.min(256/im.width,256/im.height),w=im.width*k,h=im.height*k;
  g.drawImage(im,128-w/2,128-h/2,w,h);let url=cv.toDataURL("image/webp",.9);if(!url.startsWith("data:image/webp"))url=cv.toDataURL("image/png");
  const id=Date.now();CUS.push({id,url,n:file.name.replace(/\.[^.]+$/,"").slice(0,24)});if(!saveCus()){CUS.pop();alert("No queda espacio para más imágenes: borra alguna.");return}done(id)};im.onerror=()=>alert("No se pudo leer esa imagen.");im.src=rd2.result};rd2.readAsDataURL(file)}
const stkName=k=>k.ci!==undefined?((CUS.find(q=>q.id===k.ci)||{}).n||"Mi imagen"):STK[k.i].n;
// Al cargar una imagen se redibujan sus pegatinas (texturas ya creadas y miniaturas del editor)
for(const src of new Set(STK.filter(s=>s.src).map(s=>s.src))){const im=new Image();IMGS[src]=im;im.onload=()=>{STK.forEach((s,i)=>{if(s.src!==src||!STKT[i])return;const c=STKT[i].image,g=c.getContext("2d");g.clearRect(0,0,256,256);s.d(g);STKT[i].needsUpdate=true});if(state==="liv")drawLiv()};im.src=src}
// Franjas: 0 ninguna · 1 central · 2 doble · 3 lateral · 4 diagonal
const STRIPES=["Ninguna","Central","Doble","Lateral","Diagonal"];
function stripeTex(st,col){const c="#"+new THREE.Color(col).getHexString();return canvasTex(128,512,g=>{g.fillStyle=c;if(st===1)g.fillRect(24,0,80,512);else if(st===2){g.fillRect(14,0,38,512);g.fillRect(76,0,38,512)}else if(st===3){g.fillRect(52,0,22,512);g.fillRect(80,0,7,512)}
 else if(st===4){g.beginPath();g.moveTo(0,330);g.lineTo(128,170);g.lineTo(128,230);g.lineTo(0,390);g.closePath();g.fill()}})}
function numTex(n,col){const c="#"+new THREE.Color(col).getHexString();return canvasTex(256,256,g=>{g.fillStyle=c;g.beginPath();g.arc(128,128,116,0,7);g.fill();g.strokeStyle="#111";g.lineWidth=10;g.beginPath();g.arc(128,128,108,0,7);g.stroke();
 g.fillStyle=new THREE.Color(col).getHSL({}).l>.5?"#111":"#fff";g.font="italic 900 140px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(n,128,138)})}
// Packs ya hechos
const PACKS=[{n:"Franja negra",o:{st:1,sc:0x111111}},{n:"Rayas de carreras",o:{st:2,sc:0xffffff,num:7,nc:0xffffff}},{n:"Sakura",o:{c:0xffc4dc,st:3,sc:0xe2477d,stk:[{i:2,sd:0,u:.1,v:.5,s:1},{i:2,sd:1,u:.1,v:.5,s:1}]}},
 {n:"Anime",o:{c:0x6b3fd1,st:4,sc:0xff6fb5,stk:[{i:0,sd:0,u:0,v:.5,s:1.2},{i:0,sd:1,u:0,v:.5,s:1.2},{i:5,sd:2,u:0,v:.5,s:.9}]}},
 {n:"Drift Tokio",o:{c:0xf2f2f2,st:3,sc:0xe5173f,tint:.7,stk:[{i:7,sd:0,u:-.15,v:.55,s:1.1},{i:7,sd:1,u:-.15,v:.55,s:1.1},{i:6,sd:2,u:0,v:.5,s:1}]}},
 {n:"Llamas",o:{c:0x1b1c20,stk:[{i:8,sd:0,u:.45,v:.35,s:1.3},{i:8,sd:1,u:.45,v:.35,s:1.3}]}},{n:"Kitsune",o:{c:0xf2f2f2,st:1,sc:0xd61f26,stk:[{i:9,sd:2,u:0,v:.5,s:1}]}}];
// Lados donde se pega: 0 izquierda · 1 derecha · 2 capó · 3 techo · 4 detrás
const SIDES=["Izquierda","Derecha","Capó","Techo","Detrás"];
const DMAT=new Map();const dmat=t=>{if(!DMAT.has(t))DMAT.set(t,new THREE.MeshPhongMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,shininess:60,specular:0x222222}));return DMAT.get(t)};
let DEC=[];
function applyDecals(){if(!car||!carBody||!THREE.DecalGeometry)return;for(const m of DEC){car.remove(m);m.geometry.dispose()}DEC=[];const L=LIV[carK];
 // Llantas del color elegido (multiplica la textura: la goma sigue negra)
 for(const q of WHEELS){if(L.wc===undefined)continue;const k="w"+L.wc;if(!DMAT.has(k))DMAT.set(k,new THREE.MeshPhongMaterial({map:q.o.material.map,color:L.wc,shininess:80}));q.o.material=DMAT.get(k)}
 // Proyectar con el coche en el origen (las calcomanías quedan en coordenadas del coche)
 const P=car.position.clone(),R=car.rotation.clone();car.position.set(0,0,0);car.rotation.set(0,0,0);car.updateMatrixWorld(true);
 const bb=new THREE.Box3().setFromObject(carBody),c=bb.getCenter(new THREE.Vector3()),s=bb.getSize(new THREE.Vector3());
 const add=(tex,pos,rot,size)=>{const g=new THREE.DecalGeometry(carBody,pos,rot,size);if(!g.attributes.position.count)return;const m=new THREE.Mesh(g,dmat(tex));m.renderOrder=2;car.add(m);DEC.push(m)};
 // El lado izquierdo del coche es +x (el coche mira hacia +z); el giro de cada proyección hace que los textos se lean desde fuera
 const side=(sd,u,v,sz,rz)=>{rz=rz||0;if(sd<2){const x=sd?bb.min.x:bb.max.x;return[new THREE.Vector3(x,bb.min.y+s.y*v,c.z+u*s.z*.45),new THREE.Euler(0,sd?-PI/2:PI/2,rz),new THREE.Vector3(sz,sz,s.x*.8)]}
  if(sd===2)return[new THREE.Vector3(c.x+v*0,bb.max.y,c.z+s.z*(.3+u*.12)),new THREE.Euler(-PI/2,0,PI+rz),new THREE.Vector3(sz,sz,s.y*1.2)];
  if(sd===3)return[new THREE.Vector3(c.x,bb.max.y,c.z+u*s.z*.2),new THREE.Euler(-PI/2,0,PI+rz),new THREE.Vector3(sz,sz,s.y*.6)];
  return[new THREE.Vector3(c.x+u*s.x*.3,bb.min.y+s.y*v,bb.min.z),new THREE.Euler(0,PI,rz),new THREE.Vector3(sz,sz,s.z*.5)]};
 if(L.st){const t=stripeTex(L.st,L.sc);if(L.st===3)for(const sd of[0,1])add(t,new THREE.Vector3(sd?bb.max.x:bb.min.x,bb.min.y+s.y*.42,c.z),new THREE.Euler(0,sd?PI/2:-PI/2,PI/2),new THREE.Vector3(s.y*1.2,s.z*1.05,s.x*.8));
  else add(t,new THREE.Vector3(c.x,bb.max.y,c.z),new THREE.Euler(-PI/2,0,0),new THREE.Vector3(s.x*.9,s.z*1.05,s.y*2.2))}
 if(L.num){const t=numTex(L.num,L.nc);for(const sd of[0,1])add(t,...side(sd,0,.42,s.y*.5));add(t,...side(2,0,.5,s.x*.45))}
 for(const k of L.stk){if(k.ci!==undefined&&!CUS.some(q=>q.id===k.ci))continue;const[p,r,z]=side(k.sd,k.u,k.v,s.y*.55*k.s,k.r);add(k.ci!==undefined?cusTex(k.ci):stkTex(k.i),p,r,z)}
 car.position.copy(P);car.rotation.copy(R);car.updateMatrixWorld(true)}

// --- Editor ---
let livK=0,livSel=-1,livPrev="cars",livA=.6;
function openLiv(){livPrev=state;state="liv";livK=carK;car.position.set(px,bodyY,pz);car.rotation.set(0,h,0);$("ov").hidden=false;$("ov").classList.add("liv");$("carsP").hidden=$("mapP").hidden=$("setP").hidden=true;$("livP").hidden=false;hudVis(false);$("touch").hidden=true;drawLiv()}
function closeLiv(){saveLiv();$("livP").hidden=true;$("ov").classList.remove("liv");if(livPrev==="play")resume();else show("cars")}
function livSet(o){Object.assign(LIV[livK],o);saveLiv();if(livK!==carK||o.c!==undefined||o.tint!==undefined)buildCar(livK);else applyDecals()}
function drawLiv(){const P=$("livP"),L=LIV[livK];P.innerHTML="<h1>Calcomanías</h1>";
 const sec=t=>{const h=document.createElement("h3");h.textContent=t;P.appendChild(h)},row=()=>{const r=document.createElement("div");r.className="lrow";P.appendChild(r);return r};
 const btn=(r,t,on,f,st)=>{const b=document.createElement("button");b.textContent=t;if(on)b.className="on";if(st)b.style.cssText=st;b.onclick=f;r.appendChild(b);return b};
 const sw=(r,cur2,f,allowNone)=>{if(allowNone)btn(r,"Original",cur2===undefined,()=>f(undefined));for(const c of PAL8)btn(r,"",cur2===c,()=>f(c),`background:#${c.toString(16).padStart(6,"0")};width:26px;height:26px;padding:0;border-radius:13px`);
  const i=document.createElement("input");i.type="color";i.value="#"+((cur2===undefined?0xffffff:cur2).toString(16).padStart(6,"0"));i.oninput=()=>f(parseInt(i.value.slice(1),16));r.appendChild(i)};
 let r=row();CARS.forEach((c,i)=>btn(r,c.n,i===livK,()=>{livK=i;livSel=-1;buildCar(i);drawLiv()}));
 sec("Packs");r=row();PACKS.forEach(p=>btn(r,p.n,false,()=>{LIV[livK]=Object.assign(LIVDEF(),JSON.parse(JSON.stringify(p.o)));saveLiv();buildCar(livK);drawLiv()}));btn(r,"Quitar todo",false,()=>{LIV[livK]=LIVDEF();saveLiv();buildCar(livK);drawLiv()});
 sec("Color de carrocería");sw(row(),L.c===undefined?CARS[livK].c:L.c,c=>livSet({c:c===undefined?CARS[livK].c:c}));
 sec("Llantas");sw(row(),L.wc,c=>{LIV[livK].wc=c;saveLiv();buildCar(livK)},true);
 sec("Cristales tintados");r=row();[[0,"Sin tintar"],[.35,"Claro"],[.65,"Oscuro"],[.9,"Muy oscuro"]].forEach(([v,t])=>btn(r,t,L.tint===v,()=>{livSet({tint:v});drawLiv()}));
 sec("Franjas");r=row();STRIPES.forEach((t,i)=>btn(r,t,L.st===i,()=>{livSet({st:i});drawLiv()}));if(L.st)sw(row(),L.sc,c=>livSet({sc:c}));
 sec("Dorsal (número de carreras)");r=row();const ni=document.createElement("input");ni.type="number";ni.min=0;ni.max=99;ni.value=L.num||"";ni.placeholder="Sin número";ni.oninput=()=>livSet({num:Math.max(0,Math.min(99,+ni.value||0))});r.appendChild(ni);if(L.num)sw(row(),L.nc,c=>livSet({nc:c}));
 sec("Pegatinas");{const p=document.createElement("p");p.style.cssText="font-size:11px;margin:0 0 6px";p.textContent="Las 12 primeras están dibujadas para el juego. Personaje Hachi: HachiStudio (CC0). Chica anime redonda: «Anime Girl» de Niabot (CC BY 3.0).";P.appendChild(p)}
 const g=document.createElement("div");g.className="stkg";STK.forEach((s,i)=>{const b=document.createElement("button");b.title=s.n;const cv=document.createElement("canvas");cv.width=cv.height=64;const x=cv.getContext("2d");x.scale(.25,.25);s.d(x);b.appendChild(cv);
  b.onclick=()=>{L.stk.push({i,sd:0,u:0,v:.5,s:1,r:0});livSel=L.stk.length-1;saveLiv();applyDecals();drawLiv()};g.appendChild(b)});P.appendChild(g);
 // Mis imágenes: subir desde el ordenador o el móvil, ponerlas y borrarlas
 sec("Mis imágenes");{const g2=document.createElement("div");g2.className="stkg";for(const c of CUS){const w=document.createElement("div");w.className="cusw";const b=document.createElement("button");b.title=c.n;const im=document.createElement("img");im.src=c.url;b.appendChild(im);
   b.onclick=()=>{L.stk.push({i:0,ci:c.id,sd:0,u:0,v:.5,s:1,r:0});livSel=L.stk.length-1;saveLiv();applyDecals();drawLiv()};
   const x=document.createElement("button");x.className="cusx";x.textContent="×";x.title="Borrar imagen";x.onclick=()=>{if(!confirm("¿Borrar esta imagen?"))return;CUS=CUS.filter(q=>q.id!==c.id);saveCus();for(const q of LIV)q.stk=q.stk.filter(s=>s.ci!==c.id);saveLiv();livSel=-1;applyDecals();drawLiv()};
   w.appendChild(b);w.appendChild(x);g2.appendChild(w)}P.appendChild(g2);
  const fi=document.createElement("input");fi.type="file";fi.accept="image/*";fi.hidden=true;fi.onchange=()=>{const f=fi.files[0];if(f)addCus(f,id=>{L.stk.push({i:0,ci:id,sd:0,u:0,v:.5,s:1,r:0});livSel=L.stk.length-1;saveLiv();applyDecals();drawLiv()})};
  const ub=document.createElement("button");ub.className="b g";ub.textContent="📷 Subir imagen";ub.onclick=()=>fi.click();P.appendChild(fi);P.appendChild(ub);
  const p=document.createElement("p");p.style.cssText="font-size:11px;margin:6px 0 0";p.textContent="Tus imágenes se guardan solo en este navegador. Las PNG con fondo transparente quedan mejor.";P.appendChild(p)}
 L.stk.forEach((k,j)=>{const d=document.createElement("div");d.className="stki"+(j===livSel?" on":"");d.innerHTML=`<b>${j+1}. ${stkName(k)}</b>`;d.onclick=e=>{if(e.target===d||e.target.tagName==="B"){livSel=j;drawLiv()}};P.appendChild(d);
  if(j!==livSel)return;const rr=document.createElement("div");rr.className="lrow";SIDES.forEach((t,q)=>btn(rr,t,k.sd===q,()=>{k.sd=q;saveLiv();applyDecals();drawLiv()}));d.appendChild(rr);
  for(const[key,t,mn,mx,st]of[["u","Delante / detrás",-1,1,.05],["v","Altura",.1,.9,.02],["s","Tamaño",.3,2.5,.05],["r","Giro",-3.14,3.14,.05]]){const q=document.createElement("label");q.className="lsl";q.innerHTML=`<span>${t}</span><input type="range" min="${mn}" max="${mx}" step="${st}" value="${k[key]||0}">`;
   q.querySelector("input").oninput=e=>{k[key]=+e.target.value;saveLiv();applyDecals()};d.appendChild(q)}
  const del=document.createElement("button");del.className="b g";del.textContent="Quitar pegatina";del.onclick=()=>{L.stk.splice(j,1);livSel=-1;saveLiv();applyDecals();drawLiv()};d.appendChild(del)});
 const ok=document.createElement("button");ok.className="b";ok.textContent="Listo";ok.onclick=closeLiv;P.appendChild(ok)}
// Girar la vista del coche arrastrando sobre la imagen mientras el editor está abierto
{let dx=null;$("c").addEventListener("pointerdown",e=>{if(state==="liv")dx=e.clientX});addEventListener("pointermove",e=>{if(state==="liv"&&dx!==null){livA-=(e.clientX-dx)*.01;dx=e.clientX}});addEventListener("pointerup",()=>dx=null)}
{const b=document.createElement("button");b.className="b g";b.textContent="🎨 Calcomanías";b.onclick=()=>{if(!ready)return;if(!spawned){buildCar(carK);spawnC();spawned=true}openLiv()};$("carsP").appendChild(b)}
