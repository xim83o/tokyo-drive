// Autopista elevada conducible (sobre el canal). El tablero lo dibuja buildCanal (world.js); aquí están las rampas y la conducción en altura.
// CUANDO SE AMPLÍE EL MAPA: basta con cambiar esta lista. Cada rampa va de un punto de una calle (g) a un punto del canal (d), con al menos
// 150 m entre ellos para que no sea muy empinada. Son de doble sentido.
// · Rampa normal: sube por un lado del tablero, llega a la altura de la autopista ANTES de tocarlo y se une a él en paralelo durante 48 m.
// · Rampa de final (end): la autopista se acaba en d (un vértice del canal) y la rampa es su continuación hacia out. zone: dónde se quita el tablero sobrante.
//   Al ampliar el mapa se quitan estas rampas de final y el tablero vuelve a salir solo
const HWY_H=16;
const HWY_RAMPS=[{g:[745,1532],d:[930,1608],ph:.6,ls:.4,le:.4},{g:[1250,1612],d:[1410,1733],ph:.8},{g:[1512,1708],d:[1699,1751],ph:.8},
 {g:[548,2265],d:[488.3,2091.6],end:true,out:[.18,.98],zone:[400,2000,620,2420]},{g:[2172,1781],d:[2009,1804.5],end:true,ph:.8,out:[1,.1],zone:[1950,1700,2420,1950]}];
// Tablero que se quita más allá de cada final
const hwyCut=(x,z)=>HWY_RAMPS.some(R=>R.end&&x>R.zone[0]&&z>R.zone[1]&&x<R.zone[2]&&z<R.zone[3]&&(x-R.d[0])*R.out[0]+(z-R.d[1])*R.out[1]>0);
// on: el coche va por la autopista (fuera de eso rigen los choques normales). segs: [ax,ay,az,bx,by,bz,hw,rampa,s]
// rp: rampas, cada una una lista de puntos [x,y,z,s,medio ancho,tramo de unión]
const HWL={on:false,y:0,segs:[],grid:new Map(),rp:[],pil:[],x:0,z:0},HWC=50;
function hwyAdd(ax,ay,az,bx,by,bz,hw,ramp,s){const k=HWL.segs.length;HWL.segs.push([ax,ay,az,bx,by,bz,hw,ramp,s]);const m=hw+3,i0=Math.floor((Math.min(ax,bx)-m)/HWC),i1=Math.floor((Math.max(ax,bx)+m)/HWC),j0=Math.floor((Math.min(az,bz)-m)/HWC),j1=Math.floor((Math.max(az,bz)+m)/HWC);
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const q=i*4096+j;if(!HWL.grid.has(q))HWL.grid.set(q,[]);HWL.grid.get(q).push(k)}}
const hwyDeck=(ax,az,bx,bz,Y)=>hwyAdd(ax,Y,az,bx,Y,bz,6.5,false,0);
const hwySm=t=>{t=Math.max(0,Math.min(1,t));return t*t*(3-2*t)};
// Punto más cercano del canal a (x,z) y su dirección
function hwyRiv(x,z){let b=null,bd=1e18;for(const r of MAP.rivers){const p=r.p;for(let i=2;i<p.length;i+=2){const d=segD2(x,z,p[i-2],p[i-1],p[i],p[i+1]);if(d<bd){bd=d;const l=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])||1;b=[_cx,_cz,(p[i]-p[i-2])/l,(p[i+1]-p[i-1])/l]}}}return b}
// Traza las rampas. Se hace antes de construir nada, para poder quitar los edificios que estorban. Cada boca sale del borde de la calle hacia fuera,
// en ángulo: así no ocupa la calzada ni se mete en ella el tráfico
function hwyPlan(){const Y=HWY_H,herm=(a,ta,b,tb,t)=>{const t2=t*t,t3=t2*t,p=2*t3-3*t2+1,q=t3-2*t2+t,r=-2*t3+3*t2,s=t3-t2;return[p*a[0]+q*ta[0]+r*b[0]+s*tb[0],p*a[1]+q*ta[1]+r*b[1]+s*tb[1]]};
 for(const R of HWY_RAMPS){const[gx,gz]=R.g,v=hwyRiv(R.d[0],R.d[1]),dx=v[0],dz=v[1];let bd=1e18,c=null,tg=null,rh=4;for(const r of MAP.roads){const p=r.p;for(let i=2;i<p.length;i+=2){const d=segD2(gx,gz,p[i-2],p[i-1],p[i],p[i+1]);if(d<bd){bd=d;c=[_cx,_cz];const l=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])||1;tg=[(p[i]-p[i-2])/l,(p[i+1]-p[i-1])/l];rh=r.w/2*.85}}}
  let td=[v[2],v[3]],sd=0;const o0=[dx-gx,dz-gz];let A,arr;
  if(R.end){if(td[0]*R.out[0]+td[1]*R.out[1]<0)td=[-td[0],-td[1]];A=[dx,dz];arr=[-td[0],-td[1]]}
  else{if(td[0]*o0[0]+td[1]*o0[1]<0)td=[-td[0],-td[1]];const nv=[td[1],-td[0]];sd=(gx-dx)*nv[0]+(gz-dz)*nv[1]<0?-1:1;A=[dx+nv[0]*sd*10.5,dz+nv[1]*sd*10.5];arr=td}
  const nr=[tg[1],-tg[0]],sg=(A[0]-c[0])*nr[0]+(A[1]-c[1])*nr[1]<0?-1:1,M=[c[0]+nr[0]*sg*Math.max(0,rh-2.5),c[1]+nr[1]*sg*Math.max(0,rh-2.5)];
  const L=Math.hypot(A[0]-M[0],A[1]-M[1]),de=[(A[0]-M[0])/L,(A[1]-M[1])/L];if(tg[0]*de[0]+tg[1]*de[1]<0)tg=[-tg[0],-tg[1]];
  // Dirección de salida: entre 30 y 70 grados con la calle, hacia donde está la autopista (ph la fija a mano, para que la parte baja no vaya pisando la calle)
  const ph=R.ph||Math.max(.52,Math.min(1.22,Math.acos(Math.max(-1,Math.min(1,tg[0]*de[0]+tg[1]*de[1]))))),out=[tg[0]*Math.cos(ph)+nr[0]*sg*Math.sin(ph),tg[1]*Math.cos(ph)+nr[1]*sg*Math.sin(ph)];
  const n=Math.ceil(L/4),C=[],K=R.le||(R.end?.5:.9);let S=0;for(let i=0;i<=n;i++){const q=herm(M,[out[0]*L*(R.ls||.8),out[1]*L*(R.ls||.8)],A,[arr[0]*L*K,arr[1]*L*K],i/n);if(i)S+=Math.hypot(q[0]-C[i-1][0],q[1]-C[i-1][1]);C.push([q[0],q[1],S])}
  const P=C.map(q=>{const s=q[2];return[q[0],q[2]===0?.02:Math.max(Y*hwySm(s/S),.17*Math.min(1,s/6)),q[1],s,R.end?4+2.5*hwySm((s-S+45)/45):4,0]});
  P[P.length-1][1]=Y;
  if(!R.end){P[P.length-1][5]=1;let cx=dx,cz=dz,tn=td;for(let k=1;k<=8;k++){cx+=tn[0]*6;cz+=tn[1]*6;const q=hwyRiv(cx,cz);cx=q[0];cz=q[1];tn=q[2]*tn[0]+q[3]*tn[1]<0?[-q[2],-q[3]]:[q[2],q[3]];const of=10.5-8*hwySm(k/8);P.push([cx+tn[1]*sd*of,Y,cz-tn[0]*sd*of,S+k*6,4,1])}}
  R.sd=sd;R.P=P;HWL.rp.push(P)}}
// ¿Este edificio estorba a una rampa? (solo si llega a la altura de la rampa en ese punto)
function hwyBlds(b){for(const P of HWL.rp)for(let i=1;i<P.length;i++){const q=P[i],o=P[i-1],l=Math.hypot(q[0]-o[0],q[2]-o[2])||1,lx=(q[2]-o[2])/l,lz=-(q[0]-o[0])/l;if(b.h<q[1]-1.5)continue;for(const k of[0,.5,1,-.5,-1]){const e=(q[4]+1.2)*k;if(inPoly(b.p,q[0]+lx*e,q[2]+lz*e))return true}}return false}
// Crea los tramos conducibles y los muros de la parte baja (por los lados de la parte baja no se entra: solo por la boca, desde la calle)
function hwyRamps(){for(const P of HWL.rp)for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];hwyAdd(a[0],a[1],a[2],b[0],b[1],b[2],(a[4]+b[4])/2,true,a[3]);
  const l=Math.hypot(b[0]-a[0],b[2]-a[2])||1,lx=(b[2]-a[2])/l*(a[4]+.1),lz=-(b[0]-a[0])/l*(a[4]+.1);if(a[3]>9&&a[1]<3.2)for(const k of[-1,1])addEdge(a[0]+lx*k,a[2]+lz*k,b[0]+lx*k,b[2]+lz*k);if(a[1]<3.2&&b[1]>=3.2)addEdge(b[0]+lx,b[2]+lz,b[0]-lx,b[2]-lz)}}
// ¿Junto a la boca de una rampa? (ahí no hay pretil de puente)
const hwyMouth=(x,z)=>HWL.rp.some(P=>Math.hypot(x-P[0][0],z-P[0][2])<8);
// ¿Sitio libre de rampas? (para árboles, farolas y demás)
function hwyFree(x,z){const l=HWL.grid.get(Math.floor(x/HWC)*4096+Math.floor(z/HWC));if(!l)return true;for(const k of l){const S=HWL.segs[k];if(!S[7]||Math.min(S[1],S[4])>13)continue;if(segD2(x,z,S[0],S[2],S[3],S[5])<(S[6]+2.5)**2)return false}return true}
// Pretil del tablero, abierto solo donde una rampa se une a él
function hwyWall(vq,hw,A,B,Y){const l=Math.hypot(B[0]-A[0],B[1]-A[1]),n=Math.max(1,Math.ceil(l/3));for(let i=0;i<n;i++){const x0=A[0]+(B[0]-A[0])*i/n,z0=A[1]+(B[1]-A[1])*i/n,x1=A[0]+(B[0]-A[0])*(i+1)/n,z1=A[1]+(B[1]-A[1])*(i+1)/n,mx=(x0+x1)/2,mz=(z0+z1)/2;
  if(HWL.rp.some(P=>P.some(q=>q[5]&&Math.hypot(q[0]-mx,q[2]-mz)<4.6)))continue;vq(hw,x0,z0,x1,z1,Y-.8,Y+1.1)}}
// Dibuja las rampas: asfalto, parte de abajo, pretiles y columnas redondas. Por debajo de 3 m la rampa es maciza (muro hasta el suelo)
function hwyGeo(hd,hs,hw,WY,Y){const up=(t,A,B,C)=>{const f=(B[2]-A[2])*(C[0]-A[0])-(B[0]-A[0])*(C[2]-A[2])<0;for(const q of f?[A,C,B]:[A,B,C])t.push(q[0],q[1],q[2])},wl=(x0,z0,a0,b0,x1,z1,a1,b1)=>hw.push(x0,a0,z0,x1,a1,z1,x1,b1,z1,x0,a0,z0,x1,b1,z1,x0,b0,z0);
 HWY_RAMPS.forEach(R=>{const P=R.P,N=P.map((q,i)=>{const a=P[Math.max(0,i-1)],b=P[Math.min(P.length-1,i+1)],l=Math.hypot(b[0]-a[0],b[2]-a[2])||1;return[(b[2]-a[2])/l,-(b[0]-a[0])/l]});let last=-99;   // N: lateral común de cada punto, para que los tramos curvos no dejen rendijas
  for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],na=N[i-1],nb=N[i],la=a[4],lb=b[4],ya=a[1]+.02+(a[5]?-.05:0),yb=b[1]+.02+(b[5]?-.05:0);
   const A=[a[0]+na[0]*la,ya,a[2]+na[1]*la],B=[b[0]+nb[0]*lb,yb,b[2]+nb[1]*lb],C=[b[0]-nb[0]*lb,yb,b[2]-nb[1]*lb],D=[a[0]-na[0]*la,ya,a[2]-na[1]*la];up(hd,A,B,C);up(hd,A,C,D);
   if(a[1]>1){const k=.8;up(hs,[A[0],A[1]-k,A[2]],[B[0],B[1]-k,B[2]],[C[0],C[1]-k,C[2]]);up(hs,[A[0],A[1]-k,A[2]],[C[0],C[1]-k,C[2]],[D[0],D[1]-k,D[2]])}
   // Lado de fuera (en la unión, solo ese: el de dentro da al tablero)
   const rv=a[5]||b[5]?hwyRiv(a[0],a[2]):null,skip=rv?(Math.hypot(A[0]-rv[0],A[2]-rv[1])<Math.hypot(D[0]-rv[0],D[2]-rv[1])?1:-1):0;
   for(const[p,q,sg]of[[A,B,1],[D,C,-1]]){if(sg===skip)continue;const lo=v=>a[1]<3.2?-.1:v-.8,hi=(v,y0)=>v+Math.min(1,.15+y0);wl(p[0],p[2],lo(p[1]),hi(p[1],a[1]),q[0],q[2],lo(q[1]),hi(q[1],b[1]))}
   // Donde se acaba la parte maciza, el muro cierra la rampa de lado a lado
   if(a[1]<3.2&&b[1]>=3.2)wl(B[0],B[2],-.1,B[1],C[0],C[2],-.1,C[1]);
   // Columnas cada 30 m donde la rampa ya va alta, nunca sobre calzada, vía ni edificio
   if(a[1]>3.5&&!a[5]&&a[3]-last>=30&&[[0,0],[3,0],[-3,0],[0,3],[0,-3]].every(([u,v])=>roadAt(a[0]+u,a[2]+v)<0)&&!onElv(a[0],a[2])&&!inBuilding(a[0],a[2])){const w=riverD(a[0],a[2])<0,b0=w?WY:0;HWL.pil.push([a[0],b0,a[2],0,1,a[1]-.8-b0]);if(!w)addCirc(a[0],a[2],1.3);last=a[3]}}});
 inst(new THREE.CylinderGeometry(1,1.15,1,14).translate(0,.5,0),new THREE.MeshLambertMaterial({color:0x9a9c9f}),HWL.pil,0,true)}
// Tramo sobre el que está (x,z) a la altura actual del coche. Devuelve el mejor [seg, t, distancia, altura]
const HWQ=[0,0,0,0];
function hwyNear(x,z,y){const l=HWL.grid.get(Math.floor(x/HWC)*4096+Math.floor(z/HWC));let bs=-1,bv=1e9;if(!l)return null;for(const k of l){const S=HWL.segs[k],dx=S[3]-S[0],dz=S[5]-S[2],c=dx*dx+dz*dz||1;let t=((x-S[0])*dx+(z-S[2])*dz)/c;t=t<0?0:t>1?1:t;const qy=S[1]+(S[4]-S[1])*t;if(Math.abs(qy-y)>3)continue;const d=Math.hypot(x-S[0]-dx*t,z-S[2]-dz*t),v=d-S[6];if(v<bv){bv=v;bs=k;HWQ[1]=t;HWQ[2]=d;HWQ[3]=qy}}if(bs<0)return null;HWQ[0]=bs;return HWQ}
function hwyY(x,z){const q=hwyNear(x,z,HWL.y);return q?q[3]:HWL.y}
// Subir: entrando por la boca de la rampa, en el sentido de subida
function hwyEnter(){if(HWL.on)return;for(const P of HWL.rp){const a=P[0],b=P[3],d=Math.hypot(px-a[0],pz-a[2]);if(d>16)continue;const l=Math.hypot(b[0]-a[0],b[2]-a[2])||1,ux=(b[0]-a[0])/l,uz=(b[2]-a[2])/l,f=(px-a[0])*ux+(pz-a[2])*uz,s=(px-a[0])*uz-(pz-a[2])*ux;if(f>1&&f<14&&Math.abs(s)<4&&vx*ux+vz*uz>Math.max(1,Math.hypot(vx,vz)*.9)){HWL.on=true;HWL.y=0;HWL.x=px;HWL.z=pz;return}}}
// En la autopista solo hay sus pretiles: el coche no toca edificios ni tráfico de abajo
function hwyHit(dt){const q=hwyNear(px,pz,HWL.y);if(!q){px=HWL.x;pz=HWL.z;vx*=.5;vz*=.5;return}const S=HWL.segs[q[0]],t=q[1],d=q[2];HWL.y=q[3];
 if(S[7]&&S[8]<1&&t<.3&&q[3]<.12){HWL.on=false;HWL.y=0;return}
 const r=cur.w/2,lim=S[6]-r;if(d>lim&&d>.01){const cx=S[0]+(S[3]-S[0])*t,cz=S[2]+(S[5]-S[2])*t,nx=(px-cx)/d,nz=(pz-cz)/d;px=cx+nx*lim;pz=cz+nz*lim;const vn=vx*nx+vz*nz;if(vn>0){vx-=vn*nx;vz-=vn*nz;if(vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(vn)}const fr=Math.max(0,1-.9*dt);vx*=fr;vz*=fr}}
 HWL.x=px;HWL.z=pz}
function hwyLines(g,lw2){g.strokeStyle="#aebccb";g.lineCap="round";for(const S of HWL.segs){g.lineWidth=S[6]*2*lw2;g.beginPath();g.moveTo(S[0],S[2]);g.lineTo(S[3],S[5]);g.stroke()}}
