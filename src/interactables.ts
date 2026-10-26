import * as T from 'three';
import { vec, varyFacadeLighting } from './geometry.ts';
import { treeResources } from './trees.ts';
import { GROUND, type Obstacle } from './layout.ts';
import { SandboxState, plantingIssue, footprintDistance, BOMB_DAMAGE, BLAST_RADIUS, type Destructible, type ObjectKind, type Point } from './sandbox.ts';

type Binding = { model:T.Object3D; position:T.Vector3; scale:T.Vector3; localBounds:T.Box3; obstacles:Obstacle[]; hitAt:number; deadAt:number };
type Tree = { object:Destructible; index:number; scale:T.Vector3; yaw:number; plantedAt:number; obstacles:Obstacle[] };
export class WorldObjects {
  state=new SandboxState();
  models=new Map<number,Binding>();
  trees=new Map<number,Tree>();
  plantingBlockers:Obstacle[]=[];
  forest:T.InstancedMesh;
  foliage:T.InstancedMesh;
  treePreviewGeometry:T.BufferGeometry;
  private nextTree=0;
  private treeSlots:number[]=[];
  private matrix=new T.Matrix4();
  private quaternion=new T.Quaternion();
  private axis=vec(0,1,0);
  private bounds=new T.Box3();
  private hit=new T.Vector3();
  scene:T.Scene;
  obstacles:Obstacle[];
  constructor(scene:T.Scene, obstacles:Obstacle[]) {
    this.scene=scene;this.obstacles=obstacles;
    const tree=treeResources();
    this.forest=new T.InstancedMesh(tree.trunk,tree.bark,4096);
    this.foliage=new T.InstancedMesh(tree.foliage,tree.leaves,4096);
    this.treePreviewGeometry=tree.previewGeometry;
    this.forest.name='Forest · branching bark';this.foliage.name='Forest · leaf sprays';
    for(const layer of [this.forest,this.foliage]) {
      layer.count=0;layer.castShadow=true;layer.receiveShadow=true;
      layer.instanceMatrix.setUsage(T.DynamicDrawUsage);
      // Covers all legal planting positions, avoiding stale instance bounds after edits.
      layer.boundingSphere=new T.Sphere(vec(0,3,0),160);scene.add(layer);
    }
  }
  registerModel(model:T.Object3D,name:string,kind:ObjectKind,ownedObstacles:Obstacle[]=[],landmarkId?:string) {
    model.updateMatrixWorld(true);const bounds=new T.Box3(),localBounds=new T.Box3(),inverse=model.matrixWorld.clone().invert(),relative=new T.Matrix4();
    model.traverse(child=>{
      if(!(child instanceof T.Mesh)||child.userData.nonSolid)return;
      if(child instanceof T.InstancedMesh)child.computeBoundingBox();else child.geometry.computeBoundingBox();
      const geometryBounds=child instanceof T.InstancedMesh?child.boundingBox!:child.geometry.boundingBox!;
      bounds.union(geometryBounds.clone().applyMatrix4(child.matrixWorld));
      localBounds.union(geometryBounds.clone().applyMatrix4(relative.multiplyMatrices(inverse,child.matrixWorld)));
    });
    const size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());
    const object=this.state.register({name,kind,x:center.x,z:center.z,w:size.x,d:size.z,height:size.y,baseY:bounds.min.y,landmarkId});
    model.userData.destructibleId=object.id;
    varyFacadeLighting(model,object.id);
    this.models.set(object.id,{model,position:model.position.clone(),scale:model.scale.clone(),localBounds,obstacles:ownedObstacles,hitAt:-100,deadAt:-1});
    return object;
  }
  syncModelPose(object:Destructible) {
    const binding=this.models.get(object.id);if(!binding||object.destroyed)return;
    binding.model.updateMatrixWorld(true);binding.position.copy(binding.model.position);
    this.bounds.copy(binding.localBounds).applyMatrix4(binding.model.matrixWorld);
    object.x=(this.bounds.min.x+this.bounds.max.x)/2;object.z=(this.bounds.min.z+this.bounds.max.z)/2;
    object.w=this.bounds.max.x-this.bounds.min.x;object.d=this.bounds.max.z-this.bounds.min.z;
    object.baseY=this.bounds.min.y;object.height=this.bounds.max.y-this.bounds.min.y;
    object.active=binding.model.visible;
  }
  moveModel(object:Destructible,x:number,z:number,yaw:number,width:number,length:number) {
    if(object.destroyed)return;
    const binding=this.models.get(object.id);if(!binding)return;
    binding.position.x=x;binding.position.z=z;binding.model.position.copy(binding.position);binding.model.rotation.y=yaw;
    object.x=x;object.z=z;object.w=Math.abs(Math.cos(yaw))*width+Math.abs(Math.sin(yaw))*length;
    object.d=Math.abs(Math.sin(yaw))*width+Math.abs(Math.cos(yaw))*length;
    for(const obstacle of binding.obstacles)Object.assign(obstacle,{x,z,w:object.w,d:object.d});
  }
  addTree(x:number,z:number,scale=1,planted=false,time=0) {
    const slot=this.treeSlots.pop()??this.nextTree++;
    if(slot>=4096){this.nextTree=4096;return null;}
    const object=this.state.register({name:planted?'Planted oak':'Garden tree',kind:'tree',x,z,w:2.8*scale,d:2.8*scale,height:3.9*scale,planted});
    const obstacle={x,z,w:.28*scale,d:.28*scale};this.obstacles.push(obstacle);
    const tree:Tree={object,index:slot,scale:vec(scale,scale,scale),yaw:(object.id*2.399)%6.28,plantedAt:planted?time:-100,obstacles:[obstacle]};
    this.trees.set(object.id,tree);this.setTreeMatrix(tree,planted?.04:1);
    this.foliage.setColorAt(slot,new T.Color().setHSL(.16+(object.id%7)*.014,.16,.78+(object.id%5)*.045));
    this.foliage.instanceColor!.needsUpdate=true;
    for(const layer of [this.forest,this.foliage])layer.count=Math.max(layer.count,slot+1);
    return object;
  }
  private setTreeMatrix(tree:Tree,growth:number) {
    const object=tree.object;
    this.quaternion.setFromAxisAngle(this.axis,tree.yaw);
    this.matrix.compose(vec(object.x,GROUND+.08,object.z),this.quaternion,tree.scale.clone().multiplyScalar(growth));
    for(const layer of [this.forest,this.foliage]){layer.setMatrixAt(tree.index,this.matrix);layer.instanceMatrix.needsUpdate=true;}
  }
  updateWind(time:number) { treeResources().time.value=time; }
  plantingIssue(p:Point,player:Point) { return plantingIssue(p,player,this.obstacles,this.state.objects,this.plantingBlockers); }
  plant(p:Point,player:Point,time:number) {
    const issue=this.plantingIssue(p,player);if(issue)return {object:null,issue};
    const object=this.addTree(p.x,p.z,1,true,time);
    return {object,issue:object?null:'The city is full of trees'};
  }
  damage(object:Destructible,amount:number,time:number) {
    const result=this.state.damage(object,amount);if(!result.damage)return result;
    const model=this.models.get(object.id),tree=this.trees.get(object.id);
    if(model)model.hitAt=time;
    if(result.destroyed) {
      if(model){model.deadAt=time;model.model.userData.lightsDisabled=true;}
      if(tree){this.setTreeMatrix(tree,0);this.treeSlots.push(tree.index);}
      const owned=model?.obstacles??tree?.obstacles??[];
      // Mutate the shared array in place so navigation and both maps update together.
      for(const obstacle of owned){const index=this.obstacles.indexOf(obstacle);if(index!==-1)this.obstacles.splice(index,1);}
    }
    return result;
  }
  blast(point:Point&{y?:number},primary:Destructible|null,time:number) {
    const hit:{object:Destructible;damage:number;destroyed:boolean}[]=[];
    for(const object of this.state.objects) {
      if(object.destroyed||object.active===false)continue;
      const y=point.y??GROUND,base=object.baseY??GROUND,vertical=Math.max(0,base-y,y-base-object.height);
      const d=Math.hypot(footprintDistance(point,object),vertical);
      const amount=object===primary?BOMB_DAMAGE:d<BLAST_RADIUS?Math.ceil(BOMB_DAMAGE*.45*(1-d/BLAST_RADIUS)):0;
      if(amount){const result=this.damage(object,amount,time);hit.push({object,...result});}
    }
    return hit;
  }
  pick(ray:T.Ray) {
    let selected:Destructible|null=null,distance=Infinity;const point=new T.Vector3();
    for(const object of this.state.objects) {
      if(object.destroyed||object.active===false)continue;
      const base=object.baseY??GROUND;
      this.bounds.min.set(object.x-object.w/2,base,object.z-object.d/2);
      this.bounds.max.set(object.x+object.w/2,base+object.height,object.z+object.d/2);
      if(ray.intersectBox(this.bounds,this.hit)) {
        const d=ray.origin.distanceToSquared(this.hit);
        if(d<distance){distance=d;selected=object;point.copy(this.hit);}
      }
    }
    return selected?{object:selected,point}:null;
  }
  update(time:number) {
    for(const binding of this.models.values()) {
      if(binding.deadAt>=0) {
        const t=Math.min(1,(time-binding.deadAt)/.8);
        binding.model.scale.y=binding.scale.y*Math.max(.001,1-t*t);
        binding.model.position.y=binding.position.y-t*.8;
        binding.model.rotation.z=Math.sin(t*14)*.018*(1-t);
        if(t>=1)binding.model.visible=false;
      } else {
        const hit=Math.max(0,1-(time-binding.hitAt)/.35);
        binding.model.position.x=binding.position.x+Math.sin(time*65)*hit*.075;
        binding.model.position.z=binding.position.z+Math.cos(time*57)*hit*.075;
      }
    }
    for(const tree of this.trees.values()) {
      if(tree.object.destroyed||tree.plantedAt<0)continue;
      const t=Math.min(1,Math.max(0,(time-tree.plantedAt)/1.1));
      const growth=1-Math.pow(1-t,3);this.setTreeMatrix(tree,Math.max(.04,growth));
      if(t>=1)tree.plantedAt=-100;
    }
  }
}
