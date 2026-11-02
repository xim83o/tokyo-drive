// Menús: selección de coche y mapa para reaparecer
const CAT=["Urbano","Deportivo","Superdeportivo","Drift"],HUDS=MOBILE?["mini","hud"]:["mini","hud","help"];
// Punto de la calzada más cercano a (x,z), en el carril izquierdo (en Japón se circula por la izquierda)
function nearestRoad(x,z,flip){let best=0,bd=1e18;for(let k=0;k<RSG.length;k+=6){const d=segD2(x,z,RSG[k],RSG[k+1],RSG[k+2],RSG[k+3]);if(d<bd){bd=d;best=k}}
 segD2(x,z,RSG[best],RSG[best+1],RSG[best+2],RSG[best+3]);const r=MAP.roads[RSG[best+5]],hw=RSG[best+4];let ux=RSG[best+2]-RSG[best],uz=RSG[best+3]-RSG[best+1];const l=Math.hypot(ux,uz)||1;ux/=l;uz/=l;
 if(!r.o&&flip){ux=-ux;uz=-uz}const off=r.o?Math.max(0,hw-1.9):hw/2;return{x:_cx+uz*off,z:_cz-ux*off,h:Math.atan2(ux,uz)}}
function spawnAt(q){px=q.x;pz=q.z;h=camH=q.h;vx=vz=0;bodyY=bodyV=0;WY.fill(0)}
function spawnC(){const a=Math.random()*PI*2,r=150+Math.random()*350;spawnAt(nearestRoad(TX+Math.sin(a)*r,TZ+Math.cos(a)*r,Math.random()<.5))}
const ld=document.createElement("p");ld.textContent="Cargando el mapa de Tokio…";$("carsP").insertBefore(ld,$("tabs"));
CARS.forEach((c,i)=>{const d=document.createElement("button");d.className="cd";const t=t100(c);
 d.innerHTML=`<div class="sw" style="background:#${c.c.toString(16).padStart(6,"0")}"></div><b>${c.n}</b><small>Máx. ${Math.round(c.vm*3.6)} km/h · 0-100 en ${t.toFixed(1)} s</small><div class="bar"><u style="width:${Math.min(1,2.2/t)*100}%"></u></div><small>Aceleración</small>`;
 d.onclick=()=>{if(!ready)return;buildCar(i);goFull();if(!spawned){spawnC();spawned=true}resume()};d.dataset.cat=CAT[i];$("cards").appendChild(d)});
const tb=$("tabs");tb.style.cssText="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px";
["Todos",...CAT].forEach(n=>{const b=document.createElement("button");b.textContent=n;b.style.cssText="padding:6px 14px;border:0;border-radius:16px;font:600 13px system-ui;cursor:pointer;color:inherit;background:rgba(128,128,128,.25)";
 b.onclick=()=>{for(const x of tb.children){x.style.background="rgba(128,128,128,.25)";x.style.color="inherit"}b.style.background="var(--ac)";b.style.color="#fff";for(const c of $("cards").children)c.hidden=n!=="Todos"&&c.dataset.cat!==n};tb.appendChild(b)});tb.firstChild.click();
function show(w){state=w;$("ov").hidden=false;$("carsP").hidden=w!=="cars";$("mapP").hidden=w!=="map";if(w==="map"){pend=null;$("ok").disabled=true;drawMap()}
 for(const e of HUDS)$(e).hidden=true;$("touch").hidden=true}
function resume(){state="play";$("ov").hidden=true;for(const e of HUDS)$(e).hidden=false;$("touch").hidden=!MOBILE}
const mp=$("mp"),mx=mp.getContext("2d");
function drawMap(){const S=640/W;mx.fillStyle="#1c1f26";mx.fillRect(0,0,640,640);if(mapImg)mx.drawImage(mapImg,0,0,640,640);
 const q=pend||(spawned?{x:px,z:pz,h}:null);
 if(q){mx.fillStyle="#fff";mx.strokeStyle="#e5173f";mx.lineWidth=3;mx.beginPath();mx.arc(q.x*S,q.z*S,7,0,7);mx.fill();mx.stroke();
  mx.beginPath();mx.moveTo(q.x*S,q.z*S);mx.lineTo((q.x+Math.sin(q.h)*40)*S,(q.z+Math.cos(q.h)*40)*S);mx.stroke()}}
// Clic en el mapa: aparece en la calle más cercana; otro clic en el mismo sitio cambia el sentido
mp.onclick=e=>{if(!ready)return;const r=mp.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,z=(e.clientY-r.top)/r.height*W,same=pend&&Math.hypot(pend.cx-x,pend.cz-z)<15;
 const fl=same?!pend.f:false;pend=nearestRoad(x,z,fl);pend.cx=x;pend.cz=z;pend.f=fl;$("ok").disabled=false;drawMap()};
$("ok").onclick=()=>{if(!pend)return;spawnAt(pend);spawned=true;resume()};
$("cancel").onclick=()=>spawned?resume():show("cars");
