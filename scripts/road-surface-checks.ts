import * as T from 'three';
import { GROUND, ROAD_HEIGHT, riverCenter, riverWidth, surfaceHeight, WATER_HEIGHT } from '../src/layout.ts';
import { ROAD_BORDER_WIDTH, type Road } from '../src/cityPlan.ts';

/** Raycast the built surfaces, not just the connected street centerlines. */
export function auditRoadSurfaces(scene:T.Scene,roads:Road[]) {
  scene.updateMatrixWorld(true);
  const streets=scene.getObjectByName('City street surfaces')!,terrain=scene.getObjectByName('Terrain, streets and promenades')!;
  const failures:string[]=[],ray=new T.Raycaster();let cornerSamples=0,edgeSamples=0;
  for(const road of roads.filter(road=>!road.bridge)){
    for(const [end,neighbor] of [[road.points[0],road.points[1]],[road.points.at(-1)!,road.points.at(-2)!]]){
      const dx=end.x-neighbor.x,dz=end.z-neighbor.z,length=Math.hypot(dx,dz),half=road.width/2;
      for(const along of [.3,.85])for(const across of [-.85,0,.85]){
        const x=end.x+(dx*along+dz*across)/length*half,z=end.z+(dz*along-dx*across)/length*half;
        ray.set(new T.Vector3(x,GROUND+.5,z),new T.Vector3(0,-1,0));
        const hit=ray.intersectObject(streets,true)[0];cornerSamples++;
        if(!hit||hit.point.y<ROAD_HEIGHT-.002)failures.push(`${road.id}: grass or border inside asphalt corner at ${x.toFixed(2)}, ${z.toFixed(2)}`);
      }
      for(const side of [-1,1]){
        const halfBorder=half+ROAD_BORDER_WIDTH;
        const x=end.x+(dx+dz*side)/length*halfBorder,z=end.z+(dz-dx*side)/length*halfBorder;
        if(surfaceHeight(x,z)===WATER_HEIGHT)failures.push(`${road.id}: new corner extends over water`);
      }
    }
  }
  const checkGrass=(x:number,z:number)=>{
    if(Math.abs(x-riverCenter(z))<riverWidth(z)/2+3)return;
    ray.set(new T.Vector3(x,GROUND+.5,z),new T.Vector3(0,-1,0));
    const hit=ray.intersectObjects([terrain,streets],true)[0];edgeSamples++;
    if(!hit||!(hit.object instanceof T.Mesh)||hit.object.material.name!=='Natural grass')failures.push(`Outer edge is not green at ${x.toFixed(2)}, ${z.toFixed(2)}`);
  };
  for(const side of [-1,1])for(let along=-104;along<=104;along+=8){checkGrass(side*106.3,along);checkGrass(along,side*106.3);}
  return {cornerSamples,edgeSamples,failures};
}
