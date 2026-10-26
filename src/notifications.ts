import { createElement, type CSSProperties } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import { Toaster, toast } from 'sonner';

/** A single Sonner root; the Three.js app continues to own its existing DOM. */
export function mountNotifications() {
  const host=document.createElement('div');host.id='notifications';document.body.append(host);
  const root=createRoot(host);
  const render=(night:boolean)=>root.render(createElement(Toaster,{
    theme:night?'dark':'light',position:'top-center',closeButton:true,visibleToasts:3,gap:10,
    offset:{top:'var(--top)'},mobileOffset:{top:'var(--top)'},
    containerAriaLabel:'City notifications',
    style:{'--normal-bg':'var(--surface)','--normal-text':'var(--ink)','--normal-border':'var(--line)','--border-radius':'12px'} as CSSProperties,
    toastOptions:{closeButtonAriaLabel:'Dismiss notification',style:{fontFamily:'inherit',fontSize:'12px',boxShadow:'var(--shadow)'}},
  }));
  // Subscribe before exposing show(), including errors raised during city startup.
  flushSync(()=>render(document.documentElement.dataset.theme==='night'));
  const themeObserver=new MutationObserver(()=>render(document.documentElement.dataset.theme==='night'));
  themeObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  return {
    show(message:string,persistent:boolean,onDismiss:()=>void){
      const options={id:'city-feedback',duration:persistent?Infinity:4500,onDismiss,onAutoClose:onDismiss};
      if(persistent)toast.error(message,options);else toast(message,options);
    },
    dismiss(){toast.dismiss('city-feedback');},
    dispose(){themeObserver.disconnect();toast.dismiss('city-feedback');root.unmount();host.remove();},
  };
}
