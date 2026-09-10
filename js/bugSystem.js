import { Utils, GameState, AudioSystem, GlitchSystem } from './core.js';
import { WindowManager } from './windows.js';
import { VeraSystem } from './vera.js';

export const BugSystem = {
    stage: 0,
    clicks: 0,
    active: false,
    sliders: [0, 0, 0],
    sliderDirs: [1, 1, 1],
    sliderSpeeds: [2, 3, 4],
    sliderStopped: [false, false, false],
    sliderInterval: null,
    memorySequence: [],
    playerSequence: [],

    init: () => {
        const bug = Utils.id('bug-entity');
        bug.style.display = 'flex';
        bug.style.left = '50%';
        bug.style.top = '50%';
        BugSystem.drift();
    },

    drift: () => {
        if (BugSystem.stage >= 3) return;
        const bug = Utils.id('bug-entity');
        const x = Utils.random(10, 80);
        const y = Utils.random(10, 80);
        bug.style.transition = 'all 3s ease-in-out';
        bug.style.left = x + '%';
        bug.style.top = y + '%';
        setTimeout(BugSystem.drift, 3000);
    },

    handleClick: () => {
        if (BugSystem.stage === 3) return;
        if (BugSystem.active && !Utils.id('win-bug-game')) BugSystem.active = false;

        if (!BugSystem.active) {
            BugSystem.active = true;
            BugSystem.startMiniGame(BugSystem.stage);
        } else {
            if (BugSystem.stage === 0) BugSystem.gameLogic0();
        }
    },

    startMiniGame: (stage) => {
        if (stage === 0) {
            WindowManager.create('bug-game', 'LOCK 1/3: POLYMORPHIC SHIELD', `
                <div style="text-align:center; height: 250px; position: relative; overflow: hidden; background: #050505;">
                    <p style="color:#888; font-size:10px;">HIT THE TARGET BEFORE IT MOVES</p>
                    <button id="chase-btn" onclick="window.BugSystem.gameLogic0()" style="position:absolute; width: 60px; height: 60px; background: red; color: white; border: 1px solid white; border-radius:50%; font-weight: bold; cursor: crosshair; transition: transform 0.1s;">HIT</button>
                    <p style="position: absolute; bottom: 5px; width: 100%;">HITS LEFT: <span id="bug-counter">8</span></p>
                </div>
            `, 350);
            BugSystem.clicks = 8;
            BugSystem.moveChaseButton();
        }
        else if (stage === 1) {
            BugSystem.sliderStopped = [false, false, false];
            WindowManager.create('bug-game', 'LOCK 2/3: FREQUENCY ALIGNMENT', `
                <div style="text-align:center; padding:10px;">
                    <p style="font-size:12px; margin-bottom:10px;">STOP ALL BARS IN GREEN ZONES</p>
                    ${[0, 1, 2].map(i => `
                        <div style="background:#222; height:30px; margin:10px 0; position:relative; cursor:pointer; border:1px solid #444;" onclick="window.BugSystem.stopSlider(${i})">
                            <div style="position:absolute; left:40%; width:20%; height:100%; background:rgba(0,255,0,0.3); border-left:1px solid lime; border-right:1px solid lime;"></div>
                            <div id="slider-${i}" style="position:absolute; left:0; width:5px; height:100%; background:red; box-shadow:0 0 5px red;"></div>
                        </div>
                    `).join('')}
                    <div id="slider-msg" style="color:yellow; height:20px;"></div>
                </div>
            `, 300);
            BugSystem.sliderInterval = setInterval(BugSystem.updateSliders, 20);
        }
        else if (stage === 2) {
            WindowManager.create('bug-game', 'LOCK 3/3: MEMORY BUFFER', `
                <div style="text-align:center; padding:10px;">
                    <p>CLEAR BAD SECTORS (REPEAT PATTERN)</p>
                    <div id="mem-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; width:150px; margin:10px auto;">
                        ${Array(9).fill(0).map((_, i) => `<div id="cell-${i}" onclick="window.BugSystem.clickGrid(${i})" style="width:45px; height:45px; background:#222; border:1px solid #0f0; cursor:pointer;"></div>`).join('')}
                    </div>
                    <div id="mem-msg">WATCH...</div>
                </div>
            `, 300);
            BugSystem.startMemoryGame();
        }
    },

    moveChaseButton: () => {
        const btn = Utils.id('chase-btn');
        if (!btn) return;
        const x = Utils.random(10, 280);
        const y = Utils.random(30, 180);
        const scale = Utils.randomFloat(0.5, 1.2);
        btn.style.left = x + 'px';
        btn.style.top = y + 'px';
        btn.style.transform = `scale(${scale})`;
    },

    gameLogic0: () => {
        if (!Utils.id('win-bug-game')) { BugSystem.active = false; return; }
        BugSystem.clicks--;
        AudioSystem.click();
        const counter = Utils.id('bug-counter');
        if (counter) counter.innerText = BugSystem.clicks;
        if (BugSystem.clicks <= 0) {
            AudioSystem.success();
            BugSystem.advanceStage();
        } else {
            BugSystem.moveChaseButton();
        }
    },

    updateSliders: () => {
        if (!Utils.id('win-bug-game')) { clearInterval(BugSystem.sliderInterval); BugSystem.active = false; return; }
        for (let i = 0; i < 3; i++) {
            if (BugSystem.sliderStopped[i]) continue;
            BugSystem.sliders[i] += BugSystem.sliderDirs[i] * BugSystem.sliderSpeeds[i];
            if (BugSystem.sliders[i] > 95 || BugSystem.sliders[i] < 0) BugSystem.sliderDirs[i] *= -1;
            const el = Utils.id(`slider-${i}`);
            if (el) el.style.left = BugSystem.sliders[i] + '%';
        }
    },

    stopSlider: (i) => {
        if (BugSystem.sliderStopped[i]) return;
        BugSystem.sliderStopped[i] = true;
        AudioSystem.click();
        if (BugSystem.sliders[i] >= 38 && BugSystem.sliders[i] <= 62) {
            Utils.id(`slider-${i}`).style.background = "lime";
            if (BugSystem.sliderStopped.every(Boolean)) {
                clearInterval(BugSystem.sliderInterval);
                AudioSystem.success();
                setTimeout(BugSystem.advanceStage, 500);
            }
        } else {
            Utils.id(`slider-${i}`).style.background = "white";
            Utils.id('slider-msg').innerText = "ALIGNMENT FAILED! RESETTING...";
            AudioSystem.error();
            setTimeout(() => {
                BugSystem.sliderStopped = [false, false, false];
                BugSystem.sliders = [0, 0, 0];
                Utils.id('slider-msg').innerText = "";
                [0, 1, 2].forEach(j => Utils.id(`slider-${j}`).style.background = "red");
            }, 1000);
        }
    },

    startMemoryGame: () => {
        BugSystem.memorySequence = [];
        BugSystem.playerSequence = [];
        for (let i = 0; i < 4; i++) BugSystem.memorySequence.push(Utils.random(0, 8));
        let step = 0;
        const playStep = () => {
            if (step >= BugSystem.memorySequence.length) {
                Utils.id('mem-msg').innerText = "REPEAT SEQUENCE";
                return;
            }
            const id = BugSystem.memorySequence[step];
            const cell = Utils.id(`cell-${id}`);
            cell.style.background = "red";
            AudioSystem.playTone(400 + (id * 50), 'sine', 0.1);
            setTimeout(() => {
                cell.style.background = "#222";
                step++;
                setTimeout(playStep, 200);
            }, 400);
        };
        setTimeout(playStep, 1000);
    },

    clickGrid: (i) => {
        if (Utils.id('mem-msg').innerText !== "REPEAT SEQUENCE") return;
        const cell = Utils.id(`cell-${i}`);
        cell.style.background = "#0f0";
        setTimeout(() => cell.style.background = "#222", 100);
        AudioSystem.playTone(400 + (i * 50), 'sine', 0.1);
        BugSystem.playerSequence.push(i);
        const currentIdx = BugSystem.playerSequence.length - 1;
        if (BugSystem.playerSequence[currentIdx] !== BugSystem.memorySequence[currentIdx]) {
            Utils.id('mem-msg').innerText = "ERROR! RETRYING...";
            AudioSystem.error();
            setTimeout(() => {
                WindowManager.create('bug-game', 'LOCK 3/3: MEMORY BUFFER', `
                <div style="text-align:center; padding:10px;">
                    <p>CLEAR BAD SECTORS (REPEAT PATTERN)</p>
                    <div id="mem-grid" style="display:grid; grid-template-columns:repeat(3, 1fr); gap:5px; width:150px; margin:10px auto;">
                        ${Array(9).fill(0).map((_, i) => `<div id="cell-${i}" onclick="window.BugSystem.clickGrid(${i})" style="width:45px; height:45px; background:#222; border:1px solid #0f0; cursor:pointer;"></div>`).join('')}
                    </div>
                    <div id="mem-msg">WATCH...</div>
                </div>
            `, 300);
                BugSystem.startMemoryGame();
            }, 1000);
            return;
        }
        if (BugSystem.playerSequence.length === BugSystem.memorySequence.length) {
            AudioSystem.success();
            BugSystem.advanceStage();
        }
    },

    advanceStage: () => {
        const layerId = `cage-layer-${BugSystem.stage}`;
        const cage = Utils.id(layerId);
        if (cage) cage.style.opacity = '0';
        BugSystem.stage++;
        BugSystem.active = false;
        WindowManager.close('bug-game');
        if (BugSystem.stage === 3) setTimeout(BugSystem.release, 500);
    },

    release: () => {
        GameState.bugReleased = true;
        const bug = Utils.id('bug-entity');
        bug.style.transition = 'all 0.5s';
        bug.style.transform = 'scale(2) rotate(360deg)';
        bug.style.filter = 'brightness(2) drop-shadow(0 0 10px red)';
        VeraSystem.say("О нет... Что ты выпустил?! СИСТЕМА ПОВРЕЖДЕНА!", "nervous", 3000);

        const bugRect = bug.getBoundingClientRect();
        const projectile = document.createElement('div');
        projectile.className = 'infection-projectile';
        projectile.style.left = bugRect.left + 'px';
        projectile.style.top = bugRect.top + 'px';
        document.body.appendChild(projectile);

        const icons = document.querySelectorAll('.icon');
        let targetIcon = icons[icons.length - 1];
        icons.forEach(icon => {
            if (icon.innerText.includes('Optimize')) targetIcon = icon;
        });

        const targetRect = targetIcon.getBoundingClientRect();
        setTimeout(() => {
            projectile.style.left = (targetRect.left + 20) + 'px';
            projectile.style.top = (targetRect.top + 20) + 'px';
            setTimeout(() => {
                projectile.remove();
                bug.style.opacity = '0';
                setTimeout(() => bug.style.display = 'none', 500);
                BugSystem.triggerHackVisuals(targetIcon);
            }, 1000);
        }, 100);
    },

    triggerHackVisuals: (targetIcon) => {
        targetIcon.classList.add('hacked');
        targetIcon.innerHTML = `<div class="icon-img">💀</div><div class="icon-label">ROOT_SHELL</div>`;
        AudioSystem.error();
        AudioSystem.playScarySound();
        const overlay = Utils.id('hacked-overlay');
        overlay.style.animation = 'hacked-pop 3s forwards';
        GameState.unlocked.terminal = true;
        if (window.Apps) window.Apps.terminal();
        GlitchSystem.burst(20);
        document.body.classList.add('glitch-mode');
    }
};