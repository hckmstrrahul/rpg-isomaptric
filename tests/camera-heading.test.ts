import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cameraHeading,compassLabel} from '../src/cameraHeading.ts';
import {hud} from '../src/hud.ts';
import {icon} from '../src/icons.ts';

test('north-up compass points along the camera view for each cardinal orbit',()=>{
  // Offset describes camera position relative to its target, not its look vector.
  for(const [x,z,degrees] of [[0,100,0],[-100,0,90],[0,-100,180],[100,0,270]]){
    const heading=cameraHeading(x,z);
    assert.equal(((Math.round(heading*180/Math.PI)%360)+360)%360,degrees);
    assert.equal(compassLabel(heading),`North is up. Camera facing ${degrees} degrees clockwise from north.`);
    assert.equal(cameraHeading(x*4,z*4),heading,'Zoom cannot change the compass heading');
  }
  const before=cameraHeading(215,235),after=cameraHeading(-235,215);
  assert.ok(Math.abs(after-before-Math.PI/2)<1e-12,'A quarter orbit rotates the heading by a quarter turn');
});

test('camera controls retain Follow with the compass, and use a gun for both firing controls',()=>{
  assert.doesNotMatch(hud,/id="compass"|>Reset<|Reset camera orientation/);
  const button=(id:string)=>hud.match(new RegExp(`<button[^>]+id="${id}"[^>]*>([\\s\\S]*?)<\\/button>`))![1];
  assert.ok(button('follow').includes(icon('compass',20)));
  assert.ok(button('bomb-tool').includes(icon('gun',21)));
  assert.ok(button('use-tool').includes(icon('gun',20)));
  assert.match(hud,/id="map-compass"[\s\S]*?<b>N<\/b><span class="camera-heading"/,'Fixed north and camera heading have separate visual elements');
});
