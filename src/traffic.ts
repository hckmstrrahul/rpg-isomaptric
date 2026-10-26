import * as T from 'three';
import { bank, BRIDGES, GROUND, bridgeLiftAt, PLAYER_SPAWN, LANDMARKS } from './layout.ts';
import { TRAFFIC_NORTH, ROAD_SOUTH } from './cityPlan.ts';
import { WorldObjects } from './interactables.ts';
import { createRoadVehicle, VEHICLE_TYPES } from './roadVehicles.ts';
import { createTrafficSignals, signalPhase } from './trafficSignals.ts';

export class RoadRoute {
  private curve=new T.CurvePath<T.Vector3>();
  private segmentEnds:number[]=[];
  private laneDistances:number[]=[0];
  private divisions=1;
  length=0;
  constructor(points:T.Vector3[]) {
    const corners=points.slice(0,-1);
    const turns=corners.map((p,i)=>{
      const before=corners[(i+corners.length-1)%corners.length],after=corners[(i+1)%corners.length];
      const incoming=p.clone().sub(before).normalize(),outgoing=after.clone().sub(p).normalize();
      const cut=Math.min(4.5,p.distanceTo(before)*.45,p.distanceTo(after)*.45);
      return {start:p.clone().addScaledVector(incoming,-cut),end:p.clone().addScaledVector(outgoing,cut),corner:p};
    });
    turns.forEach((turn,i)=>{
      // Exact tangent continuity: a quadratic corner joins both straight sections.
      this.curve.add(new T.QuadraticBezierCurve3(turn.start,turn.corner,turn.end));
      this.curve.add(new T.LineCurve3(turn.end,turns[(i+1)%turns.length].start));
    });
    this.segmentEnds=this.curve.getCurveLengths();
    this.divisions=Math.ceil(this.curve.getLength()/.03);
    let previous=this.centerSample(0).point;
    for(let i=1;i<=this.divisions;i++) {
      const point=this.centerSample(i/this.divisions).point;
      this.length+=previous.distanceTo(point);this.laneDistances.push(this.length);previous=point;
    }
  }
  private centerSample(t:number,lane=.85) {
    const distance=t*this.segmentEnds[this.segmentEnds.length-1];
    let low=0,high=this.segmentEnds.length-1;
    while(low<high){const mid=(low+high)>>1;if(this.segmentEnds[mid]<distance)low=mid+1;else high=mid;}
    const curve=this.curve.curves[low],start=low?this.segmentEnds[low-1]:0;
    const u=T.MathUtils.clamp((distance-start)/(this.segmentEnds[low]-start),0,1),local=curve.getUtoTmapping(u,0);
    const point=curve.getPoint(local);
    // Use the exact derivative, including the loop seam. A finite difference
    // across separate curves made the lateral lane offset wobble at their joins.
    const direction=curve instanceof T.QuadraticBezierCurve3
      ?curve.v1.clone().sub(curve.v0).multiplyScalar(1-local).addScaledVector(curve.v2.clone().sub(curve.v1),local).normalize()
      :(curve as T.LineCurve3).v2.clone().sub((curve as T.LineCurve3).v1).normalize();
    point.x-=direction.z*lane;point.z+=direction.x*lane;
    return {point,yaw:Math.atan2(direction.x,direction.z)};
  }
  sample(distance:number,lane=.85) {
    const d=T.MathUtils.euclideanModulo(distance,this.length);
    let low=0,high=this.laneDistances.length-1;
    while(high-low>1){const mid=(low+high)>>1;if(this.laneDistances[mid]<=d)low=mid;else high=mid;}
    const fraction=(d-this.laneDistances[low])/(this.laneDistances[high]-this.laneDistances[low]);
    // Parameterize the offset lane itself, so cars don't lurch through inner turns.
    return this.centerSample((low+fraction)/this.divisions,lane);
  }
}
function bankLoop(side:number) {
  const p:T.Vector3[]=[new T.Vector3(bank(TRAFFIC_NORTH,side,4.2),0,TRAFFIC_NORTH)];
  for(let z=TRAFFIC_NORTH+10;z<=ROAD_SOUTH-11;z+=2)p.push(new T.Vector3(bank(z,side,4.2),0,z));
  p.push(new T.Vector3(bank(ROAD_SOUTH,side,4.2),0,ROAD_SOUTH),new T.Vector3(side*102,0,ROAD_SOUTH),new T.Vector3(side*102,0,TRAFFIC_NORTH),p[0].clone());return p;
}
type Footprint={x:number;z:number;w:number;d:number;yaw:number};
function overlap(a:Footprint,b:Footprint) {
  const axes=(angle:number)=>[[Math.cos(angle),-Math.sin(angle)],[Math.sin(angle),Math.cos(angle)]];
  const aa=axes(a.yaw),bb=axes(b.yaw),dx=b.x-a.x,dz=b.z-a.z;
  return [...aa,...bb].every(([x,z])=>{
    const radius=(box:Footprint,axes:number[][])=>Math.abs(x*axes[0][0]+z*axes[0][1])*box.w/2+Math.abs(x*axes[1][0]+z*axes[1][1])*box.d/2;
    return Math.abs(dx*x+dz*z)<radius(a,aa)+radius(b,bb)+.06;
  });
}
function bridgeLoop(north:number,south:number) {
  const points:T.Vector3[]=[new T.Vector3(bank(north,-1,4.2),0,north)];
  for(let z=north+8;z<south-7;z+=2)points.push(new T.Vector3(bank(z,-1,4.2),0,z));
  points.push(new T.Vector3(bank(south,-1,4.2),0,south),new T.Vector3(bank(south,1,4.2),0,south));
  for(let z=south-8;z>north+7;z-=2)points.push(new T.Vector3(bank(z,1,4.2),0,z));
  points.push(new T.Vector3(bank(north,1,4.2),0,north),points[0].clone());return points;
}
export function createTraffic(scene:T.Scene,objects:WorldObjects) {
  const routes=[-1,1].flatMap(side=>{const p=bankLoop(side);return [new RoadRoute(p),new RoadRoute([...p].reverse())];});
  for(const [north,south] of [[-51,8],[8,48]]){const p=bridgeLoop(north,south);routes.push(new RoadRoute(p),new RoadRoute([...p].reverse()));}
  const signals=createTrafficSignals(scene);
  const parked:{x:number;z:number;length:number}[]=[{...PLAYER_SPAWN,length:4},...LANDMARKS.map(l=>({x:l.visitX,z:l.visitZ,length:3}))];
  const cars=routes.flatMap((route,index)=>Array.from({length:index<4?8:3},(_,i)=>{
    const kind=VEHICLE_TYPES[(i+index*2)%VEHICLE_TYPES.length];
    const model=createRoadVehicle(kind,['#ebe4cd','#263c42','#aa5941','#526f7b','#d3d7cd','#927d5e'][i%6]);
    let distance=route.length*(i+.31+index*.09)/(index<4?8:3);
    for(let n=0;n<200;n++) {
      const pose=route.sample(distance),p=pose.point;
      if(!signals.junctions.some(j=>Math.hypot(p.x-j.x,p.z-j.z)<10)&&!parked.some(o=>Math.hypot(p.x-o.x,p.z-o.z)<(model.length+o.length)/2+2.5))break;
      distance+=5;
    }
    const {point,yaw}=route.sample(distance);model.root.position.set(point.x,GROUND+.08+bridgeLiftAt(point.x,point.z),point.z);model.root.rotation.y=yaw;scene.add(model.root);parked.push({x:point.x,z:point.z,length:model.length});
    const obstacle={x:point.x,z:point.z,w:model.width,d:model.length};objects.obstacles.push(obstacle);
    const name=kind==='bus'?'London bus':kind==='car'?'City car':model.root.name;
    const object=objects.registerModel(model.root,name,'prop',[obstacle]);
    objects.moveModel(object,point.x,point.z,yaw,model.width,model.length);
    const speed=kind==='bus'?2.3:kind==='bike'?2.5:kind==='truck'?2.4:2.8+i*.035;
    return {model,object,kind,route,distance,speed,velocity:speed,steering:0,lane:.85,junction:null as number|null};
  }));
  const movingObstacles=new Map(cars.flatMap(car=>objects.models.get(car.object.id)!.obstacles.map(o=>[o,car] as const)));
  let previous=0,bypassOwner:number|null=null;
  const update=(time:number,player?:{x:number;z:number})=>{
    const dt=Math.max(0,Math.min(.1,time-previous));previous=time;signals.update(time);
    if(bypassOwner!==null){const owner=cars.find(c=>c.object.id===bypassOwner)!;const p=owner.model.root.position;
      if(!player||owner.object.destroyed||Math.hypot(p.x-player.x,p.z-player.z)>12)bypassOwner=null;
    }
    if(player&&bypassOwner===null) {
      const approaching=cars.filter(car=>{if(car.object.destroyed)return false;const pose=car.route.sample(car.distance),dx=player.x-pose.point.x,dz=player.z-pose.point.z,along=dx*Math.sin(pose.yaw)+dz*Math.cos(pose.yaw),across=Math.abs(dx*Math.cos(pose.yaw)-dz*Math.sin(pose.yaw));const center=car.route.sample(car.distance,0),lateral=-(player.x-center.point.x)*Math.cos(center.yaw)+(player.z-center.point.z)*Math.sin(center.yaw);return along>0&&along<10&&across<car.model.width/2+.65&&lateral+car.model.width/2+.72>2.1;});
      approaching.sort((a,b)=>a.model.root.position.distanceToSquared(new T.Vector3(player.x,a.model.root.position.y,player.z))-b.model.root.position.distanceToSquared(new T.Vector3(player.x,b.model.root.position.y,player.z)));
      if(approaching.length){const candidate=approaching[0],yaw=candidate.model.root.rotation.y;
        const center=candidate.route.sample(candidate.distance,0),across=-(player.x-center.point.x)*Math.cos(center.yaw)+(player.z-center.point.z)*Math.sin(center.yaw);
        const oncoming=across+candidate.model.width/2+.72>2.1&&cars.some(other=>other!==candidate&&!other.object.destroyed&&Math.cos(other.model.root.rotation.y-yaw)<-.4&&Math.hypot(other.object.x-player.x,other.object.z-player.z)<14);
        if(!oncoming)bypassOwner=candidate.object.id;
      }
    }
    for(const car of cars) {
      if(car.object.destroyed)continue;
      const current=car.route.sample(car.distance),lookAhead=car.route.sample(car.distance+3);
      const bend=Math.abs(Math.atan2(Math.sin(lookAhead.yaw-current.yaw),Math.cos(lookAhead.yaw-current.yaw)));
      let targetSpeed=car.speed*(1-.45*Math.min(1,bend/.9)),targetLane=.85;
      if(player) {
        const center=car.route.sample(car.distance,0),dx=player.x-center.point.x,dz=player.z-center.point.z;
        const along=dx*Math.sin(center.yaw)+dz*Math.cos(center.yaw),across=-dx*Math.cos(center.yaw)+dz*Math.sin(center.yaw);
        const passing=1-T.MathUtils.smoothstep(Math.abs(along),3.5,10);
        const outward=Math.max(1.35,across+car.model.width/2+.72);
        if(Math.abs(across)<2&&(outward<=2.1||bypassOwner===car.object.id)){const clearLane=outward<=2.1?outward:-1.35;targetLane=T.MathUtils.lerp(.85,clearLane,passing);}
      }
      const nextLane=T.MathUtils.damp(car.lane,targetLane,3,dt),preview=car.route.sample(car.distance,nextLane);
      const forward=new T.Vector2(Math.sin(preview.yaw),Math.cos(preview.yaw));
      // Headway applies across shared routes, not only vehicles in the same list.
      for(const other of cars) {
        if(other===car||other.object.destroyed)continue;
        const dx=other.model.root.position.x-preview.point.x,dz=other.model.root.position.z-preview.point.z;
        const along=dx*forward.x+dz*forward.y,across=Math.abs(dx*forward.y-dz*forward.x);
        const aligned=Math.cos(other.model.root.rotation.y-preview.yaw)>.6;
        if(aligned&&along>0&&across<(car.model.width+other.model.width)/2+.12) {
          const gap=along-(car.model.length+other.model.length)/2-.8;
          targetSpeed=Math.min(targetSpeed,Math.sqrt(Math.max(0,gap)*3));
        }
      }
      if(car.junction!==null) {
        const junction=signals.junctions[car.junction];
        if(Math.hypot(current.point.x-junction.x,current.point.z-junction.z)>9){if(junction.owner===car.object.id)junction.owner=null;car.junction=null;}
      }
      if(car.junction===null)for(const j of signals.junctions) {
        const dx=j.x-current.point.x,dz=j.z-current.point.z,along=dx*Math.sin(current.yaw)+dz*Math.cos(current.yaw),distance=Math.hypot(dx,dz);
        if(along<0||distance>13)continue;
        const axis=Math.abs(Math.sin(current.yaw))>.7?'across':'along';
        const green=signalPhase(time,j.index,axis)==='green';
        if(green&&(j.owner===null||j.owner===car.object.id)&&distance<9){j.owner=car.object.id;car.junction=j.index;break;}
        if(!green||j.owner!==null)targetSpeed=Math.min(targetSpeed,Math.sqrt(Math.max(0,distance-6-car.model.length/2)*3));
      }
      if(player&&bypassOwner!==null&&bypassOwner!==car.object.id&&car.junction===null) {
        const dx=player.x-current.point.x,dz=player.z-current.point.z,along=dx*Math.sin(current.yaw)+dz*Math.cos(current.yaw),across=Math.abs(dx*Math.cos(current.yaw)-dz*Math.sin(current.yaw));
        if(along>0&&along<23&&across<3.2)targetSpeed=Math.min(targetSpeed,Math.sqrt(Math.max(0,along-16-car.model.length/2)*3));
      }
      car.velocity=T.MathUtils.damp(car.velocity,targetSpeed,targetSpeed<car.velocity?7:2,dt);
      const advance=car.velocity*dt,next=car.route.sample(car.distance+advance,nextLane);
      const footprint={x:next.point.x,z:next.point.z,w:car.model.width,d:car.model.length,yaw:next.yaw};
      const playerAhead=player&&overlap(footprint,{x:player.x,z:player.z,w:1.05,d:1.05,yaw:0});
      const owned=objects.models.get(car.object.id)!.obstacles;
      const blockedAt=(footprint:Footprint)=>objects.obstacles.some(o=>{
        if(owned.includes(o)||Math.hypot(o.x-footprint.x,o.z-footprint.z)>car.model.length+Math.max(o.w,o.d))return false;
        const moving=movingObstacles.get(o);
        return overlap(footprint,moving?{x:o.x,z:o.z,w:moving.model.width,d:moving.model.length,yaw:moving.model.root.rotation.y}:{...o,yaw:0});
      });
      if(!playerAhead&&!blockedAt(footprint)){car.distance+=advance;car.lane=nextLane;}
      else {
        car.velocity=0;
        // A stopped car may finish its gradual lateral clearance before advancing.
        const lateral=car.route.sample(car.distance,nextLane),box={x:lateral.point.x,z:lateral.point.z,w:car.model.width,d:car.model.length,yaw:lateral.yaw};
        if(!blockedAt(box)&&(!player||!overlap(box,{x:player.x,z:player.z,w:1.05,d:1.05,yaw:0})))car.lane=nextLane;
      }
      const {point,yaw}=car.route.sample(car.distance,car.lane);
      const turn=Math.atan2(Math.sin(yaw-current.yaw),Math.cos(yaw-current.yaw));
      const steering=advance>.0001?Math.atan(car.model.length*.64*turn/advance):0;
      car.steering=T.MathUtils.damp(car.steering,T.MathUtils.clamp(steering,-.5,.5),8,dt);
      const binding=objects.models.get(car.object.id)!;binding.position.y=GROUND+.08+bridgeLiftAt(point.x,point.z);
      objects.moveModel(car.object,point.x,point.z,yaw,car.model.width,car.model.length);
      car.object.baseY=binding.position.y;car.model.animate(car.distance,car.steering);
    }
    for(const j of signals.junctions)if(j.owner!==null&&cars.find(c=>c.object.id===j.owner)?.object.destroyed)j.owner=null;
  };
  return {cars,routes,signals,update};
}
