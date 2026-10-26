import { insideTerrain } from './boundary.ts';

// Coordinates are composed from the supplied illustration, not a geographic map.
export const SIZE = 216;
export const HALF = SIZE / 2;
export const GROUND = 1.35;
export const WATER_HEIGHT = -1.2;
export const PLAYER_SPAWN = {x:0,z:8};
export const ROAD_HEIGHT = GROUND + .07;
export const BRIDGE_LIFT = .4;
export const BRIDGE_HEIGHT = ROAD_HEIGHT + BRIDGE_LIFT;
export const BRIDGES = [-51, 8, 48];
export const RIVER_END = HALF;
export const riverCenter = (z: number) => {
  const t = Math.max(0, Math.min(1, (z - 35) / 70));
  return 4 + 13 * Math.sin((z + 55) / 32) - 6 * Math.sin(z / 67) + 40 * t * t * (3 - 2 * t);
};
export const riverWidth = (z: number) => 28 + 3.5 * Math.sin(z / 28);
export const bank = (z: number, side: number, margin = 0) => riverCenter(z) + side * (riverWidth(z) / 2 + margin);
export type Obstacle = { x: number; z: number; w: number; d: number };
export type Landmark = { id: string; name: string; short: string; x: number; z: number; height: number; visitX: number; visitZ: number; description: string };
export const LANDMARKS: Landmark[] = [
  { id: 'westminster', name: 'Palace of Westminster', short: 'Westminster', x: -44, z: 16, height: 22, visitX: -20, visitZ: 9, description: 'Honey-coloured stone, Gothic spires, and a clock that watches over the river.' },
  { id: 'eye', name: 'The London Eye', short: 'London Eye', x: -55, z: -68, height: 44, visitX: -46, visitZ: -60, description: 'A slow-turning wheel above the gardens. Take a little time to watch the city go by.' },
  { id: 'tower', name: 'Tower Bridge', short: 'Tower Bridge', x: riverCenter(48), z: 48, height: 23, visitX: riverCenter(48), visitZ: 48, description: 'Twin stone towers and blue suspension cables, with the whole river beneath your feet.' },
  { id: 'gherkin', name: 'The Gherkin', short: 'The Gherkin', x: 76, z: -34, height: 44, visitX: 66, visitZ: -26, description: 'A glass landmark wrapped in a spiralling lattice, rising above the eastern bank.' },
  { id: 'gardens', name: 'Riverside Gardens', short: 'Riverside Gardens', x: 55, z: 78, height: 2, visitX: 55, visitZ: 83, description: 'Concentric paths, clipped lawns, and a quiet pocket of green at the river’s edge.' },
  { id: 'abbey', name: 'Riverside Abbey', short: 'Riverside Abbey', x: 61, z: 26, height: 26, visitX: 44, visitZ: 26, description: 'Warm brick towers, pointed windows, and peaceful courtyards inspired by the reference.' },
  { id: 'dome', name: 'The Green Dome', short: 'Green Dome', x: -24, z: -28, height: 10, visitX: -27, visitZ: -8, description: 'A broad green dome with fine silver ribs, nestled in the curve of the river.' },
  { id: 'spire', name: 'The Garden Spire', short: 'Garden Spire', x: -85, z: -37, height: 28, visitX: -80, visitZ: -32, description: 'A slender copper-coloured tower tucked among the western gardens.' },
];

export function isOnBridge(x: number, z: number): boolean {
  return BRIDGES.some(bz => Math.abs(z - bz) < 3.4 && Math.abs(x - riverCenter(bz)) < riverWidth(bz) / 2 + 4.2);
}

export function surfaceHeight(x:number,z:number) {
  return Math.abs(z)<=HALF&&Math.abs(x-riverCenter(z))<riverWidth(z)/2&&!isOnBridge(x,z)?WATER_HEIGHT:GROUND+bridgeLiftAt(x,z);
}

export function bridgeLiftAt(x:number,z:number) {
  const bz=BRIDGES.find(b=>Math.abs(z-b)<3.4);if(bz===undefined)return 0;
  return BRIDGE_LIFT*Math.max(0,Math.min(1,(riverWidth(bz)/2+4.2-Math.abs(x-riverCenter(bz)))/4.2));
}

export function canWalk(x: number, z: number, obstacles: Obstacle[], radius = 0.46): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(z)) return false;
  if (Math.abs(x) > HALF - 2 || Math.abs(z) > HALF - 2 || !insideTerrain(x,z,radius)) return false;
  if (z < RIVER_END && Math.abs(x - riverCenter(z)) < riverWidth(z) / 2 + 0.5 && !isOnBridge(x, z)) return false;
  return !obstacles.some(b => Math.abs(x - b.x) < b.w / 2 + radius && Math.abs(z - b.z) < b.d / 2 + radius);
}

export type TeleportDestination = { valid: true; position: { x: number; y: number; z: number } } | { valid: false; reason: string };

/** Exact, unrestricted-distance travel using the same live collision map as walking. */
export function resolveTeleport(x: number, z: number, obstacles: Obstacle[]): TeleportDestination {
  if (!Number.isFinite(x) || !Number.isFinite(z) || Math.abs(x) > HALF - 2 || Math.abs(z) > HALF - 2)
    return { valid: false, reason: 'Choose a destination inside the city.' };
  if (z < RIVER_END && Math.abs(x - riverCenter(z)) < riverWidth(z) / 2 + .5 && !isOnBridge(x, z))
    return { valid: false, reason: 'Water is blocked. Choose land or a bridge.' };
  if (!canWalk(x, z, obstacles))
    return { valid: false, reason: 'That spot is occupied. Choose open ground.' };
  return { valid: true, position: { x, y: GROUND + bridgeLiftAt(x,z) + .13, z } };
}

export function walkStep(x: number, z: number, dx: number, dz: number, obstacles: Obstacle[]) {
  // Axis sliding keeps the character moving smoothly along walls and river edges.
  const steps = Math.max(1, Math.ceil(Math.hypot(dx, dz) / 0.25));
  for (let i = 0; i < steps; i++) {
    if (canWalk(x + dx / steps, z, obstacles)) x += dx / steps;
    if (canWalk(x, z + dz / steps, obstacles)) z += dz / steps;
  }
  return { x, z };
}
