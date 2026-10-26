import * as T from 'three';

const emitters=new Map<T.MeshStandardMaterial,{night:number;day:number}>();
const nightOpacity=new Map<T.Material&{opacity:number},number>();
const nightObjects=new Set<T.Object3D>();
const nightLights=new Map<T.PointLight,number>();
const themeColors=new Map<T.MeshStandardMaterial,{day:T.Color;night:T.Color}>();
let night=false;
export function registerThemeColor(material:T.MeshStandardMaterial,day:string,dark:string) {
  const colors={day:new T.Color(day),night:new T.Color(dark)};
  themeColors.set(material,colors);material.userData.themeColor=true;
  material.color.copy(night?colors.night:colors.day);return material;
}
export function registerGlow(material:T.MeshStandardMaterial,strength:number,dayStrength=0) {
  emitters.set(material,{night:strength,day:dayStrength});material.emissiveIntensity=night?strength:dayStrength;return material;
}
export function registerNightOpacity<M extends T.Material>(material:M,opacity:number):M {
  nightOpacity.set(material,opacity);material.userData.nightOpacity=opacity;material.opacity=night?opacity:0;return material;
}
export function nightOnly<O extends T.Object3D>(object:O):O {
  nightObjects.add(object);object.visible=night;return object;
}
export function releaseNightObject(object:T.Object3D) {nightObjects.delete(object);}
export function nightAccent(color:string,intensity:number,distance:number) {
  const light=new T.PointLight(color,night?intensity:0,distance,2);
  light.name='Warm landmark uplight';nightLights.set(light,intensity);return light;
}
const lights=new Map<string,T.MeshStandardMaterial>();
export function glowMaterial(color='#ffd99b',strength=3) {
  const key=`${color}:${strength}`;
  if(!lights.has(key)) {
    const emission=strength*.45;
    const mat=registerGlow(new T.MeshStandardMaterial({color,emissive:color,roughness:.4}),emission);mat.userData.glowStrength=emission;lights.set(key,mat);
  }
  return lights.get(key)!;
}
const glowBatches=new Map<number,T.MeshStandardMaterial>();
export function glowBatch(strength:number) {
  if(!glowBatches.has(strength)) {
    const mat=registerGlow(new T.MeshStandardMaterial({color:'#ffffff',emissive:'#ffffff',vertexColors:true,roughness:.4}),strength);
    mat.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n#ifdef USE_COLOR\ntotalEmissiveRadiance*=vColor.rgb;\n#endif');};
    mat.customProgramCacheKey=()=> 'colored-night-emission';glowBatches.set(strength,mat);
  }
  return glowBatches.get(strength)!;
}
export function setNightMaterials(value:boolean) {
  night=value;for(const [mat,strength]of emitters)mat.emissiveIntensity=value?strength.night:strength.day;
  for(const [mat,colors]of themeColors)mat.color.copy(value?colors.night:colors.day);
  for(const [mat,opacity]of nightOpacity)mat.opacity=value?opacity:0;
  for(const object of nightObjects)object.visible=value;
  for(const [light,intensity]of nightLights)light.intensity=value?intensity:0;
}
let glowTexture:T.DataTexture|undefined;
export function softGlowTexture() {
  if(!glowTexture) {
    const size=64,data=new Uint8Array(size*size*4);
    for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
      const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1),i=(y*size+x)*4;
      data.set([255,255,255,Math.max(0,1-r*r)**3*255],i);
    }
    const map=new T.DataTexture(data,size,size);map.colorSpace=T.SRGBColorSpace;map.magFilter=map.minFilter=T.LinearFilter;map.needsUpdate=true;
    glowTexture=map;
  }
  return glowTexture;
}
const poolMaterials=new Map<string,T.MeshBasicMaterial>();
export function lightPool(radius=2.5,color='#ffce8c',opacity=.23) {
  const key=`${color}:${opacity}`;
  if(!poolMaterials.has(key))poolMaterials.set(key,registerNightOpacity(new T.MeshBasicMaterial({color,map:softGlowTexture(),transparent:true,alphaTest:.002,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),opacity));
  const pool=new T.Mesh(new T.PlaneGeometry(radius*2,radius*2),poolMaterials.get(key)!);
  pool.name='Soft ground light';pool.rotation.x=-Math.PI/2;pool.position.y=.025;pool.userData.nonSolid=true;pool.raycast=()=>{};return nightOnly(pool);
}
const haloMaterials=new Map<string,T.SpriteMaterial>();
export function lightHalo(color:string,size:number,opacity=.2) {
  const key=`${color}:${opacity}`;
  if(!haloMaterials.has(key))haloMaterials.set(key,registerNightOpacity(new T.SpriteMaterial({color,map:softGlowTexture(),transparent:true,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}),opacity));
  const halo=new T.Sprite(haloMaterials.get(key)!);halo.name='Soft fixture halo';halo.scale.setScalar(size);halo.userData.nonSolid=true;halo.raycast=()=>{};return nightOnly(halo);
}
