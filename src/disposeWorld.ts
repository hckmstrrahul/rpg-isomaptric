import * as T from 'three';

/** Release resources even when the browser retains the previous document in history. */
export function disposeWorld(scene:T.Scene){
  const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
  const nodes:T.Object3D[]=[];
  const texture=(value:unknown)=>{if(value instanceof T.Texture)textures.add(value);};
  scene.traverse(node=>{
    nodes.push(node);
    if(node instanceof T.Mesh||node instanceof T.Line||node instanceof T.Points||node instanceof T.Sprite){
      geometries.add(node.geometry);
      for(const material of Array.isArray(node.material)?node.material:[node.material])materials.add(material);
    }
    if(node instanceof T.Light&&'shadow' in node)(node as T.DirectionalLight).shadow?.map?.dispose();
  });
  for(const material of materials){
    Object.values(material).forEach(texture);
    if(material instanceof T.ShaderMaterial)Object.values(material.uniforms).forEach(uniform=>texture(uniform.value));
  }
  texture(scene.environment);texture(scene.background);
  for(const geometry of geometries){
    geometry.dispose();
    // dispose() frees GPU buffers, but not the CPU arrays held by cached roots.
    for(const name of Object.keys(geometry.attributes))geometry.deleteAttribute(name);
    geometry.setIndex(null);geometry.morphAttributes={};geometry.clearGroups();
    geometry.boundingBox=null;geometry.boundingSphere=null;
  }
  for(const material of materials){material.dispose();if(material instanceof T.ShaderMaterial)material.uniforms={};}
  for(const map of textures){map.dispose();map.source.data=null;}
  for(const node of nodes){
    if(node instanceof T.InstancedMesh){
      node.dispose();node.count=0;node.instanceMatrix=new T.InstancedBufferAttribute(new Float32Array(0),16);node.instanceColor=null;
    }
    node.clear();
  }
  scene.environment=null;scene.background=null;
}
