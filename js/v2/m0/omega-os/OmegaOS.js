export class OmegaOS {
    root;
    filesystem;
    events;
    onSaveRequested;
    onResetRequested;
    visible = false;
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
        this.root.querySelector("[data-os-close]")?.addEventListener("click", () => this.setVisible(false));
        this.root.querySelector("[data-os-save]")?.addEventListener("click", this.onSaveRequested);
        this.root.querySelector("[data-os-reset]")?.addEventListener("click", this.onResetRequested);
        this.root.querySelectorAll("[data-file-action]").forEach(button => {
            button.addEventListener("click", () => {
                const path = button.dataset.path ?? "";
                const action = button.dataset.fileAction;
                if (action === "delete")
                    this.filesystem.deleteFile(path);
                if (action === "restore")
                    this.filesystem.restoreFile(path);
            });
        });
    }
    destroy() {
        for (const unsubscribe of this.subscriptions.splice(0))
            unsubscribe();
    }
    renderEntry(entry) {
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
    escape(value) {
        return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
    }
}
