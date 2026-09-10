export class DialogueController {
  queue = [];
  resolveCurrent = null;
  active = false;
  constructor(root) {
    this.root = root;
    this.root.querySelector("[data-dialogue-next]")?.addEventListener("click", () => this.advance());
  }
  isActive() { return this.active; }
  play(lines) {
    this.queue = [...lines];
    this.active = this.queue.length > 0;
    this.root.hidden = !this.active;
    this.root.setAttribute("aria-hidden", String(!this.active));
    this.renderCurrent();
    return new Promise(resolve => { this.resolveCurrent = resolve; });
  }
  advance() {
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
  renderCurrent() {
    const line = this.queue[0];
    if (!line) return;
    const speaker = this.root.querySelector("[data-dialogue-speaker]");
    const text = this.root.querySelector("[data-dialogue-text]");
    const portrait = this.root.querySelector("[data-dialogue-portrait]");
    if (speaker) speaker.textContent = line.speaker;
    if (text) text.textContent = line.text;
    if (portrait) portrait.src = line.portrait ?? "../assets/v2/characters/vera/portraits/vera_neutral.svg";
  }
}
