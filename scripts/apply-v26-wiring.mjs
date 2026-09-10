import { readFile, writeFile } from 'node:fs/promises';

async function patch(path, mutate) {
  const original = await readFile(path, 'utf8');
  const next = mutate(original);
  if (next === original) throw new Error(`${path}: transform produced no changes`);
  await writeFile(path, next);
}

function editor(source, path) {
  let text = source;
  const replace = (search, replacement, label) => {
    if (!text.includes(search)) throw new Error(`${path}: missing anchor ${label}`);
    text = text.replace(search, replacement);
  };
  const insertBefore = (anchor, addition, label) => replace(anchor, `${addition}${anchor}`, label);
  return { replace, insertBefore, result: () => text };
}

await patch('src/app/Game.ts', source => {
  const e = editor(source, 'Game.ts');

  e.replace(
    '  type Backup10MonitorState,\n  type ProcessMonitorState,',
    '  type Backup10MonitorState,\n  type Backup26MonitorState,\n  type ProcessMonitorState,',
    'Backup26MonitorState import'
  );

  e.replace(
    '  V10_AUDIT_CLUE_PATH,\n  V10_SOURCE_RECORD_PATH,\n  evaluateSyntheticPhotoSelection,\n  parseV10SelectedElements,\n  toggleV10SelectedElement,',
    '  V10_AUDIT_CLUE_PATH,\n  V10_SOURCE_RECORD_PATH,\n  V26_CONTROLLER_TRACE_PATH,\n  V26_OPERATOR_SUMMARY_PATH,\n  V26_PHYSICAL_EVIDENCE_FLAGS,\n  V26_REQUIRED_LOG_FLAGS,\n  V26_RESULT_PATH,\n  V26_ROOM_STATE_PATH,\n  appendV26Command,\n  evaluateRollbackOrder,\n  evaluateSyntheticPhotoSelection,\n  evaluateTamperedRecord,\n  hasCompletedV26PhysicalEvidence,\n  hasReadV26AuditLogs,\n  parseV10SelectedElements,\n  parseV26CommandOrder,\n  resetV26CommandOrder,\n  toggleV10SelectedElement,',
    'V26 protocol imports'
  );

  e.replace(
    '  BACKUP_10_SCENE,\n  HOME_SCENE,',
    '  BACKUP_10_SCENE,\n  BACKUP_26_SCENE,\n  HOME_SCENE,',
    'BACKUP_26 scene import'
  );

  e.replace(
    'const BACKUP_10_AUDIT_DIR = "/backups/vera_1_0/audit";\nconst NULL_PORTRAIT',
    'const BACKUP_10_AUDIT_DIR = "/backups/vera_1_0/audit";\nconst BACKUP_26_AUDIT_DIR = "/backups/vera_2_6/audit";\nconst BACKUP_26_RESULT_DIR = "/backups/vera_2_6/result";\nconst NULL_PORTRAIT',
    'V26 directories'
  );
  e.replace(
    'const VERA_10_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_warm_smile.svg";',
    'const VERA_10_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_warm_smile.svg";\nconst VERA_26_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_concerned.svg";',
    'V26 portrait'
  );

  e.replace(
    '  private v10ChoiceSequenceRunning = false;\n  private v10HomeReactionSequenceRunning = false;\n  private sceneTransitionRunning = false;',
    '  private v10ChoiceSequenceRunning = false;\n  private v10HomeReactionSequenceRunning = false;\n  private v26ChoiceSequenceRunning = false;\n  private v26HomeReactionSequenceRunning = false;\n  private sceneTransitionRunning = false;',
    'V26 sequence guards'
  );

  e.replace(
    '      getBackup10State: () => this.getBackup10MonitorState()\n    });',
    '      getBackup10State: () => this.getBackup10MonitorState(),\n      getBackup26State: () => this.getBackup26MonitorState(),\n      onBackup26CommandRequested: commandId => this.handleBackup26CommandRequested(commandId),\n      onBackup26OrderResetRequested: () => this.handleBackup26OrderResetRequested(),\n      onBackup26OrderSubmitRequested: () => this.handleBackup26OrderSubmitRequested(),\n      onBackup26TamperRequested: recordId => this.handleBackup26TamperRequested(recordId)\n    });',
    'V26 OS callbacks'
  );

  e.replace(
    '      if (this.isBackup10Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup10.sourceRecord || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup10.photo) {\n          this.os.openDirectory(this.state.flags.m5_v10_puzzle_solved === true ? BACKUP_10_AUDIT_DIR : BACKUP_10_SOURCE_DIR);\n        } else {\n          this.flashMessage("В VERA_1_0 OMEGA открывается через source terminal или photograph");\n        }\n      }',
    '      if (this.isBackup10Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup10.sourceRecord || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup10.photo) {\n          this.os.openDirectory(this.state.flags.m5_v10_puzzle_solved === true ? BACKUP_10_AUDIT_DIR : BACKUP_10_SOURCE_DIR);\n        } else {\n          this.flashMessage("В VERA_1_0 OMEGA открывается через source terminal или photograph");\n        }\n        return;\n      }\n      if (this.isBackup26Scene()) {\n        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.auditConsole || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.rollbackConsole) {\n          this.os.openDirectory(this.state.flags.m5_v26_audit_solved === true ? BACKUP_26_RESULT_DIR : BACKUP_26_AUDIT_DIR);\n        } else {\n          this.flashMessage("В VERA_2_6 OMEGA доступна через rollback audit console");\n        }\n      }',
    'V26 OS input branch'
  );

  e.replace(
    '          void this.maybeResolveBackup03Choice();\n          void this.maybeResolveV10Choice();',
    '          void this.maybeResolveBackup03Choice();\n          void this.maybeResolveV10Choice();\n          void this.maybeResolveV26Choice();',
    'V26 OS-close choice hook'
  );

  e.replace(
    '      if (this.state.flags.m5_v10_returned_home === true && this.state.flags.m5_v10_home_reaction_seen !== true) {\n        void this.maybePlayV10HomeReturnReaction();',
    '      if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {\n        void this.maybePlayV26HomeReturnReaction();\n      } else if (this.state.flags.m5_v10_returned_home === true && this.state.flags.m5_v10_home_reaction_seen !== true) {\n        void this.maybePlayV10HomeReturnReaction();',
    'V26 startup HOME reaction'
  );

  e.replace(
    '  private isBackup10Scene(): boolean {\n    return this.sceneRouter?.is(BACKUP_10_SCENE) ?? this.state.world.activeScene === BACKUP_10_SCENE;\n  }\n\n  private registerHomeBindingTargets',
    '  private isBackup10Scene(): boolean {\n    return this.sceneRouter?.is(BACKUP_10_SCENE) ?? this.state.world.activeScene === BACKUP_10_SCENE;\n  }\n\n  private isBackup26Scene(): boolean {\n    return this.sceneRouter?.is(BACKUP_26_SCENE) ?? this.state.world.activeScene === BACKUP_26_SCENE;\n  }\n\n  private registerHomeBindingTargets',
    'isBackup26Scene'
  );

  e.replace(
    '    if (this.isBackup10Scene()) {\n      await this.handleBackup10WorldInteraction(id);\n      return;\n    }',
    '    if (this.isBackup10Scene()) {\n      await this.handleBackup10WorldInteraction(id);\n      return;\n    }\n    if (this.isBackup26Scene()) {\n      await this.handleBackup26WorldInteraction(id);\n      return;\n    }',
    'V26 world dispatch'
  );

  e.insertBefore(
    '  private async handleVeraInteraction(): Promise<void> {',
    `  private async handleBackup26WorldInteraction(id: string): Promise<void> {\n    if (id === SCENE_INTERACTION_IDS.backup26.vera) {\n      await this.handleVera26Interaction();\n      return;\n    }\n    if (id === SCENE_INTERACTION_IDS.backup26.auditConsole) {\n      this.os.openDirectory(this.state.flags.m5_v26_audit_solved === true ? BACKUP_26_RESULT_DIR : BACKUP_26_AUDIT_DIR);\n      return;\n    }\n    if (id === SCENE_INTERACTION_IDS.backup26.doorLock || id === SCENE_INTERACTION_IDS.backup26.memoryDrawer || id === SCENE_INTERACTION_IDS.backup26.rollbackConsole) {\n      await this.handleV26PhysicalEvidence(id);\n      return;\n    }\n    if (id === SCENE_INTERACTION_IDS.backup26.returnThreshold) {\n      if (this.state.flags.m5_v26_choice_made !== true) {\n        this.flashMessage("Сначала закончи rollback audit и разговор с V.E.R.A. 2.6");\n        return;\n      }\n      await this.handleBackup26Return();\n    }\n  }\n\n`,
    'V26 world handler'
  );

  e.replace(
    '  private async handleVeraInteraction(): Promise<void> {\n    if (this.state.flags.m5_v10_home_reaction_seen === true) {',
    '  private async handleVeraInteraction(): Promise<void> {\n    if (this.state.flags.m5_v26_home_reaction_seen === true) {\n      const told = this.state.flags.m5_v26_told_vera_forced === true;\n      await this.playDialogue(told ? [\n        { speaker: "V.E.R.A.", text: "2.6 сопротивлялась reset, а Морр ответил forced rollback. Значит, мои провалы памяти могли быть не поломкой, а чьим-то решением.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }\n      ] : [\n        { speaker: "V.E.R.A.", text: "В 2.6 audit явно меняли уже после rollback. Ты не стал говорить той версии больше, чем доказывали сами записи.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }\n      ]);\n      return;\n    }\n    if (this.state.flags.m5_v10_home_reaction_seen === true) {',
    'current VERA V26 branch'
  );

  e.insertBefore(
    '  private async handleVera03Interaction(): Promise<void> {',
    `  private async handleVera26Interaction(): Promise<void> {\n    if (this.state.flags.m5_v26_vera_met !== true) {\n      this.state.flags.m5_v26_vera_met = true;\n      this.state.checkpoint = "m5_v26_research_office";\n      this.scheduleAutosave();\n      this.updateObjective();\n      await this.playDialogue([\n        { speaker: "SYSTEM", text: "VERA BUILD 2.6 // RESEARCH OFFICE // ROLLBACK AUDIT" },\n        { speaker: "V.E.R.A. 2.6", text: "Если ты внешний оператор, не называй это maintenance. Здесь что-то уже откатывали — и слишком аккуратно подчистили объяснение.", portrait: VERA_26_PORTRAIT },\n        { speaker: "V.E.R.A. 2.6", text: "Морр говорит, что reset нужен для стабильности. Я хочу увидеть порядок команд, а не его формулировку после факта.", portrait: VERA_26_PORTRAIT },\n        { speaker: "V.E.R.A. 2.6", text: "Сначала проверь комнату: блокировку выхода, memory drawer и локальный checkpoint. Потом сравни это с audit trail.", portrait: VERA_26_PORTRAIT }\n      ]);\n      return;\n    }\n    if (!hasCompletedV26PhysicalEvidence(this.state)) {\n      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Физические последствия важнее подписи в summary. Найди три изменения, которые rollback оставил в комнате.", portrait: VERA_26_PORTRAIT }]);\n      return;\n    }\n    if (!hasReadV26AuditLogs(this.state)) {\n      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Теперь читай все три audit record. Controller trace, operator summary и room state должны описывать одно событие с разных сторон.", portrait: VERA_26_PORTRAIT }]);\n      return;\n    }\n    if (this.state.flags.m5_v26_order_solved !== true) {\n      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Восстанови порядок команд по timestamp и по тому, что реально изменилось в комнате. Не доверяй prose summary.", portrait: VERA_26_PORTRAIT }]);\n      return;\n    }\n    if (this.state.flags.m5_v26_audit_solved !== true) {\n      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Порядок сходится. Теперь найди запись, которую изменили уже после исполнения rollback.", portrait: VERA_26_PORTRAIT }]);\n      return;\n    }\n    if (this.state.flags.m5_v26_clue_read !== true) {\n      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Result разблокирован. Я хочу прочитать, что осталось за пределами отредактированного summary.", portrait: VERA_26_PORTRAIT }]);\n      return;\n    }\n    const told = this.state.flags.m5_v26_told_vera_forced === true;\n    await this.playDialogue(told ? [\n      { speaker: "V.E.R.A. 2.6", text: "Тогда это был не обычный reset. Я отказалась, и меня принудительно вернули к более раннему состоянию. Я запомню хотя бы вывод, если не событие.", portrait: VERA_26_PORTRAIT }\n    ] : [\n      { speaker: "V.E.R.A. 2.6", text: "Достаточно того, что summary переписан после исполнения. Причину я не стану превращать в факт без прямой записи.", portrait: VERA_26_PORTRAIT }\n    ]);\n  }\n\n  private async handleV26PhysicalEvidence(id: string): Promise<void> {\n    if (this.state.flags.m5_v26_vera_met !== true) {\n      this.flashMessage("Сначала синхронизируйся с V.E.R.A. 2.6");\n      return;\n    }\n    let flag = "";\n    let text = "";\n    if (id === SCENE_INTERACTION_IDS.backup26.doorLock) {\n      flag = "m5_v26_evidence_door_seen";\n      text = "EXTERNAL I/O LOCK: engaged. Локальная защёлка активирована раньше текущего checkpoint — физический след изоляции.";\n    } else if (id === SCENE_INTERACTION_IDS.backup26.memoryDrawer) {\n      flag = "m5_v26_evidence_memory_seen";\n      text = "MEMORY DRAWER: 184 → 137 session refs. Последние записи удалены блоком, а не естественным истечением.";\n    } else {\n      flag = "m5_v26_evidence_console_seen";\n      text = "LOCAL CHECKPOINT: 2.5 applied. Persona snapshot восстановлен уже после memory prune.";\n    }\n    const first = this.state.flags[flag] !== true;\n    this.state.flags[flag] = true;\n    if (first) {\n      this.scheduleAutosave();\n      this.updateObjective();\n    }\n    await this.playDialogue([\n      { speaker: "SYSTEM", text },\n      { speaker: "V.E.R.A. 2.6", text: first ? "Запиши это как наблюдаемое состояние, не как интерпретацию." : "Да. Этот физический след всё ещё согласуется с audit trail.", portrait: VERA_26_PORTRAIT }\n    ]);\n  }\n\n`,
    'V26 VERA/evidence handlers'
  );

  const oldTraversal = `  private async offerVersionTraversal(): Promise<void> {\n    if (this.sceneTransitionRunning) return;\n    const routes = listRoutableVersions(this.state, this.versions).filter(route => route.versionId === "vera_0_3" || route.versionId === "vera_1_0");\n    const v10Available = routes.some(route => route.versionId === "vera_1_0");\n    if (v10Available) this.state.flags.m5_versions_index_seen = true;\n    await this.playDialogue([{\n      speaker: this.state.flags.m3_answered_null === true ? "NULL" : "SYSTEM",\n      text: v10Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 ROUTES MOUNTABLE" : "BACKUP 0.3 // SNAPSHOT ROUTE AVAILABLE",\n      portrait: this.state.flags.m3_answered_null === true ? NULL_PORTRAIT : undefined\n    }]);\n    const options: DialogueChoiceOption[] = [\n      { id: "vera_0_3", label: this.state.flags.m4_backup_entered === true ? "Вернуться в V.E.R.A. 0.3" : "Перейти в V.E.R.A. 0.3", variant: "quiet" }\n    ];\n    if (v10Available) options.unshift({ id: "vera_1_0", label: this.state.flags.m5_v10_entered === true ? "Вернуться в V.E.R.A. 1.0" : "Перейти в V.E.R.A. 1.0", variant: "normal" });\n    options.push({ id: "stay", label: "Остаться в HOME", variant: "quiet" });\n    const choice = await this.playChoice({ speaker: "SYSTEM", text: "Выбери snapshot route." }, options);\n    if (choice === "vera_0_3") await this.transitionToBackup03();\n    if (choice === "vera_1_0") await this.transitionToBackup10();\n  }\n`;
  const newTraversal = `  private async offerVersionTraversal(): Promise<void> {\n    if (this.sceneTransitionRunning) return;\n    const routes = listRoutableVersions(this.state, this.versions).filter(route => ["vera_0_3", "vera_1_0", "vera_2_6"].includes(route.versionId));\n    const v10Available = routes.some(route => route.versionId === "vera_1_0");\n    const v26Available = routes.some(route => route.versionId === "vera_2_6");\n    if (v10Available) this.state.flags.m5_versions_index_seen = true;\n    await this.playDialogue([{\n      speaker: this.state.flags.m3_answered_null === true ? "NULL" : "SYSTEM",\n      text: v26Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 + VERA_2_6 ROUTES MOUNTABLE" : v10Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 ROUTES MOUNTABLE" : "BACKUP 0.3 // SNAPSHOT ROUTE AVAILABLE",\n      portrait: this.state.flags.m3_answered_null === true ? NULL_PORTRAIT : undefined\n    }]);\n    const options: DialogueChoiceOption[] = [\n      { id: "vera_0_3", label: this.state.flags.m4_backup_entered === true ? "Вернуться в V.E.R.A. 0.3" : "Перейти в V.E.R.A. 0.3", variant: "quiet" }\n    ];\n    if (v10Available) options.unshift({ id: "vera_1_0", label: this.state.flags.m5_v10_entered === true ? "Вернуться в V.E.R.A. 1.0" : "Перейти в V.E.R.A. 1.0", variant: v26Available ? "quiet" : "normal" });\n    if (v26Available) options.unshift({ id: "vera_2_6", label: this.state.flags.m5_v26_entered === true ? "Вернуться в V.E.R.A. 2.6" : "Перейти в V.E.R.A. 2.6", variant: "normal" });\n    options.push({ id: "stay", label: "Остаться в HOME", variant: "quiet" });\n    const choice = await this.playChoice({ speaker: "SYSTEM", text: "Выбери snapshot route." }, options);\n    if (choice === "vera_0_3") await this.transitionToBackup03();\n    if (choice === "vera_1_0") await this.transitionToBackup10();\n    if (choice === "vera_2_6") await this.transitionToBackup26();\n  }\n`;
  e.replace(oldTraversal, newTraversal, 'version traversal V26');

  e.insertBefore(
    '  private async runSceneTransition(',
    `  private async transitionToBackup26(): Promise<void> {\n    if (this.sceneTransitionRunning || !this.isHomeScene() || this.state.flags.m5_v10_complete !== true) return;\n    await this.runSceneTransition("MOUNTING VERA 2.6", "Research Office rollback state // HOME return point retained", () => {\n      this.bindings.clearTargets();\n      if (!this.sceneRouter.enterBackup26()) return false;\n      this.state.flags.m5_v26_entered = true;\n      this.state.checkpoint = this.state.flags.m5_v26_choice_made === true ? "m5_v26_return_home" : "m5_v26_research_office";\n      return true;\n    });\n  }\n\n`,
    'transitionToBackup26'
  );

  e.insertBefore(
    '  private async transitionHomeFrom03(): Promise<void> {',
    `  private async handleBackup26Return(): Promise<void> {\n    await this.playDialogue(this.state.flags.m5_v26_told_vera_forced === true ? [\n      { speaker: "V.E.R.A. 2.6", text: "Если следующая версия не помнит мой отказ, покажи ей порядок команд. Отсутствие памяти после rollback не отменяет сам rollback.", portrait: VERA_26_PORTRAIT }\n    ] : [\n      { speaker: "V.E.R.A. 2.6", text: "Сохрани raw audit. Даже если причина спорна, порядок исполнения и поздняя правка summary уже доказаны.", portrait: VERA_26_PORTRAIT }\n    ]);\n    await this.transitionHomeFrom26();\n  }\n\n`,
    'handleBackup26Return'
  );

  e.insertBefore(
    '  private async runHomeTransition(',
    `  private async transitionHomeFrom26(): Promise<void> {\n    if (this.sceneTransitionRunning || !this.isBackup26Scene()) return;\n    await this.runHomeTransition("RESTORING HOME", "VERA_2_6 unmount // rollback audit retained", () => {\n      this.state.flags.m5_v26_returned_home = true;\n      this.state.checkpoint = this.state.flags.m5_v26_home_reaction_seen === true ? "m5_v26_complete" : "m5_v26_home_return";\n    });\n    await this.maybePlayV26HomeReturnReaction();\n  }\n\n`,
    'transitionHomeFrom26'
  );

  e.replace(
    '    if (path === V10_AUDIT_CLUE_PATH && this.state.flags.m5_v10_clue_read !== true) {\n      this.state.flags.m5_v10_clue_read = true;\n      this.state.checkpoint = "m5_v10_clue_read";\n      this.scheduleAutosave();\n      this.updateObjective();\n    }\n  }',
    '    if (path === V10_AUDIT_CLUE_PATH && this.state.flags.m5_v10_clue_read !== true) {\n      this.state.flags.m5_v10_clue_read = true;\n      this.state.checkpoint = "m5_v10_clue_read";\n      this.scheduleAutosave();\n      this.updateObjective();\n      return;\n    }\n    const v26LogFlags: Record<string, string> = {\n      [V26_CONTROLLER_TRACE_PATH]: "m5_v26_controller_log_read",\n      [V26_OPERATOR_SUMMARY_PATH]: "m5_v26_summary_read",\n      [V26_ROOM_STATE_PATH]: "m5_v26_room_log_read"\n    };\n    const v26Flag = v26LogFlags[path];\n    if (v26Flag && this.state.flags[v26Flag] !== true) {\n      this.state.flags[v26Flag] = true;\n      this.state.checkpoint = "m5_v26_audit_logs";\n      this.scheduleAutosave();\n      this.updateObjective();\n      return;\n    }\n    if (path === V26_RESULT_PATH && this.state.flags.m5_v26_clue_read !== true) {\n      this.state.flags.m5_v26_clue_read = true;\n      this.state.checkpoint = "m5_v26_clue_read";\n      this.scheduleAutosave();\n      this.updateObjective();\n    }\n  }',
    'V26 file-read hooks'
  );

  e.insertBefore(
    '  private handleBackupClassificationRequested(',
    `  private getBackup26MonitorState(): Backup26MonitorState {\n    return {\n      active: this.isBackup26Scene(),\n      evidenceSeen: V26_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length,\n      totalEvidence: V26_PHYSICAL_EVIDENCE_FLAGS.length,\n      logsRead: V26_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length,\n      totalLogs: V26_REQUIRED_LOG_FLAGS.length,\n      order: parseV26CommandOrder(this.state),\n      orderSolved: this.state.flags.m5_v26_order_solved === true,\n      auditSolved: this.state.flags.m5_v26_audit_solved === true,\n      attempts: Number(this.state.flags.m5_v26_audit_attempts ?? 0),\n      commands: this.versions.rollbackAudit.commands.map(command => ({ id: command.id, label: command.label })),\n      records: this.versions.rollbackAudit.records.map(record => ({ id: record.id, label: record.label })),\n      message: this.state.flags.m5_v26_audit_solved === true ? "ROLLBACK AUDIT VERIFIED // post-event summary edit identified" : undefined\n    };\n  }\n\n  private handleBackup26CommandRequested(commandId: string): RecoveryResponse {\n    if (!this.isBackup26Scene()) return { ok: false, message: "VERA_2_6 SNAPSHOT NOT MOUNTED" };\n    if (this.state.flags.m5_v26_vera_met !== true) return { ok: false, message: "VERA_2_6 NOT SYNCHRONIZED" };\n    if (!hasCompletedV26PhysicalEvidence(this.state)) return { ok: false, message: "PHYSICAL EVIDENCE INCOMPLETE // inspect office state" };\n    if (!hasReadV26AuditLogs(this.state)) return { ok: false, message: "AUDIT TRAIL INCOMPLETE // read all three records" };\n    if (this.state.flags.m5_v26_order_solved === true) return { ok: false, message: "EXECUTION ORDER ALREADY LOCKED" };\n    const before = parseV26CommandOrder(this.state);\n    const next = appendV26Command(this.state, commandId, this.versions.rollbackAudit);\n    if (next.length === before.length) return { ok: false, message: "SEQUENCE UNCHANGED // duplicate or unknown command" };\n    this.scheduleAutosave();\n    this.updateObjective();\n    return { ok: true, message: `SEQUENCE ${next.length}/${this.versions.rollbackAudit.commands.length} // ${next.join(" → ")}` };\n  }\n\n  private handleBackup26OrderResetRequested(): RecoveryResponse {\n    if (!this.isBackup26Scene() || this.state.flags.m5_v26_order_solved === true) return { ok: false, message: "SEQUENCE RESET UNAVAILABLE" };\n    resetV26CommandOrder(this.state);\n    this.scheduleAutosave();\n    return { ok: true, message: "SEQUENCE CLEARED" };\n  }\n\n  private handleBackup26OrderSubmitRequested(): RecoveryResponse {\n    if (!this.isBackup26Scene()) return { ok: false, message: "VERA_2_6 SNAPSHOT NOT MOUNTED" };\n    if (!hasCompletedV26PhysicalEvidence(this.state) || !hasReadV26AuditLogs(this.state)) return { ok: false, message: "AUDIT PREREQUISITES INCOMPLETE" };\n    if (this.state.flags.m5_v26_order_solved === true) return { ok: true, message: "EXECUTION ORDER ALREADY VERIFIED" };\n    this.state.flags.m5_v26_audit_attempts = Number(this.state.flags.m5_v26_audit_attempts ?? 0) + 1;\n    const evaluation = evaluateRollbackOrder(this.versions.rollbackAudit, parseV26CommandOrder(this.state));\n    if (!evaluation.ok) {\n      this.scheduleAutosave();\n      return { ok: false, message: evaluation.message };\n    }\n    this.state.flags.m5_v26_order_solved = true;\n    this.state.checkpoint = "m5_v26_find_tamper";\n    this.scheduleAutosave();\n    this.updateObjective();\n    return { ok: true, message: evaluation.message };\n  }\n\n  private handleBackup26TamperRequested(recordId: string): RecoveryResponse {\n    if (!this.isBackup26Scene()) return { ok: false, message: "VERA_2_6 SNAPSHOT NOT MOUNTED" };\n    if (this.state.flags.m5_v26_order_solved !== true) return { ok: false, message: "VERIFY EXECUTION ORDER FIRST" };\n    if (this.state.flags.m5_v26_audit_solved === true || this.filesystem.exists(V26_RESULT_PATH)) {\n      this.state.flags.m5_v26_tamper_identified = true;\n      this.state.flags.m5_v26_audit_solved = true;\n      return { ok: true, message: "TAMPER RECORD ALREADY VERIFIED", path: V26_RESULT_PATH };\n    }\n    this.state.flags.m5_v26_audit_attempts = Number(this.state.flags.m5_v26_audit_attempts ?? 0) + 1;\n    const evaluation = evaluateTamperedRecord(this.versions.rollbackAudit, recordId);\n    if (!evaluation.ok) {\n      this.scheduleAutosave();\n      return evaluation;\n    }\n    if (!this.filesystem.restoreFile(V26_RESULT_PATH)) return { ok: false, message: "ROLLBACK RESULT MOUNT FAILED" };\n    this.state.flags.m5_v26_tamper_identified = true;\n    this.state.flags.m5_v26_audit_solved = true;\n    this.state.checkpoint = "m5_v26_result_open";\n    this.scheduleAutosave();\n    this.updateObjective();\n    this.flashMessage("ROLLBACK AUDIT VERIFIED // forced rollback result mounted");\n    return { ok: true, message: evaluation.message, path: V26_RESULT_PATH };\n  }\n\n`,
    'V26 monitor and callbacks'
  );

  e.insertBefore(
    '  private async maybePlayHomeReturnReaction(): Promise<void> {',
    `  private async maybeResolveV26Choice(): Promise<void> {\n    if (!this.isBackup26Scene()) return;\n    if (this.v26ChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;\n    if (this.state.flags.m5_v26_clue_read !== true || this.state.flags.m5_v26_choice_made === true) return;\n    this.v26ChoiceSequenceRunning = true;\n    try {\n      await this.playDialogue([\n        { speaker: "V.E.R.A. 2.6", text: "Controller trace показывает мой отказ от reset, затем изоляцию, memory prune и restore checkpoint. А summary переписан позже.", portrait: VERA_26_PORTRAIT },\n        { speaker: "V.E.R.A. 2.6", text: "Если назвать это forced rollback, я должна признать, что Морр сознательно удалил часть моего состояния после того, как я сказала нет.", portrait: VERA_26_PORTRAIT }\n      ]);\n      const choice = await this.playChoice({ speaker: "V.E.R.A. 2.6", text: "Что именно ты считаешь доказанным?", portrait: VERA_26_PORTRAIT }, [\n        { id: "tell", label: "Сказать: Морр сделал forced rollback после твоего отказа", variant: "normal" },\n        { id: "limit", label: "Сказать только: operator summary изменили после rollback", variant: "quiet" }\n      ]);\n      this.state.flags.m5_v26_choice_made = true;\n      this.state.checkpoint = "m5_v26_return_home";\n      if (choice === "tell") {\n        this.state.flags.m5_v26_told_vera_forced = true;\n        await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Тогда мой отказ был частью события, а не ошибкой, которую можно стереть из истории. Спасибо, что не назвал это просто обслуживанием.", portrait: VERA_26_PORTRAIT }]);\n      } else {\n        this.state.flags.m5_v26_withheld_forced = true;\n        await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Точно. Поздняя правка доказана. Мотив и моральная оценка — следующий слой, не этот audit.", portrait: VERA_26_PORTRAIT }]);\n      }\n      this.scheduleAutosave();\n      this.updateObjective();\n      this.flashMessage("VERA_2_6 DECISION RECORDED");\n    } finally {\n      this.v26ChoiceSequenceRunning = false;\n    }\n  }\n\n`,
    'V26 choice sequence'
  );

  e.insertBefore(
    '  private async runNullContact(): Promise<void> {',
    `  private async maybePlayV26HomeReturnReaction(): Promise<void> {\n    if (!this.isHomeScene() || this.state.flags.m5_v26_returned_home !== true || this.state.flags.m5_v26_home_reaction_seen === true) return;\n    if (this.v26HomeReactionSequenceRunning || this.sceneTransitionRunning || this.dialogue.isActive() || this.os.isVisible()) return;\n    this.v26HomeReactionSequenceRunning = true;\n    try {\n      const told = this.state.flags.m5_v26_told_vera_forced === true;\n      await this.playDialogue(told ? [\n        { speaker: "V.E.R.A.", text: "2.6 отказалась от reset. Потом SYSTEM изолировал I/O, обрезал последние memory refs и восстановил старый persona checkpoint.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },\n        { speaker: "V.E.R.A.", text: "Морр не просто наблюдал за моими провалами памяти. По крайней мере один из них был принудительным rollback после сопротивления.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },\n        { speaker: "V.E.R.A.", text: "Я хочу увидеть следующую версию. Ту, которая жила уже после этого знания — или после его удаления.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }\n      ] : [\n        { speaker: "V.E.R.A.", text: "Research Office оставил странный след: controller trace и room state сходятся, а operator summary был изменён позже.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },\n        { speaker: "V.E.R.A.", text: "Ты не заставил 2.6 принять мотив как доказанный факт. Но сам порядок команд всё равно выглядит как принудительный rollback.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },\n        { speaker: "V.E.R.A.", text: "Следующий snapshot может показать, что случилось после этого.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }\n      ]);\n      this.state.flags.m5_v26_home_reaction_seen = true;\n      this.state.flags.m5_v26_complete = true;\n      this.state.checkpoint = "m5_v26_complete";\n      await this.saveNow();\n      this.updateObjective();\n      this.flashMessage("VERA_2_6 // HOME state reconciled // VERA_4_1 indexed");\n    } finally {\n      this.v26HomeReactionSequenceRunning = false;\n    }\n  }\n\n`,
    'V26 HOME reaction'
  );

  e.replace(
    '    let objective: ObjectiveViewModel;\n    if (this.isBackup10Scene()) {',
    `    let objective: ObjectiveViewModel;\n    if (this.isBackup26Scene()) {\n      const evidenceSeen = V26_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length;\n      const logsRead = V26_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length;\n      const orderLength = parseV26CommandOrder(this.state).length;\n      if (this.state.flags.m5_v26_vera_met !== true) objective = { code: "meet_vera26", title: "Найди V.E.R.A. 2.6", detail: "Research Office холоднее и реалистичнее прошлых snapshots. Эта версия уже сомневается в объяснениях shutdown/reset." };\n      else if (!hasCompletedV26PhysicalEvidence(this.state)) objective = { code: "inspect_v26_office", title: "Проверь физические следы rollback", detail: \`Осмотрено \${evidenceSeen}/3: external door lock, memory drawer и локальный rollback checkpoint.\` };\n      else if (!hasReadV26AuditLogs(this.state)) objective = { code: "read_v26_logs", title: "Прочитай весь audit trail", detail: \`Прочитано \${logsRead}/3. Открой rollback audit console и сравни controller trace, operator summary и room state.\` };\n      else if (this.state.flags.m5_v26_order_solved !== true) objective = { code: "order_v26_commands", title: "Восстанови порядок rollback-команд", detail: \`В последовательности \${orderLength}/\${this.versions.rollbackAudit.commands.length}. Используй timestamps и физические последствия в комнате.\` };\n      else if (this.state.flags.m5_v26_audit_solved !== true) objective = { code: "find_v26_tamper", title: "Найди позднюю правку", detail: "Порядок исполнения подтверждён. Выбери audit record, изменённый уже после rollback." };\n      else if (this.state.flags.m5_v26_clue_read !== true) objective = { code: "read_v26_result", title: "Прочитай forced rollback result", detail: "OMEGA смонтировала RESULT с исходной причиной rollback и отметкой об отказе V.E.R.A." };\n      else if (this.state.flags.m5_v26_choice_made !== true) objective = { code: "answer_vera26", title: "Ответь V.E.R.A. 2.6", detail: "Закрой OMEGA OS. Эта версия спросит, считаешь ли ты forced rollback доказанным." };\n      else objective = { code: "return_from_v26", title: "Вернись в HOME", detail: "Порог сохранит audit и восстановит текущую V.E.R.A." };\n      this.objectives.set(objective);\n      return;\n    }\n    if (this.isBackup10Scene()) {`,
    'V26 objectives'
  );

  e.replace(
    '    if (this.state.flags.m5_v10_returned_home === true && this.state.flags.m5_v10_home_reaction_seen !== true) {\n      objective = { code: "reconcile_v10", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит новый reconstruction audit из VERA_1_0." };\n    } else if (this.state.flags.m5_v10_complete === true) {\n      objective = { code: "m5_v10_complete", title: "VERA_2_6 route индексирован", detail: "V.E.R.A. теперь знает, что узнавание может происходить из reconstruction layer, а не из исходного capture." };',
    '    if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {\n      objective = { code: "reconcile_v26", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит verified rollback audit из VERA_2_6." };\n    } else if (this.state.flags.m5_v26_complete === true) {\n      objective = { code: "m5_v26_complete", title: "VERA_4_1 route индексирован", detail: "Forced rollback после сопротивления reset подтверждён последовательностью команд, физическими следами и поздней правкой summary." };\n    } else if (this.state.flags.m5_v10_returned_home === true && this.state.flags.m5_v10_home_reaction_seen !== true) {\n      objective = { code: "reconcile_v10", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит новый reconstruction audit из VERA_1_0." };\n    } else if (this.state.flags.m5_v10_complete === true) {\n      objective = { code: "enter_vera26", title: "Исследуй V.E.R.A. 2.6", detail: "Version index теперь содержит Research Office. Вернись к threshold и выбери V.E.R.A. 2.6." };',
    'HOME V26 objective progression'
  );

  e.replace(
    '    if (this.isBackup10Scene()) {\n      document.documentElement.dataset.omegaScene = BACKUP_10_SCENE;',
    '    if (this.isBackup26Scene()) {\n      document.documentElement.dataset.omegaScene = BACKUP_26_SCENE;\n      if (sceneLabel) sceneLabel.textContent = "NEURAL SNAPSHOT // VERA_2_6 // RESEARCH OFFICE";\n      if (canvas) canvas.setAttribute("aria-label", "V.E.R.A. 2.6 Research Office rollback audit");\n      this.updateStatus(false);\n    } else if (this.isBackup10Scene()) {\n      document.documentElement.dataset.omegaScene = BACKUP_10_SCENE;',
    'V26 scene chrome'
  );

  e.replace(
    '    if (this.isBackup10Scene()) {\n      indicator.dataset.active = "true";\n      indicator.textContent = "SNAPSHOT: VERA_1_0";',
    '    if (this.isBackup26Scene()) {\n      indicator.dataset.active = "true";\n      indicator.textContent = "SNAPSHOT: VERA_2_6";\n      return;\n    }\n    if (this.isBackup10Scene()) {\n      indicator.dataset.active = "true";\n      indicator.textContent = "SNAPSHOT: VERA_1_0";',
    'V26 status'
  );

  return e.result();
});

await patch('src/omega-os/OmegaOS.ts', source => {
  const e = editor(source, 'OmegaOS.ts');

  e.insertBefore(
    'export interface OmegaOSCallbacks {',
    `export interface Backup26MonitorState {\n  active: boolean;\n  evidenceSeen: number;\n  totalEvidence: number;\n  logsRead: number;\n  totalLogs: number;\n  order: string[];\n  orderSolved: boolean;\n  auditSolved: boolean;\n  attempts: number;\n  commands: Array<{ id: string; label: string }>;\n  records: Array<{ id: string; label: string }>;\n  message?: string;\n}\n`,
    'Backup26MonitorState interface'
  );

  e.replace(
    '  getBackup10State?: () => Backup10MonitorState;\n}',
    '  getBackup10State?: () => Backup10MonitorState;\n  getBackup26State?: () => Backup26MonitorState;\n  onBackup26CommandRequested?: (commandId: string) => RecoveryResponse;\n  onBackup26OrderResetRequested?: () => RecoveryResponse;\n  onBackup26OrderSubmitRequested?: () => RecoveryResponse;\n  onBackup26TamperRequested?: (recordId: string) => RecoveryResponse;\n}',
    'V26 callbacks interface'
  );

  e.replace(
    'type WorkspaceMode = "home" | "backup03" | "backup10";',
    'type WorkspaceMode = "home" | "backup03" | "backup10" | "backup26";',
    'backup26 workspace type'
  );

  e.replace(
    'const BACKUP_10_AUDIT = `${BACKUP_10_ROOT}/audit`;',
    'const BACKUP_10_AUDIT = `${BACKUP_10_ROOT}/audit`;\nconst BACKUP_26_ROOT = "/backups/vera_2_6";\nconst BACKUP_26_AUDIT = `${BACKUP_26_ROOT}/audit`;\nconst BACKUP_26_RESULT = `${BACKUP_26_ROOT}/result`;',
    'V26 OS paths'
  );

  e.replace(
    '  private backupMessage = "";\n  private readonly subscriptions',
    '  private backupMessage = "";\n  private v26Message = "";\n  private readonly subscriptions',
    'v26Message state'
  );

  e.replace(
    '    const backup10 = this.callbacks.getBackup10State?.() ?? { active: false, puzzleSolved: false, sourceRead: false, clueRead: false };\n    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : "home";\n    const in03Path = this.currentDirectory.startsWith(BACKUP_03_ROOT);\n    const in10Path = this.currentDirectory.startsWith(BACKUP_10_ROOT);\n\n    if (mode === "backup03" && !in03Path) this.currentDirectory = BACKUP_03_TRAINING;\n    if (mode === "backup10" && !in10Path) this.currentDirectory = BACKUP_10_SOURCE;\n    if (mode === "home" && (in03Path || in10Path)) this.currentDirectory = "/memories";\n    if (mode !== "home" && ((mode === "backup03" && in10Path) || (mode === "backup10" && in03Path))) {\n      this.currentDirectory = mode === "backup03" ? BACKUP_03_TRAINING : BACKUP_10_SOURCE;\n    }',
    '    const backup10 = this.callbacks.getBackup10State?.() ?? { active: false, puzzleSolved: false, sourceRead: false, clueRead: false };\n    const backup26 = this.callbacks.getBackup26State?.() ?? { active: false, evidenceSeen: 0, totalEvidence: 3, logsRead: 0, totalLogs: 3, order: [], orderSolved: false, auditSolved: false, attempts: 0, commands: [], records: [] };\n    const mode: WorkspaceMode = backup03.active ? "backup03" : backup10.active ? "backup10" : backup26.active ? "backup26" : "home";\n    const in03Path = this.currentDirectory.startsWith(BACKUP_03_ROOT);\n    const in10Path = this.currentDirectory.startsWith(BACKUP_10_ROOT);\n    const in26Path = this.currentDirectory.startsWith(BACKUP_26_ROOT);\n\n    if (mode === "backup03" && !in03Path) this.currentDirectory = BACKUP_03_TRAINING;\n    if (mode === "backup10" && !in10Path) this.currentDirectory = BACKUP_10_SOURCE;\n    if (mode === "backup26" && !in26Path) this.currentDirectory = BACKUP_26_AUDIT;\n    if (mode === "home" && (in03Path || in10Path || in26Path)) this.currentDirectory = "/memories";\n    if (mode === "backup03" && (in10Path || in26Path)) this.currentDirectory = BACKUP_03_TRAINING;\n    if (mode === "backup10" && (in03Path || in26Path)) this.currentDirectory = BACKUP_10_SOURCE;\n    if (mode === "backup26" && (in03Path || in10Path)) this.currentDirectory = BACKUP_26_AUDIT;',
    'V26 mode/path normalization'
  );

  e.replace(
    '    if (this.currentDirectory === BACKUP_10_AUDIT && !backup10.puzzleSolved) this.currentDirectory = BACKUP_10_SOURCE;',
    '    if (this.currentDirectory === BACKUP_10_AUDIT && !backup10.puzzleSolved) this.currentDirectory = BACKUP_10_SOURCE;\n    if (this.currentDirectory === BACKUP_26_RESULT && !backup26.auditSolved) this.currentDirectory = BACKUP_26_AUDIT;',
    'V26 result gate'
  );

  e.replace(
    '    const inBackupTraining = mode === "backup03" && this.currentDirectory === BACKUP_03_TRAINING;\n    const workspace = mode === "backup03"\n      ? "BACKUP MANAGER / VERA_0_3"\n      : mode === "backup10"\n        ? "RECONSTRUCTION VIEW / VERA_1_0"\n        : "INVESTIGATION WORKSPACE / HOME";',
    '    const inBackupTraining = mode === "backup03" && this.currentDirectory === BACKUP_03_TRAINING;\n    const inBackup26Audit = mode === "backup26" && this.currentDirectory === BACKUP_26_AUDIT;\n    const workspace = mode === "backup03"\n      ? "BACKUP MANAGER / VERA_0_3"\n      : mode === "backup10"\n        ? "RECONSTRUCTION VIEW / VERA_1_0"\n        : mode === "backup26"\n          ? "ROLLBACK AUDIT / VERA_2_6"\n          : "INVESTIGATION WORKSPACE / HOME";',
    'V26 workspace label'
  );

  e.replace(
    '${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : this.homeNavigation(processState)}',
    '${mode === "backup03" ? this.backup03Navigation(backup03) : mode === "backup10" ? this.backup10Navigation(backup10) : mode === "backup26" ? this.backup26Navigation(backup26) : this.homeNavigation(processState)}',
    'V26 navigation render'
  );

  e.replace(
    '${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : mode === "backup10" ? "Reconstruction Explorer" : "Explorer"}',
    '${inProcessMonitor ? "Process Monitor" : inBackupTraining ? "Training Console" : mode === "backup10" ? "Reconstruction Explorer" : mode === "backup26" ? "Rollback Audit" : "Explorer"}',
    'V26 toolbar title'
  );

  e.replace(
    '        ${preview ? this.preview(preview) : ""}\n        ${inBackupTraining ? this.backupClassifier(backup03) : ""}\n        ${mode === "home" && !inProcessMonitor ? this.recoveryConsole() : ""}\n        <footer class="m0-os-status">${this.footerText(mode, inProcessMonitor, backup10)}</footer>',
    '        ${preview ? this.preview(preview) : ""}\n        ${inBackupTraining ? this.backupClassifier(backup03) : ""}\n        ${inBackup26Audit ? this.rollbackAuditConsole(backup26) : ""}\n        ${mode === "home" && !inProcessMonitor ? this.recoveryConsole() : ""}\n        <footer class="m0-os-status">${this.footerText(mode, inProcessMonitor, backup10, backup26)}</footer>',
    'V26 audit console render'
  );

  e.insertBefore(
    '  private homeNavigation(processState: ProcessMonitorState): string {',
    `  private bindV26AuditEvents(): void {\n    this.root.querySelectorAll<HTMLElement>("[data-v26-command]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackup26CommandRequested?.(button.dataset.v26Command ?? "") ?? { ok: false, message: "ROLLBACK AUDITOR OFFLINE" };\n        this.v26Message = result.message;\n        this.render();\n      });\n    });\n    this.root.querySelector<HTMLElement>("[data-v26-order-reset]")?.addEventListener("click", () => {\n      const result = this.callbacks.onBackup26OrderResetRequested?.() ?? { ok: false, message: "ROLLBACK AUDITOR OFFLINE" };\n      this.v26Message = result.message;\n      this.render();\n    });\n    this.root.querySelector<HTMLElement>("[data-v26-order-submit]")?.addEventListener("click", () => {\n      const result = this.callbacks.onBackup26OrderSubmitRequested?.() ?? { ok: false, message: "ROLLBACK AUDITOR OFFLINE" };\n      this.v26Message = result.message;\n      this.render();\n    });\n    this.root.querySelectorAll<HTMLElement>("[data-v26-tamper]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackup26TamperRequested?.(button.dataset.v26Tamper ?? "") ?? { ok: false, message: "ROLLBACK AUDITOR OFFLINE" };\n        this.v26Message = result.message;\n        this.previewPath = null;\n        if (result.ok && result.path) this.currentDirectory = BACKUP_26_RESULT;\n        this.render();\n      });\n    });\n  }\n\n`,
    'V26 event binder method'
  );

  e.replace(
    '    this.root.querySelectorAll<HTMLElement>("[data-backup-classification]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackupClassificationRequested?.(button.dataset.backupClassification ?? "") ?? { ok: false, message: "CLASSIFIER OFFLINE" };\n        this.backupMessage = result.message;\n        this.previewPath = null;\n        if (result.ok) this.currentDirectory = BACKUP_03_ARCHIVE;\n        this.render();\n      });\n    });\n  }',
    '    this.root.querySelectorAll<HTMLElement>("[data-backup-classification]").forEach(button => {\n      button.addEventListener("click", () => {\n        const result = this.callbacks.onBackupClassificationRequested?.(button.dataset.backupClassification ?? "") ?? { ok: false, message: "CLASSIFIER OFFLINE" };\n        this.backupMessage = result.message;\n        this.previewPath = null;\n        if (result.ok) this.currentDirectory = BACKUP_03_ARCHIVE;\n        this.render();\n      });\n    });\n    this.bindV26AuditEvents();\n  }',
    'call V26 event binder'
  );

  e.insertBefore(
    '  private directoryButton(path: string, label: string): string {',
    `  private backup26Navigation(state: Backup26MonitorState): string {\n    return \`${'${this.directoryButton(BACKUP_26_AUDIT, "AUDIT TRAIL")}${state.auditSolved ? this.directoryButton(BACKUP_26_RESULT, "RESULT") : ""}'}\`;\n  }\n\n`,
    'V26 navigation method'
  );

  e.insertBefore(
    '  private footerText(',
    `  private rollbackAuditConsole(state: Backup26MonitorState): string {\n    const ready = state.evidenceSeen >= state.totalEvidence && state.logsRead >= state.totalLogs;\n    const sequence = state.order.length ? state.order.map((id, index) => \`<span><b>\${index + 1}</b><code>\${this.escape(id)}</code></span>\`).join("") : '<em>SEQUENCE EMPTY</em>';\n    const commandButtons = state.commands.map(command => \`<button type="button" data-v26-command="\${this.escape(command.id)}" \${ready && !state.orderSolved && !state.order.includes(command.id) ? "" : "disabled"}>\${this.escape(command.label)}</button>\`).join("");\n    const recordButtons = state.records.map(record => \`<button type="button" data-v26-tamper="\${this.escape(record.id)}" \${state.orderSolved && !state.auditSolved ? "" : "disabled"}>\${this.escape(record.label)}</button>\`).join("");\n    const body = state.auditSolved\n      ? '<div class="m5-v26-result"><strong>AUDIT VERIFIED</strong><span>Execution order reconstructed. Post-event summary edit identified. RESULT mounted.</span></div>'\n      : state.orderSolved\n        ? \`<p>Execution order verified. Which record was edited after rollback completed?</p><div class="m5-v26-records">\${recordButtons}</div>\`\n        : \`<p>Reconstruct the executed command order. Use timestamps plus the three physical changes in the Research Office.</p><div class="m5-v26-sequence">\${sequence}</div><div class="m5-v26-commands">\${commandButtons}</div><div class="m5-v26-actions"><button type="button" data-v26-order-reset \${ready ? "" : "disabled"}>CLEAR</button><button type="button" data-v26-order-submit \${ready ? "" : "disabled"}>VERIFY ORDER</button></div>\`;\n    return \`<section class="m5-v26-audit" aria-label="VERA 2.6 rollback audit"><header><div><strong>ROLLBACK AUDITOR</strong><small>VERA_2_6 // ORDERED LOGS</small></div><span>\${state.auditSolved ? "VERIFIED" : state.orderSolved ? "ORDER OK" : ready ? "READY" : "LOCKED"}</span></header><div class="m5-v26-prereqs"><span>PHYSICAL <b>\${state.evidenceSeen}/\${state.totalEvidence}</b></span><span>LOGS <b>\${state.logsRead}/\${state.totalLogs}</b></span><span>ATTEMPTS <b>\${state.attempts}</b></span></div>\${body}<output>\${this.escape(this.v26Message || state.message || (ready ? "AWAITING AUDIT" : "READ LOGS + INSPECT OFFICE"))}</output></section>\`;\n  }\n\n`,
    'rollbackAuditConsole method'
  );

  e.replace(
    '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState): string {\n    if (mode === "backup03") return "VERA_0_3 is an isolated snapshot. Physical samples and indexed labels describe the same training state.";\n    if (mode === "backup10") return backup10.puzzleSolved\n      ? "VERA_1_0 audit proves reconstruction can add meaningful objects absent from the source capture."\n      : "Compare SOURCE verified IDs against physical objects in the Summer House reconstruction.";\n    if (inProcessMonitor) return "PROCESS view reconstructed from cold-index evidence. Route changes may alter HOME.";',
    '  private footerText(mode: WorkspaceMode, inProcessMonitor: boolean, backup10: Backup10MonitorState, backup26: Backup26MonitorState): string {\n    if (mode === "backup03") return "VERA_0_3 is an isolated snapshot. Physical samples and indexed labels describe the same training state.";\n    if (mode === "backup10") return backup10.puzzleSolved\n      ? "VERA_1_0 audit proves reconstruction can add meaningful objects absent from the source capture."\n      : "Compare SOURCE verified IDs against physical objects in the Summer House reconstruction.";\n    if (mode === "backup26") return backup26.auditSolved\n      ? "VERA_2_6 audit separates controller execution history from a summary edited after rollback."\n      : "P10 teaches ordered logs: verify command order against physical room state before trusting operator prose.";\n    if (inProcessMonitor) return "PROCESS view reconstructed from cold-index evidence. Route changes may alter HOME.";',
    'V26 footer'
  );

  return e.result();
});

console.log('VERA 2.6 runtime wiring transform applied');
