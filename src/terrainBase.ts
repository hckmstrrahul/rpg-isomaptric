import * as T from 'three';
import { TERRAIN_OUTLINE, SOIL_DEPTH } from './boundary.ts';

/** The square street surface stays untouched; only the buried cut softens. */
export function createTerrainBase() {
  const positions:number[]=[],uv:number[]=[],indices:number[]=[],count=TERRAIN_OUTLINE.length,rows=28;
  for(let row=0;row<=rows;row++) {
    const t=row/rows,soft=T.MathUtils.smoothstep(t,.06,.85),radius=7*soft;
    const bottomRound=3*(1-Math.sqrt(1-Math.pow(Math.max(0,(t-.72)/.28),2)));
    for(const p of TERRAIN_OUTLINE) {
      let x=p.x,z=p.z;
      if(radius>0){const cx=T.MathUtils.clamp(x,-108+radius,108-radius),cz=T.MathUtils.clamp(z,-108+radius,108-radius),dx=x-cx,dz=z-cz,length=Math.hypot(dx,dz);x=cx+dx/length*radius;z=cz+dz/length*radius;}
      const erosion=soft*(1.2+.65*Math.sin(p.x*.074+p.z*.051)+.35*Math.sin(p.x*.16-p.z*.11+t*2));
      const inset=erosion+bottomRound,scale=(108-inset)/108;
      positions.push(x*scale,-2.8-(SOIL_DEPTH-2.8)*t,z*scale);
      uv.push((Math.abs(p.x)===108?p.z:p.x)/12,(-2.8-(SOIL_DEPTH-2.8)*t)/12);
    }
  }
  for(let row=0;row<rows;row++)for(let i=0;i<count;i++) {
    const a=row*count+i,b=row*count+(i+1)%count,c=a+count,d=b+count;
    indices.push(a,b,c,b,d,c);
  }
  // Caps are below the water; the top never covers the open river.
  for(const [row,y,flip] of [[0,-2.8,false],[rows,-SOIL_DEPTH,true]] as const) {
    const center=positions.length/3;positions.push(0,y,0);uv.push(0,0);
    for(let i=0;i<count;i++){const a=row*count+i,b=row*count+(i+1)%count;indices.push(...(flip?[center,a,b]:[center,b,a]));}
  }
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.setAttribute('uv',new T.Float32BufferAttribute(uv,2));geo.setIndex(indices);geo.computeVertexNormals();
  return geo;
}
