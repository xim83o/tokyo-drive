// Ambiente: hora (real de Tokio, ciclo de día y noche o fija), cielo con estrellas, sol con sombras, niebla, luces nocturnas
// (ventanas, farolas, letreros, Torre de Tokio, faros) y calidad gráfica. Las opciones se eligen en el menú de coches y se recuerdan
const ENV={mode:"cycle",cycle:15,q:"auto"},T0=performance.now()/1000;let FOGF=900,NF=0,HOUR=10;
try{Object.assign(ENV,JSON.parse(localStorage.getItem("td-env")||"{}"))}catch(e){}
function saveEnv(){try{localStorage.setItem("td-env",JSON.stringify(ENV))}catch(e){}}
const QUAL=[{n:"Baja",pr:.75,sh:0,R:0,far:450},{n:"Media",pr:1,sh:1024,R:110,far:650},{n:"Alta",pr:1.5,sh:2048,R:160,far:900},{n:"Ultra",pr:2,sh:4096,R:230,far:1200}];
const qLevel=()=>ENV.q==="auto"?(MOBILE?0:2):+ENV.q;
// Cielo: esfera con degradado (cenit → horizonte) que sigue a la cámara, y estrellas que aparecen de noche
const SKYU={top:{value:new THREE.Color()},hor:{value:new THREE.Color()}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,24,12),new THREE.ShaderMaterial({uniforms:SKYU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:"varying vec3 vp;void main(){vp=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:"uniform vec3 top;uniform vec3 hor;varying vec3 vp;void main(){float t=pow(max(vp.y,0.),.55);gl_FragColor=vec4(mix(hor,top,t),1.);}"}));
sky.renderOrder=-10;sky.frustumCulled=false;sc.add(sky);
const stars=(()=>{const p=[],r=rng(99);for(let i=0;i<900;i++){const a=r()*PI*2,e=.08+r()*1.4;p.push(Math.cos(a)*Math.cos(e)*850,Math.sin(e)*850,Math.sin(a)*Math.cos(e)*850)}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.6,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}))})();
stars.renderOrder=-9;stars.frustumCulled=false;sc.add(stars);
// Reflejo del cielo para los cristales de los rascacielos
const SKYCUBE=(()=>{const f=[];for(let i=0;i<6;i++){const c=document.createElement("canvas");c.width=c.height=32;const g=c.getContext("2d"),gr=g.createLinearGradient(0,0,0,32);
 if(i===2){g.fillStyle="#9cc4ea";g.fillRect(0,0,32,32)}else if(i===3){g.fillStyle="#55595f";g.fillRect(0,0,32,32)}else{gr.addColorStop(0,"#8fb8e2");gr.addColorStop(.55,"#cfe0ef");gr.addColorStop(.56,"#6c7076");gr.addColorStop(1,"#4a4d52");g.fillStyle=gr;g.fillRect(0,0,32,32)}f.push(c)}
 return new THREE.CubeTexture(f)})();SKYCUBE.needsUpdate=true;
// Faros del jugador
const HL=new THREE.SpotLight(0xfff0d0,0,55,.42,.6,1.4);sc.add(HL,HL.target);
const PAL={dTop:new THREE.Color(0x3f7fd0),dHor:new THREE.Color(0xc4dcf0),kTop:new THREE.Color(0x34457e),kHor:new THREE.Color(0xf09a62),nTop:new THREE.Color(0x03060f),nHor:new THREE.Color(0x141c30),
 sunD:new THREE.Color(0xfff4e0),sunK:new THREE.Color(0xffa860),moon:new THREE.Color(0x8fa8d8),hSky:new THREE.Color(0xcfe4ff),hNight:new THREE.Color(0x24314f),tw:new THREE.Color(0xff6a1a)};
const _c=new THREE.Color(),_c2=new THREE.Color();
function tokyoHour(){try{const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Tokyo",hour:"numeric",minute:"numeric",second:"numeric",hour12:false}).formatToParts(new Date()),v=k=>+p.find(x=>x.type===k).value;return(v("hour")%24)+v("minute")/60+v("second")/3600}catch(e){return 12}}
function hourNow(){if(ENV.mode==="real")return tokyoHour();if(ENV.mode==="day")return 12.5;if(ENV.mode==="night")return 22;return(10+(performance.now()/1000-T0)/(ENV.cycle*60)*24)%24}
let ledT=0;
function envUpdate(dt){HOUR=hourNow();const e=Math.sin((HOUR-6)/12*PI),day=Math.min(1,Math.max(0,(e+.06)/.32)),dusk=Math.max(0,1-Math.abs(e)/.28);NF=1-day;
 _c.copy(PAL.nTop).lerp(PAL.dTop,day).lerp(PAL.kTop,dusk*.55);SKYU.top.value.copy(_c);_c2.copy(PAL.nHor).lerp(PAL.dHor,day).lerp(PAL.kHor,dusk*.6);SKYU.hor.value.copy(_c2);
 sc.fog.color.copy(_c2);sc.background=_c2;stars.material.opacity=Math.max(0,NF-.3)*1.2;sky.position.copy(cam.position);stars.position.copy(cam.position);
 // Sol (o luna de noche) que sigue al jugador para que las sombras cubran la zona cercana
 const az=(HOUR-12)/12*PI,el=day>0?Math.max(.18,Math.asin(Math.max(-1,Math.min(1,e)))):.9,dx=Math.cos(el)*Math.sin(az),dy=Math.sin(el),dz=Math.cos(el)*Math.cos(az)*.6+.4;
 sun.position.set(px+dx*400,dy*400,pz+dz*400);sun.target.position.set(px,0,pz);sun.target.updateMatrixWorld();
 sun.intensity=day>0?.25+.6*Math.min(1,e/.35)*day:.14;sun.color.copy(day>0?PAL.sunD:PAL.moon).lerp(PAL.sunK,day>0?dusk*.7:0);
 hemi.intensity=.22+.68*day;hemi.color.copy(PAL.hNight).lerp(PAL.hSky,day);
 // Luces nocturnas
 for(const m of NM.win)m.emissiveIntensity=NF*.95;for(const m of NM.sign)m.emissiveIntensity=.12+NF*1.1;
 if(NM.lampHead)NM.lampHead.emissiveIntensity=NF*1.6;if(NM.pool)NM.pool.opacity=NF*.6;if(NM.vend)NM.vend.emissiveIntensity=.15+NF*.85;
 if(NM.head)NM.head.emissiveIntensity=.2+NF*1.6;if(NM.tail)NM.tail.emissiveIntensity=.25+NF*1.2;
 if(towerMat)towerMat.emissive.copy(PAL.tw).multiplyScalar(NF*.55);for(const m of NM.ledT)m.color.setScalar(.75+NF*.25);
 HL.intensity=NF>.25?NF*4:0;if(car){const fx=Math.sin(h),fz=Math.cos(h);HL.position.set(px+fx*1.5,1.6+bodyY,pz+fz*1.5);HL.target.position.set(px+fx*20,-1.5,pz+fz*20);HL.target.updateMatrixWorld()}
 // Pantallas LED: se redibujan unas 10 veces por segundo
 ledT+=dt;if(ledT>.1&&NM.led.length){ledT=0;const tm=performance.now()/1000;for(const l of NM.led){drawAd(l.g,320,180,tm,l.ph);l.t.needsUpdate=true}}}
let qApplied=-1;
function applyQuality(){const lv=qLevel(),Q=QUAL[lv];rd.setPixelRatio(Math.max(.6,Math.min(Q.pr,Math.min(devicePixelRatio,2)*(lv===0?.75:1))));
 const sh=Q.sh>0;if(rd.shadowMap.enabled!==sh||qApplied<0){rd.shadowMap.enabled=sh;rd.shadowMap.type=THREE.PCFSoftShadowMap;sc.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}})}
 sun.castShadow=sh;if(sh){if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}sun.shadow.mapSize.set(Q.sh,Q.sh);const c=sun.shadow.camera;c.left=c.bottom=-Q.R;c.right=c.top=Q.R;c.near=10;c.far=900;c.updateProjectionMatrix();sun.shadow.bias=-.0004;sun.shadow.normalBias=.04}
 FOGF=Q.far;cam.far=Q.far+150;cam.updateProjectionMatrix();sc.traverse(o=>{if(o.userData.q!==undefined)o.visible=lv>=o.userData.q});qApplied=lv;resize()}
// Opciones en el menú de coches: hora y calidad
function envUI(){const box=document.createElement("div");box.id="envUI";$("carsP").appendChild(box);
 const row=(label,opts,key,cb)=>{const r=document.createElement("div");r.className="opt";r.innerHTML=`<span>${label}</span>`;opts.forEach(([v,t])=>{const b=document.createElement("button");b.textContent=t;b.className=String(ENV[key])===String(v)?"on":"";
  b.onclick=()=>{ENV[key]=v;saveEnv();for(const x of r.querySelectorAll("button"))x.className="";b.className="on";cb&&cb()};r.appendChild(b)});box.appendChild(r);return r};
 row("Hora",[["real","Tokio real"],["cycle","Día y noche"],["day","Siempre de día"],["night","Siempre de noche"]],"mode",()=>{cyc.hidden=ENV.mode!=="cycle"});
 const cyc=row("Un día dura",[[5,"5 min"],[10,"10 min"],[15,"15 min"],[30,"30 min"],[60,"60 min"]],"cycle");cyc.hidden=ENV.mode!=="cycle";
 row("Calidad",[["auto","Auto"],[0,"Baja"],[1,"Media"],[2,"Alta"],[3,"Ultra"]],"q",()=>{if(ready)applyQuality()})}
envUI();
