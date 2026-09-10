export class WorldBindingSystem {
    definitions;
    filesystem;
    events;
    targets = new Map();
    subscriptions = [];
    constructor(definitions, filesystem, events) {
        this.definitions = definitions;
        this.filesystem = filesystem;
        this.events = events;
        this.subscriptions.push(events.on("filesystem:changed", ({ path }) => {
            for (const binding of this.definitions) {
                if (binding.rule.type === "file_exists" && binding.rule.path === path)
                    this.evaluate(binding);
            }
        }), events.on("state:replaced", () => this.evaluateAll()));
    }
    registerTarget(targetId, target) {
        this.targets.set(targetId, target);
        for (const binding of this.definitions) {
            if (binding.targetId === targetId)
                this.evaluate(binding);
        }
    }
    evaluate(binding) {
        const target = this.targets.get(binding.targetId);
        if (!target)
            return;
        const ruleActive = binding.rule.type === "file_exists" && this.filesystem.exists(binding.rule.path);
        const visible = binding.action === "show" ? ruleActive : !ruleActive;
        target.setVisible(visible);
        this.events.emit("binding:changed", {
            bindingId: binding.id,
            targetId: binding.targetId,
            active: visible
        });
    }
    evaluateAll() {
        for (const binding of this.definitions)
            this.evaluate(binding);
    }
    destroy() {
        for (const unsubscribe of this.subscriptions.splice(0))
            unsubscribe();
        this.targets.clear();
    }
}
