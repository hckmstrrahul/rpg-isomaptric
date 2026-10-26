import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { readFileSync } from 'node:fs';
import * as T from 'three';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync } from 'node:fs';
import { roadClearance,plotTouchesRoad,pointSegmentDistance,FLOWER_BEDS,ROAD_BORDER_WIDTH } from '../src/cityPlan.ts';
import { TERRAIN_OUTLINE,SOIL_DEPTH } from '../src/boundary.ts';
import { bank, GROUND } from '../src/layout.ts';
import { ROAD_COLOR, ROAD_BORDER_COLOR } from '../src/roadSurfaces.ts';
import { auditRoadSurfaces } from './road-surface-checks.ts';
const ctx=new Proxy({}, { get:()=>()=>{},set:()=>true });
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>ctx})} as unknown as Document;
const {createWorld}=await import('../src/world.ts');
const binBytes=readFileSync(new URL('../public/assets/nvidia/wheelie-bin.glb',import.meta.url));
const bin=(await new GLTFLoader().parseAsync(binBytes.buffer.slice(binBytes.byteOffset,binBytes.byteOffset+binBytes.byteLength),'' )).scene;
const scene=new T.Scene(),world=createWorld(scene,{bin,loaded:['wheelie-bin']});
const failures:string[]=[];
for(const site of [...world.gardens,...world.circularSites]) {
 const clearance=roadClearance(site,world.roads,.85)-site.r;
 if(clearance<0)failures.push(`Circle ${site.id}: clearance ${clearance.toFixed(2)}`);
}
for(const bed of FLOWER_BEDS)if(plotTouchesRoad({...bed,w:7,d:4},world.roads,.85))failures.push(`Flower bed ${JSON.stringify(bed)} touches road`);
const buildings=world.objects.state.objects.filter(o=>o.kind==='building');
for(const object of buildings){
 for(const o of world.objects.models.get(object.id)!.obstacles)
  if(plotTouchesRoad(o,world.roads,.5))failures.push(`${object.name} footprint touches road at ${o.x},${o.z}`);
 if(object.landmarkId!=='eye'&&plotTouchesRoad(object,world.roads,.5))failures.push(`${object.name} visual bounds touch road at ${object.x},${object.z}`);
}
const props=world.objects.state.objects.filter(o=>['Street lantern','Park bench','Telephone box','Wheelie bin','Fire hydrant'].includes(o.name));
for(const p of props){
 if(plotTouchesRoad(p,world.roads,.15))failures.push(`${p.name} touches road ${p.x},${p.z}`);
 for(const o of world.objects.state.objects){
  if(o===p||o.active===false||world.traffic.cars.some(car=>car.object===o))continue;
  const base=o.baseY??GROUND,propBase=p.baseY??GROUND;
  if(base+o.height<=propBase||propBase+p.height<=base)continue;
  if(Math.abs(o.x-p.x)<(o.w+p.w)/2+.15&&Math.abs(o.z-p.z)<(o.d+p.d)/2+.15)
   failures.push(`${p.name} ${p.id} touches ${o.name} ${o.id}`);
 }
}
for(const road of world.roads)for(const end of [road.points[0],road.points.at(-1)!]){
 const connects=world.roads.some(other=>other!==road&&other.points.some((p,i)=>i&&pointSegmentDistance(end,other.points[i-1],p)<.01));
 if(!connects)failures.push(`Unconnected end: ${road.id} ${JSON.stringify(end)}`);
}
const surfaces=auditRoadSurfaces(scene,world.roads);failures.push(...surfaces.failures);
console.log(JSON.stringify({roads:world.roads.length,streetCornerSamples:surfaces.cornerSamples,greenEdgeSamples:surfaces.edgeSamples,buildings:buildings.length,trees:world.objects.trees.size,props:props.length,bins:world.bins,phones:props.filter(o=>o.name==='Telephone box').length,soilDepth:SOIL_DEPTH,failures},null,2));
// Standalone plan export for inspecting geometric placement without a browser.
const path=(points:{x:number;z:number}[])=>points.map(p=>`${p.x},${p.z}`).join(' ');
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1400" viewBox="-118 -118 236 236"><rect x="-118" y="-118" width="236" height="236" fill="#dce4df"/><polygon points="${path(TERRAIN_OUTLINE)}" fill="#bdcba3"/>`;
const left=Array.from({length:217},(_,i)=>({x:bank(i-108,-1),z:i-108})),right=Array.from({length:217},(_,i)=>({x:bank(108-i,1),z:108-i}));
svg+=`<polygon points="${path([...left,...right])}" fill="#6daab3"/>`;
for(const border of [true,false])for(const road of world.roads)svg+=`<polyline points="${path(road.points)}" fill="none" stroke="${border?ROAD_BORDER_COLOR:ROAD_COLOR}" stroke-width="${road.width+(border?ROAD_BORDER_WIDTH*2:0)}" stroke-linecap="square"/>`;
for(const o of world.objects.state.objects){if(o.kind==='tree')svg+=`<circle cx="${o.x}" cy="${o.z}" r="${o.w/2}" fill="#6e905b" opacity=".65"/>`;else if(o.kind==='building')svg+=`<rect x="${o.x-o.w/2}" y="${o.z-o.d/2}" width="${o.w}" height="${o.d}" fill="#7c8473" stroke="#596451" stroke-width=".2"/>`;}
for(const o of [...world.gardens,...world.circularSites])svg+=`<circle cx="${o.x}" cy="${o.z}" r="${o.r}" fill="none" stroke="#f8f1d6" stroke-width=".6"/><text x="${o.x}" y="${o.z}" text-anchor="middle" font-family="sans-serif" font-size="2">${o.id}</text>`;
for(const p of props)svg+=`<circle cx="${p.x}" cy="${p.z}" r="${p.name==='Street lantern'?.3:.6}" fill="${p.name==='Street lantern'?'#fff7bd':p.name==='Telephone box'?'#b33829':'#705a3b'}"/>`;
svg+='</svg>';writeFileSync(join(tmpdir(),'rpg-city-audit.svg'),svg);
process.exitCode=failures.length?1:0;
