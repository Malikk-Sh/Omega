import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/omega-os/OmegaOS.ts';
let text = await readFile(path, 'utf8');
const replaceOnce = (from, to, label) => {
  if (!text.includes(from)) throw new Error(`OMEGA OS anchor missing: ${label}`);
  text = text.replace(from, to);
};

replaceOnce(
  'export interface OmegaOSCallbacks {',
  `export interface Sea2017MonitorState {\n  active: boolean;\n  available: boolean;\n  archiveKeyFound: boolean;\n  archiveKeySources: string[];\n  archiveKeyAttempts: number;\n  archiveCandidates: Array<{ path: string; label: string }>;\n  physicalSeen: number;\n  totalPhysical: number;\n  filesRead: number;\n  totalFiles: number;\n  assignments: Record<string, string>;\n  indexSolved: boolean;\n  indexAttempts: number;\n  finalArchiveRead: boolean;\n  fields: Array<{ id: string; label: string; options: Array<{ id: string; label: string }> }>;\n  message?: string;\n}\nexport interface OmegaOSCallbacks {`,
  'sea monitor interface'
);
replaceOnce(
  '  onBackup41ResetRequested?: () => RecoveryResponse;\n}',
  `  onBackup41ResetRequested?: () => RecoveryResponse;\n  getSea2017State?: () => Sea2017MonitorState;\n  onSeaArchiveSourceRequested?: (path: string) => RecoveryResponse;\n  onSeaArchiveKeySubmitRequested?: () => RecoveryResponse;\n  onSeaArchiveKeyResetRequested?: () => RecoveryResponse;\n  onSeaIndexOptionRequested?: (fieldId: string, optionId: string) => RecoveryResponse;\n  onSeaIndexSubmitRequested?: () => RecoveryResponse;\n  onSeaIndexResetRequested?: () => RecoveryResponse;\n}`,
  'sea callbacks'
);
replaceOnce(
  'type WorkspaceMode = "home" | "backup03" | "backup10" | "backup26" | "backup41";',
  'type WorkspaceMode = "home" | "backup03" | "backup10" | "backup26" | "backup41" | "sea2017";',
  'workspace mode'
);
replaceOnce(
  'const BACKUP_41_RESULT = `${BACKUP_41_ROOT}/result`;\n',
  'const BACKUP_41_RESULT = `${BACKUP_41_ROOT}/result`;\nconst SEA_2017_ROOT = "/archives/sea_2017";\nconst SEA_2017_INDEX = `${SEA_2017_ROOT}/index`;\nconst SEA_2017_FINAL = "/archives/morr/final";\n',
  'sea directories'
);
replaceOnce(
  '  private incidentMessage = "";\n  private readonly subscriptions:',
  '  private incidentMessage = "";\n  private archiveMessage = "";\n  private seaIndexMessage = "";\n  private readonly subscriptions:',
  'sea messages'
);
replaceOnce(
  `    const backup41 = this.callbacks.getBackup41State?.() ?? {\n      active: false, evidenceSeen: 0, totalEvidence: 3, logsRead: 0, totalLogs: 6, assignments: {}, solved: false, attempts: 0, evidence: []\n    };\n    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : backup26.active ? "backup26" : backup41.active ? "backup41" : "home";`,
  `    const backup41 = this.callbacks.getBackup41State?.() ?? {\n      active: false, evidenceSeen: 0, totalEvidence: 3, logsRead: 0, totalLogs: 6, assignments: {}, solved: false, attempts: 0, evidence: []\n    };\n    const sea2017 = this.callbacks.getSea2017State?.() ?? {\n      active: false, available: false, archiveKeyFound: false, archiveKeySources: [], archiveKeyAttempts: 0, archiveCandidates: [],\n      physicalSeen: 0, totalPhysical: 4, filesRead: 0, totalFiles: 4, assignments: {}, indexSolved: false, indexAttempts: 0, finalArchiveRead: false, fields: []\n    };\n    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : backup26.active ? "backup26" : backup41.active ? "backup41" : sea2017.active ? "sea2017" : "home";`,
  'sea render state'
);
replaceOnce(
  `    const in41Path = this.currentDirectory.startsWith(BACKUP_41_ROOT);\n    const inAnyBackupPath = in03Path || in10Path || in26Path || in41Path;`,
  `    const in41Path = this.currentDirectory.startsWith(BACKUP_41_ROOT);\n    const inSeaPath = this.currentDirectory.startsWith(SEA_2017_ROOT) || this.currentDirectory.startsWith(SEA_2017_FINAL);\n    const inAnyBackupPath = in03Path || in10Path || in26Path || in41Path;`,
  'sea path state'
);
replaceOnce(
  `    if (mode === "backup41" && !in41Path) this.currentDirectory = BACKUP_41_EVIDENCE;\n    if (mode === "home" && inAnyBackupPath) this.currentDirectory = "/memories";`,
  `    if (mode === "backup41" && !in41Path) this.currentDirectory = BACKUP_41_EVIDENCE;\n    if (mode === "sea2017" && !inSeaPath) this.currentDirectory = SEA_2017_INDEX;\n    if (mode === "home" && inAnyBackupPath) this.currentDirectory = "/memories";\n    if (mode === "home" && inSeaPath && !sea2017.available) this.currentDirectory = "/memories";`,
  'sea directory routing'
);
replaceOnce(
  `    if (mode === "backup41" && (in03Path || in10Path || in26Path)) this.currentDirectory = BACKUP_41_EVIDENCE;\n    if (this.currentDirectory === "/system/processes"`,
  `    if (mode === "backup41" && (in03Path || in10Path || in26Path || inSeaPath)) this.currentDirectory = BACKUP_41_EVIDENCE;\n    if (mode === "backup03" && inSeaPath) this.currentDirectory = BACKUP_03_TRAINING;\n    if (mode === "backup10" && inSeaPath) this.currentDirectory = BACKUP_10_SOURCE;\n    if (mode === "backup26" && inSeaPath) this.currentDirectory = BACKUP_26_AUDIT;\n    if (mode === "sea2017" && (in03Path || in10Path || in26Path || in41Path)) this.currentDirectory = SEA_2017_INDEX;\n    if (this.currentDirectory === "/system/processes"`,
  'sea cross-mode routing'
);
replaceOnce(
  '    if (this.currentDirectory === BACKUP_41_RESULT && !backup41.solved) this.currentDirectory = BACKUP_41_EVIDENCE;\n',
  '    if (this.currentDirectory === BACKUP_41_RESULT && !backup41.solved) this.currentDirectory = BACKUP_41_EVIDENCE;\n    if (this.currentDirectory === SEA_2017_FINAL && !sea2017.indexSolved) this.currentDirectory = SEA_2017_INDEX;\n',
  'sea final lock'
);
replaceOnce(
  `    const inIncidentAudit = mode === "backup41" && this.currentDirectory === BACKUP_41_EVIDENCE;\n    const workspace = mode === "backup03"`,
  `    const inIncidentAudit = mode === "backup41" && this.currentDirectory === BACKUP_41_EVIDENCE;\n    const inArchiveCorrelator = mode === "home" && this.currentDirectory === SEA_2017_INDEX && sea2017.available;\n    const inSeaIndex = mode === "sea2017" && this.currentDirectory === SEA_2017_INDEX;\n    const workspace = mode === "backup03"`,
  'sea panel flags'
);
replaceOnce(
  `          : mode === "backup41"\n            ? "INCIDENT RECONSTRUCTION / VERA_4_1"\n            : "INVESTIGATION WORKSPACE / HOME";`,
  `          : mode === "backup41"\n            ? "INCIDENT RECONSTRUCTION / VERA_4_1"\n            : mode === "sea2017"\n              ? "MEMORY INDEX / SEA_2017"\n              : "INVESTIGATION WORKSPACE / HOME";`,
  'sea workspace label'
);
replaceOnce(
  '${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : mode === "backup26" ? this.backup26Navigation(backup26) : mode === "backup41" ? this.backup41Navigation(backup41) : this.homeNavigation(processState)}',
  '${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : mode === "backup26" ? this.backup26Navigation(backup26) : mode === "backup41" ? this.backup41Navigation(backup41) : mode === "sea2017" ? this.sea2017Navigation(sea2017) : this.homeNavigation(processState, sea2017)}',
  'sea navigation render'
);
replaceOnce(
  '${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : inRollbackAudit ? "Rollback Audit" : inIncidentAudit ? "Incident Reconstruction" : mode === "backup10" ? "Reconstruction Explorer" : mode === "backup26" ? "Audit Result" : mode === "backup41" ? "Incident Result" : "Explorer"}',
  '${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : inRollbackAudit ? "Rollback Audit" : inIncidentAudit ? "Incident Reconstruction" : inArchiveCorrelator ? "Archive Correlator" : inSeaIndex ? "Sea Index" : mode === "backup10" ? "Reconstruction Explorer" : mode === "backup26" ? "Audit Result" : mode === "backup41" ? "Incident Result" : mode === "sea2017" ? "Morr Archive" : "Explorer"}',
  'sea toolbar label'
);
replaceOnce(
  `        \${inIncidentAudit ? this.incidentReconstruction(backup41) : ""}\n        \${mode === "home" && !inProcessMonitor ? this.recoveryConsole() : ""}\n        <footer class="m0-os-status">\${this.footerText(mode, inProcessMonitor, backup10, backup26, backup41)}</footer>`,
  `        \${inIncidentAudit ? this.incidentReconstruction(backup41) : ""}\n        \${inArchiveCorrelator ? this.archiveCorrelator(sea2017) : ""}\n        \${inSeaIndex ? this.seaIndex(sea2017) : ""}\n        \${mode === "home" && !inProcessMonitor && !inArchiveCorrelator ? this.recoveryConsole() : ""}\n        <footer class="m0-os-status">\${this.footerText(mode, inProcessMonitor, backup10, backup26, backup41, sea2017)}</footer>`,
  'sea panels render'
);
replaceOnce(
  `    this.root.querySelector<HTMLElement>("[data-v41-reset]")?.addEventListener("click", () => {\n      const result = this.callbacks.onBackup41ResetRequested?.() ?? { ok: false, message: "INCIDENT RECONSTRUCTION OFFLINE" };\n      this.incidentMessage = result.message;\n      this.previewPath = null;\n      this.render();\n    });\n  }`,
  `    this.root.querySelector<HTMLElement>("[data-v41-reset]")?.addEventListener("click", () => {\n      const result = this.callbacks.onBackup41ResetRequested?.() ?? { ok: false, message: "INCIDENT RECONSTRUCTION OFFLINE" };\n      this.incidentMessage = result.message;\n      this.previewPath = null;\n      this.render();\n    });\n    this.root.querySelectorAll<HTMLElement>("[data-m6-key-source]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onSeaArchiveSourceRequested?.(button.dataset.m6KeySource ?? "") ?? { ok: false, message: "ARCHIVE CORRELATOR OFFLINE" };\n        this.archiveMessage = result.message;\n        this.render();\n      });\n    });\n    this.root.querySelector<HTMLElement>("[data-m6-key-submit]")?.addEventListener("click", () => {\n      const result = this.callbacks.onSeaArchiveKeySubmitRequested?.() ?? { ok: false, message: "ARCHIVE CORRELATOR OFFLINE" };\n      this.archiveMessage = result.message;\n      if (result.ok) this.currentDirectory = SEA_2017_INDEX;\n      this.render();\n    });\n    this.root.querySelector<HTMLElement>("[data-m6-key-reset]")?.addEventListener("click", () => {\n      const result = this.callbacks.onSeaArchiveKeyResetRequested?.() ?? { ok: false, message: "ARCHIVE CORRELATOR OFFLINE" };\n      this.archiveMessage = result.message;\n      this.render();\n    });\n    this.root.querySelectorAll<HTMLElement>("[data-m6-index-option]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onSeaIndexOptionRequested?.(button.dataset.m6IndexField ?? "", button.dataset.m6IndexOption ?? "") ?? { ok: false, message: "SEA INDEX OFFLINE" };\n        this.seaIndexMessage = result.message;\n        this.render();\n      });\n    });\n    this.root.querySelector<HTMLElement>("[data-m6-index-submit]")?.addEventListener("click", () => {\n      const result = this.callbacks.onSeaIndexSubmitRequested?.() ?? { ok: false, message: "SEA INDEX OFFLINE" };\n      this.seaIndexMessage = result.message;\n      if (result.ok && result.path) this.currentDirectory = SEA_2017_FINAL;\n      this.render();\n    });\n    this.root.querySelector<HTMLElement>("[data-m6-index-reset]")?.addEventListener("click", () => {\n      const result = this.callbacks.onSeaIndexResetRequested?.() ?? { ok: false, message: "SEA INDEX OFFLINE" };\n      this.seaIndexMessage = result.message;\n      this.render();\n    });\n  }`,
  'sea event bindings'
);
replaceOnce(
  `  private homeNavigation(processState: ProcessMonitorState): string {\n    return \`\${this.directoryButton("/memories", "MEMORY")}\${this.directoryButton("/system/logs", "SYSTEM LOGS")}\${processState.unlocked ? this.directoryButton("/system/processes", "PROCESS") : ""}\`;\n  }`,
  `  private homeNavigation(processState: ProcessMonitorState, sea2017: Sea2017MonitorState): string {\n    return \`\${this.directoryButton("/memories", "MEMORY")}\${this.directoryButton("/system/logs", "SYSTEM LOGS")}\${processState.unlocked ? this.directoryButton("/system/processes", "PROCESS") : ""}\${sea2017.available ? this.directoryButton(SEA_2017_INDEX, sea2017.archiveKeyFound ? "SEA_2017" : "ARCHIVE") : ""}\`;\n  }`,
  'home archive nav'
);
replaceOnce(
  `  private directoryButton(path: string, label: string): string {`,
  `  private sea2017Navigation(state: Sea2017MonitorState): string {\n    return \`\${this.directoryButton(SEA_2017_INDEX, "SEA INDEX")}\${state.indexSolved ? this.directoryButton(SEA_2017_FINAL, "MORR FINAL") : ""}\`;\n  }\n\n  private directoryButton(path: string, label: string): string {`,
  'sea nav method'
);

const panels = `  private archiveCorrelator(state: Sea2017MonitorState): string {\n    const selected = new Set(state.archiveKeySources);\n    const buttons = state.archiveCandidates.map(candidate => \`<button type="button" data-m6-key-source="\${this.escape(candidate.path)}" class="\${selected.has(candidate.path) ? "is-selected" : ""}" \${state.archiveKeyFound ? "disabled" : ""}><strong>\${this.escape(candidate.label)}</strong><code>\${this.escape(candidate.path)}</code></button>\`).join("");\n    const phase = state.archiveKeyFound ? "KEY RECONSTRUCTED" : \`SOURCES \${state.archiveKeySources.length}\`;\n    return \`<section class="m6-archive-correlator" aria-label="SEA 2017 archive correlator"><header><div><strong>ARCHIVE CORRELATOR</strong><small>M-017 // CROSS-VERSION SOURCE LINK</small></div><span>\${phase}</span></header><p>SEA_2017 требует не пароль, а связь между pre-persona HUMAN_CONTEXT и подписанной containment-записью Морра. Выбери только источники, которые образуют эту связь.</p><div class="m6-source-grid">\${buttons}</div><div class="m6-inline-actions"><button type="button" data-m6-key-submit \${!state.archiveKeyFound && state.archiveKeySources.length ? "" : "disabled"}>CORRELATE</button><button type="button" data-m6-key-reset \${!state.archiveKeyFound && state.archiveKeySources.length ? "" : "disabled"}>RESET</button></div><output>\${this.escape(this.archiveMessage || state.message || phase)}</output></section>\`;\n  }\n\n  private seaIndex(state: Sea2017MonitorState): string {\n    const ready = state.physicalSeen >= state.totalPhysical && state.filesRead >= state.totalFiles;\n    const rows = state.fields.map(field => {\n      const current = state.assignments[field.id] ?? "";\n      const options = field.options.map(option => \`<button type="button" data-m6-index-field="\${this.escape(field.id)}" data-m6-index-option="\${this.escape(option.id)}" class="\${current === option.id ? "is-selected" : ""}" \${ready && !state.indexSolved ? "" : "disabled"}>\${this.escape(option.label)}</button>\`).join("");\n      return \`<article class="m6-index-row"><div><strong>\${this.escape(field.label)}</strong><code>\${this.escape(field.id)}</code></div><div>\${options}</div></article>\`;\n    }).join("");\n    const aligned = Object.keys(state.assignments).length;\n    const phase = state.indexSolved ? "INDEX STABLE" : ready ? \`ALIGNED \${aligned}/\${state.fields.length}\` : "EVIDENCE REQUIRED";\n    return \`<section class="m6-sea-index" aria-label="SEA 2017 cross-media index"><header><div><strong>SEA INDEX</strong><small>P12 // CROSS-MEDIA DEDUCTION</small></div><span>\${phase}</span></header><div class="m5-audit-progress"><span>BEACH \${state.physicalSeen}/\${state.totalPhysical}</span><span>INDEX FILES \${state.filesRead}/\${state.totalFiles}</span><span>ATTEMPTS \${state.indexAttempts}</span></div><p>\${state.indexSolved ? "Пять каналов согласованы. Финальный архив Морра смонтирован." : ready ? "Сопоставь дату, camera sequence, audio marker, tide marker и CREATE-order. Каждый выбор должен подтверждаться отдельным источником." : "Осмотри четыре невозможных детали пляжа и прочитай camera/audio/tide/directory index files. После этого выравнивание разблокируется."}</p><div class="m6-index-grid">\${rows}</div><div class="m6-inline-actions"><button type="button" data-m6-index-submit \${ready && !state.indexSolved && aligned === state.fields.length ? "" : "disabled"}>ALIGN INDEX</button><button type="button" data-m6-index-reset \${ready && !state.indexSolved && aligned ? "" : "disabled"}>RESET</button></div><output>\${this.escape(this.seaIndexMessage || state.message || phase)}</output></section>\`;\n  }\n\n`;
replaceOnce(
  '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState, backup41: Backup41MonitorState): string {',
  panels + '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState, backup41: Backup41MonitorState, sea2017: Sea2017MonitorState): string {',
  'sea panels methods'
);
replaceOnce(
  `    if (mode === "backup41") return backup41.solved\n      ? "VERA_4_1: provenance map separates telemetry, reconstruction and Morr notes before drawing incident conclusions."\n      : "P11 SOURCE RELIABILITY // classify what each witness can actually prove.";\n    if (inProcessMonitor)`,
  `    if (mode === "backup41") return backup41.solved\n      ? "VERA_4_1: provenance map separates telemetry, reconstruction and Morr notes before drawing incident conclusions."\n      : "P11 SOURCE RELIABILITY // classify what each witness can actually prove.";\n    if (mode === "sea2017") return sea2017.indexSolved\n      ? "SEA_2017: five cross-media channels agree; read Morr's final archive before leaving the memory."\n      : "P12 CROSS-MEDIA DEDUCTION // the beach is a memory index, not a literal recording.";\n    if (inProcessMonitor)`,
  'sea footer'
);

await writeFile(path, text);
