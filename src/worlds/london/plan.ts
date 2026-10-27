import type {WorldPlan} from '../types.ts';
import type {Landmark} from '../../layout.ts';
import type {Road,RoadSize,PlanPoint} from '../../cityPlan.ts';
import {TERRAIN_OUTLINE} from '../../boundary.ts';
const HALF=108,GROUND=1.35,BRIDGE_LIFT=.4;
const ROAD_WIDTHS={bridge:4.7,main:4,small:3.2};
export const BRIDGES = [-51, 8, 48];
export const RIVER_END = HALF;
export const riverCenter = (z: number) => {
  const t = Math.max(0, Math.min(1, (z - 35) / 70));
  return 4 + 13 * Math.sin((z + 55) / 32) - 6 * Math.sin(z / 67) + 40 * t * t * (3 - 2 * t);
};
export const riverWidth = (z: number) => 28 + 3.5 * Math.sin(z / 28);
export const bank = (z: number, side: number, margin = 0) => riverCenter(z) + side * (riverWidth(z) / 2 + margin);
const LONDON_LANDMARKS: Landmark[] = [
  { id: 'westminster', name: 'Palace of Westminster', short: 'Westminster', x: -44, z: 16, height: 22, visitX: -20, visitZ: 9, description: 'Honey-coloured stone, Gothic spires, and a clock that watches over the river.' },
  { id: 'eye', name: 'The London Eye', short: 'London Eye', x: -55, z: -68, height: 44, visitX: -46, visitZ: -60, description: 'A slow-turning wheel above the gardens. Take a little time to watch the city go by.' },
  { id: 'tower', name: 'Tower Bridge', short: 'Tower Bridge', x: riverCenter(48), z: 48, height: 23, visitX: riverCenter(48), visitZ: 48, description: 'Twin stone towers and blue suspension cables, with the whole river beneath your feet.' },
  { id: 'gherkin', name: 'The Gherkin', short: 'The Gherkin', x: 76, z: -34, height: 44, visitX: 66, visitZ: -26, description: 'A glass landmark wrapped in a spiralling lattice, rising above the eastern bank.' },
  { id: 'gardens', name: 'Riverside Gardens', short: 'Riverside Gardens', x: 55, z: 78, height: 2, visitX: 55, visitZ: 83, description: 'Concentric paths, clipped lawns, and a quiet pocket of green at the river’s edge.' },
  { id: 'abbey', name: 'Riverside Abbey', short: 'Riverside Abbey', x: 61, z: 26, height: 26, visitX: 44, visitZ: 26, description: 'Warm brick towers, pointed windows, and peaceful courtyards inspired by the reference.' },
  { id: 'dome', name: 'The Green Dome', short: 'Green Dome', x: -24, z: -28, height: 10, visitX: -27, visitZ: -8, description: 'A broad green dome with fine silver ribs, nestled in the curve of the river.' },
  { id: 'spire', name: 'The Garden Spire', short: 'Garden Spire', x: -85, z: -37, height: 28, visitX: -80, visitZ: -32, description: 'A slender copper-coloured tower tucked among the western gardens.' },
];

export const ROAD_NORTH=-96,ROAD_SOUTH=100,TRAFFIC_NORTH=-51;
export const GARDENS=[{id:'gardens',x:55,z:78,r:14.5},{id:'west-garden',x:-53,z:-29,r:9.5}];
export const CIRCULAR_SITES=[
  {id:'arena',x:-31,z:-68,r:11.6},{id:'dome',x:-24,z:-28,r:18.2},
  {id:'hall',x:50,z:-21,r:10.2},{id:'gherkin',x:76,z:-34,r:8.7},
  {id:'pool',x:64,z:-12,r:4.2},
];
export const FLOWER_BEDS=[{x:-61,z:-38},{x:-43,z:-40},{x:70,z:-20},{x:47,z:4}];
export function line(x1:number,z1:number,x2:number,z2:number) {
  const count=Math.ceil(Math.hypot(x2-x1,z2-z1)/2);
  return Array.from({length:count+1},(_,i)=>({x:x1+(x2-x1)*i/count,z:z1+(z2-z1)*i/count}));
}
function londonRoads():Road[] {
  const roads:Road[]=[];
  const add=(id:string,points:PlanPoint[],size:RoadSize,bridge=false)=>roads.push({id,points,size,width:ROAD_WIDTHS[size],bridge});
  for(const side of [-1,1]) {
    add(`bank-${side}`,Array.from({length:197},(_,i)=>({x:bank(ROAD_NORTH+i,side,4.2),z:ROAD_NORTH+i})),'main');
    add(`perimeter-${side}`,line(side*102,ROAD_NORTH,side*102,ROAD_SOUTH),'main');
    for(const z of [ROAD_NORTH,ROAD_SOUTH])add(`edge-${side}-${z}`,line(side*102,z,bank(z,side,4.2),z),'main');
    for(const z of side===-1?[-51,-5,48,88]:[-69,-51,-4,48])
      add(`cross-${side}-${z}`,line(side*102,z,bank(z,side,4.2),z),BRIDGES.includes(z)?'bridge':'small');
  }
  add('west-avenue',line(-72,ROAD_NORTH,-72,ROAD_SOUTH),'small');
  add('west-mews',line(-102,31,-72,31),'small');
  add('west-south',line(-72,65,bank(65,-1,4.2),65),'small');
  add('east-avenue',line(90,ROAD_NORTH,90,ROAD_SOUTH),'small');
  add('garden-avenue',line(74,48,74,ROAD_SOUTH),'small');
  for(const z of BRIDGES)add(`bridge-${z}`,line(bank(z,-1,4.2),z,bank(z,1,4.2),z),'bridge',true);
  return roads;
}

const water=[...Array.from({length:217},(_,i)=>({x:bank(-108+i,-1),z:-108+i})),...Array.from({length:217},(_,i)=>({x:bank(108-i,1),z:108-i}))];
export const PLAN:WorldPlan={
 spawn:{x:0,z:8},landmarks:LONDON_LANDMARKS,roads:londonRoads,
 landAt:(x,z,margin=0)=>!(z<RIVER_END&&Math.abs(x-riverCenter(z))<riverWidth(z)/2+margin),
 bridgeAt:(x,z)=>BRIDGES.some(bz=>Math.abs(z-bz)<3.4&&Math.abs(x-riverCenter(bz))<riverWidth(bz)/2+4.2),
 heightAt:(x,z)=>{const bz=BRIDGES.find(b=>Math.abs(z-b)<3.4);return GROUND+(bz===undefined?0:BRIDGE_LIFT*Math.max(0,Math.min(1,(riverWidth(bz)/2+4.2-Math.abs(x-riverCenter(bz)))/4.2)));},
 map:{extent:216,land:[TERRAIN_OUTLINE],water:[water],gardens:GARDENS},camera:{focus:[0,2,0],zoom:1},waterColor:'#087e8c',
 circularSites:CIRCULAR_SITES,flowerBeds:FLOWER_BEDS,londonRiver:{end:RIVER_END,bridges:BRIDGES,center:riverCenter,width:riverWidth},
};
