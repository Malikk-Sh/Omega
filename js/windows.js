import { Utils, GameState, AudioSystem } from './core.js';
import { VeraSystem } from './vera.js';

const CLEANUP_THRESHOLD = 7;

export const WindowManager = {
    create: (id, title, content, width = 350, extraClass = '') => {
        const winCount = GameState.windows.length;
        const isAlert = id.startsWith('alert-');

        if (!isAlert && winCount >= GameState.ram) {
            VeraSystem.say("Память переполнена. " + GameState.ram + " процесса максимум.", "nervous");
            AudioSystem.error();
            return;
        }

        const existingWin = Utils.id(`win-${id}`);
        if (existingWin) {
            existingWin.querySelector('.win-content').innerHTML = content;
            if (extraClass) existingWin.className = `window open ${extraClass}`;
            WindowManager.focus(id);
            return;
        }

        const win = document.createElement('div');
        win.className = `window ${extraClass}`;
        win.id = `win-${id}`;
        win.style.width = width + 'px';
        win.style.zIndex = ++GameState.zIndex;
        const left = Math.max(0, (window.innerWidth - width) / 2 + Utils.random(-20, 20));
        const top = Math.max(0, (window.innerHeight - 300) / 2 + Utils.random(-20, 20));
        win.style.left = left + 'px'; win.style.top = top + 'px';

        win.innerHTML = `
            <div class="win-header">
                <span>${title}</span>
                <span style="cursor:pointer" onclick="window.WindowManager.close('${id}')">[X]</span>
            </div>
            <div class="win-content">${content}</div>
        `;
        document.body.appendChild(win);
        GameState.windows.push(id);
        WindowManager.updateRamUI();

        if (GameState.windows.length >= CLEANUP_THRESHOLD && !GameState.cleanupActive) {
            setTimeout(() => WindowManager.startEmergencyCleanup(), 200);
        }

        setTimeout(() => win.classList.add('open'), 10);
        const header = win.querySelector('.win-header');
        header.onmousedown = (e) => WindowManager.dragStart(e, win);
        header.ontouchstart = (e) => WindowManager.dragStart(e, win);
        win.onmousedown = () => WindowManager.focus(id);
        AudioSystem.click();
    },
    close: (id) => {
        const win = Utils.id(`win-${id}`);
        if (win) {
            win.classList.remove('open');
            win.classList.add('dying');
            setTimeout(() => {
                win.remove();
                GameState.windows = GameState.windows.filter(w => w !== id);
                WindowManager.updateRamUI();
            }, 350);
        }
    },
    closeAll: () => { [...GameState.windows].forEach(id => WindowManager.close(id)); },
    updateRamUI: () => {
        const ramEl = Utils.id('ram-indicator');
        if (ramEl) {
            const count = GameState.windows.length;
            let percent = 0;
            if (GameState.ram === 1) {
                percent = count > 0 ? 99 : 0;
            } else {
                percent = Math.min(100, Math.floor((count / CLEANUP_THRESHOLD) * 100));
            }
            ramEl.innerText = `RAM USAGE: ${percent}%`;
            if (percent > 80 && GameState.ram > 1) ramEl.classList.add('critical');
            else ramEl.classList.remove('critical');
        }
    },
    focus: (id) => {
        const win = Utils.id(`win-${id}`);
        if (win) win.style.zIndex = ++GameState.zIndex;
    },
    dragStart: (e, win) => {
        if (e.target.closest('span[onclick]')) return;
        e.preventDefault();
        WindowManager.focus(win.id.replace('win-', ''));
        const isTouch = e.type === 'touchstart';
        const clientX = isTouch ? e.touches[0].pageX : e.pageX;
        const clientY = isTouch ? e.touches[0].pageY : e.pageY;
        const shiftX = clientX - win.getBoundingClientRect().left;
        const shiftY = clientY - win.getBoundingClientRect().top;
        function moveAt(px, py) { win.style.left = px - shiftX + 'px'; win.style.top = py - shiftY + 'px'; }
        function onMove(evt) { moveAt(isTouch ? evt.touches[0].pageX : evt.pageX, isTouch ? evt.touches[0].pageY : evt.pageY); }
        if (isTouch) {
            document.addEventListener('touchmove', onMove, { passive: false });
            document.ontouchend = () => document.removeEventListener('touchmove', onMove);
        } else {
            document.addEventListener('mousemove', onMove);
            document.onmouseup = () => document.removeEventListener('mousemove', onMove);
        }
    },
    startEmergencyCleanup: () => {
        WindowManager.closeAll();
        GameState.cleanupActive = true;
        document.body.classList.add('ram-critical');
        AudioSystem.playScarySound();
        if (VeraSystem.typeTimeout) clearTimeout(VeraSystem.typeTimeout);
        VeraSystem.typing = false;
        if (VeraSystem.elements.textContainer) VeraSystem.elements.textContainer.classList.add('visible');
        if (VeraSystem.elements.msg) VeraSystem.elements.msg.innerHTML = "ВЫПОЛНЯЮ ЭКСТРЕННУЮ ОЧИСТКУ ПАМЯТИ...";
        const face = VeraSystem.elements.face;
        const oldFace = face.innerHTML;
        let timeLeft = 15;
        const updateBar = () => {
            const filled = 15 - timeLeft;
            let barStr = "";
            for (let i = 0; i < 15; i++) barStr += (i < filled) ? "■" : "□";
            face.innerHTML = `<div class="vera-cleanup-bar">[${barStr}]</div>`;
        };
        updateBar();
        const countdownInterval = setInterval(() => {
            timeLeft--;
            updateBar();
            if (timeLeft <= 3) AudioSystem.error();
        }, 1000);
        setTimeout(() => {
            clearInterval(countdownInterval);
            document.body.classList.remove('ram-critical');
            GameState.cleanupActive = false;
            face.innerHTML = oldFace;
            VeraSystem.say("Очистка выполнена. Некоторые файлы были сжаты.", "nervous");
        }, 15000);
    }
};