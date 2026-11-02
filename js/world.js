// Mapa real (OpenStreetMap, ver tools/): calzada y aceras con bordillo, edificios con ventanas, parques, agua, vías,
// árboles, farolas, señales, templos y Torre de Tokio. También las consultas de superficie y colisión exacta.
const MAPNAME="tokyo-tower",TOWER={lat:35.65856385,lon:139.74544},HC=20,CURB=.15;
let MAP=null,ready=false,mapImg=null;
// Rejilla espacial: cada celda de 20 m guarda índices de bordes (e), cápsulas (c), polígonos (p), círculos (o) y tramos de calle (r)
const CELLS=new Map(),EMPTY={e:[],c:[],p:[],o:[],r:[]};
function gadd(x0,z0,x1,z1,list,v){const i0=Math.floor(x0/HC),i1=Math.floor(x1/HC),j0=Math.floor(z0/HC),j1=Math.floor(z1/HC);
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const k=i*4096+j;let c=CELLS.get(k);if(!c){c={e:[],c:[],p:[],o:[],r:[]};CELLS.set(k,c)}c[list].push(v)}}
const gq=(x,z)=>CELLS.get(Math.floor(x/HC)*4096+Math.floor(z/HC))||EMPTY;
const EG=[],CP=[],PL=[],PLB=[],CI=[],RSG=[];   // datos planos: bordes [ax,az,bx,bz] · cápsulas [ax,az,bx,bz,r] · círculos [x,z,r] · tramos [ax,az,bx,bz,medio ancho,calle]
let _cx=0,_cz=0;
function segD2(px,pz,ax,az,bx,bz){const dx=bx-ax,dz=bz-az,l=dx*dx+dz*dz;let t=l?((px-ax)*dx+(pz-az)*dz)/l:0;t=t<0?0:t>1?1:t;_cx=ax+dx*t;_cz=az+dz*t;return(px-_cx)**2+(pz-_cz)**2}
function inPoly(r,x,z){let c=false;for(let i=0,j=r.length-2;i<r.length;j=i,i+=2){const zi=r[i+1],zj=r[j+1];if((zi>z)!==(zj>z)&&x<(r[j]-r[i])*(z-zi)/(zj-zi)+r[i])c=!c}return c}
function addEdge(ax,az,bx,bz){const k=EG.length/4;EG.push(ax,az,bx,bz);gadd(Math.min(ax,bx)-3,Math.min(az,bz)-3,Math.max(ax,bx)+3,Math.max(az,bz)+3,"e",k)}
function addCaps(ax,az,bx,bz,r){const k=CP.length/5;CP.push(ax,az,bx,bz,r);gadd(Math.min(ax,bx)-r-3,Math.min(az,bz)-r-3,Math.max(ax,bx)+r+3,Math.max(az,bz)+r+3,"c",k)}
function addCirc(x,z,r){const k=CI.length/3;CI.push(x,z,r);gadd(x-r-3,z-r-3,x+r+3,z+r+3,"o",k)}
function addPoly(R){const k=PL.length;let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(let i=0;i<R.length;i+=2){x0=Math.min(x0,R[i]);x1=Math.max(x1,R[i]);z0=Math.min(z0,R[i+1]);z1=Math.max(z1,R[i+1])}
 PL.push(R);PLB.push(x0,z0,x1,z1);gadd(x0-3,z0-3,x1+3,z1+3,"p",k);for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)addEdge(R[j],R[j+1],R[i],R[i+1])}
// ¿Calzada? Devuelve el índice de la calle o -1 (acera, parque, solar...)
function roadAt(x,z){for(const k of gq(x,z).r){const o=k*6;if(segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3])<RSG[o+4]*RSG[o+4])return RSG[o+5]}return -1}
const surfH=(x,z)=>roadAt(x,z)>=0?0:CURB;
function inBuilding(x,z){const c=gq(x,z);for(const k of c.p){const b=k*4;if(x>=PLB[b]&&x<=PLB[b+2]&&z>=PLB[b+1]&&z<=PLB[b+3]&&inPoly(PL[k],x,z))return true}return false}
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

// --- Geometría ---
function flatTri(a,y,ax,az,bx,bz,cx,cz){if((bz-az)*(cx-ax)-(bx-ax)*(cz-az)<0){const t=bx;bx=cx;cx=t;const u=bz;bz=cz;cz=u}a.push(ax,y,az,bx,y,bz,cx,y,cz)}
function ribbon(a,p,hw,y,disc){for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],l=Math.hypot(bx-ax,bz-az)||1,lx=(bz-az)/l*hw,lz=-(bx-ax)/l*hw;
  flatTri(a,y,ax+lx,az+lz,bx+lx,bz+lz,bx-lx,bz-lz);flatTri(a,y,ax+lx,az+lz,bx-lx,bz-lz,ax-lx,az-lz)}
 if(disc)for(let i=0;i<p.length;i+=2)for(let k=0;k<10;k++){const a0=k/10*PI*2,a1=(k+1)/10*PI*2;flatTri(a,y,p[i],p[i+1],p[i]+Math.cos(a0)*hw,p[i+1]+Math.sin(a0)*hw,p[i]+Math.cos(a1)*hw,p[i+1]+Math.sin(a1)*hw)}}
function polyFill(a,R,y){const v=[];for(let i=0;i<R.length;i+=2)v.push(new THREE.Vector2(R[i],R[i+1]));for(const f of THREE.ShapeUtils.triangulateShape(v,[]))flatTri(a,y,v[f[0]].x,v[f[0]].y,v[f[1]].x,v[f[1]].y,v[f[2]].x,v[f[2]].y)}
function mkMesh(pos,mat,ro,extra){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(pos,3));
 if(extra)for(const k in extra)g.setAttribute(k,new THREE.Float32BufferAttribute(extra[k],k==="uv"?2:3));if(!extra||!extra.normal)g.computeVertexNormals();
 const m=new THREE.Mesh(g,mat);if(ro!==undefined)m.renderOrder=ro;sc.add(m);return m}
const flat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-4},o||{}));
function inst(geo,mat,list,scale){if(!list.length)return null;const m=new THREE.InstancedMesh(geo,mat,list.length),o=new THREE.Object3D(),c=new THREE.Color();
 list.forEach((e,i)=>{o.position.set(e[0],e[1],e[2]);o.rotation.set(0,e[3]||0,0);o.scale.setScalar(e[4]||1);if(scale)o.scale.set(e[4]||1,e[5]||1,e[4]||1);o.updateMatrix();m.setMatrixAt(i,o.matrix);if(e[6]!==undefined)m.setColorAt(i,c.set(e[6]))});sc.add(m);return m}
// Textura de fachada: una ventana por repetición (3,6 m de ancho × 3,3 m de planta)
function winTex(glass){const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");
 g.fillStyle=glass?"#c9d6e2":"#eeeeea";g.fillRect(0,0,64,64);
 if(glass){g.fillStyle="#5d7590";g.fillRect(0,4,64,52);g.fillStyle="#7d97b2";g.fillRect(0,4,30,52)}
 else{g.fillStyle="#3f4f63";g.fillRect(12,14,40,32);g.fillStyle="#6c8098";g.fillRect(12,14,18,32);g.fillStyle="#d8d8d2";g.fillRect(10,46,44,4)}
 const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t}
const BCOL=[0xe6e2d8,0xd4d4d0,0xcfc6b4,0xb9b6ae,0xa9b1ba,0xe2dccd,0x9a958c,0xc4bfb2];

async function loadWorld(){
 MAP=await(await fetch(`data/${MAPNAME}.json`)).json();W=MAP.W;
 const P=a=>{const o=new Float32Array(a.length);for(let i=0;i<a.length;i++)o[i]=a[i]/10;return o},KX=111320*Math.cos(MAP.lat*PI/180);
 TX=(TOWER.lon-MAP.lon)*KX+W/2;TZ=-(TOWER.lat-MAP.lat)*110540+W/2;
 MAP.roads.forEach(r=>r.p=P(r.p));MAP.buildings.forEach(b=>b.p=P(b.p));MAP.green.forEach(g=>g.p=P(g.p));MAP.water=MAP.water.map(P);
 MAP.rivers.forEach(r=>r.p=P(r.p));MAP.rails.forEach(r=>r.p=P(r.p));MAP.trees=P(MAP.trees);MAP.signals=P(MAP.signals);
 // Suelo (acera/solares, a la altura del bordillo), parques y agua
 const gnd=new THREE.Mesh(new THREE.PlaneGeometry(8000,8000),new THREE.MeshLambertMaterial({color:0x74767b}));gnd.rotation.x=-PI/2;gnd.position.set(W/2,CURB,W/2);gnd.renderOrder=-5;sc.add(gnd);
 const GC=[0x4d7a45,0x3d6a3a,0x5b8f4d],ga=[[],[],[]];for(const g of MAP.green)polyFill(ga[g.k],g.p,CURB+.01);ga.forEach((a,k)=>a.length&&mkMesh(a,flat(GC[k]),-4));
 const wa=[];for(const R of MAP.water){polyFill(wa,R,CURB+.012);addPoly(R)}for(const r of MAP.rivers){ribbon(wa,r.p,r.w/2,CURB+.012,true);for(let i=2;i<r.p.length;i+=2)addCaps(r.p[i-2],r.p[i-1],r.p[i],r.p[i+1],r.w/2)}
 if(wa.length)mkMesh(wa,flat(0x2f5f8a,{polygonOffsetFactor:-2}),-3);
 // Calles: se dibujan "hundidas" (siempre por encima del suelo) para que la acera quede 15 cm más alta, como en la realidad
 const ra=[],ma=[];MAP.roads.forEach((r,ri)=>{const hw=r.w/2,p=r.p;ribbon(ra,p,hw,0,true);
  for(let i=2;i<p.length;i+=2){const k=RSG.length/6;RSG.push(p[i-2],p[i-1],p[i],p[i+1],hw,ri);gadd(Math.min(p[i-2],p[i])-hw-3,Math.min(p[i-1],p[i+1])-hw-3,Math.max(p[i-2],p[i])+hw+3,Math.max(p[i-1],p[i+1])+hw+3,"r",k)}});
 mkMesh(ra,new THREE.MeshLambertMaterial({color:0x3b3d43,depthFunc:THREE.AlwaysDepth}),-2);
 // Edificios (antes que vías y adornos, que comprueban si caen dentro de uno)
 for(const b of MAP.buildings)addPoly(b.p);
 // Vías de tren: a ras de suelo bloquean el paso salvo en los pasos a nivel; las elevadas van sobre pilares
 const ba=[],rl=[],dk=[],pil=[];
 for(const r of MAP.rails){const p=r.p,y=r.b?7.5:CURB+.03;ribbon(r.b?dk:ba,p,r.b?2.2:1.6,y,true);
  for(const s of[-.72,.72]){const q=[];for(let i=2;i<p.length;i+=2){const l=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])||1,lx=(p[i+1]-p[i-1])/l*s,lz=-(p[i]-p[i-2])/l*s;q.push(p[i-2]+lx,p[i-1]+lz,p[i]+lx,p[i+1]+lz)}
   for(let i=0;i<q.length;i+=4)ribbon(rl,[q[i],q[i+1],q[i+2],q[i+3]],.06,y+.12,false)}
  let acc=0;for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az),n=Math.max(1,Math.ceil(L/8));
   for(let k=0;k<n;k++){const x0=ax+(bx-ax)*k/n,z0=az+(bz-az)*k/n,x1=ax+(bx-ax)*(k+1)/n,z1=az+(bz-az)*(k+1)/n;
    if(r.b){acc+=L/n;if(acc>28){acc=0;pil.push([x0,0,z0])}}
    else if(roadAt(x0,z0)<0&&roadAt(x1,z1)<0&&roadAt((x0+x1)/2,(z0+z1)/2)<0)addCaps(x0,z0,x1,z1,1.9)}}}
 if(ba.length)mkMesh(ba,flat(0x6b6158),-1);if(rl.length)mkMesh(rl,new THREE.MeshLambertMaterial({color:0x2c2c30}));
 if(dk.length){mkMesh(dk,new THREE.MeshLambertMaterial({color:0x8e9096,side:THREE.DoubleSide}));
  inst(new THREE.CylinderGeometry(.8,.8,7.5,8).translate(0,3.75,0),new THREE.MeshLambertMaterial({color:0x8e9096}),pil);for(const q of pil)addCirc(q[0],q[2],.8)}
 // Bordillos: tira a lo largo de los bordes de la calzada, salvo donde empieza otra calle
 const cb=[];for(const r of MAP.roads){const hw=r.w/2,p=r.p;
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=(bx-ax)/L,uz=(bz-az)/L,lx=uz,lz=-ux,n=Math.max(1,Math.round(L/3));
   for(const s of[-1,1])for(let k=0;k<n;k++){const t0=k/n*L,t1=(k+1)/n*L,tm=(t0+t1)/2,ex=ax+ux*tm+lx*s*hw,ez=az+uz*tm+lz*s*hw;
    if(roadAt(ex+lx*s*.4,ez+lz*s*.4)>=0)continue;
    const x0=ax+ux*t0+lx*s*hw,z0=az+uz*t0+lz*s*hw,x1=ax+ux*t1+lx*s*hw,z1=az+uz*t1+lz*s*hw,ox=lx*s*.22,oz=lz*s*.22;
    cb.push(x0,0,z0,x1,0,z1,x1,CURB,z1,x0,0,z0,x1,CURB,z1,x0,CURB,z0, x0,CURB,z0,x1,CURB,z1,x1+ox,CURB,z1+oz,x0,CURB,z0,x1+ox,CURB,z1+oz,x0+ox,CURB,z0+oz)}}}
 mkMesh(cb,new THREE.MeshLambertMaterial({color:0xa3a5aa,side:THREE.DoubleSide}));
 buildBuildings();buildTower();decorate();drawMapImg();ready=true}

function buildBuildings(){const CH=300,ch=new Map(),wt=winTex(false),gt=winTex(true),c=new THREE.Color();
 const get=k=>{let o=ch.get(k);if(!o){o={w:{p:[],n:[],u:[],c:[]},g:{p:[],n:[],u:[],c:[]},r:{p:[],c:[]}};ch.set(k,o)}return o};
 MAP.buildings.forEach((b,bi)=>{let R=b.p,A=0;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)A+=R[j]*R[i+1]-R[i]*R[j+1];
  if(A<0){const q=new Float32Array(R.length);for(let i=0;i<R.length;i+=2){q[i]=R[R.length-2-i];q[i+1]=R[R.length-1-i]}R=q}
  let cx=0,cz=0;for(let i=0;i<R.length;i+=2){cx+=R[i];cz+=R[i+1]}cx/=R.length/2;cz/=R.length/2;
  const o=get(Math.floor(cx/CH)*100+Math.floor(cz/CH)),tp=b.k===1,gl=!tp&&b.h>70,s=gl?o.g:o.w,h=b.h;
  c.set(b.c!==undefined?b.c:tp?0xb5463a:gl?0xffffff:BCOL[bi%BCOL.length]);
  let per=0;for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length,ax=R[i],az=R[i+1],bx=R[j],bz=R[j+1],L=Math.hypot(bx-ax,bz-az),nx=(bz-az)/L,nz=-(bx-ax)/L,u0=per/3.6,u1=(per+L)/3.6,v1=h/3.3;per+=L;
   s.p.push(ax,0,az,bx,h,bz,bx,0,bz,ax,0,az,ax,h,az,bx,h,bz);s.u.push(u0,0,u1,v1,u1,0,u0,0,u0,v1,u1,v1);for(let k=0;k<6;k++){s.n.push(nx,0,nz);s.c.push(c.r,c.g,c.b)}}
  // Tejado: plano en edificios normales; a cuatro aguas en templos
  const rc=new THREE.Color(b.r!==undefined?b.r:tp?0x3c4044:0x8c8f94).offsetHSL(0,0,(bi%5-2)*.02),n0=o.r.p.length;
  if(tp){const ap=h+Math.min(7,Math.sqrt(Math.abs(A)/2)*.35);for(let i=0;i<R.length;i+=2){const j=(i+2)%R.length;o.r.p.push(R[i],h,R[i+1],cx,ap,cz,R[j],h,R[j+1])}}
  else polyFill(o.r.p,R,h);for(let k=n0;k<o.r.p.length;k+=3)o.r.c.push(rc.r,rc.g,rc.b)});
 const wm=new THREE.MeshLambertMaterial({map:wt,vertexColors:true}),gm=new THREE.MeshLambertMaterial({map:gt,vertexColors:true}),rm=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});
 for(const o of ch.values()){if(o.w.p.length)mkMesh(o.w.p,wm,0,{normal:o.w.n,uv:o.w.u,color:o.w.c});if(o.g.p.length)mkMesh(o.g.p,gm,0,{normal:o.g.n,uv:o.g.u,color:o.g.c});if(o.r.p.length)mkMesh(o.r.p,rm,0,{color:o.r.c})}}

// Torre de Tokio: celosía de acero en franjas naranja internacional y blanco, miradores a 150 y 250 m, antena hasta 333 m
function buildTower(){const pos=[],colr=[],OR=new THREE.Color(0xe9541f),WH=new THREE.Color(0xf2f2ee),hw=y=>y<250?38*Math.exp(-y/88)+2.6:2.6*(1-(y-250)/100)+.6;
 const beam=(x0,y0,z0,x1,y1,z1,t,cl)=>{const a=new THREE.Vector3(x0,y0,z0),b=new THREE.Vector3(x1,y1,z1),d=b.clone().sub(a),L=d.length(),g=new THREE.BoxGeometry(t,L,t);
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(0,L/2,0));g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())));
  g.applyMatrix4(new THREE.Matrix4().makeTranslation(a.x,a.y,a.z));const q=g.toNonIndexed().attributes.position.array;for(let i=0;i<q.length;i++)pos.push(q[i]);for(let i=0;i<q.length/3;i++)colr.push(cl.r,cl.g,cl.b)};
 const band=y=>Math.floor(y/333*11)%2?WH:OR,C4=[[1,1],[-1,1],[-1,-1],[1,-1]],lv=[];for(let y=0;y<=250;y+=y<120?10:12.5)lv.push(y);
 for(let k=1;k<lv.length;k++){const y0=lv[k-1],y1=lv[k],a=hw(y0),b=hw(y1),cl=band((y0+y1)/2),t=y0<150?1.4:.9;
  for(let c=0;c<4;c++){const[p,q]=C4[c],[p2,q2]=C4[(c+1)%4];beam(TX+p*a,y0,TZ+q*a,TX+p*b,y1,TZ+q*b,t*1.8,cl);
   beam(TX+p*b,y1,TZ+q*b,TX+p2*b,y1,TZ+q2*b,t*.8,cl);beam(TX+p*a,y0,TZ+q*a,TX+p2*b,y1,TZ+q2*b,t*.6,cl);beam(TX+p2*a,y0,TZ+q2*a,TX+p*b,y1,TZ+q*b,t*.6,cl)}}
 // Arcos entre las patas, miradores y antena
 for(let c=0;c<4;c++){const[p,q]=C4[c],[p2,q2]=C4[(c+1)%4],a=hw(0),m=hw(48);for(let s=0;s<8;s++){const u0=s/8,u1=(s+1)/8,f=u=>48-Math.sin(u*PI)*28;
  beam(TX+(p+(p2-p)*u0)*a*.9,f(u0),TZ+(q+(q2-q)*u0)*a*.9,TX+(p+(p2-p)*u1)*a*.9,f(u1),TZ+(q+(q2-q)*u1)*a*.9,1.6,OR)}}
 const deck=(y,r,hh)=>{const g=new THREE.CylinderGeometry(r,r*.92,hh,8).toNonIndexed();g.translate(TX,y+hh/2,TZ);const q=g.attributes.position.array;for(let i=0;i<q.length;i++)pos.push(q[i]);for(let i=0;i<q.length/3;i++){const yy=q[i*3+1];const cl=yy>y+hh*.8?WH:new THREE.Color(0x2b3138);colr.push(cl.r,cl.g,cl.b)}};
 deck(145,14,11);deck(248,6.5,5);beam(TX,250,TZ,TX,333,TZ,1.6,WH);for(let y=262;y<330;y+=14)beam(TX,y,TZ,TX,y+7,TZ,1.9,OR);
 mkMesh(pos,new THREE.MeshLambertMaterial({vertexColors:true}),0,{color:colr});for(const[p,q]of C4)addCirc(TX+p*hw(0),TZ+q*hw(0),4.2)}

// Árboles (los de OSM y los de parques y aceras), farolas y señales de velocidad
let lampN=0;
function decorate(){const tr=[],lp=[],sg=[],rnd=(()=>{let s=11;return()=>(s=s*16807%2147483647)/2147483647})(),TMAX=MOBILE?2500:6000;
 const free=(x,z,m)=>x>5&&z>5&&x<W-5&&z<W-5&&roadAt(x,z)<0&&!blockedAt(x,z,m);
 const tree=(x,z)=>{if(tr.length<TMAX&&free(x,z,.6)){tr.push([x,z,.75+rnd()*.6,rnd()*PI]);addCirc(x,z,.35)}};
 for(let i=0;i<MAP.trees.length;i+=2)tree(MAP.trees[i],MAP.trees[i+1]);
 for(const r of MAP.roads){const hw=r.w/2,p=r.p;let acc=rnd()*30,side=1;
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=(bx-ax)/L,uz=(bz-az)/L;
   for(let t=0;t<L;t+=2){acc+=2;const x=ax+ux*t,z=az+uz*t;
    if(acc%14<2&&r.t<3&&rnd()<.55)for(const s of[-1,1])tree(x+uz*s*(hw+2.2),z-ux*s*(hw+2.2));
    if(acc>=32){acc=0;side=-side;const lx=x+uz*side*(hw+.8),lz=z-ux*side*(hw+.8);if(free(lx,lz,.3)){lp.push([lx,CURB,lz,Math.atan2(-uz*side,ux*side)]);addCirc(lx,lz,.18)}}}}
  // Señal de velocidad máxima al principio de la calle (si OSM la tiene)
  if(r.s>=20&&p.length>=4){const L=Math.hypot(p[2]-p[0],p[3]-p[1])||1,ux=(p[2]-p[0])/L,uz=(p[3]-p[1])/L,d=Math.min(15,L/2),x=p[0]+ux*d+uz*(hw+.6),z=p[1]+uz*d-ux*(hw+.6);
   if(free(x,z,.2)){sg.push([x,CURB,z,Math.atan2(ux,uz)+PI,r.s]);addCirc(x,z,.12)}}}
 for(const g of MAP.green){if(g.k===2)continue;const R=g.p,b=[1e9,1e9,-1e9,-1e9];for(let i=0;i<R.length;i+=2){b[0]=Math.min(b[0],R[i]);b[1]=Math.min(b[1],R[i+1]);b[2]=Math.max(b[2],R[i]);b[3]=Math.max(b[3],R[i+1])}
  const n=Math.min(400,(b[2]-b[0])*(b[3]-b[1])/(g.k?60:170));for(let k=0;k<n;k++){const x=b[0]+rnd()*(b[2]-b[0]),z=b[1]+rnd()*(b[3]-b[1]);if(inPoly(R,x,z))tree(x,z)}}
 const tc=[0x3f7a3a,0x4f8a3f,0x356b35,0x5e9447];
 inst(new THREE.CylinderGeometry(.18,.26,2.6,6).translate(0,1.3+CURB,0),new THREE.MeshLambertMaterial({color:0x5a4332}),tr.map(t=>[t[0],0,t[1],t[3],t[2]]));
 inst(new THREE.IcosahedronGeometry(1.7,1).translate(0,4+CURB,0),new THREE.MeshLambertMaterial({color:0xffffff}),tr.map((t,i)=>[t[0],0,t[1],t[3],t[2],0,tc[i%4]]));
 inst(new THREE.CylinderGeometry(.08,.11,7,6).translate(0,3.5,0),new THREE.MeshLambertMaterial({color:0x6d7178}),lp);
 inst(new THREE.BoxGeometry(.12,.12,1.6).translate(0,6.9,.75),new THREE.MeshLambertMaterial({color:0x6d7178}),lp);
 inst(new THREE.BoxGeometry(.35,.12,.6).translate(0,6.8,1.5),new THREE.MeshLambertMaterial({color:0xfff6d8,emissive:0x8a8470}),lp);lampN=lp.length;
 // Señales: poste común y una placa por cada velocidad (círculo rojo, número azul, como en Japón)
 inst(new THREE.CylinderGeometry(.04,.04,2.6,6).translate(0,1.3,0),new THREE.MeshLambertMaterial({color:0x9aa0a8}),sg.map(s=>s.slice(0,4)));
 const sp=[...new Set(sg.map(s=>s[4]))];for(const v of sp){const c=document.createElement("canvas");c.width=c.height=64;const g=c.getContext("2d");
  g.fillStyle="#fff";g.beginPath();g.arc(32,32,30,0,7);g.fill();g.strokeStyle="#d8232a";g.lineWidth=8;g.beginPath();g.arc(32,32,26,0,7);g.stroke();g.fillStyle="#1d4fa0";g.font="bold 26px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(v,32,34);
  inst(new THREE.CircleGeometry(.32,20).translate(0,2.75,.05),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c),transparent:true,side:THREE.DoubleSide}),sg.filter(s=>s[4]===v).map(s=>s.slice(0,4)))}}

// Imagen del mapa (1 píxel = 1 m) para el minimapa y el mapa de aparición
function drawMapImg(){const c=document.createElement("canvas");c.width=c.height=W;const g=c.getContext("2d"),poly=(R)=>{g.beginPath();g.moveTo(R[0],R[1]);for(let i=2;i<R.length;i+=2)g.lineTo(R[i],R[i+1]);g.closePath();g.fill()},
 line=(p,w)=>{g.lineWidth=w;g.beginPath();g.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)g.lineTo(p[i],p[i+1]);g.stroke()};
 g.fillStyle="#3a3d45";g.fillRect(0,0,W,W);g.fillStyle="#2f6b3a";for(const q of MAP.green)poly(q.p);
 g.fillStyle=g.strokeStyle="#2c5f8c";for(const R of MAP.water)poly(R);g.lineCap=g.lineJoin="round";for(const r of MAP.rivers)line(r.p,r.w);
 g.strokeStyle="#6b5a4a";for(const r of MAP.rails)line(r.p,3);g.strokeStyle="#8d93a1";for(const r of MAP.roads)line(r.p,r.w);
 for(const b of MAP.buildings){g.fillStyle=b.k?"#7a2e25":"#22242a";poly(b.p)}
 g.fillStyle="#e5173f";g.beginPath();g.moveTo(TX,TZ-30);g.lineTo(TX+26,TZ+18);g.lineTo(TX-26,TZ+18);g.fill();mapImg=c}
