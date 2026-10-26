import * as T from 'three';

/** Split faces at ramp creases before lowering vertices, so broad deck faces
 * retain their raised center instead of flattening to their end-vertex height. */
export function rampBridgeGeometry(source:T.BufferGeometry,center:number,width:number,lift:number) {
  const geometry=source.index?source.toNonIndexed():source;
  const attributes=Object.entries(geometry.attributes);
  const positions=geometry.getAttribute('position'),vertices:number[][]=[];
  for(let i=0;i<positions.count;i++){
    const vertex:number[]=[];
    for(const [,attribute] of attributes)for(let c=0;c<attribute.itemSize;c++)vertex.push(attribute.getComponent(i,c));
    vertices.push(vertex);
  }
  const xOffset=attributes.slice(0,attributes.findIndex(([name])=>name==='position')).reduce((sum,[,attribute])=>sum+attribute.itemSize,0);
  const interpolate=(a:number[],b:number[],t:number)=>a.map((value,i)=>value+(b[i]-value)*t);
  const planes=[center-width/2-4.2,center-width/2,center+width/2,center+width/2+4.2],output:number[][]=[];
  const clip=(polygon:number[][],plane:number,side:number)=>{
    const result:number[][]=[];
    for(let i=0;i<polygon.length;i++){
      const a=polygon[i],b=polygon[(i+1)%polygon.length],da=(a[xOffset]-plane)*side,db=(b[xOffset]-plane)*side;
      if(da>=0)result.push(a);
      if((da<0&&db>0)||(da>0&&db<0))result.push(interpolate(a,b,da/(da-db)));
    }
    return result;
  };
  for(let i=0;i<vertices.length;i+=3){
    let polygons=[vertices.slice(i,i+3)];
    for(const plane of planes)polygons=polygons.flatMap(polygon=>{
      if(!polygon.some(v=>v[xOffset]<plane)||!polygon.some(v=>v[xOffset]>plane))return [polygon];
      return [clip(polygon,plane,-1),clip(polygon,plane,1)];
    });
    for(const polygon of polygons)for(let j=1;j<polygon.length-1;j++)output.push(polygon[0],polygon[j],polygon[j+1]);
  }
  const result=new T.BufferGeometry();let offset=0;
  for(const [name,attribute] of attributes){
    const data=new Float32Array(output.length*attribute.itemSize);
    output.forEach((vertex,i)=>{for(let c=0;c<attribute.itemSize;c++){
      let value=vertex[offset+c];
      if(name==='position'&&c===1)value-=lift*T.MathUtils.clamp((Math.abs(vertex[xOffset]-center)-width/2)/4.2,0,1);
      data[i*attribute.itemSize+c]=value;
    }});
    result.setAttribute(name,new T.Float32BufferAttribute(data,attribute.itemSize));offset+=attribute.itemSize;
  }
  result.computeVertexNormals();if(geometry!==source)geometry.dispose();
  return result;
}
