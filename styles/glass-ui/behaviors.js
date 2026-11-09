/** Optional behavior for Smoked Glass. No framework or global initialization. */
const swaps = new WeakMap();
let tooltipCount = 0;

export function setGlassTheme(theme, root = document.documentElement) {
  if (theme !== 'light' && theme !== 'dark') throw new TypeError('Use light or dark.');
  const win = root.ownerDocument.defaultView;
  const previous = swaps.get(root);
  if (previous) win.cancelAnimationFrame(previous);
  root.setAttribute('data-glass-changing', '');
  root.dataset.glassTheme = theme;
  void root.offsetWidth;
  swaps.set(root, win.requestAnimationFrame(() => {
    swaps.set(root, win.requestAnimationFrame(() => {
      root.removeAttribute('data-glass-changing');
      swaps.delete(root);
    }));
  }));
}

/** Reflect actual overflow, and remove the fade when the final content is visible. */
export function observeGlassScroll(element) {
  const win = element.ownerDocument.defaultView;
  const update = () => { element.dataset.glassMore = String(element.scrollHeight - element.scrollTop - element.clientHeight > 2); };
  const resize = new win.ResizeObserver(update);
  const content = new win.MutationObserver(() => { watch(); update(); });
  const watch = () => { resize.disconnect(); resize.observe(element); for (const child of element.children) resize.observe(child); };
  watch(); content.observe(element, {childList: true, subtree: true, characterData: true});
  element.addEventListener('scroll', update, {passive: true});
  update();
  return () => { resize.disconnect(); content.disconnect(); element.removeEventListener('scroll', update); delete element.dataset.glassMore; };
}

/** Pointer + keyboard tooltips. Returns a cleanup function; preserves existing descriptions. */
export function installGlassTooltips(root = document) {
  const doc = root.nodeType === 9 ? root : root.ownerDocument;
  const win = doc.defaultView;
  const tooltip = doc.createElement('div');
  tooltip.id = `glass-tooltip-${++tooltipCount}`;
  tooltip.className = 'glass-tooltip glass'; tooltip.role = 'tooltip'; tooltip.hidden = true;
  doc.body.append(tooltip);
  const abort = new win.AbortController(), options = {signal: abort.signal};
  const titles = new Map();
  let anchor = null, describedBy = null, showTimer = 0, hideTimer = 0, keyboard = false;
  const hide = () => {
    win.clearTimeout(showTimer); win.clearTimeout(hideTimer); tooltip.hidden = true;
    if (anchor) {
      if (describedBy) anchor.setAttribute('aria-describedby', describedBy);
      else anchor.removeAttribute('aria-describedby');
    }
    anchor = null;
  };
  const label = control => {
    const title = control.getAttribute('title');
    if (title) { titles.set(control, title); control.dataset.tooltip = title; control.removeAttribute('title'); }
    return control.dataset.tooltip;
  };
  root.querySelectorAll('button[title],a[title]').forEach(label);
  const show = (control, delay) => {
    const text = label(control); if (!text || control.disabled) return;
    hide(); anchor = control; describedBy = control.getAttribute('aria-describedby');
    showTimer = win.setTimeout(() => {
      if (anchor !== control || !control.isConnected) return;
      const theme = control.closest('[data-glass-theme]')?.dataset.glassTheme;
      if (theme) tooltip.dataset.glassTheme = theme; else delete tooltip.dataset.glassTheme;
      tooltip.textContent = text; tooltip.hidden = false;
      const r = control.getBoundingClientRect(), box = tooltip.getBoundingClientRect();
      const side = control.closest('[data-tooltip-side]')?.dataset.tooltipSide;
      let left = side === 'right' ? r.right + 10 : r.left + (r.width - box.width) / 2;
      let top = side === 'right' ? r.top + (r.height - box.height) / 2 : r.top - box.height - 10;
      if (side === 'right' && left + box.width > win.innerWidth - 8) left = r.left - box.width - 10;
      if (top < 8) top = r.bottom + 10;
      left = Math.max(8, Math.min(left, win.innerWidth - box.width - 8));
      top = Math.max(8, Math.min(top, win.innerHeight - box.height - 8));
      tooltip.style.left = `${left}px`; tooltip.style.top = `${top}px`;
      control.setAttribute('aria-describedby', [describedBy, tooltip.id].filter(Boolean).join(' '));
    }, delay);
  };
  const controlFor = target => target instanceof win.Element ? target.closest('button[data-tooltip],a[data-tooltip],button[title],a[title]') : null;
  root.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const control = controlFor(event.target);
    if (control === anchor) win.clearTimeout(hideTimer);
    else if (control) show(control, 350);
  }, options);
  root.addEventListener('pointerout', event => {
    if (anchor?.contains(event.target) && !anchor.contains(event.relatedTarget)) hideTimer = win.setTimeout(hide, 120);
  }, options);
  tooltip.addEventListener('pointerenter', () => win.clearTimeout(hideTimer), options);
  tooltip.addEventListener('pointerleave', hide, options);
  root.addEventListener('focusin', event => {
    const control = controlFor(event.target);
    if (control && (keyboard || control.matches(':focus-visible'))) show(control, 0);
  }, options);
  root.addEventListener('focusout', hide, options);
  root.addEventListener('pointerdown', () => { keyboard = false; hide(); }, options);
  root.addEventListener('click', hide, options);
  root.addEventListener('keydown', event => {
    keyboard = true;
    if (event.key === 'Escape' && !tooltip.hidden) { hide(); event.preventDefault(); event.stopImmediatePropagation(); }
  }, {...options, capture: true});
  win.addEventListener('resize', hide, options);
  doc.addEventListener('scroll', hide, {...options, capture: true});
  return () => {
    hide(); abort.abort(); tooltip.remove();
    for (const [control, title] of titles) if (!control.hasAttribute('title')) control.title = control.dataset.tooltip || title;
  };
}
