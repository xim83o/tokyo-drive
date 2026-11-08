// Menús: selección de coche y mapa para reaparecer
const CAT=["Urbano","Deportivo","Superdeportivo","Drift","Furgoneta"],HUDS=MOBILE?["mini","hud"]:["mini","hud","help"];
// Punto de la calzada más cercano a (x,z), en el carril izquierdo (en Japón se circula por la izquierda)
function nearestRoad(x,z,flip){let best=0,bd=1e18;for(let k=0;k<RSG.length;k+=6){const d=segD2(x,z,RSG[k],RSG[k+1],RSG[k+2],RSG[k+3]);if(d<bd){bd=d;best=k}}
 segD2(x,z,RSG[best],RSG[best+1],RSG[best+2],RSG[best+3]);const r=MAP.roads[RSG[best+5]],hw=RSG[best+4];let ux=RSG[best+2]-RSG[best],uz=RSG[best+3]-RSG[best+1];const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l;
 if(!r.o&&flip){ux=-ux;uz=-uz}const off=r.o?Math.max(0,hw-1.9):hw/2;return{x:_cx+uz*off,z:_cz-ux*off,h:Math.atan2(ux,uz)}}
function spawnAt(q){HWL.on=false;px=q.x;pz=q.z;h=camH=q.h;vx=vz=0;bodyY=bodyV=0;WY.fill(0)}
function spawnC(){const a=Math.random()*PI*2,r=150+Math.random()*350;spawnAt(nearestRoad(TX+Math.sin(a)*r,TZ+Math.cos(a)*r,Math.random()<.5))}
const tb=$("tabs");tb.style.cssText="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px";
// Fichas de coche y pestañas de categoría (se rehacen al cambiar de idioma)
function buildCards(){$("cards").innerHTML="";tb.innerHTML="";
 CARS.forEach((c,i)=>{const d=document.createElement("button");d.className="cd";const t=t100(c),U=ENV.units==="mph",v=Math.round(c.vm*3.6*(U?.6214:1));
  d.innerHTML=`<canvas class="cth" width="360" height="210"></canvas><b>${c.n}</b><small>${T("Máx.")} ${v} ${U?"mph":"km/h"} · ${T("0-100 en")} ${t.toFixed(1)} s</small><div class="bar"><u style="width:${Math.min(1,2.2/t)*100}%"></u></div><small>${T("Aceleración")}</small>`;
  d.onclick=()=>{if(!ready)return;buildCar(i);goFull();if(!spawned){spawnC();spawned=true}resume()};d.dataset.cat=CAT[i];$("cards").appendChild(d)});
 ["Todos",...CAT].forEach(n=>{const b=document.createElement("button");b.textContent=T(n);b.style.cssText="padding:6px 14px;border:0;border-radius:16px;font:600 13px system-ui;cursor:pointer;color:inherit;background:rgba(128,128,128,.25)";
  b.onclick=()=>{for(const x of tb.children){x.style.background="rgba(128,128,128,.25)";x.style.color="inherit"}b.style.background="var(--ac)";b.style.color="#fff";for(const c of $("cards").children)c.hidden=n!=="Todos"&&c.dataset.cat!==n};tb.appendChild(b)});tb.firstChild.click()}
buildCards();applyI18n();
{const b=document.createElement("button");b.className="b g";b.dataset.i18n="Volver";b.textContent=T("Volver");b.onclick=()=>mainMenu();$("carsP").appendChild(b)}
// Fotos de los coches en las fichas: cada coche con su pintura y sus calcomanías, en una escena aparte. En PC gira mientras el ratón está encima
const CTH={sc:null,cam:null,rt:null,cache:new Map(),spin:null};
function thInit(){if(CTH.sc)return;const s=new THREE.Scene();s.add(new THREE.HemisphereLight(0xffffff,0x3a3040,1.05));const d=new THREE.DirectionalLight(0xffffff,.95);d.position.set(4,6,5);s.add(d);const r=new THREE.DirectionalLight(0xff4060,.6);r.position.set(-5,2,-4);s.add(r);
 CTH.sc=s;CTH.cam=new THREE.PerspectiveCamera(30,12/7,.1,100);CTH.rt=new THREE.WebGLRenderTarget(720,420);CTH.px=new Uint8Array(720*420*4);CTH.cv=document.createElement("canvas");CTH.cv.width=720;CTH.cv.height=420}
// Coche k con la decoración L (pintura y calcomanías), guardado para no rehacerlo (como mucho 14 a la vez)
function thObj(k,L){thInit();const key=k+"|"+JSON.stringify(L||{});let p=CTH.cache.get(key);if(p)return p;const c=CARS[k];L=L||{};p={g:new THREE.Group(),k,img:[],dec:[],body:null,wh:[]};
 const m=modelInst(c.f,c.l,L.c!==undefined?L.c:c.c,false,{tint:L.tint||0,gc:L.gc,bc:L.bc});p.g.add(m.s);p.body=m.body;p.wh=m.wh;if(typeof peerDecals==="function"&&L.stk)peerDecals(p,c,Object.assign(LIVDEF(),L));p.g.visible=false;CTH.sc.add(p.g);CTH.cache.set(key,p);
 if(CTH.cache.size>14){const[k0,q]=CTH.cache.entries().next().value;CTH.sc.remove(q.g);CTH.cache.delete(k0)}return p}
function thDraw(cv,p,k,a){if(!cv||!p)return;for(const q of CTH.cache.values())q.g.visible=q===p;const l=CARS[k].l,C=CTH.cam;C.position.set(Math.sin(a)*l*1.55,l*.5,Math.cos(a)*l*1.55);C.lookAt(0,.45,0);
 const pc=rd.getClearColor(new THREE.Color()),pa=rd.getClearAlpha();rd.setRenderTarget(CTH.rt);rd.setClearColor(0,0);rd.clear();rd.render(CTH.sc,C);rd.readRenderTargetPixels(CTH.rt,0,0,720,420,CTH.px);rd.setRenderTarget(null);rd.setClearColor(pc,pa);
 const g2=CTH.cv.getContext("2d"),im=g2.createImageData(720,420);for(let y=0;y<420;y++)im.data.set(CTH.px.subarray((419-y)*2880,(420-y)*2880),y*2880);g2.putImageData(im,0,0);const g=cv.getContext("2d");g.clearRect(0,0,cv.width,cv.height);g.drawImage(CTH.cv,0,0,cv.width,cv.height)}
// Con el ratón encima (tras wait ms) el coche da vueltas sin parar; al salir vuelve a la foto. En el móvil, solo la foto
function thHover(el,cv,p,k,wait){if(MOBILE)return;el.onmouseenter=()=>{const tok={};CTH.spin=tok;let a=.7;const f=()=>{if(CTH.spin!==tok||!el.isConnected)return;a+=.03;thDraw(cv,p,k,a);requestAnimationFrame(f)};setTimeout(f,wait||0)};el.onmouseleave=()=>{CTH.spin=null;thDraw(cv,p,k,.7)}}
function carThumbs(){if(!ready||!MODELS[CARS[0].f])return;[...$("cards").children].forEach((d,i)=>{const cv=d.querySelector(".cth"),p=thObj(i,LIV[i]);thDraw(cv,p,i,.7);thHover(d,cv,p,i,0)})}
function show(w){state=w;if(w==="cars")setTimeout(carThumbs,30);$("ov").hidden=false;for(const k of["raceP","garP","onlP"])$(k).hidden=true;   // (que no se quede abierto otro panel al lado)
$("carsP").hidden=w!=="cars";$("mapP").hidden=w!=="map";$("setP").hidden=true;$("livP").hidden=true;$("ov").classList.remove("liv");if(w==="map"){pend=null;$("ok").disabled=true;mapV={z:1,x:W/2,z0:W/2};drawMap()}
 hudVis(false);$("touch").hidden=true}
// Al volver a conducir, la cámara va de donde estaba a su sitio detrás del coche en 0,5 s (main.js), en vez de saltar
const CT={t:1,p:new THREE.Vector3(),q:new THREE.Quaternion()};
function resume(){if(state!=="play"&&state!=="set"&&typeof cam!=="undefined"){CT.p.copy(cam.position);CT.q.copy(cam.quaternion);CT.t=0}state="play";$("radP").hidden=true;$("ov").hidden=true;$("raceP").hidden=true;$("garP").hidden=true;$("onlP").hidden=true;hudVis(true);$("touch").hidden=!MOBILE}
// HUD (minimapa, velocímetro y ayuda): se puede quitar cada parte en Ajustes → Pantalla
function hudVis(on){$("mini").hidden=!on||!ENV.hud.mini;$("hud").hidden=!on||!ENV.hud.speed||MOBILE;$("spd").hidden=!on||!ENV.hud.speed||!MOBILE;$("help").hidden=!on||!ENV.hud.help||MOBILE;$("mz").hidden=!on||!ENV.hud.mini}
const mp=$("mp"),mx=mp.getContext("2d");
// Vista del mapa grande: zoom (rueda, pellizco o botones + y −) y desplazamiento arrastrando
let mapV={z:1,x:1200,z0:1200},LMK=null;
const mapS=()=>640*mapV.z/W,mapO=()=>[mapV.x-W/2/mapV.z,mapV.z0-W/2/mapV.z];
function mapClamp(){const h=W/2/mapV.z;mapV.x=Math.max(h,Math.min(W-h,mapV.x));mapV.z0=Math.max(h,Math.min(W-h,mapV.z0))}
function mapZoom(d,cx,cz){const z=Math.max(1,Math.min(8,mapV.z*(d>0?1.5:1/1.5)));if(cx!==undefined){const k=1-mapV.z/z;mapV.x+=(cx-mapV.x)*k;mapV.z0+=(cz-mapV.z0)*k}mapV.z=z;mapClamp();drawMap()}
// Lugares importantes con nombre en el mapa
function landmarks(){if(LMK||!ready)return LMK;LMK=[{x:TX,z:TZ,n:T("Torre de Tokio"),c:"#ff5a3c"}];const TP=MAP.buildings.filter(b=>b.k===1||b.k===3);
 if(TP.length){let x=0,z=0,n=0;for(const b of TP)for(let i=0;i<b.p.length;i+=2){x+=b.p[i];z+=b.p[i+1];n++}LMK.push({x:x/n,z:z/n,n:T("Templo Zojoji"),c:"#e2553f"})}
 LMK.push({x:MGT.x,z:MGT.z,n:T("Torre Kurogane"),c:"#ff2a32"});
 const ft=MAP.buildings.find(b=>b.k===2);if(ft)LMK.push({x:TX,z:TZ+34,n:"FootTown",c:"#f2f2ef",s:1});
 if(DEALER)LMK.push({x:DEALER.bx,z:DEALER.bz,n:T("🎨 Concesionario"),c:"#29d3ff"});
 const big=MAP.green.filter(g=>g.k!==2).map(g=>{let a=0,x=0,z=0;const R=g.p;for(let i=0;i<R.length;i+=2){x+=R[i];z+=R[i+1]}const n=R.length/2;for(let i=0,j=R.length-2;i<R.length;j=i,i+=2)a+=R[j]*R[i+1]-R[i]*R[j+1];return{x:x/n,z:z/n,a:Math.abs(a)/2}}).filter(g=>g.a>20000).sort((a,b)=>b.a-a.a).slice(0,4);
 for(const g of big)if(!LMK.some(l=>Math.hypot(l.x-g.x,l.z-g.z)<150))LMK.push({x:g.x,z:g.z,n:T("Parque"),c:"#8fd18a",s:1});return LMK}
function drawMap(){const S=mapS(),[ox,oz]=mapO();mx.setTransform(1,0,0,1,0,0);mx.fillStyle="#1c1f26";mx.fillRect(0,0,640,640);
 mx.setTransform(S,0,0,S,-ox*S,-oz*S);if(mapImg)mx.drawImage(mapImg,0,0);mx.setTransform(1,0,0,1,0,0);
 const P=(x,z)=>[(x-ox)*S,(z-oz)*S];mx.textAlign="center";mx.textBaseline="bottom";
 // Calles sin salida: cuadradito azul con la "T" blanca de la señal (行き止まり) en el final y punto azul en la señal de la entrada
 for(const d of DEADM){const[x,y]=P(d.x,d.z);if(x<-10||y<-10||x>650||y>650)continue;mx.fillStyle=d.c;mx.strokeStyle="#fff";mx.lineWidth=1.5;
  if(d.dead===1){const r=4+Math.min(3,mapV.z);mx.fillRect(x-r,y-r,r*2,r*2);mx.strokeRect(x-r,y-r,r*2,r*2);mx.fillStyle="#fff";mx.fillRect(x-r*.6,y-r*.6,r*1.2,r*.35);mx.fillRect(x-r*.17,y-r*.6,r*.34,r*1.2)}
  else{mx.beginPath();mx.arc(x,y,2.5+mapV.z*.4,0,7);mx.fill();mx.stroke()}}
 // Lugares: un círculo de su color; el nombre solo aparece al pasar el ratón por encima (o al tocarlo en el móvil)
 for(const l of landmarks()||[]){if(l.n.includes("🎨"))continue;const[x,y]=P(l.x,l.z);mx.fillStyle=l.c;mx.strokeStyle="#fff";mx.lineWidth=2;mx.beginPath();mx.arc(x,y,l.s?6:8,0,7);mx.fill();mx.stroke()}
 if(mHov){const[x,y]=P(mHov.x,mHov.z);mx.font="600 13px system-ui";const w=mx.measureText(mHov.n).width+14;mx.fillStyle="rgba(0,0,0,.8)";mx.fillRect(x-w/2,y-36,w,22);mx.fillStyle=mHov.c;mx.textBaseline="middle";mx.fillText(mHov.n,x,y-25);mx.textBaseline="bottom"}
 // Concesionario: círculo azul con 🎨
 if(DEALER){const[x,y]=P(DEALER.bx,DEALER.bz);mx.fillStyle="#29d3ff";mx.strokeStyle="#fff";mx.lineWidth=3;mx.beginPath();mx.arc(x,y,12,0,7);mx.fill();mx.stroke();mx.font="14px system-ui";mx.textBaseline="middle";mx.fillText("🎨",x,y+1);mx.textBaseline="bottom"}
 // Tu coche (cochecito de su color) y, si has elegido otro sitio, la marca de donde aparecerás
 if(spawned){const[x,y]=P(px,pz);carIcon(mx,x,y,PI-h,1.1)}
 if(pend){const[x,y]=P(pend.x,pend.z),[x2,y2]=P(pend.x+Math.sin(pend.h)*40,pend.z+Math.cos(pend.h)*40);mx.fillStyle="#fff";mx.strokeStyle="#e5173f";mx.lineWidth=3;mx.beginPath();mx.arc(x,y,7,0,7);mx.fill();mx.stroke();
  mx.beginPath();mx.moveTo(x,y);mx.lineTo(x2,y2);mx.stroke()}}
// Arrastrar para mover el mapa (con el dedo o el ratón); la rueda o el pellizco hacen zoom
let mDrag=null,mMoved=false,mHov=null;const mPts=new Map();
// Lugar bajo el puntero (a menos de 14 px en pantalla)
function mapHit(e){const r=mp.getBoundingClientRect(),S=mapS(),[ox,oz]=mapO(),k=640/r.width,sx=(e.clientX-r.left)*k,sy=(e.clientY-r.top)*k;let best=null,bd=14;
 for(const l of(landmarks()||[]).concat(DEADM)){const d=Math.hypot((l.x-ox)*S-sx,(l.z-oz)*S-sy)+(l.dead?4:0);if(d<bd){bd=d;best=l}}return best}
mp.addEventListener("mousemove",e=>{if(mPts.size)return;const l=mapHit(e);if(l!==mHov){mHov=l;drawMap()}});
mp.addEventListener("mouseleave",()=>{if(mHov){mHov=null;drawMap()}});
const mWorld=e=>{const r=mp.getBoundingClientRect(),S=mapS(),[ox,oz]=mapO();return[ox+(e.clientX-r.left)/r.width*640/S,oz+(e.clientY-r.top)/r.height*640/S]};
mp.addEventListener("pointerdown",e=>{mPts.set(e.pointerId,[e.clientX,e.clientY]);mDrag=[e.clientX,e.clientY];mMoved=false;mp.setPointerCapture(e.pointerId)});
mp.addEventListener("pointermove",e=>{if(!mPts.has(e.pointerId))return;const r=mp.getBoundingClientRect(),k=640/r.width/mapS();
 if(mPts.size===2){const[a,b]=[...mPts.values()],d0=Math.hypot(a[0]-b[0],a[1]-b[1]);mPts.set(e.pointerId,[e.clientX,e.clientY]);const[c,d]=[...mPts.values()],d1=Math.hypot(c[0]-d[0],c[1]-d[1]);
  if(d0>0){mapV.z=Math.max(1,Math.min(8,mapV.z*d1/d0));mapClamp();drawMap()}mMoved=true;return}
 mPts.set(e.pointerId,[e.clientX,e.clientY]);const dx=e.clientX-mDrag[0],dy=e.clientY-mDrag[1];if(Math.abs(dx)+Math.abs(dy)>4)mMoved=true;
 if(mMoved&&mapV.z>1){mapV.x-=dx*k;mapV.z0-=dy*k;mapClamp();drawMap()}mDrag=[e.clientX,e.clientY]});
const mUp=e=>{mPts.delete(e.pointerId)};mp.addEventListener("pointerup",mUp);mp.addEventListener("pointercancel",mUp);
mp.addEventListener("wheel",e=>{e.preventDefault();const[x,z]=mWorld(e);mapZoom(-Math.sign(e.deltaY),x,z)},{passive:false});
// Clic en el mapa: aparece en la calle más cercana; otro clic en el mismo sitio cambia el sentido
mp.onclick=e=>{if(!ready||mMoved)return;if(MOBILE){const l=mapHit(e);if(l){mHov=l;drawMap();return}}const[x,z]=mWorld(e),same=pend&&Math.hypot(pend.cx-x,pend.cz-z)<15/mapV.z;
 const fl=same?!pend.f:false;pend=nearestRoad(x,z,fl);pend.cx=x;pend.cz=z;pend.f=fl;$("ok").disabled=false;drawMap()};
$("ok").onclick=()=>{if(!pend)return;spawnAt(pend);spawned=true;resume()};
$("cancel").onclick=()=>spawned?resume():show("cars");
