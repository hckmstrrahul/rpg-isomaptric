import {insideTerrain} from './boundary.ts';
import {ACTIVE_PLAN} from './worldPlan.ts';
export const SIZE=216,HALF=SIZE/2,GROUND=1.35,WATER_HEIGHT=-1.2;
export const PLAYER_SPAWN=ACTIVE_PLAN.spawn;
export const ROAD_HEIGHT=GROUND+.07,BRIDGE_LIFT=.4,BRIDGE_HEIGHT=ROAD_HEIGHT+BRIDGE_LIFT;
export type Obstacle={x:number;z:number;w:number;d:number};
export type Landmark={id:string;name:string;short:string;x:number;z:number;height:number;visitX:number;visitZ:number;description:string};
export const LANDMARKS=ACTIVE_PLAN.landmarks;
// London compatibility helpers carry no London data in another world's bundle.
export const BRIDGES=ACTIVE_PLAN.londonRiver?.bridges??[];
export const RIVER_END=ACTIVE_PLAN.londonRiver?.end??HALF;
export const riverCenter=(z:number)=>ACTIVE_PLAN.londonRiver?.center(z)??0;
export const riverWidth=(z:number)=>ACTIVE_PLAN.londonRiver?.width(z)??0;
export const bank=(z:number,side:number,margin=0)=>riverCenter(z)+side*(riverWidth(z)/2+margin);
export const isWater=(x:number,z:number,margin=0)=>!ACTIVE_PLAN.landAt(x,z,margin);
export const isOnBridge=(x:number,z:number)=>ACTIVE_PLAN.bridgeAt(x,z);
/** Legacy name: elevation above the datum includes hill terrain and bridge ramps. */
export const bridgeLiftAt=(x:number,z:number)=>ACTIVE_PLAN.heightAt(x,z)-GROUND;
export function surfaceHeight(x:number,z:number){
 const inWaterRange=!ACTIVE_PLAN.londonRiver||Math.abs(z)<=HALF;
 return inWaterRange&&isWater(x,z)&&!isOnBridge(x,z)?WATER_HEIGHT:ACTIVE_PLAN.heightAt(x,z);
}

export function canWalk(x: number, z: number, obstacles: Obstacle[], radius = 0.46): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (Math.abs(x) > HALF - 2 || Math.abs(z) > HALF - 2 || !insideTerrain(x,z,radius)) return false;
  if (isWater(x,z,.5) && !isOnBridge(x,z)) return false;
  return !obstacles.some(b => Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius);
}

export type TeleportDestination = { valid: true; position: { x: number; y: number; z: number } } | { valid: false; reason: string };

/** Exact, unrestricted-distance travel using the same live collision map as walking. */
export function resolveTeleport(x: number, z: number, obstacles: Obstacle[]): TeleportDestination {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > HALF - 2 || Math.abs(z) > HALF - 2)
    return { valid: false, reason: 'Choose a destination inside the city.' };
  if (isWater(x,z,.5) && !isOnBridge(x,z))
    return { valid: false, reason: 'Water is blocked. Choose land or a bridge.' };
  if (!canWalk(x, z, obstacles))
    return { valid: false, reason: 'That spot is occupied. Choose open ground.' };
  return { valid: true, position: { x, y: surfaceHeight(x,z) + .13, z } };
}

export function walkStep(x: number, z: number, dx: number, dz: number, obstacles: Obstacle[]) {
  // Axis sliding keeps the character moving smoothly along walls and river edges.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.25));
  for (let i = 0; i < steps; i++) {
    if (canWalk(x + dx / steps, z, obstacles)) x += dx / steps;
    if (canWalk(x, z + dz / steps, obstacles)) z += dz / steps;
  }
  return { x, z };
}
