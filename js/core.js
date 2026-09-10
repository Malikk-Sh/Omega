// Утилы & общее состояние

export const Utils = {
    id: (id) => document.getElementById(id),
    random: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    randomFloat: (min, max) => Math.random() * (max - min) + min,
    randomItem: (arr) => arr[Math.floor(Math.random() * arr.length)]
};

export const GameState = {
    pixels: 0,
    ram: 1,
    windows: [],
    zIndex: 100,
    hacked: false,
    cleanupActive: false,
    gameEnded: false,
    bugReleased: false,
    unlocked: { shop: false, explorer: false, terminal: false, opt: false, core: false }
};

export const GameData = {
    alerts: [
        "MEMORY LEAK AT 0x00F4", "UNKNOWN PROCESS DETECTED", "V.E.R.A. IS WATCHING",
        "PACKET LOSS 99%", "CHECK YOUR CAM", "NULL POINTER EXCEPTION",
        "CACHE CORRUPTION", "DON'T LOOK BEHIND YOU"
    ],
    fileSystem: {
        'root': [
            { n: 'sys', t: 'd', c: 'sys' },
            { n: 'readme.txt', t: 'f', c: 'При слишком большой нагрузке на RAM система может перейти в состояние экстренной очистки\nПривет. Если ты это читаешь, значит ты умеешь читать\nCode Fragment 1: 3' },
            { n: 'sea17', t: 'd', c: 'sea17', label: 'Море 2017' }
        ],
        'sys': [
            { n: 'trash', t: 'd', c: 'trash' },
            { n: 'core.exe', t: 'app', a: 'Apps.core' }
        ],
        'trash': [{ n: 'recovery.log', t: 'f', c: 'DELETED FILE RESTORED...\nCode Fragment 2: 7' }],
        'sea17': [
            { n: 'DCIM_0024.img', t: 'img', bad: true },
            { n: 'memory_dump.dat', t: 'f', c: 'SYSTEM DUMP 0x84F...\n[CORRUPTED SECTOR]\n...\nCode Fragment 3: 0\n...' }
        ]
    }
};

export const PerformanceMode = {
    active: false,
    set: (isLowPerf) => {
        PerformanceMode.active = isLowPerf;
        const config = Utils.id('config-layer');
        config.style.opacity = '0';
        if (isLowPerf) {
            document.body.classList.add('low-perf');
            GlitchSystem.maxParticles = 5;
        } else {
            document.body.classList.remove('low-perf');
        }
        setTimeout(() => {
            config.style.display = 'none';
            Utils.id('intro-layer').style.display = 'flex';
            const event = new CustomEvent('StartIntroRequested');
            window.dispatchEvent(event);
        }, 500);
    }
};

//  AUDIO SYSTEM
export const AudioSystem = {
    ctx: new (window.AudioContext || window.webkitAudioContext)(),
    resume: () => {
        if (AudioSystem.ctx.state === 'suspended') return AudioSystem.ctx.resume();
        return Promise.resolve();
    },
    playTone: (freq, type, duration) => {
        if (PerformanceMode.active && Math.random() > 0.8) return;
        AudioSystem.resume();
        const osc = AudioSystem.ctx.createOscillator();
        const gain = AudioSystem.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, AudioSystem.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, AudioSystem.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, AudioSystem.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(AudioSystem.ctx.destination);
        osc.start();
        osc.stop(AudioSystem.ctx.currentTime + duration);
    },
    click: () => AudioSystem.playTone(800, 'square', 0.05),
    error: () => { AudioSystem.playTone(150, 'sawtooth', 0.2); AudioSystem.playTone(100, 'sawtooth', 0.2); },
    success: () => { AudioSystem.playTone(600, 'sine', 0.1); setTimeout(() => AudioSystem.playTone(1200, 'sine', 0.2), 100); },
    boot: () => { AudioSystem.playTone(100, 'square', 0.1); setTimeout(() => AudioSystem.playTone(300, 'square', 0.2), 100); },
    playScarySound: () => {
        const osc = AudioSystem.ctx.createOscillator();
        const gain = AudioSystem.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(50, AudioSystem.ctx.currentTime);
        gain.gain.setValueAtTime(0.2, AudioSystem.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, AudioSystem.ctx.currentTime + 2.0);
        osc.connect(gain);
        gain.connect(AudioSystem.ctx.destination);
        osc.start();
        osc.stop(AudioSystem.ctx.currentTime + 2.0);
    }
};

// GLITCH SYSTEM (Визуал)
export const GlitchSystem = {
    container: null,
    active: false,
    intensity: 1,
    maxParticles: 20,
    init: () => { GlitchSystem.container = Utils.id('glitch-container'); },
    start: () => { GlitchSystem.active = true; GlitchSystem.loop(); },
    loop: () => {
        if (!GlitchSystem.active) return;
        const spawnChance = PerformanceMode.active ? 0.01 : 0.05;
        if (Math.random() < (spawnChance * GlitchSystem.intensity)) GlitchSystem.spawnArtifact();
        if (Math.random() < 0.005 && !GameState.gameEnded && !GameState.bugReleased) {
            window.dispatchEvent(new CustomEvent('TriggerRandomAlert'));
        }

        setTimeout(GlitchSystem.loop, PerformanceMode.active ? 200 : 100);
    },
    spawnArtifact: () => {
        if (!GlitchSystem.container) return;
        if (GlitchSystem.container.childElementCount > GlitchSystem.maxParticles) return;
        const type = Math.random();
        const el = document.createElement('div');
        if (type < 0.5) {
            el.className = 'glitch-block';
            el.style.left = Utils.randomFloat(0, 100) + 'vw';
            el.style.top = Utils.randomFloat(0, 100) + 'vh';
            el.style.width = Utils.randomFloat(50, 250) + 'px';
            el.style.height = Utils.randomFloat(10, 60) + 'px';
            el.style.backgroundColor = Math.random() > 0.5 ? '#f0f' : '#0ff';
            GlitchSystem.container.appendChild(el);
            setTimeout(() => el.remove(), Utils.random(50, 250));
        } else if (type < 0.8) {
            el.className = 'glitch-slice';
            el.style.top = Utils.randomFloat(0, 90) + 'vh';
            el.style.height = Utils.randomFloat(5, 25) + 'px';
            el.style.left = Utils.randomFloat(-10, 10) + 'px';
            GlitchSystem.container.appendChild(el);
            setTimeout(() => el.remove(), 100);
        }
    },
    burst: (amount = 5) => {
        const safeAmount = PerformanceMode.active ? Math.min(2, amount) : amount;
        for (let i = 0; i < safeAmount; i++) setTimeout(GlitchSystem.spawnArtifact, i * 50);
    }
};