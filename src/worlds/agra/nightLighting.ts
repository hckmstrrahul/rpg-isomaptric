import * as T from 'three';

/** A white directional fill restricted to the Taj's marble materials. It lights
 * the existing surface only: no shells, transparent outlines or extra passes. */
export function createTajNightLighting(taj:T.Object3D) {
  const strength={value:0},materials=new Map<T.Material,T.MeshStandardMaterial>();
  taj.traverse(object=>{
    if(!(object instanceof T.Mesh))return;
    const illuminate=(source:T.Material)=>{
      if(!(source instanceof T.MeshStandardMaterial)||!source.userData.agraMarble)return source;
      let material=materials.get(source);
      if(!material){
        material=source.clone();material.name='Taj marble · private white moon fill';
        material.emissiveIntensity=0;material.userData.tajNightFill=true;
        material.onBeforeCompile=shader=>{
          shader.uniforms.tajMoonFill=strength;
          shader.vertexShader='varying vec3 vTajFillNormal;\n'+shader.vertexShader;
          shader.vertexShader=shader.vertexShader.replace('#include <defaultnormal_vertex>',
            '#include <defaultnormal_vertex>\nvTajFillNormal=normalize(mat3(modelMatrix)*objectNormal);');
          shader.fragmentShader='uniform float tajMoonFill; varying vec3 vTajFillNormal;\n'+shader.fragmentShader;
          shader.fragmentShader=shader.fragmentShader.replace('#include <lights_fragment_end>',
            `#include <lights_fragment_end>
            float tajFacing=max(dot(normalize(vTajFillNormal),normalize(vec3(-.4,.8,.55))),0.);
            reflectedLight.indirectDiffuse+=diffuseColor.rgb*tajMoonFill*(.32+.68*tajFacing);`);
        };
        material.customProgramCacheKey=()=> 'taj-white-moon-fill-v1';
        materials.set(source,material);
      }
      return material;
    };
    object.material=Array.isArray(object.material)?object.material.map(illuminate):illuminate(object.material);
  });
  return {strength,materials:[...materials.values()],update:(reveal:number)=>{
    const amount=T.MathUtils.clamp(reveal,0,1);strength.value=amount;
    for(const material of materials.values())material.roughness=.68-amount*(material.userData.agraPolishedDome?.30:.12);
  }};
}
