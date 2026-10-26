import * as T from 'three';
import { Builder, material, range, random, pick, vec, facadeLightSamples } from './geometry.ts';
import { riverMaterial, surfaceMaterial } from './nature.ts';
import { addFlowerBed, addRiverGroundcover } from './landscaping.ts';
import { createBoat } from './vehicles.ts';
import { createTraffic } from './traffic.ts';
import { ROAD_ASPHALT, ROAD_BORDER, createRoadBorder, roadDash } from './roadSurfaces.ts';
import { bankSections, bankPath } from './embankment.ts';
import { createHydrant } from './hydrant.ts';
import { createTerrainBase } from './terrainBase.ts';
import { BoatWakes } from './boatWakes.ts';
import { createRiverRailings } from './riverRailings.ts';
import { telephoneBox } from './streetFurniture.ts';
import { glowMaterial, lightPool, lightHalo } from './lighting.ts';
import { localNightLight, LocalNightLighting, createRooftopBeacon, updateRooftopBeacons } from './localNightLighting.ts';
import { NightGroundGlows } from './nightGroundGlows.ts';
import { createWallLamp, createGroundLamp } from './landmarkLamp.ts';
import { palace, abbey, ferrisWheel, greenDome, arena, gherkin, cityHall, gardenSpire, building, bridge } from './architecture.ts';
import { HALF, GROUND, WATER_HEIGHT, bridgeLiftAt, surfaceHeight, PLAYER_SPAWN, RIVER_END, riverCenter, riverWidth, bank, LANDMARKS, BRIDGES, canWalk, type Obstacle } from './layout.ts';
import { cityRoads, streetSurfacePath, roadClearance, plotTouchesRoad, ROAD_BORDER_WIDTH, GARDENS, CIRCULAR_SITES, FLOWER_BEDS } from './cityPlan.ts';
import { TERRAIN_OUTLINE, insideTerrain } from './boundary.ts';
import type { CityAssets } from './importedAssets.ts';
import { WorldObjects } from './interactables.ts';
import type { Destructible } from './sandbox.ts';
export { createCharacter } from './character.ts';

export type World = ReturnType<typeof createWorld>;
export function createWorld(scene: T.Scene, assets:CityAssets={loaded:[]}) {
  const b = new Builder(), obstacles: Obstacle[] = [], roads = cityRoads();
  const pavement=assets.concrete?createRoadBorder(assets.concrete):ROAD_BORDER;
  const objects=new WorldObjects(scene,obstacles);
  const beacons:T.Object3D[]=[];
  const staticLightPools:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>[]=[];
  const rooftopBeacon=(model:T.Object3D,roofHeight:number,phase:number)=>{
    const beacon=createRooftopBeacon(phase);beacon.position.y=roofHeight+.04;model.add(beacon);beacons.push(beacon);
  };
  const reserve: Obstacle[] = [];
  const grass=surfaceMaterial('grass'),sand=surfaceMaterial('sand'),stone=surfaceMaterial('stone');
  const terrainUV=(geo:T.BufferGeometry,tile=8)=>{
    const uv=geo.getAttribute('uv'),pos=geo.getAttribute('position');
    for(let i=0;i<uv.count;i++)uv.setXY(i,pos.getX(i)/tile,pos.getZ(i)/tile);
  };

  // The river cuts completely through the slab, leaving two independent banks.
  const cutout=createTerrainBase();
  b.add(cutout,surfaceMaterial('cutsoil'));cutout.dispose();
  const left:{x:number;z:number}[]=[],right:{x:number;z:number}[]=[];
  for(let z=-HALF;z<=RIVER_END;z++){left.push({x:bank(z,-1),z});right.push({x:bank(z,1),z});}
  for(const [side,edge]of [[-1,left],[1,right]] as const) {
    const outside=TERRAIN_OUTLINE.filter(p=>side*p.x>side*bank(p.z,side));
    const contour=[...(side===-1?edge:[...edge].reverse()),...outside];
    const landShape=new T.Shape(contour.map(p=>new T.Vector2(p.x,-p.z)));landShape.closePath();
    const landGeo=new T.ExtrudeGeometry(landShape,{depth:GROUND+2.8,bevelEnabled:false});
    landGeo.rotateX(-Math.PI/2);landGeo.translate(0,-2.8,0);
    const uv=landGeo.getAttribute('uv'),pos=landGeo.getAttribute('position'),normal=landGeo.getAttribute('normal');
    for(let i=0;i<uv.count;i++)uv.setXY(i,(Math.abs(normal.getX(i))>.5?pos.getZ(i):pos.getX(i))/4,pos.getY(i)/4);
    b.add(landGeo,stone);landGeo.dispose();
    const top=new T.ShapeGeometry(landShape);top.rotateX(-Math.PI/2);top.translate(0,GROUND+.004,0);terrainUV(top);
    b.add(top,grass);top.dispose();
  }
  // Sand-coloured shoreline and a stone retaining wall, following the exact same curve as collision.
  for(const shore of [left,right]) {
    b.ribbon(shore,1.55,.55,sand,HALF);
    b.ribbon(shore,.32,1.39,stone,HALF);
  }
  addRiverGroundcover(b);
  const railings=createRiverRailings();scene.add(railings);

  const positions:number[]=[],uvs:number[]=[],indices:number[]=[];
  for(let i=0;i<left.length;i++) {
    positions.push(left[i].x,0,left[i].z,right[i].x,0,right[i].z);uvs.push(0,i/12,1,i/12);
    if(i<left.length-1){const a=i*2;indices.push(a,a+2,a+1,a+1,a+2,a+3);}
  }
  const waterGeo=new T.BufferGeometry();waterGeo.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  waterGeo.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));waterGeo.setIndex(indices);waterGeo.computeVertexNormals();
  const river=riverMaterial();
  const water=new T.Mesh(waterGeo,river.material);water.name='River · open at slab edges';water.position.y=WATER_HEIGHT;water.receiveShadow=true;scene.add(water);
  // A shallow blue cross-section makes the hard cut visible from an oblique camera.
  // It is a still cut face, not a waterfall, with no path or lip spanning the river.
  for(const z of [-HALF,HALF]) {
    const l=bank(z,-1),r=bank(z,1),face=new T.BufferGeometry();
    face.setAttribute('position',new T.Float32BufferAttribute([l,WATER_HEIGHT,z,r,WATER_HEIGHT,z,l,-2.8,z,r,-2.8,z],3));
    const a=new T.Color('#198e9c'),c=new T.Color('#315a65');
    face.setAttribute('color',new T.Float32BufferAttribute([...a.toArray(),...a.toArray(),...c.toArray(),...c.toArray()],3));
    face.setIndex([0,2,1,1,2,3]);face.computeVertexNormals();
    const cut=new T.Mesh(face,new T.MeshStandardMaterial({vertexColors:true,roughness:.4,side:T.DoubleSide}));
    cut.position.z=Math.sign(z)*.02;cut.name='River · hard cut cross-section';scene.add(cut);
  }
  const streets=new Builder();
  const road=(points:{x:number;z:number}[],width:number,markings=true)=>{
    const outerWidth=width+ROAD_BORDER_WIDTH*2;
    streets.ribbon(streetSurfacePath(points,outerWidth),outerWidth,GROUND+.035,pavement,HALF);
    streets.ribbon(streetSurfacePath(points,width),width,GROUND+.07,ROAD_ASPHALT,HALF);
    if(markings)for(let i=1;i<points.length;i+=2) {
      const a=points[i-1],c=points[i],dx=c.x-a.x,dz=c.z-a.z,len=Math.hypot(dx,dz);
      if(len<.1)continue;
      const n=Math.max(1,Math.floor(len/3));
      for(let j=0;j<n;j++) {
        const t=(j+.35)/n;
        const x=a.x+dx*t,z=a.z+dz*t;
        if(roadClearance({x,z},roads.filter(r=>r.points!==points))>1)
          roadDash(streets,x,GROUND+.074,z,.1,Math.min(1.3,len*.6),Math.atan2(dx,dz));
      }
    }
  };
  for(const r of roads)if(!r.bridge)road(r.points,r.width);
  const streetSurfaces=streets.finish();streetSurfaces.name='City street surfaces';scene.add(streetSurfaces);
  // Promenades end at bridge junctions instead of painting across their entrances.
  for(const side of [-1,1]) {
    for(const [start,end] of bankSections(2.425)) {
      const path=bankPath(side,.95,start,end);
      b.ribbon(path,1.8,(x,z)=>{
        const bz=BRIDGES.reduce((near,b)=>Math.abs(b-z)<Math.abs(near-z)?b:near,BRIDGES[0]);
        const ramp=1-T.MathUtils.smoothstep(Math.abs(z-bz),2.425,8);
        return GROUND+.1+ramp*(.03+bridgeLiftAt(x,bz));
      },pavement,HALF,true);
    }
  }
  for(const z of BRIDGES)scene.add(bridge(z,riverCenter(z),riverWidth(z),z===48,pavement));

  const place=(model:T.Object3D,x:number,z:number)=>{model.position.set(x,GROUND,z);scene.add(model);return model;};
  const addObstacle=(x:number,z:number,w:number,d:number)=>{const obstacle={x,z,w,d};obstacles.push(obstacle);return obstacle;};
  const addReserve=(x:number,z:number,w:number,d:number)=>reserve.push({x,z,w,d});
  const landmark=(model:T.Object3D,x:number,z:number,name:string,id:string,footprints:number[][])=>{
    place(model,x,z);
    const owned=footprints.map(([dx,dz,w,d])=>addObstacle(x+dx,z+dz,w,d));
    objects.registerModel(model,name,'building',owned,id);
    if(id==='westminster'||id==='abbey') {
      const lamp=createWallLamp(id==='westminster'?'#ffd3a0':'#f1c5a0');
      if(id==='westminster'){lamp.position.set(20.02,4,5);lamp.rotation.y=Math.PI/2;}
      else lamp.position.set(-6,4,14.52);
      model.add(lamp);
    }
    if(id==='gherkin'||id==='eye') {
      const lamp=createGroundLamp('#b6cced',id==='gherkin'?8:6);
      lamp.position.set(id==='gherkin'?-8:-3,0,id==='gherkin'?3:5);model.add(lamp);
    }
    if(id==='gherkin')rooftopBeacon(model,44.65,.8);
  };
  const westminster=palace();
  landmark(westminster,-44,16,'Palace of Westminster','westminster',[[0,11,39,7],[-17,-1,6,24],[17,0,6,22],[0,-12,36,6],[-3,-1,6,19]]);addReserve(-44,16,49,44);
  const eye=ferrisWheel();landmark(eye.root,-55,-68,'London Eye','eye',[[0,0,20,8]]);addReserve(-55,-68,45,25);
  landmark(arena(),-31,-68,'Riverside arena','arena',[[0,0,19,19]]);addReserve(-31,-68,23,24);
  landmark(greenDome(),-24,-28,'Green Dome','dome',[[0,0,29,29]]);addReserve(-24,-28,39,38);
  landmark(gherkin(),76,-34,'The Gherkin','gherkin',[[0,0,15,15]]);addReserve(76,-34,24,25);
  const hallFootprint=Array.from({length:19},(_,i)=>{const z=i-9;return [0,z,2*Math.sqrt(9.5**2-z*z),1];});
  landmark(cityHall(),50,-21,'City Hall','hall',hallFootprint);addReserve(50,-21,24,23);
  landmark(abbey(),61,26,'Riverside Abbey','abbey',[[0,0,15,28],[0,6,28,6],[-6,12,5,5],[6,12,5,5],[13,-5,5,23],[6,-17,18,5]]);addReserve(61,26,39,43);
  landmark(gardenSpire(),-85,-37,'Garden Spire','spire',[[0,0,6,6]]);addReserve(-85,-37,13,14);
  for(const p of [...GARDENS,...CIRCULAR_SITES])addReserve(p.x,p.z,p.r*2,p.r*2);
  for(const p of FLOWER_BEDS)addReserve(p.x,p.z,7,4);

  const distanceToRoad=(x:number,z:number)=>roadClearance({x,z},roads);
  const clear=(x:number,z:number,w:number,d:number,padding=1)=>{
    if(Math.abs(x)+w/2>100||Math.abs(z)+d/2>99)return false;
    for(const bz of [z-d/2,z,z+d/2]) if(bz<RIVER_END && Math.abs(x-riverCenter(bz))<riverWidth(bz)/2+w/2+9)return false;
    if([...reserve,...obstacles].some(o=>Math.abs(x-o.x)<(o.w+w)/2+padding&&Math.abs(z-o.z)<(o.d+d)/2+padding))return false;
    if(plotTouchesRoad({x,z,w:w+.8,d:d+.8},roads,1.1))return false;
    return true;
  };
  const build=(x:number,z:number,w:number,d:number,h:number,type:'modern'|'town'|'office',force=false)=>{
    if(!clear(x,z,w,d)) {
      if(!force)return false;
      let found=false;
      for(let radius=1;radius<=24&&!found;radius++)for(let i=0;i<24;i++) {
        const nx=x+Math.cos(i*Math.PI/12)*radius,nz=z+Math.sin(i*Math.PI/12)*radius;
        if(clear(nx,nz,w,d)){x=nx;z=nz;found=true;break;}
      }
      if(!found)return false;
    }
    const modelBuilder=new Builder();building(modelBuilder,0,0,w,d,h,type);
    if(x===24&&z===-98)modelBuilder.beam(vec(0,35,0),vec(0,39,0),.12,'#c2d8cf');
    const model=place(modelBuilder.finish(),x,z);
    objects.registerModel(model,type==='town'?'Townhouse':type==='modern'?'Glass tower':'City building','building',[addObstacle(x,z,w,d)]);
    if(h>=24)rooftopBeacon(model,new T.Box3().setFromObject(model).max.y-GROUND,(Math.abs(x+z)%13)*.19);
    if(type==='town')for(const sample of facadeLightSamples(model)) {
      const light=localNightLight(sample.color,4.7,6);light.position.copy(sample.position).addScaledVector(sample.normal,.22);model.add(light);
      const pool=lightPool(1.9,sample.color,.18);pool.name='Occupied window light spill';
      pool.position.copy(sample.position).addScaledVector(sample.normal,.9);pool.position.y=.085;
      pool.scale.set(1,.65,1);pool.rotation.z=Math.atan2(sample.normal.x,sample.normal.z);model.add(pool);
      staticLightPools.push(pool);
    }
    return true;
  };
  // Intentional skyline silhouettes: two tall square towers, a stepped northern cluster.
  build(56,-80,11,12,43,'modern',true);
  build(82,-72,10,11,35,'modern',true);
  build(35,-91,7,9,30,'modern',true);
  build(24,-98,5,6,35,'modern',true);
  build(15,-103,6,7,24,'office',true);
  build(-29,-91,11,10,13,'office',true);
  build(-66,-72,6,7,20,'modern',true);
  build(-62,-88,7,7,29,'office',true);
  for(let z=-91;z<=-48;z+=12)for(let x=28;x<99;x+=13)build(x+range(-1,1),z,range(7,10),range(7,9),range(7,17),'office');
  for(let z=-56;z<91;z+=12)for(const x of [81,96])build(x,z,range(7,10),range(7,9),range(7,16),'office');
  // Fine-grained terraces on the west bank, and larger civic blocks in front.
  for(let z=-82;z<=85;z+=10)for(let x=-95;x<-30;x+=7)build(x+range(-.4,.4),z,range(4,5.6),range(5,7),range(3.5,7.3),'town');
  for(let z=58;z<=94;z+=13)for(let x=-62;x<0;x+=14)build(x,z,range(9,12),range(7,10),range(6,11),'office');
  for(let z=-36;z<70;z+=13)for(let x=42;x<=98;x+=14)build(x,z,range(6,9),range(6,8),range(5,10),'office');

  // Garden paths and lawns are geometry, so they remain crisp when zoomed in.
  const park=(x:number,z:number,r:number)=>{
    const lawn=new T.CircleGeometry(r,96);lawn.rotateX(-Math.PI/2);lawn.translate(x,GROUND+.12,z);terrainUV(lawn);
    b.add(lawn,grass);lawn.dispose();
    for(const radius of [r-.7,r*.66,r*.33])b.ring(x,GROUND+.14,z,radius,.65,'#e2dbad');
    b.ribbon([{x:x-r,z},{x:x+r,z}],.7,GROUND+.15,'#e1d9b1');
    b.ribbon([{x,z:z-r},{x,z:z+r}],.7,GROUND+.15,'#e1d9b1');
  };
  for(const p of GARDENS)park(p.x,p.z,p.r);
  b.ring(-24,GROUND+.05,-28,17.8,.8,'#e3d8ad');
  b.ring(-31,GROUND+.1,-68,11.2,.75,'#e1d9b4');
  for(const {x,z}of FLOWER_BEDS) {
    b.box(x,GROUND+.12,z,7,.16,4,'#d6d4af');
    b.box(x,GROUND+.22,z,5.9,.2,2.9,surfaceMaterial('soil'));
    addFlowerBed(b,x,z);
  }
  // A small turquoise ornamental pool beside City Hall.
  b.cylinder(64,GROUND+.12,-12,4.2,.2,'#dfdac0',4.2,40);
  b.cylinder(64,GROUND+.24,-12,3.6,.12,'#57b9b4',3.6,40);
  objects.plantingBlockers.push({x:64,z:-12,w:8.4,d:8.4});
  for(const {x,z}of FLOWER_BEDS)objects.plantingBlockers.push({x,z,w:7,d:4});

  const tree=(x:number,z:number,scale=1,infill=false)=>{
    if(Math.abs(x-riverCenter(z))<riverWidth(z)/2+scale*1.5)return;
    if(!insideTerrain(x,z,scale*1.5)||distanceToRoad(x,z)<scale*1.6+.6)return;
    if(obstacles.some(o=>Math.abs(x-o.x)<o.w/2+scale*1.6&&Math.abs(z-o.z)<o.d/2+scale*1.6))return;
    if(objects.plantingBlockers.some(o=>Math.abs(x-o.x)<o.w/2+scale&&Math.abs(z-o.z)<o.d/2+scale))return;
    // Full prop bounds keep new infill canopies clear of benches, lamps and booths.
    if(objects.state.objects.some(o=>o.kind!=='tree'&&!o.destroyed&&Math.abs(x-o.x)<o.w/2+scale*1.4+.35&&Math.abs(z-o.z)<o.d/2+scale*1.4+.35))return;
    if(infill)for(const p of GARDENS) {
      const dx=x-p.x,dz=z-p.z,r=Math.hypot(dx,dz);
      if(r<p.r&&Math.min(Math.abs(dx),Math.abs(dz),...[p.r-.7,p.r*.66,p.r*.33].map(radius=>Math.abs(r-radius)))<.65+scale*.15)return;
    }
    // Keep spawn and travel points open after adding solid tree trunks.
    if(Math.hypot(x-PLAYER_SPAWN.x,z-PLAYER_SPAWN.z)<2||LANDMARKS.some(l=>Math.hypot(x-l.visitX,z-l.visitZ)<1.8))return;
    objects.addTree(x,z,scale);
  };
  for(let i=0;i<1750;i++) {
    const x=range(-104,104),z=range(-104,104);
    if(z<RIVER_END && Math.abs(x-riverCenter(z))<riverWidth(z)/2+7)continue;
    if(obstacles.some(o=>Math.abs(x-o.x)<o.w/2+1.6&&Math.abs(z-o.z)<o.d/2+1.6))continue;
    if(distanceToRoad(x,z)<1.1)continue;
    if(GARDENS.some(p=>Math.hypot(x-p.x,z-p.z)<p.r)&&random()>.08)continue;
    tree(x,z,range(.7,1.25));
  }
  for(const side of [-1,1])for(let z=-103;z<105;z+=4.2) {
    const x=bank(z,side,8);
    if(!obstacles.some(o=>Math.abs(x-o.x)<o.w/2+1&&Math.abs(z-o.z)<o.d/2+1)&&BRIDGES.every(v=>Math.abs(z-v)>4))tree(x,z,.78);
  }
  for(let i=0;i<TERRAIN_OUTLINE.length;i+=2){const p=TERRAIN_OUTLINE[i];tree(p.x*.981,p.z*.981,.65+(i%7)*.035);}
  for(const p of GARDENS) {
    for(let i=0;i<30;i++){const a=i*Math.PI/15;tree(p.x+Math.cos(a)*(p.r-1.3),p.z+Math.sin(a)*(p.r-1.3),.7);}
    tree(p.x,p.z,1.5);
  }

  // Furniture shares one spacing policy, including rotated benches and tree canopies.
  const furniture:Obstacle[]=[];
  const propClear=(x:number,z:number,w:number,d:number,onBridge=false)=>{
    if(!insideTerrain(x,z,1)||plotTouchesRoad({x,z,w,d},roads,.18))return false;
    if(!onBridge&&BRIDGES.some(bz=>Math.abs(z-bz)<4.5&&Math.abs(x-riverCenter(bz))<riverWidth(bz)/2+8))return false;
    if(!onBridge&&!canWalk(x,z,obstacles,Math.max(w,d)/2+.35))return false;
    if([...obstacles,...furniture,...objects.plantingBlockers].some(o=>Math.abs(x-o.x)<(w+o.w)/2+.4&&Math.abs(z-o.z)<(d+o.d)/2+.4))return false;
    if(objects.state.objects.some(o=>!o.destroyed&&Math.abs(x-o.x)<(w+o.w)/2+.35&&Math.abs(z-o.z)<(d+o.d)/2+.35))return false;
    furniture.push({x,z,w,d});return true;
  };
  const lamp=(x:number,z:number,onBridge=false)=>{
    if(streetLamps.some(p=>Math.hypot(x-p.x,z-p.z)<5))return;
    if(!propClear(x,z,.46,.46,onBridge))return;
    const lampB=new Builder();
    lampB.cylinder(0,1.3,0,.055,2.6,assets.metal??'#627c72',.04,5);
    lampB.box(0,2.65,0,.28,.35,.28,glowMaterial('#ffdb9f',5.3));
    lampB.cylinder(0,2.88,0,.23,.15,assets.metal??'#617970',0,4);
    const model=lampB.finish(),pool=lightPool(7.2,'#ffdbb1',.10);
    // A subdivided wash hugs raised decks and stops at the river and slab edges.
    pool.geometry.dispose();pool.geometry=new T.PlaneGeometry(14.4,14.4,20,20);pool.geometry.rotateX(-Math.PI/2);pool.rotation.x=0;pool.position.y=0;
    const pos=pool.geometry.getAttribute('position'),valid:boolean[]=[];
    for(let i=0;i<pos.count;i++) {
      const wx=x+pos.getX(i),wz=z+pos.getZ(i);
      const onLand=Math.abs(wx-riverCenter(wz))>=riverWidth(wz)/2;
      const onDeck=BRIDGES.some(bz=>Math.abs(wz-bz)<3.2);
      valid.push(insideTerrain(wx,wz)&& (onLand||onDeck));
      pos.setY(i,surfaceHeight(wx,wz)-GROUND-bridgeLiftAt(x,z)+.115);
    }
    const triangles:number[]=[],index=pool.geometry.index!;
    for(let i=0;i<index.count;i+=3)if([0,1,2].every(j=>valid[index.getX(i+j)]))triangles.push(index.getX(i),index.getX(i+1),index.getX(i+2));
    pool.geometry.setIndex(triangles);pool.geometry.computeVertexNormals();model.add(pool);
    staticLightPools.push(pool);
    const halo=lightHalo('#ffdbb1',2.4,.17);halo.position.y=2.65;model.add(halo);
    const light=localNightLight('#ffdbb1',11,14,1.75);light.position.y=2.62;model.add(light);
    const placed=place(model,x,z);placed.position.y+=bridgeLiftAt(x,z);
    objects.registerModel(placed,'Street lantern','prop',[addObstacle(x,z,.12,.12)]);
    streetLamps.push({x,z});
  };
  const streetLamps:{x:number;z:number}[]=[];
  for(let z=-101;z<95;z+=8)for(const side of [-1,1])lamp(bank(z,side,.85),z);
  for(const bz of BRIDGES)for(let x=riverCenter(bz)-riverWidth(bz)/2+1;x<riverCenter(bz)+riverWidth(bz)/2-1;x+=7)for(const side of [-1,1])lamp(x,bz+side*2.98,true);
  // Alternate along each pavement. Extra endpoint candidates illuminate junction corners.
  for(const road of roads.filter(road=>!road.bridge)) {
    const offset=road.width/2+.48;let distance=0,next=7,side=1;
    for(let i=1;i<road.points.length;i++) {
      const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(!length)continue;
      while(next<=distance+length) {
        const t=(next-distance)/length,x=a.x+dx*t,z=a.z+dz*t;
        const count=streetLamps.length;lamp(x-dz/length*offset*side,z+dx/length*offset*side);
        if(streetLamps.length===count)lamp(x+dz/length*offset*side,z-dx/length*offset*side);
        side*=-1;next+=15;
      }
      distance+=length;
    }
    for(const [end,neighbor]of [[road.points[0],road.points[1]],[road.points.at(-1)!,road.points.at(-2)!]]) {
      const dx=neighbor.x-end.x,dz=neighbor.z-end.z,length=Math.hypot(dx,dz)||1;
      for(const side of [-1,1])lamp(end.x+dx/length*4-dz/length*offset*side,end.z+dz/length*4+dx/length*offset*side);
    }
  }
  const bench=(x:number,z:number,ry=0)=>{
    const w=Math.abs(Math.cos(ry))*1.35+Math.abs(Math.sin(ry))*.6,d=Math.abs(Math.sin(ry))*1.35+Math.abs(Math.cos(ry))*.6;
    if(!propClear(x,z,w,d))return;
    const benchB=new Builder();
    benchB.box(0,.42,0,1.35,.12,.5,'#9d8b63');
    benchB.box(0,.75,-.25,1.35,.5,.08,'#9d8b63');
    for(const dx of [-.5,.5])benchB.box(dx,.2,0,.08,.4,.45,assets.metal??'#56695d');
    const model=place(benchB.finish(),x,z);model.rotation.y=ry;
    objects.registerModel(model,'Park bench','prop',[addObstacle(x,z,w,d)]);
  };
  for(let z=-90;z<91;z+=17)for(const side of [-1,1])bench(bank(z,side,.75),z);
  for(const x of [50,60])bench(x,84);
  // Neighborhood pavement locations leave driving lanes and landmark arrivals open.
  const phoneSites=[[-22,7],[-68,29],[40,52],[-35,-57]];
  for(const side of [-1,1])for(const z of [-83,-63,-23,15,36,67,84])phoneSites.push([side*98.6,z]);
  for(const [x,z]of phoneSites) {
    if(LANDMARKS.some(l=>Math.hypot(x-l.visitX,z-l.visitZ)<2.5)||!propClear(x,z,1,1))continue;
    objects.registerModel(place(telephoneBox(),x,z),'Telephone box','prop',[addObstacle(x,z,.88,.88)]);
  }
  const hydrants:{x:number;z:number}[]=[];
  for(const side of [-1,1])for(const z of [-88,-72,-56,-40,-24,-8,12,28,44,60,76,92]) {
    const x=side*105.2;if(!propClear(x,z,.7,.9))continue;
    const model=createHydrant();model.rotation.y=side>0?-Math.PI/2:Math.PI/2;
    objects.registerModel(place(model,x,z),'Fire hydrant','prop',[addObstacle(x,z,.25,.25)]);hydrants.push({x,z});
  }
  // A small trial uses the imported mesh, reusing its geometry and two materials.
  // The same conservative placement gate protects lamps, benches, trees and traffic.
  const bins:{x:number;z:number}[]=[];
  if(assets.bin) {
    const candidates=[[-35,52],[-26,52],[-68,32],[-21,8],[40,55]];
    for(const z of [-78,-54,-18,20,52,74,91])for(const side of [-1,1])candidates.push([side*98.6,z]);
    for(const [x,z] of candidates) {
      if(bins.length===6)break;
      if(LANDMARKS.some(l=>Math.hypot(x-l.visitX,z-l.visitZ)<2.5))continue;
      const model=assets.bin.clone(true);model.rotation.y=x>0?-Math.PI/2:Math.PI/2;
      const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());
      if(!propClear(x,z,size.x,size.z))continue;
      objects.registerModel(place(model,x,z),'Wheelie bin','prop',[addObstacle(x,z,size.x,size.z)]);
      bins.push({x,z});
    }
  }
  // Fill grass after furniture is placed, preserving its space and all arrivals.
  // Saplings, midsize crowns and mature trees share the same two instanced draws.
  for(let attempt=0;attempt<14000&&objects.trees.size<950;attempt++) {
    const x=range(-104,104),z=range(-104,104),age=random();
    const scale=age<.32?range(.48,.76):age<.82?range(.78,1.15):range(1.18,1.6);
    tree(x,z,scale,true);
  }
  const traffic=createTraffic(scene,objects);
  const wakes=new BoatWakes(scene);
  const boats:{group:T.Group;object:Destructible;length:number;phase:number;speed:number;lane:number}[]=[];
  for(let i=0;i<22;i++) {
    const boat=createBoat(range(3.2,4.6),pick(['#a84331','#d9d9c6','#426775']),i%3===0);scene.add(boat.root);
    const object=objects.registerModel(boat.root,boat.root.name,'boat');
    boats.push({group:boat.root,object,length:boat.length,phase:i/22,speed:range(.0033,.0052)*(i%2?-1:1),lane:(i%2?-1:1)*range(.2,.58)});
  }
  const terrain=b.finish();terrain.name='Terrain, streets and promenades';scene.add(terrain);
  const localLighting=new LocalNightLighting(scene);
  const groundGlows=new NightGroundGlows(scene,staticLightPools);
  const updateLights=(dt:number,focus:T.Vector3,time:number,night:boolean,reduced=false)=>{
    groundGlows.update();localLighting.update(dt,focus,night);updateRooftopBeacons(beacons,time,night,reduced);
  };
  let wheelAngle=0,lastWheelTime=0;
  const update=(time:number,player?:{x:number;z:number},night=false)=>{
    river.time.value=time;objects.updateWind(time);
    wheelAngle+=Math.max(0,time-lastWheelTime)*Math.PI*2/(night?120:45);lastWheelTime=time;
    eye.rotating.rotation.z=-wheelAngle;
    for(const p of eye.pods)p.rotation.z=wheelAngle;
    traffic.update(time,player);
    for(const boat of boats) {
      if(boat.object.destroyed)continue;
      const z=-112+(((boat.phase+time*boat.speed)%1+1)%1)*224;
      const channel=(at:number)=>{
        const approach=1-T.MathUtils.smoothstep(Math.min(...BRIDGES.map(bz=>Math.abs(at-bz))),7,20);
        return riverCenter(at)+T.MathUtils.lerp(boat.lane*riverWidth(at)*.5,Math.sign(boat.lane)*2.1,approach);
      };
      const x=channel(z);
      boat.group.position.set(x,WATER_HEIGHT+.02+Math.sin(time*1.2+boat.phase*30)*.025,z);
      boat.group.visible=Math.abs(z)<105;
      const aheadX=channel(z+.2);
      boat.group.rotation.y=Math.atan2(aheadX-x,.2)+(boat.speed<0?Math.PI:0);
      boat.group.rotation.z=Math.sin(time*.8+boat.phase*30)*.018;
      objects.syncModelPose(boat.object);
      if(boat.group.visible)wakes.emit(boat.object.id,boat.group.position,boat.group.rotation.y,boat.length,time);
    }
    wakes.update(time);
  };
  const updateClock=(date=new Date())=>westminster.userData.updateClock(date);
  update(0);
  return {obstacles,roads,furniture,bins,gardens:GARDENS,circularSites:CIRCULAR_SITES,update,updateLights,updateClock,landmarks:LANDMARKS,water,river,objects,traffic,boats,eye,wakes,railings,hydrants,streetLamps,localLighting,groundGlows,beacons};
}
