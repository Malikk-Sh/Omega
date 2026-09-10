export interface DialogueLine {
  speaker: string;
  text: string;
  portrait?: string;
}

export interface DialogueChoiceOption {
  id: string;
  label: string;
  variant?: "normal" | "danger" | "quiet";
}

const OPEN_INPUT_GUARD_MS = 180;

export class DialogueController {
  private queue: DialogueLine[] = [];
  private resolveCurrent: (() => void) | null = null;
  private resolveChoice: ((choiceId: string) => void) | null = null;
  private active = false;
  private choosing = false;
  private inputLockedUntil = 0;

  constructor(private readonly root: HTMLElement) {
    this.root.querySelector<HTMLElement>("[data-dialogue-next]")?.addEventListener("click", event => {
      event.preventDefault();
      event.stopPropagation();
      this.advance();
    });
  }

  isActive(): boolean { return this.active; }
  isChoosing(): boolean { return this.choosing; }

  play(lines: DialogueLine[]): Promise<void> {
    if (lines.length === 0) return Promise.resolve();
    this.queue = [...lines];
    this.active = true;
    this.choosing = false;
    this.inputLockedUntil = performance.now() + OPEN_INPUT_GUARD_MS;
    this.root.dataset.dialogueMode = "linear";
    this.showRoot();
    this.setChoiceUI([]);
    this.setNextVisible(true);
    this.setHintVisible(true);
    this.renderCurrent();
    return new Promise<void>(resolve => { this.resolveCurrent = resolve; });
  }

  choose(line: DialogueLine, options: DialogueChoiceOption[]): Promise<string> {
    if (options.length === 0) return Promise.reject(new Error("Dialogue choice requires at least one option."));
    this.queue = [line];
    this.active = true;
    this.choosing = true;
    this.inputLockedUntil = performance.now() + OPEN_INPUT_GUARD_MS;
    this.root.dataset.dialogueMode = "choice";
    this.showRoot();
    this.setNextVisible(false);
    this.setHintVisible(false);
    this.renderCurrent();
    this.setChoiceUI(options);
    return new Promise<string>(resolve => { this.resolveChoice = resolve; });
  }

  advance(): void {
    if (!this.active || this.choosing || performance.now() < this.inputLockedUntil) return;
    this.queue.shift();
    if (this.queue.length === 0) {
      this.finishLinear();
      return;
    }
    this.renderCurrent();
  }

  private finishLinear(): void {
    this.active = false;
    this.choosing = false;
    this.hideRoot();
    const resolve = this.resolveCurrent;
    this.resolveCurrent = null;
    resolve?.();
  }

  private finishChoice(choiceId: string): void {
    this.active = false;
    this.choosing = false;
    this.hideRoot();
    this.setChoiceUI([]);
    const resolve = this.resolveChoice;
    this.resolveChoice = null;
    resolve?.(choiceId);
  }

  private setChoiceUI(options: DialogueChoiceOption[]): void {
    const container = this.root.querySelector<HTMLElement>("[data-dialogue-choices]");
    if (!container) return;
    container.replaceChildren();
    container.hidden = options.length === 0;
    for (const option of options) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "m2-dialogue-choice";
      button.dataset.choiceVariant = option.variant ?? "normal";
      button.textContent = option.label;
      button.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (!this.choosing || performance.now() < this.inputLockedUntil) return;
        this.finishChoice(option.id);
      });
      container.append(button);
    }
  }

  private setNextVisible(visible: boolean): void {
    const next = this.root.querySelector<HTMLElement>("[data-dialogue-next]");
    if (next) next.hidden = !visible;
  }

  private setHintVisible(visible: boolean): void {
    const hint = this.root.querySelector<HTMLElement>("[data-dialogue-hint]");
    if (hint) hint.hidden = !visible;
  }

  private showRoot(): void {
    this.root.hidden = false;
    this.root.setAttribute("aria-hidden", "false");
  }

  private hideRoot(): void {
    this.root.hidden = true;
    this.root.setAttribute("aria-hidden", "true");
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
