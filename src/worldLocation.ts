export type WorldId = 'london' | 'dubai' | 'agra' | 'lisbon' | 'bengaluru' | 'moon';
export const WORLDS:{id:WorldId;name:string;district:string}[]=[
  {id:'london',name:'London',district:'The Thames embankment'},
  {id:'dubai',name:'Dubai',district:'Dubai waterfront'},
  {id:'bengaluru',name:'Bengaluru',district:'Cubbon Park civic district'},
  {id:'agra',name:'Agra',district:'Taj riverfront'},
  {id:'lisbon',name:'Lisbon',district:'Belém and the Tagus'},
  {id:'moon',name:'Moon Base',district:'Lunar habitat district'},
];
export function parseWorld(value: string | null | undefined): WorldId | null {
  return WORLDS.some(world=>world.id===value)?value as WorldId:null;
}
function initialWorld(): WorldId {
  if (typeof window === 'undefined') return 'london';
  const requested = parseWorld(new URL(window.location.href).searchParams.get('world'));
  if (requested) return requested;
  try { return parseWorld(window.localStorage.getItem('rpg-isomaptric-world')) ?? 'london'; }
  catch { return 'london'; }
}
export const WORLD_ID = initialWorld();
export const WORLD_NAME = WORLDS.find(world=>world.id===WORLD_ID)!.name;
export const WORLD_DISTRICT = WORLDS.find(world=>world.id===WORLD_ID)!.district;
export function worldUrl(id: WorldId, href: string) {
  const url = new URL(href); url.searchParams.set('world', id); url.hash = ''; return url.href;
}
