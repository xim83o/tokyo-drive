// Tráfico NPC por las calles reales (conducen por la izquierda, como en Japón): grafo de calles con carriles, semáforos en los
// cruces reales de OSM, ceder el paso, giros suaves, choques con desplazamiento según velocidad y masa, y claxon moderado
const NPC=[],NCOL=[0xd9d9d9,0x333a45,0x9b2d2d,0x2d5a9b,0xc9c24a,0x3d7d4e,0x7a7a7a,0xffffff];
let npcLvl=ENV.npc,TT=0,lastLt=-1,hornT=0;const NCNT=[0,8,20,40],NLAB=["Sin tráfico","Poco","Medio","Mucho"],BD=3.5,SPD=[15,13.5,12,10.5,8];
function setNpc(v){npcLvl=((v%4)+4)%4;ENV.npc=npcLvl;saveEnv();$("trf").textContent="🚗 "+NLAB[npcLvl]}
setNpc(npcLvl);
// --- Grafo: nodos (cruces y extremos de calle) y carriles dirigidos ---
const GN=[],LANES=[],CLU=[];
function lanePos(L,s,o){const c=L.cum;s=Math.max(0,Math.min(L.len,s));let i=o&&o.si<c.length-1&&c[o.si]<=s?o.si:0;while(i<c.length-2&&c[i+1]<s)i++;if(o)o.si=i;
 const t=(s-c[i])/((c[i+1]-c[i])||1),p=L.p;return[p[i*2]+(p[i*2+2]-p[i*2])*t,p[i*2+1]+(p[i*2+3]-p[i*2+1])*t,Math.atan2(p[i*2+2]-p[i*2],p[i*2+3]-p[i*2+1])]}
function mkLane(pts,a,b,r,off,eid){const n=pts.length/2,p=new Float32Array(pts.length);
 for(let i=0;i<n;i++){const i0=Math.max(0,i-1),i1=Math.min(n-1,i+1),dx=pts[i1*2]-pts[i0*2],dz=pts[i1*2+1]-pts[i0*2+1],l=Math.hypot(dx,dz)||1;p[i*2]=pts[i*2]+dz/l*off;p[i*2+1]=pts[i*2+1]-dx/l*off}
 const cum=[0];for(let i=1;i<n;i++)cum.push(cum[i-1]+Math.hypot(p[i*2]-p[i*2-2],p[i*2+1]-p[i*2-1]));
 const L={p,cum,len:cum[n-1],from:a,to:b,w:r.w,t:r.t,o:r.o,ri:MAP.roads.indexOf(r),vmax:r.s?r.s/3.6:SPD[r.t],eid,rev:null,grp:0,internal:false,c:Float32Array.from(pts),off};LANES.push(L);GN[a].out.push(L);GN[b].inc.push(L);return L}
function initTraffic(){const use=new Map(),node=new Map();
 for(const r of MAP.roads)r.n.forEach((id,i)=>use.set(id,(use.get(id)||0)+(i===0||i===r.n.length-1?2:1)));
 const gn=(id,x,z)=>{let k=node.get(id);if(k===undefined){k=GN.length;node.set(id,k);GN.push({x,z,out:[],inc:[],cl:-1,r:0,e:new Set(),busy:0})}return k};
 let eid=0;for(const r of MAP.roads){let st=0;const p=r.p;
  for(let i=1;i<r.n.length;i++){if(i<r.n.length-1&&use.get(r.n[i])<2)continue;
   const pts=Array.from(p.slice(st*2,i*2+2)),a=gn(r.n[st],p[st*2],p[st*2+1]),b=gn(r.n[i],p[i*2],p[i*2+1]);st=i;if(a===b||pts.length<4)continue;
   GN[a].e.add(eid);GN[b].e.add(eid);
   if(r.o)mkLane(pts,a,b,r,Math.max(0,r.w/2-1.9),eid);
   else{const f=mkLane(pts,a,b,r,r.w/4,eid),rp=[];for(let k=pts.length-2;k>=0;k-=2)rp.push(pts[k],pts[k+1]);const bk=mkLane(rp,b,a,r,r.w/4,eid);f.rev=bk;bk.rev=f}eid++}}
 // Semáforos: cada semáforo de OSM se asigna al cruce más cercano; los cruces con semáforo a menos de 35 m forman un mismo grupo
 const S=MAP.signals;for(let i=0;i<S.length;i+=2){let best=-1,bd=900;GN.forEach((g,k)=>{if(g.e.size<3)return;const d=(g.x-S[i])**2+(g.z-S[i+1])**2;if(d<bd){bd=d;best=k}});if(best>=0)GN[best].sig=true}
 GN.forEach((g,k)=>{if(!g.sig||g.cl>=0)return;const c=CLU.length,q=[k];CLU.push({off:Math.random()*24,ax:null});g.cl=c;
  while(q.length){const a=GN[q.pop()];GN.forEach((b,j)=>{if(b.sig&&b.cl<0&&(a.x-b.x)**2+(a.z-b.z)**2<1225){b.cl=c;q.push(j)}})}});
 for(const L of LANES){const g=GN[L.to];if(g.cl<0)continue;const c=CLU[g.cl],n=L.p.length,ang=Math.atan2(L.p[n-2]-L.p[n-4],L.p[n-1]-L.p[n-3]);
  if(c.ax===null)c.ax=ang;const d=Math.abs(((ang-c.ax)%PI+PI*1.5)%PI-PI/2);L.grp=d<PI/4?0:1;L.internal=GN[L.from].cl===g.cl&&L.len<45}
 // Radio de cada cruce (donde se acaba el tramo recto): mitad del ancho de la calle más ancha + 2 m; con semáforo, +6 m para el paso de cebra
 for(const g of GN)if(g.e.size>=3){let w=0;for(const L of g.out.concat(g.inc))w=Math.max(w,L.w);g.r=w/2+(g.cl>=0?6:2)}
 for(const L of LANES){L.s0=GN[L.from].r;L.s1=L.len-GN[L.to].r;if(L.s1<L.s0)L.s0=L.s1=L.len/2}
 buildLights();buildMarkings()}
// Marcas viales: línea central (amarilla en las grandes, blanca discontinua en las medianas), separación de carriles, bordes,
// líneas de detención y pasos de cebra en los cruces con semáforo
function buildMarkings(){const wa=[],ya=[],done=new Set();
 const C=L=>{if(!L.cc){const c=L.c,cc=[0];for(let i=2;i<c.length;i+=2)cc.push(cc[cc.length-1]+Math.hypot(c[i]-c[i-2],c[i+1]-c[i-1]));L.cc=cc}return L.cc};
 const at=(L,s,o)=>{const c=L.c,cc=C(L);let i=0;while(i<cc.length-2&&cc[i+1]<s)i++;const t=Math.max(0,Math.min(1,(s-cc[i])/((cc[i+1]-cc[i])||1))),dx=c[i*2+2]-c[i*2],dz=c[i*2+3]-c[i*2+1],l=Math.hypot(dx,dz)||1;
  return[c[i*2]+dx*t+dz/l*o,c[i*2+1]+dz*t-dx/l*o]};
 // Solo se pinta donde la calzada es de esta calle (ni fuera del asfalto ni encima de otra calle que se cruza o se une)
 const ok=(L,A,B)=>onlyRoad(A[0],A[1],L.ri,.2)&&onlyRoad(B[0],B[1],L.ri,.2);
 const line=(a,L,o,s0,s1,w,dash,gap)=>{for(let s=s0;s<s1;s+=dash+gap){const e=Math.min(s1,s+dash);for(let q=s;q<e-.01;q+=3){const q2=Math.min(e,q+3),A=at(L,q,o),B=at(L,q2,o);if(ok(L,A,B))quad(a,A[0],A[1],B[0],B[1],w/2,.015)}}};
 for(const L of LANES){const len=C(L)[C(L).length-1],hw=L.w/2,g0=GN[L.from],g1=GN[L.to],s0=g0.r+.5,s1=len-g1.r-.5;
  if(!done.has(L.eid)&&s1>s0){done.add(L.eid);
   if(!L.o){if(L.t<=1)line(ya,L,0,s0,s1,.15,1e9,0);else if(L.t===2)line(wa,L,0,s0,s1,.15,1e9,0);else if(L.t===3)line(wa,L,0,s0,s1,.15,3,4.5);
    const nl=Math.floor(hw/3.2);for(let k=1;k<nl;k++)for(const sg of[-1,1])line(wa,L,sg*k*hw/nl,s0,s1,.12,5,5)}
   else{const nl=Math.floor(L.w/3.2);for(let k=1;k<nl;k++)line(wa,L,-hw+k*L.w/nl,s0,s1,.12,5,5)}
   for(const sg of[-1,1])line(wa,L,sg*(hw-.35),s0-.5,s1+.5,.15,1e9,0)}
  // Línea de detención (mitad izquierda o toda la calle si es de sentido único) y paso de cebra antes del cruce con semáforo
  if(g1.mt===undefined){g1.mt=9;for(const q of g1.inc.concat(g1.out))g1.mt=Math.min(g1.mt,q.t)}
  if(g1.cl>=0||g1.r>0&&L.t>g1.mt){const sl=len-g1.r+.3;for(let o=L.o?-hw+.3:0;o<hw-.3;o+=.5){const A=at(L,sl,o),B=at(L,sl,Math.min(hw-.3,o+.5));if(onlyRoad(A[0],A[1],L.ri,.1)&&onlyRoad(B[0],B[1],L.ri,.1))quad(wa,A[0],A[1],B[0],B[1],.22,.016)}}
  if(g1.cl>=0&&!L.internal&&len-g1.r>5){const a0=len-g1.r+1.2,a1=a0+4;for(let o=-hw+.6;o<hw-.4;o+=.9){const A=at(L,a0,o),B=at(L,a1,o);if(ok(L,A,B))quad(wa,A[0],A[1],B[0],B[1],.22,.016)}}}
 const mm=c=>beamMat(new THREE.MeshLambertMaterial({color:c,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-6}));
 if(wa.length)mkMeshZ(wa,mm(0xe2e2dc),0,1);if(ya.length)mkMeshZ(ya,mm(0xe0b020),0,1)}
// Ciclo de 24 s por grupo de cruces: un eje 9 s verde + 2 s ámbar, luego el otro
function lightSt(L){const t=(TT+CLU[GN[L.to].cl].off+(L.grp?12:0))%24;return t<9?"g":t<11?"y":"r"}
let LM=null,LIT=[];
function buildLights(){const poles=[],boxes=[],lamps=[];
 for(const L of LANES){if(GN[L.to].cl<0||L.internal)continue;const[x,z,a]=lanePos(L,L.s1),ox=Math.cos(a),oz=-Math.sin(a),d=(L.rev?L.w/4:1.9)+1.2,X=x+ox*d,Z=z+oz*d;
  poles.push([X,0,Z,a]);boxes.push([X,0,Z,a]);for(let k=0;k<3;k++)lamps.push([X,0,Z,a,k]);LIT.push(L)}
 if(!poles.length)return;const o=new THREE.Object3D(),pm=new THREE.InstancedMesh(new THREE.CylinderGeometry(.1,.12,5.4,6).translate(0,2.7,0),new THREE.MeshLambertMaterial({color:0x8a9098}),poles.length),
  bm=new THREE.InstancedMesh(new THREE.BoxGeometry(1.5,.5,.35).translate(.5,5.3,0),new THREE.MeshLambertMaterial({color:0x3a3f46}),boxes.length);
 LM=new THREE.InstancedMesh(new THREE.CylinderGeometry(.17,.17,.06,12).rotateX(PI/2),new THREE.MeshBasicMaterial(),lamps.length);
 poles.forEach((e,i)=>{o.position.set(e[0],e[1],e[2]);o.rotation.set(0,e[3]+PI,0);o.updateMatrix();pm.setMatrixAt(i,o.matrix);bm.setMatrixAt(i,o.matrix)});
 // Semáforo japonés horizontal: verde, ámbar y rojo de izquierda a derecha vistos por el conductor
 lamps.forEach((e,i)=>{o.position.set(e[0],e[1],e[2]);o.rotation.set(0,e[3]+PI,0);o.updateMatrix();const m=new THREE.Matrix4().makeTranslation(.02+e[4]*.48,5.3,.19);m.premultiply(o.matrix);LM.setMatrixAt(i,m)});
 for(const m of[pm,bm,LM]){m.frustumCulled=false;sc.add(m)}for(let i=0;i<poles.length;i++)addCirc(poles[i][0],poles[i][2],.15);lamps2()}
const LCOL={g:new THREE.Color(0x20e0a0),y:new THREE.Color(0xffb000),r:new THREE.Color(0xff2a2a),off:new THREE.Color(0x22262c)};
function lamps2(){if(!LM)return;LIT.forEach((L,i)=>{const st=lightSt(L);LM.setColorAt(i*3,st==="g"?LCOL.g:LCOL.off);LM.setColorAt(i*3+1,st==="y"?LCOL.y:LCOL.off);LM.setColorAt(i*3+2,st==="r"?LCOL.r:LCOL.off)});LM.instanceColor.needsUpdate=true}
// --- Coches NPC. mode: 0 conduce · 1 desplazado por un choque · 2 parado tras el choque. wreck: siniestrado ---
function mkNpc(){if(CMAP){let r=Math.random()*NPCK.reduce((a,k)=>a+k.p,0),K=NPCK[0];for(const k of NPCK){r-=k.p;if(r<=0){K=k;break}}
  if(MODELS[K.f]){const g=new THREE.Group(),m=modelInst(K.f,K.l,K.paint?NCOL[Math.floor(Math.random()*NCOL.length)]:undefined);g.add(m.s);carLights(g,m.w,m.h,K.l);g.add(blob(m.w,K.l));
   return{g,x:-9999,z:-9999,h:0,v:0,vt:12,m:K.m,l:K.l,w:m.w,hp:.85+Math.random()*.3,si:0}}}
 const g=new THREE.Group(),t=Math.floor(Math.random()*3),w=1.75,l=[3.6,4.3,4.8][t],bh=[.75,.6,.95][t],c=NCOL[Math.floor(Math.random()*NCOL.length)];
 const bx=(a,b,d,col,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);g.add(m)};
 bx(w,bh,l,c,0,.3+bh/2,0);bx(w*.88,.5,l*[.55,.45,.75][t],0x1a2430,0,.3+bh+.25,l*[-.05,-.1,.05][t]);
 for(const sx of[-1,1])for(const sz of[-1,1])bx(.25,.7,.7,0x111111,sx*w/2,.35,sz*l*.32);
 // Faros y pilotos (se encienden de noche, ver env.js)
 if(!NM.head){NM.head=new THREE.MeshLambertMaterial({color:0xfff4d0,emissive:0xfff0c8,emissiveIntensity:.2});NM.tail=new THREE.MeshLambertMaterial({color:0xaa1010,emissive:0xff1a1a,emissiveIntensity:.25})}
 for(const sx of[-1,1]){const hm=new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.05),NM.head);hm.position.set(sx*w*.32,.3+bh*.7,l/2);g.add(hm);const tm=new THREE.Mesh(new THREE.BoxGeometry(.3,.12,.05),NM.tail);tm.position.set(sx*w*.32,.3+bh*.7,-l/2);g.add(tm)}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true});g.add(blob(w,l));
 return{g,x:-9999,z:-9999,h:0,v:0,vt:12,m:[1000,1300,1700][t],l,hp:.85+Math.random()*.3,si:0}}
function npcRst(n){n.tr=null;n.nx=null;n.ox=n.oz=0;n.dead=false;n.exit=false;n.mode=0;n.wreck=false;n.uns=0;n.vx=n.vz=n.sp=0;n.wb=0;n.pw=0;n.stun=0;n.sw=0;n.ign=0;n.k=.85+Math.random()*.2}
function npcPlace(n){for(let t=0;t<30;t++){const L=LANES[Math.floor(Math.random()*LANES.length)];if(L.s1-L.s0<10||(L.t===4&&Math.random()<.75))continue;
  const s=L.s0+Math.random()*(L.s1-L.s0),[x,z,a]=lanePos(L,s),d=Math.hypot(x-px,z-pz);if(d<110||d>320)continue;
  if(NPC.some(o=>o!==n&&o.lane===L&&Math.abs(o.s-s)<12))continue;n.lane=L;n.s=s;n.si=0;n.x=x;n.z=z;n.h=a;n.v=Math.min(L.vmax,10);return}
 n.x=n.z=-9999;n.lane=null}
// Elige el siguiente carril al llegar a un cruce (sin dar la vuelta salvo en calles sin salida)
function pickNext(L){const o=GN[L.to].out.filter(q=>q!==L.rev);if(!o.length)return L.rev;
 const n=L.p.length,a0=Math.atan2(L.p[n-2]-L.p[n-4],L.p[n-1]-L.p[n-3]);
 const w=o.map(q=>{const d=Math.abs(ad(Math.atan2(q.p[2]-q.p[0],q.p[3]-q.p[1]),a0));return(d<.5?3:d<2.3?1:.3)*(q.t===4&&L.t<4?.3:1)});let r=Math.random()*w.reduce((a,b)=>a+b);
 for(let i=0;i<o.length;i++){r-=w[i];if(r<=0)return o[i]}return o[0]}
// Curva de Bézier para recorrer el cruce desde el final del tramo recto al principio del siguiente
function mkTurn(n,L,M){const[x0,z0,a0]=lanePos(L,L.s1),[x3,z3,a3]=lanePos(M,M.s0),d=Math.hypot(x3-x0,z3-z0),k=Math.max(1,d*.4);
 n.tr={P:[x0,z0,x0+Math.sin(a0)*k,z0+Math.cos(a0)*k,x3-Math.sin(a3)*k,z3-Math.cos(a3)*k,x3,z3],len:Math.max(.5,d*1.15),t:0,node:L.to,vt:Math.abs(ad(a3,a0))>.6?6:11}}
function bez(P,t){const u=1-t,a=u*u*u,b=3*u*u*t,c=3*u*t*t,d=t*t*t;return[a*P[0]+b*P[2]+c*P[4]+d*P[6],a*P[1]+b*P[3]+c*P[5]+d*P[7]]}
const npcVel=n=>n.mode?[n.vx,n.vz]:[Math.sin(n.h)*n.v,Math.cos(n.h)*n.v];
function honk(n,delay){if(TT<hornT||TT<(n.hk||0))return;const d=Math.hypot(n.x-px,n.z-pz);if(d>70)return;hornT=TT+4;n.hk=TT+10;setTimeout(()=>hornSnd(d,n.hp),(delay||0)*1000)}
// Golpe a un NPC: dv (m/s) en la dirección (nx,nz); along = punto del impacto a lo largo del coche (para el trompo)
// <20 km/h empujón y sigue · 20-60 km/h se desvía y se para 3 s · >60 km/h sale despedido, trompea y queda siniestrado
function hitNpc(n,dv,nx,nz,along){const fx=Math.sin(n.h),fz=Math.cos(n.h);let dl=dv*(nx*fx+nz*fz),dr=dv*(-nx*fz+nz*fx);
 // Agarre: si el coche no está ya deslizando, los neumáticos absorben la parte pequeña del golpe (sobre todo la lateral)
 if(!n.mode){dl=Math.sign(dl)*Math.max(0,Math.abs(dl)-1.5);dr=Math.sign(dr)*Math.max(0,Math.abs(dr)-3)}
 dv=Math.hypot(dl,dr);if(dv<.8)return;const [ux,uz]=npcVel(n),kmh=dv*3.6,lat=dr/dv;
 n.vx=ux+fx*dl-fz*dr;n.vz=uz+fz*dl+fx*dr;along=Math.max(-2.4,Math.min(2.4,along));
 let sp=(n.mode?n.sp:0)-along*lat*dv*.09*(kmh<20?.3:1)+(kmh>=20?(Math.random()-.5)*dv*(kmh>=60?.15:.1):0);
 if(kmh>=60)sp=Math.sign(sp||1)*Math.max(Math.abs(sp),dv*.12);n.sp=Math.max(-3.5,Math.min(3.5,sp));
 if(kmh>=60)n.wreck=true;n.stunT=kmh>=20?3:0;n.mode=1;n.v=0;n.tr=null;n.nx=null;n.exit=false}
// Choque entre dos coches como cajas giradas (ancho × largo reales), por separación de ejes. Devuelve la dirección en la que hay
// que mover el coche A para separarlo del B y cuánto (p), o null si no se tocan
function boxHit(ax,az,ah,aw,al,bx,bz,bh,bw,bl){const A=[[Math.sin(ah),Math.cos(ah)],[Math.cos(ah),-Math.sin(ah)]],B=[[Math.sin(bh),Math.cos(bh)],[Math.cos(bh),-Math.sin(bh)]],dx=ax-bx,dz=az-bz;let best=null;
 for(const u of[...A,...B]){const d=dx*u[0]+dz*u[1],ra=Math.abs(A[0][0]*u[0]+A[0][1]*u[1])*al/2+Math.abs(A[1][0]*u[0]+A[1][1]*u[1])*aw/2,rb=Math.abs(B[0][0]*u[0]+B[0][1]*u[1])*bl/2+Math.abs(B[1][0]*u[0]+B[1][1]*u[1])*bw/2,o=ra+rb-Math.abs(d);
  if(o<=0)return null;if(!best||o<best.p){const s=d<0?-1:1;best={p:o,nx:u[0]*s,nz:u[1]*s}}}return best}
function knock(n,dt){n.x+=n.vx*dt;n.z+=n.vz*dt;n.h+=n.sp*dt;
 // Rozamiento de neumáticos: de lado frena mucho (~1 g), hacia delante algo menos (el conductor frena)
 const s=Math.hypot(n.vx,n.vz),fx=Math.sin(n.h),fz=Math.cos(n.h),fw=n.wreck?1.3:1;let l=n.vx*fx+n.vz*fz,r=-n.vx*fz+n.vz*fx;
 l=Math.sign(l)*Math.max(0,Math.abs(l)-8*fw*dt);r=Math.sign(r)*Math.max(0,Math.abs(r)-11*fw*dt);n.vx=fx*l-fz*r;n.vz=fz*l+fx*r;
 // El giro se frena con el deslizamiento: cuando el coche casi se ha parado, deja de girar
 n.sp=Math.sign(n.sp)*Math.max(0,Math.abs(n.sp)*Math.exp(-3*dt)-2*dt)*Math.min(1,.3+s/6);
 const hh=collide(n,1);if(hh){const vn=n.vx*hh.nx+n.vz*hh.nz;if(vn<0){n.vx-=1.3*vn*hh.nx;n.vz-=1.3*vn*hh.nz;if(-vn>4&&Math.hypot(n.x-px,n.z-pz)<60&&performance.now()-crashT>250){crashT=performance.now();thump(-vn*.6)}}}
 n.x=Math.max(5,Math.min(W-5,n.x));n.z=Math.max(5,Math.min(W-5,n.z));
 if(s<.3&&Math.abs(n.sp)<.2){n.vx=n.vz=n.sp=0;if(!n.wreck&&n.mode===1){n.mode=2;n.stun=n.stunT}}}
// Tras un choque medio vuelve al carril más cercano que vaya en su dirección; si está lejos de cualquier calle queda siniestrado
function rejoin(n){let best=null,bd=49,bs=0;for(const L of LANES){const p=L.p;for(let i=2;i<p.length;i+=2){const d=segD2(n.x,n.z,p[i-2],p[i-1],p[i],p[i+1]);if(d>=bd)continue;
  const a=Math.atan2(p[i]-p[i-2],p[i+1]-p[i-1]);if(Math.abs(ad(a,n.h))>1.6)continue;bd=d;best=L;bs=L.cum[i/2-1]+Math.hypot(_cx-p[i-2],_cz-p[i-1])}}
 if(!best){n.wreck=true;return}n.lane=best;n.s=Math.max(best.s0,Math.min(best.s1,bs));n.si=0;n.mode=0;n.v=0;n.nx=null;n.tr=null;
 const[x,z]=lanePos(best,n.s);n.ox=n.x-x;n.oz=n.z-z}
const FR=new THREE.Frustum(),FM=new THREE.Matrix4(),SPH=new THREE.Sphere(new THREE.Vector3(),3);
function npcs(dt){if(!LANES.length)return;TT+=dt;const k2=Math.floor(TT*2);if(k2!==lastLt){lastLt=k2;lamps2()}
 const cnt=NCNT[npcLvl];while(NPC.length<cnt){const o=mkNpc();npcRst(o);sc.add(o.g);NPC.push(o)}
 NPC.forEach((n,k)=>{n.g.visible=k<cnt&&!!n.lane});FR.setFromProjectionMatrix(FM.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
 for(const g of GN)g.busy=0;for(let k=0;k<cnt;k++){const n=NPC[k];if(n.tr&&!n.mode)GN[n.tr.node].busy++}
 for(let k=0;k<cnt;k++){const n=NPC[k];
  if(!n.lane||Math.hypot(n.x-px,n.z-pz)>380){npcRst(n);npcPlace(n);if(!n.lane)continue}
  if(n.wreck){SPH.center.set(n.x,1,n.z);const seen=Math.hypot(n.x-px,n.z-pz)<200&&FR.intersectsSphere(SPH);n.uns=seen?0:n.uns+dt;if(n.uns>20){npcRst(n);npcPlace(n);continue}}
  if(n.mode===1)knock(n,dt);
  else if(n.mode===2){n.stun-=dt;if(n.stun<=0)rejoin(n)}
  // Calle que sale del mapa: sigue recto, se pierde en la niebla del borde y reaparece en otra calle
  else if(n.exit){n.v=Math.min(n.v+3*dt,14);n.x+=Math.sin(n.h)*n.v*dt;n.z+=Math.cos(n.h)*n.v*dt;
   if(Math.min(n.x,n.z,W-n.x,W-n.z)<-60){npcRst(n);n.lane=null;continue}}
  else{const L=n.lane,fx=Math.sin(n.h),fz=Math.cos(n.h);let vt=Math.min(L.vmax*n.k,n.tr?n.tr.vt:99),blk=null;
   // Coche de delante (mismo carril o el siguiente) y jugador
   const chk=(ox,oz,ov,o)=>{const dx=ox-n.x,dz=oz-n.z,f=dx*fx+dz*fz,s=Math.abs(dx*fz-dz*fx);if(f>0&&f<18&&s<2.2){const lim=f<6?0:ov+(f-6)*.8;if(lim<vt){vt=lim;blk=o}}};
   chk(px,pz,Math.hypot(vx,vz),"P");
   // Solo frena por coches que van en su mismo sentido o accidentados (los que vienen de frente o cruzan los regulan los semáforos).
   // Si lleva más de 2,5 s parado dentro de un cruce, termina de cruzar para no bloquearlo
   n.trw=n.tr&&n.v<.3?(n.trw||0)+dt:0;if(n.trw>2.5)n.gh=3;if(n.gh>0)n.gh-=dt;
   if(!(n.gh>0))for(let q=0;q<cnt;q++){const o=NPC[q];if(q===k||!o.lane)continue;if(o.mode||Math.sin(o.h)*fx+Math.cos(o.h)*fz>.5)chk(o.x,o.z,o.mode?0:o.v,o)}
   n.wb=blk&&blk!=="P"&&blk.mode&&n.v<.5?n.wb+dt:0;if(n.wb>4){n.wb=0;if(L.rev){n.lane=L.rev;n.s=Math.max(L.rev.s0,L.len-n.s);n.si=0;n.tr=null;n.nx=null}}
   if(blk==="P"){if(n.v>6&&n.v-vt>4)honk(n);n.pw=n.v<.3?n.pw+dt:0;if(n.pw>4){honk(n);n.pw=0}}else n.pw=0;
   if(n.tr){const T=n.tr;T.t+=n.v*dt/T.len;
    if(T.t>=1){n.tr=null;n.lane=n.nx;n.nx=null;n.s=n.lane.s0;n.si=0}else{const[x,z]=bez(T.P,T.t),[x2,z2]=bez(T.P,Math.min(1,T.t+.05));n.x=x;n.z=z;n.h=Math.atan2(x2-x,z2-z)}}
   if(!n.tr){const L2=n.lane,d=L2.s1-n.s;if(!n.nx&&d<45&&!n.dead){n.nx=pickNext(L2);if(!n.nx)n.dead=true}
    // Calle de sentido único sin salida (borde del mapa): se para al final y desaparece solo cuando no se ve
    const ex=lanePos(L2,L2.s1),edge=Math.min(ex[0],ex[1],W-ex[0],W-ex[1])<40;
    if(n.dead&&edge){if(d<1.5){n.exit=true;continue}}
    else if(n.dead){vt=Math.min(vt,Math.max(0,d-2)*.8);SPH.center.set(n.x,1,n.z);n.uns=FR.intersectsSphere(SPH)&&Math.hypot(n.x-px,n.z-pz)<250?0:n.uns+dt;if(n.uns>1.5){npcRst(n);n.lane=null;continue}}
    // Semáforo o cruce sin semáforo ocupado: frenada progresiva hasta quedarse con el morro en la línea
    const g=GN[L2.to],room=d-n.l/2-.5;let stop=false;if(n.ign>0)n.ign-=dt;
    if(g.r>0&&d<60){if(g.cl>=0&&!L2.internal){const st=lightSt(L2);stop=st==="r"||(st==="y"&&room>n.v*n.v/12)}
     else if(g.cl<0&&n.ign<=0&&(g.busy>0||Math.hypot(px-g.x,pz-g.z)<g.r))stop=true}
    if(stop)vt=Math.min(vt,room>0?Math.sqrt(2*BD*room):0);
    if(n.nx&&Math.abs(ad(Math.atan2(n.nx.p[2]-n.nx.p[0],n.nx.p[3]-n.nx.p[1]),n.h))>.6&&d<30)vt=Math.min(vt,7);
    n.sw=n.v<.3?n.sw+dt:0;if(n.sw>10){n.ign=5;n.sw=0}
    n.s+=n.v*dt;if(n.dead)n.s=Math.min(n.s,L2.len-1);else if(n.s>=L2.s1){if(g.r>0||n.nx===L2.rev)mkTurn(n,L2,n.nx);else{n.lane=n.nx;n.nx=null;n.s=n.lane.s0+(n.s-L2.s1);n.si=0}}
    // Tras reincorporarse, el desfase con el carril se reduce poco a poco (sin saltos)
    if(!n.tr){const[x,z,a]=lanePos(n.lane,n.s,n),f=Math.exp(-2*dt);n.ox=(n.ox||0)*f;n.oz=(n.oz||0)*f;n.x=x+n.ox;n.z=z+n.oz;n.h+=ad(a,n.h)*Math.min(1,dt*(n.ox?3:8))}}
   n.v=vt<n.v?Math.max(vt,n.v-Math.max(8,(n.v-vt)*4)*dt):n.v+(vt-n.v)*Math.min(1,dt)}
  // Un NPC desplazado puede empujar a otros (solo si lo ha golpeado el jugador)
  if(n.mode===1&&(n.vx||n.vz))for(let q=0;q<cnt;q++){const o=NPC[q];if(o===n||!o.lane)continue;const dx=o.x-n.x,dz=o.z-n.z;
   const hb=dx*dx+dz*dz<64&&boxHit(o.x,o.z,o.h,o.w||1.8,o.l,n.x,n.z,n.h,n.w||1.8,n.l);
   if(hb){const nx=hb.nx,nz=hb.nz,pen=hb.p/2;o.x+=nx*pen;o.z+=nz*pen;n.x-=nx*pen;n.z-=nz*pen;
    const [ux,uz]=npcVel(o),vn=(n.vx-ux)*nx+(n.vz-uz)*nz;
    if(vn>.5){const j=1.2*vn/(1/n.m+1/o.m);n.vx-=nx*j/n.m;n.vz-=nz*j/n.m;hitNpc(o,j/o.m,nx,nz,-(dx*Math.sin(o.h)+dz*Math.cos(o.h)));
     if(vn>3&&Math.hypot(n.x-px,n.z-pz)<60&&performance.now()-crashT>250){crashT=performance.now();thump(vn*.6)}}}}
  // Choque con el jugador: impulso según masas. El jugador pierde velocidad y se desvía un poco, sin trompo (estilo Motorfest)
  const dx=px-n.x,dz=pz-n.z,hp=dx*dx+dz*dz<64&&boxHit(px,pz,h,cur.w,cur.l,n.x,n.z,n.h,n.w||1.8,n.l);
  if(hp){const nx=hp.nx,nz=hp.nz;px+=nx*hp.p;pz+=nz*hp.p;
   const [ux,uz]=npcVel(n),vn=(vx-ux)*nx+(vz-uz)*nz;
   if(vn<-.5){const j=-1.2*vn/(1/cur.m+1/n.m),dvp=j/cur.m*.65;vx+=nx*dvp;vz+=nz*dvp;
    if(vx*Math.sin(h)+vz*Math.cos(h)>3)h+=Math.max(-.12,Math.min(.12,ad(Math.atan2(vx,vz),h)*.5));
    hitNpc(n,j/n.m*.85,-nx,-nz,dx*Math.sin(n.h)+dz*Math.cos(n.h));
    if(-vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(-vn)}
    if(!n.wreck&&Math.random()<.5)honk(n,.4)}}
  n.g.position.set(n.x,0,n.z);n.g.rotation.y=n.h}}
