import { HALF, isWater, isOnBridge, type Obstacle } from './layout.ts';

export const BOMB_DAMAGE = 34;
export const FIRE_INTERVAL = 0.65;
export const BOMB_RANGE = 50;
export const BLAST_RADIUS = 2.5;
export const PLANT_RANGE = 50;
export const TREE_CLEARANCE = 1.25;
export type ObjectKind = 'building' | 'tree' | 'prop' | 'boat';
export type Point = { x: number; z: number };
export type Destructible = Obstacle & {
  id: number; name: string; kind: ObjectKind; height: number;
  hp: number; maxHp: number; destroyed: boolean; planted: boolean; landmarkId?: string;
  baseY?: number; active?: boolean;
};
export type ObjectSpec = Omit<Destructible, 'id' | 'hp' | 'maxHp' | 'destroyed' | 'planted'> & { planted?: boolean };

export function durability(kind: ObjectKind, w: number, d: number, height: number) {
  const hits = kind === 'tree' ? Math.max(1, Math.ceil(height / 5.5))
    : kind === 'prop' || kind === 'boat' ? Math.max(1, Math.ceil(w * d * height / 12))
    : Math.max(2, Math.ceil(Math.pow(Math.max(1, w * d * height), .55) / 24));
  return hits * BOMB_DAMAGE;
}

export function footprintDistance(p: Point, box: Obstacle) {
  return Math.hypot(Math.max(0, Math.abs(p.x-box.x)-box.w/2), Math.max(0, Math.abs(p.z-box.z)-box.d/2));
}

export class SandboxState {
  objects: Destructible[] = [];
  shots = 0;
  demolished = 0;
  treesPlanted = 0;
  lastShot = -Infinity;
  register(spec: ObjectSpec) {
    const hp = durability(spec.kind,spec.w,spec.d,spec.height);
    const object: Destructible = { ...spec, planted: spec.planted ?? false, id: this.objects.length, hp, maxHp: hp, destroyed: false };
    this.objects.push(object);
    if (object.planted) this.treesPlanted++;
    return object;
  }
  fire(time: number) {
    if (time-this.lastShot < FIRE_INTERVAL-1e-6) return false;
    this.lastShot=time; this.shots++; return true;
  }
  reloadProgress(time: number) { return Math.max(0,Math.min(1,(time-this.lastShot)/FIRE_INTERVAL)); }
  damage(object: Destructible, amount = BOMB_DAMAGE) {
    if(object.destroyed || amount<=0)return { damage:0, destroyed:false };
    const applied=Math.min(object.hp,amount);object.hp-=applied;
    if(object.hp<=0){object.destroyed=true;this.demolished++;}
    return {damage:applied,destroyed:object.destroyed};
  }
  // Keyboard aim selects the nearest object in front, without needing a mouse.
  targetAhead(p: Point, heading: number, range = BOMB_RANGE) {
    const fx=Math.sin(heading),fz=Math.cos(heading);
    let best: Destructible|null=null,score=Infinity;
    for(const object of this.objects) {
      if(object.destroyed||object.active===false)continue;
      const dx=object.x-p.x,dz=object.z-p.z,along=dx*fx+dz*fz;
      const distance=footprintDistance(p,object);
      if(along<0||distance>range)continue;
      const across=Math.abs(dx*fz-dz*fx),padding=(Math.abs(fz)*object.w+Math.abs(fx)*object.d)/2;
      if(across>padding+Math.max(1,along*.18))continue;
      const candidate=distance+Math.max(0,across-padding)*1.4;
      if(candidate<score){score=candidate;best=object;}
    }
    return best;
  }
}

/** Trees may grow on any unoccupied ground, including reclaimed building plots. */
export function plantingIssue(p: Point, player: Point, obstacles: Obstacle[], objects: Destructible[], extraBlocked: Obstacle[] = []) {
  if(!Number.isFinite(p.x)||!Number.isFinite(p.z))return 'Choose a spot on the ground';
  if(Math.abs(p.x)>HALF-2-TREE_CLEARANCE||Math.abs(p.z)>HALF-2-TREE_CLEARANCE)return 'Keep the tree inside the city';
  if(Math.hypot(p.x-player.x,p.z-player.z)>PLANT_RANGE+1e-6)return 'Move closer to plant here';
  if(Math.hypot(p.x-player.x,p.z-player.z)<1.8)return 'Leave a little room for your explorer';
  if(isOnBridge(p.x,p.z))return 'Choose ground beside the bridge';
  // Check the full planting footprint against both banks, including the rounded end.
  for(const z of [p.z-TREE_CLEARANCE,p.z,p.z+TREE_CLEARANCE])
    if(isWater(p.x,z,TREE_CLEARANCE))return 'Trees need dry ground';
  if([...obstacles,...extraBlocked].some(o=>footprintDistance(p,o)<TREE_CLEARANCE))return 'This space is occupied';
  if(objects.some(o=>!o.destroyed&&o.kind==='tree'&&footprintDistance(p,o)<TREE_CLEARANCE))return 'Give nearby trees room to grow';
  return null;
}

export function bombPosition(start: {x:number;y:number;z:number}, end: {x:number;y:number;z:number}, progress: number) {
  const t=Math.max(0,Math.min(1,progress));
  return { x:start.x+(end.x-start.x)*t, y:start.y+(end.y-start.y)*t, z:start.z+(end.z-start.z)*t };
}
