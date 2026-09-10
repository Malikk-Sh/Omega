export class OmegaOS {
  visible = false;
  previewPath = null;
  subscriptions = [];
  constructor(root, filesystem, events, onSaveRequested, onResetRequested) {
    this.root = root;
    this.filesystem = filesystem;
    this.events = events;
    this.onSaveRequested = onSaveRequested;
    this.onResetRequested = onResetRequested;
    this.subscriptions.push(events.on("filesystem:changed", () => this.render()));
    this.render();
  }
  isVisible() { return this.visible; }
  setVisible(visible) {
    this.visible = visible;
    this.root.hidden = !visible;
    this.root.setAttribute("aria-hidden", String(!visible));
    this.events.emit("os:visibility", { visible });
  }
  toggle() { this.setVisible(!this.visible); }
  render() {
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
        <main class="m0-file-list">${entries.map(entry => this.renderEntry(entry)).join("")}</main>
        ${preview ? `<aside class="m1-file-preview"><div><strong>${this.escape(preview.label)}</strong><code>${this.escape(preview.path)}</code></div><p>${this.escape(preview.content ?? "No readable content.")}</p><button type="button" data-preview-close>Закрыть</button></aside>` : ""}
        <footer class="m0-os-status">Файлы памяти напрямую связаны с объектами внутри HOME.</footer>
      </section>`;
    this.root.querySelector("[data-os-close]")?.addEventListener("click", () => this.setVisible(false));
    this.root.querySelector("[data-os-save]")?.addEventListener("click", this.onSaveRequested);
    this.root.querySelector("[data-os-reset]")?.addEventListener("click", this.onResetRequested);
    this.root.querySelector("[data-preview-close]")?.addEventListener("click", () => { this.previewPath = null; this.render(); });
    this.root.querySelectorAll("[data-file-action]").forEach(button => {
      button.addEventListener("click", () => {
        const path = button.dataset.path ?? "";
        const action = button.dataset.fileAction;
        if (action === "delete") this.filesystem.deleteFile(path);
        if (action === "restore") this.filesystem.restoreFile(path);
        if (action === "read") { this.previewPath = path; this.render(); }
      });
    });
  }
  destroy() { for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe(); }
  renderEntry(entry) {
    const deleted = entry.deleted;
    const readable = entry.type === "file" && !deleted && !!entry.content;
    const mutable = entry.type === "file" && (entry.deletable !== false || (deleted && entry.restorable !== false));
    const action = deleted ? "restore" : readable && entry.deletable === false ? "read" : "delete";
    const label = deleted ? "Восстановить" : action === "read" ? "Открыть" : "Удалить";
    return `<article class="m0-file ${deleted ? "is-deleted" : ""}">
      <div class="m0-file-icon">${deleted ? "□" : entry.mime === "text/plain" ? "≡" : "▣"}</div>
      <div class="m0-file-copy"><strong>${this.escape(entry.label)}</strong><code>${this.escape(entry.path)}</code><small>${deleted ? "DELETED / recoverable" : this.escape(entry.mime ?? "file")}</small></div>
      ${mutable || readable ? `<button type="button" data-file-action="${action}" data-path="${this.escape(entry.path)}">${label}</button>` : ""}
    </article>`;
  }
  escape(value) { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char)); }
}
