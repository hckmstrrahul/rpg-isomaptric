import * as T from 'three';
import { Builder, canvasTexture } from './geometry.ts';
import { registerGlow, glowMaterial } from './lighting.ts';

let sign:T.MeshStandardMaterial|undefined;
export function telephoneBox() {
  if(!sign) {
    const map=canvasTexture(256,64,ctx=>{
      ctx.fillStyle='#e6dfbe';ctx.fillRect(0,0,256,64);
      ctx.fillStyle='#343c38';ctx.font='600 31px Georgia';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TELEPHONE',128,34);
    });
    sign=registerGlow(new T.MeshStandardMaterial({map,emissiveMap:map,emissive:'#ffe0a3',roughness:.65}),.32);
  }
  const b=new Builder();
  b.box(0,.06,0,.88,.12,.88,'#454947');b.box(0,1,0,.77,1.86,.77,'#aa2925');
  b.box(0,1.91,0,.85,.13,.85,'#bd3029');b.sphere(0,1.98,0,.42,.16,.42,'#c33a2d');
  for(let side=0;side<4;side++) {
    const a=side*Math.PI/2,nx=Math.sin(a),nz=Math.cos(a),tx=Math.cos(a),tz=-Math.sin(a);
    b.box(nx*.394,1.03,nz*.394,.59,1.28,.018,glowMaterial('#779d96',.22),a);
    for(const x of [-.32,-.11,.11,.32])b.box(nx*.414+tx*x,1.03,nz*.414+tz*x,.035,1.36,.025,'#c53a2e',a);
    for(const y of [.39,.72,1.05,1.38,1.7])b.box(nx*.414,y,nz*.414,.68,.037,.028,'#c53a2e',a);
    b.box(nx*.415,1.78,nz*.415,.62,.14,.022,sign,a);
  }
  b.box(.27,1.02,.447,.035,.18,.03,'#dfcda2');
  const box=b.finish();box.name='Red K6 telephone booth';return box;
}
