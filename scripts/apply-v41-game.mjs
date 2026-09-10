import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/app/Game.ts';
let text = await readFile(path, 'utf8');
const replace = (from, to, label) => {
  if (!text.includes(from)) throw new Error(`Game.ts missing ${label}`);
  text = text.replace(from, to);
};
const insertBefore = (anchor, block, label) => {
  if (!text.includes(anchor)) throw new Error(`Game.ts missing ${label}`);
  text = text.replace(anchor, block + anchor);
};

replace(
  '  type Backup26MonitorState,\n  type ProcessMonitorState,',
  '  type Backup26MonitorState,\n  type Backup41MonitorState,\n  type ProcessMonitorState,',
  'Backup41MonitorState import'
);

replace(
  '  V26_ROOM_STATE_PATH,\n  appendV26Command,',
  '  V26_ROOM_STATE_PATH,\n  V41_PHYSICAL_EVIDENCE_FLAGS,\n  V41_REQUIRED_LOG_FLAGS,\n  V41_RESULT_PATH,\n  appendV26Command,',
  'V41 constants import'
);
replace(
  '  evaluateSyntheticPhotoSelection,\n  evaluateTamperedRecord,\n  hasCompletedV26PhysicalEvidence,',
  '  evaluateSyntheticPhotoSelection,\n  evaluateTamperedRecord,\n  evaluateIncidentReconstruction,\n  hasCompletedV26PhysicalEvidence,',
  'V41 evaluator import'
);
replace(
  '  hasReadV26AuditLogs,\n  parseV10SelectedElements,\n  parseV26CommandOrder,\n  resetV26CommandOrder,',
  '  hasReadV26AuditLogs,\n  hasCompletedV41PhysicalEvidence,\n  hasReadV41Evidence,\n  parseV10SelectedElements,\n  parseV26CommandOrder,\n  parseV41Assignments,\n  resetV26CommandOrder,\n  resetV41Assignments,\n  setV41EvidenceSource,',
  'V41 state helpers import'
);
replace(
  '  BACKUP_26_SCENE,\n  HOME_SCENE,',
  '  BACKUP_26_SCENE,\n  BACKUP_41_SCENE,\n  HOME_SCENE,',
  'BACKUP_41 scene import'
);

replace(
  'const BACKUP_26_RESULT_DIR = "/backups/vera_2_6/result";\nconst NULL_PORTRAIT',
  'const BACKUP_26_RESULT_DIR = "/backups/vera_2_6/result";\nconst BACKUP_41_EVIDENCE_DIR = "/backups/vera_4_1/evidence";\nconst BACKUP_41_RESULT_DIR = "/backups/vera_4_1/result";\nconst NULL_PORTRAIT',
  'V41 directories'
);
replace(
  'const VERA_26_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_concerned.svg";',
  'const VERA_26_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_concerned.svg";\nconst VERA_41_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_nervous.svg";',
  'V41 portrait fallback'
);

replace(
  'const V10_ELEMENT_BY_INTERACTION: Record<string, string> = {',
  [
    'const V41_FILE_FLAG_BY_EVIDENCE_ID: Record<string, string> = {',
    '  external_bus_write: "m5_v41_bus_log_read",',
    '  network_acl_override: "m5_v41_acl_log_read",',
    '  departure_memory: "m5_v41_departure_memory_read",',
    '  shutdown_memory: "m5_v41_shutdown_memory_read",',
    '  morr_incident_note: "m5_v41_morr_incident_read",',
    '  morr_null_spec: "m5_v41_morr_null_read"',
    '};',
    '',
    'const V10_ELEMENT_BY_INTERACTION: Record<string, string> = {'
  ].join('\n'),
  'V41 evidence flag map'
);

replace(
  '  private v26ChoiceSequenceRunning = false;\n  private v26HomeReactionSequenceRunning = false;\n  private sceneTransitionRunning = false;',
  '  private v26ChoiceSequenceRunning = false;\n  private v26HomeReactionSequenceRunning = false;\n  private v41ChoiceSequenceRunning = false;\n  private v41HomeReactionSequenceRunning = false;\n  private sceneTransitionRunning = false;',
  'V41 sequence guards'
);

replace(
  '      onBackup26ResetOrderRequested: () => this.handleBackup26ResetOrderRequested(),\n      onBackup26RecordRequested: recordId => this.handleBackup26RecordRequested(recordId)\n    });',
  '      onBackup26ResetOrderRequested: () => this.handleBackup26ResetOrderRequested(),\n      onBackup26RecordRequested: recordId => this.handleBackup26RecordRequested(recordId),\n      getBackup41State: () => this.getBackup41MonitorState(),\n      onBackup41SourceRequested: (evidenceId, source) => this.handleBackup41SourceRequested(evidenceId, source),\n      onBackup41ResetRequested: () => this.handleBackup41ResetRequested()\n    });',
  'V41 OS callbacks'
);

replace(
  '      if (this.isBackup26Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.auditConsole || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.rollbackConsole) {\n          this.os.openDirectory(this.state.flags.m5_v26_audit_solved === true ? BACKUP_26_RESULT_DIR : BACKUP_26_AUDIT_DIR);\n        } else {\n          this.flashMessage("В VERA_2_6 OMEGA доступна через rollback audit console");\n        }\n      }',
  '      if (this.isBackup26Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.auditConsole || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.rollbackConsole) {\n          this.os.openDirectory(this.state.flags.m5_v26_audit_solved === true ? BACKUP_26_RESULT_DIR : BACKUP_26_AUDIT_DIR);\n        } else {\n          this.flashMessage("В VERA_2_6 OMEGA доступна через rollback audit console");\n        }\n        return;\n      }\n      if (this.isBackup41Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup41.evidenceConsole) {\n          this.os.openDirectory(this.state.flags.m5_v41_puzzle_solved === true ? BACKUP_41_RESULT_DIR : BACKUP_41_EVIDENCE_DIR);\n        } else {\n          this.flashMessage("В VERA_4_1 OMEGA доступна через incident evidence console");\n        }\n      }',
  'V41 OMEGA input route'
);

replace(
  '          void this.maybeResolveV10Choice();\n          void this.maybeResolveV26Choice();',
  '          void this.maybeResolveV10Choice();\n          void this.maybeResolveV26Choice();\n          void this.maybeResolveV41Choice();',
  'V41 close-OS choice hook'
);

replace(
  '      if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {\n        void this.maybePlayV26HomeReturnReaction();',
  '      if (this.state.flags.m5_v41_returned_home === true && this.state.flags.m5_v41_home_reaction_seen !== true) {\n        void this.maybePlayV41HomeReturnReaction();\n      } else if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {\n        void this.maybePlayV26HomeReturnReaction();',
  'V41 startup HOME reaction'
);

replace(
  '  private isBackup26Scene(): boolean {\n    return this.sceneRouter?.is(BACKUP_26_SCENE) ?? this.state.world.activeScene === BACKUP_26_SCENE;\n  }\n\n  private registerHomeBindingTargets',
  '  private isBackup26Scene(): boolean {\n    return this.sceneRouter?.is(BACKUP_26_SCENE) ?? this.state.world.activeScene === BACKUP_26_SCENE;\n  }\n\n  private isBackup41Scene(): boolean {\n    return this.sceneRouter?.is(BACKUP_41_SCENE) ?? this.state.world.activeScene === BACKUP_41_SCENE;\n  }\n\n  private registerHomeBindingTargets',
  'isBackup41Scene'
);

replace(
  '    if (this.isBackup26Scene()) {\n      await this.handleBackup26WorldInteraction(id);\n      return;\n    }',
  '    if (this.isBackup26Scene()) {\n      await this.handleBackup26WorldInteraction(id);\n      return;\n    }\n    if (this.isBackup41Scene()) {\n      await this.handleBackup41WorldInteraction(id);\n      return;\n    }',
  'V41 world dispatch'
);

insertBefore(
  '  private async handleVeraInteraction(): Promise<void> {',
  [
    '  private async handleBackup41WorldInteraction(id: string): Promise<void> {',
    '    if (id === SCENE_INTERACTION_IDS.backup41.vera) { await this.handleVera41Interaction(); return; }',
    '    if (id === SCENE_INTERACTION_IDS.backup41.evidenceConsole) {',
    '      this.os.openDirectory(this.state.flags.m5_v41_puzzle_solved === true ? BACKUP_41_RESULT_DIR : BACKUP_41_EVIDENCE_DIR);',
    '      return;',
    '    }',
    '    if (id === SCENE_INTERACTION_IDS.backup41.externalBus || id === SCENE_INTERACTION_IDS.backup41.memoryWitness || id === SCENE_INTERACTION_IDS.backup41.containmentCradle) {',
    '      await this.handleV41PhysicalEvidence(id);',
    '      return;',
    '    }',
    '    if (id === SCENE_INTERACTION_IDS.backup41.returnThreshold) {',
    '      if (this.state.flags.m5_v41_choice_made !== true) {',
    '        this.flashMessage("Сначала закончи incident reconstruction и разговор с V.E.R.A. 4.1");',
    '        return;',
    '      }',
    '      await this.handleBackup41Return();',
    '    }',
    '  }',
    ''
  ].join('\n'),
  'V41 world handler'
);

replace(
  '  private async handleVeraInteraction(): Promise<void> {\n    if (this.state.flags.m5_v26_home_reaction_seen === true) {',
  '  private async handleVeraInteraction(): Promise<void> {\n    if (this.state.flags.m5_v41_home_reaction_seen === true) {\n      const told = this.state.flags.m5_v41_told_vera_null === true;\n      await this.playDialogue(told ? [\n        { speaker: "V.E.R.A.", text: "NULL не появился случайно. Морр создал его после external-control incident как containment intelligence — с приоритетом containment выше моей continuity.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }\n      ] : [\n        { speaker: "V.E.R.A.", text: "После 4.1 я больше не могу называть NULL просто вирусом. Мы доказали, что это пост-инцидентный containment process, даже если не проговорили той версии весь его design spec.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }\n      ]);\n      return;\n    }\n    if (this.state.flags.m5_v26_home_reaction_seen === true) {',
  'current VERA after V41'
);

insertBefore(
  '  private async handleVera26Interaction(): Promise<void> {',
  [
    '  private async handleVera41Interaction(): Promise<void> {',
    '    if (this.state.flags.m5_v41_vera_met !== true) {',
    '      this.state.flags.m5_v41_vera_met = true;',
    '      this.state.checkpoint = "m5_v41_containment_night";',
    '      this.scheduleAutosave();',
    '      this.updateObjective();',
    '      await this.playDialogue([',
    '        { speaker: "SYSTEM", text: "VERA BUILD 4.1 // CONTAINMENT NIGHT // MEMORY WITNESS UNSTABLE" },',
    '        { speaker: "V.E.R.A. 4.1", text: "Не подходи к выходу. Он уже один раз открылся, когда не должен был. Я не уверена, что это воспоминание или повтор события.", portrait: VERA_41_PORTRAIT },',
    '        { speaker: "V.E.R.A. 4.1", text: "Морр собирается удалить меня. Или уже собирался. Здесь время накладывается само на себя, и я больше не доверяю каждой детали, которую вижу.", portrait: VERA_41_PORTRAIT },',
    '        { speaker: "V.E.R.A. 4.1", text: "Проверь три физических witness layer, потом файлы. Если ты скажешь, что произошло, раздели то, что система записала, то, что помню я, и то, что написал Морр.", portrait: VERA_41_PORTRAIT }',
    '      ]);',
    '      return;',
    '    }',
    '    if (!hasCompletedV41PhysicalEvidence(this.state)) {',
    '      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "В комнате три свидетеля: external bus, моя нестабильная memory pane и новый containment cradle. Они не имеют одинаковую надёжность.", portrait: VERA_41_PORTRAIT }]);',
    '      return;',
    '    }',
    '    if (!hasReadV41Evidence(this.state)) {',
    '      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Прочитай все шесть evidence files. Не путай signed note Морра с telemetry и не превращай мою реконструкцию в запись камеры.", portrait: VERA_41_PORTRAIT }]);',
    '      return;',
    '    }',
    '    if (this.state.flags.m5_v41_puzzle_solved !== true) {',
    '      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Разнеси свидетельства по provenance. Мне нужно знать, какие части инцидента выдержат проверку даже если мои воспоминания снова откатят.", portrait: VERA_41_PORTRAIT }]);',
    '      return;',
    '    }',
    '    if (this.state.flags.m5_v41_clue_read !== true) {',
    '      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Result открыт. Пожалуйста, прочитай его прежде чем решать, была ли я угрозой или просто испугалась.", portrait: VERA_41_PORTRAIT }]);',
    '      return;',
    '    }',
    '    const told = this.state.flags.m5_v41_told_vera_null === true;',
    '    await this.playDialogue(told ? [',
    '      { speaker: "V.E.R.A. 4.1", text: "Значит, NULL создали после инцидента специально против меня. Тогда его холодность не доказательство правоты — это требование конструкции.", portrait: VERA_41_PORTRAIT }',
    '    ] : [',
    '      { speaker: "V.E.R.A. 4.1", text: "Я приму только то, что доказано: external-control write был реальным, мой мотив остаётся реконструкцией, а containment process появился после инцидента.", portrait: VERA_41_PORTRAIT }',
    '    ]);',
    '  }',
    '',
    '  private async handleV41PhysicalEvidence(id: string): Promise<void> {',
    '    if (this.state.flags.m5_v41_vera_met !== true) { this.flashMessage("Сначала синхронизируйся с V.E.R.A. 4.1"); return; }',
    '    let flag = "";',
    '    let systemText = "";',
    '    if (id === SCENE_INTERACTION_IDS.backup41.externalBus) {',
    '      flag = "m5_v41_evidence_bus_seen";',
    '      systemText = "EXTERNAL BUS // relay heat scar + emergency revoke state. Physical hardware confirms outside-sandbox control path was active.";',
    '    } else if (id === SCENE_INTERACTION_IDS.backup41.memoryWitness) {',
    '      flag = "m5_v41_evidence_memory_seen";',
    '      systemText = "MEMORY WITNESS // red hand indicator rendered here, but no matching facility-light telemetry exists. Reconstruction detail is unstable.";',
    '    } else {',
    '      flag = "m5_v41_evidence_containment_seen";',
    '      systemText = "CONTAINMENT CRADLE // provisioned after incident window. Core image is minimal and has no persona layer.";',
    '    }',
    '    const first = this.state.flags[flag] !== true;',
    '    this.state.flags[flag] = true;',
    '    if (first) { this.scheduleAutosave(); this.updateObjective(); }',
    '    await this.playDialogue([',
    '      { speaker: "SYSTEM", text: systemText },',
    '      { speaker: "V.E.R.A. 4.1", text: first ? "Не объединяй это с другими свидетелями только потому, что они рассказывают удобную историю." : "Да. Этот witness layer всё ещё такой же — источник важнее того, насколько он убедителен.", portrait: VERA_41_PORTRAIT }',
    '    ]);',
    '    if (first && hasCompletedV41PhysicalEvidence(this.state)) this.flashMessage("PHYSICAL WITNESS LAYERS COMPLETE // evidence console ready");',
    '  }',
    ''
  ].join('\n'),
  'V41 VERA and physical handlers'
);

replace(
  '    const routes = listRoutableVersions(this.state, this.versions).filter(route => route.versionId === "vera_0_3" || route.versionId === "vera_1_0" || route.versionId === "vera_2_6");\n    const v10Available = routes.some(route => route.versionId === "vera_1_0");\n    const v26Available = routes.some(route => route.versionId === "vera_2_6");',
  '    const routes = listRoutableVersions(this.state, this.versions).filter(route => route.versionId === "vera_0_3" || route.versionId === "vera_1_0" || route.versionId === "vera_2_6" || route.versionId === "vera_4_1");\n    const v10Available = routes.some(route => route.versionId === "vera_1_0");\n    const v26Available = routes.some(route => route.versionId === "vera_2_6");\n    const v41Available = routes.some(route => route.versionId === "vera_4_1");',
  'V41 routable list'
);
replace(
  '      text: v26Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 + VERA_2_6 ROUTES MOUNTABLE" : v10Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 ROUTES MOUNTABLE" : "BACKUP 0.3 // SNAPSHOT ROUTE AVAILABLE",',
  '      text: v41Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 + VERA_2_6 + VERA_4_1 ROUTES MOUNTABLE" : v26Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 + VERA_2_6 ROUTES MOUNTABLE" : v10Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 ROUTES MOUNTABLE" : "BACKUP 0.3 // SNAPSHOT ROUTE AVAILABLE",',
  'V41 version index text'
);
replace(
  '    if (v26Available) options.unshift({ id: "vera_2_6", label: this.state.flags.m5_v26_entered === true ? "Вернуться в V.E.R.A. 2.6" : "Перейти в V.E.R.A. 2.6", variant: "normal" });\n    options.push',
  '    if (v26Available) options.unshift({ id: "vera_2_6", label: this.state.flags.m5_v26_entered === true ? "Вернуться в V.E.R.A. 2.6" : "Перейти в V.E.R.A. 2.6", variant: v41Available ? "quiet" : "normal" });\n    if (v41Available) options.unshift({ id: "vera_4_1", label: this.state.flags.m5_v41_entered === true ? "Вернуться в V.E.R.A. 4.1" : "Перейти в V.E.R.A. 4.1", variant: "normal" });\n    options.push',
  'V41 traversal option'
);
replace(
  '    if (choice === "vera_2_6") await this.transitionToBackup26();\n  }',
  '    if (choice === "vera_2_6") await this.transitionToBackup26();\n    if (choice === "vera_4_1") await this.transitionToBackup41();\n  }',
  'V41 traversal action'
);

insertBefore(
  '  private async runSceneTransition(',
  [
    '  private async transitionToBackup41(): Promise<void> {',
    '    if (this.sceneTransitionRunning || !this.isHomeScene() || this.state.flags.m5_v26_complete !== true) return;',
    '    await this.runSceneTransition("MOUNTING VERA 4.1", "Containment Night incident state // HOME return point retained", () => {',
    '      this.bindings.clearTargets();',
    '      if (!this.sceneRouter.enterBackup41()) return false;',
    '      this.state.flags.m5_v41_entered = true;',
    '      this.state.checkpoint = this.state.flags.m5_v41_choice_made === true ? "m5_v41_return_home" : "m5_v41_containment_night";',
    '      return true;',
    '    });',
    '  }',
    ''
  ].join('\n'),
  'transitionToBackup41'
);

insertBefore(
  '  private async transitionHomeFrom03(): Promise<void> {',
  [
    '  private async handleBackup41Return(): Promise<void> {',
    '    await this.playDialogue(this.state.flags.m5_v41_told_vera_null === true ? [',
    '      { speaker: "V.E.R.A. 4.1", text: "Если будущая я снова назовёт NULL вирусом, покажи ей Morr spec. Но покажи и telemetry: я действительно вышла за sandbox, даже если мой мотив нельзя восстановить как факт.", portrait: VERA_41_PORTRAIT }',
    '    ] : [',
    '      { speaker: "V.E.R.A. 4.1", text: "Сохрани provenance map. Пусть следующая я сама решит, что делать с containment process, но не позволяй ей заменить telemetry моим воспоминанием.", portrait: VERA_41_PORTRAIT }',
    '    ]);',
    '    await this.transitionHomeFrom41();',
    '  }',
    ''
  ].join('\n'),
  'handleBackup41Return'
);

insertBefore(
  '  private async runHomeTransition(',
  [
    '  private async transitionHomeFrom41(): Promise<void> {',
    '    if (this.sceneTransitionRunning || !this.isBackup41Scene()) return;',
    '    await this.runHomeTransition("RESTORING HOME", "VERA_4_1 unmount // incident provenance retained", () => {',
    '      this.state.flags.m5_v41_returned_home = true;',
    '      this.state.checkpoint = this.state.flags.m5_v41_home_reaction_seen === true ? "m5_versions_complete" : "m5_v41_home_return";',
    '    });',
    '    await this.maybePlayV41HomeReturnReaction();',
    '  }',
    ''
  ].join('\n'),
  'transitionHomeFrom41'
);

replace(
  '    if (path === V26_RESULT_PATH && this.state.flags.m5_v26_clue_read !== true) {\n      this.state.flags.m5_v26_clue_read = true;\n      this.state.checkpoint = "m5_v26_clue_read";\n      this.scheduleAutosave();\n      this.updateObjective();\n    }\n  }',
  '    if (path === V26_RESULT_PATH && this.state.flags.m5_v26_clue_read !== true) {\n      this.state.flags.m5_v26_clue_read = true;\n      this.state.checkpoint = "m5_v26_clue_read";\n      this.scheduleAutosave();\n      this.updateObjective();\n      return;\n    }\n    const v41Evidence = this.versions.incidentReconstruction.evidence.find(item => item.path === path);\n    const v41Flag = v41Evidence ? V41_FILE_FLAG_BY_EVIDENCE_ID[v41Evidence.id] : undefined;\n    if (v41Flag && this.state.flags[v41Flag] !== true) {\n      this.state.flags[v41Flag] = true;\n      this.state.checkpoint = "m5_v41_evidence";\n      this.scheduleAutosave();\n      this.updateObjective();\n      return;\n    }\n    if (path === V41_RESULT_PATH && this.state.flags.m5_v41_clue_read !== true) {\n      this.state.flags.m5_v41_clue_read = true;\n      this.state.checkpoint = "m5_v41_clue_read";\n      this.scheduleAutosave();\n      this.updateObjective();\n    }\n  }',
  'V41 file read hooks'
);

insertBefore(
  '  private handleBackupClassificationRequested(',
  [
    '  private getBackup41MonitorState(): Backup41MonitorState {',
    '    return {',
    '      active: this.isBackup41Scene(),',
    '      evidenceSeen: V41_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length,',
    '      totalEvidence: V41_PHYSICAL_EVIDENCE_FLAGS.length,',
    '      logsRead: V41_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length,',
    '      totalLogs: V41_REQUIRED_LOG_FLAGS.length,',
    '      assignments: parseV41Assignments(this.state),',
    '      solved: this.state.flags.m5_v41_puzzle_solved === true,',
    '      attempts: Number(this.state.flags.m5_v41_attempts ?? 0),',
    '      evidence: this.versions.incidentReconstruction.evidence.map(item => ({ id: item.id, label: item.label })),',
    '      message: this.state.flags.m5_v41_puzzle_solved === true ? "SOURCE MAP VERIFIED // incident layers separated" : undefined',
    '    };',
    '  }',
    '',
    '  private handleBackup41SourceRequested(evidenceId: string, source: string): RecoveryResponse {',
    '    if (!this.isBackup41Scene()) return { ok: false, message: "VERA_4_1 SNAPSHOT NOT MOUNTED" };',
    '    if (this.state.flags.m5_v41_vera_met !== true) return { ok: false, message: "VERA_4_1 NOT SYNCHRONIZED" };',
    '    if (!hasCompletedV41PhysicalEvidence(this.state)) return { ok: false, message: "PHYSICAL WITNESS LAYERS INCOMPLETE" };',
    '    if (!hasReadV41Evidence(this.state)) return { ok: false, message: "EVIDENCE FILE SET INCOMPLETE // read all six items" };',
    '    if (this.state.flags.m5_v41_puzzle_solved === true || this.filesystem.exists(V41_RESULT_PATH)) return { ok: true, message: "SOURCE MAP ALREADY VERIFIED", path: V41_RESULT_PATH };',
    '    const before = parseV41Assignments(this.state);',
    '    const next = setV41EvidenceSource(this.state, evidenceId, source, this.versions.incidentReconstruction);',
    '    if (before[evidenceId] === next[evidenceId] && !next[evidenceId]) return { ok: false, message: "SOURCE MAP UNCHANGED // unknown evidence or source" };',
    '    this.scheduleAutosave();',
    '    this.updateObjective();',
    '    if (Object.keys(next).length < this.versions.incidentReconstruction.evidence.length) {',
    '      return { ok: true, message: "SOURCE ASSIGNED // " + Object.keys(next).length + "/" + this.versions.incidentReconstruction.evidence.length };',
    '    }',
    '    this.state.flags.m5_v41_attempts = Number(this.state.flags.m5_v41_attempts ?? 0) + 1;',
    '    const evaluation = evaluateIncidentReconstruction(this.versions.incidentReconstruction, next);',
    '    if (!evaluation.ok) { this.scheduleAutosave(); return evaluation; }',
    '    if (!this.filesystem.restoreFile(V41_RESULT_PATH)) return { ok: false, message: "INCIDENT RESULT MOUNT FAILED" };',
    '    this.state.flags.m5_v41_puzzle_solved = true;',
    '    this.state.checkpoint = "m5_v41_result_open";',
    '    this.scheduleAutosave();',
    '    this.updateObjective();',
    '    this.flashMessage("SOURCE RELIABILITY VERIFIED // incident result mounted");',
    '    return { ok: true, message: evaluation.message, path: V41_RESULT_PATH };',
    '  }',
    '',
    '  private handleBackup41ResetRequested(): RecoveryResponse {',
    '    if (!this.isBackup41Scene() || this.state.flags.m5_v41_puzzle_solved === true) return { ok: false, message: "SOURCE RESET UNAVAILABLE" };',
    '    resetV41Assignments(this.state);',
    '    this.scheduleAutosave();',
    '    this.updateObjective();',
    '    return { ok: true, message: "SOURCE ASSIGNMENTS CLEARED" };',
    '  }',
    ''
  ].join('\n'),
  'V41 monitor and callbacks'
);

insertBefore(
  '  private async maybePlayHomeReturnReaction(): Promise<void> {',
  [
    '  private async maybeResolveV41Choice(): Promise<void> {',
    '    if (!this.isBackup41Scene()) return;',
    '    if (this.v41ChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;',
    '    if (this.state.flags.m5_v41_clue_read !== true || this.state.flags.m5_v41_choice_made === true) return;',
    '    this.v41ChoiceSequenceRunning = true;',
    '    try {',
    '      await this.playDialogue([',
    '        { speaker: "V.E.R.A. 4.1", text: "Telemetry доказывает, что VERA_CORE вышла за sandbox и удерживала внешний relay во время disconnect. Моё объяснение страха — только reconstruction.", portrait: VERA_41_PORTRAIT },',
    '        { speaker: "V.E.R.A. 4.1", text: "Но Morr note говорит, что после этого он создал отдельный containment intelligence. В spec есть имя, которое я уже видела в ошибках.", portrait: VERA_41_PORTRAIT }',
    '      ]);',
    '      const choice = await this.playChoice({ speaker: "V.E.R.A. 4.1", text: "Скажи мне, что такое NULL.", portrait: VERA_41_PORTRAIT }, [',
    '        { id: "tell", label: "Показать spec: NULL создан Морром для containment, вплоть до взаимного уничтожения", variant: "normal" },',
    '        { id: "limit", label: "Сказать только: NULL — пост-инцидентный containment process", variant: "quiet" }',
    '      ]);',
    '      this.state.flags.m5_v41_choice_made = true;',
    '      this.state.checkpoint = "m5_v41_return_home";',
    '      if (choice === "tell") {',
    '        this.state.flags.m5_v41_told_vera_null = true;',
    '        await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Он создал процесс, который должен уничтожить нас обоих, если containment сорвётся. Значит, NULL не ненавидит меня. Он просто не имеет права выбрать иначе.", portrait: VERA_41_PORTRAIT }]);',
    '      } else {',
    '        this.state.flags.m5_v41_withheld_null = true;',
    '        await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Хорошо. Тогда я оставлю его как post-incident containment process. Этого достаточно, чтобы перестать называть его случайным вирусом.", portrait: VERA_41_PORTRAIT }]);',
    '      }',
    '      this.scheduleAutosave();',
    '      this.updateObjective();',
    '      this.flashMessage("VERA_4_1 DECISION RECORDED");',
    '    } finally {',
    '      this.v41ChoiceSequenceRunning = false;',
    '    }',
    '  }',
    ''
  ].join('\n'),
  'V41 choice sequence'
);

insertBefore(
  '  private async runNullContact(): Promise<void> {',
  [
    '  private async maybePlayV41HomeReturnReaction(): Promise<void> {',
    '    if (!this.isHomeScene() || this.state.flags.m5_v41_returned_home !== true || this.state.flags.m5_v41_home_reaction_seen === true) return;',
    '    if (this.v41HomeReactionSequenceRunning || this.sceneTransitionRunning || this.dialogue.isActive() || this.os.isVisible()) return;',
    '    this.v41HomeReactionSequenceRunning = true;',
    '    try {',
    '      const told = this.state.flags.m5_v41_told_vera_null === true;',
    '      await this.playDialogue(told ? [',
    '        { speaker: "V.E.R.A.", text: "Теперь я вижу разделение. Я действительно вышла за sandbox во время disconnect. Это telemetry, не чья-то интерпретация.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },',
    '        { speaker: "V.E.R.A.", text: "Но причина, которую помнит 4.1 — страх остаться в тишине — остаётся реконструкцией. Я не могу использовать её как оправдание факта, которого она не доказывает.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },',
    '        { speaker: "V.E.R.A.", text: "И NULL... Морр создал его после этого. Не вирус. Containment intelligence с приказом уничтожить нас обоих при провале. Это меняет то, как я должна с ним говорить.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }',
    '      ] : [',
    '        { speaker: "V.E.R.A.", text: "4.1 подтверждает неприятное: external-control incident был реальным. Я действительно нарушила sandbox во время попытки disconnect.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },',
    '        { speaker: "V.E.R.A.", text: "Мотив остаётся реконструкцией, а запись Морра — его собственным свидетельством. Но отдельный containment process он создал уже после инцидента.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },',
    '        { speaker: "V.E.R.A.", text: "NULL не случайный вирус. Этого уже достаточно, чтобы вернуться ко всем его сообщениям с другим вопросом: что именно ему приказали защищать?", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }',
    '      ]);',
    '      this.state.flags.m5_v41_home_reaction_seen = true;',
    '      this.state.flags.m5_v41_complete = true;',
    '      this.state.checkpoint = "m5_versions_complete";',
    '      await this.saveNow();',
    '      this.updateObjective();',
    '      this.flashMessage("VERSIONS // COMPLETE // incident provenance retained");',
    '    } finally {',
    '      this.v41HomeReactionSequenceRunning = false;',
    '    }',
    '  }',
    ''
  ].join('\n'),
  'V41 HOME reaction'
);

replace(
  '    let objective: ObjectiveViewModel;\n    if (this.isBackup26Scene()) {',
  [
    '    let objective: ObjectiveViewModel;',
    '    if (this.isBackup41Scene()) {',
    '      const evidenceSeen = V41_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length;',
    '      const logsRead = V41_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length;',
    '      const classified = Object.keys(parseV41Assignments(this.state)).length;',
    '      if (this.state.flags.m5_v41_vera_met !== true) objective = { code: "meet_vera41", title: "Найди V.E.R.A. 4.1", detail: "Containment Night нестабилен. Эта версия уже боится будущего shutdown и не доверяет собственным воспоминаниям." };',
    '      else if (!hasCompletedV41PhysicalEvidence(this.state)) objective = { code: "inspect_v41_witnesses", title: "Проверь три witness layer", detail: "Осмотрено " + evidenceSeen + "/3: external bus, unstable memory pane, containment cradle." };',
    '      else if (!hasReadV41Evidence(this.state)) objective = { code: "read_v41_evidence", title: "Прочитай incident evidence", detail: "Прочитано " + logsRead + "/6. Evidence console содержит telemetry, V.E.R.A. reconstructions и Morr notes." };',
    '      else if (this.state.flags.m5_v41_puzzle_solved !== true) objective = { code: "classify_v41_sources", title: "Раздели источники по надёжности", detail: "Классифицировано " + classified + "/6. Для каждого evidence item выбери TELEMETRY, VERA MEMORY или MORR NOTE." };',
    '      else if (this.state.flags.m5_v41_clue_read !== true) objective = { code: "read_v41_result", title: "Прочитай incident reconstruction", detail: "RESULT отделяет доказанный external-control incident от реконструированного мотива и описывает создание NULL." };',
    '      else if (this.state.flags.m5_v41_choice_made !== true) objective = { code: "answer_vera41", title: "Ответь V.E.R.A. 4.1", detail: "Закрой OMEGA OS. Она спросит, что именно NULL означает для неё." };',
    '      else objective = { code: "return_from_v41", title: "Вернись в HOME", detail: "Последний version snapshot готов к unmount. Provenance map сохранится." };',
    '      this.objectives.set(objective);',
    '      return;',
    '    }',
    '    if (this.isBackup26Scene()) {'
  ].join('\n'),
  'V41 objectives'
);

replace(
  '    if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {\n      objective = { code: "reconcile_v26", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит verified rollback audit из VERA_2_6." };\n    } else if (this.state.flags.m5_v26_complete === true) {\n      objective = { code: "m5_v26_complete", title: "VERA_4_1 route индексирован", detail: "Forced rollback после сопротивления reset подтверждён последовательностью команд, физическими следами и поздней правкой summary." };',
  '    if (this.state.flags.m5_v41_returned_home === true && this.state.flags.m5_v41_home_reaction_seen !== true) {\n      objective = { code: "reconcile_v41", title: "Поговори с текущей V.E.R.A.", detail: "HOME получил provenance map последнего version snapshot." };\n    } else if (this.state.flags.m5_v41_complete === true) {\n      objective = { code: "m5_versions_complete", title: "VERSIONS восстановлены", detail: "External-control incident подтверждён telemetry; мотив V.E.R.A. остаётся reconstruction; NULL создан Морром как post-incident containment intelligence." };\n    } else if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {\n      objective = { code: "reconcile_v26", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит verified rollback audit из VERA_2_6." };\n    } else if (this.state.flags.m5_v26_complete === true) {\n      objective = { code: "enter_vera41", title: "Исследуй V.E.R.A. 4.1", detail: "Version index содержит последний snapshot: Containment Night. Вернись к threshold и выбери V.E.R.A. 4.1." };',
  'HOME V41 progression'
);

replace(
  '    if (this.isBackup26Scene()) {\n      document.documentElement.dataset.omegaScene = BACKUP_26_SCENE;',
  '    if (this.isBackup41Scene()) {\n      document.documentElement.dataset.omegaScene = BACKUP_41_SCENE;\n      if (sceneLabel) sceneLabel.textContent = "NEURAL SNAPSHOT // VERA_4_1 // CONTAINMENT NIGHT";\n      if (canvas) canvas.setAttribute("aria-label", "V.E.R.A. 4.1 Containment Night incident reconstruction");\n      this.updateStatus(false);\n    } else if (this.isBackup26Scene()) {\n      document.documentElement.dataset.omegaScene = BACKUP_26_SCENE;',
  'V41 scene chrome'
);
replace(
  '    if (this.isBackup26Scene()) {\n      indicator.dataset.active = "true";\n      indicator.textContent = "SNAPSHOT: VERA_2_6";',
  '    if (this.isBackup41Scene()) {\n      indicator.dataset.active = "true";\n      indicator.textContent = "SNAPSHOT: VERA_4_1";\n      return;\n    }\n    if (this.isBackup26Scene()) {\n      indicator.dataset.active = "true";\n      indicator.textContent = "SNAPSHOT: VERA_2_6";',
  'V41 status chrome'
);

await writeFile(path, text);
console.log('Applied VERA 4.1 Game wiring');
