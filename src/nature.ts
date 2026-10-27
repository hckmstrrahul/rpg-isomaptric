import * as T from 'three';

// Small, repeatable material maps are generated once and shared by the whole city.
// Color maps are sRGB; height-derived normals and roughness stay in linear space.
const hash = (x:number,y:number,seed=1) => {
  let n=Math.imul(x+seed*374761,y+668265263);n=Math.imul(n^(n>>>13),1274126177);
  return ((n^(n>>>16))>>>0)/4294967295;
};
function noise(u:number,v:number,cells:number,seed:number) {
  const x=u*cells,y=v*cells,ix=Math.floor(x),iy=Math.floor(y);
  const fx=x-ix,fy=y-iy,sx=fx*fx*(3-2*fx),sy=fy*fy*(3-2*fy);
  const h=(a:number,b:number)=>hash((a+cells)%cells,(b+cells)%cells,seed);
  return T.MathUtils.lerp(T.MathUtils.lerp(h(ix,iy),h(ix+1,iy),sx),T.MathUtils.lerp(h(ix,iy+1),h(ix+1,iy+1),sx),sy);
}
export function dataTexture(data:Uint8Array,size:number,color=false) {
  const texture=new T.DataTexture(data,size,size,T.RGBAFormat);
  texture.wrapS=texture.wrapT=T.RepeatWrapping;
  texture.magFilter=T.LinearFilter;texture.minFilter=T.LinearMipmapLinearFilter;
  texture.generateMipmaps=true;texture.anisotropy=8;
  texture.colorSpace=color?T.SRGBColorSpace:T.NoColorSpace;texture.needsUpdate=true;
  return texture;
}

type Surface='grass'|'sand'|'bark'|'stone'|'soil'|'cutsoil'|'slate';
const surfaceCache=new Map<Surface,T.MeshStandardMaterial>();
export function surfaceMaterial(kind:Surface) {
  if(surfaceCache.has(kind))return surfaceCache.get(kind)!;
  const size=kind==='grass'?512:256,count=size*size;
  const color=new Uint8Array(count*4),normal=new Uint8Array(count*4),rough=new Uint8Array(count*4),height=new Float32Array(count);
  // Slate stays neutral and light here so its architectural tint is not darkened twice.
  const base={grass:[95,125,48],sand:[188,168,116],bark:[100,82,57],stone:[174,167,139],soil:[92,74,45],cutsoil:[77,113,106],slate:[224,224,224]}[kind];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const i=y*size+x,u=x/size,v=y/size;
    const broad=noise(u,v,8,37),detail=noise(u,v,64,83),grain=hash(x,y,193);
    let h=broad*.35+detail*.35+grain*.3,shade=.82+broad*.25+detail*.16+(grain-.5)*.16;
    if(kind==='grass') {
      const blade=Math.pow(Math.max(0,Math.sin(u*Math.PI*320+noise(u,v,32,23)*8)),12)*(.3+detail*.7);
      h=h*.4+blade*.6;shade+=blade*.3;
    } else if(kind==='bark') {
      const furrow=Math.pow(Math.abs(Math.sin(u*Math.PI*34+noise(u,v,16,19)*3)),.35);
      h=furrow*.75+detail*.18+grain*.07;shade=.5+furrow*.62+detail*.2;
    } else if(kind==='slate') {
      // Eight courses, staggered half a tile: subtle cleavage and a raised lower lip.
      const row=Math.floor(v*8),across=(u*6+(row%2)*.5)%1,down=(v*8)%1;
      const seam=across<.025||down<.055,tile=hash(Math.floor(u*6+(row%2)*.5),row,57);
      h=seam?.08:.45+down*.28+detail*.08;
      shade=seam?.70:.85+tile*.17+grain*.04+(down>.87?.06:0);
    } else if(kind==='cutsoil') {
      const strata=Math.sin(v*37+noise(u,v,8,23)*.6)*.035;
      h=broad*.2+detail*.1;shade=.75+v*.28+strata+detail*.1;
    } else if(kind==='stone') {
      const row=Math.floor(v*8),joint=(u*4+(row%2)*.5)%1;
      const mortar=joint<.018||(v*8)%1<.025;
      h=mortar?.12:h*.28+.5;shade=mortar?.7:.87+broad*.18+grain*.12;
    }
    height[i]=h;
    for(let c=0;c<3;c++)color[i*4+c]=Math.min(255,base[c]*shade);
    color[i*4+3]=255;
    const r=kind==='bark'?215:kind==='stone'?222:240;
    rough.set([r+grain*10,r+grain*10,r+grain*10,255],i*4);
  }
  const strength=kind==='bark'?2.8:kind==='grass'?1.4:.85;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const at=(a:number,b:number)=>height[((b+size)%size)*size+(a+size)%size];
    const nx=(at(x-1,y)-at(x+1,y))*strength,ny=(at(x,y-1)-at(x,y+1))*strength;
    const length=Math.hypot(nx,ny,1),i=(y*size+x)*4;
    normal.set([(nx/length*.5+.5)*255,(ny/length*.5+.5)*255,(1/length*.5+.5)*255,255],i);
  }
  const mat=new T.MeshStandardMaterial({map:dataTexture(color,size,true),normalMap:dataTexture(normal,size),roughnessMap:dataTexture(rough,size),roughness:1});
  mat.name=`Natural ${kind}`;
  if(kind==='grass') {
    // Several metres of mottling, plus gentle mowing bands, break up tile repetition.
    mat.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vMeadowPosition;');
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvMeadowPosition=(modelMatrix*vec4(position,1.0)).xyz;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vMeadowPosition;');
      shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
        float meadow=sin(vMeadowPosition.x*.22+sin(vMeadowPosition.z*.31))*sin(vMeadowPosition.z*.17);
        float mowing=sin((vMeadowPosition.x+vMeadowPosition.z*.28)*1.3);
        diffuseColor.rgb*=.94+meadow*.13+mowing*.035;
      `);
    };
    mat.customProgramCacheKey=()=> 'meadow-mottling-v1';
  }
  surfaceCache.set(kind,mat);return mat;
}

let leafMap:T.DataTexture|undefined;
export function foliageTexture() {
  if(leafMap)return leafMap;
  const size=256,data=new Uint8Array(size*size*4);
  // Five pointed, slightly serrated oak/lime leaves per twig; transparent gaps are
  // cut out in both the color and shadow passes, including at the canopy silhouette.
  const leaves=[[.52,.72,.14,.25,-.12],[.27,.51,.125,.22,-.78],[.72,.47,.14,.23,.86],[.34,.23,.12,.19,-.7],[.67,.18,.11,.17,.68]];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
    const u=x/size,v=y/size,i=(y*size+x)*4;
    let alpha=0,shade=.82;
    for(const [cx,cy,rx,ry,a]of leaves) {
      const dx=u-cx,dy=v-cy,across=(dx*Math.cos(a)-dy*Math.sin(a))/rx,along=(dx*Math.sin(a)+dy*Math.cos(a))/ry;
      const edge=Math.pow(Math.max(0,1-along*along),.72)*(1+.045*Math.sin(along*35));
      if(Math.abs(along)<1&&Math.abs(across)<edge) {
        alpha=255;
        const vein=Math.exp(-Math.abs(across)*55)*.17;
        const sideVein=Math.pow(Math.max(0,Math.cos(along*43-Math.abs(across)*10)),20)*.07;
        shade=.82+edge*.14+vein+sideVein+(hash(x,y,97)-.5)*.1;
      }
    }
    if(Math.abs(u-(.5+.045*Math.sin(v*5)))<.009&&v>.07&&v<.83){alpha=255;shade=.65;}
    data.set([91*shade,129*shade,42*shade,alpha],i);
  }
  leafMap=dataTexture(data,size,true);leafMap.wrapS=leafMap.wrapT=T.ClampToEdgeWrapping;
  return leafMap;
}

export function riverMaterial(marina=false) {
  const time={value:0};
  const night={value:0};
  const reflectionTexture:{value:T.Texture|null}={value:null},reflectionMatrix={value:new T.Matrix4()};
  const mat=new T.MeshPhysicalMaterial({color:'#087e8c',roughness:.23,metalness:0,clearcoat:.65,clearcoatRoughness:.22,ior:1.333});
  mat.name='River · irregular flow and city reflections';
  mat.onBeforeCompile=shader=>{
    shader.uniforms.uRiverTime=time;shader.uniforms.uRiverNight=night;shader.uniforms.uReflection=reflectionTexture;shader.uniforms.uReflectionMatrix=reflectionMatrix;
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vRiverPosition; varying vec2 vRiverUV; varying vec4 vReflectionCoord; uniform mat4 uReflectionMatrix;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvRiverPosition=position;vRiverUV=uv;vReflectionCoord=uReflectionMatrix*modelMatrix*vec4(position,1.0);');
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
      uniform float uRiverTime;uniform float uRiverNight;uniform sampler2D uReflection;
      varying vec3 vRiverPosition;varying vec2 vRiverUV;varying vec4 vReflectionCoord;
      float riverHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float riverNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(riverHash(i),riverHash(i+vec2(1,0)),f.x),mix(riverHash(i+vec2(0,1)),riverHash(i+vec2(1,1)),f.x),f.y);}
      float waterHeight(vec2 p){
        vec2 drift=vec2(uRiverTime*.12,-uRiverTime*.19);
        return riverNoise(p*vec2(.65,1.3)+drift)*.11
          +riverNoise(p*vec2(1.7,3.4)-drift*.7)*.028
          +sin(p.x*.73+p.y*1.17+uRiverTime*.43+riverNoise(p*.3)*4.0)*.017;
      }
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
      float shallow=${marina?`pow(1.0-clamp(min(abs(length((vRiverPosition.xz-vec2(-24.0,10.0))/vec2(34.0,34.0))-1.0)*40.0,min(abs(max(abs(vRiverPosition.x)-99.0,abs(vRiverPosition.z)-97.0)),vRiverPosition.x>0.0?abs(abs(vRiverPosition.z-32.0)-8.0):1000.0))/8.0,0.0,1.0),1.8)`:'pow(abs(vRiverUV.x*2.0-1.0),5.0)'};
      vec3 bankColor=mix(vec3(.075,.48,.40),vec3(.045,.065,.075),uRiverNight);
      diffuseColor.rgb=mix(diffuseColor.rgb,bankColor,shallow*.65);
      diffuseColor.rgb*=.94+riverNoise(vRiverPosition.xz*.24+vec2(0.0,uRiverTime*.04))*.12;
    `);
    // Perturb the actual lighting normal, rather than painting a repeating dot grid.
    shader.fragmentShader=shader.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
      vec2 p=vRiverPosition.xz;
      vec2 slope=vec2(waterHeight(p+vec2(.04,0.0))-waterHeight(p-vec2(.04,0.0)),waterHeight(p+vec2(0.0,.04))-waterHeight(p-vec2(0.0,.04)))/.08;
      vec3 rippleNormal=normalize(vec3(-slope.x,1.0,-slope.y));
      normal=normalize(mat3(viewMatrix)*rippleNormal);
    `);
    shader.fragmentShader=shader.fragmentShader.replace('#include <clearcoat_normal_fragment_begin>','#include <clearcoat_normal_fragment_begin>\n#ifdef USE_CLEARCOAT\nclearcoatNormal=normal;\n#endif');
    shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
      vec2 reflectionUV=vReflectionCoord.xy/vReflectionCoord.w+slope*.018;
      vec3 reflected=texture2D(uReflection,clamp(reflectionUV,vec2(.002),vec2(.998))).rgb;
      float edgeFade=smoothstep(0.0,.035,min(min(reflectionUV.x,1.0-reflectionUV.x),min(reflectionUV.y,1.0-reflectionUV.y)));
      float fresnel=.12+.48*pow(1.0-clamp(dot(normal,normalize(vViewPosition)),0.0,1.0),3.0);
      outgoingLight=mix(outgoingLight,reflected,fresnel*edgeFade);
      #include <opaque_fragment>
    `);
  };
  mat.customProgramCacheKey=()=> marina?'marina-reflections-v1':'river-reflections-v5';
  return {material:mat,time,night,reflectionTexture,reflectionMatrix};
}
