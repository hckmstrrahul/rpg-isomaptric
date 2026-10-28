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
export const BRIDGE={north:{x:60,z:-94},south:{x:72,z:91},towerNorth:-26,towerSouth:23,deck:10.2,top:26.5};
export const bridgeX=(z:number)=>BRIDGE.north.x+(BRIDGE.south.x-BRIDGE.north.x)*(z-BRIDGE.north.z)/(BRIDGE.south.z-BRIDGE.north.z);
export function lisbonBridge(x:number,z:number){return z>=BRIDGE.north.z&&z<=BRIDGE.south.z&&Math.abs(x-bridgeX(z))<3.15;}
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
export const PENA={x:-89,z:-101,radius:35};
export const hillStreetZ=(x:number)=>x< -103?-75:x< -80?-75-(x+103)*2/23:x< -59?-77-(x+80)*2/21:-79-(x+59)*.7/6;
const northBase=(x:number,z:number)=>1.35+6.1*smooth((shoreAt(x,NORTH_BANK)-z-20)/72)+1.2*Math.exp(-(((x+16)/30)**2)-(((z+75)/23)**2));
export const hillRoadGrade=(x:number)=>northBase(x,hillStreetZ(x));
// Shallow folds give residential streets Lisbon's rising/falling grain without
// perturbing the engineered hill bench, palace stairs or bridge approaches.
export function neighbourhoodRelief(x:number,z:number){
 const north=z<shoreAt(x,NORTH_BANK),coast=north?shoreAt(x,NORTH_BANK)-z:z-shoreAt(x,SOUTH_BANK),shoreFade=smooth((coast-15)/16),bridgeFade=smooth((Math.abs(x-bridgeX(z))-12)/16),penaFade=smooth((x+50)/12);
 const wave=north?1.05*Math.sin((x+12)/23)*Math.sin((z+42)/20)+.55*Math.cos((x-z)/31):.85*Math.sin((x+28)/27)*Math.sin((z-89)/19);
 return wave*shoreFade*bridgeFade*(north?penaFade:1);
}
function gradedTerrainHeight(x:number,z:number){
  const hill=12*(1-smooth((Math.hypot(x-PENA.x,(z-PENA.z)*1.08)-17)/18));
  if(z<shoreAt(x,NORTH_BANK)){
    const natural=northBase(x,z)+hill+neighbourhoodRelief(x,z);
    // An engineered bench passes the foot of the Sintra hill. The grading
    // also drives walking/traffic; the road no longer drapes over the mound.
    const endFade=smooth((x+126)/8)*(1-smooth((x+59)/12)),bench=(1-smooth((Math.abs(z-hillStreetZ(x))-4.2)/6))*endFade;
    return natural+(hillRoadGrade(x)-natural)*bench;
  }
  return 1.35+7.7*smooth((z-shoreAt(x,SOUTH_BANK))/25)+.85*Math.exp(-(((x-78)/22)**2)-(((z-62)/19)**2))+neighbourhoodRelief(x,z);
}
// One monotonic pedestrian stair flight with two small resting landings.
// Its level cross-sections and tread heights are shared by collision and mesh.
export const PALACE_APPROACH:Road={id:'pena-walking-approach',size:'small',width:1.7,points:[{x:-57,z:-82},{x:-79,z:-86.9}]};
const pa=PALACE_APPROACH.points[0],pb=PALACE_APPROACH.points[1],pdx=pb.x-pa.x,pdz=pb.z-pa.z;
export const PALACE_PATH_LENGTH=Math.hypot(pdx,pdz);
export const PALACE_LANDINGS=[{from:0,to:1.4},{from:PALACE_PATH_LENGTH/3-.6,to:PALACE_PATH_LENGTH/3+.6},{from:PALACE_PATH_LENGTH*2/3-.6,to:PALACE_PATH_LENGTH*2/3+.6}];
const pathStart=gradedTerrainHeight(pa.x,pa.z)+.18,pathTop=gradedTerrainHeight(PENA.x,PENA.z)+.205,pathRise=pathTop-pathStart,activeLength=PALACE_PATH_LENGTH-PALACE_LANDINGS.reduce((n,p)=>n+p.to-p.from,0),stepRise=pathRise/Math.ceil(pathRise/.16);
export function palacePathSection(x:number,z:number){const along=((x-pa.x)*pdx+(z-pa.z)*pdz)/PALACE_PATH_LENGTH,across=(-(x-pa.x)*pdz+(z-pa.z)*pdx)/PALACE_PATH_LENGTH;return{along,across};}
export function palaceRampHeight(along:number){const s=Math.max(0,Math.min(PALACE_PATH_LENGTH,along)),travel=s-PALACE_LANDINGS.reduce((n,p)=>n+Math.max(0,Math.min(p.to-p.from,s-p.from)),0);return pathStart+pathRise*travel/activeLength;}
export function palaceStepHeight(along:number){return Math.min(pathTop,pathStart+Math.ceil((palaceRampHeight(along)-pathStart)/stepRise-1e-7)*stepRise);}
export function palacePathWidth(along:number){return PALACE_LANDINGS.slice(1).some(p=>along>=p.from&&along<=p.to)?2.15:1.7;}
export const PALACE_TREADS=(()=>{const cuts=[0,PALACE_PATH_LENGTH,...PALACE_LANDINGS.flatMap(p=>[p.from,p.to])];for(let i=1;i<Math.ceil(pathRise/.16);i++){const target=pathStart+i*stepRise;let lo=0,hi=PALACE_PATH_LENGTH;for(let j=0;j<40;j++){const mid=(lo+hi)/2;if(palaceRampHeight(mid)<target)lo=mid;else hi=mid;}cuts.push((lo+hi)/2);}return cuts.sort((a,b)=>a-b).filter((v,i,all)=>i===0||v-all[i-1]>.00001).slice(1).map((end,i,all)=>{const start=i?all[i-1]:0,middle=(start+end)/2;return{start,end,height:palaceStepHeight(middle),width:palacePathWidth(middle)};});})();
export function landHeight(x:number,z:number){
 const natural=gradedTerrainHeight(x,z),p=palacePathSection(x,z);
 if(p.along<0||p.along>PALACE_PATH_LENGTH||Math.abs(p.across)>3.8)return natural;
 const edge=(1-smooth((Math.abs(p.across)-2.2)/1.6))*smooth(p.along/.8)*(1-smooth((p.along-PALACE_PATH_LENGTH+1.2)/1.2)),roadProtection=smooth((Math.abs(z-hillStreetZ(x))-2.2)/.65);
 return natural+(palaceRampHeight(p.along)-.65-natural)*edge*roadProtection;
}
export function bridgeHeight(z:number){const north=landHeight(BRIDGE.north.x,BRIDGE.north.z),south=landHeight(BRIDGE.south.x,BRIDGE.south.z);const deck=z<-39?north+(BRIDGE.deck-north)*smooth((z-BRIDGE.north.z)/(-39-BRIDGE.north.z)):z>47?BRIDGE.deck+(south-BRIDGE.deck)*smooth((z-47)/44):BRIDGE.deck;return lisbonLand(bridgeX(z),z)?Math.max(deck,landHeight(bridgeX(z),z)):deck;}
export const heightAt=(x:number,z:number)=>{const p=palacePathSection(x,z);if(p.along>=0&&p.along<=PALACE_PATH_LENGTH&&Math.abs(p.across)<=palacePathWidth(p.along)/2)return palaceStepHeight(p.along);return lisbonBridge(x,z)?bridgeHeight(z):landHeight(x,z);};
export function path(points:number[][]):PlanPoint[]{const out:PlanPoint[]=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/2));for(let j=0;j<n;j++)out.push({x:a[0]+(b[0]-a[0])*j/n,z:a[1]+(b[1]-a[1])*j/n});}out.push({x:points.at(-1)![0],z:points.at(-1)![1]});return out;}
const rawRoads:{id:string;p:number[][];size?:Road['size'];bridge?:boolean}[]=[
  // Existing street corridors continue through the miniature's cut edge;
  // terminal segments meet it squarely so their pavement stays on the slab.
  {id:'avenida-brasilia',p:[[-126,-3],[-103,-3],[-80,-13],[-59,-18],[-33,-21],[-8,-29],[17,-35],[39,-43]]},
  {id:'rua-junqueira',p:[[-126,-41],[-103,-41],[-80,-44],[-59,-46],[-33,-49],[-8,-53],[17,-58],[39,-65]]},
  {id:'ajuda-hills',p:[[-126,-75],[-103,-75],[-80,-77],[-59,-79],[-53,-79.7],[-33,-82],[-8,-85],[17,-88],[39,-91],[60,-94],[79,-97.5],[98,-101],[116,-106],[126,-106]],size:'small'},
  {id:'restelo-link',p:[[-80,-13],[-80,-44],[-80,-77]],size:'small'},
  {id:'belem-link',p:[[-33,-21],[-33,-49],[-33,-82]],size:'small'},
  {id:'junqueira-link',p:[[-8,-29],[-8,-53],[-8,-85]],size:'small'},
  {id:'alcantara-link',p:[[39,-43],[39,-65],[39,-91]],size:'small'},
  {id:'east-lisbon',p:[[98,-80],[98,-101],[98,-113]],size:'small'},
  {id:'alcantara-upper-loop',p:[[79,-97.5],[79,-80],[98,-80],[126,-80]],size:'small'},
  {id:'ponte-25-de-abril',p:[[60,-94],[72,91]],size:'bridge',bridge:true},
  {id:'ajuda-residential',p:[[-53,-113],[-8,-113],[39,-113],[98,-113],[126,-113]],size:'small'},
  {id:'ajuda-west-link',p:[[-53,-79.7],[-53,-100],[-53,-113]],size:'small'},
  {id:'ajuda-infill',p:[[-53,-104],[-8,-104],[39,-104]],size:'small'},
  {id:'ajuda-central-link',p:[[-8,-85],[-8,-113]],size:'small'},
  {id:'ajuda-east-link',p:[[39,-91],[39,-113]],size:'small'},
  {id:'almada-ridge',p:[[-126,100],[-100,100],[-65,96],[-27,91],[8,85],[43,81],[72,91],[99,93],[126,93]]},
  {id:'almada-viewpoint',p:[[43,81],[45,68],[60,62],[81,55],[99,51]],size:'small'},
  {id:'almada-east-link',p:[[99,51],[99,93],[99,113]],size:'small'},
  {id:'almada-residential',p:[[-126,113],[-100,113],[-27,113],[43,113],[99,113],[126,113]],size:'small'},
  {id:'almada-infill',p:[[-100,103],[-27,103],[43,103],[99,103]],size:'small'},
  {id:'almada-west-link',p:[[-100,100],[-100,113]],size:'small'},
  {id:'almada-central-link',p:[[-27,91],[-27,113]],size:'small'},
  {id:'almada-south-link',p:[[43,81],[43,113]],size:'small'},
];
export const lisbonRoads=():Road[]=>rawRoads.map(r=>({id:r.id,points:path(r.p),size:r.size??'main',width:r.size==='bridge'?4.7:r.id==='ajuda-hills'?2.8:r.size==='small'?2.6:3.2,bridge:r.bridge}));
export const TRAFFIC_LOOPS=[
  [[-80,-13],[-59,-18],[-33,-21],[-33,-49],[-59,-46],[-80,-44],[-80,-13]],
  [[-8,-29],[17,-35],[39,-43],[39,-65],[17,-58],[-8,-53],[-8,-29]],
  [[43,81],[45,68],[60,62],[81,55],[99,51],[99,93],[72,91],[43,81]],
  [[-8,-85],[17,-88],[39,-91],[39,-113],[-8,-113],[-8,-85]],
  [[79,-97.5],[98,-101],[98,-80],[79,-80],[79,-97.5]],
  [[-27,91],[8,85],[43,81],[43,113],[-27,113],[-27,91]],
  // One circulating itinerary serves both bridge directions; each bank loop
  // turns traffic naturally before it crosses the estuary again.
  [[60,-94],[72,91],[99,93],[99,51],[81,55],[60,62],[45,68],[43,81],[72,91],[60,-94],[39,-91],[39,-65],[17,-58],[-8,-53],[-8,-85],[17,-88],[39,-91],[60,-94]],
].map(p=>p.map(([x,z])=>({x,z})));
export const LANDMARKS:Landmark[]=[
  {id:'belem-tower',name:'Torre de Belém',short:'Belém Tower',...project(38.69158,-9.216),height:10,visitX:-87.5,visitZ:-4,description:'Manueline river fortress: a square tower above a low armed bastion.'},
  {id:'jeronimos',name:'Mosteiro dos Jerónimos',short:'Jerónimos',...project(38.6979,-9.2067),height:13,visitX:-49,visitZ:-24,description:'Belém’s limestone monastery, long arcaded wings and Manueline church.'},
  {id:'padrao',name:'Padrão dos Descobrimentos',short:'Padrão',...project(38.6936,-9.2057),height:12,visitX:-36,visitZ:-15,description:'The caravel-shaped monument faces the Tagus beside Praça do Império.'},
  {id:'maat',name:'MAAT · Belém waterfront',short:'MAAT',...project(38.6955,-9.1945),height:4.8,visitX:12,visitZ:-24,description:'AL_A’s low ceramic wave and the adjacent brick Central Tejo power station.'},
  {id:'ponte-25-abril',name:'Ponte 25 de Abril',short:'25 de Abril',x:bridgeX(0),z:0,height:27,visitX:bridgeX(0),visitZ:0,description:'Red road-and-rail suspension bridge spanning the Tagus to Almada.'},
  {id:'cristo-rei',name:'Santuário de Cristo Rei',short:'Cristo Rei',...project(38.6786,-9.1719),height:23,visitX:86,visitZ:54,description:'The open-armed monument overlooks Lisbon from the Almada bank.'},
  {id:'pena-palace',name:'Pena Palace · Sintra',short:'Pena Palace',x:PENA.x,z:PENA.z,height:20,visitX:-75,visitZ:-85,description:'A scenic Sintra excursion inset: the yellow-domed and red-towered Romantic palace on its wooded hill. Sintra lies outside this Lisbon district in reality.'},
];
export const waterfrontYaw=(x:number)=>-Math.atan2(shoreAt(x+4,NORTH_BANK)-shoreAt(x-4,NORTH_BANK),8);
export const SPAWN={x:14,z:-25};
export const GARDENS=[{x:-50,z:-13,r:5},{x:-20,z:-64,r:8},{x:86,z:64,r:9},{x:-92,z:-19,r:6}];
export const PLAN:WorldPlan={spawn:SPAWN,landmarks:LANDMARKS,roads:lisbonRoads,landAt:lisbonLand,bridgeAt:lisbonBridge,heightAt,map:{extent:252,land:LAND,gardens:GARDENS},camera:{focus:[0,3,0],zoom:.95,offset:[150,135,170]},waterColor:'#338e9c'};
