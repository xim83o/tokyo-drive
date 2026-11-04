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
 // hide: retirada a petición del usuario (se deja en la lista para no cambiar los números de las pegatinas guardadas)
 {n:"Chica anime",hide:1,d:g=>{g.fillStyle="#3b2a6b";g.beginPath();g.ellipse(128,112,92,96,0,0,7);g.fill();g.fillStyle="#ffe2cc";g.beginPath();g.ellipse(128,140,70,74,0,0,7);g.fill();
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
  const id=Date.now();CUS.push({id,url,n:file.name.replace(/\.[^.]+$/,"").slice(0,24)});if(!saveCus()){CUS.pop();alert(T("No queda espacio para más imágenes: borra alguna."));return}done(id)};im.onerror=()=>alert(T("No se pudo leer esa imagen."));im.src=rd2.result};rd2.readAsDataURL(file)}
const stkName=k=>k.ci!==undefined?((CUS.find(q=>q.id===k.ci)||{}).n||T("Mi imagen")):T(STK[k.i].n);
// Al cargar una imagen se redibujan sus pegatinas (texturas ya creadas y miniaturas del editor)
for(const src of new Set(STK.filter(s=>s.src).map(s=>s.src))){const im=new Image();IMGS[src]=im;im.onload=()=>{STK.forEach((s,i)=>{if(s.src!==src||!STKT[i])return;const c=STKT[i].image,g=c.getContext("2d");g.clearRect(0,0,256,256);s.d(g);STKT[i].needsUpdate=true});if(state==="liv")drawLiv()};im.src=src}
// Franjas: 0 ninguna · 1 central · 2 doble · 3 lateral · 4 diagonal
const STRIPES=["Ninguna","Central","Doble","Lateral","Diagonal"];
// Franjas con filetes finos a los lados (como las de los coches de carreras de verdad)
function stripeTex(st,col){const c="#"+new THREE.Color(col).getHexString();return canvasTex(128,512,g=>{g.fillStyle=c;if(st===1){g.fillRect(40,0,48,512);g.fillRect(32,0,3,512);g.fillRect(93,0,3,512)}
 else if(st===2){g.fillRect(36,0,22,512);g.fillRect(70,0,22,512);g.fillRect(30,0,2,512);g.fillRect(96,0,2,512)}else if(st===3){g.fillRect(52,0,22,512);g.fillRect(80,0,7,512)}
 else if(st===4){g.beginPath();g.moveTo(0,330);g.lineTo(128,170);g.lineTo(128,230);g.lineTo(0,390);g.closePath();g.fill()}})}
function numTex(n,col){const c="#"+new THREE.Color(col).getHexString();return canvasTex(256,256,g=>{g.fillStyle=c;g.beginPath();g.arc(128,128,116,0,7);g.fill();g.strokeStyle="#111";g.lineWidth=10;g.beginPath();g.arc(128,128,108,0,7);g.stroke();
 g.fillStyle=new THREE.Color(col).getHSL({}).l>.5?"#111":"#fff";g.font="italic 900 140px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(n,128,138)})}
// Packs ya hechos
const PACKS=[{n:"Franja negra",o:{st:1,sc:0x111111}},{n:"Rayas de carreras",o:{st:2,sc:0xffffff,num:7,nc:0xffffff}},{n:"Sakura",o:{c:0xffc4dc,st:3,sc:0xe2477d,stk:[{i:2,sd:0,u:.1,v:.5,s:1},{i:2,sd:1,u:.1,v:.5,s:1}]}},
 {n:"Drift Tokio",o:{c:0xf2f2f2,st:3,sc:0xe5173f,tint:.7,stk:[{i:7,sd:0,u:-.15,v:.55,s:1.1},{i:7,sd:1,u:-.15,v:.55,s:1.1},{i:6,sd:2,u:0,v:.5,s:1}]}},
 {n:"Llamas",o:{c:0x1b1c20,stk:[{i:8,sd:0,u:.45,v:.35,s:1.3},{i:8,sd:1,u:.45,v:.35,s:1.3}]}},{n:"Kitsune",o:{c:0xf2f2f2,st:1,sc:0xd61f26,stk:[{i:9,sd:2,u:0,v:.5,s:1}]}}];
// Lados donde se pega: 0 izquierda · 1 derecha · 2 capó · 3 techo · 4 detrás
const SIDES=["Izquierda","Derecha","Capó","Techo","Detrás"];
const DMAT=new Map();const dmat=t=>{if(!DMAT.has(t))DMAT.set(t,new THREE.MeshPhongMaterial({map:t,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,shininess:60,specular:0x222222}));return DMAT.get(t)};
let DEC=[];
function applyDecals(){if(!car||!carBody||!THREE.DecalGeometry)return;for(const m of DEC){car.remove(m);m.geometry.dispose()}DEC=[];const L=LIV[carK];
 // Llantas y neumáticos, cada uno de su color
 if((L.wc!==undefined||L.tc!==undefined)&&MODELS[cur.f]){const m=wheelMat(cur.f,L.wc,L.tc);for(const q of WHEELS)q.o.material=m}
 // Proyectar con el coche en el origen (las calcomanías quedan en coordenadas del coche)
 const P=car.position.clone(),R=car.rotation.clone();car.position.set(0,0,0);car.rotation.set(0,0,0);car.updateMatrixWorld(true);
 const bb=new THREE.Box3().setFromObject(carBody),c=bb.getCenter(new THREE.Vector3()),s=bb.getSize(new THREE.Vector3());
 // Todas las calcomanías se proyectan sobre una copia de la carrocería sin los cristales. Los cristales se reconocen por su color de
 // la paleta: el que más ocupa entre las caras inclinadas o verticales de la parte alta (parabrisas, luneta y ventanillas)
 const src=carBody.geometry.index?carBody.geometry.toNonIndexed():carBody.geometry,p=src.attributes.position,uv=src.attributes.uv,belt=bb.min.y+s.y*.5,TR=[],AC={};
 {const A=new THREE.Vector3(),B=new THREE.Vector3(),C=new THREE.Vector3(),n=new THREE.Vector3();
  for(let i=0;i<p.count;i+=3){A.fromBufferAttribute(p,i).applyMatrix4(carBody.matrixWorld);B.fromBufferAttribute(p,i+1).applyMatrix4(carBody.matrixWorld);C.fromBufferAttribute(p,i+2).applyMatrix4(carBody.matrixWorld);
   n.subVectors(B,A).cross(C.clone().sub(A));const ar=n.length();n.normalize();const cell=Math.floor((uv.getX(i)+uv.getX(i+1)+uv.getX(i+2))/3*8)+","+Math.floor((uv.getY(i)+uv.getY(i+1)+uv.getY(i+2))/3*4);
   if((A.y+B.y+C.y)/3>belt&&Math.abs(n.y)<.8)AC[cell]=(AC[cell]||0)+ar;TR.push([A.toArray(),B.toArray(),C.toArray(),cell])}}
 // Fuera también la parte gris de abajo (parachoques y bajos); las dos casillas las calcula bodyCells al cargar el modelo
 const MD=MODELS[cur.f],glass=MD.glass,trim=MD.trim;
 const out=[];for(const[a,b,c2,cell]of TR)if(cell!==glass&&cell!==trim)out.push(...a,...b,...c2);
 const pg=new THREE.BufferGeometry();pg.setAttribute("position",new THREE.Float32BufferAttribute(out,3));pg.computeVertexNormals();const pm=new THREE.Mesh(pg);
 const add=(tex,pos,rot,size)=>{const g=new THREE.DecalGeometry(pm,pos,rot,size);if(!g.attributes.position.count)return;const m=new THREE.Mesh(g,dmat(tex));m.renderOrder=2;car.add(m);DEC.push(m)};
 // El lado izquierdo del coche es +x (el coche mira hacia +z); el giro de cada proyección hace que los textos se lean desde fuera
 const side=(sd,u,v,sz,rz)=>{rz=rz||0;if(sd<2){const x=sd?bb.min.x:bb.max.x;return[new THREE.Vector3(x,bb.min.y+s.y*v,c.z+u*s.z*.45),new THREE.Euler(0,sd?-PI/2:PI/2,rz),new THREE.Vector3(sz,sz,s.x*.8)]}
  // Capó: se lee desde delante del coche (mirando hacia fuera)
  if(sd===2)return[new THREE.Vector3(c.x,bb.max.y,c.z+s.z*(.3+u*.12)),new THREE.Euler(-PI/2,0,rz),new THREE.Vector3(sz,sz,s.y*1.2)];
  if(sd===3)return[new THREE.Vector3(c.x,bb.max.y,c.z+u*s.z*.2),new THREE.Euler(-PI/2,0,PI+rz),new THREE.Vector3(sz,sz,s.y*.6)];
  return[new THREE.Vector3(c.x+u*s.x*.3,bb.min.y+s.y*v,bb.min.z),new THREE.Euler(0,PI,rz),new THREE.Vector3(sz,sz,s.z*.5)]};
 if(L.st){const t=stripeTex(L.st,L.sc);if(L.st===3)for(const sd of[0,1])add(t,new THREE.Vector3(sd?bb.max.x:bb.min.x,bb.min.y+s.y*.42,c.z),new THREE.Euler(0,sd?PI/2:-PI/2,PI/2),new THREE.Vector3(s.y*1.2,s.z*1.05,s.x*.8));
  else add(t,new THREE.Vector3(c.x,bb.max.y,c.z),new THREE.Euler(-PI/2,0,0),new THREE.Vector3(s.x*.9,s.z*1.05,s.y*2.2))}
 // Dorsal: en los sitios elegidos (np: lados, capó, techo, detrás; por defecto los dos lados y el capó). Cada uno se ajusta a la
 // chapa (fitNum): se proyecta perpendicular a la superficie de ese punto, así no se estira en el capó inclinado ni en los lados
 // curvos, y se encoge hasta que el círculo cabe entero en chapa sin cristales, pasos de rueda ni bajos, así no sale a trozos
 if(L.num){const t=numTex(L.num,L.nc);pm.material.side=THREE.DoubleSide;pm.updateMatrixWorld(true);NUMW=WHEELS.map(q=>new THREE.Box3().setFromObject(q.o).expandByScalar(.04));
  // Hasta qué profundidad desde la caja del coche puede estar la chapa de cada sitio (así el del techo no acaba en el capó
  // a través del hueco del parabrisas)
  NUMD=[s.x*.3,s.x*.3,99,s.y*.2,s.z*.15];
  for(const sd of(L.np||[0,1,2])){const f=fitNum(pm,side,sd,sd<2?.45:sd===4?.55:.5,sd<2?Math.min(s.y*.62,s.z*.3):sd===4?Math.min(s.y*.5,s.x*.4):s.x*.5);if(f)add(t,...f)}}
 for(const k of L.stk){if(k.ci!==undefined?!CUS.some(q=>q.id===k.ci):STK[k.i].hide)continue;const[p,r,z]=side(k.sd,k.u,k.v,s.y*.55*k.s,k.r);add(k.ci!==undefined?cusTex(k.ci):stkTex(k.i),p,r,z)}
 car.position.copy(P);car.rotation.copy(R);car.updateMatrixWorld(true)}

// Ajuste del dorsal a la carrocería (pm, en coordenadas del coche). Devuelve [posición, giro, tamaño] para DecalGeometry o null
// NUMW: cajas de las ruedas (en los lados el dorsal no puede quedar detrás de una rueda) · NUMD: profundidad máxima de cada sitio
// NUMC: resultados ya calculados de cada modelo y sitio (la forma no cambia al cambiar colores)
const RCN=new THREE.Raycaster(),NUMC=new Map();let NUMW=[],NUMD=[];
// Busca por una rejilla de puntos de ese sitio (más adelante, atrás, arriba, abajo) el que deja el círculo más grande; los más
// cercanos al sitio de siempre ganan si el tamaño es casi igual
function fitNum(pm,side,sd,v,s0){const key=cur.f+"|"+sd;if(NUMC.has(key)){const r=NUMC.get(key);return r&&[r[0].clone(),r[1].clone(),r[2].clone()]}
 const C=[],rg=(a,b,st)=>{const o=[];for(let x=a;x<=b+1e-6;x+=st)o.push(+x.toFixed(3));return o};
 const U=sd<2?rg(-.5,.5,.125):sd===4?rg(-.6,.6,.2):rg(-1,1,.25),V=sd<2?rg(.25,.7,.05):sd===4?rg(.3,.8,.1):[v];
 for(const u of U)for(const vv of V)C.push([u,vv,Math.abs(u)+Math.abs(vv-v)*2]);C.sort((a,b)=>a[2]-b[2]);
 let best=null;for(const[u,vv]of C){const f=fitNum1(pm,side,sd,u,vv,s0,best?best[2].x*1.06:.14);if(f)best=f}
 NUMC.set(key,best);return best&&[best[0].clone(),best[1].clone(),best[2].clone()]}
function fitNum1(pm,side,sd,u,v,s0,need){const[p0,e0]=side(sd,u,v,s0),q=new THREE.Quaternion().setFromEuler(e0),out=new THREE.Vector3(0,0,1).applyQuaternion(q),up0=new THREE.Vector3(0,1,0).applyQuaternion(q);
 const cast=(o,d)=>{RCN.set(o,d);RCN.far=8;return RCN.intersectObject(pm,false)[0]};
 const h0=cast(p0.clone().addScaledVector(out,3),out.clone().negate());if(!h0||h0.distance-3>NUMD[sd])return null;
 // Normal media alrededor del punto (la chapa es curva)
 const n=new THREE.Vector3(),ax=new THREE.Vector3().crossVectors(up0,out);
 for(const[a,b]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const o=h0.point.clone().addScaledVector(ax,a*.06).addScaledVector(up0,b*.06).addScaledVector(out,3),h=cast(o,out.clone().negate());if(h){const fn=h.face.normal.clone();if(fn.dot(out)<0)fn.negate();n.add(fn)}}
 n.normalize();const y=up0.clone().addScaledVector(n,-n.dot(up0)).normalize(),x=new THREE.Vector3().crossVectors(y,n);
 // ¿Cabe un círculo de tamaño s? Todo en chapa (sin huecos de cristal ni bajos), casi en el mismo plano y sin ruedas delante
 const fits=s=>{for(const[r,m]of[[.47,14],[.28,8]])for(let i=0;i<m;i++){const a=i/m*PI*2,P=h0.point.clone().addScaledVector(x,Math.cos(a)*r*s).addScaledVector(y,Math.sin(a)*r*s);
   if(sd<2&&NUMW.some(b=>P.y<b.max.y&&P.z>b.min.z&&P.z<b.max.z))return false;const h=cast(P.clone().addScaledVector(n,1),n.clone().negate());
   if(!h||Math.abs(h.distance-1)>s*.1+.02||Math.abs(h.face.normal.dot(n))<.88)return false}return true};
 if(need>s0||!fits(need))return null;let lo=need,hi=s0;if(fits(hi))lo=hi;else for(let it=0;it<5;it++){const m=(lo+hi)/2;if(fits(m))lo=m;else hi=m}
 return[h0.point.clone(),new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,y,n)),new THREE.Vector3(lo,lo,Math.max(.3,lo*.6))]}
// --- Concesionario "Tokyo Drive Motors" ---
// Fondo del editor: la ciudad (el coche donde esté) o la sala de exposición, construida aparte, 300 m por debajo del mapa:
// suelo brillante, plataforma giratoria, paredes blancas con el logotipo, tiras de luz y techo con paneles luminosos
let livBg=ENV.livbg||"city",SHOW=null,DMK=null,dealerCool=true;const SR={x:1200,y:-300,z:1200};
const dealerOn=()=>state==="liv"&&livBg==="dealer";
function logoTex(w,h){return canvasTex(w,h,g=>{g.fillStyle="#111";g.fillRect(0,0,w,h);g.fillStyle="#e5173f";g.fillRect(0,h*.78,w,h*.1);g.fillStyle="#fff";g.font=`italic 900 ${h*.42}px system-ui`;g.textAlign="center";g.textBaseline="middle";g.fillText("TOKYO DRIVE MOTORS",w/2,h*.4);
 g.font=`bold ${h*.14}px 'Yu Gothic','Meiryo',sans-serif`;g.fillStyle="#ff9aa8";g.fillText("東京ドライブ・モーターズ",w/2,h*.66)})}
function buildShowroom(){if(SHOW)return;const g=new THREE.Group();g.position.set(SR.x,SR.y,SR.z);
 const fl=canvasTex(256,256,(c)=>{c.fillStyle="#2b2d32";c.fillRect(0,0,256,256);c.fillStyle="#3a3c42";c.fillRect(0,0,256,3);c.fillRect(0,0,3,256)},true);fl.repeat.set(9,7);
 const box=(w,hh,d,m,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,hh,d),m);o.position.set(x,y,z);g.add(o);return o};
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(36,28).rotateX(-PI/2),new THREE.MeshPhongMaterial({map:fl,shininess:140,specular:0x777777,envMap:SKYCUBE,reflectivity:.18,emissive:0x111214}));g.add(floor);
 const tt=new THREE.Mesh(new THREE.CylinderGeometry(3.8,3.9,.1,64),new THREE.MeshPhongMaterial({color:0xcfd2d6,shininess:120,specular:0x999999,emissive:0x202224}));tt.position.y=.05;g.add(tt);
 // Paredes de listones verticales de madera clara con huecos oscuros (estilo japonés moderno)
 const wd=canvasTex(256,256,(c)=>{const r=rng(13);for(let x=0;x<256;x+=16){const l=150+r()*30|0;c.fillStyle=`rgb(${l+40},${l},${l-50})`;c.fillRect(x,0,12,256);c.fillStyle="rgba(90,60,30,.18)";for(let k=0;k<6;k++)c.fillRect(x+r()*12,0,1,256);c.fillStyle="#2a2018";c.fillRect(x+12,0,4,256)}},true);wd.repeat.set(6,1);
 const wall=new THREE.MeshLambertMaterial({map:wd,emissive:0x3a2c1e}),dark=new THREE.MeshLambertMaterial({color:0x1b1d22,emissive:0x0a0b0d}),strip=new THREE.MeshBasicMaterial({color:0xfff4e4});
 box(36,9,.3,wall,0,4.5,-14);box(36,9,.3,dark,0,4.5,14);box(.3,9,28,wall,-18,4.5,0);box(.3,9,28,wall,18,4.5,0);
 const lg=new THREE.Mesh(new THREE.PlaneGeometry(16,2.5),new THREE.MeshBasicMaterial({map:logoTex(1024,160)}));lg.position.set(0,5.6,-13.8);g.add(lg);
 for(const x of[-14,-7,7,14])box(.25,6.5,.08,strip,x,4,-13.82);for(const z of[-9,-3,3,9]){box(.08,6.5,.25,strip,-17.82,4,z);box(.08,6.5,.25,strip,17.82,4,z)}
 const ce=canvasTex(256,256,(c)=>{c.fillStyle="#2a2b2e";c.fillRect(0,0,256,256);c.fillStyle="#fffaf0";for(let y=0;y<4;y++)for(let x=0;x<4;x++)c.fillRect(20+x*60,24+y*60,36,22)},true);ce.repeat.set(3,2);
 const ceil=new THREE.Mesh(new THREE.PlaneGeometry(36,28).rotateX(PI/2),new THREE.MeshBasicMaterial({map:ce}));ceil.position.y=8.6;g.add(ceil);
 g.visible=false;sc.add(g);SHOW=g}
// Marca en la calle delante del concesionario (anillo que late) y cartel luminoso en el tejado. Al parar encima se abre el editor
function buildDealer(){if(!DEALER||DMK)return;DMK=new THREE.Group();DMK.position.set(DEALER.x,.06,DEALER.z);
 DMK.add(new THREE.Mesh(new THREE.RingGeometry(2.6,3.2,48).rotateX(-PI/2),new THREE.MeshBasicMaterial({color:0x29d3ff,transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false})));
 const ic=canvasTex(128,128,(c)=>{c.font="84px system-ui";c.textAlign="center";c.textBaseline="middle";c.fillText("🎨",64,70)});DMK.add(new THREE.Mesh(new THREE.PlaneGeometry(2.4,2.4).rotateX(-PI/2),new THREE.MeshBasicMaterial({map:ic,transparent:true,depthWrite:false})));
 sc.add(DMK);
 const s=new THREE.Mesh(new THREE.PlaneGeometry(14,2.2),new THREE.MeshLambertMaterial({map:logoTex(1024,160),emissiveMap:logoTex(1024,160),emissive:0xffffff,emissiveIntensity:.3,side:THREE.DoubleSide}));
 // En el borde del tejado que da a la calle (desde el centro del edificio hacia la marca, hasta salir de él)
 const dx=DEALER.x-DEALER.bx,dz=DEALER.z-DEALER.bz,l=Math.hypot(dx,dz)||1;let t=0;while(t<l&&inBuilding(DEALER.bx+dx/l*(t+1),DEALER.bz+dz/l*(t+1)))t++;
 NM.sign.push(s.material);s.position.set(DEALER.bx+dx/l*Math.max(0,t-.6),11.2,DEALER.bz+dz/l*Math.max(0,t-.6));s.rotation.y=Math.atan2(dx,dz);sc.add(s)}
// Cada imagen: anillo que late y entrar al concesionario al pasar despacio por encima (hay que salir de la marca para volver a entrar)
function dealerTick(){if(!ready)return;buildDealer();if(!DMK)return;const k=1+Math.sin(performance.now()/300)*.06;DMK.scale.set(k,1,k);
 if(state!=="play")return;const d=Math.hypot(px-DEALER.x,pz-DEALER.z);if(d>9)dealerCool=false;if(d<3.2&&Math.hypot(vx,vz)<9&&!dealerCool){dealerCool=true;vx=vz=0;livBg="dealer";openLiv()}}
// Centro de la vista del editor: el coche en la ciudad o en la plataforma del concesionario
function livCenter(){return dealerOn()?SR:{x:px,y:bodyY,z:pz}}
// Focos de estudio: en el concesionario siempre; en la ciudad, de noche (siempre están en la escena con intensidad 0 para que no
// se recompilen los materiales al encenderlos)
const STUDIO=[0,1,2].map(()=>{const l=new THREE.SpotLight(0xfff6ea,0,30,.55,.6,1);sc.add(l,l.target);return l});
function studio(){dealerTick();const dl=dealerOn();if(SHOW)SHOW.visible=dl;if(state==="liv"&&car){const c=livCenter();car.position.set(c.x,c.y+(dl?.1:0),c.z);car.rotation.set(0,h,0)}
 const on=state==="liv"&&(dl||NF>.12),c=livCenter();STUDIO.forEach((l,i)=>{l.intensity=on?(dl?[1.1,1.1,.8][i]:NF*(i===2?.45:.75)):0;if(!on)return;const a=h+[.9,-2.2,PI][i],d=[5.5,5.5,6.5][i];
 l.position.set(c.x+Math.sin(a)*d,c.y+[4.5,4,6][i],c.z+Math.cos(a)*d);l.target.position.set(c.x,c.y+.6,c.z);l.target.updateMatrixWorld()})}
// --- Editor ---
let livK=0,livSel=-1,livPrev="cars",livA=.6;
function openLiv(){livPrev=state;state="liv";livK=carK;if(livBg==="dealer")buildShowroom();$("ov").hidden=false;$("ov").classList.add("liv");$("carsP").hidden=$("mapP").hidden=$("setP").hidden=true;$("livP").hidden=false;hudVis(false);$("touch").hidden=true;drawLiv()}
function closeLiv(){saveLiv();$("livP").hidden=true;$("ov").classList.remove("liv");if(livPrev==="play")resume();else show("cars")}
function livSet(o){Object.assign(LIV[livK],o);saveLiv();if(livK!==carK||"c" in o||"tint" in o||"gc" in o||"bc" in o)buildCar(livK);else applyDecals()}
function drawLiv(){const P=$("livP"),L=LIV[livK];P.innerHTML=`<h1>${T("Calcomanías")}</h1>`;
 const sec=t=>{const h=document.createElement("h3");h.textContent=T(t);P.appendChild(h)},row=()=>{const r=document.createElement("div");r.className="lrow";P.appendChild(r);return r};
 const btn=(r,t,on,f,st)=>{const b=document.createElement("button");b.textContent=T(t);if(on)b.className="on";if(st)b.style.cssText=st;b.onclick=f;r.appendChild(b);return b};
 const sw=(r,cur2,f,allowNone)=>{if(allowNone)btn(r,"Original",cur2===undefined,()=>f(undefined));for(const c of PAL8)btn(r,"",cur2===c,()=>f(c),`background:#${c.toString(16).padStart(6,"0")};width:26px;height:26px;padding:0;border-radius:13px`);
  const i=document.createElement("input");i.type="color";i.value="#"+((cur2===undefined?0xffffff:cur2).toString(16).padStart(6,"0"));i.oninput=()=>f(parseInt(i.value.slice(1),16));r.appendChild(i)};
 let r=row();CARS.forEach((c,i)=>btn(r,c.n,i===livK,()=>{livK=i;livSel=-1;buildCar(i);drawLiv()}));
 sec("Fondo");r=row();[["city","Ciudad"],["dealer","Concesionario"]].forEach(([v,t])=>btn(r,t,livBg===v,()=>{livBg=v;ENV.livbg=v;saveEnv();if(v==="dealer")buildShowroom();drawLiv()}));
 sec("Packs");r=row();PACKS.forEach(p=>btn(r,p.n,false,()=>{LIV[livK]=Object.assign(LIVDEF(),JSON.parse(JSON.stringify(p.o)));saveLiv();buildCar(livK);drawLiv()}));btn(r,"Quitar todo",false,()=>{LIV[livK]=LIVDEF();saveLiv();buildCar(livK);drawLiv()});
 sec("Color de carrocería");sw(row(),L.c===undefined?CARS[livK].c:L.c,c=>livSet({c:c===undefined?CARS[livK].c:c}));
 sec("Llantas");sw(row(),L.wc,c=>{LIV[livK].wc=c;saveLiv();buildCar(livK)},true);
 sec("Neumáticos");sw(row(),L.tc,c=>{LIV[livK].tc=c;saveLiv();buildCar(livK)},true);
 sec("Cristales tintados");r=row();[[0,"Sin tintar"],[.35,"Claro"],[.65,"Oscuro"],[.9,"Muy oscuro"]].forEach(([v,t])=>btn(r,t,L.tint===v,()=>{livSet({tint:v});drawLiv()}));
 sec("Color del cristal");r=row();[[undefined,"Original"],[0x7fb2e6,"Azulado"],[0x7fd6a8,"Verde"],[0x5a5e66,"Ahumado"],[0xe6c46a,"Dorado"]].forEach(([v,t])=>btn(r,t,L.gc===v,()=>{livSet({gc:v});drawLiv()}));
 sec("Parachoques y bajos");sw(row(),L.bc,c=>{livSet({bc:c});drawLiv()},true);
 sec("Franjas");r=row();STRIPES.forEach((t,i)=>btn(r,t,L.st===i,()=>{livSet({st:i});drawLiv()}));if(L.st)sw(row(),L.sc,c=>livSet({sc:c}));
 sec("Dorsal (número de carreras)");r=row();const ni=document.createElement("input");ni.type="number";ni.min=0;ni.max=99;ni.value=L.num||"";ni.placeholder=T("Sin número");ni.oninput=()=>{const was=!!L.num;livSet({num:Math.max(0,Math.min(99,+ni.value||0))});
  // Al poner o quitar el número aparecen o se van las opciones de color y sitio (y el cuadro sigue activo para seguir escribiendo)
  if(was!==!!L.num){drawLiv();const n2=P.querySelector("input[type=number]");if(n2)n2.focus()}};r.appendChild(ni);
 if(L.num){sw(row(),L.nc,c=>livSet({nc:c}));
  // Dónde va (se pueden marcar varios sitios); el tamaño se ajusta solo a la chapa de cada sitio
  r=row();const np=L.np||[0,1,2];SIDES.forEach((t,q)=>btn(r,t,np.includes(q),()=>{const a=(L.np||[0,1,2]).slice(),i=a.indexOf(q);if(i>=0)a.splice(i,1);else a.push(q);livSet({np:a.sort()});drawLiv()}))}
 sec("Pegatinas");{const p=document.createElement("p");p.style.cssText="font-size:11px;margin:0 0 6px";p.textContent=T("Las 11 primeras están dibujadas para el juego. Personaje Hachi: HachiStudio (CC0). Chica anime redonda: «Anime Girl» de Niabot (CC BY 3.0).");P.appendChild(p)}
 const g=document.createElement("div");g.className="stkg";STK.forEach((s,i)=>{if(s.hide)return;const b=document.createElement("button");b.title=T(s.n);const cv=document.createElement("canvas");cv.width=cv.height=64;const x=cv.getContext("2d");x.scale(.25,.25);s.d(x);b.appendChild(cv);
  b.onclick=()=>{L.stk.push({i,sd:0,u:0,v:.5,s:1,r:0});livSel=L.stk.length-1;saveLiv();applyDecals();drawLiv()};g.appendChild(b)});P.appendChild(g);
 // Mis imágenes: subir desde el ordenador o el móvil, ponerlas y borrarlas
 sec("Mis imágenes");{const g2=document.createElement("div");g2.className="stkg";for(const c of CUS){const w=document.createElement("div");w.className="cusw";const b=document.createElement("button");b.title=c.n;const im=document.createElement("img");im.src=c.url;b.appendChild(im);
   b.onclick=()=>{L.stk.push({i:0,ci:c.id,sd:0,u:0,v:.5,s:1,r:0});livSel=L.stk.length-1;saveLiv();applyDecals();drawLiv()};
   const x=document.createElement("button");x.className="cusx";x.textContent="×";x.title=T("Borrar imagen");x.onclick=()=>{if(!confirm(T("¿Borrar esta imagen?")))return;CUS=CUS.filter(q=>q.id!==c.id);saveCus();for(const q of LIV)q.stk=q.stk.filter(s=>s.ci!==c.id);saveLiv();livSel=-1;applyDecals();drawLiv()};
   w.appendChild(b);w.appendChild(x);g2.appendChild(w)}P.appendChild(g2);
  const fi=document.createElement("input");fi.type="file";fi.accept="image/*";fi.hidden=true;fi.onchange=()=>{const f=fi.files[0];if(f)addCus(f,id=>{L.stk.push({i:0,ci:id,sd:0,u:0,v:.5,s:1,r:0});livSel=L.stk.length-1;saveLiv();applyDecals();drawLiv()})};
  const ub=document.createElement("button");ub.className="b g";ub.textContent=T("📷 Subir imagen");ub.onclick=()=>fi.click();P.appendChild(fi);P.appendChild(ub);
  const p=document.createElement("p");p.style.cssText="font-size:11px;margin:6px 0 0";p.textContent=T("Tus imágenes se guardan solo en este navegador. Las PNG con fondo transparente quedan mejor.");P.appendChild(p)}
 L.stk.forEach((k,j)=>{if(k.ci===undefined&&STK[k.i].hide)return;const d=document.createElement("div");d.className="stki"+(j===livSel?" on":"");d.innerHTML=`<b>${j+1}. ${stkName(k)}</b>`;d.onclick=e=>{if(e.target===d||e.target.tagName==="B"){livSel=j===livSel?-1:j;drawLiv()}};P.appendChild(d);
  // × para quitar la pegatina directamente desde la lista
  const x=document.createElement("button");x.className="cusx stkx";x.textContent="×";x.title=T("Quitar pegatina");x.onclick=e=>{e.stopPropagation();L.stk.splice(j,1);livSel=-1;saveLiv();applyDecals();drawLiv()};d.appendChild(x);
  if(j!==livSel)return;const rr=document.createElement("div");rr.className="lrow";SIDES.forEach((t,q)=>btn(rr,t,k.sd===q,()=>{k.sd=q;saveLiv();applyDecals();drawLiv()}));d.appendChild(rr);
  for(const[key,t,mn,mx,st]of[["u","Delante / detrás",-1,1,.05],["v","Altura",.1,.9,.02],["s","Tamaño",.3,2.5,.05],["r","Giro",-3.14,3.14,.05]]){const q=document.createElement("label");q.className="lsl";q.innerHTML=`<span>${T(t)}</span><input type="range" min="${mn}" max="${mx}" step="${st}" value="${k[key]||0}">`;
   q.querySelector("input").oninput=e=>{k[key]=+e.target.value;saveLiv();applyDecals()};d.appendChild(q)}
  const del=document.createElement("button");del.className="b g";del.textContent=T("Quitar pegatina");del.onclick=()=>{L.stk.splice(j,1);livSel=-1;saveLiv();applyDecals();drawLiv()};d.appendChild(del)});
 const ok=document.createElement("button");ok.className="b";ok.textContent=T("Listo");ok.onclick=closeLiv;P.appendChild(ok)}
// Girar la vista del coche arrastrando sobre la imagen mientras el editor está abierto
{let dx=null;$("c").addEventListener("pointerdown",e=>{if(state==="liv")dx=e.clientX});addEventListener("pointermove",e=>{if(state==="liv"&&dx!==null){livA-=(e.clientX-dx)*.01;dx=e.clientX}});addEventListener("pointerup",()=>dx=null)}
{const b=document.createElement("button");b.className="b g";b.dataset.i18n="🎨 Calcomanías";b.textContent=T("🎨 Calcomanías");b.onclick=()=>{if(!ready)return;if(!spawned){buildCar(carK);spawnC();spawned=true}openLiv()};$("carsP").appendChild(b)}
