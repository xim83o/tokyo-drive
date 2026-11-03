// Ambiente: hora (real de Tokio, ciclo de día y noche o fija), cielo con nubes, sol, luna y estrellas, sol con sombras, niebla,
// luces nocturnas (ventanas, farolas con luz real, letreros, Torre de Tokio, faros), postproceso (resplandor, suavizado de bordes,
// color) y calidad gráfica. Las opciones se eligen en el menú de coches y se recuerdan. El clima (lluvia) lo maneja weather.js
// Ajustes guardados: hora, calidad y sus retoques (sombras, distancia, resplandor), volúmenes, unidades, HUD, teclas y tráfico
const ENV={mode:"cycle",cycle:15,q:"auto",sh:"auto",far:1,bl:"auto",units:"kmh",npc:MOBILE?1:2,
 vol:{m:.8,e:1,fx:1,rain:1,horn:1},hud:{mini:1,speed:1,help:1},
 keys:{up:["KeyW","ArrowUp"],down:["KeyS","ArrowDown"],left:["KeyA","ArrowLeft"],right:["KeyD","ArrowRight"],hb:["Space",""],cam:["KeyV",""],map:["KeyM",""],cars:["KeyC",""],snd:["KeyN",""],trf:["KeyT",""],set:["Escape",""]}},T0=performance.now()/1000;let FOGF=900,FOGQ=900,NF=0,HOUR=10;
try{const s=JSON.parse(localStorage.getItem("td-env")||"{}");for(const k in s){if(ENV[k]&&typeof ENV[k]==="object"&&!Array.isArray(ENV[k]))Object.assign(ENV[k],s[k]);else ENV[k]=s[k]}}catch(e){}
function saveEnv(){try{localStorage.setItem("td-env",JSON.stringify(ENV))}catch(e){}}
const QUAL=[{n:"Baja",pr:.75,sh:0,R:0,far:450,lights:0},{n:"Media",pr:1,sh:1024,R:110,far:650,lights:4},{n:"Alta",pr:1.25,sh:2048,R:160,far:900,lights:8},{n:"Ultra",pr:1.75,sh:4096,R:230,far:1200,lights:12}];
const qLevel=()=>ENV.q==="auto"?(MOBILE?0:2):+ENV.q;
const WEA={rain:0,cloud:.35,wet:0,flash:0};   // estado del clima (weather.js): lluvia 0-1, nubosidad, suelo mojado, relámpago
// Cielo: degradado, sol con halo, nubes que se mueven (ruido fractal), atardeceres anaranjados, luna, y estrellas aparte
const SKYU={top:{value:new THREE.Color()},hor:{value:new THREE.Color()},sunC:{value:new THREE.Color()},sunDir:{value:new THREE.Vector3(0,1,0)},time:{value:0},cloud:{value:.25},night:{value:0},flash:{value:0},moonDir:{value:new THREE.Vector3(0,1,0)}};
const sky=new THREE.Mesh(new THREE.SphereGeometry(900,32,16),new THREE.ShaderMaterial({uniforms:SKYU,side:THREE.BackSide,depthWrite:false,fog:false,
 vertexShader:"varying vec3 vp;void main(){vp=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:`uniform vec3 top,hor,sunC,sunDir,moonDir;uniform float time,cloud,night,flash;varying vec3 vp;
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float v=0.,a=.5;for(int i=0;i<6;i++){v+=a*ns(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return v;}
void main(){vec3 d=normalize(vp);float up=max(d.y,0.);vec3 col=mix(hor,top,pow(up,.5));
 float sd=max(dot(d,sunDir),0.),md=max(dot(d,moonDir),0.);
 col+=sunC*(pow(sd,900.)*6.+pow(sd,24.)*.45+pow(sd,4.)*.12)*(1.-night);
 col+=vec3(.85,.9,1.)*(smoothstep(.9996,.9998,md)*1.2+pow(md,60.)*.08)*night;
 if(d.y>0.){vec2 uv=d.xz/(d.y+.12);vec2 w=vec2(time*.006,time*.0025);float c=fbm(uv*1.6+w);float c2=fbm(uv*4.-w*1.7);c=c*.72+c2*.28;
  float cov=smoothstep(.5-cloud*.3,.78-cloud*.22,c);vec3 lit=mix(vec3(1.),sunC,.35)*(1.-night*.9)+vec3(.02,.025,.04);
  vec3 sh=mix(hor,vec3(.35,.37,.42),.5)*(1.-night*.85);vec3 cc=mix(lit,sh,smoothstep(.0,.6,c2))+sunC*pow(sd,6.)*.5*(1.-night);
  col=mix(col,cc,cov*smoothstep(0.,.18,d.y)*(.65+cloud*.35));}
 col=mix(col,vec3(.42,.44,.48)*(1.-night*.85),cloud*cloud*.55);col+=vec3(.75,.8,1.)*flash*(.6+up);
 gl_FragColor=vec4(col,1.);}`}));
sky.renderOrder=-10;sky.frustumCulled=false;sc.add(sky);
const stars=(()=>{const p=[],r=rng(99);for(let i=0;i<1400;i++){const a=r()*PI*2,e=.06+r()*1.45;p.push(Math.cos(a)*Math.cos(e)*850,Math.sin(e)*850,Math.sin(a)*Math.cos(e)*850)}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(p,3));return new THREE.Points(g,new THREE.PointsMaterial({color:0xffffff,size:1.5,sizeAttenuation:false,transparent:true,opacity:0,fog:false,depthWrite:false}))})();
stars.renderOrder=-9;stars.frustumCulled=false;sc.add(stars);
// Reflejo del cielo para los cristales de los rascacielos (de noche se reduce mucho)
const SKYCUBE=(()=>{const f=[];for(let i=0;i<6;i++){const c=document.createElement("canvas");c.width=c.height=32;const g=c.getContext("2d"),gr=g.createLinearGradient(0,0,0,32);
 if(i===2){g.fillStyle="#9cc4ea";g.fillRect(0,0,32,32)}else if(i===3){g.fillStyle="#55595f";g.fillRect(0,0,32,32)}else{gr.addColorStop(0,"#8fb8e2");gr.addColorStop(.55,"#cfe0ef");gr.addColorStop(.56,"#6c7076");gr.addColorStop(1,"#4a4d52");g.fillStyle=gr;g.fillRect(0,0,32,32)}f.push(c)}
 return new THREE.CubeTexture(f)})();SKYCUBE.needsUpdate=true;
// Faros del jugador: a la altura del parachoques, apuntando a la calzada (no a las copas de los árboles)
const HL=new THREE.SpotLight(0xfff2d8,0,75,.5,.75,1.2);sc.add(HL,HL.target);
// Haz de los faros dibujado píxel a píxel en el suelo, la calzada y las marcas viales (el suelo tiene triángulos muy grandes y
// la luz normal solo se calcula en sus esquinas, así que el foco casi no se notaba en el asfalto)
const HLU={uHLP:{value:new THREE.Vector2()},uHLD:{value:new THREE.Vector2(0,1)},uHLI:{value:0}};
function beamMat(m){const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{if(prev)prev(sh);Object.assign(sh.uniforms,HLU);
 sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec3 vHW;").replace("#include <begin_vertex>","#include <begin_vertex>\nvHW=(modelMatrix*vec4(transformed,1.)).xyz;");
 sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec2 uHLP,uHLD;uniform float uHLI;varying vec3 vHW;").replace("#include <aomap_fragment>",`#include <aomap_fragment>
 if(uHLI>0.){vec2 d=vHW.xz-uHLP;float a=dot(d,uHLD),lat=abs(d.x*uHLD.y-d.y*uHLD.x),w=1.2+max(a,0.)*.24;
  float b=(1.-smoothstep(w*.35,w,lat))*smoothstep(1.,9.,a)*(1.-smoothstep(26.,55.,a));reflectedLight.directDiffuse+=diffuseColor.rgb*vec3(1.,.95,.85)*b*uHLI;}`)};
 const k=m.customProgramCacheKey;m.customProgramCacheKey=()=>(k?k.call(m):"")+"beam";return m}
// Luz real de las farolas más cercanas (cuántas depende de la calidad)
const LPL=[];let lampT=0;
function setLampLights(n){while(LPL.length<n){const l=new THREE.PointLight(0xffd29a,0,26,2);sc.add(l);LPL.push(l)}while(LPL.length>n)sc.remove(LPL.pop())}
const PAL={dTop:new THREE.Color(0x2f6fc8),dHor:new THREE.Color(0xbfd8ef),kTop:new THREE.Color(0x2d3a74),kHor:new THREE.Color(0xf28a4e),nTop:new THREE.Color(0x02040c),nHor:new THREE.Color(0x111a2e),
 sunD:new THREE.Color(0xfff2dc),sunK:new THREE.Color(0xff9a4a),moon:new THREE.Color(0x8fa8d8),hSky:new THREE.Color(0xcfe4ff),hNight:new THREE.Color(0x1e2a46),tw:new THREE.Color(0xff6a1a),rain:new THREE.Color(0x6f7680)};
const _c=new THREE.Color(),_c2=new THREE.Color();
function tokyoHour(){try{const p=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Tokyo",hour:"numeric",minute:"numeric",second:"numeric",hour12:false}).formatToParts(new Date()),v=k=>+p.find(x=>x.type===k).value;return(v("hour")%24)+v("minute")/60+v("second")/3600}catch(e){return 12}}
function hourNow(){if(ENV.mode==="real")return tokyoHour();if(ENV.mode==="day")return 12.5;if(ENV.mode==="night")return 22;return(10+(performance.now()/1000-T0)/(ENV.cycle*60)*24)%24}
// --- Postproceso: resplandor (bloom) de luces y ventanas, corrección de color con viñeta y suavizado de bordes (FXAA) ---
const GRADE={uniforms:{tDiffuse:{value:null},sat:{value:1.12},con:{value:1.06},vig:{value:.28},tint:{value:new THREE.Vector3(1,1,1)}},
 vertexShader:"varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
 fragmentShader:`uniform sampler2D tDiffuse;uniform float sat,con,vig;uniform vec3 tint;varying vec2 vUv;
void main(){vec4 c=texture2D(tDiffuse,vUv);vec3 x=c.rgb*tint;float l=dot(x,vec3(.299,.587,.114));x=mix(vec3(l),x,sat);x=(x-.5)*con+.5;
 vec2 q=vUv-.5;x*=1.-dot(q,q)*vig*1.6;gl_FragColor=vec4(clamp(x,0.,1.),c.a);}`};
let composer=null,bloom=null,fxaa=null,grade=null;
function setupPost(){if(!THREE.EffectComposer||composer)return;composer=new THREE.EffectComposer(rd);composer.addPass(new THREE.RenderPass(sc,cam));
 bloom=new THREE.UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight),.5,.5,.8);composer.addPass(bloom);grade=new THREE.ShaderPass(GRADE);composer.addPass(grade);
 fxaa=new THREE.ShaderPass(THREE.FXAAShader);composer.addPass(fxaa);postSize()}
function postSize(){if(!composer)return;const pr=rd.getPixelRatio();composer.setPixelRatio(pr);composer.setSize(innerWidth,innerHeight);fxaa.material.uniforms.resolution.value.set(1/(innerWidth*pr),1/(innerHeight*pr))}
function renderFrame(){const lv=qLevel(),bl=ENV.bl==="auto"?lv>=2:ENV.bl==="on";if(composer&&(lv>=1||bl)){bloom.enabled=bl;bloom.strength=.1+NF*.7+WEA.wet*.1;bloom.threshold=.78-NF*.12;composer.render()}else rd.render(sc,cam)}
let ledT=0;
function envUpdate(dt){HOUR=hourNow();const e=Math.sin((HOUR-6)/12*PI),day=Math.min(1,Math.max(0,(e+.06)/.32)),dusk=Math.max(0,1-Math.abs(e)/.28),rn=WEA.rain;NF=Math.min(1,1-day+rn*.25*day);
 _c.copy(PAL.nTop).lerp(PAL.dTop,day).lerp(PAL.kTop,dusk*.55).lerp(PAL.rain,rn*.6*day);SKYU.top.value.copy(_c);
 _c2.copy(PAL.nHor).lerp(PAL.dHor,day).lerp(PAL.kHor,dusk*.6*(1-rn)).lerp(PAL.rain,rn*.7*day);SKYU.hor.value.copy(_c2);
 sc.fog.color.copy(_c2);sc.background=_c2;stars.material.opacity=Math.max(0,NF-.3)*1.2*(1-WEA.cloud);sky.position.copy(cam.position);stars.position.copy(cam.position);
 // Sol (o luna de noche) que sigue al jugador para que las sombras cubran la zona cercana
 const az=(HOUR-12)/12*PI,el=day>0?Math.max(.18,Math.asin(Math.max(-1,Math.min(1,e)))):.9,dx=Math.cos(el)*Math.sin(az),dy=Math.sin(el),dz=Math.cos(el)*Math.cos(az)*.6+.4;
 sun.position.set(px+dx*400,dy*400,pz+dz*400);sun.target.position.set(px,0,pz);sun.target.updateMatrixWorld();
 const se=Math.asin(Math.max(-1,Math.min(1,e))),sx=Math.cos(se)*Math.sin(az),sz=Math.cos(se)*Math.cos(az)*.6+.4;SKYU.sunDir.value.set(sx,Math.sin(se),sz).normalize();SKYU.moonDir.value.set(-.4,.75,.5).normalize();
 SKYU.sunC.value.copy(PAL.sunD).lerp(PAL.sunK,dusk);SKYU.time.value=performance.now()/1000;SKYU.cloud.value=WEA.cloud;SKYU.night.value=NF;SKYU.flash.value=WEA.flash;
 sun.intensity=(day>0?.25+.6*Math.min(1,e/.35)*day:.22)*(1-rn*.6)+WEA.flash*1.5;sun.color.copy(day>0?PAL.sunD:PAL.moon).lerp(PAL.sunK,day>0?dusk*.7:0);
 hemi.intensity=(.34+.56*day)*(1-rn*.3)+WEA.flash;hemi.color.copy(PAL.hNight).lerp(PAL.hSky,day);
 // Luces nocturnas
 for(const m of NM.win)if(m.envMap)m.reflectivity=.25*(1-NF*.85);
 for(const m of NM.int){const s=m.userData.sh;if(s){s.uniforms.uNight.value=NF;s.uniforms.uSkyT.value.copy(SKYU.top.value);s.uniforms.uSkyH.value.copy(SKYU.hor.value)}}for(const m of NM.sign)m.emissiveIntensity=.12+NF*1.9;if(NM.ledGlow)NM.ledGlow.opacity=NF*.55;
 if(NM.lampHead)NM.lampHead.emissiveIntensity=NF*2;if(NM.glow)NM.glow.opacity=NF*.9;
 if(ROADMAT)ROADMAT.lightMapIntensity=NF*1.5;if(GROUNDMAT)GROUNDMAT.lightMapIntensity=NF*1.3;if(NM.vend)NM.vend.emissiveIntensity=.15+NF*.85;
 if(NM.head)NM.head.emissiveIntensity=.2+NF*1.8;if(NM.tail)NM.tail.emissiveIntensity=.25+NF*1.3;
 if(towerMat)towerMat.emissive.copy(PAL.tw).multiplyScalar(NF*.55);for(const m of NM.ledT)m.color.setScalar(.85+NF*.15);
 if(ROADMAT){ROADMAT.specular.setScalar(.05+WEA.wet*.75);ROADMAT.shininess=30+WEA.wet*70;ROADMAT.color.setScalar(1-WEA.wet*.35)}
 HL.intensity=NF>.2?NF*7:0;if(car){const fx=Math.sin(h),fz=Math.cos(h),f=cur.l/2+.3;HL.position.set(px+fx*f,.8+bodyY,pz+fz*f);HL.target.position.set(px+fx*26,0,pz+fz*26);HL.target.updateMatrixWorld();
  HLU.uHLP.value.set(px+fx*f,pz+fz*f);HLU.uHLD.value.set(fx,fz);HLU.uHLI.value=NF>.2&&spawned?NF*1.4:0}
 // Farolas más cercanas al jugador con luz de verdad (se reparten cada 0,3 s) y detalle cercano de los edificios
 lampT+=dt;const doL=lampT>.3;if(doL){lampT=0;lodUpdate()}if(doL&&LPL.length&&LAMPS.length){const tx=px,tz=pz,best=[];for(let i=0;i<LAMPS.length;i+=3){const d=(LAMPS[i]-tx)**2+(LAMPS[i+2]-tz)**2;if(best.length<LPL.length||d<best[best.length-1][0]){best.push([d,i]);best.sort((a,b)=>a[0]-b[0]);if(best.length>LPL.length)best.pop()}}
  LPL.forEach((l,k)=>{const b=best[k];if(b)l.position.set(LAMPS[b[1]],LAMPS[b[1]+1],LAMPS[b[1]+2])})}
 for(const l of LPL)l.intensity=NF*.75;
 // Pantallas LED: se redibujan unas 10 veces por segundo
 ledT+=dt;if(ledT>.1&&NM.led.length){ledT=0;const tm=performance.now()/1000;for(const l of NM.led){drawAd(l.g,320,180,tm,l.ph);l.t.needsUpdate=true}}
 FOGF=FOGQ*(1-rn*.5)}
let qApplied=-1;
function applyQuality(){const lv=qLevel(),Q=QUAL[lv];rd.setPixelRatio(Math.max(.6,Math.min(Q.pr,Math.min(devicePixelRatio,2)*(lv===0?.75:1))));setupPost();
 const sh=ENV.sh==="auto"?Q.sh>0:ENV.sh==="on",SM=Q.sh||1024,SR=Q.R||110,relight=rd.shadowMap.enabled!==sh||LPL.length!==Q.lights||qApplied<0;setLampLights(Q.lights);
 if(relight){rd.shadowMap.enabled=sh;rd.shadowMap.type=THREE.PCFSoftShadowMap;sc.traverse(o=>{if(o.material){(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.needsUpdate=true)}})}
 sun.castShadow=sh;if(sh){if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null}sun.shadow.mapSize.set(SM,SM);const c=sun.shadow.camera;c.left=c.bottom=-SR;c.right=c.top=SR;c.near=10;c.far=900;c.updateProjectionMatrix();sun.shadow.bias=-.0004;sun.shadow.normalBias=.04}
 FOGQ=Q.far*ENV.far;cam.far=FOGQ+150;cam.updateProjectionMatrix();sc.traverse(o=>{if(o.userData.q!==undefined)o.visible=lv>=o.userData.q});qApplied=lv;resize()}
if(ENV.wx===undefined)ENV.wx="auto";
