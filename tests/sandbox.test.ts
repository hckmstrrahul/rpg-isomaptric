import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { SandboxState, BOMB_DAMAGE, BOMB_RANGE, PLANT_RANGE, BLAST_RADIUS, FIRE_INTERVAL, durability, plantingIssue, bombPosition } from '../src/sandbox.ts';
import { WorldObjects } from '../src/interactables.ts';
import { GameEffects } from '../src/effects.ts';
import { createCharacter } from '../src/character.ts';
import { canWalk, GROUND, WATER_HEIGHT, riverCenter, type Obstacle } from '../src/layout.ts';
import { createBoat } from '../src/vehicles.ts';

test('larger buildings require more bomb hits and more firing time',()=>{
  const small=durability('building',5,6,6),tower=durability('building',11,12,43),palace=durability('building',43,31,48);
  assert.ok(small>=BOMB_DAMAGE*2);
  assert.ok(tower>small);assert.ok(palace>tower);
  assert.ok((palace/BOMB_DAMAGE-1)*FIRE_INTERVAL>8);
  assert.equal(durability('tree',2,2,3.6),BOMB_DAMAGE);
});

test('launcher cooldown prevents key repeat and frame rate from changing fire rate',()=>{
  const state=new SandboxState();assert.equal(state.fire(0),true);
  for(const t of [.001,.1,.3,.64])assert.equal(state.fire(t),false);
  assert.equal(state.fire(.65),true);assert.equal(state.shots,2);
  assert.ok(state.reloadProgress(.9)>0&&state.reloadProgress(.9)<1);
});

test('objects survive partial damage and destruction is counted only once',()=>{
  const state=new SandboxState(),object=state.register({name:'House',kind:'building',x:-50,z:0,w:6,d:6,height:6});
  const original=object.hp;
  assert.equal(state.damage(object).destroyed,false);assert.equal(object.hp,original-BOMB_DAMAGE);
  while(!object.destroyed)state.damage(object);
  assert.equal(object.hp,0);assert.equal(state.demolished,1);
  assert.deepEqual(state.damage(object),{damage:0,destroyed:false});assert.equal(state.demolished,1);
});

test('keyboard aiming selects objects in front and respects range',()=>{
  const state=new SandboxState();
  const near=state.register({name:'Near',kind:'tree',x:-50,z:5,w:2,d:2,height:3});
  state.register({name:'Behind',kind:'tree',x:-50,z:-3,w:2,d:2,height:3});
  const far=state.register({name:'Far',kind:'building',x:-50,z:60,w:6,d:6,height:10});
  assert.equal(state.targetAhead({x:-50,z:0},0),near);
  state.damage(near,1000);assert.equal(state.targetAhead({x:-50,z:0},0),null);
  assert.equal(state.targetAhead({x:-50,z:0},0,70),far);
});

test('planting accepts empty ground and rejects water, edges, overlap and distant positions',()=>{
  const player={x:-60,z:0},empty={x:-57,z:0};
  assert.equal(plantingIssue(empty,player,[],[]),null);
  assert.match(plantingIssue(player,player,[],[])!,/explorer/);
  assert.match(plantingIssue({x:-60,z:60},player,[],[])!,/closer/);
  assert.match(plantingIssue({x:-107,z:0},{x:-104,z:0},[],[])!,/inside/);
  assert.match(plantingIssue({x:riverCenter(0),z:0},{x:riverCenter(0)-4,z:0},[],[])!,/dry ground/);
  assert.match(plantingIssue(empty,player,[{...empty,w:4,d:4}],[])!,/occupied/);
  const state=new SandboxState(),tree=state.register({name:'Tree',kind:'tree',x:-55,z:0,w:2.7,d:2.4,height:3.6});
  assert.match(plantingIssue(empty,player,[],[tree])!,/trees/);
});

test('demolition removes only the target collision and allows planting on its plot',()=>{
  const obstacles:Obstacle[]=[{x:-60,z:0,w:6,d:6},{x:-80,z:0,w:8,d:8}];
  const scene=new T.Scene(),world=new WorldObjects(scene,obstacles);
  const model=new T.Mesh(new T.BoxGeometry(6,6,6),new T.MeshStandardMaterial());model.position.set(-60,GROUND+3,0);scene.add(model);
  const object=world.registerModel(model,'House','building',[obstacles[0]]);
  assert.equal(canWalk(-60,0,obstacles),false);
  world.damage(object,object.maxHp,0);world.update(1);
  assert.equal(canWalk(-60,0,obstacles),true);assert.equal(canWalk(-80,0,obstacles),false);assert.equal(model.visible,false);
  const result=world.plant({x:-60,z:0},{x:-56,z:0},1);
  assert.equal(result.issue,null);assert.ok(result.object);assert.equal(world.state.treesPlanted,1);
  assert.equal(canWalk(-60,0,obstacles),false,'New tree trunk becomes solid');
  assert.match(world.plant({x:-60,z:0},{x:-56,z:0},2).issue!,/occupied/);
});

test('destroyed tree slots are reusable without reviving old trees',()=>{
  const world=new WorldObjects(new T.Scene(),[]),tree=world.addTree(-50,0,1,true,0)!;
  world.update(.4);world.damage(tree,tree.hp,.5);world.update(1);
  for(const layer of [world.forest,world.foliage]) {
    const matrix=new T.Matrix4();layer.getMatrixAt(0,matrix);
    assert.equal(new T.Vector3().setFromMatrixScale(matrix).length(),0,'Both bark and leaves disappear on destruction');
  }
  const replacement=world.plant({x:-50,z:0},{x:-54,z:0},1).object!;
  world.update(3);
  assert.ok(replacement&&!replacement.destroyed);assert.equal(tree.destroyed,true);
  assert.equal(world.forest.count,1);assert.equal(world.state.treesPlanted,2);
  const matrix=new T.Matrix4();world.forest.getMatrixAt(0,matrix);const scale=new T.Vector3().setFromMatrixScale(matrix);
  assert.ok(scale.y>.99);
  const leafMatrix=new T.Matrix4();world.foliage.getMatrixAt(0,leafMatrix);
  assert.deepEqual(leafMatrix.elements,matrix.elements,'New leaf and bark instances share the same planted position and growth');
  assert.equal(world.foliage.count,1);
});

test('bomb flight follows a straight segment at every step and impacts once',()=>{
  const start=new T.Vector3(-50,3,0),end=new T.Vector3(-50,2,10);
  assert.deepEqual(bombPosition(start,end,0),{x:-50,y:3,z:0});
  assert.deepEqual(bombPosition(start,end,.5),{x:-50,y:2.5,z:5});
  for(const t of [.1,.25,.75,.9]){
    const point=bombPosition(start,end,t),expected=start.clone().lerp(end,t);
    assert.ok(new T.Vector3(point.x,point.y,point.z).distanceTo(expected)<1e-8);
  }
  assert.ok(Math.abs(bombPosition(start,end,1).y-end.y)<1e-9);
  const scene=new T.Scene(),world=new WorldObjects(scene,[]),effects=new GameEffects(scene,world.forest.geometry,true);
  effects.launch(start,end,null,0);let impacts=0;
  effects.update(.1,.1,()=>impacts++);assert.equal(impacts,0);
  effects.update(2,.1,point=>{impacts++;assert.ok(point.equals(end));});
  effects.update(3,.1,()=>impacts++);assert.equal(impacts,1);assert.equal(effects.projectiles.length,0);
});

test('the launcher reaches an object at 50 metres but not beyond',()=>{
  assert.equal(BOMB_RANGE,50);
  const state=new SandboxState(),target=state.register({name:'Long-range target',kind:'prop',x:0,z:51,w:2,d:2,height:2});
  assert.equal(state.targetAhead({x:0,z:0},0),target);
  target.z=51.1;assert.equal(state.targetAhead({x:0,z:0},0),null);
});

test('bomb preview is a solid red line and filled red blast area at water level',()=>{
  const scene=new T.Scene(),effects=new GameEffects(scene,new T.BoxGeometry());
  const start=new T.Vector3(-20,3,0),end=new T.Vector3(riverCenter(0),WATER_HEIGHT,0);
  effects.aim(start,end,false,true,true);
  assert.equal(effects.path.geometry.getAttribute('instanceStart').count,1);
  assert.equal(effects.path.material.linewidth,1.25);assert.equal(effects.path.material.opacity,.65);
  assert.equal(effects.reticle.geometry.type,'CircleGeometry');
  assert.equal((effects.reticle.geometry as T.CircleGeometry).parameters.radius,BLAST_RADIUS);
  assert.equal(effects.reticle.material.color.getHexString(),'e74944');
  assert.equal(effects.path.material.color.getHexString(),'ff211b');
  assert.ok(Math.abs(effects.reticle.position.y-WATER_HEIGHT-.04)<1e-8);
  effects.aim(start,end,true,true,true);assert.equal(effects.path.visible,false);assert.equal(effects.reticle.geometry.type,'CircleGeometry');
});

test('boats can be hit below ground height while their wakes stay outside hit bounds',()=>{
  const scene=new T.Scene(),objects=new WorldObjects(scene,[]),boat=createBoat(4);
  boat.root.position.set(0,.24,10);scene.add(boat.root);
  const target=objects.registerModel(boat.root,'River launch','boat');objects.syncModelPose(target);
  assert.ok(target.baseY!<GROUND&&target.d<4.2,'Only the hull and superstructure count, not the long wake');
  const ray=new T.Ray(new T.Vector3(0,.8,0),new T.Vector3(0,0,1));
  assert.equal(objects.pick(ray)?.object,target);
  assert.equal(objects.pick(new T.Ray(new T.Vector3(0,.035,0),new T.Vector3(0,0,1))),null,'The wake alone cannot stop a projectile');
  boat.root.position.x=15;boat.root.rotation.y=Math.PI/2;objects.syncModelPose(target);
  assert.equal(objects.pick(ray),null,'Hit bounds move with the boat');
  assert.ok(target.w>target.d,'Bounds rotate with the hull');
  boat.root.visible=false;objects.syncModelPose(target);
  assert.equal(objects.state.targetAhead({x:15,z:0},0),null,'Off-map hidden boats cannot be targeted');
});

test('a boat that leaves a projectile path is not given an automatic direct hit',()=>{
  const scene=new T.Scene(),objects=new WorldObjects(scene,[]),effects=new GameEffects(scene,new T.BoxGeometry());
  const boat=createBoat(4);boat.root.position.set(0,.24,10);scene.add(boat.root);
  const target=objects.registerModel(boat.root,'River launch','boat');objects.syncModelPose(target);
  effects.launch(new T.Vector3(0,3,0),new T.Vector3(0,.8,10),target,0);
  boat.root.position.x=20;objects.syncModelPose(target);const hp=target.hp;
  effects.update(2,.05,(point,primary)=>objects.blast(point,primary,2));
  assert.equal(target.hp,hp,'A straight shot cannot damage the old target remotely');
});

test('RPG character has detailed geometry, articulated equipment and a valid muzzle',()=>{
  const hero=createCharacter();let vertices=0;
  hero.root.traverse(object=>{if(object instanceof T.Mesh)vertices+=object.geometry.getAttribute('position').count;});
  assert.ok(vertices>25000,'Layered armor, face and equipment add genuine modeled detail');
  hero.root.position.set(10,GROUND,20);hero.body.rotation.y=Math.PI/2;
  hero.fire(1);hero.animate(1.1,true,true);hero.root.updateMatrixWorld(true);
  const muzzle=hero.muzzle.getWorldPosition(new T.Vector3());assert.ok(muzzle.x>10);assert.ok(muzzle.y>GROUND+1);
  hero.plant(2);hero.animate(2.3,false,false);
  hero.root.traverse(o=>{for(const value of [...o.position.toArray(),...o.quaternion.toArray()])assert.ok(Number.isFinite(value));});
});

test('a bomb hits an intervening structure before its intended destination',()=>{
  const scene=new T.Scene(),world=new WorldObjects(scene,[]),effects=new GameEffects(scene,world.forest.geometry,true);
  const model=new T.Mesh(new T.BoxGeometry(4,12,4),new T.MeshStandardMaterial());model.position.set(-50,GROUND+6,6);scene.add(model);
  const blocker=world.registerModel(model,'Intervening wall','building');
  effects.launch(new T.Vector3(-50,3,0),new T.Vector3(-50,2,14),null,0);
  const impacted:number[]=[];
  for(let time=.05;time<2;time+=.05)effects.update(time,.05,(_p,target)=>{if(target)impacted.push(target.id);},(from,to)=>{
    const ray=new T.Ray(from.clone(),to.clone().sub(from).normalize()),hit=world.pick(ray);
    return hit&&hit.point.distanceTo(from)<=from.distanceTo(to)?hit:null;
  });
  assert.deepEqual(impacted,[blocker.id]);assert.equal(effects.projectiles.length,0);
});
