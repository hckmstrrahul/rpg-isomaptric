import * as T from 'three';
import { WATER_HEIGHT, HALF } from './layout.ts';

type Sample={x:number;z:number;yaw:number;born:number;beam:number};
/** World-space history: two spreading foam arms and a softer propeller wash. */
export class BoatWakes {
  readonly lifetime=4.5;
  readonly tracks=new Map<number,Sample[]>();
  mesh:T.Mesh<T.BufferGeometry,T.MeshBasicMaterial>;
  private positions=new Float32Array(24000*3);
  private uvs=new Float32Array(24000*2);
  private fades=new Float32Array(24000);
  constructor(scene:T.Scene) {
    const geometry=new T.BufferGeometry();
    geometry.setAttribute('position',new T.BufferAttribute(this.positions,3).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('uv',new T.BufferAttribute(this.uvs,2).setUsage(T.DynamicDrawUsage));
    geometry.setAttribute('wakeFade',new T.BufferAttribute(this.fades,1).setUsage(T.DynamicDrawUsage));geometry.setDrawRange(0,0);
    const material=new T.MeshBasicMaterial({color:'#c2e2dc',transparent:true,opacity:.28,depthWrite:false,side:T.DoubleSide});
    material.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float wakeFade;varying float vWakeFade;varying vec2 vWakeUV;varying vec2 vWakeWorld;').replace('#include <begin_vertex>','#include <begin_vertex>\nvWakeFade=wakeFade;vWakeUV=uv;vWakeWorld=position.xz;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
        varying float vWakeFade;varying vec2 vWakeUV;varying vec2 vWakeWorld;
        float wakeHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float wakeNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(wakeHash(i),wakeHash(i+vec2(1.,0.)),f.x),mix(wakeHash(i+vec2(0.,1.)),wakeHash(i+1.),f.x),f.y);}
      `).replace('#include <opaque_fragment>',`float foam=wakeNoise(vWakeWorld*8.)*.55+wakeNoise(vWakeWorld*19.)*.3+wakeNoise(vWakeWorld*39.)*.15;
        float edge=pow(max(0.,sin(vWakeUV.x*3.14159)),1.5);
        diffuseColor.a*=vWakeFade*edge*smoothstep(.28,.76,foam);
        #include <opaque_fragment>`);
    };
    this.mesh=new T.Mesh(geometry,material);this.mesh.frustumCulled=false;this.mesh.name='Ship wakes · broken foam and propeller wash';this.mesh.userData.nonSolid=true;scene.add(this.mesh);
  }
  emit(id:number,position:T.Vector3,yaw:number,length:number,time:number) {
    let track=this.tracks.get(id);if(!track){track=[];this.tracks.set(id,track);}
    const previous=track.at(-1);if(previous&&time-previous.born<.16)return;
    const x=position.x-Math.sin(yaw)*length*.44,z=position.z-Math.cos(yaw)*length*.44;
    if(Math.abs(z)>HALF-4)return;
    if(previous&&Math.hypot(x-previous.x,z-previous.z)>8)track.length=0;
    else if(previous&&Math.hypot(x-previous.x,z-previous.z)<.025)return;
    track.push({x,z,yaw,born:time,beam:length*.15});
  }
  update(time:number) {
    let count=0;
    const point=(s:Sample,side:number,edge:number)=>{
      const age=Math.max(0,time-s.born),offset=side*(s.beam+age*.38),width=side===0?.25+age*.1:.14+age*.09;
      const jitter=Math.sin(s.x*2.2+s.z*3.1+side)*.055;
      const cross=offset+(edge*2-1)*width+jitter;
      return {x:s.x+Math.cos(s.yaw)*cross,z:s.z-Math.sin(s.yaw)*cross,fade:Math.pow(Math.max(0,1-age/this.lifetime),1.7)*(side===0?.65:1)};
    };
    for(const [id,track] of this.tracks) {
      while(track.length&&time-track[0].born>this.lifetime)track.shift();
      if(!track.length){this.tracks.delete(id);continue;}
      for(let i=1;i<track.length;i++)for(const side of [-1,0,1]) {
        if(count+6>24000)break;
        for(const [index,edge] of [[i-1,0],[i-1,1],[i,0],[i,0],[i-1,1],[i,1]]) {
          const p=point(track[index],side,edge);this.positions.set([p.x,WATER_HEIGHT+.025,p.z],count*3);this.uvs.set([edge,0],count*2);this.fades[count]=p.fade;count++;
        }
      }
    }
    this.mesh.geometry.setDrawRange(0,count);
    for(const attribute of Object.values(this.mesh.geometry.attributes))attribute.needsUpdate=true;
  }
}
