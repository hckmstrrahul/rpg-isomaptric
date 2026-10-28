import * as T from 'three';
import type {Obstacle} from '../../layout.ts';
import type {PlanPoint,Road} from '../../cityPlan.ts';
import {miniPersonResources} from '../../miniPeople.ts';
import {agraHeight} from './plan.ts';

const CROSSING={x:5.7,z:94},STEP=1/20;
type Door={home:T.Object3D;x:number;z:number;insideZ:number};
type Vehicle={object:{x:number;z:number;destroyed:boolean};model:{length:number}};
export class VisitorRoute {
  readonly lengths:number[]=[0];readonly length:number;readonly points:PlanPoint[];
  constructor(points:PlanPoint[]){this.points=points;for(let i=1;i<points.length;i++)this.lengths.push(this.lengths[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z));this.length=this.lengths.at(-1)!;}
  sample(distance:number){
    const d=T.MathUtils.clamp(distance,0,this.length);let i=1;while(i<this.lengths.length-1&&this.lengths[i]<d)i++;
    const a=this.points[i-1],b=this.points[i],length=this.lengths[i]-this.lengths[i-1],t=length?(d-this.lengths[i-1])/length:0;
    return {x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t,yaw:Math.atan2(b.x-a.x,b.z-a.z)};
  }
}
const points=(pairs:number[][])=>pairs.map(([x,z])=>({x,z}));
/** Routes start inside actual houses and follow their south-facing doorways,
 * a rear lane, one marked road crossing, the forecourt and the Great Gate. */
export function agraVisitorPlan(homes:T.Object3D[]) {
  const doors:Door[]=homes.filter(home=>home.userData.doorway&&home.position.z>98&&home.position.z<101&&Math.abs(home.position.x)<24).map(home=>({home,x:home.position.x,z:home.position.z+home.userData.doorway.z,insideZ:home.position.z+home.userData.doorway.insideZ}));
  const north=(side:number)=>points([[0,71],[0,62],[side*1.35,60.5],[side*1.35,42],[side*2.9,41.6],[side*2.9,34.4],[side*1.35,34],[side*1.35,16],[0,13.5]]);
  const branches:PlanPoint[][]=[];
  for(const side of [-1,1]){
    const path=north(side);
    branches.push([...path,...points([[side*18,13.5],[side*21,8]])]);
    branches.push([...path,...points([[side*20,13.5]])]);
    branches.push([...path,...points([[side*9,13.5]])]);
    branches.push([...path.slice(0,8)]);
    branches.push([...path.slice(0,5),...points([[side*2.9,38],[side*12,38]])]);
    branches.push([...path.slice(0,5),...points([[side*2.9,38],[side*24,38]])]);
    branches.push([...path.slice(0,3),...points([[side*1.35,49]])]);
    branches.push(points([[0,79],[side*16,79]]));
    branches.push(points([[0,79],[side*9,84]]));
  }
  const routes=branches.map((branch,i)=>{
    const door=doors[i%doors.length],home=[{x:door.x,z:door.insideZ},{x:door.x,z:door.z+.65},{x:door.x,z:105},{x:CROSSING.x,z:105},...points([[CROSSING.x,97],[CROSSING.x,90.8],[0,90.8],[0,79]])];
    const path=[...home,...branch].filter((point,index,array)=>!index||Math.hypot(point.x-array[index-1].x,point.z-array[index-1].z)>.01);
    return {door,route:new VisitorRoute(path)};
  });
  const corridors:Road[]=routes.map(({route},i)=>({id:`visitor-route-${i}`,size:'small',width:.8,points:route.points}));
  return {doors,routes,corridors,crossing:CROSSING};
}
type VisitorPlan=ReturnType<typeof agraVisitorPlan>;
type Visitor={route:VisitorRoute;door:Door;distance:number;station:number;dayDistance:number;group:number;member:number;speed:number;wait:number;scale:number;side:number;lane:number;heading:number;variant:number;slot:number;visible:boolean;moving:boolean;point:PlanPoint};

/** Four figure batches, a fixed 72-person population and a 20 Hz walking update.
 * Night reverses each visitor's existing route; visibility changes only where a
 * house wall occludes them. Repeated theme toggles never reset their positions. */
export class TajVisitors {
  readonly people:Visitor[]=[];readonly batches:T.InstancedMesh[]=[];
  readonly plan:VisitorPlan;private obstacles:Obstacle[];private vehicles:Vehicle[];
  private accumulator=0;private clock=0;private night=false;private reduced=false;private initialized=false;
  private readonly time={value:0};private readonly stride:T.InstancedBufferAttribute[]=[];
  private readonly matrix=new T.Matrix4();private readonly position=new T.Vector3();private readonly rotation=new T.Quaternion();private readonly scale=new T.Vector3();
  private readonly crossingObstacle:Obstacle={x:CROSSING.x,z:CROSSING.z,w:2.2,d:6.4};private crossingHeld=false;
  constructor(scene:T.Scene,plan:VisitorPlan,obstacles:Obstacle[],vehicles:Vehicle[]){
    this.plan=plan;this.obstacles=obstacles;this.vehicles=vehicles;
    const capacity=18;
    for(let variant=0;variant<4;variant++){
      const resources=miniPersonResources('standing',variant),geometry=resources.geometry.clone(),material=resources.material.clone();
      const motion=new T.InstancedBufferAttribute(new Float32Array(capacity*2),2);motion.setUsage(T.DynamicDrawUsage);geometry.setAttribute('visitorMotion',motion);this.stride.push(motion);
      material.onBeforeCompile=shader=>{
        shader.uniforms.visitorTime=this.time;
        shader.vertexShader='attribute vec2 visitorMotion; uniform float visitorTime;\n'+shader.vertexShader;
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          float stride=sin(visitorTime*5.4+visitorMotion.x+(position.x<0.?3.141593:0.))*visitorMotion.y;
          float leg=1.-smoothstep(.18,.59,position.y);transformed.z+=stride*.075*leg;
          transformed.y+=max(0.,stride)*.032*leg;`);
      };
      material.customProgramCacheKey=()=> 'agra-visitors-stride-v1';
      const batch=new T.InstancedMesh(geometry,material,capacity);batch.name=`Agra visitors · clothing ${variant+1}`;batch.instanceMatrix.setUsage(T.DynamicDrawUsage);batch.castShadow=true;batch.receiveShadow=true;batch.frustumCulled=false;batch.userData.nonSolid=true;batch.raycast=()=>{};this.batches.push(batch);scene.add(batch);
    }
    plan.routes.forEach(({door,route},group)=>{
      const count=[3,5,4,2,6,4][group%6];
      for(let member=0;member<count;member++){
        const distance=Math.max(2,route.length-[0,.58,1.42,2.03,2.86,3.57][member]*(.86+(group%4)*.09)),p=route.sample(distance);
        const side=[-.15,.13,-.03,.16,-.12,.05][member],index=this.people.length;
        this.people.push({route,door,distance,station:distance,dayDistance:distance,group,member,speed:.58+(group%4)*.045+member*.015,wait:4+(group*7+member*3)%15,scale:.69+(group+member)%5*.021,side,lane:side,heading:Math.atan2(-p.x,-5-p.z)+(member%3-1)*.17,variant:index%4,slot:Math.floor(index/4),visible:true,moving:false,point:{x:p.x+Math.cos(p.yaw)*side,z:p.z-Math.sin(p.yaw)*side}});
      }
    });this.render();
  }
  get indoorCount(){return this.people.filter(person=>!person.visible).length;}
  update(dt:number,night:boolean,reduced=false){
    // main applies the saved appearance before its first world render. Only that
    // first update initializes night residents indoors; later toggles walk normally.
    if(!this.initialized){
      this.initialized=true;this.night=night;
      if(night){for(const person of this.people){person.distance=0;person.point={x:person.door.x,z:person.door.insideZ};person.visible=false;person.wait=0;}this.render();}
    }
    if(night!==this.night){
      this.night=night;const departures=new Map<Door,number>();
      this.people.forEach(person=>{
        if(night)person.wait=(person.group%9)*.65+person.member*.38;
        else{const order=departures.get(person.door)??0;departures.set(person.door,order+1);person.wait=order*1.35+(this.plan.doors.indexOf(person.door)%3)*.7;}
      });
    }
    this.reduced=reduced;this.accumulator+=Math.min(.5,Math.max(0,dt));let stepped=false;
    while(this.accumulator>=STEP){this.accumulator-=STEP;this.step(STEP);stepped=true;}
    if(stepped)this.render();
  }
  private step(dt:number){
    this.clock+=dt;this.time.value=this.clock;let crossingOccupied=false;
    for(const person of this.people){
      person.moving=false;
      if(person.wait>0){person.wait-=dt;}else{
        let target=this.night?0:person.dayDistance;
        if(!this.night&&Math.abs(person.distance-target)<.04){
          // Retain a distinct viewing station for every member. A shared target
          // would collapse a family into overlapping figures after its first stroll.
          if(!this.reduced)person.dayDistance=person.station-.55+Math.sin(this.clock*.12+person.group)*.45;
          person.wait=5+(person.slot%5)*1.3;target=person.dayDistance;
        }
        const direction=Math.sign(target-person.distance),next=person.distance+direction*Math.min(Math.abs(target-person.distance),person.speed*dt),p=person.route.sample(next);
        const crossing=Math.abs(p.x-CROSSING.x)<1&&p.z>90.6&&p.z<97.3;
        const carNear=crossing&&!this.crossingHeld&&this.vehicles.some(car=>!car.object.destroyed&&Math.hypot(car.object.x-CROSSING.x,car.object.z-CROSSING.z)<12+car.model.length);
        const heading=p.yaw+(direction<0?Math.PI:0),sx=Math.sin(heading),sz=Math.cos(heading);
        let lane=person.side;
        if(!this.night&&person.distance<person.station-1.8){
          const resting=this.people.find(other=>{
            if(other===person||!other.visible||other.moving||other.distance<other.station-1.8)return false;
            const dx=other.point.x-person.point.x,dz=other.point.z-person.point.z,along=dx*sx+dz*sz;
            return along>-.25&&along<1.5&&Math.abs(dx*sz-dz*sx)<.6;
          });
          if(resting)lane=(resting.point.x-p.x)*Math.cos(p.yaw)-(resting.point.z-p.z)*Math.sin(p.yaw)>=0?-.54:.54;
        }
        person.lane+=T.MathUtils.clamp(lane-person.lane,-dt*.65,dt*.65);
        const following=direction!==0&&this.people.some(other=>{
          // Only queue in the same straight walking lane. Crossing/turning groups
          // must finish their turn before joining that queue, avoiding corner locks.
          if(other===person||!other.visible||Math.cos(other.heading-heading)<.92)return false;
          const dx=other.point.x-person.point.x,dz=other.point.z-person.point.z,along=dx*sx+dz*sz,across=Math.abs(dx*sz-dz*sx);
          return along>0&&along<.40&&across<.27;
        });
        if(!carNear&&!following){
          person.distance=next;person.moving=direction!==0;
          const goal=p.yaw+(direction<0?Math.PI:0),turn=T.MathUtils.euclideanModulo(goal-person.heading+Math.PI,Math.PI*2)-Math.PI;
          if(person.moving)person.heading+=turn*(1-Math.exp(-dt*8));
        }
      }
      // Keep rendering until the entire figure is behind the doorway plane. The
      // opaque wall performs the occlusion before the instance is parked indoors.
      const p=person.route.sample(person.distance),outside=person.distance>person.door.z-person.door.insideZ-.18;
      // Lane offsets taper away inside the doorway, keeping entry centered.
      const offset=person.lane*T.MathUtils.smoothstep(person.distance,.6,2);
      person.point.x=p.x+Math.cos(p.yaw)*offset;person.point.z=p.z-Math.sin(p.yaw)*offset;person.visible=outside;
      if(outside&&Math.abs(p.x-CROSSING.x)<1&&p.z>90.6&&p.z<97.3)crossingOccupied=true;
    }
    if(crossingOccupied&&!this.crossingHeld){this.obstacles.push(this.crossingObstacle);this.crossingHeld=true;}
    else if(!crossingOccupied&&this.crossingHeld){const index=this.obstacles.indexOf(this.crossingObstacle);if(index>=0)this.obstacles.splice(index,1);this.crossingHeld=false;}
  }
  private render(){
    for(const person of this.people){
      this.position.set(person.point.x,agraHeight(person.point.x,person.point.z)+.055,person.point.z);this.rotation.setFromAxisAngle(T.Object3D.DEFAULT_UP,person.heading);this.scale.setScalar(person.visible?person.scale:0);
      this.matrix.compose(this.position,this.rotation,this.scale);this.batches[person.variant].setMatrixAt(person.slot,this.matrix);
      this.stride[person.variant].setXY(person.slot,person.slot*1.71+person.variant*.9,!this.reduced&&person.moving?1:0);
    }
    this.batches.forEach((batch,i)=>{batch.instanceMatrix.needsUpdate=true;this.stride[i].needsUpdate=true;});
  }
}
