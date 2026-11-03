// Estaciones del año (fecha real de Japón o elegida en Ajustes → Hora y clima):
// primavera: cerezos en flor y pétalos cayendo · verano: todo verde, más sol, calima y farolillos rojos en las tiendas ·
// otoño: ginkgos amarillos, arces rojos y hojas en el suelo · invierno: ginkgos sin hojas y árboles de hoja perenne con nieve, nieve en vez de lluvia que se acumula en
// suelos y tejados (menos agarre) y luces de Navidad en los árboles de las avenidas
let SEASON=-1,SNOWACC=0,SEAFOG=1;const SNOWU={uSnow:{value:0}},SEAS=["Primavera","Verano","Otoño","Invierno"];
// Nieve sobre las caras que miran hacia arriba (k: cuánto se cubre ese material)
function snowMat(m,k){const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{if(prev)prev(sh);Object.assign(sh.uniforms,SNOWU);
 sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying float vSNy;").replace("#include <begin_vertex>","#include <begin_vertex>\nvSNy=normalize(mat3(modelMatrix)*objectNormal).y;");
 sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform float uSnow;varying float vSNy;").replace("#include <color_fragment>",`#include <color_fragment>
 diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.95,.98),uSnow*${k.toFixed(2)}*smoothstep(.5,.85,vSNy));`)};
 const ck=m.customProgramCacheKey;m.customProgramCacheKey=()=>(ck?ck.call(m):"")+"snow"+k;m.needsUpdate=true;return m}
// Luz, cielo y suelo de cada estación: multiplicadores del color del sol y su fuerza, del cielo (arriba y horizonte) y de la luz
// ambiente; color del césped; pétalos en las aceras (primavera); escarcha (invierno); nubosidad base
const SEASL=[{sun:[1,.95,.97],si:1,hemi:[1,.96,1],sky:[1,.94,1.02],hor:[1.06,.96,1],grass:[.95,1.1,.85],pet:1,fr:0,cl:.35},
 {sun:[1.06,1,.88],si:1.15,hemi:[1,1,.94],sky:[.86,1,1.15],hor:[1.06,1.04,.9],grass:[.78,1.18,.66],pet:0,fr:0,cl:.25},
 {sun:[1.14,.94,.72],si:.95,hemi:[1.06,.96,.84],sky:[1,.96,.88],hor:[1.14,1,.8],grass:[1.38,1,.52],pet:0,fr:0,cl:.4},
 {sun:[.84,.93,1.12],si:.85,hemi:[.9,.95,1.1],sky:[.82,.88,.95],hor:[.95,.98,1.06],grass:[1.05,.84,.8],pet:0,fr:.22,cl:.55}];
let SEASK=null;const SEAU={uGrass:{value:new THREE.Vector3(1,1,1)},uPetal:{value:0},uFrost:{value:0}};
// Suelo: el césped cambia de color, pétalos rosas sueltos por las aceras en primavera y escarcha azulada en invierno
function seasonGround(m){const prev=m.onBeforeCompile;m.onBeforeCompile=sh=>{if(prev)prev(sh);Object.assign(sh.uniforms,SEAU);
 sh.vertexShader=sh.vertexShader.replace("#include <common>","#include <common>\nvarying vec2 vGW;").replace("#include <begin_vertex>","#include <begin_vertex>\nvGW=(modelMatrix*vec4(transformed,1.)).xz;");
 sh.fragmentShader=sh.fragmentShader.replace("#include <common>","#include <common>\nuniform vec3 uGrass;uniform float uPetal,uFrost;varying vec2 vGW;").replace("#include <map_fragment>",`#include <map_fragment>
 {vec3 c=diffuseColor.rgb;float gr=smoothstep(.01,.06,c.g-max(c.r,c.b));c=mix(c,clamp(c*uGrass,0.,1.),gr);
  vec2 cell=floor(vGW*2.5);float hs=fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453);if(uPetal>0.&&hs>.93&&length(fract(vGW*2.5)-.5)<.22)c=mix(c,vec3(1.,.74,.84),uPetal*(1.-gr*.4));
  c=mix(c,vec3(.84,.89,.95),uFrost);diffuseColor.rgb=c;}`)};
 const ck=m.customProgramCacheKey;m.customProgramCacheKey=()=>(ck?ck.call(m):"")+"seas";m.needsUpdate=true;return m}
let SNOWP=null,PETP=null,LITTER=null,XMAS=null,LANT=null;
function partBox(n,col,size,opa){const p=new Float32Array(n*3);for(let i=0;i<n;i++){p[i*3]=(Math.random()-.5)*70;p[i*3+1]=Math.random()*30;p[i*3+2]=(Math.random()-.5)*70}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(p,3));const t=canvasTex(32,32,(c)=>{const gr=c.createRadialGradient(16,16,0,16,16,16);gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.5,"rgba(255,255,255,.8)");gr.addColorStop(1,"rgba(255,255,255,0)");c.fillStyle=gr;c.fillRect(0,0,32,32)});
 const m=new THREE.Points(g,new THREE.PointsMaterial({color:col,size,map:t,transparent:true,opacity:opa,depthWrite:false}));m.frustumCulled=false;m.visible=false;sc.add(m);return m}
function seasonInit(){
 for(const[m,k]of[[GROUNDMAT,1],[ROADMAT,.55],[TREEG.tm,.8],[ROOFM,1],[TREEH[2]&&TREEH[2].lm,.9],[TREEH[1]&&TREEH[1].lm,.85]])if(m)snowMat(m,k);if(GROUNDMAT)seasonGround(GROUNDMAT);
 SNOWP=partBox(2600,0xffffff,.16,.9);PETP=partBox(420,0xffb7d0,.22,.95);
 // Hojas caídas bajo los árboles (otoño)
 {const L=[],r=rng(9),cols=[0xe8b52a,0xd8642a,0xc23a24,0xf0cf4a,0xb07a2a];for(const t of TREES){if(t.s===2||L.length>12000)continue;for(let k=0;k<3;k++){const a=r()*PI*2,d=.6+r()*2.4,x=t.e[0]+Math.cos(a)*d,z=t.e[2]+Math.sin(a)*d;if(groundD(x,z)>.3)L.push([x,CURB+.02+r()*.01,z,r()*PI,1,1,cols[(r()*cols.length)|0]])}}
  const lt=canvasTex(64,64,(c)=>{c.fillStyle="#fff";c.beginPath();c.moveTo(32,4);for(let k=1;k<10;k++){const a=k/10*PI*2-PI/2,rr=k%2?14:28;c.lineTo(32+Math.cos(a)*rr,32+Math.sin(a)*rr)}c.closePath();c.fill()});
  if(L.length){LITTER=inst(new THREE.PlaneGeometry(.45,.45).rotateX(-PI/2),new THREE.MeshLambertMaterial({map:lt,alphaTest:.5,side:THREE.DoubleSide}),L,1);LITTER.castShadow=false;delete LITTER.userData.q}}
 // Luces de Navidad: puntos de colores cálidos en las copas de los árboles junto a las avenidas
 {const P=[],C=[],r=rng(21),c=new THREE.Color(),pal=[0xfff1c4,0xffd36b,0xfff8e8,0x9fd0ff];let n=0;
  for(const t of TREES){if(t.s===2||n>420)continue;const x=t.e[0],z=t.e[2];if(roadAt(x+4,z)<0&&roadAt(x-4,z)<0&&roadAt(x,z+4)<0&&roadAt(x,z-4)<0)continue;n++;const cy=t.s===0?5.6:4.3,R=t.s===0?1.6:2.2;
   for(let k=0;k<34;k++){const u=r()*2-1,a=r()*PI*2,s=Math.sqrt(1-u*u);P.push(x+Math.cos(a)*s*R,cy+u*R*.9,z+Math.sin(a)*s*R);c.set(pal[(r()*pal.length)|0]);C.push(c.r,c.g,c.b)}}
  if(P.length){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(P,3));g.setAttribute("color",new THREE.Float32BufferAttribute(C,3));
   XMAS=new THREE.Points(g,new THREE.PointsMaterial({size:.28,vertexColors:true,map:SNOWP.material.map,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0}));XMAS.frustumCulled=false;XMAS.visible=false;sc.add(XMAS)}}
 // Farolillos rojos (chōchin) colgados bajo los toldos de las tiendas (verano)
 if(typeof AWP!=="undefined"&&AWP.length){if(!NM.lant){NM.lant=new THREE.MeshLambertMaterial({color:0xd8302a,emissive:0xff4a20,emissiveIntensity:.1});NM.sign.push(NM.lant)}
  const L=AWP.filter((a,i)=>i%2===0).map(a=>[a[0]+Math.sin(a[3])*.45,a[1]+CURB-.75,a[2]+Math.cos(a[3])*.45,a[3]]);LANT=inst(new THREE.CylinderGeometry(.17,.17,.42,10),NM.lant,L,1);delete LANT.userData.q;LANT.castShadow=false}
 seasonApply(seasonNow())}
// Cambiar de estación: colores de los árboles (sencillos y detallados), hojas en el suelo, adornos y calima
const TGEO={};
function seasonApply(se){if(se===SEASON||!TREES.length)return;SEASON=se;
 for(let sp=0;sp<3;sp++){const key=sp+"_"+se;if(!TGEO[key])TGEO[key]=treeGeo(sp,se);for(const m of new Set(TREES.filter(t=>t.s===sp).map(t=>t.m))){const bs=m.geometry.boundingSphere,g=TGEO[key].clone();g.boundingSphere=bs.clone();m.geometry.dispose();m.geometry=g}
  const H=TREEH[sp];if(H){H.lm.map=H.dm.map=leafTex(sp,se);H.l.visible=!(se===3&&sp===0)}}
 SEAFOG=se===1?.82:1;if(se!==3)SNOWACC=0;
 SEASK=SEASL[se];SEAU.uGrass.value.fromArray(SEASK.grass);SEAU.uPetal.value=SEASK.pet;SEAU.uFrost.value=SEASK.fr}
// Cada imagen: estación actual, nieve que cae y se acumula, pétalos, adornos según la hora
function seasonTick(dt){if(SNOWP===null)return;if(Math.random()<.02)seasonApply(seasonNow());const se=SEASON,lv=qLevel(),c=cam.position,tm=performance.now()/1000,out=state==="play"||state==="cars";
 const snowing=se===3&&WEA.rain>.05;SNOWACC=Math.max(0,Math.min(1,SNOWACC+(snowing?dt*WEA.rain/120:-dt/900)));SNOWU.uSnow.value=SNOWACC;WEA.snow=SNOWACC;
 const fall=(P,sp,sw,show)=>{P.visible=show&&out;if(!P.visible)return;const p=P.geometry.attributes.position.array;P.position.set(c.x,0,c.z);
  for(let i=0;i<p.length;i+=3){p[i+1]-=sp*dt;p[i]+=Math.sin(tm*1.3+i)*sw*dt;p[i+2]+=Math.cos(tm*1.1+i*.7)*sw*dt;if(p[i+1]<0){p[i+1]+=30;p[i]=(Math.random()-.5)*70;p[i+2]=(Math.random()-.5)*70}}P.geometry.attributes.position.needsUpdate=true};
 fall(SNOWP,1.6,.8,snowing);SNOWP.material.opacity=Math.min(.95,WEA.rain*1.2);fall(PETP,.8,1.6,se===0);
 if(LITTER)LITTER.visible=se===2&&lv>=1;if(LANT)LANT.visible=se===1&&lv>=1;if(XMAS){XMAS.visible=se===3&&NF>.15;XMAS.material.opacity=NF*.95}}
