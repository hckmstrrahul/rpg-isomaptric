import type {WorldPlan} from '../types.ts';
import type {Road,PlanPoint} from '../../cityPlan.ts';
import type {Landmark} from '../../layout.ts';

/** Entirely fictional bonus world. These are designed habitats, not real lunar sites. */
export const FICTIONAL=true;
const p=(x:number,z:number)=>({x,z});
export const MOON_LANDMARKS:Landmark[]=[
 {id:'lunar-habitat',name:'Lunar Habitat',short:'Habitat',x:0,z:0,height:20,visitX:0,visitZ:24,description:'Fictional bonus: a rounded pressure habitat and control tower. No real lunar settlement is represented.'},
 {id:'launch-pad',name:'Launch Pad',short:'Launch Pad',x:56,z:-24,height:19,visitX:39,visitZ:-24,description:'Fictional reusable lander on an engineered landing apron.'},
 {id:'lunar-observatory',name:'Lunar Observatory',short:'Observatory',x:-58,z:-25,height:10,visitX:-41,visitZ:-25,description:'Fictional robotic observatory with a slit dome and instrument platform.'},
 {id:'greenhouse',name:'Sealed Greenhouse',short:'Greenhouse',x:-53,z:42,height:7,visitX:-35,visitZ:42,description:'Fictional pressurized greenhouses contain the only trees and plants outside the central habitat.'},
 {id:'lander-pad',name:'Expedition Lander',short:'Lander',x:55,z:55,height:8,visitX:38,visitZ:55,description:'Fictional exploration craft with a compact cabin, landing legs and instrument wings.'},
 {id:'solar-farm',name:'Solar Array',short:'Solar Array',x:-17,z:-68,height:5,visitX:-17,visitZ:-52,description:'Fictional power farm: tilted photovoltaic wings and sheltered electrical enclosures.'},
 {id:'communications',name:'Communications Array',short:'Comms',x:60,z:-72,height:13,visitX:42,visitZ:-67,description:'Fictional antennas and steerable dishes link the outpost to distant missions.'},
 {id:'rover-bay',name:'Rover Workshop',short:'Rover Bay',x:-5,z:65,height:7,visitX:-5,visitZ:51,description:'Fictional pressure workshop and six-wheel survey rovers.'},
];
export const SERVICE_PATHS:Road[]=[
 {id:'habitat-loop',points:[p(-27,-24),p(27,-24),p(34,0),p(27,31),p(-27,31),p(-34,0),p(-27,-24)],size:'main',width:3.2},
 {id:'east-pad-link',points:[p(27,-24),p(39,-24),p(41,-24)],size:'small',width:2.7},
 {id:'observatory-link',points:[p(-27,-24),p(-41,-25),p(-44,-25)],size:'small',width:2.7},
 {id:'greenhouse-link',points:[p(-27,31),p(-35,42),p(-37,42)],size:'small',width:2.7},
 {id:'south-pad-link',points:[p(27,31),p(38,55),p(41,55)],size:'small',width:2.7},
 {id:'rover-link',points:[p(0,31),p(-5,51),p(-5,54)],size:'small',width:2.7},
 {id:'array-link',points:[p(-17,-24),p(-17,-52),p(-17,-57)],size:'small',width:2.7},
 {id:'comms-link',points:[p(27,-24),p(34,-47),p(42,-67),p(48,-67)],size:'small',width:2.7},
 {id:'habitat-entry',points:[p(0,31),p(0,24),p(0,17)],size:'small',width:3.2},
];
export const PADS=[{x:56,z:-24,r:15},{x:55,z:55,r:14}];
export const FLAT_SITES=[
 {x:0,z:0,w:49,d:42},{x:-58,z:-25,w:28,d:26},{x:-53,z:42,w:29,d:23},{x:-5,z:65,w:32,d:24},{x:-17,z:-68,w:42,d:24},{x:60,z:-72,w:28,d:25},
];
export const CRATERS=[
 {x:-74,z:-72,r:17,depth:3.4},{x:81,z:11,r:14,depth:2.7},{x:-67,z:84,r:11,depth:2.1},{x:11,z:89,r:8,depth:1.8},{x:24,z:-89,r:7,depth:1.6},
 {x:-86,z:-2,r:9,depth:2.2},{x:85,z:89,r:9,depth:2.1},{x:-25,z:94,r:5,depth:1.1},{x:-9,z:-99,r:5,depth:1.2},{x:85,z:-96,r:6,depth:1.4},
 {x:-95,z:51,r:6,depth:1.2},{x:22,z:59,r:5,depth:1.2},{x:-42,z:-5,r:4.5,depth:.9},{x:22,z:-51,r:4,depth:.8},{x:96,z:-49,r:6,depth:1.3},
];
export function pathDistance(x:number,z:number){let nearest=Infinity;for(const path of SERVICE_PATHS)for(let i=1;i<path.points.length;i++){const a=path.points[i-1],b=path.points[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));nearest=Math.min(nearest,Math.hypot(x-a.x-dx*t,z-a.z-dz*t)-path.width/2);}return nearest;}
export function siteDistance(x:number,z:number){return Math.min(...FLAT_SITES.map(p=>Math.max(Math.abs(x-p.x)-p.w/2,Math.abs(z-p.z)-p.d/2)),...PADS.map(p=>Math.hypot(x-p.x,z-p.z)-p.r));}
export function lunarHeight(x:number,z:number){
 const flat=Math.min(siteDistance(x,z),pathDistance(x,z)-.7),blend=Math.min(1,Math.max(0,flat/3));
 if(blend===0)return 1.35;
 let y=.1*Math.sin(x*.19)*Math.cos(z*.16)+.07*Math.sin((x+z)*.43);
 for(const c of CRATERS){const t=Math.hypot(x-c.x,z-c.z)/c.r;if(t<1)y-=c.depth*2.2*Math.pow(1-t*t,2);else if(t<1.34)y+=c.depth*.6*Math.pow(Math.sin((t-1)/.34*Math.PI),2);}
 return 1.35+y*blend*blend*(3-2*blend);
}
const LAND=[p(-106,-106),p(106,-106),p(106,106),p(-106,106),p(-106,-106)];
export const PLAN:WorldPlan={spawn:{x:0,z:24},landmarks:MOON_LANDMARKS,roads:()=>SERVICE_PATHS,landAt:(x,z,margin=0)=>Math.abs(x)<=106-margin&&Math.abs(z)<=106-margin,bridgeAt:()=>false,heightAt:lunarHeight,map:{extent:216,land:[LAND],gardens:[]},camera:{focus:[0,1.35,0],zoom:.85,offset:[90,100,120]},waterColor:'#0b1420',waterVisible:false,moonVisible:false};
