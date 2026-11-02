// Mapa real (OpenStreetMap, ver tools/): consultas de superficie y colisión exacta, suelo, calzada, bordillos, agua y vías.
// Edificios en buildings.js, Torre de Tokio en tower.js, árboles y mobiliario urbano en props.js
const MAPNAME="tokyo-tower",HC=20,CURB=.15;
let MAP=null,ready=false,mapImg=null,TA=0;   // TA: giro de la Torre de Tokio (su base está alineada con FootTown)
// Rejilla espacial: cada celda de 20 m guarda índices de bordes (e), cápsulas (c), polígonos (p), círculos (o) y tramos de calle (r)
const CELLS=new Map(),EMPTY={e:[],c:[],p:[],o:[],r:[]};
function gadd(x0,z0,x1,z1,list,v){const i0=Math.floor(x0/HC),i1=Math.floor(x1/HC),j0=Math.floor(z0/HC),j1=Math.floor(z1/HC);
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i*4096+j;let c=CELLS.get(k);if(!c){c={e:[],c:[],p:[],o:[],r:[]};CELLS.set(k,c)}c[list].push(v)}}
const gq=(x,z)=>CELLS.get(Math.floor(x/HC)*4096+Math.floor(z/HC))||EMPTY;
// Datos planos: bordes [ax,az,bx,bz] · cápsulas [ax,az,bx,bz,r] · polígonos (anillo, caja, altura) · círculos [x,z,r] · tramos [ax,az,bx,bz,medio ancho,calle]
const EG=[],CP=[],PL=[],PLB=[],PLH=[],CI=[],RSG=[];
let _cx=0,_cz=0;
function segD2(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;let t=l?((px-ax)*dx+(pz-az)*dz)/l:0;t=t<0?0:t>1?1:t;_cx=ax+dx*t;_cz=az+dz*t;return(px-_cx)**2+(pz-_cz)**2}
function inPoly(r,x,z){let c=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const zi=r[i+1],zj=r[j+1];if((zi>z)!==(zj>z)&&x<(r[j]-r[i])*(z-zi)/(zj-zi)+r[i])c=!c}return c}
function addEdge(ax,az,bx,bz){const k=EG.length/4;EG.push(ax,az,bx,bz);gadd(Math.min(ax,bx)-3,Math.min(az,bz)-3,Math.max(ax,bx)+3,Math.max(az,bz)+3,"e",k)}
function addCaps(ax,az,bx,bz,r){const k=CP.length/5;CP.push(ax,az,bx,bz,r);gadd(Math.min(ax,bx)-r-3,Math.min(az,bz)-r-3,Math.max(ax,bx)+r+3,Math.max(az,bz)+r+3,"c",k)}
function addCirc(x,z,r){const k=CI.length/3;CI.push(x,z,r);gadd(x-r-3,z-r-3,x+r+3,z+r+3,"o",k)}
function addPoly(R,h){const k=PL.length;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<R.length;i+=2){x0=Math.min(x0,R[i]);x1=Math.max(x1,R[i]);z0=Math.min(z0,R[i+1]);z1=Math.max(z1,R[i+1])}
 PL.push(R);PLB.push(x0,z0,x1,z1);PLH.push(h||0);gadd(x0-3,z0-3,x1+3,z1+3,"p",k);for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)addEdge(R[j],R[j+1],R[i],R[i+1])}
// ¿Calzada? Devuelve el índice de la calle o -1 (acera, parque, solar...)
function roadAt(x,z){for(const k of gq(x,z).r){const o=k*6;if(segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3])<RSG[o+4]*RSG[o+4])return RSG[o+5]}return -1}
const surfH=(x,z)=>roadAt(x,z)>=0?0:CURB;
function polyAt(x,z){const c=gq(x,z);for(const k of c.p){const b=k*4;if(x>=PLB[b]&&x<=PLB[b+2]&&z>=PLB[b+1]&&z<=PLB[b+3]&&inPoly(PL[k],x,z))return k}return -1}
const inBuilding=(x,z)=>polyAt(x,z)>=0;
// La cámara no puede quedar dentro de un edificio (por debajo de su tejado)
function camBlocked(x,y,z){const k=polyAt(x,z);return k>=0&&y<PLH[k]+1}
function blockedAt(x,z,m){const c=gq(x,z);if(inBuilding(x,z))return true;m=m||0;
 for(const k of c.c){const o=k*5;if(segD2(x,z,CP[o],CP[o+1],CP[o+2],CP[o+3])<(CP[o+4]+m)**2)return true}
 for(const k of c.o){const o=k*3;if((x-CI[o])**2+(z-CI[o+1])**2<(CI[o+2]+m)**2)return true}return false}
// Colisión exacta de un círculo {x,z} de radio r: lo saca de edificios, agua, vías, ríos y postes. Devuelve la normal del choque o null
const HIT={nx:0,nz:0,d:0};
function collide(o,r){HIT.nx=HIT.nz=HIT.d=0;
 const ph=(nx,nz,d)=>{HIT.nx+=nx*d;HIT.nz+=nz*d;HIT.d=Math.max(HIT.d,d)};
 for(let it=0;it<3;it++){const c=gq(o.x,o.z);let mv=false;
  for(const k of c.p){const b=k*4;if(o.x<PLB[b]||o.x>PLB[b+2]||o.z<PLB[b+1]||o.z>PLB[b+3])continue;const R=PL[k];if(!inPoly(R,o.x,o.z))continue;
   let best=1e9,bx=0,bz=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2){const d=segD2(o.x,o.z,R[j],R[j+1],R[i],R[i+1]);if(d<best){best=d;bx=_cx;bz=_cz}}
   const d=Math.sqrt(best)||1e-6,nx=(bx-o.x)/d,nz=(bz-o.z)/d;o.x=bx+nx*r;o.z=bz+nz*r;ph(nx,nz,d+r);mv=true}
  for(const k of c.e){const b=k*4,d2=segD2(o.x,o.z,EG[b],EG[b+1],EG[b+2],EG[b+3]);if(d2<r*r&&d2>1e-9){const d=Math.sqrt(d2),nx=(o.x-_cx)/d,nz=(o.z-_cz)/d;o.x+=nx*(r-d);o.z+=nz*(r-d);ph(nx,nz,r-d);mv=true}}
  for(const k of c.c){const b=k*5,rr=r+CP[b+4],d2=segD2(o.x,o.z,CP[b],CP[b+1],CP[b+2],CP[b+3]);if(d2<rr*rr&&d2>1e-9){const d=Math.sqrt(d2),nx=(o.x-_cx)/d,nz=(o.z-_cz)/d;o.x+=nx*(rr-d);o.z+=nz*(rr-d);ph(nx,nz,rr-d);mv=true}}
  for(const k of c.o){const b=k*3,rr=r+CI[b+2],dx=o.x-CI[b],dz=o.z-CI[b+1],d2=dx*dx+dz*dz;if(d2<rr*rr&&d2>1e-9){const d=Math.sqrt(d2);o.x+=dx/d*(rr-d);o.z+=dz/d*(rr-d);ph(dx/d,dz/d,rr-d);mv=true}}
  if(!mv)break}
 if(!HIT.d)return null;const l=Math.hypot(HIT.nx,HIT.nz)||1;HIT.nx/=l;HIT.nz/=l;return HIT}

// --- Utilidades de geometría ---
function flatTri(a,y,ax,az,bx,bz,cx,cz){if((bz-az)*(cx-ax)-(bx-ax)*(cz-az)<0){const t=bx;bx=cx;cx=t;const u=bz;bz=cz;cz=u}a.push(ax,y,az,bx,y,bz,cx,y,cz)}
function quad(a,x0,z0,x1,z1,hw,y){const l=Math.hypot(x1-x0,z1-z0)||1,lx=(z1-z0)/l*hw,lz=-(x1-x0)/l*hw;flatTri(a,y,x0+lx,z0+lz,x1+lx,z1+lz,x1-lx,z1-lz);flatTri(a,y,x0+lx,z0+lz,x1-lx,z1-lz,x0-lx,z0-lz)}
function ribbon(a,p,hw,y,disc){for(let i=2;i<p.length;i+=2)quad(a,p[i-2],p[i-1],p[i],p[i+1],hw,y);
 if(disc)for(let i=0;i<p.length;i+=2)for(let k=0;k<10;k++){const a0=k/10*PI*2,a1=(k+1)/10*PI*2;flatTri(a,y,p[i],p[i+1],p[i]+Math.cos(a0)*hw,p[i+1]+Math.sin(a0)*hw,p[i]+Math.cos(a1)*hw,p[i+1]+Math.sin(a1)*hw)}}
function polyFill(a,R,y){const v=[];for(let i=0;i<R.length;i+=2)v.push(new THREE.Vector2(R[i],R[i+1]));const f=THREE.ShapeUtils.triangulateShape(v,[]);
 // Si la triangulación falla (polígono que se cruza) se rellena en abanico desde el centro
 if(!f.length){let cx=0,cz=0;for(const p of v){cx+=p.x;cz+=p.y}cx/=v.length;cz/=v.length;for(let i=0;i<v.length;i++){const q=v[(i+1)%v.length];flatTri(a,y,cx,cz,v[i].x,v[i].y,q.x,q.y)}return}
 for(const t of f)flatTri(a,y,v[t[0]].x,v[t[0]].y,v[t[1]].x,v[t[1]].y,v[t[2]].x,v[t[2]].y)}
function mkMesh(pos,mat,ro,extra,shadow){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
 if(extra)for(const k in extra)g.setAttribute(k,new THREE.Float32BufferAttribute(extra[k],k==="uv"?2:3));if(!extra||!extra.normal)g.computeVertexNormals();
 const m=new THREE.Mesh(g,mat);if(ro!==undefined)m.renderOrder=ro;if(shadow){m.castShadow=shadow>1;m.receiveShadow=true}sc.add(m);return m}
const flat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4},o||{}));
// Instancias: cada elemento [x,y,z,giro,escala,escalaY,color]; q = calidad mínima para mostrarse (0 baja … 3 ultra)
function inst(geo,mat,list,q,cast){if(!list.length)return null;const m=new THREE.InstancedMesh(geo,mat,list.length),o=new THREE.Object3D(),c=new THREE.Color();
 list.forEach((e,i)=>{o.position.set(e[0],e[1],e[2]);o.rotation.set(0,e[3]||0,0);const s=e[4]||1;o.scale.set(s,e[5]||s,s);o.updateMatrix();m.setMatrixAt(i,o.matrix);if(e[6]!==undefined)m.setColorAt(i,c.set(e[6]))});
 m.userData.q=q||0;m.castShadow=!!cast;m.receiveShadow=true;sc.add(m);return m}
function canvasTex(w,h,draw,rep){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=8;return t}
// Aleatorio reproducible (mismo mapa siempre igual)
function rng(s){return()=>(s=s*16807%2147483647)/2147483647}

async function loadWorld(){
 MAP=await(await fetch(`data/${MAPNAME}.json`)).json();W=MAP.W;
 const P=a=>{const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]/10;return o};
 MAP.roads.forEach(r=>r.p=P(r.p));MAP.buildings.forEach(b=>b.p=P(b.p));MAP.green.forEach(g=>g.p=P(g.p));MAP.water=MAP.water.map(P);
 MAP.rivers.forEach(r=>r.p=P(r.p));MAP.rails.forEach(r=>r.p=P(r.p));MAP.trees=P(MAP.trees);MAP.signals=P(MAP.signals);
 // La Torre se apoya alrededor de FootTown: mismo centro y mismo giro que su planta
 const ft=MAP.buildings.find(b=>b.k===2);if(ft){const R=ft.p;let cx=0,cz=0,best=0;for(let i=0;i<R.length;i+=2){cx+=R[i];cz+=R[i+1]}TX=cx/(R.length/2);TZ=cz/(R.length/2);
  for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,L=Math.hypot(R[j]-R[i],R[j+1]-R[i+1]);if(L>best){best=L;TA=Math.atan2(R[j+1]-R[i+1],R[j]-R[i])}}}
 // Suelo (aceras y solares a la altura del bordillo), parques y agua
 const gnd=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000),new THREE.MeshLambertMaterial({color:0x7a7b7f}));gnd.rotation.x=-PI/2;gnd.position.set(W/2,CURB,W/2);gnd.renderOrder=-5;gnd.receiveShadow=true;sc.add(gnd);
 const GC=[0x4f7d45,0x3f6c3a,0x5b8f4d],ga=[[],[],[]];for(const g of MAP.green)polyFill(ga[g.k],g.p,CURB+.01);ga.forEach((a,k)=>a.length&&mkMesh(a,flat(GC[k]),-4,null,1));
 const wa=[];for(const R of MAP.water){polyFill(wa,R,CURB+.012);addPoly(R,0)}for(const r of MAP.rivers){ribbon(wa,r.p,r.w/2,CURB+.012,true);for(let i=2;i<r.p.length;i+=2)addCaps(r.p[i-2],r.p[i-1],r.p[i],r.p[i+1],r.w/2)}
 if(wa.length)mkMesh(wa,new THREE.MeshPhongMaterial({color:0x2d5878,specular:0x99aabb,shininess:60,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-4}),-3);
 // Calzada: se dibuja "hundida" (siempre por encima del suelo) para que la acera quede 15 cm más alta, como en la realidad
 const ra=[];MAP.roads.forEach((r,ri)=>{const hw=r.w/2,p=r.p;ribbon(ra,p,hw,0,true);
  for(let i=2;i<p.length;i+=2){const k=RSG.length/6;RSG.push(p[i-2],p[i-1],p[i],p[i+1],hw,ri);gadd(Math.min(p[i-2],p[i])-hw-3,Math.min(p[i-1],p[i+1])-hw-3,Math.max(p[i-2],p[i])+hw+3,Math.max(p[i-1],p[i+1])+hw+3,"r",k)}});
 const asph=canvasTex(128,128,(g,w,h)=>{g.fillStyle="#3c3e44";g.fillRect(0,0,w,h);const r=rng(5);for(let i=0;i<2600;i++){const v=48+r()*40|0;g.fillStyle=`rgb(${v},${v},${v+3})`;g.fillRect(r()*w,r()*h,1+r()*1.5,1+r()*1.5)}},true);
 const rg=mkMesh(ra,new THREE.MeshLambertMaterial({map:asph,depthFunc:THREE.AlwaysDepth}),-2,null,1);
 {const q=rg.geometry.attributes.position.array,uv=new Float32Array(q.length/3*2);for(let i=0,j=0;i<q.length;i+=3,j+=2){uv[j]=q[i]/6;uv[j+1]=q[i+2]/6}rg.geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2))}
 // Edificios (antes que vías y adornos, que comprueban si caen dentro de uno)
 for(const b of MAP.buildings)addPoly(b.p,b.h);
 // Vías de tren: a ras de suelo bloquean el paso salvo en los pasos a nivel; las elevadas van sobre pilares
 const ba=[],rl=[],dk=[],pil=[];
 for(const r of MAP.rails){const p=r.p,y=r.b?7.5:CURB+.03;ribbon(r.b?dk:ba,p,r.b?2.2:1.6,y,true);
  for(const s of[-.72,.72])for(let i=2;i<p.length;i+=2){const l=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])||1,lx=(p[i+1]-p[i-1])/l*s,lz=-(p[i]-p[i-2])/l*s;quad(rl,p[i-2]+lx,p[i-1]+lz,p[i]+lx,p[i+1]+lz,.06,y+.12)}
  let acc=0;for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/8));
   for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n,z0=az+(bz-az)*k/n,x1=ax+(bx-ax)*(k+1)/n,z1=az+(bz-az)*(k+1)/n;
    if(r.b){acc+=L/n;if(acc>28){acc=0;pil.push([x0,0,z0])}}
    else if(roadAt(x0,z0)<0&&roadAt(x1,z1)<0&&roadAt((x0+x1)/2,(z0+z1)/2)<0)addCaps(x0,z0,x1,z1,1.9)}}}
 if(ba.length)mkMesh(ba,flat(0x6b6158),-1);if(rl.length)mkMesh(rl,new THREE.MeshLambertMaterial({color:0x2c2c30}));
 if(dk.length){mkMesh(dk,new THREE.MeshLambertMaterial({color:0x8e9096,side:THREE.DoubleSide}),0,null,2);
  inst(new THREE.CylinderGeometry(.8,.8,7.5,8).translate(0,3.75,0),new THREE.MeshLambertMaterial({color:0x8e9096}),pil,0,true);for(const q of pil)addCirc(q[0],q[2],.8)}
 buildCurbs();buildBuildings();buildTower();decorate();drawMapImg();ready=true}

// Bordillos: tira a lo largo de los bordes de la calzada (y alrededor de las curvas y finales de calle), salvo donde empieza otra calle
function buildCurbs(){const cb=[],piece=(x0,z0,x1,z1,ox,oz)=>cb.push(x0,0,z0,x1,0,z1,x1,CURB,z1,x0,0,z0,x1,CURB,z1,x0,CURB,z0,x0,CURB,z0,x1,CURB,z1,x1+ox,CURB,z1+oz,x0,CURB,z0,x1+ox,CURB,z1+oz,x0+ox,CURB,z0+oz);
 const out=(x,z,nx,nz)=>roadAt(x+nx*.35,z+nz*.35)<0&&roadAt(x-nx*.35,z-nz*.35)>=0;
 for(const r of MAP.roads){const hw=r.w/2,p=r.p;
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=(bx-ax)/L,uz=(bz-az)/L,lx=uz,lz=-ux,n=Math.max(1,Math.round(L/2.5));
   for(const s of[-1,1])for(let k=0;k<n;k++){const t0=k/n*L,t1=(k+1)/n*L,tm=(t0+t1)/2,nx=lx*s,nz=lz*s;
    if(!out(ax+ux*tm+nx*hw,az+uz*tm+nz*hw,nx,nz))continue;piece(ax+ux*t0+nx*hw,az+uz*t0+nz*hw,ax+ux*t1+nx*hw,az+uz*t1+nz*hw,nx*.22,nz*.22)}}
  // Arcos en cada vértice: cierran las curvas y los finales de calle
  for(let i=0;i<p.length;i+=2)for(let k=0;k<12;k++){const a0=k/12*PI*2,a1=(k+1)/12*PI*2,am=(a0+a1)/2,nx=Math.cos(am),nz=Math.sin(am);
   if(!out(p[i]+nx*hw,p[i+1]+nz*hw,nx,nz))continue;piece(p[i]+Math.cos(a0)*hw,p[i+1]+Math.sin(a0)*hw,p[i]+Math.cos(a1)*hw,p[i+1]+Math.sin(a1)*hw,nx*.22,nz*.22)}}
 mkMesh(cb,new THREE.MeshLambertMaterial({color:0xa8aaae,side:THREE.DoubleSide}),0,null,1)}

// Imagen del mapa (1 píxel = 1 m) para el mapa de aparición y el fondo del minimapa
function drawMapImg(){const c=document.createElement("canvas");c.width=c.height=W;const g=c.getContext("2d"),poly=(R)=>{g.beginPath();g.moveTo(R[0],R[1]);for(let i=2;i<R.length;i+=2)g.lineTo(R[i],R[i+1]);g.closePath();g.fill()},
 line=(p,w)=>{g.lineWidth=w;g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.stroke()};
 g.fillStyle="#3a3d45";g.fillRect(0,0,W,W);g.fillStyle="#2f6b3a";for(const q of MAP.green)poly(q.p);
 g.fillStyle=g.strokeStyle="#2c5f8c";for(const R of MAP.water)poly(R);g.lineCap=g.lineJoin="round";for(const r of MAP.rivers)line(r.p,r.w);
 g.strokeStyle="#6b5a4a";for(const r of MAP.rails)line(r.p,3);g.strokeStyle="#9aa0ad";for(const r of MAP.roads)line(r.p,r.w);
 for(const b of MAP.buildings){g.fillStyle=b.k===1||b.k===3?"#9a3a2c":"#22242a";poly(b.p)}
 g.fillStyle="#e5173f";g.beginPath();g.moveTo(TX,TZ-30);g.lineTo(TX+26,TZ+18);g.lineTo(TX-26,TZ+18);g.fill();mapImg=c}
