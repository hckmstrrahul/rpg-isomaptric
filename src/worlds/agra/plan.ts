import type {WorldPlan} from '../types.ts';
import type {PlanPoint,Road} from '../../cityPlan.ts';
import type {Landmark} from '../../layout.ts';

/** Agra · Taj riverfront, a focused 1.188 km district rather than an invented city.
 * North is -Z; one unit represents 5.5 m horizontally AND vertically. The Taj's
 * geographic anchor is 27.17515 N, 78.04212 E. This uniform local projection keeps
 * the real north/south relationships; houses/paths are a simplified artistic survey.
 * Sources (accessed 2026-10-28): tajmahal.gov.in/architecture.aspx,
 * tajmahal.gov.in/outlying-building.aspx, tajmahal.gov.in/taj-garden.aspx,
 * agra.nic.in/tourist-place/mehtab-bagh/, whc.unesco.org/en/list/252/.
 * Agra Fort lies outside this crop. There is no bridge by the Taj, no ring canal,
 * and no second mausoleum. Mehtab Bagh remains on the opposite bank. */
export const METRES_PER_UNIT=5.5;
export const TAJ={x:0,z:-9};
export const project=(latitude:number,longitude:number):PlanPoint=>({x:(longitude-78.04212)*111320*Math.cos(27.17515*Math.PI/180)/METRES_PER_UNIT,z:TAJ.z-(latitude-27.17515)*111320/METRES_PER_UNIT});
export const PRECINCT={west:-27.4,east:27.4,north:-22,south:74};
export const GARDEN={x:0,z:23,half:27.3,north:-2,south:49.5};
export const GATE={x:0,z:54};
export const MEHTAB={x:0,z:-78,half:25.5};
export const SOUTH_BANK:PlanPoint[]=[{x:-108,z:-63},{x:-88,z:-52},{x:-68,z:-41},{x:-48,z:-30},{x:-30,z:-23},{x:-10,z:-22},{x:10,z:-22},{x:30,z:-21},{x:50,z:-16},{x:68,z:-7},{x:84,z:4},{x:98,z:14},{x:108,z:18}];
export const NORTH_BANK:PlanPoint[]=[{x:-108,z:-94},{x:-88,z:-82},{x:-68,z:-69},{x:-48,z:-58},{x:-30,z:-49},{x:-10,z:-47},{x:10,z:-47},{x:30,z:-47},{x:50,z:-42},{x:68,z:-33},{x:84,z:-21},{x:98,z:-11},{x:108,z:-6}];
export const SOUTH_LAND=[...SOUTH_BANK,{x:108,z:108},{x:-108,z:108}];
export const NORTH_LAND=[{x:-108,z:-108},{x:108,z:-108},...NORTH_BANK.slice().reverse()];
export const RIVER=[...SOUTH_BANK,...NORTH_BANK.slice().reverse()];
function bankAt(points:PlanPoint[],x:number) {for(let i=1;i<points.length;i++)if(x<=points[i].x){const a=points[i-1],b=points[i],t=Math.max(0,(x-a.x)/(b.x-a.x));return a.z+(b.z-a.z)*t;}return points.at(-1)!.z;}
export const southBankAt=(x:number)=>bankAt(SOUTH_BANK,x);
export const northBankAt=(x:number)=>bankAt(NORTH_BANK,x);
export function agraLand(x:number,z:number,margin=0) {return Math.abs(x)<108-margin&&Math.abs(z)<108-margin&&(z>southBankAt(x)+margin||z<northBankAt(x)-margin);}
export function agraHeight(x:number,z:number) {
  // Only the historic marble podium rises above the district datum. Its real south
  // stair is a short walking ramp in collision, with matching rendered stair treads.
  const dz=z-TAJ.z;
  if(Math.abs(x)<8.8&&Math.abs(dz)<8.8)return 2.58;
  if(Math.abs(x)<1.5&&dz>=8.8&&dz<11.1)return 1.35+(11.1-dz)/2.3*1.23;
  return 1.35;
}
export const AGRA_LANDMARKS:Landmark[]=[
  {id:'taj',name:'Taj Mahal',short:'Taj Mahal',x:0,z:-9,height:13.4,visitX:0,visitZ:2.4,description:'One ivory-marble mausoleum on the Yamuna’s south bank, with a bulbous dome and four detached minarets.'},
  {id:'taj-mosque',name:'Taj Mahal Mosque',short:'Mosque',x:-23,z:-9,height:6.6,visitX:-18,visitZ:0,description:'The red-sandstone mosque stands west of the mausoleum, facing its matching eastern counterpart.'},
  {id:'jawab',name:'Jawab Guesthouse',short:'Jawab',x:23,z:-9,height:6.6,visitX:18,visitZ:0,description:'The eastern guesthouse balances the western mosque with three marble domes and red sandstone.'},
  {id:'charbagh',name:'Taj Charbagh',short:'Charbagh',x:-13,z:23,height:1,visitX:-14,visitZ:23,description:'Four garden quarters, divided by raised axial paths, preserve the complex’s formal symmetry.'},
  {id:'reflecting-pool',name:'Central Reflecting Pool',short:'Pool',x:0,z:23,height:1,visitX:4.1,visitZ:23,description:'The raised central water tank sits on the garden’s north–south axis, framing the view toward the Taj.'},
  {id:'great-gate',name:'Darwaza-i Rauza',short:'Great Gate',x:0,z:54,height:8.1,visitX:0,visitZ:61,description:'The great southern gateway marks the transition from the outer courtyard into the formal garden.'},
  {id:'jilaukhana',name:'Jilaukhana Forecourt',short:'Forecourt',x:0,z:66,height:2.2,visitX:9,visitZ:66,description:'The historic forecourt south of the Great Gate links the side entrances and Taj Ganj approach.'},
  {id:'taj-ganj',name:'Taj Ganj',short:'Taj Ganj',x:-38,z:82,height:4,visitX:-37,visitZ:73,description:'A dense low-rise quarter of shops, courtyards and roof terraces south and west of the Taj precinct.'},
];
const road=(id:string,points:number[][],size:'main'|'small'='small'):Road=>({id,points:points.map(([x,z])=>({x,z})),size,width:size==='main'?4:3.2});
/** Simplified modern approach corridors outside the pedestrian monument precinct. */
export function agraRoads():Road[] {return [
  road('taj-west-approach',[[-101,73],[-66,73],[-37,73],[-29,73]]),
  road('taj-ganj-west',[[-66,73],[-66,94],[-37,94],[-37,73]]),
  road('taj-ganj-south',[[-101,94],[-66,94],[-37,94],[0,94],[38,94],[71,94],[101,94]],'main'),
  road('taj-east-gate',[[29,66],[38,66],[38,94]]),
  road('eastern-approach',[[38,66],[71,66],[71,94]]),
  road('western-district',[[-101,49],[-87,49],[-87,73],[-87,94]]),
  road('east-nature-walk-road',[[71,66],[94,46],[101,32]]),
];}
export const TRAFFIC_LOOPS:PlanPoint[][]=[
  [[-66,73],[-37,73],[-37,94],[-66,94],[-66,73]],
  [[38,66],[71,66],[71,94],[38,94],[38,66]],
].map(loop=>loop.map(([x,z])=>({x,z})));
export const AGRA_PATHS:Road[]=[
  {id:'taj-axis',points:[{x:0,z:3},{x:0,z:74}],size:'small',width:4.7},
  {id:'charbagh-cross',points:[{x:-27,z:23},{x:27,z:23}],size:'small',width:3},
  {id:'forecourt-cross',points:[{x:-31,z:66},{x:38,z:66}],size:'small',width:4},
  {id:'terrace-approach',points:[{x:-26,z:1},{x:26,z:1}],size:'small',width:3},
  ...[-25.7,25.7].map((x,i)=>({id:`garden-side-${i}`,points:[{x,z:1},{x,z:50}],size:'small' as const,width:2.5})),
];
export const PLAN:WorldPlan={spawn:{x:0,z:64},landmarks:AGRA_LANDMARKS,roads:agraRoads,landAt:agraLand,bridgeAt:()=>false,heightAt:agraHeight,
  map:{extent:216,land:[SOUTH_LAND,NORTH_LAND],water:[RIVER],gardens:[{x:-13,z:23,r:12},{x:13,z:23,r:12},{x:MEHTAB.x,z:MEHTAB.z,r:24}]},
  camera:{focus:[0,1.35,7],zoom:1.15},waterColor:'#598e8a'};
