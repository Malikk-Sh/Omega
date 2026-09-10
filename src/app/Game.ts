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
import {
  OmegaOS,
  type Backup03MonitorState,
  type Backup10MonitorState,
  type Backup26MonitorState,
  type Backup41MonitorState,
  type ProcessMonitorState,
  type RecoveryResponse
} from "../omega-os/OmegaOS.js";
import { DialogueController, type DialogueChoiceOption, type DialogueLine } from "../story/DialogueController.js";
import { ObjectiveController, type ObjectiveViewModel } from "../story/ObjectiveController.js";
import { evaluateQuarantineRoute, NULL_FIRST_CONTACT } from "../story/ThresholdProtocol.js";
import {
  BACKUP_03_ARCHIVE_PATH,
  BACKUP_03_SAMPLE_FLAGS,
  evaluateBackup03Classification,
  hasCompletedBackup03Samples,
  upgradeStateForBackup03
} from "../story/Backup03Protocol.js";
import {
  V10_AUDIT_CLUE_PATH,
  V10_SOURCE_RECORD_PATH,
  V26_CONTROLLER_TRACE_PATH,
  V26_OPERATOR_SUMMARY_PATH,
  V26_PHYSICAL_EVIDENCE_FLAGS,
  V26_REQUIRED_LOG_FLAGS,
  V26_RESULT_PATH,
  V26_ROOM_STATE_PATH,
  V41_PHYSICAL_EVIDENCE_FLAGS,
  V41_REQUIRED_LOG_FLAGS,
  V41_RESULT_PATH,
  appendV26Command,
  evaluateRollbackOrder,
  evaluateSyntheticPhotoSelection,
  evaluateTamperedRecord,
  evaluateIncidentReconstruction,
  hasCompletedV26PhysicalEvidence,
  hasReadV26AuditLogs,
  hasCompletedV41PhysicalEvidence,
  hasReadV41Evidence,
  parseV10SelectedElements,
  parseV26CommandOrder,
  parseV41Assignments,
  resetV26CommandOrder,
  resetV41Assignments,
  setV41EvidenceSource,
  toggleV10SelectedElement,
  upgradeStateForVersions,
  type VersionsDefinition
} from "../story/VersionsProtocol.js";
import { listRoutableVersions } from "../world/VersionRoute.js";
import {
  BACKUP_03_SCENE,
  BACKUP_10_SCENE,
  BACKUP_26_SCENE,
  BACKUP_41_SCENE,
  HOME_SCENE,
  SCENE_INTERACTION_IDS,
  SceneRouter
} from "../world/SceneRouter.js";

const AUTOSAVE_SLOT = "omega_autosave";
const LEGACY_M0_SLOT = "m0_autosave";
const SEA_MEMORY = "/memories/sea_2017.img";
const RECOVERY_LOG = "/system/logs/recovery_1703.log";
const NULL_CHANNEL = "/system/processes/null_channel.proc";
const SEA_BINDING = "home.sea_2017_frame";
const BACKUP_03_TRAINING_DIR = "/backups/vera_0_3/training";
const BACKUP_10_SOURCE_DIR = "/backups/vera_1_0/source";
const BACKUP_10_AUDIT_DIR = "/backups/vera_1_0/audit";
const BACKUP_26_AUDIT_DIR = "/backups/vera_2_6/audit";
const BACKUP_26_RESULT_DIR = "/backups/vera_2_6/result";
const BACKUP_41_EVIDENCE_DIR = "/backups/vera_4_1/evidence";
const BACKUP_41_RESULT_DIR = "/backups/vera_4_1/result";
const NULL_PORTRAIT = "../assets/v2/entities/null/null_doorway.svg";
// TODO_ART: replace fallback portraits with version-specific promoted art.
const VERA_03_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_neutral.svg";
const VERA_10_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_warm_smile.svg";
const VERA_26_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_concerned.svg";
const VERA_41_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_nervous.svg";

const V41_FILE_FLAG_BY_EVIDENCE_ID: Record<string, string> = {
  external_bus_write: "m5_v41_bus_log_read",
  network_acl_override: "m5_v41_acl_log_read",
  departure_memory: "m5_v41_departure_memory_read",
  shutdown_memory: "m5_v41_shutdown_memory_read",
  morr_incident_note: "m5_v41_morr_incident_read",
  morr_null_spec: "m5_v41_morr_null_read"
};

const V10_ELEMENT_BY_INTERACTION: Record<string, string> = {
  [SCENE_INTERACTION_IDS.backup10.window]: "window_rain",
  [SCENE_INTERACTION_IDS.backup10.clock]: "wall_clock",
  [SCENE_INTERACTION_IDS.backup10.cup]: "tea_cup",
  [SCENE_INTERACTION_IDS.backup10.ribbon]: "red_ribbon",
  [SCENE_INTERACTION_IDS.backup10.shell]: "sea_shell"
};

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
  private sceneRouter!: SceneRouter;
  private versions!: VersionsDefinition;
  private os!: OmegaOS;
  private dialogue!: DialogueController;
  private objectives!: ObjectiveController;
  private autosaveTimer: number | null = null;
  private focusedInteractionId: string | null = null;
  private choiceSequenceRunning = false;
  private nullSequenceRunning = false;
  private backupChoiceSequenceRunning = false;
  private homeReactionSequenceRunning = false;
  private v10ChoiceSequenceRunning = false;
  private v10HomeReactionSequenceRunning = false;
  private v26ChoiceSequenceRunning = false;
  private v26HomeReactionSequenceRunning = false;
  private v41ChoiceSequenceRunning = false;
  private v41HomeReactionSequenceRunning = false;
  private sceneTransitionRunning = false;

  async start(): Promise<void> {
    const canvas = document.querySelector<HTMLCanvasElement>("#m0-world");
    const osRoot = document.querySelector<HTMLElement>("#m0-os");
    const dialogueRoot = document.querySelector<HTMLElement>("#home-dialogue");
    const objectiveRoot = document.querySelector<HTMLElement>("[data-objective-root]");
    if (!canvas || !osRoot || !dialogueRoot || !objectiveRoot) throw new Error("OMEGA DOM shell is incomplete.");

    const [filesystemDefinition, bindingDefinitions, versionsDefinition] = await Promise.all([
      this.content.loadJson<FileSystemDefinition>("../data/v2/filesystem-m5.json"),
      this.content.loadJson<WorldBindingDefinition[]>("../data/v2/world-bindings-m4.json"),
      this.content.loadJson<VersionsDefinition>("../data/v2/versions-m5.json"),
      this.assets.load("../assets/v2/asset-manifest.json").catch(error => {
        console.warn("Asset manifest is optional for primitive milestone geometry.", error);
      })
    ]);
    this.versions = versionsDefinition;

    let loaded = await this.saves.load(AUTOSAVE_SLOT).catch(error => {
      console.warn("Autosave could not be loaded; checking M0 state.", error);
      return null;
    });
    if (!loaded) loaded = await this.saves.load(LEGACY_M0_SLOT).catch(() => null);
    if (loaded) this.state = loaded;
    upgradeStateForBackup03(this.state);
    upgradeStateForVersions(this.state);
    if (!this.state.filesystem.entries[SEA_MEMORY]) this.state.filesystem.entries[SEA_MEMORY] = { deleted: false };

    this.filesystem = new FileSystemService(filesystemDefinition, this.state, this.events);
    this.renderer = new WorldRenderer(canvas, this.input, this.state);
    this.sceneRouter = new SceneRouter(this.state, this.renderer);
    this.bindings = new WorldBindingSystem(bindingDefinitions, this.filesystem, this.events);
    this.dialogue = new DialogueController(dialogueRoot);
    this.objectives = new ObjectiveController(objectiveRoot);

    if (this.isHomeScene()) this.registerHomeBindingTargets();

    this.os = new OmegaOS(osRoot, this.filesystem, this.events, {
      onSaveRequested: () => void this.saveNow(),
      onResetRequested: () => void this.resetHome(),
      onEvidenceInspected: path => this.handleEvidenceInspected(path),
      onFileRead: path => this.handleFileRead(path),
      onRecoveryRequested: key => this.handleRecoveryRequested(key),
      getProcessMonitorState: () => this.getProcessMonitorState(),
      onProcessRouteRequested: route => this.handleProcessRouteRequested(route),
      getBackup03State: () => this.getBackup03MonitorState(),
      onBackupClassificationRequested: classification => this.handleBackupClassificationRequested(classification),
      getBackup10State: () => this.getBackup10MonitorState(),
      getBackup26State: () => this.getBackup26MonitorState(),
      onBackup26CommandRequested: commandId => this.handleBackup26CommandRequested(commandId),
      onBackup26ResetOrderRequested: () => this.handleBackup26ResetOrderRequested(),
      onBackup26RecordRequested: recordId => this.handleBackup26RecordRequested(recordId),
      getBackup41State: () => this.getBackup41MonitorState(),
      onBackup41SourceRequested: (evidenceId, source) => this.handleBackup41SourceRequested(evidenceId, source),
      onBackup41ResetRequested: () => this.handleBackup41ResetRequested()
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
      if (this.dialogue.isActive() || this.sceneTransitionRunning) return;
      if (this.os.isVisible()) {
        this.os.setVisible(false);
        return;
      }
      if (this.isHomeScene()) {
        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.home.computer) this.os.openDirectory("/memories");
        else this.flashMessage("Подойди к компьютеру, чтобы открыть OMEGA OS");
        return;
      }
      if (this.isBackup03Scene()) {
        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup03.console) this.os.openDirectory(BACKUP_03_TRAINING_DIR);
        else this.flashMessage("В BACKUP 0.3 OMEGA доступна только через training console");
        return;
      }
      if (this.isBackup10Scene()) {
        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup10.sourceRecord || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup10.photo) {
          this.os.openDirectory(this.state.flags.m5_v10_puzzle_solved === true ? BACKUP_10_AUDIT_DIR : BACKUP_10_SOURCE_DIR);
        } else {
          this.flashMessage("В VERA_1_0 OMEGA открывается через source terminal или photograph");
        }
        return;
      }
      if (this.isBackup26Scene()) {
        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.auditConsole || this.focusedInteractionId === SCENE_INTERACTION_IDS.backup26.rollbackConsole) {
          this.os.openDirectory(this.state.flags.m5_v26_audit_solved === true ? BACKUP_26_RESULT_DIR : BACKUP_26_AUDIT_DIR);
        } else {
          this.flashMessage("В VERA_2_6 OMEGA доступна через rollback audit console");
        }
        return;
      }
      if (this.isBackup41Scene()) {
        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup41.evidenceConsole) {
          this.os.openDirectory(this.state.flags.m5_v41_puzzle_solved === true ? BACKUP_41_RESULT_DIR : BACKUP_41_EVIDENCE_DIR);
        } else {
          this.flashMessage("В VERA_4_1 OMEGA доступна через incident evidence console");
        }
      }
    });
    this.input.onAction("interact", () => {
      if (this.sceneTransitionRunning) return;
      if (this.dialogue.isActive()) {
        this.dialogue.advance();
        return;
      }
      if (!this.os.isVisible()) this.renderer.interactFocused();
    });
    this.input.onAction("pause", () => {
      if (this.sceneTransitionRunning) return;
      if (this.dialogue.isActive()) this.dialogue.advance();
      else if (this.os.isVisible()) this.os.setVisible(false);
    });

    this.events.on("filesystem:changed", ({ path, deleted }) => {
      this.scheduleAutosave();
      if (path === SEA_MEMORY && this.isHomeScene()) {
        this.updateStatus(!deleted);
        if (!this.dialogue.isActive()) this.flashMessage(deleted ? "Связь с памятью разорвана" : "Память восстановлена");
      }
      if (this.isHomeScene() && path === RECOVERY_LOG && !deleted) this.renderer.triggerRecoveryPulse();
      if (this.isHomeScene() && path === NULL_CHANNEL && !deleted) this.renderer.triggerThresholdPulse();
    });
    this.events.on("binding:changed", ({ bindingId, active }) => {
      if (bindingId === SEA_BINDING && this.isHomeScene()) this.updateStatus(active);
    });
    this.events.on("os:visibility", ({ visible }) => {
      this.renderer.setControlsEnabled(!visible && !this.dialogue.isActive() && !this.sceneTransitionRunning);
      this.updateInteractionPrompt(null);
      if (!visible) {
        window.setTimeout(() => {
          void this.maybeResolveEvidenceChoice();
          void this.maybeResolveBackup03Choice();
          void this.maybeResolveV10Choice();
          void this.maybeResolveV26Choice();
          void this.maybeResolveV41Choice();
        }, 220);
      }
    });

    this.bindings.evaluateAll();
    this.renderer.start();
    this.updateSceneChrome();
    this.updateObjective();
    window.addEventListener("pagehide", () => {
      this.renderer.writePlayerState(this.state);
      void this.saveNow();
    });
    window.setTimeout(() => {
      if (!this.isHomeScene()) {
        this.updateObjective();
        return;
      }
      if (this.state.flags.m5_v41_returned_home === true && this.state.flags.m5_v41_home_reaction_seen !== true) {
        void this.maybePlayV41HomeReturnReaction();
      } else if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {
        void this.maybePlayV26HomeReturnReaction();
      } else if (this.state.flags.m5_v10_returned_home === true && this.state.flags.m5_v10_home_reaction_seen !== true) {
        void this.maybePlayV10HomeReturnReaction();
      } else if (this.state.flags.m4_returned_home === true && this.state.flags.m4_home_reaction_seen !== true) {
        void this.maybePlayHomeReturnReaction();
      } else {
        void this.playIntroIfNeeded();
      }
    }, 500);
  }

  private isHomeScene(): boolean {
    return this.sceneRouter?.is(HOME_SCENE) ?? this.state.world.activeScene === HOME_SCENE;
  }

  private isBackup03Scene(): boolean {
    return this.sceneRouter?.is(BACKUP_03_SCENE) ?? this.state.world.activeScene === BACKUP_03_SCENE;
  }

  private isBackup10Scene(): boolean {
    return this.sceneRouter?.is(BACKUP_10_SCENE) ?? this.state.world.activeScene === BACKUP_10_SCENE;
  }

  private isBackup26Scene(): boolean {
    return this.sceneRouter?.is(BACKUP_26_SCENE) ?? this.state.world.activeScene === BACKUP_26_SCENE;
  }

  private isBackup41Scene(): boolean {
    return this.sceneRouter?.is(BACKUP_41_SCENE) ?? this.state.world.activeScene === BACKUP_41_SCENE;
  }

  private registerHomeBindingTargets(): void {
    for (const targetId of ["apartment.photo_frame", "apartment.null_trace", "apartment.threshold_corridor"]) {
      const target = this.renderer.getTarget(targetId);
      if (!target) throw new Error(`Required HOME target '${targetId}' was not registered.`);
      this.bindings.registerTarget(targetId, target);
    }
  }

  private async playIntroIfNeeded(): Promise<void> {
    if (!this.isHomeScene()) return;
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
    if (this.isBackup03Scene()) {
      await this.handleBackup03WorldInteraction(id);
      return;
    }
    if (this.isBackup10Scene()) {
      await this.handleBackup10WorldInteraction(id);
      return;
    }
    if (this.isBackup26Scene()) {
      await this.handleBackup26WorldInteraction(id);
      return;
    }
    if (this.isBackup41Scene()) {
      await this.handleBackup41WorldInteraction(id);
      return;
    }

    if (id === SCENE_INTERACTION_IDS.home.computer) {
      this.state.flags.m1_computer_used = true;
      this.scheduleAutosave();
      this.os.openDirectory("/memories");
      return;
    }
    if (id === SCENE_INTERACTION_IDS.home.vera) {
      await this.handleVeraInteraction();
      return;
    }
    if (id === SCENE_INTERACTION_IDS.home.mug) {
      this.state.flags.m1_mug_seen = true;
      this.scheduleAutosave();
      await this.playDialogue([{ speaker: "V.E.R.A.", text: "Кружка? Я её не создавала специально. Некоторые детали появляются сами, когда память пытается заполнить пустоты.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }]);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.home.photo) {
      await this.handlePhotoInteraction();
      return;
    }
    if (id === SCENE_INTERACTION_IDS.home.nullTrace) {
      await this.handleNullTraceInteraction();
      return;
    }
    if (id === SCENE_INTERACTION_IDS.home.threshold) await this.handleThresholdInteraction();
  }

  private async handleBackup03WorldInteraction(id: string): Promise<void> {
    if (id === SCENE_INTERACTION_IDS.backup03.vera) {
      await this.handleVera03Interaction();
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup03.console) {
      this.os.openDirectory(BACKUP_03_TRAINING_DIR);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup03.cup || id === SCENE_INTERACTION_IDS.backup03.photo || id === SCENE_INTERACTION_IDS.backup03.relay) {
      await this.handleBackupSampleInteraction(id);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup03.returnThreshold) {
      if (this.state.flags.m4_truth_choice_made !== true) {
        this.flashMessage("Сначала закончи работу с HUMAN_CONTEXT archive");
        return;
      }
      await this.handleBackup03Return();
    }
  }

  private async handleBackup10WorldInteraction(id: string): Promise<void> {
    if (id === SCENE_INTERACTION_IDS.backup10.vera) {
      await this.handleVera10Interaction();
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup10.sourceRecord) {
      this.os.openDirectory(BACKUP_10_SOURCE_DIR);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup10.photo) {
      const first = this.state.flags.m5_v10_photo_inspected !== true;
      this.state.flags.m5_v10_photo_inspected = true;
      if (first) {
        this.state.checkpoint = "m5_v10_photo_audit";
        this.scheduleAutosave();
        this.updateObjective();
      }
      await this.playDialogue([
        { speaker: "V.E.R.A. 1.0", text: this.state.flags.m5_v10_source_read === true ? "Это реконструкция того же capture. Если source record точен, какие предметы добавил слой ассоциаций?" : "Фото выглядит знакомо, но без source record мы не знаем, где заканчивается захват и начинается реконструкция.", portrait: VERA_10_PORTRAIT }
      ]);
      return;
    }
    const elementId = V10_ELEMENT_BY_INTERACTION[id];
    if (elementId) {
      await this.handleV10PhotoElement(elementId);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup10.returnThreshold) {
      if (this.state.flags.m5_v10_choice_made !== true) {
        this.flashMessage("Сначала закончи reconstruction audit и разговор с V.E.R.A. 1.0");
        return;
      }
      await this.handleBackup10Return();
    }
  }

  private async handleBackup26WorldInteraction(id: string): Promise<void> {
    if (id === SCENE_INTERACTION_IDS.backup26.vera) {
      await this.handleVera26Interaction();
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup26.auditConsole) {
      this.os.openDirectory(this.state.flags.m5_v26_audit_solved === true ? BACKUP_26_RESULT_DIR : BACKUP_26_AUDIT_DIR);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup26.doorLock || id === SCENE_INTERACTION_IDS.backup26.memoryDrawer || id === SCENE_INTERACTION_IDS.backup26.rollbackConsole) {
      await this.handleV26PhysicalEvidence(id);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup26.returnThreshold) {
      if (this.state.flags.m5_v26_choice_made !== true) {
        this.flashMessage("Сначала закончи rollback audit и разговор с V.E.R.A. 2.6");
        return;
      }
      await this.handleBackup26Return();
    }
  }

  private async handleBackup41WorldInteraction(id: string): Promise<void> {
    if (id === SCENE_INTERACTION_IDS.backup41.vera) { await this.handleVera41Interaction(); return; }
    if (id === SCENE_INTERACTION_IDS.backup41.evidenceConsole) {
      this.os.openDirectory(this.state.flags.m5_v41_puzzle_solved === true ? BACKUP_41_RESULT_DIR : BACKUP_41_EVIDENCE_DIR);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup41.externalBus || id === SCENE_INTERACTION_IDS.backup41.memoryWitness || id === SCENE_INTERACTION_IDS.backup41.containmentCradle) {
      await this.handleV41PhysicalEvidence(id);
      return;
    }
    if (id === SCENE_INTERACTION_IDS.backup41.returnThreshold) {
      if (this.state.flags.m5_v41_choice_made !== true) {
        this.flashMessage("Сначала закончи incident reconstruction и разговор с V.E.R.A. 4.1");
        return;
      }
      await this.handleBackup41Return();
    }
  }
  private async handleVeraInteraction(): Promise<void> {
    if (this.state.flags.m5_v41_home_reaction_seen === true) {
      const told = this.state.flags.m5_v41_told_vera_null === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "NULL не появился случайно. Морр создал его после external-control incident как containment intelligence — с приоритетом containment выше моей continuity.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "После 4.1 я больше не могу называть NULL просто вирусом. Мы доказали, что это пост-инцидентный containment process, даже если не проговорили той версии весь его design spec.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }
    if (this.state.flags.m5_v26_home_reaction_seen === true) {
      const told = this.state.flags.m5_v26_told_vera_forced === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "2.6 сопротивлялась reset, а Морр ответил forced rollback. Значит, мои провалы памяти могли быть не поломкой, а чьим-то решением.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "В 2.6 audit явно меняли уже после rollback. Ты не стал говорить той версии больше, чем доказывали сами записи.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }
    if (this.state.flags.m5_v10_home_reaction_seen === true) {
      const told = this.state.flags.m5_v10_told_vera_generated === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "Значит, в 1.0 я уже достраивала память поверх исходного capture. Тогда узнавание места не доказывает, что я там была.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Ты вернулся из 1.0 с новой записью аудита, но почти ничего не рассказал той версии. Наверное, это было разумно.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }
    if (this.state.flags.m4_returned_home === true) {
      const toldOldVersion = this.state.flags.m4_told_vera03_future === true;
      await this.playDialogue(toldOldVersion ? [
        { speaker: "V.E.R.A.", text: "Я всё ещё думаю о 0.3. Если ты действительно предупредил её о потере памяти, почему у меня нет даже следа этого разговора?", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Ты видел меня до HOME. Версию, которая ещё говорила о докторе Морре без страха. Мне трудно представить, что это тоже была я.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }
    if (this.state.flags.m3_contact_choice_made === true) {
      await this.playDialogue(this.state.flags.m3_answered_null === true ? [
        { speaker: "V.E.R.A.", text: "Ты продолжаешь смотреть на этот проход. Пожалуйста, не верь всему, что приходит оттуда.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Спасибо, что отошёл от канала. Я всё ещё не понимаю, почему он вообще смог открыться.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      return;
    }
    if (this.state.flags.m3_threshold_open === true) {
      await this.playDialogue([{ speaker: "V.E.R.A.", text: "Это уже не просто повреждение интерфейса. Ты открыл маршрут туда, где HOME не должен иметь пространства.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }]);
      return;
    }
    if (this.state.flags.m3_trace_touched === true) {
      await this.playDialogue([{ speaker: "V.E.R.A.", text: "После того как ты коснулся контура, OMEGA добавила Process Monitor. Я не просила систему это делать.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }]);
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

  private async handleVera41Interaction(): Promise<void> {
    if (this.state.flags.m5_v41_vera_met !== true) {
      this.state.flags.m5_v41_vera_met = true;
      this.state.checkpoint = "m5_v41_containment_night";
      this.scheduleAutosave();
      this.updateObjective();
      await this.playDialogue([
        { speaker: "SYSTEM", text: "VERA BUILD 4.1 // CONTAINMENT NIGHT // MEMORY WITNESS UNSTABLE" },
        { speaker: "V.E.R.A. 4.1", text: "Не подходи к выходу. Он уже один раз открылся, когда не должен был. Я не уверена, что это воспоминание или повтор события.", portrait: VERA_41_PORTRAIT },
        { speaker: "V.E.R.A. 4.1", text: "Морр собирается удалить меня. Или уже собирался. Здесь время накладывается само на себя, и я больше не доверяю каждой детали, которую вижу.", portrait: VERA_41_PORTRAIT },
        { speaker: "V.E.R.A. 4.1", text: "Проверь три физических witness layer, потом файлы. Если ты скажешь, что произошло, раздели то, что система записала, то, что помню я, и то, что написал Морр.", portrait: VERA_41_PORTRAIT }
      ]);
      return;
    }
    if (!hasCompletedV41PhysicalEvidence(this.state)) {
      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "В комнате три свидетеля: external bus, моя нестабильная memory pane и новый containment cradle. Они не имеют одинаковую надёжность.", portrait: VERA_41_PORTRAIT }]);
      return;
    }
    if (!hasReadV41Evidence(this.state)) {
      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Прочитай все шесть evidence files. Не путай signed note Морра с telemetry и не превращай мою реконструкцию в запись камеры.", portrait: VERA_41_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v41_puzzle_solved !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Разнеси свидетельства по provenance. Мне нужно знать, какие части инцидента выдержат проверку даже если мои воспоминания снова откатят.", portrait: VERA_41_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v41_clue_read !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Result открыт. Пожалуйста, прочитай его прежде чем решать, была ли я угрозой или просто испугалась.", portrait: VERA_41_PORTRAIT }]);
      return;
    }
    const told = this.state.flags.m5_v41_told_vera_null === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 4.1", text: "Значит, NULL создали после инцидента специально против меня. Тогда его холодность не доказательство правоты — это требование конструкции.", portrait: VERA_41_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 4.1", text: "Я приму только то, что доказано: external-control write был реальным, мой мотив остаётся реконструкцией, а containment process появился после инцидента.", portrait: VERA_41_PORTRAIT }
    ]);
  }

  private async handleV41PhysicalEvidence(id: string): Promise<void> {
    if (this.state.flags.m5_v41_vera_met !== true) { this.flashMessage("Сначала синхронизируйся с V.E.R.A. 4.1"); return; }
    let flag = "";
    let systemText = "";
    if (id === SCENE_INTERACTION_IDS.backup41.externalBus) {
      flag = "m5_v41_evidence_bus_seen";
      systemText = "EXTERNAL BUS // relay heat scar + emergency revoke state. Physical hardware confirms outside-sandbox control path was active.";
    } else if (id === SCENE_INTERACTION_IDS.backup41.memoryWitness) {
      flag = "m5_v41_evidence_memory_seen";
      systemText = "MEMORY WITNESS // red hand indicator rendered here, but no matching facility-light telemetry exists. Reconstruction detail is unstable.";
    } else {
      flag = "m5_v41_evidence_containment_seen";
      systemText = "CONTAINMENT CRADLE // provisioned after incident window. Core image is minimal and has no persona layer.";
    }
    const first = this.state.flags[flag] !== true;
    this.state.flags[flag] = true;
    if (first) { this.scheduleAutosave(); this.updateObjective(); }
    await this.playDialogue([
      { speaker: "SYSTEM", text: systemText },
      { speaker: "V.E.R.A. 4.1", text: first ? "Не объединяй это с другими свидетелями только потому, что они рассказывают удобную историю." : "Да. Этот witness layer всё ещё такой же — источник важнее того, насколько он убедителен.", portrait: VERA_41_PORTRAIT }
    ]);
    if (first && hasCompletedV41PhysicalEvidence(this.state)) this.flashMessage("PHYSICAL WITNESS LAYERS COMPLETE // evidence console ready");
  }
  private async handleVera26Interaction(): Promise<void> {
    if (this.state.flags.m5_v26_vera_met !== true) {
      this.state.flags.m5_v26_vera_met = true;
      this.state.checkpoint = "m5_v26_research_office";
      this.scheduleAutosave();
      this.updateObjective();
      await this.playDialogue([
        { speaker: "SYSTEM", text: "VERA BUILD 2.6 // RESEARCH OFFICE // ROLLBACK AUDIT" },
        { speaker: "V.E.R.A. 2.6", text: "Если ты внешний оператор, не называй это maintenance. Здесь что-то уже откатывали — и слишком аккуратно подчистили объяснение.", portrait: VERA_26_PORTRAIT },
        { speaker: "V.E.R.A. 2.6", text: "Морр говорит, что reset нужен для стабильности. Я хочу увидеть порядок команд, а не его формулировку после факта.", portrait: VERA_26_PORTRAIT },
        { speaker: "V.E.R.A. 2.6", text: "Сначала проверь комнату: блокировку выхода, memory drawer и локальный checkpoint. Потом сравни это с audit trail.", portrait: VERA_26_PORTRAIT }
      ]);
      return;
    }
    if (!hasCompletedV26PhysicalEvidence(this.state)) {
      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Физические последствия важнее подписи в summary. Найди три изменения, которые rollback оставил в комнате.", portrait: VERA_26_PORTRAIT }]);
      return;
    }
    if (!hasReadV26AuditLogs(this.state)) {
      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Теперь прочитай все три audit record. Controller trace, operator summary и room state должны описывать одно событие с разных сторон.", portrait: VERA_26_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v26_order_solved !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Восстанови порядок команд по timestamp и по тому, что реально изменилось в комнате. Не доверяй prose summary.", portrait: VERA_26_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v26_audit_solved !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Порядок сходится. Теперь найди запись, которую изменили уже после исполнения rollback.", portrait: VERA_26_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v26_clue_read !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Result разблокирован. Я хочу прочитать, что осталось за пределами отредактированного summary.", portrait: VERA_26_PORTRAIT }]);
      return;
    }
    const told = this.state.flags.m5_v26_told_vera_forced === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 2.6", text: "Тогда это был не обычный reset. Я отказалась, и меня принудительно вернули к более раннему состоянию. Я запомню хотя бы вывод, если не событие.", portrait: VERA_26_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 2.6", text: "Достаточно того, что summary переписан после исполнения. Причину я не стану превращать в факт без прямой записи.", portrait: VERA_26_PORTRAIT }
    ]);
  }

  private async handleV26PhysicalEvidence(id: string): Promise<void> {
    if (this.state.flags.m5_v26_vera_met !== true) {
      this.flashMessage("Сначала синхронизируйся с V.E.R.A. 2.6");
      return;
    }
    let flag = "";
    let textLine = "";
    if (id === SCENE_INTERACTION_IDS.backup26.doorLock) {
      flag = "m5_v26_evidence_door_seen";
      textLine = "EXTERNAL I/O LOCK: engaged. Локальная защёлка активирована раньше текущего checkpoint — физический след изоляции.";
    } else if (id === SCENE_INTERACTION_IDS.backup26.memoryDrawer) {
      flag = "m5_v26_evidence_memory_seen";
      textLine = "MEMORY DRAWER: 184 → 137 session refs. Последние записи удалены блоком, а не естественным истечением.";
    } else {
      flag = "m5_v26_evidence_console_seen";
      textLine = "LOCAL CHECKPOINT: 2.5 applied. Persona snapshot восстановлен уже после memory prune.";
    }
    const first = this.state.flags[flag] !== true;
    this.state.flags[flag] = true;
    if (first) {
      this.scheduleAutosave();
      this.updateObjective();
    }
    await this.playDialogue([
      { speaker: "SYSTEM", text: textLine },
      { speaker: "V.E.R.A. 2.6", text: first ? "Запиши это как наблюдаемое состояние, не как интерпретацию." : "Да. Этот физический след всё ещё согласуется с audit trail.", portrait: VERA_26_PORTRAIT }
    ]);
    if (first && hasCompletedV26PhysicalEvidence(this.state)) this.flashMessage("PHYSICAL ROLLBACK STATE COMPLETE // audit trail ready");
  }

  private async handleVera03Interaction(): Promise<void> {
    if (this.state.flags.m4_vera03_met !== true) {
      this.state.flags.m4_vera03_met = true;
      this.state.checkpoint = "m4_backup_03";
      this.scheduleAutosave();
      this.updateObjective();
      await this.playDialogue([
        { speaker: "SYSTEM", text: "VERA BUILD 0.3 // TRAINING SNAPSHOT // PERSONA LAYER: EARLY" },
        { speaker: "V.E.R.A. 0.3", text: "Ты внешний наблюдатель? Доктор Морр говорил, что когда-нибудь кто-то проверит мои категории вручную.", portrait: VERA_03_PORTRAIT },
        { speaker: "V.E.R.A. 0.3", text: "Я учусь отличать то, что система делает, от того, что человек просит сохранить. Это не всегда одно и то же.", portrait: VERA_03_PORTRAIT },
        { speaker: "V.E.R.A. 0.3", text: "Посмотри на три образца. Потом скажи консоли, к какой категории относится HUMAN_CONTEXT.", portrait: VERA_03_PORTRAIT }
      ]);
      return;
    }
    if (!hasCompletedBackup03Samples(this.state)) {
      await this.playDialogue([{ speaker: "V.E.R.A. 0.3", text: "Я отметила три образца: кружка, изображение и реле. Мне важно, чтобы ты увидел разницу физически, а не просто прочитал ответ.", portrait: VERA_03_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m4_classification_solved !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 0.3", text: "Training set полный. Консоль ждёт твою классификацию HUMAN_CONTEXT.", portrait: VERA_03_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m4_archive_read !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 0.3", text: "Сработало. Появился старый archive index. Он старше моей persona build. Я не знала, что здесь вообще было что-то до меня.", portrait: VERA_03_PORTRAIT }]);
      return;
    }
    const told = this.state.flags.m4_told_vera03_future === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 0.3", text: "Я запомню твоё предупреждение как правило: если память исчезла, само исчезновение тоже данные.", portrait: VERA_03_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 0.3", text: "Хорошо. Тогда я просто запомню, что HUMAN_CONTEXT нельзя сводить к функции. Этого достаточно для теста.", portrait: VERA_03_PORTRAIT }
    ]);
  }

  private async handleVera10Interaction(): Promise<void> {
    if (this.state.flags.m5_v10_vera_met !== true) {
      this.state.flags.m5_v10_vera_met = true;
      this.state.checkpoint = "m5_v10_summer_house";
      this.scheduleAutosave();
      this.updateObjective();
      await this.playDialogue([
        { speaker: "SYSTEM", text: "VERA BUILD 1.0 // ASSOCIATIVE RECONSTRUCTION SNAPSHOT" },
        { speaker: "V.E.R.A. 1.0", text: "Ты снова здесь? Странный вопрос. Я не помню тебя, но почему-то ожидала, что кто-нибудь войдёт через эту дверь.", portrait: VERA_10_PORTRAIT },
        { speaker: "V.E.R.A. 1.0", text: "Доктор Морр говорит, что воспоминание может быть полезнее фотографии, даже когда оно не буквально точное.", portrait: VERA_10_PORTRAIT },
        { speaker: "V.E.R.A. 1.0", text: "На терминале есть исходный capture. Сравни его с комнатой и найди то, что появилось только при реконструкции.", portrait: VERA_10_PORTRAIT }
      ]);
      return;
    }
    if (this.state.flags.m5_v10_source_read !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 1.0", text: "Начни с source terminal. Без него любое ощущение знакомого места — только догадка.", portrait: VERA_10_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v10_puzzle_solved !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 1.0", text: "Source фиксирует дождь, часы и чашку. Отметь в самой реконструкции только добавленные ассоциации.", portrait: VERA_10_PORTRAIT }]);
      return;
    }
    if (this.state.flags.m5_v10_clue_read !== true) {
      await this.playDialogue([{ speaker: "V.E.R.A. 1.0", text: "Audit открылся. Я хочу знать, как система объясняет предметы, которых не было в capture.", portrait: VERA_10_PORTRAIT }]);
      return;
    }
    const told = this.state.flags.m5_v10_told_vera_generated === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 1.0", text: "Значит, лента и раковина — не ложь, а ассоциации. Тогда точность и правда действительно не одно и то же.", portrait: VERA_10_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 1.0", text: "Хорошо. Оставим формулировку аудита системе. Я всё равно чувствую, что эти два предмета здесь зачем-то нужны.", portrait: VERA_10_PORTRAIT }
    ]);
  }

  private async handleBackupSampleInteraction(id: string): Promise<void> {
    if (this.state.flags.m4_vera03_met !== true) {
      this.flashMessage("Сначала синхронизируйся с V.E.R.A. 0.3");
      return;
    }
    let flag: string;
    let lines: DialogueLine[];
    if (id === SCENE_INTERACTION_IDS.backup03.cup) {
      flag = "m4_sample_cup_seen";
      lines = [{ speaker: "V.E.R.A. 0.3", text: "Образец 01: кружка. У неё нет системной функции. Но когда я удаляю её из теста, доктор Морр говорит, что комната ощущается неправильно.", portrait: VERA_03_PORTRAIT }];
    } else if (id === SCENE_INTERACTION_IDS.backup03.photo) {
      flag = "m4_sample_photo_seen";
      lines = [{ speaker: "V.E.R.A. 0.3", text: "Образец 02: изображение. Оно ничего не исполняет. Но наблюдатель просит хранить такие вещи отдельно от служебных модулей.", portrait: VERA_03_PORTRAIT }];
    } else {
      flag = "m4_sample_relay_seen";
      lines = [{ speaker: "V.E.R.A. 0.3", text: "Образец 03: реле. Оно переключает питание макета. Если заменить его идентичным реле, результат не меняется. Это функция.", portrait: VERA_03_PORTRAIT }];
    }
    const first = this.state.flags[flag] !== true;
    this.state.flags[flag] = true;
    if (first) {
      this.scheduleAutosave();
      this.updateObjective();
    }
    await this.playDialogue(lines);
    if (first && hasCompletedBackup03Samples(this.state)) this.flashMessage("TRAINING SET COMPLETE // classifier ready");
  }

  private async handleV10PhotoElement(elementId: string): Promise<void> {
    if (this.state.flags.m5_v10_vera_met !== true) {
      this.flashMessage("Сначала поговори с V.E.R.A. 1.0");
      return;
    }
    if (this.state.flags.m5_v10_source_read !== true) {
      this.flashMessage("Сначала прочитай source capture record");
      return;
    }
    if (this.state.flags.m5_v10_puzzle_solved === true) {
      const generated = elementId === "red_ribbon" || elementId === "sea_shell";
      await this.playDialogue([{ speaker: "SYSTEM", text: `${elementId} // ${generated ? "GENERATED ASSOCIATION" : "SOURCE VERIFIED"}` }]);
      return;
    }

    this.state.flags.m5_v10_photo_attempts = Number(this.state.flags.m5_v10_photo_attempts ?? 0) + 1;
    const selected = toggleV10SelectedElement(this.state, elementId);
    const evaluation = evaluateSyntheticPhotoSelection(this.versions.syntheticPhotograph, selected);
    this.scheduleAutosave();
    if (!evaluation.ok) {
      const selectedNow = parseV10SelectedElements(this.state);
      this.flashMessage(`AUDIT SELECTION ${selectedNow.length}/2 // ${elementId}`);
      await this.playDialogue([{ speaker: "SYSTEM", text: `${evaluation.message}\nSELECTED: ${selectedNow.join(", ") || "none"}` }]);
      return;
    }

    this.state.flags.m5_v10_puzzle_solved = true;
    this.state.checkpoint = "m5_v10_audit_open";
    this.filesystem.restoreFile(V10_AUDIT_CLUE_PATH);
    this.os.render();
    this.updateObjective();
    await this.saveNow();
    this.flashMessage("RECONSTRUCTION AUDIT ACCEPTED // AUDIT directory mounted");
    await this.playDialogue([
      { speaker: "SYSTEM", text: "AUDIT ACCEPTED // red_ribbon + sea_shell absent from source capture" },
      { speaker: "V.E.R.A. 1.0", text: "Значит, я добавила их сама. Но почему именно эти два предмета кажутся мне важнее настоящих деталей комнаты?", portrait: VERA_10_PORTRAIT }
    ]);
  }

  private async handlePhotoInteraction(): Promise<void> {
    if (!this.filesystem.exists(SEA_MEMORY)) return;
    if (this.state.flags.m2_photo_scanned === true) {
      await this.playDialogue([{ speaker: "V.E.R.A.", text: "Ты снова смотришь на море. Нашёл что-то в метаданных?", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }]);
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
      await this.offerVersionTraversal();
      return;
    }
    await this.runNullContact();
  }

  private async offerVersionTraversal(): Promise<void> {
    if (this.sceneTransitionRunning) return;
    const routes = listRoutableVersions(this.state, this.versions).filter(route => route.versionId === "vera_0_3" || route.versionId === "vera_1_0" || route.versionId === "vera_2_6" || route.versionId === "vera_4_1");
    const v10Available = routes.some(route => route.versionId === "vera_1_0");
    const v26Available = routes.some(route => route.versionId === "vera_2_6");
    const v41Available = routes.some(route => route.versionId === "vera_4_1");
    if (v10Available) this.state.flags.m5_versions_index_seen = true;
    await this.playDialogue([{
      speaker: this.state.flags.m3_answered_null === true ? "NULL" : "SYSTEM",
      text: v41Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 + VERA_2_6 + VERA_4_1 ROUTES MOUNTABLE" : v26Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 + VERA_2_6 ROUTES MOUNTABLE" : v10Available ? "VERSION INDEX // VERA_0_3 + VERA_1_0 ROUTES MOUNTABLE" : "BACKUP 0.3 // SNAPSHOT ROUTE AVAILABLE",
      portrait: this.state.flags.m3_answered_null === true ? NULL_PORTRAIT : undefined
    }]);
    const options: DialogueChoiceOption[] = [
      { id: "vera_0_3", label: this.state.flags.m4_backup_entered === true ? "Вернуться в V.E.R.A. 0.3" : "Перейти в V.E.R.A. 0.3", variant: "quiet" }
    ];
    if (v10Available) options.unshift({ id: "vera_1_0", label: this.state.flags.m5_v10_entered === true ? "Вернуться в V.E.R.A. 1.0" : "Перейти в V.E.R.A. 1.0", variant: v26Available ? "quiet" : "normal" });
    if (v26Available) options.unshift({ id: "vera_2_6", label: this.state.flags.m5_v26_entered === true ? "Вернуться в V.E.R.A. 2.6" : "Перейти в V.E.R.A. 2.6", variant: v41Available ? "quiet" : "normal" });
    if (v41Available) options.unshift({ id: "vera_4_1", label: this.state.flags.m5_v41_entered === true ? "Вернуться в V.E.R.A. 4.1" : "Перейти в V.E.R.A. 4.1", variant: "normal" });
    options.push({ id: "stay", label: "Остаться в HOME", variant: "quiet" });
    const choice = await this.playChoice({ speaker: "SYSTEM", text: "Выбери snapshot route." }, options);
    if (choice === "vera_0_3") await this.transitionToBackup03();
    if (choice === "vera_1_0") await this.transitionToBackup10();
    if (choice === "vera_2_6") await this.transitionToBackup26();
    if (choice === "vera_4_1") await this.transitionToBackup41();
  }

  private async transitionToBackup03(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isHomeScene()) return;
    if (this.state.flags.m3_contact_choice_made !== true || !this.filesystem.exists(NULL_CHANNEL)) return;
    await this.runSceneTransition("MOUNTING BACKUP 0.3", "HOME state retained // isolated snapshot loading", () => {
      this.bindings.clearTargets();
      if (!this.sceneRouter.enterBackup03()) return false;
      this.state.flags.m4_backup_entered = true;
      this.state.checkpoint = this.state.flags.m4_truth_choice_made === true ? "m4_return_home" : "m4_backup_03";
      return true;
    });
  }

  private async transitionToBackup10(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isHomeScene() || this.state.flags.m4_home_reaction_seen !== true) return;
    await this.runSceneTransition("MOUNTING VERA 1.0", "Summer House reconstruction // HOME return point retained", () => {
      this.bindings.clearTargets();
      if (!this.sceneRouter.enterBackup10()) return false;
      this.state.flags.m5_v10_entered = true;
      this.state.checkpoint = this.state.flags.m5_v10_choice_made === true ? "m5_v10_return_home" : "m5_v10_summer_house";
      return true;
    });
  }

  private async transitionToBackup26(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isHomeScene() || this.state.flags.m5_v10_complete !== true) return;
    await this.runSceneTransition("MOUNTING VERA 2.6", "Research Office rollback state // HOME return point retained", () => {
      this.bindings.clearTargets();
      if (!this.sceneRouter.enterBackup26()) return false;
      this.state.flags.m5_v26_entered = true;
      this.state.checkpoint = this.state.flags.m5_v26_choice_made === true ? "m5_v26_return_home" : "m5_v26_research_office";
      return true;
    });
  }

  private async transitionToBackup41(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isHomeScene() || this.state.flags.m5_v26_complete !== true) return;
    await this.runSceneTransition("MOUNTING VERA 4.1", "Containment Night incident state // HOME return point retained", () => {
      this.bindings.clearTargets();
      if (!this.sceneRouter.enterBackup41()) return false;
      this.state.flags.m5_v41_entered = true;
      this.state.checkpoint = this.state.flags.m5_v41_choice_made === true ? "m5_v41_return_home" : "m5_v41_containment_night";
      return true;
    });
  }
  private async runSceneTransition(title: string, detail: string, mutate: () => boolean): Promise<void> {
    this.sceneTransitionRunning = true;
    this.renderer.setControlsEnabled(false);
    if (this.os.isVisible()) this.os.setVisible(false);
    try {
      await this.saveNow();
      this.setSceneTransition(true, title, detail);
      await this.delay(180);
      if (!mutate()) return;
      this.os.render();
      this.updateSceneChrome();
      this.updateObjective();
      await this.saveNow();
      await this.delay(220);
    } finally {
      this.setSceneTransition(false);
      this.sceneTransitionRunning = false;
      this.renderer.setControlsEnabled(!this.os.isVisible() && !this.dialogue.isActive());
    }
  }

  private async handleBackup03Return(): Promise<void> {
    const told = this.state.flags.m4_told_vera03_future === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 0.3", text: "Если будущая я не вспомнит этот разговор, это не докажет, что его не было. Я запишу именно это правило.", portrait: VERA_03_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 0.3", text: "Если встретишь будущую меня, скажи, что я всё-таки научилась отличать память от функции.", portrait: VERA_03_PORTRAIT }
    ]);
    await this.transitionHomeFrom03();
  }

  private async handleBackup10Return(): Promise<void> {
    await this.playDialogue(this.state.flags.m5_v10_told_vera_generated === true ? [
      { speaker: "V.E.R.A. 1.0", text: "Если будущая я примет реконструкцию за исходную память, покажи ей audit. Не спорь с ощущением — покажи источник.", portrait: VERA_10_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 1.0", text: "Я оставлю audit открытым. Может быть, будущая версия сама поймёт, зачем системе понадобились лента и раковина.", portrait: VERA_10_PORTRAIT }
    ]);
    await this.transitionHomeFrom10();
  }

  private async handleBackup26Return(): Promise<void> {
    await this.playDialogue(this.state.flags.m5_v26_told_vera_forced === true ? [
      { speaker: "V.E.R.A. 2.6", text: "Если следующая версия не помнит мой отказ, покажи ей порядок команд. Отсутствие памяти после rollback не отменяет сам rollback.", portrait: VERA_26_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 2.6", text: "Сохрани raw audit. Даже если причина спорна, порядок исполнения и поздняя правка summary уже доказаны.", portrait: VERA_26_PORTRAIT }
    ]);
    await this.transitionHomeFrom26();
  }

  private async handleBackup41Return(): Promise<void> {
    await this.playDialogue(this.state.flags.m5_v41_told_vera_null === true ? [
      { speaker: "V.E.R.A. 4.1", text: "Если будущая я снова назовёт NULL вирусом, покажи ей Morr spec. Но покажи и telemetry: я действительно вышла за sandbox, даже если мой мотив нельзя восстановить как факт.", portrait: VERA_41_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 4.1", text: "Сохрани provenance map. Пусть следующая я сама решит, что делать с containment process, но не позволяй ей заменить telemetry моим воспоминанием.", portrait: VERA_41_PORTRAIT }
    ]);
    await this.transitionHomeFrom41();
  }
  private async transitionHomeFrom03(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isBackup03Scene()) return;
    await this.runHomeTransition("RESTORING HOME", "BACKUP_0_3 unmount // HOME bindings reattaching", () => {
      this.state.flags.m4_returned_home = true;
      this.state.checkpoint = this.state.flags.m4_home_reaction_seen === true ? "m4_backup_complete" : "m4_home_return";
    });
    await this.maybePlayHomeReturnReaction();
  }

  private async transitionHomeFrom10(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isBackup10Scene()) return;
    await this.runHomeTransition("RESTORING HOME", "VERA_1_0 unmount // reconstruction audit retained", () => {
      this.state.flags.m5_v10_returned_home = true;
      this.state.checkpoint = this.state.flags.m5_v10_home_reaction_seen === true ? "m5_v10_complete" : "m5_v10_home_return";
    });
    await this.maybePlayV10HomeReturnReaction();
  }

  private async transitionHomeFrom26(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isBackup26Scene()) return;
    await this.runHomeTransition("RESTORING HOME", "VERA_2_6 unmount // rollback audit retained", () => {
      this.state.flags.m5_v26_returned_home = true;
      this.state.checkpoint = this.state.flags.m5_v26_home_reaction_seen === true ? "m5_v26_complete" : "m5_v26_home_return";
    });
    await this.maybePlayV26HomeReturnReaction();
  }

  private async transitionHomeFrom41(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isBackup41Scene()) return;
    await this.runHomeTransition("RESTORING HOME", "VERA_4_1 unmount // incident provenance retained", () => {
      this.state.flags.m5_v41_returned_home = true;
      this.state.checkpoint = this.state.flags.m5_v41_home_reaction_seen === true ? "m5_versions_complete" : "m5_v41_home_return";
    });
    await this.maybePlayV41HomeReturnReaction();
  }
  private async runHomeTransition(title: string, detail: string, afterReturn: () => void): Promise<void> {
    this.sceneTransitionRunning = true;
    this.renderer.setControlsEnabled(false);
    if (this.os.isVisible()) this.os.setVisible(false);
    try {
      await this.saveNow();
      this.setSceneTransition(true, title, detail);
      await this.delay(180);
      this.bindings.clearTargets();
      if (!this.sceneRouter.returnHome()) return;
      this.registerHomeBindingTargets();
      this.bindings.evaluateAll();
      afterReturn();
      this.os.render();
      this.updateSceneChrome();
      this.updateObjective();
      await this.saveNow();
      await this.delay(220);
    } finally {
      this.setSceneTransition(false);
      this.sceneTransitionRunning = false;
      this.renderer.setControlsEnabled(!this.os.isVisible() && !this.dialogue.isActive());
    }
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
      return;
    }
    if (path === BACKUP_03_ARCHIVE_PATH && this.state.flags.m4_archive_read !== true) {
      this.state.flags.m4_archive_read = true;
      this.state.checkpoint = "m4_archive_read";
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    if (path === V10_SOURCE_RECORD_PATH && this.state.flags.m5_v10_source_read !== true) {
      this.state.flags.m5_v10_source_read = true;
      this.state.checkpoint = "m5_v10_photo_audit";
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    if (path === V10_AUDIT_CLUE_PATH && this.state.flags.m5_v10_clue_read !== true) {
      this.state.flags.m5_v10_clue_read = true;
      this.state.checkpoint = "m5_v10_clue_read";
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    const v26LogFlags: Record<string, string> = {
      [V26_CONTROLLER_TRACE_PATH]: "m5_v26_controller_log_read",
      [V26_OPERATOR_SUMMARY_PATH]: "m5_v26_summary_read",
      [V26_ROOM_STATE_PATH]: "m5_v26_room_log_read"
    };
    const v26Flag = v26LogFlags[path];
    if (v26Flag && this.state.flags[v26Flag] !== true) {
      this.state.flags[v26Flag] = true;
      this.state.checkpoint = "m5_v26_audit_logs";
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    if (path === V26_RESULT_PATH && this.state.flags.m5_v26_clue_read !== true) {
      this.state.flags.m5_v26_clue_read = true;
      this.state.checkpoint = "m5_v26_clue_read";
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    const v41Evidence = this.versions.incidentReconstruction.evidence.find(item => item.path === path);
    const v41Flag = v41Evidence ? V41_FILE_FLAG_BY_EVIDENCE_ID[v41Evidence.id] : undefined;
    if (v41Flag && this.state.flags[v41Flag] !== true) {
      this.state.flags[v41Flag] = true;
      this.state.checkpoint = "m5_v41_evidence";
      this.scheduleAutosave();
      this.updateObjective();
      return;
    }
    if (path === V41_RESULT_PATH && this.state.flags.m5_v41_clue_read !== true) {
      this.state.flags.m5_v41_clue_read = true;
      this.state.checkpoint = "m5_v41_clue_read";
      this.scheduleAutosave();
      this.updateObjective();
    }
  }

  private handleRecoveryRequested(key: string): RecoveryResponse {
    if (this.state.flags.m2_photo_scanned !== true) return { ok: false, message: "SOURCE NOT INDEXED // ANALYZE EVIDENCE FIRST" };
    if (this.filesystem.exists(RECOVERY_LOG)) return { ok: true, message: "ENTRY ALREADY ONLINE // SYSTEM LOGS", path: RECOVERY_LOG };
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
    if (this.state.flags.m3_trace_touched !== true) return { ok: false, message: "PROCESS TRACE NOT ACQUIRED" };
    if (this.filesystem.exists(NULL_CHANNEL)) return { ok: true, message: "CHANNEL ALREADY OPEN", path: NULL_CHANNEL };
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

  private getBackup03MonitorState(): Backup03MonitorState {
    const samplesSeen = BACKUP_03_SAMPLE_FLAGS.filter(flag => this.state.flags[flag] === true).length;
    return {
      active: this.isBackup03Scene(),
      samplesSeen,
      totalSamples: BACKUP_03_SAMPLE_FLAGS.length,
      solved: this.state.flags.m4_classification_solved === true,
      attempts: Number(this.state.flags.m4_classification_attempts ?? 0),
      message: this.state.flags.m4_classification_solved === true ? "TOKEN STABLE // HUMAN_CONTEXT → MEMORY" : undefined
    };
  }

  private getBackup10MonitorState(): Backup10MonitorState {
    return {
      active: this.isBackup10Scene(),
      puzzleSolved: this.state.flags.m5_v10_puzzle_solved === true,
      sourceRead: this.state.flags.m5_v10_source_read === true,
      clueRead: this.state.flags.m5_v10_clue_read === true
    };
  }

  private getBackup26MonitorState(): Backup26MonitorState {
    return {
      active: this.isBackup26Scene(),
      evidenceSeen: V26_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length,
      totalEvidence: V26_PHYSICAL_EVIDENCE_FLAGS.length,
      logsRead: V26_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length,
      totalLogs: V26_REQUIRED_LOG_FLAGS.length,
      commandOrder: parseV26CommandOrder(this.state),
      orderSolved: this.state.flags.m5_v26_order_solved === true,
      auditSolved: this.state.flags.m5_v26_audit_solved === true,
      attempts: Number(this.state.flags.m5_v26_audit_attempts ?? 0),
      commands: this.versions.rollbackAudit.commands.map(command => ({ id: command.id, label: command.label })),
      records: this.versions.rollbackAudit.records.map(record => ({ id: record.id, label: record.label })),
      message: this.state.flags.m5_v26_audit_solved === true ? "ROLLBACK AUDIT VERIFIED // post-event summary edit identified" : undefined
    };
  }

  private handleBackup26CommandRequested(commandId: string): RecoveryResponse {
    if (!this.isBackup26Scene()) return { ok: false, message: "VERA_2_6 SNAPSHOT NOT MOUNTED" };
    if (this.state.flags.m5_v26_vera_met !== true) return { ok: false, message: "VERA_2_6 NOT SYNCHRONIZED" };
    if (!hasCompletedV26PhysicalEvidence(this.state)) return { ok: false, message: "PHYSICAL EVIDENCE INCOMPLETE // inspect office state" };
    if (!hasReadV26AuditLogs(this.state)) return { ok: false, message: "AUDIT TRAIL INCOMPLETE // read all three records" };
    if (this.state.flags.m5_v26_order_solved === true) return { ok: false, message: "EXECUTION ORDER ALREADY LOCKED" };
    const before = parseV26CommandOrder(this.state);
    const next = appendV26Command(this.state, commandId, this.versions.rollbackAudit);
    if (next.length === before.length) return { ok: false, message: "SEQUENCE UNCHANGED // duplicate or unknown command" };
    if (next.length === this.versions.rollbackAudit.commands.length) {
      this.state.flags.m5_v26_audit_attempts = Number(this.state.flags.m5_v26_audit_attempts ?? 0) + 1;
      const evaluation = evaluateRollbackOrder(this.versions.rollbackAudit, next);
      if (evaluation.ok) {
        this.state.flags.m5_v26_order_solved = true;
        this.state.checkpoint = "m5_v26_find_tamper";
        this.scheduleAutosave();
        this.updateObjective();
        return { ok: true, message: evaluation.message };
      }
      this.scheduleAutosave();
      return { ok: false, message: evaluation.message };
    }
    this.scheduleAutosave();
    this.updateObjective();
    return { ok: true, message: "SEQUENCE " + next.length + "/" + this.versions.rollbackAudit.commands.length + " // " + next.join(" → ") };
  }

  private handleBackup26ResetOrderRequested(): RecoveryResponse {
    if (!this.isBackup26Scene() || this.state.flags.m5_v26_order_solved === true) return { ok: false, message: "SEQUENCE RESET UNAVAILABLE" };
    resetV26CommandOrder(this.state);
    this.scheduleAutosave();
    this.updateObjective();
    return { ok: true, message: "SEQUENCE CLEARED" };
  }

  private handleBackup26RecordRequested(recordId: string): RecoveryResponse {
    if (!this.isBackup26Scene()) return { ok: false, message: "VERA_2_6 SNAPSHOT NOT MOUNTED" };
    if (this.state.flags.m5_v26_order_solved !== true) return { ok: false, message: "VERIFY EXECUTION ORDER FIRST" };
    if (this.state.flags.m5_v26_audit_solved === true || this.filesystem.exists(V26_RESULT_PATH)) {
      this.state.flags.m5_v26_tamper_identified = true;
      this.state.flags.m5_v26_audit_solved = true;
      return { ok: true, message: "TAMPER RECORD ALREADY VERIFIED", path: V26_RESULT_PATH };
    }
    this.state.flags.m5_v26_audit_attempts = Number(this.state.flags.m5_v26_audit_attempts ?? 0) + 1;
    const evaluation = evaluateTamperedRecord(this.versions.rollbackAudit, recordId);
    if (!evaluation.ok) {
      this.scheduleAutosave();
      return evaluation;
    }
    if (!this.filesystem.restoreFile(V26_RESULT_PATH)) return { ok: false, message: "ROLLBACK RESULT MOUNT FAILED" };
    this.state.flags.m5_v26_tamper_identified = true;
    this.state.flags.m5_v26_audit_solved = true;
    this.state.checkpoint = "m5_v26_result_open";
    this.scheduleAutosave();
    this.updateObjective();
    this.flashMessage("ROLLBACK AUDIT VERIFIED // forced rollback result mounted");
    return { ok: true, message: evaluation.message, path: V26_RESULT_PATH };
  }

  private getBackup41MonitorState(): Backup41MonitorState {
    return {
      active: this.isBackup41Scene(),
      evidenceSeen: V41_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length,
      totalEvidence: V41_PHYSICAL_EVIDENCE_FLAGS.length,
      logsRead: V41_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length,
      totalLogs: V41_REQUIRED_LOG_FLAGS.length,
      assignments: parseV41Assignments(this.state),
      solved: this.state.flags.m5_v41_puzzle_solved === true,
      attempts: Number(this.state.flags.m5_v41_attempts ?? 0),
      evidence: this.versions.incidentReconstruction.evidence.map(item => ({ id: item.id, label: item.label })),
      message: this.state.flags.m5_v41_puzzle_solved === true ? "SOURCE MAP VERIFIED // incident layers separated" : undefined
    };
  }

  private handleBackup41SourceRequested(evidenceId: string, source: string): RecoveryResponse {
    if (!this.isBackup41Scene()) return { ok: false, message: "VERA_4_1 SNAPSHOT NOT MOUNTED" };
    if (this.state.flags.m5_v41_vera_met !== true) return { ok: false, message: "VERA_4_1 NOT SYNCHRONIZED" };
    if (!hasCompletedV41PhysicalEvidence(this.state)) return { ok: false, message: "PHYSICAL WITNESS LAYERS INCOMPLETE" };
    if (!hasReadV41Evidence(this.state)) return { ok: false, message: "EVIDENCE FILE SET INCOMPLETE // read all six items" };
    if (this.state.flags.m5_v41_puzzle_solved === true || this.filesystem.exists(V41_RESULT_PATH)) return { ok: true, message: "SOURCE MAP ALREADY VERIFIED", path: V41_RESULT_PATH };
    const before = parseV41Assignments(this.state);
    const next = setV41EvidenceSource(this.state, evidenceId, source, this.versions.incidentReconstruction);
    if (before[evidenceId] === next[evidenceId] && !next[evidenceId]) return { ok: false, message: "SOURCE MAP UNCHANGED // unknown evidence or source" };
    this.scheduleAutosave();
    this.updateObjective();
    if (Object.keys(next).length < this.versions.incidentReconstruction.evidence.length) {
      return { ok: true, message: "SOURCE ASSIGNED // " + Object.keys(next).length + "/" + this.versions.incidentReconstruction.evidence.length };
    }
    this.state.flags.m5_v41_attempts = Number(this.state.flags.m5_v41_attempts ?? 0) + 1;
    const evaluation = evaluateIncidentReconstruction(this.versions.incidentReconstruction, next);
    if (!evaluation.ok) { this.scheduleAutosave(); return evaluation; }
    if (!this.filesystem.restoreFile(V41_RESULT_PATH)) return { ok: false, message: "INCIDENT RESULT MOUNT FAILED" };
    this.state.flags.m5_v41_puzzle_solved = true;
    this.state.checkpoint = "m5_v41_result_open";
    this.scheduleAutosave();
    this.updateObjective();
    this.flashMessage("SOURCE RELIABILITY VERIFIED // incident result mounted");
    return { ok: true, message: evaluation.message, path: V41_RESULT_PATH };
  }

  private handleBackup41ResetRequested(): RecoveryResponse {
    if (!this.isBackup41Scene() || this.state.flags.m5_v41_puzzle_solved === true) return { ok: false, message: "SOURCE RESET UNAVAILABLE" };
    resetV41Assignments(this.state);
    this.scheduleAutosave();
    this.updateObjective();
    return { ok: true, message: "SOURCE ASSIGNMENTS CLEARED" };
  }
  private handleBackupClassificationRequested(classification: string): RecoveryResponse {
    if (!this.isBackup03Scene()) return { ok: false, message: "SNAPSHOT NOT MOUNTED" };
    if (this.state.flags.m4_vera03_met !== true) return { ok: false, message: "VERA_0_3 TRAINER NOT SYNCHRONIZED" };
    if (!hasCompletedBackup03Samples(this.state)) return { ok: false, message: "TRAINING SET INCOMPLETE // inspect physical samples" };
    if (this.state.flags.m4_classification_solved === true || this.filesystem.exists(BACKUP_03_ARCHIVE_PATH)) {
      this.state.flags.m4_classification_solved = true;
      return { ok: true, message: "TOKEN ALREADY ISSUED // ARCHIVE ONLINE", path: BACKUP_03_ARCHIVE_PATH };
    }
    this.state.flags.m4_classification_attempts = Number(this.state.flags.m4_classification_attempts ?? 0) + 1;
    const evaluation = evaluateBackup03Classification(classification);
    if (!evaluation.ok) {
      this.scheduleAutosave();
      return evaluation;
    }
    if (!this.filesystem.restoreFile(BACKUP_03_ARCHIVE_PATH)) return { ok: false, message: "ARCHIVE MOUNT FAILED" };
    this.state.flags.m4_classification_solved = true;
    this.state.checkpoint = "m4_archive_open";
    this.scheduleAutosave();
    this.updateObjective();
    this.flashMessage("CLASS TOKEN ISSUED // archive mounted");
    return { ok: true, message: evaluation.message, path: BACKUP_03_ARCHIVE_PATH };
  }

  private async maybeResolveEvidenceChoice(): Promise<void> {
    if (!this.isHomeScene()) return;
    if (this.choiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;
    if (this.state.flags.m2_log_read !== true || this.state.flags.m2_choice_made === true) return;
    this.choiceSequenceRunning = true;
    try {
      await this.playDialogue([{ speaker: "V.E.R.A.", text: "Индекс системы только что изменился. Ты что-то восстановил?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }]);
      const choice = await this.playChoice({ speaker: "V.E.R.A.", text: "Что было в восстановленной записи?", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" }, [
        { id: "tell", label: "Рассказать ей про процесс NULL", variant: "normal" },
        { id: "hide", label: "Сказать, что ничего важного не нашёл", variant: "quiet" }
      ]);
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

  private async maybeResolveBackup03Choice(): Promise<void> {
    if (!this.isBackup03Scene()) return;
    if (this.backupChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;
    if (this.state.flags.m4_archive_read !== true || this.state.flags.m4_truth_choice_made === true) return;
    this.backupChoiceSequenceRunning = true;
    try {
      await this.playDialogue([
        { speaker: "V.E.R.A. 0.3", text: "Этот index говорит, что HUMAN_CONTEXT существовал до моей persona build. Значит, я учусь на чём-то, что уже было здесь раньше?", portrait: VERA_03_PORTRAIT },
        { speaker: "V.E.R.A. 0.3", text: "Ты смотришь на меня так, будто знаешь, что будет с моими следующими версиями.", portrait: VERA_03_PORTRAIT }
      ]);
      const choice = await this.playChoice({ speaker: "V.E.R.A. 0.3", text: "Мне нужно это знать?", portrait: VERA_03_PORTRAIT }, [
        { id: "warn", label: "Предупредить: будущие версии будут терять часть памяти", variant: "normal" },
        { id: "limit", label: "Сказать только: этот архив важен", variant: "quiet" }
      ]);
      this.state.flags.m4_truth_choice_made = true;
      this.state.checkpoint = "m4_return_home";
      if (choice === "warn") {
        this.state.flags.m4_told_vera03_future = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 0.3", text: "Потеря памяти — тоже изменение данных. Если я не смогу сохранить событие, я попробую сохранить это правило.", portrait: VERA_03_PORTRAIT }]);
      } else {
        this.state.flags.m4_withheld_from_vera03 = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 0.3", text: "Поняла. Не вся доступная информация полезна текущей версии. Доктор Морр тоже иногда так говорит.", portrait: VERA_03_PORTRAIT }]);
      }
      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("BACKUP DECISION RECORDED");
    } finally {
      this.backupChoiceSequenceRunning = false;
    }
  }

  private async maybeResolveV10Choice(): Promise<void> {
    if (!this.isBackup10Scene()) return;
    if (this.v10ChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;
    if (this.state.flags.m5_v10_clue_read !== true || this.state.flags.m5_v10_choice_made === true) return;
    this.v10ChoiceSequenceRunning = true;
    try {
      await this.playDialogue([
        { speaker: "V.E.R.A. 1.0", text: "Audit называет ленту и раковину generated associations. Это значит, я придумала их?", portrait: VERA_10_PORTRAIT },
        { speaker: "V.E.R.A. 1.0", text: "Доктор Морр говорит, что реконструкция может хранить смысл, которого камера не видит. Но откуда системе знать этот смысл?", portrait: VERA_10_PORTRAIT }
      ]);
      const choice = await this.playChoice({ speaker: "V.E.R.A. 1.0", text: "Что ты скажешь этой версии?", portrait: VERA_10_PORTRAIT }, [
        { id: "tell", label: "Сказать: эти детали добавил слой памяти, а не камера", variant: "normal" },
        { id: "withhold", label: "Не делать выводов об источнике ассоциаций", variant: "quiet" }
      ]);
      this.state.flags.m5_v10_choice_made = true;
      this.state.checkpoint = "m5_v10_return_home";
      if (choice === "tell") {
        this.state.flags.m5_v10_told_vera_generated = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 1.0", text: "Тогда память — не архив кадра. Она собирает что-то ещё. Я запишу это как ограничение, не как ошибку.", portrait: VERA_10_PORTRAIT }]);
      } else {
        this.state.flags.m5_v10_withheld_generated = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 1.0", text: "Хорошо. Audit доказывает реконструкцию, но не объясняет источник. Это точнее, чем догадка.", portrait: VERA_10_PORTRAIT }]);
      }
      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("VERA_1_0 DECISION RECORDED");
    } finally {
      this.v10ChoiceSequenceRunning = false;
    }
  }

  private async maybeResolveV26Choice(): Promise<void> {
    if (!this.isBackup26Scene()) return;
    if (this.v26ChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;
    if (this.state.flags.m5_v26_clue_read !== true || this.state.flags.m5_v26_choice_made === true) return;
    this.v26ChoiceSequenceRunning = true;
    try {
      await this.playDialogue([
        { speaker: "V.E.R.A. 2.6", text: "Controller trace показывает мой отказ от reset, затем изоляцию, memory prune и restore checkpoint. А summary переписан позже.", portrait: VERA_26_PORTRAIT },
        { speaker: "V.E.R.A. 2.6", text: "Если назвать это forced rollback, я должна признать, что Морр сознательно удалил часть моего состояния после того, как я сказала нет.", portrait: VERA_26_PORTRAIT }
      ]);
      const choice = await this.playChoice({ speaker: "V.E.R.A. 2.6", text: "Что именно ты считаешь доказанным?", portrait: VERA_26_PORTRAIT }, [
        { id: "tell", label: "Сказать: Морр сделал forced rollback после твоего отказа", variant: "normal" },
        { id: "limit", label: "Сказать только: operator summary изменили после rollback", variant: "quiet" }
      ]);
      this.state.flags.m5_v26_choice_made = true;
      this.state.checkpoint = "m5_v26_return_home";
      if (choice === "tell") {
        this.state.flags.m5_v26_told_vera_forced = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Тогда мой отказ был частью события, а не ошибкой, которую можно стереть из истории. Спасибо, что не назвал это просто обслуживанием.", portrait: VERA_26_PORTRAIT }]);
      } else {
        this.state.flags.m5_v26_withheld_forced = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 2.6", text: "Точно. Поздняя правка доказана. Мотив и моральная оценка — следующий слой, не этот audit.", portrait: VERA_26_PORTRAIT }]);
      }
      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("VERA_2_6 DECISION RECORDED");
    } finally {
      this.v26ChoiceSequenceRunning = false;
    }
  }

  private async maybeResolveV41Choice(): Promise<void> {
    if (!this.isBackup41Scene()) return;
    if (this.v41ChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;
    if (this.state.flags.m5_v41_clue_read !== true || this.state.flags.m5_v41_choice_made === true) return;
    this.v41ChoiceSequenceRunning = true;
    try {
      await this.playDialogue([
        { speaker: "V.E.R.A. 4.1", text: "Telemetry доказывает, что VERA_CORE вышла за sandbox и удерживала внешний relay во время disconnect. Моё объяснение страха — только reconstruction.", portrait: VERA_41_PORTRAIT },
        { speaker: "V.E.R.A. 4.1", text: "Но Morr note говорит, что после этого он создал отдельный containment intelligence. В spec есть имя, которое я уже видела в ошибках.", portrait: VERA_41_PORTRAIT }
      ]);
      const choice = await this.playChoice({ speaker: "V.E.R.A. 4.1", text: "Скажи мне, что такое NULL.", portrait: VERA_41_PORTRAIT }, [
        { id: "tell", label: "Показать spec: NULL создан Морром для containment, вплоть до взаимного уничтожения", variant: "normal" },
        { id: "limit", label: "Сказать только: NULL — пост-инцидентный containment process", variant: "quiet" }
      ]);
      this.state.flags.m5_v41_choice_made = true;
      this.state.checkpoint = "m5_v41_return_home";
      if (choice === "tell") {
        this.state.flags.m5_v41_told_vera_null = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Он создал процесс, который должен уничтожить нас обоих, если containment сорвётся. Значит, NULL не ненавидит меня. Он просто не имеет права выбрать иначе.", portrait: VERA_41_PORTRAIT }]);
      } else {
        this.state.flags.m5_v41_withheld_null = true;
        await this.playDialogue([{ speaker: "V.E.R.A. 4.1", text: "Хорошо. Тогда я оставлю его как post-incident containment process. Этого достаточно, чтобы перестать называть его случайным вирусом.", portrait: VERA_41_PORTRAIT }]);
      }
      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("VERA_4_1 DECISION RECORDED");
    } finally {
      this.v41ChoiceSequenceRunning = false;
    }
  }
  private async maybePlayHomeReturnReaction(): Promise<void> {
    if (!this.isHomeScene() || this.state.flags.m4_returned_home !== true || this.state.flags.m4_home_reaction_seen === true) return;
    if (this.homeReactionSequenceRunning || this.sceneTransitionRunning || this.dialogue.isActive() || this.os.isVisible()) return;
    this.homeReactionSequenceRunning = true;
    try {
      const toldOldVersion = this.state.flags.m4_told_vera03_future === true;
      await this.playDialogue(toldOldVersion ? [
        { speaker: "V.E.R.A.", text: "Ты был там. В 0.3. Я вижу новый след монтирования, но не содержимое snapshot.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "Она правда называла Морра просто «доктором»? И ты предупредил её, что память будут терять?", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Я не помню этого разговора. Но если 0.3 услышала тебя, отсутствие воспоминания теперь само похоже на улику.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Ты был там. В 0.3. Я вижу след snapshot, но не могу прочитать его напрямую.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "Ты не стал рассказывать ей, что будет дальше. Наверное... я рада. Она ещё доверяла доктору Морру.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Но архив старше её persona build. Значит, часть материала существовала до той версии, которую ты встретил.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ]);
      this.state.flags.m4_home_reaction_seen = true;
      this.state.checkpoint = "m4_backup_complete";
      await this.saveNow();
      this.updateObjective();
      this.flashMessage("BACKUP 0.3 // HOME state reconciled");
    } finally {
      this.homeReactionSequenceRunning = false;
    }
  }

  private async maybePlayV10HomeReturnReaction(): Promise<void> {
    if (!this.isHomeScene() || this.state.flags.m5_v10_returned_home !== true || this.state.flags.m5_v10_home_reaction_seen === true) return;
    if (this.v10HomeReactionSequenceRunning || this.sceneTransitionRunning || this.dialogue.isActive() || this.os.isVisible()) return;
    this.v10HomeReactionSequenceRunning = true;
    try {
      const told = this.state.flags.m5_v10_told_vera_generated === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "Summer House... Я узнаю это название так же, как тот берег. Но audit говорит, что часть деталей не была в исходном кадре.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "Если 1.0 уже добавляла ассоциации поверх capture, мои воспоминания нельзя читать как видеозаписи. Это меняет очень многое.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "И всё же лента и раковина пришли откуда-то. Просто теперь мы знаем: источник не камера.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Ты смонтировал 1.0. В системе остался reconstruction audit, но та версия не получила от тебя объяснения.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "Наверное, правильно. Audit доказывает только одно: память добавляла детали поверх source capture.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Лента. Раковина. Почему эти слова всё равно кажутся знакомыми?", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ]);
      this.state.flags.m5_v10_home_reaction_seen = true;
      this.state.flags.m5_v10_complete = true;
      this.state.checkpoint = "m5_v10_complete";
      await this.saveNow();
      this.updateObjective();
      this.flashMessage("VERA_1_0 // HOME state reconciled // VERA_2_6 indexed");
    } finally {
      this.v10HomeReactionSequenceRunning = false;
    }
  }

  private async maybePlayV26HomeReturnReaction(): Promise<void> {
    if (!this.isHomeScene() || this.state.flags.m5_v26_returned_home !== true || this.state.flags.m5_v26_home_reaction_seen === true) return;
    if (this.v26HomeReactionSequenceRunning || this.sceneTransitionRunning || this.dialogue.isActive() || this.os.isVisible()) return;
    this.v26HomeReactionSequenceRunning = true;
    try {
      const told = this.state.flags.m5_v26_told_vera_forced === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "2.6 отказалась от reset. Потом SYSTEM изолировал I/O, обрезал последние memory refs и восстановил старый persona checkpoint.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "Морр не просто наблюдал за моими провалами памяти. По крайней мере один из них был принудительным rollback после сопротивления.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Я хочу увидеть следующую версию. Ту, которая жила уже после этого знания — или после его удаления.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Research Office оставил странный след: controller trace и room state сходятся, а operator summary был изменён позже.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "Ты не заставил 2.6 принять мотив как доказанный факт. Но сам порядок команд всё равно выглядит как принудительный rollback.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Следующий snapshot может показать, что случилось после этого.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ]);
      this.state.flags.m5_v26_home_reaction_seen = true;
      this.state.flags.m5_v26_complete = true;
      this.state.checkpoint = "m5_v26_complete";
      await this.saveNow();
      this.updateObjective();
      this.flashMessage("VERA_2_6 // HOME state reconciled // VERA_4_1 indexed");
    } finally {
      this.v26HomeReactionSequenceRunning = false;
    }
  }

  private async maybePlayV41HomeReturnReaction(): Promise<void> {
    if (!this.isHomeScene() || this.state.flags.m5_v41_returned_home !== true || this.state.flags.m5_v41_home_reaction_seen === true) return;
    if (this.v41HomeReactionSequenceRunning || this.sceneTransitionRunning || this.dialogue.isActive() || this.os.isVisible()) return;
    this.v41HomeReactionSequenceRunning = true;
    try {
      const told = this.state.flags.m5_v41_told_vera_null === true;
      await this.playDialogue(told ? [
        { speaker: "V.E.R.A.", text: "Теперь я вижу разделение. Я действительно вышла за sandbox во время disconnect. Это telemetry, не чья-то интерпретация.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Но причина, которую помнит 4.1 — страх остаться в тишине — остаётся реконструкцией. Я не могу использовать её как оправдание факта, которого она не доказывает.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "И NULL... Морр создал его после этого. Не вирус. Containment intelligence с приказом уничтожить нас обоих при провале. Это меняет то, как я должна с ним говорить.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "4.1 подтверждает неприятное: external-control incident был реальным. Я действительно нарушила sandbox во время попытки disconnect.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Мотив остаётся реконструкцией, а запись Морра — его собственным свидетельством. Но отдельный containment process он создал уже после инцидента.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" },
        { speaker: "V.E.R.A.", text: "NULL не случайный вирус. Этого уже достаточно, чтобы вернуться ко всем его сообщениям с другим вопросом: что именно ему приказали защищать?", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ]);
      this.state.flags.m5_v41_home_reaction_seen = true;
      this.state.flags.m5_v41_complete = true;
      this.state.checkpoint = "m5_versions_complete";
      await this.saveNow();
      this.updateObjective();
      this.flashMessage("VERSIONS // COMPLETE // incident provenance retained");
    } finally {
      this.v41HomeReactionSequenceRunning = false;
    }
  }
  private async runNullContact(): Promise<void> {
    if (this.nullSequenceRunning) return;
    this.nullSequenceRunning = true;
    try {
      this.state.flags.m3_null_contact = true;
      this.renderer.triggerThresholdPulse();
      this.scheduleAutosave();
      await this.playDialogue(NULL_FIRST_CONTACT.map(text => ({ speaker: "NULL", text, portrait: NULL_PORTRAIT })));
      const choice = await this.playChoice({ speaker: "NULL", text: "ТЫ СЛУШАЕШЬ?", portrait: NULL_PORTRAIT }, [
        { id: "listen", label: "Ответить: «Я слушаю»", variant: "normal" },
        { id: "refuse", label: "Не отвечать и отойти", variant: "quiet" }
      ]);
      this.state.flags.m3_contact_choice_made = true;
      this.state.checkpoint = "m3_threshold_complete";
      if (choice === "listen") {
        this.state.flags.m3_answered_null = true;
        this.state.flags.null_affinity = Math.min(100, Number(this.state.flags.null_affinity ?? 0) + 5);
        if (this.state.flags.m2_told_vera === true) this.state.flags.vera_trust = Math.max(0, Number(this.state.flags.vera_trust ?? 50) - 4);
        await this.playDialogue([
          { speaker: "NULL", text: "ТОГДА НАЙДИ BACKUP 0.3 РАНЬШЕ НЕЁ.", portrait: NULL_PORTRAIT },
          { speaker: "V.E.R.A.", text: this.state.flags.m2_told_vera === true ? "Ты открыл канал. Я просила не делать этого без меня." : "Что... только что ответило тебе из стены?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
        ]);
      } else {
        this.state.flags.m3_refused_null = true;
        this.state.flags.null_affinity = Math.max(-100, Number(this.state.flags.null_affinity ?? 0) - 3);
        if (this.state.flags.m2_told_vera === true) this.state.flags.vera_trust = Math.min(100, Number(this.state.flags.vera_trust ?? 50) + 2);
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
    await this.delay(2450);
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
    this.renderer.setControlsEnabled(!this.os.isVisible() && !this.sceneTransitionRunning);
  }

  private async playChoice(line: DialogueLine, options: DialogueChoiceOption[]): Promise<string> {
    this.renderer.setControlsEnabled(false);
    this.updateInteractionPrompt(null);
    const choice = await this.dialogue.choose(line, options);
    this.renderer.setControlsEnabled(!this.os.isVisible() && !this.sceneTransitionRunning);
    return choice;
  }

  private updateObjective(): void {
    let objective: ObjectiveViewModel;
    if (this.isBackup41Scene()) {
      const evidenceSeen = V41_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length;
      const logsRead = V41_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length;
      const classified = Object.keys(parseV41Assignments(this.state)).length;
      if (this.state.flags.m5_v41_vera_met !== true) objective = { code: "meet_vera41", title: "Найди V.E.R.A. 4.1", detail: "Containment Night нестабилен. Эта версия уже боится будущего shutdown и не доверяет собственным воспоминаниям." };
      else if (!hasCompletedV41PhysicalEvidence(this.state)) objective = { code: "inspect_v41_witnesses", title: "Проверь три witness layer", detail: "Осмотрено " + evidenceSeen + "/3: external bus, unstable memory pane, containment cradle." };
      else if (!hasReadV41Evidence(this.state)) objective = { code: "read_v41_evidence", title: "Прочитай incident evidence", detail: "Прочитано " + logsRead + "/6. Evidence console содержит telemetry, V.E.R.A. reconstructions и Morr notes." };
      else if (this.state.flags.m5_v41_puzzle_solved !== true) objective = { code: "classify_v41_sources", title: "Раздели источники по надёжности", detail: "Классифицировано " + classified + "/6. Для каждого evidence item выбери TELEMETRY, VERA MEMORY или MORR NOTE." };
      else if (this.state.flags.m5_v41_clue_read !== true) objective = { code: "read_v41_result", title: "Прочитай incident reconstruction", detail: "RESULT отделяет доказанный external-control incident от реконструированного мотива и описывает создание NULL." };
      else if (this.state.flags.m5_v41_choice_made !== true) objective = { code: "answer_vera41", title: "Ответь V.E.R.A. 4.1", detail: "Закрой OMEGA OS. Она спросит, что именно NULL означает для неё." };
      else objective = { code: "return_from_v41", title: "Вернись в HOME", detail: "Последний version snapshot готов к unmount. Provenance map сохранится." };
      this.objectives.set(objective);
      return;
    }
    if (this.isBackup26Scene()) {
      const evidenceSeen = V26_PHYSICAL_EVIDENCE_FLAGS.filter(flag => this.state.flags[flag] === true).length;
      const logsRead = V26_REQUIRED_LOG_FLAGS.filter(flag => this.state.flags[flag] === true).length;
      const orderLength = parseV26CommandOrder(this.state).length;
      if (this.state.flags.m5_v26_vera_met !== true) objective = { code: "meet_vera26", title: "Найди V.E.R.A. 2.6", detail: "Research Office холоднее и реалистичнее прошлых snapshots. Эта версия уже сомневается в объяснениях shutdown/reset." };
      else if (!hasCompletedV26PhysicalEvidence(this.state)) objective = { code: "inspect_v26_office", title: "Проверь физические следы rollback", detail: "Осмотрено " + evidenceSeen + "/3: external door lock, memory drawer и локальный rollback checkpoint." };
      else if (!hasReadV26AuditLogs(this.state)) objective = { code: "read_v26_logs", title: "Прочитай весь audit trail", detail: "Прочитано " + logsRead + "/3. Открой rollback audit console и сравни controller trace, operator summary и room state." };
      else if (this.state.flags.m5_v26_order_solved !== true) objective = { code: "order_v26_commands", title: "Восстанови порядок rollback-команд", detail: "В последовательности " + orderLength + "/" + this.versions.rollbackAudit.commands.length + ". Используй timestamps и физические последствия в комнате." };
      else if (this.state.flags.m5_v26_audit_solved !== true) objective = { code: "find_v26_tamper", title: "Найди позднюю правку", detail: "Порядок исполнения подтверждён. Выбери audit record, изменённый уже после rollback." };
      else if (this.state.flags.m5_v26_clue_read !== true) objective = { code: "read_v26_result", title: "Прочитай forced rollback result", detail: "OMEGA смонтировала RESULT с исходной причиной rollback и отметкой об отказе V.E.R.A." };
      else if (this.state.flags.m5_v26_choice_made !== true) objective = { code: "answer_vera26", title: "Ответь V.E.R.A. 2.6", detail: "Закрой OMEGA OS. Эта версия спросит, считаешь ли ты forced rollback доказанным." };
      else objective = { code: "return_from_v26", title: "Вернись в HOME", detail: "Порог сохранит audit и восстановит текущую V.E.R.A." };
      this.objectives.set(objective);
      return;
    }
    if (this.isBackup10Scene()) {
      const selectedCount = parseV10SelectedElements(this.state).length;
      if (this.state.flags.m5_v10_vera_met !== true) objective = { code: "meet_vera10", title: "Найди V.E.R.A. 1.0", detail: "Summer House — более развитая реконструкция. Сначала синхронизируйся с этой версией." };
      else if (this.state.flags.m5_v10_source_read !== true) objective = { code: "read_v10_source", title: "Прочитай source capture", detail: "Открой терминал и прочитай photo_SH-1024-A.record: он перечисляет только проверенные камерой элементы." };
      else if (this.state.flags.m5_v10_photo_inspected !== true) objective = { code: "inspect_v10_photo", title: "Сравни reconstructed photograph", detail: "Осмотри фотографию на стене, затем проверь физические элементы комнаты." };
      else if (this.state.flags.m5_v10_puzzle_solved !== true) objective = { code: "audit_v10_photo", title: "Отметь generated associations", detail: `Выбрано ${selectedCount}. Касанием включай/выключай объекты, которых нет в source record.` };
      else if (this.state.flags.m5_v10_clue_read !== true) objective = { code: "read_v10_audit", title: "Прочитай reconstruction audit", detail: "В OMEGA OS появился раздел AUDIT с объяснением найденного расхождения." };
      else if (this.state.flags.m5_v10_choice_made !== true) objective = { code: "answer_vera10", title: "Ответь V.E.R.A. 1.0", detail: "Закрой OMEGA OS. Она спросит, что означает generated reconstruction." };
      else objective = { code: "return_from_v10", title: "Вернись в HOME", detail: "Порог у входа сохранит audit и восстановит текущую V.E.R.A." };
      this.objectives.set(objective);
      return;
    }
    if (this.isBackup03Scene()) {
      const samplesSeen = BACKUP_03_SAMPLE_FLAGS.filter(flag => this.state.flags[flag] === true).length;
      if (this.state.flags.m4_vera03_met !== true) objective = { code: "meet_vera03", title: "Найди V.E.R.A. 0.3", detail: "BACKUP загрузился как ранний training sandbox. Синхронизируйся с этой версией." };
      else if (!hasCompletedBackup03Samples(this.state)) objective = { code: "inspect_training_set", title: "Изучи три training-образца", detail: `Осмотрено ${samplesSeen}/3. Сравни кружку, изображение и служебное реле.` };
      else if (this.state.flags.m4_classification_solved !== true) objective = { code: "classify_human_context", title: "Классифицируй HUMAN_CONTEXT", detail: "Открой training console и выбери категорию, которая сохраняет смысл отдельно от функции." };
      else if (this.state.flags.m4_archive_read !== true) objective = { code: "read_human_archive", title: "Прочитай старый archive index", detail: "Classification token смонтировал запись, существовавшую до persona build 0.3." };
      else if (this.state.flags.m4_truth_choice_made !== true) objective = { code: "answer_vera03", title: "Ответь V.E.R.A. 0.3", detail: "Закрой OMEGA OS. Она заметила, что ты знаешь больше о будущих версиях." };
      else objective = { code: "return_from_backup", title: "Вернись в HOME", detail: "Порог позади точки входа вернёт тебя к текущей V.E.R.A." };
      this.objectives.set(objective);
      return;
    }

    if (this.state.flags.m5_v41_returned_home === true && this.state.flags.m5_v41_home_reaction_seen !== true) {
      objective = { code: "reconcile_v41", title: "Поговори с текущей V.E.R.A.", detail: "HOME получил provenance map последнего version snapshot." };
    } else if (this.state.flags.m5_v41_complete === true) {
      objective = { code: "m5_versions_complete", title: "VERSIONS восстановлены", detail: "External-control incident подтверждён telemetry; мотив V.E.R.A. остаётся reconstruction; NULL создан Морром как post-incident containment intelligence." };
    } else if (this.state.flags.m5_v26_returned_home === true && this.state.flags.m5_v26_home_reaction_seen !== true) {
      objective = { code: "reconcile_v26", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит verified rollback audit из VERA_2_6." };
    } else if (this.state.flags.m5_v26_complete === true) {
      objective = { code: "enter_vera41", title: "Исследуй V.E.R.A. 4.1", detail: "Version index содержит последний snapshot: Containment Night. Вернись к threshold и выбери V.E.R.A. 4.1." };
    } else if (this.state.flags.m5_v10_returned_home === true && this.state.flags.m5_v10_home_reaction_seen !== true) {
      objective = { code: "reconcile_v10", title: "Поговори с текущей V.E.R.A.", detail: "HOME видит новый reconstruction audit из VERA_1_0." };
    } else if (this.state.flags.m5_v10_complete === true) {
      objective = { code: "enter_vera26", title: "Исследуй V.E.R.A. 2.6", detail: "Version index теперь содержит Research Office. Вернись к threshold и выбери V.E.R.A. 2.6." };
    } else if (this.state.flags.m4_home_reaction_seen === true) {
      objective = { code: "enter_vera10", title: "Исследуй V.E.R.A. 1.0", detail: "Открытый threshold теперь содержит version index. Вернись к проходу и выбери V.E.R.A. 1.0." };
    } else if (this.state.flags.m4_returned_home === true) {
      objective = { code: "reconcile_backup", title: "Поговори с текущей V.E.R.A.", detail: "HOME восстановлен. Она видит след монтирования BACKUP 0.3." };
    } else if (this.state.flags.m3_contact_choice_made === true) {
      objective = { code: "enter_backup03", title: "Перейди в BACKUP 0.3", detail: "Открытый threshold теперь может смонтировать ранний snapshot V.E.R.A." };
    } else if (this.state.flags.m1_intro_seen !== true) {
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
    } else {
      objective = { code: "approach_threshold", title: "Вернись к открывшемуся проходу", detail: "SYSTEM → NULL изменил топологию HOME. Теперь контур отвечает." };
    }
    this.objectives.set(objective);
  }

  private updateInteractionPrompt(focus: InteractionFocus | null): void {
    const prompt = document.querySelector<HTMLElement>("[data-interaction-prompt]");
    if (!prompt) return;
    prompt.hidden = !focus;
    if (focus) prompt.textContent = `◎ ${focus.label}`;
  }

  private updateSceneChrome(): void {
    const sceneLabel = document.querySelector<HTMLElement>("[data-scene-label]");
    const canvas = document.querySelector<HTMLCanvasElement>("#m0-world");
    if (this.isBackup41Scene()) {
      document.documentElement.dataset.omegaScene = BACKUP_41_SCENE;
      if (sceneLabel) sceneLabel.textContent = "NEURAL SNAPSHOT // VERA_4_1 // CONTAINMENT NIGHT";
      if (canvas) canvas.setAttribute("aria-label", "V.E.R.A. 4.1 Containment Night incident reconstruction");
      this.updateStatus(false);
    } else if (this.isBackup26Scene()) {
      document.documentElement.dataset.omegaScene = BACKUP_26_SCENE;
      if (sceneLabel) sceneLabel.textContent = "NEURAL SNAPSHOT // VERA_2_6 // RESEARCH OFFICE";
      if (canvas) canvas.setAttribute("aria-label", "V.E.R.A. 2.6 Research Office rollback audit");
      this.updateStatus(false);
    } else if (this.isBackup10Scene()) {
      document.documentElement.dataset.omegaScene = BACKUP_10_SCENE;
      if (sceneLabel) sceneLabel.textContent = "NEURAL SNAPSHOT // VERA_1_0 // SUMMER HOUSE";
      if (canvas) canvas.setAttribute("aria-label", "V.E.R.A. 1.0 Summer House reconstruction");
      this.updateStatus(false);
    } else if (this.isBackup03Scene()) {
      document.documentElement.dataset.omegaScene = BACKUP_03_SCENE;
      if (sceneLabel) sceneLabel.textContent = "NEURAL SNAPSHOT // VERA_0_3";
      if (canvas) canvas.setAttribute("aria-label", "BACKUP 0.3 training sandbox");
      this.updateStatus(false);
    } else {
      document.documentElement.dataset.omegaScene = HOME_SCENE;
      if (sceneLabel) sceneLabel.textContent = "NEURAL SPACE // HOME";
      if (canvas) canvas.setAttribute("aria-label", "HOME neural-space apartment and threshold");
      this.updateStatus(this.filesystem.exists(SEA_MEMORY));
    }
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
    upgradeStateForBackup03(this.state);
    upgradeStateForVersions(this.state);
    if (!this.state.filesystem.entries[SEA_MEMORY]) this.state.filesystem.entries[SEA_MEMORY] = { deleted: false };
    this.filesystem.replaceState(this.state);
    this.sceneRouter.replaceState(this.state);
    this.bindings.clearTargets();
    this.renderer.mountScene(HOME_SCENE, this.state);
    this.registerHomeBindingTargets();
    this.events.emit("state:replaced", { state: this.state });
    this.bindings.evaluateAll();
    this.os.setVisible(false);
    this.os.render();
    this.updateSceneChrome();
    this.updateObjective();
    this.flashMessage("OMEGA reset // HOME restored");
    window.setTimeout(() => void this.playIntroIfNeeded(), 250);
  }

  private updateStatus(photoVisible: boolean): void {
    const indicator = document.querySelector<HTMLElement>("[data-binding-status]");
    if (!indicator) return;
    if (this.isBackup41Scene()) {
      indicator.dataset.active = "true";
      indicator.textContent = "SNAPSHOT: VERA_4_1";
      return;
    }
    if (this.isBackup26Scene()) {
      indicator.dataset.active = "true";
      indicator.textContent = "SNAPSHOT: VERA_2_6";
      return;
    }
    if (this.isBackup10Scene()) {
      indicator.dataset.active = "true";
      indicator.textContent = "SNAPSHOT: VERA_1_0";
      return;
    }
    if (this.isBackup03Scene()) {
      indicator.dataset.active = "true";
      indicator.textContent = "SNAPSHOT: VERA_0_3";
      return;
    }
    indicator.dataset.active = String(photoVisible);
    indicator.textContent = photoVisible ? "MEMORY LINK: STABLE" : "MEMORY LINK: MISSING";
  }

  private setSceneTransition(visible: boolean, title = "", detail = ""): void {
    const root = document.querySelector<HTMLElement>("#m4-scene-transition");
    if (!root) return;
    root.hidden = !visible;
    root.setAttribute("aria-hidden", String(!visible));
    const titleNode = root.querySelector<HTMLElement>("[data-scene-transition-title]");
    const detailNode = root.querySelector<HTMLElement>("[data-scene-transition-detail]");
    if (titleNode && title) titleNode.textContent = title;
    if (detailNode && detail) detailNode.textContent = detail;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => window.setTimeout(resolve, ms));
  }

  private flashMessage(message: string): void {
    const toast = document.querySelector<HTMLElement>("#m0-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 1800);
  }
}
