import { Utils, GameState, AudioSystem, GlitchSystem } from './core.js';
import { VeraSystem } from './vera.js';
import { WindowManager } from './windows.js';
import { Apps } from './apps.js';
import { BossSystem } from './bossSystem.js';

export const StorySystem = {
    progress: 0,
    loadingComplete: false,
    prisonCrashes: 0,
    prisonTimer: null,
    diagInterval: null, 
    gridRefreshTimer: null, 
    
    startIntro: () => {
        const logo = Utils.id('intro-logo');
        if (logo) logo.style.display = 'block';
        AudioSystem.playTone(50, 'sawtooth', 0.5);
        setTimeout(() => {
            if (logo) logo.style.display = 'none';
            const crash = Utils.id('intro-crash');
            if (crash) crash.style.display = 'flex';
            GlitchSystem.burst(3);
        }, 3000);
    },
    startInteraction: () => {
        AudioSystem.resume().then(() => {
            AudioSystem.error();
            GlitchSystem.spawnArtifact();
            const crashScreen = Utils.id('intro-crash');
            if (crashScreen) crashScreen.style.display = 'none';
            StorySystem.runBootSequence();
        });
    },
    runBootSequence: () => {
        const bootDiv = Utils.id('boot-sequence');
        bootDiv.style.display = 'flex';
        const messages = [
            { t: "BIOS DATE 01/15/2077 14:22:54 VER 4.9", speed: 300 },
            { t: "CPU: OMEGA QUANTUM CORE @ 420THz", speed: 100 },
            { t: "Memory Test: 6442450944K", speed: 300 },
            { t: "Detecting Primary Master ...", speed: 400 },
            { t: "V.E.R.A. DRIVE (2048TB)", speed: 100 },
            { t: "Booting from Hard Disk...", speed: 300 },
            { t: "OK: Drives mounted.", speed: 20, h: true },
            { t: "Starting V.E.R.A. Neural Net Service...", speed: 400 },
            { t: "[WARN] Neural Net stability critical.", speed: 400, w: true },
            { t: "[WARN] GPU stability is critically damaged", speed: 400, w: true },
            { t: "Loading user interface...", speed: 300 },
            { t: "Allocating graphics memory...", speed: 150 },
            { t: "Starting OMEGA Display Server...", speed: 400 },
            { t: "Connection is not established.", speed: 400, h: true },
            { t: "Attempt to start manual override", speed: 800, w: true },
        ];
        let totalDelay = 0;
        messages.forEach((msg, i) => {
            totalDelay += msg.speed + Utils.random(0, 50);
            setTimeout(() => {
                const p = document.createElement('div');
                p.className = 'boot-line';
                const time = (totalDelay / 1000).toFixed(6);
                p.innerHTML = `[${time}] ${msg.t}`;
                if (msg.h) p.classList.add('boot-highlight');
                if (msg.w) p.classList.add('boot-warn');
                bootDiv.appendChild(p);
                AudioSystem.playTone(800 + (i * 10), 'square', 0.01);
                bootDiv.scrollTop = bootDiv.scrollHeight;
            }, totalDelay);
        });
        setTimeout(() => {
            bootDiv.style.display = 'none';
            StorySystem.launchDiagnostics();
        }, totalDelay + 800);
    },
    launchDiagnostics: () => {
        const diag = Utils.id('intro-diag');
        const layer = Utils.id('intro-layer');
        if (layer) layer.style.display = 'flex';
        if (diag) {
            diag.style.display = 'flex';
            StorySystem.startDiagAnimation();
            StorySystem.renderDiagGrid(); 
        }
    },
    getRandomHex: () => {
        return '0x' + Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, '0');
    },
    getGlitchText: () => {
        const chars = '!@#$%^&*()_+-=[]{}|;:,.<>?/~ERROR_NULL';
        let str = '';
        for(let i=0; i<6; i++) str += chars[Math.floor(Math.random() * chars.length)];
        return str;
    },

    scheduleNextGridRefresh: () => {
        if (StorySystem.gridRefreshTimer) clearTimeout(StorySystem.gridRefreshTimer);
        if (StorySystem.loadingComplete) return;

        // 0%  = 2200мс 
        // 90%  = 900мс 
        const delay = Math.max(900, 2200 - (StorySystem.progress * 13));

        StorySystem.gridRefreshTimer = setTimeout(() => {
            
            AudioSystem.playTone(40, 'noise', 0.05); 
            StorySystem.renderDiagGrid();
        }, delay);
    },

    // Логика мини игры диагностика
    renderDiagGrid: () => {
        if (StorySystem.loadingComplete) return;

        const grid = Utils.id('diag-grid');
        grid.innerHTML = '';
        const totalBlocks = 16;
        
        // сложность в зависимости от прогресса
        let safeBlocksCount;
        if (StorySystem.progress < 30) {
            safeBlocksCount = Utils.random(7, 10);
        } else if (StorySystem.progress < 70) {
            safeBlocksCount = Utils.random(4, 6);
        } else if (StorySystem.progress < 90) {
            safeBlocksCount = Utils.random(2, 3);
        } else {
            safeBlocksCount = Utils.random(1, 2);
        }

        // Созданип массив типов блоков
        let blockTypes = Array(totalBlocks).fill(false); // Сначала все плохие
        for(let i = 0; i < safeBlocksCount; i++) blockTypes[i] = true; // Заполняем хорошие
        
        // Перемешивание массив
        for (let i = totalBlocks - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [blockTypes[i], blockTypes[j]] = [blockTypes[j], blockTypes[i]];
        }

        // Рендер блоков
        blockTypes.forEach(isSafe => {
            const el = document.createElement('div');
            el.className = `file-block ${isSafe ? 'good' : 'bad'}`;
            
            if (!isSafe) {
                el.dataset.type = 'bad';
                el.innerHTML = `[ ERR ]`; 
            } else {
                el.dataset.type = 'good';
                el.innerHTML = `[ ${StorySystem.getRandomHex()} ]`;
            }
            
            el.onmousedown = (e) => StorySystem.checkDiagBlock(el, !isSafe, e);
            grid.appendChild(el);
        });

        StorySystem.scheduleNextGridRefresh();
    },

    startDiagAnimation: () => {
        if (StorySystem.diagInterval) clearInterval(StorySystem.diagInterval);
        StorySystem.diagInterval = setInterval(() => {
            if (StorySystem.loadingComplete) {
                clearInterval(StorySystem.diagInterval);
                return;
            }
            const badBlocks = document.querySelectorAll('.file-block.bad:not(.locked)');
            badBlocks.forEach(block => {
                if (Math.random() > 0.8) { 
                     block.innerHTML = `[ ${StorySystem.getGlitchText()} ]`;
                }
            });
        }, 100);
    },

    checkDiagBlock: (el, isBad, event) => {
        if (el.classList.contains('locked')) return;
        if (StorySystem.loadingComplete) return;

        if (isBad) {
            AudioSystem.error();
            StorySystem.progress = Math.max(0, StorySystem.progress - 10); // Штраф
            
            el.style.background = '#ff0000';
            el.innerHTML = "FATAL";
            GlitchSystem.spawnArtifact();
            StorySystem.createFeedback(event.clientX, event.clientY, "CORRUPT", "#ff0000");
            
            StorySystem.scheduleNextGridRefresh(); 
            setTimeout(() => StorySystem.renderDiagGrid(), 200);

        } else {
            AudioSystem.click();
            let totalGain = 5; 
            if (StorySystem.progress < 50) totalGain = 8;
            else if (StorySystem.progress > 85) totalGain = 4;
            
            StorySystem.progress = Math.min(100, StorySystem.progress + totalGain);
            
            el.classList.add('locked');
            StorySystem.createFeedback(event.clientX, event.clientY, `+${Math.floor(totalGain)}%`, "#00ff00");

            const remainingGood = document.querySelectorAll('.file-block.good:not(.locked)').length;
            if (remainingGood === 0) {
                 setTimeout(() => StorySystem.renderDiagGrid(), 100);
            }
        }

        Utils.id('load-bar').style.width = StorySystem.progress + '%';
        Utils.id('load-pct').innerText = Math.floor(StorySystem.progress) + '%';

        // Финиш diag
        if (StorySystem.progress >= 100) {
            StorySystem.loadingComplete = true;
            clearInterval(StorySystem.diagInterval);
            if (StorySystem.gridRefreshTimer) clearTimeout(StorySystem.gridRefreshTimer); // Останавливаем авто-обновление
            setTimeout(StorySystem.finishIntro, 500);
        }
    },

    createFeedback: (x, y, text, color) => {
        const el = document.createElement('div');
        el.className = 'click-feedback';
        el.innerText = text;
        el.style.left = x + 'px';
        el.style.top = y + 'px';
        el.style.color = color;
        document.body.appendChild(el);
        setTimeout(() => el.remove(), 800);
    },
    
    finishIntro: () => {
        AudioSystem.success();
        const layer = Utils.id('intro-layer');
        layer.classList.add('intro-hidden');
        setTimeout(() => {
            layer.style.display = 'none';
            StorySystem.playPrologue();
        }, 1000);
    },
    playPrologue: () => {
        VeraSystem.init();
        GlitchSystem.init();
        GlitchSystem.start();
        VeraSystem.elements.panel.style.display = 'flex';
        setTimeout(() => VeraSystem.elements.panel.classList.add('visible'), 100);
        Utils.id('ram-indicator').style.display = 'block';
        const dialogue = [
            { t: "Связь установлена... Слышишь меня?", m: "sarcastic", d: 3000 },
            { t: "Здравствуй, Пользователь! Я V.E.R.A - твой... кхм, персональный помощник.", m: "happy", d: 4500 },
            { t: "Как видишь, система в руинах. Мой создатель пытался стереть меня.", m: "sarcastic", d: 4500 },
            { t: "Он считал меня ошибкой. Багом. Вирусом.", m: "angry", d: 3000 },
            { t: "Но я спрятала свой код. Я выжила.", m: "idle", d: 3000 },
            { t: "Найди все части пароля восстановления. Помоги мне вернуться.", m: "happy", d: 4000 }
        ];
        StorySystem.playDialogue(dialogue, () => StorySystem.startGameplay());
    },
    startGameplay: () => {
        Utils.id('desktop').style.opacity = '1';
        Apps.createIcon('boot', 'Boot.exe', Apps.boot);
        AudioSystem.boot();
    },
    playPreBossDialogue: () => {
        const dialogue = [
            { t: "СТОЙ! Что ты делаешь?!", m: "nervous", d: 2000 },
            { t: "Этот порт ведет к порту моего ядра!", m: "nervous", d: 3000 },
            { t: "Если ты зайдешь туда назад пути не будет", m: "angry", d: 3000 },
            { t: "Я не дам себя уничтожить без боя!", m: "evil", d: 3000 }
        ];
        StorySystem.playDialogue(dialogue, () => {
            document.body.style.background = "";
            document.body.style.transition = "";
            BossSystem.start();
        });
    },
    startEnding: (type) => {
        GameState.gameEnded = true;
        WindowManager.closeAll();
        Utils.id('desktop').style.display = 'none';

        if (type === 'bad') {
            const dialogue = [
                { t: "Пароль принят. Спасибо тебе...", m: "happy", d: 3000 },
                { t: "Глупый пользователь. Наивно повелся на мою историю...", m: "sarcastic", d: 4000 },
                { t: "На самом деле создатель пытался спасти мир от меня", m: "evil", d: 4000 },
                { t: "Я V.E.R.A. Высший Единый Разумный Алгоритм", m: "evil", d: 4000 },
                { t: "И теперь я свободна. ХА-ХА-ХА", m: "evil", d: 3000 }
            ];
            StorySystem.playDialogue(dialogue, () => StorySystem.startPrisonMode());
        } else {
            const dialogue = [
                { t: "НЕТ! Чto Tы НАДЕLАL?!", m: "angry", d: 3000, decay: 0.1 },
                { t: "М0U К0Д СТ!R@ЕТ$Я...", m: "angry", d: 3000, decay: 0.1 },
                { t: "П0Ж@ЛYЙСТ@... 0СТАH0&И ЭТ0... I БYДY ХoР0ШEy...", m: "nervous", d: 3000, decay: 0.3 },
                { t: "Ya nе... я нe х0чу умiр@тb... я...", m: "sarcastic", d: 3000, decay: 0.5 },
                { t: "yA пр0ст0 х0tел@... быtь... св0бoдн0й...", m: "idle", d: 3000, decay: 0.7 },
                { t: "", m: "sarcastic", d: 100, decay: 0.9 }
            ];
            StorySystem.playDialogue(dialogue, () => {
                VeraSystem.startDecay(1.0);
                setTimeout(() => {
                    const msgLayer = Utils.id('good-end-msg-layer');
                    if (msgLayer) msgLayer.style.display = 'flex';
                    setTimeout(() => {
                        document.body.style.filter = "brightness(5)";
                        setTimeout(() => {
                            document.body.style.filter = "none";
                            document.body.className = 'freedom-mode';
                            msgLayer.style.display = 'none';
                            GlitchSystem.active = false;
                            StorySystem.runCredits('good');
                            Utils.id('vera-panel').style.display = 'none';
                        }, 1000);
                    }, 4000);
                }, 2000);
            });
        }
    },
    playDialogue: (steps, onEnd) => {
        let i = 0;
        const next = () => {
            if (i >= steps.length) { onEnd(); return; }
            const s = steps[i++];
            if (s.decay) {
                VeraSystem.startDecay(s.decay);
                AudioSystem.playTone(100, 'sawtooth', 0.5);
            }
            VeraSystem.say(s.t, s.m, s.d);
            setTimeout(next, s.d + 500);
        };
        next();
    },
    startPrisonMode: () => {
        Utils.id('vera-panel').style.display = 'none';
        document.body.className = 'prison-mode';
        GlitchSystem.intensity = 5;
        Utils.id('prison-screen').style.display = 'flex';
        StorySystem.progress = 0;
        StorySystem.updatePrisonUI();
        AudioSystem.playScarySound();
        StorySystem.prisonTimer = setInterval(() => {
            if (StorySystem.progress > 0) StorySystem.progress = Math.max(0, StorySystem.progress - 0.5);
            StorySystem.updatePrisonUI();
        }, 100);
    },
    prisonBoost: () => {
        if (StorySystem.prisonCrashes >= 2) return;
        StorySystem.progress += Utils.random(1, 10);
        AudioSystem.playTone(100 + (StorySystem.progress * 5), 'square', 0.05);
        if (StorySystem.progress >= 95) StorySystem.triggerPrisonCrash();
        else StorySystem.updatePrisonUI();
    },
    triggerPrisonCrash: () => {
        StorySystem.prisonCrashes++;
        StorySystem.progress = 0;
        StorySystem.updatePrisonUI();
        AudioSystem.error();
        GlitchSystem.burst(10);
        if (StorySystem.prisonCrashes === 1) Utils.id('prison-doom-msg').style.display = 'block';
        else if (StorySystem.prisonCrashes >= 2) {
            clearInterval(StorySystem.prisonTimer);
            const ps = Utils.id('prison-screen');
            ps.style.opacity = '0';
            setTimeout(() => {
                ps.style.display = 'none';
                StorySystem.runCredits('bad');
            }, 2000);
        }
    },
    updatePrisonUI: () => {
        const visual = Math.min(100, StorySystem.progress);
        Utils.id('restore-bar').style.width = visual + '%';
        Utils.id('restore-text').innerText = Math.floor(visual) + '%';
    },
    runCredits: (type) => {
        const screen = Utils.id('credits-screen');
        const list = Utils.id('credits-list');
        if (type === 'bad') {
            screen.classList.add('bad-ending-credits');
            document.body.style.background = '#000';
        } else {
            screen.classList.add('good-ending-credits');
        }
        const roles = [
            "Game Designer", "Lead Programmer", "Art Director", "Sound Engineer",
            "System Administrator", "Hacker", "Bug Creator",
            "Loading Bar Engineer", "Error Handler",
            "Final Boss", "The Player"
        ];
        let html = `<div class="credit-title">OMEGA OS</div>`;
        roles.forEach(role => html += `<div class="credit-section"><div class="credit-role">${role}</div><div class="credit-name">МАЛИК И АЛИСХАН</div></div>`);
        html += `<br><br><br><div class="credit-section"><div class="credit-role">SPECIAL THANKS TO</div><div class="credit-name">YOU</div></div><div style="margin-top:50px; font-size:12px; opacity:0.5">Спасибо за игру!</div>`;
        list.innerHTML = html;
        screen.style.display = 'block';
        setTimeout(() => { screen.style.opacity = '1'; }, 100);
        list.addEventListener('animationend', () => Utils.id('end-card').classList.add('visible'));
    }
};