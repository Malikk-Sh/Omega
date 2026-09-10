import type { OmegaGameState, PlayerTransform, SceneReturnPoint } from "../core/GameState.js";

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

interface SceneTransitionSnapshot {
  activeScene: string;
  player: PlayerTransform;
  returnPoint?: SceneReturnPoint;
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

function cloneReturnPoint(returnPoint: SceneReturnPoint | undefined): SceneReturnPoint | undefined {
  if (!returnPoint) return undefined;
  return {
    sceneId: returnPoint.sceneId,
    player: clonePlayer(returnPoint.player)
  };
}

export function normalizeSceneId(sceneId: string): OmegaSceneId {
  return sceneId === BACKUP_03_SCENE ? BACKUP_03_SCENE : HOME_SCENE;
}

export class SceneRouter {
  private transitioning = false;

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

  get isTransitioning(): boolean {
    return this.transitioning;
  }

  is(sceneId: OmegaSceneId): boolean {
    return this.activeScene === sceneId;
  }

  enterBackup03(): boolean {
    if (this.transitioning || !this.is(HOME_SCENE)) return false;
    return this.runTransition(BACKUP_03_SCENE, () => {
      this.state.world.returnPoint = {
        sceneId: HOME_SCENE,
        player: clonePlayer(this.state.player)
      };
      this.state.world.activeScene = BACKUP_03_SCENE;
      this.state.player = clonePlayer(BACKUP_03_SPAWN);
    });
  }

  returnHome(): boolean {
    if (this.transitioning || !this.is(BACKUP_03_SCENE)) return false;
    return this.runTransition(HOME_SCENE, () => {
      const returnPoint = this.state.world.returnPoint;
      const player = returnPoint?.sceneId === HOME_SCENE
        ? returnPoint.player
        : HOME_THRESHOLD_RETURN;
      this.state.world.activeScene = HOME_SCENE;
      this.state.player = clonePlayer(player);
      delete this.state.world.returnPoint;
    });
  }

  private runTransition(targetScene: OmegaSceneId, applyState: () => void): boolean {
    this.transitioning = true;
    try {
      this.host.writePlayerState(this.state);
      const snapshot = this.captureSnapshot();
      const previousScene = normalizeSceneId(snapshot.activeScene);
      applyState();
      try {
        this.host.mountScene(targetScene, this.state);
      } catch (mountError) {
        this.restoreSnapshot(snapshot);
        try {
          this.host.mountScene(previousScene, this.state);
        } catch (rollbackError) {
          throw new AggregateError(
            [mountError, rollbackError],
            `Scene transition to '${targetScene}' failed and rollback mount also failed.`
          );
        }
        throw mountError;
      }
      return true;
    } finally {
      this.transitioning = false;
    }
  }

  private captureSnapshot(): SceneTransitionSnapshot {
    const returnPoint = cloneReturnPoint(this.state.world.returnPoint);
    return {
      activeScene: this.state.world.activeScene,
      player: clonePlayer(this.state.player),
      ...(returnPoint ? { returnPoint } : {})
    };
  }

  private restoreSnapshot(snapshot: SceneTransitionSnapshot): void {
    this.state.world.activeScene = snapshot.activeScene;
    this.state.player = clonePlayer(snapshot.player);
    const returnPoint = cloneReturnPoint(snapshot.returnPoint);
    if (returnPoint) this.state.world.returnPoint = returnPoint;
    else delete this.state.world.returnPoint;
  }
}
