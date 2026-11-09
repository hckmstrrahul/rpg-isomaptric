import { icon } from './icons.ts';

/** Keep the quiet in-page view available when native fullscreen is unsupported. */
export function installFullscreen(button:HTMLButtonElement,canvas:HTMLCanvasElement,beforeEnter:()=>void) {
  const root=document.documentElement;
  let active=false,pending=false;
  const setActive=(value:boolean)=>{
    if(active===value)return;
    active=value;
    root.classList.toggle('is-fullscreen',active);
    button.innerHTML=icon(active?'collapse':'expand',20);
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'Exit fullscreen':'Enter fullscreen');
    button.title=active?'Exit fullscreen (Esc)':'Enter fullscreen';
    (active?canvas:button).focus({preventScroll:true});
  };
  const exit=async()=>{
    if(pending||!active)return;
    pending=true;
    try {
      if(document.fullscreenElement===root)await document.exitFullscreen();
      setActive(false);
    } catch {
      // Keep the exit control available if the browser refuses the transition.
      setActive(document.fullscreenElement===root);
    } finally {pending=false;}
  };
  button.addEventListener('click',async()=>{
    if(pending)return;
    if(active){await exit();return;}
    pending=true;
    beforeEnter();setActive(true);
    try {
      if(document.fullscreenEnabled&&root.requestFullscreen)await root.requestFullscreen();
    } catch {
      // Embedded pages and some mobile browsers allow only the in-page view.
    } finally {pending=false;}
  });
  // Escape and browser-provided exit controls must restore the same HUD state.
  document.addEventListener('fullscreenchange',()=>setActive(document.fullscreenElement===root));
  return {get active(){return active;},exit};
}
