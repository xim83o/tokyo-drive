// Bucle principal: física, cámaras, cinemáticas AFK y render
function resize(){rd.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix()}
addEventListener("resize",resize);resize();
let last=performance.now(),t0=0;
function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1e3);last=n;
 if(state==="play"){const inp=input();idle=(inp.t||inp.b||Math.abs(inp.s)>.1||inp.hb||keyAct)?0:idle+dt;keyAct=0;step(dt,inp);npcs(dt);
  car.position.set(px,bodyY,pz);car.rotation.set(pitch,h,roll);
  // Niebla que se cierra al acercarse al borde del mapa (ahí hay un muro invisible)
  const de=Math.min(px,pz,W-px,W-pz);sc.fog.far=Math.min(FOGF,90+de*2.2);sc.fog.near=sc.fog.far*.2;
  const sp=Math.hypot(vx,vz),kmh=Math.round(sp*3.6);
  gearCalc(dt);hud(kmh,gearL,rpmD);effects(dt);audio();
  const cin=idle>15;camH+=ad(h,camH)*Math.min(1,dt*(mode<2||cin?3.5:20));
  const fx=Math.sin(camH),fz=Math.cos(camH),hx=Math.sin(h),hz=Math.cos(h);let fv=65+Math.min(22,sp*.3);cam.up.set(0,1,0);
  if(intG)intG.visible=mode===3&&!cin;if(whl)whl.rotation.z=stV*1.2;for(const e of HUDS)$(e).hidden=cin;
  if(cin){ca+=dt*.3;const cv2=Math.floor((idle-15)/7)%5,rx=-Math.cos(h),rz=Math.sin(h);
   if(cv2==0){cam.position.set(px+Math.sin(ca)*11,3.5,pz+Math.cos(ca)*11);cam.lookAt(px,1,pz);fv=50}
   else if(cv2==1){cam.position.set(px+hx*9+rx*Math.sin(ca)*2,.9,pz+hz*9+rz*Math.sin(ca)*2);cam.lookAt(px,.8,pz);fv=60}
   else if(cv2==2){const s=Math.sin(ca*.7);cam.position.set(px+rx*8+hx*s*9,1.2+(1-Math.abs(s))*1.3,pz+rz*8+hz*s*9);cam.lookAt(px,.9,pz);fv=45}
   else if(cv2==3){cam.position.set(px+Math.sin(ca*.5)*20,26,pz+Math.cos(ca*.5)*20);cam.lookAt(px,0,pz);fv=55}
   else{const a=ca*.8+2;cam.position.set(px+Math.sin(a)*4.5,.6,pz+Math.cos(a)*4.5);cam.lookAt(px,.5,pz);fv=70}}
  else if(mode<2){const d=(mode?13:8)+sp*.04;cam.position.set(px-fx*d,(mode?5:3.2)+sp*.012,pz-fz*d);cam.lookAt(px+fx*6,1.2,pz+fz*6)}
  else if(mode==2){cam.position.set(px+hx*1.5,1.1+bodyY,pz+hz*1.5);cam.lookAt(px+hx*20,1.2+bodyY,pz+hz*20)}
  else if(mode==3){cam.position.set(px+hx*.1-Math.cos(h)*.38,cur.ey+bodyY,pz+hz*.1+Math.sin(h)*.38);cam.lookAt(px+hx*20,cur.ey+bodyY,pz+hz*20)}
  else{cam.up.set(fx,0,fz);cam.position.set(px,75,pz);cam.lookAt(px,0,pz);fv=55}
  cam.fov=fv;cam.updateProjectionMatrix();mini()}
 else{audio(true);t0+=dt*.1;sc.fog.far=FOGF;sc.fog.near=FOGF*.2;
  if(spawned){cam.position.set(px+Math.sin(t0)*220,90,pz+Math.cos(t0)*220);cam.lookAt(px,20,pz)}else{cam.position.set(TX+Math.sin(t0)*420,140,TZ+Math.cos(t0)*420);cam.lookAt(TX,110,TZ)}}
 rd.render(sc,cam)}
const FOGF=sc.fog.far;loop(last);
loadWorld().then(()=>{initTraffic();ld.hidden=true}).catch(e=>{console.error(e);ld.textContent="No se pudo cargar el mapa. Ábrelo con jugar.bat (necesita el servidor local)."});
