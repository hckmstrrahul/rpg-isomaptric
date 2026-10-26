import * as T from 'three';
import { GROUND } from './layout.ts';
import type { Destructible } from './sandbox.ts';

/** Brief, object-anchored feedback created only by actual bomb impacts. */
export class DamageBars {
  private bars=new Map<number,{object:Destructible;element:HTMLDivElement;hitAt:number}>();
  private projected=new T.Vector3();
  private host:HTMLElement;
  constructor(host:HTMLElement){this.host=host;}
  hit(object:Destructible,time:number) {
    let bar=this.bars.get(object.id);
    if(!bar) {
      const element=document.createElement('div');element.className='damage-bar';
      element.setAttribute('role','progressbar');element.setAttribute('aria-label',`${object.name} durability`);
      element.setAttribute('aria-valuemin','0');element.setAttribute('aria-valuemax','100');
      element.innerHTML='<i></i>';this.host.appendChild(element);
      bar={object,element,hitAt:time};this.bars.set(object.id,bar);
    }
    bar.hitAt=time;
    const fraction=Math.max(0,object.hp/object.maxHp);
    (bar.element.firstElementChild as HTMLElement).style.transform=`scaleX(${fraction})`;
    bar.element.dataset.level=fraction<.3?'low':fraction<.65?'medium':'high';
    bar.element.setAttribute('aria-valuenow',String(Math.round(fraction*100)));
  }
  update(camera:T.Camera,time:number,width:number,height:number,hidden=false) {
    for(const [id,bar]of this.bars) {
      const age=time-bar.hitAt,lifetime=bar.object.destroyed?.65:3.2;
      if(age>=lifetime){bar.element.remove();this.bars.delete(id);continue;}
      const p=this.projected.set(bar.object.x,(bar.object.baseY??GROUND)+bar.object.height+1.2,bar.object.z).project(camera);
      const visible=!hidden&&p.z>=-1&&p.z<=1&&Math.abs(p.x)<.96&&Math.abs(p.y)<.96;
      bar.element.style.display=visible?'':'none';
      bar.element.style.left=`${(p.x*.5+.5)*width}px`;bar.element.style.top=`${(-p.y*.5+.5)*height}px`;
      bar.element.style.opacity=String(Math.min(1,(lifetime-age)/.35));
    }
  }
}
