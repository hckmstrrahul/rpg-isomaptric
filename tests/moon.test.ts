import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createMoonMotion, MOON_POSITION, MOON_SPRING } from '../src/moonMotion.ts';
import { createMoon } from '../src/moon.ts';

test('moon always enters from below and exits upward on the same vertical path',()=>{
  const motion=createMoonMotion();motion.setNight(true);
  let state=motion.tick(0);assert.equal(state.x,MOON_POSITION.x);assert.ok(state.y< -12);
  const entryY=state.y;state=motion.tick(.05);assert.ok(state.y>entryY);
  for(let i=0;i<180;i++)state=motion.tick(1/60);
  assert.ok(Math.abs(state.x-MOON_POSITION.x)<.001&&Math.abs(state.y-MOON_POSITION.y)<.001);assert.equal(state.opacity,1);
  motion.setNight(false);
  const restY=state.y;state=motion.tick(.05);assert.ok(state.y>restY);
  for(let i=0;i<180;i++)state=motion.tick(1/60);
  assert.ok(state.y>150);assert.equal(state.x,MOON_POSITION.x);assert.equal(state.opacity,0);
  motion.setNight(true);state=motion.tick(0);assert.ok(state.y< -12);
});

test('rapid moon toggles preserve position and reduced motion uses only a fade',()=>{
  const motion=createMoonMotion();motion.setNight(true);motion.tick(.05);
  const before=motion.tick(.05);motion.setNight(false);const after=motion.tick(0);
  assert.equal(before.x,after.x);assert.equal(before.y,after.y);assert.equal(before.opacity,after.opacity);
  motion.setNight(true);assert.deepEqual(motion.tick(0),{...after,night:true});
  motion.setReduced(true);
  for(let i=0;i<6;i++){const state=motion.tick(.05);assert.equal(state.y,MOON_POSITION.y);}
  motion.setNight(false);assert.equal(motion.tick(.05).y,MOON_POSITION.y);
});

test('the moon uses critical mass damping and settles monotonically at every frame rate',()=>{
  assert.equal(MOON_SPRING.damping**2,4*MOON_SPRING.mass*MOON_SPRING.stiffness);
  for(const fps of [30,60,120]){
    const motion=createMoonMotion();motion.setNight(true);let previous=motion.tick(0),firstStep=0,peakStep=0;
    for(let frame=1;frame<=fps*4;frame++){
      const next=motion.tick(1/fps),step=next.y-previous.y;
      assert.ok(step>=0&&next.y<=MOON_POSITION.y,'Entrance never reverses or overshoots');
      if(frame===1)firstStep=step;peakStep=Math.max(peakStep,step);previous=next;
    }
    assert.ok(firstStep<peakStep*.25,'The moon accelerates softly from rest');
    assert.ok(Math.abs(previous.y-MOON_POSITION.y)<.001);
    motion.setNight(false);
    for(let frame=0;frame<fps*4;frame++){
      const next=motion.tick(1/fps);assert.ok(next.y>=previous.y&&next.y<=230);previous=next;
    }
  }
});

test('moon stays in world space through pan, orbit and zoom, with matching local and shadow light',()=>{
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-170,170,126,-126,.1,1800);
  const light=new T.DirectionalLight();light.castShadow=true;scene.add(light);
  const moon=createMoon(scene,light,{color:new T.Texture(),height:new T.Texture()},true);
  moon.setNight(true);
  for(const position of [[215,185,235],[-240,150,200],[150,320,-200]]){
    camera.position.set(...position as [number,number,number]);camera.lookAt(0,2,0);camera.updateMatrixWorld();
    for(let i=0;i<10;i++)moon.update(.05);
    assert.ok(light.position.distanceTo(moon.root.position)<1e-8);
    assert.ok(moon.root.position.y>0);assert.ok(light.intensity>0&&light.intensity<=.5);
    assert.deepEqual(moon.root.position.toArray(),Object.values(MOON_POSITION));
    assert.ok(moon.localLight.position.distanceTo(moon.root.position)<1e-8);assert.ok(moon.localLight.intensity>0);
  }
  assert.equal(moon.halo.geometry.type,'SphereGeometry');
  const before=moon.root.position.clone().project(camera),radius=moon.root.scale.x;
  camera.position.x+=40;camera.updateMatrixWorld();moon.update(.05);
  assert.ok(moon.root.position.clone().project(camera).distanceTo(before)>.1,'Panning changes the moon’s screen position');
  const beforeZoom=moon.root.position.clone().project(camera);camera.zoom=2;camera.updateProjectionMatrix();moon.update(.05);
  assert.ok(Math.abs(moon.root.position.clone().project(camera).x-beforeZoom.x*2)<1e-8);
  assert.equal(moon.root.scale.x,radius,'Zoom uses perspective/frustum sizing, not a compensating moon scale');
  moon.setNight(false);for(let i=0;i<10;i++)moon.update(.05);
  assert.deepEqual(light.position.toArray(),[-90,170,60]);assert.equal(moon.root.visible,false);
  assert.equal(moon.localLight.intensity,0);
});

test('textured moon keeps its depth and halo ordering throughout the rise and exposes smooth illumination',()=>{
  const scene=new T.Scene(),light=new T.DirectionalLight(),color=new T.Texture(),height=new T.Texture();
  const moon=createMoon(scene,light,{color,height});
  const surface=moon.root.children.find(child=>child.name==='LROC textured lunar surface') as T.Mesh<T.SphereGeometry,T.ShaderMaterial>;
  moon.setNight(true);let previous=0,sawFade=false;
  for(let frame=0;frame<240;frame++){
    moon.update(1/60);
    assert.equal(surface.material.depthWrite,true,'No material-depth switch near full opacity');
    assert.ok(surface.renderOrder<moon.halo.renderOrder,'The surface occludes the center of the glow');
    assert.equal(surface.material.uniforms.colorMap.value,color);
    assert.equal(surface.material.uniforms.heightMap.value,height);
    const opacity=surface.material.uniforms.opacity.value;
    if(opacity>0&&opacity<.99)sawFade=true;
    assert.ok(moon.reveal>=previous&&moon.reveal<=1);
    assert.ok(moon.reveal-previous<.06,'Moon illumination has no one-frame jump');
    assert.ok(Math.abs(moon.localLight.intensity/1350-moon.reveal)<1e-12);
    previous=moon.reveal;
  }
  assert.ok(sawFade);assert.equal(moon.reveal,1);
});

test('only the visible moon surface is clickable, never its halo',()=>{
  const moon=createMoon(new T.Scene(),new T.DirectionalLight(),{color:new T.Texture(),height:new T.Texture()},true);
  const center=new T.Vector3(...Object.values(MOON_POSITION) as [number,number,number]);
  const ray=new T.Raycaster(center.clone().add(new T.Vector3(0,0,100)),new T.Vector3(0,0,-1));
  assert.equal(moon.hitDistance(ray),null,'Daytime moon has no hidden hit target');
  moon.setNight(true);for(let i=0;i<10;i++)moon.update(.05);
  assert.ok(Math.abs(moon.hitDistance(ray)!-91)<.1);
  ray.ray.origin.x+=15;
  assert.ok(ray.intersectObject(moon.halo,false).length>0,'Probe lies inside the visible halo');
  assert.equal(moon.hitDistance(ray),null,'Halo-only click must retain ordinary scene interaction');
  moon.setNight(false);for(let i=0;i<10;i++)moon.update(.05);
  ray.ray.origin.x-=15;assert.equal(moon.hitDistance(ray),null);
});
