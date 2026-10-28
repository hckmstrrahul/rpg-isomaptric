import * as T from 'three';
import {Builder,vec} from './geometry.ts';
import {glowMaterial,nightOnly,registerGlow,registerThemeColor} from './lighting.ts';

const glazing=new Map<string,T.MeshStandardMaterial>();
const litGlazing=new WeakMap<T.MeshStandardMaterial,T.MeshStandardMaterial>();
// Pin-sized bulbs need only a six-sided silhouette, not the architectural sphere.
const bulbGeometry=new T.SphereGeometry(1,6,4);
/** Tag only cabin glazing, so hull paint and other vehicles remain untouched. */
export function boatCabinGlass(color:string,roughness=.3,metalness=.15){
 const key=`${color}:${roughness}:${metalness}`;
 if(!glazing.has(key)){const mat=new T.MeshStandardMaterial({color,roughness,metalness});mat.name='Boat cabin glazing';mat.userData.boatCabin=true;glazing.set(key,mat);}
 return glazing.get(key)!;
}
export type BoatLighting={cabin?:boolean;party?:{beam:number;length:number;height:number;z?:number;supportHeight?:number;sideFraction?:number};lantern?:{x:number;y:number;z:number}};
/** Moving accents stay attached to the boat; no point lights, halos or frame work. */
export function lightBoat(root:T.Group,options:BoatLighting){
 let windows=0;
 if(options.cabin)root.traverse(o=>{
  if(!(o instanceof T.Mesh))return;
  const illuminate=(base:T.Material)=>{
   if(!(base instanceof T.MeshStandardMaterial)||!base.userData.boatCabin)return base;
   windows++;
   if(!litGlazing.has(base)){
    const mat=base.clone();mat.name='Warm occupied boat cabin';mat.emissive.set('#ffda9b');
    registerGlow(mat,.85);registerThemeColor(mat,`#${base.color.getHexString()}`,'#b9ad8c');litGlazing.set(base,mat);
   }
   return litGlazing.get(base)!;
  };
  o.material=Array.isArray(o.material)?o.material.map(illuminate):illuminate(o.material);
 });
 const b=new Builder();let bulbs=0;
 if(options.party){
  const {beam,length,height,z=0,supportHeight=height-.16,sideFraction=.39}=options.party,colors=['#ffdda3','#a1dcd6','#ffdda3','#e7a9bd'];
  for(const side of [-1,1]){
   let previous:T.Vector3|undefined;
   for(let i=0;i<=8;i++){
    const t=i/8,p=vec(side*beam*sideFraction,height-.10*Math.sin(t*Math.PI),z+(t-.5)*length*.60);
    if(i===0||i===8)b.beam(vec(p.x,supportHeight,p.z),p,.012,'#647578',4);
    if(previous)b.beam(previous,p,.008,'#647578',4);
    b.add(bulbGeometry,glowMaterial(colors[i%4],3.6),p.x,p.y,p.z,.034,.04,.034);previous=p;bulbs++;
   }
  }
 }
 if(options.lantern){const {x,y,z}=options.lantern;b.box(x,y,z,.10,.14,.10,glowMaterial('#ffe1ab',3.6));bulbs++;}
 if(bulbs){
  const accents=b.finish();accents.name='Boat night deck accents';accents.traverse(o=>{o.userData.nonSolid=true;o.raycast=()=>{};if(o instanceof T.Mesh){o.castShadow=false;o.receiveShadow=false;}});
  root.add(nightOnly(accents));
 }
 root.userData.nightBoatLighting={windows,bulbs,party:!!options.party};
 return root;
}
