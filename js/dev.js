// Herramientas de desarrollador (solo al jugar en este PC con jugar.bat, es decir en localhost; en el enlace del móvil y en Netlify
// no aparecen): modo espectador, vista de la ciudad a cámara rápida con contadores, prueba automática del tráfico y simulador de
// situaciones en un cruce (eliges los coches, de dónde vienen y qué hacen, y se recrea)
const DEV=["localhost","127.0.0.1","[::1]"].includes(location.hostname);
const DV={spd:1,scn:null,stuck:new Map(),t:0,keep:null};
function devHud(html){let e=$("devHud");if(!e){e=document.createElement("div");e.id="devHud";document.body.appendChild(e)}e.hidden=!html;if(html)e.innerHTML=html}
function devSave(){DV.keep={px,pz,h}}
function devBack(){devHud("");SCN=null;DV.scn=null;if(DV.keep){px=DV.keep.px;pz=DV.keep.pz;h=DV.keep.h;DV.keep=null}for(const n of NPC){npcRst(n);n.lane=null}resume()}
// --- Capturas para Claude (tecla P): foto del juego + nota escrita + dónde estás y qué ajustes tienes. El servidor de jugar.bat
// las guarda en la carpeta "capturas" del juego, y Claude las lee de ahí. El juego se queda en pausa mientras escribes la nota
function devShot(){if(DV.pause)return;renderFrame();let png;try{png=rd.domElement.toDataURL("image/png")}catch(e){return}DV.pause=true;
 const r=v=>Math.round(v*100)/100,E={...ENV};delete E.keys;
 const info={fecha:new Date().toLocaleString("es-ES"),pantalla:state,coche:cur&&cur.n,cocheN:carK,posicion:{x:r(px),z:r(pz),rumbo:r(h)},camara:{modo:mode,x:r(cam.position.x),y:r(cam.position.y),z:r(cam.position.z)},
  hora:r(HOUR),estacion:SEASON,trafico:npcLvl,calidad:QUAL[qLevel()].n,ventana:[innerWidth,innerHeight],ajustes:E};
 if(state==="liv")info.calcomanias=LIV[carK];if(state==="spec")info.espectador={x:r(SPEC.x),y:r(SPEC.y),z:r(SPEC.z),giro:r(SPEC.a),inclinacion:r(SPEC.p)};
 {const d=cam.getWorldDirection(new THREE.Vector3());info.camara.mira=[r(d.x),r(d.y),r(d.z)]}
 let d=$("devShot");if(!d){d=document.createElement("div");d.id="devShot";document.body.appendChild(d)}d.hidden=false;
 d.innerHTML=`<b>Captura para Claude</b><img src="${png}"><textarea placeholder="¿Qué está mal? (opcional)"></textarea><div><button class="go">Enviar</button><button>Cancelar</button></div><p></p>`;
 const ta=d.querySelector("textarea"),msg=d.querySelector("p"),bs=d.querySelectorAll("button");ta.focus();
 const close=()=>{d.hidden=true;DV.pause=false;for(const k in keys)keys[k]=0;last=performance.now()};
 const send=()=>{bs[0].disabled=true;msg.textContent="Enviando…";fetch("/captura",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({png,nota:ta.value,info})})
  .then(x=>x.ok?x.json():Promise.reject(x.status)).then(j=>{msg.textContent="Guardada: capturas/"+j.nombre+".png";setTimeout(close,900)})
  .catch(e=>{bs[0].disabled=false;msg.textContent="No se ha podido guardar ("+e+"). ¿Has abierto el juego con jugar.bat?"})};
 bs[0].onclick=send;bs[1].onclick=close;ta.onkeydown=e=>{e.stopPropagation();if(e.key==="Escape")close();else if(e.key==="Enter"&&(e.ctrlKey||e.metaKey))send()}}
// --- Vista de la ciudad: cámara desde arriba alrededor de tu coche, tráfico a x1-x10 y contadores ---
function startCity(){closeSettings();devSave();state="devcity";$("ov").hidden=true;hudVis(false);DV.spd=1;DV.stuck.clear();DV.t=0;DV.ov=DV.pr=0;devCityHud()}
function devCityHud(){devHud(`<b>Vista de la ciudad</b> · velocidad ${[1,2,5,10].map(s=>`<button onclick="DV.spd=${s};devCityHud()" class="${DV.spd===s?"on":""}">x${s}</button>`).join("")}
 <button onclick="devBack()">Salir</button><div id="devCnt"></div>`)}
// Solapes en %: de cada 100 parejas de coches a menos de 8 m, cuántas se meten una dentro de otra (ahora y acumulado desde que se abrió)
function devCityTick(dt){const st=Math.max(1,DV.spd);for(let i=0;i<st;i++){npcs(dt);DV.t+=dt}const cnt=NCNT[npcLvl];let mv=0,stop=0,stk=0,ov=0,pr=0;
 for(let k=0;k<cnt;k++){const n=NPC[k];if(!n.lane)continue;if(n.v>1)mv++;else stop++;const s=n.v<.3?(DV.stuck.get(n)||0)+dt*st:0;DV.stuck.set(n,s);if(s>40)stk++;
  for(let q=k+1;q<cnt;q++){const o=NPC[q];if(!o.lane||n.mode||o.mode||(o.x-n.x)**2+(o.z-n.z)**2>64)continue;pr++;const b=boxHit(n.x,n.z,n.h,n.w||1.8,n.l,o.x,o.z,o.h,o.w||1.8,o.l);if(b&&b.p>.4)ov++}}
 DV.ov=(DV.ov||0)+ov;DV.pr=(DV.pr||0)+pr;const pc=v=>v.toFixed(1)+" %",now=pr?ov/pr*100:0,tot=DV.pr?DV.ov/DV.pr*100:0;
 const c=$("devCnt");if(c)c.innerHTML=`Tiempo simulado ${DV.t|0} s · en marcha <b>${mv}</b> · parados ${stop} · atascados +40 s <b style="color:${stk?"#ff6b6b":"#7dff9a"}">${stk}</b> · solapes ahora <b style="color:${ov?"#ff6b6b":"#7dff9a"}">${pc(now)}</b> · en total <b style="color:${tot>1?"#ff6b6b":"#7dff9a"}">${pc(tot)}</b>`;
 cam.position.set(px,380,pz+60);cam.lookAt(px,0,pz);cam.fov=60;cam.updateProjectionMatrix();sc.fog.far=4000}
// --- Prueba automática con informe ---
function devTest(){const P=$("setP");P.innerHTML="<h1>Prueba automática</h1><p>Simulando 5 minutos de tráfico…</p>";setTimeout(()=>{devSave();const r=trafficTest(300);if(DV.keep){px=DV.keep.px;pz=DV.keep.pz;DV.keep=null}
 P.innerHTML=`<h1>Prueba automática</h1><table class="devT">${Object.entries(r).map(([k,v])=>`<tr><td>${k}</td><td><b>${v}</b></td></tr>`).join("")}</table>
 <p>Bien: atascados 0, cambios de sentido 0 y pocos solapes (son instantes al girar en los cruces).</p><button class="b" onclick="setTab='dev';drawSettings()">Volver</button>`},50)}
// --- Simulador de situaciones ---
// Cruce elegido (los más cercanos a tu coche, con o sin semáforo) y lista de coches: carril de llegada, maniobra, distancia y velocidad
function devNodes(){return GN.map((g,i)=>({g,i,d:Math.hypot(g.x-px,g.z-pz),n:g.inc.filter(L=>!L.internal).length})).filter(o=>o.n>=3&&o.d<350).sort((a,b)=>a.d-b.d).slice(0,12)}
function devScnUI(){const P=$("setP"),S=DV.scn||(DV.scn={ni:0,cars:[]}),nodes=devNodes();if(!nodes.length){P.innerHTML="<h1>Simulador</h1><p>No hay cruces cerca de tu coche.</p>";return}
 const nd=nodes[S.ni%nodes.length],g=nd.g,inc=g.inc.filter(L=>!L.internal);S.node=nd.i;
 const dir=L=>{const[x,z]=lanePos(L,Math.max(L.s0,L.s1-15));const a=Math.atan2(x-g.x,z-g.z);return["sur","sureste","este","noreste","norte","noroeste","oeste","suroeste"][((Math.round(a/(PI/4))%8)+8)%8]};
 P.innerHTML=`<h1>Simulador de situaciones</h1><p>Cruce ${S.ni%nodes.length+1} de ${nodes.length} · ${g.cl>=0?"con semáforo":"sin semáforo"} · ${inc.length} calles · a ${nd.d|0} m de tu coche
 <button class="b g" onclick="DV.scn.ni++;DV.scn.cars=[];devScnUI()">Otro cruce</button></p><div id="scnL"></div>
 <p>${inc.map((L,i)=>`<button class="b g" onclick="DV.scn.cars.push({l:${i},m:0,d:25,v:8});devScnUI()">+ coche desde el ${dir(L)}${L.t<=2?" (principal)":""}</button>`).join("")}</p>
 <button class="b" onclick="devPlay()">▶ Recrear</button><button class="b g" onclick="setTab='dev';drawSettings()">Volver</button>`;
 const box=$("scnL");S.cars.forEach((c,j)=>{const L=inc[c.l],outs=g.out.filter(q=>q!==L.rev),opts=outs.map(q=>{const a=ad(Math.atan2(q.p[2]-q.p[0],q.p[3]-q.p[1]),Math.atan2(L.p[L.p.length-2]-L.p[L.p.length-4],L.p[L.p.length-1]-L.p[L.p.length-3]));return Math.abs(a)<.5?"recto":a>0?"izquierda":"derecha"});
  const r=document.createElement("div");r.className="opt";r.innerHTML=`<span>Coche ${j+1} (${dir(L)})</span>`+opts.map((t,k)=>`<button class="${c.m===k?"on":""}" onclick="DV.scn.cars[${j}].m=${k};devScnUI()">${t}</button>`).join("")+
   ` <label>a <input type="number" value="${c.d}" min="5" max="80" style="width:52px" onchange="DV.scn.cars[${j}].d=+this.value"> m</label> <label>vel. <input type="number" value="${c.v*3.6|0}" min="0" max="80" style="width:52px" onchange="DV.scn.cars[${j}].v=this.value/3.6"> km/h</label> <button onclick="DV.scn.cars.splice(${j},1);devScnUI()">×</button>`;box.appendChild(r)})}
// Recrear: solo los coches de la situación (los demás se apartan), cámara desde arriba del cruce, x0,5-x5 y repetir
let SCN=null;
function devPlay(){const S=DV.scn,g=GN[S.node],inc=g.inc.filter(L=>!L.internal);if(!S.cars.length)return;closeSettings();if(!DV.keep)devSave();
 while(NPC.length<S.cars.length){const o=mkNpc();npcRst(o);sc.add(o.g);NPC.push(o)}
 for(const n of NPC){npcRst(n);n.lane=null;n.g.visible=false}SCN={g,cars:[],t:0,rep:S};px=g.x+150;pz=g.z+150;
 S.cars.forEach((c,j)=>{const L=inc[c.l],n=NPC[j];if(!n)return;npcRst(n);const outs=g.out.filter(q=>q!==L.rev);n.lane=L;n.s=Math.max(L.s0,L.s1-c.d);n.si=0;const[x,z,a]=lanePos(L,n.s);n.x=x;n.z=z;n.h=a;n.v=c.v;n.nx=outs[c.m]||outs[0];n._in=n._done=false;SCN.cars.push(n)});
 state="devscn";$("ov").hidden=true;hudVis(false);DV.spd=1;devScnHud()}
function devScnHud(){devHud(`<b>Situación</b> · velocidad ${[.5,1,2,5].map(s=>`<button onclick="DV.spd=${s};devScnHud()" class="${DV.spd===s?"on":""}">x${s}</button>`).join("")}
 <button onclick="devPlay()">↺ Repetir</button><button onclick="state='set';devBackToEditor()">Editar</button><button onclick="devBack()">Salir</button><div id="devCnt"></div>`)}
function devBackToEditor(){devHud("");SCN=null;openSettings();setTab="dev";devScnUI()}
function devScnTick(dt){const st=DV.spd,sub=st<1?1:st,d=dt*(st<1?st:1);for(let i=0;i<sub;i++){npcs(d);SCN.t+=d}let ov=0,inside=0,done=0,pr=0;
 const gi=GN.indexOf(SCN.g);for(const n of SCN.cars){n.g.visible=true;if(n.tr&&n.tr.node===gi){inside++;n._in=true}else if(n._in)n._done=true;if(n._done)done++}
 for(let a=0;a<SCN.cars.length;a++)for(let b=a+1;b<SCN.cars.length;b++){const n=SCN.cars[a],o=SCN.cars[b];if((o.x-n.x)**2+(o.z-n.z)**2>64)continue;pr++;const h2=boxHit(n.x,n.z,n.h,n.w||1.8,n.l,o.x,o.z,o.h,o.w||1.8,o.l);if(h2&&h2.p>.4)ov++}
 SCN.ov=(SCN.ov||0)+ov;SCN.pr=(SCN.pr||0)+pr;const sp=SCN.pr?SCN.ov/SCN.pr*100:0;
 const c=$("devCnt");if(c)c.innerHTML=`${SCN.t.toFixed(1)} s · cruzando ${inside} · ya han cruzado <b>${done}</b> de ${SCN.cars.length} · solapes <b style="color:${sp?"#ff6b6b":"#7dff9a"}">${sp.toFixed(1)} %</b>`+
  SCN.cars.map((n,i)=>` · ${i+1}: ${(n.v*3.6)|0} km/h`).join("");
 cam.position.set(SCN.g.x,55,SCN.g.z+20);cam.lookAt(SCN.g.x,0,SCN.g.z);cam.fov=60;cam.updateProjectionMatrix();sc.fog.far=FOGF}
