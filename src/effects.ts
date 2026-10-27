import * as T from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { createBlastProjection } from './blastProjection.ts';
import { Builder, material, vec } from './geometry.ts';
import { GROUND, WATER_HEIGHT, surfaceHeight } from './layout.ts';
import { bombPosition, BLAST_RADIUS, TREE_CLEARANCE, footprintDistance, type Destructible } from './sandbox.ts';

type Projectile={mesh:T.Object3D;start:T.Vector3;end:T.Vector3;born:number;duration:number;target:Destructible|null;trailAt:number};
type Particle={position:T.Vector3;velocity:T.Vector3;life:number;age:number;size:number;smoke:boolean;color:T.Color;water?:boolean};
export class GameEffects {
  projectiles:Projectile[]=[];
  particles:Particle[]=[];
  waves:{mesh:T.Mesh;age:number;life:number;radius:number;opacity?:number}[]=[];
  private prototype:T.Group;
  private debris:T.InstancedMesh;
  private matrix=new T.Matrix4();
  private quaternion=new T.Quaternion();
  private waveGeometry=new T.CircleGeometry(1,48);
  private splashRing=new T.RingGeometry(.9,1,48);
  private blastDisc=new T.CircleGeometry(BLAST_RADIUS,64);
  private plantDisc=new T.CircleGeometry(TREE_CLEARANCE,48);
  reticle:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
  ghost:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
  path:Line2;
  private projection:ReturnType<typeof createBlastProjection>;
  private trail:T.InstancedMesh;
  private embers:{position:T.Vector3;born:number}[]=[];
  private scene:T.Scene;
  reducedMotion:boolean;
  constructor(scene:T.Scene,treeGeometry:T.BufferGeometry,reducedMotion=false) {
    this.scene=scene;this.reducedMotion=reducedMotion;
    this.projection=createBlastProjection(scene);
    const b=new Builder();
    // A brass-tipped shell, forward along local +Y, with a small hot exhaust.
    b.cylinder(0,0,0,.13,.46,material('#31514f',.3,.65),.13,20);
    b.add(new T.SphereGeometry(.13,20,12,0,Math.PI*2,0,Math.PI/2),material('#d9ad60',.26,.75),0,.23,0,1,1.65,1);
    for(const y of [-.19,.16])b.cylinder(0,y,0,.142,.045,material('#c49c57',.3,.7),.142,20);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;b.box(Math.sin(a)*.15,-.2,Math.cos(a)*.15,.025,.18,.2,'#596560',a);}
    this.prototype=b.finish();
    const flame=new T.Mesh(new T.ConeGeometry(.105,.48,12),new T.MeshBasicMaterial({color:'#ff9b35',transparent:true,opacity:.9,depthWrite:false,toneMapped:false}));
    flame.rotation.z=Math.PI;flame.position.y=-.49;flame.name='Small exhaust flame';this.prototype.add(flame);
    const core=new T.Mesh(new T.ConeGeometry(.05,.27,10),new T.MeshBasicMaterial({color:'#ffe8a1',toneMapped:false}));core.rotation.z=Math.PI;core.position.y=-.39;this.prototype.add(core);
    this.trail=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshBasicMaterial({color:'#ee8038',transparent:true,opacity:.6,depthWrite:false,toneMapped:false}),256);
    this.trail.count=0;this.trail.frustumCulled=false;scene.add(this.trail);
    this.debris=new T.InstancedMesh(new T.IcosahedronGeometry(1,0),new T.MeshStandardMaterial({roughness:1}),512);
    this.debris.count=0;this.debris.instanceMatrix.setUsage(T.DynamicDrawUsage);this.debris.frustumCulled=false;
    scene.add(this.debris);
    this.reticle=new T.Mesh(this.blastDisc,new T.MeshBasicMaterial({color:'#e74944',transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    this.reticle.rotation.x=-Math.PI/2;this.reticle.visible=false;scene.add(this.reticle);
    this.ghost=new T.Mesh(treeGeometry,new T.MeshBasicMaterial({color:'#8fc493',transparent:true,opacity:.28,depthWrite:false}));
    this.ghost.visible=false;scene.add(this.ghost);
    const pathGeo=new LineGeometry();pathGeo.setPositions([0,0,0,0,0,1]);
    this.path=new Line2(pathGeo,new LineMaterial({color:'#ff211b',linewidth:1.25,transparent:true,opacity:.65,depthTest:false,depthWrite:false,toneMapped:false}));
    this.path.visible=false;this.path.frustumCulled=false;this.path.renderOrder=30;scene.add(this.path);
  }
  aim(start:T.Vector3,end:T.Vector3,planting:boolean,valid:boolean,visible:boolean) {
    this.projection.show(end,visible&&!planting,valid);
    this.reticle.visible=visible&&planting;this.ghost.visible=visible&&planting;this.path.visible=visible&&!planting&&valid;
    this.reticle.geometry=planting?this.plantDisc:this.blastDisc;
    this.reticle.position.set(end.x,surfaceHeight(end.x,end.z)+.04,end.z);
    this.reticle.material.color.set(planting?'#62aa70':'#e74944');
    this.reticle.material.opacity=planting?(valid?.3:.12):valid?.28:.16;
    this.ghost.position.set(end.x,surfaceHeight(end.x,end.z)+.12,end.z);this.ghost.material.color.set('#7ead7b');this.ghost.material.opacity=valid?.28:.12;
    if(this.path.visible) {
      const starts=this.path.geometry.getAttribute('instanceStart') as T.InterleavedBufferAttribute,ends=this.path.geometry.getAttribute('instanceEnd') as T.InterleavedBufferAttribute;
      starts.setXYZ(0,start.x,start.y,start.z);ends.setXYZ(0,end.x,end.y,end.z);starts.data.needsUpdate=true;
    }
  }
  launch(start:T.Vector3,end:T.Vector3,target:Destructible|null,time:number) {
    const mesh=this.prototype.clone(true);mesh.position.copy(start);this.scene.add(mesh);
    mesh.quaternion.setFromUnitVectors(vec(0,1,0),end.clone().sub(start).normalize());
    this.projectiles.push({mesh,start:start.clone(),end:end.clone(),target,born:time,duration:.2+Math.min(.85,start.distanceTo(end)/60),trailAt:time});
    this.burst(start,5,false);
  }
  private burst(point:T.Vector3,count:number,smoke:boolean) {
    for(let i=0;i<count;i++) {
      const a=Math.random()*Math.PI*2,speed=smoke?1+Math.random()*2:2+Math.random()*5;
      this.particles.push({position:point.clone(),velocity:vec(Math.cos(a)*speed,smoke?2+Math.random()*2:3+Math.random()*6,Math.sin(a)*speed),
        age:0,life:smoke?1.1+Math.random()*.5:.4+Math.random()*.8,size:smoke?.5+Math.random()*.5:.08+Math.random()*.22,smoke,
        color:new T.Color(smoke?(i%2?'#9f9b87':'#c1b99d'):(i%3?'#d2a267':'#f2d398'))});
    }
    if(this.particles.length>512)this.particles.splice(0,this.particles.length-512);
  }
  explosion(point:T.Vector3,large=false) {
    if(point.y<=WATER_HEIGHT+.3){this.splash(point);return;}
    this.burst(point,this.reducedMotion?5:large?48:22,false);
    if(!this.reducedMotion)this.burst(point,large?18:7,true);
    const wave=new T.Mesh(this.waveGeometry,new T.MeshBasicMaterial({color:'#e74944',transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    wave.rotation.x=-Math.PI/2;wave.position.set(point.x,surfaceHeight(point.x,point.z)+.04,point.z);this.scene.add(wave);
    this.waves.push({mesh:wave,age:0,life:.55,radius:large?5:3});
  }
  splash(point:T.Vector3) {
    const count=this.reducedMotion?7:36;
    for(let i=0;i<count;i++) {
      const angle=i*Math.PI*2/count,speed=.7+Math.random()*2.3;
      this.particles.push({position:vec(point.x,WATER_HEIGHT+.04,point.z),velocity:vec(Math.cos(angle)*speed,2.8+Math.random()*3.8,Math.sin(angle)*speed),life:.9,age:0,size:.035+Math.random()*.065,smoke:false,water:true,color:new T.Color(i%3?'#9bced1':'#d1e6de')});
    }
    for(let i=0;i<2;i++) {
      const mesh=new T.Mesh(this.splashRing,new T.MeshBasicMaterial({color:'#b3d9d5',transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide}));
      mesh.rotation.x=-Math.PI/2;mesh.position.set(point.x,WATER_HEIGHT+.035+i*.005,point.z);this.scene.add(mesh);
      this.waves.push({mesh,age:-i*.12,life:1.1,radius:2.5+i*.5});
    }
  }
  planted(point:T.Vector3) {
    this.burst(point,8,false);
    for(const p of this.particles.slice(-8)){p.color.set('#9ab779');p.velocity.multiplyScalar(.35);p.life=.7;}
  }
  update(time:number,dt:number,onImpact:(point:T.Vector3,target:Destructible|null)=>void,collision?:(from:T.Vector3,to:T.Vector3)=>{point:T.Vector3;object:Destructible}|null) {
    for(let i=this.projectiles.length-1;i>=0;i--) {
      const bomb=this.projectiles[i],t=(time-bomb.born)/bomb.duration,p=bombPosition(bomb.start,bomb.end,t);
      const next=vec(p.x,p.y,p.z),hit=collision?.(bomb.mesh.position,next);
      if(!this.reducedMotion)for(let at=bomb.trailAt+.025;at<=Math.min(time,bomb.born+bomb.duration);at+=.025){
        const sample=bombPosition(bomb.start,bomb.end,(at-bomb.born)/bomb.duration);this.embers.push({position:vec(sample.x,sample.y,sample.z),born:at});bomb.trailAt=at;
      }
      bomb.mesh.position.copy(next);
      const flame=bomb.mesh.getObjectByName('Small exhaust flame');if(flame)flame.scale.y=this.reducedMotion?1:1+Math.sin(time*65)*.13;
      if(hit||t>=1){
        this.scene.remove(bomb.mesh);this.projectiles.splice(i,1);
        const target=bomb.target,base=target?.baseY??GROUND;
        const stillAtImpact=target&&!target.destroyed&&target.active!==false&&footprintDistance(bomb.end,target)<.05&&bomb.end.y>=base-.05&&bomb.end.y<=base+target.height+.05;
        onImpact(hit?hit.point:bomb.end,hit?hit.object:stillAtImpact?target:null);
      }
    }
    this.embers=this.embers.filter(p=>time-p.born<.32).slice(-256);
    this.embers.forEach((p,i)=>{const scale=.07*(1-(time-p.born)/.32);this.matrix.compose(p.position,new T.Quaternion(),vec(scale,scale,scale));this.trail.setMatrixAt(i,this.matrix);});
    this.trail.count=this.embers.length;this.trail.instanceMatrix.needsUpdate=true;
    for(let i=this.particles.length-1;i>=0;i--) {
      const p=this.particles[i];p.age+=dt;
      if(p.age>=p.life){this.particles.splice(i,1);continue;}
      p.position.addScaledVector(p.velocity,dt);p.velocity.y-=dt*(p.smoke?-.4:14);
      const floor=surfaceHeight(p.position.x,p.position.z)+.04;
      if(p.water&&p.position.y<WATER_HEIGHT){this.particles.splice(i,1);continue;}
      if(!p.water&&p.position.y<floor){p.position.y=floor;p.velocity.y=Math.abs(p.velocity.y)*.24;p.velocity.x*=.8;p.velocity.z*=.8;}
    }
    this.particles.forEach((p,i)=>{
      const t=p.age/p.life,size=p.size*(p.smoke?(1+t*2)*(1-t):1-t*t);
      this.quaternion.setFromEuler(new T.Euler(p.age*2,i,p.age*3));this.matrix.compose(p.position,this.quaternion,vec(size,size,size));
      this.debris.setMatrixAt(i,this.matrix);this.debris.setColorAt(i,p.color);
    });
    this.debris.count=this.particles.length;this.debris.instanceMatrix.needsUpdate=true;
    if(this.debris.instanceColor)this.debris.instanceColor.needsUpdate=true;
    for(let i=this.waves.length-1;i>=0;i--) {
      const wave=this.waves[i];wave.age+=dt;wave.mesh.visible=wave.age>=0;const t=Math.max(0,wave.age/wave.life);
      wave.mesh.scale.setScalar(.3+t*wave.radius);(wave.mesh.material as T.MeshBasicMaterial).opacity=(1-t)*(wave.opacity??.28);
      if(t>=1){this.scene.remove(wave.mesh);(wave.mesh.material as T.Material).dispose();this.waves.splice(i,1);}
    }
  }
}
