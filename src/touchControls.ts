/** Each contact owns only its action: lifting Fire cannot cancel a held direction. */
export function createHeldPointers() {
  const pointers=new Map<number,string>();
  return {
    press:(id:number,action:string)=>pointers.set(id,action),
    release:(id:number)=>pointers.delete(id),
    has:(action:string)=>[...pointers.values()].includes(action),
    clear:()=>pointers.clear(),
  };
}

export function bindHoldButton(button:HTMLButtonElement,action:string,input:ReturnType<typeof createHeldPointers>,enabled:()=>boolean,start:()=>void,activate:()=>void) {
  const sync=()=>button.classList.toggle('is-held',input.has(action));
  button.addEventListener('pointerdown',event=>{
    if(event.button!==0||!enabled())return;
    event.preventDefault();button.setPointerCapture(event.pointerId);
    input.press(event.pointerId,action);sync();start();
  });
  for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,event=>{
    input.release((event as PointerEvent).pointerId);sync();
  });
  button.addEventListener('click',event=>{if(event.detail===0&&enabled())activate();});
}
