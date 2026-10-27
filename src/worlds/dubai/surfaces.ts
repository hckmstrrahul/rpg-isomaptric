import * as T from 'three';
import type { PlanPoint,Road } from '../../cityPlan.ts';
import {DUBAI_BRIDGES} from './plan.ts';
import {strokeGeometry as sharedStroke} from '../shared/surfaces.ts';
export {strokeSections} from '../shared/surfaces.ts';
export function strokeGeometry(points:PlanPoint[],width:number|((p:PlanPoint)=>number),height:number|((x:number,z:number)=>number)){return sharedStroke(points,width,height,{z:[19.8,24,40,44.2]});}
/** Bridge width grows along its ramp instead of stamping a wider rectangle on it. */
export function streetWidthAt(road:Road,p:PlanPoint) {
  if(road.bridge)return road.width;
  if(!DUBAI_BRIDGES.some(x=>Math.abs(x-p.x)<.05))return road.width;
  const t=T.MathUtils.smoothstep(12.2-Math.abs(p.z-32),0,4.2);
  return road.width+(4.7-road.width)*t;
}
