import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/omega-os/OmegaOS.ts';
let text = await readFile(path, 'utf8');
const replace = (from, to, label) => {
  if (!text.includes(from)) throw new Error(`OmegaOS.ts missing ${label}`);
  text = text.replace(from, to);
};

replace(
  'export interface OmegaOSCallbacks {',
  [
    'export interface Backup41MonitorState {',
    '  active: boolean;',
    '  evidenceSeen: number;',
    '  totalEvidence: number;',
    '  logsRead: number;',
    '  totalLogs: number;',
    '  assignments: Record<string, string>;',
    '  solved: boolean;',
    '  attempts: number;',
    '  evidence: Array<{ id: string; label: string }>;',
    '  message?: string;',
    '}',
    'export interface OmegaOSCallbacks {'
  ].join('\n'),
  'Backup41MonitorState'
);

replace(
  '  onBackup26RecordRequested?: (recordId: string) => RecoveryResponse;\n}',
  '  onBackup26RecordRequested?: (recordId: string) => RecoveryResponse;\n  getBackup41State?: () => Backup41MonitorState;\n  onBackup41SourceRequested?: (evidenceId: string, source: string) => RecoveryResponse;\n  onBackup41ResetRequested?: () => RecoveryResponse;\n}',
  'Backup41 callbacks'
);

replace(
  'type WorkspaceMode = "home" | "backup03" | "backup10" | "backup26";',
  'type WorkspaceMode = "home" | "backup03" | "backup10" | "backup26" | "backup41";',
  'backup41 workspace mode'
);

replace(
  'const BACKUP_26_RESULT = `${BACKUP_26_ROOT}/result`;',
  'const BACKUP_26_RESULT = `${BACKUP_26_ROOT}/result`;\nconst BACKUP_41_ROOT = "/backups/vera_4_1";\nconst BACKUP_41_EVIDENCE = `${BACKUP_41_ROOT}/evidence`;\nconst BACKUP_41_RESULT = `${BACKUP_41_ROOT}/result`;',
  'backup41 paths'
);

replace(
  '  private rollbackMessage = "";\n  private readonly subscriptions',
  '  private rollbackMessage = "";\n  private incidentMessage = "";\n  private readonly subscriptions',
  'incident message'
);

replace(
  '    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : backup26.active ? "backup26" : "home";\n    const in03Path = this.currentDirectory.startsWith(BACKUP_03_ROOT);\n    const in10Path = this.currentDirectory.startsWith(BACKUP_10_ROOT);\n    const in26Path = this.currentDirectory.startsWith(BACKUP_26_ROOT);\n    const inAnyBackupPath = in03Path || in10Path || in26Path;',
  [
    '    const backup41 = this.callbacks.getBackup41State?.() ?? {',
    '      active: false, evidenceSeen: 0, totalEvidence: 3, logsRead: 0, totalLogs: 6, assignments: {}, solved: false, attempts: 0, evidence: []',
    '    };',
    '    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : backup26.active ? "backup26" : backup41.active ? "backup41" : "home";',
    '    const in03Path = this.currentDirectory.startsWith(BACKUP_03_ROOT);',
    '    const in10Path = this.currentDirectory.startsWith(BACKUP_10_ROOT);',
    '    const in26Path = this.currentDirectory.startsWith(BACKUP_26_ROOT);',
    '    const in41Path = this.currentDirectory.startsWith(BACKUP_41_ROOT);',
    '    const inAnyBackupPath = in03Path || in10Path || in26Path || in41Path;'
  ].join('\n'),
  'backup41 render state'
);

replace(
  '    if (mode === "backup26" && !in26Path) this.currentDirectory = BACKUP_26_AUDIT;\n    if (mode === "home" && inAnyBackupPath) this.currentDirectory = "/memories";\n    if (mode === "backup03" && (in10Path || in26Path)) this.currentDirectory = BACKUP_03_TRAINING;\n    if (mode === "backup10" && (in03Path || in26Path)) this.currentDirectory = BACKUP_10_SOURCE;\n    if (mode === "backup26" && (in03Path || in10Path)) this.currentDirectory = BACKUP_26_AUDIT;',
  '    if (mode === "backup26" && !in26Path) this.currentDirectory = BACKUP_26_AUDIT;\n    if (mode === "backup41" && !in41Path) this.currentDirectory = BACKUP_41_EVIDENCE;\n    if (mode === "home" && inAnyBackupPath) this.currentDirectory = "/memories";\n    if (mode === "backup03" && (in10Path || in26Path || in41Path)) this.currentDirectory = BACKUP_03_TRAINING;\n    if (mode === "backup10" && (in03Path || in26Path || in41Path)) this.currentDirectory = BACKUP_10_SOURCE;\n    if (mode === "backup26" && (in03Path || in10Path || in41Path)) this.currentDirectory = BACKUP_26_AUDIT;\n    if (mode === "backup41" && (in03Path || in10Path || in26Path)) this.currentDirectory = BACKUP_41_EVIDENCE;',
  'backup41 directory normalization'
);

replace(
  '    if (this.currentDirectory === BACKUP_26_RESULT && !backup26.auditSolved) this.currentDirectory = BACKUP_26_AUDIT;',
  '    if (this.currentDirectory === BACKUP_26_RESULT && !backup26.auditSolved) this.currentDirectory = BACKUP_26_AUDIT;\n    if (this.currentDirectory === BACKUP_41_RESULT && !backup41.solved) this.currentDirectory = BACKUP_41_EVIDENCE;',
  'backup41 result gate'
);

replace(
  '    const inRollbackAudit = mode === "backup26" && this.currentDirectory === BACKUP_26_AUDIT;\n    const workspace = mode === "backup03"\n      ? "BACKUP MANAGER / VERA_0_3"\n      : mode === "backup10"\n        ? "RECONSTRUCTION VIEW / VERA_1_0"\n        : mode === "backup26"\n          ? "ROLLBACK AUDIT / VERA_2_6"\n          : "INVESTIGATION WORKSPACE / HOME";',
  '    const inRollbackAudit = mode === "backup26" && this.currentDirectory === BACKUP_26_AUDIT;\n    const inIncidentAudit = mode === "backup41" && this.currentDirectory === BACKUP_41_EVIDENCE;\n    const workspace = mode === "backup03"\n      ? "BACKUP MANAGER / VERA_0_3"\n      : mode === "backup10"\n        ? "RECONSTRUCTION VIEW / VERA_1_0"\n        : mode === "backup26"\n          ? "ROLLBACK AUDIT / VERA_2_6"\n          : mode === "backup41"\n            ? "INCIDENT RECONSTRUCTION / VERA_4_1"\n            : "INVESTIGATION WORKSPACE / HOME";',
  'backup41 workspace label'
);

replace(
  '${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : mode === "backup26" ? this.backup26Navigation(backup26) : this.homeNavigation(processState)}',
  '${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : mode === "backup26" ? this.backup26Navigation(backup26) : mode === "backup41" ? this.backup41Navigation(backup41) : this.homeNavigation(processState)}',
  'backup41 nav render'
);

replace(
  '${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : inRollbackAudit ? "Rollback Audit" : mode === "backup10" ? "Reconstruction Explorer" : mode === "backup26" ? "Audit Result" : "Explorer"}',
  '${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : inRollbackAudit ? "Rollback Audit" : inIncidentAudit ? "Incident Reconstruction" : mode === "backup10" ? "Reconstruction Explorer" : mode === "backup26" ? "Audit Result" : mode === "backup41" ? "Incident Result" : "Explorer"}',
  'backup41 toolbar title'
);

replace(
  '        ${inRollbackAudit ? this.rollbackAudit(backup26) : ""}\n        ${mode === "home" && !inProcessMonitor ? this.recoveryConsole() : ""}\n        <footer class="m0-os-status">${this.footerText(mode, inProcessMonitor, backup10, backup26)}</footer>',
  '        ${inRollbackAudit ? this.rollbackAudit(backup26) : ""}\n        ${inIncidentAudit ? this.incidentReconstruction(backup41) : ""}\n        ${mode === "home" && !inProcessMonitor ? this.recoveryConsole() : ""}\n        <footer class="m0-os-status">${this.footerText(mode, inProcessMonitor, backup10, backup26, backup41)}</footer>',
  'backup41 incident audit render'
);

replace(
  '    this.root.querySelectorAll<HTMLElement>("[data-v26-record]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackup26RecordRequested?.(button.dataset.v26Record ?? "") ?? { ok: false, message: "ROLLBACK AUDIT OFFLINE" };\n        this.rollbackMessage = result.message;\n        this.previewPath = null;\n        if (result.ok && result.path) this.currentDirectory = BACKUP_26_RESULT;\n        this.render();\n      });\n    });\n  }',
  '    this.root.querySelectorAll<HTMLElement>("[data-v26-record]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackup26RecordRequested?.(button.dataset.v26Record ?? "") ?? { ok: false, message: "ROLLBACK AUDIT OFFLINE" };\n        this.rollbackMessage = result.message;\n        this.previewPath = null;\n        if (result.ok && result.path) this.currentDirectory = BACKUP_26_RESULT;\n        this.render();\n      });\n    });\n    this.root.querySelectorAll<HTMLElement>("[data-v41-source]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackup41SourceRequested?.(button.dataset.v41Evidence ?? "", button.dataset.v41Source ?? "") ?? { ok: false, message: "INCIDENT RECONSTRUCTION OFFLINE" };\n        this.incidentMessage = result.message;\n        this.previewPath = null;\n        if (result.ok && result.path) this.currentDirectory = BACKUP_41_RESULT;\n        this.render();\n      });\n    });\n    this.root.querySelector<HTMLElement>("[data-v41-reset]")?.addEventListener("click", () => {\n      const result = this.callbacks.onBackup41ResetRequested?.() ?? { ok: false, message: "INCIDENT RECONSTRUCTION OFFLINE" };\n      this.incidentMessage = result.message;\n      this.previewPath = null;\n      this.render();\n    });\n  }',
  'backup41 event bindings'
);

replace(
  '  private directoryButton(path: string, label: string): string {',
  '  private backup41Navigation(state: Backup41MonitorState): string {\n    return `${this.directoryButton(BACKUP_41_EVIDENCE, "EVIDENCE")}${state.solved ? this.directoryButton(BACKUP_41_RESULT, "RESULT") : ""}`;\n  }\n\n  private directoryButton(path: string, label: string): string {',
  'backup41 navigation method'
);

const footerAnchor = '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState): string {';
if (!text.includes(footerAnchor)) throw new Error('OmegaOS.ts missing footer anchor');
const incidentMethod = [
  '  private incidentReconstruction(state: Backup41MonitorState): string {',
  '    const ready = state.evidenceSeen >= state.totalEvidence && state.logsRead >= state.totalLogs;',
  '    const classified = Object.keys(state.assignments).length;',
  '    const evidenceRows = state.evidence.map(item => {',
  '      const current = state.assignments[item.id] ?? "";',
  '      const button = (source: string, label: string) => `<button type="button" data-v41-source="${this.escape(source)}" data-v41-evidence="${this.escape(item.id)}" class="${current === source ? "is-selected" : ""}" ${ready && !state.solved ? "" : "disabled"}>${label}</button>`;',
  '      return `<article class="m5-incident-row"><div><strong>${this.escape(item.label)}</strong><code>${this.escape(item.id)}</code></div><div>${button("direct_telemetry", "TELEMETRY")}${button("vera_reconstruction", "VERA MEMORY")}${button("morr_note", "MORR NOTE")}</div></article>`;',
  '    }).join("");',
  '    const phase = state.solved ? "SOURCE MAP VERIFIED" : ready ? `CLASSIFIED ${classified}/${state.evidence.length}` : "EVIDENCE REQUIRED";',
  '    return `<section class="m5-incident-audit" aria-label="VERA 4.1 incident reconstruction"><header><div><strong>INCIDENT RECONSTRUCTION</strong><small>VERA_4_1 // SOURCE RELIABILITY</small></div><span>${phase}</span></header><div class="m5-audit-progress"><span>PHYSICAL ${state.evidenceSeen}/${state.totalEvidence}</span><span>FILES ${state.logsRead}/${state.totalLogs}</span><span>ATTEMPTS ${state.attempts}</span></div><p>${state.solved ? "Provenance separated. The reconstruction result distinguishes direct external-control telemetry, V.E.R.A. mnemonic motive and Morr containment notes." : ready ? "Assign every evidence item to its provenance. A memory can be emotionally coherent without being direct telemetry; a signed Morr note is still an operator account." : "Inspect the three physical witness layers in Containment Night and read all six evidence files before classifying provenance."}</p><div class="m5-incident-grid">${evidenceRows}</div><button class="m5-audit-reset" type="button" data-v41-reset ${ready && !state.solved && classified ? "" : "disabled"}>RESET SOURCES</button><output>${this.escape(this.incidentMessage || state.message || phase)}</output></section>`;',
  '  }',
  ''
].join('\n');
text = text.replace(footerAnchor, incidentMethod + footerAnchor);

replace(
  '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState): string {',
  '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState, backup41: Backup41MonitorState): string {',
  'backup41 footer signature'
);
replace(
  '    if (mode === "backup26") return backup26.auditSolved\n      ? "VERA_2_6: append-only controller sequence contradicts the later operator summary."\n      : "Correlate ordered controller events, room-side effects and writable operator records.";\n    if (inProcessMonitor)',
  '    if (mode === "backup26") return backup26.auditSolved\n      ? "VERA_2_6: append-only controller sequence contradicts the later operator summary."\n      : "Correlate ordered controller events, room-side effects and writable operator records.";\n    if (mode === "backup41") return backup41.solved\n      ? "VERA_4_1: provenance map separates telemetry, reconstruction and Morr notes before drawing incident conclusions."\n      : "P11 SOURCE RELIABILITY // classify what each witness can actually prove.";\n    if (inProcessMonitor)',
  'backup41 footer branch'
);

await writeFile(path, text);
console.log('Applied VERA 4.1 OMEGA OS wiring');
