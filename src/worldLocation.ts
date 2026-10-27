export type WorldId = 'london' | 'dubai';
export function parseWorld(value: string | null | undefined): WorldId | null {
  return value === 'london' || value === 'dubai' ? value : null;
}
function initialWorld(): WorldId {
  if (typeof window === 'undefined') return 'london';
  const requested = parseWorld(new URL(window.location.href).searchParams.get('world'));
  if (requested) return requested;
  try { return parseWorld(window.localStorage.getItem('rpg-isomaptric-world')) ?? 'london'; }
  catch { return 'london'; }
}
export const WORLD_ID = initialWorld();
export const WORLD_NAME = WORLD_ID === 'dubai' ? 'Dubai' : 'London';
export const WORLD_DISTRICT = WORLD_ID === 'dubai' ? 'Dubai waterfront' : 'The Thames embankment';
export function worldUrl(id: WorldId, href: string) {
  const url = new URL(href); url.searchParams.set('world', id); url.hash = ''; return url.href;
}
