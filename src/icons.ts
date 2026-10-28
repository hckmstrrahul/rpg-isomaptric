import CubeIcon from '@hugeicons/core-free-icons/CubeIcon';
import MapIcon from '@hugeicons/core-free-icons/MapIcon';
import ArrowRight02Icon from '@hugeicons/core-free-icons/ArrowRight02Icon';
import Add01Icon from '@hugeicons/core-free-icons/Add01Icon';
import MinusSignIcon from '@hugeicons/core-free-icons/MinusSignIcon';
import City01Icon from '@hugeicons/core-free-icons/City01Icon';
import HelpCircleIcon from '@hugeicons/core-free-icons/HelpCircleIcon';
import Location01Icon from '@hugeicons/core-free-icons/Location01Icon';
import FullScreenIcon from '@hugeicons/core-free-icons/FullScreenIcon';
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon';
import Mouse01Icon from '@hugeicons/core-free-icons/Mouse01Icon';
import WalkingIcon from '@hugeicons/core-free-icons/WalkingIcon';
import Flag01Icon from '@hugeicons/core-free-icons/Flag01Icon';
import Tick02Icon from '@hugeicons/core-free-icons/Tick02Icon';
import GunIcon from '@hugeicons/core-free-icons/GunIcon';
import PineTreeIcon from '@hugeicons/core-free-icons/PineTreeIcon';
import User03Icon from '@hugeicons/core-free-icons/User03Icon';
import Building06Icon from '@hugeicons/core-free-icons/Building06Icon';
import Sun03Icon from '@hugeicons/core-free-icons/Sun03Icon';
import Moon02Icon from '@hugeicons/core-free-icons/Moon02Icon';
import ArrowUp02Icon from '@hugeicons/core-free-icons/ArrowUp02Icon';
import ArrowLeft02Icon from '@hugeicons/core-free-icons/ArrowLeft02Icon';
import ArrowDown02Icon from '@hugeicons/core-free-icons/ArrowDown02Icon';

// The free Hugeicons set uses Stroke Rounded throughout.
// A navigation compass with cardinal marks, distinct from a stopwatch or drafting tool.
const compass:typeof CubeIcon=[
  ['circle',{cx:'12',cy:'12',r:'9'}],
  ['path',{d:'M12 3v2M12 19v2M3 12h2M19 12h2'}],
  ['path',{d:'m15.5 8.5-2 5-5 2 2-5z'}],
  ['path',{d:'m15.5 8.5-5 2 3 3z',fill:'currentColor',stroke:'none'}],
];
const icons = {
  cube: CubeIcon, map: MapIcon, arrow: ArrowRight02Icon, plus: Add01Icon,
  minus: MinusSignIcon, compass,
  home: City01Icon, help: HelpCircleIcon, pin: Location01Icon,
  expand: FullScreenIcon, close: Cancel01Icon, mouse: Mouse01Icon,
  walk: WalkingIcon, flag: Flag01Icon, check: Tick02Icon, gun: GunIcon,
  tree: PineTreeIcon, hero: User03Icon, city: Building06Icon,
  sun: Sun03Icon, moon: Moon02Icon, up: ArrowUp02Icon,
  left: ArrowLeft02Icon, down: ArrowDown02Icon, right: ArrowRight02Icon,
};
const escape = (value: unknown) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
export function icon(name: keyof typeof icons, size = 17) {
  const content = icons[name].map(([tag, attrs]) => {
    const attributes = Object.entries(attrs).filter(([key]) => key !== 'key').map(([key, value]) =>
      `${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}="${escape(value)}"`).join(' ');
    return `<${tag} ${attributes}/>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${content}</svg>`;
}
