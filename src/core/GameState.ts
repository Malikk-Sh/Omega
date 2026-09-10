export const SAVE_SCHEMA_VERSION = 1;

export interface FileMutationState {
  deleted: boolean;
}

export interface OmegaGameState {
  schemaVersion: number;
  checkpoint: string;
  world: { activeScene: string };
  player: {
    position: [number, number, number];
    yaw: number;
    pitch: number;
  };
  filesystem: { entries: Record<string, FileMutationState> };
  flags: Record<string, boolean | number | string | null>;
  meta: { updatedAt: number };
}

export function createInitialGameState(now = Date.now()): OmegaGameState {
  return {
    schemaVersion: SAVE_SCHEMA_VERSION,
    checkpoint: "m0_apartment",
    world: { activeScene: "apartment_m0" },
    player: { position: [0, 1.65, 3.4], yaw: 0, pitch: 0 },
    filesystem: { entries: { "/memories/test_photo.img": { deleted: false } } },
    flags: { m0_intro_seen: false },
    meta: { updatedAt: now }
  };
}

export function cloneGameState(state: OmegaGameState): OmegaGameState {
  return structuredClone(state);
}

export function validateGameState(value: unknown): value is OmegaGameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<OmegaGameState>;
  return state.schemaVersion === SAVE_SCHEMA_VERSION
    && typeof state.checkpoint === "string"
    && !!state.player
    && Array.isArray(state.player.position)
    && state.player.position.length === 3
    && !!state.filesystem
    && typeof state.filesystem.entries === "object";
}
