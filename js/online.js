// En línea (Supabase): cuenta con correo y contraseña, partidas en la nube y salas multijugador.
// La clave de aquí es la pública, pensada para ir en el juego: quien protege los datos son las reglas de la tabla (tools/supabase.sql).
// Salas: no necesitan cuenta. Todo va por Realtime (sin tablas):
//  · Vestíbulo (canal "td-lobby", presencia): cada creador de sala anuncia su sala (nombre, si tiene contraseña y cuántos jugadores hay) y así sale en la lista.
//  · Sala (canal "room-CÓDIGO", broadcast): al entrar se pide permiso al creador, que comprueba la contraseña y si cabe. La contraseña no se guarda en ningún sitio
//    ni se anuncia: solo viaja en esa petición. Luego cada jugador envía su posición unas 6 veces por segundo y su decoración (pintura, capas e imágenes) al cambiar.
//  · Carreras de sala: las elige el creador y salen todos a la vez. Quien llega espera viendo a los que faltan y al final sale la clasificación.
// Tráfico, hora y clima son los de cada uno. Los coches de los demás chocan: cada uno calcula el golpe contra la posición que recibe de los otros
const SB_URL="https://hjbkgfbjrtfenkqaldyl.supabase.co",SB_KEY="sb_publishable_aoPfbh6c8oD3YruCoG-moA_JD8tZlLN",ONL_MAX=6;
const ONL={sb:null,user:null,msg:"",ch:null,code:"",id:Math.random().toString(36).slice(2,10),peers:new Map(),sendT:0,saveT:0,last:"",name:"",
 lobby:null,rooms:[],host:false,ok:false,room:null,hostId:"",livT:0,livK:"",mp:null,watch:null,wait:null};
try{ONL.name=localStorage.getItem("td-name")||""}catch(e){}
function onlSb(){if(ONL.sb)return ONL.sb;if(!window.supabase)return null;ONL.sb=window.supabase.createClient(SB_URL,SB_KEY);ONL.sb.auth.onAuthStateChange((e,s)=>{ONL.user=s&&s.user||null;if(state==="onl")onlDraw()});return ONL.sb}
const onlSnap=()=>({v:1,liv:LIV,gar:GAR,race:rStore(),stk:CUS});
async function onlPush(){const sb=onlSb();if(!sb||!ONL.user)return;const data=onlSnap(),{error}=await sb.from("saves").upsert({user_id:ONL.user.id,data,updated_at:new Date().toISOString()});if(error)throw error;ONL.last=JSON.stringify(data)}
async function onlPull(){const sb=onlSb(),{data,error}=await sb.from("saves").select("data").eq("user_id",ONL.user.id).maybeSingle();if(error)throw error;if(!data)return false;const d=data.data;
 localStorage.setItem("td-liv",JSON.stringify(d.liv||[]));localStorage.setItem("td-gar",JSON.stringify(d.gar||[]));localStorage.setItem("td-race",JSON.stringify(d.race||{}));localStorage.setItem("td-stk",JSON.stringify(d.stk||[]));location.reload();return true}
function onlOpen(){state="onl";onlSb();onlLobby();$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=$("raceP").hidden=$("garP").hidden=true;$("onlP").hidden=false;hudVis(false);$("touch").hidden=true;onlDraw()}
function onlMsg(t){ONL.msg=t;if(state==="onl")onlDraw()}
// Cerrar el panel: sin sala, al menú principal; dentro de una sala, a conducir (o a elegir coche si aún no hay)
function onlClose(){if(!ONL.ch&&!ONL.wait)mainMenu();else if(spawned)resume();else show("cars")}
// Menú principal: la pantalla del principio («Un jugador» / «Multijugador») con la ciudad girando detrás. El coche se queda donde estaba
function mainMenu(msg){if(state==="set"){rebind=null;$("setP").hidden=true;saveEnv()}MENUB=false;$("radP").hidden=true;if(RACE.on){raceAbort();rQuitMp()}if(state==="watch")onlWatchEnd();for(const k of["ov","rcBar","raceH","rcC"])$(k).hidden=true;hudVis(false);$("touch").hidden=true;state="menu";
 const e=$("lds");e.hidden=false;e.classList.remove("off");e.classList.add("menu");LDS.done=false;LDS.picked=true;LDS.menu=true;$("ldsGo").hidden=true;$("ldsM").hidden=false;$("ldsC").textContent=msg?T(msg):"";$("ldsS").focus()}
function onlDraw(){const P=$("onlP");P.innerHTML="";const add=(tag,txt,cl,to)=>{const e=document.createElement(tag);if(txt)e.textContent=T(txt);if(cl)e.className=cl;(to||P).appendChild(e);return e},btn=(t,f,g,to)=>{const b=add("button",t,g?"b g":"b",to);b.onclick=f;return b},inp=(type,ph,v,to)=>{const i=add("input",null,"onlI",to);i.type=type;i.placeholder=T(ph);i.value=v||"";return i};
 add("h1","Multijugador");if(!window.supabase){add("p","No se pudo conectar con el servicio en línea desde esta página.");btn("Cerrar",onlClose,1);return}
 // Al entrar, primero el nombre (obligatorio, de 2 a 14 letras): es el que ven los demás encima del coche, en la lista y en el mapa
 if(!ONL.ch&&!ONL.wait&&!ONL.nameOk){add("p","Antes de entrar, ponte un nombre: es el que verán los demás.");const n=inp("text","Tu nombre",ONL.name);n.maxLength=14;const go=()=>{const v=n.value.trim();if(v.length<2){onlMsg("El nombre tiene que tener al menos 2 letras.");return}ONL.name=v;ONL.nameOk=true;try{localStorage.setItem("td-name",v)}catch(e){}ONL.msg="";onlDraw()};
  n.onkeydown=e=>{e.stopPropagation();if(e.key==="Enter")go()};btn("Continuar",go);if(ONL.msg)add("p",ONL.msg,"onlM");btn("Cerrar",onlClose,1);setTimeout(()=>n.focus(),50);return}
 if(ONL.ch){const R=ONL.room||{};const p=add("p");p.innerHTML=`<b style="font-size:22px">${esc(R.name||"")}</b>${R.pw?" 🔒":""}<br>${T(ONL.host?"Eres el creador de la sala: tú eliges las carreras.":"Las carreras las elige quien creó la sala.")}`;
  const ul=add("ul","","onlL");const me=add("li","",null,ul);me.textContent="🚗 "+(ONL.name||"?")+" ("+T("tú")+")";for(const[id,q]of ONL.peers){const li=add("li","",null,ul);li.textContent=(id===ONL.hostId?"👑 ":"🚗 ")+(q.n||T("Jugador"))}
  add("p",`${T("Jugadores")}: ${ONL.peers.size+1}/${(ONL.room&&ONL.room.max)||ONL_MAX}`);btn(ONL.host?"Cerrar la sala":"Salir de la sala",()=>{onlLeave();mainMenu()},1)}
 else if(ONL.wait)add("p","Esperando permiso para entrar…");
 else{const n=inp("text","Tu nombre",ONL.name);n.maxLength=14;n.oninput=()=>{const v=n.value.trim();if(v.length>=2){ONL.name=v;try{localStorage.setItem("td-name",v)}catch(e){}}};
  add("h3","Salas abiertas");if(!ONL.rooms.length)add("p",ONL.lobby?"No hay ninguna sala abierta. ¡Crea una!":"Buscando salas…");
  for(const r of ONL.rooms){const d=add("div","","rcRow"),i=add("div","",null,d);i.innerHTML=`<b>${esc(r.name)}</b>${r.pw?" 🔒":""}<small>${r.n}/${r.max||ONL_MAX} ${T("jugadores")}</small>`;let pw=null;if(r.pw){pw=inp("password","Contraseña","",d);pw.style.width="120px"}
   const b=btn("Entrar",()=>{if(!ONL.name){onlMsg("Escribe tu nombre.");return}onlEnter(r,pw?pw.value:"")},0,d);if(r.n>=(r.max||ONL_MAX)){b.disabled=true;b.textContent=T("Llena")}}
  add("h3","Crear una sala");const rn=inp("text","Nombre de la sala",ONL.name?ONL.name+" — Tokyo":"");rn.maxLength=24;const rp=inp("password","Contraseña (opcional)");rp.maxLength=20;
  // Máximo de jugadores que elige quien crea la sala (2 a 6)
  const mr=add("div","","opt");mr.innerHTML=`<span>${T("Jugadores máx.")}</span>`;let mx=ONL.maxSel||ONL_MAX;for(let v=2;v<=ONL_MAX;v++){const b=add("button",String(v),v===mx?"on":"",mr);b.onclick=()=>{mx=ONL.maxSel=v;for(const x of mr.querySelectorAll("button"))x.className="";b.className="on"}}
  btn("Crear sala",()=>{if(!ONL.name){onlMsg("Escribe tu nombre.");return}const nm=rn.value.trim();if(!nm){onlMsg("Ponle un nombre a la sala.");return}onlCreate(nm,rp.value,mx)})}
 if(ONL.msg)add("p",ONL.msg,"onlM");
 add("h3","Cuenta y partidas en la nube");if(ONL.user){const p=add("p");p.textContent=ONL.user.email;btn("Guardar en la nube",async()=>{try{await onlPush();onlMsg("Partida guardada.")}catch(e){onlMsg(e.message)}},1);btn("Cargar de la nube",async()=>{try{if(!await onlPull())onlMsg("Todavía no hay nada guardado.")}catch(e){onlMsg(e.message)}},1);btn("Cerrar sesión",async()=>{await ONL.sb.auth.signOut();ONL.user=null;onlMsg("")},1)}
 else{const em=inp("email","Correo"),pw=inp("password","Contraseña (6 letras o más)");const go=async f=>{try{const{error}=await f({email:em.value.trim(),password:pw.value});if(error)throw error;onlMsg("Listo.")}catch(e){onlMsg(e.message)}};btn("Entrar",()=>go(c=>ONL.sb.auth.signInWithPassword(c)),1);btn("Crear cuenta",()=>go(c=>ONL.sb.auth.signUp(c)),1)}
 btn("Cerrar",onlClose,1)}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
// --- Vestíbulo: lista de salas ---
// (con avisos: cada creador anuncia su sala cada 3 s y al instante si alguien pregunta; una sala que lleva 8 s sin anunciarse se quita de la lista)
const ROOMS=new Map();
function onlLobby(){const sb=onlSb();if(!sb||ONL.lobby)return;const ch=sb.channel("td-lobby",{config:{broadcast:{self:false}}});
 ch.on("broadcast",{event:"room"},m=>{const q=m.payload;if(!q||!q.code)return;if(q.off)ROOMS.delete(q.code);else ROOMS.set(q.code,Object.assign(q,{t:performance.now()}));onlRooms()}).on("broadcast",{event:"who"},()=>onlAnnounce());
 ch.subscribe(st=>{if(st==="SUBSCRIBED"){ONL.lobby=ch;ch.send({type:"broadcast",event:"who",payload:{}});onlAnnounce();if(state==="onl")onlDraw()}});setInterval(()=>{onlAnnounce();onlRooms()},3000)}
function onlRooms(){const now=performance.now();for(const[k,q]of ROOMS)if(now-q.t>8000)ROOMS.delete(k);const L=[...ROOMS.values()].filter(q=>!ONL.room||q.code!==ONL.room.code).sort((a,b)=>a.name.localeCompare(b.name)),s=JSON.stringify(L.map(q=>[q.code,q.name,q.n,q.pw]));if(s!==ONL.roomsK){ONL.roomsK=s;ONL.rooms=L;if(state==="onl")onlDraw()}}
function onlAnnounce(){if(!ONL.lobby)return;if(ONL.host&&ONL.ch&&ONL.room){ONL.annOn=true;ONL.lobby.send({type:"broadcast",event:"room",payload:{code:ONL.room.code,name:ONL.room.name,pw:!!ONL.room.pw,n:ONL.peers.size+1,max:ONL.room.max||ONL_MAX}})}else if(ONL.annOn&&ONL.lastCode){ONL.annOn=false;ONL.lobby.send({type:"broadcast",event:"room",payload:{code:ONL.lastCode,off:1}})}if(ONL.room)ONL.lastCode=ONL.room.code}
// --- Crear, entrar y salir ---
function onlCreate(name,pw,max){const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<5;i++)s+=A[Math.random()*A.length|0];onlLeave();ONL.host=true;ONL.hostId=ONL.id;ONL.room={code:s,name,pw,max:max||ONL_MAX};onlJoin(s,()=>{ONL.ok=true;onlAnnounce();onlLivSend();onlJoined()})}
function onlEnter(r,pw){onlLeave();ONL.host=false;ONL.room={code:r.code,name:r.name,pw:r.pw,max:r.max};ONL.wait=setTimeout(()=>{ONL.wait=null;onlLeave();onlMsg("La sala no responde.")},8000);
 onlJoin(r.code,()=>ONL.ch.send({type:"broadcast",event:"join",payload:{id:ONL.id,n:ONL.name,pw:pw||""}}));onlDraw()}
function onlJoined(){onlMsg("");if(!spawned)show("cars");else if(state==="onl")onlDraw()}
function onlJoin(code,ready){const sb=onlSb();if(!sb)return;ONL.code=code;const ch=sb.channel("room-"+code,{config:{broadcast:{self:false}}});
 ch.on("broadcast",{event:"p"},m=>peerMsg(m.payload)).on("broadcast",{event:"bye"},m=>{const q=m.payload;if(q.host&&!ONL.host){onlLeave();mainMenu("El creador ha cerrado la sala.")}else peerDel(q.id)})
  .on("broadcast",{event:"join"},m=>onlAsk(m.payload)).on("broadcast",{event:"acc"},m=>onlAcc(m.payload)).on("broadcast",{event:"liv"},m=>peerLiv(m.payload))
  .on("broadcast",{event:"race"},m=>onlRaceGo(m.payload)).on("broadcast",{event:"cfg"},m=>onlCfgGet(m.payload)).on("broadcast",{event:"fin"},m=>onlFin(m.payload));
 ch.subscribe(s=>{if(s==="SUBSCRIBED"){ONL.ch=ch;if(ready)ready()}else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT"){onlMsg("No se pudo conectar con la sala.")}})}
// El creador decide si entra: contraseña correcta y sitio libre
function onlAsk(q){if(!ONL.host||!q||!q.id)return;let ok=true,why="";if(ONL.room.pw&&q.pw!==ONL.room.pw){ok=false;why="Contraseña incorrecta."}else if(ONL.peers.size+1>=(ONL.room.max||ONL_MAX)){ok=false;why="La sala está llena."}
 ONL.ch.send({type:"broadcast",event:"acc",payload:{to:q.id,ok,why,host:ONL.id,name:ONL.room.name}});if(ok)setTimeout(onlLivSend,600)}
function onlAcc(q){if(!q||q.to!==ONL.id||!ONL.wait)return;clearTimeout(ONL.wait);ONL.wait=null;if(!q.ok){onlLeave();onlMsg(q.why||"No se pudo entrar.");return}ONL.ok=true;ONL.hostId=q.host;ONL.room.name=q.name;onlLivSend();onlJoined()}
function onlLeave(){onlCfgRestore();if(ONL.wait){clearTimeout(ONL.wait);ONL.wait=null}if(ONL.mp&&RACE.on)raceAbort();ONL.mp=null;if(state==="watch")onlWatchEnd();if(!ONL.ch&&!ONL.code){ONL.host=false;return}
 if(ONL.ch){ONL.ch.send({type:"broadcast",event:"bye",payload:{id:ONL.id,host:ONL.host}});ONL.sb.removeChannel(ONL.ch)}ONL.ch=null;ONL.code="";ONL.ok=false;const wasHost=ONL.host;ONL.host=false;ONL.room=null;if(wasHost)onlAnnounce();for(const id of[...ONL.peers.keys()])peerDel(id)}
addEventListener("beforeunload",onlLeave);
// --- Coches de los demás ---
function peerDel(id){const p=ONL.peers.get(id);if(p){sc.remove(p.g);ONL.peers.delete(id);if(ONL.host)onlAnnounce();if(ONL.mp)onlCheckEnd();if(ONL.watch===id)onlWatchNext();if(state==="onl")onlDraw()}}
function peerLabel(t){const tx=canvasTex(256,64,g=>{g.fillStyle="rgba(0,0,0,.55)";g.fillRect(0,8,256,48);g.fillStyle="#fff";g.font="bold 30px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(t,128,32,240)}),s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));s.scale.set(5,1.25,1);s.position.y=3;return s}
function peerMsg(m){if(!ONL.ch||!ONL.ok||!m||!m.id)return;let p=ONL.peers.get(m.id);if(!p){if(ONL.peers.size>=ONL_MAX-1)return;p={col:PCOL[ONL.peers.size%PCOL.length],g:new THREE.Group(),k:-1,c:-1,n:"",x:m.x,y:m.y,z:m.z,h:m.h,vx:0,vz:0,liv:null,img:[],dec:[]};p.g.position.set(m.x,m.y,m.z);p.g.rotation.order="YXZ";sc.add(p.g);ONL.peers.set(m.id,p);
  if(ONL.host)onlAnnounce();ONL.livNew=true;ONL.cfgNew=true;if(state==="onl")onlDraw()}   // (alguien nuevo: se le manda nuestra decoración)
 if(p.k!==m.k||p.c!==m.c||p.n!==m.n){p.k=m.k;p.c=m.c;p.n=m.n;peerBuild(p)}p.x=m.x;p.y=m.y;p.z=m.z;p.h=m.h;p.vx=m.vx||0;p.vz=m.vz||0;p.w=!!m.w;p.t=performance.now()}
// Modelo del compañero con su pintura y sus calcomanías (si ya llegaron)
function peerBuild(p){const c=CARS[p.k]||CARS[0],L=p.liv&&p.liv.k===p.k?p.liv.L:null;for(const m of p.dec)m.geometry.dispose();p.dec=[];while(p.g.children.length)p.g.remove(p.g.children[0]);p.body=null;p.wh=[];
 if(MODELS[c.f]){const m=modelInst(c.f,c.l,L&&L.c!==undefined?L.c:p.c,false,L?{tint:L.tint||0,gc:L.gc,bc:L.bc}:undefined);p.g.add(m.s);p.body=m.body;p.wh=m.wh;if(L)peerDecals(p,c,L)}p.g.add(peerLabel(p.n||T("Jugador")))}
// Se reutiliza applyDecals cambiando un momento el coche "actual" por el del compañero (y sus imágenes, que no se guardan en este navegador)
function peerDecals(p,c,L){if(!p.body||typeof applyDecals!=="function")return;const sv={car,carBody,carK,cur,DEC,LB,W:WHEELS.slice(),L:LIV[p.k]},add=p.img.filter(q=>!CUS.some(o=>o.id===q.id));
 try{car=p.g;carBody=p.body;carK=p.k;cur=c;DEC=[];WHEELS.length=0;for(const q of p.wh)WHEELS.push(q);LIV[p.k]=L;CUS.push(...add);applyDecals();p.dec=DEC}catch(e){console.warn(e)}
 finally{CUS=CUS.filter(q=>!add.includes(q));car=sv.car;carBody=sv.carBody;carK=sv.carK;cur=sv.cur;DEC=sv.DEC;LB=sv.LB;WHEELS.length=0;for(const q of sv.W)WHEELS.push(q);LIV[p.k]=sv.L}}
function peerLiv(q){if(!q||!q.id||!ONL.ok)return;const p=ONL.peers.get(q.id);if(!p){ONL.pendLiv=ONL.pendLiv||{};ONL.pendLiv[q.id]=q;return}p.liv=q;p.img=q.img||[];if(q.k===p.k)peerBuild(p)}
// Nuestra decoración: pintura, capas e imágenes propias (las imágenes enteras se reducen a 512 px para que el mensaje no sea muy grande)
async function onlLivSend(){if(!ONL.ch||!ONL.ok)return;const L=JSON.parse(JSON.stringify(LIV[carK]||{})),ids=new Set();for(const k of L.stk||[])if(k.ci!==undefined)ids.add(k.ci);if(L.wrap)ids.add(L.wrap.ci);
 const img=[];for(const id of ids){const c=CUS.find(q=>q.id===id);if(!c)continue;let url=c.url;if(c.wrap)url=await new Promise(ok=>{const im=new Image();im.onload=()=>{const cv=document.createElement("canvas");cv.width=cv.height=512;cv.getContext("2d").drawImage(im,0,0,512,512);let u=cv.toDataURL("image/webp",.75);if(!u.startsWith("data:image/webp"))u=cv.toDataURL("image/jpeg",.75);ok(u)};im.onerror=()=>ok(c.url);im.src=c.url});img.push({id,url,wrap:c.wrap,asp:c.asp})}
 let pl={id:ONL.id,k:carK,L,img};if(JSON.stringify(pl).length>200000)pl={id:ONL.id,k:carK,L:Object.assign(L,{wrap:undefined}),img:img.filter(q=>!q.wrap)};ONL.ch.send({type:"broadcast",event:"liv",payload:pl})}
// --- Choques con los coches de los demás: cada uno empuja su propio coche y los dos notan el golpe (choque entre dos coches iguales, con algo de rebote) ---
function peerHit(dt){if(!ONL.peers.size||state!=="play")return;const fx=Math.sin(h),fz=Math.cos(h),r=cur.w/2,d=cur.l/2-r;
 for(const p of ONL.peers.values()){if(!p.g.visible||p.w)continue;const G=p.g.position;if(Math.abs(G.y-bodyY)>1.5||Math.abs(G.x-px)>9||Math.abs(G.z-pz)>9)continue;const c=CARS[p.k]||CARS[0],ph=p.g.rotation.y,s=Math.sin(ph),co=Math.cos(ph),hl=c.l/2,hw=c.w/2;
  let nx=0,nz=0,dep=0;for(const o of[-d,0,d]){const X=px+fx*o-G.x,Z=pz+fz*o-G.z,u=X*co-Z*s,v=X*s+Z*co,cu=Math.max(-hw,Math.min(hw,u)),cv=Math.max(-hl,Math.min(hl,v)),du=u-cu,dv=v-cv,dd=Math.hypot(du,dv);
   if(dd<r){let ux,vz2,pen;if(dd>1e-4){ux=du/dd;vz2=dv/dd;pen=r-dd}else{const a=hw-Math.abs(u),b=hl-Math.abs(v);if(a<b){ux=Math.sign(u)||1;vz2=0;pen=a+r}else{ux=0;vz2=Math.sign(v)||1;pen=b+r}}
    const wx=ux*co+vz2*s,wz=-ux*s+vz2*co;if(pen>dep){dep=pen;nx=wx;nz=wz}}}
  if(!dep)continue;px+=nx*dep;pz+=nz*dep;const vn=vx*nx+vz*nz,un=p.vx*nx+p.vz*nz;if(vn<un){const vn2=(vn+un)/2+.35*(un-vn)/2;vx+=(vn2-vn)*nx;vz+=(vn2-vn)*nz;if(un-vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(un-vn)}}}}
// --- Carreras de sala ---
// El creador elige la carrera: todos salen a la vez, cada uno en su hueco de la parrilla (orden de la lista)
function onlRaceStart(R){const ids=[ONL.id,...[...ONL.peers.keys()].filter(id=>!ONL.peers.get(id).w)],q={rid:R.id,ids,rcT:ENV.rcT,rcS:ENV.rcS,rcArr:ENV.rcArr};ONL.ch.send({type:"broadcast",event:"race",payload:q});onlRaceGo(q)}
function onlRaceGo(q){const R=RTS.find(r=>r.id===q.rid);if(!R||!q.ids.includes(ONL.id))return;if(state==="watch")onlWatchEnd();if(RACE.on)raceAbort();ONL.mp={R,ids:q.ids,fin:new Map(),names:{}};if(q.rcT!==undefined){ENV.rcT=q.rcT;ENV.rcS=q.rcS;ENV.rcArr=q.rcArr}   // (tráfico, estación y flechas de la carrera: los que eligió el creador)

 if(!spawned){spawned=true}$("ov").hidden=true;raceStart(R,-1,q.ids.indexOf(ONL.id))}
function onlFin(q){if(!ONL.mp||!q)return;ONL.mp.fin.set(q.id,q.t);ONL.mp.names[q.id]=q.n;if(ONL.watch===q.id)onlWatchNext();onlCheckEnd()}
// Al llegar (o abandonar) se avisa a los demás y, si faltan, se mira a uno de ellos
function onlMyFin(t){const M=ONL.mp;if(!M)return false;M.fin.set(ONL.id,t);M.names[ONL.id]=ONL.name;ONL.ch&&ONL.ch.send({type:"broadcast",event:"fin",payload:{id:ONL.id,t,n:ONL.name}});if(!onlCheckEnd())onlWatchNext();return true}
function onlCheckEnd(){const M=ONL.mp;if(!M||!M.fin.has(ONL.id))return false;const left=M.ids.filter(id=>!M.fin.has(id)&&ONL.peers.has(id));if(left.length)return false;onlWatchEnd();onlResults();return true}
function onlWatchNext(){const M=ONL.mp;if(!M)return;const L=M.ids.filter(id=>id!==ONL.id&&!M.fin.has(id)&&ONL.peers.has(id));if(!L.length){onlWatchEnd();return}const i=L.indexOf(ONL.watch);ONL.watch=L[(i+1)%L.length];state="watch";hudVis(false);$("ov").hidden=true;
 const p=ONL.peers.get(ONL.watch);rBar([[`👀 ${T("Viendo a")} ${p&&p.n||"?"} · ${T("Cambiar")}`,onlWatchNext]])}
function onlWatchEnd(){ONL.watch=null;$("rcBar").hidden=true;if(state==="watch")state="play"}
function onlWatchCam(dt){const p=ONL.peers.get(ONL.watch);if(!p){onlWatchNext();return}const G=p.g.position,a=p.g.rotation.y,P=cam.position;P.lerp(new THREE.Vector3(G.x-Math.sin(a)*9,G.y+3.6,G.z-Math.cos(a)*9),Math.min(1,dt*4));cam.lookAt(G.x+Math.sin(a)*5,G.y+1.2,G.z+Math.cos(a)*5);cam.fov=62;cam.updateProjectionMatrix()}
function onlResults(){const M=ONL.mp;if(!M)return;ONL.mp=null;state="race";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=$("onlP").hidden=true;hudVis(false);$("touch").hidden=true;const P=$("raceP");P.hidden=false;P.innerHTML="";
 const h1=document.createElement("h1");h1.textContent=T("Clasificación");P.appendChild(h1);const L=M.ids.map(id=>({id,t:M.fin.has(id)?M.fin.get(id):null,n:id===ONL.id?ONL.name:(M.names[id]||(ONL.peers.get(id)||{}).n||"?")})).sort((a,b)=>(a.t===null)-(b.t===null)||a.t-b.t);
 const ol=document.createElement("ol");ol.className="onlRes";for(const r of L){const li=document.createElement("li");li.innerHTML=`<b>${esc(r.n)}</b>${r.id===ONL.id?" ("+T("tú")+")":""} — ${r.t===null?T("no terminó"):fmtT(r.t)}`;ol.appendChild(li)}P.appendChild(ol);
 const row=document.createElement("div");if(ONL.host){const b=document.createElement("button");b.className="b";b.textContent=T("Otra carrera");b.onclick=raceMenu;row.appendChild(b)}const c=document.createElement("button");c.className="b g";c.textContent=T("Conducción libre");c.onclick=resume;row.appendChild(c);P.appendChild(row)}
function onlTick(dt){{const b=$("onlB"),on=!!(ONL.ch&&ONL.ok);if(b.hidden===on)b.hidden=!on}   // 🌐 a la derecha solo dentro de una sala
 if(ONL.ch&&ONL.ok){ONL.sendT+=dt;if(ONL.sendT>.08&&spawned&&state!=="cars"){ONL.sendT=0;ONL.ch.send({type:"broadcast",event:"p",payload:{id:ONL.id,n:ONL.name,x:+px.toFixed(2),y:+bodyY.toFixed(2),z:+pz.toFixed(2),h:+h.toFixed(3),vx:+vx.toFixed(1),vz:+vz.toFixed(1),k:carK,c:carPaint(carK),w:state==="watch"?1:0}})}
  // Decoración: se vuelve a mandar si cambia (o si ha llegado alguien nuevo)
  ONL.livT+=dt;if(ONL.livT>3){ONL.livT=0;const key=carK+JSON.stringify(LIV[carK]);if(key!==ONL.livK){ONL.livK=key;onlLivSend()}}if(ONL.livNew){ONL.livNew=false;setTimeout(onlLivSend,400)}
  if(ONL.pendLiv)for(const id in ONL.pendLiv)if(ONL.peers.has(id)){peerLiv(ONL.pendLiv[id]);delete ONL.pendLiv[id]}
  const now=performance.now();for(const[id,p]of ONL.peers){if(now-p.t>8000){peerDel(id);continue}p.g.visible=!p.w;const age=Math.min(.3,(now-p.t)/1000),k=Math.min(1,dt*14),g=p.g;g.position.x+=(p.x+p.vx*age-g.position.x)*k;g.position.y+=(p.y-g.position.y)*k;g.position.z+=(p.z+p.vz*age-g.position.z)*k;g.rotation.y+=ad(p.h,g.rotation.y)*k}   // (se adelanta con su velocidad lo que ha tardado el mensaje: menos retraso)
  onlCfgTick(dt)}
 // Guardado automático cada minuto si hay cambios
 if(ONL.user){ONL.saveT+=dt;if(ONL.saveT>60){ONL.saveT=0;if(JSON.stringify(onlSnap())!==ONL.last)onlPush().catch(e=>console.warn(e))}}}
// --- Ajustes que cambian el juego, iguales para todos en la sala: tráfico, hora y clima y estación. Los pone el creador; los demás los reciben (y se les
// bloquean en Ajustes). Al salir de la sala, cada uno recupera los suyos ---
const PCOL=["#2ee6ff","#49e07a","#ff6ad5","#ffd400","#ff8a3c"];
function onlCfg(){return{npc:npcLvl,wx:ENV.wx,season:ENV.season,mode:ENV.mode,cycle:ENV.cycle}}
function onlCfgTick(dt){if(!ONL.host||!ONL.ch)return;ONL.cfgT=(ONL.cfgT||0)+dt;if(ONL.cfgT<1&&!ONL.cfgNew)return;ONL.cfgT=0;const c=onlCfg(),k=JSON.stringify(c);if(k!==ONL.cfgK||ONL.cfgNew){ONL.cfgK=k;ONL.cfgNew=false;ONL.ch.send({type:"broadcast",event:"cfg",payload:c})}}
function onlCfgGet(c){if(!c||ONL.host||!ONL.ok)return;if(!ONL.cfgBak)ONL.cfgBak=onlCfg();onlCfgSet(c)}
function onlCfgSet(c){if(c.npc!==npcLvl&&!RACE.on)setNpc(c.npc);ENV.wx=c.wx;ENV.mode=c.mode;ENV.cycle=c.cycle;if(ENV.season!==c.season){ENV.season=c.season;if(ready)seasonApply(seasonNow())}}
function onlCfgRestore(){if(!ONL.cfgBak)return;const b=ONL.cfgBak;ONL.cfgBak=null;onlCfgSet(b);saveEnv()}
const onlLocked=()=>!!(ONL.ch&&ONL.ok&&!ONL.host);
// Compañeros en el minimapa (flecha de su color y su nombre; en el borde si están lejos) y en el mapa
function peerMini(a,b,cc,d,c){for(const p of ONL.peers.values()){if(p.w)continue;const G=p.g.position,dx=G.x-px,dz=G.z-pz;let x=a*dx+cc*dz,y=b*dx+d*dz;const r=Math.hypot(x,y);if(r>84){x*=84/r;y*=84/r}const fx=Math.sin(p.g.rotation.y),fz=Math.cos(p.g.rotation.y),ux=a*fx+cc*fz,uy=b*fx+d*fz,ul=Math.hypot(ux,uy)||1;
 peerArrow(mc,c+x,c+y,Math.atan2(uy/ul,ux/ul),p.col,p.n,9)}}
function peerArrow(g,x,y,an,col,name,s){g.save();g.translate(x,y);g.rotate(an);g.fillStyle=col;g.strokeStyle="#0b0c10";g.lineWidth=2;g.beginPath();g.moveTo(s,0);g.lineTo(-s*.75,-s*.7);g.lineTo(-s*.35,0);g.lineTo(-s*.75,s*.7);g.closePath();g.fill();g.stroke();g.restore();
 if(name){g.font="bold 11px system-ui";g.textAlign="center";g.textBaseline="bottom";g.lineWidth=3;g.strokeStyle="rgba(0,0,0,.8)";g.strokeText(name,x,y-s-1);g.fillStyle=col;g.fillText(name,x,y-s-1)}}
