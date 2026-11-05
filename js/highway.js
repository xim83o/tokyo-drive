// Autopista elevada conducible (sobre el canal). El tablero lo dibuja buildCanal (world.js); aquí están las rampas y la conducción en altura.
// CUANDO SE AMPLÍE EL MAPA: basta con cambiar esta lista. Cada rampa va de un punto de una calle (g) a un punto del tablero (d), con al menos
// 170 m entre ellos para que no sea muy empinada; la dirección de salida se toma de la calle y de la autopista. Son de doble sentido
const HWY_RAMPS=[{g:[723,1515],d:[869,1604]},{g:[1102,1604],d:[1261,1676]},{g:[1518,1693],d:[1699,1751]}];
// on: el coche va por la autopista (fuera de eso rigen los choques normales). segs: [ax,ay,az,bx,by,bz,hw,rampa,s]
const HWL={on:false,y:0,segs:[],grid:new Map(),rp:[],x:0,z:0},HWC=50;
function hwyAdd(ax,ay,az,bx,by,bz,hw,ramp,s){const k=HWL.segs.length;HWL.segs.push([ax,ay,az,bx,by,bz,hw,ramp,s]);const m=hw+3,i0=Math.floor((Math.min(ax,bx)-m)/HWC),i1=Math.floor((Math.max(ax,bx)+m)/HWC),j0=Math.floor((Math.min(az,bz)-m)/HWC),j1=Math.floor((Math.max(az,bz)+m)/HWC);
 for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const q=i*4096+j;if(!HWL.grid.has(q))HWL.grid.set(q,[]);HWL.grid.get(q).push(k)}}
const hwyDeck=(ax,az,bx,bz,Y)=>hwyAdd(ax,Y,az,bx,Y,bz,6.5,false,0);
// Curva de cada rampa: empieza en la calle a ras de suelo y entra por el centro del tablero
function hwyRamps(Y){const herm=(a,ta,b,tb,t)=>{const t2=t*t,t3=t2*t,p=2*t3-3*t2+1,q=t3-2*t2+t,r=-2*t3+3*t2,s=t3-t2;return[p*a[0]+q*ta[0]+r*b[0]+s*tb[0],p*a[1]+q*ta[1]+r*b[1]+s*tb[1]]};
 for(const R of HWY_RAMPS){const[gx,gz]=R.g,[dx,dz]=R.d,L=Math.hypot(dx-gx,dz-gz),ox=(dx-gx)/L,oz=(dz-gz)/L;let bs=null,bd=1e18;for(let k=0;k<RSG.length;k+=6){const d=segD2(gx,gz,RSG[k],RSG[k+1],RSG[k+2],RSG[k+3]);if(d<bd){bd=d;bs=k}}
  const sl=Math.hypot(RSG[bs+2]-RSG[bs],RSG[bs+3]-RSG[bs+1])||1;let tg=[(RSG[bs+2]-RSG[bs])/sl,(RSG[bs+3]-RSG[bs+1])/sl];if(tg[0]*ox+tg[1]*oz<0)tg=[-tg[0],-tg[1]];
  let td=[ox,oz],br=1e18;for(const r of MAP.rivers){const p=r.p;for(let i=2;i<p.length;i+=2){const d=segD2(dx,dz,p[i-2],p[i-1],p[i],p[i+1]);if(d<br){br=d;const l=Math.hypot(p[i]-p[i-2],p[i+1]-p[i-1])||1;td=[(p[i]-p[i-2])/l,(p[i+1]-p[i-1])/l]}}}if(td[0]*ox+td[1]*oz<0)td=[-td[0],-td[1]];
  const n=Math.ceil(L/6),P=[];let s=0;for(let i=0;i<=n;i++){const u=i/n,q=herm(R.g,[tg[0]*L,tg[1]*L],R.d,[td[0]*L,td[1]*L],u),y=Y*u*u*(3-2*u);if(i)s+=Math.hypot(q[0]-P[i-1][0],q[1]-P[i-1][2]);P.push([q[0],y,q[1],s])}HWL.rp.push(P);
  for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];hwyAdd(a[0],a[1],a[2],b[0],b[1],b[2],4,true,a[3]);
   // Por los lados de la parte baja no se entra ni se choca con nada raro: solo por la boca, desde la calle
   const l=Math.hypot(b[0]-a[0],b[2]-a[2])||1,lx=(b[2]-a[2])/l*4.1,lz=-(b[0]-a[0])/l*4.1;if(a[3]>10&&a[1]<3)for(const k of[-1,1])addEdge(a[0]+lx*k,a[2]+lz*k,b[0]+lx*k,b[2]+lz*k)}}}
// Pretil del tablero, abierto donde entra una rampa
function hwyWall(vq,hw,A,B,Y){const l=Math.hypot(B[0]-A[0],B[1]-A[1]),n=Math.max(1,Math.ceil(l/3));for(let i=0;i<n;i++){const x0=A[0]+(B[0]-A[0])*i/n,z0=A[1]+(B[1]-A[1])*i/n,x1=A[0]+(B[0]-A[0])*(i+1)/n,z1=A[1]+(B[1]-A[1])*(i+1)/n,mx=(x0+x1)/2,mz=(z0+z1)/2;
  if(HWL.rp.some(P=>P.some(q=>q[1]>Y-3&&Math.hypot(q[0]-mx,q[2]-mz)<6)))continue;vq(hw,x0,z0,x1,z1,Y-.8,Y+1.1)}}
// Dibuja las rampas: asfalto, parte de abajo, pretiles y pilares
function hwyGeo(hd,hs,hw,pil,WY,Y){const up=(t,A,B,C)=>{const f=(B[2]-A[2])*(C[0]-A[0])-(B[0]-A[0])*(C[2]-A[2])<0;for(const q of f?[A,C,B]:[A,B,C])t.push(q[0],q[1],q[2])},wl=(x0,z0,a0,b0,x1,z1,a1,b1)=>hw.push(x0,a0,z0,x1,a1,z1,x1,b1,z1,x0,a0,z0,x1,b1,z1,x0,b0,z0);
 for(const P of HWL.rp)for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i],l=Math.hypot(b[0]-a[0],b[2]-a[2])||1,lx=(b[2]-a[2])/l*4,lz=-(b[0]-a[0])/l*4,e=i>P.length-8?-.03:0,ya=a[1]+.02+e,yb=b[1]+.02+e;
  const A=[a[0]+lx,ya,a[2]+lz],B=[b[0]+lx,yb,b[2]+lz],C=[b[0]-lx,yb,b[2]-lz],D=[a[0]-lx,ya,a[2]-lz];up(hd,A,B,C);up(hd,A,C,D);for(const[t,k]of[[hs,.8]])if(a[1]>1){up(t,[A[0],A[1]-k,A[2]],[B[0],B[1]-k,B[2]],[C[0],C[1]-k,C[2]]);up(t,[A[0],A[1]-k,A[2]],[C[0],C[1]-k,C[2]],[D[0],D[1]-k,D[2]])}
  if(i<P.length-5)for(const[p,q]of[[A,B],[D,C]])wl(p[0],p[2],Math.max(-.1,p[1]-.8),p[1]+Math.min(1,.15+a[1]),q[0],q[2],Math.max(-.1,q[1]-.8),q[1]+Math.min(1,.15+b[1]));
  if(i%5===0&&a[1]>4&&roadAt(a[0],a[2])<0){const sc=(a[1]-.8-WY)/(Y-.8-WY);pil.push([a[0],WY*(1-sc),a[2],Math.atan2(b[0]-a[0],b[2]-a[2]),1,sc]);addCirc(a[0],a[2],2.2)}}}
// Tramo sobre el que está (x,z) a la altura actual del coche. Devuelve el mejor [seg, t, distancia, altura]
const HWQ=[0,0,0,0];
function hwyNear(x,z,y){const l=HWL.grid.get(Math.floor(x/HWC)*4096+Math.floor(z/HWC));let bs=-1,bv=1e9;if(!l)return null;for(const k of l){const S=HWL.segs[k],dx=S[3]-S[0],dz=S[5]-S[2],c=dx*dx+dz*dz||1;let t=((x-S[0])*dx+(z-S[2])*dz)/c;t=t<0?0:t>1?1:t;const qy=S[1]+(S[4]-S[1])*t;if(Math.abs(qy-y)>3)continue;const d=Math.hypot(x-S[0]-dx*t,z-S[2]-dz*t),v=d-S[6];if(v<bv){bv=v;bs=k;HWQ[1]=t;HWQ[2]=d;HWQ[3]=qy}}if(bs<0)return null;HWQ[0]=bs;return HWQ}
function hwyY(x,z){const q=hwyNear(x,z,HWL.y);return q?q[3]:HWL.y}
// Subir: entrando por la boca de la rampa, en el sentido de subida
function hwyEnter(){if(HWL.on)return;for(const P of HWL.rp){const a=P[0],b=P[3],d=Math.hypot(px-a[0],pz-a[2]);if(d>16)continue;const l=Math.hypot(b[0]-a[0],b[2]-a[2])||1,ux=(b[0]-a[0])/l,uz=(b[2]-a[2])/l,f=(px-a[0])*ux+(pz-a[2])*uz,s=(px-a[0])*uz-(pz-a[2])*ux;if(f>1&&f<14&&Math.abs(s)<4&&vx*ux+vz*uz>1){HWL.on=true;HWL.y=0;HWL.x=px;HWL.z=pz;return}}}
// En la autopista solo hay sus pretiles: el coche no toca edificios ni tráfico de abajo
function hwyHit(dt){const q=hwyNear(px,pz,HWL.y);if(!q){px=HWL.x;pz=HWL.z;vx*=.5;vz*=.5;return}const S=HWL.segs[q[0]],t=q[1],d=q[2];HWL.y=q[3];
 if(S[7]&&S[8]<1&&t<.3&&q[3]<.12){HWL.on=false;HWL.y=0;return}
 const r=cur.w/2,lim=S[6]-r;if(d>lim&&d>.01){const cx=S[0]+(S[3]-S[0])*t,cz=S[2]+(S[5]-S[2])*t,nx=(px-cx)/d,nz=(pz-cz)/d;px=cx+nx*lim;pz=cz+nz*lim;const vn=vx*nx+vz*nz;if(vn>0){vx-=vn*nx;vz-=vn*nz;if(vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(vn)}const fr=Math.max(0,1-.9*dt);vx*=fr;vz*=fr}}
 HWL.x=px;HWL.z=pz}
function hwyLines(g,lw2){g.strokeStyle="#aebccb";g.lineCap="round";for(const S of HWL.segs){g.lineWidth=S[6]*2*lw2;g.beginPath();g.moveTo(S[0],S[2]);g.lineTo(S[3],S[5]);g.stroke()}}
