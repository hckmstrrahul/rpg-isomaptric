import * as T from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function wheelZoomFactor(deltaY:number,pinch:boolean,deltaMode=0) {
  const units=deltaMode===1?16:deltaMode===2?100:1;
  return Math.pow(.95,Math.max(-500,Math.min(500,deltaY*units*(pinch?50:1)))*.01*.85);
}
export function installResponsivePinch(canvas:HTMLCanvasElement,camera:T.OrthographicCamera,controls:OrbitControls,cancelZoom:()=>void) {
  const apply=(zoom:number)=>{
    cancelZoom();camera.zoom=T.MathUtils.clamp(zoom,controls.minZoom,controls.maxZoom);camera.updateProjectionMatrix();controls.update();
  };
  let gestureZoom=1,gestureActive=false;
  canvas.addEventListener('wheel',event=>{
    if(!event.ctrlKey||!controls.enabled)return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!gestureActive)apply(camera.zoom*wheelZoomFactor(event.deltaY,true,event.deltaMode));
  },{passive:false,capture:true});
  // Safari exposes native trackpad pinches as gesture events instead of wheels.
  canvas.addEventListener('gesturestart',event=>{if(!controls.enabled)return;event.preventDefault();gestureActive=true;gestureZoom=camera.zoom;},{passive:false});
  canvas.addEventListener('gesturechange',event=>{
    if(!controls.enabled||!gestureActive)return;event.preventDefault();
    const scale=(event as Event&{scale:number}).scale;if(Number.isFinite(scale)&&scale>0)apply(gestureZoom*Math.pow(scale,2.4));
  },{passive:false});
  canvas.addEventListener('gestureend',()=>{gestureActive=false;});
  const touches=new Set<number>();
  canvas.addEventListener('pointerdown',event=>{if(event.pointerType==='touch'){touches.add(event.pointerId);controls.zoomSpeed=touches.size>1?2.4:.85;}},{capture:true});
  for(const name of ['pointerup','pointercancel','lostpointercapture'])canvas.addEventListener(name,event=>{
    touches.delete((event as PointerEvent).pointerId);controls.zoomSpeed=touches.size>1?2.4:.85;
  });
}
