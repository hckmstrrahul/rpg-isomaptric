import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';
import {glowMaterial} from '../../lighting.ts';
import {boatCabinGlass} from '../../boatLighting.ts';
import {BAY} from './plan.ts';
import {GROUND,WATER_HEIGHT} from '../../layout.ts';

const ivory=material('#f2eee2',.37,.12),teak=material('#bfa37a'),glass=boatCabinGlass('#203d4a',.23,.45),chrome=material('#c4ced0',.3,.65);
const sailCloth=material('#ece8d7',.75);sailCloth.side=T.DoubleSide;
export function createYacht(length=4.4,sailing=false,furled=false) {
  const b=new Builder(),beam=length*.29,outline=[{x:0,z:.5},{x:-.30,z:.41},{x:-.5,z:.12},{x:-.45,z:-.43},{x:.45,z:-.43},{x:.5,z:.12},{x:.3,z:.41}];
  const positions:number[]=[],indices:number[]=[];
  for(const [y,k] of [[-.22,.55],[.12,.94],[.42,1]])for(const p of outline)positions.push(p.x*beam*k,y,p.z*length);
  for(let level=0;level<2;level++)for(let i=0;i<outline.length;i++){const j=(i+1)%outline.length,a=level*outline.length+i,c=level*outline.length+j;indices.push(a,a+outline.length,c,c,a+outline.length,c+outline.length);}
  const hull=new T.BufferGeometry();hull.setAttribute('position',new T.Float32BufferAttribute(positions,3));hull.setIndex(indices);hull.computeVertexNormals();b.add(hull,ivory);hull.dispose();
  const shape=new T.Shape(outline.map(p=>new T.Vector2(p.x*beam,-p.z*length)));shape.closePath();const deck=new T.ShapeGeometry(shape);deck.rotateX(-Math.PI/2);b.add(deck,teak,0,.425,0);deck.dispose();
  for(let x=-beam*.35;x<=beam*.35;x+=.12)b.box(x,.435,-length*.09,.009,.012,length*.60,'#937d5d');
  for(let i=0;i<outline.length;i++){
    const a=outline[i],c=outline[(i+1)%outline.length];b.beam(vec(a.x*beam,.46,a.z*length),vec(c.x*beam,.46,c.z*length),.038,ivory);
    b.beam(vec(a.x*beam,.64,a.z*length),vec(c.x*beam,.64,c.z*length),.012,chrome,5);b.beam(vec(a.x*beam,.46,a.z*length),vec(a.x*beam,.64,a.z*length),.012,chrome,5);
  }
  for(const side of [-1,1]){
    b.box(side*beam*.46,.22,-length*.07,.018,.06,length*.48,'#294f60');
    b.sphere(side*beam*.4,.49,length*.1,.035,.035,.035,glowMaterial(side<0?'#ed4b3e':'#65db9d',2));
  }
  if(sailing){
    b.box(0,.58,-length*.08,beam*.61,.28,length*.33,ivory);b.box(0,.74,-length*.08,beam*.44,.035,length*.24,glass);
    const mast=length*1.35;b.beam(vec(0,.5,.1),vec(0,mast,.1),.025,chrome,8);b.beam(vec(0,.9,.1),vec(0,.9,-length*.37),.022,chrome,6);
    for(const z of [length*.45,-length*.40])b.beam(vec(0,mast,.1),vec(0,.46,z),.007,chrome,4);
    for(const side of [-1,1])b.beam(vec(0,mast*.82,.1),vec(side*beam*.4,.46,-.2),.007,chrome,4);
    if(furled)b.box(0,.98,-length*.16,.13,.12,length*.5,'#e3dece');
    else {
      const sail=(front:boolean)=>{
        const points:number[]=[],idx:number[]=[],n=10;
        for(let row=0;row<=n;row++){const t=row/n,width=(1-t)*length*(front?.43:.40),base=front?.18:.03;for(const side of [0,1])points.push(Math.sin(t*Math.PI)*.14*(side?1:0),.95+t*(mast-.99),base+(front?1:-1)*width*side);}
        for(let row=0;row<n;row++){const i=row*2;idx.push(i,i+1,i+2,i+1,i+3,i+2);}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(points,3));g.setIndex(idx);g.computeVertexNormals();b.add(g,sailCloth);g.dispose();
      };sail(false);sail(true);
    }
  }else {
    // Low swept cabin, continuous dark glazing, flybridge and upholstered sun pads.
    b.box(0,.62,-length*.12,beam*.76,.37,length*.43,ivory);
    const cabin=new T.BoxGeometry(beam*.69,.4,length*.36),p=cabin.getAttribute('position');for(let i=0;i<p.count;i++)if(p.getY(i)>0){p.setX(i,p.getX(i)*.87);p.setZ(i,p.getZ(i)-length*.045);}cabin.computeVertexNormals();b.add(cabin,glass,0,.94,-length*.12);cabin.dispose();
    b.box(0,1.16,-length*.16,beam*.68,.08,length*.33,ivory);
    for(const x of [-beam*.2,beam*.2]){b.box(x,.50,length*.28,beam*.27,.08,length*.18,'#ede2ca');b.box(x,1.22,-length*.21,beam*.23,.12,length*.14,'#ddd5c0');}
    b.box(0,.46,-length*.45,beam*.8,.10,length*.12,teak);b.beam(vec(0,1.2,-length*.2),vec(0,1.72,-length*.24),.022,chrome);b.sphere(0,1.7,-length*.24,.12,.05,.12,ivory);
    b.box(0,.61,-length*.13,beam*.77,.045,length*.37,glowMaterial('#ffe2b1',1.6));
  }
  const root=b.finish();root.name=sailing?'Marina sailing yacht':'Marina motor yacht';root.userData.sailing=sailing;return {root,length};
}
export const DOCK_ANGLES=[-2.95,-2.40,-1.85,-1.30,-.75];
export function createMarinaDocks() {
  const b=new Builder(),berths:{x:number;z:number;yaw:number;sailing:boolean;length:number}[]=[],bounds:T.Box3[]=[];
  const toWorld=(a:number,r:number,side=0)=>vec(BAY.x+Math.cos(a)*r-Math.sin(a)*side,WATER_HEIGHT+.48,BAY.z+Math.sin(a)*r+Math.cos(a)*side);
  const deck=(a:number,r:number,lateral:number,length:number,width:number)=>{
    const center=toWorld(a,r,lateral);b.box(center.x,center.y,center.z,width,.20,length,teak,Math.PI/2-a);
    const extent=new T.Vector3(Math.abs(Math.cos(a))*length/2+Math.abs(Math.sin(a))*width/2,.12,Math.abs(Math.sin(a))*length/2+Math.abs(Math.cos(a))*width/2);
    bounds.push(new T.Box3(center.clone().sub(extent),center.clone().add(extent)));
  };
  DOCK_ANGLES.forEach((a,index)=>{
    deck(a,29,0,10,1.05);
    // Sloped access reaches the promenade, rather than ending below the retaining wall.
    const landing=toWorld(a,35.3);b.box(landing.x,GROUND+.055,landing.z,.95,.12,2.5,teak,Math.PI/2-a);
    const start=toWorld(a,34.1),end=toWorld(a,30.5);start.y=GROUND+.055;
    const length=start.distanceTo(end),g=new T.BoxGeometry(.95,.12,length),q=new T.Quaternion().setFromUnitVectors(vec(0,0,1),end.clone().sub(start).normalize());g.applyQuaternion(q);const midpoint=start.clone().add(end).multiplyScalar(.5);b.add(g,teak,midpoint.x,midpoint.y,midpoint.z);g.dispose();
    for(const side of [-1,1]){
      const offset=vec(-Math.sin(a)*side*.45,0,Math.cos(a)*side*.45),topStart=start.clone().add(offset),topEnd=end.clone().add(offset);topStart.y+=.72;topEnd.y+=.72;
      b.beam(topStart,topEnd,.025,chrome,5);
      for(let i=0;i<=4;i++){const low=start.clone().lerp(end,i/4).add(offset);b.beam(low,low.clone().add(vec(0,.72,0)),.018,chrome,5);}
      const upper=toWorld(a,36.45).add(offset);upper.y=GROUND+.775;b.beam(topStart,upper,.025,chrome,5);b.beam(upper.clone().add(vec(0,-.72,0)),upper,.018,chrome,5);
    }
    for(const radius of [32,28,24])for(const side of [-1,1]){
      // Narrow finger pontoons project across the radial spine.
      const center=toWorld(a,radius,side*2.1);b.box(center.x,center.y,center.z,3.6,.18,.42,teak,Math.PI/2-a);
      const light=toWorld(a,radius,side*.52);b.cylinder(light.x,light.y+.16,light.z,.045,.30,'#758c90',.045,6);b.sphere(light.x,light.y+.32,light.z,.065,.035,.065,glowMaterial('#ffe2ae',2.5));
    }
    for(const r of [30,26])for(const side of [-1,1]){
      const p=toWorld(a,r,side*2.15);berths.push({x:p.x,z:p.z,yaw:Math.PI/2-a+Math.PI,sailing:(index+side+r)%4===0,length:3.25+(index%2)*.15});
      const rope=toWorld(a,r+1.3,side*.55);b.beam(rope.clone().add(vec(0,.1,0)),p.clone().add(vec(Math.cos(a)*1.3,.07,Math.sin(a)*1.3)),.012,'#968a6c',4);
    }
  });
  const root=b.finish();root.name='Five connected marina piers and twenty berths';return {root,berths,bounds};
}
