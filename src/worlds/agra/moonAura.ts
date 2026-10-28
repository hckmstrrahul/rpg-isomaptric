import * as T from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

/** A bounded, depth-tested rim around the actual marble silhouette. Three thin
 * shells share one draw call; no screen-sized blur, light, texture or bloom pass. */
export function createTajMoonAura(taj:T.Object3D) {
  const layers:T.BufferGeometry[]=[];
  taj.updateMatrixWorld(true);const inverse=taj.matrixWorld.clone().invert();
  taj.traverse(child=>{
    if(!(child instanceof T.Mesh)||Array.isArray(child.material)||!child.material.userData.agraMarble)return;
    for(let shell=0;shell<3;shell++){
      const geo=child.geometry.clone().applyMatrix4(inverse.clone().multiply(child.matrixWorld));
      for(const attribute of Object.keys(geo.attributes))if(!['position','normal'].includes(attribute))geo.deleteAttribute(attribute);
      geo.setAttribute('auraShell',new T.Float32BufferAttribute(new Float32Array(geo.getAttribute('position').count).fill(shell),1));layers.push(geo);
    }
  });
  const geometry=mergeGeometries(layers)!;layers.forEach(layer=>layer.dispose());
  const strength={value:0};
  const material=new T.ShaderMaterial({uniforms:{strength},transparent:true,depthWrite:false,depthTest:true,side:T.BackSide,blending:T.AdditiveBlending,toneMapped:false,
    vertexShader:`attribute float auraShell;
      varying vec3 vAuraNormal; varying vec3 vAuraView; varying float vAuraShell;
      void main(){float spread=.07+auraShell*.13;vec4 view=modelViewMatrix*vec4(position+normal*spread,1.);
        vAuraNormal=normalize(normalMatrix*normal);vAuraView=-view.xyz;vAuraShell=auraShell;gl_Position=projectionMatrix*view;}`,
    fragmentShader:`uniform float strength;varying vec3 vAuraNormal;varying vec3 vAuraView;varying float vAuraShell;
      void main(){float rim=pow(1.-abs(dot(normalize(vAuraNormal),normalize(vAuraView))),1.6);
        float alpha=2.2*strength*(.035-vAuraShell*.009)*rim;gl_FragColor=vec4(.74,.83,.91,alpha);}`,
  });
  const mesh=new T.Mesh(geometry,material);mesh.name='Taj · soft moonlit marble rim';mesh.visible=false;mesh.userData.nonSolid=true;mesh.userData.excludeReflection=true;mesh.raycast=()=>{};mesh.renderOrder=2;taj.add(mesh);
  return {mesh,strength,update:(reveal:number)=>{strength.value=T.MathUtils.clamp(reveal,0,1);mesh.visible=strength.value>.001;}};
}
