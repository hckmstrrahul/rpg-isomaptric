import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Builder, material } from './geometry.ts';
import { bank, BRIDGES, surfaceHeight } from './layout.ts';
import type {Road} from './cityPlan.ts';

export type TrafficAxis='along'|'across';
export function signalPhase(time:number,index:number,axis:TrafficAxis) {
  const t=T.MathUtils.euclideanModulo(time+index*3,32),local=T.MathUtils.euclideanModulo(t-(axis==='across'?16:0),32);
  return local<10?'green':local<13?'amber':local>=30?'red-amber':'red';
}
let glowMap:T.DataTexture|undefined;
function signalGlow() {
  if(glowMap)return glowMap;
  const size=32,data=new Uint8Array(size*size*4);
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size*2-1,(y+.5)/size*2-1);data.set([255,255,255,Math.max(0,1-r)**2*255],(y*size+x)*4);}
  glowMap=new T.DataTexture(data,size,size);glowMap.needsUpdate=true;glowMap.magFilter=T.LinearFilter;return glowMap;
}
export function createTrafficSignals(scene:T.Scene,locations?:{x:number;z:number}[],roads?:Road[]) {
  let night=false,lastTime=0;
  const signals=locations?.map(p=>({...p,side:1}))??BRIDGES.flatMap(z=>[-1,1].map(side=>({x:bank(z,side,4.2),z,side})));
  const junctions=signals.map((point,index)=>{
    const root=new T.Group();root.name=locations?'Marina traffic signals':'London traffic signals';const lights:{axis:TrafficAxis;materials:T.MeshStandardMaterial[];glows:T.Sprite[]}[]=[];
    const poles:{x:number;z:number}[]=[];
    const approaches:{x:number;z:number;yaw:number;axis:TrafficAxis}[]=[];
    if(roads){
      const rays:{dx:number;dz:number;width:number}[]=[];
      for(const road of roads)for(let i=1;i<road.points.length;i++){
        const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);if(length<1e-6)continue;
        const t=((point.x-a.x)*dx+(point.z-a.z)*dz)/(length*length);
        if(t<-.001||t>1.001||Math.hypot(a.x+dx*t-point.x,a.z+dz*t-point.z)>.05)continue;
        for(const p of [a,b]){const nx=p.x-point.x,nz=p.z-point.z,n=Math.hypot(nx,nz);if(n<.02)continue;const ray={dx:nx/n,dz:nz/n,width:road.width};if(!rays.some(r=>r.dx*ray.dx+r.dz*ray.dz>.96))rays.push(ray);}
      }
      for(const ray of rays){const offset=ray.width/2+.62;approaches.push({x:point.x+ray.dx*5-ray.dz*offset,z:point.z+ray.dz*5+ray.dx*offset,yaw:Math.atan2(ray.dx,ray.dz),axis:Math.abs(ray.dx)>.7?'across':'along'});}
    }
    if(!approaches.length)for(const axis of ['along','across'] as const)for(const direction of [-1,1]){
      const z=locations?point.z+(axis==='along'?-direction*5:direction*3.6):point.z-direction*4.25,x=locations?point.x+(axis==='along'?direction*3.6:-direction*5):bank(z,point.side,4.2)+(axis==='along'?direction:-direction)*3.1;
      approaches.push({x,z,axis,yaw:axis==='along'?(direction>0?0:Math.PI):(direction>0?Math.PI/2:-Math.PI/2)});
    }
    for(const {x,z,axis,yaw} of approaches){
      poles.push({x,z});const fixture=new T.Group(),b=new Builder();fixture.position.set(x,surfaceHeight(x,z),z);
      // Every head faces its approaching lane. A pale backing board and deep
      // black hoods keep the three round lenses legible in bright daylight.
      fixture.rotation.y=yaw;
      b.cylinder(0,1.36,0,.055,2.72,material('#333d39',.65,.4),.055,10);
      b.cylinder(0,.1,0,.12,.2,'#303b36',.12,8);
      const back=new RoundedBoxGeometry(.66,1.38,.08,3,.08);b.add(back,material('#d6d8cc'),0,2.96,-.08);back.dispose();
      // The housing rear projects 2cm beyond the board; their back faces must
      // never share a plane, which caused the visible polygon flicker.
      const head=new RoundedBoxGeometry(.51,1.25,.28,3,.09);b.add(head,material('#182521'),0,2.96,0);head.dispose();
      const materials=['#ff392c','#ffb333','#40df79'].map(color=>new T.MeshStandardMaterial({color:'#12231c',emissive:color,emissiveIntensity:0,roughness:.25}));
      const glows:T.Sprite[]=[];
      materials.forEach((mat,i)=>{
        const y=3.35-i*.39;
        const bezel=new T.TorusGeometry(.151,.025,6,16);b.add(bezel,material('#16221e'),0,y,.14);bezel.dispose();
        const hood=new T.CylinderGeometry(.18,.18,.24,12,1,true,Math.PI/2,Math.PI);hood.rotateX(Math.PI/2);b.add(hood,material('#202b27',.65),0,y,.23);hood.dispose();
        const lens=new T.Mesh(new T.SphereGeometry(.135,12,8),mat);lens.position.set(0,y,.155);lens.scale.z=.35;fixture.add(lens);
        const glow=new T.Sprite(new T.SpriteMaterial({map:signalGlow(),color:mat.emissive,transparent:true,opacity:0,depthWrite:false,blending:T.AdditiveBlending,toneMapped:false}));glow.position.set(0,y,.24);glow.scale.set(.65,.65,1);glow.userData.nonSolid=true;glow.raycast=()=>{};fixture.add(glow);glows.push(glow);
      });
      fixture.add(b.finish());root.add(fixture);lights.push({axis,materials,glows});
    }
    root.userData.poles=poles;scene.add(root);return {...point,index,root,lights,owner:null as number|null};
  });
  const update=(time:number,appearance=night)=>{
    lastTime=time;night=appearance;
    junctions.forEach(j=>j.lights.forEach(head=>{
      const phase=signalPhase(time,j.index,head.axis);
      head.materials.forEach((mat,i)=>{
        const lit=i===0?phase.startsWith('red'):i===1?phase==='amber'||phase==='red-amber':phase==='green';
        mat.emissiveIntensity=lit?(night?3.2:.8):0;mat.color.set(lit?mat.emissive:'#12231c');
        head.glows[i].visible=lit&&night;head.glows[i].material.opacity=lit&&night?.4:0;
      });
    }));
  };
  update(0);return {junctions,update,setNight:(value:boolean)=>update(lastTime,value)};
}
