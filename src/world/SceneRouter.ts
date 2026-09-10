import type { OmegaGameState, PlayerTransform, SceneReturnPoint } from "../core/GameState.js";

export const HOME_SCENE = "apartment_home_m4";
export const BACKUP_03_SCENE = "backup_0_3";
export const BACKUP_10_SCENE = "backup_1_0";
export const BACKUP_26_SCENE = "backup_2_6";
export const BACKUP_41_SCENE = "backup_4_1";
export type OmegaSceneId = typeof HOME_SCENE | typeof BACKUP_03_SCENE | typeof BACKUP_10_SCENE | typeof BACKUP_26_SCENE | typeof BACKUP_41_SCENE;

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
  },
  backup10: {
    vera: "backup10.vera",
    sourceRecord: "backup10.source.record",
    photo: "backup10.photo",
    ribbon: "backup10.photo.red_ribbon",
    shell: "backup10.photo.sea_shell",
    clock: "backup10.photo.wall_clock",
    cup: "backup10.photo.tea_cup",
    window: "backup10.photo.window_rain",
    returnThreshold: "backup10.return"
  },
  backup26: {
    vera: "backup26.vera",
    auditConsole: "backup26.audit.console",
    doorLock: "backup26.evidence.door_lock",
    memoryDrawer: "backup26.evidence.memory_drawer",
    rollbackConsole: "backup26.evidence.rollback_console",
    returnThreshold: "backup26.return"
  },
  backup41: {
    vera: "backup41.vera",
    evidenceConsole: "backup41.evidence.console",
    externalBus: "backup41.evidence.external_bus",
    memoryWitness: "backup41.evidence.memory_witness",
    containmentCradle: "backup41.evidence.containment_cradle",
    returnThreshold: "backup41.return"
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

const BACKUP_SPAWNS: Record<Exclude<OmegaSceneId, typeof HOME_SCENE>, PlayerTransform> = {
  [BACKUP_03_SCENE]: { position: [0, 1.62, 2.35], yaw: 0, pitch: 0 },
  [BACKUP_10_SCENE]: { position: [0, 1.62, 3.35], yaw: 0, pitch: 0 },
  [BACKUP_26_SCENE]: { position: [0, 1.62, 3.15], yaw: 0, pitch: 0 },
  [BACKUP_41_SCENE]: { position: [0, 1.62, 3.05], yaw: 0, pitch: 0 }
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
  if (sceneId === BACKUP_03_SCENE) return BACKUP_03_SCENE;
  if (sceneId === BACKUP_10_SCENE) return BACKUP_10_SCENE;
  if (sceneId === BACKUP_26_SCENE) return BACKUP_26_SCENE;
  if (sceneId === BACKUP_41_SCENE) return BACKUP_41_SCENE;
  return HOME_SCENE;
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

  enterBackup03(): boolean { return this.enterBackup(BACKUP_03_SCENE); }
  enterBackup10(): boolean { return this.enterBackup(BACKUP_10_SCENE); }
  enterBackup26(): boolean { return this.enterBackup(BACKUP_26_SCENE); }
  enterBackup41(): boolean { return this.enterBackup(BACKUP_41_SCENE); }

  returnHome(): boolean {
    if (this.transitioning || this.is(HOME_SCENE)) return false;
    return this.runTransition(HOME_SCENE, () => {
      const returnPoint = this.state.world.returnPoint;
      const player = returnPoint?.sceneId === HOME_SCENE ? returnPoint.player : HOME_THRESHOLD_RETURN;
      this.state.world.activeScene = HOME_SCENE;
      this.state.player = clonePlayer(player);
      delete this.state.world.returnPoint;
    });
  }

  private enterBackup(targetScene: Exclude<OmegaSceneId, typeof HOME_SCENE>): boolean {
    if (this.transitioning || !this.is(HOME_SCENE)) return false;
    return this.runTransition(targetScene, () => {
      this.state.world.returnPoint = { sceneId: HOME_SCENE, player: clonePlayer(this.state.player) };
      this.state.world.activeScene = targetScene;
      this.state.player = clonePlayer(BACKUP_SPAWNS[targetScene]);
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