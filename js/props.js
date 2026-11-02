// Mobiliario urbano: árboles (OSM, parques y aceras), farolas con su charco de luz nocturno, señales de velocidad,
// máquinas expendedoras y postes eléctricos con cables (muy típicos de las calles pequeñas de Tokio)
let lampN=0;const LAMPS=[];
function decorate(){const tr=[],lp=[],sg=[],vm=[],up=[],wires=[],rnd=rng(11),TMAX=MOBILE?1800:3500;
 const free=(x,z,m)=>x>5&&z>5&&x<W-5&&z<W-5&&roadAt(x,z)<0&&!blockedAt(x,z,m);
 const tree=(x,z)=>{if(tr.length<TMAX&&free(x,z,.8)){tr.push([x,z,.8+rnd()*.5,rnd()*PI]);addCirc(x,z,.35)}};
 for(let i=0;i<MAP.trees.length;i+=2)tree(MAP.trees[i],MAP.trees[i+1]);
 for(const r of MAP.roads){const hw=r.w/2,p=r.p;let acc=rnd()*30,side=1,pa=rnd()*30,last=null,vacc=rnd()*40;
  for(let i=2;i<p.length;i+=2){const ax=p[i-2],az=p[i-1],bx=p[i],bz=p[i+1],L=Math.hypot(bx-ax,bz-az)||1,ux=(bx-ax)/L,uz=(bz-az)/L;
   for(let t=0;t<L;t+=2){acc+=2;pa+=2;vacc+=2;const x=ax+ux*t,z=az+uz*t;
    if(acc%18<2&&r.t<3&&rnd()<.35)for(const s of[-1,1])tree(x+uz*s*(hw+2.2),z-ux*s*(hw+2.2));
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
 const tc=[0x3f7a3a,0x4f8a3f,0x356b35,0x5e9447],half=[tr.filter((t,i)=>i%2===0),tr.filter((t,i)=>i%2===1)];
 half.forEach((h,k)=>{inst(new THREE.CylinderGeometry(.16,.24,2.6,6).translate(0,1.3+CURB,0),new THREE.MeshLambertMaterial({color:0x5a4332}),h.map(t=>[t[0],0,t[1],t[3],t[2]]),k?2:0,true);
  inst(new THREE.IcosahedronGeometry(1.6,1).translate(0,3.9+CURB,0),new THREE.MeshLambertMaterial({color:0xffffff}),h.map((t,i)=>[t[0],0,t[1],t[3],t[2],t[2]*1.1,tc[i%4]]),k?2:0,true)});
 const steel=new THREE.MeshLambertMaterial({color:0x6d7178});
 inst(new THREE.CylinderGeometry(.08,.11,7,6).translate(0,3.5,0),steel,lp,0,true);inst(new THREE.BoxGeometry(.12,.12,1.6).translate(0,6.9,.75),steel,lp,0);
 NM.lampHead=new THREE.MeshLambertMaterial({color:0xfff6d8,emissive:0xffe2a8,emissiveIntensity:0});inst(new THREE.BoxGeometry(.35,.12,.6).translate(0,6.8,1.5),NM.lampHead,lp,0);lampN=lp.length;
 // Posición de cada bombilla: las más cercanas al jugador dan luz real (env.js)
 for(const l of lp)LAMPS.push(l[0]+Math.sin(l[3])*1.5,6.5+CURB,l[2]+Math.cos(l[3])*1.5);
 inst(new THREE.CylinderGeometry(.04,.04,2.6,6).translate(0,1.3,0),new THREE.MeshLambertMaterial({color:0x9aa0a8}),sg.map(s=>s.slice(0,4)),0);
 for(const v of[...new Set(sg.map(s=>s[4]))]){const t=canvasTex(64,64,(g)=>{g.fillStyle="#fff";g.beginPath();g.arc(32,32,30,0,7);g.fill();g.strokeStyle="#d8232a";g.lineWidth=8;g.beginPath();g.arc(32,32,26,0,7);g.stroke();
   g.fillStyle="#1d4fa0";g.font="bold 26px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText(v,32,34)});
  inst(new THREE.CircleGeometry(.32,20).translate(0,2.75,.05),new THREE.MeshLambertMaterial({map:t,transparent:true,side:THREE.DoubleSide}),sg.filter(s=>s[4]===v).map(s=>s.slice(0,4)),0)}
 // Máquinas expendedoras: cuerpo de color y frontal iluminado con bebidas
 const VC=[0xd12a2a,0xf2f2f2,0x1f5fbf,0x2a8a3e];inst(new THREE.BoxGeometry(1,1.85,.75).translate(0,.925,0),new THREE.MeshLambertMaterial({color:0xffffff}),vm.map((v,i)=>[...v,1,1,VC[i%4]]),1,true);
 const vt=canvasTex(64,128,(g)=>{g.fillStyle="#e9eef2";g.fillRect(0,0,64,128);const r=rng(4);for(let y=0;y<3;y++)for(let x=0;x<6;x++){g.fillStyle=`hsl(${r()*360},70%,50%)`;g.fillRect(4+x*9.5,8+y*24,7,16)}g.fillStyle="#222";g.fillRect(6,82,52,10);g.fillRect(20,100,24,20)});
 NM.vend=new THREE.MeshLambertMaterial({map:vt,emissiveMap:vt,emissive:0xffffff,emissiveIntensity:.15});inst(new THREE.PlaneGeometry(.86,1.6).translate(0,1,.38),NM.vend,vm,1);
 // Postes eléctricos de hormigón con travesaño y cables
 const conc=new THREE.MeshLambertMaterial({color:0x9c9a95});inst(new THREE.CylinderGeometry(.12,.17,10,7).translate(0,5,0),conc,up,1,true);inst(new THREE.BoxGeometry(1.8,.12,.12).translate(0,9.6,0),conc,up,1);
 if(wires.length){const g=new THREE.BufferGeometry();g.setAttribute("position",new THREE.Float32BufferAttribute(wires,3));const l=new THREE.LineSegments(g,new THREE.LineBasicMaterial({color:0x1d1f22}));l.userData.q=1;sc.add(l)}}
