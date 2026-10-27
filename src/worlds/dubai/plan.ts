import type { Landmark } from '../../layout.ts';
import type { Road, PlanPoint } from '../../cityPlan.ts';

/** An artistic marina island composed from the supplied reference, not a surveyed Dubai map. */
export const DUBAI_SPAWN = { x: 20, z: 0 };
export const BAY = { x: -24, z: 10, rx: 36, rz: 34 };
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
export function bayPoint(a:number,margin=0) {return {x:BAY.x+Math.cos(a)*(BAY.rx+margin)*(1+.07*Math.sin(a*3)+.04*Math.cos(a*5)),z:BAY.z+Math.sin(a)*(BAY.rz+margin)};}
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
export function dubaiRoads():Road[] {
  const roads:Road[]=[];
  const add=(id:string,points:PlanPoint[],size:Road['size']='main',bridge=false)=>roads.push({id,points,size,width:size==='bridge'?4.7:size==='main'?4:3.2,bridge});
  add('coastal-boulevard',roundedRectangle(0,-1,178,176,13));
  // Dense skyline blocks behind the harbour, connected to the coastal circuit.
  for(const z of [-67,-44])add(`skyline-cross-${z}`,segment(-89,z,89,z),'small');
  // The curved harbour street replaces the old parallel straight road completely.
  const arc=Array.from({length:101},(_,i)=>{const a=-.6-(Math.PI*2-.6-.95)*i/100;return {x:BAY.x+Math.cos(a)*44,z:BAY.z+Math.sin(a)*42};});
  add('marina-crescent',[{x:36,z:-22},...arc,{x:36,z:47}]);
  for(const x of [-62,-10,42]){
    const z=x<=12.4?BAY.z-42*Math.sqrt(1-((x-BAY.x)/44)**2):x<36?-13.7+(x-12.3)*(-8.3/23.7):-22;
    add(`skyline-avenue-${x}`,segment(x,-89,x,z),'small');
  }
  add('east-skyline-link',segment(36,-22,89,-22));
  add('west-marina-link',segment(-89,10,-68,10),'small');
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
  {id:'spire',name:'Skyline Spire',short:'Skyline Spire',x:-23,z:-77,height:72,visitX:-23,visitZ:-67,description:'Silver setbacks and a slender illuminated crown above the marina district.'},
  {id:'petal',name:'Pearl Pavilion',short:'Pearl Pavilion',x:-72,z:59,height:18,visitX:-72,visitZ:76.5,description:'White petal roofs open toward the water above a circular waterfront gallery.'},
  {id:'conservatory',name:'Harbour Conservatory',short:'Harbour Conservatory',x:9,z:68,height:18,visitX:33,visitZ:70,description:'An oval glass garden beneath sweeping ivory ribs.'},
  {id:'sails',name:'Marina Arts Centre',short:'Marina Arts Centre',x:52,z:62,height:17,visitX:52,visitZ:75,description:'Sculptural sail roofs, warm galleries and shaded waterfront terraces.'},
  {id:'crescent',name:'Crescent Towers',short:'Crescent Towers',x:-50,z:-33,height:46,visitX:-50,visitZ:-20,description:'Curved blue glass towers facing the harbour promenade.'},
  {id:'gardens',name:'Coastal Palm Gardens',short:'Palm Gardens',x:-57,z:80,height:5,visitX:-57,visitZ:80,description:'Layered shrubs, flowering borders, palms and paths overlooking the sea.'},
  {id:'bridge',name:'Harbour Bridges',short:'Harbour Bridges',x:68,z:32,height:4,visitX:68,visitZ:32,description:'Three open spans connect the green island while launches pass safely beneath.'},
];
export type TowerPlot={x:number;z:number;w:number;d:number;h:number;style:number;landmark?:string};
export const TOWER_PLOTS:TowerPlot[]=[];
for(const [row,z] of [-77,-56,-33].entries())for(const [col,x] of [-76,-50,-23,3,29,53,77].entries()){
  const h=[27,43,64,51,39,55,32][col]+[5,-5,0][row];
  TOWER_PLOTS.push({x,z,w:col===0?8:col===6?9:11,d:row===2?12:11,h:row===0&&col===2?72:h,style:(row*3+col)%6,landmark:row===0&&col===2?'spire':row===2&&col===1?'crescent':undefined});
}
// Tall rear skyline stays readable; smaller secondary towers fill the eastern shore.
TOWER_PLOTS.push({x:43,z:-9,w:10,d:12,h:40,style:3},{x:77,z:12,w:10,d:11,h:28,style:1},{x:43,z:10,w:11,d:11,h:32,style:4});
for(const [row,z] of [-77,-56,-33].entries())for(const [col,x] of [-36,16,65].entries())TOWER_PLOTS.push({x,z,w:7.2,d:10,h:22+((row*7+col*11)%29),style:(row+col*2)%6});
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
