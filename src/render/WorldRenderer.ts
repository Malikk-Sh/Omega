import * as THREE from "three";
import type { InputManager } from "../player/InputManager.js";
import type { OmegaGameState } from "../core/GameState.js";
import type { WorldTarget } from "../world/WorldBinding.js";

export class WorldRenderer {
  private readonly scene = new THREE.Scene();
  private readonly camera: any;
  private readonly renderer: any;
  private readonly worldRoot = new THREE.Group();
  private readonly entities = new Map<string, any>();
  private yaw = 0;
  private pitch = 0;
  private lastTime = performance.now();
  private frameHandle = 0;
  private running = false;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly input: InputManager,
    initialState: OmegaGameState
  ) {
    this.scene.background = new THREE.Color(0x090b12);
    this.camera = new THREE.PerspectiveCamera(68, 1, 0.05, 50);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.scene.add(this.worldRoot);

    this.yaw = initialState.player.yaw;
    this.pitch = initialState.player.pitch;
    this.camera.position.set(...initialState.player.position);
    this.buildApartment();
    this.resize();
    window.addEventListener("resize", this.resize);
  }

  getTarget(targetId: string): WorldTarget | null {
    const object = this.entities.get(targetId);
    if (!object) return null;
    return { setVisible: (visible: boolean) => { object.visible = visible; } };
  }

  syncFromState(state: OmegaGameState): void {
    this.camera.position.set(...state.player.position);
    this.yaw = state.player.yaw;
    this.pitch = state.player.pitch;
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
    this.renderer.dispose();
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
    this.update(dt);
    this.renderer.render(this.scene, this.camera);
    this.frameHandle = requestAnimationFrame(this.frame);
  };

  private update(dt: number): void {
    const look = this.input.consumeLookDelta();
    this.yaw -= look.dx * 0.003;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.dy * 0.0025, -1.2, 1.2);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");

    const speed = 2.15;
    const forwardX = -Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);
    this.camera.position.x += (rightX * this.input.move.x - forwardX * this.input.move.y) * speed * dt;
    this.camera.position.z += (rightZ * this.input.move.x - forwardZ * this.input.move.y) * speed * dt;
    this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -3.1, 3.1);
    this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -4.2, 4.2);
    this.camera.position.y = 1.65;
  }

  private buildApartment(): void {
    const ambient = new THREE.AmbientLight(0x8899bb, 1.2);
    const warm = new THREE.PointLight(0xffb36b, 18, 8, 2);
    warm.position.set(-1.8, 2.1, -1.4);
    this.scene.add(ambient, warm);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 9), new THREE.MeshStandardMaterial({ color: 0x252129, roughness: 0.95 }));
    floor.rotation.x = -Math.PI / 2;
    this.worldRoot.add(floor);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3440, roughness: 1 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(7, 3.4, 0.12), wallMat);
    backWall.position.set(0, 1.7, -4.45);
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 9), wallMat);
    leftWall.position.set(-3.45, 1.7, 0);
    const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.4, 9), wallMat);
    rightWall.position.set(3.45, 1.7, 0);
    this.worldRoot.add(backWall, leftWall, rightWall);

    const desk = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.12, 0.75), new THREE.MeshStandardMaterial({ color: 0x4c342d }));
    desk.position.set(1.55, 0.78, -2.9);
    this.worldRoot.add(desk);

    const monitor = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.62, 0.08), new THREE.MeshStandardMaterial({ color: 0x151822, emissive: 0x10253a, emissiveIntensity: 0.8 }));
    monitor.position.set(1.55, 1.24, -3.18);
    this.worldRoot.add(monitor);
    this.entities.set("apartment.computer", monitor);

    const frameGroup = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.56, 0.055), new THREE.MeshStandardMaterial({ color: 0x20171a }));
    const picture = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), new THREE.MeshBasicMaterial({ color: 0xd8a9b5 }));
    picture.position.z = 0.031;
    frameGroup.add(frame, picture);
    frameGroup.position.set(-1.4, 1.55, -4.34);
    this.worldRoot.add(frameGroup);
    this.entities.set("apartment.photo_frame", frameGroup);

    const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2), new THREE.MeshStandardMaterial({ color: 0x6a4e64, roughness: 1 }));
    rug.rotation.x = -Math.PI / 2;
    rug.position.set(-0.6, 0.012, 0.2);
    this.worldRoot.add(rug);
  }
}
