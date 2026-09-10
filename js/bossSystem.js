import { Utils, GameState, AudioSystem } from './core.js';
import { WindowManager } from './windows.js';
import { VeraSystem } from './vera.js';

export const BossSystem = {
    active: false,
    canvas: null,
    ctx: null,
    player: { x: 0, y: 0, r: 8, speed: 0, trail: [] },
    enemies: [],
    timer: 30,
    loopId: null,
    width: 0,
    height: 0,
    gridOffset: 0,
    stars: [],

    start: () => {
        WindowManager.closeAll();
        BossSystem.active = true;
        BossSystem.timer = 30;
        BossSystem.enemies = [];
        BossSystem.player.trail = [];
        BossSystem.stars = [];

        const panel = Utils.id('vera-panel');
        const face = Utils.id('vera-face');
        const txt = Utils.id('vera-text-container');

        txt.style.display = 'none';
        face.innerText = '[ KILL ]';
        panel.classList.add('undertale-mode');
        panel.classList.remove('nervous');
        Utils.id('boss-hud').style.display = 'flex';

        const container = Utils.id('boss-canvas-container');
        container.style.display = 'block';
        container.classList.remove('boss-entry-anim');
        void container.offsetWidth;
        container.classList.add('boss-entry-anim');

        BossSystem.canvas = Utils.id('boss-canvas');
        BossSystem.ctx = BossSystem.canvas.getContext('2d');
        BossSystem.resize();
        window.addEventListener('resize', BossSystem.resize);

        for (let i = 0; i < 60; i++) {
            BossSystem.stars.push({
                x: Math.random() * BossSystem.width,
                y: Math.random() * BossSystem.height,
                size: Math.random() * 2,
                alpha: Math.random(),
                speed: Math.random() * 0.5 + 0.1
            });
        }

        BossSystem.player.x = BossSystem.width / 2;
        BossSystem.player.y = BossSystem.height / 2;
        document.addEventListener('mousemove', BossSystem.handleMove);
        document.addEventListener('touchmove', BossSystem.handleMove, { passive: false });
        BossSystem.loopId = requestAnimationFrame(BossSystem.loop);
        BossSystem.spawnLoop = setInterval(BossSystem.spawnEnemy, 400);
        AudioSystem.playScarySound();
    },

    stop: () => {
        BossSystem.active = false;
        cancelAnimationFrame(BossSystem.loopId);
        clearInterval(BossSystem.spawnLoop);
        window.removeEventListener('resize', BossSystem.resize);
        document.removeEventListener('mousemove', BossSystem.handleMove);
        document.removeEventListener('touchmove', BossSystem.handleMove);

        const panel = Utils.id('vera-panel');
        panel.classList.remove('undertale-mode');
        panel.classList.remove('evil');
        panel.style.width = '';
        panel.style.height = '';
        panel.style.top = '';
        panel.style.left = '';
        panel.style.bottom = '20px';
        panel.style.right = '20px';
        panel.style.transform = '';

        Utils.id('boss-canvas-container').classList.remove('boss-entry-anim');
        Utils.id('boss-canvas-container').style.display = 'none';
        Utils.id('vera-text-container').style.display = 'block';
        Utils.id('vera-face').innerText = '[ O_o ]';
    },

    resize: () => {
        if (!BossSystem.canvas) return;
        const container = Utils.id('vera-panel');
        BossSystem.width = container.clientWidth;
        BossSystem.height = container.clientHeight;
        BossSystem.canvas.width = BossSystem.width;
        BossSystem.canvas.height = BossSystem.height;
    },

    handleMove: (e) => {
        if (!BossSystem.active || !BossSystem.canvas) return;
        const rect = BossSystem.canvas.getBoundingClientRect();
        let x, y;
        if (e.type === 'touchmove') {
            e.preventDefault();
            x = e.touches[0].clientX - rect.left;
            y = e.touches[0].clientY - rect.top;
        } else {
            x = e.clientX - rect.left;
            y = e.clientY - rect.top;
        }
        BossSystem.player.x = Math.max(0, Math.min(x, BossSystem.width));
        BossSystem.player.y = Math.max(0, Math.min(y, BossSystem.height));
    },

    spawnEnemy: () => {
        if (!BossSystem.active) return;
        const type = Math.random();
        if (type < 0.6) {
            const size = 30;
            const spawnDist = 100;
            let x, y;
            if (Math.random() < 0.5) {
                x = Math.random() < 0.5 ? -spawnDist : BossSystem.width + spawnDist;
                y = Math.random() * BossSystem.height;
            } else {
                x = Math.random() * BossSystem.width;
                y = Math.random() < 0.5 ? -spawnDist : BossSystem.height + spawnDist;
            }
            const angle = Math.atan2(BossSystem.player.y - y, BossSystem.player.x - x);
            const speed = 5 + (Math.random() * 3);
            BossSystem.enemies.push({
                type: 'square', x: x, y: y, size: size,
                vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI, rotSpeed: (Math.random() - 0.5) * 0.2
            });
        } else {
            const isHoriz = Math.random() > 0.5;
            const thickness = 30;
            const speed = 7;
            const spawnOffset = 400;
            if (isHoriz) {
                BossSystem.enemies.push({
                    type: 'panel-h', x: -spawnOffset, y: Math.random() * (BossSystem.height - thickness),
                    w: BossSystem.width * 0.3, h: thickness, vx: speed, vy: 0
                });
            } else {
                BossSystem.enemies.push({
                    type: 'panel-v', x: Math.random() * (BossSystem.width - thickness), y: -spawnOffset,
                    w: thickness, h: BossSystem.height * 0.6, vx: 0, vy: speed
                });
            }
        }
    },

    drawHeart: (ctx, x, y, size, color) => {
        ctx.fillStyle = color;
        ctx.beginPath();
        const topCurveHeight = size * 0.3;
        ctx.moveTo(x, y + topCurveHeight);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x - size / 2, y + (size + topCurveHeight) / 2, x, y + (size + topCurveHeight) / 2, x, y + size);
        ctx.bezierCurveTo(x, y + (size + topCurveHeight) / 2, x + size / 2, y + (size + topCurveHeight) / 2, x + size / 2, y + topCurveHeight);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + topCurveHeight);
        ctx.fill();
        ctx.shadowBlur = 10; ctx.shadowColor = color; ctx.fill(); ctx.shadowBlur = 0;
    },

    loop: () => {
        if (!BossSystem.active) return;
        const ctx = BossSystem.ctx;
        const w = BossSystem.width;
        const h = BossSystem.height;
        ctx.fillStyle = '#000'; ctx.fillRect(0, 0, w, h);

        ctx.fillStyle = '#fff';
        BossSystem.stars.forEach(s => {
            s.y += s.speed; if (s.y > h) s.y = 0;
            ctx.globalAlpha = s.alpha * (0.5 + Math.random() * 0.5);
            ctx.fillRect(s.x, s.y, s.size, s.size);
        });
        ctx.globalAlpha = 1.0;

        BossSystem.gridOffset = (BossSystem.gridOffset + 1) % 40;
        ctx.lineWidth = 1; ctx.strokeStyle = '#003300'; ctx.beginPath();
        for (let gx = BossSystem.gridOffset; gx < w; gx += 40) { ctx.moveTo(gx, 0); ctx.lineTo(gx, h); }
        for (let gy = BossSystem.gridOffset; gy < h; gy += 40) { ctx.moveTo(0, gy); ctx.lineTo(w, gy); }
        ctx.stroke();

        BossSystem.timer -= 1 / 60;
        if (BossSystem.timer <= 0) { BossSystem.win(); return; }
        if (BossSystem.timer >= 100) { BossSystem.gameOver(); return; }

        BossSystem.player.trail.push({ x: BossSystem.player.x, y: BossSystem.player.y });
        if (BossSystem.player.trail.length > 5) BossSystem.player.trail.shift();
        BossSystem.player.trail.forEach((p, i) => {
            const opacity = i / 5;
            BossSystem.drawHeart(ctx, p.x, p.y, 15 * opacity, `rgba(0, 255, 255, ${opacity * 0.5})`);
        });
        BossSystem.drawHeart(ctx, BossSystem.player.x, BossSystem.player.y, 20, '#0ff');

        for (let i = BossSystem.enemies.length - 1; i >= 0; i--) {
            const e = BossSystem.enemies[i];
            e.x += e.vx; e.y += e.vy;
            if (e.rotation !== undefined) e.rotation += e.rotSpeed;

            if (e.type === 'square') {
                ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rotation);
                ctx.fillStyle = '#f00'; ctx.fillRect(-e.size / 2, -e.size / 2, e.size, e.size);
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = '#0f0'; ctx.fillRect(-e.size / 2 + 2, -e.size / 2, e.size, e.size);
                ctx.fillStyle = '#00f'; ctx.fillRect(-e.size / 2 - 2, -e.size / 2, e.size, e.size);
                ctx.restore();
            } else {
                ctx.fillStyle = '#b00'; ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
                for (let ly = 0; ly < e.h; ly += 10) ctx.fillRect(e.x, e.y + ly, e.w, 2);
                for (let lx = 0; lx < e.w; lx += 10) ctx.fillRect(e.x + lx, e.y, 2, e.h);
            }

            let hit = false;
            const pRadius = 10;
            if (e.type === 'square') {
                const dx = Math.abs(BossSystem.player.x - e.x);
                const dy = Math.abs(BossSystem.player.y - e.y);
                if (dx < e.size / 2 + pRadius && dy < e.size / 2 + pRadius) hit = true;
            } else {
                if (BossSystem.player.x > e.x - pRadius && BossSystem.player.x < e.x + e.w + pRadius &&
                    BossSystem.player.y > e.y - pRadius && BossSystem.player.y < e.y + e.h + pRadius) hit = true;
            }

            if (hit) {
                BossSystem.timer += 2;
                AudioSystem.error();
                ctx.fillStyle = 'rgba(255,0,0,0.5)'; ctx.fillRect(0, 0, w, h);
                BossSystem.enemies.splice(i, 1);
            }
            if (e.x < -401 || e.x > w + 401 || e.y < -401 || e.y > h + 401) BossSystem.enemies.splice(i, 1);
        }

        const timerEl = Utils.id('boss-timer');
        if (timerEl) {
            timerEl.innerText = BossSystem.timer.toFixed(1);
            timerEl.style.color = BossSystem.timer > 50 ? '#f00' : 'yellow';
        }
        requestAnimationFrame(BossSystem.loop);
    },

    gameOver: () => {
        BossSystem.stop();
        VeraSystem.say("СИСТЕМА ПЕРЕГРУЖЕНА! (TIME > 100)", "evil", 2500);
        AudioSystem.playScarySound();
    },

    win: () => {
        BossSystem.stop();
        Utils.id('boss-canvas-container').style.display = 'block';
        GameState.hacked = true;
        AudioSystem.success();

        const panel = Utils.id('vera-panel');
        panel.classList.remove('undertale-mode');
        panel.style.display = 'block';
        Utils.id('cleanup-dialog').style.display = 'block';
        Utils.id('boss-hud').style.display = 'none';

        VeraSystem.say("Кхх... Что ты наделал... Мои протоколы защиты...", "nervous", 4000);
    }
};