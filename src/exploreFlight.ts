import * as T from 'three';
import { GROUND, surfaceHeight } from './layout.ts';

export type FlightObstacle={x:number;z:number;w:number;d:number;height:number;baseY?:number;destroyed?:boolean;active?:boolean};
export type ExploreFlightFrame={position:T.Vector3;lean:number;impact:number;airborne:boolean;landed:boolean;progress:number;heading:number;zoomFactor:number};
const easeInOutSine=(t:number)=>(1-Math.cos(Math.PI*T.MathUtils.clamp(t,0,1)))/2;

/** Clearance is computed along the entire route, including narrow/tall buildings between endpoints. */
export function flightClearance(start:T.Vector3,end:T.Vector3,obstacles:FlightObstacle[],heightAt=surfaceHeight) {
  const distance=Math.hypot(end.x-start.x,end.z-start.z);
  let rise=Math.max(0,Math.min(14,Math.max(3,distance*.12))-Math.max(0,start.y-end.y)*.45);
  const dx=end.x-start.x,dz=end.z-start.z;
  for(const object of obstacles) {
    if(object.destroyed||object.active===false)continue;
    let near=0,far=1;
    for(const [origin,delta,min,max]of [[start.x,dx,object.x-object.w/2-.45,object.x+object.w/2+.45],[start.z,dz,object.z-object.d/2-.45,object.z+object.d/2+.45]]) {
      if(Math.abs(delta)<1e-8){if(origin<min||origin>max){near=2;break;}}
      else {const a=(min-origin)/delta,b=(max-origin)/delta;near=Math.max(near,Math.min(a,b));far=Math.min(far,Math.max(a,b));}
    }
    if(near<=far)for(const u of [near,far]) {
      if(u<=0||u>=1)continue;
      const baseline=T.MathUtils.lerp(start.y,end.y,u),roof=(object.baseY??GROUND)+object.height+2.5;
      rise=Math.max(rise,(roof-baseline)/(4*u*(1-u)));
    }
  }
  // Sampling the height field also clears hills that are not building obstacles.
  const samples=Math.max(8,Math.ceil(distance));
  for(let i=1;i<samples;i++){
    const u=i/samples,ground=heightAt(start.x+dx*u,start.z+dz*u)+.18;
    rise=Math.max(rise,(ground-T.MathUtils.lerp(start.y,end.y,u))/(4*u*(1-u)));
  }
  return rise;
}

/** A single eased projectile arc, with no stage boundaries, landing bounce or camera shake. */
export function createExploreFlight(from:T.Vector3,to:T.Vector3,obstacles:FlightObstacle[],reduced=false,initialLean=0,initialZoomFactor=1) {
  const start=from.clone(),destination=to.clone(),height=flightClearance(start,destination,obstacles);
  const distance=Math.hypot(destination.x-start.x,destination.z-start.z),heading=Math.atan2(destination.x-start.x,destination.z-start.z);
  const duration=.8+Math.min(.65,distance/160)+Math.min(.2,height/300);
  let elapsed=0,active=true,landed=false;
  return {
    destination,height,duration,
    get active(){return active;},setReduced(value:boolean){reduced=value;},
    tick(dt:number):ExploreFlightFrame|null {
      if(!active)return null;
      elapsed=reduced?duration:Math.min(duration,elapsed+Math.max(0,Math.min(.1,dt)));
      const progress=elapsed/duration,u=easeInOutSine(progress),position=start.clone().lerp(destination,u);
      if(!reduced)position.y+=4*height*u*(1-u);
      if(progress===1)position.copy(destination);
      const pose=T.MathUtils.smoothstep(progress,0,.22)*(1-T.MathUtils.smoothstep(progress,.72,1));
      const lean=reduced?0:T.MathUtils.lerp(initialLean,pose,T.MathUtils.smoothstep(progress,0,.18));
      const zoomFactor=reduced?1:T.MathUtils.lerp(initialZoomFactor,1,u)-.14*Math.sin(Math.PI*progress)**2;
      const justLanded=!landed&&elapsed>=duration;landed ||= justLanded;
      if(elapsed>=duration)active=false;
      return {position,lean,impact:0,airborne:elapsed<duration,landed:justLanded,progress,heading,zoomFactor};
    },
  };
}
