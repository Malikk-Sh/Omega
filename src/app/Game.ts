import { EventBus } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import { createInitialGameState, type OmegaGameState } from "../core/GameState.js";
import { IndexedDbSaveAdapter, SaveManager } from "../core/SaveManager.js";
import { AssetManager } from "../core/AssetManager.js";
import { ContentDB } from "../core/ContentDB.js";
import { FileSystemService, type FileSystemDefinition } from "../omega-os/FileSystemService.js";
import { WorldBindingSystem, type WorldBindingDefinition } from "../world/WorldBinding.js";
import { InputManager } from "../player/InputManager.js";
import { WorldRenderer } from "../render/WorldRenderer.js";
import { OmegaOS } from "../omega-os/OmegaOS.js";

const AUTOSAVE_SLOT = "m0_autosave";

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
  private autosaveTimer: number | null = null;

  async start(): Promise<void> {
    const canvas = document.querySelector<HTMLCanvasElement>("#m0-world");
    const osRoot = document.querySelector<HTMLElement>("#m0-os");
    if (!canvas || !osRoot) throw new Error("Milestone 0 DOM shell is incomplete.");

    const [filesystemDefinition, bindingDefinitions] = await Promise.all([
      this.content.loadJson<FileSystemDefinition>("../data/v2/filesystem-m0.json"),
      this.content.loadJson<WorldBindingDefinition[]>("../data/v2/world-bindings-m0.json"),
      this.assets.load("../assets/v2/asset-manifest.json").catch(error => {
        console.warn("Asset manifest is optional for the M0 geometry slice.", error);
      })
    ]);

    const loaded = await this.saves.load(AUTOSAVE_SLOT).catch(error => {
      console.warn("M0 autosave could not be loaded; starting clean.", error);
      return null;
    });
    if (loaded) this.state = loaded;

    this.filesystem = new FileSystemService(filesystemDefinition, this.state, this.events);
    this.renderer = new WorldRenderer(canvas, this.input, this.state);
    this.bindings = new WorldBindingSystem(bindingDefinitions, this.filesystem, this.events);
    const photoTarget = this.renderer.getTarget("apartment.photo_frame");
    if (!photoTarget) throw new Error("Required M0 target 'apartment.photo_frame' was not registered.");
    this.bindings.registerTarget("apartment.photo_frame", photoTarget);

    this.os = new OmegaOS(osRoot, this.filesystem, this.events, () => void this.saveNow(), () => void this.resetMilestone());
    this.input.attach(document);
    this.input.onAction("os", () => this.os.toggle());
    this.input.onAction("interact", () => this.os.setVisible(true));
    this.input.onAction("pause", () => this.os.setVisible(false));

    this.events.on("filesystem:changed", () => this.scheduleAutosave());
    this.events.on("binding:changed", ({ active }) => this.updateStatus(active));

    document.querySelector<HTMLElement>("[data-open-os]")?.addEventListener("click", () => this.os.setVisible(true));
    document.querySelector<HTMLElement>("[data-reset-m0]")?.addEventListener("click", () => void this.resetMilestone());

    this.bindings.evaluateAll();
    this.renderer.start();
    this.updateStatus(this.filesystem.exists("/memories/test_photo.img"));
    window.addEventListener("pagehide", () => { this.renderer.writePlayerState(this.state); void this.saveNow(); });
  }

  private scheduleAutosave(): void {
    if (this.autosaveTimer !== null) window.clearTimeout(this.autosaveTimer);
    this.autosaveTimer = window.setTimeout(() => void this.saveNow(), 180);
  }

  private async saveNow(): Promise<void> {
    this.renderer.writePlayerState(this.state);
    await this.saves.save(AUTOSAVE_SLOT, this.state);
    this.events.emit("save:written", { slot: AUTOSAVE_SLOT });
    this.flashMessage("Состояние сохранено в IndexedDB");
  }

  private async resetMilestone(): Promise<void> {
    await this.saves.clear(AUTOSAVE_SLOT).catch(() => undefined);
    this.state = createInitialGameState();
    this.filesystem.replaceState(this.state);
    this.renderer.syncFromState(this.state);
    this.events.emit("state:replaced", { state: this.state });
    this.os.render();
    this.updateStatus(true);
    this.flashMessage("Milestone 0 сброшен");
  }

  private updateStatus(photoVisible: boolean): void {
    const indicator = document.querySelector<HTMLElement>("[data-binding-status]");
    if (!indicator) return;
    indicator.dataset.active = String(photoVisible);
    indicator.textContent = photoVisible ? "PHOTO BINDING: VISIBLE" : "PHOTO BINDING: DELETED";
  }

  private flashMessage(message: string): void {
    const toast = document.querySelector<HTMLElement>("#m0-toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 1600);
  }
}
