import type { OmegaGameState } from "./GameState.js";

export interface GameEvents extends Record<string, unknown> {
  "state:replaced": { state: OmegaGameState };
  "filesystem:changed": { path: string; deleted: boolean };
  "binding:changed": { bindingId: string; targetId: string; active: boolean };
  "save:written": { slot: string };
  "save:loaded": { slot: string };
  "os:visibility": { visible: boolean };
}
