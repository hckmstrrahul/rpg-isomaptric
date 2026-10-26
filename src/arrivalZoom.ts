export const ARRIVAL_DELAY=.45;
export const ARRIVAL_DURATION=4;

/** One slow, interruptible introduction after the loading screen clears. */
export function createArrivalZoom(from:number,to:number,reduced=false) {
  let elapsed=0,active=true;
  return {
    get active(){return active;},
    cancel(){active=false;},
    setReduced(value:boolean){reduced=value;},
    tick(dt:number):number|null {
      if(!active)return null;
      if(reduced){active=false;return to;}
      elapsed+=Math.max(0,Math.min(dt,.1));
      const progress=Math.min(1,Math.max(0,(elapsed-ARRIVAL_DELAY)/ARRIVAL_DURATION));
      // easeInOutSine (easings.net): gentle acceleration and no abrupt final stop.
      const eased=(1-Math.cos(Math.PI*progress))/2;
      if(progress===1){active=false;return to;}
      // Interpolate magnification proportionally, so the wide end does not rush.
      return Math.exp(Math.log(from)+(Math.log(to)-Math.log(from))*eased);
    },
  };
}
