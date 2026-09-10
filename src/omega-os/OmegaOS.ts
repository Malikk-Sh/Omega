import type { EventBus, Unsubscribe } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import type { FileSystemService, VirtualEntry } from "./FileSystemService.js";

export interface RecoveryResponse { ok: boolean; message: string; path?: string; }
export interface ProcessMonitorState {
  unlocked: boolean;
  channelOpen: boolean;
  routeAttempts: number;
  message?: string;
}
export interface Backup03MonitorState {
  active: boolean;
  samplesSeen: number;
  totalSamples: number;
  solved: boolean;
  attempts: number;
  message?: string;
}
export interface Backup10MonitorState {
  active: boolean;
  puzzleSolved: boolean;
  sourceRead: boolean;
  clueRead: boolean;
}
export interface Backup26MonitorState {
  active: boolean;
  evidenceSeen: number;
  totalEvidence: number;
  logsRead: number;
  totalLogs: number;
  commandOrder: string[];
  orderSolved: boolean;
  auditSolved: boolean;
  attempts: number;
  commands: Array<{ id: string; label: string }>;
  records: Array<{ id: string; label: string }>;
  message?: string;
}
export interface Backup41MonitorState {
  active: boolean;
  evidenceSeen: number;
  totalEvidence: number;
  logsRead: number;
  totalLogs: number;
  assignments: Record<string, string>;
  solved: boolean;
  attempts: number;
  evidence: Array<{ id: string; label: string }>;
  message?: string;
}
export interface OmegaOSCallbacks {
  onSaveRequested: () => void;
  onResetRequested: () => void;
  onEvidenceInspected?: (path: string) => void;
  onFileRead?: (path: string) => void;
  onRecoveryRequested?: (key: string) => RecoveryResponse;
  getProcessMonitorState?: () => ProcessMonitorState;
  onProcessRouteRequested?: (route: string) => RecoveryResponse;
  getBackup03State?: () => Backup03MonitorState;
  onBackupClassificationRequested?: (classification: string) => RecoveryResponse;
  getBackup10State?: () => Backup10MonitorState;
  getBackup26State?: () => Backup26MonitorState;
  onBackup26CommandRequested?: (commandId: string) => RecoveryResponse;
  onBackup26ResetOrderRequested?: () => RecoveryResponse;
  onBackup26RecordRequested?: (recordId: string) => RecoveryResponse;
  getBackup41State?: () => Backup41MonitorState;
  onBackup41SourceRequested?: (evidenceId: string, source: string) => RecoveryResponse;
  onBackup41ResetRequested?: () => RecoveryResponse;
}

type PreviewMode = "text" | "evidence";
type WorkspaceMode = "home" | "backup03" | "backup10" | "backup26" | "backup41";

const BACKUP_03_ROOT = "/backups/vera_0_3";
const BACKUP_03_TRAINING = `${BACKUP_03_ROOT}/training`;
const BACKUP_03_ARCHIVE = `${BACKUP_03_ROOT}/archive`;
const BACKUP_10_ROOT = "/backups/vera_1_0";
const BACKUP_10_SOURCE = `${BACKUP_10_ROOT}/source`;
const BACKUP_10_AUDIT = `${BACKUP_10_ROOT}/audit`;
const BACKUP_26_ROOT = "/backups/vera_2_6";
const BACKUP_26_AUDIT = `${BACKUP_26_ROOT}/audit`;
const BACKUP_26_RESULT = `${BACKUP_26_ROOT}/result`;
const BACKUP_41_ROOT = "/backups/vera_4_1";
const BACKUP_41_EVIDENCE = `${BACKUP_41_ROOT}/evidence`;
const BACKUP_41_RESULT = `${BACKUP_41_ROOT}/result`;

export class OmegaOS {
  private visible = false;
  private previewPath: string | null = null;
  private previewMode: PreviewMode = "text";
  private currentDirectory = "/memories";
  private recoveryMessage = "";
  private processMessage = "";
  private backupMessage = "";
  private rollbackMessage = "";
  private incidentMessage = "";
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
    if (visible) this.render();
    this.root.hidden = !visible;
    this.root.setAttribute("aria-hidden", String(!visible));
    this.events.emit("os:visibility", { visible });
  }

  openDirectory(path: string): void {
    this.currentDirectory = path;
    this.previewPath = null;
    this.setVisible(true);
  }

  toggle(): void { this.setVisible(!this.visible); }

  render(): void {
    const processState = this.callbacks.getProcessMonitorState?.() ?? { unlocked: false, channelOpen: false, routeAttempts: 0 };
    const backup03 = this.callbacks.getBackup03State?.() ?? { active: false, samplesSeen: 0, totalSamples: 3, solved: false, attempts: 0 };
    const backup10 = this.callbacks.getBackup10State?.() ?? { active: false, puzzleSolved: false, sourceRead: false, clueRead: false };
    const backup26 = this.callbacks.getBackup26State?.() ?? {
      active: false,
      evidenceSeen: 0,
      totalEvidence: 3,
      logsRead: 0,
      totalLogs: 3,
      commandOrder: [],
      orderSolved: false,
      auditSolved: false,
      attempts: 0,
      commands: [],
      records: []
    };
    const backup41 = this.callbacks.getBackup41State?.() ?? {
      active: false, evidenceSeen: 0, totalEvidence: 3, logsRead: 0, totalLogs: 6, assignments: {}, solved: false, attempts: 0, evidence: []
    };
    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : backup26.active ? "backup26" : backup41.active ? "backup41" : "home";
    const in03Path = this.currentDirectory.startsWith(BACKUP_03_ROOT);
    const in10Path = this.currentDirectory.startsWith(BACKUP_10_ROOT);
    const in26Path = this.currentDirectory.startsWith(BACKUP_26_ROOT);
    const in41Path = this.currentDirectory.startsWith(BACKUP_41_ROOT);
    const inAnyBackupPath = in03Path || in10Path || in26Path || in41Path;

    if (mode === "backup03" && !in03Path) this.currentDirectory = BACKUP_03_TRAINING;
    if (mode === "backup10" && !in10Path) this.currentDirectory = BACKUP_10_SOURCE;
    if (mode === "backup26" && !in26Path) this.currentDirectory = BACKUP_26_AUDIT;
    if (mode === "backup41" && !in41Path) this.currentDirectory = BACKUP_41_EVIDENCE;
    if (mode === "home" && inAnyBackupPath) this.currentDirectory = "/memories";
    if (mode === "backup03" && (in10Path || in26Path || in41Path)) this.currentDirectory = BACKUP_03_TRAINING;
    if (mode === "backup10" && (in03Path || in26Path || in41Path)) this.currentDirectory = BACKUP_10_SOURCE;
    if (mode === "backup26" && (in03Path || in10Path || in41Path)) this.currentDirectory = BACKUP_26_AUDIT;
    if (mode === "backup41" && (in03Path || in10Path || in26Path)) this.currentDirectory = BACKUP_41_EVIDENCE;
    if (this.currentDirectory === "/system/processes" && !processState.unlocked) this.currentDirectory = "/system/logs";
    if (this.currentDirectory === BACKUP_10_AUDIT && !backup10.puzzleSolved) this.currentDirectory = BACKUP_10_SOURCE;
    if (this.currentDirectory === BACKUP_26_RESULT && !backup26.auditSolved) this.currentDirectory = BACKUP_26_AUDIT;
    if (this.currentDirectory === BACKUP_41_RESULT && !backup41.solved) this.currentDirectory = BACKUP_41_EVIDENCE;

    const entries = this.filesystem.listDirectory(this.currentDirectory, true);
    const preview = this.previewPath ? this.filesystem.readFile(this.previewPath) : null;
    const inProcessMonitor = mode === "home" && this.currentDirectory === "/system/processes";
    const inBackupTraining = mode === "backup03" && this.currentDirectory === BACKUP_03_TRAINING;
    const inRollbackAudit = mode === "backup26" && this.currentDirectory === BACKUP_26_AUDIT;
    const inIncidentAudit = mode === "backup41" && this.currentDirectory === BACKUP_41_EVIDENCE;
    const workspace = mode === "backup03"
      ? "BACKUP MANAGER / VERA_0_3"
      : mode === "backup10"
        ? "RECONSTRUCTION VIEW / VERA_1_0"
        : mode === "backup26"
          ? "ROLLBACK AUDIT / VERA_2_6"
          : mode === "backup41"
            ? "INCIDENT RECONSTRUCTION / VERA_4_1"
            : "INVESTIGATION WORKSPACE / HOME";

    this.root.innerHTML = `
      <section class="m0-os-window m2-os-window m3-os-window ${mode !== "home" ? "m4-os-window" : ""}" role="dialog" aria-label="OMEGA OS">
        <header class="m0-os-header">
          <div><strong>Ω OMEGA OS</strong><small>${workspace}</small></div>
          <button class="m0-icon-btn" type="button" data-os-close aria-label="Закрыть OMEGA OS">×</button>
        </header>
        <nav class="m2-os-nav" aria-label="OMEGA directories">
          ${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : mode === "backup26" ? this.backup26Navigation(backup26) : mode === "backup41" ? this.backup41Navigation(backup41) : this.homeNavigation(processState)}
        </nav>
        <div class="m0-os-toolbar m2-os-toolbar">
          <span>${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : inRollbackAudit ? "Rollback Audit" : inIncidentAudit ? "Incident Reconstruction" : mode === "backup10" ? "Reconstruction Explorer" : mode === "backup26" ? "Audit Result" : mode === "backup41" ? "Incident Result" : "Explorer"}</span><code>${this.escape(this.currentDirectory)}</code>
          <div class="m2-toolbar-actions"><button type="button" data-os-save>Сохранить</button><button type="button" data-os-reset>${mode === "home" ? "Сбросить HOME" : "Сбросить игру"}</button></div>
        </div>
        ${inProcessMonitor ? this.processMonitor(processState, entries) : this.fileList(entries)}
        ${preview ? this.preview(preview) : ""}
        ${inBackupTraining ? this.backupClassifier(backup03) : ""}
        ${inRollbackAudit ? this.rollbackAudit(backup26) : ""}
        ${inIncidentAudit ? this.incidentReconstruction(backup41) : ""}
        ${mode === "home" && !inProcessMonitor ? this.recoveryConsole() : ""}
        <footer class="m0-os-status">${this.footerText(mode, inProcessMonitor, backup10, backup26, backup41)}</footer>
      </section>`;
    this.bindEvents();
  }

  destroy(): void { for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe(); }

  private bindEvents(): void {
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
      const key = this.root.querySelector<HTMLInputElement>("[data-recovery-key]")?.value ?? "";
      const result = this.callbacks.onRecoveryRequested?.(key) ?? { ok: false, message: "RECOVERY SERVICE OFFLINE" };
      this.recoveryMessage = result.message;
      if (result.ok) { this.currentDirectory = "/system/logs"; this.previewPath = null; }
      this.render();
    });

    this.root.querySelectorAll<HTMLElement>("[data-process-route]").forEach(button => {
      button.addEventListener("click", () => {
        const result = this.callbacks.onProcessRouteRequested?.(button.dataset.processRoute ?? "") ?? { ok: false, message: "PROCESS ROUTER OFFLINE" };
        this.processMessage = result.message;
        this.previewPath = null;
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLElement>("[data-backup-classification]").forEach(button => {
      button.addEventListener("click", () => {
        const result = this.callbacks.onBackupClassificationRequested?.(button.dataset.backupClassification ?? "") ?? { ok: false, message: "CLASSIFIER OFFLINE" };
        this.backupMessage = result.message;
        this.previewPath = null;
        if (result.ok) this.currentDirectory = BACKUP_03_ARCHIVE;
        this.render();
      });
    });

    this.root.querySelectorAll<HTMLElement>("[data-v26-command]").forEach(button => {
      button.addEventListener("click", () => {
        const result = this.callbacks.onBackup26CommandRequested?.(button.dataset.v26Command ?? "") ?? { ok: false, message: "ROLLBACK AUDIT OFFLINE" };
        this.rollbackMessage = result.message;
        this.previewPath = null;
        this.render();
      });
    });
    this.root.querySelector<HTMLElement>("[data-v26-reset-order]")?.addEventListener("click", () => {
      const result = this.callbacks.onBackup26ResetOrderRequested?.() ?? { ok: false, message: "ROLLBACK AUDIT OFFLINE" };
      this.rollbackMessage = result.message;
      this.previewPath = null;
      this.render();
    });
    this.root.querySelectorAll<HTMLElement>("[data-v26-record]").forEach(button => {
      button.addEventListener("click", () => {
        const result = this.callbacks.onBackup26RecordRequested?.(button.dataset.v26Record ?? "") ?? { ok: false, message: "ROLLBACK AUDIT OFFLINE" };
        this.rollbackMessage = result.message;
        this.previewPath = null;
        if (result.ok && result.path) this.currentDirectory = BACKUP_26_RESULT;
        this.render();
      });
    });
    this.root.querySelectorAll<HTMLElement>("[data-v41-source]").forEach(button => {
      button.addEventListener("click", () => {
        const result = this.callbacks.onBackup41SourceRequested?.(button.dataset.v41Evidence ?? "", button.dataset.v41Source ?? "") ?? { ok: false, message: "INCIDENT RECONSTRUCTION OFFLINE" };
        this.incidentMessage = result.message;
        this.previewPath = null;
        if (result.ok && result.path) this.currentDirectory = BACKUP_41_RESULT;
        this.render();
      });
    });
    this.root.querySelector<HTMLElement>("[data-v41-reset]")?.addEventListener("click", () => {
      const result = this.callbacks.onBackup41ResetRequested?.() ?? { ok: false, message: "INCIDENT RECONSTRUCTION OFFLINE" };
      this.incidentMessage = result.message;
      this.previewPath = null;
      this.render();
    });
  }

  private homeNavigation(processState: ProcessMonitorState): string {
    return `${this.directoryButton("/memories", "MEMORY")}${this.directoryButton("/system/logs", "SYSTEM LOGS")}${processState.unlocked ? this.directoryButton("/system/processes", "PROCESS") : ""}`;
  }

  private backup03Navigation(state: Backup03MonitorState): string {
    return `${this.directoryButton(BACKUP_03_TRAINING, "TRAINING")}${state.solved ? this.directoryButton(BACKUP_03_ARCHIVE, "ARCHIVE") : ""}`;
  }

  private backup10Navigation(state: Backup10MonitorState): string {
    return `${this.directoryButton(BACKUP_10_SOURCE, "SOURCE")}${state.puzzleSolved ? this.directoryButton(BACKUP_10_AUDIT, "AUDIT") : ""}`;
  }

  private backup26Navigation(state: Backup26MonitorState): string {
    return `${this.directoryButton(BACKUP_26_AUDIT, "AUDIT TRAIL")}${state.auditSolved ? this.directoryButton(BACKUP_26_RESULT, "RESULT") : ""}`;
  }

  private backup41Navigation(state: Backup41MonitorState): string {
    return `${this.directoryButton(BACKUP_41_EVIDENCE, "EVIDENCE")}${state.solved ? this.directoryButton(BACKUP_41_RESULT, "RESULT") : ""}`;
  }

  private directoryButton(path: string, label: string): string {
    return `<button type="button" data-os-directory="${this.escape(path)}" class="${this.currentDirectory === path ? "is-active" : ""}">${this.escape(label)}</button>`;
  }

  private fileList(entries: VirtualEntry[]): string {
    return `<main class="m0-file-list m2-file-list">${entries.length ? entries.map(entry => this.entry(entry)).join("") : `<div class="m2-empty-directory"><strong>NO INDEXED FILES</strong><span>В этом разделе пока нет доступных записей.</span></div>`}</main>`;
  }

  private entry(entry: VirtualEntry): string {
    const readable = entry.type === "file" && !entry.deleted && !!entry.content;
    const actions: string[] = [];
    if (!entry.deleted && entry.inspectable) actions.push(this.action("inspect", entry.path, "Анализ"));
    if (readable) actions.push(this.action("read", entry.path, "Открыть"));
    if (!entry.deleted && entry.type === "file" && entry.deletable !== false) actions.push(this.action("delete", entry.path, "Удалить"));
    if (entry.deleted && entry.type === "file" && entry.restorable !== false) actions.push(this.action("restore", entry.path, "Восстановить"));
    const icon = entry.deleted ? "□" : entry.mime === "text/plain" || entry.mime?.includes("log") ? "≡" : entry.mime?.includes("process") ? "⌁" : "▣";
    const status = entry.deleted ? "DELETED / recoverable" : entry.inspectable ? "EVIDENCE / metadata available" : this.escape(entry.mime ?? "file");
    return `<article class="m0-file m2-file ${entry.deleted ? "is-deleted" : ""}"><div class="m0-file-icon">${icon}</div><div class="m0-file-copy"><strong>${this.escape(entry.label)}</strong><code>${this.escape(entry.path)}</code><small>${status}</small></div>${actions.length ? `<div class="m2-file-actions">${actions.join("")}</div>` : ""}</article>`;
  }

  private action(action: string, path: string, label: string): string {
    return `<button type="button" data-file-action="${action}" data-path="${this.escape(path)}">${this.escape(label)}</button>`;
  }

  private preview(entry: VirtualEntry): string {
    if (this.previewMode === "evidence" && entry.inspectable) return this.evidence(entry);
    return `<aside class="m1-file-preview m2-text-preview"><div><strong>${this.escape(entry.label)}</strong><code>${this.escape(entry.path)}</code></div><pre>${this.escape(entry.content ?? "No readable content.")}</pre><button type="button" data-preview-close>Закрыть</button></aside>`;
  }

  private evidence(entry: VirtualEntry): string {
    const metadata = Object.entries(entry.metadata ?? {});
    return `<aside class="m2-evidence-preview"><header><div><strong>EVIDENCE INSPECTOR</strong><code>${this.escape(entry.path)}</code></div><button type="button" data-preview-close aria-label="Закрыть анализ">×</button></header><div class="m2-evidence-body"><figure>${entry.artwork ? `<img src="${this.escape(entry.artwork)}" alt="${this.escape(entry.label)}">` : `<div class="m2-evidence-placeholder">NO VISUAL BUFFER</div>`}<figcaption>${this.escape(entry.label)}</figcaption></figure><div class="m2-metadata">${metadata.map(([key, value]) => `<div><span>${this.escape(key)}</span><code>${this.escape(value)}</code></div>`).join("")}<p class="m2-evidence-clue">Cold recovery принимает дату исходного захвата в формате <strong>DDMM</strong>. Сопоставь её с метаданными.</p></div></div></aside>`;
  }

  private recoveryConsole(): string {
    return `<section class="m2-recovery" aria-label="Recovery console"><header><div><strong>RECOVERY CONSOLE</strong><small>COLD INDEX / MANUAL SIGNATURE</small></div><span>ΩRC</span></header><p>Повреждённые записи можно адресовать короткой recovery signature. Консоль принимает 4 символа.</p><form data-recovery-form><input data-recovery-key inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Recovery signature" placeholder="••••"><button type="submit">RECOVER</button></form><output class="m2-recovery-output">${this.escape(this.recoveryMessage || "WAITING FOR SIGNATURE")}</output></section>`;
  }

  private processMonitor(state: ProcessMonitorState, entries: VirtualEntry[]): string {
    const channel = entries.find(entry => entry.path.endsWith("null_channel.proc") && !entry.deleted);
    const puzzle = `<div class="m3-route-puzzle"><p>Восстанови инициатора quarantine request по журналу recovery_1703.log. VERA_CORE отклонила запрос — она не была источником.</p><div class="m3-route-options"><button type="button" data-process-route="vera">VERA_CORE → NULL</button><button type="button" data-process-route="system">SYSTEM → NULL</button><button type="button" data-process-route="null">NULL → SYSTEM</button></div></div>`;
    const opened = `<div class="m3-route-open"><strong>ROUTE RECONSTRUCTED</strong><code>SYSTEM → NULL</code><span>HOME topology changed.</span></div>${channel ? this.entry(channel) : ""}`;
    return `<main class="m3-process-monitor"><section class="m3-process-card ${state.channelOpen ? "is-open" : "is-quarantined"}"><header><div><strong>PROCESS // NULL</strong><small>UNINDEXED SECONDARY READER</small></div><span>${state.channelOpen ? "CHANNEL OPEN" : "QUARANTINED"}</span></header><div class="m3-process-grid"><div><small>PID</small><code>0031</code></div><div><small>SIGNATURE</small><code>NULL</code></div><div><small>LAST EVENT</small><code>04:12:14</code></div><div><small>BYTES LOST</small><code>31</code></div></div>${state.channelOpen ? opened : puzzle}<output class="m3-process-output">${this.escape(this.processMessage || state.message || (state.channelOpen ? "LINK STABLE // LISTENING" : "ROUTE REQUIRED"))}</output></section></main>`;
  }

  private backupClassifier(state: Backup03MonitorState): string {
    const ready = state.samplesSeen >= state.totalSamples;
    const solved = state.solved;
    return `<section class="m4-classifier" aria-label="VERA 0.3 classification console"><header><div><strong>CLASSIFICATION TRAINER</strong><small>VERA_0_3 // HUMAN_CONTEXT</small></div><span>${solved ? "TOKEN ISSUED" : ready ? "READY" : `${state.samplesSeen}/${state.totalSamples}`}</span></header><p>${solved ? "Категория подтверждена. Старый архив HUMAN_CONTEXT смонтирован." : ready ? "Три физических образца изучены. Какая категория сохраняет их смысл отдельно от исполняемой функции?" : "Сначала изучи три физических образца в sandbox. Консоль принимает решение только после полного training set."}</p><div class="m4-classifier-options"><button type="button" data-backup-classification="memory" ${ready && !solved ? "" : "disabled"}>MEMORY</button><button type="button" data-backup-classification="service" ${ready && !solved ? "" : "disabled"}>SERVICE</button><button type="button" data-backup-classification="noise" ${ready && !solved ? "" : "disabled"}>NOISE</button></div><output>${this.escape(this.backupMessage || state.message || (solved ? "HUMAN_CONTEXT → MEMORY" : ready ? "AWAITING CLASSIFICATION" : "TRAINING SET INCOMPLETE"))}</output></section>`;
  }

  private rollbackAudit(state: Backup26MonitorState): string {
    const evidenceReady = state.evidenceSeen >= state.totalEvidence;
    const logsReady = state.logsRead >= state.totalLogs;
    const orderReady = evidenceReady && logsReady;
    const sequence = state.commandOrder.length
      ? state.commandOrder.map((id, index) => `<li><span>${index + 1}</span><code>${this.escape(id)}</code></li>`).join("")
      : `<li class="is-empty">NO COMMANDS SELECTED</li>`;
    const commandButtons = state.commands.map(command => `<button type="button" data-v26-command="${this.escape(command.id)}" ${orderReady && !state.orderSolved && !state.commandOrder.includes(command.id) ? "" : "disabled"}>${this.escape(command.label)}</button>`).join("");
    const recordButtons = state.records.map(record => `<button type="button" data-v26-record="${this.escape(record.id)}" ${state.orderSolved && !state.auditSolved ? "" : "disabled"}>${this.escape(record.label)}</button>`).join("");
    const phase = state.auditSolved ? "AUDIT SOLVED" : state.orderSolved ? "FIND POST-ROLLBACK EDIT" : orderReady ? "RECONSTRUCT ORDER" : "EVIDENCE REQUIRED";
    return `<section class="m5-rollback-audit" aria-label="VERA 2.6 rollback audit"><header><div><strong>ROLLBACK AUDIT</strong><small>VERA_2_6 // ORDERED LOGS</small></div><span>${phase}</span></header><div class="m5-audit-progress"><span>PHYSICAL ${state.evidenceSeen}/${state.totalEvidence}</span><span>LOGS ${state.logsRead}/${state.totalLogs}</span><span>ATTEMPTS ${state.attempts}</span></div><p>${state.auditSolved ? "Execution chain and post-event edit identified. RESULT directory mounted." : state.orderSolved ? "Порядок подтверждён. Теперь укажи, какая читаемая запись была изменена уже после выполнения rollback." : orderReady ? "Собери команды в порядке выполнения. Используй append-only controller trace и физические последствия в комнате; human-readable summary может быть ненадёжным." : "Осмотри три физических последствия в Research Office и прочитай все три audit-записи. После этого реконструкция порядка разблокируется."}</p><ol class="m5-audit-sequence">${sequence}</ol><div class="m5-audit-command-grid">${commandButtons}</div><button class="m5-audit-reset" type="button" data-v26-reset-order ${orderReady && !state.orderSolved && state.commandOrder.length ? "" : "disabled"}>RESET ORDER</button><div class="m5-audit-record-grid">${recordButtons}</div><output>${this.escape(this.rollbackMessage || state.message || phase)}</output></section>`;
  }

  private incidentReconstruction(state: Backup41MonitorState): string {
    const ready = state.evidenceSeen >= state.totalEvidence && state.logsRead >= state.totalLogs;
    const classified = Object.keys(state.assignments).length;
    const evidenceRows = state.evidence.map(item => {
      const current = state.assignments[item.id] ?? "";
      const button = (source: string, label: string) => `<button type="button" data-v41-source="${this.escape(source)}" data-v41-evidence="${this.escape(item.id)}" class="${current === source ? "is-selected" : ""}" ${ready && !state.solved ? "" : "disabled"}>${label}</button>`;
      return `<article class="m5-incident-row"><div><strong>${this.escape(item.label)}</strong><code>${this.escape(item.id)}</code></div><div>${button("direct_telemetry", "TELEMETRY")}${button("vera_reconstruction", "VERA MEMORY")}${button("morr_note", "MORR NOTE")}</div></article>`;
    }).join("");
    const phase = state.solved ? "SOURCE MAP VERIFIED" : ready ? `CLASSIFIED ${classified}/${state.evidence.length}` : "EVIDENCE REQUIRED";
    return `<section class="m5-incident-audit" aria-label="VERA 4.1 incident reconstruction"><header><div><strong>INCIDENT RECONSTRUCTION</strong><small>VERA_4_1 // SOURCE RELIABILITY</small></div><span>${phase}</span></header><div class="m5-audit-progress"><span>PHYSICAL ${state.evidenceSeen}/${state.totalEvidence}</span><span>FILES ${state.logsRead}/${state.totalLogs}</span><span>ATTEMPTS ${state.attempts}</span></div><p>${state.solved ? "Provenance separated. The reconstruction result distinguishes direct external-control telemetry, V.E.R.A. mnemonic motive and Morr containment notes." : ready ? "Assign every evidence item to its provenance. A memory can be emotionally coherent without being direct telemetry; a signed Morr note is still an operator account." : "Inspect the three physical witness layers in Containment Night and read all six evidence files before classifying provenance."}</p><div class="m5-incident-grid">${evidenceRows}</div><button class="m5-audit-reset" type="button" data-v41-reset ${ready && !state.solved && classified ? "" : "disabled"}>RESET SOURCES</button><output>${this.escape(this.incidentMessage || state.message || phase)}</output></section>`;
  }
  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState, backup41: Backup41MonitorState): string {
    if (mode === "backup03") return "VERA_0_3 is an isolated snapshot. Physical samples and indexed labels describe the same training state.";
    if (mode === "backup10") return backup10.puzzleSolved
      ? "VERA_1_0 audit proves reconstruction can add meaningful objects absent from the source capture."
      : "Compare SOURCE verified IDs against physical objects in the Summer House reconstruction.";
    if (mode === "backup26") return backup26.auditSolved
      ? "VERA_2_6: append-only controller sequence contradicts the later operator summary."
      : "Correlate ordered controller events, room-side effects and writable operator records.";
    if (mode === "backup41") return backup41.solved
      ? "VERA_4_1: provenance map separates telemetry, reconstruction and Morr notes before drawing incident conclusions."
      : "P11 SOURCE RELIABILITY // classify what each witness can actually prove.";
    if (inProcessMonitor) return "PROCESS view reconstructed from cold-index evidence. Route changes may alter HOME.";
    return "HOME отражает состояние индексированных файлов. Не все изменения обратимы.";
  }

  private escape(value: string): string {
    return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char] ?? char));
  }
}
