import type { EventBus } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import type { OmegaGameState } from "../core/GameState.js";

export type VirtualEntryType = "file" | "directory";

export interface VirtualEntryDefinition {
  path: string;
  type: VirtualEntryType;
  label: string;
  mime?: string;
  parent?: string;
  content?: string;
  deletable?: boolean;
  restorable?: boolean;
}

export interface FileSystemDefinition {
  entries: VirtualEntryDefinition[];
}

export interface VirtualEntry extends VirtualEntryDefinition {
  deleted: boolean;
}

export class FileSystemService {
  private readonly definitions = new Map<string, VirtualEntryDefinition>();

  constructor(
    definition: FileSystemDefinition,
    private state: OmegaGameState,
    private readonly events: EventBus<GameEvents>
  ) {
    for (const entry of definition.entries) {
      if (this.definitions.has(entry.path)) throw new Error(`Duplicate virtual path '${entry.path}'.`);
      this.definitions.set(entry.path, entry);
      if (entry.type === "file" && !this.state.filesystem.entries[entry.path]) {
        this.state.filesystem.entries[entry.path] = { deleted: false };
      }
    }
  }

  replaceState(state: OmegaGameState): void {
    this.state = state;
  }

  getEntry(path: string): VirtualEntry | null {
    const definition = this.definitions.get(path);
    if (!definition) return null;
    return { ...definition, deleted: this.state.filesystem.entries[path]?.deleted ?? false };
  }

  listDirectory(path: string, includeDeleted = true): VirtualEntry[] {
    return [...this.definitions.values()]
      .filter(entry => entry.parent === path)
      .map(entry => this.getEntry(entry.path)!)
      .filter(entry => includeDeleted || !entry.deleted);
  }

  readFile(path: string): VirtualEntry | null {
    const entry = this.getEntry(path);
    return entry?.type === "file" && !entry.deleted ? entry : null;
  }

  deleteFile(path: string): boolean {
    const entry = this.getEntry(path);
    if (!entry || entry.type !== "file" || entry.deleted || entry.deletable === false) return false;
    this.state.filesystem.entries[path] = { deleted: true };
    this.events.emit("filesystem:changed", { path, deleted: true });
    return true;
  }

  restoreFile(path: string): boolean {
    const entry = this.getEntry(path);
    if (!entry || entry.type !== "file" || !entry.deleted || entry.restorable === false) return false;
    this.state.filesystem.entries[path] = { deleted: false };
    this.events.emit("filesystem:changed", { path, deleted: false });
    return true;
  }

  exists(path: string): boolean {
    const entry = this.getEntry(path);
    return !!entry && !entry.deleted;
  }
}
