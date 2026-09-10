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
    const portraitSrc = portrait || `${this.assetRoot}/assets/v2/characters/vera/portraits/vera_neutral.svg`;
    const img = el('img', 'omega-dialogue__portrait', { alt: '', src: portraitSrc });
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

  createDesktop({ apps = [], status = {} } = {}) {
    const desktop = el('section', 'omega-desktop');
    const grid = el('div', 'omega-desktop__grid');
    apps.forEach(app => {
      const button = el('button', 'omega-app-icon', { type: 'button' });
      button.dataset.appId = app.id ?? '';
      const icon = el('img', 'omega-app-icon__image', { alt: '', src: app.icon ?? `${this.assetRoot}/assets/v2/ui/icons/app_file.svg` });
      button.append(icon, el('span', 'omega-app-icon__label', { text: app.label ?? app.id ?? 'App' }));
      if (app.onOpen) button.addEventListener('click', app.onOpen);
      grid.append(button);
    });
    const taskbar = el('nav', 'omega-taskbar', { 'aria-label': 'OMEGA taskbar' });
    const home = el('button', 'omega-icon-button', { type: 'button', 'aria-label': 'OMEGA' });
    home.innerHTML = `<img class="omega-icon" src="${this.assetRoot}/assets/v2/ui/icons/omega_symbol.svg" alt="">`;
    taskbar.append(home, el('div', 'omega-taskbar__spacer'));
    const statusEl = el('div', 'omega-status');
    statusEl.append(el('span', '', { text: status.network ?? 'LOCAL' }), el('span', '', { text: status.integrity ?? 'SYS 37%' }), el('time', '', { text: status.time ?? '--:--' }));
    taskbar.append(statusEl);
    desktop.append(grid, taskbar);
    return { desktop, grid, taskbar, home, status: statusEl };
  }

  createExplorer({ path = '/', files = [], onOpen, onAction } = {}) {
    const root = el('div', 'omega-explorer');
    const sidebar = el('aside', 'omega-explorer__sidebar');
    ['/home', '/memories', '/system', '/quarantine'].forEach(item => {
      const button = el('button', 'omega-nav-item', { type: 'button', text: item });
      button.addEventListener('click', () => onAction?.('navigate', { path: item }));
      sidebar.append(button);
    });
    const main = el('section', 'omega-explorer__main');
    const toolbar = el('div', 'omega-explorer__toolbar');
    toolbar.append(el('button', 'omega-icon-button', { type: 'button', 'aria-label': 'Back' }), el('code', 'omega-breadcrumb', { text: path }));
    toolbar.firstElementChild.innerHTML = `<img class="omega-icon" src="${this.assetRoot}/assets/v2/ui/glyphs/back.svg" alt="">`;
    toolbar.firstElementChild.addEventListener('click', () => onAction?.('back', { path }));
    const grid = el('div', 'omega-file-grid');
    files.forEach(file => {
      const button = el('button', 'omega-file', { type: 'button' });
      button.dataset.fileId = file.id ?? file.name ?? '';
      button.dataset.state = file.state ?? 'normal';
      const iconName = file.kind === 'folder' ? 'app_folder' : file.kind === 'image' ? 'app_image' : file.kind === 'memory' ? 'app_memory' : 'app_file';
      const image = el('img', 'omega-file__icon', { alt: '', src: file.icon ?? `${this.assetRoot}/assets/v2/ui/icons/${iconName}.svg` });
      button.append(image, el('span', 'omega-file__name', { text: file.label ?? file.name ?? file.id ?? 'file' }));
      button.addEventListener('click', () => onOpen?.(file));
      button.addEventListener('contextmenu', e => { e.preventDefault(); onAction?.('context', file); });
      grid.append(button);
    });
    main.append(toolbar, grid);
    root.append(sidebar, main);
    return { explorer: root, grid, sidebar, toolbar };
  }

  createTaskManager({ processes = [], onAction } = {}) {
    const root = el('div', 'omega-process-list');
    const header = el('div', 'omega-process omega-process--header');
    ['PROCESS', 'CPU', 'MEM', ''].forEach(text => header.append(el('span', '', { text })));
    root.append(header);
    processes.forEach(proc => {
      const row = el('div', 'omega-process');
      row.dataset.anomaly = String(Boolean(proc.anomaly));
      row.dataset.processId = proc.id ?? '';
      row.append(el('strong', '', { text: proc.name ?? proc.id ?? 'unknown' }), el('span', '', { text: proc.cpu ?? '0%' }), el('span', '', { text: proc.memory ?? '—' }));
      const action = el('button', 'omega-icon-button', { type: 'button', 'aria-label': 'Process actions' });
      action.innerHTML = `<img class="omega-icon" src="${this.assetRoot}/assets/v2/ui/glyphs/more.svg" alt="">`;
      action.addEventListener('click', () => onAction?.('menu', proc));
      row.append(action);
      root.append(row);
    });
    return root;
  }

  createEvidenceInspector({ src, alt = '', title = '', metadata = [], hotspots = [], onHotspot } = {}) {
    const root = el('section', 'omega-evidence');
    root.setAttribute('aria-label', title || 'Evidence');
    const viewport = el('div', 'omega-evidence__viewport');
    const stage = el('div', 'omega-evidence__stage');
    const image = el('img', 'omega-evidence__image', { src, alt, draggable: false });
    stage.append(image);
    hotspots.forEach(hotspot => {
      const button = el('button', 'omega-evidence__hotspot', { type: 'button', 'aria-label': hotspot.label ?? 'Inspect clue' });
      button.style.left = `${hotspot.x ?? 50}%`;
      button.style.top = `${hotspot.y ?? 50}%`;
      button.addEventListener('click', () => onHotspot?.(hotspot));
      stage.append(button);
    });
    viewport.append(stage);
    const info = el('aside', 'omega-evidence__info');
    info.append(el('h3', 'omega-evidence__title', { text: title }));
    metadata.forEach(([key, value]) => {
      const row = el('div', 'omega-meta-row');
      row.append(el('span', '', { text: key }), el('code', '', { text: value }));
      info.append(row);
    });
    root.append(viewport, info);

    let scale = 1, tx = 0, ty = 0, lastTap = 0;
    const pointers = new Map();
    const apply = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${scale})`; };
    const reset = () => { scale = 1; tx = 0; ty = 0; apply(); };
    viewport.addEventListener('pointerdown', e => {
      viewport.setPointerCapture(e.pointerId);
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const now = performance.now();
      if (now - lastTap < 300 && pointers.size === 1) { scale = scale > 1 ? 1 : 2; if (scale === 1) { tx = 0; ty = 0; } apply(); }
      lastTap = now;
    });
    viewport.addEventListener('pointermove', e => {
      const prev = pointers.get(e.pointerId); if (!prev) return;
      const before = [...pointers.values()];
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1 && scale > 1) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; apply(); }
      if (pointers.size === 2) {
        const after = [...pointers.values()];
        const b = Math.hypot(before[0].x - before[1].x, before[0].y - before[1].y) || 1;
        const a = Math.hypot(after[0].x - after[1].x, after[0].y - after[1].y) || 1;
        scale = Math.max(1, Math.min(4, scale * (a / b))); apply();
      }
    });
    const release = e => pointers.delete(e.pointerId);
    viewport.addEventListener('pointerup', release); viewport.addEventListener('pointercancel', release);
    return { inspector: root, viewport, stage, image, reset };
  }

  createBootScreen({ phase = 'boot', title = 'OMEGA', message = 'RECOVERY ENVIRONMENT', progress = 0, actions = [] } = {}) {
    const root = el('section', 'omega-boot');
    root.dataset.phase = phase;
    const logo = el('div', 'omega-boot__logo', { text: title });
    const subtitle = el('div', 'omega-boot__subtitle', { text: message });
    const log = el('pre', 'omega-boot__log', { text: '> checking memory\n> mounting recovery volume\n> waiting for user' });
    const meter = el('div', 'omega-progress'); meter.style.setProperty('--progress', `${Math.max(0, Math.min(100, progress))}%`); meter.append(el('span'));
    const actionWrap = el('div', 'omega-boot__actions');
    actions.forEach(action => {
      const button = el('button', 'omega-button', { type: 'button', text: action.label ?? action.id ?? 'Continue' });
      if (action.tone) button.dataset.tone = action.tone;
      button.addEventListener('click', () => action.onSelect?.(action.id));
      actionWrap.append(button);
    });
    root.append(logo, subtitle, log, meter, actionWrap);
    return { boot: root, log, meter };
  }

  createModal({ title = 'OMEGA', body = '', actions = [] } = {}) {
    const layer = el('div', 'omega-modal-layer');
    const modal = el('section', 'omega-panel omega-modal');
    modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true'); modal.setAttribute('aria-label', title);
    modal.append(el('h2', 'omega-modal__title', { text: title }));
    const content = el('div', 'omega-modal__body');
    if (body instanceof Node) content.append(body); else content.textContent = body;
    modal.append(content);
    const footer = el('div', 'omega-modal__actions');
    actions.forEach(action => {
      const button = el('button', 'omega-button', { type: 'button', text: action.label ?? action.id ?? 'OK' });
      if (action.tone) button.dataset.tone = action.tone;
      button.addEventListener('click', () => action.onSelect?.(action.id, layer));
      footer.append(button);
    });
    modal.append(footer); layer.append(modal); return { layer, modal };
  }

  createSaveSlots({ slots = [], onSelect } = {}) {
    const grid = el('div', 'omega-save-grid');
    slots.forEach(slot => {
      const button = el('button', 'omega-save-slot', { type: 'button' });
      button.dataset.slotId = slot.id ?? '';
      button.append(el('strong', '', { text: slot.title ?? `SLOT ${slot.id ?? ''}` }), el('div', 'omega-save-slot__meta', { text: slot.meta ?? 'Empty' }));
      button.addEventListener('click', () => onSelect?.(slot));
      grid.append(button);
    });
    return grid;
  }

  createSettings({ settings = [], onChange } = {}) {
    const root = el('div', 'omega-settings');
    settings.forEach(setting => {
      const row = el('label', 'omega-setting-row');
      const copy = el('span'); copy.append(el('strong', '', { text: setting.label ?? setting.id }), setting.description ? el('small', '', { text: setting.description }) : document.createTextNode(''));
      let control;
      if (setting.type === 'toggle') {
        control = el('input', 'omega-toggle', { type: 'checkbox', checked: Boolean(setting.value) });
        control.addEventListener('change', () => onChange?.(setting.id, control.checked));
      } else {
        control = el('input', 'omega-range', { type: 'range', min: setting.min ?? 0, max: setting.max ?? 100, value: setting.value ?? 50 });
        control.addEventListener('input', () => onChange?.(setting.id, Number(control.value)));
      }
      row.append(copy, control); root.append(row);
    });
    return root;
  }

  createChapterCard({ index = '', title = '', subtitle = '' } = {}) {
    const root = el('section', 'omega-chapter-card');
    root.append(el('div', 'omega-chapter-card__index', { text: index }), el('h1', 'omega-chapter-card__title', { text: title }), el('p', 'omega-chapter-card__subtitle', { text: subtitle }));
    return root;
  }

  createCoreDecision({ title = 'OMEGA CORE', description = '', protocols = [], onSelect } = {}) {
    const root = el('section', 'omega-core-decision');
    root.append(el('div', 'omega-core-decision__mark', { text: 'Ω' }), el('h1', '', { text: title }), el('p', '', { text: description }));
    const list = el('div', 'omega-core-decision__protocols');
    protocols.forEach(protocol => {
      const button = el('button', 'omega-core-protocol', { type: 'button' });
      button.dataset.tone = protocol.tone ?? 'default';
      button.append(el('code', '', { text: protocol.id }), el('span', '', { text: protocol.label ?? protocol.id }));
      button.addEventListener('click', () => onSelect?.(protocol)); list.append(button);
    });
    root.append(list); return root;
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
