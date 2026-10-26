import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { Builder } from '../src/geometry.ts';
import { clockAngles } from '../src/liveClock.ts';
import { wheelZoomFactor } from '../src/zoomInput.ts';
import { setNightMaterials, glowMaterial } from '../src/lighting.ts';
import { WorldObjects } from '../src/interactables.ts';
import { createTraffic } from '../src/traffic.ts';
import { riverMaterial } from '../src/nature.ts';
import { createRiverReflections } from '../src/reflections.ts';

const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
const {palace,abbey,stone,ferrisWheel,gherkin,gherkinRadius}=await import('../src/architecture.ts');

test('Gherkin has a broad base, lower shoulder, closed rounded crown and spiral glazing',()=>{
  const radii=Array.from({length:101},(_,i)=>gherkinRadius(i/100)),widest=Math.max(...radii);
  assert.ok(radii[0]/widest>.7,'Base should not pinch into an egg-shaped point');
  const shoulder=radii.indexOf(widest)/100;assert.ok(shoulder>.25&&shoulder<.5);
  assert.equal(radii[100],0);assert.ok(radii[97]>radii[99]&&radii[99]>.3);
  const model=gherkin(),glass=model.children.find(o=>o instanceof T.Mesh&&o.material.name.includes('spiral glazing')) as T.Mesh;
  const colors=glass.geometry.getAttribute('color');assert.ok(colors&&colors.count>1000);
  const mat=glass.material as T.MeshStandardMaterial;assert.ok(mat.emissiveMap);
  const pixels=(mat.emissiveMap as T.DataTexture).image.data;
  for(let i=0;i<pixels.length;i+=4)assert.ok(pixels[i]>0&&pixels[i]<150,'Gherkin glazing stays fully lit without white patches');
  setNightMaterials(true);assert.ok(mat.emissiveIntensity>0&&mat.emissiveIntensity<.8);setNightMaterials(false);assert.equal(mat.emissiveIntensity,0);
});

test('pitched landmark roofs use tiled slate with finite world-scale UVs and surface detail',()=>{
  for(const model of [palace(),abbey()]) {
    const roofs=model.children.filter(o=>o instanceof T.Mesh&&o.material.name==='Overlapping slate roof tiles') as T.Mesh[];
    assert.ok(roofs.length>0);
    for(const roof of roofs) {
      const mat=roof.material as T.MeshStandardMaterial;assert.ok(mat.map&&mat.normalMap&&mat.roughnessMap);
      const uv=roof.geometry.getAttribute('uv');assert.ok([...uv.array].every(Number.isFinite));
      assert.ok(Math.max(...uv.array)-Math.min(...uv.array)>2,'Large roofs must repeat the tile courses');
    }
  }
});

test('clock uses local system hours, including fractional minutes, and updates all four faces',()=>{
  const date=new Date(2026,9,25,15,15,30),a=clockAngles(date);
  assert.ok(Math.abs(a.minute+15.5*Math.PI/30)<1e-10);
  assert.ok(Math.abs(a.hour+(3+15.5/60)*Math.PI/6)<1e-10);
  const model=palace();model.userData.updateClock(date);
  const hands=model.children.filter(child=>child.name.includes('clock hands'));
  assert.equal(hands.length,4);
  for(const face of hands){assert.equal(face.children[0].rotation.z,a.hour);assert.equal(face.children[1].rotation.z,a.minute);}
  model.userData.updateClock(new Date(2026,9,25,0,0,0));
  for(const face of hands)assert.equal(Math.abs(face.children[0].rotation.z),0);
});

test('facade window textures are confined to vertical walls',()=>{
  const b=new Builder();b.box(0,5,0,6,10,8,stone);b.cylinder(12,5,0,3,10,stone);
  for(const child of b.finish().children as T.Mesh[]) {
    if(child.material!==stone)continue;
    const normals=child.geometry.getAttribute('normal');
    for(let i=0;i<normals.count;i++)assert.ok(Math.abs(normals.getY(i))<.01,'Roof caps must not display facade windows');
  }
});

test('square tower roof eaves cover every corner of the masonry footprint',()=>{
  const model=abbey();model.updateMatrixWorld(true);
  for(const x of [-6,6])for(const dx of [-2.25,2.25])for(const dz of [-2.25,2.25]) {
    const hits=new T.Raycaster(new T.Vector3(x+dx,35,12+dz),new T.Vector3(0,-1,0)).intersectObject(model,true);
    assert.ok(hits[0].point.y>24.1,'Pyramid roof must cover the tower corners');
    assert.ok(hits[0].point.y<31,'Roof remains attached below the spire tip');
  }
});

test('London Eye has 32 transparent, framed capsules with visible seating',()=>{
  const eye=ferrisWheel();assert.equal(eye.pods.length,32);
  for(const pod of eye.pods) {
    const glazing=pod.getObjectByName('Curved transparent glazing') as T.Mesh;
    assert.ok(glazing);const mat=glazing.material as T.MeshPhysicalMaterial;
    assert.equal(mat.transparent,true);assert.ok(mat.opacity<.5);
    assert.ok(pod.children.length>=3,'Glazing, interior/framing and lighting are separate');
  }
});

test('traffic moves its collision and damage targets, stops for the player, and stays destroyed',()=>{
  const scene=new T.Scene(),objects=new WorldObjects(scene,[]),traffic=createTraffic(scene,objects),car=traffic.cars[1];
  const start=car.model.root.position.clone();
  for(let i=1;i<=40;i++){traffic.update(i*.05);objects.update(i*.05);}
  assert.ok(car.model.root.position.distanceTo(start)>2);
  assert.equal(car.object.x,car.model.root.position.x);assert.equal(car.object.z,car.model.root.position.z);
  const collision=objects.models.get(car.object.id)!.obstacles[0];assert.equal(collision.x,car.object.x);
  const stopped=car.distance,player=car.route.sample(car.distance+.5).point;
  traffic.update(2.05,player);assert.equal(car.distance,stopped);
  objects.damage(car.object,car.object.hp,2.1);const destroyedPosition=car.model.root.position.clone();
  traffic.update(3);objects.update(3.1);
  assert.equal(car.model.root.visible,false);assert.equal(car.model.root.position.x,destroyedPosition.x);
  assert.ok(!objects.obstacles.includes(collision));
});

test('night glow switches with the theme and is disabled again in daylight',()=>{
  const light=glowMaterial('#ffe4ba',4);setNightMaterials(false);assert.equal(light.emissiveIntensity,0);
  setNightMaterials(true);assert.ok(light.emissiveIntensity>0&&light.emissiveIntensity<2);assert.ok(stone.emissiveIntensity>0&&stone.emissiveIntensity<1);assert.ok(stone.emissiveMap);
  setNightMaterials(false);assert.equal(light.emissiveIntensity,0);assert.equal(stone.emissiveIntensity,0);
});

test('pinch gain matches a substantial two-finger scroll and preserves zoom direction',()=>{
  assert.equal(wheelZoomFactor(-2,true),wheelZoomFactor(-100,false));
  assert.ok(wheelZoomFactor(-2,true)>1);assert.ok(wheelZoomFactor(2,true)<1);
  assert.equal(wheelZoomFactor(0,true),1);assert.ok(Number.isFinite(wheelZoomFactor(1e9,true)));
});

test('planar reflections mirror the orthographic camera and restore renderer state',()=>{
  const scene=new T.Scene(),camera=new T.OrthographicCamera(-100,100,100,-100,.1,1000);
  camera.position.set(90,120,100);camera.lookAt(0,0,0);camera.updateMatrixWorld();
  const river=riverMaterial(),water=new T.Mesh(new T.PlaneGeometry(20,20),river.material);water.position.y=.22;
  const reflected=createRiverReflections(scene,water,camera,river);
  let rendered=false,currentTarget:T.WebGLRenderTarget|null=null;
  const originalClip:T.Plane[]=[];
  const renderer={
    xr:{enabled:true},shadowMap:{autoUpdate:true},clippingPlanes:originalClip,toneMapping:T.ACESFilmicToneMapping,
    getRenderTarget:()=>currentTarget,setRenderTarget:(t:T.WebGLRenderTarget|null)=>{currentTarget=t;},
    getViewport:(v:T.Vector4)=>v.set(0,0,800,600),getScissor:(v:T.Vector4)=>v.set(0,0,800,600),getScissorTest:()=>true,
    setViewport:()=>{},setScissor:()=>{},setScissorTest:()=>{},clear:()=>{},
    render:(_scene:T.Scene,c:T.OrthographicCamera)=>{
      rendered=true;assert.equal(water.visible,false);assert.equal(c.isOrthographicCamera,true);
      assert.ok(Math.abs(c.position.y-(.44-120))<1e-6);
      const surface=new T.Vector3(8,.22,7),a=surface.clone().project(camera),b=surface.clone().project(c);
      // A mirror reverses handedness; its projective lookup cancels the X flip.
      assert.ok(Math.abs(a.x+b.x)<1e-6&&Math.abs(a.y-b.y)<1e-6,'Mirrored camera preserves the water plane');
      const lookup=new T.Vector4(surface.x,surface.y,surface.z,1).applyMatrix4(river.reflectionMatrix.value);
      assert.ok(Math.abs(lookup.x/lookup.w-(b.x*.5+.5))<1e-6&&Math.abs(lookup.y/lookup.w-(b.y*.5+.5))<1e-6);
      assert.equal(renderer.clippingPlanes.length,1);
    },
  };
  reflected.update(renderer as unknown as T.WebGLRenderer,0);
  assert.ok(rendered);assert.equal(water.visible,true);assert.equal(currentTarget,null);
  assert.equal(renderer.clippingPlanes,originalClip);assert.equal(renderer.xr.enabled,true);assert.equal(renderer.shadowMap.autoUpdate,true);
  reflected.dispose();
});
