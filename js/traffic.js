// Tráfico NPC (conducen por la izquierda, como en Japón): giros suaves, semáforos, límite de velocidad, ceder el paso, choques y claxon
const NPC=[],NCOL=[0xd9d9d9,0x333a45,0x9b2d2d,0x2d5a9b,0xc9c24a,0x3d7d4e,0x7a7a7a,0xffffff];
let npcLvl=MOBILE?1:2,TT=0,lastLt=-1,hornT=0;const NCNT=[0,8,20,40],NLAB=["Sin tráfico","Poco","Medio","Mucho"],LIM=13.9,RR=9,BD=3.5;
function setNpc(v){npcLvl=((v%4)+4)%4;$("trf").textContent="🚗 "+NLAB[npcLvl]}
setNpc(npcLvl);
// Semáforos
function lightSt(i,j,az){const t=(TT+((i+j)%2)*10)%20;return az?(t<8?"g":t<10?"y":"r"):(t>=10&&t<18?"g":t>=18?"y":"r")}
const LC={g:new THREE.Color(0x20e050),y:new THREE.Color(0xffc800),r:new THREE.Color(0xff2a2a)},NI=(N+1)*(N+1)*2,
 lm=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial(),NI),pl=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({color:0x555a66}),NI),lo=new THREE.Object3D();
for(let i=0;i<=N;i++)for(let j=0;j<=N;j++)for(let a=0;a<2;a++){const n=(i*(N+1)+j)*2+a,x=i*C+(a?-11:11),z=j*C+(a?11:-11);
 lo.position.set(x,5.6,z);lo.scale.set(1,1.2,1);lo.updateMatrix();lm.setMatrixAt(n,lo.matrix);lo.position.set(x,2.5,z);lo.scale.set(.4,5,.4);lo.updateMatrix();pl.setMatrixAt(n,lo.matrix)}
lm.frustumCulled=pl.frustumCulled=false;sc.add(lm,pl);
function lamps(){for(let i=0;i<=N;i++)for(let j=0;j<=N;j++){const n=(i*(N+1)+j)*2;lm.setColorAt(n,LC[lightSt(i,j,true)]);lm.setColorAt(n+1,LC[lightSt(i,j,false)])}lm.instanceColor.needsUpdate=true}
lamps();
// Coches NPC. mode: 0 conduce · 1 desplazado por un choque · 2 parado tras el choque. wreck: siniestrado, ya no vuelve a conducir
function mkNpc(){const g=new THREE.Group(),t=Math.floor(Math.random()*3),w=1.75,l=[3.6,4.3,4.8][t],bh=[.75,.6,.95][t],c=NCOL[Math.floor(Math.random()*NCOL.length)];
 const bx=(a,b,d,col,x,y,z)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(a,b,d),new THREE.MeshLambertMaterial({color:col}));m.position.set(x,y,z);g.add(m)};
 bx(w,bh,l,c,0,.3+bh/2,0);bx(w*.88,.5,l*[.55,.45,.75][t],0x1a2430,0,.3+bh+.25,l*[-.05,-.1,.05][t]);
 for(const sx of[-1,1])for(const sz of[-1,1])bx(.25,.7,.7,0x111111,sx*w/2,.35,sz*l*.32);
 return{g,x:-9999,z:-9999,h:0,th:0,v:0,vt:11+Math.random()*6,m:[1000,1300,1700][t],sl:12+l/2,hp:.85+Math.random()*.3}}
// Los NPC solo circulan por calles interiores: en las del borde uno de los carriles queda fuera del mapa
const inside=v=>v>=C-.5&&v<=W-C+.5;
function npcPlace(n){for(let t=0;t<6;t++){const a=Math.random()*PI*2,r=120+Math.random()*180,cx=px+Math.sin(a)*r,cz=pz+Math.cos(a)*r;
  if(cx<C+15||cz<C+15||cx>W-C-15||cz>W-C-15)continue;
  const kk=v=>Math.max(1,Math.min(N-1,Math.round(v/C)));
  if(Math.random()<.5){const th=Math.random()<.5?0:PI;n.x=kk(cx)*C+4.5*Math.cos(th);n.z=cz;n.th=th}
  else{const th=Math.random()<.5?PI/2:-PI/2;n.z=kk(cz)*C-4.5*Math.sin(th);n.x=cx;n.th=th}
  n.h=n.th;n.v=n.vt*.8;return}
 n.x=n.z=-9999}
function npcIt(n){const r=Math.random();n.it=r<.5?0:r<.75?1:-1}
function npcRst(n){npcIt(n);n.turn=0;n.rem=0;n.vt=10+Math.random()*(LIM-10);n.sw=0;n.ign=0;n.mode=0;n.wreck=false;n.uns=0;n.vx=n.vz=n.sp=0;n.wb=0;n.pw=0;n.stun=0}
function busyAt(cx,cz,n,cnt){if(Math.abs(px-cx)<7&&Math.abs(pz-cz)<7)return true;for(let k=0;k<cnt;k++){const o=NPC[k];if(o!==n&&Math.abs(o.x-cx)<7&&Math.abs(o.z-cz)<7)return true}return false}
const npcVel=n=>n.mode?[n.vx,n.vz]:[Math.sin(n.h)*n.v,Math.cos(n.h)*n.v];
// Claxon: como mucho uno cada 4 s en total y uno cada 10 s por coche
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
 if(kmh>=60)n.wreck=true;n.stunT=kmh>=20?3:0;n.mode=1;n.v=0;n.turn=0}
function knock(n,dt){n.x+=n.vx*dt;n.z+=n.vz*dt;n.h+=n.sp*dt;
 // Rozamiento de neumáticos: de lado frena mucho (~1 g), hacia delante algo menos (el conductor frena)
 const s=Math.hypot(n.vx,n.vz),fx=Math.sin(n.h),fz=Math.cos(n.h);let l=n.vx*fx+n.vz*fz,r=-n.vx*fz+n.vz*fx;
 const fw=n.wreck?1.3:1;l=Math.sign(l)*Math.max(0,Math.abs(l)-8*fw*dt);r=Math.sign(r)*Math.max(0,Math.abs(r)-11*fw*dt);n.vx=fx*l-fz*r;n.vz=fz*l+fx*r;
 // El giro se frena con el deslizamiento: cuando el coche casi se ha parado, deja de girar
 n.sp=Math.sign(n.sp)*Math.max(0,Math.abs(n.sp)*Math.exp(-3*dt)-2*dt)*Math.min(1,.3+s/6);
 const imp=cityHit(n);if(imp>4&&Math.hypot(n.x-px,n.z-pz)<60&&performance.now()-crashT>250){crashT=performance.now();thump(imp*.6)}
 if(s<.3&&Math.abs(n.sp)<.2){n.vx=n.vz=n.sp=0;if(!n.wreck&&n.mode===1){n.mode=2;n.stun=n.stunT}}}
const FR=new THREE.Frustum(),FM=new THREE.Matrix4(),SPH=new THREE.Sphere(new THREE.Vector3(),3);
function npcs(dt){TT+=dt;const k2=Math.floor(TT*2);if(k2!==lastLt){lastLt=k2;lamps()}
 const cnt=NCNT[npcLvl];while(NPC.length<cnt){const o=mkNpc();npcRst(o);sc.add(o.g);NPC.push(o)}
 NPC.forEach((n,k)=>{n.g.visible=k<cnt});FR.setFromProjectionMatrix(FM.multiplyMatrices(cam.projectionMatrix,cam.matrixWorldInverse));
 for(let k=0;k<cnt;k++){const n=NPC[k];
  if(Math.hypot(n.x-px,n.z-pz)>350){npcPlace(n);npcRst(n)}
  // Siniestrado: desaparece tras 20 s sin verlo
  if(n.wreck){SPH.center.set(n.x,1,n.z);const seen=Math.hypot(n.x-px,n.z-pz)<200&&FR.intersectsSphere(SPH);n.uns=seen?0:n.uns+dt;if(n.uns>20){npcPlace(n);npcRst(n)}}
  if(n.mode===1)knock(n,dt);
  else if(n.mode===2){n.stun-=dt;if(n.stun<=0){n.mode=0;n.th=Math.round(n.h/(PI/2))*(PI/2);npcIt(n);n.v=0}}
  else{const fx=Math.sin(n.h),fz=Math.cos(n.h);let vt=n.vt,fin=false,blk=null,stop=false,room=0;
  const chk=(ox,oz,ov,o)=>{const dx=ox-n.x,dz=oz-n.z,f=dx*fx+dz*fz,s=Math.abs(dx*fz-dz*fx);if(f>0&&f<16&&s<3){const lim=f<6?0:ov+(f-6)*.8;if(lim<vt){vt=lim;blk=o}}};
  chk(px,pz,Math.hypot(vx,vz),"P");for(let q=0;q<cnt;q++)if(q!==k)chk(NPC[q].x,NPC[q].z,NPC[q].mode?0:NPC[q].v,NPC[q]);
  // Atascado detrás de un coche accidentado: da la vuelta
  n.wb=blk&&blk!=="P"&&blk.mode&&n.v<.5?n.wb+dt:0;if(n.wb>4){n.th+=PI;n.it=0;n.wb=0}
  // Claxon si el jugador le corta el paso o le bloquea un rato
  if(blk==="P"){if(n.v>6&&n.v-vt>4)honk(n);n.pw=n.v<.3?n.pw+dt:0;if(n.pw>4){honk(n);n.pw=0}}else n.pw=0;
  let alZ=Math.abs(Math.cos(n.th))>.5;const a0=alZ?n.z:n.x;
  if(n.turn){vt=Math.min(vt,6);const st=Math.min(n.rem,n.v/RR*dt);n.h+=Math.sign(n.turn)*st;n.rem-=st;
   if(n.rem<=.001){n.th+=n.turn*PI/2;n.h=n.th;n.turn=0;npcIt(n);fin=true}}
  else{const sg=alZ?Math.sign(Math.cos(n.th)):Math.sign(Math.sin(n.th)),lc=sg>0?Math.ceil(a0/C)*C:Math.floor(a0/C)*C,d=(lc-a0)*sg,
   cx=alZ?Math.round(n.x/C)*C:lc,cz=alZ?lc:Math.round(n.z/C)*C;
   if(n.ign>0)n.ign-=dt;
   // Línea de parada a 12 m del centro del cruce: frenada progresiva para quedarse con el morro detrás
   room=d-n.sl;if(d<60&&room>-2){const st=lightSt(Math.round(cx/C),Math.round(cz/C),alZ);
    if(st==="r"||(st==="y"&&room>n.v*n.v/12)||(n.ign<=0&&busyAt(cx,cz,n,cnt))){stop=true;vt=Math.min(vt,room>0?Math.sqrt(2*BD*room):0)}}
   if(n.it&&d<30)vt=Math.min(vt,7);
   // Si seguir recto o girar lleva a una calle del borde, elige otra opción válida
   if(d<45){const okT=s=>{const t2=n.th+s*PI/2;return inside(cx+Math.sin(t2)*C)&&inside(cz+Math.cos(t2)*C)},okS=inside(lc+sg*C);
    if(!n.it&&!okS)n.it=Math.random()<.5?1:-1;if(n.it&&!okT(n.it))n.it=okT(-n.it)?-n.it:okS?0:n.it}
   if(n.it&&!stop&&d<=(n.it>0?RR+4.5:RR-4.5)){n.turn=n.it;n.rem=PI/2}}
  n.sw=n.v<.3?n.sw+dt:0;if(n.sw>10){n.ign=5;n.sw=0}
  n.v=vt<n.v?Math.max(vt,n.v-Math.max(8,(n.v-vt)*4)*dt):n.v+(vt-n.v)*Math.min(1,dt);
  const ox=n.x,oz=n.z;n.x+=fx*n.v*dt;n.z+=fz*n.v*dt;
  if(!n.turn&&!fin){if(alZ)n.x+=(Math.round(n.x/C)*C+4.5*Math.cos(n.th)-n.x)*Math.min(1,dt*2);else n.z+=(Math.round(n.z/C)*C-4.5*Math.sin(n.th)-n.z)*Math.min(1,dt*2);
   const b0=alZ?oz:ox,b1=alZ?n.z:n.x;if(Math.floor(b0/C)!==Math.floor(b1/C))npcIt(n);
   n.h+=ad(n.th,n.h)*Math.min(1,dt*6)}
  if(n.x<5||n.x>W-5||n.z<5||n.z>W-5){npcPlace(n);npcRst(n)}}
  // Un NPC desplazado puede empujar a otros (solo si lo ha golpeado el jugador)
  if(n.mode===1&&(n.vx||n.vz))for(let q=0;q<cnt;q++){const o=NPC[q];if(o===n)continue;const dx=o.x-n.x,dz=o.z-n.z,d=Math.hypot(dx,dz);
   if(d<3.6&&d>.01){const nx=dx/d,nz=dz/d,pen=(3.6-d)/2;o.x+=nx*pen;o.z+=nz*pen;n.x-=nx*pen;n.z-=nz*pen;
    const [ux,uz]=npcVel(o),vn=(n.vx-ux)*nx+(n.vz-uz)*nz;
    if(vn>.5){const j=1.2*vn/(1/n.m+1/o.m);n.vx-=nx*j/n.m;n.vz-=nz*j/n.m;hitNpc(o,j/o.m,nx,nz,-(dx*Math.sin(o.h)+dz*Math.cos(o.h)));
     if(vn>3&&Math.hypot(n.x-px,n.z-pz)<60&&performance.now()-crashT>250){crashT=performance.now();thump(vn*.6)}}}}
  // Choque con el jugador: impulso según masas. El jugador pierde algo de velocidad y se desvía un poco, sin trompo (estilo Motorfest)
  const dx=px-n.x,dz=pz-n.z,d2=Math.hypot(dx,dz);
  if(d2<3.8&&d2>.01){const nx=dx/d2,nz=dz/d2;px+=nx*(3.8-d2);pz+=nz*(3.8-d2);
   const [ux,uz]=npcVel(n),vn=(vx-ux)*nx+(vz-uz)*nz;
   if(vn<-.5){const j=-1.2*vn/(1/cur.m+1/n.m),dvp=j/cur.m*.65;vx+=nx*dvp;vz+=nz*dvp;
    if(vx*Math.sin(h)+vz*Math.cos(h)>3)h+=Math.max(-.12,Math.min(.12,ad(Math.atan2(vx,vz),h)*.5));
    hitNpc(n,j/n.m*.85,-nx,-nz,dx*Math.sin(n.h)+dz*Math.cos(n.h));
    if(-vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(-vn)}
    if(!n.wreck&&Math.random()<.5)honk(n,.4)}}
  n.g.position.set(n.x,0,n.z);n.g.rotation.y=n.h}}
