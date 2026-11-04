// Mapa real (OpenStreetMap, ver tools/): consultas de superficie y colisión exacta, suelo, calzada, bordillos, agua y vías.
// Edificios en buildings.js, Torre de Tokio en tower.js, árboles y mobiliario urbano en props.js
const MAPNAME="tokyo-tower",HC=20,CURB=.15;
let MAP=null,ready=false,mapImg=null,TA=0,DEALER=null;const PARK=[];   // TA: giro de la Torre de Tokio (su base está alineada con FootTown)
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
// (water: estanque, lago o bahía; no pone sus bordes como muro aquí, y en collide no cuenta debajo de una calle: así los puentes se pueden cruzar)
const PLW=new Set();
function addPoly(R,h,water){const k=PL.length;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<R.length;i+=2){x0=Math.min(x0,R[i]);x1=Math.max(x1,R[i]);z0=Math.min(z0,R[i+1]);z1=Math.max(z1,R[i+1])}
 PL.push(R);PLB.push(x0,z0,x1,z1);PLH.push(h||0);gadd(x0-3,z0-3,x1+3,z1+3,"p",k);if(water){PLW.add(k);return}for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)addEdge(R[j],R[j+1],R[i],R[i+1])}
// ¿Calzada? Devuelve el índice de la calle o -1 (acera, parque, solar...)
function roadAt(x,z){for(const k of gq(x,z).r){const o=k*6;if(segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3])<RSG[o+4]*RSG[o+4])return RSG[o+5]}return -1}
// Altura del suelo según la misma rejilla con la que se dibujan las aceras (así una franja estrecha entre dos calles, que no
// llega a tener acera dibujada, cuenta como calzada y nada flota sobre ella)
let GSD=null,GSN=0,GSS=3;
function groundD(x,z){if(!GSD)return roadAt(x,z)>=0?-1:9;const fx=Math.min(GSN-1.001,Math.max(0,x/GSS)),fz=Math.min(GSN-1.001,Math.max(0,z/GSS)),i=fx|0,j=fz|0,u=fx-i,v=fz-j,o=j*GSN+i;
 return(GSD[o]*(1-u)+GSD[o+1]*u)*(1-v)+(GSD[o+GSN]*(1-u)+GSD[o+GSN+1]*u)*v}
const surfH=(x,z)=>groundD(x,z)>0?CURB:0;
// ¿El punto está solo en la calzada de la calle ri (con margen m) y no en otra? Para pintar las marcas viales sin que se salgan
function onlyRoad(x,z,ri,m){let mine=false;for(const k of gq(x,z).r){const o=k*6,hw=RSG[o+4]-(RSG[o+5]===ri?m:0);if(segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3])<hw*hw){if(RSG[o+5]===ri)mine=true;else return false}}return mine}
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
  for(const k of c.p){const b=k*4;if(o.x<PLB[b]||o.x>PLB[b+2]||o.z<PLB[b+1]||o.z>PLB[b+3])continue;const R=PL[k];if(!inPoly(R,o.x,o.z))continue;if(PLW.has(k)&&roadAt(o.x,o.z)>=0)continue;
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
 m.userData.q=q||0;m.castShadow=!!cast;m.receiveShadow=true;
 // Esfera envolvente de todas las instancias (si no, la cámara descartaría el grupo mirando solo la pieza original)
 let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9,y1=0;for(const e of list){x0=Math.min(x0,e[0]);x1=Math.max(x1,e[0]);z0=Math.min(z0,e[2]);z1=Math.max(z1,e[2]);y1=Math.max(y1,e[1])}
 if(!geo.boundingSphere)geo.computeBoundingSphere();const g2=geo.clone();g2.boundingSphere=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,y1/2+5,(z0+z1)/2),Math.hypot(x1-x0,z1-z0)/2+geo.boundingSphere.radius*3+y1);m.geometry=g2;
 sc.add(m);return m}
// Igual que inst() pero repartido en zonas de 400 m, para que solo se dibujen las zonas que tiene delante la cámara
// Malla grande (solo posiciones) repartida en zonas de 600 m por el centro de cada triángulo; devuelve las mallas creadas
function mkMeshZ(pos,mat,ro,shadow){const Z=new Map();for(let i=0;i<pos.length;i+=9){const x=(pos[i]+pos[i+3]+pos[i+6])/3,z=(pos[i+2]+pos[i+5]+pos[i+8])/3,k=Math.floor(x/600)*100+Math.floor(z/600);let a=Z.get(k);if(!a){a=[];Z.set(k,a)}for(let j=0;j<9;j++)a.push(pos[i+j])}
 return[...Z.values()].map(a=>mkMesh(a,mat,ro,null,shadow))}
function instZ(geo,mat,list,q,cast,zs){zs=zs||800;const Z=new Map();for(const e of list){const k=Math.floor(e[0]/zs)*100+Math.floor(e[2]/zs);if(!Z.has(k))Z.set(k,[]);Z.get(k).push(e)}return[...Z.values()].map(l=>inst(geo,mat,l,q,cast))}
function canvasTex(w,h,draw,rep){const c=document.createElement("canvas");c.width=w;c.height=h;draw(c.getContext("2d"),w,h);const t=new THREE.CanvasTexture(c);if(rep){t.wrapS=t.wrapT=THREE.RepeatWrapping}t.anisotropy=8;return t}
// Aleatorio reproducible (mismo mapa siempre igual)
function rng(s){return()=>(s=s*16807%2147483647)/2147483647}

async function loadWorld(){
 MAP=await(await fetch(`data/${MAPNAME}.json`)).json();W=MAP.W;
 const P=a=>{const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]/10;return o};
 MAP.roads.forEach(r=>r.p=P(r.p));MAP.buildings.forEach(b=>b.p=P(b.p));MAP.green.forEach(g=>g.p=P(g.p));MAP.water=MAP.water.map(P);
 MAP.rivers.forEach(r=>r.p=P(r.p));MAP.rails.forEach(r=>r.p=P(r.p));MAP.trees=P(MAP.trees);MAP.signals=P(MAP.signals);
 // Torre de Tokio: OSM la incluye como varios "edificios" (partes de más de 100 m y las bases de las patas). Se usan para
 // situar la torre y se quitan, porque la torre la construye tower.js. El giro es el de FootTown, el edificio entre las patas
 const cen=b=>{const R=b.p;let x=0,z=0;for(let i=0;i<R.length;i+=2){x+=R[i];z+=R[i+1]}return[x/(R.length/2),z/(R.length/2)]};
 const ft=MAP.buildings.find(b=>b.k===2);if(ft){const R=ft.p,[fx,fz]=cen(ft);let best=0,sx=0,sz=0,n=0;
  for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,L=Math.hypot(R[j]-R[i],R[j+1]-R[i+1]);if(L>best){best=L;TA=Math.atan2(R[j+1]-R[i+1],R[j]-R[i])}}
  for(const b of MAP.buildings){const[x,z]=cen(b);if(b.h>100&&Math.hypot(x-fx,z-fz)<40){sx+=x;sz+=z;n++;b.del=1}}
  if(n){TX=sx/n;TZ=sz/n}else{TX=fx;TZ=fz}
  // Coordenadas locales de la torre: cualquier vértice dentro de la base (±42 m) choca con las patas
  const c=Math.cos(TA),s=Math.sin(TA),inT=(x,z,m)=>{const dx=x-TX,dz=z-TZ;return Math.abs(dx*c+dz*s)<m&&Math.abs(-dx*s+dz*c)<m};
  for(const b of MAP.buildings){const[x,z]=cen(b),d=Math.hypot(x-TX,z-TZ);if(b!==ft&&!b.del&&(d<14&&b.h<30||d>45&&d<75&&b.h<=8&&b.p.length<=10)){b.del=1}
   // Contorno duplicado de FootTown
   if(b!==ft&&b.p.length===ft.p.length&&Math.hypot(x-cen(ft)[0],z-cen(ft)[1])<1)b.del=1;
   if(b!==ft&&!b.del){for(let i=0;i<b.p.length;i+=2)if(inT(b.p[i],b.p[i+1],42)){b.del=1;break}}}
  // FootTown encajado entre las patas (como en la realidad): planta cuadrada de 56 m y 13 m de alto, por debajo de los arcos
  const L=[[-28,-28],[28,-28],[28,28],[-28,28]];ft.p=new Float32Array(L.flatMap(([u,v])=>[TX+u*c-v*s,TZ+u*s+v*c]));ft.h=13;
  MAP.buildings=MAP.buildings.filter(b=>!b.del)}
 // Calles sueltas: trozos que en OSM no se unen con el resto de calles (un tramo de 70 m con aparcamiento junto al canal, que no
 // llevaba a ningún sitio). Se quedan solo las calles conectadas con la red principal (la más larga)
 {const par=new Map(),f=x=>{while(par.get(x)!==x){par.set(x,par.get(par.get(x)));x=par.get(x)}return x};
  for(const r of MAP.roads){if(!r.n)continue;for(const id of r.n)if(!par.has(id))par.set(id,id);for(let i=1;i<r.n.length;i++){const a=f(r.n[i-1]),b=f(r.n[i]);if(a!==b)par.set(a,b)}}
  const L=new Map();for(const r of MAP.roads){if(!r.n)continue;const k=f(r.n[0]),p=r.p;let l=0;for(let i=2;i<p.length;i+=2)l+=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]);L.set(k,(L.get(k)||0)+l)}
  let main=null,ml=0;for(const[k,l]of L)if(l>ml){ml=l;main=k}if(main!==null)MAP.roads=MAP.roads.filter(r=>!r.n||f(r.n[0])===main)}
 // Concesionario "Tokyo Drive Motors": un edificio mediano junto a una calle principal, a unos 450 m de la torre. Se vuelve una
 // sala de exposición de cristal de 9 m de alto (buildings.js) y delante, en la calle, hay una marca para entrar con el coche
 {let best=null,bs=1e9;for(const b of MAP.buildings){if(b.k)continue;const R=b.p;let A=0,cx=0,cz=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2){A+=R[j]*R[i+1]-R[i]*R[j+1];cx+=R[i];cz+=R[i+1]}A=Math.abs(A)/2;cx/=R.length/2;cz/=R.length/2;
   const d=Math.hypot(cx-TX,cz-TZ);if(A<500||A>2200||d<250||d>800||cx<200||cz<200||cx>W-200||cz>W-200)continue;
   // Tiene que dar a una avenida (calle principal o secundaria ancha)
   let rd=1e9,rq=null;for(const r of MAP.roads){if(r.t>2||r.w<10)continue;const p=r.p;for(let i=2;i<p.length;i+=2){const q=segD2(cx,cz,p[i-2],p[i-1],p[i],p[i+1]);if(q<rd){rd=q;rq={x:_cx,z:_cz,w:r.w,a:Math.atan2(p[i]-p[i-2],p[i+1]-p[i-1])}}}}
   rd=Math.sqrt(rd);if(rd>Math.sqrt(A)*.75+14)continue;const s=Math.abs(d-450)+Math.abs(A-1100)*.05+rd*2;if(s<bs){bs=s;best={b,cx,cz,rq}}}
  if(best){best.b.dealer=1;best.b.h=9;const q=best.rq,dx=best.cx-q.x,dz=best.cz-q.z,l=Math.hypot(dx,dz)||1,o=Math.max(1,q.w/2-2.2);
   DEALER={bx:best.cx,bz:best.cz,x:q.x+dx/l*o,z:q.z+dz/l*o,h:q.a}}}
 // Calles un 20 % más anchas que en OSM (el concesionario ya está elegido con el ancho original)
 for(const r of MAP.roads)r.w*=1.2;
 // Edificios que pisan los carriles por donde circulan los coches (el eje y la franja de cada sentido con el ancho de un coche):
 // se quitan, salvo templos, puertas y FootTown. Antes solo se miraba el eje y los NPC atravesaban los que invadían un carril
 {const G=new Map(),key=(i,j)=>i*1000+j;MAP.buildings.forEach(b=>{if(b.k||b.dealer)return;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<b.p.length;i+=2){x0=Math.min(x0,b.p[i]);x1=Math.max(x1,b.p[i]);z0=Math.min(z0,b.p[i+1]);z1=Math.max(z1,b.p[i+1])}
   b.bb=[x0,z0,x1,z1];for(let i=Math.floor(x0/20);i<=Math.floor(x1/20);i++)for(let j=Math.floor(z0/20);j<=Math.floor(z1/20);j++){const k=key(i,j);if(!G.has(k))G.set(k,[]);G.get(k).push(b)}});
  // (y también los que pisan el ancho mínimo de la calle, 2,6 m a cada lado del eje: ahí la calle ya no se puede estrechar más)
  for(const r of MAP.roads){const p=r.p,offs=[0,2.6,-2.6];for(const o of r.o?[r.w/2-1.9]:[r.w/4,-r.w/4])for(const e of[-1,0,1])offs.push(o+e);
   for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L,lz=-(bx-ax)/L,n=Math.ceil(L/1.5);
   for(let k=0;k<=n;k++)for(const o of offs){const x=ax+(bx-ax)*k/n+lx*o,z=az+(bz-az)*k/n+lz*o,l=G.get(key(Math.floor(x/20),Math.floor(z/20)));if(!l)continue;for(const b of l)if(!b.del&&x>b.bb[0]&&x<b.bb[2]&&z>b.bb[1]&&z<b.bb[3]&&inPoly(b.p,x,z))b.del=1}}}
  MAP.buildings=MAP.buildings.filter(b=>!b.del)}
 // Edificios primero: las calles se estrechan donde se meterían en uno, y los adornos comprueban si caen dentro
 // El rascacielos de 105 m que tapaba la megatorre Kurogane (places.js) se traslada a un sitio libre del parque, a unos 125 m de ella
 {const b=MAP.buildings.find(q=>q.h>100&&q.h<110&&Math.hypot(q.p[0]-1350,q.p[1]-1547)<80);if(b)for(let i=0;i<b.p.length;i+=2){b.p[i]+=106;b.p[i+1]-=27}}
 // (el agua se añade después de las calles: si no, las calles que cruzan una bahía o un lago se estrechaban como junto a un edificio)
 for(const b of MAP.buildings)addPoly(b.p,b.h);
 // Calzada a 0 m (la acera queda 15 cm más alta). Cada tramo guarda su medio ancho (r.hw) ya ajustado
 const ra=[],DISCS=[];MAP.roads.forEach((r,ri)=>{const p=r.p;r.hw=[];
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L,lz=-(bx-ax)/L;let hw=r.w/2;
   // (se mira cada 2 m del borde; antes solo 5 puntos por tramo y en los tramos largos el borde se metía en un edificio)
   const nk=Math.max(4,Math.ceil(L/2));for(;hw>2.6;hw*=.88){let hit=false;for(let k=0;k<=nk&&!hit;k++){const x=ax+(bx-ax)*k/nk,z=az+(bz-az)*k/nk;if(inBuilding(x+lx*hw,z+lz*hw)||inBuilding(x-lx*hw,z-lz*hw))hit=true}if(!hit)break}
   r.hw.push(hw);quad(ra,ax,az,bx,bz,hw,0);const k=RSG.length/6;RSG.push(ax,az,bx,bz,hw,ri);gadd(Math.min(ax,bx)-hw-3,Math.min(az,bz)-hw-3,Math.max(ax,bx)+hw+3,Math.max(az,bz)+hw+3,"r",k)}
  for(let i=0;i<p.length;i+=2){const s=i/2,hw=Math.min(r.hw[Math.max(0,s-1)],r.hw[Math.min(r.hw.length-1,s)]);DISCS.push(p[i],p[i+1],hw)}});
 // Calles sin salida (un extremo que no toca ninguna otra calle y no está en el borde del mapa): aparcamiento de 12 m con plazas
 // donde quepa y, si no, un final redondo para dar la vuelta con su señal. Se añaden como tramos de calzada (dejan hueco y bordillo)
 {const use=new Map();for(const r of MAP.roads)if(r.n)r.n.forEach((id,i)=>{if(i===0||i===r.n.length-1)use.set(id,(use.get(id)||0)+1);else use.set(id,(use.get(id)||0)+2)});
  const fits=(pts)=>pts.every(([x,z])=>!inBuilding(x,z)&&!inWater(x,z)&&x>30&&z>30&&x<W-30&&z<W-30);
  MAP.roads.forEach((r,ri)=>{if(!r.n)return;const p=r.p;for(const end of[0,1]){const id=end?r.n[r.n.length-1]:r.n[0];if(use.get(id)!==1)continue;
   const i=end?p.length-2:0,j=end?p.length-4:2,x=p[i],z=p[i+1],L=Math.hypot(x-p[j],z-p[j+1])||1,ux=(x-p[j])/L,uz=(z-p[j+1])/L,hw=r.hw[end?r.hw.length-1:0],lx=uz,lz=-ux;
   const pw=hw+3.5,ex=x+ux*13,ez=z+uz*13,rect=[];for(let a=0;a<=13;a+=3)for(const s of[-1,0,1])rect.push([x+ux*a+lx*pw*s,z+uz*a+lz*pw*s]);
   if(fits(rect)){quad(ra,x,z,ex,ez,pw,0);const k=RSG.length/6;RSG.push(x,z,ex,ez,pw,ri);gadd(Math.min(x,ex)-pw-3,Math.min(z,ez)-pw-3,Math.max(x,ex)+pw+3,Math.max(z,ez)+pw+3,"r",k);PARK.push({x,z,ux,uz,pw,t:"p"})}
   else{const R=Math.max(hw,5.5),circ=[];for(let a=0;a<8;a++)circ.push([x+ux*2+Math.cos(a/8*PI*2)*R,z+uz*2+Math.sin(a/8*PI*2)*R]);if(!fits(circ))continue;
    const cx=x+ux*2,cz=z+uz*2;for(let k2=0;k2<16;k2++){const a0=k2/16*PI*2,a1=(k2+1)/16*PI*2;flatTri(ra,0,cx,cz,cx+Math.cos(a0)*R,cz+Math.sin(a0)*R,cx+Math.cos(a1)*R,cz+Math.sin(a1)*R)}
    const k=RSG.length/6;RSG.push(cx,cz,cx+ux*.01,cz+uz*.01,R,ri);gadd(cx-R-3,cz-R-3,cx+R+3,cz+R+3,"r",k);PARK.push({x:cx,z:cz,ux,uz,pw:R,t:"c"})}}})}
 // Agua (estanques, lagos y la bahía): choca como un muro en su orilla, salvo donde entra una calle (puentes; sus pretiles los pone buildCanal)
 for(const R of MAP.water){addPoly(R,0,true);for(let i=0,j=R.length-2;i<R.length;j=i,i+=2){const ax=R[j],az=R[j+1],bx=R[i],bz=R[i+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/.5));
  for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n,z0=az+(bz-az)*k/n,x1=ax+(bx-ax)*(k+1)/n,z1=az+(bz-az)*(k+1)/n;if(roadAt((x0+x1)/2,(z0+z1)/2)<0)addEdge(x0,z0,x1,z1)}}}
 // Redondeles de asfalto en cada vértice de las calles (cierran las esquinas de los cruces). Junto al canal, en trozos finos, y sin
 // los que queden sobre el agua fuera de la calzada recortada (roadAtW): ahí la avenida ancha dejaba asfalto flotando sobre el agua
 for(let i=0;i<DISCS.length;i+=3){const x=DISCS[i],z=DISCS[i+1],hw=DISCS[i+2],nearW=riverD(x,z)<hw+1,n=nearW?48:12;
  for(let k=0;k<n;k++){const a0=k/n*PI*2,a1=(k+1)/n*PI*2,am=(a0+a1)/2;if(nearW){const mx=x+Math.cos(am)*hw*.95,mz=z+Math.sin(am)*hw*.95;if(riverD(mx,mz)<.3&&roadAtW(mx,mz)<0)continue}
   flatTri(ra,0,x,z,x+Math.cos(a0)*hw,z+Math.sin(a0)*hw,x+Math.cos(a1)*hw,z+Math.sin(a1)*hw)}}
 // Capa de asfalto por debajo de todo el mapa: tapa las franjas estrechas entre calles donde no cabe acera (antes eran huecos).
 // No pasa por el canal (ahí se ve el agua, más abajo): se hace en casillas de 20 m y se saltan las que tocan el cauce
 // Tampoco pasa por los estanques y lagos (MAP.water): las casillas que tocan uno se parten en trozos de 4 m y se saltan los mojados
 {const WB=MAP.water.map(R=>{let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<R.length;i+=2){x0=Math.min(x0,R[i]);x1=Math.max(x1,R[i]);z0=Math.min(z0,R[i+1]);z1=Math.max(z1,R[i+1])}return[x0-4,z0-4,x1+4,z1+4]});
  const sq=(x,z,s)=>{flatTri(ra,-.03,x,z,x+s,z+s,x+s,z);flatTri(ra,-.03,x,z,x,z+s,x+s,z+s)};
  for(let x=0;x<W;x+=20)for(let z=0;z<W;z+=20){if(riverD(x+10,z+10)<14.2)continue;
   const near=MAP.water.filter((R,i)=>{const b=WB[i];return x+20>b[0]&&x<b[2]&&z+20>b[1]&&z<b[3]});if(!near.length){sq(x,z,20);continue}
   const wet=(X,Z)=>near.some(R=>inPoly(R,X,Z));
   for(let a=0;a<20;a+=4)for(let c=0;c<20;c+=4){const X=x+a,Z=z+c;if(wet(X,Z)||wet(X+4,Z)||wet(X,Z+4)||wet(X+4,Z+4)||wet(X+2,Z+2))continue;sq(X,Z,4)}}}
 // Colisión del canal: los dos bordes (no el cauce entero), salvo donde pasa una calle por encima (puentes)
 for(const r of MAP.rivers){const p=r.p,hw=r.w/2;for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L*hw,lz=-(bx-ax)/L*hw,n=Math.ceil(L/.5);
  // (solo se abre donde la calle cruza de verdad: también hay calzada 3 y 6,5 m hacia dentro del cauce (hasta el centro); si una calle va pegada al
  // borde, el borde sigue cerrado)
  for(const s of[-1,1])for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n+lx*s,z0=az+(bz-az)*k/n+lz*s,x1=ax+(bx-ax)*(k+1)/n+lx*s,z1=az+(bz-az)*(k+1)/n+lz*s,mx=(x0+x1)/2,mz=(z0+z1)/2;
   if(!bankOpen(x0,z0,x1,z1,lx*s/hw,lz*s/hw))addEdge(x0,z0,x1,z1)}}
  riverCaps(r,addEdge)}
 const asph=canvasTex(256,256,(g,w,h)=>{g.fillStyle="#3a3c42";g.fillRect(0,0,w,h);const r=rng(5);for(let i=0;i<9000;i++){const v=44+r()*44|0;g.fillStyle=`rgb(${v},${v},${v+3})`;g.fillRect(r()*w,r()*h,1+r()*1.6,1+r()*1.6)}
  g.globalAlpha=.08;for(let i=0;i<30;i++){g.fillStyle=r()<.5?"#000":"#888";g.beginPath();g.ellipse(r()*w,r()*h,8+r()*30,4+r()*14,r()*PI,0,7);g.fill()}g.globalAlpha=1},true);
 ROADMAT=beamMat(new THREE.MeshPhongMaterial({map:asph,specularMap:puddleTex(),specular:0x000000,shininess:70,lightMap:LIGHTMAP,lightMapIntensity:0}));
 for(const rg of mkMeshZ(ra,ROADMAT,0,1)){worldUV2(rg);const q=rg.geometry.attributes.position.array,uv=new Float32Array(q.length/3*2);for(let i=0,j=0;i<q.length;i+=3,j+=2){uv[j]=q[i]/7;uv[j+1]=q[i+2]/7}rg.geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2))}
 buildGround();buildCanal();
 // Vías de tren: a ras de suelo bloquean el paso salvo en los pasos a nivel; las elevadas van sobre pilares
 // Rampas: si una vía elevada acaba junto al borde del mapa sin salir de frente (el monorraíl, que se curva y se corta en el
 // borde), en sus últimos 60 m baja hasta el suelo en vez de acabar en el aire. Cuando el mapa sea más grande habrá que alargarla
 // Pilares: las vías paralelas los comparten (antes cada vía ponía los suyos cada 28 m y salía un bosque de pilares) y ninguno cae
 // en la calzada, en un edificio ni a menos de 10 m de otro: se busca sitio un poco antes o después y, si no hay, ese tramo va sin pilar
 const ba=[],rl=[],dk=[],dkuv=[],pil=[],RE=[];MAP.rails.forEach(r=>{const p=r.p;RE.push([p[0],p[1]],[p[p.length-2],p[p.length-1]])});
 const tri3=(a,ax,ay,az,bx,by,bz,cx,cy,cz)=>{if((bz-az)*(cx-ax)-(bx-ax)*(cz-az)<0)a.push(ax,ay,az,cx,cy,cz,bx,by,bz);else a.push(ax,ay,az,bx,by,bz,cx,cy,cz)};
 // Tablero de la vía con coordenadas de textura (traviesas y grava a lo largo; los redondeles de las uniones van un poco más bajos, en color hormigón)
 const ribY=(a,uv,p,ys,hw)=>{let d=0;const tq=(A,B,C)=>{const fl=(B[2]-A[2])*(C[0]-A[0])-(B[0]-A[0])*(C[2]-A[2])<0;for(const q of fl?[A,C,B]:[A,B,C]){a.push(q[0],q[1],q[2]);uv.push(q[3],q[4])}};
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],l=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/l*hw,lz=-(bx-ax)/l*hw,y0=ys[i/2-1],y1=ys[i/2],v0=d/3,v1=(d+l)/3;d+=l;
   const A=[ax+lx,y0,az+lz,0,v0],B=[bx+lx,y1,bz+lz,0,v1],C=[bx-lx,y1,bz-lz,1,v1],D=[ax-lx,y0,az-lz,1,v0];tq(A,B,C);tq(A,C,D)}
  for(let i=0;i<p.length;i+=2)for(let k=0;k<10;k++){const a0=k/10*PI*2,a1=(k+1)/10*PI*2,n=a.length;flatTri(a,ys[i/2]-.03,p[i],p[i+1],p[i]+Math.cos(a0)*hw,p[i+1]+Math.sin(a0)*hw,p[i]+Math.cos(a1)*hw,p[i+1]+Math.sin(a1)*hw);for(let q=n;q<a.length;q+=3)uv.push(.02,.5)}};
 const okP=(x,z)=>!inBuilding(x,z)&&[[0,0],[1.4,0],[-1.4,0],[0,1.4],[0,-1.4]].every(([u,v])=>roadAt(x+u,z+v)<0)&&!pil.some(q=>(q[0]-x)**2+(q[2]-z)**2<100);
 for(const r of MAP.rails){let p=r.p;
  if(!r.b){ribbon(ba,p,1.6,CURB+.03,true);for(const s of[-.72,.72])for(let i=2;i<p.length;i+=2){const l=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])||1,lx=(p[i+1]-p[i-1])/l*s,lz=-(p[i]-p[i-2])/l*s;quad(rl,p[i-2]+lx,p[i-1]+lz,p[i]+lx,p[i+1]+lz,.06,CURB+.15)}
   for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/8));
    for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n,z0=az+(bz-az)*k/n,x1=ax+(bx-ax)*(k+1)/n,z1=az+(bz-az)*(k+1)/n;if(roadAt(x0,z0)<0&&roadAt(x1,z1)<0&&roadAt((x0+x1)/2,(z0+z1)/2)<0)addCaps(x0,z0,x1,z1,1.9)}}continue}
  // ¿Qué extremos bajan en rampa? (solos, a menos de 20 m del borde y sin apuntar hacia fuera del mapa)
  const ramp=[0,1].map(e=>{const n=p.length,x=e?p[n-2]:p[0],z=e?p[n-1]:p[1],qx=e?p[n-4]:p[2],qz=e?p[n-3]:p[3];if(RE.filter(o=>Math.hypot(o[0]-x,o[1]-z)<2).length>1)return false;
   const ed=Math.min(x,z,W-x,W-z);if(ed>20)return false;const nx=x===Math.min(x,z,W-x,W-z)?-1:W-x===ed?1:0,nz=nx?0:z===ed?-1:1,l=Math.hypot(x-qx,z-qz)||1;return((x-qx)/l*nx+(z-qz)/l*nz)<.6});
  if(ramp[0]||ramp[1]){const q=[p[0],p[1]];for(let i=2;i<p.length;i+=2){const n=Math.ceil(Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])/4);for(let k=1;k<=n;k++)q.push(p[i-2]+(p[i]-p[i-2])*k/n,p[i-1]+(p[i+1]-p[i-1])*k/n)}p=new Float32Array(q)}
  const D=[0];for(let i=2;i<p.length;i+=2)D.push(D[D.length-1]+Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1]));const TL=D[D.length-1],RL=Math.min(60,TL*.45);
  const ys=D.map(d=>{let f=1;if(ramp[0])f=Math.min(f,d/RL);if(ramp[1])f=Math.min(f,(TL-d)/RL);f=Math.max(0,Math.min(1,f));return CURB+.05+(7.5-CURB-.05)*f*f*(3-2*f)});
  ELV.push({p,ys});ribY(dk,dkuv,p,ys,2.2);for(const s of[-.72,.72]){const o=[];for(let i=0;i<p.length;i+=2){const j=Math.min(i,p.length-4),l=Math.hypot(p[j+2]-p[j],p[j+3]-p[j+1])||1;o.push(p[i]+(p[j+3]-p[j+1])/l*s,p[i+1]-(p[j+2]-p[j])/l*s)}
   for(let i=2;i<o.length;i+=2){const l=Math.hypot(o[i]-o[i-2],o[i+1]-o[i-1])||1,lx=(o[i+1]-o[i-1])/l*.07,lz=-(o[i]-o[i-2])/l*.07,y0=ys[i/2-1]+.12,y1=ys[i/2]+.12;tri3(rl,o[i-2]+lx,y0,o[i-1]+lz,o[i]+lx,y1,o[i+1]+lz,o[i]-lx,y1,o[i+1]-lz);tri3(rl,o[i-2]+lx,y0,o[i-1]+lz,o[i]-lx,y1,o[i+1]-lz,o[i-2]-lx,y0,o[i-1]-lz)}}
  // Rampa: a la altura de un coche, la parte baja choca como un muro (no se puede subir a la vía)
  for(let i=2;i<p.length;i+=2)if(Math.min(ys[i/2-1],ys[i/2])<2.5)addCaps(p[i-2],p[i-1],p[i],p[i+1],2.2);
  const at=d=>{let i=1;while(i<D.length-1&&D[i]<d)i++;const f=(d-D[i-1])/((D[i]-D[i-1])||1);return[p[i*2-2]+(p[i*2]-p[i*2-2])*f,p[i*2-1]+(p[i*2+1]-p[i*2-1])*f,ys[i-1]+(ys[i]-ys[i-1])*f]};
  for(let d=14;d<TL;d+=28)for(const o of[0,3,-3,6,-6,9,-9]){const dd=d+o;if(dd<0||dd>TL)continue;const[x,z,y]=at(dd);if(y<3)break;if(okP(x,z)){pil.push([x,0,z,0,1,(y-.05)/7.5]);break}}}
 if(ba.length)mkMesh(ba,flat(0x6b6158),-1);if(rl.length)mkMesh(rl,new THREE.MeshLambertMaterial({color:0x8d939b,side:THREE.DoubleSide}));
 // Vías elevadas: bordes de hormigón, grava oscura y traviesas, para que no se confundan con una carretera
 if(dk.length){const tt=canvasTex(128,128,(g,w)=>{g.fillStyle="#6e7074";g.fillRect(0,0,w,w);g.fillStyle="#3f3e3b";g.fillRect(16,0,96,w);const r=rng(21);for(let i=0;i<2600;i++){const v=40+r()*50|0;g.fillStyle=`rgb(${v},${v},${v-3})`;g.fillRect(16+r()*94,r()*w,2,2)}g.fillStyle="#2a2522";for(let j=0;j<5;j++)g.fillRect(24,j*25.6+7,80,12)},true);
  mkMesh(dk,new THREE.MeshLambertMaterial({map:tt,side:THREE.DoubleSide}),0,{uv:dkuv},2);
  inst(new THREE.CylinderGeometry(.8,.8,7.5,8).translate(0,3.75,0),new THREE.MeshLambertMaterial({color:0x8e9096}),pil,0,true);for(const q of pil)addCirc(q[0],q[2],.8)}
 buildBuildings();buildTower();decorate();buildPlaces();drawMapImg();ready=true}

let ROADMAT=null,GROUNDMAT=null;
// ¿Dentro de un estanque o de la bahía?
// Vías elevadas (cada tramo con sus puntos y alturas): de aquí salen las rutas de los trenes (places.js)
const ELV=[];
function inWater(x,z){for(const R of MAP.water)if(inPoly(R,x,z))return true;return false}
// Distancia al borde del canal (negativa dentro del cauce)
// ¿Ese trozo del borde del canal queda abierto (puente)? Los dos extremos y el centro tienen que estar sobre la calzada, y también
// 3 y 6,5 m hacia dentro del cauce (nx,nz: normal hacia fuera). Antes bastaba el centro y quedaba un hueco al lado de algún puente
// (hacia dentro se prueba en perpendicular y girando ±20°, para los puentes que cruzan el canal en diagonal)
function bankOpen(x0,z0,x1,z1,nx,nz){const mx=(x0+x1)/2,mz=(z0+z1)/2;if(!(roadAtW(mx,mz)>=0&&roadAtW(x0,z0)>=0&&roadAtW(x1,z1)>=0))return false;
 for(const a of[0,.35,-.35]){const c=Math.cos(a),s=Math.sin(a),dx=nx*c-nz*s,dz=nx*s+nz*c;if(roadAtW(mx-dx*3,mz-dz*3)>=0&&roadAtW(mx-dx*6.5,mz-dz*6.5)>=0)return true}return false}
// Calzada junto al agua: igual que roadAt, pero el redondel del final de cada tramo no puede ser más ancho que la calle que sigue
// en ese cruce. Una avenida de 17 m que acababa en un puente de 9,6 m dejaba medio círculo de calle sobre el agua a cada lado, y
// su pretil curvo se pegaba a la mitad del puente en vez de al principio. RCAP: radio de los dos extremos de cada tramo
let RCAP=null;
function capR(){RCAP=new Float32Array(RSG.length/3);const N=new Map(),key=(x,z)=>Math.round(x*10)+","+Math.round(z*10);
 for(let k=0;k<RSG.length;k+=6)for(const e of[0,1]){const q=key(RSG[k+e*2],RSG[k+1+e*2]);if(!N.has(q))N.set(q,[]);N.get(q).push(k)}
 for(let k=0;k<RSG.length;k+=6)for(const e of[0,1]){let m=0;for(const o of N.get(key(RSG[k+e*2],RSG[k+1+e*2])))if(o!==k)m=Math.max(m,RSG[o+4]);RCAP[k/3+e]=m?Math.min(RSG[k+4],m):RSG[k+4]}}
function roadAtW(x,z){if(!RCAP||RCAP.length!==RSG.length/3)capR();for(const k of gq(x,z).r){const o=k*6,ax=RSG[o],az=RSG[o+1],bx=RSG[o+2],bz=RSG[o+3],w=RSG[o+4],dx=bx-ax,dz=bz-az,l2=dx*dx+dz*dz||1e-9,t=((x-ax)*dx+(z-az)*dz)/l2;
 if(t>=0&&t<=1){const qx=ax+dx*t-x,qz=az+dz*t-z;if(qx*qx+qz*qz<w*w)return RSG[o+5]}else{const e=t<0?0:1,ex=e?bx:ax,ez=e?bz:az,r=RCAP[k*2+e];if((x-ex)**2+(z-ez)**2<r*r)return RSG[o+5]}}return -1}
// Muro curvo en cada vértice del canal: en el lado exterior de los recodos y en las uniones entre tramos los muros rectos no se tocan
// y quedaba una cuña abierta al agua. Se recorre un círculo del ancho del cauce y se quedan los trozos que caen en el borde (no
// dentro del agua de otro tramo ni sobre una calle)
function riverCaps(r,cb){const p=r.p,h2=r.w/2;for(let i=0;i<p.length;i+=2){const cx=p[i],cz=p[i+1];for(let j=0;j<16;j++){const a0=j/16*PI*2,a1=(j+1)/16*PI*2,x0=cx+Math.cos(a0)*h2,z0=cz+Math.sin(a0)*h2,x1=cx+Math.cos(a1)*h2,z1=cz+Math.sin(a1)*h2,mx=(x0+x1)/2,mz=(z0+z1)/2;
 if(riverD(mx,mz)<-.3||roadAtW(mx,mz)>=0)continue;cb(x0,z0,x1,z1)}}}
function riverD(x,z){let d=1e9;for(const r of MAP.rivers){const p=r.p;for(let i=2;i<p.length;i+=2){const q=Math.sqrt(segD2(x,z,p[i-2],p[i-1],p[i],p[i+1]))-r.w/2;if(q<d)d=q}}return d}
// Mapa de luz nocturna de todas las farolas (1 píxel ≈ 1,2 m): se dibuja en props.js y se suma al asfalto y a las aceras
const LMC=document.createElement("canvas");LMC.width=LMC.height=2048;const LIGHTMAP=new THREE.CanvasTexture(LMC);
function worldUV2(m){const q=m.geometry.attributes.position.array,uv=new Float32Array(q.length/3*2);for(let i=0,j=0;i<q.length;i+=3,j+=2){uv[j]=Math.min(1,Math.max(0,q[i]/W));uv[j+1]=1-Math.min(1,Math.max(0,q[i+2]/W))}m.geometry.setAttribute("uv2",new THREE.BufferAttribute(uv,2))}
// Charcos: zonas del asfalto que brillan más cuando está mojado (mapa especular)
function puddleTex(){return canvasTex(256,256,(g,w,h)=>{g.fillStyle="#3a3a3a";g.fillRect(0,0,w,h);const r=rng(17);for(let i=0;i<14;i++){const x=r()*w,y=r()*h,rx=10+r()*40,ry=6+r()*22,gr=g.createRadialGradient(x,y,0,x,y,rx);
 gr.addColorStop(0,"#fff");gr.addColorStop(.7,"#ddd");gr.addColorStop(1,"rgba(58,58,58,0)");g.fillStyle=gr;g.save();g.translate(x,y);g.scale(1,ry/rx);g.translate(-x,-y);g.beginPath();g.arc(x,y,rx,0,7);g.fill();g.restore()}},true)}
// Suelo (aceras, solares, parques y agua) a la altura del bordillo, con huecos exactos donde está la calzada.
// Se calcula la distancia a la calle más cercana en una rejilla y el borde se obtiene por "marching squares" (sin líneas en escalera).
// Los bordillos se generan sobre ese mismo borde, así coinciden siempre con la calzada
function buildGround(){const GS=MOBILE?4:3,N=Math.ceil(W/GS)+1,SD=new Float32Array(N*N).fill(9);
 for(let k=0;k<RSG.length;k+=6){const ax=RSG[k],az=RSG[k+1],bx=RSG[k+2],bz=RSG[k+3],hw=RSG[k+4],m=hw+GS*2;
  const i0=Math.max(0,Math.floor((Math.min(ax,bx)-m)/GS)),i1=Math.min(N-1,Math.ceil((Math.max(ax,bx)+m)/GS)),j0=Math.max(0,Math.floor((Math.min(az,bz)-m)/GS)),j1=Math.min(N-1,Math.ceil((Math.max(az,bz)+m)/GS));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.sqrt(segD2(i*GS,j*GS,ax,az,bx,bz))-hw,o=j*N+i;if(d<SD[o])SD[o]=d}}
 // El canal también deja hueco en el suelo (RD: distancia a su borde). El suelo usa el mínimo de las dos distancias
 const RD=new Float32Array(N*N).fill(9);
 for(const r of MAP.rivers){const p=r.p,hw=r.w/2;for(let k=2;k<p.length;k+=2){const ax=p[k-2],az=p[k-1],bx=p[k],bz=p[k+1],m=hw+GS*2;
  const i0=Math.max(0,Math.floor((Math.min(ax,bx)-m)/GS)),i1=Math.min(N-1,Math.ceil((Math.max(ax,bx)+m)/GS)),j0=Math.max(0,Math.floor((Math.min(az,bz)-m)/GS)),j1=Math.min(N-1,Math.ceil((Math.max(az,bz)+m)/GS));
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const d=Math.sqrt(segD2(i*GS,j*GS,ax,az,bx,bz))-hw,o=j*N+i;if(d<RD[o])RD[o]=d}}}
 // Estanques y lagos (polígonos de agua de OSM dentro del mapa): también dejan hueco en el suelo
 for(const R of MAP.water){let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<R.length;i+=2){x0=Math.min(x0,R[i]);x1=Math.max(x1,R[i]);z0=Math.min(z0,R[i+1]);z1=Math.max(z1,R[i+1])}
  const i0=Math.max(0,Math.floor(x0/GS)-2),i1=Math.min(N-1,Math.ceil(x1/GS)+2),j0=Math.max(0,Math.floor(z0/GS)-2),j1=Math.min(N-1,Math.ceil(z1/GS)+2);
  for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const x=i*GS,z=j*GS;let d=1e9;for(let k=0;k<R.length;k+=2){const m=(k+2)%R.length;d=Math.min(d,segD2(x,z,R[k],R[k+1],R[m],R[m+1]))}d=Math.sqrt(d)*(inPoly(R,x,z)?-1:1);const o=j*N+i;if(d<RD[o])RD[o]=d}}
 for(let o=0;o<SD.length;o++)if(RD[o]<SD[o]){const t=SD[o];SD[o]=RD[o];RD[o]=t<9?-1:-2}else RD[o]=1;
 GSD=SD;GSN=N;GSS=GS;
 const pos=[],cb=[],Y=CURB;
 const rect=(x0,z0,x1,z1)=>{flatTri(pos,Y,x0,z0,x1,z0,x1,z1);flatTri(pos,Y,x0,z0,x1,z1,x0,z1)};
 const curb=(x0,z0,x1,z1)=>{if(Math.hypot(x1-x0,z1-z0)<.01)return;cb.push(x0,0,z0,x1,0,z1,x1,Y,z1,x0,0,z0,x1,Y,z1,x0,Y,z0)};
 for(let j=0;j<N-1;j++){let run=-1;for(let i=0;i<N;i++){const o=j*N+i,v0=SD[o],v1=SD[o+1],v2=SD[o+N+1],v3=SD[o+N],full=i<N-1&&v0>0&&v1>0&&v2>0&&v3>0;
  if(full){if(run<0)run=i;continue}if(run>=0){rect(run*GS,j*GS,i*GS,(j+1)*GS);run=-1}if(i>=N-1||(v0<=0&&v1<=0&&v2<=0&&v3<=0))continue;
  // Celda con borde: polígono de la parte "acera" e interpolación lineal del borde
  const C=[[i*GS,j*GS,v0,o],[(i+1)*GS,j*GS,v1,o+1],[(i+1)*GS,(j+1)*GS,v2,o+N+1],[i*GS,(j+1)*GS,v3,o+N]],poly=[],edge=[];
  for(let e=0;e<4;e++){const a=C[e],b=C[(e+1)%4];if(a[2]>0)poly.push(a);if((a[2]>0)!==(b[2]>0)){const t=a[2]/(a[2]-b[2]),q=[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,RD[a[3]]<0||RD[b[3]]<0];poly.push(q);edge.push(q)}}
  for(let k=1;k<poly.length-1;k++)flatTri(pos,Y,poly[0][0],poly[0][1],poly[k][0],poly[k][1],poly[k+1][0],poly[k+1][1]);
  // Bordillo solo hacia la calzada (hacia el canal están sus muros, ver buildCanal)
  for(let k=0;k+1<edge.length;k+=2)if(!edge[k][2]&&!edge[k+1][2])curb(edge[k][0],edge[k][1],edge[k+1][0],edge[k+1][1])}}
 // Alrededor del mapa, suelo liso hasta el horizonte
 const F=4000;rect(-F,-F,W+F,0);rect(-F,W,W+F,W+F);rect(-F,0,0,W);rect(W,0,W+F,W);
 // Textura de colores del suelo (1 píxel ≈ 1,2 m): acera, parques, campos y agua
 const gt=canvasTex(2048,2048,(g,w)=>{const s=w/W,poly=R=>{g.beginPath();g.moveTo(R[0]*s,R[1]*s);for(let i=2;i<R.length;i+=2)g.lineTo(R[i]*s,R[i+1]*s);g.closePath();g.fill()};
  g.fillStyle="#7c7d81";g.fillRect(0,0,w,w);const r=rng(23);for(let i=0;i<60000;i++){const v=110+r()*30|0;g.fillStyle=`rgba(${v},${v},${v+4},.35)`;g.fillRect(r()*w,r()*w,1,1)}
  for(const q of MAP.green){g.fillStyle=["#4f7d45","#3f6c3a","#5b8f4d"][q.k];poly(q.p)}g.fillStyle="#2d5878";for(const R of MAP.water)poly(R);
  g.strokeStyle="#2d5878";g.lineCap=g.lineJoin="round";for(const q of MAP.rivers){g.lineWidth=q.w*s;g.beginPath();g.moveTo(q.p[0]*s,q.p[1]*s);for(let i=2;i<q.p.length;i+=2)g.lineTo(q.p[i]*s,q.p[i+1]*s);g.stroke()}});
 gt.wrapS=gt.wrapT=THREE.ClampToEdgeWrapping;
 GROUNDMAT=beamMat(new THREE.MeshLambertMaterial({map:gt,lightMap:LIGHTMAP,lightMapIntensity:0}));for(const m of mkMeshZ(pos,GROUNDMAT,0,1)){worldUV2(m);m.geometry.setAttribute("uv",m.geometry.attributes.uv2)}
 mkMeshZ(cb,new THREE.MeshLambertMaterial({color:0xa8aaae,side:THREE.DoubleSide}),0,1)}

// Canal (el río Furukawa): agua 2,4 m por debajo de la calle con olas suaves que reflejan el cielo y, de noche, la luz de las farolas;
// muros de hormigón a los lados con barandilla, puentes donde lo cruza una calle (vigas debajo y pretiles a los lados) y, encima,
// la autopista elevada sobre pilares como en la realidad (de adorno: no se puede subir)
const WATERU={uTime:{value:0},uNightW:{value:0}};let WATERM=null;
function buildCanal(){if(!MAP.rivers.length)return;const wa=[],wl=[],rl=[],gi=[],hw=[],hd=[],hs=[],pil=[],WY=-2.4,HY=16,FE=[];   // HY: altura del tablero, bien por encima de las vías elevadas (7,5 m) y de sus trenes
 const vq=(a,x0,z0,x1,z1,y0,y1)=>a.push(x0,y0,z0,x1,y0,z1,x1,y1,z1,x0,y0,z0,x1,y1,z1,x0,y1,z0);
 for(const r of MAP.rivers){const p=r.p,h2=r.w/2,ns=p.length/2,MT=[];
  // Dirección del borde de la autopista en cada vértice (media de los dos tramos, alargada para que el ancho se mantenga en la curva)
  {const nr=v=>{const L=Math.hypot(p[v*2+2]-p[v*2],p[v*2+3]-p[v*2+1])||1;return[(p[v*2+3]-p[v*2+1])/L,-(p[v*2+2]-p[v*2])/L]};
   for(let v=0;v<ns;v++){const a=v>0?nr(v-1):null,b=v<ns-1?nr(v):null,ref=a||b;let mx=(a?a[0]:0)+(b?b[0]:0),mz=(a?a[1]:0)+(b?b[1]:0);const l=Math.hypot(mx,mz)||1;mx/=l;mz/=l;
    const sc=1/Math.max(.5,mx*ref[0]+mz*ref[1]);MT.push(mx*sc,mz*sc)}
   FE.push({x:p[0],z:p[1],m:[MT[0],MT[1]]},{x:p[ns*2-2],z:p[ns*2-1],m:[MT[ns*2-2],MT[ns*2-1]]})}
  ribbon(wa,p,h2+.3,WY,true);riverCaps(r,(x0,z0,x1,z1)=>{vq(wl,x0,z0,x1,z1,WY-.6,CURB);vq(rl,x0,z0,x1,z1,CURB,CURB+1.1)});
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L,lz=-(bx-ax)/L,n=Math.ceil(L/.5);
   for(const s of[-1,1])for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n+lx*h2*s,z0=az+(bz-az)*k/n+lz*h2*s,x1=ax+(bx-ax)*(k+1)/n+lx*h2*s,z1=az+(bz-az)*(k+1)/n+lz*h2*s,road=bankOpen(x0,z0,x1,z1,lx*s,lz*s);
    vq(wl,x0,z0,x1,z1,WY-.6,road?-.45:CURB);if(!road)vq(rl,x0,z0,x1,z1,CURB,CURB+1.1)}
   // Autopista elevada: tablero de 13 m a 12 m de altura, pretiles y pilares en el centro del cauce
   // (bordes a inglete en cada vértice: antes cada tramo era un rectángulo y en las curvas las esquinas salían en pico)
   {const E=(v,s)=>[p[v*2]+MT[v*2]*6.5*s,p[v*2+1]+MT[v*2+1]*6.5*s],v0=i/2-1,v1=i/2,A0=E(v0,1),A1=E(v1,1),B0=E(v0,-1),B1=E(v1,-1);
    for(const[a,y]of[[hd,HY],[hs,HY-.8]]){flatTri(a,y,A0[0],A0[1],A1[0],A1[1],B1[0],B1[1]);flatTri(a,y,A0[0],A0[1],B1[0],B1[1],B0[0],B0[1])}
    vq(hw,A0[0],A0[1],A1[0],A1[1],HY-.8,HY+1.1);vq(hw,B0[0],B0[1],B1[0],B1[1],HY-.8,HY+1.1)}
   // (ningún pilar sobre una calle: en las curvas del canal puede coincidir con un puente)
   for(let t=16;t<L;t+=34){const x=ax+(bx-ax)*t/L,z=az+(bz-az)*t/L;if([[0,0],[3,0],[-3,0],[0,3],[0,-3]].every(([u,v])=>roadAt(x+u,z+v)<0))pil.push([x,0,z,Math.atan2(bx-ax,bz-az)])}}}
 // El canal de los datos a veces viene partido en dos (hueco de unos 14 m donde lo cruza una calle): la autopista sigue seguida por encima
 {const free=FE.filter(a=>!FE.some(b=>b!==a&&Math.hypot(a.x-b.x,a.z-b.z)<1));free.forEach((a,i)=>{for(let j=i+1;j<free.length;j++){const b=free[j];if(Math.hypot(a.x-b.x,a.z-b.z)>30)continue;
   const E=(q,s)=>[q.x+q.m[0]*6.5*s,q.z+q.m[1]*6.5*s],sg=Math.hypot(a.m[0]+b.m[0],a.m[1]+b.m[1])>Math.hypot(a.m[0]-b.m[0],a.m[1]-b.m[1])?1:-1,A0=E(a,1),B0=E(a,-1),A1=E(b,sg),B1=E(b,-sg);
   for(const[t,y]of[[hd,HY],[hs,HY-.8]]){flatTri(t,y,A0[0],A0[1],A1[0],A1[1],B1[0],B1[1]);flatTri(t,y,A0[0],A0[1],B1[0],B1[1],B0[0],B0[1])}vq(hw,A0[0],A0[1],A1[0],A1[1],HY-.8,HY+1.1);vq(hw,B0[0],B0[1],B1[0],B1[1],HY-.8,HY+1.1)}})}
 // Puentes: tramos de calle por encima del agua
 for(let k=0;k<RSG.length;k+=6){const ax=RSG[k],az=RSG[k+1],bx=RSG[k+2],bz=RSG[k+3],w2=RSG[k+4],L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L,lz=-(bx-ax)/L,n=Math.ceil(L);
  // Solo es puente si la calle cruza el canal (no si va paralela al borde, que pondría barrera a un lado de toda la calle). Los
  // pretiles siguen 2 m más allá del agua para cerrar las esquinas donde el canal hace curva
  // (cada lado se mira por separado: si la calle cruza en diagonal, un borde llega al agua antes que el centro y antes ahí quedaba
  // un hueco sin pretil por donde se caía al canal)
  for(let i=0;i<n;i++){const x0=ax+(bx-ax)*i/n,z0=az+(bz-az)*i/n,x1=ax+(bx-ax)*(i+1)/n,z1=az+(bz-az)*(i+1)/n,mx=(x0+x1)/2,mz=(z0+z1)/2,dc=riverD(mx,mz),
    near=[-1,1].map(s=>dc<=2||riverD(mx+lx*(w2+.3)*s,mz+lz*(w2+.3)*s)<=2.5);if(!near[0]&&!near[1])continue;
   let rdx=0,rdz=0,bd=1e9;for(const r of MAP.rivers){const p=r.p;for(let q=2;q<p.length;q+=2){const d=segD2(mx,mz,p[q-2],p[q-1],p[q],p[q+1]);if(d<bd){bd=d;const l=Math.hypot(p[q]-p[q-2],p[q+1]-p[q-1])||1;rdx=(p[q]-p[q-2])/l;rdz=(p[q+1]-p[q-1])/l}}}
   if(Math.abs(rdx*(bx-ax)/L+rdz*(bz-az)/L)>.8)continue;
   quad(gi,x0,z0,x1,z1,w2+.3,-.9);for(const s of[-1,1]){if(!near[(s+1)/2])continue;const ex0=x0+lx*(w2+.3)*s,ez0=z0+lz*(w2+.3)*s,ex1=x1+lx*(w2+.3)*s,ez1=z1+lz*(w2+.3)*s;vq(gi,ex0,ez0,ex1,ez1,-.9,.9);addEdge(ex0,ez0,ex1,ez1)}}}
 // Además, cualquier borde de calzada que quede sobre el agua (bordes de cada tramo y redondeles de los cruces) lleva pretil si al
 // otro lado hay agua sin calle: así no queda ningún hueco al canal en los cruces que están encima o junto a un puente
 {const piece=(x0,z0,x1,z1,ox,oz)=>{const mx=(x0+x1)/2,mz=(z0+z1)/2;if(riverD(mx,mz)>.3)return;const qx=mx+ox*.45,qz=mz+oz*.45;if(roadAtW(qx,qz)>=0||riverD(qx,qz)>-.2)return;vq(gi,x0,z0,x1,z1,-.9,.9);addEdge(x0,z0,x1,z1)};
  for(let k=0;k<RSG.length;k+=6){const ax=RSG[k],az=RSG[k+1],bx=RSG[k+2],bz=RSG[k+3],w2=RSG[k+4];if(riverD((ax+bx)/2,(az+bz)/2)>w2+Math.hypot(bx-ax,bz-az)/2+2)continue;
   const L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L,lz=-(bx-ax)/L,n=Math.ceil(L/.5);
   for(const s of[-1,1])for(let i=0;i<n;i++){const t0=i/n,t1=(i+1)/n;piece(ax+(bx-ax)*t0+lx*w2*s,az+(bz-az)*t0+lz*w2*s,ax+(bx-ax)*t1+lx*w2*s,az+(bz-az)*t1+lz*w2*s,lx*s,lz*s)}
   // y los dos lados cortos (el final del tramo): si una avenida ancha acaba en el borde del canal, su esquina queda sobre el agua
   {const m=Math.ceil(w2*2/.5),ux=(bx-ax)/L,uz=(bz-az)/L;for(const[cx,cz,sg]of[[ax,az,-1],[bx,bz,1]])for(let i=0;i<m;i++){const o0=-w2+w2*2*i/m,o1=-w2+w2*2*(i+1)/m;piece(cx+lx*o0,cz+lz*o0,cx+lx*o1,cz+lz*o1,ux*sg,uz*sg)}}
   for(const[cx,cz,e]of[[ax,az,0],[bx,bz,1]]){if(!RCAP)capR();const rr=RCAP[k/3+e],m=Math.max(12,Math.ceil(rr*PI*2/.5));for(let j=0;j<m;j++){const a0=j/m*PI*2,a1=(j+1)/m*PI*2,am=(a0+a1)/2;piece(cx+Math.cos(a0)*rr,cz+Math.sin(a0)*rr,cx+Math.cos(a1)*rr,cz+Math.sin(a1)*rr,Math.cos(am),Math.sin(am))}}}}
 const conc=new THREE.MeshLambertMaterial({color:0x8e9094,side:THREE.DoubleSide});
 WATERM=new THREE.MeshPhongMaterial({color:0x1f3d4c,specular:0x9fb4c4,shininess:110,envMap:SKYCUBE,reflectivity:.5,lightMap:LIGHTMAP,lightMapIntensity:0});
 WATERM.onBeforeCompile=sh=>{Object.assign(sh.uniforms,WATERU);sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vWw;").replace("#include <begin_vertex>","#include <begin_vertex>\nvWw=(modelMatrix*vec4(transformed,1.)).xyz;");
  sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uTime,uNightW;varying vec3 vWw;").replace("#include <emissivemap_fragment>",`#include <emissivemap_fragment>
  // De noche: brillos cálidos temblorosos (reflejo de ventanas y letreros) sobre un azul oscuro
  {vec2 q=vWw.xz;float s=sin(q.x*.37+sin(q.y*.21)*3.)*sin(q.y*.53+q.x*.11)+sin(q.x*1.7+uTime*1.5)*.25+sin(q.y*2.3-uTime*1.9)*.25;
   totalEmissiveRadiance+=uNightW*(vec3(.02,.05,.09)+vec3(1.,.72,.4)*pow(max(0.,s),6.)*.55+vec3(.4,.7,1.)*pow(max(0.,-s),8.)*.25);}`).replace("#include <normal_fragment_maps>",`#include <normal_fragment_maps>
  {vec2 q=vWw.xz;float t=uTime;vec3 pn=vec3(sin(q.x*.9+t*1.3)*.5+sin(q.x*2.3-q.y*1.7+t*2.1)*.3+sin(q.x*5.1+q.y*3.7-t*3.)*.12,0.,cos(q.y*1.1-t*1.1)*.5+sin(q.y*2.9+q.x*1.3+t*1.7)*.3+cos(q.y*4.7-q.x*4.3+t*2.6)*.12);
   normal=normalize(normal+(viewMatrix*vec4(pn*.22,0.)).xyz);}`)};
 // Estanques y lagos: agua 0,6 m por debajo de la acera con borde de piedra
 // (el borde de piedra no cruza las calles que entran en el agua: ahí quedaba un escalón en cada extremo del puente)
 const pw=[],pb=[];for(const R of MAP.water){polyFill(pw,R,-.6);for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,ax=R[i],az=R[i+1],bx=R[j],bz=R[j+1],n=Math.max(1,Math.ceil(Math.hypot(bx-ax,bz-az)/1));
   for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n,z0=az+(bz-az)*k/n,x1=ax+(bx-ax)*(k+1)/n,z1=az+(bz-az)*(k+1)/n;if(roadAt((x0+x1)/2,(z0+z1)/2)<0)vq(pb,x0,z0,x1,z1,-1,CURB+.05)}}}
 // Puentes sobre el agua (la bahía, lagos): pretil de hormigón en cada borde de calzada que quede sobre el agua sin otra calle al lado
 {const WB=MAP.water.map(R=>{let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<R.length;i+=2){x0=Math.min(x0,R[i]);x1=Math.max(x1,R[i]);z0=Math.min(z0,R[i+1]);z1=Math.max(z1,R[i+1])}return[x0,z0,x1,z1]});
  const wet=(x,z)=>MAP.water.some((R,i)=>{const b=WB[i];return x>b[0]&&x<b[2]&&z>b[1]&&z<b[3]&&inPoly(R,x,z)});
  for(let k=0;k<RSG.length;k+=6){const ax=RSG[k],az=RSG[k+1],bx=RSG[k+2],bz=RSG[k+3],w2=RSG[k+4],m=w2+2;if(!WB.some(b=>Math.max(ax,bx)+m>b[0]&&Math.min(ax,bx)-m<b[2]&&Math.max(az,bz)+m>b[1]&&Math.min(az,bz)-m<b[3]))continue;
   const L=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/L,lz=-(bx-ax)/L,n=Math.max(1,Math.ceil(L/.5));
   for(const s of[-1,1])for(let i=0;i<n;i++){const x0=ax+(bx-ax)*i/n+lx*w2*s,z0=az+(bz-az)*i/n+lz*w2*s,x1=ax+(bx-ax)*(i+1)/n+lx*w2*s,z1=az+(bz-az)*(i+1)/n+lz*w2*s,mx=(x0+x1)/2,mz=(z0+z1)/2,qx=mx+lx*s*.45,qz=mz+lz*s*.45;
    if(!wet(mx,mz)||!wet(qx,qz)||roadAt(qx,qz)>=0)continue;vq(gi,x0,z0,x1,z1,-.9,.9);addEdge(x0,z0,x1,z1)}}}
 for(const m of mkMeshZ(wa.concat(pw),WATERM,0))worldUV2(m);if(pb.length)mkMeshZ(pb,new THREE.MeshLambertMaterial({color:0x8b877e,side:THREE.DoubleSide}),0,1);
 mkMeshZ(wl,conc,0,1);if(rl.length)mkMesh(rl,RAILM||(RAILM=new THREE.MeshLambertMaterial({color:0x9aa1a8,transparent:true,opacity:.6,side:THREE.DoubleSide,depthWrite:false})));if(gi.length)mkMesh(gi,conc,0,null,2);
 // Autopista: asfalto arriba (con la misma textura que las calles), hormigón debajo y a los lados
 for(const m of mkMeshZ(hd,ROADMAT,0,1)){worldUV2(m);const q=m.geometry.attributes.position.array,uv=new Float32Array(q.length/3*2);for(let i=0,j=0;i<q.length;i+=3,j+=2){uv[j]=q[i]/7;uv[j+1]=q[i+2]/7}m.geometry.setAttribute("uv",new THREE.BufferAttribute(uv,2))}
 mkMeshZ(hs,conc,0,2);mkMeshZ(hw,conc,0,2);
 inst(new THREE.BoxGeometry(2.6,HY-.8-WY,4).translate(0,(HY-.8+WY)/2,0),new THREE.MeshLambertMaterial({color:0x9a9c9f}),pil,0,true)}
// Imagen del mapa (1 píxel = 1 m) para el mapa de aparición y el fondo del minimapa
function drawMapImg(){const c=document.createElement("canvas");c.width=c.height=W;const g=c.getContext("2d"),poly=(R)=>{g.beginPath();g.moveTo(R[0],R[1]);for(let i=2;i<R.length;i+=2)g.lineTo(R[i],R[i+1]);g.closePath();g.fill()},
 line=(p,w)=>{g.lineWidth=w;g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.stroke()};
 g.fillStyle="#3a3d45";g.fillRect(0,0,W,W);g.fillStyle="#2f6b3a";for(const q of MAP.green)poly(q.p);
 g.fillStyle=g.strokeStyle="#2c5f8c";for(const R of MAP.water)poly(R);g.lineCap=g.lineJoin="round";for(const r of MAP.rivers)line(r.p,r.w);
 g.strokeStyle="#6b5a4a";for(const r of MAP.rails)line(r.p,3);g.strokeStyle="#9aa0ad";for(const r of MAP.roads)line(r.p,r.w);
 // Edificios: templos en rojo, FootTown en blanco y los rascacielos más claros cuanto más altos
 for(const b of MAP.buildings){g.fillStyle=b.c?b.c:b.k===1||b.k===3?"#c2452f":b.k===2?"#e8e8e4":b.h>100?"#5a6170":b.h>50?"#3a3e48":"#22242a";poly(b.p)}
 g.fillStyle="#ff4a2a";g.strokeStyle="#fff";g.lineWidth=4;g.beginPath();g.moveTo(TX,TZ-34);g.lineTo(TX+28,TZ+20);g.lineTo(TX-28,TZ+20);g.closePath();g.fill();g.stroke();
 // Torre Kurogane: rombo rojo
 g.fillStyle="#ff2a32";g.beginPath();g.moveTo(MGT.x,MGT.z-34);g.lineTo(MGT.x+26,MGT.z);g.lineTo(MGT.x,MGT.z+34);g.lineTo(MGT.x-26,MGT.z);g.closePath();g.fill();g.stroke();mapImg=c}
