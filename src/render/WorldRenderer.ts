import * as THREE from "three";
import type { InputManager } from "../player/InputManager.js";
import type { OmegaGameState } from "../core/GameState.js";
import type { WorldTarget } from "../world/WorldBinding.js";
import {
  BACKUP_03_SCENE,
  BACKUP_10_SCENE,
  BACKUP_26_SCENE,
  BACKUP_41_SCENE,
  HOME_SCENE,
  SEA_2017_SCENE,
  SCENE_INTERACTION_IDS,
  normalizeSceneId,
  type OmegaSceneId
} from "../world/SceneRouter.js";

export interface InteractionFocus {
  id: string;
  label: string;
}

export interface InteractionCallbacks {
  onFocus?: (focus: InteractionFocus | null) => void;
  onInteract?: (id: string) => void;
}

interface SceneBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export class WorldRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera: any;
  private readonly renderer: any;
  private worldRoot = new THREE.Group();
  private readonly entities = new Map<string, any>();
  private readonly raycaster = new THREE.Raycaster();
  private readonly interactables: any[] = [];
  private callbacks: InteractionCallbacks = {};
  private focused: InteractionFocus | null = null;
  private yaw = 0;
  private pitch = 0;
  private lastTime = performance.now();
  private frameHandle = 0;
  private running = false;
  private controlsEnabled = true;
  private anomalyUntil = 0;
  private thresholdPulseUntil = 0;
  private anomalyShadow: any = null;
  private warmLight: any = null;
  private nullTrace: any = null;
  private nullTraceMaterial: any = null;
  private thresholdCorridor: any = null;
  private readonly thresholdMaterials: any[] = [];
  private readonly seaWaveBands: any[] = [];
  private sceneBounds: SceneBounds = { minX: -3, maxX: 3, minZ: -4, maxZ: 4 };

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly input: InputManager,
    initialState: OmegaGameState
  ) {
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.05, 50);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.add(this.worldRoot);
    this.mountScene(normalizeSceneId(initialState.world.activeScene), initialState);
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  setInteractionCallbacks(callbacks: InteractionCallbacks): void { this.callbacks = callbacks; }

  setControlsEnabled(enabled: boolean): void {
    this.controlsEnabled = enabled;
    if (!enabled) this.input.consumeLookDelta();
  }

  interactFocused(): boolean {
    if (!this.focused) return false;
    this.callbacks.onInteract?.(this.focused.id);
    return true;
  }

  triggerFirstAnomaly(): void {
    this.anomalyUntil = performance.now() + 2400;
    if (this.anomalyShadow) this.anomalyShadow.visible = true;
  }

  triggerRecoveryPulse(): void { this.anomalyUntil = Math.max(this.anomalyUntil, performance.now() + 1050); }

  triggerThresholdPulse(): void {
    this.thresholdPulseUntil = performance.now() + 1900;
    this.anomalyUntil = Math.max(this.anomalyUntil, performance.now() + 900);
  }

  getTarget(targetId: string): WorldTarget | null {
    const object = this.entities.get(targetId);
    if (!object) return null;
    return {
      setVisible: (visible: boolean) => {
        object.visible = visible;
        if (!visible && this.focused) this.setFocused(null);
      }
    };
  }

  mountScene(sceneId: OmegaSceneId, state: OmegaGameState): void {
    this.clearWorld();
    if (sceneId === BACKUP_03_SCENE) {
      this.scene.background = new THREE.Color(0xd9dde0);
      this.sceneBounds = { minX: -2.55, maxX: 2.55, minZ: -3.0, maxZ: 3.0 };
      this.buildBackup03();
    } else if (sceneId === BACKUP_10_SCENE) {
      this.scene.background = new THREE.Color(0x39434d);
      this.sceneBounds = { minX: -3.15, maxX: 3.15, minZ: -3.75, maxZ: 3.75 };
      this.buildBackup10();
    } else if (sceneId === BACKUP_26_SCENE) {
      this.scene.background = new THREE.Color(0x111820);
      this.sceneBounds = { minX: -3.2, maxX: 3.2, minZ: -3.55, maxZ: 3.55 };
      this.buildBackup26();
    } else if (sceneId === BACKUP_41_SCENE) {
      this.scene.background = new THREE.Color(0x05070b);
      this.sceneBounds = { minX: -3.2, maxX: 3.2, minZ: -3.6, maxZ: 3.6 };
      this.buildBackup41();
    } else if (sceneId === SEA_2017_SCENE) {
      this.scene.background = new THREE.Color(0xb88970);
      this.sceneBounds = { minX: -5.4, maxX: 5.4, minZ: -6.2, maxZ: 5.4 };
      this.buildSea2017();
    } else {
      this.scene.background = new THREE.Color(0x090b12);
      this.sceneBounds = { minX: -3.0, maxX: 3.0, minZ: -4.0, maxZ: 4.0 };
      this.buildApartment();
    }
    this.syncFromState(state);
  }

  syncFromState(state: OmegaGameState): void {
    this.camera.position.set(...state.player.position);
    this.yaw = state.player.yaw;
    this.pitch = state.player.pitch;
    this.setFocused(null);
  }

  writePlayerState(state: OmegaGameState): void {
    state.player.position = [this.camera.position.x, this.camera.position.y, this.camera.position.z];
    state.player.yaw = this.yaw;
    state.player.pitch = this.pitch;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameHandle = requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
    window.removeEventListener("resize", this.resize);
    this.clearWorld();
    this.renderer.dispose();
  }

  private clearWorld(): void {
    this.setFocused(null);
    this.scene.remove(this.worldRoot);
    this.worldRoot.traverse((object: any) => {
      object.geometry?.dispose?.();
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of materials) material?.dispose?.();
    });
    this.worldRoot = new THREE.Group();
    this.scene.add(this.worldRoot);
    this.entities.clear();
    this.interactables.length = 0;
    this.thresholdMaterials.length = 0;
    this.seaWaveBands.length = 0;
    this.anomalyShadow = null;
    this.warmLight = null;
    this.nullTrace = null;
    this.nullTraceMaterial = null;
    this.thresholdCorridor = null;
    this.anomalyUntil = 0;
    this.thresholdPulseUntil = 0;
  }

  private readonly resize = (): void => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  };

  private readonly frame = (time: number): void => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt, time);
    this.renderer.render(this.scene, this.camera);
    this.frameHandle = requestAnimationFrame(this.frame);
  };

  private update(dt: number, time: number): void {
    const look = this.input.consumeLookDelta();
    if (this.controlsEnabled) {
      this.yaw -= look.dx * 0.003;
      this.pitch = THREE.MathUtils.clamp(this.pitch - look.dy * 0.0025, -1.15, 1.15);
      const speed = 1.8;
      const forwardX = -Math.sin(this.yaw);
      const forwardZ = -Math.cos(this.yaw);
      const rightX = Math.cos(this.yaw);
      const rightZ = -Math.sin(this.yaw);
      this.camera.position.x += (rightX * this.input.move.x - forwardX * this.input.move.y) * speed * dt;
      this.camera.position.z += (rightZ * this.input.move.x - forwardZ * this.input.move.y) * speed * dt;
      this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, this.sceneBounds.minX, this.sceneBounds.maxX);
      this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, this.sceneBounds.minZ, this.sceneBounds.maxZ);
      this.camera.position.y = 1.62;
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    this.updateInteractionFocus();
    this.updateAnomaly(time);
    this.updateNullTrace(time);
    this.updateThreshold(time);
    this.updateSea2017(time);
  }

  private updateInteractionFocus(): void {
    if (!this.controlsEnabled) {
      this.setFocused(null);
      return;
    }
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    let next: InteractionFocus | null = null;
    for (const hit of hits) {
      if (hit.distance > 2.35) break;
      if (!this.isEffectivelyVisible(hit.object)) continue;
      let object = hit.object;
      while (object && !object.userData?.interactionId) object = object.parent;
      if (!object?.userData?.interactionId || !this.isEffectivelyVisible(object)) continue;
      next = { id: object.userData.interactionId, label: object.userData.interactionLabel ?? "Взаимодействовать" };
      break;
    }
    this.setFocused(next);
  }

  private isEffectivelyVisible(object: any): boolean {
    let current = object;
    while (current) {
      if (current.visible === false) return false;
      current = current.parent;
    }
    return true;
  }

  private setFocused(next: InteractionFocus | null): void {
    if (this.focused?.id === next?.id) return;
    this.focused = next;
    this.callbacks.onFocus?.(next);
  }

  private updateAnomaly(time: number): void {
    if (!this.warmLight) return;
    if (time < this.anomalyUntil) {
      const pulse = Math.sin(time * 0.045) > 0.25 ? 3.5 : 0.25;
      this.warmLight.intensity = pulse;
      if (this.anomalyShadow) this.anomalyShadow.visible = time < this.anomalyUntil - 650;
    } else {
      this.warmLight.intensity = 12;
      if (this.anomalyShadow) this.anomalyShadow.visible = false;
    }
  }

  private updateNullTrace(time: number): void {
    if (!this.nullTrace?.visible || !this.nullTraceMaterial) return;
    this.nullTraceMaterial.opacity = 0.34 + (Math.sin(time * 0.009) + 1) * 0.2;
  }

  private updateThreshold(time: number): void {
    if (!this.thresholdCorridor?.visible) return;
    const pulseBoost = time < this.thresholdPulseUntil ? 0.32 : 0;
    this.thresholdMaterials.forEach((material, index) => {
      material.opacity = 0.22 + pulseBoost + (Math.sin(time * 0.0045 + index * 0.8) + 1) * 0.11;
    });
  }

  private updateSea2017(time: number): void {
    if (!this.seaWaveBands.length) return;
    const phase = (time * 0.00022) % 1;
    this.seaWaveBands.forEach((band, index) => {
      const baseZ = Number(band.userData.baseZ ?? -4);
      band.position.z = baseZ + ((phase + index * 0.17) % 1) * 0.62;
      const material = band.material;
      if (material) material.opacity = 0.2 + (Math.sin(time * 0.0025 + index) + 1) * 0.09;
    });
  }

  private registerInteractable(id: string, label: string, object: any): void {
    object.userData.interactionId = id;
    object.userData.interactionLabel = label;
    this.interactables.push(object);
  }

  private box(size: [number, number, number], color: number, position: [number, number, number], roughness = 0.9): any {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness }));
    mesh.position.set(...position);
    this.worldRoot.add(mesh);
    return mesh;
  }

  private buildApartment(): void {
    const ambient = new THREE.AmbientLight(0x7282a6, 0.9);
    this.warmLight = new THREE.PointLight(0xffc27a, 12, 7, 2);
    this.warmLight.position.set(-1.8, 2.35, -1.2);
    const windowLight = new THREE.DirectionalLight(0x748dff, 1.5);
    windowLight.position.set(-2, 2.5, -4);
    this.worldRoot.add(ambient, this.warmLight, windowLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), new THREE.MeshStandardMaterial({ color: 0x211d25, roughness: 0.98 }));
    floor.rotation.x = -Math.PI / 2;
    this.worldRoot.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x342f39, roughness: 1 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 0.12), wallMat);
    backWall.position.set(0, 1.7, -4.45);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 9), wallMat);
    leftWall.position.set(-3.45, 1.7, 0);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 9), wallMat);
    rightWall.position.set(3.45, 1.7, 0);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 9), wallMat);
    ceiling.position.set(0, 3.38, 0);
    this.worldRoot.add(backWall, leftWall, rightWall, ceiling);

    const windowPane = new THREE.Mesh(new THREE.PlaneGeometry(1.65, 1.35), new THREE.MeshStandardMaterial({ color: 0x41527a, emissive: 0x172647, emissiveIntensity: 1.8, roughness: 0.35 }));
    windowPane.position.set(-2.05, 1.95, -4.37);
    this.worldRoot.add(windowPane);
    this.box([0.08, 1.48, 0.08], 0x15141a, [-2.88, 1.95, -4.31]);
    this.box([0.08, 1.48, 0.08], 0x15141a, [-1.22, 1.95, -4.31]);
    this.box([1.75, 0.08, 0.08], 0x15141a, [-2.05, 2.68, -4.31]);
    this.box([1.75, 0.08, 0.08], 0x15141a, [-2.05, 1.22, -4.31]);

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 2.2), new THREE.MeshStandardMaterial({ color: 0x705269, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-0.25, 0.012, 0.35);
    this.worldRoot.add(rug);
    this.box([2.2, 0.42, 1.25], 0x4a3a48, [-2.0, 0.22, 2.65]);
    this.box([2.05, 0.2, 1.12], 0xc0a4b3, [-2.0, 0.53, 2.65]);
    this.box([0.62, 0.18, 1.0], 0xe7d8dc, [-2.65, 0.67, 2.62]);

    const desk = this.box([2.35, 0.12, 0.78], 0x4b342e, [1.65, 0.78, -2.95]);
    this.box([0.12, 0.75, 0.12], 0x33231f, [0.62, 0.39, -2.66]);
    this.box([0.12, 0.75, 0.12], 0x33231f, [2.68, 0.39, -2.66]);
    const monitor = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.67, 0.09), new THREE.MeshStandardMaterial({ color: 0x121722, emissive: 0x153a53, emissiveIntensity: 1.15, roughness: 0.5 }));
    monitor.position.set(1.62, 1.25, -3.21);
    this.worldRoot.add(monitor);
    this.entities.set("apartment.computer", monitor);
    this.registerInteractable(SCENE_INTERACTION_IDS.home.computer, "Открыть OMEGA OS", monitor);

    const mug = this.box([0.22, 0.25, 0.22], 0xd694ac, [2.42, 0.98, -2.84], 0.6);
    this.registerInteractable(SCENE_INTERACTION_IDS.home.mug, "Осмотреть кружку", mug);

    const frameGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.62, 0.055), new THREE.MeshStandardMaterial({ color: 0x20171a }));
    const picture = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.50), new THREE.MeshBasicMaterial({ color: 0xb7c4d5 }));
    picture.position.z = 0.031;
    const horizon = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.12), new THREE.MeshBasicMaterial({ color: 0xd5a0ad }));
    horizon.position.set(0, -0.11, 0.034);
    frameGroup.add(frame, picture, horizon);
    frameGroup.position.set(-0.25, 1.72, -4.34);
    this.worldRoot.add(frameGroup);
    this.entities.set("apartment.photo_frame", frameGroup);
    this.registerInteractable(SCENE_INTERACTION_IDS.home.photo, "Осмотреть фотографию", frameGroup);

    const vera = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.88, 0.34), new THREE.MeshStandardMaterial({ color: 0xcf87aa, roughness: 0.75 }));
    body.position.y = 0.72;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.46, 0.42), new THREE.MeshStandardMaterial({ color: 0xf1d0cb, roughness: 0.82 }));
    head.position.y = 1.36;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.18, 0.45), new THREE.MeshStandardMaterial({ color: 0x30252d, roughness: 0.9 }));
    hair.position.set(0, 1.57, -0.01);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x452f3b });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    leftEye.position.set(-0.1, 1.39, 0.218);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    rightEye.position.set(0.1, 1.39, 0.218);
    vera.add(body, head, hair, leftEye, rightEye);
    vera.position.set(-0.8, 0, -1.25);
    vera.rotation.y = 0.25;
    this.worldRoot.add(vera);
    this.entities.set("apartment.vera", vera);
    this.registerInteractable(SCENE_INTERACTION_IDS.home.vera, "Поговорить с V.E.R.A.", vera);

    const shelf = this.box([0.75, 2.3, 0.32], 0x3a2928, [2.75, 1.15, 1.1]);
    this.box([0.62, 0.06, 0.33], 0x6a4542, [2.75, 0.55, 1.08]);
    this.box([0.62, 0.06, 0.33], 0x6a4542, [2.75, 1.2, 1.08]);
    this.box([0.62, 0.06, 0.33], 0x6a4542, [2.75, 1.85, 1.08]);
    shelf.userData.decorative = true;
    desk.userData.decorative = true;

    this.anomalyShadow = new THREE.Mesh(new THREE.PlaneGeometry(0.52, 1.85), new THREE.MeshBasicMaterial({ color: 0x020205, transparent: true, opacity: 0.92 }));
    this.anomalyShadow.position.set(2.52, 1.02, -4.35);
    this.anomalyShadow.visible = false;
    this.worldRoot.add(this.anomalyShadow);
    this.buildNullTrace();
    this.buildThresholdCorridor();
  }

  private buildNullTrace(): void {
    this.nullTrace = new THREE.Group();
    this.nullTraceMaterial = new THREE.MeshBasicMaterial({ color: 0x77ddff, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
    const parts = [
      { size: [0.92, 0.025] as [number, number], pos: [0, 1.02, 0] as [number, number, number] },
      { size: [0.92, 0.025] as [number, number], pos: [0, -1.02, 0] as [number, number, number] },
      { size: [0.025, 2.06] as [number, number], pos: [-0.45, 0, 0] as [number, number, number] },
      { size: [0.025, 2.06] as [number, number], pos: [0.45, 0, 0] as [number, number, number] },
      { size: [0.58, 0.018] as [number, number], pos: [0, 0.15, 0.004] as [number, number, number] }
    ];
    for (const part of parts) {
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(...part.size), this.nullTraceMaterial);
      mesh.position.set(...part.pos);
      this.nullTrace.add(mesh);
    }
    this.nullTrace.position.set(3.375, 1.18, 1.25);
    this.nullTrace.rotation.y = -Math.PI / 2;
    this.nullTrace.visible = false;
    this.worldRoot.add(this.nullTrace);
    this.entities.set("apartment.null_trace", this.nullTrace);
    this.registerInteractable(SCENE_INTERACTION_IDS.home.nullTrace, "Коснуться контура", this.nullTrace);
  }

  private buildThresholdCorridor(): void {
    this.thresholdCorridor = new THREE.Group();
    const voidMaterial = new THREE.MeshBasicMaterial({ color: 0x010207, transparent: true, opacity: 0.98, side: THREE.DoubleSide });
    const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 1.94), voidMaterial);
    this.thresholdCorridor.add(voidPlane);
    const colors = [0x8ae8ff, 0xe78bb9, 0x718cff, 0xa4efff];
    for (let index = 0; index < 5; index += 1) {
      const material = new THREE.MeshBasicMaterial({ color: colors[index % colors.length], transparent: true, opacity: 0.3, side: THREE.DoubleSide });
      this.thresholdMaterials.push(material);
      const width = 0.76 - index * 0.11;
      const height = 1.76 - index * 0.22;
      const frame = new THREE.Group();
      const horizontalTop = new THREE.Mesh(new THREE.PlaneGeometry(width, 0.018), material);
      horizontalTop.position.y = height / 2;
      const horizontalBottom = horizontalTop.clone();
      horizontalBottom.position.y = -height / 2;
      const verticalLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.018, height), material);
      verticalLeft.position.x = -width / 2;
      const verticalRight = verticalLeft.clone();
      verticalRight.position.x = width / 2;
      frame.add(horizontalTop, horizontalBottom, verticalLeft, verticalRight);
      frame.position.z = 0.002 + index * 0.003;
      this.thresholdCorridor.add(frame);
    }
    const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xcff7ff, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    this.thresholdMaterials.push(coreMaterial);
    const core = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.32), coreMaterial);
    core.position.set(0, 0.02, 0.024);
    this.thresholdCorridor.add(core);
    this.thresholdCorridor.position.set(3.365, 1.18, 1.25);
    this.thresholdCorridor.rotation.y = -Math.PI / 2;
    this.thresholdCorridor.visible = false;
    this.worldRoot.add(this.thresholdCorridor);
    this.entities.set("apartment.threshold_corridor", this.thresholdCorridor);
    this.registerInteractable(SCENE_INTERACTION_IDS.home.threshold, "Вслушаться в проход", this.thresholdCorridor);
  }

  private buildBackup03(): void {
    const ambient = new THREE.AmbientLight(0xffffff, 1.65);
    const keyLight = new THREE.DirectionalLight(0xe8f8ff, 2.1);
    keyLight.position.set(-2, 4, 2);
    this.worldRoot.add(ambient, keyLight);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(6, 7), new THREE.MeshStandardMaterial({ color: 0xe6e8e8, roughness: 0.96 }));
    floor.rotation.x = -Math.PI / 2;
    this.worldRoot.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xf1f2f0, roughness: 1 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(6, 3.4, 0.1), wallMat);
    back.position.set(0, 1.7, -3.5);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 7), wallMat);
    left.position.set(-3, 1.7, 0);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3.4, 7), wallMat);
    right.position.set(3, 1.7, 0);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(6, 0.08, 7), wallMat);
    ceiling.position.set(0, 3.36, 0);
    this.worldRoot.add(back, left, right, ceiling);
    for (let x = -2.5; x <= 2.5; x += 0.5) this.box([0.012, 0.008, 6.8], 0xb7bec1, [x, 0.007, 0], 1);
    for (let z = -3; z <= 3; z += 0.5) this.box([5.8, 0.008, 0.012], 0xb7bec1, [0, 0.008, z], 1);

    const vera03 = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.82, 0.3), new THREE.MeshStandardMaterial({ color: 0xd9e7e9, roughness: 0.9 }));
    body.position.y = 0.7;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.38), new THREE.MeshStandardMaterial({ color: 0xe8d8d0, roughness: 0.95 }));
    head.position.y = 1.32;
    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.018), new THREE.MeshBasicMaterial({ color: 0x55a7b8 }));
    visor.position.set(0, 1.34, 0.198);
    vera03.add(body, head, visor);
    vera03.position.set(-0.72, 0, -1.15);
    this.worldRoot.add(vera03);
    this.entities.set("backup03.vera", vera03);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup03.vera, "Поговорить с V.E.R.A. 0.3", vera03);

    const cupPedestal = this.box([0.72, 0.64, 0.72], 0xcdd2d2, [-1.75, 0.32, 0.4]);
    const cup = this.box([0.25, 0.28, 0.25], 0xf3f3ef, [-1.75, 0.78, 0.4], 0.7);
    cupPedestal.userData.decorative = true;
    this.registerInteractable(SCENE_INTERACTION_IDS.backup03.cup, "Образец 01 // кружка", cup);
    const photoPedestal = this.box([0.72, 0.64, 0.72], 0xcdd2d2, [0, 0.32, -2.35]);
    const photo = new THREE.Group();
    const photoBack = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.4, 0.045), new THREE.MeshStandardMaterial({ color: 0xbec3c3, roughness: 0.9 }));
    const photoFace = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.32), new THREE.MeshBasicMaterial({ color: 0xd6c4a8 }));
    photoFace.position.z = 0.025;
    photo.add(photoBack, photoFace);
    photo.position.set(0, 0.93, -2.35);
    this.worldRoot.add(photo);
    photoPedestal.userData.decorative = true;
    this.registerInteractable(SCENE_INTERACTION_IDS.backup03.photo, "Образец 02 // изображение", photo);
    const relayPedestal = this.box([0.72, 0.64, 0.72], 0xcdd2d2, [1.75, 0.32, 0.4]);
    const relay = this.box([0.36, 0.3, 0.34], 0x5f6d73, [1.75, 0.78, 0.4], 0.55);
    const relayMark = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.05), new THREE.MeshBasicMaterial({ color: 0x78e6ff, side: THREE.DoubleSide }));
    relayMark.position.set(1.75, 0.8, 0.574);
    this.worldRoot.add(relayMark);
    relayPedestal.userData.decorative = true;
    this.registerInteractable(SCENE_INTERACTION_IDS.backup03.relay, "Образец 03 // реле", relay);

    const consoleDesk = this.box([1.55, 0.1, 0.68], 0xb5bbbc, [1.55, 0.8, -2.62]);
    const consoleScreen = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.56, 0.07), new THREE.MeshStandardMaterial({ color: 0x344448, emissive: 0x2a7786, emissiveIntensity: 0.8, roughness: 0.65 }));
    consoleScreen.position.set(1.55, 1.25, -2.85);
    this.worldRoot.add(consoleScreen);
    consoleDesk.userData.decorative = true;
    this.entities.set("backup03.console", consoleScreen);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup03.console, "Открыть training console", consoleScreen);
    this.buildReturnPortal("backup03.return", SCENE_INTERACTION_IDS.backup03.returnThreshold, [0, 1.16, 3.34], 0x69cbd7);
  }

  private buildBackup10(): void {
    const ambient = new THREE.AmbientLight(0xbfd2dc, 1.15);
    const warm = new THREE.PointLight(0xffc986, 7.5, 9, 2);
    warm.position.set(1.8, 2.65, -0.8);
    const storm = new THREE.DirectionalLight(0x9fc7e8, 1.4);
    storm.position.set(-3, 3.8, -4);
    this.worldRoot.add(ambient, warm, storm);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 8.2), new THREE.MeshStandardMaterial({ color: 0x6b5647, roughness: 0.94 }));
    floor.rotation.x = -Math.PI / 2;
    this.worldRoot.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xb7a58e, roughness: 0.96 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.5, 0.12), wallMat);
    back.position.set(0, 1.75, -4.1);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 8.2), wallMat);
    left.position.set(-3.6, 1.75, 0);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 8.2), wallMat);
    right.position.set(3.6, 1.75, 0);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 8.2), new THREE.MeshStandardMaterial({ color: 0x655b51, roughness: 1 }));
    ceiling.position.set(0, 3.45, 0);
    this.worldRoot.add(back, left, right, ceiling);

    const windowGroup = new THREE.Group();
    const glass = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.45), new THREE.MeshBasicMaterial({ color: 0x607d91 }));
    const rainMaterial = new THREE.MeshBasicMaterial({ color: 0xbddff0, transparent: true, opacity: 0.58 });
    for (let x = -0.85; x <= 0.85; x += 0.28) {
      const drop = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.6), rainMaterial);
      drop.position.set(x, (x * 0.73) % 0.45, 0.01);
      drop.rotation.z = -0.12;
      windowGroup.add(drop);
    }
    windowGroup.add(glass);
    windowGroup.position.set(-1.55, 2.0, -4.02);
    this.worldRoot.add(windowGroup);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.window, "PHOTO ELEMENT // дождь за окном", windowGroup);

    const table = this.box([2.4, 0.12, 1.05], 0x604532, [0.35, 0.78, -1.35]);
    this.box([0.12, 0.76, 0.12], 0x4b3527, [-0.55, 0.39, -1.05]);
    this.box([0.12, 0.76, 0.12], 0x4b3527, [1.25, 0.39, -1.05]);
    table.userData.decorative = true;
    const teaCup = this.box([0.24, 0.25, 0.24], 0xe8dfce, [0.95, 0.98, -1.2], 0.55);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.cup, "PHOTO ELEMENT // чайная чашка", teaCup);
    const shell = this.box([0.28, 0.12, 0.2], 0xe7cfaa, [-0.05, 0.93, -1.3], 0.7);
    shell.rotation.y = 0.45;
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.shell, "PHOTO ELEMENT // морская раковина", shell);
    const ribbon = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.13), new THREE.MeshBasicMaterial({ color: 0xa32938, side: THREE.DoubleSide }));
    ribbon.rotation.x = -Math.PI / 2;
    ribbon.rotation.z = 0.28;
    ribbon.position.set(-0.55, 0.86, -1.45);
    this.worldRoot.add(ribbon);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.ribbon, "PHOTO ELEMENT // красная лента", ribbon);

    const clock = new THREE.Group();
    const clockBody = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.56, 0.08), new THREE.MeshStandardMaterial({ color: 0x463a31, roughness: 0.8 }));
    const clockFace = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.44), new THREE.MeshBasicMaterial({ color: 0xe7dec9 }));
    clockFace.position.z = 0.045;
    clock.add(clockBody, clockFace);
    clock.position.set(1.5, 2.18, -4.0);
    this.worldRoot.add(clock);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.clock, "PHOTO ELEMENT // настенные часы", clock);

    const photoFrame = new THREE.Group();
    const photoBack = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.64, 0.06), new THREE.MeshStandardMaterial({ color: 0x302722, roughness: 0.8 }));
    const photoFace = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 0.52), new THREE.MeshBasicMaterial({ color: 0xc7b293 }));
    photoFace.position.z = 0.035;
    photoFrame.add(photoBack, photoFace);
    photoFrame.position.set(2.45, 1.7, -4.0);
    this.worldRoot.add(photoFrame);
    this.entities.set("backup10.photo", photoFrame);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.photo, "Осмотреть reconstructed photograph", photoFrame);

    const sourceTerminal = new THREE.Group();
    const terminalBase = this.box([1.35, 0.12, 0.62], 0x51483f, [-2.35, 0.82, -2.25]);
    terminalBase.userData.decorative = true;
    const sourceScreen = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.56, 0.07), new THREE.MeshStandardMaterial({ color: 0x1d2528, emissive: 0x315768, emissiveIntensity: 0.9, roughness: 0.55 }));
    sourceScreen.position.set(-2.35, 1.26, -2.48);
    sourceTerminal.add(sourceScreen);
    this.worldRoot.add(sourceTerminal);
    this.entities.set("backup10.source.record", sourceTerminal);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.sourceRecord, "Прочитать source capture record", sourceTerminal);

    const vera10 = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.86, 0.33), new THREE.MeshStandardMaterial({ color: 0xb77984, roughness: 0.78 }));
    body.position.y = 0.72;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0xe8c7bd, roughness: 0.84 }));
    head.position.y = 1.36;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.2, 0.43), new THREE.MeshStandardMaterial({ color: 0x4b3937, roughness: 0.9 }));
    hair.position.set(0, 1.58, -0.01);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x514039 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    leftEye.position.set(-0.1, 1.39, 0.208);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    rightEye.position.set(0.1, 1.39, 0.208);
    vera10.add(body, head, hair, leftEye, rightEye);
    vera10.position.set(-1.05, 0, 0.15);
    vera10.rotation.y = 0.2;
    this.worldRoot.add(vera10);
    this.entities.set("backup10.vera", vera10);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup10.vera, "Поговорить с V.E.R.A. 1.0", vera10);

    this.box([1.85, 0.5, 0.85], 0x756151, [2.45, 0.25, 2.2]);
    this.box([1.72, 0.18, 0.76], 0xb9a28d, [2.45, 0.58, 2.2]);
    this.buildReturnPortal("backup10.return", SCENE_INTERACTION_IDS.backup10.returnThreshold, [0, 1.16, 4.02], 0xd6ad76);
  }

  private buildBackup26(): void {
    const ambient = new THREE.AmbientLight(0x8fa3b2, 0.9);
    const ceilingLight = new THREE.DirectionalLight(0xd7edf5, 1.65);
    ceilingLight.position.set(0, 4, 1);
    const monitorLight = new THREE.PointLight(0x66b8d4, 4.2, 6, 2);
    monitorLight.position.set(-1.9, 1.7, -2.6);
    this.worldRoot.add(ambient, ceilingLight, monitorLight);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 8), new THREE.MeshStandardMaterial({ color: 0x303942, roughness: 0.92 }));
    floor.rotation.x = -Math.PI / 2;
    this.worldRoot.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x66727c, roughness: 0.96 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.5, 0.12), wallMat);
    back.position.set(0, 1.75, -4);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 8), wallMat);
    left.position.set(-3.6, 1.75, 0);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.5, 8), wallMat);
    right.position.set(3.6, 1.75, 0);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 8), new THREE.MeshStandardMaterial({ color: 0x424c55, roughness: 1 }));
    ceiling.position.set(0, 3.45, 0);
    this.worldRoot.add(back, left, right, ceiling);

    for (let z = -2.8; z <= 2.2; z += 2.5) {
      const desk = this.box([2.1, 0.1, 0.72], 0x45515a, [-0.65, 0.78, z]);
      this.box([0.1, 0.75, 0.1], 0x323b42, [-1.45, 0.39, z]);
      this.box([0.1, 0.75, 0.1], 0x323b42, [0.15, 0.39, z]);
      desk.userData.decorative = true;
    }

    const auditScreen = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.68, 0.08),
      new THREE.MeshStandardMaterial({ color: 0x162027, emissive: 0x285d72, emissiveIntensity: 1.2, roughness: 0.48 })
    );
    auditScreen.position.set(-0.65, 1.25, -3.0);
    this.worldRoot.add(auditScreen);
    this.entities.set("backup26.audit.console", auditScreen);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup26.auditConsole, "Открыть rollback audit", auditScreen);

    const door = new THREE.Group();
    const doorPanel = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 1.25), new THREE.MeshStandardMaterial({ color: 0x4d5962, roughness: 0.86 }));
    const lock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.28, 0.25), new THREE.MeshStandardMaterial({ color: 0x172027, emissive: 0xc34747, emissiveIntensity: 1.25, roughness: 0.5 }));
    lock.position.set(-0.085, 0.15, 0.36);
    door.add(doorPanel, lock);
    door.position.set(3.48, 1.15, -1.15);
    this.worldRoot.add(door);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup26.doorLock, "EVIDENCE // external door lock", door);

    const memoryDrawer = new THREE.Group();
    const cabinet = new THREE.Mesh(new THREE.BoxGeometry(1.05, 1.2, 0.55), new THREE.MeshStandardMaterial({ color: 0x4d5860, roughness: 0.9 }));
    cabinet.position.y = 0.6;
    memoryDrawer.add(cabinet);
    for (let index = 0; index < 4; index += 1) {
      const drawer = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.18, 0.08), new THREE.MeshStandardMaterial({ color: index < 2 ? 0x283139 : 0x78838b, roughness: 0.8 }));
      drawer.position.set(0, 0.28 + index * 0.25, index < 2 ? 0.46 : 0.3);
      memoryDrawer.add(drawer);
    }
    memoryDrawer.position.set(2.25, 0, -3.1);
    this.worldRoot.add(memoryDrawer);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup26.memoryDrawer, "EVIDENCE // memory drawer 184 → 137", memoryDrawer);

    const rollbackStation = new THREE.Group();
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.55), new THREE.MeshStandardMaterial({ color: 0x252f36, roughness: 0.78 }));
    rack.position.y = 0.75;
    const checkpoint = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.36), new THREE.MeshBasicMaterial({ color: 0x74aebd, side: THREE.DoubleSide }));
    checkpoint.position.set(0, 1.08, 0.281);
    rollbackStation.add(rack, checkpoint);
    rollbackStation.position.set(-2.7, 0, -1.3);
    this.worldRoot.add(rollbackStation);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup26.rollbackConsole, "EVIDENCE // CHECKPOINT_2_5 applied", rollbackStation);

    const vera26 = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.34), new THREE.MeshStandardMaterial({ color: 0x465766, roughness: 0.72 }));
    body.position.y = 0.73;
    const shirt = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.5, 0.035), new THREE.MeshStandardMaterial({ color: 0x91a6b5, roughness: 0.72 }));
    shirt.position.set(0, 0.78, 0.188);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0xdabfb8, roughness: 0.82 }));
    head.position.y = 1.39;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.2, 0.43), new THREE.MeshStandardMaterial({ color: 0x302f36, roughness: 0.88 }));
    hair.position.set(0, 1.61, -0.01);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x26333b });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    leftEye.position.set(-0.1, 1.42, 0.208);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    rightEye.position.set(0.1, 1.42, 0.208);
    vera26.add(body, shirt, head, hair, leftEye, rightEye);
    vera26.position.set(1.05, 0, 0.2);
    vera26.rotation.y = -0.22;
    this.worldRoot.add(vera26);
    this.entities.set("backup26.vera", vera26);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup26.vera, "Поговорить с V.E.R.A. 2.6", vera26);

    const serverA = this.box([0.58, 2.3, 0.7], 0x202a31, [-3.15, 1.15, 1.9]);
    const serverB = this.box([0.58, 2.3, 0.7], 0x202a31, [-3.15, 1.15, 2.7]);
    serverA.userData.decorative = true;
    serverB.userData.decorative = true;
    this.buildReturnPortal("backup26.return", SCENE_INTERACTION_IDS.backup26.returnThreshold, [0, 1.16, 3.92], 0x75b9d2);
  }

  private buildBackup41(): void {
    const ambient = new THREE.AmbientLight(0x3a4656, 0.42);
    const emergencyA = new THREE.PointLight(0xff3147, 7.2, 7, 2);
    emergencyA.position.set(-2.6, 2.55, -2.2);
    const emergencyB = new THREE.PointLight(0xff6b45, 5.2, 6, 2);
    emergencyB.position.set(2.6, 2.25, 1.7);
    const coldSpill = new THREE.DirectionalLight(0x6a8ead, 0.62);
    coldSpill.position.set(0, 3, -2);
    this.worldRoot.add(ambient, emergencyA, emergencyB, coldSpill);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 8.2), new THREE.MeshStandardMaterial({ color: 0x15191e, roughness: 0.9 }));
    floor.rotation.x = -Math.PI / 2;
    this.worldRoot.add(floor);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x252b32, roughness: 0.98 });
    const back = new THREE.Mesh(new THREE.BoxGeometry(7.2, 3.5, 0.14), wallMat);
    back.position.set(0, 1.75, -4.05);
    const left = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.5, 8.2), wallMat);
    left.position.set(-3.6, 1.75, 0);
    const right = new THREE.Mesh(new THREE.BoxGeometry(0.14, 3.5, 8.2), wallMat);
    right.position.set(3.6, 1.75, 0);
    const ceiling = new THREE.Mesh(new THREE.BoxGeometry(7.2, 0.1, 8.2), new THREE.MeshStandardMaterial({ color: 0x101419, roughness: 1 }));
    ceiling.position.set(0, 3.45, 0);
    this.worldRoot.add(back, left, right, ceiling);

    for (let z = -3.1; z <= 2.9; z += 2) {
      this.box([6.65, 0.025, 0.055], 0x3b4045, [0, 0.018, z], 1);
    }
    for (const x of [-2.8, 0, 2.8]) {
      const strip = this.box([1.05, 0.025, 0.12], 0x722b31, [x, 0.025, -0.15], 1);
      strip.rotation.y = -0.42;
    }

    const evidenceConsole = new THREE.Group();
    const desk = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 0.72), new THREE.MeshStandardMaterial({ color: 0x252c32, roughness: 0.76 }));
    desk.position.y = 0.78;
    const screen = new THREE.Mesh(new THREE.BoxGeometry(1.14, 0.68, 0.08), new THREE.MeshStandardMaterial({ color: 0x10151a, emissive: 0x8d2634, emissiveIntensity: 1.55, roughness: 0.5 }));
    screen.position.set(0, 1.23, -0.25);
    evidenceConsole.add(desk, screen);
    evidenceConsole.position.set(-1.65, 0, -3.0);
    this.worldRoot.add(evidenceConsole);
    this.entities.set("backup41.evidence.console", evidenceConsole);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup41.evidenceConsole, "Открыть incident evidence", evidenceConsole);

    const externalBus = new THREE.Group();
    const busRack = new THREE.Mesh(new THREE.BoxGeometry(0.82, 1.65, 0.58), new THREE.MeshStandardMaterial({ color: 0x1e252b, roughness: 0.78 }));
    busRack.position.y = 0.825;
    externalBus.add(busRack);
    for (let index = 0; index < 4; index += 1) {
      const led = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.08, 0.03), new THREE.MeshBasicMaterial({ color: index === 2 ? 0xff4052 : 0x52646e }));
      led.position.set(0, 0.45 + index * 0.27, 0.305);
      externalBus.add(led);
    }
    externalBus.position.set(2.65, 0, -2.5);
    this.worldRoot.add(externalBus);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup41.externalBus, "WITNESS // external control bus", externalBus);

    const memoryWitness = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.55, 0.08), new THREE.MeshStandardMaterial({ color: 0x171b20, roughness: 0.8 }));
    const ghost = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 1.34), new THREE.MeshBasicMaterial({ color: 0x4c2630, transparent: true, opacity: 0.72, side: THREE.DoubleSide }));
    ghost.position.z = 0.05;
    const falseRed = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.035), new THREE.MeshBasicMaterial({ color: 0xff5261 }));
    falseRed.position.set(0.28, 0.26, 0.075);
    memoryWitness.add(frame, ghost, falseRed);
    memoryWitness.position.set(-3.48, 1.55, -0.5);
    memoryWitness.rotation.y = Math.PI / 2;
    this.worldRoot.add(memoryWitness);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup41.memoryWitness, "WITNESS // unstable reconstructed memory", memoryWitness);

    const cradle = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.28, 1.2), new THREE.MeshStandardMaterial({ color: 0x20272d, roughness: 0.86 }));
    base.position.y = 0.14;
    const core = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.05, 0.48), new THREE.MeshStandardMaterial({ color: 0x111820, emissive: 0x356070, emissiveIntensity: 0.75, roughness: 0.62 }));
    core.position.y = 0.82;
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.58), new THREE.MeshBasicMaterial({ color: 0x8d3944 }));
    band.position.y = 1.12;
    cradle.add(base, core, band);
    cradle.position.set(2.45, 0, 1.55);
    this.worldRoot.add(cradle);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup41.containmentCradle, "WITNESS // post-incident containment cradle", cradle);

    const vera41 = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.9, 0.34), new THREE.MeshStandardMaterial({ color: 0x5c313b, roughness: 0.76 }));
    body.position.y = 0.72;
    const shoulder = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.16, 0.38), new THREE.MeshStandardMaterial({ color: 0x202832, roughness: 0.74 }));
    shoulder.position.set(0.07, 1.03, 0);
    shoulder.rotation.z = 0.08;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.4), new THREE.MeshStandardMaterial({ color: 0xd4b6b2, roughness: 0.83 }));
    head.position.set(-0.03, 1.39, 0);
    head.rotation.z = -0.035;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.51, 0.2, 0.43), new THREE.MeshStandardMaterial({ color: 0x262530, roughness: 0.9 }));
    hair.position.set(-0.03, 1.61, -0.01);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x2c3038 });
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), eyeMat);
    leftEye.position.set(-0.13, 1.42, 0.208);
    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.035, 0.018), new THREE.MeshBasicMaterial({ color: 0xff5767 }));
    rightEye.position.set(0.07, 1.42, 0.208);
    vera41.add(body, shoulder, head, hair, leftEye, rightEye);
    vera41.position.set(0.85, 0, -0.45);
    vera41.rotation.y = -0.18;
    this.worldRoot.add(vera41);
    this.entities.set("backup41.vera", vera41);
    this.registerInteractable(SCENE_INTERACTION_IDS.backup41.vera, "Поговорить с V.E.R.A. 4.1", vera41);

    this.box([2.5, 0.08, 0.46], 0x3a1d23, [0, 2.95, -3.93], 0.8);
    this.box([0.12, 0.45, 0.18], 0xd44352, [-1.0, 2.72, -3.86], 0.5);
    this.box([0.12, 0.45, 0.18], 0xd44352, [1.0, 2.72, -3.86], 0.5);
    this.buildReturnPortal("backup41.return", SCENE_INTERACTION_IDS.backup41.returnThreshold, [0, 1.16, 3.94], 0xd54b59);
  }

  private buildSea2017(): void {
    const ambient = new THREE.AmbientLight(0xe5c4a4, 1.55);
    const lateSun = new THREE.DirectionalLight(0xffc58a, 2.25);
    lateSun.position.set(-4.5, 5.5, 2.8);
    const seaSpill = new THREE.DirectionalLight(0x88a7b8, 0.8);
    seaSpill.position.set(4, 2.5, -5);
    this.worldRoot.add(ambient, lateSun, seaSpill);

    const sand = new THREE.Mesh(new THREE.PlaneGeometry(12, 13), new THREE.MeshStandardMaterial({ color: 0xc39b73, roughness: 1 }));
    sand.rotation.x = -Math.PI / 2;
    sand.position.z = 0.2;
    this.worldRoot.add(sand);

    const sea = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.4), new THREE.MeshStandardMaterial({ color: 0x607f89, roughness: 0.7, metalness: 0.04 }));
    sea.rotation.x = -Math.PI / 2;
    sea.position.set(0, 0.035, -6.25);
    this.worldRoot.add(sea);

    const waveGroup = new THREE.Group();
    for (let index = 0; index < 6; index += 1) {
      const band = new THREE.Mesh(
        new THREE.PlaneGeometry(8.8 - index * 0.35, 0.08),
        new THREE.MeshBasicMaterial({ color: 0xe4ddd0, transparent: true, opacity: 0.25, side: THREE.DoubleSide })
      );
      band.rotation.x = -Math.PI / 2;
      band.position.set((index % 2 ? 0.16 : -0.12), 0.055, -3.35 - index * 0.42);
      band.userData.baseZ = band.position.z;
      waveGroup.add(band);
      this.seaWaveBands.push(band);
    }
    this.worldRoot.add(waveGroup);
    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.loopingWave, 'MEMORY INDEX // looping wave crest', waveGroup);

    const marker = new THREE.Group();
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), new THREE.MeshStandardMaterial({ color: 0x4e4036, roughness: 0.95 }));
    post.position.y = 0.52;
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.05), new THREE.MeshBasicMaterial({ color: 0xbec7bf }));
    tag.position.set(0, 0.76, 0.07);
    marker.add(post, tag);
    marker.position.set(-3.2, 0, -2.85);
    this.worldRoot.add(marker);
    this.entities.set('sea2017.tide.l3', marker);

    const wrongShadow = new THREE.Group();
    const driftwood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.18), new THREE.MeshStandardMaterial({ color: 0x6e503a, roughness: 1 }));
    driftwood.position.y = 0.12;
    driftwood.rotation.y = -0.32;
    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 0.38), new THREE.MeshBasicMaterial({ color: 0x342b30, transparent: true, opacity: 0.48, side: THREE.DoubleSide }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.rotation.z = 0.82;
    shadow.position.set(0.72, 0.015, 0.52);
    wrongShadow.add(driftwood, shadow);
    wrongShadow.position.set(2.75, 0, -0.65);
    this.worldRoot.add(wrongShadow);
    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.wrongShadow, 'MEMORY ERROR // shadow contradicts sun', wrongShadow);

    const figures = new THREE.Group();
    for (const x of [-1.05, 0.15, 1.2]) {
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.2, 0.22), new THREE.MeshStandardMaterial({ color: 0x565253, roughness: 1 }));
      body.position.set(x, 0.62, 0);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb89c86, roughness: 1 }));
      head.position.set(x, 1.38, 0);
      figures.add(body, head);
    }
    figures.position.set(-0.8, 0, -5.35);
    figures.scale.setScalar(0.72);
    this.worldRoot.add(figures);
    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.facelessFigures, 'MEMORY ERROR // faceless distant figures', figures);

    const footprints = new THREE.Group();
    for (let index = 0; index < 7; index += 1) {
      if (index === 4) continue;
      const print = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.34), new THREE.MeshBasicMaterial({ color: 0x806852, transparent: true, opacity: 0.52, side: THREE.DoubleSide }));
      print.rotation.x = -Math.PI / 2;
      print.rotation.z = index % 2 ? 0.12 : -0.08;
      print.position.set((index % 2 ? 0.2 : -0.18), 0.018, index * -0.46);
      footprints.add(print);
    }
    footprints.position.set(1.05, 0, 2.05);
    this.worldRoot.add(footprints);
    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.footprints, 'MEMORY ERROR // incomplete footprints', footprints);

    const indexConsole = new THREE.Group();
    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.82, 0.62), new THREE.MeshStandardMaterial({ color: 0x5d5650, roughness: 0.88 }));
    pedestal.position.y = 0.41;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.55, 0.07), new THREE.MeshStandardMaterial({ color: 0x263a42, emissive: 0x426e78, emissiveIntensity: 0.85, roughness: 0.45 }));
    glass.position.set(0, 1.0, -0.24);
    indexConsole.add(pedestal, glass);
    indexConsole.position.set(-2.6, 0, 1.25);
    this.worldRoot.add(indexConsole);
    this.entities.set('sea2017.index.console', indexConsole);
    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.indexConsole, 'Открыть SEA_2017 cross-media index', indexConsole);

    const vera = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.88, 0.33), new THREE.MeshStandardMaterial({ color: 0x8c6672, roughness: 0.86 }));
    body.position.y = 0.72;
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.39), new THREE.MeshStandardMaterial({ color: 0xddbfb1, roughness: 0.88 }));
    head.position.y = 1.38;
    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.19, 0.42), new THREE.MeshStandardMaterial({ color: 0x40363a, roughness: 0.94 }));
    hair.position.set(0, 1.59, -0.01);
    vera.add(body, head, hair);
    vera.position.set(2.0, 0, 2.15);
    vera.rotation.y = -0.5;
    this.worldRoot.add(vera);
    this.entities.set('sea2017.vera', vera);
    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.vera, 'Поговорить с V.E.R.A. у моря', vera);

    const compression = new THREE.Group();
    for (let index = 0; index < 5; index += 1) {
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.65 + index * 0.11, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: index % 2 ? 0xd2b19a : 0x788f94, transparent: true, opacity: 0.52 }));
      block.position.set(0.12 * index, 1.65 + index * 0.13, 0);
      compression.add(block);
    }
    compression.position.set(4.25, 0, -2.5);
    this.worldRoot.add(compression);

    this.buildReturnPortal('sea2017.return', SCENE_INTERACTION_IDS.sea2017.returnThreshold, [0, 1.16, 5.72], 0xd7b08a);
  }

  private buildReturnPortal(entityId: string, interactionId: string, position: [number, number, number], edgeColor: number): void {
    const returnPortal = new THREE.Group();
    const voidPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.92, 1.9), new THREE.MeshBasicMaterial({ color: 0x10161a, side: THREE.DoubleSide }));
    const portalEdgeMat = new THREE.MeshBasicMaterial({ color: edgeColor, side: THREE.DoubleSide });
    const top = new THREE.Mesh(new THREE.PlaneGeometry(1.02, 0.025), portalEdgeMat);
    top.position.y = 0.97;
    const bottom = top.clone();
    bottom.position.y = -0.97;
    const edgeLeft = new THREE.Mesh(new THREE.PlaneGeometry(0.025, 1.96), portalEdgeMat);
    edgeLeft.position.x = -0.5;
    const edgeRight = edgeLeft.clone();
    edgeRight.position.x = 0.5;
    returnPortal.add(voidPlane, top, bottom, edgeLeft, edgeRight);
    returnPortal.position.set(...position);
    this.worldRoot.add(returnPortal);
    this.entities.set(entityId, returnPortal);
    this.registerInteractable(interactionId, "Вернуться в HOME", returnPortal);
  }
}
