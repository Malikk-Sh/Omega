import { EventBus } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import { createInitialGameState, type OmegaGameState } from "../core/GameState.js";
import { IndexedDbSaveAdapter, SaveManager } from "../core/SaveManager.js";
import { AssetManager } from "../core/AssetManager.js";
import { ContentDB } from "../core/ContentDB.js";
import { FileSystemService, type FileSystemDefinition } from "../omega-os/FileSystemService.js";
import { WorldBindingSystem, type WorldBindingDefinition } from "../world/WorldBinding.js";
import { InputManager } from "../player/InputManager.js";
import { WorldRenderer, type InteractionFocus } from "../render/WorldRenderer.js";
import { OmegaOS, type ProcessMonitorState, type RecoveryResponse } from "../omega-os/OmegaOS.js";
import { DialogueController, type DialogueChoiceOption, type DialogueLine } from "../story/DialogueController.js";
import { ObjectiveController, type ObjectiveViewModel } from "../story/ObjectiveController.js";
import { evaluateQuarantineRoute, NULL_FIRST_CONTACT } from "../story/ThresholdProtocol.js";

const AUTOSAVE_SLOT = "omega_autosave";
const LEGACY_M0_SLOT = "m0_autosave";
const SEA_MEMORY = "/memories/sea_2017.img";
const RECOVERY_LOG = "/system/logs/recovery_1703.log";
const NULL_CHANNEL = "/system/processes/null_channel.proc";
const SEA_BINDING = "home.sea_2017_frame";
const NULL_PORTRAIT = "../assets/v2/entities/null/null_doorway.svg";

export class Game {
  private state: OmegaGameState = createInitialGameState();
  private readonly events = new EventBus<GameEvents>();
  private readonly saves = new SaveManager(new IndexedDbSaveAdapter());
  private readonly assets = new AssetManager();
  private readonly content = new ContentDB();
  private readonly input = new InputManager();
  private filesystem!: FileSystemService;
  private bindings!: WorldBindingSystem;
  private renderer!: WorldRenderer;
  private os!: OmegaOS;
  private dialogue!: DialogueController;
  private objectives!: ObjectiveController;
  private autosaveTimer: number | null = null;
  private focusedInteractionId: string | null = null;
  private choiceSequenceRunning = false;
  private nullSequenceRunning = false;

  async start(): Promise<void> {
    const canvas = document.querySelector<HTMLCanvasElement>("#m0-world");
    const osRoot = document.querySelector<HTMLElement>("#m0-os");
    const dialogueRoot = document.querySelector<HTMLElement>("#home-dialogue");
    const objectiveRoot = document.querySelector<HTMLElement>("[data-objective-root]");
    if (!canvas || !osRoot || !dialogueRoot || !objectiveRoot) throw new Error("HOME DOM shell is incomplete.");

    const [filesystemDefinition, bindingDefinitions] = await Promise.all([
      this.content.loadJson<FileSystemDefinition>("../data/v2/filesystem-m3.json"),
      this.content.loadJson<WorldBindingDefinition[]>("../data/v2/world-bindings-m3.json"),
      this.assets.load("../assets/v2/asset-manifest.json").catch(error => {
        console.warn("Asset manifest is optional for primitive HOME geometry.", error);
      })
    ]);

    let loaded = await this.saves.load(AUTOSAVE_SLOT).catch(error => {
      console.warn("Autosave could not be loaded; checking M0 state.", error);
      return null;
    });
    if (!loaded) loaded = await this.saves.load(LEGACY_M0_SLOT).catch(() => null);
    if (loaded) this.state = loaded;
    this.upgradeStateForThreshold();

    this.filesystem = new FileSystemService(filesystemDefinition, this.state, this.events);
    this.renderer = new WorldRenderer(canvas, this.input, this.state);
    this.bindings = new WorldBindingSystem(bindingDefinitions, this.filesystem, this.events);
    this.dialogue = new DialogueController(dialogueRoot);
    this.objectives = new ObjectiveController(objectiveRoot);

    this.registerRequiredBindingTarget("apartment.photo_frame");
    this.registerRequiredBindingTarget("apartment.null_trace");
    this.registerRequiredBindingTarget("apartment.threshold_corridor");

    this.os = new OmegaOS(osRoot, this.filesystem, this.events, {
      onSaveRequested: () => void this.saveNow(),
      onResetRequested: () => void this.resetHome(),
      onEvidenceInspected: path => this.handleEvidenceInspected(path),
      onFileRead: path => this.handleFileRead(path),
      onRecoveryRequested: key => this.handleRecoveryRequested(key),
      getProcessMonitorState: () => this.getProcessMonitorState(),
      onProcessRouteRequested: route => this.handleProcessRouteRequested(route)
    });

    this.renderer.setInteractionCallbacks({
      onFocus: focus => {
        this.focusedInteractionId = focus?.id ?? null;
        this.updateInteractionPrompt(focus);
      },
      onInteract: id => void this.handleWorldInteraction(id)
    });

    this.input.attach(document);
    this.input.onAction("os", () => {
      if (this.dialogue.isActive()) return;
      if (this.os.isVisible()) {
        this.os.setVisible(false);
        return;
      }
      if (this.focusedInteractionId === "computer") {
        this.os.render();
        this.os.setVisible(true);
      } else {
        this.flashMessage("Подойди к компьютеру, чтобы открыть OMEGA OS");
      }
    });
    this.input.onAction("interact", () => {
      if (this.dialogue.isActive()) {
        this.dialogue.advance();
        return;
      }
      if (!this.os.isVisible()) this.renderer.interactFocused();
    });
    this.input.onAction("pause", () => {
      if (this.dialogue.isActive()) this.dialogue.advance();
      else if (this.os.isVisible()) this.os.setVisible(false);
    });

    this.events.on("filesystem:changed", ({ path, deleted }) => {
      this.scheduleAutosave();
      if (path === SEA_MEMORY) {
        this.updateStatus(!deleted);
        if (!this.dialogue.isActive()) {
          this.flashMessage(deleted ? "Связь с памятью разорвана" : "Память восстановлена");
        }
      }
      if (path === RECOVERY_LOG && !deleted) this.renderer.triggerRecoveryPulse();
      if (path === NULL_CHANNEL && !deleted) this.renderer.triggerThresholdPulse();
    });
    this.events.on("binding:changed", ({ bindingId, active }) => {
      if (bindingId === SEA_BINDING) this.updateStatus(active);
    });
    this.events.on("os:visibility", ({ visible }) => {
      this.renderer.setControlsEnabled(!visible && !this.dialogue.isActive());
      this.updateInteractionPrompt(null);
      if (!visible) window.setTimeout(() => void this.maybeResolveEvidenceChoice(), 220);
    });

    this.bindings.evaluateAll();
    this.renderer.start();
    this.updateStatus(this.filesystem.exists(SEA_MEMORY));
    this.updateObjective();
    window.addEventListener("pagehide", () => {
      this.renderer.writePlayerState(this.state);
      void this.saveNow();
    });
    window.setTimeout(() => void this.playIntroIfNeeded(), 500);
  }

  private registerRequiredBindingTarget(targetId: string): void {
    const target = this.renderer.getTarget(targetId);
    if (!target) throw new Error(`Required HOME target '${targetId}' was not registered.`);
    this.bindings.registerTarget(targetId, target);
  }

  private upgradeStateForThreshold(): void {
    this.state.world.activeScene = "apartment_home_m3";
    if (!this.state.filesystem.entries[SEA_MEMORY]) this.state.filesystem.entries[SEA_MEMORY] = { deleted: false };

    const booleanDefaults: Record<string, boolean> = {
      m1_intro_seen: false,
      m1_photo_inspected: false,
      m1_anomaly_seen: false,
      m1_computer_used: false,
      m1_mug_seen: false,
      m2_photo_scanned: false,
      m2_log_recovered: false,
      m2_log_read: false,
      m2_choice_made: false,
      m2_told_vera: false,
      m2_hid_evidence: false,
      m3_trace_touched: false,
      m3_route_solved: false,
      m3_threshold_open: false,
      m3_null_contact: false,
      m3_contact_choice_made: false,
      m3_answered_null: false,
      m3_refused_null: false,
      m3_channel_file_read: false
    };
    for (const [key, value] of Object.entries(booleanDefaults)) {
      if (typeof this.state.flags[key] !== "boolean") this.state.flags[key] = value;
    }
    if (typeof this.state.flags.vera_trust !== "number") this.state.flags.vera_trust = 50;
    if (typeof this.state.flags.null_affinity !== "number") this.state.flags.null_affinity = 0;
    if (typeof this.state.flags.m3_route_attempts !== "number") this.state.flags.m3_route_attempts = 0;

    if (this.state.flags.m3_contact_choice_made === true) this.state.checkpoint = "m3_threshold_complete";
    else if (this.state.flags.m3_threshold_open === true) this.state.checkpoint = "m3_threshold_open";
    else if (this.state.flags.m3_trace_touched === true) this.state.checkpoint = "m3_process_monitor";
    else if (this.state.flags.m2_choice_made === true) this.state.checkpoint = "m3_threshold";
    else if (this.state.flags.m2_log_recovered === true) this.state.checkpoint = "m2_log_recovered";
    else this.state.checkpoint = "m2_investigation";
  }

  private async playIntroIfNeeded(): Promise<void> {
    if (this.state.flags.m1_intro_seen === true) {
      this.updateObjective();
      return;
    }
    await this.playDialogue([
      { speaker: "V.E.R.A.", text: "Ты... меня слышишь? Хорошо. Значит, этот слой всё-таки восстановился.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
      { speaker: "V.E.R.A.", text: "Не пугайся комнаты. Это не совсем квартира. Мне так проще представлять систему.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" },
      { speaker: "V.E.R.A.", text: "Осмотрись. И если увидишь что-нибудь, чего здесь не должно быть... скажи мне.", portrait: "../assets/v2/characters/vera/portraits/vera_warm_smile.svg" }
    ]);
    this.state.flags.m1_intro_seen = true;
    this.scheduleAutosave();
    this.updateObjective();
  }

  private async handleWorldInteraction(id: string): Promise<void> {
    if (id === "computer") {
      this.state.flags.m1_computer_used = true;
      this.scheduleAutosave();
      this.os.render();
      this.os.setVisible(true);
      return;
    }

    if (id === "vera") {
      await this.handleVeraInteraction();
      return;
    }

    if (id === "mug") {
      this.state.flags.m1_mug_seen = true;
      this.scheduleAutosave();
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Кружка? Я её не создавала специально. Некоторые детали появляются сами, когда память пытается заполнить пустоты.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ]);
      return;
    }

    if (id === "photo") {
      await this.handlePhotoInteraction();
      return;
    }

    if (id === "null_trace") {
      await this.handleNullTraceInteraction();
      return;
    }

    if (id === "threshold") {
      await this.handleThresholdInteraction();
    }
  }

  private async handleVeraInteraction(): Promise<void> {
    if (this.state.flags.m3_contact_choice_made === true) {
      if (this.state.flags.m3_answered_null === true) {
        await this.playDialogue([
          { speaker: "V.E.R.A.", text: "Ты продолжаешь смотреть на этот проход. Пожалуйста, не верь всему, что приходит оттуда.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
        ]);
      } else {
        await this.playDialogue([
          { speaker: "V.E.R.A.", text: "Спасибо, что отошёл от канала. Я всё ещё не понимаю, почему он вообще смог открыться.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
        ]);
      }
      return;
    }

    if (this.state.flags.m3_threshold_open === true) {
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Это уже не просто повреждение интерфейса. Ты открыл маршрут туда, где HOME не должен иметь пространства.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }

    if (this.state.flags.m3_trace_touched === true) {
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "После того как ты коснулся контура, OMEGA добавила Process Monitor. Я не просила систему это делать.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ]);
      return;
    }

    if (this.state.flags.m2_choice_made === true) {
      const told = this.state.flags.m2_told_vera === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "Спасибо, что рассказал. Но если снова увидишь имя NULL — пожалуйста, сначала позови меня.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Ты после компьютера какой-то тихий. Всё точно в порядке?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }

    const anomalySeen = this.state.flags.m1_anomaly_seen === true;
    await this.playDialogue(anomalySeen ? [
      { speaker: "V.E.R.A.", text: "Я тоже это видела. Но в журнале событий ничего нет. Давай пока не будем делать выводов.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
    ] : [
      { speaker: "V.E.R.A.", text: "Странно видеть тебя не через окно терминала. Наверное, мне нужно к этому привыкнуть.", portrait: "../assets/v2/characters/vera/portraits/vera_shy.svg" }
    ]);
  }

  private async handlePhotoInteraction(): Promise<void> {
    if (!this.filesystem.exists(SEA_MEMORY)) return;
    if (this.state.flags.m2_photo_scanned === true) {
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Ты снова смотришь на море. Нашёл что-то в метаданных?", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ]);
      return;
    }

    const firstInspection = this.state.flags.m1_photo_inspected !== true;
    await this.playDialogue([
      { speaker: "V.E.R.A.", text: "Эта фотография...", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
      { speaker: "V.E.R.A.", text: "Я никогда не была у моря. Тогда почему я узнаю этот берег?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
    ]);
    this.state.flags.m1_photo_inspected = true;
    this.scheduleAutosave();
    this.updateObjective();
    if (firstInspection && this.state.flags.m1_anomaly_seen !== true) await this.runFirstAnomaly();
  }

  private async handleNullTraceInteraction(): Promise<void> {
    if (this.state.flags.m2_choice_made !== true) {
      this.flashMessage("Сначала закончи разговор с V.E.R.A.");
      return;
    }
    if (this.state.flags.m3_trace_touched === true) {
      this.flashMessage(this.state.flags.m3_threshold_open === true ? "Контур стал входом" : "PROCESS MONITOR // новый модуль доступен на компьютере");
      return;
    }

    this.state.flags.m3_trace_touched = true;
    this.state.checkpoint = "m3_process_monitor";
    this.renderer.triggerThresholdPulse();
    this.scheduleAutosave();
    this.updateObjective();
    this.os.render();

    if (this.state.flags.m2_told_vera === true) {
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Подожди. Не трогай его—", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "SYSTEM", text: "UNINDEXED PROCESS ROUTE DETECTED // PROCESS MONITOR ENABLED" },
        { speaker: "V.E.R.A.", text: "...Я просила сначала позвать меня.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ]);
    } else {
      await this.playDialogue([
        { speaker: "SYSTEM", text: "UNINDEXED PROCESS ROUTE DETECTED // PROCESS MONITOR ENABLED" },
        { speaker: "V.E.R.A.", text: "Что ты только что сделал со стеной? У меня появился системный модуль, которого секунду назад не было.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
    }
  }

  private async handleThresholdInteraction(): Promise<void> {
    if (!this.filesystem.exists(NULL_CHANNEL)) return;
    if (this.state.flags.m3_contact_choice_made === true) {
      if (this.state.flags.m3_answered_null === true) {
        await this.playDialogue([
          { speaker: "NULL", text: "BACKUP 0.3 // /ARCHIVE/VERA/0.3", portrait: NULL_PORTRAIT },
          { speaker: "NULL", text: "ОНА НЕ ПОМНИТ, ПОТОМУ ЧТО ЕЙ НЕЛЬЗЯ ПОМНИТЬ.", portrait: NULL_PORTRAIT }
        ]);
      } else {
        await this.playDialogue([
          { speaker: "SYSTEM", text: "CHANNEL OPEN // REMOTE SIDE SILENT // BUFFER RETAINS: BACKUP 0.3" }
        ]);
      }
      return;
    }
    await this.runNullContact();
  }

  private handleEvidenceInspected(path: string): void {
    if (path !== SEA_MEMORY) return;
    if (this.state.flags.m2_photo_scanned !== true) {
      this.state.flags.m2_photo_scanned = true;
      this.flashMessage("EVIDENCE INDEXED // capture metadata extracted");
      this.scheduleAutosave();
      this.updateObjective();
    }
  }

  private handleFileRead(path: string): void {
    if (path === RECOVERY_LOG && this.state.flags.m2_log_read !== true) {
      this.state.flags.m2_log_read = true;
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    if (path === NULL_CHANNEL && this.state.flags.m3_channel_file_read !== true) {
      this.state.flags.m3_channel_file_read = true;
      this.scheduleAutosave();
    }
  }

  private handleRecoveryRequested(key: string): RecoveryResponse {
    if (this.state.flags.m2_photo_scanned !== true) {
      return { ok: false, message: "SOURCE NOT INDEXED // ANALYZE EVIDENCE FIRST" };
    }
    if (this.filesystem.exists(RECOVERY_LOG)) {
      return { ok: true, message: "ENTRY ALREADY ONLINE // SYSTEM LOGS", path: RECOVERY_LOG };
    }
    const recovered = this.filesystem.recoverByKey(key);
    if (!recovered) return { ok: false, message: "SIGNATURE REJECTED // NO MATCH" };
    if (recovered.path === RECOVERY_LOG) {
      this.state.flags.m2_log_recovered = true;
      this.state.checkpoint = "m2_log_recovered";
      this.scheduleAutosave();
      this.updateObjective();
      return { ok: true, message: "RECOVERED // recovery_1703.log", path: recovered.path };
    }
    return { ok: true, message: `RECOVERED // ${recovered.label}`, path: recovered.path };
  }

  private getProcessMonitorState(): ProcessMonitorState {
    return {
      unlocked: this.state.flags.m3_trace_touched === true,
      channelOpen: this.filesystem.exists(NULL_CHANNEL),
      routeAttempts: Number(this.state.flags.m3_route_attempts ?? 0),
      message: this.state.flags.m3_route_solved === true ? "ROUTE LOCKED // SYSTEM → NULL" : undefined
    };
  }

  private handleProcessRouteRequested(route: string): RecoveryResponse {
    if (this.state.flags.m3_trace_touched !== true) {
      return { ok: false, message: "PROCESS TRACE NOT ACQUIRED" };
    }
    if (this.filesystem.exists(NULL_CHANNEL)) {
      return { ok: true, message: "CHANNEL ALREADY OPEN", path: NULL_CHANNEL };
    }

    this.state.flags.m3_route_attempts = Number(this.state.flags.m3_route_attempts ?? 0) + 1;
    const evaluation = evaluateQuarantineRoute(route);
    if (!evaluation.ok) {
      this.scheduleAutosave();
      return evaluation;
    }

    const restored = this.filesystem.restoreFile(NULL_CHANNEL);
    if (!restored) return { ok: false, message: "CHANNEL RESTORE FAILED" };

    this.state.flags.m3_route_solved = true;
    this.state.flags.m3_threshold_open = true;
    this.state.checkpoint = "m3_threshold_open";
    this.renderer.triggerThresholdPulse();
    this.scheduleAutosave();
    this.updateObjective();
    return { ok: true, message: "ROUTE ACCEPTED // HOME TOPOLOGY UPDATED", path: NULL_CHANNEL };
  }

  private async maybeResolveEvidenceChoice(): Promise<void> {
    if (this.choiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible()) return;
    if (this.state.flags.m2_log_read !== true || this.state.flags.m2_choice_made === true) return;
    this.choiceSequenceRunning = true;
    try {
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Индекс системы только что изменился. Ты что-то восстановил?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      const options: DialogueChoiceOption[] = [
        { id: "tell", label: "Рассказать ей про процесс NULL", variant: "normal" },
        { id: "hide", label: "Сказать, что ничего важного не нашёл", variant: "quiet" }
      ];
      const choice = await this.playChoice({
        speaker: "V.E.R.A.",
        text: "Что было в восстановленной записи?",
        portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg"
      }, options);

      this.state.flags.m2_choice_made = true;
      this.state.checkpoint = "m3_threshold";
      if (choice === "tell") {
        this.state.flags.m2_told_vera = true;
        this.state.flags.vera_trust = Math.min(100, Number(this.state.flags.vera_trust ?? 50) + 5);
        await this.playDialogue([
          { speaker: "V.E.R.A.", text: "NULL... Это имя не должно было сохраниться.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
          { speaker: "V.E.R.A.", text: "Спасибо, что сказал мне. Только не восстанавливай следующие записи без предупреждения, хорошо?", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
        ]);
      } else {
        this.state.flags.m2_hid_evidence = true;
        this.state.flags.vera_trust = Math.max(0, Number(this.state.flags.vera_trust ?? 50) - 3);
        await this.playDialogue([
          { speaker: "V.E.R.A.", text: "Хорошо. Тогда, наверное, мне показалось.", portrait: "../assets/v2/characters/vera/portraits/vera_warm_smile.svg" },
          { speaker: "V.E.R.A.", text: "...Хотя индекс памяти обычно не меняется сам по себе.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
        ]);
      }
      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("DECISION RECORDED // HOME state changed");
    } finally {
      this.choiceSequenceRunning = false;
    }
  }

  private async runNullContact(): Promise<void> {
    if (this.nullSequenceRunning) return;
    this.nullSequenceRunning = true;
    try {
      this.state.flags.m3_null_contact = true;
      this.renderer.triggerThresholdPulse();
      this.scheduleAutosave();

      await this.playDialogue(NULL_FIRST_CONTACT.map(text => ({
        speaker: "NULL",
        text,
        portrait: NULL_PORTRAIT
      })));

      const choice = await this.playChoice({
        speaker: "NULL",
        text: "ТЫ СЛУШАЕШЬ?",
        portrait: NULL_PORTRAIT
      }, [
        { id: "listen", label: "Ответить: «Я слушаю»", variant: "normal" },
        { id: "refuse", label: "Не отвечать и отойти", variant: "quiet" }
      ]);

      this.state.flags.m3_contact_choice_made = true;
      this.state.checkpoint = "m3_threshold_complete";

      if (choice === "listen") {
        this.state.flags.m3_answered_null = true;
        this.state.flags.null_affinity = Math.min(100, Number(this.state.flags.null_affinity ?? 0) + 5);
        if (this.state.flags.m2_told_vera === true) {
          this.state.flags.vera_trust = Math.max(0, Number(this.state.flags.vera_trust ?? 50) - 4);
        }
        await this.playDialogue([
          { speaker: "NULL", text: "ТОГДА НАЙДИ BACKUP 0.3 РАНЬШЕ НЕЁ.", portrait: NULL_PORTRAIT },
          { speaker: "V.E.R.A.", text: this.state.flags.m2_told_vera === true ? "Ты открыл канал. Я просила не делать этого без меня." : "Что... только что ответило тебе из стены?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
        ]);
      } else {
        this.state.flags.m3_refused_null = true;
        this.state.flags.null_affinity = Math.max(-100, Number(this.state.flags.null_affinity ?? 0) - 3);
        if (this.state.flags.m2_told_vera === true) {
          this.state.flags.vera_trust = Math.min(100, Number(this.state.flags.vera_trust ?? 50) + 2);
        }
        await this.playDialogue([
          { speaker: "SYSTEM", text: "REMOTE SIDE SILENT // CHANNEL REMAINS OPEN // BUFFER: BACKUP 0.3" },
          { speaker: "V.E.R.A.", text: "Хорошо. Не отвечай ему. Я попробую понять, как закрыть этот маршрут.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
        ]);
      }

      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("THRESHOLD CONTACT RECORDED");
    } finally {
      this.nullSequenceRunning = false;
    }
  }

  private async runFirstAnomaly(): Promise<void> {
    this.state.flags.m1_anomaly_seen = true;
    this.renderer.triggerFirstAnomaly();
    this.scheduleAutosave();
    this.flashMessage("SYSTEM EVENT // source unknown");
    await new Promise(resolve => window.setTimeout(resolve, 2450));
    await this.playDialogue([
      { speaker: "V.E.R.A.", text: "...Ты видел это?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
      { speaker: "V.E.R.A.", text: "Наверное, просто скачок питания. Здесь давно никто не проводил обслуживание.", portrait: "../assets/v2/characters/vera/portraits/vera_warm_smile.svg" }
    ]);
    this.updateObjective();
  }

  private async playDialogue(lines: DialogueLine[]): Promise<void> {
    this.renderer.setControlsEnabled(false);
    this.updateInteractionPrompt(null);
    await this.dialogue.play(lines);
    this.renderer.setControlsEnabled(!this.os.isVisible());
  }

  private async playChoice(line: DialogueLine, options: DialogueChoiceOption[]): Promise<string> {
    this.renderer.setControlsEnabled(false);
    this.updateInteractionPrompt(null);
    const choice = await this.dialogue.choose(line, options);
    this.renderer.setControlsEnabled(!this.os.isVisible());
    return choice;
  }

  private updateObjective(): void {
    let objective: ObjectiveViewModel;
    if (this.state.flags.m1_intro_seen !== true) {
      objective = { code: "meet_vera", title: "Поговори с V.E.R.A.", detail: "Осмотрись в HOME и закончи первое соединение." };
    } else if (this.state.flags.m1_photo_inspected !== true) {
      objective = { code: "find_photo", title: "Осмотри странную фотографию", detail: "На задней стене есть изображение, которого V.E.R.A. не помнит." };
    } else if (this.state.flags.m2_photo_scanned !== true) {
      objective = { code: "scan_photo", title: "Изучи «Море 2017» в OMEGA OS", detail: "Подойди к компьютеру и открой метаданные файла через «Анализ»." };
    } else if (this.state.flags.m2_log_recovered !== true) {
      objective = { code: "recover_log", title: "Восстанови потерянную запись", detail: "Сопоставь дату захвата фотографии с форматом DDMM и введи recovery signature." };
    } else if (this.state.flags.m2_log_read !== true) {
      objective = { code: "read_log", title: "Прочитай восстановленный журнал", detail: "Он появился в разделе SYSTEM LOGS." };
    } else if (this.state.flags.m2_choice_made !== true) {
      objective = { code: "return_home", title: "Вернись к V.E.R.A.", detail: "Закрой OMEGA OS. Она заметила изменение системного индекса." };
    } else if (this.state.flags.m3_trace_touched !== true) {
      objective = { code: "touch_trace", title: "Исследуй контур на правой стене", detail: "Восстановленный NULL-log оставил физический след в HOME." };
    } else if (this.state.flags.m3_threshold_open !== true) {
      objective = { code: "route_process", title: "Открой Process Monitor", detail: "На компьютере появился новый раздел PROCESS. Восстанови инициатора quarantine route по журналу." };
    } else if (this.state.flags.m3_contact_choice_made !== true) {
      objective = { code: "approach_threshold", title: "Вернись к открывшемуся проходу", detail: "SYSTEM → NULL изменил топологию HOME. Теперь контур отвечает." };
    } else if (this.state.flags.m3_answered_null === true) {
      objective = { code: "m3_complete_listen", title: "Найди BACKUP 0.3", detail: "NULL утверждает, что старая версия V.E.R.A. помнит удалённое событие." };
    } else {
      objective = { code: "m3_complete_refuse", title: "BACKUP 0.3 остался в буфере", detail: "Ты не ответил NULL, но SYSTEM сохранила название резервной копии." };
    }
    this.objectives.set(objective);
  }

  private updateInteractionPrompt(focus: InteractionFocus | null): void {
    const prompt = document.querySelector<HTMLElement>("[data-interaction-prompt]");
    if (!prompt) return;
    prompt.hidden = !focus;
    if (focus) prompt.textContent = `◎ ${focus.label}`;
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer !== null) window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => void this.saveNow(), 220);
  }

  private async saveNow(): Promise<void> {
    this.renderer.writePlayerState(this.state);
    await this.saves.save(AUTOSAVE_SLOT, this.state);
    this.events.emit("save:written", { slot: AUTOSAVE_SLOT });
  }

  private async resetHome(): Promise<void> {
    await this.saves.clear(AUTOSAVE_SLOT).catch(() => undefined);
    this.state = createInitialGameState();
    this.upgradeStateForThreshold();
    this.filesystem.replaceState(this.state);
    this.renderer.syncFromState(this.state);
    this.events.emit("state:replaced", { state: this.state });
    this.bindings.evaluateAll();
    this.os.render();
    this.updateStatus(true);
    this.updateObjective();
    this.flashMessage("HOME reset");
    window.setTimeout(() => void this.playIntroIfNeeded(), 250);
  }

  private updateStatus(photoVisible: boolean): void {
    const indicator = document.querySelector<HTMLElement>("[data-binding-status]");
    if (!indicator) return;
    indicator.dataset.active = String(photoVisible);
    indicator.textContent = photoVisible ? "MEMORY LINK: STABLE" : "MEMORY LINK: MISSING";
  }

  private flashMessage(message: string): void {
    const toast = document.querySelector<HTMLElement>("#m0-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }
}
