import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import { createAppearance } from '../src/appearance.ts';
import { windowLighting } from '../src/windowLighting.ts';
import { createCityComposer } from '../src/rendering.ts';
import { Builder, facadeTexture, varyFacadeLighting, material } from '../src/geometry.ts';
import { treeResources } from '../src/trees.ts';
import { setNightMaterials, nightAccent } from '../src/lighting.ts';
import { ROAD_ASPHALT, ROAD_COLOR, ROAD_NIGHT_COLOR, ROAD_BORDER_COLOR, ROAD_BORDER_NIGHT_COLOR, createRoadBorder } from '../src/roadSurfaces.ts';

const context=new Proxy({}, {get:()=>()=>{},set:()=>true});
globalThis.document={createElement:()=>({width:256,height:256,getContext:()=>context})} as unknown as Document;
globalThis.Image=class {src='';onload=null;} as unknown as typeof Image;

test('appearance follows the system until overridden, then remembers the manual choice',()=>{
  const saved=new Map<string,string>();
  const storage={getItem:(key:string)=>saved.get(key)??null,setItem:(key:string,value:string)=>{saved.set(key,value);}};
  const appearance=createAppearance(storage);
  assert.equal(appearance.isNight(false),false);assert.equal(appearance.isNight(true),true);
  assert.equal(appearance.toggle(true),'day');
  assert.equal(appearance.isNight(true),false);assert.equal(createAppearance(storage).isNight(true),false);
  assert.equal(appearance.toggle(false),'night');
  assert.equal(appearance.isNight(false),true);assert.equal(createAppearance(storage).isNight(false),true);
});

test('theme controls remain usable when storage is unavailable or contains an invalid value',()=>{
  const unavailable={getItem:()=>{throw new Error('blocked');},setItem:()=>{throw new Error('blocked');}};
  const appearance=createAppearance(unavailable);
  assert.equal(appearance.toggle(false),'night');assert.equal(appearance.isNight(false),true);
  const invalid=createAppearance({getItem:()=> 'unexpected',setItem:()=>{}});
  assert.equal(invalid.isNight(false),false);assert.equal(invalid.isNight(true),true);
});

test('night rooms have stable mixed colors, differing occupancy and plenty of unlit windows',()=>{
  const counts:number[]=[];
  for(let seed=8;seed<24;seed++) {
    const rooms=windowLighting(seed,10,24),on=rooms.filter(room=>room!==null);
    assert.deepEqual(rooms,windowLighting(seed,10,24),'Patterns must not flicker with camera motion');
    assert.ok(on.length>10&&on.length<160,'Leave a realistic proportion of rooms dark');
    assert.ok(on.some(color=>color[0]>color[2]),'Include warm lamps');
    assert.ok(on.some(color=>color[2]>color[0]),'Include cool rooms');
    assert.ok(on.every(color=>Math.max(...color)<240),'Avoid white clipped windows');
    counts.push(on.length);
  }
  assert.ok(new Set(counts).size>8,'Buildings must not share one repeated occupancy grid');
});

test('facade variants share geometry and daylight maps while changing only nighttime occupancy',()=>{
  const stone=facadeTexture('stone','#c5b88d'),b=new Builder();b.box(0,5,0,6,10,8,stone);
  const root=b.finish(),facade=root.children.find(mesh=>(mesh as T.Mesh).material===stone) as T.Mesh;
  const geometry=facade.geometry;
  const maps=new Set<T.Texture>();
  for(let seed=1;seed<=20;seed++) {
    varyFacadeLighting(root,seed);
    const mat=facade.material as T.MeshStandardMaterial;
    assert.equal(facade.geometry,geometry);assert.equal(mat.map,stone.map);
    assert.equal(mat.userData.facadeCap,stone.userData.facadeCap);
    maps.add(mat.emissiveMap!);
    setNightMaterials(true);assert.ok(mat.emissiveIntensity>0&&mat.emissiveIntensity<1);
    setNightMaterials(false);assert.equal(mat.emissiveIntensity,0);
  }
  assert.ok(maps.size>4&&maps.size<=8,'Cache a bounded set of different lighting masks');
});

test('bloom never blends into a disposable multisample buffer, including after resize',()=>{
  const renderer={getPixelRatio:()=>1.5} as unknown as T.WebGLRenderer;
  const {composer,bloom}=createCityComposer(renderer,new T.Scene(),new T.OrthographicCamera(),800,600);
  const check=()=>{
    assert.equal(composer.readBuffer.samples,0);assert.equal(composer.writeBuffer.samples,0);
    assert.equal(composer.readBuffer.texture.type,T.HalfFloatType);
    const names=composer.passes.map(pass=>pass.constructor.name);
    assert.deepEqual(names,['RenderPass','UnrealBloomPass','SMAAPass','OutputPass']);
  };
  check();assert.equal(composer.readBuffer.width,1200);
  composer.setSize(390,844);check();assert.equal(composer.readBuffer.width,585);
  assert.equal(composer.readBuffer.height,1266);
  bloom.enabled=false;check();bloom.enabled=true;check();
  assert.ok(bloom.strength<=.15&&bloom.threshold>1);
  composer.passes.forEach(pass=>pass.dispose());composer.dispose();
});

test('foliage keeps transparent leaf-card gaps in reflection and shadow buffers without MSAA',()=>{
  const {leaves}=treeResources();
  assert.equal(leaves.alphaToCoverage,false);assert.ok(leaves.alphaTest>0);
  const alpha=(leaves.map!.image as {data:Uint8Array}).data;
  let clear=0,solid=0;
  for(let i=3;i<alpha.length;i+=4){if(alpha[i]===0)clear++;else if(alpha[i]===255)solid++;}
  assert.ok(clear>solid&&solid>0,'The rectangular atlas must remain mostly transparent');
});

test('landmark uplights follow day/night changes with a local falloff',()=>{
  setNightMaterials(false);const light=nightAccent('#ffd3a0',55,24);
  assert.equal(light.intensity,0);assert.equal(light.distance,24);assert.equal(light.decay,2);
  setNightMaterials(true);assert.equal(light.intensity,55);
  setNightMaterials(false);assert.equal(light.intensity,0);
});

test('roads and borders change color with the theme without baking colors into geometry or tinting other objects',()=>{
  setNightMaterials(false);
  const source=new T.MeshStandardMaterial({color:'#f0e6ca',roughness:.78,map:new T.Texture(),normalMap:new T.Texture()}),original=source.color.clone();
  const border=createRoadBorder(source),b=new Builder(),ordinary=material('#986a42');
  b.ribbon([{x:0,z:0},{x:0,z:10}],4,1.4,ROAD_ASPHALT);b.box(3,1,0,1,1,5,border);b.box(7,1,0,1,1,1,ordinary);
  const root=b.finish(),asphalt=root.children.find(child=>(child as T.Mesh).material===ROAD_ASPHALT) as T.Mesh;
  assert.ok(asphalt);assert.ok(root.children.some(child=>(child as T.Mesh).material===border));
  const geometry=asphalt.geometry;assert.equal(geometry.hasAttribute('color'),false);
  assert.equal(border.normalMap,source.normalMap);assert.equal(border.map,null);assert.ok(source.map);
  for(const night of [false,true,false]){
    setNightMaterials(night);
    assert.equal(ROAD_ASPHALT.color.getHexString(),(night?ROAD_NIGHT_COLOR:ROAD_COLOR).slice(1));
    assert.equal(border.color.getHexString(),(night?ROAD_BORDER_NIGHT_COLOR:ROAD_BORDER_COLOR).slice(1));
    assert.equal(asphalt.geometry,geometry);assert.ok(source.color.equals(original));assert.equal(ordinary.color.getHexString(),'986a42');
  }
});

test('office windows form stable adjacent suites and retain dark floors',()=>{
  let adjacent=0,matching=0,darkFloors=0,lit=0,total=0;
  for(let seed=20;seed<30;seed++) {
    const rooms=windowLighting(seed,10,24,'office');assert.deepEqual(rooms,windowLighting(seed,10,24,'office'));
    for(let row=0;row<24;row++) {
      const floor=rooms.slice(row*10,row*10+10);if(floor.every(room=>room===null))darkFloors++;
      for(let col=0;col<9;col++) {adjacent++;if(Boolean(floor[col])===Boolean(floor[col+1]))matching++;}
    }
    lit+=rooms.filter(Boolean).length;total+=rooms.length;
  }
  assert.ok(matching/adjacent>.75,'Office suites should read as continuous groups rather than a checkerboard');
  assert.ok(lit/total>.2&&lit/total<.7);assert.ok(darkFloors>20);
});

test('glass facade interiors stay subdued by day and softly varied at night',()=>{
  setNightMaterials(false);const glass=facadeTexture('glass','#91afb5'),dayMap=glass.map;
  assert.ok(glass.emissiveIntensity>=0&&glass.emissiveIntensity<=.05);
  const dayEmission=glass.emissiveIntensity;setNightMaterials(true);
  assert.ok(glass.emissiveIntensity>dayEmission&&glass.emissiveIntensity<.8);
  assert.equal(glass.map,dayMap);setNightMaterials(false);assert.equal(glass.emissiveIntensity,dayEmission);
  const lit=windowLighting(509,10,24,'office').filter(room=>room!==null);
  assert.ok(new Set(lit.map(room=>room.join(','))).size>5,'Rooms retain different brightness levels');
  assert.ok(lit.every(room=>Math.max(...room)<200),'No office bay approaches white');
});
