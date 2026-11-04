// Menús: selección de coche y mapa para reaparecer
const CAT=["Urbano","Deportivo","Superdeportivo","Drift"],HUDS=MOBILE?["mini","hud"]:["mini","hud","help"];
// Punto de la calzada más cercano a (x,z), en el carril izquierdo (en Japón se circula por la izquierda)
function nearestRoad(x,z,flip){let best=0,bd=1e18;for(let k=0;k<RSG.length;k+=6){const d=segD2(x,z,RSG[k],RSG[k+1],RSG[k+2],RSG[k+3]);if(d<bd){bd=d;best=k}}
 segD2(x,z,RSG[best],RSG[best+1],RSG[best+2],RSG[best+3]);const r=MAP.roads[RSG[best+5]],hw=RSG[best+4];let ux=RSG[best+2]-RSG[best],uz=RSG[best+3]-RSG[best+1];const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l;
 if(!r.o&&flip){ux=-ux;uz=-uz}const off=r.o?Math.max(0,hw-1.9):hw/2;return{x:_cx+uz*off,z:_cz-ux*off,h:Math.atan2(ux,uz)}}
function spawnAt(q){px=q.x;pz=q.z;h=camH=q.h;vx=vz=0;bodyY=bodyV=0;WY.fill(0)}
function spawnC(){const a=Math.random()*PI*2,r=150+Math.random()*350;spawnAt(nearestRoad(TX+Math.sin(a)*r,TZ+Math.cos(a)*r,Math.random()<.5))}
const ld=document.createElement("p");ld.dataset.i18n="Cargando el mapa de Tokio…";ld.textContent=T(ld.dataset.i18n);$("carsP").insertBefore(ld,$("tabs"));
const tb=$("tabs");tb.style.cssText="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px";
// Fichas de coche y pestañas de categoría (se rehacen al cambiar de idioma)
function buildCards(){$("cards").innerHTML="";tb.innerHTML="";
 CARS.forEach((c,i)=>{const d=document.createElement("button");d.className="cd";const t=t100(c),U=ENV.units==="mph",v=Math.round(c.vm*3.6*(U?.6214:1));
  d.innerHTML=`<div class="sw" style="background:#${c.c.toString(16).padStart(6,"0")}"></div><b>${c.n}</b><small>${T("Máx.")} ${v} ${U?"mph":"km/h"} · ${T("0-100 en")} ${t.toFixed(1)} s</small><div class="bar"><u style="width:${Math.min(1,2.2/t)*100}%"></u></div><small>${T("Aceleración")}</small>`;
  d.onclick=()=>{if(!ready)return;buildCar(i);goFull();if(!spawned){spawnC();spawned=true}resume()};d.dataset.cat=CAT[i];$("cards").appendChild(d)});
 ["Todos",...CAT].forEach(n=>{const b=document.createElement("button");b.textContent=T(n);b.style.cssText="padding:6px 14px;border:0;border-radius:16px;font:600 13px system-ui;cursor:pointer;color:inherit;background:rgba(128,128,128,.25)";
  b.onclick=()=>{for(const x of tb.children){x.style.background="rgba(128,128,128,.25)";x.style.color="inherit"}b.style.background="var(--ac)";b.style.color="#fff";for(const c of $("cards").children)c.hidden=n!=="Todos"&&c.dataset.cat!==n};tb.appendChild(b)});tb.firstChild.click()}
buildCards();applyI18n();
function show(w){state=w;$("ov").hidden=false;$("carsP").hidden=w!=="cars";$("mapP").hidden=w!=="map";$("setP").hidden=true;$("livP").hidden=true;$("ov").classList.remove("liv");if(w==="map"){pend=null;$("ok").disabled=true;mapV={z:1,x:W/2,z0:W/2};drawMap()}
 hudVis(false);$("touch").hidden=true}
function resume(){state="play";$("ov").hidden=true;hudVis(true);$("touch").hidden=!MOBILE}
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
