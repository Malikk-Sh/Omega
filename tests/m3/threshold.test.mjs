import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { WorldBindingSystem } from '../../js/v2/runtime/world/WorldBinding.js';
import { evaluateQuarantineRoute, NULL_FIRST_CONTACT } from '../../js/v2/runtime/story/ThresholdProtocol.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m3.json', import.meta.url), 'utf8'));
const bindingsDefinition = JSON.parse(await readFile(new URL('../../data/v2/world-bindings-m3.json', import.meta.url), 'utf8'));

const state = createInitialGameState(4000);
state.flags.m1_intro_seen = true;
state.flags.m1_photo_inspected = true;
state.flags.m2_photo_scanned = true;
state.flags.m2_log_recovered = true;
state.flags.m2_log_read = true;
state.flags.m2_choice_made = true;
state.flags.m2_told_vera = true;
state.flags.m3_trace_touched = true;
state.flags.m3_route_attempts = 0;
state.flags.m3_route_solved = false;
state.flags.m3_threshold_open = false;
state.flags.m3_null_contact = false;
state.flags.m3_contact_choice_made = false;
state.flags.null_affinity = 0;

const events = new EventBus();
const filesystem = new FileSystemService(fsDefinition, state, events);
const bindings = new WorldBindingSystem(bindingsDefinition, filesystem, events);

assert.equal(filesystem.recoverByKey('1703')?.path, '/system/logs/recovery_1703.log', 'M2 recovery log must still recover in M3 data');
assert.equal(filesystem.exists('/system/processes/null_channel.proc'), false, 'NULL channel must start closed');
assert.equal(filesystem.listDirectory('/system/processes', true).length, 0, 'closed channel must remain hidden from process files');

let traceVisible = null;
let thresholdVisible = null;
bindings.registerTarget('apartment.photo_frame', { setVisible() {} });
bindings.registerTarget('apartment.null_trace', { setVisible(value) { traceVisible = value; } });
bindings.registerTarget('apartment.threshold_corridor', { setVisible(value) { thresholdVisible = value; } });
bindings.evaluateAll();
assert.equal(traceVisible, true, 'recovered M2 log must expose the NULL trace');
assert.equal(thresholdVisible, false, 'threshold must remain closed before process route reconstruction');

assert.equal(evaluateQuarantineRoute('vera').ok, false, 'VERA_CORE route must be rejected');
assert.equal(evaluateQuarantineRoute('null').ok, false, 'reversed NULL route must be rejected');
assert.equal(evaluateQuarantineRoute('system').ok, true, 'SYSTEM must be the recovered quarantine requester');

assert.equal(filesystem.restoreFile('/system/processes/null_channel.proc'), true, 'correct route should be able to activate NULL channel');
assert.equal(thresholdVisible, true, 'opening NULL channel must reveal the threshold through world binding');
assert.equal(filesystem.listDirectory('/system/processes', true).length, 1, 'open channel snapshot must appear in process files');
assert.equal(filesystem.readFile('/system/processes/null_channel.proc')?.content?.includes('SYSTEM -> NULL'), true, 'channel snapshot must preserve reconstructed route');
assert.equal(NULL_FIRST_CONTACT.some(line => line.includes('BACKUP 0.3')), true, 'first NULL contact must seed the next investigation arc');

state.flags.m3_route_solved = true;
state.flags.m3_threshold_open = true;
state.flags.m3_null_contact = true;
state.flags.m3_contact_choice_made = true;
state.flags.m3_answered_null = true;
state.flags.null_affinity = 5;
state.checkpoint = 'm3_threshold_complete';

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const loaded = await saves.load('omega_autosave');
assert.ok(loaded, 'M3 save should load');
assert.equal(loaded.flags.m3_threshold_open, true, 'threshold state must persist');
assert.equal(loaded.flags.m3_answered_null, true, 'NULL response branch must persist');
assert.equal(loaded.flags.null_affinity, 5, 'NULL affinity must persist');
assert.equal(loaded.filesystem.entries['/system/processes/null_channel.proc']?.deleted, false, 'open process channel must survive save/load');

const resetState = createInitialGameState(5000);
filesystem.replaceState(resetState);
assert.equal(filesystem.exists('/system/processes/null_channel.proc'), false, 'reset must close the M3 channel');
assert.equal(filesystem.listDirectory('/system/processes', true).length, 0, 'reset must hide the process snapshot again');

console.log('M3 THRESHOLD regression: PASS');
