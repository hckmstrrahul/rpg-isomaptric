import type {WorldPlan} from '../types.ts';
import type {Road,PlanPoint} from '../../cityPlan.ts';
import type {Landmark} from '../../layout.ts';

/** A north-up, compressed central Bengaluru district: west is -X, north is -Z.
 * This is an inland city cutaway, not an island. Road bends/plots are simplified
 * for the shared explorer scale; the named anchors keep their real relationships.
 */
export const DISTRICT={name:'Civic district · Cubbon Park',north:12.9830,south:12.9715,west:77.5862,east:77.5983};
export const LAND:PlanPoint[]=[{x:-106,z:-106},{x:106,z:-106},{x:106,z:106},{x:-106,z:106},{x:-106,z:-106}];
const p=(x:number,z:number)=>({x,z});
export const BENGALURU_LANDMARKS:Landmark[]=[
 {id:'vidhana-soudha',name:'Vidhana Soudha',short:'Vidhana Soudha',x:-45,z:-43,height:19,visitX:-17,visitZ:-43,description:'Karnataka’s granite legislature: a broad Neo-Dravidian building with a central dome, six smaller domes and twelve entrance columns.'},
 {id:'attara-kacheri',name:'Attara Kacheri',short:'High Court',x:15,z:-34,height:7.8,visitX:-1,visitZ:-34,description:'The red Graeco-Roman High Court faces Vidhana Soudha across Ambedkar Veedhi.'},
 {id:'vikasa-soudha',name:'Vikasa Soudha',short:'Vikasa Soudha',x:-48,z:14,height:9.5,visitX:-27,visitZ:13,description:'The newer government office building stands immediately south of Vidhana Soudha.'},
 {id:'cubbon-park',name:'Cubbon Park',short:'Cubbon Park',x:24,z:11,height:5.8,visitX:25,visitZ:6,description:'Sri Chamarajendra Park: broad shade trees, garden walks and open lawns in Bengaluru’s civic centre.'},
 {id:'central-library',name:'Seshadri Iyer Memorial Hall',short:'Central Library',x:-4,z:45,height:6.8,visitX:-4,visitZ:57,description:'The distinctive red library building sits among the trees and lawns of Cubbon Park.'},
 {id:'government-museum',name:'Government Museum',short:'Museum',x:58,z:47,height:7.5,visitX:72,visitZ:47,description:'The red museum building on Kasturba Road forms the eastern cultural edge of the park.'},
 {id:'ub-city',name:'UB City',short:'UB City',x:48,z:88,height:24,visitX:63,visitZ:81,description:'The contemporary office towers at the southern edge of this central Bengaluru district.'},
];
export const BUILDING_PLOTS=[
 {id:'vidhana-soudha',x:-45,z:-43,w:40,d:64},
 {id:'attara-kacheri',x:15,z:-34,w:23,d:46},
 {id:'vikasa-soudha',x:-48,z:14,w:27,d:37},
 {id:'central-library',x:-4,z:45,w:23,d:14},
 {id:'government-museum',x:58,z:47,w:16,d:24},
 {id:'ub-city',x:48,z:88,w:26,d:24},
];
// The ring turns on generous corners inside the slab; separate through-road
// branches continue to the cut edges instead of folding traffic into an acute V.
const ambedkar=[p(-9,-108),p(-9,-88),p(-9,-15),p(-13,-7),p(-24,18),p(-50,48),p(-78,55),p(-108,55)];
const north=[p(-9,-88),p(25,-88),p(73,-77),p(81,-45),p(88,-10),p(85,20)];
const kasturba=[p(85,20),p(80,53),p(72,75),p(65,101),p(65,108)];
const south=[p(-78,55),p(-78,63),p(-72,75),p(-35,88),p(0,101),p(65,101),p(108,94)];
const west=[p(-108,-88),p(-72,-88),p(-9,-88)];
export function bengaluruRoads():Road[]{return [
 {id:'ambedkar-veedhi',points:ambedkar,size:'main',width:4},
 {id:'raj-bhavan-queens',points:north,size:'main',width:4},
 {id:'kasturba-road',points:kasturba,size:'main',width:4},
 {id:'nrupathunga-vittal-mallya',points:south,size:'main',width:4},
 {id:'west-civic-approach',points:west,size:'main',width:4},
 {id:'west-civic-street',points:[p(-72,-88),p(-72,-7)],size:'main',width:4},
 {id:'civic-south-link',points:[p(-72,-7),p(-13,-7)],size:'main',width:4},
 {id:'cunningham-edge',points:[p(25,-88),p(28,-98),p(28,-108)],size:'small',width:3.2},
 {id:'kasturba-east-approach',points:[p(85,20),p(99,24),p(108,24)],size:'small',width:3.2},
];}
// One continuous circuit serves both the civic streets and park perimeter.
// Separate overlapping closed routes competed at their shared lane merge.
export const TRAFFIC_LOOP=[p(-72,-88),p(-9,-88),...north.slice(1),...kasturba.slice(1,-1),...south.slice(0,5).reverse(),p(-50,48),p(-24,18),p(-13,-7),p(-72,-7),p(-72,-88)];
export const TRAFFIC_LOOPS=[TRAFFIC_LOOP];
export const TRAFFIC_JUNCTIONS=[p(-9,-88),p(-72,-88),p(-13,-7),p(-72,-7),p(25,-88),p(85,20),p(65,101),p(-78,55)];
export const PARK_PATHS:Road[]=[
 {id:'court-to-park',points:[p(15,-8),p(15,1),p(25,6),p(34,18),p(36,32),p(21,48),p(8,58),p(-4,57)],width:1.7},
 {id:'central-spawn-walk',points:[p(-2,5),p(4,5),p(15,1)],width:1.7},
 {id:'library-axis',points:[p(-24,18),p(-10,22),p(-4,30),p(-4,36)],width:2},
 {id:'park-west-loop',points:[p(-4,30),p(7,20),p(15,1),p(36,-6),p(60,1),p(69,15),p(66,28),p(50,35),p(36,32)],width:1.5},
 {id:'museum-walk',points:[p(36,32),p(43,41),p(43,58),p(58,64),p(72,63),p(78,62)],width:1.7},
 {id:'library-garden',points:[p(-4,57),p(-20,58),p(-28,47),p(-26,32),p(-10,22)],width:1.4},
 {id:'southern-park-walk',points:[p(-20,58),p(-29,70),p(-9,79),p(14,75),p(29,61),p(43,58)],width:1.5},
 {id:'north-park-entry',points:[p(44,-84),p(48,-66),p(47,-44),p(54,-19),p(60,1)],width:1.6},
 {id:'east-park-entry',points:[p(69,15),p(85,20)],width:1.6},
].map(path=>({...path,size:'small' as const}));
export const GARDENS=[{x:25,z:11,r:16},{x:-4,z:63,r:10},{x:37,z:-58,r:9},{x:13,z:69,r:8}];
export const bengaluruLand=(x:number,z:number,margin=0)=>Math.abs(x)<=106-margin&&Math.abs(z)<=106-margin;
export const PLAN:WorldPlan={spawn:{x:4,z:5},landmarks:BENGALURU_LANDMARKS,roads:bengaluruRoads,landAt:bengaluruLand,bridgeAt:()=>false,heightAt:()=>1.35,map:{extent:216,land:[LAND],gardens:GARDENS},camera:{focus:[0,1.35,0],zoom:.85,offset:[90,100,120]},waterColor:'#386d78',waterVisible:false};
