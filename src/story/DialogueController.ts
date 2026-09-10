export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

const OPEN_INPUT_GUARD_MS = 180;

export class DialogueController {
  private queue: DialogueLine[] = [];
  private resolveCurrent: (() => void) | null = null;
  private active = false;
  private inputLockedUntil = 0;

  constructor(private readonly root: HTMLElement) {
    this.root.querySelector<HTMLElement>("[data-dialogue-next]")?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      this.advance();
    });
  }

  isActive(): boolean { return this.active; }

  play(lines: DialogueLine[]): Promise<void> {
    this.queue = [...lines];
    this.active = this.queue.length > 0;
    // The dialogue can be created while the pointer that opened it is still
    // finishing its gesture. Ignore that opening gesture for a short window so
    // it cannot also advance/skip the first line.
    this.inputLockedUntil = performance.now() + OPEN_INPUT_GUARD_MS;
    this.root.hidden = !this.active;
    this.root.setAttribute("aria-hidden", String(!this.active));
    this.renderCurrent();
    return new Promise<void>(resolve => { this.resolveCurrent = resolve; });
  }

  advance(): void {
    if (!this.active || performance.now() < this.inputLockedUntil) return;
    this.queue.shift();
    if (this.queue.length === 0) {
      this.active = false;
      this.root.hidden = true;
      this.root.setAttribute("aria-hidden", "true");
      const resolve = this.resolveCurrent;
      this.resolveCurrent = null;
      resolve?.();
      return;
    }
    this.renderCurrent();
  }

  private renderCurrent(): void {
    const line = this.queue[0];
    if (!line) return;
    const speaker = this.root.querySelector<HTMLElement>("[data-dialogue-speaker]");
    const text = this.root.querySelector<HTMLElement>("[data-dialogue-text]");
    const portrait = this.root.querySelector<HTMLImageElement>("[data-dialogue-portrait]");
    if (speaker) speaker.textContent = line.speaker;
    if (text) text.textContent = line.text;
    if (portrait) portrait.src = line.portrait ?? "../assets/v2/characters/vera/portraits/vera_neutral.svg";
  }
}
