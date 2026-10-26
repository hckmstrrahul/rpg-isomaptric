import * as T from 'three';
import { Builder, vec } from './geometry.ts';
import { bank, BRIDGES, GROUND, HALF } from './layout.ts';
import { surfaceMaterial } from './nature.ts';

/** Fine, non-blocking groundcover sits on the wet sand below the promenades. */
export function addRiverGroundcover(builder:Builder) {
  let seed=41027;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const positions:number[]=[],colors:number[]=[],indices:number[]=[];
  const rootColor=new T.Color('#3b5628'),tipColor=new T.Color('#8c9d49');
  for(const side of [-1,1])for(let z=-HALF+3;z<HALF-3;z+=3.8+random()*2) {
    if(BRIDGES.some(bz=>Math.abs(bz-z)<5))continue;
    const x=bank(z,side)-side*.46;
    if(random()>.38)for(let blade=0;blade<12;blade++) {
      const a=random()*Math.PI*2,r=random()*.15,height=.25+random()*.48,width=.025+random()*.035,lean=.12+random()*.2;
      const ox=x+Math.cos(a)*r,oz=z+Math.sin(a)*r,offset=positions.length/3;
      for(let segment=0;segment<4;segment++) {
        const t=segment/3,w=width*(1-t)*.5;
        const cx=ox+Math.cos(a)*lean*t*t,cz=oz+Math.sin(a)*lean*t*t;
        const color=rootColor.clone().lerp(tipColor,t);
        for(const s of [-1,1]) {
          positions.push(cx+Math.sin(a)*w*s,.56+height*t,cz-Math.cos(a)*w*s);
          colors.push(color.r,color.g,color.b);
        }
        if(segment<3){const i=offset+segment*2;indices.push(i,i+1,i+2,i+1,i+3,i+2);}
      }
    }
    for(let i=0;i<2;i++) {
      const r=.09+random()*.12;
      builder.sphere(x+(random()-.5)*.15,.56+r*.25,z+(random()-.5)*1.3,r,r*.45,r*.7,surfaceMaterial('stone'));
    }
  }
  const grass=new T.BufferGeometry();grass.setAttribute('position',new T.Float32BufferAttribute(positions,3));
  grass.setAttribute('color',new T.Float32BufferAttribute(colors,3));grass.setIndex(indices);grass.computeVertexNormals();
  builder.add(grass,new T.MeshStandardMaterial({vertexColors:true,roughness:1,side:T.DoubleSide}));grass.dispose();
}

export function addFlowerBed(builder:Builder,x:number,z:number) {
  let seed=Math.abs(x*967+z*319)>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  const petals=['#c6a538','#d5bca0','#b97983'];
  for(let i=0;i<38;i++) {
    const px=x+(random()-.5)*5.3,pz=z+(random()-.5)*2.5,height=.35+random()*.35,top=GROUND+.3+height;
    builder.beam(vec(px,GROUND+.28,pz),vec(px,top,pz),.018,'#4b6c35',4);
    builder.sphere(px+.07,top-.18,pz,.11,.025,.04,'#69833d');
    const color=petals[i%petals.length];
    for(let petal=0;petal<5;petal++) {
      const a=petal*Math.PI*2/5;
      builder.sphere(px+Math.cos(a)*.075,top,pz+Math.sin(a)*.075,.075,.032,.075,color);
    }
    builder.sphere(px,top+.025,pz,.04,.025,.04,'#b79332');
  }
}
