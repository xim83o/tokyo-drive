// En línea (Supabase): cuenta con correo y contraseña, partidas en la nube y salas multijugador con código.
// La clave de aquí es la pública, pensada para ir en el juego: quien protege los datos son las reglas de la tabla (tools/supabase.sql).
// Las salas usan Realtime Broadcast: cada jugador envía su posición unas 6 veces por segundo y dibuja a los demás. No necesitan cuenta.
// Tráfico, hora y clima son los de cada uno; los coches de los demás no chocan
const SB_URL="https://hjbkgfbjrtfenkqaldyl.supabase.co",SB_KEY="sb_publishable_aoPfbh6c8oD3YruCoG-moA_JD8tZlLN",ONL_MAX=6;
const ONL={sb:null,user:null,msg:"",ch:null,code:"",id:Math.random().toString(36).slice(2,10),peers:new Map(),sendT:0,saveT:0,last:"",name:""};
try{ONL.name=localStorage.getItem("td-name")||""}catch(e){}
function onlSb(){if(ONL.sb)return ONL.sb;if(!window.supabase)return null;ONL.sb=window.supabase.createClient(SB_URL,SB_KEY);ONL.sb.auth.onAuthStateChange((e,s)=>{ONL.user=s&&s.user||null;if(state==="onl")onlDraw()});return ONL.sb}
const onlSnap=()=>({v:1,liv:LIV,gar:GAR,race:rStore(),stk:CUS});
async function onlPush(){const sb=onlSb();if(!sb||!ONL.user)return;const data=onlSnap(),{error}=await sb.from("saves").upsert({user_id:ONL.user.id,data,updated_at:new Date().toISOString()});if(error)throw error;ONL.last=JSON.stringify(data)}
async function onlPull(){const sb=onlSb(),{data,error}=await sb.from("saves").select("data").eq("user_id",ONL.user.id).maybeSingle();if(error)throw error;if(!data)return false;const d=data.data;
 localStorage.setItem("td-liv",JSON.stringify(d.liv||[]));localStorage.setItem("td-gar",JSON.stringify(d.gar||[]));localStorage.setItem("td-race",JSON.stringify(d.race||{}));localStorage.setItem("td-stk",JSON.stringify(d.stk||[]));location.reload();return true}
function onlOpen(){state="onl";onlSb();$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=$("raceP").hidden=$("garP").hidden=true;$("onlP").hidden=false;hudVis(false);$("touch").hidden=true;onlDraw()}
function onlMsg(t){ONL.msg=t;if(state==="onl")onlDraw()}
function onlDraw(){const P=$("onlP");P.innerHTML="";const add=(tag,txt,cl)=>{const e=document.createElement(tag);if(txt)e.textContent=T(txt);if(cl)e.className=cl;P.appendChild(e);return e},btn=(t,f,g)=>{const b=add("button",t,g?"b g":"b");b.onclick=f;return b},inp=(type,ph,v)=>{const i=add("input");i.type=type;i.placeholder=T(ph);i.value=v||"";i.className="onlI";return i};
 add("h1","En línea");if(!window.supabase){add("p","No se pudo conectar con el servicio en línea desde esta página.");btn("Cerrar",resume,1);return}
 add("h3","Cuenta y partidas en la nube");if(ONL.user){const p=add("p");p.textContent=ONL.user.email;btn("Guardar en la nube",async()=>{try{await onlPush();onlMsg("Partida guardada.")}catch(e){onlMsg(e.message)}});btn("Cargar de la nube",async()=>{try{if(!await onlPull())onlMsg("Todavía no hay nada guardado.")}catch(e){onlMsg(e.message)}},1);btn("Cerrar sesión",async()=>{await ONL.sb.auth.signOut();ONL.user=null;onlMsg("")},1)}
 else{const em=inp("email","Correo"),pw=inp("password","Contraseña (6 letras o más)");const go=async f=>{try{const{error}=await f({email:em.value.trim(),password:pw.value});if(error)throw error;onlMsg("Listo.")}catch(e){onlMsg(e.message)}};btn("Entrar",()=>go(c=>ONL.sb.auth.signInWithPassword(c)));btn("Crear cuenta",()=>go(c=>ONL.sb.auth.signUp(c)),1)}
 add("h3","Jugar con amigos");if(ONL.ch){const p=add("p");p.innerHTML=`${T("Código de la sala")}: <b style="font-size:24px;letter-spacing:3px">${ONL.code}</b><br>${T("Jugadores")}: ${ONL.peers.size+1}/${ONL_MAX}`;btn("Salir de la sala",()=>{onlLeave();onlDraw()},1)}
 else{const n=inp("text","Tu nombre",ONL.name);n.maxLength=14;n.oninput=()=>{ONL.name=n.value.trim();try{localStorage.setItem("td-name",ONL.name)}catch(e){}};const c=inp("text","Código de la sala");c.maxLength=5;c.style.textTransform="uppercase";btn("Crear sala",()=>{const A="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";let s="";for(let i=0;i<5;i++)s+=A[Math.random()*A.length|0];onlJoin(s)});btn("Unirse",()=>{const s=c.value.trim().toUpperCase();if(s.length===5)onlJoin(s);else onlMsg("El código tiene 5 letras.")},1)}
 if(ONL.msg)add("p",ONL.msg);btn("Cerrar",resume,1)}
function onlJoin(code){const sb=onlSb();if(!sb)return;onlLeave();ONL.code=code;const ch=sb.channel("room-"+code,{config:{broadcast:{self:false}}});ch.on("broadcast",{event:"p"},m=>peerMsg(m.payload)).on("broadcast",{event:"bye"},m=>peerDel(m.payload.id));
 ch.subscribe(s=>{if(s==="SUBSCRIBED"){ONL.ch=ch;onlMsg("")}else if(s==="CHANNEL_ERROR"||s==="TIMED_OUT")onlMsg("No se pudo conectar con la sala.")})}
function onlLeave(){if(!ONL.ch)return;ONL.ch.send({type:"broadcast",event:"bye",payload:{id:ONL.id}});ONL.sb.removeChannel(ONL.ch);ONL.ch=null;ONL.code="";for(const id of[...ONL.peers.keys()])peerDel(id)}
addEventListener("beforeunload",onlLeave);
// Coches de los demás
function peerDel(id){const p=ONL.peers.get(id);if(p){sc.remove(p.g);ONL.peers.delete(id);if(state==="onl")onlDraw()}}
function peerLabel(t){const tx=canvasTex(256,64,g=>{g.fillStyle="rgba(0,0,0,.55)";g.fillRect(0,8,256,48);g.fillStyle="#fff";g.font="bold 30px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(t,128,32,240)}),s=new THREE.Sprite(new THREE.SpriteMaterial({map:tx,transparent:true,depthTest:false}));s.scale.set(5,1.25,1);s.position.y=3;return s}
function peerMsg(m){if(!ONL.ch||!m||!m.id)return;let p=ONL.peers.get(m.id);if(!p){if(ONL.peers.size>=ONL_MAX-1)return;p={g:new THREE.Group(),k:-1,c:-1,n:"",x:m.x,y:m.y,z:m.z,h:m.h};p.g.position.set(m.x,m.y,m.z);p.g.rotation.order="YXZ";sc.add(p.g);ONL.peers.set(m.id,p);if(state==="onl")onlDraw()}
 if(p.k!==m.k||p.c!==m.c||p.n!==m.n){const c=CARS[m.k]||CARS[0];while(p.g.children.length)p.g.remove(p.g.children[0]);if(MODELS[c.f])p.g.add(modelInst(c.f,c.l,m.c,false).s);p.g.add(peerLabel(m.n||"?"));p.k=m.k;p.c=m.c;p.n=m.n}p.x=m.x;p.y=m.y;p.z=m.z;p.h=m.h;p.t=performance.now()}
function onlTick(dt){if(ONL.ch){ONL.sendT+=dt;if(ONL.sendT>.16&&spawned&&(state==="play"||state==="onl")){ONL.sendT=0;ONL.ch.send({type:"broadcast",event:"p",payload:{id:ONL.id,n:ONL.name,x:+px.toFixed(2),y:+bodyY.toFixed(2),z:+pz.toFixed(2),h:+h.toFixed(3),k:carK,c:carPaint(carK)}})}
  const now=performance.now();for(const[id,p]of ONL.peers){if(now-p.t>8000){peerDel(id);continue}const k=Math.min(1,dt*9),g=p.g;g.position.x+=(p.x-g.position.x)*k;g.position.y+=(p.y-g.position.y)*k;g.position.z+=(p.z-g.position.z)*k;g.rotation.y+=ad(p.h,g.rotation.y)*k}}
 // Guardado automático cada minuto si hay cambios
 if(ONL.user){ONL.saveT+=dt;if(ONL.saveT>60){ONL.saveT=0;if(JSON.stringify(onlSnap())!==ONL.last)onlPush().catch(e=>console.warn(e))}}}
