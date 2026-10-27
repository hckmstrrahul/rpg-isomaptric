import * as T from 'three';
import {Builder,material,vec} from '../../geometry.ts';

/** Animated water is one shader draw; stonework is merged and casts real shadows. */
export function createFountain({radius=4.5,height=2.8}:{radius?:number;height?:number}={}){
  const root=new T.Group(),stone=new Builder(),water=new Builder(),r=radius;
  stone.cylinder(0,.16,0,r,.32,'#c4c1ab',r,64);
  const rim=new T.TorusGeometry(r-.22,.22,8,64);stone.add(rim,material('#e1dac2'),0,.43,0,1,1,1,Math.PI/2);rim.dispose();
  stone.cylinder(0,.38,0,r-.38,.13,'#678b86',r-.38,64);
  stone.cylinder(0,height*.42,0,.23,height*.72,'#d5ceb8',.15,16);
  for(const [h,rr] of [[height*.43,r*.23],[height*.72,r*.15]]){stone.cylinder(0,h,0,rr,.18,'#d9d3bc',rr*.8,32);const lip=new T.TorusGeometry(rr,.08,6,40);stone.add(lip,material('#eee3cb'),0,h+.06,0,1,1,1,Math.PI/2);lip.dispose();}
  root.add(stone.finish());
  const time={value:0};
  const waterMaterial=new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,uniforms:{time,color:{value:new T.Color('#97dce0')}},vertexShader:`varying vec3 vPosition;void main(){vPosition=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`uniform float time;uniform vec3 color;varying vec3 vPosition;void main(){float r=length(vPosition.xz);float flow=.5+.5*sin(vPosition.y*22.+r*13.-time*7.);float ripple=.5+.5*sin(r*19.-time*4.);float surface=step(vPosition.y,.57);float a=mix(.62+.18*flow,.30+.23*ripple,surface);gl_FragColor=vec4(color*(.85+.16*flow),a);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>}`});
  // A small central jet and eight continuous parabolic streams meet the basin.
  const jet=(points:T.Vector3[],thickness:number)=>{const g=new T.TubeGeometry(new T.CatmullRomCurve3(points),32,thickness,5,false);water.add(g,waterMaterial);g.dispose();};
  jet(Array.from({length:12},(_,i)=>vec(Math.sin(i*.5)*.018,height*.72+i/11*height*.45,0)),.065);
  for(let i=0;i<8;i++){const a=i*Math.PI/4,points=Array.from({length:25},(_,j)=>{const t=j/24,reach=r*.67;return vec(Math.cos(a)*reach*t,height*.73+height*.8*t-(height*1.53-.49)*t*t,Math.sin(a)*reach*t);});jet(points,.045);}
  for(const tier of [{y:height*.43,r:r*.23},{y:height*.72,r:r*.15}])for(let i=0;i<12;i++){const a=i*Math.PI/6;jet(Array.from({length:12},(_,j)=>{const t=j/11;return vec(Math.cos(a)*(tier.r+.12*t),tier.y-(tier.y-.49)*t*t,Math.sin(a)*(tier.r+.12*t));}),.018);}
  const surface=new T.CircleGeometry(r-.45,64);surface.rotateX(-Math.PI/2);water.add(surface,waterMaterial,0,.49,0);surface.dispose();
  const flow=water.finish();flow.name='Fountain · continuous flowing jets and basin ripples';flow.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=false;o.userData.nonSolid=true;o.raycast=()=>{};}});root.add(flow);root.name='Tiered stone fountain';
  return {root,update:(seconds:number)=>{time.value=seconds;}};
}
