// Menú de ajustes (Esc o botón ⚙️): gráficos, hora y clima, sonido, tráfico, pantalla (HUD y unidades) y teclas (solo PC).
// Todo se guarda en el navegador (ENV, ver env.js). Mientras está abierto el juego queda en pausa
let rebind=null,setPrev="cars",setTab="gfx";
const ACTS=[["up","Acelerar"],["down","Frenar / marcha atrás"],["left","Girar a la izquierda"],["right","Girar a la derecha"],["hb","Freno de mano"],["cam","Cambiar cámara"],["map","Mapa"],["cars","Coches"],["snd","Silenciar sonido"],["trf","Cambiar tráfico"],["radio","Cambiar emisora"],["race","Carreras"],["photo","Modo foto"],["ghost","Fantasma"],["set","Ajustes"]];
const KEYDEF=JSON.parse(JSON.stringify(ENV.keys));
function keyName(c){if(!c)return"—";const m={Space:"Espacio",Escape:"Esc",ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",ShiftLeft:"Mayús izq.",ShiftRight:"Mayús der.",ControlLeft:"Ctrl izq.",ControlRight:"Ctrl der.",Enter:"Intro",Tab:"Tab",Backspace:"Borrar"};
 return(m[c]?T(m[c]):0)||c.replace(/^Key/,"").replace(/^Digit/,"").replace(/^Numpad/,"Num ")}
function openSettings(){if(state!=="set")setPrev=state;state="set";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=true;$("setP").hidden=false;hudVis(false);$("touch").hidden=true;drawSettings()}
function closeSettings(){rebind=null;$("setP").hidden=true;saveEnv();if(setPrev==="play")resume();else show(setPrev)}
function drawSettings(){const P=$("setP");P.innerHTML=`<h1>${T("Ajustes")}</h1>`;
 const tabs=[["gfx","Gráficos"],["time","Hora y clima"],["snd","Sonido"],["trf","Tráfico"],["scr","Pantalla"],["lang","Idioma"]];if(!MOBILE)tabs.push(["keys","Teclas"]);if(typeof DEV!=="undefined"&&DEV)tabs.push(["dev","Desarrollador"]);
 const tb=document.createElement("div");tb.className="stabs";tabs.forEach(([k,t])=>{const b=document.createElement("button");b.textContent=T(t);b.className=k===setTab?"on":"";b.onclick=()=>{setTab=k;rebind=null;drawSettings()};tb.appendChild(b)});P.appendChild(tb);
 const box=document.createElement("div");box.id="envUI";P.appendChild(box);
 const note=t=>{const p=document.createElement("p");p.textContent=T(t);box.appendChild(p)};
 const row=(label,opts,get,set)=>{const r=document.createElement("div");r.className="opt";r.innerHTML=`<span>${T(label)}</span>`;opts.forEach(([v,t])=>{const b=document.createElement("button");b.textContent=T(t);b.className=String(get())===String(v)?"on":"";
  b.onclick=()=>{set(v);saveEnv();for(const x of r.querySelectorAll("button"))x.className="";b.className="on"};r.appendChild(b)});box.appendChild(r);return r};
 const env=(label,opts,key,cb)=>row(label,opts,()=>ENV[key],v=>{ENV[key]=v;cb&&cb()});
 const slider=(label,key)=>{const r=document.createElement("div");r.className="opt";r.innerHTML=`<span>${T(label)}</span><input type="range" min="0" max="100" step="5" value="${Math.round(ENV.vol[key]*100)}"><b>${Math.round(ENV.vol[key]*100)}%</b>`;
  const i=r.querySelector("input"),o=r.querySelector("b");i.oninput=()=>{ENV.vol[key]=i.value/100;o.textContent=i.value+"%";setVol();saveEnv()};box.appendChild(r)};
 const aq=()=>{if(ready)applyQuality()};
 if(setTab==="gfx"){env("Calidad",[["auto","Auto"],[0,"Baja"],[1,"Media"],[2,"Alta"],[3,"Ultra"],[4,"Realista"]],"q",aq);
  env("Sombras",[["auto","Según calidad"],["on","Sí"],["off","No"]],"sh",aq);
  env("Distancia de visión",[[.7,"Corta"],[1,"Normal"],[1.4,"Lejana"]],"far",aq);
  env("Resplandor de luces",[["auto","Según calidad"],["on","Sí"],["off","No"]],"bl");
  note("La calidad cambia la resolución, el detalle de árboles y edificios y cuántas farolas dan luz real. Si el juego va a tirones, baja la calidad o la distancia.");
  note("Realista añade reflejos en el suelo, sombras de contacto y un color más de cine. Pide mucho al ordenador.")}
 else if(setTab==="time"){env("Hora",[["real","Tokio real"],["cycle","Día y noche"],["day","Siempre de día"],["night","Siempre de noche"]],"mode",()=>{cyc.hidden=ENV.mode!=="cycle"});
  const cyc=env("Un día dura",[[5,"5 min"],[10,"10 min"],[15,"15 min"],[30,"30 min"],[60,"60 min"]],"cycle");cyc.hidden=ENV.mode!=="cycle";
  env("Clima",[["auto","Aleatorio"],["clear","Despejado"],["rain","Lluvia"],["storm","Tormenta"]],"wx");
  if(ENV.season===undefined)ENV.season="auto";env("Estación",[["auto","Fecha de Japón"],[0,"Primavera"],[1,"Verano"],[2,"Otoño"],[3,"Invierno"]],"season",()=>{if(ready)seasonApply(seasonNow())});
  note("En invierno, si llueve, nieva: la nieve se acumula en el suelo y los tejados y el coche agarra menos.")}
 else if(setTab==="snd"){slider("General","m");slider("Motor","e");slider("Golpes y derrapes","fx");slider("Lluvia y truenos","rain");slider("Claxon","horn");slider("Ambiente: viento, ciudad y trenes","amb");
  row("Sonido",[[0,"Activado"],[1,"Silenciado"]],()=>mute?1:0,v=>{initAudio();setMute(!!v)});
  slider("Radio","radio");row("País de la radio",RCOUNTRY,()=>ENV.radio.c,v=>{ENV.radio.c=v;radioReset()});row("Estilo",RTAG,()=>ENV.radio.t,v=>{ENV.radio.t=v;radioReset()});
  {const b=document.createElement("button");b.className="b g";b.textContent="📻 "+T("Siguiente emisora");b.onclick=()=>{initAudio();if(!RADIO.on)radioToggle();else radioNext(1)};box.appendChild(b)}
  note("La radio usa emisoras en directo de radio-browser.info: necesita internet y la música (y los anuncios) son los que pongan ellas.")}
 else if(setTab==="trf"){row("Tráfico",NLAB.map((t,i)=>[i,t]),()=>npcLvl,v=>setNpc(v));note("Más coches hace la ciudad más viva, pero pide más al ordenador o al móvil.");
}
 else if(setTab==="scr"){row("Velocidad en",[["kmh","km/h"],["mph","mph"]],()=>ENV.units,v=>ENV.units=v);
  row("Minimapa",[[1,"Sí"],[0,"No"]],()=>ENV.hud.mini,v=>ENV.hud.mini=v);row("Velocímetro",[[1,"Sí"],[0,"No"]],()=>ENV.hud.speed,v=>ENV.hud.speed=v);
  if(!MOBILE)row("Ayuda de teclas",[[1,"Sí"],[0,"No"]],()=>ENV.hud.help,v=>ENV.hud.help=v);
  note("El HUD es todo lo que se dibuja encima de la imagen mientras conduces: velocímetro, minimapa y textos de ayuda. Quítalo para hacer capturas o conducir sin nada en pantalla.")}
 else if(setTab==="lang")row("Idioma",LANGS,()=>LANG,v=>{setLang(v);drawSettings()});
 else if(setTab==="dev"){note("Herramientas solo para ti (en el enlace del móvil y en Netlify no aparecen).");note("📸 Captura para Claude: pulsa P en cualquier momento (jugando, en el espectador o en las calcomanías), escribe qué está mal y Enviar. Se guarda en la carpeta capturas del juego y Claude la ve directamente.");if(!spawned)note("Elige primero un coche para usarlas.");else{[["👁 Modo espectador",startSpec,"Cámara libre: WASD mover, Q/E bajar y subir, flechas o arrastrar para girar, Mayús rápido, Esc para volver."],["🗺 Vista de la ciudad",startCity,"Todo el tráfico desde arriba a x1-x10 con contadores de atascos y solapes."],["🧪 Prueba automática",devTest,"Simula 5 minutos y da el informe."],["🚦 Simulador de situaciones",()=>{DV.scn=null;devScnUI()},"Elige un cruce, pon coches, qué hace cada uno, y se recrea."]].forEach(([t,f,d])=>{const b=document.createElement("button");b.className="b g";b.textContent=t;b.onclick=f;box.appendChild(b);note(d)});devInc(box)}}
 else if(setTab==="keys"){note("Haz clic en una tecla y pulsa la nueva. Cada acción admite dos teclas. El mando funciona siempre igual.");
  const g=document.createElement("div");g.className="keys";for(const[a,t]of ACTS){const s=document.createElement("span");s.textContent=T(t);g.appendChild(s);
   for(const k of[0,1]){const b=document.createElement("button");b.textContent=keyName(ENV.keys[a][k]);
    b.onclick=()=>{for(const x of g.querySelectorAll("button"))x.classList.remove("on");b.classList.add("on");b.textContent=T("Pulsa una tecla…");
     rebind=code=>{rebind=null;if(code==="Escape"&&a!=="set"){drawSettings();return}
      for(const q in ENV.keys)for(const j of[0,1])if(ENV.keys[q][j]===code)ENV.keys[q][j]="";ENV.keys[a][k]=code;if(!ENV.keys.set[0]&&!ENV.keys.set[1])ENV.keys.set[0]="Escape";saveEnv();drawSettings()}};g.appendChild(b)}}
  box.appendChild(g);const r=document.createElement("button");r.className="b g";r.textContent=T("Restablecer teclas");r.onclick=()=>{ENV.keys=JSON.parse(JSON.stringify(KEYDEF));saveEnv();drawSettings()};box.appendChild(r)}
 const ok=document.createElement("button");ok.className="b";ok.textContent=T("Volver");ok.onclick=closeSettings;P.appendChild(ok)}
setNpc(npcLvl);
// Botón de ajustes en el menú de coches
{const b=document.createElement("button");b.className="b g";b.dataset.i18n="⚙️ Ajustes";b.textContent=T("⚙️ Ajustes");b.onclick=()=>act("set");$("carsP").appendChild(b)}
