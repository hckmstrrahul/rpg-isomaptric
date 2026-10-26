import * as T from 'three';
import { Builder, material, facadeTexture, clockMaterial, vec, range, pick } from './geometry.ts';
import { glowMaterial, registerGlow, lightHalo } from './lighting.ts';
import { createClockLighting } from './clockLighting.ts';
import { ROAD_ASPHALT, ROAD_BORDER, roadDash } from './roadSurfaces.ts';
import { ROAD_WIDTHS } from './cityPlan.ts';
import { prepareRoofTiles } from './roofTiles.ts';
import { rampBridgeGeometry } from './bridgeRamp.ts';
import { ROAD_HEIGHT, BRIDGE_LIFT } from './layout.ts';
import { surfaceMaterial, dataTexture } from './nature.ts';
import { lightingRandom } from './windowLighting.ts';
import { createClockHands } from './liveClock.ts';

export const stone = facadeTexture('stone', '#d5cdb9');
export const ivory = facadeTexture('stone', '#e0ddd0');
export const brick = facadeTexture('brick', '#aa7950');
export const gothic = facadeTexture('brick', '#b99865');
export const glass = facadeTexture('glass', '#b5c3c1');
export const darkGlass = facadeTexture('glass', '#587681');
const roofColor = '#78938e';
const trim = '#d5bb87';

// World-sized mapping keeps slate courses the same size on every pitched roof.
const slateVariants=new Map<string,T.MeshStandardMaterial>();
function tiledRoof(color:string) {
  if(!slateVariants.has(color)) {
    // The neutral tile map supplies detail; this tint supplies the lighter teal.
    const mat=surfaceMaterial('slate').clone();mat.color.set(color);mat.name='Overlapping slate roof tiles';slateVariants.set(color,mat);
  }
  return slateVariants.get(color)!;
}

function squareSpire(b:Builder,x:number,y:number,z:number,w:number,h:number,d=w,color=roofColor) {
  // Four-sided cones start with vertices on the axes. Rotate 45° so the eaves
  // follow the square masonry footprint instead of leaving triangular gaps.
  const cone=new T.ConeGeometry(1,h,4);cone.rotateY(Math.PI/4);cone.scale(w/Math.SQRT2,1,d/Math.SQRT2);
  const mapped=prepareRoofTiles(cone);b.add(mapped,color===trim?material(color):tiledRoof(color),x,y+h/2,z);cone.dispose();mapped.dispose();
}

function roof(b: Builder, x: number, y: number, z: number, w: number, h: number, d: number, color = roofColor) {
  const shape = new T.Shape(); shape.moveTo(-w/2, 0); shape.lineTo(0, h); shape.lineTo(w/2, 0); shape.closePath();
  const geo = new T.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
  const mapped=prepareRoofTiles(geo);b.add(mapped,tiledRoof(color),x,y,z-d/2);geo.dispose();mapped.dispose();
}
const pointed = new T.Shape(); pointed.moveTo(-0.5, 0); pointed.lineTo(-0.5, 0.65); pointed.quadraticCurveTo(-0.5, 0.82, 0, 1); pointed.quadraticCurveTo(0.5, 0.82, 0.5, 0.65); pointed.lineTo(0.5, 0); pointed.closePath();
const pointedGeometry = new T.ShapeGeometry(pointed);
function window(b: Builder, x: number, y: number, z: number, w: number, h: number, ry = 0) {
  b.add(pointedGeometry, material('#deca9f'), x, y-.15, z, w+.3, h+.3, 1, 0, ry);
  b.add(pointedGeometry, material('#374d51'), x + Math.sin(ry)*.025, y, z + Math.cos(ry)*.025, w, h, 1, 0, ry);
  b.box(x+Math.sin(ry)*.045, y+h*.38, z+Math.cos(ry)*.045, .11, h*.76, .12, trim, ry);
}
function pinnacle(b: Builder, x: number, y: number, z: number, scale = 1) {
  b.box(x, y+scale*.9, z, scale*.5, scale*1.8, scale*.5, trim);
  squareSpire(b,x,y+scale*1.75,z,scale*.65,scale*1.3,scale*.65,trim);
  b.beam(vec(x,y+scale*2.8,z),vec(x,y+scale*3.5,z),scale*.055,'#b4a07d');
}
function gothicBlock(b: Builder, x: number, z: number, w: number, d: number, h: number) {
  b.box(x, h/2, z, w, h, d, gothic);
  b.box(x, .5, z, w+.8, 1, d+.8, '#ae946c');
  b.box(x, h-.4, z, w+.6, .7, d+.6, trim);
  b.box(x, h*.5, z, w+.25, .32, d+.25, trim);
  roof(b,x,h,z,w+.3,2.4,d+.3);
  for (let q = -w/2+.9; q < w/2; q+=2.3) {
    for (const side of [-1,1]) {
      b.box(x+q, h*.52, z+side*(d/2+.15), .27, h+1, .45, trim);
      pinnacle(b,x+q,h+.5,z+side*(d/2+.2),.6);
      if (q+1.15 < w/2) {
        window(b,x+q+1.1,1.7,z+side*(d/2+.04),.95,h*.33,side===1?0:Math.PI);
        window(b,x+q+1.1,h*.55,z+side*(d/2+.04),.95,h*.28,side===1?0:Math.PI);
      }
    }
  }
}
function gothicTower(b: Builder, x: number, z: number, w: number, h: number, spire = true) {
  b.box(x,h/2,z,w,h,w,gothic);
  for (const y of [1,h*.42,h*.7,h-1]) b.box(x,y,z,w+.45,.45,w+.45,trim);
  for (const dx of [-1,1]) for (const dz of [-1,1]) {
    b.box(x+dx*(w/2-.12),h/2,z+dz*(w/2-.12),.5,h+.9,.5,trim);
    pinnacle(b,x+dx*w/2,h,z+dz*w/2,.75);
  }
  for (const side of [-1,1]) {
    window(b,x,h*.7,z+side*(w/2+.04),w*.4,h*.2,side===1?0:Math.PI);
    window(b,x,h*.4,z+side*(w/2+.04),w*.36,h*.19,side===1?0:Math.PI);
  }
  if (spire) {
    squareSpire(b,x,h,z,w+.55,7,w+.55);
    b.beam(vec(x,h+7,z),vec(x,h+9,z),.065,'#d1c4a7');
  }
}

export function palace() {
  const b = new Builder();
  // Open quadrangles keep the model legible at both street and diorama scales.
  gothicBlock(b,0,11,39,7,10);
  gothicBlock(b,-17,-1,6,24,10);
  gothicBlock(b,17,0,6,22,10);
  gothicBlock(b,0,-12,36,6,11);
  gothicBlock(b,-3,-1,6,19,10);
  b.box(0,.08,0,32,.16,20,'#b5bd98');
  b.box(7,.12,1,8,.12,11,'#cfcbab');
  b.cylinder(7,.18,0,2.3,.2,'#79b7ac');
  b.cylinder(7,.27,0,1.7,.25,'#42a6ac');
  gothicTower(b,-17,11,5.3,22,false);
  gothicTower(b,-8,-12,3.1,20);
  gothicTower(b,2,11,3,16);
  gothicTower(b,17,11,3.5,16);
  // Elizabeth Tower: layered stone shaft, four working-looking clock faces, slate crown.
  const x=17,z=-12;
  b.box(x,16.5,z,5.6,33,5.6,gothic);
  for(let i=0;i<5;i++) b.box(x,5+i*5,z,5.9,.45,5.9,trim);
  for(const dx of [-1,1]) for(const dz of [-1,1]) b.box(x+dx*2.7,17,z+dz*2.7,.45,34,.45,trim);
  b.box(x,31.5,z,6.2,6.2,6.2,'#b69b65');
  const face = clockMaterial();
  const circle = new T.CircleGeometry(2.05,48);
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2;
    b.add(circle,face,x+Math.sin(a)*3.13,31.6,z+Math.cos(a)*3.13,1,1,1,0,a);
  }
  circle.dispose();
  b.box(x,35,z,6.5,.7,6.5,trim);
  b.box(x,36.5,z,4.4,2.4,4.4,gothic);
  b.box(x,38,z,5.1,.4,5.1,trim);
  squareSpire(b,x,38.2,z,5.5,8,5.5,'#4c7775');
  for(const dx of [-1,1]) for(const dz of [-1,1]) pinnacle(b,x+dx*2.45,35.2,z+dz*2.45,.65);
  b.beam(vec(x,46,z),vec(x,48,z),.07,'#ddd6b5');
  const root=b.finish(),clocks:ReturnType<typeof createClockHands>[]=[];
  for(let i=0;i<4;i++) {
    const a=i*Math.PI/2,clock=createClockHands();
    clock.root.position.set(x+Math.sin(a)*3.15,31.6,z+Math.cos(a)*3.15);clock.root.rotation.y=a;
    root.add(clock.root);clocks.push(clock);
    const lighting=createClockLighting();lighting.position.copy(clock.root.position);lighting.rotation.y=a;root.add(lighting);
  }
  root.userData.updateClock=(date:Date)=>clocks.forEach(clock=>clock.update(date));
  root.userData.updateClock(new Date());return root;
}

export function abbey() {
  const b = new Builder();
  gothicBlock(b,0,0,15,28,12);
  gothicBlock(b,0,6,28,6,10);
  gothicTower(b,-6,12,5,24);
  gothicTower(b,6,12,5,24);
  gothicTower(b,0,-3,4.5,22);
  gothicBlock(b,13,-5,5,23,7);
  gothicBlock(b,6,-17,18,5,7);
  for (const x of [-8.5,8.5]) for(let z=-10;z<=8;z+=3) {
    b.beam(vec(x,9,z),vec(x+Math.sign(x)*2.5,3,z),.35,trim);
    pinnacle(b,x+Math.sign(x)*2.5,2,z,.85);
  }
  // Rose window on the south front.
  const rose=new T.CircleGeometry(2.2,32);
  b.add(rose,material('#517782',.45),0,9.5,14.08);rose.dispose();
  for(let i=0;i<12;i++){const a=i*Math.PI/6;b.beam(vec(0,9.5,14.15),vec(Math.cos(a)*2.1,9.5+Math.sin(a)*2.1,14.15),.07,trim);}
  return b.finish();
}

export function ferrisWheel() {
  const fixed = new Builder(), wheel = new Builder();
  const radius=18.5, centerY=24;
  for (const z of [-3,3]) {
    fixed.beam(vec(-8,0,z),vec(0,centerY,0),.5,'#edf0d9');
    fixed.beam(vec(9,0,z),vec(0,centerY,0),.5,'#edf0d9');
  }
  fixed.box(0,.5,0,22,1,10,'#d8d7c2');
  fixed.box(0,1.2,4,10,1.5,3,ivory);
  for (const z of [-.65,.65]) {
    const torus=new T.TorusGeometry(radius,.23,6,128);
    wheel.add(torus,material('#e7ece2'),0,0,z);torus.dispose();
    const lightRing=new T.TorusGeometry(radius+.03,.055,5,128);
    wheel.add(lightRing,glowMaterial('#85cfff',3.5),0,0,z+.03);lightRing.dispose();
    for(let i=0;i<32;i++) {
      const a=i*Math.PI/16;
      wheel.beam(vec(0,0,z),vec(Math.sin(a)*radius,Math.cos(a)*radius,z),.065,'#d5e3da',4);
    }
  }
  wheel.sphere(0,0,0,1,1,1.2,'#f1eee1');
  const pods: T.Group[]=[];
  const root=new T.Group(), rotating=wheel.finish(); rotating.position.y=centerY;
  const glass=registerGlow(new T.MeshPhysicalMaterial({color:'#aecbd2',emissive:'#a6d3ee',roughness:.08,metalness:.05,transparent:true,opacity:.25,depthWrite:false,clearcoat:1,side:T.FrontSide}),.46);
  const cabinFloor=registerGlow(new T.MeshStandardMaterial({color:'#e9eee1',emissive:'#b2d6ec',roughness:.7}),.36);
  const cabinSeat=registerGlow(new T.MeshStandardMaterial({color:'#908d7a',emissive:'#a7cde5',roughness:.8}),.29);
  const capsule=new T.CapsuleGeometry(.61,1.18,6,16);capsule.rotateZ(Math.PI/2);
  for(let i=0;i<32;i++) {
    const b=new Builder();
    b.box(0,-.47,0,1.78,.12,.89,cabinFloor);
    b.box(0,-.27,0,1.1,.12,.23,cabinSeat);
    for(const x of [-.8,-.36,.36,.8]) {
      const rib=new T.TorusGeometry(Math.abs(x)>.7?.57:.625,.025,5,32);
      b.add(rib,material('#e2e8df'),x,0,0,1,1,1,0,Math.PI/2);rib.dispose();
    }
    for(const side of [-1,1])b.beam(vec(-.84,-.13,side*.59),vec(.84,-.13,side*.59),.026,'#e2e8df');
    b.box(0,.5,0,1.15,.035,.12,glowMaterial('#b4dfff',3.1));
    // Visible central seating and door frames behind the curved glazing.
    for(const side of [-1,1])for(const x of [-.22,.22])b.beam(vec(x,-.42,side*.57),vec(x,.38,side*.57),.019,'#d5ded6');
    const pod=b.finish();pod.name=`Glass capsule ${i+1}`;const glazing=new T.Mesh(capsule,glass);glazing.name='Curved transparent glazing';pod.add(glazing);
    const interiorGlow=lightHalo('#a9d4ee',1.8,.17);interiorGlow.name='Soft capsule interior glow';interiorGlow.scale.y=.86;pod.add(interiorGlow);
    pod.position.set(Math.sin(i*Math.PI/16)*(radius+1.0),Math.cos(i*Math.PI/16)*(radius+1.0),0);rotating.add(pod);pods.push(pod);
    const a=i*Math.PI/16;
    // The brackets rotate with the rim, while each capsule stays level.
    const bracket=new T.Mesh(new T.CylinderGeometry(.07,.07,1,8),material('#b6c5bf'));
    bracket.position.set(Math.sin(a)*(radius+.45),Math.cos(a)*(radius+.45),0);bracket.rotation.z=-a;rotating.add(bracket);
  }
  root.add(fixed.finish(),rotating);
  return {root,rotating,pods};
}

export function greenDome() {
  const b=new Builder();
  b.cylinder(0,.5,0,16,.7,'#c4c4a1',16,96);
  const dome=new T.SphereGeometry(1,64,24,0,Math.PI*2,0,Math.PI/2);
  b.add(dome,material('#9dae54'),0,.7,0,15.6,7.3,15.6);dome.dispose();
  for(let i=0;i<24;i++) {
    const angle=i*Math.PI/12, points:T.Vector3[]=[];
    for(let j=0;j<=16;j++){const p=j*Math.PI/32;points.push(vec(Math.cos(angle)*15.68*Math.sin(p),.75+7.32*Math.cos(p),Math.sin(angle)*15.68*Math.sin(p)));}
    b.tube(points,.07,'#d6d5a7',24);
  }
  for(const a of [.4,.8,1.2]) b.ring(0,.74+7.35*Math.cos(a),0,15.7*Math.sin(a),.11,'#d8d9b3');
  b.cylinder(0,8.15,0,1.7,.2,'#e7e4cf',1.7,32);
  b.cylinder(0,8.6,0,.25,1,'#425d64');
  return b.finish();
}

export function arena() {
  const b = new Builder();
  b.cylinder(0,1.8,0,9.8,3.6,darkGlass,9.8,64);
  for (const y of [.5,1.5,2.5,3.5]) b.cylinder(0,y,0,10,.16,'#e0dac6',10,64);
  const g=new T.SphereGeometry(1,48,16,0,Math.PI*2,0,Math.PI/2);
  b.add(g,material('#d6e0d2'),0,3.6,0,10,4,10); g.dispose();
  for(let i=0;i<24;i++) {
    const a=i*Math.PI/12;
    b.tube([vec(0,7.65,0),vec(Math.cos(a)*7,6.4,Math.sin(a)*7),vec(Math.cos(a)*10,3.65,Math.sin(a)*10)],.09,'#91aaa8',18);
  }
  return b.finish();
}

/** Broad lower floors, a gentle shoulder and the rounded glazed crown of 30 St Mary Axe. */
export function gherkinRadius(t:number) {
  const profile=[[0,.77],[.1,.88],[.25,.98],[.38,1],[.5,.96],[.65,.84],[.8,.63],[.9,.4],[.97,.19]];
  if(t>=.97)return 6.9*.19*Math.sqrt(Math.max(0,(1-t)/.03));
  const i=Math.max(0,profile.findIndex((p,j)=>j<profile.length-1&&t>=p[0]&&t<profile[j+1][0]));
  const a=profile[i],b=profile[i+1],before=profile[Math.max(0,i-1)],after=profile[Math.min(profile.length-1,i+2)];
  const span=b[0]-a[0],u=(t-a[0])/span,m0=(b[1]-before[1])/(b[0]-before[0]),m1=(after[1]-a[1])/(after[0]-a[0]);
  return 6.9*((2*u**3-3*u*u+1)*a[1]+(u**3-2*u*u+u)*span*m0+(-2*u**3+3*u*u)*b[1]+(u**3-u*u)*span*m1);
}
export function gherkin() {
  const b=new Builder(),height=44,points:T.Vector2[]=[];
  for(let i=0;i<=120;i++)points.push(new T.Vector2(gherkinRadius(i/120),.65+i/120*height));
  const geo=new T.LatheGeometry(points,96);
  const positions=geo.getAttribute('position'),colors:number[]=[];
  const light=new T.Color('#78979f'),dark=new T.Color('#304d5b');
  for(let i=0;i<positions.count;i++) {
    const t=(positions.getY(i)-.65)/height,angle=Math.atan2(positions.getX(i),positions.getZ(i));
    const spiral=T.MathUtils.euclideanModulo((angle-t*3.35)*6/(Math.PI*2),1);
    const band=spiral<.27||t>.91,shade=light.clone().lerp(dark,band?.87:.05);
    colors.push(shade.r,shade.g,shade.b);
  }
  geo.setAttribute('color',new T.Float32BufferAttribute(colors,3));
  const pixels=new Uint8Array(512*512*4);
  for(let y=0;y<512;y++)for(let x=0;x<512;x++) {
    const u=x/512,v=y/512,column=Math.floor(u*48),floor=Math.min(31,Math.floor(v*32));
    const spiral=T.MathUtils.euclideanModulo((u*Math.PI*2-v*3.35)*6/(Math.PI*2),1);
    // Every floor is softly occupied; the spiral atria stay slightly darker,
    // with fine mullions instead of isolated, glaring white window patches.
    const brightness=(.56+lightingRandom(floor*97+column*13+509)*.12)*(spiral<.29?.68:1);
    const mullion=(u*48)%1<.07||(v*32)%1<.08;
    const falloff=brightness*(mullion?.25:.84+((v*32)%1)*.16);
    pixels.set([Math.round(186*falloff),Math.round(207*falloff),Math.round(211*falloff),255],(y*512+x)*4);
  }
  const glazing=registerGlow(new T.MeshStandardMaterial({vertexColors:true,roughness:.2,metalness:.4,emissive:'#ffffff',emissiveMap:dataTexture(pixels,512,true)}),.62);
  glazing.name='Gherkin · six spiral glazing bands';
  b.add(geo,glazing);geo.dispose();
  // Diamond bracing follows the surface, with fine horizontal floor divisions.
  const at=(t:number,a:number)=>vec(Math.sin(a)*(gherkinRadius(t)+.025),.65+t*height,Math.cos(a)*(gherkinRadius(t)+.025));
  for(let row=0;row<20;row++)for(let column=0;column<24;column++) {
    const t=row/20,a=(column+(row%2)*.5)*Math.PI/12;
    for(const direction of [-1,1]) {
      const path=Array.from({length:7},(_,i)=>at(t+i/120,a+direction*i/6*Math.PI/24));
      b.tube(path,.035,'#9db0b5',6);
    }
  }
  for(let floor=1;floor<40;floor++)b.ring(0,.65+height*floor/40,0,gherkinRadius(floor/40)+.025,.035,'#78949e');
  b.cylinder(0,.22,0,8.5,.44,'#d8d9c9',8.5,64);
  b.cylinder(0,.62,0,5.25,.8,material('#405d68',.3,.3),5.25,48);
  for(let i=0;i<12;i++){const a=i*Math.PI/6;b.beam(vec(Math.sin(a)*5.45,.45,Math.cos(a)*5.45),at(.045,a),.065,'#c1c9c7');}
  const model=b.finish();model.userData.profile='30 St Mary Axe';return model;
}

export function cityHall() {
  const b=new Builder();
  for(let i=0;i<14;i++) {
    const r=9.5-i*.28;
    b.cylinder(i*.12,.5+i*.72,0,r,.7,darkGlass,r-.12,48);
    b.cylinder(i*.12,.86+i*.72,0,r+.12,.12,'#e2e2cb',r+.12,48);
  }
  b.cylinder(1.6,10.8,0,5.7,.3,'#e1e0cb',5.7,48);
  b.cylinder(1.6,11,0,4.8,.2,'#4a7785',4.8,48);
  return b.finish();
}

export function gardenSpire() {
  const b=new Builder();
  const color='#b36d45';
  for(const x of [-1,1])for(const z of [-1,1]) {
    b.beam(vec(x*3,0,z*3),vec(x*.65,15,z*.65),.38,color);
    b.beam(vec(x*.65,15,z*.65),vec(0,27,0),.24,color);
  }
  for(const y of [3.5,8,13,17]) {
    const r=3*(1-y/24);
    b.box(0,y,0,r*2.7,.35,r*2.7,color);
    for(const s of [-1,1]) {
      b.beam(vec(-r,y,s*r),vec(r*.7,y+4,s*r*.7),.1,color);
      b.beam(vec(r,y,s*r),vec(-r*.7,y+4,s*r*.7),.1,color);
    }
  }
  b.beam(vec(0,27,0),vec(0,29,0),.08,'#d5b88b');
  return b.finish();
}

type HouseRoof='gable'|'hip'|'mansard'|'flat';
const housePalettes=[
  {wall:'#b78261',frame:'#dfc9a3'}, {wall:'#d9d5bf',frame:'#f0e4c9'},
  {wall:'#a66f53',frame:'#d9bd90'}, {wall:'#c2cec4',frame:'#e8e3ce'},
  {wall:'#cfb68f',frame:'#efe0bf'}, {wall:'#b4bdbe',frame:'#e4e0cf'},
];
const houseFacades=housePalettes.map((palette,i)=>facadeTexture(i===1||i===3||i===5?'stone':'brick',palette.wall));
const houseRoofColors=['#78938e','#788b96','#96988a','#9e7865','#6f8782'];
export function townhouseStyle(seed:number) {
  return {
    palette:Math.floor(lightingRandom(seed+101)*housePalettes.length),
    roof:(['gable','hip','mansard','flat'] as HouseRoof[])[Math.floor(lightingRandom(seed+211)*4)],
    roofColor:houseRoofColors[Math.floor(lightingRandom(seed+307)*houseRoofColors.length)],
    split:lightingRandom(seed+401)<.28,
    dormer:lightingRandom(seed+503)<.4,
  };
}

function hippedRoof(b:Builder,x:number,y:number,z:number,w:number,h:number,d:number,color:string,mansard=false) {
  const lower=[vec(-w/2,0,-d/2),vec(w/2,0,-d/2),vec(w/2,0,d/2),vec(-w/2,0,d/2)];
  const inset=mansard?w*.21:w/2,depthInset=mansard?d*.15:Math.min(d*.4,w*.5);
  const upper=[vec(-w/2+inset,h,-d/2+depthInset),vec(w/2-inset,h,-d/2+depthInset),vec(w/2-inset,h,d/2-depthInset),vec(-w/2+inset,h,d/2-depthInset)];
  const vertices:number[]=[];
  const triangle=(a:T.Vector3,c:T.Vector3,d:T.Vector3)=>{
    const normal=c.clone().sub(a).cross(d.clone().sub(a));if(normal.lengthSq()<1e-9)return;
    const corners=normal.y<0?[a,d,c]:[a,c,d];corners.forEach(p=>vertices.push(p.x,p.y,p.z));
  };
  for(let i=0;i<4;i++){const j=(i+1)%4;triangle(lower[i],lower[j],upper[j]);triangle(lower[i],upper[j],upper[i]);}
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(new Float32Array(vertices.length/3*2),2));geometry.computeVertexNormals();
  const mapped=prepareRoofTiles(geometry);b.add(mapped,tiledRoof(color),x,y,z);geometry.dispose();mapped.dispose();
  if(mansard)b.box(x,y+h,z,w-inset*2,.08,d-depthInset*2,color);
}
function townhouse(b:Builder,x:number,z:number,w:number,d:number,h:number) {
  const seed=Math.round(w*913+d*757+h*443),style=townhouseStyle(seed),palette=housePalettes[style.palette];
  b.group.userData.houseStyle=style;
  const facade=houseFacades[style.palette],roofHeight=Math.min(w*.43,2.2);
  const top=(cx:number,cz:number,width:number,depth:number,height:number)=>{
    b.box(cx,height/2,cz,width,height,depth,facade);
    b.box(cx,height,cz,width+.24,.18,depth+.24,palette.frame);
    if(style.roof==='flat') {
      b.box(cx,height+.12,cz,width-.18,.12,depth-.18,'#879b98');
      for(const side of [-1,1]){
        b.box(cx+side*(width/2-.08),height+.32,cz,.16,.5,depth,palette.wall);
        b.box(cx,height+.32,cz+side*(depth/2-.08),width,.5,.16,palette.wall);
      }
    } else if(style.roof==='gable')roof(b,cx,height+.1,cz,width+.4,roofHeight,depth+.4,style.roofColor);
    else hippedRoof(b,cx,height+.1,cz,width+.4,style.roof==='mansard'?roofHeight*.8:roofHeight,depth+.4,style.roofColor,style.roof==='mansard');
  };
  if(style.split){top(x-w*.17,z,w*.66,d,h);top(x+w*.33,z+d*.18,w*.34,d*.64,h*.76);}
  else top(x,z,w,d,h);
  b.box(x,.24,z,w+.2,.48,d+.2,'#a7a99a');
  // Bay windows and shallow porches change the street silhouette within the plot.
  if(!style.split&&style.palette%2===0){
    b.box(x-w*.2,h*.4,z+d/2+.08,w*.3,h*.62,.3,facade);
    b.box(x-w*.2,h*.72,z+d/2+.1,w*.34,.12,.4,palette.frame);
  }
  b.box(x+w*.2,.8,z+d/2+.12,w*.18,1.6,.14,['#405652','#6d5044','#45576b'][style.palette%3]);
  b.box(x+w*.2,1.68,z+d/2+.14,w*.24,.14,.32,palette.frame);
  for(const y of [h*.35,h*.68])b.box(x,y,z,w+.12,.12,d+.12,palette.frame);
  const chimneyX=x-w*.28,chimneyZ=z-d*.24,chimneyTop=h+(style.roof==='flat'?.7:roofHeight*.85);
  b.box(chimneyX,chimneyTop,chimneyZ,.52,1.4,.55,palette.wall);
  b.box(chimneyX,chimneyTop+.72,chimneyZ,.68,.12,.7,palette.frame);
  if(style.dormer&&!style.split&&style.roof==='gable') {
    b.box(x+w*.26,h+roofHeight*.55,z-d*.12,.8,.75,1,facade);
    b.box(x+w*.26+.41,h+roofHeight*.55,z-d*.12,.035,.44,.62,'#3f5962');
    b.box(x+w*.26,h+roofHeight*.55+.4,z-d*.12,1,.1,1.15,style.roofColor);
  }
}
const officeLobby=registerGlow(new T.MeshStandardMaterial({color:'#526d76',emissive:'#ffd7a0',roughness:.25,metalness:.25}),.42,.02);
const officeCrown=registerGlow(new T.MeshStandardMaterial({color:'#c7d2cf',emissive:'#a8cce4',roughness:.5}),.22);

export function building(b: Builder, x: number, z: number, w: number, d: number, h: number, type: 'modern' | 'town' | 'office' = 'office') {
  if(type==='town'){townhouse(b,x,z,w,d,h);return;}
  const facade=type==='modern'?pick([glass,darkGlass]):pick([stone,ivory]);
  b.box(x,h/2,z,w,h,d,facade);
  b.box(x,.3,z,w+.45,.6,d+.45,'#a7a99a');
  b.box(x,h,z,w+.4,.35,d+.4,'#e0ddc9');
  {
    b.box(x,h+.15,z,w-.8,.2,d-.8,'#879799');
    b.box(x,h+.7,z,w*.38,1.1,d*.35,'#c0c8be');
    for(let i=0;i<3;i++)b.box(x+range(-w*.3,w*.3),h+.7,z+range(-d*.3,d*.3),range(.5,1.4),.8,range(.8,1.6),'#cbd0c7');
    if(type==='modern') {
      // Restrained crown lines and a warm lobby anchor the lit floors to the street.
      for(const side of [-1,1]){
        b.box(x,h+.08,z+side*(d/2+.22),w+.45,.055,.045,officeCrown);
        b.box(x+side*(w/2+.22),h+.08,z,.045,.055,d+.45,officeCrown);
      }
      b.box(x,.95,z+d/2+.065,w*.45,1.1,.035,officeLobby);
      for(const side of [-1,1])b.box(x+side*w*.075,.95,z+d/2+.09,.07,1.15,.04,'#80989b');
    }
    for(const side of [-1,1]) {
      for(let q=-w/2+.5;q<w/2;q+=type==='modern'?1.1:2.2)b.box(x+q,h/2,z+side*(d/2+.015),type==='modern'?.07:.14,h,.12,'#c7cec5');
    }
  }
}

export function bridge(z: number, center: number, width: number, tower = false, concrete?:T.Material) {
  const b = new Builder(), length=width+8.4, railingLength=width+2.6, deckY=ROAD_HEIGHT-.11+BRIDGE_LIFT;
  b.box(center,deckY-.25,z,length,.55,6.8,concrete??ROAD_BORDER);
  b.box(center,deckY+.06,z,length,.1,ROAD_WIDTHS.bridge,ROAD_ASPHALT);
  for(const side of [-1,1]) {
    b.box(center,deckY+.09,z+side*2.85,railingLength,.16,.85,concrete??ROAD_BORDER);
    b.box(center,deckY+.75,z+side*3.3,railingLength,.18,.15,tower?'#84acb5':'#b7c7ba');
    for(let x=center-railingLength/2;x<center+railingLength/2;x+=1.1)b.box(x,deckY+.4,z+side*3.3,.1,.8,.1,tower?'#9db9bc':'#a0b0a5');
  }
  for(let x=center-length/2+2;x<center+length/2-1;x+=3)roadDash(b,x,deckY+.114,z,.12,1.4,Math.PI/2);
  if(!tower) {
    // Solid spandrels with actual open arches below the road deck.
    // A broad shallow arch leaves the whole navigable channel clear of piers.
    for(const side of [-1,1]) {
      const shape=new T.Shape(),half=width/2+.3;
      shape.moveTo(-half,0);shape.lineTo(half,0);
      for(let i=0;i<=64;i++){const x=half-i*half*2/64;shape.lineTo(x,-.18-3.2*Math.pow(Math.abs(x/half),8));}
      shape.closePath();const g=new T.ExtrudeGeometry(shape,{depth:.5,bevelEnabled:false});
      b.add(g,material('#b4bdaf'),center,deckY-.52,z+side*2.7-.25);g.dispose();
    }
    for(const side of [-1,1])b.box(center+side*(width/2+.8),-.65,z,1.4,3.6,6,'#9fae9f');
  } else {
    const towerOffset=width*.31;
    // One extruded portal replaces the intersecting pillar/header boxes. Their
    // coplanar side faces used to show two differently scaled window textures.
    const base=1.5,top=17.5,openingTop=14.3,halfDepth=3.425,halfOpening=1.775;
    const portal=new T.Shape();
    portal.moveTo(-halfDepth,base);portal.lineTo(-halfDepth,top);
    portal.lineTo(halfDepth,top);portal.lineTo(halfDepth,base);
    portal.lineTo(halfOpening,base);portal.lineTo(halfOpening,openingTop);
    portal.lineTo(-halfOpening,openingTop);portal.lineTo(-halfOpening,base);portal.closePath();
    const shell=new T.ExtrudeGeometry(portal,{depth:4.5,bevelEnabled:false});
    shell.rotateY(Math.PI/2);shell.translate(-2.25,0,0);
    const position=shell.getAttribute('position'),normal=shell.getAttribute('normal'),uv=shell.getAttribute('uv');
    for(let i=0;i<position.count;i++) {
      // Continuous vertical mapping keeps the upper windows the same scale as
      // the supporting walls, instead of squeezing twelve floors into a lintel.
      const u=Math.abs(normal.getX(i))>.5?(position.getZ(i)+halfDepth)/(halfDepth*2):(position.getX(i)+2.25)/4.5;
      uv.setXY(i,u,(position.getY(i)-base)/(top-base));
    }
    for(const tx of [center-towerOffset,center+towerOffset]) {
      b.cylinder(tx,-.1,z,4,2.8,'#899f9c',4.1,12);
      // A real opening through each tower allows crossing the bridge on foot.
      b.add(shell,stone,tx,0,z);
      for(const side of [-1,1]) {
        b.box(tx,4,z+side*2.6,4.9,.6,1.9,'#d7d3b9');
        b.box(tx,14,z+side*2.6,4.9,.7,1.9,'#dfd8bc');
      }
      b.box(tx,17.5,z,4.9,.5,7.1,'#d6d5bf');
      roof(b,tx,17.8,z,4.7,3.7,6.9,'#5e8385');
      for(const dx of [-1,1])for(const dz of [-1,1]) {
        b.box(tx+dx*2.1,18,z+dz*3,1,3,1,'#d5ccb0');
        squareSpire(b,tx+dx*2.1,19.2,z+dz*3,1.18,3,1.18,'#5d7e7e');
        b.beam(vec(tx+dx*2.1,22.2,z+dz*3),vec(tx+dx*2.1,23.3,z+dz*3),.045,'#d8d4b7');
      }
    }
    shell.dispose();
    for(const side of [-1,1]) {
      const cableZ=z+side*3.5;
      b.box(center,14.7,cableZ,towerOffset*2,.7,.7,'#b9ccc4');
      b.box(center,15.5,cableZ,towerOffset*2,.15,.7,'#dbe0c9');
      for(let x=center-towerOffset;x<=center+towerOffset;x+=1.2)b.box(x,15.1,cableZ,.12,.8,.12,'#7e9ea1');
      const spans=[[center-railingLength/2,center-towerOffset,2,16],[center-towerOffset,center+towerOffset,16,16],[center+towerOffset,center+railingLength/2,16,2]];
      for(const [a,c,ay,cy] of spans) {
        const path:T.Vector3[]=[];
        for(let i=0;i<=30;i++) {const t=i/30;const y=ay+(cy-ay)*t-Math.sin(Math.PI*t)*(ay===cy?8:3);path.push(vec(a+(c-a)*t,y,cableZ));}
        b.tube(path,.22,'#358fa6',40);
        b.tube(path.map(p=>vec(p.x,p.y-.65,p.z)),.12,'#69aebb',40);
        for(let i=2;i<30;i+=3)b.beam(vec(path[i].x,deckY+.5,cableZ),path[i],.065,'#c4d4c9');
      }
    }
  }
  const root=b.finish();root.name=tower?'Tower Bridge':'River arch bridge';
  root.traverse(child=>{if(!(child instanceof T.Mesh))return;
    const original=child.geometry;child.geometry=rampBridgeGeometry(original,center,width,BRIDGE_LIFT);original.dispose();
  });
  return root;
}
