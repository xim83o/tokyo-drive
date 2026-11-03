// Física arcade del coche, colisión exacta con el mapa y suspensión (bordillos)
let bodyY=CURB,bodyV=0,pitch=0,roll=0;const WY=[CURB,CURB,CURB,CURB],CRB=[0,0,0,0];
function step(dt,i){thrL=i.t;brkL=i.b;stV+=(i.s-stV)*Math.min(1,dt*10);
 const vf0=vx*Math.sin(h)+vz*Math.cos(h),sp=Math.abs(vf0),dir=vf0>=0?1:-1,lat0=Math.abs(-vx*Math.cos(h)+vz*Math.sin(h));
 const tgt=i.s*2.1*Math.min(1,sp/5)/(1+sp/40)*(1+Math.min(.45,lat0/14))*(i.hb?1.3:1)*dir;
 yr+=(tgt-yr)*Math.min(1,dt*9);h-=yr*dt;
 const fx=Math.sin(h),fz=Math.cos(h),rx=-Math.cos(h),rz=Math.sin(h);
 let vf=vx*fx+vz*fz,vl=vx*rx+vz*rz;
 if(i.t>0)vf+=cur.ac*i.t*Math.max(0,1-(Math.max(0,vf)/cur.vm)**2)*dt;
 if(i.b>0)vf=vf>1?Math.max(0,vf-38*i.b*dt):Math.max(-14,vf-12*i.b*dt);
 if(!i.t&&!i.b){const d=(.12*Math.abs(vf)+1.5)*dt;vf=Math.abs(vf)<d?0:vf-Math.sign(vf)*d}
 if(i.hb)vf*=1-.15*dt;
 const sa=Math.abs(i.s),hs=Math.min(1,sp/15);
 // Con el asfalto mojado hay menos agarre (hasta un 25 % menos)
 const gw=cur.gr*(1-.25*WEA.wet)*(1-.3*(WEA.snow||0));let tg=gw*(1-hs*sa*(.4*i.t*cur.dr+.22*i.b));if(i.hb)tg=gw*.25;
 rg+=(tg-rg)*Math.min(1,dt*(tg<rg?7:6));
 slipV=Math.abs(vl);const vl0=vl;vl*=Math.exp(-rg*dt);vf=(vf>=0?1:-1)*Math.sqrt(vf*vf+(vl0*vl0-vl*vl)*.9);vf=Math.max(-14,Math.min(cur.vm,vf));
 vx=fx*vf+rx*vl;vz=fz*vf+rz*vl;const sv=Math.hypot(vx,vz);if(sv>cur.vm){vx*=cur.vm/sv;vz*=cur.vm/sv}
 // Movimiento en subpasos de 0,4 m como máximo para no atravesar paredes a mucha velocidad
 const n=Math.max(1,Math.ceil(Math.hypot(vx,vz)*dt/.4));for(let k=0;k<n;k++){px+=vx*dt/n;pz+=vz*dt/n;carHit(dt)}
 // Borde del mapa: muro invisible (la niebla lo tapa)
 if(px<8||px>W-8){px=Math.max(8,Math.min(W-8,px));vx=0}if(pz<8||pz>W-8){pz=Math.max(8,Math.min(W-8,pz));vz=0}
 // Si el coche acaba en el agua (fuera de un puente), se hunde y reaparece en la calle más cercana
 if(ready&&roadAt(px,pz)<0&&(riverD(px,pz)<-1||inWater(px,pz))){spawnAt(nearestRoad(px,pz,false));vx=vz=0;if(typeof thump==="function")thump(8)}
 suspension(dt)}
// Hitbox del coche: tres círculos del ancho del coche repartidos a lo largo, contra los bordes reales de edificios, agua, vías y postes
const CO={x:0,z:0};
function carHit(dt){if(!ready)return;const fx=Math.sin(h),fz=Math.cos(h),r=cur.w/2,d=cur.l/2-r;let sx=0,sz=0,nx=0,nz=0,hit=false;
 for(const o of[-d,0,d]){CO.x=px+fx*o;CO.z=pz+fz*o;const cx=CO.x,cz=CO.z,hh=collide(CO,r);if(hh){hit=true;sx+=CO.x-cx;sz+=CO.z-cz;nx+=hh.nx;nz+=hh.nz}}
 if(!hit)return;px+=sx;pz+=sz;const l=Math.hypot(nx,nz)||1;nx/=l;nz/=l;const vn=vx*nx+vz*nz;
 if(vn<0){vx-=vn*nx;vz-=vn*nz;if(-vn>3&&performance.now()-crashT>250){crashT=performance.now();thump(-vn)}
  // Roce: pierde algo de velocidad y el morro se alinea con la pared, sin rebote
  const fr=Math.max(0,1-.9*dt);vx*=fr;vz*=fr;const vf=vx*fx+vz*fz;if(Math.hypot(vx,vz)>2&&vf>0)h+=ad(Math.atan2(vx,vz),h)*Math.min(1,dt*7)}}
// Suspensión: cada rueda sigue la altura del suelo (calzada 0, acera +15 cm). Subir un bordillo rápido da un golpe y frena
function suspension(dt){if(!ready)return;const c=Math.cos(h),s=Math.sin(h),hw=cur.w/2,hl=cur.l*.32,vf=vx*s+vz*c,sp=Math.abs(vf);let f=0,b=0,lt=0,rt=0;
 for(let k=0;k<4;k++){const sx=k&1?-1:1,sz=k<2?1:-1,x=px+sx*hw*c+sz*hl*s,z=pz-sx*hw*s+sz*hl*c,t=surfH(x,z);
  // Golpe al subir un bordillo: como mucho uno por rueda cada 0,5 s (si la rueda va justo por el borde no frena en cada imagen)
  const now=performance.now();if(t>WY[k]+.05&&sp>2&&now-CRB[k]>500){CRB[k]=now;const loss=Math.min(.12,.006*sp);vx*=1-loss;vz*=1-loss;bodyV+=Math.min(1.4,.045*sp);if(now-crashT>180){crashT=now;thump(1.5+sp*.35)}}
  WY[k]+=(t-WY[k])*Math.min(1,dt*30);if(sz>0)f+=WY[k];else b+=WY[k];if(sx>0)lt+=WY[k];else rt+=WY[k]}
 bodyV+=(((f+b)/4-bodyY)*160-bodyV*13)*dt;bodyY+=bodyV*dt;
 pitch+=((b-f)/2/(cur.l*.64)-pitch)*Math.min(1,dt*12);roll+=((lt-rt)/2/cur.w-roll)*Math.min(1,dt*12)}
