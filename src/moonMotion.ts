/** A heavier critically damped mass: no oscillation or overshoot on arrival. */
export const MOON_SPRING={mass:3,stiffness:75,damping:30};
export const MOON_POSITION={x:-82,y:70,z:18};
// c = 2√(km): the critical limit dissipates energy without a bounce.
const frequency=MOON_SPRING.damping/(2*MOON_SPRING.mass);
function spring(value:number,velocity:number,target:number,dt:number) {
  const offset=value-target,b=velocity+frequency*offset,e=Math.exp(-frequency*dt);
  return {value:target+e*(offset+b*dt),velocity:e*(velocity-frequency*b*dt)};
}

export function createMoonMotion(reduced=false) {
  let night=false,x=MOON_POSITION.x,y=MOON_POSITION.y,vx=0,vy=0,tx=x,ty=y,opacity=0;
  return {
    setNight(value:boolean) {
      if(value===night)return;
      night=value;
      if(value) {
        if(opacity<.001){x=MOON_POSITION.x;y=-90;vx=vy=0;}
        tx=MOON_POSITION.x;ty=MOON_POSITION.y;
      } else {tx=MOON_POSITION.x;ty=230;}
      if(reduced){x=MOON_POSITION.x;y=MOON_POSITION.y;vx=vy=0;}
    },
    setReduced(value:boolean){reduced=value;if(value){x=MOON_POSITION.x;y=MOON_POSITION.y;vx=vy=0;}},
    tick(dt:number) {
      dt=Math.max(0,Math.min(dt,.05));
      if(dt===0)return {x,y,z:MOON_POSITION.z,opacity,night};
      if(!reduced) {
        const nextX=spring(x,vx,tx,dt),nextY=spring(y,vy,ty,dt);
        x=nextX.value;vx=nextX.velocity;y=nextY.value;vy=nextY.velocity;
      }
      const target=night?1:0;
      opacity=target+(opacity-target)*Math.exp(-dt/(reduced?.04:.32));
      if(Math.abs(opacity-target)<.001)opacity=target;
      return {x,y,z:MOON_POSITION.z,opacity,night};
    },
  };
}
