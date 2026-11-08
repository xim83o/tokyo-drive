// Carreras (circuitos con vueltas) y contrarreloj (de un punto a otro) por las calles reales, con puntos de control y mejor tiempo guardado;
// coche fantasma de cualquiera de tus tiempos guardados (se elige en el menú y se enciende o apaga con la tecla G); repetición de los
// últimos 20 s al acabar una carrera; y modo foto (cámara libre alrededor del coche y guardar la imagen)
// Recorridos trazados a mano por avenidas: w son puntos de paso seguidos (en coordenadas del plano ×1,5) y entre dos puntos la ruta va por la calle grande que los une.
// Para cambiar una carrera basta con mover sus puntos (ver los planos en la carpeta planos/)
const RWP=a=>a.map(([x,z])=>[x*1.5,z*1.5]);
const RTS=[{id:"torre4",n:"Circuito de la Torre",tipo:"Carrera",laps:3,loop:true,w:RWP([[910,835],[1000,850],[1093,880],[1100,800],[1115,728],[1010,700],[930,712],[893,812]])},
 {id:"canal3",n:"Circuito del Canal",tipo:"Carrera",laps:1,loop:true,w:RWP([[300,975],[600,1050],[780,1065],[1000,1120],[1068,1100],[1100,850],[1115,728],[1010,705],[900,800],[815,1040],[782,1180],[780,1285],[500,1265],[285,1245],[290,1100]])},
 {id:"kuro4",n:"Concesionario → Kurogane",tipo:"Contrarreloj",laps:1,w:RWP([[810,485],[900,545],[1040,575],[1030,640],[1010,700],[930,712],[900,800],[850,930],[815,1040],[880,1095],[935,1115]])},   // (sin giros de más de 110°)
 {id:"beis3",n:"Béisbol → Zona de derrape",tipo:"Contrarreloj",laps:1,w:RWP([[745,555],[652,705],[700,880],[780,1060],[1000,1120],[1068,1100],[1095,880],[1100,840]])},
 {id:"cruce3",n:"Cruce de Tokio",tipo:"Contrarreloj",laps:1,w:RWP([[60,470],[340,605],[600,730],[652,705],[730,712],[880,800],[960,840],[1090,856],[1090,905],[1300,930],[1480,960]])}];
const RACE={on:false,rt:null,cp:0,t:0,cd:0,rec:[],split:[],ghost:null,gOn:true,recT:0};
const RDT=.05,CPD=400;
const rStore=()=>{try{return JSON.parse(localStorage.getItem("td-race")||"{}")}catch(e){return{}}},rSave=s=>{try{localStorage.setItem("td-race",JSON.stringify(s))}catch(e){}};
const fmtT=t=>{const m=Math.floor(t/60),s=t-m*60;return m+":"+(s<10?"0":"")+s.toFixed(3)};
// --- Rutas: camino más corto por el grafo de calles, prefiriendo las avenidas ---
let RG=null;
function raceGraph(){if(RG)return RG;RG=new Map();const nd=(id,x,z)=>{let n=RG.get(id);if(!n){n={id,x,z,e:[],t:9};RG.set(id,n)}return n},TC=[1,1,1.2,2,12];
 MAP.roads.forEach(r=>{if(!r.n)return;for(let i=1;i<r.n.length;i++){const a=nd(r.n[i-1],r.p[i*2-2],r.p[i*2-1]),b=nd(r.n[i],r.p[i*2],r.p[i*2+1]),l=Math.hypot(a.x-b.x,a.z-b.z),c=l*TC[r.t];a.t=Math.min(a.t,r.t);b.t=Math.min(b.t,r.t);a.e.push([b,c]);b.e.push([a,c*(r.o?8:1)])}});return RG}   // (callejas casi prohibidas; contramano en sentido único, muy cara)
function rNear(x,z){let b=null,bd=1e18;for(const n of raceGraph().values()){if(!n.e.length)continue;const d=(n.x-x)**2+(n.z-z)**2;if(d<bd){bd=d;b=n}}return b}
// Camino más barato desde a hasta el mejor candidato de bs (nodos de avenida a menos de 40 m del punto de paso: así no se va a una calleja ni a la calzada contraria)
function rPathC(a,bs,used){let best=null,bv=1e18;const dist=new Map([[a,0]]),prev=new Map(),H=[[0,a]],up=()=>{let i=H.length-1;while(i){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p}},
  dn=()=>{let i=0;for(;;){let m=i;for(const c of[2*i+1,2*i+2])if(c<H.length&&H[c][0]<H[m][0])m=c;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m}};
 while(H.length){const[d,n]=H[0],l=H.pop();if(H.length){H[0]=l;dn()}if(d>bv)break;if(d>dist.get(n))continue;const k=bs.get(n);if(k!==undefined&&n!==a&&d+k<bv){bv=d+k;best=n}for(const[m,c]of n.e){const nc=d+c*(used.has(n.id+"_"+m.id)?6:1);if(nc<(dist.has(m)?dist.get(m):1e18)){dist.set(m,nc);prev.set(m,n);H.push([nc,m]);up()}}}
 if(!best)return null;const P=[best];for(let n=best;n!==a;){n=prev.get(n);P.unshift(n)}for(let i=1;i<P.length;i++){used.add(P[i-1].id+"_"+P[i].id);used.add(P[i].id+"_"+P[i-1].id)}return P}
function rCand(x,z){const m=new Map();for(const n of raceGraph().values()){if(!n.e.length||n.t>3)continue;const d=Math.hypot(n.x-x,n.z-z);if(d<40)m.set(n,d*3)}if(!m.size){const n=rNear(x,z);m.set(n,0)}return m}
function rPath(a,b,used){const dist=new Map([[a,0]]),prev=new Map(),H=[[0,a]],up=()=>{let i=H.length-1;while(i){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p}},
  dn=()=>{let i=0;for(;;){let m=i;for(const c of[2*i+1,2*i+2])if(c<H.length&&H[c][0]<H[m][0])m=c;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m}};
 while(H.length){const[d,n]=H[0],l=H.pop();if(H.length){H[0]=l;dn()}if(n===b)break;if(d>dist.get(n))continue;for(const[m,c]of n.e){const nc=d+c*(used.has(n.id+"_"+m.id)?6:1);if(nc<(dist.has(m)?dist.get(m):1e18)){dist.set(m,nc);prev.set(m,n);H.push([nc,m]);up()}}}
 if(!prev.has(b))return null;const P=[b];for(let n=b;n!==a;){n=prev.get(n);P.unshift(n)}for(let i=1;i<P.length;i++){used.add(P[i-1].id+"_"+P[i].id);used.add(P[i].id+"_"+P[i-1].id)}return P}
function rBuild(R){if(R.pts)return R;const C=rCand(R.w[0][0],R.w[0][1]);let a=null,bv=1e18;for(const[n,v]of C)if(v<bv){bv=v;a=n}const used=new Set();let P=[a];
 for(let i=1;i<=R.w.length-(R.loop?0:1);i++){const bs=i<R.w.length?rCand(R.w[i][0],R.w[i][1]):new Map([[P[0],0]]),q=rPathC(P[P.length-1],bs,used);if(!q)return null;P=P.concat(q.slice(1))}
 // Sin picos de ir y volver (A→B→A)
 for(let k=0;k<3;k++)for(let i=1;i<P.length-1;i++)if(P[i-1]===P[i+1]){P.splice(i,2);i=Math.max(0,i-2)}
 // (en los circuitos, también el pico que puede quedar justo en la salida, al cerrar la vuelta)
 if(R.loop)while(P.length>4&&P[1]===P[P.length-2]){P.shift();P.pop()}
 R.pts=P.map(n=>[n.x,n.z]);const JN=P.filter(n=>new Set(n.e.map(e=>e[0])).size>=3);const S=[0];for(let i=1;i<R.pts.length;i++)S.push(S[i-1]+Math.hypot(R.pts[i][0]-R.pts[i-1][0],R.pts[i][1]-R.pts[i-1][1]));const D=S[S.length-1],cps=[];
 const at=s=>{s=Math.max(0,Math.min(D,s));let i=1;while(i<S.length-1&&S[i]<s)i++;const f=(s-S[i-1])/((S[i]-S[i-1])||1),[a,b]=R.pts[i-1],[c,d]=R.pts[i];return{x:a+(c-a)*f,z:b+(d-b)*f,i}};
 // Los puntos de control van en un tramo recto (se busca hasta 80 m antes o después) y orientados con la calle, para que los banderines queden de frente
 const ok=(s,lim,jd)=>{const a=at(s-lim),b=at(s),c=at(s+lim);return Math.abs(ad(Math.atan2(b.x-a.x,b.z-a.z),Math.atan2(c.x-b.x,c.z-b.z)))<.12&&!JN.some(n=>Math.hypot(n.x-b.x,n.z-b.z)<jd)?[a,b,c]:null};
 for(let s=CPD;D-s>=150;s+=CPD){let u=null;for(const[lim,jd]of[[40,30],[30,22],[22,14]]){for(let o=0;o<=160&&!u;o+=10)u=ok(s+o,lim,jd)||(o?ok(s-o,lim,jd):null);if(u)break}if(!u)u=[at(s-22),at(s),at(s+22)];const[a,b,c]=u,l=Math.hypot(c.x-a.x,c.z-a.z)||1;cps.push({x:b.x,z:b.z,dx:(c.x-a.x)/l,dz:(c.z-a.z)/l,i:b.i})}
 R.len=D;{const a=at(D-30),b=at(D),l=Math.hypot(b.x-a.x,b.z-a.z)||1;cps.push({x:b.x,z:b.z,dx:(b.x-a.x)/l,dz:(b.z-a.z)/l,end:true,i:R.pts.length-1})}R.cps=cps;R.S=S;R.at=at;R.hw=R.pts.map((p,i)=>{if(!i)return 6.5;const q=R.pts[i-1];return rHW((p[0]+q[0])/2,(p[1]+q[1])/2)+2.5});return R}
// --- Banderines de los puntos de control: dos a cada lado de la calle, altos y luminosos, se ven desde lejos. El siguiente punto va resaltado y con un haz de luz; la meta, a cuadros ---
let GTS=[],GTM=null;
function gateMats(){if(GTM)return GTM;const b=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,fog:o<1,depthWrite:o>=1}),chk=canvasTex(128,32,(g)=>{for(let i=0;i<16;i++)for(let j=0;j<4;j++){g.fillStyle=(i+j)%2?"#111":"#fff";g.fillRect(i*8,j*8,8,8)}},true);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,160,10,1,true).translate(0,80,0),new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,opacity:.28,fog:false,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));beam.visible=false;sc.add(beam);
 chk.repeat.set(.44,5);const fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(0,6.4);fs.quadraticCurveTo(1.5,6.9,2.2,5.4);fs.quadraticCurveTo(2.5,2.6,0,0);
 // Tela del banderín: franja oscura con «東京», flechas hacia delante y remate a rayas. Los del lado izquierdo van reflejados para que el texto se lea siempre bien
 const mk=s=>{const g=new THREE.ShapeGeometry(fs,8),P=g.attributes.position,U=g.attributes.uv;for(let i=0;i<P.count;i++){const x=P.getX(i),y=P.getY(i);P.setX(i,x*s);U.setXY(i,s>0?1-x/2.5:x/2.5,y/6.9)}return g};
 const tx=canvasTex(128,352,g=>{g.fillStyle="#fff";g.fillRect(0,0,128,352);g.fillStyle="#17181f";g.fillRect(0,26,128,134);g.fillStyle="#fff";g.font="bold 54px sans-serif";g.textAlign="center";g.fillText("東",62,84);g.fillText("京",62,144);g.fillStyle="#17181f";for(const y of[182,216,250]){g.beginPath();g.moveTo(26,y);g.lineTo(64,y+24);g.lineTo(102,y);g.lineTo(102,y+14);g.lineTo(64,y+38);g.lineTo(26,y+14);g.closePath();g.fill()}for(let y=306;y<352;y+=16)g.fillRect(0,y,128,8)});
 GTM={fgR:mk(1),fgL:mk(-1),tg:new THREE.ConeGeometry(.24,.6,3).rotateX(PI),ts:new THREE.SphereGeometry(.22,10,8),tb:new THREE.CylinderGeometry(.5,.7,.2,10),next:b(0xffb000,1),far:b(0xff5a2a,.45),fin:new THREE.MeshBasicMaterial({map:chk,side:THREE.DoubleSide,fog:false}),beam,pg:new THREE.CylinderGeometry(.08,.11,7.6,6).translate(0,3.8,0),hl:new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,opacity:.5,fog:false,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide})};GTM.next.side=GTM.far.side=THREE.DoubleSide;GTM.tn=GTM.next.clone();GTM.tf=GTM.far.clone();GTM.tn.map=GTM.tf.map=tx;return GTM}
const rHW=(x,z)=>{let m=4;for(const k of gq(x,z).r){const o=k*6;if(segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3])<(RSG[o+4]+2)**2)m=Math.max(m,RSG[o+4])}return m};
function gatesClear(){for(const q of GTS)sc.remove(q.G);GTS=[];for(const g of LEDS)sc.remove(g);LEDS=[];if(GTM)GTM.beam.visible=false;if(RA)RA.visible=false}
// Dirección de la calle real en un punto (el tramo de calle más cercano), para que los banderines queden siempre de frente
function rRoad(x,z){let b=null,bd=1e18;for(const k of gq(x,z).r){const o=k*6,d=segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3]);if(d<bd){bd=d;b=o}}if(b===null)return null;const dx=RSG[b+2]-RSG[b],dz=RSG[b+3]-RSG[b+1],l=Math.hypot(dx,dz)||1;return{dx:dx/l,dz:dz/l}}
function gatesBuild(R){gatesClear();const M=gateMats();ledBuild(R);R.cps.forEach((c,i)=>{const rr=rRoad(c.x,c.z);if(rr){const s=rr.dx*c.dx+rr.dz*c.dz<0?-1:1;c.dx=rr.dx*s;c.dz=rr.dz*s}const hw=rHW(c.x,c.z)+1.2,G=new THREE.Group(),P=[],F=[],H=[],C=[],add=(g,x,y,z)=>{const m=new THREE.Mesh(g,M.far);m.position.set(x,y,z);G.add(m);P.push(m)};
  for(const s of[-1,1]){const fg=s>0?M.fgR:M.fgL;for(const z of[-3,3]){add(M.pg,s*hw,0,z);add(M.ts,s*hw,7.7,z);add(M.tb,s*hw,.1,z);const B=new THREE.Mesh(fg,c.end?M.fin:M.tf);B.position.set(s*hw,1,z);B.userData.a=0;if(!c.end)C.push(B);F.push(B);G.add(B);const A=new THREE.Mesh(fg,M.hl);A.scale.set(1.3,1.12,1);A.position.set(-.3*s,-.38,-.03);B.add(A);H.push(A)}
   for(let t=1;t<=5;t++)add(M.tg,s*hw,7.45-Math.sin(PI*t/6)*.7,t-3)}   // (guirnalda de banderitas entre los dos mástiles)
  G.position.set(c.x,0,c.z);G.rotation.y=Math.atan2(c.dx,c.dz);G.visible=false;sc.add(G);c.r=Math.max(hw+4,26);GTS.push({G,P,F,H,C})})}   // (radio amplio: en avenidas con dos calzadas también cuenta si vas por la otra)
// Los banderines ondean un poco y el resplandor del siguiente punto late
function gatesWave(){const t=performance.now()/1000;ledTick(t);GTM.hl.opacity=.42+Math.sin(t*4)*.16;for(const q of GTS)if(q.G.visible)q.F.forEach((B,i)=>B.rotation.y=B.userData.a+Math.sin(t*2.4+i*1.3)*.2)}
function rPlace(){const R=RACE.rt,n=R.cps.length,k=RACE.cp%n,tot=n*R.laps;GTS.forEach((q,i)=>{const d=(i-k+n)%n;q.G.visible=d<2&&RACE.cp+d<tot;for(const m of q.P)m.material=d===0?GTM.next:GTM.far;for(const m of q.C)m.material=d===0?GTM.tn:GTM.tf;for(const m of q.H)m.visible=d===0});const c=R.cps[k];GTM.beam.position.set(c.x,0,c.z);GTM.beam.visible=true}
// ¿Va por la ruta? Se mira el tramo entre el último punto de control y el siguiente (no vale atajar a otra parte del recorrido ni subir a la autopista)
function rOnRoute(){return!HWL.on&&RF.d<28}
// Por dónde va el coche en la ruta: se avanza tramo a tramo desde la última posición, solo a tramos contiguos que estén más cerca. Así, si la ruta pasa dos veces por la misma
// calle o junto a un punto de control antes de llegar a él, no se confunde de tramo. RACE.pi=0: posición desconocida, se busca en toda la ruta
const RF={i:1,x:0,z:0,d:0};
function rFind(){const R=RACE.rt,N=R.pts.length-1,S=R.S;let bd=1e18;const t=i=>{const[a,b]=R.pts[i-1],[c,d]=R.pts[i],q=segD2(px,pz,a,b,c,d);if(q<bd){bd=q;RF.i=i;RF.x=_cx;RF.z=_cz}};
 if(!RACE.pi)for(let i=1;i<=N;i++)t(i);else{const D=k=>{const[a,b]=R.pts[k-1],[c,d]=R.pts[k];return segD2(px,pz,a,b,c,d)},W=(k,s)=>{const q=k+s;return q>N?(R.loop?q-N:0):q<1?(R.loop?q+N:0):q};let i=RACE.pi;
  for(let g=0;g<40;g++){let b=0,bv=D(i)-.001;for(const s of[1,2,3,-1,-2]){const k=W(i,s);if(k){const v=D(k);if(v<bv){bv=v;b=k}}}if(!b)break;i=b}t(i)}
 RF.d=Math.sqrt(bd);RACE.pi=RF.i}
// Barrera invisible, solo para el jugador: no deja salir de la calle de la ruta (calzada y un poco de acera) y funciona como un muro. El tráfico no la nota
function rBarrier(){if(HWL.on)return;const d=RF.d,lim=RACE.rt.hw[RF.i];if(d<=lim||d>=28)return;const nx=(px-RF.x)/d,nz=(pz-RF.z)/d;px=RF.x+nx*lim;pz=RF.z+nz*lim;const vn=vx*nx+vz*nz;if(vn>0){vx-=vn*nx;vz-=vn*nz;if(vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(vn)}}}
// Flechas azules pintadas en la calzada, solo antes de cada giro: una fila de 7 que se va torciendo y apartando hacia el lado del giro y acaba antes del cruce
// (en las rectas no hay). Los giros se buscan al construir la ruta (rTurns)
const RAS=9,RAN=22;let RA=null;const RAD=new THREE.Object3D();
function rTurns(R){const D=R.S[R.S.length-1],T=[],hd=(p,q)=>Math.atan2(q.x-p.x,q.z-p.z);let best=null;
 for(let s=8;s<D-8;s+=4){const a=R.at(s-22),b=R.at(s),c=R.at(s+22),d=ad(hd(b,c),hd(a,b));if(Math.abs(d)>.6){if(!best||Math.abs(d)>Math.abs(best.d))best={s,d}}else if(best){T.push(best);best=null}}if(best)T.push(best);R.turns=T}
function rArrows(){const R=RACE.rt;if(!R.turns)rTurns(R);if(!RA){const s=new THREE.Shape();s.moveTo(0,1.6);s.lineTo(1.35,-1.6);s.lineTo(0,-.6);s.lineTo(-1.35,-1.6);s.closePath();RA=new THREE.InstancedMesh(new THREE.ShapeGeometry(s).rotateX(PI/2),new THREE.MeshBasicMaterial({color:0x2a8cf0,transparent:true,opacity:.92,depthWrite:false,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}),RAN);RA.frustumCulled=false;sc.add(RA)}
 if(ENV.rcArr===0){RA.visible=false;return}
 const S=R.S,D=S[S.length-1],n=R.cps.length,q=R.pts[RF.i-1],L=S[RF.i-1]+Math.hypot(RF.x-q[0],RF.z-q[1]),last=!R.loop||(Math.floor(RACE.cp/n)>=R.laps-1&&RACE.cp%n>=2),s0=(Math.floor(L/RAS)+1)*RAS;let c=0;
 for(let k=0;k<RAN;k++){let s=s0+k*RAS;if(s>=D){if(last)break;s-=D}let ang=0,f=0,skip=false;for(const t of R.turns){const ds=t.s-s;if(Math.abs(ds)<10){skip=true;break}if(ds>0&&ds<60){ang=Math.max(-1.1,Math.min(1.1,t.d));f=1-ds/60;break}}if(skip)continue;
  const a=R.at(s-4),b=R.at(s),e=R.at(s+4),h0=Math.atan2(e.x-a.x,e.z-a.z),off=Math.sign(ang)*1.6*f*f;RAD.position.set(b.x+Math.cos(h0)*off,.06,b.z-Math.sin(h0)*off);RAD.rotation.set(0,h0+ang*.85*f,0);RAD.updateMatrix();RA.setMatrixAt(c++,RAD.matrix)}
 RA.count=c;RA.instanceMatrix.needsUpdate=true;RA.visible=c>0}
// --- Flechas LED de los giros (solo en carrera): A, panel de chevrones ámbar sobre postes donde hay sitio, con la ola de luces que empieza en el lado
// contrario al giro; C, flecha de neón cian pegada a la pared del edificio que queda de frente cuando no cabe el panel (calles estrechas) ---
let LEDS=[],LEDT=null;
function ledTex(){if(LEDT)return LEDT;const mk=(dir)=>{const cv=document.createElement("canvas");cv.width=256;cv.height=80;const t=new THREE.CanvasTexture(cv);t.dir=dir;return t};
 const neon=(dir)=>canvasTex(256,110,g=>{g.clearRect(0,0,256,110);g.fillStyle="rgba(6,8,12,.85)";g.fillRect(4,4,248,102);g.save();if(dir<0){g.translate(256,0);g.scale(-1,1)}g.strokeStyle="#2ee6ff";g.lineJoin="round";g.shadowColor="#2ee6ff";
  for(const[w,b]of[[16,18],[6,0]]){g.lineWidth=w;g.shadowBlur=b;g.globalAlpha=w>10?.35:1;g.beginPath();g.moveTo(30,42);g.lineTo(150,42);g.lineTo(150,20);g.lineTo(225,55);g.lineTo(150,90);g.lineTo(150,68);g.lineTo(30,68);g.closePath();g.stroke()}g.restore()});
 LEDT={a:{"1":mk(1),"-1":mk(-1)},c:{"1":neon(1),"-1":neon(-1)},f:-1};ledDraw(0);return LEDT}
// Panel A: 3 chevrones de puntos; se enciende uno cada vez, del lado contrario al giro hacia donde apunta
function ledDraw(fr){for(const dir of[1,-1]){const t=LEDT.a[dir],g=t.image.getContext("2d");g.fillStyle="#0b0b0f";g.fillRect(0,0,256,80);const lit=dir>0?fr:2-fr;
  for(let k=0;k<3;k++)for(let y=0;y<7;y++)for(let x=0;x<8;x++){const cy=Math.abs(y-3),xx=dir>0?x:7-x,on=xx-cy>=1&&xx-cy<=3;if(!on)continue;const L=k===lit;g.fillStyle=L?"#ffb000":"#3a2608";g.shadowColor="#ffb000";g.shadowBlur=L?8:0;g.beginPath();g.arc(16+k*84+x*8.4,13+y*9,3.4,0,7);g.fill()}t.needsUpdate=true}}
function ledTick(t){if(!LEDS.length||!LEDT)return;const fr=Math.floor(t*6)%3;if(fr!==LEDT.f){LEDT.f=fr;ledDraw(fr)}for(const m of[LEDT.cm,LEDT.cm2])if(m)m.opacity=.75+Math.sin(t*5)*.25}
function ledBuild(R){if(!R.turns)rTurns(R);const T2=ledTex(),post=new THREE.MeshLambertMaterial({color:0x2a2c30}),pg=new THREE.CylinderGeometry(.08,.1,3.2,6).translate(0,1.6,0),bk=new THREE.MeshLambertMaterial({color:0x111216});
 if(!T2.cm)T2.cm=new THREE.MeshBasicMaterial({map:T2.c["1"],transparent:true,depthWrite:false});
 for(const t of R.turns){if(Math.abs(t.d)<.75)continue;const a=R.at(t.s-30),b=R.at(t.s),h=Math.atan2(b.x-a.x,b.z-a.z),fx=Math.sin(h),fz=Math.cos(h),hw=rHW(b.x,b.z),dir=t.d>0?-1:1;
  // Sitio para el panel A: en la esquina de fuera del giro, pasado el cruce, fuera de la calzada y sin edificio encima
  const ox=t.d>0?-Math.cos(h):Math.cos(h),oz=t.d>0?Math.sin(h):-Math.sin(h),G=new THREE.Group(),free=(x,z)=>roadAt(x,z)<0&&!inBuilding(x,z)&&!inBuilding(x+fz*2.7,z-fx*2.7)&&!inBuilding(x-fz*2.7,z+fx*2.7);let A=null;
  for(const fw of[hw+3,hw+6,hw+10,hw+14])for(const sd of[0,hw*.5+2,hw+3]){const x=b.x+fx*fw+ox*sd,z=b.z+fz*fw+oz*sd;if(!A&&free(x,z))A=[x,z]}
  let W=null;if(!A)for(const sd of[0,hw*.6,-hw*.6]){for(let d=hw+1;d<=45;d+=1){const x=b.x+fx*d+ox*sd,z=b.z+fz*d+oz*sd;if(inBuilding(x,z)){if(!W||d<W[2])W=[x-fx*.4,z-fz*.4,d];break}}}
  if(A){for(const s of[-2,2]){const p=new THREE.Mesh(pg,post);p.position.set(s,0,0);G.add(p)}const back=new THREE.Mesh(new THREE.BoxGeometry(5.2,1.8,.14),bk);back.position.set(0,3.6,-.09);G.add(back);
   const pn=new THREE.Mesh(new THREE.PlaneGeometry(5,1.56),new THREE.MeshBasicMaterial({map:T2.a[dir]}));pn.position.set(0,3.6,0);G.add(pn);G.position.set(A[0],0,A[1])}
  else if(W){const m=dir>0?T2.cm:(T2.cm2||(T2.cm2=T2.cm.clone()));m.map=T2.c[dir];const pn=new THREE.Mesh(new THREE.PlaneGeometry(4.2,1.8),m);pn.position.set(0,5,0);G.add(pn);G.position.set(W[0],0,W[1])}
  else continue;G.rotation.y=h+PI;sc.add(G);LEDS.push(G)}}
// Fuera de la ruta o tras saltarse un arco: al acabarse los 5 s, vuelve al último punto por el que pasó (el tiempo sigue corriendo)
function rBack(){const R=RACE.rt,n=R.cps.length,k=RACE.cp%n,q=R.cps[k];let x=RACE.sx,z=RACE.sz,hd=RACE.sh;if(RACE.cp>0){const o=R.cps[(RACE.cp-1)%n];x=o.x;z=o.z;hd=Math.atan2(o.dx,o.dz)}RACE.pi=RACE.cp>0?R.cps[(RACE.cp-1)%n].i:0;spawnAt({x,z,h:hd});RACE.off=null;RACE.safe=1.5}
function raceQuit(){raceAbort();if(state==="set")closeSettings();rQuitMp()}
// Reiniciar: la misma carrera desde la salida, con el mismo fantasma (no en las carreras de sala, que van todos a la vez)
function raceRestart(){if(!RACE.on||ONL.mp)return;const R=RACE.rt,gi=RACE.gi;raceAbort();$("setP").hidden=true;raceStart(R,gi)}
// --- Coche fantasma: copia translúcida de tu coche ---
let GHC=null;
function ghostCar(){if(GHC){sc.remove(GHC)}GHC=car.clone(true);const m=new THREE.MeshBasicMaterial({color:0x66ccff,transparent:true,opacity:.35,depthWrite:false});if(intG){const i=car.children.indexOf(intG);if(i>=0)GHC.remove(GHC.children[i])}
 GHC.traverse(o=>{o.visible=true;if(o.isMesh){o.material=m;o.castShadow=false}});GHC.visible=false;sc.add(GHC)}
function ghostAt(t){const g=RACE.ghost;if(!g||!GHC)return;const s=g.s,n=s.length/3,f=t/g.dt,i=Math.floor(f);if(i>=n-1||!RACE.gOn){GHC.visible=false;return}const k=f-i,a=i*3,b=a+3,x=s[a]+(s[b]-s[a])*k,z=s[a+1]+(s[b+1]-s[a+1])*k,c=s[a+2];let d=s[b+2]-c;d=Math.atan2(Math.sin(d),Math.cos(d));GHC.position.set(x,0,z);GHC.rotation.set(0,c+d*k,0);GHC.visible=true}
function ghostToggle(){RACE.gOn=!RACE.gOn;if(GHC&&!RACE.gOn)GHC.visible=false;if(RACE.on)rHud()}
// --- Marcador ---
function rHud(){const R=RACE.rt,n=R.cps.length,tot=n*R.laps,lap=Math.min(R.laps,Math.floor(RACE.cp/n)+1);$("rcCp").textContent=`${T("Punto")} ${Math.min(RACE.cp,tot)}/${tot}`+(R.laps>1?` · ${T("Vuelta")} ${lap}/${R.laps}`:"");$("rcGh").textContent=RACE.ghost?(RACE.gOn?"👻 ✓":"👻 ✕"):""}
// Pantalla antes de salir: tráfico de la carrera y fantasma. Recuerda lo último elegido y se puede desactivar (ENV.rcSkip); el tráfico vuelve al de antes al acabar
if(ENV.rcT===undefined)ENV.rcT=2;
function raceSetup(R,gi){const P=$("raceP"),runs=(rStore()[R.id]||{runs:[]}).runs;P.innerHTML="";const h1=document.createElement("h1");h1.textContent=T(R.n);P.appendChild(h1);
 const r=document.createElement("div");r.className="opt";r.innerHTML=`<span>${T("Tráfico")}</span>`;NLAB.forEach((t,i)=>{const b=document.createElement("button");b.textContent=T(t);b.className=ENV.rcT===i?"on":"";b.onclick=()=>{ENV.rcT=i;saveEnv();for(const x of r.querySelectorAll("button"))x.className="";b.className="on"};r.appendChild(b)});P.appendChild(r);
 // Estación del año solo para la carrera (al acabar vuelve la de antes)
 {if(ENV.rcS===undefined)ENV.rcS="keep";const s=document.createElement("div");s.className="opt";s.style.marginTop="10px";s.innerHTML=`<span>${T("Estación")}</span>`;[["keep","La de ahora"],[0,"Primavera"],[1,"Verano"],[2,"Otoño"],[3,"Invierno"]].forEach(([v,t])=>{const b=document.createElement("button");b.textContent=T(t);b.className=String(ENV.rcS)===String(v)?"on":"";b.onclick=()=>{ENV.rcS=v;saveEnv();for(const x of s.querySelectorAll("button"))x.className="";b.className="on"};s.appendChild(b)});P.appendChild(s)}
 const q=document.createElement("div");q.className="opt";q.style.marginTop="10px";q.innerHTML=`<span>${T("Fantasma")}</span>`;const sel=rGhostSel(runs);sel.value=gi;q.appendChild(sel);P.appendChild(q);
 // Flechas azules en la calzada: sí o no
 {if(ENV.rcArr===undefined)ENV.rcArr=1;const s=document.createElement("div");s.className="opt";s.style.marginTop="10px";s.innerHTML=`<span>${T("Flechas")}</span>`;[[1,"Sí"],[0,"No"]].forEach(([v,tx])=>{const b=document.createElement("button");b.textContent=T(tx);b.className=ENV.rcArr===v?"on":"";b.onclick=()=>{ENV.rcArr=v;saveEnv();for(const x of s.querySelectorAll("button"))x.className="";b.className="on"};s.appendChild(b)});P.appendChild(s)}
 const w=document.createElement("div"),s=document.createElement("button");s.className="b";s.textContent=T("Empezar");s.onclick=()=>raceStart(R,+sel.value);const c=document.createElement("button");c.className="b g";c.textContent=T("Volver");c.onclick=raceMenu;w.append(s,c);P.appendChild(w)}
function rGhostSel(runs){const sel=document.createElement("select");sel.title=T("Coche fantasma");const o0=document.createElement("option");o0.value=-1;o0.textContent="👻 "+T("Sin fantasma");sel.appendChild(o0);runs.forEach((r,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`👻 ${fmtT(r.t)} · ${r.c}`;sel.appendChild(o)});sel.value=runs.length?0:-1;return sel}
function raceStart(R,gi,slot){if(!rBuild(R))return;if(RACE.prevT===undefined||RACE.prevT===null)RACE.prevT=npcLvl;setNpc(ENV.rcT);if(ENV.rcS!==undefined&&ENV.rcS!=="keep"&&(RACE.prevS===undefined||RACE.prevS===null)){RACE.prevS=ENV.season===undefined?"auto":ENV.season;ENV.season=+ENV.rcS;seasonApply(+ENV.rcS)}if(state==="race")$("raceP").hidden=true;let a,b,hd;
 // Salida mirando en el sentido de la calle; en los circuitos, 25 m antes de la meta. En una carrera de sala, parrilla de dos en fondo, 9 m entre filas
 {const n=ONL.mp?ONL.mp.ids.length:1,sl=slot||0,row=Math.floor(sl/2),rows=Math.ceil(n/2),s=R.loop?R.len-25-row*9:6+(rows-1-row)*9,p=R.at(s),q=R.at(s+4);hd=Math.atan2(q.x-p.x,q.z-p.z);a=p.x;b=p.z;if(n>1){const o=sl%2?-2.4:2.4;a+=Math.cos(hd)*o;b-=Math.sin(hd)*o}}
 spawnAt({x:a,z:b,h:hd});bodyY=0;RACE.on=true;RACE.rt=R;RACE.pi=0;RF.i=1;RF.d=0;RACE.cp=0;RACE.t=0;RACE.cd=3.4;RACE.rec=[];RACE.split=[];RACE.recT=0;RACE.sx=a;RACE.sz=b;RACE.sh=hd;RACE.gi=gi;RACE.off=null;RACE.safe=0;gatesBuild(R);
 const st=rStore()[R.id],run=st&&st.runs&&gi>=0?st.runs[gi]:null;RACE.ghost=run||null;ghostCar();if(GHC)GHC.visible=false;resume();rPlace();rHud();$("rcD").textContent=""}
function raceAbort(){RACE.on=false;if(RACE.prevS!==undefined&&RACE.prevS!==null){ENV.season=RACE.prevS;RACE.prevS=null;saveEnv();seasonApply(seasonNow())}if(RACE.prevT!==undefined&&RACE.prevT!==null){setNpc(RACE.prevT);RACE.prevT=null}gatesClear();RACE.off=null;if(GHC)GHC.visible=false;$("raceH").hidden=true;$("rcC").hidden=true;$("rcC").className=""}
function raceEnd(){const R=RACE.rt,t=RACE.t,s=rStore(),e=s[R.id]||(s[R.id]={runs:[]}),old=e.runs.length?e.runs[0].t:null,sm=[];for(let i=0;i<RACE.rec.length;i+=6)sm.push(+RACE.rec[i].toFixed(1),+RACE.rec[i+1].toFixed(1),+RACE.rec[i+2].toFixed(3));
 e.runs.push({t,d:new Date().toLocaleDateString(),c:cur.n,dt:RDT*2,s:sm,split:RACE.split});e.runs.sort((a,b)=>a.t-b.t);e.runs.length=Math.min(5,e.runs.length);rSave(s);RACE.lastT=t;RACE.rec2=RACE.rec;raceAbort();vx=vz=0;if(onlMyFin(t))return;raceResults(R,t,old)}
// Vista aérea del recorrido para el banner: la ciudad desde arriba y en diagonal, con la ruta dibujada encima en neón
function raceShot(R){try{let x0=1e9,z0=1e9,x1=-1e9,z1=-1e9;for(const[x,z]of R.pts){x0=Math.min(x0,x);z0=Math.min(z0,z);x1=Math.max(x1,x);z1=Math.max(z1,z)}
 const Wd=960,Hd=300,asp=Wd/Hd,cx=(x0+x1)/2,cz=(z0+z1)/2,C=new THREE.PerspectiveCamera(38,asp,1,6000),span=Math.max((x1-x0)/asp*1.15,(z1-z0)*1.05,220),d=span/2/Math.tan(19*PI/180)*1.15;
 C.position.set(cx,d*.82,cz+d*.58);C.lookAt(cx,0,cz);C.updateMatrixWorld();const ff=sc.fog.far,fn=sc.fog.near;sc.fog.far=9000;sc.fog.near=8000;
 const rt=new THREE.WebGLRenderTarget(Wd,Hd),px2=new Uint8Array(Wd*Hd*4);rd.setRenderTarget(rt);rd.render(sc,C);rd.readRenderTargetPixels(rt,0,0,Wd,Hd,px2);rd.setRenderTarget(null);rt.dispose();sc.fog.far=ff;sc.fog.near=fn;
 const cv=document.createElement("canvas");cv.width=Wd;cv.height=Hd;const g=cv.getContext("2d"),im=g.createImageData(Wd,Hd);for(let y=0;y<Hd;y++)im.data.set(px2.subarray((Hd-1-y)*Wd*4,(Hd-y)*Wd*4),y*Wd*4);g.putImageData(im,0,0);
 g.fillStyle="rgba(10,6,12,.25)";g.fillRect(0,0,Wd,Hd);const v=new THREE.Vector3(),P=R.pts.map(([x,z])=>{v.set(x,.5,z).project(C);return[(v.x+1)/2*Wd,(1-v.y)/2*Hd]});
 const line=(w,c,b)=>{g.lineWidth=w;g.strokeStyle=c;g.shadowColor=c;g.shadowBlur=b;g.lineJoin=g.lineCap="round";g.beginPath();P.forEach((p,i)=>g[i?"lineTo":"moveTo"](p[0],p[1]));g.stroke()};line(12,"rgba(255,42,60,.35)",18);line(5,"#ff2a3c",12);line(1.6,"#ffe1e5",0);g.shadowBlur=0;
 const dot=(p,c)=>{g.fillStyle=c;g.beginPath();g.arc(p[0],p[1],8,0,7);g.fill();g.strokeStyle="#fff";g.lineWidth=2;g.stroke()};dot(P[0],"#2ee6ff");if(!R.loop)dot(P[P.length-1],"#ffffff");
 R.img=cv.toDataURL("image/jpeg",.82)}catch(e){console.warn(e)}}
// Abandonar una carrera de sala cuenta como «no terminó» para los demás
function rQuitMp(){if(ONL.mp&&!ONL.mp.fin.has(ONL.id))onlMyFin(null)}
// --- Cada fotograma ---
// (con cualquier panel abierto el aviso central se oculta, y vuelve al cerrarlo)
const RC_UI=["ov","mapP","setP","livP","raceP","garP","onlP","radioL"];
function raceTick(dt){const on=RACE.on&&state==="play",cb=$("rcC");document.body.classList.toggle("rcUI",RACE.on);$("rcR").hidden=!!ONL.mp;$("raceH").hidden=!on;if(!on){cb.hidden=true;return}idle=0;gatesWave();const R=RACE.rt,ui=RC_UI.some(k=>!$(k).hidden);rFind();rArrows();
 if(RACE.cd>0){RACE.cd-=dt;px=RACE.sx;pz=RACE.sz;h=camH=RACE.sh;vx=vz=0;const n=Math.ceil(RACE.cd);cb.hidden=ui;cb.textContent=RACE.cd>.4?String(Math.min(3,Math.ceil(RACE.cd-.4))):T("¡Ya!");$("rcT").textContent="0:00.000";ghostAt(0);return}
 rBarrier();RACE.t+=dt;RACE.recT+=dt;while(RACE.recT>=RDT){RACE.recT-=RDT;RACE.rec.push(px,pz,h)}$("rcT").textContent=fmtT(RACE.t);ghostAt(RACE.t);
 const c=R.cps[RACE.cp%R.cps.length];{const k=1+Math.sin(performance.now()/160)*.08;GTS[RACE.cp%R.cps.length].G.scale.set(k,k,k)}
 // Cuenta atrás si se sale de la ruta
 if(RACE.safe>0)RACE.safe-=dt;if(rOnRoute()||RACE.safe>0){if(RACE.off!==null){RACE.off=null;cb.className=""}cb.hidden=true}else{if(RACE.off===null)RACE.off=5;RACE.off-=dt;cb.hidden=ui;cb.className="warn";cb.textContent=`${T("Vuelve a la ruta")} ${Math.max(1,Math.ceil(RACE.off))}`;if(RACE.off<=0){rBack();cb.hidden=true;cb.className=""}}
 if(!HWL.on&&RF.i>=c.i-1&&Math.hypot(px-c.x,pz-c.z)<c.r){RACE.split.push(RACE.t);const g=RACE.ghost&&RACE.ghost.split&&RACE.ghost.split[RACE.cp];if(g!==undefined&&g!==null){const d=RACE.t-g;$("rcD").textContent=(d<0?"−":"+")+Math.abs(d).toFixed(2);$("rcD").style.color=d<0?"#49e07a":"#ff6a5a"}RACE.cp++;if(RACE.cp>=R.cps.length*R.laps){raceEnd();return}rPlace();rHud()}}
// Minimapa: solo el tramo que falta hasta el siguiente punto de control, no todo el recorrido
function raceMini(g){if(!RACE.on)return;const R=RACE.rt,n=R.cps.length,q=R.cps[RACE.cp%n],N=R.pts.length-1;if(RF.i<1||RF.i>N)return;   // (posición aún sin calcular en esta carrera)
 g.lineCap=g.lineJoin="round";for(const[c,w]of[["#14151a",8],["#ffd400",4.5]]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();g.moveTo(px,pz);for(let i=RF.i,m=0;i!==q.i&&m<=N;i=i>=N?1:i+1,m++)g.lineTo(R.pts[i][0],R.pts[i][1]);g.lineTo(q.x,q.z);g.stroke()}}
function raceMiniDot(a,b,cc,d,c){if(!RACE.on)return;const q=RACE.rt.cps[RACE.cp%RACE.rt.cps.length],dx=q.x-px,dz=q.z-pz;let x=a*dx+cc*dz,y=b*dx+d*dz;const r=Math.hypot(x,y);if(r>82){x*=82/r;y*=82/r}mc.fillStyle="#ffb000";mc.strokeStyle="#14151a";mc.lineWidth=3;mc.beginPath();mc.arc(c+x,c+y,7,0,7);mc.fill();mc.stroke()}
// --- Menú y resultados ---
function raceMenu(){state="race";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=$("onlP").hidden=$("garP").hidden=true;$("raceP").hidden=false;hudVis(false);$("touch").hidden=true;const P=$("raceP"),S=rStore();P.innerHTML="";
 const h1=document.createElement("h1");h1.textContent=T("Carreras");P.appendChild(h1);
 // En una sala solo el creador elige: la carrera empieza a la vez para todos
 if(ONL.ch&&ONL.ok&&!ONL.host){const p=document.createElement("p");p.textContent=T("Estás en una sala: la carrera la elige quien la creó y empezará para todos a la vez.");P.appendChild(p);const c=document.createElement("button");c.className="b g";c.textContent=T("Cerrar");c.onclick=resume;P.appendChild(c);return}
 const mp=ONL.ch&&ONL.ok&&ONL.host;if(mp){const p=document.createElement("p");p.textContent=T("Sala: al pulsar Correr salís todos a la vez.");P.appendChild(p)}
 // Cada carrera es un banner con la vista aérea de su recorrido (se dibuja la primera vez que se abre el menú)
 for(const R of RTS){rBuild(R);const e=S[R.id],runs=e&&e.runs||[],d=document.createElement("div");d.className="rcB";if(R.img)d.style.backgroundImage=`url(${R.img})`;else setTimeout(()=>{raceShot(R);if(R.img)d.style.backgroundImage=`url(${R.img})`},60);
  const inf=document.createElement("div");inf.className="inf";inf.innerHTML=`<span class="tag${R.loop?"":" c"}">${T(R.tipo)}</span><b>${T(R.n)}</b><small>${R.loop&&R.laps>1?`${R.laps} ${T("vueltas")} · `:""}${(R.len*R.laps/1000).toFixed(1)} km · </small>`;d.appendChild(inf);
  const bt=document.createElement("div");bt.className="best";bt.innerHTML=`<small>${T("Mejor tiempo")}</small><b>${runs.length?fmtT(runs[0].t):"—"}</b>`;d.appendChild(bt);
  const b=document.createElement("button");b.className="b";b.textContent=T("Correr");b.onclick=()=>mp?onlRaceStart(R):raceSetup(R,runs.length?0:-1);d.appendChild(b);P.appendChild(d)}
 const n=document.createElement("p");n.textContent=T("G enciende o apaga el fantasma durante la carrera.");P.appendChild(n);
 const row=document.createElement("div");if(RACE.on){const a=document.createElement("button");a.className="b g";a.textContent=T("Abandonar carrera");a.onclick=()=>{raceAbort();resume();rQuitMp()};row.appendChild(a)}const c=document.createElement("button");c.className="b g";c.textContent=T("Cerrar");c.onclick=resume;row.appendChild(c);P.appendChild(row)}
function raceResults(R,t,old){state="race";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=$("onlP").hidden=$("garP").hidden=true;hudVis(false);$("touch").hidden=true;const P=$("raceP");P.hidden=false;P.innerHTML="";const rec=old===null||t<old;
 const h1=document.createElement("h1");h1.textContent=rec?T("¡Nuevo récord!"):T("Meta");P.appendChild(h1);const p=document.createElement("p");p.innerHTML=`<b style="font-size:30px">${fmtT(t)}</b><br>${old===null?"":`${T("Récord anterior")}: ${fmtT(old)}`}`;P.appendChild(p);
 for(const[n,f,g]of[["Repetir",()=>{const s=rStore()[R.id];raceStart(R,s&&s.runs.length?0:-1)},0],["🎬 Ver repetición",replayStart,1],["Otra carrera",raceMenu,1],["Conducción libre",resume,1]]){const b=document.createElement("button");b.className=g?"b g":"b";b.textContent=T(n);b.onclick=f;P.appendChild(b)}}
// --- Repetición (últimos 20 s de la carrera, en bucle) y modo foto ---
const RP={t:0,start:0,end:0,sp:1,x:0,z:0,hd:0},FT={a:0,p:.25,d:7,drag:null};
function rBar(items){const B=$("rcBar");B.innerHTML="";B.hidden=false;for(const[n,f]of items){const b=document.createElement("button");b.className="b g";b.textContent=T(n);b.onclick=f;B.appendChild(b)}}
function replayStart(){const r=RACE.rec2;if(!r||r.length<30)return;$("raceP").hidden=true;$("ov").hidden=true;RP.end=r.length/3*RDT-RDT*2;RP.start=Math.max(0,RP.end-20);RP.t=RP.start;RP.sp=1;RP.x=px;RP.z=pz;RP.hd=h;state="replay";rBar([["× 0,5 / × 1",()=>RP.sp=RP.sp===1?.5:1],["Salir",replayEnd]])}
function replayEnd(){$("rcBar").hidden=true;px=RP.x;pz=RP.z;h=camH=RP.hd;car.position.set(px,0,pz);car.rotation.set(0,h,0);raceResults(RACE.rt,RACE.lastT,RACE.lastT)}
// La foto empieza donde está la cámara de conducción: misma distancia, altura, lado y zoom (en las cámaras interiores, a 3 m como mínimo)
function photoStart(){if(state!=="play"||RACE.on)return;const P=cam.position,dx=P.x-px,dz=P.z-pz,dy=P.y-(bodyY+.8),d=Math.max(.1,Math.hypot(dx,dy,dz));FT.a=Math.atan2(dx,dz);FT.p=Math.max(.02,Math.min(1.45,Math.asin(dy/d)));FT.d=Math.max(3,Math.min(30,d));FT.f=cam.fov;state="photo";hudVis(false);$("touch").hidden=true;vx=vz=0;rBar([["📷 Guardar foto",photoSave],["Salir",photoEnd]])}
function photoEnd(){$("rcBar").hidden=true;resume()}
function photoSave(){renderFrame();try{const a=document.createElement("a");a.href=$("c").toDataURL("image/png");a.download="tokyo-drive-"+Date.now()+".png";document.body.appendChild(a);a.click();a.remove()}catch(e){console.error(e)}}
function raceCam(dt){const P=cam.position;if(state==="photo"){if(keys.KeyQ)FT.p=Math.max(.02,FT.p-dt);if(keys.KeyE)FT.p=Math.min(1.45,FT.p+dt);const k=Math.cos(FT.p)*FT.d;P.set(px+Math.sin(FT.a)*k,bodyY+Math.max(.35,.8+Math.sin(FT.p)*FT.d),pz+Math.cos(FT.a)*k);clipCam();cam.lookAt(px,bodyY+.9,pz);cam.fov=FT.f;cam.updateProjectionMatrix();return}
 RP.t+=dt*RP.sp;if(RP.t>=RP.end)RP.t=RP.start;const r=RACE.rec2,f=RP.t/RDT,i=Math.floor(f),k=f-i,a=i*3,b=a+3;let d=r[b+2]-r[a+2];d=Math.atan2(Math.sin(d),Math.cos(d));px=r[a]+(r[b]-r[a])*k;pz=r[a+1]+(r[b+1]-r[a+1])*k;h=r[a+2]+d*k;car.position.set(px,0,pz);car.rotation.set(0,h,0);
 const hx=Math.sin(h),hz=Math.cos(h),v=Math.floor((RP.t-RP.start)/5)%3;if(v===0){P.set(px-hx*8,3.2,pz-hz*8);LK.set(px+hx*6,1.2,pz+hz*6);cam.fov=62}else if(v===1){P.set(px+hz*5-hx*3,1,pz-hx*5-hz*3);LK.set(px,.9,pz);cam.fov=50}else{const s=(RP.t-RP.start)*.5;P.set(px+Math.sin(s)*14,7,pz+Math.cos(s)*14);LK.set(px,.8,pz);cam.fov=55}clipCam();cam.lookAt(LK);cam.updateProjectionMatrix()}
{const cv=$("c");cv.addEventListener("pointerdown",e=>{if(state==="photo")FT.drag=[e.clientX,e.clientY]});addEventListener("pointermove",e=>{if(state==="photo"&&FT.drag){FT.a-=(e.clientX-FT.drag[0])*.008;FT.p=Math.max(.02,Math.min(1.45,FT.p+(e.clientY-FT.drag[1])*.006));FT.drag=[e.clientX,e.clientY]}});addEventListener("pointerup",()=>FT.drag=null);addEventListener("wheel",e=>{if(state==="photo")FT.d=Math.max(3,Math.min(30,FT.d*(e.deltaY>0?1.1:.9)))},{passive:true})}
