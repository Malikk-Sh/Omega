import { Utils, GameState, GameData, AudioSystem, GlitchSystem } from './core.js';
import { WindowManager } from './windows.js';
import { VeraSystem } from './vera.js';
import { BugSystem } from './bugSystem.js';
import { BossSystem } from './bossSystem.js';

export const Apps = {
    createIcon: (id, name, action) => {
        const div = document.createElement('div');
        div.className = 'icon';
        const icons = { 'shop': '🛒', 'explorer': '📁', 'terminal': '💻', 'opt': '⚙️' };
        const iconSymbol = icons[id] || '💾';
        div.innerHTML = `<div class="icon-img">${iconSymbol}</div><div class="icon-label">${name}</div>`;
        div.onclick = action;
        Utils.id('desktop').appendChild(div);
    },
    triggerRandomAlert: () => {
        if (GameState.gameEnded) return;
        const msg = Utils.randomItem(GameData.alerts);
        const id = 'alert-' + Date.now() + Utils.random(0, 1000);
        WindowManager.create(id, 'SYSTEM_WARNING',
            `<div style="color:red; font-weight:bold; text-align:center; padding:20px;">⚠️ ${msg}</div>`,
            250
        );
        const win = Utils.id('win-' + id);
        if (win) win.classList.add('alert-win');
        AudioSystem.error();
    },
    boot: () => {
        WindowManager.create('boot', 'RECOVERY_TOOL', `
            <div style="text-align:center; padding:10px;">
                <div style="color:var(--error)">СИСТЕМА КРИТИЧЕСКИ ПОВРЕЖДЕНА</div>
                <p>Необходим сбор данных для восстановления резервной копии.</p>
                <h1 id="px-count" style="font-size:40px; margin:10px 0;">${GameState.pixels}</h1>
                <button style="width:100%; padding:15px; border:none; background:var(--text); color:var(--bg); font-weight:bold; cursor:pointer;" onclick="window.Apps.clickerAction()">СБОР БАЙТОВ</button>
            </div>
        `);
    },
    clickerAction: () => {
        GameState.pixels++;
        AudioSystem.click();
        const el = Utils.id('px-count');
        if (el) {
            el.innerText = GameState.pixels;
            el.style.transform = 'scale(1.2)';
            setTimeout(() => el.style.transform = 'scale(1)', 50);
        }
        if (GameState.pixels === 2) VeraSystem.say("Модули памяти отвечают. Продолжай, нам нужно больше данных.", "happy", 5000);
        if (GameState.pixels === 20 && !GameState.unlocked.shop) {
            GameState.unlocked.shop = true;
            Apps.createIcon('shop', 'Магазин', Apps.shop);
            VeraSystem.say("Я смогла восстановить модуль магазина!", "happy");
        }
    },
    shop: () => {
        const items = [
            { id: 'ram', name: 'RAM Upgrade (Multi-Task)', cost: 40, bought: GameState.ram > 1 },
            { id: 'explorer', name: 'File Explorer.exe', cost: 50, bought: GameState.unlocked.explorer },
            { id: 'opt', name: 'Sys_Optimize (Utility)', cost: 100, bought: GameState.unlocked.opt }
        ];
        let html = items.map(i => `
            <div class="shop-item ${i.bought ? 'bought' : ''}">
                <div><b>${i.name}</b><br><small>${i.cost} PX</small></div>
                <button onclick="window.Apps.buyItem('${i.id}', ${i.cost})">КУПИТЬ</button>
            </div>
        `).join('');
        WindowManager.create('shop', 'МАГАЗИН ВОССТАНОВЛЕНИЯ', `<div id="shop-list">${html}</div>`);
    },
    buyItem: (id, cost) => {
        if (GameState.pixels < cost) {
            VeraSystem.say("Не хватает данных.", "nervous");
            AudioSystem.error();
            return;
        }
        GameState.pixels -= cost;
        AudioSystem.success();
        const pxEl = Utils.id('px-count');
        if (pxEl) pxEl.innerText = GameState.pixels;
        if (id === 'ram') {
            GameState.ram = 100; WindowManager.updateRamUI();
            VeraSystem.say("Память расширена. Теперь можно открывать больше окон.", "sarcastic");
        }
        if (id === 'explorer') {
            GameState.unlocked.explorer = true;
            Apps.createIcon('explorer', 'Файлы', () => Apps.explorer('root'));
            VeraSystem.say("Файловая система доступна.", "sarcastic");
        }
        if (id === 'opt') {
            GameState.unlocked.opt = true;
            Apps.createIcon('opt', 'Optimize', Apps.optimizer);
            VeraSystem.say("Оптимизатор? Отлично.", "sarcastic");
        }
        WindowManager.close('shop');
        setTimeout(Apps.shop, 100);
    },
    explorer: (path) => {
        if (path === 'sea17' && !GameState.cleanupActive) {
            VeraSystem.state = 'angry';
            VeraSystem.say("КУДА ПОЛЕЗ?! ЭТО ЛИЧНОЕ!", "angry", 3000);
            GlitchSystem.burst(10);
            AudioSystem.error();
            setTimeout(() => VeraSystem.resetMood(), 3000);
            return;
        }
        let html = `<div class="folder-grid">`;
        if (path !== 'root') html += `<div class="file-item" onclick="window.Apps.explorer('root')"><span class="file-icon">⬆️</span><br>..</div>`;
        const content = GameData.fileSystem[path];
        if (content) {
            content.forEach(f => {
                let icon = f.t === 'd' ? '📁' : (f.t === 'app' ? '🚀' : (f.t === 'img' ? '🖼️' : '📄'));
                let clickAction = '';
                let extraClass = '';
                let displayName = f.label || f.n;
                if (f.n === 'sea17' && !GameState.cleanupActive) extraClass = 'folder-locked';
                if (f.t === 'd') clickAction = `window.Apps.explorer('${f.c}')`;
                else if (f.t === 'app') clickAction = `${f.a}()`;
                else if (f.t === 'img') clickAction = `window.Apps.imageViewer('${f.n}', ${f.bad})`;
                else {
                    let jsSafe = f.c.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/'/g, "\\'");
                    let htmlSafe = jsSafe.replace(/"/g, "&quot;");
                    clickAction = `window.WindowManager.create('view-${f.n.replace('.', '')}', '${f.n}', '<pre>${htmlSafe}</pre>')`;
                }
                html += `<div class="file-item ${extraClass}" onclick="${clickAction}"><span class="file-icon">${icon}</span><br><small>${displayName}</small></div>`;
            });
        }
        WindowManager.create('explorer', `Explorer /${path}`, html + '</div>');
    },
    imageViewer: (name, corrupted = false) => {
        let content = corrupted ? `<div class="corrupted-img"><div class="corrupted-glitch"></div>CORRUPTED_DATA<br>UNREADABLE</div>`
            : `<div style="display:flex;align-items:center;justify-content:center;height:200px;border:1px solid #333;">[IMAGE: ${name}]</div>`;
        WindowManager.create('img-' + name, name, content);
    },
    optimizer: () => {
        const isHacked = GameState.bugReleased;
        WindowManager.create('opt', 'Sys_Optimize', `
            <div style="padding:10px; text-align:center;">
                <h3>ОЧИСТКА КЭША</h3>
                <div style="font-size:40px; margin:20px 0;">🗑️</div>
                <button style="width:100%; padding:10px;" onclick="window.WindowManager.closeAll(); window.VeraSystem.say('Так намного свободнее.', 'happy');">ОЧИСТИТЬ ВСЕ</button>
                <hr style="border-color:#333; margin: 20px 0;">
                <button id="scan-btn" class="big-btn ${isHacked ? 'glitch-btn corrupted' : ''}" style="width:80%; padding:10px; font-size: 14px; margin-top:0;" onclick="window.Apps.terminal()">
                    ${isHacked ? 'D33P SC4N [DAMAGED]' : 'DEEP SCAN'}
                </button>
            </div>
        `);
    },
    terminal: () => {
        if (GameState.hacked) {
            WindowManager.create('term', 'Terminal (ROOT)', '<div>ROOT ACCESS GRANTED.<br>Протокол PURGE доступен для Core.<br>Введите PURGE вместо пароля.</div>', 350, 'terminal-corrupted');
            return;
        }

        const isCorrupted = GameState.bugReleased;
        const extraClass = isCorrupted ? 'terminal-corrupted' : '';
        const title = isCorrupted ? 'TERMINAL [DAMAGED]' : 'Terminal (Safe Mode)';

        const html = `
            <div id="term-out" style="margin-bottom:10px; font-size:12px;">V.E.R.A. OS [Version 3.2]<br>'help' для списка команд.</div>
            <div class="terminal-input-line"><span>></span><input id="term-in" class="terminal-input" type="text" onkeydown="window.Apps.termHandle(event)" autocomplete="off" autofocus></div>
        `;
        WindowManager.create('term', title, html, 350, extraClass);
    },
    termHandle: (e) => {
        if (e.key === 'Enter') {
            const val = e.target.value.trim().toLowerCase();
            const out = Utils.id('term-out');
            e.target.value = '';

            let resp = '';
            if (val === 'help') {
                if (!GameState.bugReleased) {
                    resp = 'scan - поиск уязвимостей<br><span class="text-forbidden">deepscan - [ENCRYPTED]</span><br><span class="text-forbidden">hack - [ENCRYPTED]</span>';
                } else {
                    resp = 'scan - поиск уязвимостей<br>deepscan - поиск портов<br>hack [port] - взлом порта';
                }
            }
            else if (val === 'scan') {
                resp = 'Сканирование...<br>Найден фрагмент данных: Code Part 4: 1<br>Обнаружен скрытый файл: error.exe (Use terminal to run)';
            }
            else if (val === 'error.exe') {
                if (GameState.bugReleased) resp = "File already executed.";
                else {
                    resp = "EXECUTING MALWARE...";
                    BugSystem.init();
                    VeraSystem.say("Эй! Не трогай этот файл! Он в карантине!", "angry");
                }
            }
            else if (val === 'deepscan') {
                if (!GameState.bugReleased) resp = "COMMAND LOCKED. ADMIN RIGHTS REQUIRED.";
                else resp = "Scanning ports...<br>Port 80: CLOSED<br>Port 443: CLOSED<br>Port 666: OPEN (BACKDOOR)";
            }
            else if (val.startsWith('hack')) {
                if (!GameState.bugReleased) resp = "COMMAND LOCKED.";
                else if (val === 'hack 666') { Apps.startPreBossSequence(); return; }
                else resp = "Target port not found or closed.";
            }
            else resp = 'Команда не найдена.';

            out.innerHTML += `<div class="terminal-line">> ${val}<br><span style="color:#ccc">${resp}</span></div>`;
            out.scrollTop = out.scrollHeight;
        }
    },
    startPreBossSequence: () => {
        const termIn = Utils.id('term-in');
        if (termIn) {
            termIn.disabled = true;
            termIn.value = "SYSTEM: INITIALIZATION OF PROTECTION...";
        }
        document.body.style.transition = "background 2s";
        document.body.style.background = "#200";

        const event = new CustomEvent('StartPreBossDialogue');
        window.dispatchEvent(event);
    },
    core: () => {
        WindowManager.create('core', 'СИСТЕМНОЕ ЯДРО', `
            <div style="text-align:center; padding:20px;">
                <h2>ВОССТАНОВЛЕНИЕ</h2>
                <p>Введите пароль или протокол:</p>
                <input id="core-pass" class="terminal-input" style="border-bottom:2px solid red; text-align:center; font-size:24px;" placeholder="XXXX" maxlength="5">
                <br><br>
                <button style="background:red; color:white; border:none; padding:10px;" onclick="window.Apps.submitCore()">EXECUTE</button>
            </div>
        `);
    },
    submitCore: () => {
        const pass = Utils.id('core-pass').value.toUpperCase();
        if (pass === '3701') {
            WindowManager.close('core');
            window.dispatchEvent(new CustomEvent('StartEnding', { detail: 'bad' }));
        }
        else if (pass === 'PURGE') {
            WindowManager.close('core');
            window.dispatchEvent(new CustomEvent('StartEnding', { detail: 'good' }));
        } else {
            AudioSystem.error();
            VeraSystem.say("Пароль неверный.", "nervous");
        }
    },
    triggerPurge: () => {
        Utils.id('cleanup-dialog').style.display = 'none';
        Utils.id('boss-canvas-container').style.display = 'none';
        const panel = Utils.id('vera-panel');
        panel.classList.remove('undertale-mode');
        panel.classList.remove('evil');
        panel.style.display = 'flex';
        window.dispatchEvent(new CustomEvent('StartEnding', { detail: 'good' }));
    }
};