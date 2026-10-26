import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createExploreFlight, flightClearance } from '../src/exploreFlight.ts';
import { createCharacter } from '../src/character.ts';
import { GROUND } from '../src/layout.ts';

test('Explore flight clears the complete building corridor, stays within its route and lands exactly once',()=>{
  const from=new T.Vector3(-50,GROUND+.13,0),to=new T.Vector3(50,GROUND+.53,0);
  const tower={x:0,z:0,w:8,d:8,height:43,baseY:GROUND};
  const obstacles=[tower,{...tower,z:30,height:200},{...tower,x:25,height:150,destroyed:true}];
  const flight=createExploreFlight(from,to,obstacles);assert.ok(flight.height>40);assert.ok(flight.duration<1.6);
  let contacts=0,prone=false,crossed=false,last=from.clone();
  while(flight.active) {
    const frame=flight.tick(1/120)!;contacts+=Number(frame.landed);prone ||= frame.lean>.9;assert.equal(frame.impact,0);
    assert.ok(frame.position.x>=from.x&&frame.position.x<=to.x&&frame.position.x>=last.x);
    assert.ok(frame.position.y>=Math.min(from.y,to.y));assert.equal(frame.position.z,0);
    if(Math.abs(frame.position.x)<4.45){assert.ok(frame.position.y>=GROUND+45.5);crossed=true;}
    last=frame.position;
  }
  assert.deepEqual(last.toArray(),to.toArray());assert.equal(contacts,1);assert.ok(prone&&crossed);
  assert.equal(flight.tick(.05),null);assert.deepEqual(from.toArray(),[-50,GROUND+.13,0]);
});

test('repeated clicks can retarget from the current aerial pose without resetting position or adding unnecessary height',()=>{
  const first=createExploreFlight(new T.Vector3(-50,2,0),new T.Vector3(50,2,0),[]);
  let frame=first.tick(.1)!;for(let i=0;i<4;i++)frame=first.tick(.1)!;
  assert.ok(frame.airborne&&frame.lean>0);
  const target=new T.Vector3(20,2,30),second=createExploreFlight(frame.position,target,[],false,frame.lean);
  const start=second.tick(0)!;assert.deepEqual(start.position.toArray(),frame.position.toArray());assert.equal(start.lean,frame.lean);
  assert.ok(second.height<=14);
  let end=start;while(second.active)end=second.tick(1/60)!;
  assert.deepEqual(end.position.toArray(),target.toArray());
});

test('flight timing is stable at different frame rates and reduced motion goes straight to the destination',()=>{
  const from=new T.Vector3(-30,2,0),to=new T.Vector3(50,2,40);
  const sample=(fps:number)=>{const flight=createExploreFlight(from,to,[]);let frame=flight.tick(0)!;for(let i=0;i<fps/2;i++)frame=flight.tick(1/fps)!;return frame;};
  const a=sample(30),b=sample(120);assert.ok(a.position.distanceTo(b.position)<1e-9);assert.ok(Math.abs(a.lean-b.lean)<1e-9);
  const flight=createExploreFlight(from,to,[],true),frame=flight.tick(.016)!;
  assert.deepEqual(frame.position.toArray(),to.toArray());assert.equal(frame.airborne,false);assert.equal(frame.lean,0);assert.equal(frame.impact,0);assert.equal(frame.landed,true);assert.equal(flight.active,false);
  const interrupted=createExploreFlight(from,to,[]);interrupted.tick(.1);interrupted.setReduced(true);
  assert.deepEqual(interrupted.tick(.016)!.position.toArray(),to.toArray());
});

test('the clearance audit catches narrow obstacles between samples and ignores inactive objects',()=>{
  const from=new T.Vector3(-100,2,-100),to=new T.Vector3(100,2,100);
  const sliver={x:33.333,z:33.333,w:.01,d:.01,height:70,baseY:GROUND};
  assert.ok(flightClearance(from,to,[sliver])>70);
  assert.equal(flightClearance(from,to,[{...sliver,active:false}]),14);
});

test('the explorer starts unarmed, flies with a prone pose and returns to the selected equipment after landing',()=>{
  const hero=createCharacter(),launcher=hero.body.getObjectByName('Brass bomb launcher')!;
  hero.animate(0,false,false);assert.equal(launcher.visible,false);
  hero.setTool('bomb');hero.animate(1,false,false);assert.equal(launcher.visible,true);
  hero.setTool('explore');hero.animate(2,true,false);assert.equal(launcher.visible,false);
  const flight=createExploreFlight(new T.Vector3(-20,2,0),new T.Vector3(30,2,0),[]);
  let frame=flight.tick(.1)!;for(let i=0;i<3;i++)frame=flight.tick(.1)!;
  hero.setTool('bomb');hero.setNight(true);hero.animate(3,false,false,true,frame);
  assert.ok(hero.body.rotation.x>1);assert.equal(launcher.visible,false);assert.equal(hero.ring.visible,false);
  assert.equal(hero.root.getObjectByName('Soft ground light')!.visible,false);
  hero.animate(4,false,false);assert.equal(hero.body.rotation.x,0);assert.equal(launcher.visible,true);assert.equal(hero.ring.visible,true);
  hero.setTool('tree');hero.animate(5,false,false);assert.equal(launcher.visible,false);
  hero.root.traverse(object=>assert.ok([...object.position.toArray(),...object.rotation.toArray().slice(0,3)].every(value=>Number.isFinite(value))));
});

test('the camera zoom envelope eases out and back without overshooting or landing shake',()=>{
  const flight=createExploreFlight(new T.Vector3(-50,2,0),new T.Vector3(50,2,0),[]);
  const frames=[];while(flight.active)frames.push(flight.tick(1/120)!);
  assert.ok(Math.min(...frames.map(frame=>frame.zoomFactor))<.87);
  assert.ok(frames.every(frame=>frame.zoomFactor>=.86&&frame.zoomFactor<=1&&frame.impact===0));
  assert.equal(frames.at(-1)!.zoomFactor,1);assert.equal(frames.at(-1)!.position.y,2);
  const mid=Math.floor(frames.length/2);
  for(let i=1;i<mid;i++)assert.ok(frames[i].zoomFactor<=frames[i-1].zoomFactor);
  for(let i=mid+1;i<frames.length;i++)assert.ok(frames[i].zoomFactor>=frames[i-1].zoomFactor);
  const retarget=createExploreFlight(frames[mid].position,new T.Vector3(40,2,40),[],false,1,frames[mid].zoomFactor);
  assert.equal(retarget.tick(0)!.zoomFactor,frames[mid].zoomFactor);
});
