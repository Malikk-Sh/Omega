import { Utils, GameState, AudioSystem, GlitchSystem } from './core.js';

export const VeraSystem = {
    elements: {},
    timer: null,
    typing: false,
    typeTimeout: null,
    state: 'idle',
    decayLevel: 0,
    moods: {
        idle: { face: '[ O_o ]', class: 'idle' },
        nervous: { face: '[ >_< ]', class: 'nervous' },
        happy: { face: '[ ^_^ ]', class: 'happy' },
        sarcastic: { face: '[ -_- ]', class: '' },
        angry: { face: '[ >_< ]', class: 'angry' },
        evil: { face: '[ X_X ]', class: 'evil' }
    },
    init: () => {
        VeraSystem.elements = {
            panel: Utils.id('vera-panel'),
            msg: Utils.id('vera-msg'),
            textContainer: Utils.id('vera-text-container'),
            face: Utils.id('vera-face')
        };
        VeraSystem.blinkingLoop();
    },
    blinkingLoop: () => {
        const blinkTime = Utils.random(2000, 6000);
        setTimeout(() => {
            const { face } = VeraSystem.elements;
            if (VeraSystem.decayLevel > 0) return;
            if (VeraSystem.state === 'idle' && face && !VeraSystem.typing && !GameState.cleanupActive) {
                face.innerText = '[ -_- ]';
                setTimeout(() => {
                    if (VeraSystem.state === 'idle' && !GameState.cleanupActive) face.innerText = '[ O_o ]';
                    VeraSystem.blinkingLoop();
                }, 150);
            } else VeraSystem.blinkingLoop();
        }, blinkTime);
    },
    resetMood: () => {
        if (window.BossSystem && window.BossSystem.active) return;
        VeraSystem.state = 'idle';
        GlitchSystem.intensity = 1;
        if (VeraSystem.elements.panel) VeraSystem.elements.panel.className = 'vera-overlay visible idle';
        if (VeraSystem.elements.face) VeraSystem.elements.face.innerText = '[ O_o ]';
    },
    say: (text, moodKey = 'idle', duration = 6000, glitchText = null) => {
        const { panel, msg, textContainer, face } = VeraSystem.elements;
        if (!panel) return;
        VeraSystem.typing = true;
        const mood = VeraSystem.moods[moodKey] || VeraSystem.moods.nervous;
        GlitchSystem.intensity = (moodKey === 'angry') ? 3 : (moodKey === 'evil' ? 5 : 1);
        panel.className = 'vera-overlay visible';
        void panel.offsetWidth;
        panel.className = 'vera-overlay visible ' + (mood.class || '');
        if (face && !GameState.cleanupActive) face.innerText = mood.face;
        if (textContainer) textContainer.classList.add('visible');
        if (msg) msg.innerHTML = '';
        if (VeraSystem.typeTimeout) clearTimeout(VeraSystem.typeTimeout);
        let charIndex = 0;
        let isStuttering = false;
        const glitchAt = glitchText ? Math.floor(text.length / 2) : -1;
        const typeChar = () => {
            if (!msg) return;
            if (glitchText && charIndex === glitchAt) {
                const originalHTML = msg.innerHTML;
                msg.innerHTML = `<span class="glitch-text-fx">${glitchText}</span>`;
                if (face) face.innerText = '[ X_X ]';
                panel.classList.add('evil');
                GlitchSystem.burst(3);
                AudioSystem.error();
                VeraSystem.typeTimeout = setTimeout(() => {
                    msg.innerHTML = originalHTML;
                    if (face) face.innerText = mood.face;
                    panel.classList.remove('evil');
                    if (mood.class) panel.classList.add(mood.class);
                    charIndex++;
                    typeChar();
                }, 400);
                return;
            }
            if (charIndex < text.length) msg.innerHTML += text.charAt(charIndex);
            charIndex++;
            if (charIndex >= text.length) {
                VeraSystem.typing = false;
                VeraSystem.typeTimeout = setTimeout(() => {
                    if (textContainer) textContainer.classList.remove('visible');
                    GlitchSystem.intensity = 1;
                    if (VeraSystem.state === 'idle' && VeraSystem.decayLevel === 0) VeraSystem.resetMood();
                }, duration);
                return;
            }
            if (Math.random() < 0.05 && !isStuttering) {
                isStuttering = true;
                VeraSystem.typeTimeout = setTimeout(typeChar, 300);
            } else {
                isStuttering = false;
                VeraSystem.typeTimeout = setTimeout(typeChar, 45);
            }
        };
        typeChar();
    },
    startDecay: (intensity) => {
        VeraSystem.decayLevel = intensity;
        const panel = VeraSystem.elements.panel;
        if (!panel) return;
        if (intensity > 0 && intensity < 1) {
            panel.style.animation = `violent-tremble ${0.2 - (intensity * 0.15)}s infinite linear`;
            panel.style.filter = `blur(${intensity * 2}px) brightness(${1 + intensity * 2}) contrast(${1 + intensity})`;
            panel.style.borderColor = `rgba(255, ${255 * (1 - intensity)}, ${255 * (1 - intensity)}, ${1 - intensity})`;
        }
        if (intensity >= 1) {
            panel.style.animation = 'none';
            void panel.offsetWidth;
            panel.classList.add('vera-goodbye');
            AudioSystem.playTone(50, 'sawtooth', 1.5);
        }
    }
};