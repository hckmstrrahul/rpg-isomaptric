import * as T from 'three';
import {Builder,material,vec} from './geometry.ts';

type Pose='standing'|'seated';
const people=new Map<string,{geometry:T.BufferGeometry;material:T.Material}>();
const headGeometry=new T.SphereGeometry(1,8,6);
/** Small vertex-coloured figures shared by instanced visitors and boat crews. */
export function miniPersonResources(pose:Pose,variant=0){
 const style=((variant%4)+4)%4,key=`${pose}:${style}`;if(people.has(key))return people.get(key)!;
 const b=new Builder(),skin=['#be8f6b','#8e5d43','#d8b18a','#a87553'][style],shirt=['#536e8a','#ad6947','#d1ba88','#65837b'][style],trousers=['#3e4c55','#63534b','#485865','#4a5148'][style];
 const seated=pose==='seated',hip=seated?.07:.63,shoulder=hip+.37,head=hip+.60;
 b.box(0,hip,0,.26,.14,.19,trousers);b.box(0,hip+.26,0,.29,.36,.18,shirt);
 b.cylinder(0,hip+.49,0,.047,.10,skin,.047,6);
 b.add(headGeometry,material(skin),0,head,.015,.12,.145,.112);
 b.box(0,head-.015,.123,.045,.04,.04,skin);
 b.add(headGeometry,material(style===1?'#635044':'#423b35'),0,head+.052,-.025,.124,.105,.10);
 if(style%2===0){b.cylinder(0,head+.15,0,.145,.025,'#d5c7a0',.145,8);b.cylinder(0,head+.19,-.01,.104,.07,'#d5c7a0',.09,8);}
 for(const side of [-1,1]){
  const x=side*.085,knee=seated?vec(x,hip-.015,.22):vec(x,.34,side*.035),ankle=seated?vec(x,-.065,.24):vec(x,.07,-side*.035);
  b.beam(vec(x,hip,0),knee,.057,trousers,6);b.beam(knee,ankle,.048,trousers,6);
  b.box(ankle.x,ankle.y-.025,ankle.z+.035,.11,.065,.17,'#393b36');
  const elbow=seated?vec(side*.20,hip+.23,.13):vec(side*.19,hip+.19,side*.035),hand=seated?vec(side*.18,hip+.18,.26):vec(side*.19,hip-.015,side*.06);
  b.beam(vec(side*.16,shoulder,0),elbow,.052,shirt,6);b.beam(elbow,hand,.037,skin,6);
  b.add(headGeometry,material(skin),hand.x,hand.y,hand.z,.046,.052,.045);
 }
 if(style===1||style===3){b.box(0,hip+.27,-.13,.20,.26,.12,'#74644b');for(const side of[-1,1])b.box(side*.10,hip+.3,.105,.026,.29,.025,'#84785c');}
 const root=b.finish(),mesh=root.children[0] as T.Mesh<T.BufferGeometry,T.Material>;
 if(root.children.length!==1)throw new Error('Miniature figures must share one opaque draw batch');
 mesh.geometry.computeBoundingBox();const resource={geometry:mesh.geometry,material:mesh.material};people.set(key,resource);return resource;
}

const crews=new Map<number,T.BufferGeometry>();
/** Two seated adults, feet in the hull, with low oars; no per-frame crew work. */
export function addRiverboatPeople(root:T.Group,index:number){
 const style=index%4;
 if(!crews.has(style)){
  const b=new Builder();
  for(const [seat,z,yaw]of [[0,-.6,0],[1,0,Math.PI]] as const){const person=miniPersonResources('seated',style+seat);b.add(person.geometry,person.material,0,.32,z,.88,.88,.88,0,yaw);}
  for(const side of[-1,1]){b.beam(vec(side*.16,.54,-.37),vec(side*.86,.08,.14),.018,'#90724b',5);b.box(side*.86,.065,.14,.12,.035,.28,'#826444',side*.5);}
  const mesh=b.finish().children[0] as T.Mesh<T.BufferGeometry>;crews.set(style,mesh.geometry);
 }
 const resource=miniPersonResources('seated'),crew=new T.Mesh(crews.get(style)!,resource.material);crew.name='Riverboat rower and passenger';crew.userData.nonSolid=true;crew.raycast=()=>{};crew.castShadow=true;crew.receiveShadow=true;root.add(crew);return crew;
}
