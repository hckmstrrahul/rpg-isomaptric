import * as T from 'three';

/** Independent planar UVs prevent shared cone vertices smearing adjacent faces. */
export function prepareRoofTiles(source:T.BufferGeometry) {
  const geo=source.index?source.toNonIndexed():source.clone();geo.computeVertexNormals();
  const p=geo.getAttribute('position'),n=geo.getAttribute('normal'),uv=geo.getAttribute('uv');
  for(let i=0;i<p.count;i+=3) {
    const normal=new T.Vector3().fromBufferAttribute(n,i),across=new T.Vector3(normal.z,0,-normal.x);
    if(across.lengthSq()<.001)across.set(1,0,0);else across.normalize();
    const slope=new T.Vector3().crossVectors(normal,across).normalize();if(slope.y<0)slope.negate();
    for(let j=i;j<i+3;j++){const point=new T.Vector3().fromBufferAttribute(p,j);uv.setXY(j,point.dot(across)/3.6,point.dot(slope)/4);}
  }
  return geo;
}
