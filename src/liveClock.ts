import * as T from 'three';
import { Builder, material } from './geometry.ts';

export function clockAngles(date:Date) {
  const seconds=date.getSeconds()+date.getMilliseconds()/1000,minutes=date.getMinutes()+seconds/60;
  return {hour:-(date.getHours()%12+minutes/60)*Math.PI/6,minute:-minutes*Math.PI/30,second:-seconds*Math.PI/30};
}
export function createClockHands() {
  const root=new T.Group(),hour=new T.Group(),minute=new T.Group(),second=new T.Group();
  for(const [pivot,length,width,z,color]of [[hour,1.02,.105,.025,'#263b40'],[minute,1.52,.065,.045,'#263b40'],[second,1.65,.018,.065,'#a64e37']] as const) {
    const b=new Builder();b.box(0,length*.4,0,width,length,.022,color);pivot.add(b.finish());pivot.position.z=z;root.add(pivot);
  }
  const hub=new T.Mesh(new T.SphereGeometry(.09,12,8),material('#b29b5d'));hub.scale.z=.4;hub.position.z=.1;root.add(hub);
  const update=(date:Date)=>{const a=clockAngles(date);hour.rotation.z=a.hour;minute.rotation.z=a.minute;second.rotation.z=a.second;};
  root.name='Local system time · clock hands';return {root,update,hour,minute,second};
}
