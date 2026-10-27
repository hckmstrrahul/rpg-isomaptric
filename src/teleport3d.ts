import * as T from 'three';
import { GROUND, ROAD_HEIGHT, bridgeLiftAt, isOnBridge, resolveTeleport, type Obstacle, type TeleportDestination } from './layout.ts';

export type SceneTeleportPick = { point: T.Vector3 | null; destination: TeleportDestination };

/** Project the pointer onto walkable 3D surfaces, respecting foreground objects. */
export function pickSceneTeleport(ray:T.Ray,obstacles:Obstacle[],occluder:{point:T.Vector3}|null=null):SceneTeleportPick {
  const ground=ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-GROUND),new T.Vector3());
  if(!ground)return {point:null,destination:{valid:false,reason:'Point at a place in the city.'}};
  let deck=ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-ROAD_HEIGHT),new T.Vector3());
  for(let i=0;deck&&i<5;i++)deck=ray.intersectPlane(new T.Plane(new T.Vector3(0,1,0),-ROAD_HEIGHT-bridgeLiftAt(deck.x,deck.z)),deck);
  const point=deck&&isOnBridge(deck.x,deck.z)?deck:ground;
  if(occluder&&ray.origin.distanceTo(occluder.point)<ray.origin.distanceTo(point)-.05)
    return {point:occluder.point.clone(),destination:{valid:false,reason:'That object is in the way. Choose open ground.'}};
  return {point,destination:resolveTeleport(point.x,point.z,obstacles)};
}
