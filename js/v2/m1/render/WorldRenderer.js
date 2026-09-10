import * as THREE from "three";

export class WorldRenderer {
  scene = new THREE.Scene();
  worldRoot = new THREE.Group();
  entities = new Map();
  raycaster = new THREE.Raycaster();
  interactables = [];
  callbacks = {};
  focused = null;
  yaw = 0;
  pitch = 0;
  lastTime = performance.now();
  frameHandle = 0;
  running = false;
  controlsEnabled = true;
  anomalyUntil = 0;
  anomalyShadow = null;
  warmLight = null;

  constructor(canvas, input, initialState) {
    this.canvas = canvas;
    this.input = input;
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

  setInteractionCallbacks(callbacks) { this.callbacks = callbacks; }
  setControlsEnabled(enabled) {
    this.controlsEnabled = enabled;
    if (!enabled) this.input.consumeLookDelta();
  }
  interactFocused() {
    if (!this.focused) return false;
    this.callbacks.onInteract?.(this.focused.id);
    return true;
  }
  triggerFirstAnomaly() {
    this.anomalyUntil = performance.now() + 2400;
    if (this.anomalyShadow) this.anomalyShadow.visible = true;
  }
  getTarget(targetId) {
    const object = this.entities.get(targetId);
    if (!object) return null;
    return { setVisible: visible => { object.visible = visible; } };
  }
  syncFromState(state) {
    this.camera.position.set(...state.player.position);
    this.yaw = state.player.yaw;
    this.pitch = state.player.pitch;
  }
  writePlayerState(state) {
    state.player.position = [this.camera.position.x, this.camera.position.y, this.camera.position.z];
    state.player.yaw = this.yaw;
    state.player.pitch = this.pitch;
  }
  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.frameHandle = requestAnimationFrame(this.frame);
  }
  stop() {
    this.running = false;
    cancelAnimationFrame(this.frameHandle);
    window.removeEventListener("resize", this.resize);
    this.renderer.dispose();
  }

  resize = () => {
    const width = this.canvas.clientWidth || window.innerWidth;
    const height = this.canvas.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / Math.max(1, height);
    this.camera.updateProjectionMatrix();
  };

  frame = time => {
    if (!this.running) return;
    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    this.update(dt, time);
    this.renderer.render(this.scene, this.camera);
    this.frameHandle = requestAnimationFrame(this.frame);
  };

  update(dt, time) {
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
      this.camera.position.x = THREE.MathUtils.clamp(this.camera.position.x, -3.0, 3.0);
      this.camera.position.z = THREE.MathUtils.clamp(this.camera.position.z, -4.0, 4.0);
      this.camera.position.y = 1.62;
    }
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
    this.updateInteractionFocus();
    this.updateAnomaly(time);
  }

  updateInteractionFocus() {
    if (!this.controlsEnabled) {
      this.setFocused(null);
      return;
    }
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.camera);
    const hits = this.raycaster.intersectObjects(this.interactables, true);
    let next = null;
    for (const hit of hits) {
      if (hit.distance > 2.35) break;
      let object = hit.object;
      while (object && !object.userData?.interactionId) object = object.parent;
      if (!object?.userData?.interactionId) continue;
      next = { id: object.userData.interactionId, label: object.userData.interactionLabel ?? "Взаимодействовать" };
      break;
    }
    this.setFocused(next);
  }

  setFocused(next) {
    if (this.focused?.id === next?.id) return;
    this.focused = next;
    this.callbacks.onFocus?.(next);
  }

  updateAnomaly(time) {
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

  registerInteractable(id, label, object) {
    object.userData.interactionId = id;
    object.userData.interactionLabel = label;
    this.interactables.push(object);
  }

  box(size, color, position, roughness = 0.9) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), new THREE.MeshStandardMaterial({ color, roughness }));
    mesh.position.set(...position);
    this.worldRoot.add(mesh);
    return mesh;
  }

  buildApartment() {
    const ambient = new THREE.AmbientLight(0x7282a6, 0.9);
    this.warmLight = new THREE.PointLight(0xffc27a, 12, 7, 2);
    this.warmLight.position.set(-1.8, 2.35, -1.2);
    const windowLight = new THREE.DirectionalLight(0x748dff, 1.5);
    windowLight.position.set(-2, 2.5, -4);
    this.scene.add(ambient, this.warmLight, windowLight);

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
    this.registerInteractable("computer", "Открыть OMEGA OS", monitor);

    const mug = this.box([0.22, 0.25, 0.22], 0xd694ac, [2.42, 0.98, -2.84], 0.6);
    this.registerInteractable("mug", "Осмотреть кружку", mug);

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
    this.registerInteractable("photo", "Осмотреть фотографию", frameGroup);

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
    this.registerInteractable("vera", "Поговорить с V.E.R.A.", vera);

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
  }
}
