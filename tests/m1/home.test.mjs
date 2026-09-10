import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/m1/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/m1/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/m1/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/m1/omega-os/FileSystemService.js';
import { WorldBindingSystem } from '../../js/v2/m1/world/WorldBinding.js';
import { DialogueController } from '../../js/v2/m1/story/DialogueController.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m1.json', import.meta.url), 'utf8'));
const bindingsDefinition = JSON.parse(await readFile(new URL('../../data/v2/world-bindings-m1.json', import.meta.url), 'utf8'));

const state = createInitialGameState(1000);
state.checkpoint = 'm1_home';
state.world.activeScene = 'apartment_home_m1';
state.filesystem.entries['/memories/sea_2017.img'] = { deleted: false };
state.flags.m1_intro_seen = true;

const events = new EventBus();
const filesystem = new FileSystemService(fsDefinition, state, events);
const bindings = new WorldBindingSystem(bindingsDefinition, filesystem, events);
let visible = null;
bindings.registerTarget('apartment.photo_frame', { setVisible(value) { visible = value; } });

bindings.evaluateAll();
assert.equal(visible, true, 'SEA 2017 frame should initially be visible');
assert.equal(filesystem.readFile('/memories/vera_note.txt')?.content?.includes('waves'), true, 'V.E.R.A. note should be readable');

assert.equal(filesystem.deleteFile('/memories/sea_2017.img'), true);
assert.equal(visible, false, 'Deleting SEA 2017 must hide the world frame immediately');

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const loaded = await saves.load('omega_autosave');
assert.ok(loaded, 'HOME save should load');
assert.equal(loaded.filesystem.entries['/memories/sea_2017.img']?.deleted, true);
assert.equal(loaded.flags.m1_intro_seen, true, 'story flags must survive save/load');

const eventsAfterLoad = new EventBus();
const filesystemAfterLoad = new FileSystemService(fsDefinition, loaded, eventsAfterLoad);
const bindingsAfterLoad = new WorldBindingSystem(bindingsDefinition, filesystemAfterLoad, eventsAfterLoad);
let visibleAfterLoad = null;
bindingsAfterLoad.registerTarget('apartment.photo_frame', { setVisible(value) { visibleAfterLoad = value; } });
bindingsAfterLoad.evaluateAll();
assert.equal(visibleAfterLoad, false, 'Deleted memory must remain absent after loading');

assert.equal(filesystemAfterLoad.restoreFile('/memories/sea_2017.img'), true);
assert.equal(visibleAfterLoad, true, 'Restoring SEA 2017 must restore the world frame');

// Regression: the same physical tap that opens dialogue must not skip line 1.
const speakerNode = { textContent: '' };
const textNode = { textContent: '' };
const portraitNode = { src: '' };
const nextNode = { addEventListener() {} };
const root = {
  hidden: true,
  setAttribute() {},
  querySelector(selector) {
    if (selector === '[data-dialogue-next]') return nextNode;
    if (selector === '[data-dialogue-speaker]') return speakerNode;
    if (selector === '[data-dialogue-text]') return textNode;
    if (selector === '[data-dialogue-portrait]') return portraitNode;
    return null;
  }
};
const dialogue = new DialogueController(root);
const dialogueDone = dialogue.play([
  { speaker: 'V.E.R.A.', text: 'FIRST' },
  { speaker: 'V.E.R.A.', text: 'SECOND' }
]);
dialogue.advance();
assert.equal(textNode.textContent, 'FIRST', 'opening tap must not advance the first dialogue line');
await new Promise(resolve => setTimeout(resolve, 210));
dialogue.advance();
assert.equal(textNode.textContent, 'SECOND', 'a later deliberate input must advance dialogue');
dialogue.advance();
await dialogueDone;
assert.equal(dialogue.isActive(), false, 'dialogue should still finish normally after the guard');

console.log('M1 HOME regression: PASS');
