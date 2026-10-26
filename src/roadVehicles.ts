import * as T from 'three';
import { Builder, material, vec } from './geometry.ts';
import { createVehicle } from './vehicles.ts';
import { glowMaterial } from './lighting.ts';

export const VEHICLE_TYPES=['bus','car','taxi','van','bike','motorbike','truck','car'] as const;
export type VehicleType=typeof VEHICLE_TYPES[number];
export function createRoadVehicle(kind:VehicleType,color:string) {
  if(kind==='bike'||kind==='motorbike') {
    const motor=kind==='motorbike',b=new Builder(),paint=material(color,.4,.5),metal=material('#425454',.35,.7),r=.26,length=1.62,width=motor?.6:.52;
    for(const [a,c] of [[vec(0,.28,-.53),vec(0,.7,-.12)],[vec(0,.7,-.12),vec(0,.29,.56)],[vec(0,.29,-.53),vec(0,.32,0)],[vec(0,.32,0),vec(0,.7,-.12)],[vec(0,.32,0),vec(0,.64,.36)],[vec(0,.64,.36),vec(0,.29,.56)]])b.beam(a,c,motor?.055:.025,paint);
    b.box(0,.76,-.17,.23,.08,.4,'#273330');b.beam(vec(-.26,.86,.38),vec(.26,.86,.38),.025,metal);
    if(motor){b.sphere(0,.57,.05,.2,.18,.29,paint);b.box(0,.38,-.1,.25,.25,.32,'#4c5753');}
    // A compact helmeted rider, with arms on the bars and legs at the pedals.
    b.sphere(0,1.04,-.15,.17,.28,.13,motor?'#405a6c':'#b66e40');b.sphere(0,1.36,-.08,.13,.14,.13,'#e3d9b9');b.sphere(0,1.43,-.08,.15,.1,.15,motor?'#273947':'#d8a449');
    for(const side of [-1,1]){b.beam(vec(side*.12,1.14,-.12),vec(side*.22,.88,.35),.055,'#8c7760');b.beam(vec(side*.1,.85,-.2),vec(side*.15,.43,.1),.065,'#374a4c');}
    b.sphere(0,.67,.63,.06,.06,.045,glowMaterial('#ffe6ba',2));
    const root=b.finish(),wheels:T.Group[]=[];
    for(const z of [-.55,.56]) {
      const wheel=new T.Group();wheel.position.set(0,r,z);wheel.rotation.y=Math.PI/2;
      const tire=new T.Mesh(new T.TorusGeometry(r,.035,6,20),material('#26322f'));wheel.add(tire);
      const spokes=new Builder();for(let i=0;i<8;i++){const a=i*Math.PI/4;spokes.beam(vec(0,0,0),vec(Math.cos(a)*r,Math.sin(a)*r,0),.009,metal,4);}wheel.add(spokes.finish());root.add(wheel);wheels.push(wheel);
    }
    root.name=motor?'Motorcycle':'Bicycle';
    return {root,wheels,width,length,height:1.55,animate:(distance:number,steering=0)=>{wheels.forEach((w,i)=>{w.rotation.y=Math.PI/2+(i?steering:0);w.rotation.z=distance/r;});}};
  }
  const vehicle=createVehicle(kind==='bus',kind==='taxi'?'#233332':kind==='van'?'#d5ddd4':color),b=new Builder();
  if(kind==='taxi') {b.box(0,1.07,0,.32,.14,.18,'#e5c56b');vehicle.root.name='London black cab';}
  if(kind==='van'||kind==='truck') {
    b.box(0,.88,-.3,kind==='truck'?1.04:.92,.95,1.22,kind==='truck'?'#739692':'#dbe1d7');
    b.box(0,1.39,-.3,1,.08,1.28,'#cbd5c9');
    for(const side of [-1,1])b.box(side*.53,.9,-.29,.015,.13,1,kind==='truck'?'#d4be83':'#4d7c76');
    b.box(0,.83,-.93,.014,.75,.015,'#5d6d69');vehicle.root.name=kind==='truck'?'Delivery truck':'Delivery van';
    vehicle.width=1.1;vehicle.height=1.45;
  }
  vehicle.root.add(b.finish());return vehicle;
}
