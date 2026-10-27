import {ACTIVE_PLAN} from './worldPlan.ts';
import type {Obstacle} from './layout.ts';
export type PlanPoint={x:number;z:number};
export const ROAD_WIDTHS={bridge:4.7,main:4,small:3.2} as const;
export const ROAD_BORDER_WIDTH=.75;
export type RoadSize=keyof typeof ROAD_WIDTHS;
export type Road={id:string;points:PlanPoint[];size:RoadSize;width:number;bridge?:boolean};
export const ROAD_NORTH=-96,ROAD_SOUTH=100,TRAFFIC_NORTH=-51;
export const GARDENS=ACTIVE_PLAN.map.gardens;
export const CIRCULAR_SITES=ACTIVE_PLAN.circularSites??[];
export const FLOWER_BEDS=ACTIVE_PLAN.flowerBeds??[];
export function line(x1:number,z1:number,x2:number,z2:number) {
  const count=Math.ceil(Math.hypot(x2-x1,z2-z1)/2);
  return Array.from({length:count+1},(_,i)=>({x:x1+(x2-x1)*i/count,z:z1+(z2-z1)*i/count}));
}
/** Square road ends fill the outer quadrant where two streets meet at a corner. */
export function streetSurfacePath(points:PlanPoint[],width:number):PlanPoint[] {
  if(points.length<2)return points;
  const extend=(end:PlanPoint,neighbor:PlanPoint)=>{
    const dx=end.x-neighbor.x,dz=end.z-neighbor.z,length=Math.hypot(dx,dz)||1;
    return {x:end.x+dx/length*width/2,z:end.z+dz/length*width/2};
  };
  return [extend(points[0],points[1]),...points,extend(points.at(-1)!,points.at(-2)!)];
}
/** All street ends meet another street; bridges join the two bank centerlines. */
export function cityRoads():Road[]{return ACTIVE_PLAN.roads();}
export function pointSegmentDistance(p:PlanPoint,a:PlanPoint,b:PlanPoint) {
  const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));
  return Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t);
}
export function roadClearance(p:PlanPoint,roads:Road[],pavement=0) {
  let distance=Infinity;
  for(const road of roads){
    const half=road.width/2+pavement;
    for(let i=1;i<road.points.length;i++)distance=Math.min(distance,pointSegmentDistance(p,road.points[i-1],road.points[i])-half);
    // Reserve the rendered square corners too, rather than a smaller round cap.
    for(const [end,neighbor] of [[road.points[0],road.points[1]],[road.points.at(-1)!,road.points.at(-2)!]]){
      const dx=end.x-neighbor.x,dz=end.z-neighbor.z,length=Math.hypot(dx,dz)||1,px=p.x-end.x,pz=p.z-end.z;
      const a=Math.abs((px*dx+pz*dz)/length)-half,b=Math.abs((px*dz-pz*dx)/length)-half;
      distance=Math.min(distance,Math.hypot(Math.max(a,0),Math.max(b,0))+Math.min(Math.max(a,b),0));
    }
  }
  return distance;
}
/** Conservative rectangle/corridor overlap, including every road segment. */
export function plotTouchesRoad(plot:Obstacle,roads:Road[],padding=.9) {
  for(const road of roads)for(let i=1;i<road.points.length;i++) {
    const a=road.points[i-1],b=road.points[i],margin=road.width/2+padding;
    let low=0,high=1;
    for(const [start,delta,min,max]of [[a.x,b.x-a.x,plot.x-plot.w/2-margin,plot.x+plot.w/2+margin],[a.z,b.z-a.z,plot.z-plot.d/2-margin,plot.z+plot.d/2+margin]]) {
      if(Math.abs(delta)<1e-9){if(start<min||start>max){low=2;break;}}
      else {const t1=(min-start)/delta,t2=(max-start)/delta;low=Math.max(low,Math.min(t1,t2));high=Math.min(high,Math.max(t1,t2));}
    }
    if(low<=high)return true;
  }
  return false;
}
