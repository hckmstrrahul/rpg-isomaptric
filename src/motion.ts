/** Pausing ambient animation freezes its clock, so resuming never jumps traffic. */
export function createCityMotion(reduced=false) {
  let enabled=true,elapsed=0;
  return {
    get time(){return elapsed;},
    get reduced(){return reduced;},
    get playing(){return enabled&&!reduced;},
    setEnabled(value:boolean){enabled=value;},
    setReduced(value:boolean){reduced=value;},
    tick(dt:number){if(enabled&&!reduced)elapsed+=Math.max(0,Math.min(dt,.05));return elapsed;},
  };
}
