import type { EventBus, Unsubscribe } from "../core/EventBus.js";
import type { GameEvents } from "../core/events.js";
import type { FileSystemService } from "../omega-os/FileSystemService.js";

export interface WorldBindingDefinition {
  id: string;
  rule: { type: "file_exists"; path: string };
  targetId: string;
  action: "show" | "hide";
}

export interface WorldTarget {
  setVisible(visible: boolean): void;
}

export class WorldBindingSystem {
  private readonly targets = new Map<string, WorldTarget>();
  private readonly subscriptions: Unsubscribe[] = [];

  constructor(
    private readonly definitions: WorldBindingDefinition[],
    private readonly filesystem: FileSystemService,
    private readonly events: EventBus<GameEvents>
  ) {
    this.subscriptions.push(
      events.on("filesystem:changed", ({ path }) => {
        for (const binding of this.definitions) {
          if (binding.rule.type === "file_exists" && binding.rule.path === path) this.evaluate(binding);
        }
      }),
      events.on("state:replaced", () => this.evaluateAll())
    );
  }

  registerTarget(targetId: string, target: WorldTarget): void {
    this.targets.set(targetId, target);
    for (const binding of this.definitions) {
      if (binding.targetId === targetId) this.evaluate(binding);
    }
  }

  clearTargets(): void {
    this.targets.clear();
  }

  private evaluate(binding: WorldBindingDefinition): void {
    const target = this.targets.get(binding.targetId);
    if (!target) return;
    const ruleActive = binding.rule.type === "file_exists" && this.filesystem.exists(binding.rule.path);
    const visible = binding.action === "show" ? ruleActive : !ruleActive;
    target.setVisible(visible);
    this.events.emit("binding:changed", {
      bindingId: binding.id,
      targetId: binding.targetId,
      active: visible
    });
  }

  evaluateAll(): void {
    for (const binding of this.definitions) this.evaluate(binding);
  }

  destroy(): void {
    for (const unsubscribe of this.subscriptions.splice(0)) unsubscribe();
    this.targets.clear();
  }
}
