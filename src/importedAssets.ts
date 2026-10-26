import * as T from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type CityAssets = {
  concrete?:T.MeshStandardMaterial;
  metal?:T.MeshStandardMaterial;
  bin?:T.Group;
  loaded:string[];
};
export type SurfaceMaps = {albedo:T.Texture;normal:T.Texture;orm:T.Texture};

/** The source USD uses sRGB albedo and raw normal / R-occlusion G-roughness B-metal maps. */
export function citySurface(kind:'concrete'|'metal',maps:SurfaceMaps) {
  for(const texture of Object.values(maps)){
    texture.wrapS=texture.wrapT=T.RepeatWrapping;texture.anisotropy=4;
    texture.colorSpace=texture===maps.albedo?T.SRGBColorSpace:T.NoColorSpace;
  }
  const concrete=kind==='concrete';
  const material=new T.MeshStandardMaterial({
    name:`NVIDIA ${concrete?'soft concrete':'painted brushed metal'}`,
    color:concrete?'#e6e3d1':'#8caaa0',map:maps.albedo,normalMap:maps.normal,
    normalScale:new T.Vector2(concrete?.12:.08,concrete?.12:.08),
    roughness:concrete?1:.9,roughnessMap:maps.orm,
    metalness:concrete?0:.45,metalnessMap:concrete?null:maps.orm,
    aoMap:maps.orm,aoMapIntensity:concrete?.18:.25,
  });
  material.userData.worldTile=concrete?3:1;
  return material;
}

/** Optional local assets never prevent the procedural city from opening. */
export async function loadCityAssets():Promise<CityAssets> {
  const textureLoader=new T.TextureLoader(),assets:CityAssets={loaded:[]};
  const loadSurface=async(kind:'concrete'|'metal')=>{
    const maps=await Promise.allSettled(['albedo.webp','normal.png','orm.png'].map(suffix=>textureLoader.loadAsync(`/assets/nvidia/${kind}-${suffix}`)));
    if(maps.some(result=>result.status==='rejected')){
      maps.forEach(result=>{if(result.status==='fulfilled')result.value.dispose();});
      throw new Error(`Unable to load ${kind} maps`);
    }
    const [albedo,normal,orm]=maps.map(result=>(result as PromiseFulfilledResult<T.Texture>).value);
    assets[kind]=citySurface(kind,{albedo,normal,orm});assets.loaded.push(kind);
  };
  const results=await Promise.allSettled([
    loadSurface('concrete'),loadSurface('metal'),
    new GLTFLoader().loadAsync('/assets/nvidia/wheelie-bin.glb').then(gltf=>{
      gltf.scene.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
      assets.bin=gltf.scene;assets.loaded.push('wheelie-bin');
    }),
  ]);
  results.forEach(result=>{if(result.status==='rejected')console.warn('Optional city asset unavailable; using the existing city surfaces.',result.reason);});
  return assets;
}
