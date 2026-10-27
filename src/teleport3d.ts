import * as T from 'three';
import { GROUND, surfaceHeight, isOnBridge, resolveTeleport, type Obstacle, type TeleportDestination } from './layout.ts';

export type SceneTeleportPick = { point: T.Vector3 | null; destination: TeleportDestination };

/** First intersection with the selected world's height field, including hills and decks. */
export function projectTerrainRay(ray:T.Ray,heightAt=(x:number,z:number)=>surfaceHeight(x,z)+(isOnBridge(x,z)?.07:0)):T.Vector3|null {
  if(ray.direction.y>=0)return null;
  const sample=new T.Vector3(),at=(t:number)=>ray.at(t,sample);
  const start=Math.max(0,(80-ray.origin.y)/ray.direction.y),end=(-32-ray.origin.y)/ray.direction.y;
  if(end<start)return null;
  const steps=Math.min(2048,Math.max(1,Math.ceil((end-start)*Math.max(.2,Math.hypot(ray.direction.x,ray.direction.z)))));
  let previous=start,previousPoint=at(start),previousGap=previousPoint.y-heightAt(previousPoint.x,previousPoint.z);
  for(let i=1;i<=steps;i++){
    const t=start+(end-start)*i/steps,p=at(t),gap=p.y-heightAt(p.x,p.z);
    if(previousGap>=0&&gap<=0){
      // Preserve exact plane intersections on flat ground; bisect curved terrain.
      const h=heightAt(p.x,p.z),flat=ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-h),new T.Vector3());
      if(flat&&Math.abs(heightAt(flat.x,flat.z)-h)<1e-10)return flat;
      let low=previous,high=t;
      for(let n=0;n<32;n++){const mid=(low+high)/2,q=at(mid);if(q.y>heightAt(q.x,q.z))low=mid;else high=mid;}
      return at((low+high)/2);
    }
    previous=t;previousGap=gap;
  }
  return ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-GROUND),new T.Vector3());
}

/** Project the pointer onto walkable 3D surfaces, respecting foreground objects. */
export function pickSceneTeleport(ray:T.Ray,obstacles:Obstacle[],occluder:{point:T.Vector3}|null=null):SceneTeleportPick {
  const point=projectTerrainRay(ray);
  if(!point)return {point:null,destination:{valid:false,reason:'Point at a place in the city.'}};
  if(occluder&&ray.origin.distanceTo(occluder.point)<ray.origin.distanceTo(point)-.05)
    return {point:occluder.point.clone(),destination:{valid:false,reason:'That object is in the way. Choose open ground.'}};
  return {point,destination:resolveTeleport(point.x,point.z,obstacles)};
}
