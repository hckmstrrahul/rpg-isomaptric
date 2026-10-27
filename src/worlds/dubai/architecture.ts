import * as T from 'three';
import { Builder, facadeTexture, material, vec } from '../../geometry.ts';
import { glowMaterial, registerGlow } from '../../lighting.ts';
import { surfaceMaterial } from '../../nature.ts';
import type { TowerPlot } from './plan.ts';

let facades:T.MeshStandardMaterial[]|undefined;
function glass(index:number) {
  facades??=['#335967','#63828d','#b8b8a8','#7c969b'].map((color,i)=>facadeTexture(i===2?'stone':'glass',color));
  return facades[index%facades.length];
}
const ivory='#e6e0ca',silver='#bbc7c6',bronze='#9a886c';
export function marinaTower(plot:TowerPlot) {
  const b=new Builder(),{w,d,h,style}=plot,facade=glass(style),dark=glass(0);
  b.box(0,.4,0,w+1.4,.8,d+1.4,'#bdb7a3');
  b.box(0,1.5,0,w+1,2,d+1,dark);
  b.box(0,2.6,0,w+1.3,.18,d+1.3,ivory);
  if(plot.landmark==='spire') {
    // Alternating setbacks form a slender skyline crown with a modeled spire.
    for(let tier=0;tier<7;tier++){
      const height=(h-13)/7,width=w*(1-tier*.105),depth=d*(1-tier*.09),y=2.7+tier*height;
      const tierGeometry=new T.BoxGeometry(width,height,depth),tierUV=tierGeometry.getAttribute('uv');
      for(let i=0;i<tierUV.count;i++)tierUV.setY(i,(tier*height+tierUV.getY(i)*height)/(h-13));
      b.add(tierGeometry,glass(1),0,y+height/2,0);tierGeometry.dispose();
      for(const side of [-1,1]){for(const across of [-1,1])b.box(side*width/2,y+height/2,across*depth/2,.16,height,.16,silver);}
      b.box(0,y+height,0,width+.3,.24,depth+.3,ivory);
      for(let floor=1;floor<height;floor+=1.35)b.box(0,y+floor,0,width+.12,.08,depth+.12,silver);
    }
    b.cylinder(0,h-7,0,.7,10,silver,.22,12);b.cylinder(0,h-1,0,.18,4,silver,.035,10);
  } else if(style===1) {
    const g=new T.CylinderGeometry(1,1,h-3,40);b.add(g,facade,0,(h+3)/2,0,w*.5,1,d*.5);g.dispose();
    for(let y=4;y<h;y+=1.35){const ring=new T.CylinderGeometry(1,1,.09,40);b.add(ring,material(silver),0,y,0,w*.505,1,d*.505);ring.dispose();}
    const roof=new T.CylinderGeometry(1,1,.45,40);b.add(roof,material(ivory),0,h,0,w*.53,1,d*.53);roof.dispose();
    b.box(0,h+.8,0,w*.5,1.2,d*.5,'#8c9c9e');
  } else if(style===4) {
    const floors=Math.floor((h-3)/1.6),height=(h-3)/floors;
    const body=new T.BoxGeometry(w*.82,h-3,d*.82,1,floors,1),vertices=body.getAttribute('position');
    for(let i=0;i<vertices.count;i++){const a=vertices.getY(i)/(h-3)*.35,x=vertices.getX(i),z=vertices.getZ(i);vertices.setX(i,x*Math.cos(a)+z*Math.sin(a));vertices.setZ(i,-x*Math.sin(a)+z*Math.cos(a));}
    body.computeVertexNormals();b.add(body,facade,0,(h+3)/2,0);body.dispose();
    for(let floor=0;floor<floors;floor++){
      const yaw=(floor/floors-.5)*.35;
      b.box(0,3+(floor+1)*height,0,w*.85,.10,d*.85,silver,yaw);
    }
    b.box(0,h+.2,0,w*.82,.4,d*.82,ivory,.175);
  } else {
    const taper=style===5?.73:1;
    const body=new T.BoxGeometry(w,h-3,d),p=body.getAttribute('position');
    for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*taper);p.setZ(i,p.getZ(i)*taper);}
    body.computeVertexNormals();b.add(body,facade,0,(h+3)/2,0);body.dispose();
    for(let y=4;y<h;y+=1.5){const k=1-(1-taper)*(y-3)/(h-3);b.box(0,y,0,w*k+.10,.095,d*k+.10,style===3?ivory:silver);}
    for(const side of [-1,1])for(const along of [-.38,0,.38]){
      if(taper===1){b.box(side*(w/2+.06),(h+3)/2,along*d,.13,h-3,.18,style===3?ivory:silver);b.box(along*w,(h+3)/2,side*(d/2+.06),.18,h-3,.13,style===3?ivory:silver);}
    }
    b.box(0,h+.15,0,w*taper+.35,.3,d*taper+.35,ivory);
    b.box(0,h+.8,0,w*.5,1.1,d*.48,'#778b8f');
    for(const x of [-w*.14,w*.14])b.box(x,h+1.5,0,w*.17,.25,d*.3,silver);
    if(style===3){b.cylinder(0,h+2.2,0,w*.27,2.6,bronze,w*.12,16);b.cylinder(0,h+4.3,0,.10,2,silver,.03,8);}
  }
  for(const side of [-1,1]){
    b.box(0,2.53,side*(d/2+.52),w+1,.055,.06,glowMaterial('#ffdcaa',2.5));
    b.box(side*(w/2+.52),2.53,0,.06,.055,d+1,glowMaterial('#ffdcaa',2.5));
  }
  const root=b.finish();root.name=plot.landmark==='spire'?'Skyline Spire':'Marina skyline tower';return root;
}
function surface(gridU:number,gridV:number,point:(u:number,v:number)=>T.Vector3) {
  const p:number[]=[],uv:number[]=[],indices:number[]=[];
  for(let u=0;u<=gridU;u++)for(let v=0;v<=gridV;v++){p.push(...point(u/gridU,v/gridV).toArray());uv.push(u/gridU,v/gridV);}
  for(let u=0;u<gridU;u++)for(let v=0;v<gridV;v++){const a=u*(gridV+1)+v,c=a+gridV+1;indices.push(a,c,a+1,a+1,c,c+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
}
const roof=material('#eee9d7',.6,.1);roof.side=T.DoubleSide;
export function pearlPavilion() {
  const b=new Builder();
  for(let i=0;i<3;i++)b.cylinder(0,.2+i*.22,0,10.3-i*.4,.3,ivory,10.3-i*.4,64);
  b.cylinder(0,2.2,0,8.4,3,glass(1),8.4,64);b.cylinder(0,3.8,0,9,.35,ivory,9,64);
  for(let i=0;i<32;i++){const a=i*Math.PI/16;b.cylinder(Math.cos(a)*8.5,2.1,Math.sin(a)*8.5,.12,3,ivory,.12,6);}
  for(let petal=0;petal<8;petal++){
    const a=petal*Math.PI/4;
    const rise=4.2+2.4*(1-Math.sin(a))*.5;
    const petalPoint=(u:number,v:number)=>{const t=(v-.5)*.76*(.75+.25*Math.sin(u*Math.PI)),r=2+8*u;return vec(Math.cos(a+t)*r,4+rise*(u*.45+u*u*.55)+Math.sin(v*Math.PI)*.55,Math.sin(a+t)*r);};
    const lowerPoint=(u:number,v:number)=>petalPoint(u,v).add(vec(0,-.25-1.6*Math.sin(u*Math.PI)*Math.sin(v*Math.PI),0));
    const g=surface(20,12,petalPoint);b.add(g,roof);g.dispose();
    const underside=surface(20,12,lowerPoint);b.add(underside,roof);underside.dispose();
    // Closed sculpted shells read as architecture from both above and street level.
    for(const edge of [0,1]){
      const side=surface(20,1,(u,v)=>petalPoint(u,edge).lerp(lowerPoint(u,edge),v));b.add(side,roof);side.dispose();
      const end=surface(1,12,(u,v)=>petalPoint(edge,v).lerp(lowerPoint(edge,v),u));b.add(end,roof);end.dispose();
    }
    for(const edge of [0,1]){b.tube(Array.from({length:22},(_,i)=>petalPoint(i/21,edge).add(vec(0,-.1,0))),.14,ivory,24);b.tube(Array.from({length:22},(_,i)=>petalPoint(i/21,edge)),.025,glowMaterial('#dce9e5',1.7),24);}
    b.tube(Array.from({length:18},(_,i)=>petalPoint(i/17,.5)),.035,silver,20);
  }
  b.sphere(0,4.2,0,2.85,.45,2.85,roof);b.cylinder(0,4.55,0,1.5,.1,glowMaterial('#c4e9eb',1.6),1.5,40);
  const root=b.finish();root.name='Pearl Pavilion · eight curved petals';return root;
}
export function conservatory() {
  const b=new Builder();
  const glassRoof=registerGlow(new T.MeshPhysicalMaterial({color:'#719d9d',emissive:'#b3d1cd',roughness:.23,metalness:.25,clearcoat:.8}),.18);
  b.cylinder(0,.25,0,1,.5,ivory,1,64);
  const dome=new T.SphereGeometry(1,40,20,0,Math.PI*2,0,Math.PI/2);b.add(dome,glassRoof,0,1,0,12,13,17);dome.dispose();
  const base=new T.CylinderGeometry(1,1,1,64);b.add(base,glass(1),0,.6,0,12,1,17);base.dispose();
  const ring=new T.TorusGeometry(1,.025,6,80);b.add(ring,material(ivory),0,1.05,0,12,17,1,-Math.PI/2);ring.dispose();
  for(let z=-15;z<=15;z+=2.5){const k=Math.sqrt(1-z*z/(17*17));b.tube(Array.from({length:33},(_,i)=>{const a=i/32*Math.PI;return vec(Math.cos(a)*12*k,1+Math.sin(a)*13*k,z);}),.19,ivory,32);}
  for(let i=1;i<6;i++){const a=i/6*Math.PI;b.tube(Array.from({length:33},(_,j)=>{const z=-16.8+j/32*33.6,k=Math.sqrt(1-z*z/(17*17));return vec(Math.cos(a)*12*k,1+Math.sin(a)*13*k,z);}),.055,silver,32);}
  for(const side of [-1,1])b.box(side*10,.8,0,.12,.12,20,glowMaterial('#bfdfd7',2));
  const root=b.finish();root.scale.set(.8,1,.8);root.name='Harbour Conservatory · ribbed glass shell';return root;
}
export function sailCentre() {
  const b=new Builder();
  for(const [index,dx] of [-5,5].entries()){
    b.box(dx,.35,0,8.5,.7,20,ivory);b.box(dx,2,0,7.7,3,19,glass(1));
    const point=(u:number,v:number)=>vec(dx+(v-.5)*9,3.6+Math.sin(u*Math.PI)*7.5+(1-v)*2.5+(index?.5:0),-10+u*20);
    const g=surface(24,12,point);b.add(g,roof);g.dispose();
    for(let v=0;v<=1.01;v+=.125)b.tube(Array.from({length:25},(_,i)=>point(i/24,v)),v===0||v===1?.12:.055,silver,24);
    for(const side of [-1,1])b.box(dx+side*3.9,1.1,0,.06,.09,19,glowMaterial('#ffdab0',2.6));
  }
  const root=b.finish();root.name='Marina Arts Centre · paired sail roofs';return root;
}
export function palmResources() {
  const trunkB=new Builder(),leafB=new Builder(),bark=surfaceMaterial('bark');
  trunkB.cylinder(0,2.3,0,.17,4.6,bark,.10,8);
  for(let i=0;i<18;i++)trunkB.cylinder(0,.18+i*.24,0,.185-i*.004,.06,bark,.18-i*.004,8);
  for(let frond=0;frond<10;frond++){
    const a=frond*Math.PI/5,tilt=frond%2*.2;
    const point=(u:number,side:number)=>{const r=2.2*u,w=Math.sin(u*Math.PI)*.32*side;return vec(Math.cos(a)*r-Math.sin(a)*w,4.5+Math.sin(u*Math.PI)*.55-u*.6+tilt,Math.sin(a)*r+Math.cos(a)*w);};
    for(let i=0;i<10;i++){
      const u=i/10,v=(i+1)/10;
      const geo=new T.BufferGeometry().setFromPoints([point(u,0),point(v,-1),point(v,0),point(u,0),point(v,0),point(v,1)]);geo.computeVertexNormals();leafB.add(geo,material('#477946'));geo.dispose();
    }
  }
  const trunk=(trunkB.finish().children[0] as T.Mesh).geometry,leafRoot=leafB.finish(),leafMesh=leafRoot.children[0] as T.Mesh;
  const leaves=new T.MeshStandardMaterial({color:'#76a15b',roughness:.85,side:T.DoubleSide});
  return {trunk,foliage:leafMesh.geometry,bark,leaves};
}

export function courtyardHouse(index:number) {
  const b=new Builder(),wall=['#e2d9c1','#cabba0','#e8e5d6','#c5c7bc'][index%4],frame='#ece6d5';
  b.box(0,.16,0,6.6,.32,6,'#bcb49d');b.box(0,1.55,0,6,2.8,5.4,wall);
  b.box(-.9,3.85,-.55,4.2,1.8,4.3,wall);b.box(-.9,4.85,-.55,4.5,.2,4.6,frame);
  for(const side of [-1,1]){
    for(const x of [-2,0,2]){
      b.box(x,1.65,side*2.72,1.05,1.45,.06,frame);
      b.box(x,1.65,side*2.76,.86,1.25,.025,(index+Math.round(x))%3===0?glowMaterial('#e9cda3',1.5):material('#304f59',.3,.15));
      b.box(x,1.65,side*2.79,.045,1.25,.035,frame);
    }
    for(const z of [-1.6,.2,1.65])b.box(side*3.02,1.7,z,.025,1.2,.8,material('#42626a',.35,.12));
    b.box(0,3.03,side*2.65,6.2,.4,.14,frame);
    b.box(side*3.03,3.03,0,.14,.4,5.4,frame);
  }
  b.box(-.9,4,-2.72,2.8,.95,.04,glowMaterial('#e0cead',1.25));
  // A shaded roof terrace with real posts, slats and a recessed door.
  for(const x of [1.5,2.7])for(const z of [-1.4,1.5])b.box(x,3.6,z,.08,1.4,.08,'#9c8c6a');
  for(let z=-1.5;z<=1.5;z+=.26)b.box(2.1,4.33,z,1.55,.08,.09,'#b9a889');
  b.box(1.1,1.25,2.79,.9,2.25,.04,'#786949');
  const root=b.finish();root.name='Dubai residence · courtyard and roof pergola';return root;
}
