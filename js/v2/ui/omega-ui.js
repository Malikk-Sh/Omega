const q = (sel, root = document) => root.querySelector(sel);
const el = (tag, className, attrs = {}) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null) continue;
    if (key === 'text') node.textContent = value;
    else if (key.startsWith('aria-')) node.setAttribute(key, value);
    else node[key] = value;
  }
  return node;
};

export class OmegaUI {
  constructor(root = document.body, assetRoot = '') {
    this.root = root;
    this.assetRoot = assetRoot.replace(/\/$/, '');
    this.root.classList.add('omega-ui');
    this.toastStack = q('.omega-toast-stack', root) || this.#createToastStack();
  }

  #createToastStack() {
    const stack = el('div', 'omega-toast-stack');
    stack.setAttribute('aria-live', 'polite');
    this.root.append(stack);
    return stack;
  }

  createWindow({ id, title, content, tone = 'default', active = true, mobileMode = 'maximized' }) {
    const win = el('section', 'omega-window');
    if (id) win.id = id;
    win.dataset.active = String(active);
    win.dataset.tone = tone;
    win.dataset.mobileMode = mobileMode;
    win.setAttribute('role', 'dialog');
    win.setAttribute('aria-label', title || 'OMEGA window');

    const header = el('header', 'omega-window__header');
    const titleEl = el('div', 'omega-window__title', { text: title || 'OMEGA' });
    const close = el('button', 'omega-icon-button', { type: 'button', 'aria-label': 'Close' });
    close.innerHTML = `<img class="omega-icon" src="${this.assetRoot}/assets/v2/ui/glyphs/close.svg" alt="">`;
    close.addEventListener('click', () => win.remove());
    header.append(titleEl, close);

    const body = el('div', 'omega-window__body');
    if (content instanceof Node) body.append(content);
    else body.innerHTML = content ?? '';
    win.append(header, body);
    return win;
  }

  showToast(message, { tone = 'info', timeout = 3600 } = {}) {
    const toast = el('div', 'omega-toast');
    toast.dataset.tone = tone;
    toast.setAttribute('role', tone === 'danger' ? 'alert' : 'status');
    const icon = el('img', 'omega-icon', { alt: '', src: `${this.assetRoot}/assets/v2/ui/glyphs/${tone === 'danger' ? 'warning' : 'info'}.svg` });
    const text = el('div', '', { text: message });
    const close = el('button', 'omega-icon-button', { type: 'button', 'aria-label': 'Dismiss' });
    close.innerHTML = `<img class="omega-icon" src="${this.assetRoot}/assets/v2/ui/glyphs/close.svg" alt="">`;
    close.addEventListener('click', () => toast.remove());
    toast.append(icon, text, close);
    this.toastStack.append(toast);
    if (timeout > 0) setTimeout(() => toast.remove(), timeout);
    return toast;
  }

  createDialogue({ speaker = 'V.E.R.A.', text = '', portrait = null, choices = [] } = {}) {
    const box = el('section', 'omega-dialogue');
    box.setAttribute('aria-label', 'Dialogue');
    const portraitSrc = portrait || `${this.assetRoot}/assets/v2/characters/vera/portraits/vera_neutral.webp`;
    const img = el('img', 'omega-dialogue__portrait', { alt: '', src: portraitSrc });
    img.addEventListener('error', () => { img.src = `${this.assetRoot}/assets/v2/characters/vera/portraits/vera_neutral.svg`; }, { once: true });
    const content = el('div');
    content.append(el('div', 'omega-dialogue__speaker', { text: speaker }), el('p', 'omega-dialogue__text', { text }));
    const choiceWrap = el('div', 'omega-dialogue__choices');
    choices.forEach((choice, index) => {
      const button = el('button', 'omega-choice', { type: 'button', text: choice.label ?? String(choice) });
      button.dataset.choice = choice.id ?? String(index);
      choiceWrap.append(button);
    });
    box.append(img, content);
    if (choices.length) box.append(choiceWrap);
    return box;
  }

  createTerminal({ lines = ['OMEGA OS', "Type 'help' for commands."] } = {}) {
    const terminal = el('div', 'omega-terminal');
    const output = el('pre', 'omega-terminal__output', { text: lines.join('\n') });
    const prompt = el('label', 'omega-terminal__prompt');
    prompt.append(el('span', 'omega-terminal__cursor', { text: '>' }));
    const input = el('input', 'omega-terminal__input', { type: 'text', autocomplete: 'off', spellcheck: false, enterKeyHint: 'send' });
    prompt.append(input);
    terminal.append(output, prompt);
    return { terminal, output, input };
  }

  mountTouchControls({ onMove, onLook, onAction } = {}) {
    const root = el('div', 'omega-touch');
    const move = el('div', 'omega-touch__move');
    const knob = el('div', 'omega-touch__knob');
    move.append(knob);
    const look = el('div', 'omega-touch__look');
    const actions = el('div', 'omega-touch__actions');
    ['interact', 'run', 'crouch', 'os', 'terminal'].forEach(name => {
      const btn = el('button', 'omega-touch-button', { type: 'button', 'aria-label': name });
      btn.dataset.action = name;
      btn.addEventListener('pointerdown', e => { e.preventDefault(); onAction?.(name, true); });
      btn.addEventListener('pointerup', e => { e.preventDefault(); onAction?.(name, false); });
      btn.addEventListener('pointercancel', () => onAction?.(name, false));
      actions.append(btn);
    });
    const pause = el('button', 'omega-touch-button omega-touch__pause', { type: 'button', 'aria-label': 'pause' });
    pause.dataset.action = 'pause';
    pause.addEventListener('click', () => onAction?.('pause', true));

    let movePointer = null;
    const updateMove = e => {
      const r = move.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = (e.clientX - cx) / (r.width * .32), dy = (e.clientY - cy) / (r.height * .32);
      const len = Math.hypot(dx, dy) || 1;
      if (len > 1) { dx /= len; dy /= len; }
      knob.style.transform = `translate(calc(-50% + ${dx * 24}px), calc(-50% + ${dy * 24}px))`;
      onMove?.({ x: dx, y: dy });
    };
    move.addEventListener('pointerdown', e => { movePointer = e.pointerId; move.setPointerCapture(e.pointerId); updateMove(e); });
    move.addEventListener('pointermove', e => { if (e.pointerId === movePointer) updateMove(e); });
    const resetMove = e => { if (movePointer !== e.pointerId) return; movePointer = null; knob.style.transform = 'translate(-50%,-50%)'; onMove?.({ x: 0, y: 0 }); };
    move.addEventListener('pointerup', resetMove); move.addEventListener('pointercancel', resetMove);

    const lookPointers = new Map();
    look.addEventListener('pointerdown', e => { look.setPointerCapture(e.pointerId); lookPointers.set(e.pointerId, { x:e.clientX, y:e.clientY }); });
    look.addEventListener('pointermove', e => {
      const prev = lookPointers.get(e.pointerId); if (!prev) return;
      const dx = e.clientX - prev.x, dy = e.clientY - prev.y;
      lookPointers.set(e.pointerId, { x:e.clientX, y:e.clientY }); onLook?.({ dx, dy });
    });
    const clearLook = e => lookPointers.delete(e.pointerId);
    look.addEventListener('pointerup', clearLook); look.addEventListener('pointercancel', clearLook);

    root.append(move, look, actions, pause);
    this.root.append(root);
    return root;
  }
}
