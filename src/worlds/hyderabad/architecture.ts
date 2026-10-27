import * as T from 'three';
import {Builder,material,vec,canvasTexture} from '../../geometry.ts';
import {registerGlow} from '../../lighting.ts';
const plaster=material('#d5c6a4'),cream=material('#ece1c8'),dark=material('#55564c'),stone=material('#a59a81'),ochre=material('#c9ae72');
const archShape=(w:number,h:number)=>{const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(w/2,h*.51);s.bezierCurveTo(w/2,h*.7,w*.22,h*.9,0,h);s.bezierCurveTo(-w*.22,h*.9,-w/2,h*.7,-w/2,h*.51);s.closePath();return s;};
function trimArch(b:Builder,x:number,y:number,z:number,w:number,h:number,yaw=0,fill=true,mat:T.Material=cream) {
 const frame=archShape(w+.12,h+.09);frame.holes.push(new T.Path(archShape(w,h).getPoints(10)));const geo=new T.ExtrudeGeometry(frame,{depth:.055,bevelEnabled:false,curveSegments:8});b.add(geo,mat,x,y,z,1,1,1,0,yaw);geo.dispose();
 if(fill){const g=new T.ShapeGeometry(archShape(w,h),8);b.add(g,dark,x-Math.sin(yaw)*.025,y,z-Math.cos(yaw)*.025,1,1,1,0,yaw);g.dispose();}
}
function piercedWall(b:Builder,w:number,h:number,opening:number,archHeight:number,depth:number,x:number,z:number,yaw=0,mat:T.Material=plaster) {
 const s=new T.Shape([new T.Vector2(-w/2,0),new T.Vector2(w/2,0),new T.Vector2(w/2,h),new T.Vector2(-w/2,h)]);s.holes.push(new T.Path(archShape(opening,archHeight).getPoints(14)));
 const g=new T.ExtrudeGeometry(s,{depth,bevelEnabled:false,curveSegments:12});b.add(g,mat,x,0,z,1,1,1,0,yaw);g.dispose();
}
function dome(b:Builder,x:number,y:number,z:number,r:number,h:number,mat:T.Material=plaster){const p=[[.72,0],[.86,.13],[1,.4],[.92,.65],[.65,.83],[.2,.98],[.025,1]].map(([a,c])=>new T.Vector2(a*r,c*h));const g=new T.LatheGeometry(p,28);b.add(g,mat,x,y,z);g.dispose();b.cylinder(x,y+h+.14,z,.025,.3,material('#8e7a4c',.4,.45),.01,6);}
function gallery(b:Builder,x:number,y:number,z:number,r:number,h:number,mat:T.Material=plaster) {
 b.cylinder(x,y,z,r*1.1,.12,cream,r*1.1,24);b.cylinder(x,y+h,z,r*1.12,.12,cream,r*1.12,24);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;b.cylinder(x+Math.sin(a)*r*.86,y+h/2,z+Math.cos(a)*r*.86,.035,h,mat,.035,5);}
 const ring=new T.TorusGeometry(r*.95,.03,5,32);b.add(ring,cream,x,y+h*.2,z,1,1,1,Math.PI/2);ring.dispose();
}
function clock(b:Builder,x:number,y:number,z:number,r:number,yaw=0){const g=new T.CircleGeometry(r,24);b.add(g,cream,x,y,z,1,1,1,0,yaw);g.dispose();const center=vec(x,y,z).add(vec(Math.sin(yaw)*.015,0,Math.cos(yaw)*.015));b.beam(center,center.clone().add(vec(0,r*.68,0)),.013,dark,5);b.beam(center,center.clone().add(vec(Math.cos(yaw)*r*.52,.06,-Math.sin(yaw)*r*.52)),.014,dark,5);}
export function charminar() {
 const b=new Builder();
 for(let i=0;i<4;i++){
  const yaw=i*Math.PI/2,n=vec(Math.sin(yaw),0,Math.cos(yaw)),right=vec(Math.cos(yaw),0,-Math.sin(yaw));
  piercedWall(b,4.1,5.25,2.55,3.77,.36,n.x*1.7,n.z*1.7,yaw);
  trimArch(b,n.x*2.065,.02,n.z*2.065,2.55,3.77,yaw,false);
  for(const s of [-1,1])for(let row=0;row<3;row++){const p=n.clone().multiplyScalar(2.07).addScaledVector(right,s*1.57);trimArch(b,p.x,.25+row*1.05,p.z,.35,.7,yaw);}
  for(let j=-3;j<=3;j++){const p=n.clone().multiplyScalar(2.075).addScaledVector(right,j*.43);trimArch(b,p.x,4.07,p.z,.28,.57,yaw);}
  const p=n.clone().multiplyScalar(2.14);clock(b,p.x,4.38,p.z,.22,yaw);
  for(const y of [3.9,4.8,5.26]){const p=n.clone().multiplyScalar(2.03);b.box(p.x,y,p.z,4.23,.1,.14,cream,yaw);}
  for(let j=-6;j<=6;j++){const p=n.clone().multiplyScalar(2.08).addScaledVector(right,j*.27);b.box(p.x,5.43,p.z,.075,.31,.075,cream);}
 }
 b.box(0,4.93,0,3.5,.14,3.5,plaster);b.box(0,5.3,0,4.25,.12,4.25,cream);
 // The roof mosque is a low west-side room. There is deliberately no central dome.
 b.box(-1.35,5.68,0,.85,.72,3.45,plaster);b.box(-1.35,6.08,0,1,.12,3.6,cream);
 for(const z of [-1.1,-.55,0,.55,1.1])trimArch(b,-.91,5.37,z,.37,.52,Math.PI/2);
 for(const x of [-2.04,2.04])for(const z of [-2.04,2.04]){
  b.cylinder(x,1.94,z,.62,3.88,plaster,.57,24);b.cylinder(x,3.83,z,.77,.22,cream,.68,24);
  gallery(b,x,4.0,z,.76,.7);b.cylinder(x,5.32,z,.48,1.2,plaster,.45,24);
  gallery(b,x,5.94,z,.63,.72);b.cylinder(x,7.14,z,.39,.9,plaster,.36,24);
  gallery(b,x,7.62,z,.51,.55);b.cylinder(x,8.45,z,.31,.56,plaster,.29,20);
  gallery(b,x,8.18,z,.37,.5);dome(b,x,8.76,z,.49,.7,stone);
  for(const y of [3.75,4.75,5.88,6.75,7.54,8.76])b.cylinder(x,y,z,y<5?.72:y<7?.56:.39,.075,cream,y<5?.72:y<7?.56:.39,24);
  // Lotus-leaf neck below the galleries and fine vertical stucco pilasters.
  for(let j=0;j<12;j++){const a=j*Math.PI/6;b.sphere(x+Math.sin(a)*.58,3.75,z+Math.cos(a)*.58,.09,.18,.09,cream);}
  for(let j=0;j<8;j++){const a=j*Math.PI/4;b.cylinder(x+Math.sin(a)*.605,1.9,z+Math.cos(a)*.605,.018,3.65,cream,.018,5);}
 }
 const root=b.finish();root.name='Charminar · four open arches and four tiered minarets';root.userData.architecture='charminar';return root;
}
export function meccaMasjid() {
 const b=new Builder();b.box(0,.16,0,11.2,.32,14.1,stone);b.box(-.2,2.44,0,10.1,4.4,13.4,stone);b.box(-.2,4.72,0,10.6,.16,13.8,cream);
 // Granite prayer hall faces east. The five front arches, flat cornice and two
 // end towers distinguish this from the Taj mosque's three-dome composition.
 for(let i=-2;i<=2;i++){trimArch(b,4.88,.36,i*2.35,1.84,3.68,Math.PI/2,true,stone);for(const s of [-1,1])b.box(4.96,2.3,i*2.35+s*1.04,.08,3.9,.06,cream);}
 for(let i=-13;i<=13;i++){b.cylinder(4.95,4.99,i*.48,.06,.34,cream,.035,6);}
 for(const z of [-6.4,6.4]){b.cylinder(4.62,2.5,z,.61,5,stone,.56,16);gallery(b,4.62,4.82,z,.68,.68,stone);dome(b,4.62,5.54,z,.58,.8,stone);}
 for(let x=-4.5;x<=4.5;x+=.6)for(const z of [-6.8,6.8])b.cylinder(x,4.99,z,.045,.3,cream,.02,5);
 const root=b.finish();root.name='Mecca Masjid · granite prayer hall';return root;
}
export function kaman() {
 const b=new Builder();piercedWall(b,5.1,3.7,3,2.95,.72,0,-.36,0,plaster);
 for(const side of [-1,1])trimArch(b,0,0,side*.37,3,2.95,side<0?Math.PI:0,false);
 b.box(0,3.63,0,5.35,.13,.95,cream);for(const x of [-2.1,2.1])b.box(x,1.9,0,.12,3.8,1,cream);
 const root=b.finish();root.name='Char Kaman · historic gateway';return root;
}
function pavilion(b:Builder,x:number,y:number,z:number,r=.7) {
 b.cylinder(x,y+.1,z,r*1.15,.2,cream,r*1.15,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;b.cylinder(x+Math.cos(a)*r*.77,y+.6,z+Math.sin(a)*r*.77,.055,1,cream,.055,6);}
 b.cylinder(x,y+1.12,z,r*1.2,.12,cream,r*1.2,8);b.cylinder(x,y+1.32,z,r*.98,.25,ochre,r*.8,8);b.cylinder(x,y+1.48,z,r*.9,.1,cream,r*.9,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;b.cylinder(x+Math.cos(a)*r*.88,y+1.6,z+Math.sin(a)*r*.88,.035,.2,cream,.015,6);}
}
export function khilwatMubarak() {
 const b=new Builder();b.box(0,.25,0,17,.5,7.1,cream);b.box(0,1.9,0,16.5,3.3,6.4,ochre);
 b.box(0,3.65,0,16.9,.18,6.8,cream);b.box(0,4.3,.3,5.2,1.25,4.8,ochre);b.box(0,4.96,.3,5.7,.14,5.2,cream);
 for(const z of [-3.24,3.24]){
  const yaw=z<0?Math.PI:0;
  for(let j=-3;j<=3;j++)trimArch(b,j*1.56,.52,z,1.2,2.53,yaw,true,cream);
  for(const x of [-7.1,7.1])trimArch(b,x,.52,z,1.37,2.3,yaw,true,cream);
  for(let j=-5;j<=5;j++){b.box(j*1.2,3.26,z,.2,.2,.06,cream,Math.PI/4);}
  for(const x of [-5.8,5.8,-8,8])b.box(x,1.97,z,.17,3.3,.15,cream);
 }
 for(const x of [-1.65,0,1.65])trimArch(b,x,3.7,-2.14,1,1.08,Math.PI,true,cream);
 for(const x of [-5.7,5.7]){b.box(x,3.98,0,2, .5,3.4,ochre);pavilion(b,x,4.24,0,.73);}
 for(const x of [-8,8])for(const z of [-2.7,2.7]){b.cylinder(x,3.98,z,.24,.55,cream,.24,8);dome(b,x,4.25,z,.32,.32,cream);}
 for(let i=-10;i<=10;i++)b.box(i*.75,3.85,-3.4,.06,.3,.06,cream);
 const root=b.finish();root.name='Khilwat Mubarak · ochre stucco and open rooftop pavilions';return root;
}
export function palaceWing(w:number,d:number,index=0,passage=false) {
 const b=new Builder();if(passage)piercedWall(b,w,3.6,2.6,2.8,d,0,-d/2,0,index%2?cream:ochre);else b.box(0,1.8,0,w,3.6,d,index%2?cream:ochre);b.box(0,3.64,0,w+.35,.16,d+.35,cream);
 const n=Math.floor(w/1.4);for(let i=0;i<n;i++)for(const side of [-1,1]){const x=-w/2+(i+.5)*w/n;if(passage&&Math.abs(x)<1.9)continue;trimArch(b,x,.3,side*(d/2+.02),w/n*.65,2.65,side<0?Math.PI:0,true,cream);}
 if(passage)for(const side of [-1,1])trimArch(b,0,0,side*(d/2+.02),2.6,2.8,side<0?Math.PI:0,false);
 for(const x of [-w/2+.4,w/2-.4])for(const z of [-d/2+.4,d/2-.4]){b.cylinder(x,3.88,z,.28,.4,cream,.25,8);dome(b,x,4.12,z,.35,.38,cream);}
 return b.finish();
}
export function palaceClockGate(){const b=new Builder();piercedWall(b,6.6,3,2.6,2.6,2.2,0,-1.1,0,ochre);for(const s of [-1,1])trimArch(b,0,0,s*1.12,2.6,2.6,s<0?Math.PI:0,false);b.box(0,3.87,0,2.35,1.8,2.35,ochre);b.box(0,4.83,0,2.65,.14,2.65,cream);for(const s of [-1,1])clock(b,0,3.95,s*1.19,.45,s<0?Math.PI:0);b.cylinder(0,5.05,0,.83,.35,cream,.68,8);dome(b,0,5.22,0,.7,.45,cream);return b.finish();}
const facades=new Map<number,T.MeshStandardMaterial>();
// Six muted, locally shared plaster families. Heritage buildings retain their
// own pale stone, so domestic roofs do not wash the entire district to ivory.
const HOUSE_COLORS=['#b29a73','#8e9e8b','#c5b18e','#aa7e66','#909b91','#cdbfa0'];
const ROOF_COLORS=['#a79678','#8f9986','#b7a68a','#9e826c','#8e9588','#b9aa8c'];
function facade(index:number){
 if(facades.has(index))return facades.get(index)!;
 const map=canvasTexture(128,128,c=>{
  c.fillStyle=HOUSE_COLORS[index];c.fillRect(0,0,128,128);
  for(let y=0;y<3;y++)for(let x=0;x<3;x++){
   c.fillStyle=index%2?'#71806b':'#7a694f';c.fillRect(x*42+11,y*42+10,19,25);
   c.fillStyle='#414c43';c.fillRect(x*42+14,y*42+12,13,19);
   c.fillStyle=index%2?'#8b997d':'#ac9270';
   // Painted shutters, recessed panes and lintels vary without per-window meshes.
   if((x+y+index)%3===0){c.fillRect(x*42+13,y*42+12,5,19);for(let j=0;j<4;j++){c.fillStyle='#65745e';c.fillRect(x*42+13,y*42+15+j*4,5,1);}}
   c.fillStyle='#c7b797';c.fillRect(x*42+10,y*42+35,21,2);
  }
 });
 const em=canvasTexture(128,128,c=>{c.fillStyle='#000';c.fillRect(0,0,128,128);for(let y=0;y<3;y++)for(let x=0;x<3;x++)if((x+y*3+index)%4<2){c.fillStyle=(x+index)%3?'#caa46f':'#93afa3';c.fillRect(x*42+18,y*42+12,9,19);}});
 const m=registerGlow(new T.MeshStandardMaterial({map,emissiveMap:em,emissive:'#ffffff',roughness:.92}),.38);m.userData.facadeCap=material(HOUSE_COLORS[index]);facades.set(index,m);return m;
}
export function oldCityHouse(index:number,w:number,d:number,h:number,bazaar=false){
 const b=new Builder(),family=index%6,wall=facade(family),plaster=material(HOUSE_COLORS[family]),roof=material(ROOF_COLORS[family]),courtyard=family===2&&!bazaar;
 if(courtyard){
  // An open roof court with three full-height ranges and a lower front range.
  for(const side of [-1,1]){b.box(side*w*.365,h/2,0,w*.27,h,d,wall);b.box(side*w*.365,h+.04,0,w*.29,.1,d+.12,roof);}
  b.box(0,h/2,-d*.37,w*.46,h,d*.26,wall);b.box(0,h+.04,-d*.37,w*.48,.1,d*.28,roof);
  b.box(0,h*.34,d*.38,w*.46,h*.68,d*.24,wall);b.box(0,h*.68+.04,d*.38,w*.48,.1,d*.26,roof);
  b.box(0,.04,0,w*.44,.06,d*.44,material('#a79c7d'));
  for(const side of [-1,1])b.box(side*w*.23,h+.14,-d*.08,.09,.2,d*.54,plaster);
 }else{
  b.box(0,h/2,0,w,h,d,wall);b.box(0,h+.04,0,w+.12,.1,d+.12,roof);
 }
 for(const x of [-1,1])b.box(x*(w-.1)/2,h+.14,0,.1,.23,d,plaster);
 for(const z of [-1,1])b.box(0,h+.14,z*(d-.1)/2,w,.23,.1,plaster);
 if(index%3!==0)b.cylinder(w*.26,h+.3,-d*.26,.18,.42,'#596252',.18,10);
 if(index%4===0){
  // A single-scale stair room, not a second three-storey window-grid tower.
  b.box(-w*.22,h+.29,-d*.2,w*.34,.52,d*.35,plaster);
  b.box(-w*.22,h+.59,-d*.2,w*.37,.1,d*.38,roof);
  b.box(-w*.22,h+.31,-d*.025,.24,.22,.025,'#4c584a');
 }
 if(family===4){
  b.box(0,h*.59,d/2+.18,w*.6,.07,.36,roof);
  for(const x of [-w*.28,0,w*.28])b.box(x,h*.59+.15,d/2+.33,.035,.3,.035,plaster);
  b.box(0,h*.59+.29,d/2+.33,w*.6,.035,.035,plaster);
 }
 if(bazaar){
  b.box(0,.45,d/2+.015,w*.82,.9,.05,'#465448');
  b.box(0,1.04,d/2+.52,w*.94,.085,1.02,index%2?'#607e6c':'#996d54');
  b.box(0,1.26,d/2+.07,w*.85,.2,.12,index%2?'#a89560':'#68826f');
  for(let i=0;i<5;i++)b.box(-w*.34+i*w*.17,.65,d/2+.07,.13,.13,.055,['#c4ad6a','#b78363','#a7b8a3'][i%3]);
  if(index%2===0)for(const side of [-1,1])b.box(side*w*.43,.52,d/2+.85,.035,1.04,.035,'#756950');
 }
 const root=b.finish();root.userData.buildingHeight=h;root.userData.roofStyle=courtyard?'courtyard':index%4===0?'stair-room':family===4?'balcony':'terrace';root.userData.facadeFamily=family;return root;
}
export function bazaarTerrace(index:number,count=14){
 const b=new Builder();for(let i=0;i<count;i++){const home=oldCityHouse(index*2+i%2,5,4.5,2.1+(i%4)*.25,true);home.position.x=(i-(count-1)/2)*5;b.absorb(home);}
 const root=b.finish();root.userData.houseCount=count;root.userData.buildingHeight=2.85;root.userData.roofStyle='attached-bazaar';return root;
}
