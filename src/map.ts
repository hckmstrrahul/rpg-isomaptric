import { HALF, RIVER_END, riverCenter, riverWidth, LANDMARKS, resolveTeleport, type Obstacle } from './layout.ts';
import { TERRAIN_OUTLINE } from './boundary.ts';
import { GARDENS } from './cityPlan.ts';
import type { Destructible } from './sandbox.ts';
import { ROAD_COLOR, ROAD_NIGHT_COLOR } from './roadSurfaces.ts';

export class CityMap {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  size = 240;
  full: boolean;
  night=false;
  obstacles: Obstacle[];
  roads: { points: {x: number; z: number}[]; width: number }[];
  objects: Destructible[];
  teleportPreview: { x: number; z: number } | null = null;
  constructor(canvas: HTMLCanvasElement, obstacles: Obstacle[], roads: {points:{x:number;z:number}[];width:number}[], full=false, objects:Destructible[]=[]) {
    this.canvas=canvas;this.context=canvas.getContext('2d')!;this.obstacles=obstacles;this.roads=roads;this.full=full;this.objects=objects;
  }
  toWorld(clientX:number,clientY:number) {
    const r=this.canvas.getBoundingClientRect();
    const extent=this.full?236:HALF*2;
    return {x:((clientX-r.left)/r.width-.5)*extent,z:((clientY-r.top)/r.height-.5)*extent};
  }
  draw(px:number,pz:number,heading:number,visited:Set<string>) {
    const dpr=Math.min(devicePixelRatio,2),rect=this.canvas.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    const size=rect.width;
    if(this.canvas.width!==Math.round(size*dpr)){this.canvas.width=Math.round(size*dpr);this.canvas.height=Math.round(size*dpr);}
    const ctx=this.context;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,size,size);
    const extent=this.full?236:HALF*2,k=size/extent,map=(v:number)=>(v+extent/2)*k;
    const palette=this.night?{
      background:'#222a30',land:'#394541',water:'#354852',bank:'#65716f',road:ROAD_NIGHT_COLOR,building:'#879195',tree:'#465a4b',path:'#778070',
    }:{background:this.full?'#e7eadc':'#e6e9d9',land:'#c4d0a6',water:'#56aeb1',bank:'#f2e9cf',road:ROAD_COLOR,building:'#a6ac98',tree:'#95ad7c',path:'#eae3c5'};
    if(this.full){ctx.fillStyle=palette.background;ctx.fillRect(0,0,size,size);}
    ctx.fillStyle=palette.land;ctx.beginPath();TERRAIN_OUTLINE.forEach((p,i)=>i?ctx.lineTo(map(p.x),map(p.z)):ctx.moveTo(map(p.x),map(p.z)));ctx.closePath();ctx.fill();
    ctx.beginPath();
    for(let z=-HALF;z<=RIVER_END;z++){const x=riverCenter(z)-riverWidth(z)/2;z===-HALF?ctx.moveTo(map(x),map(z)):ctx.lineTo(map(x),map(z));}
    for(let z=RIVER_END;z>=-HALF;z--)ctx.lineTo(map(riverCenter(z)+riverWidth(z)/2),map(z));
    ctx.closePath();ctx.fillStyle=palette.water;ctx.fill();
    // Stroke only the banks; the water is cut flush at both outer slab edges.
    for(const side of [-1,1]) {
      ctx.beginPath();
      for(let z=-HALF;z<=RIVER_END;z++){const x=riverCenter(z)+side*riverWidth(z)/2;z===-HALF?ctx.moveTo(map(x),map(z)):ctx.lineTo(map(x),map(z));}
      ctx.strokeStyle=palette.bank;ctx.lineWidth=2*k;ctx.stroke();
    }
    // Road fills only: borders belong to the 3D scene. Square caps retain the
    // continuous corner joins without outlining each block on this small map.
    ctx.save();ctx.lineCap='square';
    for(const road of this.roads){
      ctx.beginPath();road.points.forEach((p,i)=>i===0?ctx.moveTo(map(p.x),map(p.z)):ctx.lineTo(map(p.x),map(p.z)));
      ctx.strokeStyle=palette.road;ctx.lineWidth=road.width*k;ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle=palette.building;
    for(const b of this.obstacles) {if(b.w<1&&b.d<1)continue;ctx.fillRect(map(b.x-b.w/2)+.5,map(b.z-b.d/2)+.5,Math.max(.5,b.w*k-1),Math.max(.5,b.d*k-1));}
    for(const tree of this.objects) {
      if(tree.kind!=='tree'||tree.destroyed||(!this.full&&!tree.planted))continue;
      ctx.fillStyle=tree.planted?'#4c8051':palette.tree;ctx.beginPath();ctx.arc(map(tree.x),map(tree.z),tree.planted?Math.max(2,1.2*k):Math.max(.5,.9*k),0,Math.PI*2);ctx.fill();
    }
    ctx.strokeStyle=palette.path;ctx.lineWidth=k;
    for(const p of GARDENS)for(const scale of [.33,.66,.95]){ctx.beginPath();ctx.arc(map(p.x),map(p.z),p.r*scale*k,0,Math.PI*2);ctx.stroke();}
    if(this.full) {
      LANDMARKS.forEach((l,i)=>{
        const x=map(l.x),z=map(l.z);
        const cleared=this.objects.some(o=>o.landmarkId===l.id&&o.destroyed);
        ctx.fillStyle=cleared?'#ae9372':visited.has(l.id)?'#506f53':'#284f48';ctx.beginPath();ctx.arc(x,z,10,0,Math.PI*2);ctx.fill();
        ctx.strokeStyle='#f1ebd6';ctx.lineWidth=2;ctx.stroke();
        ctx.fillStyle='#fff8e6';ctx.font='600 10px "Inter Variable", Inter, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(cleared?'×':`${i+1}`,x,z+.5);
      });
    }
    // Heading wedge and high-contrast explorer dot, kept readable at any display size.
    ctx.save();ctx.translate(map(px),map(pz));ctx.rotate(-heading);
    ctx.fillStyle='#cf633e33';ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,this.full?21:13,-Math.PI*.15,Math.PI*1.15);ctx.closePath();ctx.fill();ctx.restore();
    ctx.beginPath();ctx.arc(map(px),map(pz),this.full?6:4.5,0,Math.PI*2);ctx.fillStyle='#d3613d';ctx.fill();ctx.strokeStyle='#fff9e6';ctx.lineWidth=2;ctx.stroke();
    if(this.full&&this.teleportPreview) {
      const p=this.teleportPreview,valid=resolveTeleport(p.x,p.z,this.obstacles).valid,x=map(p.x),z=map(p.z);
      ctx.save();ctx.strokeStyle=valid?'#367b51':'#b55342';ctx.fillStyle=valid?'#5e9f6d33':'#bc6c5133';ctx.lineWidth=2;
      ctx.beginPath();ctx.arc(x,z,11,0,Math.PI*2);ctx.fill();ctx.stroke();
      ctx.beginPath();
      if(valid){ctx.moveTo(x-5,z);ctx.lineTo(x-1,z+4);ctx.lineTo(x+6,z-5);}
      else{ctx.moveTo(x-4,z-4);ctx.lineTo(x+4,z+4);ctx.moveTo(x+4,z-4);ctx.lineTo(x-4,z+4);}
      ctx.stroke();ctx.restore();
    }
    if(this.full) {ctx.font='500 11px "Inter Variable", Inter, sans-serif';ctx.textAlign='left';ctx.fillStyle='#6a7864';ctx.fillText('N',map(-105),map(-103));}
  }
}
