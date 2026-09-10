import type { EventBus, Unsubscribe } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import type { FileSystemService, VirtualEntry } from "./FileSystemService.js";

export class OmegaOS {
  private visible = false;
  private readonly subscriptions: Unsubscribe[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly filesystem: FileSystemService,
    private readonly events: EventBus<GameEvents>,
    private readonly onSaveRequested: () => void,
    private readonly onResetRequested: () => void
  ) {
    this.subscriptions.push(events.on("filesystem:changed", () => this.render()));
    this.render();
  }

  isVisible(): boolean { return this.visible; }

  setVisible(visible: boolean): void {
    this.visible = visible;
    this.root.hidden = !visible;
    this.root.setAttribute("aria-hidden", String(!visible));
    this.events.emit("os:visibility", { visible });
  }

  toggle(): void { this.setVisible(!this.visible); }

  render(): void {
    const entries = this.filesystem.listDirectory("/memories", true);
    this.root.innerHTML = `
      <section class="m0-os-window" role="dialog" aria-label="OMEGA OS">
        <header class="m0-os-header">
          <div><strong>Ω OMEGA OS</strong><small>RECOVERY / M0</small></div>
          <button class="m0-icon-btn" type="button" data-os-close aria-label="Закрыть OMEGA OS">×</button>
        </header>
        <div class="m0-os-toolbar">
          <span>Explorer</span><code>/memories</code>
          <button type="button" data-os-save>Сохранить</button>
          <button type="button" data-os-reset>Сбросить M0</button>
        </div>
        <main class="m0-file-list">
          ${entries.map(entry => this.renderEntry(entry)).join("")}
        </main>
        <footer class="m0-os-status">Удаление файла должно немедленно менять объект в 3D.</footer>
      </section>`;

    this.root.querySelector<HTMLElement>("[data-os-close]")?.addEventListener("click", () => this.setVisible(false));
    this.root.querySelector<HTMLElement>("[data-os-save]")?.addEventListener("click", this.onSaveRequested);
    this.root.querySelector<HTMLElement>("[data-os-reset]")?.addEventListener("click", this.onResetRequested);
    this.root.querySelectorAll<HTMLElement>("[data-file-action]").forEach(button => {
      button.addEventListener("click", () => {
        const path = button.dataset.path ?? "";
        const action = button.dataset.fileAction;
        if (action === "delete") this.filesystem.deleteFile(path);
        if (action === "restore") this.filesystem.restoreFile(path);
      });
    });
  }

  destroy(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
  }

  private renderEntry(entry: VirtualEntry): string {
    const deleted = entry.deleted;
    return `<article class="m0-file ${deleted ? "is-deleted" : ""}">
      <div class="m0-file-icon">${deleted ? "□" : "▣"}</div>
      <div class="m0-file-copy">
        <strong>${this.escape(entry.label)}</strong>
        <code>${this.escape(entry.path)}</code>
        <small>${deleted ? "DELETED / recoverable" : "image / bound to apartment.photo_frame"}</small>
      </div>
      <button type="button" data-file-action="${deleted ? "restore" : "delete"}" data-path="${this.escape(entry.path)}">
        ${deleted ? "Восстановить" : "Удалить"}
      </button>
    </article>`;
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
  }
}
