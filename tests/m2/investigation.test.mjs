import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { WorldBindingSystem } from '../../js/v2/runtime/world/WorldBinding.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m2.json', import.meta.url), 'utf8'));
const bindingsDefinition = JSON.parse(await readFile(new URL('../../data/v2/world-bindings-m2.json', import.meta.url), 'utf8'));

const state = createInitialGameState(2000);
state.checkpoint = 'm2_investigation';
state.world.activeScene = 'apartment_home_m2';
state.flags.m1_intro_seen = true;
state.flags.m1_photo_inspected = true;
state.flags.m2_photo_scanned = true;
state.flags.m2_log_recovered = false;
state.flags.m2_log_read = false;
state.flags.m2_choice_made = false;
state.flags.m2_told_vera = false;
state.flags.m2_hid_evidence = false;
state.flags.vera_trust = 50;

const events = new EventBus();
const filesystem = new FileSystemService(fsDefinition, state, events);
const bindings = new WorldBindingSystem(bindingsDefinition, filesystem, events);

const photo = filesystem.readFile('/memories/sea_2017.img');
assert.ok(photo, 'SEA 2017 evidence must exist');
assert.equal(photo.metadata?.CAPTURED, '17.03.2017 18:42:11');
assert.equal(photo.metadata?.CHECKSUM, 'SEA-1703-Ω');
assert.equal(photo.artwork, '../assets/v2/props/sea_2017_polaroid.svg');

assert.equal(filesystem.exists('/system/logs/recovery_1703.log'), false, 'recovery log starts deleted');
assert.equal(filesystem.listDirectory('/system/logs', true).length, 0, 'deleted recovery log must stay hidden from Explorer');

let photoVisible = null;
let traceVisible = null;
bindings.registerTarget('apartment.photo_frame', { setVisible(value) { photoVisible = value; } });
bindings.registerTarget('apartment.null_trace', { setVisible(value) { traceVisible = value; } });
bindings.evaluateAll();
assert.equal(photoVisible, true, 'SEA 2017 world frame should be visible');
assert.equal(traceVisible, false, 'NULL trace must be absent before recovery');

assert.equal(filesystem.recoverByKey('9999'), null, 'wrong recovery signature must fail');
assert.equal(traceVisible, false, 'wrong signature must not alter HOME');

const recovered = filesystem.recoverByKey('1703');
assert.equal(recovered?.path, '/system/logs/recovery_1703.log', 'DDMM signature should recover the orphaned log');
assert.equal(traceVisible, true, 'recovering the log must reveal the NULL trace through world binding');
assert.equal(filesystem.listDirectory('/system/logs', true).length, 1, 'recovered log should become visible in SYSTEM LOGS');
assert.equal(filesystem.readFile('/system/logs/recovery_1703.log')?.content?.includes('signature: NULL'), true, 'recovered log must contain the first NULL clue');

state.flags.m2_log_recovered = true;
state.flags.m2_log_read = true;
state.flags.m2_choice_made = true;
state.flags.m2_told_vera = true;
state.flags.vera_trust = 55;
state.checkpoint = 'm2_investigation_complete';

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const loaded = await saves.load('omega_autosave');
assert.ok(loaded, 'M2 save should load');
assert.equal(loaded.flags.m2_choice_made, true, 'narrative decision must persist');
assert.equal(loaded.flags.m2_told_vera, true, 'choice branch must persist');
assert.equal(loaded.flags.vera_trust, 55, 'V.E.R.A. trust change must persist');
assert.equal(loaded.filesystem.entries['/system/logs/recovery_1703.log']?.deleted, false, 'recovered file must stay recovered after save/load');

const resetState = createInitialGameState(3000);
filesystem.replaceState(resetState);
assert.equal(filesystem.exists('/system/logs/recovery_1703.log'), false, 'state replacement must restore initiallyDeleted defaults');
assert.equal(filesystem.listDirectory('/system/logs', true).length, 0, 'reset state must hide the orphaned log again');

console.log('M2 INVESTIGATION regression: PASS');
