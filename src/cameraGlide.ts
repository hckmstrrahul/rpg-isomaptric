import * as T from 'three';

export const BIRDVIEW_ZOOM=3;
// Reuse the camera's exponential settling rate while continuously retargeting
// the moving explorer. Birdview keeps this gentle pan even during walking.
export function cameraPanFactor(dt:number,moving:boolean,birdview:boolean,reduced=false) {
  return reduced||(moving&&!birdview)?1:1-Math.exp(-Math.max(0,dt)*6);
}
export function createCameraGlide(from:T.Vector3,to:T.Vector3,reduced=false) {
  const start=from.clone(),end=to.clone();let elapsed=0,active=true;
  return {
    get active(){return active;},cancel(){active=false;},setReduced(value:boolean){reduced=value;},
    tick(dt:number){
      if(!active)return null;
      elapsed+=Math.max(0,Math.min(.1,dt));const t=reduced?1:Math.min(1,elapsed/2.4),eased=(1-Math.cos(Math.PI*t))/2;
      if(t===1)active=false;return start.clone().lerp(end,eased);
    },
  };
}
