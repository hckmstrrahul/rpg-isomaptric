import * as T from 'three';
import type { PlanPoint } from '../../cityPlan.ts';

/** True mitered joins and butt ends; closed paths share the same seam tangent. */
export function strokeSections(points:PlanPoint[],width:number|((p:PlanPoint)=>number)) {
  const closed=Math.hypot(points[0].x-points.at(-1)!.x,points[0].z-points.at(-1)!.z)<1e-6;
  const path=closed?points.slice(0,-1):points;
  const sections=path.map((p,i)=>{
    const prev=path[i?i-1:closed?path.length-1:0],next=path[i<path.length-1?i+1:closed?0:i];
    const ax=p.x-prev.x,az=p.z-prev.z,bx=next.x-p.x,bz=next.z-p.z;
    const al=Math.hypot(ax,az),bl=Math.hypot(bx,bz);
    const n1=al?{x:az/al,z:-ax/al}:{x:bz/bl,z:-bx/bl},n2=bl?{x:bz/bl,z:-bx/bl}:n1;
    const mx=n1.x+n2.x,mz=n1.z+n2.z,ml=Math.hypot(mx,mz)||1,n={x:mx/ml,z:mz/ml};
    const half=(typeof width==='number'?width:width(p))/2,extent=half/Math.max(.5,n.x*n2.x+n.z*n2.z);
    return {center:p,left:{x:p.x+n.x*extent,z:p.z+n.z*extent},right:{x:p.x-n.x*extent,z:p.z-n.z*extent}};
  });
  if(closed)sections.push(sections[0]);return sections;
}
export function strokeGeometry(points:PlanPoint[],width:number|((p:PlanPoint)=>number),height:number|((x:number,z:number)=>number),creases:{x?:number[];z?:number[]}={}) {
  // Long straight coastal segments still need vertices at bridge ramp creases.
  const sampled:PlanPoint[]=[points[0]];
  for(let i=1;i<points.length;i++){
    const a=points[i-1],b=points[i],count=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z))),ts=Array.from({length:count},(_,j)=>(j+1)/count);
    for(const axis of ['x','z'] as const)if(b[axis]!==a[axis])for(const edge of creases[axis]??[]){const t=(edge-a[axis])/(b[axis]-a[axis]);if(t>0&&t<1)ts.push(t);}
    for(const t of [...new Set(ts)].sort((a,b)=>a-b)){
      const p={x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t};if(Math.hypot(p.x-sampled.at(-1)!.x,p.z-sampled.at(-1)!.z)>1e-7)sampled.push(p);
    }
  }
  const sections=strokeSections(sampled,width),vertices:number[]=[],uv:number[]=[],indices:number[]=[];
  sections.forEach((section,i)=>{
    for(const p of [section.left,section.right])vertices.push(p.x,typeof height==='number'?height:height(p.x,p.z),p.z);
    uv.push(0,i/5,1,i/5);if(i<sections.length-1){const a=i*2;indices.push(a,a+1,a+2,a+1,a+3,a+2);}
  });
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(vertices,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();return geo;
}
