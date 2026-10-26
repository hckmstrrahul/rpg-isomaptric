import * as T from 'three';
import { Builder, canvasTexture, material } from './geometry.ts';
let plate:T.MeshStandardMaterial|undefined;
export function createHydrant() {
  if(!plate){
    const map=canvasTexture(175,200,ctx=>{
      ctx.fillStyle='#d8ba4c';ctx.fillRect(0,0,175,200);ctx.fillStyle='#272b27';ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.font='bold 132px sans-serif';ctx.fillText('H',87,100);ctx.font='bold 27px sans-serif';ctx.fillText('100',87,36);ctx.fillText('1',87,169);
    });plate=new T.MeshStandardMaterial({map,roughness:.75});
  }
  const b=new Builder();
  b.box(0,.47,0,.13,.94,.15,'#9caa9f');b.box(0,.82,.05,.39,.45,.065,'#d5bb52');
  const label=new T.PlaneGeometry(.35,.4);b.add(label,plate,0,.82,.085);label.dispose();
  b.box(0,.025,.42,.52,.05,.64,material('#414c48',.8,.3));
  for(const x of [-.2,.2])b.box(x,.053,.42,.025,.008,.56,'#7e897d');
  for(const z of [.17,.67])b.box(0,.053,z,.42,.008,.025,'#7e897d');
  b.box(-.08,.056,.42,.03,.01,.22,'#b3ae79');b.box(.08,.056,.42,.03,.01,.22,'#b3ae79');b.box(0,.056,.42,.16,.01,.03,'#b3ae79');
  const root=b.finish();root.name='London underground fire hydrant';return root;
}
