export class FileSystemService {
    state;
    events;
    definitions = new Map();
    constructor(definition, state, events) {
        this.state = state;
        this.events = events;
        for (const entry of definition.entries) {
            if (this.definitions.has(entry.path))
                throw new Error(`Duplicate virtual path '${entry.path}'.`);
            this.definitions.set(entry.path, entry);
            if (entry.type === "file" && !this.state.filesystem.entries[entry.path]) {
                this.state.filesystem.entries[entry.path] = { deleted: false };
            }
        }
    }
    replaceState(state) {
        this.state = state;
    }
    getEntry(path) {
        const definition = this.definitions.get(path);
        if (!definition)
            return null;
        return { ...definition, deleted: this.state.filesystem.entries[path]?.deleted ?? false };
    }
    listDirectory(path, includeDeleted = true) {
        return [...this.definitions.values()]
            .filter(entry => entry.parent === path)
            .map(entry => this.getEntry(entry.path))
            .filter(entry => includeDeleted || !entry.deleted);
    }
    readFile(path) {
        const entry = this.getEntry(path);
        return entry?.type === "file" && !entry.deleted ? entry : null;
    }
    deleteFile(path) {
        const entry = this.getEntry(path);
        if (!entry || entry.type !== "file" || entry.deleted || entry.deletable === false)
            return false;
        this.state.filesystem.entries[path] = { deleted: true };
        this.events.emit("filesystem:changed", { path, deleted: true });
        return true;
    }
    restoreFile(path) {
        const entry = this.getEntry(path);
        if (!entry || entry.type !== "file" || !entry.deleted || entry.restorable === false)
            return false;
        this.state.filesystem.entries[path] = { deleted: false };
        this.events.emit("filesystem:changed", { path, deleted: false });
        return true;
    }
    exists(path) {
        const entry = this.getEntry(path);
        return !!entry && !entry.deleted;
    }
}
