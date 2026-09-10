import { cloneGameState, validateGameState, type OmegaGameState } from "./GameState.js";

export interface SaveEnvelope {
  slot: string;
  savedAt: number;
  state: OmegaGameState;
}

export interface SaveAdapter {
  read(slot: string): Promise<SaveEnvelope | null>;
  write(envelope: SaveEnvelope): Promise<void>;
  remove(slot: string): Promise<void>;
}

export class MemorySaveAdapter implements SaveAdapter {
  private readonly data = new Map<string, SaveEnvelope>();

  async read(slot: string): Promise<SaveEnvelope | null> {
    const value = this.data.get(slot);
    return value ? structuredClone(value) : null;
  }

  async write(envelope: SaveEnvelope): Promise<void> {
    this.data.set(envelope.slot, structuredClone(envelope));
  }

  async remove(slot: string): Promise<void> {
    this.data.delete(slot);
  }
}

export class IndexedDbSaveAdapter implements SaveAdapter {
  constructor(
    private readonly dbName = "omega_v2",
    private readonly storeName = "saves",
    private readonly dbVersion = 1
  ) {}

  private openDb(): Promise<IDBDatabase> {
    if (!("indexedDB" in globalThis)) {
      return Promise.reject(new Error("IndexedDB is not available in this runtime."));
    }
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: "slot" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB."));
    });
  }

  async read(slot: string): Promise<SaveEnvelope | null> {
    const db = await this.openDb();
    try {
      return await new Promise((resolve, reject) => {
        const request = db.transaction(this.storeName, "readonly").objectStore(this.storeName).get(slot);
        request.onsuccess = () => resolve((request.result as SaveEnvelope | undefined) ?? null);
        request.onerror = () => reject(request.error ?? new Error("Failed to read save."));
      });
    } finally {
      db.close();
    }
  }

  async write(envelope: SaveEnvelope): Promise<void> {
    const db = await this.openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const request = db.transaction(this.storeName, "readwrite").objectStore(this.storeName).put(envelope);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error("Failed to write save."));
      });
    } finally {
      db.close();
    }
  }

  async remove(slot: string): Promise<void> {
    const db = await this.openDb();
    try {
      await new Promise<void>((resolve, reject) => {
        const request = db.transaction(this.storeName, "readwrite").objectStore(this.storeName).delete(slot);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error ?? new Error("Failed to delete save."));
      });
    } finally {
      db.close();
    }
  }
}

export class SaveManager {
  constructor(private readonly adapter: SaveAdapter) {}

  async save(slot: string, state: OmegaGameState): Promise<SaveEnvelope> {
    const snapshot = cloneGameState(state);
    snapshot.meta.updatedAt = Date.now();
    const envelope: SaveEnvelope = { slot, savedAt: Date.now(), state: snapshot };
    await this.adapter.write(envelope);
    return envelope;
  }

  async load(slot: string): Promise<OmegaGameState | null> {
    const envelope = await this.adapter.read(slot);
    if (!envelope) return null;
    if (!validateGameState(envelope.state)) {
      throw new Error(`Save slot '${slot}' uses an incompatible or invalid schema.`);
    }
    return cloneGameState(envelope.state);
  }

  async clear(slot: string): Promise<void> {
    await this.adapter.remove(slot);
  }
}
