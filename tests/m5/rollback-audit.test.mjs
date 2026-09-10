import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { upgradeStateForBackup03 } from '../../js/v2/runtime/story/Backup03Protocol.js';
import {
  V26_RESULT_PATH,
  appendV26Command,
  evaluateRollbackOrder,
  evaluateTamperedRecord,
  hasCompletedV26PhysicalEvidence,
  hasReadV26AuditLogs,
  isVersionUnlocked,
  parseV26CommandOrder,
  resetV26CommandOrder,
  upgradeStateForVersions,
  validateVersionsDefinition
} from '../../js/v2/runtime/story/VersionsProtocol.js';

const versions = JSON.parse(await readFile(new URL('../../data/v2/versions-m5.json', import.meta.url), 'utf8'));
const filesystemDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m5.json', import.meta.url), 'utf8'));
assert.deepEqual(validateVersionsDefinition(versions), [], 'authored VERSIONS data including rollback audit must validate');

const state = createInitialGameState(10000);
upgradeStateForBackup03(state);
upgradeStateForVersions(state);
state.flags.m4_home_reaction_seen = true;
state.flags.m5_v10_complete = true;
assert.equal(isVersionUnlocked(state, versions, 'vera_2_6'), true, 'VERA_2_6 must unlock after VERA_1_0 completion');
assert.equal(state.flags.m5_v26_audit_solved, false, 'VERA_2_6 audit must start unsolved');

const fs = new FileSystemService(filesystemDefinition, state, new EventBus());
assert.equal(fs.exists(V26_RESULT_PATH), false, 'forced rollback result must start locked');

for (const flag of ['m5_v26_evidence_door_seen', 'm5_v26_evidence_memory_seen']) state.flags[flag] = true;
assert.equal(hasCompletedV26PhysicalEvidence(state), false, 'all three physical effects are required');
state.flags.m5_v26_evidence_console_seen = true;
assert.equal(hasCompletedV26PhysicalEvidence(state), true, 'door, memory drawer and rollback console complete physical evidence');

for (const flag of ['m5_v26_controller_log_read', 'm5_v26_summary_read']) state.flags[flag] = true;
assert.equal(hasReadV26AuditLogs(state), false, 'all audit records must be read');
state.flags.m5_v26_room_log_read = true;
assert.equal(hasReadV26AuditLogs(state), true, 'controller, operator summary and room state complete audit trail');

const rollback = versions.rollbackAudit;
appendV26Command(state, 'force_rollback', rollback);
appendV26Command(state, 'isolate_external_io', rollback);
appendV26Command(state, 'prune_recent_memory', rollback);
appendV26Command(state, 'restore_persona', rollback);
let order = parseV26CommandOrder(state);
let orderEvaluation = evaluateRollbackOrder(rollback, order);
assert.equal(orderEvaluation.ok, false, 'wrong full command order must fail');
assert.equal(orderEvaluation.firstMismatchIndex, 0, 'wrong order reports first contradiction');

resetV26CommandOrder(state);
for (const commandId of rollback.expectedOrder) appendV26Command(state, commandId, rollback);
appendV26Command(state, rollback.expectedOrder[0], rollback);
appendV26Command(state, 'unknown_command', rollback);
order = parseV26CommandOrder(state);
assert.deepEqual(order, rollback.expectedOrder, 'duplicate and unknown command taps must not alter reconstructed order');
orderEvaluation = evaluateRollbackOrder(rollback, order);
assert.equal(orderEvaluation.ok, true, 'canonical controller order must pass');

const wrongRecord = evaluateTamperedRecord(rollback, 'controller_trace');
assert.equal(wrongRecord.ok, false, 'immutable controller trace must not be accepted as post-event tampering');
const unknownRecord = evaluateTamperedRecord(rollback, 'missing_record');
assert.equal(unknownRecord.ok, false, 'unknown record IDs must be rejected');
const tampered = evaluateTamperedRecord(rollback, 'operator_summary');
assert.equal(tampered.ok, true, 'operator summary is the authored post-rollback edit');
assert.equal(tampered.rewardClue, 'v26_forced_rollback_after_refusal', 'tamper solution must issue stable forced rollback clue');

state.flags.m5_v26_order_solved = true;
state.flags.m5_v26_tamper_identified = true;
state.flags.m5_v26_audit_solved = true;
assert.equal(fs.restoreFile(V26_RESULT_PATH), true, 'successful audit must unlock forced rollback result');
assert.equal(fs.exists(V26_RESULT_PATH), true, 'forced rollback result must become readable after solve');

state.flags.m5_v26_complete = true;
assert.equal(isVersionUnlocked(state, versions, 'vera_4_1'), true, 'completed VERA_2_6 must unlock VERA_4_1 in authored graph');

const fresh = createInitialGameState(10100);
upgradeStateForBackup03(fresh);
upgradeStateForVersions(fresh);
const freshFs = new FileSystemService(filesystemDefinition, fresh, new EventBus());
assert.equal(fresh.flags.m5_v26_entered, false, 'fresh state must not invent VERA_2_6 progress');
assert.equal(freshFs.exists(V26_RESULT_PATH), false, 'fresh state keeps forced rollback result locked');

console.log('M5 VERA 2.6 rollback audit regression: PASS');
