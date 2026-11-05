// Garaje: guarda combinaciones de coche, pintura y calcomanías con un nombre, para volver a ponerlas cuando quieras (se guardan en el navegador)
let GAR=[];try{GAR=JSON.parse(localStorage.getItem("td-gar")||"[]")}catch(e){}
const saveGar=()=>{try{localStorage.setItem("td-gar",JSON.stringify(GAR));return true}catch(e){return false}},GARMAX=20;
function garOpen(){if(!ready)return;if(!spawned){buildCar(carK);spawnC();spawned=true}state="gar";$("ov").hidden=false;$("carsP").hidden=$("mapP").hidden=$("setP").hidden=$("livP").hidden=$("raceP").hidden=true;$("garP").hidden=false;hudVis(false);$("touch").hidden=true;garDraw()}
function garClose(){$("garP").hidden=true;show("cars")}
function garDraw(){const P=$("garP");P.innerHTML="";const h1=document.createElement("h1");h1.textContent=T("Garaje");P.appendChild(h1);
 const r=document.createElement("div");r.className="rcRow";const inp=document.createElement("input");inp.type="text";inp.maxLength=24;inp.placeholder=T("Nombre");inp.value=CARS[carK].n+" "+(GAR.length+1);r.appendChild(inp);
 const s=document.createElement("button");s.className="b";s.textContent=T("Guardar el coche actual");s.disabled=GAR.length>=GARMAX;s.onclick=()=>{GAR.push({n:inp.value.trim()||CARS[carK].n,k:carK,l:JSON.parse(JSON.stringify(LIV[carK]))});saveGar();garDraw()};r.appendChild(s);P.appendChild(r);
 if(!GAR.length){const p=document.createElement("p");p.textContent=T("Todavía no has guardado ningún coche.");P.appendChild(p)}
 GAR.forEach((g,i)=>{const d=document.createElement("div");d.className="rcRow";const c=g.l.c===undefined?CARS[g.k].c:g.l.c,sw=document.createElement("i");sw.className="garSw";sw.style.background="#"+c.toString(16).padStart(6,"0");d.appendChild(sw);
  const inf=document.createElement("div"),b=document.createElement("b"),sm=document.createElement("small");b.textContent=g.n;sm.textContent=`${CARS[g.k].n} · ${(g.l.stk||[]).length} ${T("calcomanías")}`;inf.append(b,sm);d.appendChild(inf);
  const u=document.createElement("button");u.className="b";u.textContent=T("Usar");u.onclick=()=>{LIV[g.k]=Object.assign(LIVDEF(),JSON.parse(JSON.stringify(g.l)));saveLiv();buildCar(g.k);$("garP").hidden=true;resume()};d.appendChild(u);
  const x=document.createElement("button");x.className="b g";x.textContent="✕";x.title=T("Borrar");x.onclick=()=>{GAR.splice(i,1);saveGar();garDraw()};d.appendChild(x);P.appendChild(d)});
 const v=document.createElement("button");v.className="b g";v.textContent=T("Volver");v.onclick=garClose;P.appendChild(v)}
{const b=document.createElement("button");b.className="b g";b.dataset.i18n="🏠 Garaje";b.textContent=T("🏠 Garaje");b.onclick=garOpen;$("carsP").appendChild(b)}
