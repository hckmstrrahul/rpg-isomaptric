import {installGlassTooltips,observeGlassScroll,setGlassTheme} from './behaviors.js';

installGlassTooltips();
observeGlassScroll(document.querySelector('#scroll-demo'));
for(const swatch of document.querySelectorAll('[data-token]')) {
  swatch.querySelector('code').textContent=getComputedStyle(swatch).getPropertyValue(`--glass-${swatch.dataset.token}`).trim();
}
for(const group of document.querySelectorAll('.hero-controls,.hero-rail [aria-label$="camera specimen"]')) {
  group.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    for(const item of group.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));
  });
}
const lab=document.querySelector('#lab'),theme=document.querySelector('#theme-toggle');
theme.addEventListener('click',()=>{
  const dark=lab.dataset.glassTheme!=='dark';setGlassTheme(dark?'dark':'light',lab);
  theme.querySelector('span').textContent=dark?'Dark':'Light';
  theme.querySelector('use').setAttribute('href',dark?'#i-moon':'#i-sun');
  theme.setAttribute('aria-label',`Switch specimen to ${dark?'light':'dark'}`);
});
const help=document.querySelector('#help-toggle'),panel=document.querySelector('#lab-help');
const setHelp=open=>{
  panel.hidden=!open;help.setAttribute('aria-expanded',String(open));
  help.setAttribute('aria-label',open?'Close controls':'Open controls');help.dataset.tooltip=open?'Close controls':'Open controls';
  help.querySelector('use').setAttribute('href',open?'#i-close':'#i-help');
};
help.addEventListener('click',()=>setHelp(panel.hidden));
lab.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){setHelp(false);help.focus();}});
document.querySelector('#copy-setup').addEventListener('click',async()=>{
  const code=document.querySelector('#setup-code'),status=document.querySelector('#copy-status');
  try {await navigator.clipboard.writeText(code.textContent);status.textContent='Copied. Keep the folder’s relative paths together.';}
  catch {const range=document.createRange();range.selectNodeContents(code);const selection=getSelection();selection.removeAllRanges();selection.addRange(range);status.textContent='Code selected. Press ⌘C or Ctrl+C to copy.';}
});
