import { Utils, PerformanceMode } from './core.js';
import { VeraSystem } from './vera.js';
import { WindowManager } from './windows.js';
import { BugSystem } from './bugSystem.js';
import { BossSystem } from './bossSystem.js';
import { Apps } from './apps.js';
import { StorySystem } from './story.js';

// INIT
class OmegaOS {
    constructor() {
        this.initGlobals();
        this.setupEventListeners();
        console.log('OMEGA OS v8.1 Initialized');
    }

    // Прикрепить к window чтобы динамичные HTML onclick атрбуты работали
    initGlobals() {
        window.PerformanceMode = PerformanceMode;
        window.StorySystem = StorySystem;
        window.BugSystem = BugSystem;
        window.Apps = Apps;
        window.WindowManager = WindowManager;
        window.VeraSystem = VeraSystem;
        window.BossSystem = BossSystem;
    }

    setupEventListeners() {
        //  data-action аттрибуты
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-action]');
            if (!target) return;

            const action = target.dataset.action;

            switch (action) {
                case 'setPerformance':
                    PerformanceMode.set(target.dataset.mode === 'low');
                    break;
                case 'startSystem':
                    StorySystem.startInteraction();
                    break;
                case 'bugClick':
                    BugSystem.handleClick();
                    break;
                case 'triggerPurge':
                    Apps.triggerPurge();
                    break;
                case 'prisonBoost':
                    StorySystem.prisonBoost();
                    break;
                case 'restart':
                    location.reload();
                    break;
            }
        });

        // Global Event Listeners для связи модулей
        window.addEventListener('TriggerRandomAlert', () => Apps.triggerRandomAlert());
        window.addEventListener('StartIntroRequested', () => StorySystem.startIntro());
        window.addEventListener('StartPreBossDialogue', () => StorySystem.playPreBossDialogue());
        window.addEventListener('StartEnding', (e) => StorySystem.startEnding(e.detail));

        // Keyboard Shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !BossSystem.active) {
                // Потом добавлю
                // Добавить shortcut чтобы закрывать окно в фокусе
                // Добавить shortcut чтобы вводить предыдущую команду в терминале
            }
        });
    }
}

// Start the OS when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new OmegaOS();
});