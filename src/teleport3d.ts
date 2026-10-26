import * as T from 'three';
import { createCharacter } from './character.ts';
import { GROUND, ROAD_HEIGHT, bridgeLiftAt, isOnBridge, resolveTeleport, type Obstacle, type TeleportDestination } from './layout.ts';

export type SceneTeleportPick = { point: T.Vector3 | null; destination: TeleportDestination };

/** Move the selector in screen-relative ground directions without requiring a pointer. */
export function stepTeleportCursor(point:{x:number;z:number},forward:{x:number;z:number},code:string,step=2) {
  const length=Math.hypot(forward.x,forward.z)||1,fx=forward.x/length,fz=forward.z/length;
  const up=Number(code==='ArrowUp'||code==='KeyW')-Number(code==='ArrowDown'||code==='KeyS');
  const right=Number(code==='ArrowRight'||code==='KeyD')-Number(code==='ArrowLeft'||code==='KeyA');
  return {x:T.MathUtils.clamp(point.x+(fx*up-fz*right)*step,-112,112),z:T.MathUtils.clamp(point.z+(fz*up+fx*right)*step,-112,112)};
}

export function keyboardTeleportPick(point:{x:number;z:number},obstacles:Obstacle[]):SceneTeleportPick {
  const destination=resolveTeleport(point.x,point.z,obstacles);
  return {point:new T.Vector3(point.x,isOnBridge(point.x,point.z)?ROAD_HEIGHT+bridgeLiftAt(point.x,point.z):GROUND,point.z),destination};
}

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

export function createTeleportMarker(character?:T.Object3D) {
  const marker=new T.Group();marker.visible=false;marker.name='Explorer teleport ghost';
  const ghost=(character??createCharacter().body).clone(true);ghost.position.set(0,0,0);marker.add(ghost);
  const materials:T.Material[]=[];
  ghost.traverse(object=>{
    if(object instanceof T.Light){object.visible=false;return;}
    if(!(object instanceof T.Mesh))return;
    const clone=(source:T.Material)=>{const mat=source.clone();mat.transparent=true;mat.opacity=.38;mat.depthWrite=false;mat.depthTest=false;materials.push(mat);return mat;};
    object.material=Array.isArray(object.material)?object.material.map(clone):clone(object.material);
    object.castShadow=false;object.receiveShadow=false;object.renderOrder=20;object.userData.nonSolid=true;
  });
  return {root:marker,ghost,show(pick:SceneTeleportPick|null,heading=0){
    marker.visible=!!pick?.point;
    if(pick?.point){
      const position=pick.destination.valid?pick.destination.position:pick.point;
      marker.position.set(position.x,position.y+(pick.destination.valid?0:.13),position.z);ghost.rotation.y=heading;
      materials.forEach(mat=>mat.opacity=pick.destination.valid?.38:.16);
    }
  }};
}
