import * as T from 'three';
import { BLAST_RADIUS } from './sandbox.ts';

/** Paint the circular footprint on actual surfaces, including roofs and hulls. */
export function createBlastProjection(scene:T.Scene) {
  const center={value:new T.Vector2()},opacity={value:0},radius={value:BLAST_RADIUS};
  const materials=new Set<T.Material>();scene.traverse(object=>{
    if(!(object instanceof T.Mesh)||object.userData.nonSolid)return;
    for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material);
  });
  for(const material of materials) {
    if(!(material instanceof T.MeshStandardMaterial||material instanceof T.MeshBasicMaterial))continue;
    // Reuse the original hook when shared materials appear in another test scene.
    const original=material.userData.beforeBlastCompile??material.onBeforeCompile;
    const cacheKey=material.userData.beforeBlastKey??material.customProgramCacheKey();
    material.userData.beforeBlastCompile=original;material.userData.beforeBlastKey=cacheKey;
    material.onBeforeCompile=(shader,renderer)=>{
      original.call(material,shader,renderer);
      Object.assign(shader.uniforms,{uBlastCenter:center,uBlastOpacity:opacity,uBlastRadius:radius});
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vBlastWorld;').replace('#include <project_vertex>',`#include <project_vertex>
        vec4 blastPosition=vec4(transformed,1.0);
        #ifdef USE_INSTANCING
          blastPosition=instanceMatrix*blastPosition;
        #endif
        vBlastWorld=(modelMatrix*blastPosition).xyz;`);
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform vec2 uBlastCenter;uniform float uBlastOpacity;uniform float uBlastRadius;varying vec3 vBlastWorld;').replace('#include <opaque_fragment>',`float blastDistance=length(vBlastWorld.xz-uBlastCenter);
        float blastMask=1.0-smoothstep(uBlastRadius-.035,uBlastRadius,blastDistance);
        outgoingLight=mix(outgoingLight,vec3(1.0,.012,.008),blastMask*uBlastOpacity);
        #include <opaque_fragment>`);
    };
    material.customProgramCacheKey=()=>`${cacheKey}-blast-projection-v1`;material.needsUpdate=true;
  }
  return {show:(point:T.Vector3,visible:boolean,valid:boolean)=>{center.value.set(point.x,point.z);opacity.value=visible?(valid?.45:.26):0;},center,opacity};
}
