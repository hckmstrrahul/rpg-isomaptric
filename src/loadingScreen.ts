/** One loader for first paint, world construction, and document-to-document travel. */
export function createLoadingScreen(initial:HTMLElement) {
  const template=initial.cloneNode(true) as HTMLElement;
  let element=initial,animation:Animation|undefined,revision=0;
  async function fade(opacity:number) {
    const version=++revision,style=getComputedStyle(element),from=style.opacity;
    const duration=parseFloat(style.getPropertyValue('--loading-duration'));
    const easing=style.getPropertyValue('--loading-ease').trim();
    animation?.cancel();element.style.opacity=String(opacity);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animation=element.animate([{opacity:from},{opacity:String(opacity)}],{duration,easing});
      try{await animation.finished;}catch{/* A newer cover/reveal owns this surface. */}
    }
    if(version!==revision)return false;
    animation=undefined;return true;
  }
  return {
    async cover(message:string) {
      if(!element.isConnected){element=template.cloneNode(true) as HTMLElement;element.style.opacity='0';document.body.append(element);}
      element.querySelector('h2')!.textContent=message;
      // Keep the rotation phase consistent when the next document takes over.
      element.querySelector<HTMLElement>('.spinner')!.style.animationDelay=`-${Date.now()%1000}ms`;
      await fade(1);
    },
    async reveal() {
      const outgoing=element;
      if(await fade(0))outgoing.remove();
    },
  };
}
