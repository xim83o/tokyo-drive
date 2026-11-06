// Bucle principal: física, cámaras, cinemáticas AFK, ambiente y render
function resize(){rd.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();if(typeof postSize==="function")postSize()}
addEventListener("resize",resize);resize();
let last=performance.now(),t0=0,lastCin=false;const SPEC={x:0,y:20,z:0,a:0,p:-.4};
function startSpec(){if(!spawned)return;closeSettings();SPEC.x=px-Math.sin(h)*20;SPEC.z=pz-Math.cos(h)*20;SPEC.y=22;SPEC.a=h;SPEC.p=-.5;state="spec";$("ov").hidden=true;hudVis(false);$("touch").hidden=true}
// Arrastrar con el ratón también gira la cámara del espectador
{let dg=null;addEventListener("pointerdown",e=>{if(state==="spec")dg=[e.clientX,e.clientY]});addEventListener("pointermove",e=>{if(state==="spec"&&dg){SPEC.a-=(e.clientX-dg[0])*.005;SPEC.p=Math.max(-1.4,Math.min(1.4,SPEC.p-(e.clientY-dg[1])*.005));dg=[e.clientX,e.clientY]}});addEventListener("pointerup",()=>dg=null)}const LK=new THREE.Vector3();
// La cámara no atraviesa nada: edificios, árboles, postes, coches ni la Torre de Tokio. Si algo se interpone entre el coche
// y la cámara, la cámara se acerca al coche
function camHit(x,y,z){if(HWL.on){let q=hwyNear(px,pz,HWL.y);if(!q||!HWL.segs[q[0]][7]){q=hwyNear(x,z,HWL.y);if(!q||q[2]>HWL.segs[q[0]][6]-.3)return true}}   // en el tablero la cámara no sale de los pretiles; en las rampas sí puede (son curvas y estrechas: si no, se pega al coche)
 if(camBlocked(x,y,z))return true;const c=gq(x,z);
 for(const k of c.o){const b=k*3,r=CI[b+2]+.6;if(y<10&&(x-CI[b])**2+(z-CI[b+1])**2<r*r)return true}
 // Coches: solo si el punto cae dentro de su caja de verdad (largo, ancho y alto, con un margen pequeño). Antes era un círculo de 2,5 m
 // y la cámara se acercaba al cruzarse con un coche en sentido contrario aunque no tapara nada
 for(const n of NPC){if(!n.g.visible||y>(n.l>5?2.9:1.9))continue;const dx=x-n.x,dz=z-n.z;if(dx*dx+dz*dz>16)continue;const s=Math.sin(n.h),c=Math.cos(n.h);
  if(Math.abs(dx*s+dz*c)<n.l/2+.25&&Math.abs(dx*c-dz*s)<(n.w||1.8)/2+.25)return true}
 const u=(x-TX)*Math.cos(TA)+(z-TZ)*Math.sin(TA),v=-(x-TX)*Math.sin(TA)+(z-TZ)*Math.cos(TA),w=y<250?37*Math.exp(-y/86)+3.5:3;
 // Torre: por debajo de los arcos (30 m en el centro de cada cara, 6 m junto a las patas) solo cuentan las patas, para que la
 // cámara pueda pasar por debajo entre ellas
 if(y<30){const a=w-.7,du=Math.abs(Math.abs(u)-a),dv=Math.abs(Math.abs(v)-a),s=Math.abs(u)>Math.abs(v)?v:u;if(y<TARCH((s/a+1)/2))return du<3.2&&dv<3.2}
 return Math.abs(u)<w&&Math.abs(v)<w&&y<333}
function clipCam(){if(!ready)return;const tx=px,ty=1.4+bodyY,tz=pz,P=cam.position;let ok=1;
 for(let k=2;k<=20;k++){const f=k/20;if(camHit(tx+(P.x-tx)*f,ty+(P.y-ty)*f,tz+(P.z-tz)*f)){ok=(k-1)/20*.92;break}}
 if(ok<1)P.set(tx+(P.x-tx)*ok,ty+(P.y-ty)*ok,tz+(P.z-tz)*ok);P.y=Math.max(P.y,CURB+.35)}
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1e3);last=n;if(DV.pause)return;if(state!=="liv"&&cam.view&&cam.view.enabled){cam.clearViewOffset()}
 if(state==="play"){const inp=input();idle=(inp.t||inp.b||Math.abs(inp.s)>.1||inp.hb||keyAct)?0:idle+dt;keyAct=0;step(dt,inp);wheelSpin(dt);npcs(dt);
  car.position.set(px,bodyY,pz);car.rotation.set(pitch,h,roll);
  // Niebla que se cierra al acercarse al borde del mapa (ahí hay un muro invisible)
  const de=Math.min(px,pz,W-px,W-pz);sc.fog.far=Math.min(FOGF,90+de*2.2);sc.fog.near=sc.fog.far*.2;
  const sp=Math.hypot(vx,vz),kmh=Math.round(sp*3.6);
  gearCalc(dt);hud(kmh,gearL,rpmD);effects(dt);audio();
  const cin=idle>15;camH+=ad(h,camH)*Math.min(1,dt*(mode<2||cin?3.5:20));
  const fx=Math.sin(camH),fz=Math.cos(camH),hx=Math.sin(h),hz=Math.cos(h);let fv=65+Math.min(22,sp*.3);cam.up.set(0,1,0);
  // Primera persona: interior sencillo y la carrocería de fuera (con calcomanías, luces y sombra) oculta para no ver piezas por dentro
  if(intG){const ins=mode===3&&!cin;intG.visible=ins;for(const o of car.children)if(o!==intG)o.visible=!ins}if(whl)whl.rotation.z=stV*1.2;if(cin!==lastCin){lastCin=cin;hudVis(!cin)}
  if(cin){ca+=dt*.3;const cv2=Math.floor((idle-15)/7)%5,rx=-Math.cos(h),rz=Math.sin(h);
   if(cv2==0){cam.position.set(px+Math.sin(ca)*11,3.5,pz+Math.cos(ca)*11);LK.set(px,1,pz);fv=50}
   else if(cv2==1){cam.position.set(px+hx*9+rx*Math.sin(ca)*2,.9,pz+hz*9+rz*Math.sin(ca)*2);LK.set(px,.8,pz);fv=60}
   else if(cv2==2){const s=Math.sin(ca*.7);cam.position.set(px+rx*8+hx*s*9,1.2+(1-Math.abs(s))*1.3,pz+rz*8+hz*s*9);LK.set(px,.9,pz);fv=45}
   else if(cv2==3){cam.position.set(px+Math.sin(ca*.5)*20,26,pz+Math.cos(ca*.5)*20);LK.set(px,0,pz);fv=55}
   else{const a=ca*.8+2;cam.position.set(px+Math.sin(a)*4.5,.6+bodyY,pz+Math.cos(a)*4.5);LK.set(px,.5,pz);fv=70}
   clipCam();cam.lookAt(LK)}
  else if(mode<2){const d=(mode?13:8)+sp*.04;cam.position.set(px-fx*d,(mode?5:3.2)+sp*.012+bodyY,pz-fz*d);LK.set(px+fx*6,1.2+bodyY,pz+fz*6);clipCam();cam.lookAt(LK)}
  else if(mode==2){cam.position.set(px+hx*1.5,1.1+bodyY,pz+hz*1.5);cam.lookAt(px+hx*20,1.2+bodyY,pz+hz*20)}
  else{cam.position.set(px+hx*.1-Math.cos(h)*.38,cur.ey+bodyY,pz+hz*.1+Math.sin(h)*.38);cam.lookAt(px+hx*20,cur.ey+bodyY,pz+hz*20)}
  cam.fov=fv;cam.updateProjectionMatrix();mini()}
 else{audio(true);t0+=dt*.1;if(intG&&intG.visible){intG.visible=false;for(const o of car.children)if(o!==intG)o.visible=true}sc.fog.far=FOGF;sc.fog.near=FOGF*.2;
  // En ajustes con la partida empezada, la imagen se queda quieta (pausa)
  if(state==="set"&&spawned&&setPrev==="play"){}
  // Modo espectador: cámara libre (WASD mover, Q/E bajar y subir, flechas o arrastrar para girar, Mayús rápido, Esc salir); el tráfico sigue
  else if(state==="photo"||state==="replay")raceCam(dt);
  else if(state==="devcity")devCityTick(dt);else if(state==="devscn")devScnTick(dt);
  else if(state==="spec"){npcs(dt);const k=(keys.ShiftLeft||keys.ShiftRight?60:18)*dt,f=SPEC,fw=[Math.sin(f.a),Math.cos(f.a)];if(keys.ArrowLeft)f.a+=dt*1.5;if(keys.ArrowRight)f.a-=dt*1.5;if(keys.ArrowUp)f.p=Math.min(1.4,f.p+dt);if(keys.ArrowDown)f.p=Math.max(-1.4,f.p-dt);
   if(keys.KeyW){f.x+=fw[0]*k;f.z+=fw[1]*k}if(keys.KeyS){f.x-=fw[0]*k;f.z-=fw[1]*k}if(keys.KeyA){f.x+=fw[1]*k;f.z-=fw[0]*k}if(keys.KeyD){f.x-=fw[1]*k;f.z+=fw[0]*k}if(keys.KeyE)f.y+=k;if(keys.KeyQ)f.y=Math.max(1.5,f.y-k);
   cam.position.set(f.x,f.y,f.z);cam.lookAt(f.x+Math.sin(f.a)*Math.cos(f.p),f.y+Math.sin(f.p),f.z+Math.cos(f.a)*Math.cos(f.p));cam.fov=65;cam.updateProjectionMatrix();sc.fog.far=FOGF}
  // Editor de calcomanías: la cámara gira alrededor del coche, que queda a la derecha del panel
  else if(state==="liv"){const a=h+livA,pw=$("livP").offsetWidth+12,c=livCenter();cam.position.set(c.x+Math.sin(a)*6.5,c.y+2.2,c.z+Math.cos(a)*6.5);cam.lookAt(c.x,c.y+.7,c.z);cam.fov=50;
   cam.setViewOffset(innerWidth,innerHeight,-pw/2,0,innerWidth,innerHeight);cam.updateProjectionMatrix()}
  else if(spawned){cam.position.set(px+Math.sin(t0)*220,90,pz+Math.cos(t0)*220);cam.lookAt(px,20,pz)}else{cam.position.set(TX+Math.sin(t0)*420,140,TZ+Math.cos(t0)*420);cam.lookAt(TX,110,TZ)}}
 envUpdate(dt);studio();seasonTick(dt);radioTick();if(typeof weather==="function")weather(dt);if(ready)placesTick(dt);renderFrame()}
// Antes de dejar jugar: compila los materiales, sube las texturas a la tarjeta y dibuja la ciudad en cuatro direcciones, para que no haya tirones al empezar
async function gfxWarm(){await LDS.step(88,"Preparando los gráficos");try{rd.compile(sc,cam)}catch(e){console.warn(e)}await LDS.step(91,"Subiendo las texturas");
 const tx=new Set();sc.traverse(o=>{const m=o.material;if(!m)return;for(const q of Array.isArray(m)?m:[m])for(const k of["map","emissiveMap","lightMap","specularMap","alphaMap"])if(q[k]&&q[k].isTexture&&!q[k].isCubeTexture)tx.add(q[k])});
 if(rd.initTexture)for(const t of tx)rd.initTexture(t);envUpdate(.016);
 for(let k=0;k<4;k++){await LDS.step(93+k*1.7,"Dibujando la ciudad");const a=k*PI/2+.5;cam.position.set(TX+Math.sin(a)*300,36,TZ+Math.cos(a)*300);cam.lookAt(TX,10,TZ);cam.updateMatrixWorld();renderFrame()}}
Promise.all([loadWorld(),loadCars(),Promise.all(ENGB).catch(()=>{})]).then(async()=>{await LDS.step(84,"Colocando el tráfico");initTraffic();placeParked();placeDeadSigns();seasonInit();applyQuality();await gfxWarm();last=performance.now();loop(last);LDS.ready()}).catch(e=>{console.error(e);LDS.fail(T("No se pudo cargar el mapa. Ábrelo con jugar.bat (necesita el servidor local)."))});
