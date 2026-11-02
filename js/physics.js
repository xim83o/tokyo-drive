// Física arcade del coche y colisiones con la ciudad
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
 let tg=cur.gr*(1-hs*sa*(.4*i.t*cur.dr+.22*i.b));if(i.hb)tg=cur.gr*.25;
 rg+=(tg-rg)*Math.min(1,dt*(tg<rg?7:6));
 slipV=Math.abs(vl);const vl0=vl;vl*=Math.exp(-rg*dt);vf=(vf>=0?1:-1)*Math.sqrt(vf*vf+(vl0*vl0-vl*vl)*.9);vf=Math.max(-14,Math.min(cur.vm,vf));
 vx=fx*vf+rx*vl;vz=fz*vf+rz*vl;const sv=Math.hypot(vx,vz);if(sv>cur.vm){vx*=cur.vm/sv;vz*=cur.vm/sv}px+=vx*dt;pz+=vz*dt;
 const ci=Math.floor(px/C),cj=Math.floor(pz/C);
 if(ci>=0&&cj>=0&&ci<N&&cj<N&&!park[ci*N+cj]){const lx=px-ci*C,lz=pz-cj*C;
  if(lx>8&&lx<92&&lz>8&&lz<92){const d=[lx-8,92-lx,lz-8,92-lz],m=Math.min(...d),k=d.indexOf(m),vxo=vx,vzo=vz;
   if(k==0){px-=m;if(vx>0)vx=0}else if(k==1){px+=m;if(vx<0)vx=0}else if(k==2){pz-=m;if(vz>0)vz=0}else{pz+=m;if(vz<0)vz=0}
   const imp=Math.hypot(vxo-vx,vzo-vz);if(imp>3&&performance.now()-crashT>250){crashT=performance.now();thump(imp)}
   const fr=Math.max(0,1-.9*dt);vx*=fr;vz*=fr;if(Math.hypot(vx,vz)>2&&vf>0)h+=ad(Math.atan2(vx,vz),h)*Math.min(1,dt*7)}}
 const td=Math.hypot(px-TX,pz-TZ);if(td<16){px=TX+(px-TX)/td*16;pz=TZ+(pz-TZ)/td*16;vx*=.5;vz*=.5}
 // Borde del mapa: muro invisible que frena el movimiento hacia fuera
 if(px<4||px>W-4){px=Math.max(4,Math.min(W-4,px));vx=0}if(pz<4||pz>W-4){pz=Math.max(4,Math.min(W-4,pz));vz=0}}
// Saca de manzanas y de la torre un objeto suelto {x,z,vx,vz} (NPC desplazados); devuelve la velocidad del golpe
function cityHit(o){let imp=0;const ci=Math.floor(o.x/C),cj=Math.floor(o.z/C);
 if(ci>=0&&cj>=0&&ci<N&&cj<N&&!park[ci*N+cj]){const lx=o.x-ci*C,lz=o.z-cj*C;
  if(lx>8&&lx<92&&lz>8&&lz<92){const d=[lx-8,92-lx,lz-8,92-lz],m=Math.min(...d),k=d.indexOf(m);
   if(k<2){o.x+=k?m:-m;imp=Math.abs(o.vx);o.vx*=-.3}else{o.z+=k==3?m:-m;imp=Math.abs(o.vz);o.vz*=-.3}}}
 const td=Math.hypot(o.x-TX,o.z-TZ);if(td<16){o.x=TX+(o.x-TX)/td*16;o.z=TZ+(o.z-TZ)/td*16;imp=Math.hypot(o.vx,o.vz);o.vx*=-.3;o.vz*=-.3}
 o.x=Math.max(5,Math.min(W-5,o.x));o.z=Math.max(5,Math.min(W-5,o.z));return imp}
