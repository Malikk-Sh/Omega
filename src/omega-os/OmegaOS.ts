import type { EventBus, Unsubscribe } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import type { FileSystemService, VirtualEntry } from "./FileSystemService.js";

export class OmegaOS {
  private visible = false;
  private previewPath: string | null = null;
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
    const preview = this.previewPath ? this.filesystem.readFile(this.previewPath) : null;
    this.root.innerHTML = `
      <section class="m0-os-window" role="dialog" aria-label="OMEGA OS">
        <header class="m0-os-header">
          <div><strong>Ω OMEGA OS</strong><small>MEMORY EXPLORER / HOME</small></div>
          <button class="m0-icon-btn" type="button" data-os-close aria-label="Закрыть OMEGA OS">×</button>
        </header>
        <div class="m0-os-toolbar">
          <span>Explorer</span><code>/memories</code>
          <button type="button" data-os-save>Сохранить</button>
          <button type="button" data-os-reset>Сбросить HOME</button>
        </div>
        <main class="m0-file-list">
          ${entries.map(entry => this.renderEntry(entry)).join("")}
        </main>
        ${preview ? `<aside class="m1-file-preview"><div><strong>${this.escape(preview.label)}</strong><code>${this.escape(preview.path)}</code></div><p>${this.escape(preview.content ?? "No readable content.")}</p><button type="button" data-preview-close>Закрыть</button></aside>` : ""}
        <footer class="m0-os-status">Файлы памяти напрямую связаны с объектами внутри HOME.</footer>
      </section>`;

    this.root.querySelector<HTMLElement>("[data-os-close]")?.addEventListener("click", () => this.setVisible(false));
    this.root.querySelector<HTMLElement>("[data-os-save]")?.addEventListener("click", this.onSaveRequested);
    this.root.querySelector<HTMLElement>("[data-os-reset]")?.addEventListener("click", this.onResetRequested);
    this.root.querySelector<HTMLElement>("[data-preview-close]")?.addEventListener("click", () => { this.previewPath = null; this.render(); });
    this.root.querySelectorAll<HTMLElement>("[data-file-action]").forEach(button => {
      button.addEventListener("click", () => {
        const path = button.dataset.path ?? "";
        const action = button.dataset.fileAction;
        if (action === "delete") this.filesystem.deleteFile(path);
        if (action === "restore") this.filesystem.restoreFile(path);
        if (action === "read") { this.previewPath = path; this.render(); }
      });
    });
  }

  destroy(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
  }

  private renderEntry(entry: VirtualEntry): string {
    const deleted = entry.deleted;
    const readable = entry.type === "file" && !deleted && !!entry.content;
    const mutable = entry.type === "file" && (entry.deletable !== false || (deleted && entry.restorable !== false));
    const action = deleted ? "restore" : readable && entry.deletable === false ? "read" : "delete";
    const label = deleted ? "Восстановить" : action === "read" ? "Открыть" : "Удалить";
    return `<article class="m0-file ${deleted ? "is-deleted" : ""}">
      <div class="m0-file-icon">${deleted ? "□" : entry.mime === "text/plain" ? "≡" : "▣"}</div>
      <div class="m0-file-copy">
        <strong>${this.escape(entry.label)}</strong>
        <code>${this.escape(entry.path)}</code>
        <small>${deleted ? "DELETED / recoverable" : this.escape(entry.mime ?? "file")}</small>
      </div>
      ${mutable || readable ? `<button type="button" data-file-action="${action}" data-path="${this.escape(entry.path)}">${label}</button>` : ""}
    </article>`;
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
  }
}
