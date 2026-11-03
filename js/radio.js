// Radio: emisoras en directo del directorio público radio-browser.info (gratuito, sin cuenta), por país y estilo. No se descarga
// nada: el juego se conecta a la emisión como cualquier app de radio. Solo emisoras con https (si no, el enlace del móvil no las
// reproduce). Botón 📻 para encender o apagar, tecla R (o el botón ⏭) para cambiar de emisora; país, estilo y volumen en Ajustes → Sonido
const RCOUNTRY=[["JP","Japón"],["ES","España"],["US","EE. UU."],["GB","Reino Unido"],["FR","Francia"],["KR","Corea"],["","Todo el mundo"]];
const RTAG=[["","Todos"],["pop","Pop"],["rock","Rock"],["jazz","Jazz"],["anime","Anime"],["electronic","Electrónica"],["lofi","Lo-fi"],["classical","Clásica"]];
const RAPI=["https://de1.api.radio-browser.info","https://nl1.api.radio-browser.info","https://at1.api.radio-browser.info","https://de2.api.radio-browser.info","https://fi1.api.radio-browser.info","https://all.api.radio-browser.info"];
const RADIO={on:false,list:[],i:-1,key:"",el:new Audio(),fails:0,lt:0,err:""};RADIO.el.preload="none";
// Sonido de 0,1 s en silencio: se reproduce en el mismo clic del botón para que el navegador (Opera, Chrome…) deje sonar la radio
const SILENT="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
if(!ENV.radio)ENV.radio={c:"JP",t:""};
function radioMsg(t,keep){const e=$("radioL");e.textContent=t;e.hidden=false;RADIO.lt=keep?1e12:performance.now()+5000}
async function radioLoad(){const k=ENV.radio.c+"|"+ENV.radio.t;if(k===RADIO.key&&RADIO.list.length)return;RADIO.key=k;RADIO.list=[];RADIO.i=-1;
 const q=new URLSearchParams({hidebroken:"true",order:"clickcount",reverse:"true",limit:"120"});if(ENV.radio.c)q.set("countrycode",ENV.radio.c);if(ENV.radio.t)q.set("tag",ENV.radio.t);
 RADIO.err="net";for(const b of RAPI){try{const r=await fetch(`${b}/json/stations/search?${q}`);if(!r.ok)continue;const a=await r.json();
  RADIO.list=a.filter(s=>(s.url_resolved||"").startsWith("https://")&&s.name.trim()).map(s=>({n:s.name.trim().slice(0,40),u:s.url_resolved,c:s.countrycode}));RADIO.err=RADIO.list.length?"":"empty";break}catch(e){}}
 if(!RADIO.list.length)RADIO.key=""}
async function radioNext(d){if(!RADIO.on)return;radioMsg("📻 "+T("Buscando emisora…"),true);await radioLoad();const L=RADIO.list;
 if(!L.length){radioMsg("📻 "+T(RADIO.err==="net"?"No se puede conectar con el directorio de emisoras (¿VPN o bloqueador de anuncios?)":"No hay emisoras para ese país y estilo"));return}
 RADIO.i=((RADIO.i+(d||1))%L.length+L.length)%L.length;const s=L[RADIO.i];
 RADIO.el.src=s.u;radioVol();RADIO.el.play().then(()=>{RADIO.fails=0;radioMsg("📻 "+s.n+(s.c?" · "+s.c:""))}).catch(e=>{if(e&&e.name==="NotAllowedError"){radioMsg("📻 "+T("El navegador bloquea el sonido: pulsa 📻 otra vez"));RADIO.on=false;$("rad").classList.remove("on");return}radioFail()})}
function radioFail(){if(!RADIO.on)return;if(++RADIO.fails>8){RADIO.fails=0;radioMsg("📻 "+T("Las emisoras no responden (¿VPN o bloqueador de anuncios?)"));return}radioNext(1)}
RADIO.el.addEventListener("error",()=>{if(RADIO.on&&RADIO.el.src&&!RADIO.el.src.startsWith("data:"))radioFail()});
function radioVol(){RADIO.el.volume=mute?0:Math.min(1,(ENV.vol.m||0)*(ENV.vol.radio===undefined?.6:ENV.vol.radio))}
function radioToggle(){RADIO.on=!RADIO.on;$("rad").classList.toggle("on",RADIO.on);if(RADIO.on){RADIO.el.src=SILENT;RADIO.el.play().catch(()=>{});radioNext(RADIO.i<0?1:0)}else{RADIO.el.pause();RADIO.el.removeAttribute("src");RADIO.el.load();radioMsg("📻 "+T("Radio apagada"))}}
// Al cambiar país o estilo se busca otra lista la próxima vez
function radioReset(){RADIO.key="";if(RADIO.on)radioNext(1)}
function radioTick(){if(RADIO.lt&&performance.now()>RADIO.lt){$("radioL").hidden=true;RADIO.lt=0}}
