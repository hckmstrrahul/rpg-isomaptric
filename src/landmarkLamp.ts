import * as T from 'three';
import { Builder, material, vec } from './geometry.ts';
import { glowMaterial, nightAccent } from './lighting.ts';

/** The fixture and its light share one transform, including when a building moves. */
export function createWallLamp(color='#ffd3a0',power=9) {
  const b=new Builder(),metal=material('#3d504e',.45,.35);
  b.box(0,0,.06,.26,1.1,.12,metal);
  b.beam(vec(0,-.28,.12),vec(0,-.28,.6),.07,metal);
  b.box(0,.05,.6,.4,.62,.4,glowMaterial(color,1.7));
  for(const x of [-.23,.23])for(const z of [.37,.83])b.box(x,.05,z,.055,.75,.055,metal);
  b.box(0,.46,.6,.66,.12,.66,metal);b.box(0,-.36,.6,.56,.12,.56,metal);
  const root=b.finish();root.name='Wall-mounted lantern';
  const light=nightAccent(color,power,13);light.name='Wall lantern light';light.position.set(0,.04,.87);root.add(light);
  return root;
}

export function createGroundLamp(color:string,power:number) {
  const b=new Builder();
  b.cylinder(0,.1,0,.32,.2,'#45534f');b.box(0,.3,0,.52,.4,.42,'#3b4b4c');
  b.box(0,.52,0,.4,.04,.3,glowMaterial(color,1.4));
  const root=b.finish();root.name='Landscape uplight fixture';
  const light=nightAccent(color,power,16);light.position.y=.62;root.add(light);return root;
}
