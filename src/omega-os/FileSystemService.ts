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
  inspectable?: boolean;
  artwork?: string;
  metadata?: Record<string, string>;
  initiallyDeleted?: boolean;
  hiddenWhileDeleted?: boolean;
  recoveryKey?: string;
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
    }
    this.ensureMutationDefaults(this.state);
  }

  replaceState(state: OmegaGameState): void {
    this.state = state;
    this.ensureMutationDefaults(this.state);
  }

  getEntry(path: string): VirtualEntry | null {
    const definition = this.definitions.get(path);
    if (!definition) return null;
    const deleted = this.state.filesystem.entries[path]?.deleted ?? definition.initiallyDeleted ?? false;
    return { ...definition, deleted };
  }

  listDirectory(path: string, includeDeleted = true): VirtualEntry[] {
    return [...this.definitions.values()]
      .filter(entry => entry.parent === path)
      .map(entry => this.getEntry(entry.path)!)
      .filter(entry => !(entry.hiddenWhileDeleted && entry.deleted))
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

  recoverByKey(key: string): VirtualEntry | null {
    const normalized = key.trim().replace(/\s+/g, "").toUpperCase();
    if (!normalized) return null;
    for (const definition of this.definitions.values()) {
      if (!definition.recoveryKey || definition.recoveryKey.toUpperCase() !== normalized) continue;
      const entry = this.getEntry(definition.path);
      if (!entry || entry.type !== "file" || !entry.deleted) return null;
      this.state.filesystem.entries[definition.path] = { deleted: false };
      this.events.emit("filesystem:changed", { path: definition.path, deleted: false });
      return this.getEntry(definition.path);
    }
    return null;
  }

  exists(path: string): boolean {
    const entry = this.getEntry(path);
    return !!entry && !entry.deleted;
  }

  private ensureMutationDefaults(state: OmegaGameState): void {
    for (const definition of this.definitions.values()) {
      if (definition.type !== "file" || state.filesystem.entries[definition.path]) continue;
      state.filesystem.entries[definition.path] = { deleted: definition.initiallyDeleted ?? false };
    }
  }
}
