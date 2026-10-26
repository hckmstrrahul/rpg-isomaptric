import * as T from 'three';
import { registerGlow, registerNightOpacity, nightOnly } from './lighting.ts';
import { localNightLight } from './localNightLighting.ts';

let ringGlow:T.MeshBasicMaterial|undefined;
/** An annular wash follows the clock face instead of obscuring its hands and numerals. */
export function createClockLighting() {
  if(!ringGlow) {
    const size=128,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const radius=Math.hypot((x+.5)/size*6-3,(y+.5)/size*6-3);
      const alpha=Math.exp(-(((radius-2.07)/.25)**2))*T.MathUtils.smoothstep(radius,1.91,2.02);
      data.set([255,255,255,Math.round(alpha*255)],(y*size+x)*4);
    }
    const map=new T.DataTexture(data,size,size);map.magFilter=map.minFilter=T.LinearFilter;map.needsUpdate=true;
    ringGlow=registerNightOpacity(new T.MeshBasicMaterial({map,color:'#ffd298',transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),.42);
  }
  const root=new T.Group();root.name='Warm clock-face ring';
  const ring=new T.Mesh(new T.TorusGeometry(2.08,.035,8,96),registerGlow(new T.MeshStandardMaterial({color:'#e3d4b4',emissive:'#ffd199',roughness:.5}),1.25));
  ring.position.z=.008;root.add(ring);
  const halo=new T.Mesh(new T.PlaneGeometry(6,6),ringGlow);halo.position.z=.015;halo.userData.nonSolid=true;halo.raycast=()=>{};root.add(nightOnly(halo));
  const light=localNightLight('#ffdbab',6,5);light.position.z=.3;root.add(light);
  return root;
}
