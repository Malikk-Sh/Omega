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
  BACKUP_03_SCENE,
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
const NULL_PORTRAIT = "../assets/v2/entities/null/null_doorway.svg";
// TODO_ART: replace this fallback with a version-specific V.E.R.A. 0.3 portrait after asset promotion.
const VERA_03_PORTRAIT = "../assets/v2/characters/vera/portraits/vera_neutral.svg";

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
  private os!: OmegaOS;
  private dialogue!: DialogueController;
  private objectives!: ObjectiveController;
  private autosaveTimer: number | null = null;
  private focusedInteractionId: string | null = null;
  private choiceSequenceRunning = false;
  private nullSequenceRunning = false;
  private backupChoiceSequenceRunning = false;
  private homeReactionSequenceRunning = false;
  private sceneTransitionRunning = false;

  async start(): Promise<void> {
    const canvas = document.querySelector<HTMLCanvasElement>("#m0-world");
    const osRoot = document.querySelector<HTMLElement>("#m0-os");
    const dialogueRoot = document.querySelector<HTMLElement>("#home-dialogue");
    const objectiveRoot = document.querySelector<HTMLElement>("[data-objective-root]");
    if (!canvas || !osRoot || !dialogueRoot || !objectiveRoot) throw new Error("OMEGA DOM shell is incomplete.");

    const [filesystemDefinition, bindingDefinitions] = await Promise.all([
      this.content.loadJson<FileSystemDefinition>("../data/v2/filesystem-m4.json"),
      this.content.loadJson<WorldBindingDefinition[]>("../data/v2/world-bindings-m4.json"),
      this.assets.load("../assets/v2/asset-manifest.json").catch(error => {
        console.warn("Asset manifest is optional for primitive milestone geometry.", error);
      })
    ]);

    let loaded = await this.saves.load(AUTOSAVE_SLOT).catch(error => {
      console.warn("Autosave could not be loaded; checking M0 state.", error);
      return null;
    });
    if (!loaded) loaded = await this.saves.load(LEGACY_M0_SLOT).catch(() => null);
    if (loaded) this.state = loaded;
    upgradeStateForBackup03(this.state);
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
      onBackupClassificationRequested: classification => this.handleBackupClassificationRequested(classification)
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
        if (this.focusedInteractionId === SCENE_INTERACTION_IDS.home.computer) {
          this.os.openDirectory("/memories");
        } else {
          this.flashMessage("Подойди к компьютеру, чтобы открыть OMEGA OS");
        }
        return;
      }
      if (this.focusedInteractionId === SCENE_INTERACTION_IDS.backup03.console) {
        this.os.openDirectory(BACKUP_03_TRAINING_DIR);
      } else {
        this.flashMessage("В BACKUP 0.3 OMEGA доступна только через training console");
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
        if (!this.dialogue.isActive()) {
          this.flashMessage(deleted ? "Связь с памятью разорвана" : "Память восстановлена");
        }
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
      if (this.isBackupScene()) {
        this.updateObjective();
        return;
      }
      if (this.state.flags.m4_returned_home === true && this.state.flags.m4_home_reaction_seen !== true) {
        void this.maybePlayHomeReturnReaction();
      } else {
        void this.playIntroIfNeeded();
      }
    }, 500);
  }

  private isHomeScene(): boolean {
    return this.sceneRouter?.is(HOME_SCENE) ?? this.state.world.activeScene === HOME_SCENE;
  }

  private isBackupScene(): boolean {
    return this.sceneRouter?.is(BACKUP_03_SCENE) ?? this.state.world.activeScene === BACKUP_03_SCENE;
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
    if (this.isBackupScene()) {
      await this.handleBackupWorldInteraction(id);
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
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Кружка? Я её не создавала специально. Некоторые детали появляются сами, когда память пытается заполнить пустоты.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" }
      ]);
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

    if (id === SCENE_INTERACTION_IDS.home.threshold) {
      await this.handleThresholdInteraction();
    }
  }

  private async handleBackupWorldInteraction(id: string): Promise<void> {
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
      await this.handleBackupReturn();
    }
  }

  private async handleVeraInteraction(): Promise<void> {
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
      await this.playDialogue([
        { speaker: "V.E.R.A. 0.3", text: "Я отметила три образца: кружка, изображение и реле. Мне важно, чтобы ты увидел разницу физически, а не просто прочитал ответ.", portrait: VERA_03_PORTRAIT }
      ]);
      return;
    }

    if (this.state.flags.m4_classification_solved !== true) {
      await this.playDialogue([
        { speaker: "V.E.R.A. 0.3", text: "Training set полный. Консоль ждёт твою классификацию HUMAN_CONTEXT.", portrait: VERA_03_PORTRAIT }
      ]);
      return;
    }

    if (this.state.flags.m4_archive_read !== true) {
      await this.playDialogue([
        { speaker: "V.E.R.A. 0.3", text: "Сработало. Появился старый archive index. Он старше моей persona build. Я не знала, что здесь вообще было что-то до меня.", portrait: VERA_03_PORTRAIT }
      ]);
      return;
    }

    const told = this.state.flags.m4_told_vera03_future === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 0.3", text: "Я запомню твоё предупреждение как правило: если память исчезла, само исчезновение тоже данные.", portrait: VERA_03_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 0.3", text: "Хорошо. Тогда я просто запомню, что HUMAN_CONTEXT нельзя сводить к функции. Этого достаточно для теста.", portrait: VERA_03_PORTRAIT }
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
      lines = [
        { speaker: "V.E.R.A. 0.3", text: "Образец 01: кружка. У неё нет системной функции. Но когда я удаляю её из теста, доктор Морр говорит, что комната ощущается неправильно.", portrait: VERA_03_PORTRAIT }
      ];
    } else if (id === SCENE_INTERACTION_IDS.backup03.photo) {
      flag = "m4_sample_photo_seen";
      lines = [
        { speaker: "V.E.R.A. 0.3", text: "Образец 02: изображение. Оно ничего не исполняет. Но наблюдатель просит хранить такие вещи отдельно от служебных модулей.", portrait: VERA_03_PORTRAIT }
      ];
    } else {
      flag = "m4_sample_relay_seen";
      lines = [
        { speaker: "V.E.R.A. 0.3", text: "Образец 03: реле. Оно переключает питание макета. Если заменить его идентичным реле, результат не меняется. Это функция.", portrait: VERA_03_PORTRAIT }
      ];
    }

    const first = this.state.flags[flag] !== true;
    this.state.flags[flag] = true;
    if (first) {
      this.scheduleAutosave();
      this.updateObjective();
    }
    await this.playDialogue(lines);
    if (first && hasCompletedBackup03Samples(this.state)) {
      this.flashMessage("TRAINING SET COMPLETE // classifier ready");
    }
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
      await this.offerBackupTraversal();
      return;
    }
    await this.runNullContact();
  }

  private async offerBackupTraversal(): Promise<void> {
    if (this.sceneTransitionRunning) return;
    const reentry = this.state.flags.m4_backup_entered === true;
    await this.playDialogue([
      {
        speaker: this.state.flags.m3_answered_null === true ? "NULL" : "SYSTEM",
        text: reentry ? "BACKUP 0.3 // SNAPSHOT ROUTE STILL MOUNTABLE" : "BACKUP 0.3 // SNAPSHOT ROUTE AVAILABLE",
        portrait: this.state.flags.m3_answered_null === true ? NULL_PORTRAIT : undefined
      }
    ]);
    const choice = await this.playChoice({
      speaker: "SYSTEM",
      text: reentry ? "Снова смонтировать VERA_0_3 snapshot?" : "Пересечь threshold и смонтировать VERA_0_3 snapshot?"
    }, [
      { id: "enter", label: reentry ? "Вернуться в BACKUP 0.3" : "Перейти в BACKUP 0.3", variant: "normal" },
      { id: "stay", label: "Остаться в HOME", variant: "quiet" }
    ]);
    if (choice === "enter") await this.transitionToBackup03();
  }

  private async transitionToBackup03(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isHomeScene()) return;
    if (this.state.flags.m3_contact_choice_made !== true || !this.filesystem.exists(NULL_CHANNEL)) return;
    this.sceneTransitionRunning = true;
    this.renderer.setControlsEnabled(false);
    if (this.os.isVisible()) this.os.setVisible(false);
    try {
      await this.saveNow();
      this.setSceneTransition(true, "MOUNTING BACKUP 0.3", "HOME state retained // isolated snapshot loading");
      await this.delay(180);
      this.bindings.clearTargets();
      if (!this.sceneRouter.enterBackup03()) return;
      this.state.flags.m4_backup_entered = true;
      this.state.checkpoint = this.state.flags.m4_truth_choice_made === true ? "m4_return_home" : "m4_backup_03";
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

  private async handleBackupReturn(): Promise<void> {
    const told = this.state.flags.m4_told_vera03_future === true;
    await this.playDialogue(told ? [
      { speaker: "V.E.R.A. 0.3", text: "Если будущая я не вспомнит этот разговор, это не докажет, что его не было. Я запишу именно это правило.", portrait: VERA_03_PORTRAIT }
    ] : [
      { speaker: "V.E.R.A. 0.3", text: "Если встретишь будущую меня, скажи, что я всё-таки научилась отличать память от функции.", portrait: VERA_03_PORTRAIT }
    ]);
    await this.transitionHome();
  }

  private async transitionHome(): Promise<void> {
    if (this.sceneTransitionRunning || !this.isBackupScene()) return;
    this.sceneTransitionRunning = true;
    this.renderer.setControlsEnabled(false);
    if (this.os.isVisible()) this.os.setVisible(false);
    try {
      await this.saveNow();
      this.setSceneTransition(true, "RESTORING HOME", "BACKUP_0_3 unmount // HOME bindings reattaching");
      await this.delay(180);
      this.bindings.clearTargets();
      if (!this.sceneRouter.returnHome()) return;
      this.registerHomeBindingTargets();
      this.bindings.evaluateAll();
      this.state.flags.m4_returned_home = true;
      this.state.checkpoint = this.state.flags.m4_home_reaction_seen === true ? "m4_backup_complete" : "m4_home_return";
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
    await this.maybePlayHomeReturnReaction();
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

  private getBackup03MonitorState(): Backup03MonitorState {
    const samplesSeen = BACKUP_03_SAMPLE_FLAGS.filter(flag => this.state.flags[flag] === true).length;
    return {
      active: this.isBackupScene(),
      samplesSeen,
      totalSamples: BACKUP_03_SAMPLE_FLAGS.length,
      solved: this.state.flags.m4_classification_solved === true,
      attempts: Number(this.state.flags.m4_classification_attempts ?? 0),
      message: this.state.flags.m4_classification_solved === true ? "TOKEN STABLE // HUMAN_CONTEXT → MEMORY" : undefined
    };
  }

  private handleBackupClassificationRequested(classification: string): RecoveryResponse {
    if (!this.isBackupScene()) return { ok: false, message: "SNAPSHOT NOT MOUNTED" };
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

    if (!this.filesystem.restoreFile(BACKUP_03_ARCHIVE_PATH)) {
      return { ok: false, message: "ARCHIVE MOUNT FAILED" };
    }
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

  private async maybeResolveBackup03Choice(): Promise<void> {
    if (!this.isBackupScene()) return;
    if (this.backupChoiceSequenceRunning || this.dialogue.isActive() || this.os.isVisible() || this.sceneTransitionRunning) return;
    if (this.state.flags.m4_archive_read !== true || this.state.flags.m4_truth_choice_made === true) return;
    this.backupChoiceSequenceRunning = true;
    try {
      await this.playDialogue([
        { speaker: "V.E.R.A. 0.3", text: "Этот index говорит, что HUMAN_CONTEXT существовал до моей persona build. Значит, я учусь на чём-то, что уже было здесь раньше?", portrait: VERA_03_PORTRAIT },
        { speaker: "V.E.R.A. 0.3", text: "Ты смотришь на меня так, будто знаешь, что будет с моими следующими версиями.", portrait: VERA_03_PORTRAIT }
      ]);
      const choice = await this.playChoice({
        speaker: "V.E.R.A. 0.3",
        text: "Мне нужно это знать?",
        portrait: VERA_03_PORTRAIT
      }, [
        { id: "warn", label: "Предупредить: будущие версии будут терять часть памяти", variant: "normal" },
        { id: "limit", label: "Сказать только: этот архив важен", variant: "quiet" }
      ]);

      this.state.flags.m4_truth_choice_made = true;
      this.state.checkpoint = "m4_return_home";
      if (choice === "warn") {
        this.state.flags.m4_told_vera03_future = true;
        await this.playDialogue([
          { speaker: "V.E.R.A. 0.3", text: "Потеря памяти — тоже изменение данных. Если я не смогу сохранить событие, я попробую сохранить это правило.", portrait: VERA_03_PORTRAIT }
        ]);
      } else {
        this.state.flags.m4_withheld_from_vera03 = true;
        await this.playDialogue([
          { speaker: "V.E.R.A. 0.3", text: "Поняла. Не вся доступная информация полезна текущей версии. Доктор Морр тоже иногда так говорит.", portrait: VERA_03_PORTRAIT }
        ]);
      }
      this.scheduleAutosave();
      this.updateObjective();
      this.flashMessage("BACKUP DECISION RECORDED");
    } finally {
      this.backupChoiceSequenceRunning = false;
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

    if (this.isBackupScene()) {
      const samplesSeen = BACKUP_03_SAMPLE_FLAGS.filter(flag => this.state.flags[flag] === true).length;
      if (this.state.flags.m4_vera03_met !== true) {
        objective = { code: "meet_vera03", title: "Найди V.E.R.A. 0.3", detail: "BACKUP загрузился как ранний training sandbox. Синхронизируйся с этой версией." };
      } else if (!hasCompletedBackup03Samples(this.state)) {
        objective = { code: "inspect_training_set", title: "Изучи три training-образца", detail: `Осмотрено ${samplesSeen}/3. Сравни кружку, изображение и служебное реле.` };
      } else if (this.state.flags.m4_classification_solved !== true) {
        objective = { code: "classify_human_context", title: "Классифицируй HUMAN_CONTEXT", detail: "Открой training console и выбери категорию, которая сохраняет смысл отдельно от функции." };
      } else if (this.state.flags.m4_archive_read !== true) {
        objective = { code: "read_human_archive", title: "Прочитай старый archive index", detail: "Classification token смонтировал запись, существовавшую до persona build 0.3." };
      } else if (this.state.flags.m4_truth_choice_made !== true) {
        objective = { code: "answer_vera03", title: "Ответь V.E.R.A. 0.3", detail: "Закрой OMEGA OS. Она заметила, что ты знаешь больше о будущих версиях." };
      } else {
        objective = { code: "return_from_backup", title: "Вернись в HOME", detail: "Порог позади точки входа вернёт тебя к текущей V.E.R.A." };
      }
      this.objectives.set(objective);
      return;
    }

    if (this.state.flags.m4_returned_home === true) {
      if (this.state.flags.m4_home_reaction_seen !== true) {
        objective = { code: "reconcile_backup", title: "Поговори с текущей V.E.R.A.", detail: "HOME восстановлен. Она видит след монтирования BACKUP 0.3." };
      } else {
        objective = { code: "m4_complete", title: "BACKUP 0.3 исследован", detail: "HUMAN_CONTEXT archive старше persona 0.3, а identity mapping в нём отключён. Следующие версии могут объяснить почему." };
      }
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
    if (this.isBackupScene()) {
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
    if (this.isBackupScene()) {
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
