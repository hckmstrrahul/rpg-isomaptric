import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {BoatWakes} from '../src/boatWakes.ts';
import {createTerrainBase} from '../src/terrainBase.ts';
import {createRiverRailings} from '../src/riverRailings.ts';
import {createBlastProjection} from '../src/blastProjection.ts';
import {GameEffects} from '../src/effects.ts';
import {signalPhase,createTrafficSignals} from '../src/trafficSignals.ts';
import {cityRoads,roadClearance} from '../src/cityPlan.ts';
import {plantingIssue,PLANT_RANGE} from '../src/sandbox.ts';
import {GROUND,WATER_HEIGHT,BRIDGES,bank,riverCenter,riverWidth} from '../src/layout.ts';
import {SOIL_DEPTH} from '../src/boundary.ts';

test('only the buried terrain rounds inward while the square upper perimeter stays fixed',()=>{
 const geo=createTerrainBase(),p=geo.getAttribute('position'),normals=geo.getAttribute('normal');let upper=0,rounded=0;
 for(let i=0;i<p.count;i++){
  assert.ok(Number.isFinite(normals.getX(i))&&Number.isFinite(normals.getY(i))&&Number.isFinite(normals.getZ(i)));
  assert.ok(p.getY(i)>=-SOIL_DEPTH-.001&&p.getY(i)<=-2.79);
  if(Math.abs(p.getY(i)+2.8)<.001&&(p.getX(i)||p.getZ(i))){assert.ok(Math.abs(p.getX(i))===108||Math.abs(p.getZ(i))===108);upper++;}
  if(p.getY(i)<-15&&Math.abs(p.getX(i))>95&&Math.abs(p.getZ(i))>95){assert.ok(Math.abs(p.getX(i))<108&&Math.abs(p.getZ(i))<108);rounded++;}
 }
 assert.ok(upper>300&&rounded>40);
});

test('wake history stays behind a turning boat and expires after it stops',()=>{
 const wakes=new BoatWakes(new T.Scene());
 for(let i=0;i<20;i++){wakes.emit(1,new T.Vector3(Math.sin(i*.1),WATER_HEIGHT,i*.25),i*.02,4,i*.2);wakes.update(i*.2);}
 const history=wakes.tracks.get(1)!;assert.ok(history.length>10);const old={...history[0]};
 wakes.emit(1,new T.Vector3(3,WATER_HEIGHT,7),.3,4,4);wakes.update(4);
 assert.deepEqual(history[0],old,'Waves do not stay attached to the moving boat');assert.ok(wakes.mesh.geometry.drawRange.count>0);
 wakes.update(10);assert.equal(wakes.mesh.geometry.drawRange.count,0);assert.equal(wakes.tracks.size,0);
});

test('riverbank railings join bridge corners while leaving the full roadway open',()=>{
 const root=createRiverRailings();const points=root.userData.bankSegments as {x:number;z:number}[];
 const runs=root.userData.endpoints as {a:number[];c:number[]}[];
 assert.ok(points.length>150);
 for(const p of points)assert.ok(BRIDGES.every(z=>Math.abs(z-p.z)>=3.3-1e-8),'Rails must stay outside the 4.7m-wide road');
 for(const bz of BRIDGES)for(const side of [-1,1])for(const direction of [-1,1]){
  const z=bz+direction*3.3,corner=riverCenter(bz)+side*(riverWidth(bz)/2+1.3);
  const join=runs.find(run=>Math.abs(run.c[0]-corner)<1e-8&&Math.abs(run.c[2]-z)<1e-8);
  assert.ok(join,'Every bridge railing meets the river fence');
  assert.equal(join.a[0],bank(z,side,.22));
  assert.ok(runs.some(run=>run!==join&&[run.a,run.c].some(end=>end.every((value,i)=>Math.abs(value-join.a[i])<1e-8))),'Join connects to a continuous bank rail');
 }
});

test('blast highlight is projected on real mesh surfaces and preserves existing shader hooks',()=>{
 const scene=new T.Scene(),mat=new T.MeshStandardMaterial();let originalCalled=false;
 mat.onBeforeCompile=()=>{originalCalled=true;};scene.add(new T.Mesh(new T.BoxGeometry(2,4,3),mat));
 const marker=createBlastProjection(scene),shader={vertexShader:T.ShaderLib.standard.vertexShader,fragmentShader:T.ShaderLib.standard.fragmentShader,uniforms:{}};
 mat.onBeforeCompile(shader as never,{} as T.WebGLRenderer);assert.ok(originalCalled);
 assert.ok(shader.vertexShader.includes('instanceMatrix*blastPosition'));assert.ok(shader.fragmentShader.includes('length(vBlastWorld.xz-uBlastCenter)'));
 marker.show(new T.Vector3(8,GROUND,9),true,true);assert.deepEqual(marker.center.value.toArray(),[8,9]);assert.ok(marker.opacity.value>0);
 marker.show(new T.Vector3(),false,true);assert.equal(marker.opacity.value,0);
});

test('water impacts create droplets and ripples without smoke or ground debris',()=>{
 const effects=new GameEffects(new T.Scene(),new T.BoxGeometry());effects.explosion(new T.Vector3(0,WATER_HEIGHT,0));
 assert.ok(effects.particles.length>=20&&effects.particles.every(p=>p.water&&!p.smoke));assert.equal(effects.waves.length,2);
 assert.ok(effects.waves.every(w=>w.mesh.position.y>WATER_HEIGHT&&w.mesh.position.y<WATER_HEIGHT+.1));
 for(let t=0;t<2;t+=.05)effects.update(t,.05,()=>{});
 assert.equal(effects.particles.length,0);assert.equal(effects.waves.length,0);
});

test('planting reaches 50 metres and remains green at valid and blocked spots',()=>{
 assert.equal(PLANT_RANGE,50);assert.equal(plantingIssue({x:-60,z:50},{x:-60,z:0},[],[]),null);
 assert.match(plantingIssue({x:-60,z:50.1},{x:-60,z:0},[],[])!,/closer/);
 const effects=new GameEffects(new T.Scene(),new T.BoxGeometry()),point=new T.Vector3(-60,GROUND,20);
 effects.aim(point,point,true,true,true);const green=effects.reticle.material.color.getHex(),opacity=effects.reticle.material.opacity;
 effects.aim(point,point,true,false,true);assert.equal(effects.reticle.material.color.getHex(),green);assert.ok(effects.reticle.material.opacity<opacity);
});

test('junction phases never allow crossing directions green together and include a clearance interval',()=>{
 for(let index=0;index<6;index++){let clearance=0;for(let t=0;t<48;t+=.1){const a=signalPhase(t,index,'along'),b=signalPhase(t,index,'across');assert.ok(!(a==='green'&&b==='green'));if(a==='red'&&b==='red')clearance++;}assert.ok(clearance>10);}
});

test('signal heads leave roads clear and illuminate the correct colored lenses and halos at night',()=>{
 const signals=createTrafficSignals(new T.Scene()),roads=cityRoads();
 assert.equal(signals.junctions.length,6);
 for(const junction of signals.junctions)for(const pole of junction.root.userData.poles)assert.ok(roadClearance(pole,roads)>.35,'Signal stays outside the traffic lane');
 for(let time=0;time<32;time+=.5){
  signals.update(time,true);
  for(const j of signals.junctions)for(const head of j.lights){
   const phase=signalPhase(time,j.index,head.axis),expected=phase==='green'?[2]:phase==='amber'?[1]:phase==='red-amber'?[0,1]:[0];
   assert.deepEqual(head.materials.flatMap((mat,i)=>mat.emissiveIntensity>0?[i]:[]),expected);
   assert.deepEqual(head.glows.flatMap((glow,i)=>glow.visible?[i]:[]),expected);
  }
 }
 signals.setNight(false);
 for(const j of signals.junctions)for(const head of j.lights){assert.ok(head.glows.every(glow=>!glow.visible));assert.ok(head.materials.every(mat=>mat.emissiveIntensity<=.8));}
});

test('traffic-light housings have a single stable rear surface instead of coplanar backing-board faces',()=>{
 const signals=createTrafficSignals(new T.Scene());
 for(const junction of signals.junctions)for(const fixture of junction.root.children){
  fixture.updateWorldMatrix(true,true);
  for(const view of [[0,0,-1],[-.4,.15,-1],[.4,-.15,-1]]){
   const wanted=new T.Vector3(.087,2.783,-.14).applyMatrix4(fixture.matrixWorld);
   const direction=new T.Vector3(...view).transformDirection(fixture.matrixWorld),origin=wanted.clone().addScaledVector(direction,4);
   const hits=new T.Raycaster(origin,direction.negate()).intersectObject(fixture,true);
   assert.ok(hits[0].point.distanceTo(wanted)<1e-5,'The housing forms the visible back');
   assert.equal(hits.filter(hit=>Math.abs(hit.distance-hits[0].distance)<1e-5).length,1,'No competing face at the same depth');
   assert.ok(hits[1].distance-hits[0].distance>.018,'The backing board remains physically separated');
  }
 }
});
