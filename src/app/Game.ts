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
import { OmegaOS } from "../omega-os/OmegaOS.js";
import { DialogueController, type DialogueLine } from "../story/DialogueController.js";

const AUTOSAVE_SLOT = "omega_autosave";
const LEGACY_M0_SLOT = "m0_autosave";
const SEA_MEMORY = "/memories/sea_2017.img";

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
  private autosaveTimer: number | null = null;
  private focusedInteractionId: string | null = null;

  async start(): Promise<void> {
    const canvas = document.querySelector<HTMLCanvasElement>("#m0-world");
    const osRoot = document.querySelector<HTMLElement>("#m0-os");
    const dialogueRoot = document.querySelector<HTMLElement>("#home-dialogue");
    if (!canvas || !osRoot || !dialogueRoot) throw new Error("HOME DOM shell is incomplete.");

    const [filesystemDefinition, bindingDefinitions] = await Promise.all([
      this.content.loadJson<FileSystemDefinition>("../data/v2/filesystem-m1.json"),
      this.content.loadJson<WorldBindingDefinition[]>("../data/v2/world-bindings-m1.json"),
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
    this.upgradeStateForHome();

    this.filesystem = new FileSystemService(filesystemDefinition, this.state, this.events);
    this.renderer = new WorldRenderer(canvas, this.input, this.state);
    this.bindings = new WorldBindingSystem(bindingDefinitions, this.filesystem, this.events);
    this.dialogue = new DialogueController(dialogueRoot);

    const photoTarget = this.renderer.getTarget("apartment.photo_frame");
    if (!photoTarget) throw new Error("Required HOME target 'apartment.photo_frame' was not registered.");
    this.bindings.registerTarget("apartment.photo_frame", photoTarget);

    this.os = new OmegaOS(osRoot, this.filesystem, this.events, () => void this.saveNow(), () => void this.resetHome());
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
      if (this.focusedInteractionId === "computer") this.os.setVisible(true);
      else this.flashMessage("Подойди к компьютеру, чтобы открыть OMEGA OS");
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
        if (!this.dialogue.isActive()) this.flashMessage(deleted ? "Связь с памятью разорвана" : "Память восстановлена");
      }
    });
    this.events.on("binding:changed", ({ active }) => this.updateStatus(active));
    this.events.on("os:visibility", ({ visible }) => {
      this.renderer.setControlsEnabled(!visible && !this.dialogue.isActive());
      this.updateInteractionPrompt(null);
    });

    this.bindings.evaluateAll();
    this.renderer.start();
    this.updateStatus(this.filesystem.exists(SEA_MEMORY));
    window.addEventListener("pagehide", () => { this.renderer.writePlayerState(this.state); void this.saveNow(); });
    window.setTimeout(() => void this.playIntroIfNeeded(), 500);
  }

  private upgradeStateForHome(): void {
    this.state.checkpoint = "m1_home";
    this.state.world.activeScene = "apartment_home_m1";
    if (!this.state.filesystem.entries[SEA_MEMORY]) this.state.filesystem.entries[SEA_MEMORY] = { deleted: false };
    const defaults: Record<string, boolean> = {
      m1_intro_seen: false,
      m1_photo_inspected: false,
      m1_anomaly_seen: false,
      m1_computer_used: false,
      m1_mug_seen: false
    };
    for (const [key, value] of Object.entries(defaults)) {
      if (typeof this.state.flags[key] !== "boolean") this.state.flags[key] = value;
    }
  }

  private async playIntroIfNeeded(): Promise<void> {
    if (this.state.flags.m1_intro_seen === true) return;
    await this.playDialogue([
      { speaker: "V.E.R.A.", text: "Ты... меня слышишь? Хорошо. Значит, этот слой всё-таки восстановился.", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
      { speaker: "V.E.R.A.", text: "Не пугайся комнаты. Это не совсем квартира. Мне так проще представлять систему.", portrait: "../assets/v2/characters/vera/portraits/vera_neutral.svg" },
      { speaker: "V.E.R.A.", text: "Осмотрись. И если увидишь что-нибудь, чего здесь не должно быть... скажи мне.", portrait: "../assets/v2/characters/vera/portraits/vera_warm_smile.svg" }
    ]);
    this.state.flags.m1_intro_seen = true;
    this.scheduleAutosave();
  }

  private async handleWorldInteraction(id: string): Promise<void> {
    if (id === "computer") {
      this.state.flags.m1_computer_used = true;
      this.scheduleAutosave();
      this.os.setVisible(true);
      return;
    }
    if (id === "vera") {
      const anomalySeen = this.state.flags.m1_anomaly_seen === true;
      await this.playDialogue(anomalySeen ? [
        { speaker: "V.E.R.A.", text: "Я тоже это видела. Но в журнале событий ничего нет. Давай пока не будем делать выводов.", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ] : [
        { speaker: "V.E.R.A.", text: "Странно видеть тебя не через окно терминала. Наверное, мне нужно к этому привыкнуть.", portrait: "../assets/v2/characters/vera/portraits/vera_shy.svg" }
      ]);
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
      if (!this.filesystem.exists(SEA_MEMORY)) return;
      const firstInspection = this.state.flags.m1_photo_inspected !== true;
      await this.playDialogue([
        { speaker: "V.E.R.A.", text: "Эта фотография...", portrait: "../assets/v2/characters/vera/portraits/vera_concerned.svg" },
        { speaker: "V.E.R.A.", text: "Я никогда не была у моря. Тогда почему я узнаю этот берег?", portrait: "../assets/v2/characters/vera/portraits/vera_nervous.svg" }
      ]);
      this.state.flags.m1_photo_inspected = true;
      this.scheduleAutosave();
      if (firstInspection && this.state.flags.m1_anomaly_seen !== true) await this.runFirstAnomaly();
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
  }

  private async playDialogue(lines: DialogueLine[]): Promise<void> {
    this.renderer.setControlsEnabled(false);
    this.updateInteractionPrompt(null);
    await this.dialogue.play(lines);
    this.renderer.setControlsEnabled(!this.os.isVisible());
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
    this.upgradeStateForHome();
    this.filesystem.replaceState(this.state);
    this.renderer.syncFromState(this.state);
    this.events.emit("state:replaced", { state: this.state });
    this.bindings.evaluateAll();
    this.os.render();
    this.updateStatus(true);
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
