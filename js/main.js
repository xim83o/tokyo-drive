// Bucle principal: física, cámaras, cinemáticas AFK, ambiente y render
function resize(){rd.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();if(typeof postSize==="function")postSize()}
addEventListener("resize",resize);resize();
let last=performance.now(),t0=0,lastCin=false;const LK=new THREE.Vector3();
// La cámara no atraviesa nada: edificios, árboles, postes, coches ni la Torre de Tokio. Si algo se interpone entre el coche
// y la cámara, la cámara se acerca al coche
function camHit(x,y,z){if(camBlocked(x,y,z))return true;const c=gq(x,z);
 for(const k of c.o){const b=k*3,r=CI[b+2]+.6;if(y<10&&(x-CI[b])**2+(z-CI[b+1])**2<r*r)return true}
 for(const n of NPC)if(n.g.visible&&y<2.4&&(x-n.x)**2+(z-n.z)**2<6.5)return true;
 const u=(x-TX)*Math.cos(TA)+(z-TZ)*Math.sin(TA),v=-(x-TX)*Math.sin(TA)+(z-TZ)*Math.cos(TA),w=y<250?37*Math.exp(-y/86)+3.5:3;return Math.abs(u)<w&&Math.abs(v)<w&&y<333}
function clipCam(){if(!ready)return;const tx=px,ty=1.4+bodyY,tz=pz,P=cam.position;let ok=1;
 for(let k=2;k<=20;k++){const f=k/20;if(camHit(tx+(P.x-tx)*f,ty+(P.y-ty)*f,tz+(P.z-tz)*f)){ok=(k-1)/20*.92;break}}
 if(ok<1)P.set(tx+(P.x-tx)*ok,ty+(P.y-ty)*ok,tz+(P.z-tz)*ok);P.y=Math.max(P.y,CURB+.35)}
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1e3);last=n;if(state!=="liv"&&cam.view&&cam.view.enabled){cam.clearViewOffset()}
 if(state==="play"){const inp=input();idle=(inp.t||inp.b||Math.abs(inp.s)>.1||inp.hb||keyAct)?0:idle+dt;keyAct=0;step(dt,inp);wheelSpin(dt);npcs(dt);
  car.position.set(px,bodyY,pz);car.rotation.set(pitch,h,roll);
  // Niebla que se cierra al acercarse al borde del mapa (ahí hay un muro invisible)
  const de=Math.min(px,pz,W-px,W-pz);sc.fog.far=Math.min(FOGF,90+de*2.2);sc.fog.near=sc.fog.far*.2;
  const sp=Math.hypot(vx,vz),kmh=Math.round(sp*3.6);
  gearCalc(dt);hud(kmh,gearL,rpmD);effects(dt);audio();
  const cin=idle>15;camH+=ad(h,camH)*Math.min(1,dt*(mode<2||cin?3.5:20));
  const fx=Math.sin(camH),fz=Math.cos(camH),hx=Math.sin(h),hz=Math.cos(h);let fv=65+Math.min(22,sp*.3);cam.up.set(0,1,0);
  if(intG)intG.visible=mode===3&&!cin;if(whl)whl.rotation.z=stV*1.2;if(cin!==lastCin){lastCin=cin;hudVis(!cin)}
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
 else{audio(true);t0+=dt*.1;sc.fog.far=FOGF;sc.fog.near=FOGF*.2;
  // En ajustes con la partida empezada, la imagen se queda quieta (pausa)
  if(state==="set"&&spawned&&setPrev==="play"){}
  // Editor de calcomanías: la cámara gira alrededor del coche, que queda a la derecha del panel
  else if(state==="liv"){const a=h+livA,pw=$("livP").offsetWidth+12,c=livCenter();cam.position.set(c.x+Math.sin(a)*6.5,c.y+2.2,c.z+Math.cos(a)*6.5);cam.lookAt(c.x,c.y+.7,c.z);cam.fov=50;
   cam.setViewOffset(innerWidth,innerHeight,-pw/2,0,innerWidth,innerHeight);cam.updateProjectionMatrix()}
  else if(spawned){cam.position.set(px+Math.sin(t0)*220,90,pz+Math.cos(t0)*220);cam.lookAt(px,20,pz)}else{cam.position.set(TX+Math.sin(t0)*420,140,TZ+Math.cos(t0)*420);cam.lookAt(TX,110,TZ)}}
 envUpdate(dt);studio();seasonTick(dt);if(typeof weather==="function")weather(dt);renderFrame()}
loop(last);
Promise.all([loadWorld(),loadCars()]).then(()=>{initTraffic();seasonInit();applyQuality();ld.hidden=true}).catch(e=>{console.error(e);ld.textContent=T("No se pudo cargar el mapa. Ábrelo con jugar.bat (necesita el servidor local).")});
