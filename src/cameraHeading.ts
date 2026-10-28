/** Camera viewing direction, clockwise from north (-Z), on a north-up map. */
export function cameraHeading(offsetX:number,offsetZ:number):number {
  return Math.atan2(-offsetX,offsetZ);
}

export function compassLabel(heading:number):string {
  const degrees=((Math.round(heading*180/Math.PI)%360)+360)%360;
  return `North is up. Camera facing ${degrees} degrees clockwise from north.`;
}
