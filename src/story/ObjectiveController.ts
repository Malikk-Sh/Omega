export interface ObjectiveViewModel {
  code: string;
  title: string;
  detail: string;
}

export class ObjectiveController {
  constructor(private readonly root: HTMLElement) {}

  set(objective: ObjectiveViewModel): void {
    this.root.dataset.objective = objective.code;
    const title = this.root.querySelector<HTMLElement>("[data-objective-title]");
    const detail = this.root.querySelector<HTMLElement>("[data-objective-detail]");
    if (title) title.textContent = objective.title;
    if (detail) detail.textContent = objective.detail;
    this.root.classList.remove("is-pulsing");
    // Restart the small transition even when two updates happen in one frame.
    void this.root.offsetWidth;
    this.root.classList.add("is-pulsing");
  }
}
