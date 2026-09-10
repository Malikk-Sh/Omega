export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

export class DialogueController {
  private queue: DialogueLine[] = [];
  private resolveCurrent: (() => void) | null = null;
  private active = false;

  constructor(private readonly root: HTMLElement) {
    this.root.querySelector<HTMLElement>("[data-dialogue-next]")?.addEventListener("click", () => this.advance());
  }

  isActive(): boolean { return this.active; }

  play(lines: DialogueLine[]): Promise<void> {
    this.queue = [...lines];
    this.active = this.queue.length > 0;
    this.root.hidden = !this.active;
    this.root.setAttribute("aria-hidden", String(!this.active));
    this.renderCurrent();
    return new Promise<void>(resolve => { this.resolveCurrent = resolve; });
  }

  advance(): void {
    if (!this.active) return;
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
