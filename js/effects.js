// Efectos: marcas de neumáticos y humo
let slipV=0,brkL=0,sT=0,mi=0;
// Marcas de neumáticos: una cinta continua por rueda trasera que sigue la curva del derrape (tramos unidos borde con borde) y se va
// aclarando hasta desaparecer. Búfer circular de SEG tramos de 2 triángulos
const SEG=1400,LIFE=16,RC=new THREE.Color(0x2b2d34),BK=new THREE.Color(0x050505),mcol=new THREE.Color(),mb=new Float32Array(SEG).fill(-99),mkk=new Float32Array(SEG),
 MKP=new Float32Array(SEG*18),MKC=new Float32Array(SEG*18),mkg=new THREE.BufferGeometry();
mkg.setAttribute("position",new THREE.BufferAttribute(MKP,3));mkg.setAttribute("color",new THREE.BufferAttribute(MKC,3));
mkg.setAttribute("normal",new THREE.BufferAttribute(new Float32Array(SEG*18).map((v,i)=>i%3===1?1:0),3));
const mk=new THREE.Mesh(mkg,new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-3,polygonOffsetUnits:-3}));mk.frustumCulled=false;mk.renderOrder=1;sc.add(mk);
const TRK=[{on:false},{on:false}];
const cv=document.createElement("canvas");cv.width=cv.height=64;const cg=cv.getContext("2d"),gd=cg.createRadialGradient(32,32,0,32,32,32);
gd.addColorStop(0,"rgba(255,255,255,.9)");gd.addColorStop(1,"rgba(255,255,255,0)");cg.fillStyle=gd;cg.fillRect(0,0,64,64);
const stx=new THREE.CanvasTexture(cv),SM=[];let si=0;
for(let k=0;k<50;k++){const s=new THREE.Sprite(new THREE.SpriteMaterial({map:stx,transparent:true,opacity:0,depthWrite:false,color:0xdddddd}));s.visible=false;sc.add(s);SM.push({s,l:9,vx:0,vy:0,vz:0,o:0})}
function effects(dt){const vf=vx*Math.sin(h)+vz*Math.cos(h),sp=Math.hypot(vx,vz),now=performance.now()/1e3;
 const sk=Math.max(slipV>3.5&&sp>6?Math.min(1,(slipV-3)/6):0,brkL>.6&&vf>12?.5:0);
 const wp=sx=>[px+Math.cos(h)*sx*cur.w*.42-Math.sin(h)*cur.l*.32,pz-Math.sin(h)*sx*cur.w*.42-Math.cos(h)*cur.l*.32];let chg=false;
 [-1,1].forEach((sx,w)=>{const T=TRK[w],q=wp(sx);if(sk<=0){T.on=false;return}
  if(!T.on){Object.assign(T,{on:true,x:q[0],z:q[1],l:null});return}
  const dx=q[0]-T.x,dz=q[1]-T.z,d=Math.hypot(dx,dz);if(d<.3)return;if(d>3){Object.assign(T,{x:q[0],z:q[1],l:null});return}
  const ox=-dz/d*.16,oz=dx/d*.16,y=surfH(q[0],q[1])+.02,y0=surfH(T.x,T.z)+.02,a=T.l||[T.x-ox,y0,T.z-oz,T.x+ox,y0,T.z+oz],b=[q[0]-ox,y,q[1]-oz,q[0]+ox,y,q[1]+oz];
  MKP.set([a[0],a[1],a[2],b[0],b[1],b[2],b[3],b[4],b[5],a[0],a[1],a[2],b[3],b[4],b[5],a[3],a[4],a[5]],mi*18);mb[mi]=now;mkk[mi]=.4+.6*sk;mi=(mi+1)%SEG;
  T.x=q[0];T.z=q[1];T.l=b;chg=true});
 if(sk>0){sT+=dt;if(sT>.04&&sk>.2){sT=0;const q=wp(Math.random()<.5?-1:1),m=SM[si];si=(si+1)%50;m.s.position.set(q[0],.4,q[1]);m.s.visible=true;m.l=0;m.o=.55*sk;m.vx=vx*.2+(Math.random()-.5);m.vy=.8+Math.random()*.6;m.vz=vz*.2+(Math.random()-.5)}}
 // Las marcas se aclaran con el tiempo hasta el color del asfalto; las caducadas se aplastan a un punto
 for(let k=0;k<SEG;k++){if(mb[k]<0)continue;const t=(now-mb[k])/LIFE;
  if(t>=1){MKP.fill(0,k*18,k*18+18);mb[k]=-99;chg=true}else{mcol.copy(RC).lerp(BK,mkk[k]*(1-t));for(let v=k*18;v<k*18+18;v+=3){MKC[v]=mcol.r;MKC[v+1]=mcol.g;MKC[v+2]=mcol.b}chg=true}}
 if(chg){mkg.attributes.position.needsUpdate=true;mkg.attributes.color.needsUpdate=true}
 for(const m of SM){if(m.l>=1.4)continue;m.l+=dt;const u=m.l/1.4,z=1.2+u*3.5;m.s.position.x+=m.vx*dt;m.s.position.y+=m.vy*dt;m.s.position.z+=m.vz*dt;m.s.scale.set(z,z,1);m.s.material.opacity=m.o*(1-u);if(u>=1)m.s.visible=false}}
