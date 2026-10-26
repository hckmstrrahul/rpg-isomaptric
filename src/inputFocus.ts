/** Gameplay keys do not opt into keyboard navigation or leave a canvas-wide ring. */
export function installInputFocus(doc:Document=document) {
  const root=doc.documentElement;
  const clear=()=>root.removeAttribute('data-keyboard-navigation');
  const keyboard=(event:KeyboardEvent)=>{
    if(event.key==='Tab')root.setAttribute('data-keyboard-navigation','');
    else if((event.target as HTMLElement|null)?.id==='scene')clear();
  };
  doc.addEventListener('pointerdown',clear,true);
  doc.addEventListener('keydown',keyboard,true);
  return ()=>{
    doc.removeEventListener('pointerdown',clear,true);
    doc.removeEventListener('keydown',keyboard,true);
  };
}
