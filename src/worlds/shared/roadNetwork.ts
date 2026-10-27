import * as T from 'three';
import clipping from 'polygon-clipping';
import type {Road,PlanPoint} from '../../cityPlan.ts';
import {strokeSections} from './surfaces.ts';

type Ring=[number,number][];
type Polygon=Ring[];
const area=(ring:Ring)=>ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0);
const snap=(v:number)=>Math.round(v*1e6)/1e6;
const xy=(p:PlanPoint):[number,number]=>[snap(p.x),snap(p.z)];

/** One joined surface per network: intersections contain no overlapping faces.
 * Union/triangulation runs once at construction; animation never rebuilds it. */
export function roadNetworkGeometry(roads:Road[],height:number|((x:number,z:number)=>number),options:{padding?:number;excludePadding?:number;bounds?:number;maxSegment?:number;maxHeightError?:number}={}){
 const unionAt=(padding:number)=>{
  const polygons:Polygon[]=[];
  for(const road of roads){
    if(road.points.length<2)continue;
    const sections=strokeSections(road.points,road.width+padding),closed=Math.hypot(road.points[0].x-road.points.at(-1)!.x,road.points[0].z-road.points.at(-1)!.z)<1e-6;
    const left=sections.map(s=>xy(s.left)),right=sections.map(s=>xy(s.right));
    if(closed)polygons.push(Math.abs(area(left))>Math.abs(area(right))?[left,right]:[right,left]);
    else polygons.push([[...left,...right.reverse()]]);
    // Separate road definitions can meet at a corner or terminate on a through
    // road. A compact round join fills their outer wedge before the union.
    for(const end of [road.points[0],road.points.at(-1)!]){
      const connected=roads.some(other=>other!==road&&other.points.slice(1).some((b,i)=>{
        const a=other.points[i],dx=b.x-a.x,dz=b.z-a.z,len=dx*dx+dz*dz;
        const t=len?Math.max(0,Math.min(1,((end.x-a.x)*dx+(end.z-a.z)*dz)/len)):0;
        return Math.hypot(end.x-a.x-t*dx,end.z-a.z-t*dz)<1e-5;
      }));
      if(connected){const r=(road.width+padding)/2;polygons.push([Array.from({length:20},(_,i)=>[snap(end.x+Math.cos(i*Math.PI/10)*r),snap(end.z+Math.sin(i*Math.PI/10)*r)] as [number,number])]);}
    }
  }
  return polygons.length?clipping.union(polygons[0],...polygons.slice(1)):[];
 };
  let merged=unionAt(options.padding??0);
  // Curbs use a true ring rather than a second full draped road. Independent
  // triangles can otherwise cross the asphalt on a curved height field.
  if(options.excludePadding!==undefined)merged=clipping.difference(merged,unionAt(options.excludePadding));
  if(options.bounds){const b=options.bounds;merged=clipping.intersection(merged,[[[-b,-b],[b,-b],[b,b],[-b,b],[-b,-b]]]);}
  type Point=Ring[number];type Triangle=[Point,Point,Point];
  const vertices:number[]=[],uv:number[]=[],limit=options.maxSegment??3,triangles:Triangle[]=[],midpoints=new Map<string,Point>();
  const edgeKey=(p:Point,q:Point)=>{const a=p.join(','),b=q.join(',');return a<b?`${a}|${b}`:`${b}|${a}`;};
  const y=(p:Ring[number])=>typeof height==='number'?height:height(p[0],p[1]);
  const emit=(a:Ring[number],b:Ring[number],c:Ring[number],depth=0)=>{
    const points=[a,b,c],lengths=points.map((p,i)=>Math.hypot(p[0]-points[(i+1)%3][0],p[1]-points[(i+1)%3][1]));
    const longest=Math.max(...lengths),i=lengths.indexOf(longest);
    let heightError=0;
    if(typeof height==='function'&&options.maxHeightError!==undefined){
      const heights=points.map(y),center:Ring[number]=[(a[0]+b[0]+c[0])/3,(a[1]+b[1]+c[1])/3];
      heightError=Math.abs(y(center)-(heights[0]+heights[1]+heights[2])/3);
      points.forEach((p,j)=>{const q=points[(j+1)%3];heightError=Math.max(heightError,Math.abs(y([(p[0]+q[0])/2,(p[1]+q[1])/2])-(heights[j]+heights[(j+1)%3])/2));});
    }
    if(typeof height==='function'&&(longest>limit||heightError>(options.maxHeightError??Infinity))&&depth<20){const p=points[i],q=points[(i+1)%3],r=points[(i+2)%3],m:Point=[(p[0]+q[0])/2,(p[1]+q[1])/2];midpoints.set(edgeKey(p,q),m);emit(p,m,r,depth+1);emit(m,q,r,depth+1);return;}
    triangles.push([a,b,c]);
  };
  const conform=(a:Point,b:Point,c:Point)=>{
    // A curved surface cannot tolerate T-junctions: a refined edge follows the
    // hill while its coarse neighbour spans a straight chord, leaving a crack.
    // Propagate every recorded split to both sides before emitting vertices.
    const points=[a,b,c];
    for(let i=0;i<3;i++){const p=points[i],q=points[(i+1)%3],r=points[(i+2)%3],m=midpoints.get(edgeKey(p,q));if(m){conform(p,m,r);conform(m,q,r);return;}}
    // The triangulator uses XY winding; our second coordinate is world Z.
    const cross=(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
    for(const p of cross>0?[a,c,b]:[a,b,c]){vertices.push(p[0],y(p),p[1]);uv.push(p[0]/5,p[1]/5);}
  };
  for(const polygon of merged){
    const rings=polygon.map(r=>r.slice(0,-1)),contour=rings[0].map(p=>new T.Vector2(...p)),holes=rings.slice(1).map(r=>r.map(p=>new T.Vector2(...p)));
    const points=rings.flat();for(const face of T.ShapeUtils.triangulateShape(contour,holes))emit(points[face[0]],points[face[1]],points[face[2]]);
  }
  for(const triangle of triangles)conform(...triangle);
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geometry.computeVertexNormals();return geometry;
}
