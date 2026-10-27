export const BIRDVIEW_ZOOM=3;
// Reuse the camera's exponential settling rate while continuously retargeting
// the moving explorer. Birdview keeps this gentle pan even during walking.
export function cameraPanFactor(dt:number,moving:boolean,birdview:boolean,reduced=false) {
  return reduced||(moving&&!birdview)?1:1-Math.exp(-Math.max(0,dt)*6);
}
