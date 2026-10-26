import * as T from 'three';

/** Render the actual explorer once into a transparent HUD portrait. */
export function renderCharacterPortrait(renderer:T.WebGLRenderer,body:T.Group,canvas:HTMLCanvasElement,environment:T.Texture|null) {
  const portrait=new T.Scene(),model=body.clone(true);model.position.set(0,0,0);model.rotation.set(0,0,0);
  portrait.add(model);portrait.environment=environment;portrait.environmentIntensity=.45;
  portrait.add(new T.HemisphereLight('#e6f2ed','#667349',2));
  const key=new T.DirectionalLight('#fff1d2',3);key.position.set(-3,6,5);portrait.add(key);
  const fill=new T.DirectionalLight('#bddde4',.7);fill.position.set(4,3,-2);portrait.add(fill);
  const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3());
  const camera=new T.OrthographicCamera(-1,1,1,-1,.1,30);
  camera.position.copy(center).add(new T.Vector3(4,2.1,6));camera.lookAt(center);camera.updateMatrixWorld();
  // Fit the entire posed model, including its launcher and boots, in camera space.
  const projected=new T.Box3();
  for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z])
    projected.expandByPoint(new T.Vector3(x,y,z).applyMatrix4(camera.matrixWorldInverse));
  const aspect=canvas.width/canvas.height,halfHeight=Math.max((projected.max.y-projected.min.y)/2,(projected.max.x-projected.min.x)/2/aspect)*1.08;
  const midX=(projected.min.x+projected.max.x)/2,midY=(projected.min.y+projected.max.y)/2;
  camera.left=midX-halfHeight*aspect;camera.right=midX+halfHeight*aspect;camera.top=midY+halfHeight;camera.bottom=midY-halfHeight;camera.updateProjectionMatrix();
  const target=new T.WebGLRenderTarget(canvas.width,canvas.height,{depthBuffer:true});
  target.texture.colorSpace=T.SRGBColorSpace;
  const previousTarget=renderer.getRenderTarget(),color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha();
  const exposure=renderer.toneMappingExposure,shadows=renderer.shadowMap.enabled;
  try {
    renderer.shadowMap.enabled=false;renderer.toneMappingExposure=1.04;
    renderer.setRenderTarget(target);renderer.setClearColor(0x000000,0);renderer.clear();renderer.render(portrait,camera);
    const pixels=new Uint8Array(canvas.width*canvas.height*4);renderer.readRenderTargetPixels(target,0,0,canvas.width,canvas.height,pixels);
    const context=canvas.getContext('2d')!,image=context.createImageData(canvas.width,canvas.height),stride=canvas.width*4;
    // WebGL rows start at the bottom; canvas rows start at the top.
    for(let y=0;y<canvas.height;y++)image.data.set(pixels.subarray((canvas.height-1-y)*stride,(canvas.height-y)*stride),y*stride);
    context.putImageData(image,0,0);
  } finally {
    renderer.setRenderTarget(previousTarget);renderer.setClearColor(color,alpha);renderer.toneMappingExposure=exposure;renderer.shadowMap.enabled=shadows;
    target.dispose();
  }
}
