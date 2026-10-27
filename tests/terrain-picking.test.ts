import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {projectTerrainRay} from '../src/teleport3d.ts';
import {flightClearance} from '../src/exploreFlight.ts';

test('terrain picking resolves sloping ground at oblique camera angles',()=>{
  const height=(x:number,z:number)=>1.35+12*Math.exp(-((x-10)**2+(z+12)**2)/500);
  for(const [x,z] of [[10,-12],[0,0],[-20,8]]){
    const point=new T.Vector3(x,height(x,z),z);
    for(const offset of [[40,100,80],[-60,90,25]]){
      const origin=point.clone().add(new T.Vector3(...offset));
      const hit=projectTerrainRay(new T.Ray(origin,point.clone().sub(origin).normalize()),height);
      assert.ok(hit&&hit.distanceTo(point)<1e-7);
    }
  }
});

test('flight arc clears intermediate terrain even without a building obstacle',()=>{
  const start=new T.Vector3(-40,1.48,0),end=new T.Vector3(40,1.48,0);
  const hill=(x:number)=>1.35+22*Math.exp(-(x*x)/160);
  const rise=flightClearance(start,end,[],hill);
  for(let i=1;i<100;i++){
    const u=i/100,x=-40+80*u,y=1.48+4*rise*u*(1-u);
    assert.ok(y>hill(x));
  }
});
