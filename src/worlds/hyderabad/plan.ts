import type {WorldPlan} from '../types.ts';
import type {PlanPoint,Road} from '../../cityPlan.ts';
import type {Landmark} from '../../layout.ts';

/** A 1.08 km, north-up Old City crop (1 world unit = 5 m). This district has no
 * coast or river: the Musi is north of its bounds. The geodetic anchor is Charminar
 * at approximately 17.36157 N / 78.47466 E. Streets are simplified corridors, not
 * a navigation survey. Sources and deliberate scope limits are recorded in README. */
export const METRES_PER_UNIT=5;
export const CHARMINAR={x:0,z:-15},GULZAR={x:0,z:-51},MOSQUE={x:-24,z:12},PALACE={x:-60,z:65};
export const project=(lat:number,lon:number):PlanPoint=>({x:(lon-78.47466)*111320*Math.cos(17.36157*Math.PI/180)/5,z:-15-(lat-17.36157)*111320/5});
export const LAND=[{x:-108,z:-108},{x:108,z:-108},{x:108,z:108},{x:-108,z:108}];
export const KAMANS=[{x:0,z:-74,yaw:0},{x:0,z:-28,yaw:0},{x:-23,z:-51,yaw:Math.PI/2},{x:23,z:-51,yaw:Math.PI/2}];
export const HYDERABAD_LANDMARKS:Landmark[]=[
 {id:'charminar',name:'Charminar',short:'Charminar',x:0,z:-15,height:10.2,visitX:0,visitZ:-7,description:'Hyderabad’s four-minaret landmark has four great open arches, tiered balconies and a roof-level mosque, not a central Taj-style dome.'},
 {id:'mecca-masjid',name:'Mecca Masjid',short:'Mecca Masjid',x:-24,z:12,height:6.5,visitX:-9,visitZ:10,description:'The granite prayer hall stands southwest of Charminar, with five monumental front arches and two end towers.'},
 {id:'laad-bazaar',name:'Laad Bazaar',short:'Laad Bazaar',x:-43,z:-15,height:4,visitX:-44,visitZ:-15,description:'The historic bangle market runs west from Charminar through densely built shopfronts and terrace roofs.'},
 {id:'gulzar-houz',name:'Gulzar Houz',short:'Gulzar Houz',x:0,z:-51,height:1.1,visitX:5.5,visitZ:-51,description:'The fountain marks the center of the old Char Kaman square north of Charminar.'},
 {id:'char-kaman',name:'Char Kaman',short:'Char Kaman',x:0,z:-74,height:3.8,visitX:0,visitZ:-79,description:'Four distinct gateways frame the historic square around Gulzar Houz; they are separate from Charminar’s own four arches.'},
 {id:'chowmahalla',name:'Chowmahalla Palace',short:'Chowmahalla',x:-60,z:79,height:5,visitX:-60,visitZ:71,description:'The Nizams’ palace complex lies southwest of Charminar, with interconnected courts and four southern palaces.'},
 {id:'khilwat',name:'Khilwat Mubarak',short:'Khilwat',x:-60,z:57,height:6.4,visitX:-60,visitZ:48,description:'The ceremonial audience hall has a pale ochre stucco façade, slender arches and paired open rooftop pavilions.'},
 {id:'palace-clock',name:'Chowmahalla Clock Gate',short:'Clock Gate',x:-60,z:30,height:5.5,visitX:-60,visitZ:24,description:'The northern palace entrance and its clock lead into the court and cistern facing Khilwat Mubarak.'},
];
const road=(id:string,points:number[][],size:'small'|'main'='small'):Road=>({id,points:points.map(([x,z])=>({x,z})),size,width:size==='main'?4:3.2});
export function hyderabadRoads():Road[]{return [
 road('pathergatti-north',[[0,-103],[0,-82]],'main'),
 road('char-kaman-west',[[-99,-51],[-30,-51]]),road('char-kaman-east',[[30,-51],[99,-51]]),
 road('old-city-west',[[-88,-101],[-88,-51],[-88,-15],[-88,22],[-88,99]],'main'),
 road('old-city-east',[[58,-101],[58,-51],[58,-15],[58,28],[58,72],[58,99]],'main'),
 road('north-bazaar-cross',[[-88,-91],[0,-91],[58,-91],[99,-91]]),
 road('kotla-alijah-east',[[8,-15],[58,-15],[99,-15]]),
 road('southern-approach',[[0,-6],[0,28],[0,72],[0,99]],'main'),
 road('motigalli',[[-88,22],[-60,22],[-39,22],[-39,28],[0,28],[58,28],[99,28]]),
 road('khilwat-east',[[-36,28],[-36,72],[-36,99]]),
 road('southern-lanes',[[-88,99],[-36,99],[0,99],[58,99],[99,99]]),
 road('eastern-neighbourhood',[[0,72],[58,72],[99,72]]),
];}
export const PATHS:Road[]=[
 {id:'laad-bazaar',points:[{x:-88,z:-15},{x:-8,z:-15}],size:'small',width:5.6},
 {id:'charminar-square',points:[{x:0,z:-28},{x:0,z:-6}],size:'small',width:8.5},
 {id:'char-kaman-axis',points:[{x:0,z:-82},{x:0,z:-28}],size:'small',width:8},
 {id:'char-kaman-cross',points:[{x:-30,z:-51},{x:30,z:-51}],size:'small',width:8},
 {id:'palace-entry',points:[{x:-60,z:22},{x:-60,z:49}],size:'small',width:4},
];
export const TRAFFIC_LOOPS=[[[0,28],[58,28],[58,72],[0,72],[0,28]],[[-88,-91],[58,-91],[58,-51],[30,-51],[30,-82],[-30,-82],[-30,-51],[-88,-51],[-88,-91]]].slice(0,1).map(loop=>loop.map(([x,z])=>({x,z})));
export const PLAN:WorldPlan={spawn:{x:0,z:-6},landmarks:HYDERABAD_LANDMARKS,roads:hyderabadRoads,landAt:(x,z,margin=0)=>Math.abs(x)<108-margin&&Math.abs(z)<108-margin,bridgeAt:()=>false,heightAt:()=>1.35,
 map:{extent:216,land:[LAND],gardens:[{x:-60,z:40,r:12},{x:-60,z:79,r:13}]},camera:{focus:[-18,1.35,8],zoom:1.05},waterColor:'#8b9787',waterVisible:false};
