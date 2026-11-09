import * as T from 'three';
import {dataTexture} from '../../nature.ts';

export const TILE_WIDTH=.32,COURSE_HEIGHT=.44,TILES_PER_MAP=8;
const materials=new Map<string,T.MeshStandardMaterial>();
let maps:{map:T.DataTexture;normalMap:T.DataTexture}|undefined;
function tileMaps() {
  if(maps)return maps;
  const size=512,color=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4),height=new Float32Array(size*size);
  const hash=(x:number,y:number)=>{let n=Math.imul(x+71,y+193);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/64,v=y/64,col=Math.floor(u),row=Math.floor(v),across=u-col,down=v-row;
    const edge=across<.035||down<.045,channel=Math.exp(-Math.pow((across-.16)/.07,2))*.22+Math.exp(-Math.pow((across-.84)/.045,2))*.15;
    const grain=hash(x,y),tile=hash(col+21,row+41),lip=down>.91;
    const shade=edge?.56:.83+tile*.2+(grain-.5)*.055-channel*.18+(lip?.06:0);
    const i=y*size+x;color.set([238*shade,231*shade,222*shade,255],i*4);
    height[i]=edge?.05:.48+down*.17-channel+(lip?.1:0)+(grain-.5)*.025;
  }
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const at=(a:number,b:number)=>height[((b+size)%size)*size+(a+size)%size];
    const nx=(at(x-1,y)-at(x+1,y))*1.4,ny=(at(x,y-1)-at(x,y+1))*1.4,scale=1/Math.hypot(nx,ny,1);
    normal.set([(nx*scale*.5+.5)*255,(ny*scale*.5+.5)*255,(scale*.5+.5)*255,255],(y*size+x)*4);
  }
  maps={map:dataTexture(color,size,true),normalMap:dataTexture(normal,size)};return maps;
}

/** Interlocking clay courses with restrained weathering, shared by every red roof. */
export function roofTileMaterial(color:string) {
  let material=materials.get(color);
  if(!material){material=new T.MeshStandardMaterial({color,...tileMaps(),roughness:.91,normalScale:new T.Vector2(.65,.65)});material.name='Bengaluru · interlocking terracotta roof tiles';materials.set(color,material);}
  return material;
}
