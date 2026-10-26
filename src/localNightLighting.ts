import * as T from 'three';
import { lightHalo } from './lighting.ts';

type Emitter={color:T.Color;power:number;range:number;decay:number};
export function localNightLight(color:string,power:number,range:number,decay=2) {
  const anchor=new T.Object3D();anchor.name='Local night light source';
  anchor.userData.nightEmitter={color:new T.Color(color),power,range,decay} satisfies Emitter;
  return anchor;
}

export const LOCAL_LIGHT_BUDGET=12;
type Source={anchor:T.Object3D;settings:Emitter;position:T.Vector3;score:number;active:boolean};
/** Distant fixtures retain their glow; a fixed light budget adds diffuse spill near the view. */
export class LocalNightLighting {
  readonly sources:Source[]=[];
  readonly slots:{light:T.PointLight;source:Source|null}[]=[];
  private scene:T.Scene;
  constructor(scene:T.Scene) {
    this.scene=scene;
    scene.traverse(anchor=>{
      if(anchor.userData.nightEmitter)this.sources.push({anchor,settings:anchor.userData.nightEmitter,position:new T.Vector3(),score:0,active:false});
    });
    for(let i=0;i<LOCAL_LIGHT_BUDGET;i++) {
      const light=new T.PointLight('#ffffff',0,10,2);light.name='Local night illumination';
      scene.add(light);this.slots.push({light,source:null});
    }
  }
  update(dt:number,focus:T.Vector3,night:boolean) {
    if(!night){for(const slot of this.slots){slot.light.intensity=0;slot.source=null;}return;}
    const assigned=new Set(this.slots.map(slot=>slot.source));
    for(const source of this.sources) {
      let visible=true,attached=false;
      for(let ancestor:T.Object3D|null=source.anchor;ancestor;ancestor=ancestor.parent)
        if(!ancestor.visible||ancestor.userData.lightsDisabled){visible=false;break;}else if(ancestor===this.scene)attached=true;
      source.active=visible&&attached;
      if(source.active)source.anchor.getWorldPosition(source.position);
      const d=source.position.distanceToSquared(focus);
      source.score=source.active?((assigned.has(source)?1.15:1)/(9+d)):0;
    }
    const chosen=this.sources.filter(source=>source.active).sort((a,b)=>b.score-a.score).slice(0,LOCAL_LIGHT_BUDGET);
    const desired=new Set(chosen),occupied=new Set(this.slots.map(slot=>slot.source));
    const blend=1-Math.exp(-Math.max(0,dt)*7);
    for(const slot of this.slots) {
      if(slot.source&&!slot.source.active){slot.light.intensity=0;occupied.delete(slot.source);slot.source=null;}
      if(slot.source&&!desired.has(slot.source)) {
        slot.light.intensity*=1-blend;
        if(slot.light.intensity<.025){occupied.delete(slot.source);slot.source=null;}
      }
      if(!slot.source) {
        slot.source=chosen.find(source=>!occupied.has(source))??null;
        if(slot.source)occupied.add(slot.source);
      }
      if(slot.source) {
        const {settings,position}=slot.source;
        slot.light.position.copy(position);slot.light.color.copy(settings.color);slot.light.distance=settings.range;slot.light.decay=settings.decay;
        if(desired.has(slot.source))slot.light.intensity=T.MathUtils.lerp(slot.light.intensity,settings.power,blend);
      }
    }
  }
}

export function beaconStrength(time:number,phase=0,reduced=false) {
  if(reduced)return .5;
  const t=T.MathUtils.euclideanModulo(time+phase,3.2);
  return T.MathUtils.smoothstep(t,0,.18)*(1-T.MathUtils.smoothstep(t,.7,1.05));
}
export function createRooftopBeacon(phase=0) {
  const root=new T.Group();root.name='Rooftop obstruction beacon';root.userData.beaconPhase=phase;
  const rod=new T.Mesh(new T.CylinderGeometry(.045,.07,1.3,8),new T.MeshStandardMaterial({color:'#6d777b',roughness:.6,metalness:.45}));
  rod.position.y=.65;root.add(rod);
  const bulb=new T.Mesh(new T.SphereGeometry(.14,12,8),new T.MeshStandardMaterial({color:'#a51e18',emissive:'#ff3325',emissiveIntensity:0,roughness:.3}));
  bulb.position.y=1.34;bulb.scale.y=1.2;bulb.name='Red beacon lens';root.add(bulb);
  // Independent material: each roof gets a slightly different flash phase.
  const halo=lightHalo('#ff3929',1.35,.38);halo.material=halo.material.clone();halo.position.copy(bulb.position);root.add(halo);
  root.userData.beaconBulb=bulb;root.userData.beaconHalo=halo;return root;
}
export function updateRooftopBeacons(beacons:T.Object3D[],time:number,night:boolean,reduced:boolean) {
  for(const root of beacons) {
    const strength=night?beaconStrength(time,root.userData.beaconPhase,reduced):0;
    const bulb=root.userData.beaconBulb as T.Mesh<T.SphereGeometry,T.MeshStandardMaterial>;
    const halo=root.userData.beaconHalo as T.Sprite;
    bulb.material.emissiveIntensity=strength*3.6;halo.visible=night;halo.material.opacity=strength*.38;
  }
}
