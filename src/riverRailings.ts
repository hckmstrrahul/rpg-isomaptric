import * as T from 'three';
import { Builder, vec, material } from './geometry.ts';
import { bankSections, bankPath } from './embankment.ts';
import { bank, BRIDGES, GROUND, riverCenter, riverWidth } from './layout.ts';

export function createRiverRailings() {
  const b=new Builder(),iron=material('#202c2b',.5,.65),segments:{x:number;z:number}[]=[];
  const runs:{a:T.Vector3;c:T.Vector3}[]=[];
  for(const side of [-1,1]) {
    for(const [start,end] of bankSections(3.3)) {
      const path=bankPath(side,.22,start,end,2);
      for(let i=1;i<path.length;i++)runs.push({a:vec(path[i-1].x,GROUND+.12,path[i-1].z),c:vec(path[i].x,GROUND+.12,path[i].z)});
    }
    for(const bz of BRIDGES)for(const direction of [-1,1]) {
      const z=bz+direction*3.3;
      runs.push({a:vec(bank(z,side,.22),GROUND+.12,z),c:vec(riverCenter(bz)+side*(riverWidth(bz)/2+1.3),GROUND+.12,z)});
    }
  }
  for(const {a,c} of runs) {
    segments.push({x:(a.x+c.x)/2,z:(a.z+c.z)/2});
    for(const y of [.22,.87])b.beam(a.clone().add(vec(0,y,0)),c.clone().add(vec(0,y,0)),.035,iron);
    for(let i=0;i<6;i++) {
      const p=a.clone().lerp(c,i/6),post=i===0;
      b.beam(p,p.clone().add(vec(0,post?1.08:.98,0)),post?.055:.025,iron,5);
      if(post)b.sphere(p.x,p.y+1.1,p.z,.085,.085,.085,iron);
      else b.cylinder(p.x,p.y+1.015,p.z,.05,.11,iron,0,4);
    }
  }
  const root=b.finish();root.name='British cast-iron riverbank railings';root.userData.bankSegments=segments;root.userData.endpoints=runs.map(run=>({a:run.a.toArray(),c:run.c.toArray()}));
  return root;
}
