export class EventBus {
    listeners = new Map();
    on(event, listener) {
        const bucket = this.listeners.get(event) ?? new Set();
        bucket.add(listener);
        this.listeners.set(event, bucket);
        return () => this.off(event, listener);
    }
    off(event, listener) {
        const bucket = this.listeners.get(event);
        bucket?.delete(listener);
        if (bucket?.size === 0)
            this.listeners.delete(event);
    }
    emit(event, payload) {
        const bucket = this.listeners.get(event);
        if (!bucket)
            return;
        for (const listener of [...bucket])
            listener(payload);
    }
    clear() {
        this.listeners.clear();
    }
}
