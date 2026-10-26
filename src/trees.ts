import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { Builder, vec } from './geometry.ts';
import { foliageTexture, surfaceMaterial } from './nature.ts';

let resource:ReturnType<typeof buildTree>|undefined;
function buildTree() {
  let seed=38109;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const bark=surfaceMaterial('bark'),branches=new Builder();
  const branch=(a:T.Vector3,b:T.Vector3,r:number,tip:number)=>{
    const geometry=new T.CylinderGeometry(tip,r,a.distanceTo(b),6,1);
    geometry.applyQuaternion(new T.Quaternion().setFromUnitVectors(vec(0,1,0),b.clone().sub(a).normalize()));
    branches.add(geometry,bark,(a.x+b.x)/2,(a.y+b.y)/2,(a.z+b.z)/2);geometry.dispose();
  };
  branch(vec(0,0,0),vec(.035,1.8,0),.145,.055);
  for(let i=0;i<4;i++) {
    const a=i*Math.PI*2/4;
    branch(vec(Math.cos(a)*.32,.015,Math.sin(a)*.32),vec(0,.4,0),.025,.095);
  }
  for(let i=0;i<8;i++) {
    const a=i*2.399,height=.75+i*.14;
    const tip=vec(Math.cos(a)*(.6+random()*.25),height+.75+random()*.6,Math.sin(a)*(.6+random()*.25));
    const start=vec(.02,height,0),joint=start.clone().lerp(tip,.55);joint.y-=.12;
    branch(start,joint,.052,.028);branch(joint,tip,.028,.008);
  }
  const trunk=(branches.finish().children[0] as T.Mesh).geometry;
  const positions:number[]=[],normals:number[]=[],uvs:number[]=[],colors:number[]=[],indices:number[]=[];
  const lobes=[vec(0,2.6,0),vec(-.48,2.14,.22),vec(.47,2.23,-.2),vec(.14,2.03,.48)];
  // Fewer, slightly broader sprays keep full crowns with 60% fewer leaf triangles.
  for(let i=0;i<128;i++) {
    const lobe=lobes[i%lobes.length],theta=random()*Math.PI*2,vertical=random()*2-1;
    const radius=Math.sqrt(1-vertical*vertical),shell=.45+Math.pow(random(),.35)*.55;
    const center=vec(Math.cos(theta)*radius*.76*shell,vertical*(i%4===0?.88:.63)*shell,Math.sin(theta)*radius*.7*shell).add(lobe);
    const direction=center.clone().sub(vec(0,1.65,0)).normalize();
    direction.x+=random()-.5;direction.z+=random()-.5;direction.normalize();
    const quaternion=new T.Quaternion().setFromUnitVectors(vec(0,0,1),direction);
    quaternion.multiply(new T.Quaternion().setFromAxisAngle(vec(0,0,1),random()*Math.PI*2));
    const width=.51+random()*.31,height=width*(1.1+random()*.3);
    const color=new T.Color().setHSL(.23+random()*.035,.28+random()*.15,.58+Math.min(1,(center.y-1)/2.5)*.32);
    for(let crossed=0;crossed<2;crossed++) {
      const q=quaternion.clone().multiply(new T.Quaternion().setFromAxisAngle(vec(0,1,0),crossed*Math.PI*.43));
      const normal=vec(0,0,1).applyQuaternion(q).lerp(direction,.6).normalize(),offset=positions.length/3;
      for(const [x,y,u,v] of [[-1,-1,0,0],[1,-1,1,0],[1,1,1,1],[-1,1,0,1]]) {
        const p=vec(x*width/2,y*height/2,0).applyQuaternion(q).add(center);
        positions.push(p.x,p.y,p.z);normals.push(normal.x,normal.y,normal.z);uvs.push(u,v);colors.push(color.r,color.g,color.b);
      }
      indices.push(offset,offset+1,offset+2,offset,offset+2,offset+3);
    }
  }
  const foliage=new T.BufferGeometry();
  foliage.setAttribute('position',new T.Float32BufferAttribute(positions,3));foliage.setAttribute('normal',new T.Float32BufferAttribute(normals,3));
  foliage.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));foliage.setAttribute('color',new T.Float32BufferAttribute(colors,3));foliage.setIndex(indices);
  // Keep every yaw inside the same 2.8-unit canopy footprint used by placement.
  let radius=0;for(let i=0;i<positions.length;i+=3)radius=Math.max(radius,Math.hypot(positions[i],positions[i+2]));
  const canopyScale=Math.min(1,1.4/radius);foliage.scale(canopyScale,1,canopyScale);
  // Use the same cutout in the MSAA main view and single-sample reflection/shadow
  // buffers. Coverage smoothing can leave opaque leaf-card rectangles in those passes.
  const leaves=new T.MeshStandardMaterial({map:foliageTexture(),vertexColors:true,roughness:.87,side:T.DoubleSide,alphaTest:.46});
  leaves.name='Individual leaves · cutout twig atlas';
  const time={value:0};
  leaves.onBeforeCompile=shader=>{
    shader.uniforms.uLeafTime=time;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uLeafTime;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
      #ifdef USE_INSTANCING
        float phase=instanceMatrix[3].x*.71+instanceMatrix[3].z*.43;
        transformed.x+=sin(uLeafTime*1.25+phase+position.y*1.1)*max(position.y-1.3,0.0)*.018;
        transformed.z+=sin(uLeafTime*.9+phase+position.x*2.0)*.015;
      #endif
    `);
  };
  leaves.customProgramCacheKey=()=> 'leaf-breeze-v1';
  // A solid silhouette is easier to read for the placement ghost than leaf cutouts.
  const preview=new Builder();preview.cylinder(0,.8,0,.13,1.6,'#ffffff');
  preview.sphere(0,2.55,0,.85,1,.85,'#ffffff');preview.sphere(-.48,2.14,.22,.8,.78,.8,'#ffffff');preview.sphere(.47,2.23,-.2,.8,.8,.8,'#ffffff');
  const previewParts=preview.finish().children as T.Mesh[];
  const previewGeometry=mergeGeometries(previewParts.map(mesh=>mesh.geometry))!;
  previewParts.forEach(mesh=>mesh.geometry.dispose());
  return {trunk,bark,foliage,leaves,previewGeometry,time};
}
export function treeResources() { return resource??=buildTree(); }
