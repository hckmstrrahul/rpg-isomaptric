import * as T from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createCityComposer(renderer:T.WebGLRenderer,scene:T.Scene,camera:T.Camera,width:number,height:number) {
  // Bloom blends back into its input. An MSAA input may have had its color
  // renderbuffer invalidated after resolve, leaving undefined rectangular tiles.
  // Keep postprocessing single-sample and antialias the completed image instead.
  const target=new T.WebGLRenderTarget(width,height,{type:T.HalfFloatType,samples:0});
  const composer=new EffectComposer(renderer,target);
  composer.addPass(new RenderPass(scene,camera));
  const bloom=new UnrealBloomPass(new T.Vector2(width,height),.14,.24,1.12);
  composer.addPass(bloom);
  composer.addPass(new SMAAPass());
  composer.addPass(new OutputPass());
  composer.setPixelRatio(renderer.getPixelRatio());
  return {composer,bloom};
}
