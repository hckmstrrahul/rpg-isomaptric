import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {registerGlow,glowMaterial} from '../../lighting.ts';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

export const METAL=material('#aab1b4',.43,.46),PALE=material('#c6c9c6'),DARK=material('#37434b'),SOLAR=material('#203743',.32,.24);
const GOLD=material('#c69a3f',.32,.82),GOLD_SEAM=material('#75551f',.39,.7);
export function goldSatellite(){
 const b=new Builder();
 b.cylinder(0,1.55,0,2.05,2.5,GOLD,1.7,8);b.cylinder(0,2.86,0,1.72,.16,METAL,1.72,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,aa=a+Math.PI/8;
  b.beam(vec(Math.sin(a)*2.05,.3,Math.cos(a)*2.05),vec(Math.sin(a)*1.7,2.8,Math.cos(a)*1.7),.035,GOLD_SEAM,5);
  for(const y of [.6,1.1,1.6,2.1])b.beam(vec(Math.sin(aa-.16)*1.92,y,Math.cos(aa-.16)*1.92),vec(Math.sin(aa+.16)*1.82,y+.16,Math.cos(aa+.16)*1.82),.016,GOLD_SEAM,4);
 }
 for(const side of [-1,1]){
  b.beam(vec(side*1.4,1.8,0),vec(side*6.7,1.8,0),.09,METAL,8);
  for(let n=0;n<3;n++){const x=side*(3.25+n*1.8);b.box(x,1.88,0,1.7,.11,3.8,SOLAR);for(let j=-3;j<=3;j++)b.box(x,1.945,j*.5,1.62,.012,.018,METAL);for(const dx of [-.54,0,.54])b.box(x+dx,1.946,0,.018,.012,3.7,METAL);}
  b.beam(vec(side*.9,.4,.8),vec(side*2.6,0,1.8),.075,METAL,8);b.beam(vec(side*.9,.4,-.8),vec(side*2.6,0,-1.8),.075,METAL,8);
  for(const z of [-1.8,1.8])b.cylinder(side*2.6,.08,z,.36,.16,PALE,.36,12);
 }
 b.cylinder(0,3.6,0,.07,1.4,METAL,.05,8);
 const dish=new T.SphereGeometry(1.1,24,10,0,Math.PI*2,0,Math.PI*.38);dish.scale(1,.32,1);b.add(dish,METAL,0,4.28,0,1,1,1,Math.PI);dish.dispose();
 b.beam(vec(0,4.1,0),vec(0,4.9,0),.035,GOLD_SEAM,6);b.sphere(0,4.9,0,.12,.12,.12,GOLD);
 return b.finish();
}
const GLASS=registerGlow(new T.MeshStandardMaterial({color:'#385d6c',emissive:'#8bb8c5',roughness:.3,metalness:.25}),.27,.01);
const STRIP=glowMaterial('#b6d8e4',1.35);
let greenhouseGlass:T.MeshPhysicalMaterial|undefined;
function domeGlass(){return greenhouseGlass??=new T.MeshPhysicalMaterial({color:'#b1d9dd',transparent:true,opacity:.23,roughness:.25,metalness:.12,depthWrite:false,side:T.FrontSide});}
function roundedShape(w:number,d:number,r:number){const s=new T.Shape();s.moveTo(-w/2+r,-d/2);s.lineTo(w/2-r,-d/2);s.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r);s.lineTo(w/2,d/2-r);s.quadraticCurveTo(w/2,d/2,w/2-r,d/2);s.lineTo(-w/2+r,d/2);s.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r);s.lineTo(-w/2,-d/2+r);s.quadraticCurveTo(-w/2,-d/2,-w/2+r,-d/2);return s;}
function rounded(b:Builder,w:number,d:number,h:number,r:number,y:number,mat:T.Material=METAL,x=0,z=0){const g=new T.ExtrudeGeometry(roundedShape(w,d,r),{depth:h,bevelEnabled:false,curveSegments:6});g.rotateX(-Math.PI/2);b.add(g,mat,x,y,z);g.dispose();}
function hemisphere(b:Builder,x:number,y:number,z:number,r:number,mat:T.Material){const g=new T.SphereGeometry(r,32,16,0,Math.PI*2,0,Math.PI/2);b.add(g,mat,x,y,z);g.dispose();}
function ring(b:Builder,x:number,y:number,z:number,r:number,t:number,mat:T.Material){const g=new T.TorusGeometry(r,t,6,48);b.add(g,mat,x,y,z,1,1,1,Math.PI/2);g.dispose();}
function ladder(b:Builder,x:number,z:number,y:number,h:number){for(const side of [-1,1])b.beam(vec(x+side*.35,y,z),vec(x+side*.35,y+h,z),.045,PALE,6);for(let yy=y+.25;yy<y+h;yy+=.36)b.beam(vec(x-.35,yy,z),vec(x+.35,yy,z),.035,PALE,6);}
function airlock(b:Builder,x:number,y:number,z:number,w=2.5,h=3){b.box(x,y+h/2,z,w+.65,h+.5,.7,PALE);b.box(x,y+h/2,z+.38,w,h,.05,DARK);b.box(x,y+h/2,z+.42,.08,h,.06,METAL);b.box(x,y+h*.73,z+.44,w*.6,.47,.05,GLASS);b.box(x+w/2+.46,y+h*.56,z+.4,.23,.45,.1,STRIP);}
function habitatAirlock(b:Builder){
 // A short pressure vestibule stays within the existing stair/apron footprint.
 rounded(b,4.2,2.4,.32,.55,.65,PALE,0,14.1);
 for(const side of [-1,1])b.box(side*1.85,2.55,14.1,.5,3.5,2.3,METAL);
 b.box(0,4.38,14.1,4.2,.38,2.4,PALE);
 b.box(0,2.55,15.18,3.1,3.28,.16,DARK);
 for(const side of [-1,1]){
  b.box(side*1.6,2.55,15.32,.19,3.54,.16,PALE);
  b.box(side*.76,2.52,15.31,1.39,3.02,.12,METAL);
  b.box(side*.76,3.03,15.395,.7,.55,.045,GLASS);
  for(const y of [1.25,3.9])b.box(side*1.43,y,15.46,.22,.32,.16,DARK);
  b.box(side*.23,2.18,15.44,.11,.55,.13,PALE);
 }
 for(const y of [.79,4.3])b.box(0,y,15.34,3.4,.18,.2,PALE);
 b.box(0,2.5,15.405,.08,3.05,.05,DARK);
 b.box(0,4.31,15.47,1.1,.07,.08,STRIP);
 b.box(2.14,2.55,15.12,.32,.62,.23,DARK);b.box(2.14,2.68,15.25,.2,.2,.035,GLASS);
 for(const side of [-1,1])for(const z of [13.42,14.82])b.box(side*2.12,2.55,z,.12,3.25,.16,PALE);
}
export function habitat(){
 const b=new Builder();rounded(b,35,28,.75,6,0,PALE);rounded(b,33.5,26,1.55,5.5,.75);rounded(b,33.5,26,2.3,5.5,3.95);rounded(b,34.2,26.8,.35,5.7,6.25,PALE);
 rounded(b,33.5,26,1.65,5.5,2.3,GLASS);rounded(b,33.8,26.3,.16,5.6,2.2,PALE);rounded(b,33.8,26.3,.16,5.6,4,PALE);
 for(const side of [-1,1])for(let x=-11;x<=11;x+=3.15)b.box(x,3.1,side*13.09,.27,4.4,.22,METAL);
 for(const side of [-1,1])for(let z=-7;z<=7;z+=3.4)b.box(side*16.8,3.1,z,.2,4.4,.28,METAL);
 rounded(b,24,18,.6,4,6.6,PALE,-1,-2);rounded(b,24,18,1.05,4,7.2,GLASS,-1,-2);rounded(b,24,18,1.85,4,8.25,PALE,-1,-2);rounded(b,24.7,18.7,.45,4.2,10.1,METAL,-1,-2);
 for(const side of [-1,1])for(let x=-9;x<=7;x+=3)b.box(x,8.1,side*9-2,.24,2.7,.18,PALE);
 b.cylinder(0,13.7,-3,4.5,6.6,METAL,4.5,32);b.cylinder(0,16.2,-3,4.55,1.55,GLASS,4.55,32);b.cylinder(0,17.2,-3,4.9,.4,PALE,4.9,32);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;b.beam(vec(Math.sin(a)*4.58,15.42,-3+Math.cos(a)*4.58),vec(Math.sin(a)*4.58,16.98,-3+Math.cos(a)*4.58),.055,PALE,5);}
 b.cylinder(0,17.75,-3,3.2,.7,METAL,2.9,32);b.cylinder(0,19.25,-3,.075,2.3,PALE,.035,8);ring(b,0,17.2,-3,4.9,.045,STRIP);
 habitatAirlock(b);for(let i=0;i<6;i++)b.box(0,.08+i*.12,16.4-i*.34,5,.16,1.15,PALE);
 // Roof equipment, cable trays and railings are all merged static geometry.
 for(const x of [-11,9]){rounded(b,3.2,4,.9,.5,6.6,DARK,x,5);for(let z=3.5;z<=6.5;z+=.4)b.box(x,7.55,z,3,.06,.12,METAL);}
 for(const x of [-13,12])for(let z=-8;z<=8;z+=2.2){b.beam(vec(x,6.55,z),vec(x,7.25,z),.035,PALE,5);if(z<7)b.beam(vec(x,7.25,z),vec(x,7.25,z+2.2),.035,PALE,5);}
 // Pressure-panel seams, roof service equipment and control-tower ribs.
 const seam=material('#7f8c91',.6,.25);
 // The upper pressure deck has shallow standing seams and three connected
 // service groups. All use the existing material batches and add no lights.
 for(const x of [-9,-6,6,9])b.box(x,10.575,-2,.045,.035,13.8,seam);
 for(const z of [2.2,4.8,-9.2])b.box(-1,10.575,z,18,.035,.045,seam);
 b.cylinder(0,10.65,-3,4.7,.18,PALE,4.7,32);
 for(const [x,z,w,d] of [[-8.3,-3.7,3.4,5.4],[7.6,-3.8,2.7,5.1],[-1,-9.1,3.6,1.5]]){
  b.box(x,10.75,z,w,.3,d,DARK);b.box(x,11.12,z,w-.3,.48,d-.3,METAL);
  for(let zz=z-d/2+.35;zz<=z+d/2-.25;zz+=.36)b.box(x,11.4,zz,w-.48,.07,.11,PALE);
  for(const sx of [-1,1])b.box(x+sx*(w/2-.25),10.66,z,.22,.22,d-.5,PALE);
 }
 const conduit=(points:T.Vector3[])=>{for(let i=1;i<points.length;i++)b.beam(points[i-1],points[i],.085,PALE,6);};
 for(const side of [-1,1]){
  conduit([vec(side*4.4,11.1,-1.4),vec(side*5.3,11.1,-1.4),vec(side*5.3,10.83,-1.4),vec(side*(side<0?6.8:6.3),10.83,-1.4)]);
  for(const z of [-.7,1.9,4.5])b.box(side*5.25,10.72,z,.38,.3,.26,DARK);
  conduit([vec(side*5.25,10.95,-1.4),vec(side*5.25,10.95,4.5),vec(side*2.4,10.95,4.5)]);
 }
 conduit([vec(-1,11.1,-7.4),vec(-1,11.1,-8.2)]);
 // Access hatch and non-emissive warning pads make the service route legible.
 b.box(0,10.67,4.5,3.6,.2,1.7,PALE);b.box(0,10.79,4.5,3.1,.06,1.25,seam);
 for(const x of [-1.25,1.25])b.box(x,10.87,4.5,.12,.12,.65,DARK);
 for(const side of [-1,1]){
  for(let x=-10;x<=10;x+=2.5){b.box(x,1.5,side*13.025,.035,1.2,.035,seam);b.box(x,5.1,side*13.025,.035,1.9,.035,seam);b.box(x,5.82,side*13.04,1.6,.15,.06,PALE);}
  for(let z=-7;z<=7;z+=2.6){b.box(side*16.775,1.5,z,.035,1.2,.035,seam);b.box(side*16.775,5.1,z,.035,1.9,.035,seam);}
  for(let x=-8;x<=6;x+=2.3)b.box(x,9.15,side*9.025-2,.035,1.7,.035,seam);
 }
 for(let i=0;i<24;i++){const a=i*Math.PI/12;b.beam(vec(Math.sin(a)*4.51,10.6,-3+Math.cos(a)*4.51),vec(Math.sin(a)*4.51,15.4,-3+Math.cos(a)*4.51),.033,seam,5);}
 for(const y of [11.4,12.6,13.8,15])b.cylinder(0,y,-3,4.52,.045,seam,4.52,32);
 for(const x of [-6,-2,2,6]){b.box(x,6.9,8.5,2.4,.55,2.1,DARK);for(let z=7.7;z<9.4;z+=.24)b.box(x,7.2,z,2.15,.035,.045,METAL);}
 for(const side of [-1,1]){b.beam(vec(side*16,6.58,-7),vec(side*16,7.35,-7),.04,PALE,5);b.beam(vec(side*16,7.35,-7),vec(side*16,7.35,7),.04,PALE,5);}
 for(const z of [-5,-1,3]){b.cylinder(-14.9,7.35,z,.65,1.5,PALE,.65,16);b.cylinder(-14.9,7.4,z,.68,.09,seam,.68,16);}
 ladder(b,-10,12.1,1,5.3);const root=b.finish();root.name='Fictional Moon habitat · pressure decks and control tower';return root;
}
export function rocket(){
 const b=new Builder(),profile=[[0,0],[1.4,0],[1.7,.5],[1.7,10.5],[1.55,12.5],[1.1,15],[.5,16.7],[0,17.2]].map(([x,y])=>new T.Vector2(x,y));const g=new T.LatheGeometry(profile,32);b.add(g,PALE,0,1,0);g.dispose();
 for(const y of [2.5,5,9.5,12.4])b.cylinder(0,y,0,1.72,.12,DARK,1.72,32);b.cylinder(0,11.2,0,1.73,.7,GLASS,1.73,32);
 for(let i=0;i<4;i++){const a=i*Math.PI/2,x=Math.sin(a),z=Math.cos(a);b.beam(vec(x*1.2,4,z*1.2),vec(x*3.5,.4,z*3.5),.14,METAL,8);b.beam(vec(x*1.3,1.7,z*1.3),vec(x*3.5,.4,z*3.5),.09,METAL,8);b.cylinder(x*3.5,.2,z*3.5,.75,.4,DARK,.75,12);}
 b.cylinder(0,.8,0,1.3,1.2,DARK,.75,24);const root=b.finish();root.name='Fictional lunar shuttle · grounded landing legs';return root;
}
export function observatory(){
 const b=new Builder();b.cylinder(0,.3,0,9,.6,PALE,9,48);b.cylinder(0,2.5,0,7.8,4.4,METAL,7.8,48);b.cylinder(0,4.8,0,8.3,.3,PALE,8.3,48);
 hemisphere(b,0,4.95,0,7.7,PALE);b.box(0,8.5,4.4,2.3,5.4,1.8,DARK);
 for(const side of [-1,1])b.beam(vec(side*1.3,5,7.2),vec(side*1.3,11.9,0),.17,METAL,8);
 for(let i=0;i<12;i++){const a=i*Math.PI/6;b.box(Math.sin(a)*7.8,2.5,Math.cos(a)*7.8,.12,3.3,.3,DARK,-a);}
 airlock(b,0,.4,8,2.3,3);const root=b.finish();root.name='Fictional lunar observatory · slit dome';return root;
}
function plantedTree(b:Builder,x:number,z:number,s=1){b.cylinder(x,.17,z,1.4*s,.34,PALE,1.4*s,24);b.cylinder(x,.36,z,1.2*s,.12,material('#5f5a47'),1.2*s,24);b.cylinder(x,1.15*s,z,.1*s,1.5*s,material('#665445'),.075*s,8);b.sphere(x,2.1*s,z,.75*s,.9*s,.7*s,'#587b48');b.sphere(x-.4*s,1.8*s,z,.55*s,.6*s,.5*s,'#496d3c');}
export function greenhouseTreeResources(){
 const b=new Builder();plantedTree(b,0,0,.9);ring(b,0,.48,0,1.6,.065,METAL);
 for(let i=0;i<8;i++){const a=i*Math.PI/4,points=Array.from({length:13},(_,j)=>{const t=j/12*Math.PI/2;return vec(Math.sin(a)*Math.cos(t)*1.6,.48+Math.sin(t)*2.8,Math.cos(a)*Math.cos(t)*1.6);});b.tube(points,.026,PALE,12);}
 const root=b.finish(),parts=root.children as T.Mesh[];const geometries=parts.map(m=>{const g=m.geometry.clone();if(!g.getAttribute('color')){const color=(m.material as T.MeshStandardMaterial).color,colors=new Float32Array(g.getAttribute('position').count*3);for(let i=0;i<colors.length;i+=3)color.toArray(colors,i);g.setAttribute('color',new T.Float32BufferAttribute(colors,3));}return g;});
 const trunk=mergeGeometries(geometries)!;geometries.forEach(g=>g.dispose());parts.forEach(m=>m.geometry.dispose());
 const foliage=new T.SphereGeometry(1,20,10,0,Math.PI*2,0,Math.PI/2);foliage.scale(1.6,2.8,1.6);foliage.translate(0,.48,0);
 const bark=new T.MeshStandardMaterial({vertexColors:true,roughness:.65});
 return {trunk,foliage,bark,leaves:domeGlass(),preview:foliage.clone()};
}
export function greenhouse(){
 const b=new Builder();
 for(const x of [-8,0,8]){b.cylinder(x,.4,0,5.1,.8,PALE,5.1,32);for(const z of [-1.8,1.8])for(const xx of [-1.4,1.4])plantedTree(b,x+xx,z,1.05);hemisphere(b,x,.8,0,4.9,domeGlass());
  for(let i=0;i<8;i++){const a=i*Math.PI/4,points=Array.from({length:17},(_,j)=>{const t=j/16*Math.PI/2;return vec(x+Math.sin(a)*Math.cos(t)*4.94,.8+Math.sin(t)*4.94,Math.cos(a)*Math.cos(t)*4.94);});b.tube(points,.045,PALE,16);}ring(b,x,.84,0,4.95,.08,METAL);}
 rounded(b,5,5.5,2.8,1,.2,PALE,0,6);airlock(b,0,.4,8.8,2.3,2.4);const root=b.finish();root.name='Fictional sealed greenhouse · contained trees';return root;
}
export function lander(){
 const b=new Builder();rounded(b,6,5,3.6,1.2,2.3,PALE);rounded(b,6.3,5.3,.5,1.3,5.9,METAL);b.box(0,4.6,2.6,4,1.25,.08,GLASS);b.cylinder(0,6.5,0,1.6,.6,METAL,1.3,16);
 for(const x of [-1,1])for(const z of [-1,1]){b.beam(vec(x*2.5,3,z*2),vec(x*5,.3,z*4),.13,METAL,8);b.beam(vec(x*2.6,4.4,z*2.2),vec(x*5,.3,z*4),.08,PALE,8);b.cylinder(x*5,.15,z*4,.8,.3,DARK,.8,12);}
 for(const x of [-1,1]){b.beam(vec(x*3,4,0),vec(x*7,4,0),.09,METAL,8);b.box(x*6,4.08,0,3.2,.12,4,SOLAR);for(let z=-1.7;z<=1.7;z+=.6)b.box(x*6,4.15,z,3.2,.025,.025,'#71909e');}
 ladder(b,0,2.8,.3,3.9);const root=b.finish();root.name='Fictional expedition lander';return root;
}
export function solarFarm(){
 const b=new Builder();
 for(const x of [-14,-7,0,7,14])for(const z of [-5,5]){b.box(x,.25,z,1,.5,1,DARK);b.cylinder(x,1.45,z,.14,2.4,METAL,.12,8);const part=new Builder();part.box(0,0,0,5.8,.16,7.4,SOLAR);for(let a=-2.7;a<=2.7;a+=.9)part.box(a,.09,0,.035,.025,7.4,'#577c90');for(let a=-3.5;a<=3.5;a+=.7)part.box(0,.09,a,5.8,.025,.035,'#577c90');for(const side of [-1,1])part.box(side*2.92,.03,0,.09,.15,7.5,METAL);const root=part.finish();root.position.set(x,2.7,z);root.rotation.x=-.28;b.absorb(root);}
 for(const x of [-10,10])rounded(b,2.7,2.3,1.8,.3,0,PALE,x,0);const root=b.finish();root.name='Fictional lunar photovoltaic array';return root;
}
function dish(b:Builder,x:number,z:number,h:number,r:number,angle:number){
 b.cylinder(x,h/2,z,.28,h,METAL,.2,10);b.cylinder(x,.2,z,1.5,.4,PALE,1.5,16);
 const profile=Array.from({length:17},(_,i)=>{const t=i/16;return new T.Vector2(t*r,t*t*r*.42);});const geo=new T.LatheGeometry(profile,32),mat=METAL.clone();mat.side=T.DoubleSide;
 const root=new T.Group(),mesh=new T.Mesh(geo,mat);root.add(mesh);root.position.set(x,h,z);root.rotation.z=angle;
 for(let i=0;i<3;i++){const a=i*Math.PI*2/3,arm=new Builder();arm.beam(vec(Math.sin(a)*r,r*.42,Math.cos(a)*r),vec(0,r*.9,0),.05,PALE,6);root.add(arm.finish());}
 const feed=new Builder();feed.sphere(0,r*.9,0,.2,.2,.2,DARK);root.add(feed.finish());b.absorb(root);
}
export function communications(){
 const b=new Builder();dish(b,-5,0,4.8,4.5,-.4);dish(b,6,2,3.3,2.8,.35);
 for(const x of [-.65,.65])for(const z of [-.65,.65])b.beam(vec(x,0,z-7),vec(x*.2,12,z*.2-7),.065,METAL,6);
 for(let y=1;y<=11;y+=1.5){b.beam(vec(-.6*(1-y/15),y,-7),vec(.6*(1-y/15),y+1.5,-7),.035,PALE,5);b.box(0,y,-7,1.2*(1-y/15),.07,1.2*(1-y/15),METAL);}
 b.box(0,10,-7,3,.12,.12,PALE);rounded(b,4,4,2.3,.4,0,PALE,6,-7);const root=b.finish();root.name='Fictional lunar communications array';return root;
}
export function roverWorkshop(){
 const b=new Builder();rounded(b,26,15,5.3,3,0,PALE);rounded(b,27,16,.5,3.1,5.3,METAL);b.box(0,2.3,7.55,12,4.6,.08,DARK);
 for(let y=.4;y<=4.4;y+=.45)b.box(0,y,7.62,11.6,.09,.08,METAL);for(const x of [-10,10])b.box(x,3.6,7.63,3,1.1,.08,GLASS);
 for(const x of [-8,8])rounded(b,4,6,.9,.4,5.8,DARK,x,0);const root=b.finish();root.name='Fictional rover pressure workshop';root.rotation.y=Math.PI;return root;
}
export function rover(){
 const b=new Builder();b.box(0,1,0,2.3,.7,3.5,PALE);b.box(0,1.6,-.3,1.9,.7,2.1,METAL);b.box(0,2.05,-.5,1.6,.15,1.7,SOLAR);
 for(const side of [-1,1])for(const z of [-1.3,0,1.3]){const g=new T.CylinderGeometry(.48,.48,.3,12);g.rotateZ(Math.PI/2);b.add(g,DARK,side*1.25,.5,z);g.dispose();b.beam(vec(side*.9,.9,z),vec(side*1.25,.5,z),.08,METAL,6);}
 b.cylinder(.6,2.4,1,.06,2.3,PALE,.045,6);b.box(.6,3.5,1,.65,.33,.35,DARK);const root=b.finish();root.name='Fictional six-wheel lunar rover';return root;
}
export function astronaut(){
 const b=new Builder();b.sphere(0,1.7,0,.36,.38,.33,PALE);b.sphere(0,1.72,.2,.28,.24,.18,material('#3f5360',.2,.5));b.box(0,1.13,0,.57,.72,.43,PALE);b.box(0,1.2,-.3,.46,.6,.26,METAL);for(const s of [-1,1]){b.beam(vec(s*.16,.85,0),vec(s*.19,.16,.03),.12,PALE,8);b.box(s*.19,.11,.13,.26,.22,.4,DARK);b.beam(vec(s*.31,1.4,0),vec(s*.43,.93,.13),.105,PALE,8);}const root=b.finish();root.name='Fictional expedition astronaut';return root;
}
