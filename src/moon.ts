import * as T from 'three';
import { createMoonMotion } from './moonMotion.ts';

export async function loadMoonTextures() {
  const loader=new T.TextureLoader();
  const [color,height]=await Promise.all([
    loader.loadAsync('/assets/moon/lroc-color.jpg'),loader.loadAsync('/assets/moon/lola-height.jpg'),
  ]);
  color.colorSpace=T.SRGBColorSpace;color.anisotropy=4;
  return {color,height};
}

/** A world-space moon: its position, radius, glow and lighting move with the city. */
export function createMoon(scene:T.Scene,keyLight:T.DirectionalLight,textures:Awaited<ReturnType<typeof loadMoonTextures>>,reduced=false) {
  const motion=createMoonMotion(reduced),root=new T.Group();root.name='Moon';root.visible=false;
  const uniforms={colorMap:{value:textures.color},heightMap:{value:textures.height},opacity:{value:0}};
  const material=new T.ShaderMaterial({
    // Keep the depth contract unchanged during the entire fade. Toggling it
    // near opacity 1 lets the additive halo wash out the surface, then snap off.
    uniforms,transparent:true,depthWrite:true,
    vertexShader:`varying vec2 vUv; varying vec3 vNormal;
      void main(){vUv=uv;vNormal=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D colorMap;uniform sampler2D heightMap;uniform float opacity;
      varying vec2 vUv;varying vec3 vNormal;
      void main(){
        vec3 surface=texture2D(colorMap,vUv).rgb;
        float height=texture2D(heightMap,vUv).r;
        float relief=(height-texture2D(heightMap,vUv+vec2(.001,.001)).r)*1.4;
        float light=max(0.,dot(normalize(vNormal),normalize(vec3(-.45,.55,1.))))+.09;
        gl_FragColor=vec4(surface*(light+relief)*1.45,opacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const sphere=new T.Mesh(new T.SphereGeometry(1,64,32),material);sphere.name='LROC textured lunar surface';sphere.rotation.y=Math.atan2(215,235)-Math.PI/2;sphere.renderOrder=1;root.add(sphere);root.scale.setScalar(9);
  const haloMaterial=new T.ShaderMaterial({
    uniforms:{opacity:{value:0}},transparent:true,depthWrite:false,side:T.BackSide,blending:T.AdditiveBlending,
    vertexShader:`varying vec3 vPosition;varying vec3 vCenter;
      void main(){vec4 p=modelViewMatrix*vec4(position,1.);vPosition=p.xyz;vCenter=(modelViewMatrix*vec4(0.,0.,0.,1.)).xyz;gl_Position=projectionMatrix*p;}`,
    fragmentShader:`uniform float opacity;varying vec3 vPosition;varying vec3 vCenter;
      void main(){float r=length(vPosition.xy-vCenter.xy)/9.;
        float glow=exp(-r*r*.62)*(1.-smoothstep(2.2,3.2,r));
        gl_FragColor=vec4(.67,.72,.78,glow*opacity*.2);}`,
  });
  const halo=new T.Mesh(new T.SphereGeometry(3.2,40,28),haloMaterial);halo.name='Spherical lunar glow';halo.renderOrder=2;root.add(halo);scene.add(root);
  const localLight=new T.PointLight('#ccd4db',0,380,2);localLight.name='Moon · soft surrounding light';scene.add(localLight);
  const origin=new T.Vector3(0,4,0),daylightPosition=new T.Vector3(-90,170,60);
  let reveal=0;
  scene.add(keyLight.target);keyLight.shadow.camera.far=1100;
  return {
    root,halo,localLight,
    get reveal(){return reveal;},
    hitDistance(raycaster:T.Raycaster):number|null {
      if(!root.visible||material.uniforms.opacity.value<.05)return null;
      root.updateWorldMatrix(true,true);
      // The diffuse glow deliberately has no interaction target.
      return raycaster.intersectObject(sphere,false)[0]?.distance??null;
    },
    setNight:(night:boolean)=>motion.setNight(night),
    setReduced:(value:boolean)=>motion.setReduced(value),
    update(dt:number) {
      const state=motion.tick(dt);
      root.visible=state.opacity>0;
      root.position.set(state.x,state.y,state.z);
      material.uniforms.opacity.value=state.opacity;
      haloMaterial.uniforms.opacity.value=state.opacity;
      const elevation=T.MathUtils.smoothstep(root.position.y,15,65),strength=state.opacity*elevation;
      reveal=state.night?strength:0;
      localLight.position.copy(root.position);localLight.intensity=state.night?1350*strength:0;
      if(state.night) {
        keyLight.position.copy(root.position);keyLight.target.position.copy(origin);
        keyLight.intensity=.32*strength;keyLight.color.set('#c9d2dc');
      } else {
        keyLight.position.copy(daylightPosition);keyLight.target.position.set(0,0,0);
        keyLight.intensity=3.2;keyLight.color.set('#fff1d2');
      }
    },
  };
}
