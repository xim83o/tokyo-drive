// Carreras (circuitos con vueltas) y contrarreloj (de un punto a otro) por las calles reales, con puntos de control y mejor tiempo guardado;
// coche fantasma de cualquiera de tus tiempos guardados (se elige en el menú y se enciende o apaga con la tecla G); repetición de los
// últimos 20 s al acabar una carrera; y modo foto (cámara libre alrededor del coche y guardar la imagen)
const RTS=[{id:"torre",n:"Circuito de la Torre",tipo:"Carrera",laps:2,loop:true,w:[[1020,1020],[1400,1000],[1420,1400],[1020,1400]]},
 {id:"canal",n:"Circuito del Canal",tipo:"Carrera",laps:2,loop:true,w:[[800,1500],[1250,1650],[1600,1780],[1560,1450],[1000,1300]]},
 {id:"kuro",n:"Torre de Tokio → Kurogane",tipo:"Contrarreloj",laps:1,w:[[1201,1090],[1364,1680]]},
 {id:"beis",n:"Béisbol → Zona de derrape",tipo:"Contrarreloj",laps:1,w:[[1139,900],[1650,1250]]},
 {id:"cruce",n:"Cruce de Tokio",tipo:"Contrarreloj",laps:1,w:[[320,1200],[2100,1250]]}];
const RACE={on:false,rt:null,cp:0,t:0,cd:0,rec:[],split:[],ghost:null,gOn:true,recT:0};
const RDT=.05,CPD=140;
const rStore=()=>{try{return JSON.parse(localStorage.getItem("td-race")||"{}")}catch(e){return{}}},rSave=s=>{try{localStorage.setItem("td-race",JSON.stringify(s))}catch(e){}};
const fmtT=t=>{const m=Math.floor(t/60),s=t-m*60;return m+":"+(s<10?"0":"")+s.toFixed(3)};
// --- Rutas: camino más corto por el grafo de calles, prefiriendo las avenidas ---
let RG=null;
function raceGraph(){if(RG)return RG;RG=new Map();const nd=(id,x,z)=>{let n=RG.get(id);if(!n){n={id,x,z,e:[]};RG.set(id,n)}return n},TC=[1,1,1.2,1.7,3];
 MAP.roads.forEach(r=>{if(!r.n)return;for(let i=1;i<r.n.length;i++){const a=nd(r.n[i-1],r.p[i*2-2],r.p[i*2-1]),b=nd(r.n[i],r.p[i*2],r.p[i*2+1]),l=Math.hypot(a.x-b.x,a.z-b.z),c=l*TC[r.t];a.e.push([b,c]);b.e.push([a,c*(r.o?2:1)])}});return RG}
function rNear(x,z){let b=null,bd=1e18;for(const n of raceGraph().values()){if(!n.e.length)continue;const d=(n.x-x)**2+(n.z-z)**2;if(d<bd){bd=d;b=n}}return b}
function rPath(a,b,used){const dist=new Map([[a,0]]),prev=new Map(),H=[[0,a]],up=()=>{let i=H.length-1;while(i){const p=(i-1)>>1;if(H[p][0]<=H[i][0])break;[H[p],H[i]]=[H[i],H[p]];i=p}},
  dn=()=>{let i=0;for(;;){let m=i;for(const c of[2*i+1,2*i+2])if(c<H.length&&H[c][0]<H[m][0])m=c;if(m===i)break;[H[m],H[i]]=[H[i],H[m]];i=m}};
 while(H.length){const[d,n]=H[0],l=H.pop();if(H.length){H[0]=l;dn()}if(n===b)break;if(d>dist.get(n))continue;for(const[m,c]of n.e){const nc=d+c*(used.has(n.id+"_"+m.id)?6:1);if(nc<(dist.has(m)?dist.get(m):1e18)){dist.set(m,nc);prev.set(m,n);H.push([nc,m]);up()}}}
 if(!prev.has(b))return null;const P=[b];for(let n=b;n!==a;){n=prev.get(n);P.unshift(n)}for(let i=1;i<P.length;i++){used.add(P[i-1].id+"_"+P[i].id);used.add(P[i].id+"_"+P[i-1].id)}return P}
function rBuild(R){if(R.pts)return R;const W=R.w.map(([x,z])=>rNear(x,z));if(R.loop)W.push(W[0]);const used=new Set();let P=[W[0]];for(let i=1;i<W.length;i++){const q=rPath(W[i-1],W[i],used);if(!q)return null;P=P.concat(q.slice(1))}
 R.pts=P.map(n=>[n.x,n.z]);let D=0;const cps=[];let nx=CPD;for(let i=1;i<R.pts.length;i++){const[a,b]=R.pts[i-1],[c,d]=R.pts[i],l=Math.hypot(c-a,d-b);while(D+l>=nx&&(R.pts.length-i>0)){const f=(nx-D)/(l||1);cps.push({x:a+(c-a)*f,z:b+(d-b)*f,dx:(c-a)/(l||1),dz:(d-b)/(l||1),i});nx+=CPD}D+=l}
 R.len=D;while(cps.length&&D-(cps.length*CPD)<50)cps.pop();const[e0,e1]=R.pts.slice(-2);const ll=Math.hypot(e1[0]-e0[0],e1[1]-e0[1])||1;cps.push({x:e1[0],z:e1[1],dx:(e1[0]-e0[0])/ll,dz:(e1[1]-e0[1])/ll,end:true,i:R.pts.length-1});R.cps=cps;return R}
// --- Arcos de los puntos de control: altos y luminosos, se ven desde lejos. El siguiente va resaltado y con un haz de luz hacia el cielo ---
let GTS=[],GTM=null;
function gateMats(){if(GTM)return GTM;const b=(c,o)=>new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,fog:o<1,depthWrite:o>=1}),chk=canvasTex(128,32,(g)=>{for(let i=0;i<16;i++)for(let j=0;j<4;j++){g.fillStyle=(i+j)%2?"#111":"#fff";g.fillRect(i*8,j*8,8,8)}},true);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.1,160,10,1,true).translate(0,80,0),new THREE.MeshBasicMaterial({color:0xffb000,transparent:true,opacity:.28,fog:false,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));beam.visible=false;sc.add(beam);
 GTM={next:b(0xffb000,1),far:b(0xff5a2a,.4),fin:new THREE.MeshBasicMaterial({map:chk,side:THREE.DoubleSide,fog:false}),beam};return GTM}
const rHW=(x,z)=>{let m=4;for(const k of gq(x,z).r){const o=k*6;if(segD2(x,z,RSG[o],RSG[o+1],RSG[o+2],RSG[o+3])<(RSG[o+4]+2)**2)m=Math.max(m,RSG[o+4])}return m};
function gatesClear(){for(const q of GTS){sc.remove(q.G);q.G.traverse(o=>{if(o.geometry)o.geometry.dispose()})}GTS=[];if(GTM)GTM.beam.visible=false}
function gatesBuild(R){gatesClear();const M=gateMats();R.cps.forEach((c,i)=>{const hw=rHW(c.x,c.z)+1.2,G=new THREE.Group(),P=[new THREE.Mesh(new THREE.TorusGeometry(hw,.42,8,32,PI),M.far)];P[0].position.y=5;
  for(const s of[-1,1]){const L=new THREE.Mesh(new THREE.CylinderGeometry(.42,.42,5,10),M.far);L.position.set(s*hw,2.5,0);P.push(L)}G.add(...P);
  if(c.end){const B=new THREE.Mesh(new THREE.PlaneGeometry(hw*1.4,1.8),M.fin);B.position.y=5+hw-1.1;G.add(B)}
  G.position.set(c.x,0,c.z);G.rotation.y=Math.atan2(c.dx,c.dz);G.visible=false;sc.add(G);c.r=hw+4;GTS.push({G,P})})}
function rPlace(){const R=RACE.rt,n=R.cps.length,k=RACE.cp%n,tot=n*R.laps;GTS.forEach((q,i)=>{const d=(i-k+n)%n;q.G.visible=RACE.cp+d<tot;for(const m of q.P)m.material=d===0?GTM.next:GTM.far});const c=R.cps[k];GTM.beam.position.set(c.x,0,c.z);GTM.beam.visible=true}
// ¿Va por la ruta? Se mira el tramo entre el último punto de control y el siguiente (no vale atajar a otra parte del recorrido ni subir a la autopista)
function rOnRoute(){if(HWL.on)return false;const R=RACE.rt,n=R.cps.length,k=RACE.cp%n,i1=Math.min(R.pts.length-1,R.cps[k].i+2),i0=Math.max(0,(k?R.cps[k-1].i:0)-2);for(let i=i0+1;i<=i1;i++){const[a,b]=R.pts[i-1],[c,d]=R.pts[i];if(segD2(px,pz,a,b,c,d)<784)return true}return false}
// Fuera de la ruta o tras saltarse un arco: al acabarse los 5 s, vuelve al último punto por el que pasó (el tiempo sigue corriendo)
function rBack(){const R=RACE.rt,n=R.cps.length,k=RACE.cp%n,q=R.cps[k];let x=RACE.sx,z=RACE.sz;if(RACE.cp>0){const o=R.cps[(RACE.cp-1)%n];x=o.x;z=o.z}spawnAt({x,z,h:Math.atan2(q.x-x,q.z-z)});RACE.off=null;RACE.safe=1.5}
function raceQuit(){raceAbort();if(state==="set")closeSettings()}
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
function raceSetup(R,gi){if(ENV.rcSkip){raceStart(R,gi);return}const P=$("raceP"),runs=(rStore()[R.id]||{runs:[]}).runs;P.innerHTML="";const h1=document.createElement("h1");h1.textContent=T(R.n);P.appendChild(h1);
 const r=document.createElement("div");r.className="opt";r.innerHTML=`<span>${T("Tráfico")}</span>`;NLAB.forEach((t,i)=>{const b=document.createElement("button");b.textContent=T(t);b.className=ENV.rcT===i?"on":"";b.onclick=()=>{ENV.rcT=i;saveEnv();for(const x of r.querySelectorAll("button"))x.className="";b.className="on"};r.appendChild(b)});P.appendChild(r);
 const q=document.createElement("div");q.className="opt";q.style.marginTop="10px";q.innerHTML=`<span>${T("Fantasma")}</span>`;const sel=rGhostSel(runs);sel.value=gi;q.appendChild(sel);P.appendChild(q);
 const lb=document.createElement("label");lb.className="rcChk";lb.innerHTML=`<input type="checkbox"> ${T("No volver a mostrar esta pantalla")}`;const ck=lb.firstChild;ck.onchange=()=>{ENV.rcSkip=ck.checked;saveEnv()};P.appendChild(lb);
 const w=document.createElement("div"),s=document.createElement("button");s.className="b";s.textContent=T("Empezar");s.onclick=()=>raceStart(R,+sel.value);const c=document.createElement("button");c.className="b g";c.textContent=T("Volver");c.onclick=raceMenu;w.append(s,c);P.appendChild(w)}
function rGhostSel(runs){const sel=document.createElement("select");sel.title=T("Coche fantasma");const o0=document.createElement("option");o0.value=-1;o0.textContent="👻 "+T("Sin fantasma");sel.appendChild(o0);runs.forEach((r,i)=>{const o=document.createElement("option");o.value=i;o.textContent=`👻 ${fmtT(r.t)} · ${r.c}`;sel.appendChild(o)});sel.value=runs.length?0:-1;return sel}
function raceStart(R,gi){if(!rBuild(R))return;if(RACE.prevT===undefined||RACE.prevT===null)RACE.prevT=npcLvl;setNpc(ENV.rcT);if(state==="race")$("raceP").hidden=true;const[a,b]=R.pts[0],[c,d]=R.pts[Math.min(3,R.pts.length-1)],hd=Math.atan2(c-a,d-b);spawnAt({x:a,z:b,h:hd});bodyY=0;RACE.on=true;RACE.rt=R;RACE.cp=0;RACE.t=0;RACE.cd=3.4;RACE.rec=[];RACE.split=[];RACE.recT=0;RACE.sx=a;RACE.sz=b;RACE.sh=hd;RACE.gi=gi;RACE.off=null;RACE.safe=0;gatesBuild(R);
 const st=rStore()[R.id],run=st&&st.runs&&gi>=0?st.runs[gi]:null;RACE.ghost=run||null;ghostCar();if(GHC)GHC.visible=false;resume();rPlace();rHud();$("rcD").textContent=""}
function raceAbort(){RACE.on=false;if(RACE.prevT!==undefined&&RACE.prevT!==null){setNpc(RACE.prevT);RACE.prevT=null}gatesClear();RACE.off=null;if(GHC)GHC.visible=false;$("raceH").hidden=true;$("rcC").hidden=true;$("rcC").className=""}
function raceEnd(){const R=RACE.rt,t=RACE.t,s=rStore(),e=s[R.id]||(s[R.id]={runs:[]}),old=e.runs.length?e.runs[0].t:null,sm=[];for(let i=0;i<RACE.rec.length;i+=6)sm.push(+RACE.rec[i].toFixed(1),+RACE.rec[i+1].toFixed(1),+RACE.rec[i+2].toFixed(3));
 e.runs.push({t,d:new Date().toLocaleDateString(),c:cur.n,dt:RDT*2,s:sm,split:RACE.split});e.runs.sort((a,b)=>a.t-b.t);e.runs.length=Math.min(5,e.runs.length);rSave(s);RACE.lastT=t;RACE.rec2=RACE.rec;raceAbort();vx=vz=0;raceResults(R,t,old)}
// --- Cada fotograma ---
function raceTick(dt){const on=RACE.on&&state==="play";$("raceH").hidden=!on;if(!on)return;idle=0;const R=RACE.rt,cb=$("rcC");
 if(RACE.cd>0){RACE.cd-=dt;px=RACE.sx;pz=RACE.sz;h=camH=RACE.sh;vx=vz=0;const n=Math.ceil(RACE.cd);cb.hidden=false;cb.textContent=RACE.cd>.4?String(Math.min(3,Math.ceil(RACE.cd-.4))):T("¡Ya!");$("rcT").textContent="0:00.000";ghostAt(0);return}
 RACE.t+=dt;RACE.recT+=dt;while(RACE.recT>=RDT){RACE.recT-=RDT;RACE.rec.push(px,pz,h)}$("rcT").textContent=fmtT(RACE.t);ghostAt(RACE.t);
 const c=R.cps[RACE.cp%R.cps.length];{const k=1+Math.sin(performance.now()/160)*.08;GTS[RACE.cp%R.cps.length].G.scale.set(k,k,k)}
 // Cuenta atrás si se sale de la ruta
 if(RACE.safe>0)RACE.safe-=dt;if(rOnRoute()||RACE.safe>0){if(RACE.off!==null){RACE.off=null;cb.className=""}cb.hidden=true}else{if(RACE.off===null)RACE.off=5;RACE.off-=dt;cb.hidden=false;cb.className="warn";cb.textContent=`${T("Vuelve a la ruta")} ${Math.max(1,Math.ceil(RACE.off))}`;if(RACE.off<=0){rBack();cb.hidden=true;cb.className=""}}
 if(!HWL.on&&Math.hypot(px-c.x,pz-c.z)<c.r){RACE.split.push(RACE.t);const g=RACE.ghost&&RACE.ghost.split&&RACE.ghost.split[RACE.cp];if(g!==undefined&&g!==null){const d=RACE.t-g;$("rcD").textContent=(d<0?"−":"+")+Math.abs(d).toFixed(2);$("rcD").style.color=d<0?"#49e07a":"#ff6a5a"}RACE.cp++;if(RACE.cp>=R.cps.length*R.laps){raceEnd();return}rPlace();rHud()}}
function raceMini(g){if(!RACE.on)return;const R=RACE.rt;g.lineCap=g.lineJoin="round";for(const[c,w]of[["#14151a",13],["#ffd400",8]]){g.strokeStyle=c;g.lineWidth=w;g.beginPath();R.pts.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.stroke()}}
function raceMiniDot(a,b,cc,d,c){if(!RACE.on)return;const q=RACE.rt.cps[RACE.cp%RACE.rt.cps.length],dx=q.x-px,dz=q.z-pz;let x=a*dx+cc*dz,y=b*dx+d*dz;const r=Math.hypot(x,y);if(r>82){x*=82/r;y*=82/r}mc.fillStyle="#ffb000";mc.strokeStyle="#14151a";mc.lineWidth=3;mc.beginPath();mc.arc(c+x,c+y,7,0,7);mc.fill();mc.stroke()}
// --- Menú y resultados ---
function raceMenu(){state="race";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=true;$("raceP").hidden=false;hudVis(false);$("touch").hidden=true;const P=$("raceP"),S=rStore();P.innerHTML="";
 const h1=document.createElement("h1");h1.textContent=T("Carreras");P.appendChild(h1);
 for(const R of RTS){const e=S[R.id],runs=e&&e.runs||[],d=document.createElement("div");d.className="rcRow";const inf=document.createElement("div");inf.innerHTML=`<b>${T(R.n)}</b><small>${T(R.tipo)}${R.laps>1?` · ${R.laps} ${T("vueltas")}`:""} · ${T("Récord")}: ${runs.length?fmtT(runs[0].t):"—"}</small>`;d.appendChild(inf);
  const sel=rGhostSel(runs);d.appendChild(sel);
  const b=document.createElement("button");b.className="b";b.textContent=T("Correr");b.onclick=()=>raceSetup(R,+sel.value);d.appendChild(b);P.appendChild(d)}
 const n=document.createElement("p");n.textContent=T("G enciende o apaga el fantasma durante la carrera.");P.appendChild(n);
 const lb=document.createElement("label");lb.className="rcChk";lb.innerHTML=`<input type="checkbox"> ${T("Mostrar la pantalla de tráfico antes de salir")}`;const ck=lb.firstChild;ck.checked=!ENV.rcSkip;ck.onchange=()=>{ENV.rcSkip=!ck.checked;saveEnv()};P.appendChild(lb);
 const row=document.createElement("div");if(RACE.on){const a=document.createElement("button");a.className="b g";a.textContent=T("Abandonar carrera");a.onclick=()=>{raceAbort();resume()};row.appendChild(a)}const c=document.createElement("button");c.className="b g";c.textContent=T("Cerrar");c.onclick=resume;row.appendChild(c);P.appendChild(row)}
function raceResults(R,t,old){state="race";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=true;hudVis(false);$("touch").hidden=true;const P=$("raceP");P.hidden=false;P.innerHTML="";const rec=old===null||t<old;
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
