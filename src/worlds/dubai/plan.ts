import type { Landmark } from '../../layout.ts';
import type { Road, PlanPoint } from '../../cityPlan.ts';

/** An artistic marina island composed from the supplied reference, not a surveyed Dubai map. */
export const DUBAI_SPAWN = { x: 20, z: 0 };
export const BAY = { x: -24, z: 10, rx: 34, rz: 34 };
export const MARINA_ROAD_RADIUS = BAY.rx + 8;
export const CHANNEL = { z: 32, halfWidth: 8 };
export const DUBAI_BRIDGES = [36, 68, 89];
export function ellipse(x:number,z:number,rx:number,rz:number,count=128):PlanPoint[] {
  return Array.from({length:count+1},(_,i)=>({x:x+Math.cos(i/count*Math.PI*2)*rx,z:z+Math.sin(i/count*Math.PI*2)*rz}));
}
export function roundedRectangle(x:number,z:number,w:number,d:number,r:number,steps=12):PlanPoint[] {
  const points:PlanPoint[]=[];
  for(const [cx,cz,start] of [[x+w/2-r,z-d/2+r,-Math.PI/2],[x+w/2-r,z+d/2-r,0],[x-w/2+r,z+d/2-r,Math.PI/2],[x-w/2+r,z-d/2+r,Math.PI]])
    for(let i=0;i<=steps;i++){const a=start+i/steps*Math.PI/2;points.push({x:cx+Math.cos(a)*r,z:cz+Math.sin(a)*r});}
  points.push({...points[0]});return points;
}
export const ISLAND = roundedRectangle(0,0,198,194,17);
export function bayPoint(a:number,margin=0) {return {x:BAY.x+Math.cos(a)*(BAY.rx+margin),z:BAY.z+Math.sin(a)*(BAY.rz+margin)};}
export const BAY_OUTLINE = Array.from({length:161},(_,i)=>bayPoint(i/160*Math.PI*2));
export function insidePolygon(x:number,z:number,points:PlanPoint[]) {
  let inside=false;
  for(let i=0,j=points.length-1;i<points.length;j=i++){
    const a=points[i],b=points[j];
    if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
  }
  return inside;
}
export function dubaiLand(x:number,z:number,margin=0) {
  const dry=(px:number,pz:number)=>insidePolygon(px,pz,ISLAND)
    && !insidePolygon(px,pz,BAY_OUTLINE)
    && !(px>BAY.x&&Math.abs(pz-CHANNEL.z)<CHANNEL.halfWidth);
  if(!dry(x,z))return false;
  return !margin||[[margin,0],[-margin,0],[0,margin],[0,-margin],[margin*.707,margin*.707],[-margin*.707,margin*.707],[margin*.707,-margin*.707],[-margin*.707,-margin*.707]].every(([dx,dz])=>dry(x+dx,z+dz));
}
export function dubaiBridge(x:number,z:number) {
  return DUBAI_BRIDGES.some(bx=>Math.abs(x-bx)<3.4&&Math.abs(z-CHANNEL.z)<CHANNEL.halfWidth+4.2);
}
export function dubaiBridgeLift(x:number,z:number) {
  if(!dubaiBridge(x,z))return 0;
  return .4*Math.max(0,Math.min(1,(CHANNEL.halfWidth+4.2-Math.abs(z-CHANNEL.z))/4.2));
}
const segment=(x1:number,z1:number,x2:number,z2:number)=>{
  const n=Math.max(1,Math.ceil(Math.hypot(x2-x1,z2-z1)/2));
  return Array.from({length:n+1},(_,i)=>({x:x1+(x2-x1)*i/n,z:z1+(z2-z1)*i/n}));
};
function bezier(a:PlanPoint,b:PlanPoint,c:PlanPoint,d:PlanPoint,count=24) {
  return Array.from({length:count+1},(_,i)=>{const t=i/count,s=1-t;return {x:s*s*s*a.x+3*s*s*t*b.x+3*s*t*t*c.x+t*t*t*d.x,z:s*s*s*a.z+3*s*s*t*b.z+3*s*t*t*c.z+t*t*t*d.z};});
}
const arcStart=bayPoint(-.6,8),arcEnd=bayPoint(-Math.PI*1.5,8);
export const MARINA_CRESCENT=[
  ...bezier({x:36,z:12},{x:25,z:12},{x:arcStart.x+7,z:arcStart.z+10},arcStart),
  ...Array.from({length:121},(_,i)=>bayPoint(-.6+(-Math.PI*1.5+.6)*(i+1)/121,8)),
  ...bezier(arcEnd,{x:-4,z:52},{x:16,z:47},{x:36,z:47}).slice(1),
];
// One continuous promenade, connected at both channel-bank roads and at the spawn.
const quayRadius=BAY.rx+2.5,quayUpper=Math.asin((CHANNEL.z-CHANNEL.halfWidth-2.5-BAY.z)/quayRadius),quayLower=Math.asin((CHANNEL.z+CHANNEL.halfWidth+2.5-BAY.z)/quayRadius)-Math.PI*2;
export const MARINA_PROMENADE=[{x:89,z:21.5},...Array.from({length:181},(_,i)=>bayPoint(quayUpper+(quayLower-quayUpper)*i/180,2.5)),{x:89,z:42.5}];
export const DUBAI_PATHS:Road[]=[
  {id:'marina-promenade',points:MARINA_PROMENADE,width:1.8,size:'small'},
  {id:'marina-arrival-path',points:segment(BAY.x+Math.sqrt(quayRadius**2-BAY.z**2),0,36,0),width:1.8,size:'small'},
];
export function dubaiRoads():Road[] {
  const roads:Road[]=[];
  const add=(id:string,points:PlanPoint[],size:Road['size']='main',bridge=false)=>roads.push({id,points,size,width:size==='bridge'?4.7:size==='main'?4:3.2,bridge});
  add('coastal-boulevard',roundedRectangle(0,-1,178,176,13));
  // Dense skyline blocks behind the harbour, connected to the coastal circuit.
  for(const z of [-67,-44])add(`skyline-cross-${z}`,segment(-89,z,89,z),'small');
  // The curved harbour street replaces the old parallel straight road completely.
  add('marina-crescent',MARINA_CRESCENT);
  for(const x of [-62,-10,42]){
    const z=x<18?BAY.z-Math.sqrt(MARINA_ROAD_RADIUS**2-(x-BAY.x)**2):-22;
    add(`skyline-avenue-${x}`,segment(x,-89,x,z),'small');
  }
  add('east-skyline-link',segment(36,-22,89,-22));
  add('west-marina-link',segment(-89,10,BAY.x-MARINA_ROAD_RADIUS,10),'small');
  add('south-garden-link',segment(-24,52,-24,87),'small');
  add('east-garden-boulevard',segment(68,-22,68,75));
  add('south-waterfront',segment(36,75,89,75),'small');
  add('marina-bridge-approach',segment(36,-22,36,75));
  for(const x of DUBAI_BRIDGES)add(`harbour-bridge-${x}`,segment(x,19.8,x,44.2),'bridge',true);
  add('east-waterfront-link',segment(36,47,89,47),'small');
  return roads;
}
export const DUBAI_GARDENS=[{id:'coastal-gardens',x:-57,z:80,r:7},{id:'palm-gardens',x:75,z:-8,r:9},{id:'south-gardens',x:12,z:84,r:7}];
export const DUBAI_LANDMARKS:Landmark[]=[
  {id:'marina',name:'Dubai Marina',short:'Dubai Marina',x:20,z:0,height:4,visitX:20,visitZ:0,description:'A sheltered turquoise harbour, yachts and a skyline of glass.'},
  {id:'spire',name:'Burj Khalifa',short:'Burj Khalifa',x:-23,z:-77,height:108,visitX:-23,visitZ:-67,description:'Dubai’s tallest landmark, with three wings, spiralling setbacks and a telescoping spire.'},
  {id:'petal',name:'Pearl Pavilion',short:'Pearl Pavilion',x:-72,z:59,height:18,visitX:-72,visitZ:76.5,description:'White petal roofs open toward the water above a circular waterfront gallery.'},
  {id:'conservatory',name:'Harbour Conservatory',short:'Harbour Conservatory',x:9,z:68,height:18,visitX:33,visitZ:70,description:'An oval glass garden beneath sweeping ivory ribs.'},
  {id:'sails',name:'Museum of the Future',short:'Museum of the Future',x:52,z:62,height:19,visitX:52,visitZ:75,description:'A silver oval, calligraphic glazing and an open central void rising from a planted mound.'},
  {id:'crescent',name:'Cayan Tower',short:'Cayan Tower',x:-50,z:-35.5,height:43,visitX:-50,visitZ:-20,description:'A sculptural residential tower turning through a full quarter rotation above the marina.'},
  {id:'burj-al-arab',name:'Burj Al Arab',short:'Burj Al Arab',x:-78,z:25,height:46,visitX:-78,visitZ:40,description:'A white sail above the coast, with blue glazing, an exposed frame and a cantilevered helipad.'},
  {id:'gardens',name:'Coastal Palm Gardens',short:'Palm Gardens',x:-57,z:80,height:5,visitX:-57,visitZ:80,description:'Layered shrubs, planted borders, palms and paths overlooking the sea.'},
  {id:'bridge',name:'Harbour Bridges',short:'Harbour Bridges',x:68,z:32,height:4,visitX:68,visitZ:32,description:'Three open spans connect the green island while launches pass safely beneath.'},
];
export type TowerPlot={x:number;z:number;w:number;d:number;h:number;style:number;landmark?:string;design?:'burj'|'cayan'|'emirates'|'index';name?:string};
export const TOWER_PLOTS:TowerPlot[]=[];
for(const [row,z] of [-77,-56,-33].entries())for(const [col,x] of [-76,-50,-23,3,29,53,77].entries()){
  const h=[27,43,64,51,39,55,32][col]+[5,-5,0][row];
  TOWER_PLOTS.push({x,z,w:col===0?8:col===6?9:11,d:row===2?12:11,h:row===0&&col===2?72:h,style:(row*3+col)%6,landmark:row===0&&col===2?'spire':row===2&&col===1?'crescent':undefined});
}
// Tall rear skyline stays readable; smaller secondary towers fill the eastern shore.
TOWER_PLOTS.push({x:43,z:-9,w:10,d:12,h:40,style:3},{x:77,z:12,w:10,d:11,h:28,style:1},{x:43,z:10,w:11,d:11,h:32,style:4});
for(const [row,z] of [-77,-56,-33].entries())for(const [col,x] of [-36,16,65].entries())TOWER_PLOTS.push({x,z,w:7.2,d:10,h:22+((row*7+col*11)%29),style:(row+col*2)%6});
// Named silhouettes use the architects' defining forms, at a compressed diorama scale.
for(const plot of TOWER_PLOTS){
  if(plot.landmark==='spire')Object.assign(plot,{design:'burj',name:'Burj Khalifa',h:108});
  else if(plot.landmark==='crescent')Object.assign(plot,{design:'cayan',name:'Cayan Tower',h:43,z:-35.5,w:8.8,d:8.8});
  else if(plot.x===3&&plot.z===-77)Object.assign(plot,{design:'emirates',name:'Emirates Office Tower',h:49});
  else if(plot.x===16&&plot.z===-77)Object.assign(plot,{design:'emirates',name:'Jumeirah Emirates Tower',h:43});
  else if(plot.x===53&&plot.z===-56)Object.assign(plot,{design:'index',name:'Index Tower',h:46});
  else plot.h=Math.min(51,plot.h*.9);
}
export const DUBAI_TRAFFIC_LOOPS=[
  roundedRectangle(0,-1,178,176,13),
  [{x:-89,z:-67},{x:89,z:-67},{x:89,z:-44},{x:-89,z:-44},{x:-89,z:-67}],
  [{x:36,z:-22},{x:68,z:-22},{x:68,z:75},{x:36,z:75},{x:36,z:-22}],
];
// One concave coastline, including the open channel: triangulation and collision
// agree without overlapping holes or a hidden land cap across the harbour mouth.
const opening=ISLAND.findIndex(p=>p.x>98.9&&p.z>70);
const outerWalk=[...ISLAND.slice(opening,-1),...ISLAND.slice(0,opening)];
const upperAngle=Math.asin((CHANNEL.z-CHANNEL.halfWidth-BAY.z)/BAY.rz);
const lowerAngle=Math.asin((CHANNEL.z+CHANNEL.halfWidth-BAY.z)/BAY.rz)-Math.PI*2;
export const LAND_OUTLINE:PlanPoint[]=[{x:99,z:40},...outerWalk,{x:99,z:24},
  ...Array.from({length:161},(_,i)=>{const a=upperAngle+(lowerAngle-upperAngle)*i/160;return bayPoint(a);}),{x:99,z:40}];
