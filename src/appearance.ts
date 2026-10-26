export type Appearance = 'day' | 'night';
const storageKey = 'little-london-appearance';
type PreferenceStorage = Pick<Storage, 'getItem' | 'setItem'>;

/** Follow the OS until the player makes a choice; storage is optional. */
export function createAppearance(storage?: PreferenceStorage) {
  let preference: Appearance | null = null;
  try {
    const saved = storage?.getItem(storageKey);
    if (saved === 'day' || saved === 'night') preference = saved;
  } catch { /* Private browsing can disable storage. */ }
  const isNight = (systemNight: boolean) => preference ? preference === 'night' : systemNight;
  return {
    isNight,
    toggle(systemNight: boolean) {
      preference = isNight(systemNight) ? 'day' : 'night';
      try { storage?.setItem(storageKey, preference); } catch { /* Keep the session choice. */ }
      return preference;
    },
  };
}
