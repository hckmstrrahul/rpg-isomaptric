import * as T from 'three';
import {Builder,material,vec,canvasTexture} from '../../geometry.ts';
import {registerGlow} from '../../lighting.ts';
import {treeResources} from '../../trees.ts';

const GRANITE='#bfb79e',TRIM='#ded2b8',RED='#a83d2f',REDTRIM='#d76a50',GLASS='#344447';
let lamps:T.MeshStandardMaterial|undefined;
let graniteMaterial:T.MeshStandardMaterial|undefined;
function granite(){
 if(graniteMaterial)return graniteMaterial;
 const map=canvasTexture(512,512,c=>{c.fillStyle=GRANITE;c.fillRect(0,0,512,512);let seed=701;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<14000;i++){c.fillStyle=r()>.5?'rgba(255,248,218,.08)':'rgba(65,58,42,.07)';c.fillRect(r()*512,r()*512,1+r()*2,1+r()*2);}
  c.strokeStyle='rgba(74,67,51,.23)';c.lineWidth=1.25;for(let row=0;row<8;row++){const y=row*64;c.beginPath();c.moveTo(0,y);c.lineTo(512,y);c.stroke();for(let x=(row%2)*64;x<512;x+=128){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+64);c.stroke();}}
 });map.wrapS=map.wrapT=T.RepeatWrapping;graniteMaterial=new T.MeshStandardMaterial({map,roughness:.91});graniteMaterial.userData.worldTile=3.2;graniteMaterial.name='Bengaluru granite · fine coursing';return graniteMaterial;
}
function archShape(w:number,h:number){const s=new T.Shape(),r=w/2;s.moveTo(-r,0);s.lineTo(r,0);s.lineTo(r,h-r);s.absarc(0,h-r,r,0,Math.PI,false);s.lineTo(-r,0);return s;}
function archedWindow(b:Builder,x:number,y:number,z:number,w:number,h:number,color=REDTRIM,yaw=0,index=0){
 const glass=new T.ShapeGeometry(archShape(w,h),12);b.add(glass,index%7===0?warmGlass():material(GLASS),x,y,z,1,1,1,0,yaw);glass.dispose();
 const frame=archShape(w+.2,h+.16),hole=new T.Path(archShape(w,h).getPoints(12).map(p=>p.clone().add(new T.Vector2(0,.08))));frame.holes.push(hole);const g=new T.ExtrudeGeometry(frame,{depth:.09,bevelEnabled:false,curveSegments:10});b.add(g,material(color),x,y-.08,z+.015,1,1,1,0,yaw);g.dispose();
}
function corbelCornice(b:Builder,x:number,z:number,w:number,d:number,y:number){
 b.box(x,y,z,w+.22,.22,d+.22,GRANITE);b.box(x,y+.18,z,w+.65,.16,d+.65,TRIM);b.box(x,y+.35,z,w+.9,.16,d+.9,TRIM);
 for(const side of [-1,1])for(let xx=-w/2+.4;xx<w/2;xx+=.62)b.box(x+xx,y-.18,z+side*(d/2+.13),.17,.55,.32,GRANITE);
 for(const side of [-1,1])for(let zz=-d/2+.4;zz<d/2;zz+=.65)b.box(x+side*(w/2+.13),y-.18,z+zz,.32,.55,.17,GRANITE);
}
function carvedCrest(b:Builder,x:number,y:number,z:number,s=1,yaw=0){
 const a=new Builder();a.box(0,-.1,0,1.05*s,.18*s,.22*s,TRIM);a.cylinder(0,.6*s,0,.14*s,.5*s,TRIM,0,6);
 const g=new T.TorusGeometry(.31*s,.075*s,6,18,Math.PI*1.65);a.add(g,material(TRIM),0,.22*s,.05*s);g.dispose();
 for(const side of [-1,1])a.sphere(side*.35*s,.06*s,.05*s,.13*s,.18*s,.09*s,GRANITE);
 const root=a.finish();root.position.set(x,y,z);root.rotation.y=yaw;b.absorb(root);
}

const warmGlass=()=>lamps??=registerGlow(new T.MeshStandardMaterial({color:'#68756b',emissive:'#e9ca8e',roughness:.4}),.42,.015);
function dome(b:Builder,x:number,y:number,z:number,r:number,h:number,color=GRANITE){
 const profile=[[0,0],[.86,0],[.98,.12],[1,.3],[.97,.46],[.85,.65],[.65,.81],[.38,.91],[.14,.96],[.12,1],[0,1]].map(([a,c])=>new T.Vector2(a*r,c*h));
 const g=new T.LatheGeometry(profile,32);b.add(g,color===GRANITE?granite():material(color),x,y,z);g.dispose();
 b.cylinder(x,y-.18,z,r*.98,.36,TRIM,r*.98,32);b.cylinder(x,y+h+.19,z,r*.075,.38,'#bda774',0,10);
}
function column(b:Builder,x:number,y:number,z:number,h:number,r=.22,color=TRIM){
 b.cylinder(x,y+h*.5,z,r,h,color,r*.85,10);b.box(x,y+.14,z,r*2.9,.28,r*2.9,color);b.box(x,y+h-.12,z,r*3.3,.24,r*3.3,color);
 b.cylinder(x,y+.35,z,r*1.35,.13,color,r*1.35,12);b.cylinder(x,y+h-.39,z,r*1.45,.16,color,r*1.3,12);
 b.box(x,y+h-.24,z,r*3.7,.14,r*3.7,color);b.box(x,y+.03,z,r*3.3,.12,r*3.3,color);
 for(const side of [-1,1])for(const axis of [-1,1])b.sphere(x+side*r*.9,y+h-.42,z+axis*r*.9,r*.48,r*.25,r*.48,color);

}
function windows(b:Builder,w:number,h:number,d:number,y:number,rows=2,spacing=1.8,color=GRANITE){
 for(const side of [-1,1])for(let row=0;row<rows;row++)for(let i=0;i<Math.floor(w/spacing);i++){
  const x=(i-(Math.floor(w/spacing)-1)/2)*spacing,yy=y+(row+.5)*h/rows;
  b.box(x,yy,side*(d/2+.017),.7,h/rows*.56,.04,(i+row*3)%5===0?warmGlass():material(GLASS));
  b.box(x,yy-h/rows*.3,side*(d/2+.055),.88,.1,.16,color);
  b.box(x,yy+h/rows*.3,side*(d/2+.085),.96,.12,.25,color);
 }
 for(const side of [-1,1])for(let row=0;row<rows;row++)for(let i=0;i<Math.floor(d/spacing);i++){
  const z=(i-(Math.floor(d/spacing)-1)/2)*spacing,yy=y+(row+.5)*h/rows;
  b.box(side*(w/2+.017),yy,z,.04,h/rows*.56,.7,(i+row)%5===0?warmGlass():material(GLASS));
 }
}
function block(b:Builder,x:number,z:number,w:number,d:number,h:number,color=GRANITE){
 const inner=new Builder();inner.box(0,h/2+.5,0,w,h,d,color===GRANITE?granite():material(color));inner.box(0,.25,0,w+.5,.5,d+.5,TRIM);
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let i=0;i<Math.floor(w/1.85);i++){
  const xx=(i-(Math.floor(w/1.85)-1)/2)*1.85,yy=.8+row*1.86,zz=side*(d/2+.035);inner.box(xx,yy+.55,zz,.78,1.16,.04,(i+row*3)%7===0?warmGlass():material(GLASS));
  for(const s of [-1,1])inner.box(xx+s*.46,yy+.57,zz+side*.06,.12,1.4,.16,TRIM);inner.box(xx,yy+1.28,zz+side*.13,1.1,.17,.36,TRIM);inner.box(xx,yy-.08,zz+side*.1,1.04,.14,.28,GRANITE);
  if(row===2&&i%2===0){inner.box(xx,yy+1.47,zz+side*.12,.74,.14,.32,GRANITE);inner.cylinder(xx,yy+1.63,zz+side*.12,.13,.24,TRIM,0,6);}
 }
 for(const side of [-1,1])for(let row=0;row<3;row++)for(let i=0;i<Math.floor(d/1.8);i++){
  const zz=(i-(Math.floor(d/1.8)-1)/2)*1.8,yy=.8+row*1.86;inner.box(side*(w/2+.03),yy+.55,zz,.04,1.16,.78,GLASS);
  for(const s of [-1,1])inner.box(side*(w/2+.09),yy+.57,zz+s*.46,.16,1.4,.12,TRIM);inner.box(side*(w/2+.15),yy+1.28,zz,.32,.17,1.08,TRIM);
 }
 for(const y of [2.35,4.22]){inner.box(0,y,0,w+.28,.17,d+.28,GRANITE);inner.box(0,y+.13,0,w+.42,.1,d+.42,TRIM);}
 corbelCornice(inner,0,0,w,d,h+.35);
 for(const side of [-1,1])for(let xx=-w/2+.25;xx<w/2;xx+=2.05){inner.box(xx,h+.9,side*(d/2+.15),.35,.62,.38,TRIM);inner.cylinder(xx,h+1.33,side*(d/2+.15),.19,.27,GRANITE,0,6);}
 const root=inner.finish();root.position.set(x,0,z);b.absorb(root);
}
function balustrade(b:Builder,x:number,z:number,w:number,y:number){
 b.box(x,y,z,w,.13,.25,TRIM);b.box(x,y+.58,z,w,.15,.32,TRIM);
 for(let xx=x-w/2;xx<=x+w/2;xx+=.7)b.cylinder(xx,y+.3,z,.08,.5,GRANITE,.075,6);
}
export function vidhanaSoudha(){
 const b=new Builder();
 // The main wings, two courts and perpendicular central wing follow the
 // legislature's broad plan. Carved granite bays differ from generic housing.
 block(b,0,7,50,7.2,6.1);block(b,-21.4,-3.5,7.2,22,6.1);block(b,21.4,-3.5,7.2,22,6.1);block(b,0,-12,37,5.2,6.1);block(b,0,-2.5,7,17.5,6.1);
 b.box(0,.35,0,51,.7,29,granite());
 // Projecting central pavilion with a deep, shadowed two-row colonnade.
 b.box(0,4.15,8,12.7,7.3,5.4,granite());
 for(const y of [3.1,5.45])for(let x=-4.4;x<=4.4;x+=2.2)b.box(x,y,10.74,1.15,1.5,.055,GLASS);
 for(const z of [11.3,13.15])for(let i=0;i<6;i++)column(b,-5.35+i*2.14,2.05,z,4.85,.25);
 b.box(0,7.03,12.1,14.2,.38,3.4,granite());b.box(0,7.35,12.1,14.8,.34,3.85,GRANITE);b.box(0,7.65,12.1,15.6,.23,4.5,TRIM);b.box(0,7.83,12.1,16.2,.15,4.9,TRIM);
 for(let i=0;i<14;i++)b.box(0,.1+i*.145,16.45-i*.235,14.2,.2,1.1,granite());
 for(const x of [-6.5,6.5]){b.box(x,4.6,11,1.1,4.9,1.25,granite());carvedCrest(b,x,6.1,11.7,.9);}
 // The dome's octagonal pavilion, corbelled balcony and cardinal chaithya
 // ornaments are prominent in actual close photographs of the building.
 b.cylinder(0,8.55,7.8,3.55,2,granite(),3.55,8);
 for(let i=0;i<8;i++){const a=i*Math.PI/4;column(b,Math.sin(a)*3.25,7.65,7.8+Math.cos(a)*3.25,1.65,.15);}
 b.cylinder(0,9.7,7.8,3.95,.25,TRIM,3.95,8);b.cylinder(0,10.05,7.8,3.5,.55,granite(),3.5,24);
 for(let i=0;i<32;i++){const a=i*Math.PI/16;b.box(Math.sin(a)*3.72,9.3,7.8+Math.cos(a)*3.72,.17,.5,.25,GRANITE,a);b.cylinder(Math.sin(a)*3.77,10.12,7.8+Math.cos(a)*3.77,.045,.55,TRIM,.045,6);}
 dome(b,0,10.5,7.8,3.65,2.6);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;carvedCrest(b,Math.sin(a)*3.35,11,7.8+Math.cos(a)*3.35,1.0,a);}
 b.cylinder(0,13.35,7.8,.43,.5,material('#9b8e6a'),.38,12);
 for(let i=0;i<4;i++){const a=i*Math.PI/2;b.sphere(Math.sin(a)*.21,13.88,7.8+Math.cos(a)*.21,.2,.48,.2,'#bda56b');b.sphere(Math.sin(a)*.27,14.22,7.8+Math.cos(a)*.27,.21,.21,.21,'#bda56b');}
 // Four smaller front domes and two rear domes have raised square pavilions,
 // not loose spheres sitting on an undifferentiated roof.
 for(const [x,z,r] of [[-22,7,1.55],[-7.4,8.4,1.12],[7.4,8.4,1.12],[22,7,1.55],[-22,-12,1.4],[22,-12,1.4]]){
  const base=7.1;b.box(x,7.35,z,r*2.25,2.2,r*2.25,granite());corbelCornice(b,x,z,r*2.25,r*2.25,8.45);
  for(const side of [-1,1])for(const axis of [-1,1])column(b,x+side*r*.86,base,z+axis*r*.86,1.25,.11);
  dome(b,x,8.9,z,r,1.4);for(let i=0;i<4;i++){const a=i*Math.PI/2;carvedCrest(b,x+Math.sin(a)*r*.9,9.1,z+Math.cos(a)*r*.9,.52,a);}
 }
 for(const z of [10.8,-14.6])for(const x of [-15,15])balustrade(b,x,z,16,6.8);
 for(let x=-6.5;x<=6.5;x+=.65){b.box(x,8.15,14,.3,.5,.23,GRANITE);b.cylinder(x,8.48,14,.16,.23,TRIM,0,6);}carvedCrest(b,0,8.5,14.1,1.65);
 const text=canvasTexture(1024,96,c=>{c.fillStyle=GRANITE;c.fillRect(0,0,1024,96);c.fillStyle='#514e42';c.textAlign='center';c.font='bold 43px serif';c.fillText("GOVERNMENT WORK IS GOD’S WORK",512,61);});
 const sign=new T.MeshStandardMaterial({map:text,roughness:.9});const geo=new T.PlaneGeometry(12.7,.5);b.add(geo,sign,0,7.24,14.04);geo.dispose();
 const root=b.finish();root.name='Vidhana Soudha · carved granite pavilions and seven domes';root.rotation.y=Math.PI/2;root.userData.architecture='neo-dravidian';root.userData.smallDomes=6;root.userData.entranceColumns=12;root.userData.carvedCivicFacade=true;return root;
}
function pediment(b:Builder,x:number,y:number,z:number,w:number,h:number,d:number,color=REDTRIM){
 const s=new T.Shape();s.moveTo(-w/2,0);s.lineTo(w/2,0);s.lineTo(0,h);s.closePath();const g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:false});b.add(g,material(color),x,y,z);g.dispose();
}
function pitchedRoof(b:Builder,x:number,y:number,z:number,w:number,d:number,h:number,color='#a8664e'){
 const vertices=[-w/2,0,-d/2,w/2,0,-d/2,0,h,-d/2,-w/2,0,d/2,w/2,0,d/2,0,h,d/2];
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vertices,3));g.setIndex([0,1,2,3,5,4,0,2,5,0,5,3,2,1,4,2,4,5]);g.computeVertexNormals();b.add(g,material(color),x,y,z);g.dispose();
}
export function attaraKacheri(){
 const b=new Builder();
 const wing=(x:number,z:number,w:number,d:number)=>{const a=new Builder();a.box(0,3.1,0,w,5.5,d,RED);
  for(const side of [-1,1])for(let row=0;row<2;row++)for(let i=0;i<Math.floor(w/1.65);i++){const xx=(i-(Math.floor(w/1.65)-1)/2)*1.65;archedWindow(a,xx,.8+row*2.6,side*(d/2+.04),.72,1.75,REDTRIM,side<0?Math.PI:0,i+row);for(const s of [-1,1])a.box(xx+s*.58,3.02,side*(d/2+.12),.14,5.1,.22,REDTRIM);}
  for(const side of [-1,1])for(let row=0;row<2;row++)for(let i=0;i<Math.floor(d/1.65);i++){const zz=(i-(Math.floor(d/1.65)-1)/2)*1.65;archedWindow(a,side*(w/2+.04),.8+row*2.6,zz,.72,1.75,REDTRIM,side*Math.PI/2,i+row);a.box(side*(w/2+.12),3.02,zz+.56,.22,5.1,.14,REDTRIM);}
  for(const y of [.45,3.1,5.85]){a.box(0,y,0,w+.3,.2,d+.3,REDTRIM);a.box(0,y+.12,0,w+.45,.08,d+.45,'#c35c44');}
  pitchedRoof(a,0,6,0,w+.7,d+.6,1.1,'#a94d3b');const root=a.finish();root.position.set(x,0,z);b.absorb(root);
 };
 wing(0,6.4,44,6.4);wing(-19,-1.3,6,22);wing(19,-1.3,6,22);wing(0,-3,7,24);wing(0,-11.5,32,3);
 // Both ends of the long central pavilion have a columned, pedimented
 // elevation: the park-facing eastern front is visible from the overview.
 for(const [z,side,w] of [[10.15,1,10],[-15.15,-1,8.2]]){
  b.box(0,3.1,z-side*.4,w-1.2,5.5,1.7,RED);for(const yy of [.55,3.25])for(let i=0;i<6;i++)column(b,(i-2.5)*(w-1.1)/5,yy,z+side*.7,2.4,.18,REDTRIM);
  b.box(0,5.98,z,w+.5,.24,2.45,REDTRIM);b.box(0,6.19,z,w+.75,.15,2.7,'#e08767');
  const part=new Builder();pediment(part,0,6.28,0,w+.8,1.65,.34,REDTRIM);pediment(part,0,6.48,.35,w-1.2,1.14,.03,RED);part.cylinder(0,6.98,.4,.24,.09,'#dba77e',.24,8);
  const root=part.finish();root.position.z=z+side*1.35;if(side<0)root.rotation.y=Math.PI;b.absorb(root);
  for(let i=0;i<5;i++)b.box(0,.08+i*.1,z+side*(1.7-i*.25),w,.14,1,GRANITE);
 }
 const root=b.finish();root.name='Attara Kacheri · red colonnades and twin pedimented fronts';root.rotation.y=-Math.PI/2;root.userData.architecture='graeco-roman';root.userData.archedCivicFacade=true;return root;
}
export function vikasaSoudha(){
 const b=new Builder();block(b,0,3,31,6,5.8);block(b,-13,-3,5,16,5.8);block(b,13,-3,5,16,5.8);block(b,0,-9,23,4,5.8);
 for(const x of [-12,0,12]){b.cylinder(x,6.8,3,1.6,1.4,GRANITE,1.6,8);dome(b,x,7.4,3,1.9,1.6);}
 for(let x=-5;x<=5;x+=1.25)column(b,x,1,6.8,4.7,.18);b.box(0,5.95,6.8,12,.35,2,TRIM);
 for(let i=0;i<7;i++)b.box(0,.1+i*.14,8.9-i*.24,11,.18,.7,GRANITE);
 const root=b.finish();root.rotation.y=Math.PI/2;root.name='Vikasa Soudha · granite civic wings';return root;
}
export function library(){
 const b=new Builder();b.box(0,2.1,0,21,3.6,10,RED);windows(b,21,3.2,10,.5,1,1.6,REDTRIM);
 b.box(0,.22,0,22,.44,11,GRANITE);b.box(0,3.9,0,21.6,.26,10.6,REDTRIM);pitchedRoof(b,0,4.02,0,22,11,1.3,'#985746');
 b.box(0,2.4,5.7,6.8,4.5,2.4,RED);for(let x=-2.4;x<=2.4;x+=1.2)column(b,x,.55,7,3.4,.16,REDTRIM);pediment(b,0,4.55,6.8,7.8,1.45,.55);b.box(0,2.1,6.95,1.8,2.8,.1,'#2b3130');
 for(let i=0;i<5;i++)b.box(0,.05+i*.11,7.95-i*.23,7.5,.13,.8,GRANITE);
 const root=b.finish();root.name='Seshadri Iyer Memorial Hall · red library';return root;
}
export function governmentMuseum(){
 const b=new Builder();b.box(0,2.4,0,21,4.4,10,RED);windows(b,21,4,10,.6,2,1.65,REDTRIM);pitchedRoof(b,0,4.7,0,22,10.5,1.25);
 for(const x of [-8.4,0,8.4]){b.box(x,2.9,5.4,4.5,5.3,2.8,RED);pediment(b,x,5.6,6.3,5.3,1.25,.4);for(const xx of [-1.25,1.25])column(b,x+xx,.55,7,4.9,.18,REDTRIM);}
 b.box(0,.25,0,22,.5,14,GRANITE);const root=b.finish();root.rotation.y=Math.PI/2;root.name='Government Museum · red verandah and pediments';return root;
}
export function ubCity(){
 const b=new Builder();b.box(0,1.4,0,24,2.8,20,'#b3ada0');
 for(const [x,z,w,d,h] of [[-6,-3,7,8,20],[5,-4,6,7,15],[-5,6,6,6,11],[6,5,6,7,17]]){
  b.box(x,h/2+2,z,w,h,d,'#5d6d71');
  for(let y=3;y<h+2;y+=.85){b.box(x,y,z,w+.2,.11,d+.2,'#d5d0ba');if(Math.floor(y*2)%3===0)b.box(x,y+.2,z+d/2+.02,w-.4,.28,.04,warmGlass());}
  for(const side of [-1,1])b.box(x+side*(w/2-.25),h/2+2,z,.32,h+.3,d+.3,TRIM);
  b.box(x,h+2.2,z,w+.7,.5,d+.7,TRIM);b.box(x,h+2.8,z,w*.7,.7,d*.7,GRANITE);
 }
 // UB Tower's stepped, pale clock/crown reads separately from its glass companions.
 b.box(-6,22.9,-3,5.2,1.4,6.2,TRIM);b.cylinder(-6,24.1,-3,1.1,1.4,TRIM,0,4);
 const root=b.finish();root.name='UB City · stepped civic-edge skyline';return root;
}
export function urbanBlock(index:number,w=8,d=9,h=5){
 const b=new Builder(),style=index%5,color=['#c9bba1','#c3bcaa','#d8cdb6','#b3c2ba','#c7ac95'][style];
 if(style===1){
  // Low tile-roof bungalow/office remnant, sheltered by a real veranda.
  b.box(0,1.65,-.6,w-1,3.3,d-1.5,color);windows(b,w-1,2.8,d-1.5,.4,1,1.6,color);pitchedRoof(b,0,3.35,-.5,w+.25,d+.2,1.35,'#945f44');
  b.box(0,.2,d/2-.5,w,.4,1.4,GRANITE);for(const x of [-w*.4,0,w*.4])column(b,x,.4,d/2-.5,2.5,.11,color);b.box(0,2.95,d/2-.55,w,.18,1.6,color);
 }else if(style===3){
  // Restrained office facade with horizontal glazing and shaded vertical fins.
  b.box(0,h/2,0,w,h,d,color);for(let y=1.1;y<h-.5;y+=1.5){for(const side of [-1,1])b.box(0,y,side*(d/2+.02),w-.6,.65,.06,material('#48656a',.42,.15));b.box(0,y+.52,0,w+.2,.14,d+.2,'#d4d4c4');}
  for(let x=-w/2+.3;x<w/2;x+=1.6)b.box(x,h/2,d/2+.13,.13,h,.25,'#c6cabc');b.box(0,h+.15,0,w+.4,.3,d+.4,'#aeb5af');for(const x of [-w*.22,w*.22])b.box(x,h+.65,0,1.5,1,2,'#89958e');
 }else{
  b.box(0,h/2,0,w,h,d,color);windows(b,w,h-.7,d,.3,Math.max(2,Math.floor(h/1.8)),1.8,color);
  for(let y=1.9;y<h;y+=1.9){b.box(0,y,0,w+.25,.12,d+.25,'#ddd5c3');if(style!==0){b.box(0,y+.08,d/2+.3,w*.78,.16,.8,GRANITE);for(const x of [-w*.38,w*.38])b.box(x,y+.5,d/2+.62,.1,.75,.1,'#747e75');b.box(0,y+.85,d/2+.62,w*.78,.08,.08,'#747e75');}}
  b.box(0,h+.08,0,w+.4,.2,d+.4,'#cfc6b4');for(const x of [-w/2,w/2])b.box(x,h+.35,0,.14,.5,d+.5,color);for(const z of [-d/2,d/2])b.box(0,h+.35,z,w,.5,.14,color);
  if(style===4){b.box(-w*.12,h+.8,-d*.12,w*.65,1.4,d*.6,color);b.box(-w*.12,h+1.55,-d*.12,w*.7,.12,d*.65,'#c8bca5');}else{b.cylinder(w*.24,h+.65,-d*.2,.52,1,'#454a49',.52,10);b.box(-w*.2,h+.4,d*.12,1.6,.5,1.4,'#aab6ad');}
  if(style===2)for(let i=0;i<3;i++)b.box((i-1)*w*.23,.85,d/2+.04,w*.2,1.5,.07,['#566c63','#805b43','#786e53'][i]);
 }
 const root=b.finish();root.name='Central Bengaluru street fabric';root.userData.urbanStyle=style;return root;
}
export function rainTreeResources(){
 const tree=treeResources();return {trunk:tree.trunk.clone().scale(1.4,1.22,1.4),foliage:tree.foliage.clone().scale(1.72,1.05,1.72),bark:tree.bark,leaves:tree.leaves};
}
export function autorickshaw(){
 const b=new Builder();b.box(0,.45,0,1.15,.65,1.8,'#418251');b.box(0,1.12,-.1,1.23,.35,1.5,'#d8b33b');b.box(0,.88,.74,1.02,.55,.08,'#253f45');b.box(0,.4,.97,.4,.4,.22,'#5c9a61');
 for(const x of [-.52,.52])b.cylinder(x,.25,-.62,.22,.13,'#232729',.22,10);b.cylinder(0,.23,.78,.23,.13,'#232729',.23,10);
 for(const x of [-.35,.35])b.box(x,.6,.98,.22,.14,.035,'#e6e0bb');const root=b.finish();root.name='Bengaluru green-and-yellow auto rickshaw';return root;
}
