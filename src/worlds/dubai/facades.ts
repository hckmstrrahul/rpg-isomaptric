import * as T from 'three';
import {canvasTexture,material} from '../../geometry.ts';
import {registerGlow} from '../../lighting.ts';
import {lightingRandom} from '../../windowLighting.ts';

type Finish={color:string;frame:string;layout:'curtain'|'ribbon'|'fins'|'punched';cols:number;rows:number;roughness:number;metalness:number;occupancy:number;light:string;strength:number};
/** A finite architectural palette: reflective offices, shaded apartments and stone hotels. */
export const DUBAI_FINISHES={
  silver:{color:'#91afb8',frame:'#b6c7cb',layout:'fins',cols:16,rows:38,roughness:.24,metalness:.55,occupancy:.35,light:'#d4e5ee',strength:.45},
  blue:{color:'#427e9d',frame:'#7394a3',layout:'curtain',cols:10,rows:32,roughness:.22,metalness:.40,occupancy:.47,light:'#d7e6f0',strength:.42},
  teal:{color:'#497e7c',frame:'#97aaa2',layout:'ribbon',cols:10,rows:32,roughness:.29,metalness:.32,occupancy:.32,light:'#ffe1b3',strength:.52},
  bronze:{color:'#97816b',frame:'#b3a187',layout:'fins',cols:12,rows:30,roughness:.31,metalness:.46,occupancy:.40,light:'#ffcf91',strength:.48},
  pearl:{color:'#647f89',frame:'#d7d6c6',layout:'ribbon',cols:8,rows:32,roughness:.36,metalness:.24,occupancy:.38,light:'#ffe0b0',strength:.54},
  stone:{color:'#e0d7bf',frame:'#a7987f',layout:'punched',cols:7,rows:24,roughness:.72,metalness:.06,occupancy:.43,light:'#ffd5a0',strength:.58},
  slate:{color:'#3f535e',frame:'#6e838b',layout:'curtain',cols:12,rows:36,roughness:.27,metalness:.38,occupancy:.27,light:'#e0e8e4',strength:.40},
} satisfies Record<string,Finish>;
export type DubaiFinish=keyof typeof DUBAI_FINISHES;
const maps=new Map<DubaiFinish,T.CanvasTexture>(),materials=new Map<string,T.MeshStandardMaterial>();
const W=256,H=512;
function opening(p:Finish,col:number,row:number) {
  const cw=W/p.cols,ch=H/p.rows,x=col*cw,y=row*ch;
  return p.layout==='punched'?[x+cw*.24,y+ch*.16,cw*.52,ch*.66]:[x+.7,y+ch*.10,cw-1.4,ch*(p.layout==='ribbon'?.65:.80)];
}
function facadeMap(key:DubaiFinish) {
  if(maps.has(key))return maps.get(key)!;
  const p=DUBAI_FINISHES[key],cw=W/p.cols,ch=H/p.rows;
  const map=canvasTexture(W,H,ctx=>{
    ctx.fillStyle=p.color;ctx.fillRect(0,0,W,H);
    // Broad continuous reflection strips, not randomly coloured window tiles.
    if(p.layout!=='punched')for(let x=0;x<W;x++){
      const alpha=.025+.06*(.5+.5*Math.sin(x/W*Math.PI*4));
      ctx.fillStyle=`rgba(225,240,244,${alpha})`;ctx.fillRect(x,0,1,H);
    }
    for(let row=0;row<p.rows;row++){
      if(p.layout==='ribbon'){ctx.fillStyle=p.frame;ctx.fillRect(0,(row+.77)*ch,W,ch*.23);}
      else if(p.layout!=='punched'){ctx.fillStyle='rgba(23,42,48,.26)';ctx.fillRect(0,row*ch,W,.65);}
      for(let col=0;col<p.cols;col++){
        if(p.layout==='punched'){
          const [x,y,w,h]=opening(p,col,row);ctx.fillStyle='#415b62';ctx.fillRect(x,y,w,h);
          ctx.fillStyle=p.frame;ctx.fillRect(x+w*.5,y,.8,h);ctx.fillRect(x-1,y+h,w+2,1);
        }
      }
    }
    if(p.layout!=='punched')for(let col=0;col<p.cols;col++){
      ctx.fillStyle=p.layout==='fins'?p.frame:'rgba(195,218,224,.19)';
      ctx.fillRect(col*cw,0,p.layout==='fins'?1.3:.6,H);
    }
  });maps.set(key,map);return map;
}
/** Three precomputed occupancies per finish; no per-window geometry or frame-time work. */
export function dubaiFacade(key:DubaiFinish,variant=0) {
  variant=((Math.floor(variant)%3)+3)%3;const id=`${key}:${variant}`;
  if(materials.has(id))return materials.get(id)!;
  const p=DUBAI_FINISHES[key],seed=Object.keys(DUBAI_FINISHES).indexOf(key)*101+variant*293;
  const night=canvasTexture(W,H,ctx=>{
    ctx.fillStyle='#000000';ctx.fillRect(0,0,W,H);
    const tint=new T.Color(p.light),rgb=tint.convertLinearToSRGB().toArray().map(c=>c*255);
    for(let row=0;row<p.rows;row++)for(let col=0;col<p.cols;col++){
      const suite=seed+Math.floor(col/(p.layout==='curtain'?3:2))*71+row*307;
      if(lightingRandom(seed+row*67)<.17||lightingRandom(suite)>p.occupancy*(variant===2?.65:1))continue;
      const [x,y,w,h]=opening(p,col,row),brightness=.43+lightingRandom(suite+1)*.25;
      // Warm apartments and cooler offices differ by building, with a few darker floors.
      ctx.fillStyle=`rgb(${rgb.map(c=>Math.round(c*brightness)).join(',')})`;ctx.fillRect(x,y,w,h);
      ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x,y+h*.55,w,h*.45);
    }
  });
  const mat=registerGlow(new T.MeshStandardMaterial({map:facadeMap(key),emissiveMap:night,emissive:'#ffffff',roughness:p.roughness,metalness:p.metalness,envMapIntensity:.7}),p.strength,0);
  mat.userData.facadeCap=material(p.layout==='punched'?p.color:p.frame);
  mat.userData.dubaiFinish=key;mat.userData.nightProfile={occupancy:p.occupancy,color:p.light,strength:p.strength,variant};
  materials.set(id,mat);return mat;
}
