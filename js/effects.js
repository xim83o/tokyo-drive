// Efectos: marcas de neumáticos y humo
let slipV=0,brkL=0,mAcc=0,sT=0,mi=0;
const MK=400,LIFE=14,RC=new THREE.Color(0x2b2d34),BK=new THREE.Color(0x050505),mcol=new THREE.Color(),mo=new THREE.Object3D(),mb=new Float32Array(MK).fill(-99),mkk=new Float32Array(MK),
 mk=new THREE.InstancedMesh(new THREE.PlaneGeometry(.4,1.1),new THREE.MeshLambertMaterial(),MK);
mo.rotation.order="YXZ";mo.scale.set(0,0,0);mo.updateMatrix();mk.frustumCulled=false;
for(let k=0;k<MK;k++){mk.setMatrixAt(k,mo.matrix);mk.setColorAt(k,RC)}sc.add(mk);
const cv=document.createElement("canvas");cv.width=cv.height=64;const cg=cv.getContext("2d"),gd=cg.createRadialGradient(32,32,0,32,32,32);
gd.addColorStop(0,"rgba(255,255,255,.9)");gd.addColorStop(1,"rgba(255,255,255,0)");cg.fillStyle=gd;cg.fillRect(0,0,64,64);
const stx=new THREE.CanvasTexture(cv),SM=[];let si=0;
for(let k=0;k<50;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:stx,transparent:true,opacity:0,depthWrite:false,color:0xdddddd}));s.visible=false;sc.add(s);SM.push({s,l:9,vx:0,vy:0,vz:0,o:0})}
function effects(dt){const vf=vx*Math.sin(h)+vz*Math.cos(h),sp=Math.hypot(vx,vz),now=performance.now()/1e3;
 const sk=Math.max(slipV>3.5&&sp>6?Math.min(1,(slipV-3)/6):0,brkL>.6&&vf>12?.5:0);
 if(sk>0){mAcc+=sp*dt;sT+=dt;
  const wp=sx=>[px+Math.cos(h)*sx*cur.w/2-Math.sin(h)*cur.l*.32,pz-Math.sin(h)*sx*cur.w/2-Math.cos(h)*cur.l*.32];
  if(mAcc>.9){mAcc=0;const yaw=Math.atan2(vx,vz);
   for(const sx of[-1,1]){const q=wp(sx);mo.position.set(q[0],surfH(q[0],q[1])+.03,q[1]);mo.rotation.set(-PI/2,yaw,0);mo.scale.set(1,1,1);mo.updateMatrix();mk.setMatrixAt(mi,mo.matrix);mb[mi]=now;mkk[mi]=.4+.6*sk;mi=(mi+1)%MK}}
  if(sT>.04&&sk>.2){sT=0;const q=wp(Math.random()<.5?-1:1),m=SM[si];si=(si+1)%50;m.s.position.set(q[0],.4,q[1]);m.s.visible=true;m.l=0;m.o=.55*sk;m.vx=vx*.2+(Math.random()-.5);m.vy=.8+Math.random()*.6;m.vz=vz*.2+(Math.random()-.5)}}
 for(let k=0;k<MK;k++){if(mb[k]<0)continue;const t=(now-mb[k])/LIFE;
  if(t>=1){mo.scale.set(0,0,0);mo.updateMatrix();mk.setMatrixAt(k,mo.matrix);mb[k]=-99}else mk.setColorAt(k,mcol.copy(RC).lerp(BK,mkk[k]*(1-t)))}
 mk.instanceColor.needsUpdate=true;mk.instanceMatrix.needsUpdate=true;
 for(const m of SM){if(m.l>=1.4)continue;m.l+=dt;const u=m.l/1.4,z=1.2+u*3.5;m.s.position.x+=m.vx*dt;m.s.position.y+=m.vy*dt;m.s.position.z+=m.vz*dt;m.s.scale.set(z,z,1);m.s.material.opacity=m.o*(1-u);if(u>=1)m.s.visible=false}}
