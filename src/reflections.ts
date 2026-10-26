import * as T from 'three';
import type { riverMaterial } from './nature.ts';

/** An orthographic mirror camera captures the actual city, including its lights. */
export function createRiverReflections(scene:T.Scene,water:T.Mesh,camera:T.OrthographicCamera,river:ReturnType<typeof riverMaterial>) {
  const target=new T.WebGLRenderTarget(768,768,{type:T.HalfFloatType,depthBuffer:true});
  target.texture.colorSpace=T.LinearSRGBColorSpace;target.texture.name='River reflection';
  river.reflectionTexture.value=target.texture;
  const reflected=camera.clone(),direction=new T.Vector3(),look=new T.Vector3(),viewport=new T.Vector4(),scissor=new T.Vector4();
  const clip=new T.Plane(new T.Vector3(0,1,0),-water.position.y-.015);
  const bias=new T.Matrix4().set(.5,0,0,.5,0,.5,0,.5,0,0,.5,.5,0,0,0,1);
  let last=-Infinity;
  return {target,update:(renderer:T.WebGLRenderer,now:number)=>{
    if(now-last<50)return;last=now;
    camera.updateMatrixWorld();reflected.copy(camera);
    camera.getWorldDirection(direction);look.copy(camera.position).add(direction);
    reflected.position.y=2*water.position.y-camera.position.y;look.y=2*water.position.y-look.y;
    reflected.up.copy(camera.up);reflected.up.y*=-1;reflected.lookAt(look);reflected.updateMatrixWorld();
    river.reflectionMatrix.value.copy(bias).multiply(reflected.projectionMatrix).multiply(reflected.matrixWorldInverse);
    const previous={target:renderer.getRenderTarget(),clipping:renderer.clippingPlanes,shadow:renderer.shadowMap.autoUpdate,xr:renderer.xr.enabled,tone:renderer.toneMapping,scissor:renderer.getScissorTest(),visible:water.visible};
    renderer.getViewport(viewport);renderer.getScissor(scissor);
    try {
      water.visible=false;renderer.xr.enabled=false;renderer.shadowMap.autoUpdate=false;
      renderer.clippingPlanes=[clip];renderer.toneMapping=T.NoToneMapping;renderer.setRenderTarget(target);renderer.setScissorTest(false);
      renderer.clear();renderer.render(scene,reflected);
    } finally {
      water.visible=previous.visible;renderer.clippingPlanes=previous.clipping;renderer.shadowMap.autoUpdate=previous.shadow;renderer.xr.enabled=previous.xr;renderer.toneMapping=previous.tone;
      renderer.setRenderTarget(previous.target);renderer.setViewport(viewport);renderer.setScissor(scissor);renderer.setScissorTest(previous.scissor);
    }
  },dispose:()=>target.dispose()};
}
