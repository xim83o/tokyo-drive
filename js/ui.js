// Menús: selección de coche y mapa para reaparecer
const CAT=["Urbano","Deportivo","Superdeportivo","Drift"],HUDS=MOBILE?["mini","hud"]:["mini","hud","help"];
function spawnC(){const k=6+Math.floor(Math.random()*5),a=600+Math.random()*400,s=Math.random()<.5?1:-1;
 if(Math.random()<.5){h=s>0?0:PI;px=k*C+4.5*Math.cos(h);pz=a}else{h=s>0?PI/2:-PI/2;pz=k*C-4.5*Math.sin(h);px=a}
 camH=h;vx=vz=0}
CARS.forEach((c,i)=>{const d=document.createElement("button");d.className="cd";const t=t100(c);
 d.innerHTML=`<div class="sw" style="background:#${c.c.toString(16).padStart(6,"0")}"></div><b>${c.n}</b><small>Máx. ${Math.round(c.vm*3.6)} km/h · 0-100 en ${t.toFixed(1)} s</small><div class="bar"><u style="width:${Math.min(1,2.2/t)*100}%"></u></div><small>Aceleración</small>`;
 d.onclick=()=>{buildCar(i);goFull();if(!spawned){spawnC();spawned=true}resume()};d.dataset.cat=CAT[i];$("cards").appendChild(d)});
const tb=$("tabs");tb.style.cssText="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:12px";
["Todos",...CAT].forEach(n=>{const b=document.createElement("button");b.textContent=n;b.style.cssText="padding:6px 14px;border:0;border-radius:16px;font:600 13px system-ui;cursor:pointer;color:inherit;background:rgba(128,128,128,.25)";
 b.onclick=()=>{for(const x of tb.children){x.style.background="rgba(128,128,128,.25)";x.style.color="inherit"}b.style.background="var(--ac)";b.style.color="#fff";for(const c of $("cards").children)c.hidden=n!=="Todos"&&c.dataset.cat!==n};tb.appendChild(b)});tb.firstChild.click();
function show(w){state=w;$("ov").hidden=false;$("carsP").hidden=w!=="cars";$("mapP").hidden=w!=="map";if(w==="map"){pend=null;$("ok").disabled=true;drawMap()}
 for(const e of HUDS)$(e).hidden=true;$("touch").hidden=true}
function resume(){state="play";$("ov").hidden=true;for(const e of HUDS)$(e).hidden=false;$("touch").hidden=!MOBILE}
const mp=$("mp"),mx=mp.getContext("2d"),S=640/W;
function drawMap(){mx.fillStyle="#1c1f26";mx.fillRect(0,0,640,640);
 for(let i=0;i<N;i++)for(let j=0;j<N;j++){mx.fillStyle=park[i*N+j]?"#2f6b3a":"#4a5062";mx.fillRect((i*C+10)*S,(j*C+10)*S,80*S,80*S)}
 mx.fillStyle="#e5173f";mx.beginPath();mx.moveTo(TX*S,(TZ-14)*S);mx.lineTo((TX+12)*S,(TZ+10)*S);mx.lineTo((TX-12)*S,(TZ+10)*S);mx.fill();
 const q=pend||(spawned?{x:px,z:pz,h}:null);
 if(q){mx.fillStyle="#fff";mx.strokeStyle="#e5173f";mx.lineWidth=3;mx.beginPath();mx.arc(q.x*S,q.z*S,8,0,7);mx.fill();mx.stroke()}}
mp.onclick=e=>{const r=mp.getBoundingClientRect();let x=(e.clientX-r.left)/r.width*W,z=(e.clientY-r.top)/r.height*W;
 const ax=Math.round(x/C)*C,az=Math.round(z/C)*C,cl=v=>Math.max(10,Math.min(W-10,v));
 pend=Math.abs(x-ax)<Math.abs(z-az)?{x:cl(ax),z:cl(z),h:0}:{x:cl(x),z:cl(az),h:PI/2};
 $("ok").disabled=false;drawMap()};
$("ok").onclick=()=>{if(!pend)return;px=pend.x;pz=pend.z;h=camH=pend.h;vx=vz=0;spawned=true;resume()};
$("cancel").onclick=()=>spawned?resume():show("cars");
