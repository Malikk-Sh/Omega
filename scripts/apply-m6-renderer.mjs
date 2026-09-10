import { readFile, writeFile } from 'node:fs/promises';

const path = 'src/render/WorldRenderer.ts';
let text = await readFile(path, 'utf8');
const replaceOnce = (from, to, label) => {
  if (!text.includes(from)) throw new Error(`Renderer anchor missing: ${label}`);
  text = text.replace(from, to);
};

replaceOnce(
  '  HOME_SCENE,\n  SCENE_INTERACTION_IDS,',
  '  HOME_SCENE,\n  SEA_2017_SCENE,\n  SCENE_INTERACTION_IDS,',
  'SEA import'
);
replaceOnce(
  '  private readonly thresholdMaterials: any[] = [];\n  private sceneBounds:',
  '  private readonly thresholdMaterials: any[] = [];\n  private readonly seaWaveBands: any[] = [];\n  private sceneBounds:',
  'sea wave property'
);
replaceOnce(
  '    this.thresholdMaterials.length = 0;\n    this.anomalyShadow = null;',
  '    this.thresholdMaterials.length = 0;\n    this.seaWaveBands.length = 0;\n    this.anomalyShadow = null;',
  'sea wave cleanup'
);
replaceOnce(
  '    this.updateThreshold(time);\n  }',
  '    this.updateThreshold(time);\n    this.updateSea2017(time);\n  }',
  'sea update call'
);
replaceOnce(
  '  private registerInteractable(id: string, label: string, object: any): void {',
  `  private updateSea2017(time: number): void {\n    if (!this.seaWaveBands.length) return;\n    const phase = (time * 0.00022) % 1;\n    this.seaWaveBands.forEach((band, index) => {\n      const baseZ = Number(band.userData.baseZ ?? -4);\n      band.position.z = baseZ + ((phase + index * 0.17) % 1) * 0.62;\n      const material = band.material;\n      if (material) material.opacity = 0.2 + (Math.sin(time * 0.0025 + index) + 1) * 0.09;\n    });\n  }\n\n  private registerInteractable(id: string, label: string, object: any): void {`,
  'sea update method'
);
replaceOnce(
  `    } else if (sceneId === BACKUP_41_SCENE) {\n      this.scene.background = new THREE.Color(0x05070b);\n      this.sceneBounds = { minX: -3.2, maxX: 3.2, minZ: -3.6, maxZ: 3.6 };\n      this.buildBackup41();\n    } else {`,
  `    } else if (sceneId === BACKUP_41_SCENE) {\n      this.scene.background = new THREE.Color(0x05070b);\n      this.sceneBounds = { minX: -3.2, maxX: 3.2, minZ: -3.6, maxZ: 3.6 };\n      this.buildBackup41();\n    } else if (sceneId === SEA_2017_SCENE) {\n      this.scene.background = new THREE.Color(0xb88970);\n      this.sceneBounds = { minX: -5.4, maxX: 5.4, minZ: -6.2, maxZ: 5.4 };\n      this.buildSea2017();\n    } else {`,
  'sea mount branch'
);

const method = `  private buildSea2017(): void {\n    const ambient = new THREE.AmbientLight(0xe5c4a4, 1.55);\n    const lateSun = new THREE.DirectionalLight(0xffc58a, 2.25);\n    lateSun.position.set(-4.5, 5.5, 2.8);\n    const seaSpill = new THREE.DirectionalLight(0x88a7b8, 0.8);\n    seaSpill.position.set(4, 2.5, -5);\n    this.worldRoot.add(ambient, lateSun, seaSpill);\n\n    const sand = new THREE.Mesh(new THREE.PlaneGeometry(12, 13), new THREE.MeshStandardMaterial({ color: 0xc39b73, roughness: 1 }));\n    sand.rotation.x = -Math.PI / 2;\n    sand.position.z = 0.2;\n    this.worldRoot.add(sand);\n\n    const sea = new THREE.Mesh(new THREE.PlaneGeometry(12, 7.4), new THREE.MeshStandardMaterial({ color: 0x607f89, roughness: 0.7, metalness: 0.04 }));\n    sea.rotation.x = -Math.PI / 2;\n    sea.position.set(0, 0.035, -6.25);\n    this.worldRoot.add(sea);\n\n    const waveGroup = new THREE.Group();\n    for (let index = 0; index < 6; index += 1) {\n      const band = new THREE.Mesh(\n        new THREE.PlaneGeometry(8.8 - index * 0.35, 0.08),\n        new THREE.MeshBasicMaterial({ color: 0xe4ddd0, transparent: true, opacity: 0.25, side: THREE.DoubleSide })\n      );\n      band.rotation.x = -Math.PI / 2;\n      band.position.set((index % 2 ? 0.16 : -0.12), 0.055, -3.35 - index * 0.42);\n      band.userData.baseZ = band.position.z;\n      waveGroup.add(band);\n      this.seaWaveBands.push(band);\n    }\n    this.worldRoot.add(waveGroup);\n    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.loopingWave, 'MEMORY INDEX // looping wave crest', waveGroup);\n\n    const marker = new THREE.Group();\n    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.05, 0.1), new THREE.MeshStandardMaterial({ color: 0x4e4036, roughness: 0.95 }));\n    post.position.y = 0.52;\n    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.22, 0.05), new THREE.MeshBasicMaterial({ color: 0xbec7bf }));\n    tag.position.set(0, 0.76, 0.07);\n    marker.add(post, tag);\n    marker.position.set(-3.2, 0, -2.85);\n    this.worldRoot.add(marker);\n    this.entities.set('sea2017.tide.l3', marker);\n\n    const wrongShadow = new THREE.Group();\n    const driftwood = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.16, 0.18), new THREE.MeshStandardMaterial({ color: 0x6e503a, roughness: 1 }));\n    driftwood.position.y = 0.12;\n    driftwood.rotation.y = -0.32;\n    const shadow = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 0.38), new THREE.MeshBasicMaterial({ color: 0x342b30, transparent: true, opacity: 0.48, side: THREE.DoubleSide }));\n    shadow.rotation.x = -Math.PI / 2;\n    shadow.rotation.z = 0.82;\n    shadow.position.set(0.72, 0.015, 0.52);\n    wrongShadow.add(driftwood, shadow);\n    wrongShadow.position.set(2.75, 0, -0.65);\n    this.worldRoot.add(wrongShadow);\n    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.wrongShadow, 'MEMORY ERROR // shadow contradicts sun', wrongShadow);\n\n    const figures = new THREE.Group();\n    for (const x of [-1.05, 0.15, 1.2]) {\n      const body = new THREE.Mesh(new THREE.BoxGeometry(0.34, 1.2, 0.22), new THREE.MeshStandardMaterial({ color: 0x565253, roughness: 1 }));\n      body.position.set(x, 0.62, 0);\n      const head = new THREE.Mesh(new THREE.SphereGeometry(0.19, 8, 6), new THREE.MeshStandardMaterial({ color: 0xb89c86, roughness: 1 }));\n      head.position.set(x, 1.38, 0);\n      figures.add(body, head);\n    }\n    figures.position.set(-0.8, 0, -5.35);\n    figures.scale.setScalar(0.72);\n    this.worldRoot.add(figures);\n    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.facelessFigures, 'MEMORY ERROR // faceless distant figures', figures);\n\n    const footprints = new THREE.Group();\n    for (let index = 0; index < 7; index += 1) {\n      if (index === 4) continue;\n      const print = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.34), new THREE.MeshBasicMaterial({ color: 0x806852, transparent: true, opacity: 0.52, side: THREE.DoubleSide }));\n      print.rotation.x = -Math.PI / 2;\n      print.rotation.z = index % 2 ? 0.12 : -0.08;\n      print.position.set((index % 2 ? 0.2 : -0.18), 0.018, index * -0.46);\n      footprints.add(print);\n    }\n    footprints.position.set(1.05, 0, 2.05);\n    this.worldRoot.add(footprints);\n    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.footprints, 'MEMORY ERROR // incomplete footprints', footprints);\n\n    const indexConsole = new THREE.Group();\n    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.82, 0.62), new THREE.MeshStandardMaterial({ color: 0x5d5650, roughness: 0.88 }));\n    pedestal.position.y = 0.41;\n    const glass = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.55, 0.07), new THREE.MeshStandardMaterial({ color: 0x263a42, emissive: 0x426e78, emissiveIntensity: 0.85, roughness: 0.45 }));\n    glass.position.set(0, 1.0, -0.24);\n    indexConsole.add(pedestal, glass);\n    indexConsole.position.set(-2.6, 0, 1.25);\n    this.worldRoot.add(indexConsole);\n    this.entities.set('sea2017.index.console', indexConsole);\n    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.indexConsole, 'Открыть SEA_2017 cross-media index', indexConsole);\n\n    const vera = new THREE.Group();\n    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.88, 0.33), new THREE.MeshStandardMaterial({ color: 0x8c6672, roughness: 0.86 }));\n    body.position.y = 0.72;\n    const head = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.39), new THREE.MeshStandardMaterial({ color: 0xddbfb1, roughness: 0.88 }));\n    head.position.y = 1.38;\n    const hair = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.19, 0.42), new THREE.MeshStandardMaterial({ color: 0x40363a, roughness: 0.94 }));\n    hair.position.set(0, 1.59, -0.01);\n    vera.add(body, head, hair);\n    vera.position.set(2.0, 0, 2.15);\n    vera.rotation.y = -0.5;\n    this.worldRoot.add(vera);\n    this.entities.set('sea2017.vera', vera);\n    this.registerInteractable(SCENE_INTERACTION_IDS.sea2017.vera, 'Поговорить с V.E.R.A. у моря', vera);\n\n    const compression = new THREE.Group();\n    for (let index = 0; index < 5; index += 1) {\n      const block = new THREE.Mesh(new THREE.BoxGeometry(0.65 + index * 0.11, 0.06, 0.04), new THREE.MeshBasicMaterial({ color: index % 2 ? 0xd2b19a : 0x788f94, transparent: true, opacity: 0.52 }));\n      block.position.set(0.12 * index, 1.65 + index * 0.13, 0);\n      compression.add(block);\n    }\n    compression.position.set(4.25, 0, -2.5);\n    this.worldRoot.add(compression);\n\n    this.buildReturnPortal('sea2017.return', SCENE_INTERACTION_IDS.sea2017.returnThreshold, [0, 1.16, 5.72], 0xd7b08a);\n  }\n\n`;
replaceOnce(
  '  private buildReturnPortal(entityId: string, interactionId: string, position: [number, number, number], edgeColor: number): void {',
  method + '  private buildReturnPortal(entityId: string, interactionId: string, position: [number, number, number], edgeColor: number): void {',
  'sea builder insertion'
);

await writeFile(path, text);
