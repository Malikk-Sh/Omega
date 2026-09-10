import type { EventBus, Unsubscribe } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import type { FileSystemService, VirtualEntry } from "./FileSystemService.js";

export interface RecoveryResponse {
  ok: boolean;
  message: string;
  path?: string;
}

export interface OmegaOSCallbacks {
  onSaveRequested: () => void;
  onResetRequested: () => void;
  onEvidenceInspected?: (path: string) => void;
  onFileRead?: (path: string) => void;
  onRecoveryRequested?: (key: string) => RecoveryResponse;
}

type PreviewMode = "text" | "evidence";

export class OmegaOS {
  private visible = false;
  private previewPath: string | null = null;
  private previewMode: PreviewMode = "text";
  private currentDirectory = "/memories";
  private recoveryMessage = "";
  private readonly subscriptions: Unsubscribe[] = [];

  constructor(
    private readonly root: HTMLElement,
    private readonly filesystem: FileSystemService,
    private readonly events: EventBus<GameEvents>,
    private readonly callbacks: OmegaOSCallbacks
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
    const entries = this.filesystem.listDirectory(this.currentDirectory, true);
    const preview = this.previewPath ? this.filesystem.readFile(this.previewPath) : null;
    this.root.innerHTML = `
      <section class="m0-os-window m2-os-window" role="dialog" aria-label="OMEGA OS">
        <header class="m0-os-header">
          <div><strong>Ω OMEGA OS</strong><small>INVESTIGATION WORKSPACE / HOME</small></div>
          <button class="m0-icon-btn" type="button" data-os-close aria-label="Закрыть OMEGA OS">×</button>
        </header>

        <nav class="m2-os-nav" aria-label="OMEGA directories">
          ${this.renderDirectoryButton("/memories", "MEMORY")}
          ${this.renderDirectoryButton("/system/logs", "SYSTEM LOGS")}
        </nav>

        <div class="m0-os-toolbar m2-os-toolbar">
          <span>Explorer</span><code>${this.escape(this.currentDirectory)}</code>
          <div class="m2-toolbar-actions">
            <button type="button" data-os-save>Сохранить</button>
            <button type="button" data-os-reset>Сбросить HOME</button>
          </div>
        </div>

        <main class="m0-file-list m2-file-list">
          ${entries.length ? entries.map(entry => this.renderEntry(entry)).join("") : `<div class="m2-empty-directory"><strong>NO INDEXED FILES</strong><span>В этом разделе пока нет доступных записей.</span></div>`}
        </main>

        ${preview ? this.renderPreview(preview) : ""}

        <section class="m2-recovery" aria-label="Recovery console">
          <header><div><strong>RECOVERY CONSOLE</strong><small>COLD INDEX / MANUAL SIGNATURE</small></div><span>ΩRC</span></header>
          <p>Повреждённые записи можно адресовать короткой recovery signature. Консоль принимает 4 символа.</p>
          <form data-recovery-form>
            <input data-recovery-key inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Recovery signature" placeholder="••••">
            <button type="submit">RECOVER</button>
          </form>
          <output class="m2-recovery-output" data-recovery-output>${this.escape(this.recoveryMessage || "WAITING FOR SIGNATURE")}</output>
        </section>

        <footer class="m0-os-status">HOME отражает состояние индексированных файлов. Не все изменения обратимы.</footer>
      </section>`;

    this.root.querySelector<HTMLElement>("[data-os-close]")?.addEventListener("click", () => this.setVisible(false));
    this.root.querySelector<HTMLElement>("[data-os-save]")?.addEventListener("click", this.callbacks.onSaveRequested);
    this.root.querySelector<HTMLElement>("[data-os-reset]")?.addEventListener("click", this.callbacks.onResetRequested);
    this.root.querySelector<HTMLElement>("[data-preview-close]")?.addEventListener("click", () => { this.previewPath = null; this.render(); });

    this.root.querySelectorAll<HTMLElement>("[data-os-directory]").forEach(button => {
      button.addEventListener("click", () => {
        this.currentDirectory = button.dataset.osDirectory ?? "/memories";
        this.previewPath = null;
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLElement>("[data-file-action]").forEach(button => {
      button.addEventListener("click", () => {
        const path = button.dataset.path ?? "";
        const action = button.dataset.fileAction;
        if (action === "delete") this.filesystem.deleteFile(path);
        if (action === "restore") this.filesystem.restoreFile(path);
        if (action === "read") {
          this.previewPath = path;
          this.previewMode = "text";
          this.callbacks.onFileRead?.(path);
          this.render();
        }
        if (action === "inspect") {
          this.previewPath = path;
          this.previewMode = "evidence";
          this.callbacks.onEvidenceInspected?.(path);
          this.render();
        }
      });
    });

    this.root.querySelector<HTMLFormElement>("[data-recovery-form]")?.addEventListener("submit", event => {
      event.preventDefault();
      const input = this.root.querySelector<HTMLInputElement>("[data-recovery-key]");
      const key = input?.value ?? "";
      const result = this.callbacks.onRecoveryRequested?.(key) ?? { ok: false, message: "RECOVERY SERVICE OFFLINE" };
      this.recoveryMessage = result.message;
      if (result.ok) {
        this.currentDirectory = "/system/logs";
        this.previewPath = null;
      }
      this.render();
    });
  }

  destroy(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
  }

  private renderDirectoryButton(path: string, label: string): string {
    return `<button type="button" data-os-directory="${this.escape(path)}" class="${this.currentDirectory === path ? "is-active" : ""}">${this.escape(label)}</button>`;
  }

  private renderEntry(entry: VirtualEntry): string {
    const deleted = entry.deleted;
    const readable = entry.type === "file" && !deleted && !!entry.content;
    const actions: string[] = [];
    if (!deleted && entry.inspectable) actions.push(this.actionButton("inspect", entry.path, "Анализ"));
    if (readable) actions.push(this.actionButton("read", entry.path, "Открыть"));
    if (!deleted && entry.type === "file" && entry.deletable !== false) actions.push(this.actionButton("delete", entry.path, "Удалить"));
    if (deleted && entry.type === "file" && entry.restorable !== false) actions.push(this.actionButton("restore", entry.path, "Восстановить"));

    return `<article class="m0-file m2-file ${deleted ? "is-deleted" : ""}">
      <div class="m0-file-icon">${deleted ? "□" : entry.mime === "text/plain" || entry.mime?.includes("log") ? "≡" : "▣"}</div>
      <div class="m0-file-copy">
        <strong>${this.escape(entry.label)}</strong>
        <code>${this.escape(entry.path)}</code>
        <small>${deleted ? "DELETED / recoverable" : entry.inspectable ? "EVIDENCE / metadata available" : this.escape(entry.mime ?? "file")}</small>
      </div>
      ${actions.length ? `<div class="m2-file-actions">${actions.join("")}</div>` : ""}
    </article>`;
  }

  private actionButton(action: string, path: string, label: string): string {
    return `<button type="button" data-file-action="${action}" data-path="${this.escape(path)}">${this.escape(label)}</button>`;
  }

  private renderPreview(entry: VirtualEntry): string {
    if (this.previewMode === "evidence" && entry.inspectable) return this.renderEvidencePreview(entry);
    return `<aside class="m1-file-preview m2-text-preview">
      <div><strong>${this.escape(entry.label)}</strong><code>${this.escape(entry.path)}</code></div>
      <pre>${this.escape(entry.content ?? "No readable content.")}</pre>
      <button type="button" data-preview-close>Закрыть</button>
    </aside>`;
  }

  private renderEvidencePreview(entry: VirtualEntry): string {
    const metadata = Object.entries(entry.metadata ?? {});
    return `<aside class="m2-evidence-preview">
      <header><div><strong>EVIDENCE INSPECTOR</strong><code>${this.escape(entry.path)}</code></div><button type="button" data-preview-close aria-label="Закрыть анализ">×</button></header>
      <div class="m2-evidence-body">
        <figure>${entry.artwork ? `<img src="${this.escape(entry.artwork)}" alt="${this.escape(entry.label)}">` : `<div class="m2-evidence-placeholder">NO VISUAL BUFFER</div>`}<figcaption>${this.escape(entry.label)}</figcaption></figure>
        <div class="m2-metadata">
          ${metadata.map(([key, value]) => `<div><span>${this.escape(key)}</span><code>${this.escape(value)}</code></div>`).join("")}
          <p class="m2-evidence-clue">Cold recovery принимает дату исходного захвата в формате <strong>DDMM</strong>. Сопоставь её с метаданными.</p>
        </div>
      </div>
    </aside>`;
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
  }
}
