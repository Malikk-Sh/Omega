import type { OmegaGameState, PlayerTransform } from "../core/GameState.js";

export const HOME_SCENE = "apartment_home_m4";
export const BACKUP_03_SCENE = "backup_0_3";
export type OmegaSceneId = typeof HOME_SCENE | typeof BACKUP_03_SCENE;

export const SCENE_INTERACTION_IDS = {
  home: {
    computer: "computer",
    vera: "vera",
    mug: "mug",
    photo: "photo",
    nullTrace: "null_trace",
    threshold: "threshold"
  },
  backup03: {
    vera: "backup03.vera",
    console: "backup03.console",
    cup: "backup03.sample.cup",
    photo: "backup03.sample.photo",
    relay: "backup03.sample.relay",
    returnThreshold: "backup03.return"
  }
} as const;

export interface SceneHost {
  writePlayerState(state: OmegaGameState): void;
  mountScene(sceneId: OmegaSceneId, state: OmegaGameState): void;
}

const BACKUP_03_SPAWN: PlayerTransform = {
  position: [0, 1.62, 2.35],
  yaw: 0,
  pitch: 0
};

const HOME_THRESHOLD_RETURN: PlayerTransform = {
  position: [2.45, 1.62, 1.25],
  yaw: -Math.PI / 2,
  pitch: 0
};

function clonePlayer(player: PlayerTransform): PlayerTransform {
  return {
    position: [...player.position] as [number, number, number],
    yaw: player.yaw,
    pitch: player.pitch
  };
}

export function normalizeSceneId(sceneId: string): OmegaSceneId {
  return sceneId === BACKUP_03_SCENE ? BACKUP_03_SCENE : HOME_SCENE;
}

export class SceneRouter {
  constructor(
    private state: OmegaGameState,
    private readonly host: SceneHost
  ) {}

  replaceState(state: OmegaGameState): void {
    this.state = state;
  }

  get activeScene(): OmegaSceneId {
    return normalizeSceneId(this.state.world.activeScene);
  }

  is(sceneId: OmegaSceneId): boolean {
    return this.activeScene === sceneId;
  }

  enterBackup03(): boolean {
    if (!this.is(HOME_SCENE)) return false;
    this.host.writePlayerState(this.state);
    this.state.world.returnPoint = {
      sceneId: HOME_SCENE,
      player: clonePlayer(this.state.player)
    };
    this.state.world.activeScene = BACKUP_03_SCENE;
    this.state.player = clonePlayer(BACKUP_03_SPAWN);
    this.host.mountScene(BACKUP_03_SCENE, this.state);
    return true;
  }

  returnHome(): boolean {
    if (!this.is(BACKUP_03_SCENE)) return false;
    this.host.writePlayerState(this.state);
    const returnPoint = this.state.world.returnPoint;
    const player = returnPoint?.sceneId === HOME_SCENE
      ? returnPoint.player
      : HOME_THRESHOLD_RETURN;
    this.state.world.activeScene = HOME_SCENE;
    this.state.player = clonePlayer(player);
    delete this.state.world.returnPoint;
    this.host.mountScene(HOME_SCENE, this.state);
    return true;
  }
}
