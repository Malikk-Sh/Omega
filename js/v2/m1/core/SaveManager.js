import { cloneGameState, validateGameState } from "./GameState.js";
export class MemorySaveAdapter {
    data = new Map();
    async read(slot) {
        const value = this.data.get(slot);
        return value ? structuredClone(value) : null;
    }
    async write(envelope) {
        this.data.set(envelope.slot, structuredClone(envelope));
    }
    async remove(slot) {
        this.data.delete(slot);
    }
}
export class IndexedDbSaveAdapter {
    dbName;
    storeName;
    dbVersion;
    constructor(dbName = "omega_v2", storeName = "saves", dbVersion = 1) {
        this.dbName = dbName;
        this.storeName = storeName;
        this.dbVersion = dbVersion;
    }
    openDb() {
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
    async read(slot) {
        const db = await this.openDb();
        try {
            return await new Promise((resolve, reject) => {
                const request = db.transaction(this.storeName, "readonly").objectStore(this.storeName).get(slot);
                request.onsuccess = () => resolve(request.result ?? null);
                request.onerror = () => reject(request.error ?? new Error("Failed to read save."));
            });
        }
        finally {
            db.close();
        }
    }
    async write(envelope) {
        const db = await this.openDb();
        try {
            await new Promise((resolve, reject) => {
                const request = db.transaction(this.storeName, "readwrite").objectStore(this.storeName).put(envelope);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error ?? new Error("Failed to write save."));
            });
        }
        finally {
            db.close();
        }
    }
    async remove(slot) {
        const db = await this.openDb();
        try {
            await new Promise((resolve, reject) => {
                const request = db.transaction(this.storeName, "readwrite").objectStore(this.storeName).delete(slot);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error ?? new Error("Failed to delete save."));
            });
        }
        finally {
            db.close();
        }
    }
}
export class SaveManager {
    adapter;
    constructor(adapter) {
        this.adapter = adapter;
    }
    async save(slot, state) {
        const snapshot = cloneGameState(state);
        snapshot.meta.updatedAt = Date.now();
        const envelope = { slot, savedAt: Date.now(), state: snapshot };
        await this.adapter.write(envelope);
        return envelope;
    }
    async load(slot) {
        const envelope = await this.adapter.read(slot);
        if (!envelope)
            return null;
        if (!validateGameState(envelope.state)) {
            throw new Error(`Save slot '${slot}' uses an incompatible or invalid schema.`);
        }
        return cloneGameState(envelope.state);
    }
    async clear(slot) {
        await this.adapter.remove(slot);
    }
}
