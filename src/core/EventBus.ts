export type Unsubscribe = () => void;

export class EventBus<EventMap extends Record<string, unknown>> {
  private readonly listeners = new Map<keyof EventMap, Set<(payload: unknown) => void>>();

  on<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void): Unsubscribe {
    const bucket = this.listeners.get(event) ?? new Set<(payload: unknown) => void>();
    bucket.add(listener as (payload: unknown) => void);
    this.listeners.set(event, bucket);
    return () => this.off(event, listener);
  }

  off<K extends keyof EventMap>(event: K, listener: (payload: EventMap[K]) => void): void {
    const bucket = this.listeners.get(event);
    bucket?.delete(listener as (payload: unknown) => void);
    if (bucket?.size === 0) this.listeners.delete(event);
  }

  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    const bucket = this.listeners.get(event);
    if (!bucket) return;
    for (const listener of [...bucket]) listener(payload);
  }

  clear(): void {
    this.listeners.clear();
  }
}
