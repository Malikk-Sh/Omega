import assert from 'node:assert/strict';
import { EventBus } from '../../js/v2/m0/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/m0/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/m0/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/m0/omega-os/FileSystemService.js';
import { WorldBindingSystem } from '../../js/v2/m0/world/WorldBinding.js';

const events = new EventBus();
let state = createInitialGameState(1);
const fs = new FileSystemService({ entries: [
  { path: '/memories', type: 'directory', label: 'memories', parent: '/' },
  { path: '/memories/test_photo.img', type: 'file', label: 'test_photo.img', parent: '/memories', deletable: true, restorable: true }
]}, state, events);

let visible = null;
const bindings = new WorldBindingSystem([
  { id: 'test', rule: { type: 'file_exists', path: '/memories/test_photo.img' }, targetId: 'photo', action: 'show' }
], fs, events);
bindings.registerTarget('photo', { setVisible(value) { visible = value; } });
assert.equal(visible, true, 'photo starts visible');

assert.equal(fs.deleteFile('/memories/test_photo.img'), true);
assert.equal(fs.exists('/memories/test_photo.img'), false);
assert.equal(visible, false, 'delete immediately hides world target');

const manager = new SaveManager(new MemorySaveAdapter());
await manager.save('slot', state);
const loaded = await manager.load('slot');
assert.ok(loaded);
assert.equal(loaded.filesystem.entries['/memories/test_photo.img'].deleted, true, 'deleted bit survives serialization');

state = loaded;
fs.replaceState(state);
events.emit('state:replaced', { state });
assert.equal(visible, false, 'world binding re-evaluates after load');

assert.equal(fs.restoreFile('/memories/test_photo.img'), true);
assert.equal(visible, true, 'restore immediately shows world target');

const savedAgain = await manager.save('slot', state);
assert.equal(savedAgain.state.filesystem.entries['/memories/test_photo.img'].deleted, false);
assert.equal(savedAgain.state.schemaVersion, 1);

bindings.destroy();
console.log('M0 core tests passed');
