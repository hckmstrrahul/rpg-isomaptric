import * as T from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import type { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import type { World, createCharacter } from './world.ts';
import { surfaceHeight } from './layout.ts';

type CaptureOptions={time?:number;night?:boolean;zoom?:number;focus?:[number,number,number];offset?:[number,number,number];character?:{x:number;z:number;yaw?:number;running?:boolean};ui?:'all'|'brand'|'none'};
type Context={scene:T.Scene;renderer:T.WebGLRenderer;composer:EffectComposer;camera:T.OrthographicCamera;controls:OrbitControls;world:World;character:ReturnType<typeof createCharacter>;pause:()=>void;setNight:(night:boolean)=>void;settleMoon:()=>void;reflect:()=>void;refreshHud:()=>void};

/** Only included in an explicitly enabled capture build; absent from production bundles. */
export function installCaptureControls(ctx:Context) {
  const {scene,renderer,composer,camera,controls,world,character}=ctx;
  const style=document.createElement('style');
  style.textContent='html[data-capture-ui="none"] .ui,html[data-capture-ui="none"] .skip-link,html[data-capture-ui="brand"] .ui:not(.brand),html[data-capture-ui="brand"] .skip-link{visibility:hidden!important}';document.head.append(style);
  let night=false;
  const render=(options:CaptureOptions={})=>{
    ctx.pause();night=options.night??night;ctx.setNight(night);ctx.settleMoon();
    document.documentElement.dataset.captureUi=options.ui??'none';
    const hero=options.character,time=options.time??20;
    if(hero){character.root.position.set(hero.x,surfaceHeight(hero.x,hero.z)+.13,hero.z);character.body.rotation.y=hero.yaw??Math.PI/2;}
    character.animate(time,hero?.running??false,hero?.running??false,true);
    if(options.focus)controls.target.fromArray(options.focus);
    camera.position.copy(controls.target).add(new T.Vector3(...(options.offset??[215,185,235])));
    controls.maxZoom=Math.max(controls.maxZoom,options.zoom??0);camera.zoom=options.zoom??camera.zoom;camera.updateProjectionMatrix();controls.update();camera.updateMatrixWorld();
    world.update(time,character.root.position,night);world.objects.update(time);world.updateClock(new Date('2026-10-26T10:10:00Z'));
    for(let i=0;i<30;i++)world.updateLights(1/30,controls.target,time,night,false);
    ctx.refreshHud();ctx.reflect();composer.render();
    return {zoom:camera.zoom,night,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
  };
  const head=(size=256)=>{
    const portrait=new T.Scene(),model=character.body.getObjectByName('Face, sculpted hair and brass goggles')!.clone(true);
    model.position.set(0,0,0);model.rotation.set(0,0,0);portrait.add(model);portrait.environment=scene.environment;portrait.environmentIntensity=.35;
    portrait.add(new T.HemisphereLight('#eef4f1','#6a6e59',2));const key=new T.DirectionalLight('#fff0d2',3);key.position.set(-3,4,5);portrait.add(key);
    const bounds=new T.Box3().setFromObject(model),center=bounds.getCenter(new T.Vector3()),view=new T.OrthographicCamera(-.42,.42,.42,-.42,.1,20);
    view.position.copy(center).add(new T.Vector3(.8,.35,4));view.lookAt(center);
    const target=new T.WebGLRenderTarget(size,size);target.texture.colorSpace=T.SRGBColorSpace;
    const previous=renderer.getRenderTarget(),color=renderer.getClearColor(new T.Color()),alpha=renderer.getClearAlpha(),exposure=renderer.toneMappingExposure;
    renderer.setRenderTarget(target);renderer.setClearColor('#171c22',0);renderer.toneMappingExposure=1.04;renderer.clear();renderer.render(portrait,view);
    const bytes=new Uint8Array(size*size*4);renderer.readRenderTargetPixels(target,0,0,size,size,bytes);
    renderer.setRenderTarget(previous);renderer.setClearColor(color,alpha);renderer.toneMappingExposure=exposure;target.dispose();
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;const context=canvas.getContext('2d')!,data=context.createImageData(size,size);
    for(let y=0;y<size;y++)data.data.set(bytes.subarray((size-1-y)*size*4,(size-y)*size*4),y*size*4);
    context.putImageData(data,0,0);return canvas.toDataURL('image/png');
  };
  Object.defineProperty(window,'__capture',{value:{render,head}});
}
