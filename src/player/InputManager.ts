export interface MoveVector { x: number; y: number; }
export interface LookDelta { dx: number; dy: number; }

export class InputManager {
  readonly move: MoveVector = { x: 0, y: 0 };
  private pendingLook: LookDelta = { dx: 0, dy: 0 };
  private readonly keys = new Set<string>();
  private actionHandlers = new Map<string, Set<() => void>>();
  private cleanup: Array<() => void> = [];

  attach(root: Document | HTMLElement = document): void {
    const keydown = (event: KeyboardEvent) => {
      this.keys.add(event.code);
      this.recomputeKeyboardMove();
      if (!event.repeat) {
        if (event.code === "KeyE") this.emitAction("interact");
        if (event.code === "Tab") { event.preventDefault(); this.emitAction("os"); }
        if (event.code === "Escape") this.emitAction("pause");
      }
    };
    const keyup = (event: KeyboardEvent) => {
      this.keys.delete(event.code);
      this.recomputeKeyboardMove();
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    this.cleanup.push(() => window.removeEventListener("keydown", keydown));
    this.cleanup.push(() => window.removeEventListener("keyup", keyup));

    const movePad = root.querySelector<HTMLElement>("[data-m0-move]");
    const moveKnob = movePad?.querySelector<HTMLElement>("[data-m0-move-knob]") ?? null;
    if (movePad) this.bindMovePad(movePad, moveKnob);

    const lookPad = root.querySelector<HTMLElement>("[data-m0-look]");
    if (lookPad) this.bindLookPad(lookPad);

    root.querySelectorAll<HTMLElement>("[data-m0-action]").forEach(button => {
      // Fire discrete UI actions only after the gesture has completed. Using
      // pointerdown here allowed a newly-opened overlay (for example dialogue)
      // to receive the tail end / synthetic click from the same physical tap.
      const handler = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        this.emitAction(button.dataset.m0Action ?? "");
      };
      button.addEventListener("click", handler);
      this.cleanup.push(() => button.removeEventListener("click", handler));
    });
  }

  onAction(action: string, handler: () => void): () => void {
    const bucket = this.actionHandlers.get(action) ?? new Set<() => void>();
    bucket.add(handler);
    this.actionHandlers.set(action, bucket);
    return () => bucket.delete(handler);
  }

  consumeLookDelta(): LookDelta {
    const value = { ...this.pendingLook };
    this.pendingLook.dx = 0;
    this.pendingLook.dy = 0;
    return value;
  }

  destroy(): void {
    for (const fn of this.cleanup.splice(0)) fn();
    this.actionHandlers.clear();
  }

  private emitAction(action: string): void {
    if (!action) return;
    for (const handler of this.actionHandlers.get(action) ?? []) handler();
  }

  private recomputeKeyboardMove(): void {
    const x = Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) - Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft"));
    const y = Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) - Number(this.keys.has("KeyW") || this.keys.has("ArrowUp"));
    const len = Math.hypot(x, y) || 1;
    this.move.x = x / len;
    this.move.y = y / len;
  }

  private bindMovePad(pad: HTMLElement, knob: HTMLElement | null): void {
    let pointerId: number | null = null;
    const update = (event: PointerEvent) => {
      const rect = pad.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let x = (event.clientX - cx) / (rect.width * 0.33);
      let y = (event.clientY - cy) / (rect.height * 0.33);
      const len = Math.hypot(x, y) || 1;
      if (len > 1) { x /= len; y /= len; }
      this.move.x = x;
      this.move.y = y;
      if (knob) knob.style.transform = `translate(calc(-50% + ${x * 28}px), calc(-50% + ${y * 28}px))`;
    };
    const down = (event: PointerEvent) => {
      if (pointerId !== null) return;
      pointerId = event.pointerId;
      pad.setPointerCapture(pointerId);
      update(event);
    };
    const move = (event: PointerEvent) => { if (event.pointerId === pointerId) update(event); };
    const end = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return;
      pointerId = null;
      this.move.x = 0; this.move.y = 0;
      if (knob) knob.style.transform = "translate(-50%, -50%)";
    };
    pad.addEventListener("pointerdown", down);
    pad.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);
    this.cleanup.push(() => { pad.removeEventListener("pointerdown", down); pad.removeEventListener("pointermove", move); pad.removeEventListener("pointerup", end); pad.removeEventListener("pointercancel", end); });
  }

  private bindLookPad(pad: HTMLElement): void {
    const points = new Map<number, { x: number; y: number }>();
    const down = (event: PointerEvent) => {
      pad.setPointerCapture(event.pointerId);
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };
    const move = (event: PointerEvent) => {
      const previous = points.get(event.pointerId);
      if (!previous) return;
      this.pendingLook.dx += event.clientX - previous.x;
      this.pendingLook.dy += event.clientY - previous.y;
      points.set(event.pointerId, { x: event.clientX, y: event.clientY });
    };
    const end = (event: PointerEvent) => points.delete(event.pointerId);
    pad.addEventListener("pointerdown", down);
    pad.addEventListener("pointermove", move);
    pad.addEventListener("pointerup", end);
    pad.addEventListener("pointercancel", end);
    this.cleanup.push(() => { pad.removeEventListener("pointerdown", down); pad.removeEventListener("pointermove", move); pad.removeEventListener("pointerup", end); pad.removeEventListener("pointercancel", end); });
  }
}
