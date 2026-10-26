import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { ROAD_HEIGHT, BRIDGE_LIFT } from '../src/layout.ts';
import { ROAD_WIDTHS } from '../src/cityPlan.ts';
import { ROAD_ASPHALT } from '../src/roadSurfaces.ts';

const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
const {bridge,stone}=await import('../src/architecture.ts');
const model=bridge(48,0,30,true);model.updateMatrixWorld(true);
const walls=model.children.filter((mesh):mesh is T.Mesh=>mesh instanceof T.Mesh&&mesh.material===stone);

test('bridge decks meet road height and parapets stop before bank traffic lanes',()=>{
  for(const tower of [false,true]) {
    const crossing=bridge(0,0,30,tower);crossing.updateMatrixWorld(true);
    const edges:number[]=[];
    crossing.traverse(child=>{
      if(!(child instanceof T.Mesh)||child.material!==ROAD_ASPHALT)return;
      const positions=child.geometry.getAttribute('position');
      for(let i=0;i<positions.count;i++)edges.push(positions.getZ(i));
    });
    assert.ok(edges.length>0);assert.ok(Math.abs(Math.max(...edges)-Math.min(...edges)-ROAD_WIDTHS.bridge)<1e-5,'Rendered bridge asphalt matches the shared street width');
    const ray=new T.Raycaster();
    for(const x of [-19.1,-17,-15,0,15,17,19.1]) {
      ray.set(new T.Vector3(x,3,0),new T.Vector3(0,-1,0));
      const paintTolerance=.005,expected=ROAD_HEIGHT+BRIDGE_LIFT*T.MathUtils.clamp((19.2-Math.abs(x))/4.2,0,1);
      assert.ok(Math.abs(ray.intersectObject(crossing,true)[0].point.y-expected)<paintTolerance);
    }
    for(const x of [-19.2,19.2]) {
      ray.set(new T.Vector3(x,2.2,-6),new T.Vector3(0,0,1));
      assert.ok(!ray.intersectObject(crossing,true).some(hit=>hit.distance<12),'A bank vehicle must not pass through a bridge railing');
    }
  }
});

test('bridge tower walls have one surface at former pillar/lintel overlaps at every zoom',()=>{
  const camera=new T.OrthographicCamera(-16,16,16,-16,.1,100),ray=new T.Raycaster();
  for(const tx of [-9.3,9.3])for(const side of [-1,1])for(const dz of [-2.8,-2.1,2.1,2.8]) {
    const point=new T.Vector3(tx+side*2.25,15.413,48+dz);
    for(const zoom of [.6,1,4,12])for(const orbitZ of [-.3,.3]) {
      camera.position.copy(point).add(new T.Vector3(side,.28,orbitZ).normalize().multiplyScalar(8));
      camera.lookAt(point);camera.zoom=zoom;camera.updateProjectionMatrix();camera.updateMatrixWorld();
      const projected=point.clone().project(camera);ray.setFromCamera(new T.Vector2(projected.x,projected.y),camera);
      const hits=ray.intersectObjects(walls,false);
      assert.ok(hits.length,'Tower facade must remain visible');
      assert.ok(hits[0].point.distanceTo(point)<1e-4);
      const coincident=hits.filter(hit=>Math.abs(hit.distance-hits[0].distance)<1e-4);
      assert.equal(coincident.length,1,`Duplicate facade at ${point.toArray()} with zoom ${zoom}`);
    }
  }
});

test('tower window texture keeps a continuous scale from the pillars through the lintel',()=>{
  for(const tx of [-9.3,9.3])for(const side of [-1,1])for(const dz of [-2.4,2.4]) {
    const sample=(y:number)=>{
      const origin=new T.Vector3(tx+side*3.25,y,48+dz);
      return new T.Raycaster(origin,new T.Vector3(-side,0,0)).intersectObjects(walls,false)[0];
    };
    const low=sample(12.2),high=sample(15.4);
    assert.ok(low?.uv&&high?.uv);
    assert.ok(Math.abs(high.uv.x-low.uv.x)<1e-6);
    assert.ok(Math.abs((high.uv.y-low.uv.y)-(15.4-12.2)/16)<1e-6,'Upper floors must not restart or compress the window pattern');
  }
});

test('the continuous bridge tower shells preserve the open passage and upper crossbeam',()=>{
  const passage=new T.Raycaster(new T.Vector3(-40,2.7,48),new T.Vector3(1,0,0));
  assert.equal(passage.intersectObjects(walls,false).length,0,'Character passage remains open through both towers');
  const upper=new T.Raycaster(new T.Vector3(-40,15.8,48),new T.Vector3(1,0,0));
  assert.equal(upper.intersectObjects(walls,false).length,2,'Both towers have a solid upper crossbeam');
});
