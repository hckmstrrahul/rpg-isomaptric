import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { LocalNightLighting, LOCAL_LIGHT_BUDGET, localNightLight, createRooftopBeacon, updateRooftopBeacons, beaconStrength } from '../src/localNightLighting.ts';
import { NightGroundGlows } from '../src/nightGroundGlows.ts';
import { lightPool, setNightMaterials } from '../src/lighting.ts';
import { Builder, facadeTexture, facadeLightSamples, varyFacadeLighting } from '../src/geometry.ts';

const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
const {palace,ferrisWheel}=await import('../src/architecture.ts');

test('local diffuse lights keep a fixed budget, follow the view smoothly and stop when their source is destroyed or detached',()=>{
  const scene=new T.Scene(),owners:T.Group[]=[];
  for(let i=0;i<32;i++) {
    const root=new T.Group();root.position.set(i*8,0,0);const light=localNightLight('#ffdb9f',22,10);light.position.y=2.65;
    root.add(light);scene.add(root);owners.push(root);
  }
  const lighting=new LocalNightLighting(scene),focus=new T.Vector3();
  assert.equal(lighting.slots.length,LOCAL_LIGHT_BUDGET);
  lighting.update(.016,focus,true);
  assert.ok(lighting.slots.every(slot=>slot.light.intensity>0&&slot.light.intensity<22),'Sources ease in');
  for(let i=0;i<100;i++)lighting.update(.016,focus,true);
  assert.ok(lighting.slots.every(slot=>slot.light.position.x<=11*8));
  const old=lighting.slots.find(slot=>slot.source?.anchor.parent===owners[0])!;assert.ok(old);
  owners[0].userData.lightsDisabled=true;lighting.update(.016,focus,true);
  assert.ok(lighting.slots.every(slot=>slot.source?.anchor.parent!==owners[0]));
  scene.remove(owners[1]);lighting.update(.016,focus,true);
  assert.ok(lighting.slots.every(slot=>slot.source?.anchor.parent!==owners[1]));
  focus.x=31*8;for(let i=0;i<200;i++)lighting.update(.016,focus,true);
  assert.ok(lighting.slots.every(slot=>slot.light.position.x>=20*8));
  lighting.update(.016,focus,false);assert.ok(lighting.slots.every(slot=>slot.light.intensity===0));
  assert.equal(scene.children.filter(child=>child instanceof T.PointLight).length,LOCAL_LIGHT_BUDGET);
});

test('ground spill uses one draw, obeys the theme and clears only the demolished source',()=>{
  const scene=new T.Scene(),a=new T.Group(),b=new T.Group(),pa=lightPool(3),pb=lightPool(2,'#c8dfe9',.2);
  b.position.x=10;a.add(pa);b.add(pb);scene.add(a,b);
  const glows=new NightGroundGlows(scene,[pa,pb]);
  assert.equal(pa.parent,null);assert.equal(pb.parent,null);assert.equal(glows.mesh.userData.nonSolid,true);
  const colors=glows.mesh.geometry.getAttribute('color'),firstCount=pa.geometry.index!.count;
  const original=Array.from(colors.array);assert.ok(original.some(value=>value>0));
  setNightMaterials(false);assert.equal(glows.mesh.visible,false);setNightMaterials(true);assert.equal(glows.mesh.visible,true);
  a.userData.lightsDisabled=true;glows.update();
  assert.ok(Array.from(colors.array).slice(0,firstCount*3).every(value=>value===0));
  assert.deepEqual(Array.from(colors.array).slice(firstCount*3),original.slice(firstCount*3));
  setNightMaterials(false);setNightMaterials(true);assert.ok(Array.from(colors.array).slice(0,firstCount*3).every(value=>value===0));
  setNightMaterials(false);
});

test('warm house spill samples occupied lower facade windows rather than roofs',()=>{
  const b=new Builder();b.box(0,3,0,5,6,7,facadeTexture('brick','#aa7950'));
  const root=b.finish();root.position.set(35,1.35,-20);varyFacadeLighting(root,11);
  const samples=facadeLightSamples(root);assert.equal(samples.length,4);
  for(const sample of samples) {
    assert.ok(sample.position.y>=.45&&sample.position.y<=2.6);assert.ok(Math.abs(sample.normal.y)<.01);
    assert.ok(Math.abs(Math.abs(sample.position.x)-2.5)<1e-5||Math.abs(Math.abs(sample.position.z)-3.5)<1e-5);
    assert.match(sample.color,/^rgb\(/);
  }
  assert.deepEqual(samples,facadeLightSamples(root),'Window spill stays stable between frames');
});

test('all four clocks get warm rings and every Eye capsule has softly lit neutral-blue glazing at night',()=>{
  const clock=palace(),rings:T.Object3D[]=[];clock.traverse(child=>{if(child.name==='Warm clock-face ring')rings.push(child);});
  assert.equal(rings.length,4);
  const eye=ferrisWheel();assert.equal(eye.pods.length,32);
  for(const night of [false,true,false]) {
    setNightMaterials(night);
    for(const ring of rings) {
      const core=ring.children.find(child=>child instanceof T.Mesh&&child.geometry instanceof T.TorusGeometry) as T.Mesh<T.TorusGeometry,T.MeshStandardMaterial>;
      assert.equal(core.material.emissiveIntensity,night?1.25:0);
      const wash=ring.children.find(child=>child instanceof T.Mesh&&child.geometry instanceof T.PlaneGeometry)!;
      assert.equal(wash.visible,night);
    }
    for(const pod of eye.pods) {
      const glazing=pod.getObjectByName('Curved transparent glazing') as T.Mesh<T.CapsuleGeometry,T.MeshPhysicalMaterial>;
      assert.equal(glazing.material.emissiveIntensity,night?.46:0);assert.equal(glazing.material.opacity,.25);
      assert.ok(glazing.material.emissive.b>glazing.material.emissive.r);
      assert.equal(pod.getObjectByName('Soft capsule interior glow')!.visible,night);
    }
  }
});

test('roof beacons pulse slowly at night, stay dark by day and remain steady with reduced motion',()=>{
  const beacon=createRooftopBeacon(),bulb=beacon.userData.beaconBulb as T.Mesh<T.SphereGeometry,T.MeshStandardMaterial>;
  assert.ok(beacon.children.some(child=>child instanceof T.Mesh&&child.geometry instanceof T.CylinderGeometry));
  updateRooftopBeacons([beacon],.5,true,false);assert.ok(bulb.material.emissiveIntensity>3);
  updateRooftopBeacons([beacon],2,true,false);assert.equal(bulb.material.emissiveIntensity,0);
  assert.ok(beaconStrength(.09)<beaconStrength(.18));assert.equal(beaconStrength(.5),beaconStrength(3.7));
  updateRooftopBeacons([beacon],.5,false,false);assert.equal(bulb.material.emissiveIntensity,0);assert.equal(beacon.userData.beaconHalo.visible,false);
  updateRooftopBeacons([beacon],.5,true,true);const steady=bulb.material.emissiveIntensity;
  updateRooftopBeacons([beacon],2,true,true);assert.equal(bulb.material.emissiveIntensity,steady);assert.ok(steady>0);
});
