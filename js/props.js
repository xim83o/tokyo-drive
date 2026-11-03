// Mobiliario urbano: árboles (OSM, parques y aceras), farolas con su charco de luz nocturno, señales de velocidad,
// máquinas expendedoras y postes eléctricos con cables (muy típicos de las calles pequeñas de Tokio)
let lampN=0;const LAMPS=[];
// Geometría de un árbol (tronco + copa de varios bultos deformados con colores variados). sp: 0 ginkgo, 1 copa redonda, 2 conífera
function treeGeo(sp){const r=rng(31+sp*7),parts=[],col=(g,cs)=>{const n=g.attributes.position.count,a=new Float32Array(n*3),c=new THREE.Color();for(let i=0;i<n;i++){c.set(cs[(r()*cs.length)|0]);c.offsetHSL(0,0,(r()-.5)*.06);a[i*3]=c.r;a[i*3+1]=c.g;a[i*3+2]=c.b}g.setAttribute("color",new THREE.BufferAttribute(a,3));return g};
 const lump=(rad,x,y,z,sx,sy,cs)=>{const g=new THREE.IcosahedronGeometry(rad,0).toNonIndexed(),p=g.attributes.position;for(let i=0;i<p.count;i++){const k=.82+r()*.32;p.setXYZ(i,p.getX(i)*k*sx+x,p.getY(i)*k*sy+y,p.getZ(i)*k*sx+z)}g.computeVertexNormals();parts.push(col(g,cs))};
 const trunk=(h,r0)=>{const g=new THREE.CylinderGeometry(r0*.65,r0,h,7).toNonIndexed();g.translate(0,h/2,0);parts.push(col(g,["#5a4332","#4d392b","#634a37"]))};
 if(sp===0){trunk(5,.2);const cs=["#e6c22e","#d9b21f","#f0d34a","#b8a63a","#c9b52c"];lump(1.3,0,5.6,0,1,1.5,cs);lump(1,.5,4.2,.3,1,1.3,cs);lump(1,-.45,4.4,-.35,1,1.3,cs);lump(.8,.1,7,0,1,1.2,cs)}
 else if(sp===1){trunk(3,.22);const cs=["#3f7a3a","#4f8a3f","#356b35","#6a8f3a","#8a8f34"];for(let k=0;k<7;k++){const a=k/6*PI*2,d=k?1.1:0;lump(k?1.2:1.5,Math.cos(a)*d,3.9+(k?r()*.8:1),Math.sin(a)*d,1,.85,cs)}}
 else{trunk(2.5,.2);const cs=["#2f5a34","#36633a","#284d2d"];for(let k=0;k<3;k++){const g=new THREE.ConeGeometry(1.9-k*.5,2.6,8).toNonIndexed();g.translate(0,2.6+k*1.5,0);parts.push(col(g,cs))}}
 // Unir todas las partes en una sola geometría
 let n=0;for(const g of parts)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let o=0;
 for(const g of parts){P.set(g.attributes.position.array,o);N.set(g.attributes.normal.array,o);C.set(g.attributes.color.array,o);o+=g.attributes.position.count*3}
 const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(P,3));g.setAttribute("normal",new THREE.BufferAttribute(N,3));g.setAttribute("color",new THREE.BufferAttribute(C,3));return g}
// Árbol detallado (calidad Alta y Ultra): tronco y ramas en 3D y copa hecha de muchos racimos de hojas dibujadas, cada racimo con
// tres planos cruzados en direcciones al azar (no un plano mirando a la cámara). Las normales salen del centro de la copa para que la
// luz la ilumine como un volumen. Devuelve [madera, hojas] para usar con dos materiales
const LEAFTEX=[];
function leafTex(sp){if(LEAFTEX[sp])return LEAFTEX[sp];const cs=[["#f2cf3a","#e3b21f","#f7dc5a","#c9a227","#d8be3c"],["#4e8a3e","#3f7a35","#5f9a45","#7a9a3a","#8f8f32","#b07a2a"],["#2f5a34","#3a6a3c","#264c2b","#43703f"]][sp],r=rng(55+sp);
 const t=canvasTex(256,256,(g)=>{for(let i=0;i<(sp===2?1100:260);i++){const x=20+r()*216,y=20+r()*216,d=Math.hypot(x-128,y-128);if(d>112)continue;g.fillStyle=cs[(r()*cs.length)|0];g.save();g.translate(x,y);g.rotate(r()*PI*2);
  if(sp===0){g.beginPath();g.moveTo(0,0);g.arc(0,0,9+r()*5,-.9,.9);g.closePath();g.fill()}else if(sp===1){g.beginPath();g.ellipse(0,0,4+r()*3,9+r()*4,0,0,7);g.fill()}else{g.fillRect(-1.5,-9,3,18)}g.restore()}});
 t.wrapS=t.wrapT=THREE.ClampToEdgeWrapping;return LEAFTEX[sp]=t}
function treeGeoHi(sp){const r=rng(77+sp*11),wood=[],leaf=[];
 const cyl=(x0,y0,z0,x1,y1,z1,r0,r1)=>{const d=new THREE.Vector3(x1-x0,y1-y0,z1-z0),L=d.length(),g=new THREE.CylinderGeometry(r1,r0,L,6,1,true).toNonIndexed();g.translate(0,L/2,0);
  g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize())));g.translate(x0,y0,z0);wood.push(g)};
 const H=sp===0?5.2:sp===1?3.4:2.2,cy=sp===0?6.4:sp===1?4.6:4.8,RX=sp===0?1.9:sp===1?2.9:2,RY=sp===0?2.9:sp===1?2:3.2;
 cyl(0,0,0,0,H,0,sp===2?.2:.24,.14);
 const tips=[];for(let k=0;k<(sp===2?0:5);k++){const a=k/5*PI*2+r(),e=.4+r()*.5,x=Math.cos(a)*RX*.6,z=Math.sin(a)*RX*.6,y=cy+(r()-.5)*RY*.6;cyl(0,H*.85,0,x,y,z,.09,.04);tips.push([x,y,z])}
 const N=sp===2?26:22,C=new THREE.Vector3(0,cy,0);
 for(let k=0;k<N;k++){let x,y,z;if(sp===2){const t=r(),rr=(1-t)*RX*(.55+r()*.45),a=r()*PI*2;x=Math.cos(a)*rr;z=Math.sin(a)*rr;y=1.4+t*RY*1.9}
  else{const u=r()*2-1,a=r()*PI*2,s=Math.sqrt(1-u*u),q=.55+r()*.45;x=Math.cos(a)*s*RX*q;z=Math.sin(a)*s*RX*q;y=cy+u*RY*q*.85}
  const sz=sp===2?1.3:1.5+r()*.5;
  for(let j=0;j<3;j++){const g=new THREE.PlaneGeometry(sz,sz).toNonIndexed();g.rotateX(r()*PI);g.rotateY(r()*PI*2);g.rotateZ((r()-.5)*.8);g.translate(x,y,z);
   const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){const v=new THREE.Vector3(p.getX(i),p.getY(i),p.getZ(i)).sub(sp===2?new THREE.Vector3(0,p.getY(i),0):C).normalize();v.y+=.35;v.normalize();n.setXYZ(i,v.x,v.y,v.z)}leaf.push(g)}}
 const merge=(arr,col)=>{let n=0;for(const g of arr)n+=g.attributes.position.count;const P=new Float32Array(n*3),Nn=new Float32Array(n*3),U=new Float32Array(n*2);let o=0,ou=0;
  for(const g of arr){P.set(g.attributes.position.array,o);Nn.set(g.attributes.normal.array,o);U.set(g.attributes.uv.array,ou);o+=g.attributes.position.count*3;ou+=g.attributes.position.count*2}
  const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(P,3));g.setAttribute("normal",new THREE.BufferAttribute(Nn,3));g.setAttribute("uv",new THREE.BufferAttribute(U,2));return g};
 return[merge(wood),merge(leaf)]}
function decorate(){const tr=[],lp=[],sg=[],vm=[],up=[],wires=[],rnd=rng(11),TMAX=MOBILE?1800:3500;
 // Solo sobre acera dibujada (no en franjas estrechas entre calles), fuera de edificios y obstáculos
 const free=(x,z,m)=>x>5&&z>5&&x<W-5&&z<W-5&&roadAt(x,z)<0&&groundD(x,z)>m+.25&&!blockedAt(x,z,m);
 const tree=(x,z,sp)=>{if(tr.length<TMAX&&free(x,z,.8)){tr.push([x,z,.8+rnd()*.5,rnd()*PI,sp!==undefined?sp:rnd()<.7?1:2]);addCirc(x,z,.35)}};
 for(let i=0;i<MAP.trees.length;i+=2)tree(MAP.trees[i],MAP.trees[i+1]);
 for(const r of MAP.roads){const hw=r.w/2,p=r.p;let acc=rnd()*30,side=1,pa=rnd()*30,last=null,vacc=rnd()*40;
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=(bx-ax)/L,uz=(bz-az)/L;
   for(let t=0;t<L;t+=2){acc+=2;pa+=2;vacc+=2;const x=ax+ux*t,z=az+uz*t;
    if(acc%18<2&&r.t<3&&rnd()<.35){const sp=rnd()<.6?0:1;for(const s of[-1,1])tree(x+uz*s*(hw+2.2),z-ux*s*(hw+2.2),sp)}
    if(acc>=34&&r.t<4){acc=0;side=-side;const lx=x+uz*side*(hw+.8),lz=z-ux*side*(hw+.8);if(free(lx,lz,.3)){lp.push([lx,CURB,lz,Math.atan2(-uz*side,ux*side)]);addCirc(lx,lz,.18)}}
    // Postes eléctricos a un lado de las calles pequeñas y terciarias, unidos por cables
    if(pa>=30&&r.t>=3){pa=0;const qx=x+uz*(hw+.6),qz=z-ux*(hw+.6);if(free(qx,qz,.3)){up.push([qx,CURB,qz,Math.atan2(ux,uz)]);addCirc(qx,qz,.2);
      if(last&&Math.hypot(last[0]-qx,last[1]-qz)<45)for(const o of[-.7,0,.7]){const ox=Math.cos(Math.atan2(ux,uz))*o,oz=-Math.sin(Math.atan2(ux,uz))*o;wires.push(last[0]+ox,9.6,last[1]+oz,qx+ox,9.6,qz+oz)}
      last=[qx,qz]}}
    // Máquinas expendedoras pegadas a una fachada junto a la acera
    if(vacc>=40){vacc=0;const s=rnd()<.5?1:-1,mx=x+uz*s*(hw+1),mz=z-ux*s*(hw+1);if(free(mx,mz,.6)&&inBuilding(x+uz*s*(hw+3.2),z-ux*s*(hw+3.2))){vm.push([mx,CURB,mz,Math.atan2(-uz*s,ux*s)]);addCirc(mx,mz,.55)}}}}
  if(r.s>=20&&p.length>=4){const L=Math.hypot(p[2]-p[0],p[3]-p[1])||1,ux=(p[2]-p[0])/L,uz=(p[3]-p[1])/L,d=Math.min(15,L/2),x=p[0]+ux*d+uz*(hw+.6),z=p[1]+uz*d-ux*(hw+.6);
   if(free(x,z,.2)){sg.push([x,CURB,z,Math.atan2(ux,uz)+PI,r.s]);addCirc(x,z,.12)}}}
 for(const g of MAP.green){if(g.k===2)continue;const R=g.p,b=[1e9,1e9,-1e9,-1e9];for(let i=0;i<R.length;i+=2){b[0]=Math.min(b[0],R[i]);b[1]=Math.min(b[1],R[i+1]);b[2]=Math.max(b[2],R[i]);b[3]=Math.max(b[3],R[i+1])}
  const n=Math.min(250,(b[2]-b[0])*(b[3]-b[1])/(g.k?140:380));for(let k=0;k<n;k++){const x=b[0]+rnd()*(b[2]-b[0]),z=b[1]+rnd()*(b[3]-b[1]);if(inPoly(R,x,z))tree(x,z)}}
 // Sin árboles pegados a una farola (la bombilla quedaría dentro de la copa)
 for(let i=tr.length-1;i>=0;i--){const t=tr[i];for(const l of lp){const hx=l[0]+Math.sin(l[3])*1.5,hz=l[2]+Math.cos(l[3])*1.5;if((t[0]-hx)**2+(t[1]-hz)**2<30){tr.splice(i,1);break}}}
 // Árboles: la mitad "extra" solo se ve en calidad alta o ultra
 // Tres especies hechas de varios volúmenes irregulares con colores de otoño: ginkgo (amarillo, típico de las avenidas de Tokio),
 // árbol de copa redonda (zelkova) y conífera. Cada especie es una sola malla instanciada; la mitad "extra" solo en calidad alta
 const SP=[treeGeo(0),treeGeo(1),treeGeo(2)],tm=new THREE.MeshLambertMaterial({vertexColors:true}),TT=[0xfff0c0,0xe8ffe0,0xffffff,0xd8f0d0];
 // Baja y Media: árboles sencillos (la mitad); Alta y Ultra: todos con ramas y racimos de hojas (treeGeoHi)
 const bark=new THREE.MeshLambertMaterial({color:0x5a4332});
 for(let s=0;s<3;s++){const all=tr.filter(t=>t[4]===s).map((t,i)=>[t[0],CURB,t[1],t[3],t[2],t[2]*(.9+(i%5)*.06),TT[i%4]]);
  for(const m of instZ(SP[s],tm,all.filter((t,i)=>i%2===0),0,true))if(m)m.userData.qx=1;
  const[gw,gl]=treeGeoHi(s),lt=leafTex(s),lm=new THREE.MeshLambertMaterial({map:lt,alphaTest:.45,side:THREE.DoubleSide}),dm=new THREE.MeshDepthMaterial({depthPacking:THREE.RGBADepthPacking,map:lt,alphaTest:.45});
  instZ(gw,bark,all,2,true);for(const m of instZ(gl,lm,all,2,true))if(m)m.customDepthMaterial=dm}
 const steel=new THREE.MeshLambertMaterial({color:0x6d7178});
 instZ(new THREE.CylinderGeometry(.08,.11,7,6).translate(0,3.5,0),steel,lp,0,true);instZ(new THREE.BoxGeometry(.12,.12,1.6).translate(0,6.9,.75),steel,lp,0);
 NM.lampHead=new THREE.MeshLambertMaterial({color:0xfff6d8,emissive:0xffe2a8,emissiveIntensity:0});instZ(new THREE.BoxGeometry(.35,.12,.6).translate(0,6.8,1.5),NM.lampHead,lp,0);lampN=lp.length;
 // Posición de cada bombilla: las más cercanas al jugador dan luz real (env.js)
 for(const l of lp)LAMPS.push(l[0]+Math.sin(l[3])*1.5,6.5+CURB,l[2]+Math.cos(l[3])*1.5);
 // Yatai: puestos callejeros de comida (carrito de madera con tejadillo, noren con el nombre, farolillos rojos y taburetes),
 // sobre todo cerca de los templos, la torre y los parques
 const YT=[];{const hot=[[TX,TZ]];for(const b of MAP.buildings)if(b.k===1)hot.push([b.p[0],b.p[1]]);
  for(const r of MAP.roads){if(r.t>3||YT.length>=32)continue;const p=r.p,hw=r.w/2;for(let i=2;i<p.length&&YT.length<32;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=(bx-ax)/L,uz=(bz-az)/L;
   for(let t=4;t<L-4;t+=9){const x0=ax+ux*t,z0=az+uz*t,near=hot.some(q=>Math.hypot(q[0]-x0,q[1]-z0)<180);if(rnd()>(near?.06:.004))continue;const s=rnd()<.5?1:-1,x=x0+uz*s*(hw+2.3),z=z0-ux*s*(hw+2.3);
    if(free(x,z,1.5)&&!YT.some(q=>Math.hypot(q[0]-x,q[2]-z)<30)){YT.push([x,CURB,z,Math.atan2(-uz*s,ux*s)]);addCirc(x,z,1.3)}}}}
  if(YT.length){const box=(a,w,h,d,x,y,z)=>{const g=new THREE.BoxGeometry(w,h,d).toNonIndexed();g.translate(x,y,z);a.push(g)},mg=a=>{let n=0;for(const g of a)n+=g.attributes.position.count;const P=new Float32Array(n*3),N=new Float32Array(n*3);let o=0;
    for(const g of a){P.set(g.attributes.position.array,o);N.set(g.attributes.normal.array,o);o+=g.attributes.position.count*3}const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.BufferAttribute(P,3));g.setAttribute("normal",new THREE.BufferAttribute(N,3));return g};
   const wd=[],rf=[],st=[];box(wd,2.2,.95,1.1,0,.55,0);box(wd,2.5,.07,1.4,0,1.06,.1);for(const sx of[-1.15,1.15])for(const sz of[-.45,.6])box(wd,.07,1.35,.07,sx,1.75,sz);box(wd,.08,.5,.5,-1.12,.25,-.1);box(wd,.08,.5,.5,1.12,.25,-.1);
   {const g=new THREE.BoxGeometry(2.7,.06,1.7).toNonIndexed();g.rotateX(-.18);g.translate(0,2.47,.1);rf.push(g)}
   for(const sx of[-.7,0,.7]){const g=new THREE.CylinderGeometry(.17,.17,.5,8).toNonIndexed();g.translate(sx,.4,1.15);st.push(g)}
   instZ(mg(wd),new THREE.MeshLambertMaterial({color:0x7a5232}),YT,0,true);instZ(mg(rf),new THREE.MeshLambertMaterial({color:0xb3261e}),YT,0,true);instZ(mg(st),new THREE.MeshLambertMaterial({color:0xc9372c}),YT,1);
   const nt=canvasTex(256,64,(g)=>{g.fillStyle="#1d2a4a";g.fillRect(0,0,256,64);g.fillStyle="#f4ecd8";g.font="bold 34px 'Yu Gothic','Meiryo',sans-serif";g.textAlign="center";g.textBaseline="middle";g.fillText("おでん・やきとり",128,34);g.fillStyle="#1d2a4a";for(let x=51;x<256;x+=51)g.fillRect(x,22,3,42)});
   instZ(new THREE.PlaneGeometry(2.3,.5).translate(0,2.12,.72),new THREE.MeshLambertMaterial({map:nt,side:THREE.DoubleSide}),YT,0);
   NM.lant=new THREE.MeshLambertMaterial({color:0xd8302a,emissive:0xff4a20,emissiveIntensity:.1});NM.sign.push(NM.lant);
   instZ(mg([-1,1].map(sx=>{const g=new THREE.SphereGeometry(.2,10,8).toNonIndexed();g.scale(1,1.35,1);g.translate(sx*1.2,1.95,.85);return g})),NM.lant,YT,0)}}
 // Luz de todas las farolas en el mapa de luz: manchas suaves alargadas en el sentido de la calle que se funden entre sí
 {const g=LMC.getContext("2d"),s=LMC.width/W;g.fillStyle="#000";g.fillRect(0,0,LMC.width,LMC.width);g.globalCompositeOperation="lighter";
  for(const y of YT){const gr=g.createRadialGradient(y[0]*s,y[2]*s,0,y[0]*s,y[2]*s,6*s);gr.addColorStop(0,"rgba(255,150,90,.55)");gr.addColorStop(1,"rgba(255,120,60,0)");g.fillStyle=gr;g.beginPath();g.arc(y[0]*s,y[2]*s,6*s,0,7);g.fill()}
  for(const l of lp){const hx=(l[0]+Math.sin(l[3])*1.5)*s,hz=(l[2]+Math.cos(l[3])*1.5)*s,R=11*s;g.save();g.translate(hx,hz);g.rotate(-l[3]);g.scale(1.8,1);
   const gr=g.createRadialGradient(0,0,0,0,0,R);gr.addColorStop(0,"rgba(255,214,160,.6)");gr.addColorStop(.35,"rgba(255,196,140,.36)");gr.addColorStop(1,"rgba(255,180,120,0)");g.fillStyle=gr;g.beginPath();g.arc(0,0,R,0,7);g.fill();g.restore()}
  // Escaparates y konbinis también iluminan un poco la acera de delante
  g.globalCompositeOperation="source-over";LIGHTMAP.needsUpdate=true}
 // Resplandor de cada bombilla (se ve de lejos y con el bloom parece una farola encendida de verdad)
 {const t=canvasTex(64,64,(g)=>{const gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,"rgba(255,255,255,1)");gr.addColorStop(.2,"rgba(255,230,190,.8)");gr.addColorStop(1,"rgba(255,200,140,0)");g.fillStyle=gr;g.fillRect(0,0,64,64)});
  const gg=new THREE.BufferGeometry();gg.setAttribute("position",new THREE.Float32BufferAttribute(LAMPS.map((v,i)=>i%3===1?v-.15:v),3));
  NM.glow=new THREE.PointsMaterial({map:t,size:2.6,sizeAttenuation:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0,color:0xffe6c0});const pts=new THREE.Points(gg,NM.glow);pts.frustumCulled=false;sc.add(pts)}
 inst(new THREE.CylinderGeometry(.04,.04,2.6,6).translate(0,1.3,0),new THREE.MeshLambertMaterial({color:0x9aa0a8}),sg.map(s=>s.slice(0,4)),0);
 for(const v of[...new Set(sg.map(s=>s[4]))]){const t=canvasTex(64,64,(g)=>{g.fillStyle="#fff";g.beginPath();g.arc(32,32,30,0,7);g.fill();g.strokeStyle="#d8232a";g.lineWidth=8;g.beginPath();g.arc(32,32,26,0,7);g.stroke();
   g.fillStyle="#1d4fa0";g.font="bold 26px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(v,32,34)});
  inst(new THREE.CircleGeometry(.32,20).translate(0,2.75,.05),new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide}),sg.filter(s=>s[4]===v).map(s=>s.slice(0,4)),0)}
 // Máquinas expendedoras: cuerpo de color y frontal iluminado con bebidas
 const VC=[0xd12a2a,0xf2f2f2,0x1f5fbf,0x2a8a3e];instZ(new THREE.BoxGeometry(1,1.85,.75).translate(0,.925,0),new THREE.MeshLambertMaterial({color:0xffffff}),vm.map((v,i)=>[...v,1,1,VC[i%4]]),1,true);
 const vt=canvasTex(64,128,(g)=>{g.fillStyle="#e9eef2";g.fillRect(0,0,64,128);const r=rng(4);for(let y=0;y<3;y++)for(let x=0;x<6;x++){g.fillStyle=`hsl(${r()*360},70%,50%)`;g.fillRect(4+x*9.5,8+y*24,7,16)}g.fillStyle="#222";g.fillRect(6,82,52,10);g.fillRect(20,100,24,20)});
 NM.vend=new THREE.MeshLambertMaterial({map:vt,emissiveMap:vt,emissive:0xffffff,emissiveIntensity:.15});instZ(new THREE.PlaneGeometry(.86,1.6).translate(0,1,.38),NM.vend,vm,1);
 // Postes eléctricos de hormigón con travesaño y cables
 const conc=new THREE.MeshLambertMaterial({color:0x9c9a95});instZ(new THREE.CylinderGeometry(.12,.17,10,7).translate(0,5,0),conc,up,1,true);instZ(new THREE.BoxGeometry(1.8,.12,.12).translate(0,9.6,0),conc,up,1);
 if(wires.length){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(wires,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x1d1f22}));l.userData.q=1;sc.add(l)}}
