export const SOIL_DEPTH=18;
export type BoundaryPoint={x:number;z:number};
/** Straight cut edges, including level cuts at both river mouths. */
function outline() {
  const half=108,points:BoundaryPoint[]=[];
  // Subdivisions serve the bank contours and edge landscaping; every edge is collinear.
  for(let side=0;side<4;side++)for(let i=0;i<80;i++) {
    const along=-half+2*half*i/80;
    if(side===0)points.push({x:along,z:-half});
    else if(side===1)points.push({x:half,z:along});
    else if(side===2)points.push({x:-along,z:half});
    else points.push({x:-half,z:-along});
  }
  const start=points.findIndex(p=>p.x===0&&p.z===-half);
  return [...points.slice(start),...points.slice(0,start)];
}
export const TERRAIN_OUTLINE=outline();
export function insideTerrain(x:number,z:number,margin=0) {
  let inside=false;
  for(let i=0,j=TERRAIN_OUTLINE.length-1;i<TERRAIN_OUTLINE.length;j=i++) {
    const a=TERRAIN_OUTLINE[i],b=TERRAIN_OUTLINE[j];
    if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
    if(margin) {
      const dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));
      if(Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<margin)return false;
    }
  }
  return inside;
}
