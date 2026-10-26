import * as T from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { registerGlow, glowBatch } from './lighting.ts';
import { windowLighting, lightingRandom } from './windowLighting.ts';

let seed = 71297;
export const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
export const range = (a: number, b: number) => a + random() * (b - a);
export const pick = <K>(a: K[]) => a[Math.floor(random() * a.length)];
export const vec = (x: number, y: number, z: number) => new T.Vector3(x, y, z);
const materials = new Map<string, T.MeshStandardMaterial>();
const solidMaterial = new T.MeshStandardMaterial({ color: '#ffffff', roughness: 0.78, vertexColors: true });
export function material(color: string, roughness = 0.78, metalness = 0) {
  const key = `${color}:${roughness}:${metalness}`;
  if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness, metalness }));
  return materials.get(key)!;
}

export class Builder {
  batches = new Map<T.Material, T.BufferGeometry[]>();
  group = new T.Group();
  add(geo: T.BufferGeometry, mat: T.Material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const transform = new T.Matrix4().compose(vec(x, y, z), new T.Quaternion().setFromEuler(new T.Euler(rx, ry, rz)), vec(sx, sy, sz));
    const g = geo.clone().applyMatrix4(transform);
    // All geometries in a batch use the same position, normal, UV layout.
    const compatible = g.index ? g.toNonIndexed() : g;
    if (g !== compatible) g.dispose();
    if (!compatible.getAttribute('uv')) compatible.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(compatible.getAttribute('position').count * 2), 2));
    if(mat.userData.worldTile) {
      // Repeat imported surfaces at a fixed world scale, including long pavement strips.
      const tile=mat.userData.worldTile as number,uv=compatible.getAttribute('uv'),p=compatible.getAttribute('position'),n=compatible.getAttribute('normal');
      for(let i=0;i<p.count;i++) {
        const ax=Math.abs(n.getX(i)),ay=Math.abs(n.getY(i)),az=Math.abs(n.getZ(i));
        if(ay>=ax&&ay>=az)uv.setXY(i,p.getX(i)/tile,p.getZ(i)/tile);
        else if(ax>az)uv.setXY(i,p.getZ(i)/tile,p.getY(i)/tile);
        else uv.setXY(i,p.getX(i)/tile,p.getY(i)/tile);
      }
    }
    for (const key of Object.keys(compatible.attributes)) if (!['position', 'normal', 'uv', 'color'].includes(key)) compatible.deleteAttribute(key);
    if(mat.userData.facadeCap) {
      const normal=compatible.getAttribute('normal'),walls:number[]=[],caps:number[]=[];
      for(let i=0;i<normal.count;i+=3) {
        const destination=Math.abs(normal.getY(i)+normal.getY(i+1)+normal.getY(i+2))>1.5?caps:walls;
        destination.push(i,i+1,i+2);
      }
      if(caps.length) {
        // Apply to extrusions and cylinders too: facade windows never wrap over
        // roofs, ledges, or the underside of a bridge portal.
        const cap=compatible.clone();cap.setIndex(caps);this.add(cap,mat.userData.facadeCap);cap.dispose();
        if(walls.length){compatible.setIndex(walls);this.add(compatible,mat);}
        compatible.dispose();return;
      }
    }
    // Bake solid colours into vertex attributes so trees, cars, masonry and street
    // furniture share one draw call per model instead of one per paint colour.
    let batchMaterial = mat;
    if(mat instanceof T.MeshStandardMaterial&&mat.userData.glowStrength) {
      const colors=new Float32Array(compatible.getAttribute('position').count*3);
      for(let i=0;i<colors.length;i+=3){colors[i]=mat.color.r;colors[i+1]=mat.color.g;colors[i+2]=mat.color.b;}
      compatible.setAttribute('color',new T.Float32BufferAttribute(colors,3));batchMaterial=glowBatch(mat.userData.glowStrength);
    } else if (mat instanceof T.MeshStandardMaterial && !mat.map && !mat.userData.themeColor && mat.roughness === 0.78 && mat.metalness === 0) {
      if (mat !== solidMaterial || !compatible.getAttribute('color')) {
        const colors = new Float32Array(compatible.getAttribute('position').count * 3);
        for (let i = 0; i < colors.length; i += 3) { colors[i] = mat.color.r; colors[i+1] = mat.color.g; colors[i+2] = mat.color.b; }
        compatible.setAttribute('color', new T.Float32BufferAttribute(colors, 3));
      }
      batchMaterial = solidMaterial;
    }
    if (!this.batches.has(batchMaterial)) this.batches.set(batchMaterial, []);
    this.batches.get(batchMaterial)!.push(compatible);
  }
  box(x: number, y: number, z: number, w: number, h: number, d: number, color: string | T.Material, ry = 0) {
    this.add(cube,typeof color==='string'?material(color):color,x,y,z,w,h,d,0,ry);
  }
  cylinder(x: number, y: number, z: number, r: number, h: number, color: string | T.Material, top = r, sides = 16) {
    const g = new T.CylinderGeometry(top, r, h, sides);
    this.add(g, typeof color === 'string' ? material(color) : color, x, y, z); g.dispose();
  }
  sphere(x: number, y: number, z: number, rx: number, ry: number, rz: number, color: string | T.Material) {
    this.add(sphere, typeof color === 'string' ? material(color) : color, x, y, z, rx, ry, rz);
  }
  beam(a: T.Vector3, b: T.Vector3, radius: number, color: string | T.Material, sides = 6) {
    const g = new T.CylinderGeometry(radius, radius, a.distanceTo(b), sides);
    const q = new T.Quaternion().setFromUnitVectors(vec(0, 1, 0), b.clone().sub(a).normalize());
    g.applyQuaternion(q);
    this.add(g, typeof color==='string'?material(color):color, (a.x+b.x)/2, (a.y+b.y)/2, (a.z+b.z)/2); g.dispose();
  }
  tube(points: T.Vector3[], radius: number, color: string | T.Material, segments = 60) {
    const geo = new T.TubeGeometry(new T.CatmullRomCurve3(points), segments, radius, 5, false);
    this.add(geo, typeof color==='string'?material(color):color); geo.dispose();
  }
  ribbon(points: { x: number; z: number }[], width: number, y: number|((x:number,z:number)=>number), color: string | T.Material, clipZ=Infinity, alignEndsToZ=false) {
    const vertices: number[] = [], uvs: number[] = [], indices: number[] = [];
    for (let i = 0; i < points.length; i++) {
      const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 1)];
      const dx = next.x - prev.x, dz = next.z - prev.z, len = Math.hypot(dx, dz) || 1;
      const clipped=(z:number)=>Math.max(-clipZ,Math.min(clipZ,z));
      for(const side of [1,-1]){
        const aligned=alignEndsToZ&&(i===0||i===points.length-1);
        const x=points[i].x+side*(aligned?1:dz/len)*width/2,z=clipped(points[i].z-(aligned?0:side*dx/len*width/2));
        vertices.push(x,typeof y==='number'?y:y(x,z),z);
      }
      uvs.push(0, i / 5, 1, i / 5);
      if (i < points.length - 1) { const a = i * 2; indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    g.setAttribute('uv', new T.Float32BufferAttribute(uvs, 2)); g.setIndex(indices); g.computeVertexNormals();
    this.add(g, typeof color === 'string' ? material(color) : color); g.dispose();
  }
  ring(x: number, y: number, z: number, radius: number, width: number, color: string) {
    const g = new T.RingGeometry(radius - width / 2, radius + width / 2, 96);
    this.add(g, material(color), x, y, z, 1, 1, 1, -Math.PI / 2); g.dispose();
  }
  absorb(object: T.Object3D) {
    object.updateMatrixWorld(true);
    object.traverse(child => {
      if (!(child instanceof T.Mesh) || Array.isArray(child.material)) return;
      const g = child.geometry.clone().applyMatrix4(child.matrixWorld);
      this.add(g, child.material); g.dispose(); child.geometry.dispose();
    });
  }
  finish() {
    for (const [mat, geometries] of this.batches) {
      const geometry = mergeGeometries(geometries);
      if (!geometry) throw new Error('Unable to combine city geometry.');
      const mesh = new T.Mesh(geometry, mat);
      mesh.castShadow = !mat.userData.noShadow; mesh.receiveShadow = true;
      this.group.add(mesh);
      geometries.forEach(g => g.dispose());
    }
    this.batches.clear();
    return this.group;
  }
}
export const cube = new T.BoxGeometry(1, 1, 1);
const sphere = new T.IcosahedronGeometry(1, 1);

export function canvasTexture(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
  draw(canvas.getContext('2d')!);
  const tex = new T.CanvasTexture(canvas); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

type FacadeType = 'stone' | 'brick' | 'glass';
type FacadeFamily = { type:FacadeType; seed:number; base:T.MeshStandardMaterial; variants:Map<number,T.MeshStandardMaterial> };
const facadeFamilies=new WeakMap<T.Material,FacadeFamily>();
function facadeNightMap(type:FacadeType,seed:number) {
  return canvasTexture(256,512,ctx=>{
    ctx.fillStyle='#000000';ctx.fillRect(0,0,256,512);
    const cols=type==='glass'?10:6,rows=type==='glass'?24:12,cw=256/cols,ch=512/rows;
    windowLighting(seed,cols,rows,type==='glass'?'office':'home').forEach((color,cell)=>{
      if(!color)return;
      const x=(cell%cols)*cw,y=Math.floor(cell/cols)*ch;
      ctx.fillStyle=`rgb(${color.join(',')})`;
      if(type==='glass') {
        // Light falls off into each room; the upper strip suggests a recessed ceiling.
        for(let band=0;band<4;band++) {
          const brightness=[.96,.86,.76,.64][band];
          ctx.fillStyle=`rgb(${color.map(c=>Math.round(c*brightness)).join(',')})`;
          ctx.fillRect(x+2.5,y+3+band*(ch-5)/4,cw-5,(ch-5)/4+.25);
        }
        ctx.fillStyle=`rgb(${color.join(',')})`;ctx.fillRect(x+3,y+3,cw-6,1.3);
        ctx.fillStyle='#000000';ctx.fillRect(x+cw*.58,y+3,.8,ch-5);
      }
      else {
        ctx.fillRect(x+9,y+9,cw-21,ch-18);
        // Frames and mullions are masonry, not luminous glass.
        ctx.fillStyle='#000000';ctx.fillRect(x+cw/2-3,y+9,1.5,ch-18);ctx.fillRect(x+9,y+ch/2,cw-21,1.5);
      }
    });
  });
}

/** Eight cached occupancy patterns per facade keep buildings varied without extra draws. */
export function varyFacadeLighting(root:T.Object3D,seed:number) {
  const variant=Math.floor(lightingRandom(seed)*8);
  const vary=(mat:T.Material)=>{
    const family=facadeFamilies.get(mat);if(!family)return mat;
    if(!family.variants.has(variant)) {
      const base=family.base;
      const next=registerGlow(new T.MeshStandardMaterial({map:base.map,emissiveMap:facadeNightMap(family.type,family.seed+variant),emissive:'#ffffff',roughness:base.roughness,metalness:base.metalness}),family.type==='glass'?.68:.96,family.type==='glass'?.035:0);
      next.userData.facadeCap=base.userData.facadeCap;
      next.userData.windowSeed=family.seed+variant;
      family.variants.set(variant,next);facadeFamilies.set(next,family);
    }
    return family.variants.get(variant)!;
  };
  root.traverse(child=>{if(child instanceof T.Mesh)child.material=Array.isArray(child.material)?child.material.map(vary):vary(child.material);});
}

export function facadeTexture(type: FacadeType, color: string) {
  const tex = canvasTexture(256, 512, ctx => {
    ctx.fillStyle = color; ctx.fillRect(0, 0, 256, 512);
    const cols = type === 'glass' ? 10 : 6, rows = type === 'glass' ? 24 : 12;
    const cw = 256 / cols, ch = 512 / rows;
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = col * cw, y = row * ch;
        ctx.fillStyle = 'rgba(255,255,255,.13)'; ctx.fillRect(x, y, cw, 1.5);
        ctx.fillStyle = 'rgba(40,39,28,.12)'; ctx.fillRect(x, y + ch - 2, cw, 2);
        if (type === 'glass') {
          ctx.fillStyle = pick(['#42626e', '#517889', '#638995', '#7798a2', '#385767']);
          ctx.fillRect(x + 1.7, y + 1.6, cw - 3.4, ch - 3.2);
          ctx.fillStyle = 'rgba(203,233,239,.25)'; ctx.fillRect(x + 2, y + 2, cw - 4, 2);
        } else {
          ctx.fillStyle = 'rgba(40,32,24,.3)'; ctx.fillRect(x + 10, y + 10, cw - 17, ch - 13);
          ctx.fillStyle = type === 'brick' ? '#d9bb8c' : '#f0e6cb'; ctx.fillRect(x + 7, y + 7, cw - 17, ch - 14);
          ctx.fillStyle = pick(['#36434a', '#45565c', '#6b7877']); ctx.fillRect(x + 9, y + 9, cw - 21, ch - 18);
          ctx.fillStyle = '#b8b5a0'; ctx.fillRect(x + cw / 2 - 3, y + 9, 1.5, ch - 18);
          ctx.fillRect(x + 9, y + ch / 2, cw - 21, 1.5);
          ctx.fillStyle = '#d6c7aa'; ctx.fillRect(x + 6, y + ch - 8, cw - 15, 2);
        }
      }
    }
  });
  const seed=Array.from(color).reduce((n,char)=>Math.imul(n,31)+char.charCodeAt(0),17)>>>0;
  const mat=registerGlow(new T.MeshStandardMaterial({map:tex,emissiveMap:facadeNightMap(type,seed),emissive:'#ffffff',roughness:type==='glass'?.2:.9,metalness:type==='glass'?.35:0}),type==='glass'?.68:.96,type==='glass'?.035:0);
  mat.userData.facadeCap=material(color);
  mat.userData.windowSeed=seed;
  facadeFamilies.set(mat,{type,seed,base:mat,variants:new Map([[0,mat]])});return mat;
}

export function clockMaterial() {
  const texture = canvasTexture(256, 256, ctx => {
    ctx.fillStyle = '#efe9d5'; ctx.fillRect(0, 0, 256, 256);
    ctx.strokeStyle = '#443d32'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(128, 128, 115, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(128, 128, 104, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#3d403a'; ctx.font = 'bold 26px Georgia'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const numerals = ['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
    for (let i = 0; i < 12; i++) { const angle = i / 6 * Math.PI; ctx.fillText(numerals[i], 128 + Math.sin(angle) * 82, 128 - Math.cos(angle) * 82); }
  });
  return registerGlow(new T.MeshStandardMaterial({map:texture,emissiveMap:texture,emissive:'#ffe1a3',roughness:.65}),.9);
}

/** Lower occupied rooms sampled on the actual facade triangles, in model-local space. */
export function facadeLightSamples(root:T.Object3D) {
  const samples=new Map<string,{position:T.Vector3;normal:T.Vector3;color:string}>();
  root.updateMatrixWorld(true);const inverse=root.matrixWorld.clone().invert();
  root.traverse(child=>{
    if(!(child instanceof T.Mesh)||Array.isArray(child.material))return;
    const family=facadeFamilies.get(child.material);if(!family||family.type==='glass')return;
    const rooms=windowLighting(child.material.userData.windowSeed,6,12);
    const geometry=child.geometry,p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),n=geometry.getAttribute('normal');
    const transform=new T.Matrix4().multiplyMatrices(inverse,child.matrixWorld),normalMatrix=new T.Matrix3().getNormalMatrix(transform);
    const index=geometry.index,count=index?.count??p.count;
    for(let i=0;i<count;i+=3) {
      const ids=[0,1,2].map(j=>index?index.getX(i+j):i+j),normal=new T.Vector3().fromBufferAttribute(n,ids[0]).applyMatrix3(normalMatrix).normalize();
      if(Math.abs(normal.y)>.1)continue;
      const side=`${Math.round(normal.x)},${Math.round(normal.z)}`;
      const [a,b,c]=ids.map(id=>new T.Vector2().fromBufferAttribute(uv,id));
      const denominator=(b.y-c.y)*(a.x-c.x)+(c.x-b.x)*(a.y-c.y);if(Math.abs(denominator)<1e-8)continue;
      for(let cell=71;cell>=54;cell--) {
        const color=rooms[cell];if(!color)continue;
        const u=(cell%6+.6)/6,v=1-(Math.floor(cell/6)+.4)/12;
        const wa=((b.y-c.y)*(u-c.x)+(c.x-b.x)*(v-c.y))/denominator;
        const wb=((c.y-a.y)*(u-c.x)+(a.x-c.x)*(v-c.y))/denominator,wc=1-wa-wb;
        if(Math.min(wa,wb,wc)<-1e-5)continue;
        const position=new T.Vector3();ids.forEach((id,j)=>position.addScaledVector(new T.Vector3().fromBufferAttribute(p,id),[wa,wb,wc][j]));position.applyMatrix4(transform);
        if(position.y<.45||position.y>2.6||position.y>=(samples.get(side)?.position.y??Infinity))continue;
        samples.set(side,{position,normal,color:`rgb(${color.join(',')})`});
      }
    }
  });
  return [...samples.values()];
}
