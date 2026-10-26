import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { nightOnly, releaseNightObject, softGlowTexture } from './lighting.ts';

/** Static street/window washes share one draw; destroying a fixture clears only its vertices. */
export class NightGroundGlows {
  readonly mesh:T.Mesh;
  private sources:{owner:T.Object3D;start:number;count:number;cleared:boolean}[]=[];
  constructor(scene:T.Scene,pools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]) {
    scene.updateMatrixWorld(true);const geometries:T.BufferGeometry[]=[];let offset=0;
    for(const pool of pools) {
      const owner=pool.parent!;
      const geometry=pool.geometry.index?pool.geometry.toNonIndexed():pool.geometry.clone();geometry.applyMatrix4(pool.matrixWorld);
      const count=geometry.getAttribute('position').count,colors=new Float32Array(count*3);
      const color=pool.material.color.clone().multiplyScalar(pool.material.userData.nightOpacity);
      for(let i=0;i<count;i++)color.toArray(colors,i*3);
      geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometries.push(geometry);
      this.sources.push({owner,start:offset,count,cleared:false});offset+=count;
      pool.removeFromParent();releaseNightObject(pool);pool.geometry.dispose();
    }
    const geometry=mergeGeometries(geometries)!;geometries.forEach(geometry=>geometry.dispose());
    const material=new T.MeshBasicMaterial({map:softGlowTexture(),vertexColors:true,transparent:true,alphaTest:.002,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false});
    this.mesh=nightOnly(new T.Mesh(geometry,material));this.mesh.name='Batched street and window light spill';this.mesh.userData.nonSolid=true;this.mesh.raycast=()=>{};scene.add(this.mesh);
  }
  update() {
    const color=this.mesh.geometry.getAttribute('color') as T.BufferAttribute;
    for(const source of this.sources) {
      if(source.cleared||(!source.owner.userData.lightsDisabled&&source.owner.visible))continue;
      (color.array as Float32Array).fill(0,source.start*3,(source.start+source.count)*3);
      color.addUpdateRange(source.start*3,source.count*3);color.needsUpdate=true;source.cleared=true;
    }
  }
}
