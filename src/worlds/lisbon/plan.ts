import type {WorldPlan} from '../types.ts';
import type {Landmark} from '../../layout.ts';
import type {PlanPoint,Road} from '../../cityPlan.ts';

// North-up geographic miniature of Belém–Alcântara and the facing Almada bank.
// Horizontal projection is uniform; structures/relief are exaggerated for play.
export const PROJECTION={latitude:38.691,longitude:-9.195,unitsPerMetre:.044};
export const project=(lat:number,lon:number):PlanPoint=>({x:(lon-PROJECTION.longitude)*111320*Math.cos(PROJECTION.latitude*Math.PI/180)*PROJECTION.unitsPerMetre,z:-(lat-PROJECTION.latitude)*111320*PROJECTION.unitsPerMetre});
export const CUT_HALF=126;
export const NORTH_BANK:PlanPoint[]=[[-126,15],[-108,13],[-90,11],[-76,5],[-61,0],[-49,-4],[-33,-7],[-17,-13],[0,-16],[17,-20],[34,-27],[52,-32],[71,-40],[90,-44],[108,-49],[126,-54]].map(([x,z])=>({x,z}));
export const SOUTH_BANK:PlanPoint[]=[[-126,89],[-108,82],[-89,75],[-69,69],[-49,62],[-29,56],[-10,51],[9,47],[27,42],[46,37],[62,34],[78,32],[94,28],[108,25],[126,21]].map(([x,z])=>({x,z}));
export const LAND=[ [{x:-126,z:-126},{x:126,z:-126},...NORTH_BANK.slice().reverse()], [...SOUTH_BANK,{x:126,z:126},{x:-126,z:126}] ];
export function shoreAt(x:number,bank:PlanPoint[]){const i=x>=bank.at(-1)!.x?bank.length-2:Math.max(0,bank.findIndex((p,j)=>j<bank.length-1&&x<=bank[j+1].x));const a=bank[i],b=bank[i+1];return a.z+(b.z-a.z)*(x-a.x)/(b.x-a.x);}
export function lisbonLand(x:number,z:number,margin=0){return Math.abs(x)<CUT_HALF-margin&&Math.abs(z)<CUT_HALF-margin&&(z<shoreAt(x,NORTH_BANK)-margin||z>shoreAt(x,SOUTH_BANK)+margin);}
export const BRIDGE={north:{x:60,z:-78},south:{x:72,z:91},towerNorth:-26,towerSouth:23,deck:10.2,top:26.5};
export const bridgeX=(z:number)=>BRIDGE.north.x+(BRIDGE.south.x-BRIDGE.north.x)*(z-BRIDGE.north.z)/(BRIDGE.south.z-BRIDGE.north.z);
export function lisbonBridge(x:number,z:number){return z>=BRIDGE.north.z&&z<=BRIDGE.south.z&&Math.abs(x-bridgeX(z))<3.15;}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export function landHeight(x:number,z:number){
  if(z<shoreAt(x,NORTH_BANK))return 1.35+6.1*smooth((shoreAt(x,NORTH_BANK)-z-20)/72)+1.2*Math.exp(-(((x+16)/30)**2)-(((z+75)/23)**2));
  return 1.35+7.7*smooth((z-shoreAt(x,SOUTH_BANK))/25)+.85*Math.exp(-(((x-78)/22)**2)-(((z-62)/19)**2));
}
export function bridgeHeight(z:number){const north=landHeight(BRIDGE.north.x,BRIDGE.north.z),south=landHeight(BRIDGE.south.x,BRIDGE.south.z);return z<-39?north+(BRIDGE.deck-north)*smooth((z+78)/39):z>47?BRIDGE.deck+(south-BRIDGE.deck)*smooth((z-47)/44):BRIDGE.deck;}
export const heightAt=(x:number,z:number)=>lisbonBridge(x,z)?bridgeHeight(z):landHeight(x,z);
export function path(points:number[][]):PlanPoint[]{const out:PlanPoint[]=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));for(let j=0;j<n;j++)out.push({x:a[0]+(b[0]-a[0])*j/n,z:a[1]+(b[1]-a[1])*j/n});}out.push({x:points.at(-1)![0],z:points.at(-1)![1]});return out;}
const rawRoads:{id:string;p:number[][];size?:Road['size'];bridge?:boolean}[]=[
  // Existing street corridors continue through the miniature's cut edge;
  // terminal segments meet it squarely so their pavement stays on the slab.
  {id:'avenida-brasilia',p:[[-126,-3],[-103,-3],[-80,-13],[-59,-18],[-33,-21],[-8,-29],[17,-35],[39,-43]]},
  {id:'rua-junqueira',p:[[-126,-41],[-103,-41],[-80,-44],[-59,-46],[-33,-49],[-8,-53],[17,-58],[39,-65]]},
  {id:'ajuda-hills',p:[[-126,-75],[-103,-75],[-80,-77],[-59,-79],[-33,-82],[-8,-85],[17,-88],[39,-91],[60,-94],[98,-101],[116,-106],[126,-106]],size:'small'},
  {id:'restelo-link',p:[[-80,-13],[-80,-44],[-80,-77]],size:'small'},
  {id:'belem-link',p:[[-33,-21],[-33,-49],[-33,-82]],size:'small'},
  {id:'junqueira-link',p:[[-8,-29],[-8,-53],[-8,-85]],size:'small'},
  {id:'alcantara-link',p:[[39,-43],[39,-65],[39,-91]],size:'small'},
  {id:'east-lisbon',p:[[98,-80],[98,-101]],size:'small'},
  {id:'ponte-25-de-abril',p:[[60,-78],[72,91]],size:'bridge',bridge:true},
  {id:'bridge-north-access',p:[[39,-65],[56,-69],[60,-78]],size:'small'},
  {id:'almada-ridge',p:[[-126,100],[-100,100],[-65,96],[-27,91],[8,85],[43,81],[72,91],[99,93],[126,93]]},
  {id:'almada-viewpoint',p:[[43,81],[45,68],[60,62],[81,55],[99,51]],size:'small'},
  {id:'almada-east-link',p:[[99,51],[99,93]],size:'small'},
];
export const lisbonRoads=():Road[]=>rawRoads.map(r=>({id:r.id,points:path(r.p),size:r.size??'main',width:r.size==='bridge'?4.7:r.size==='small'?3.2:4,bridge:r.bridge}));
export const TRAFFIC_LOOPS=[
  [[-80,-13],[-59,-18],[-33,-21],[-33,-49],[-59,-46],[-80,-44],[-80,-13]],
  [[-8,-29],[17,-35],[39,-43],[39,-65],[17,-58],[-8,-53],[-8,-29]],
  [[43,81],[45,68],[60,62],[81,55],[99,51],[99,93],[72,91],[43,81]],
].map(p=>p.map(([x,z])=>({x,z})));
export const LANDMARKS:Landmark[]=[
  {id:'belem-tower',name:'Torre de Belém',short:'Belém Tower',...project(38.69158,-9.216),height:10,visitX:-87.5,visitZ:-4,description:'Manueline river fortress: a square tower above a low armed bastion.'},
  {id:'jeronimos',name:'Mosteiro dos Jerónimos',short:'Jerónimos',...project(38.6979,-9.2067),height:13,visitX:-49,visitZ:-24,description:'Belém’s limestone monastery, long arcaded wings and Manueline church.'},
  {id:'padrao',name:'Padrão dos Descobrimentos',short:'Padrão',...project(38.6936,-9.2057),height:12,visitX:-36,visitZ:-15,description:'The caravel-shaped monument faces the Tagus beside Praça do Império.'},
  {id:'maat',name:'MAAT · Belém waterfront',short:'MAAT',...project(38.6955,-9.1945),height:4.8,visitX:12,visitZ:-24,description:'AL_A’s low ceramic wave and the adjacent brick Central Tejo power station.'},
  {id:'ponte-25-abril',name:'Ponte 25 de Abril',short:'25 de Abril',x:bridgeX(0),z:0,height:27,visitX:bridgeX(0),visitZ:0,description:'Red road-and-rail suspension bridge spanning the Tagus to Almada.'},
  {id:'cristo-rei',name:'Santuário de Cristo Rei',short:'Cristo Rei',...project(38.6786,-9.1719),height:23,visitX:86,visitZ:54,description:'The open-armed monument overlooks Lisbon from the Almada bank.'},
];
export const SPAWN={x:-24,z:-27};
export const GARDENS=[{x:-50,z:-13,r:5},{x:-20,z:-64,r:8},{x:86,z:64,r:9},{x:-92,z:-19,r:6}];
export const PLAN:WorldPlan={spawn:SPAWN,landmarks:LANDMARKS,roads:lisbonRoads,landAt:lisbonLand,bridgeAt:lisbonBridge,heightAt,map:{extent:252,land:LAND,gardens:GARDENS},camera:{focus:[0,3,0],zoom:.95,offset:[150,135,170]},waterColor:'#338e9c'};
