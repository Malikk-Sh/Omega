import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { upgradeStateForBackup03 } from '../../js/v2/runtime/story/Backup03Protocol.js';
import {
  V26_CONTROLLER_TRACE_PATH,
  V26_OPERATOR_SUMMARY_PATH,
  V26_RESULT_PATH,
  V26_ROOM_STATE_PATH,
  appendV26Command,
  evaluateRollbackOrder,
  evaluateTamperedRecord,
  isVersionUnlocked,
  parseV26CommandOrder,
  resetV26CommandOrder,
  upgradeStateForVersions
} from '../../js/v2/runtime/story/VersionsProtocol.js';
import {
  BACKUP_26_SCENE,
  HOME_SCENE,
  SCENE_INTERACTION_IDS,
  SceneRouter
} from '../../js/v2/runtime/world/SceneRouter.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m5.json', import.meta.url), 'utf8'));
const versions = JSON.parse(await readFile(new URL('../../data/v2/versions-m5.json', import.meta.url), 'utf8'));

const state = createInitialGameState(12000);
upgradeStateForBackup03(state);
upgradeStateForVersions(state);
state.flags.m4_home_reaction_seen = true;
state.flags.m5_v10_entered = true;
state.flags.m5_v10_vera_met = true;
state.flags.m5_v10_source_read = true;
state.flags.m5_v10_photo_inspected = true;
state.flags.m5_v10_puzzle_solved = true;
state.flags.m5_v10_clue_read = true;
state.flags.m5_v10_choice_made = true;
state.flags.m5_v10_returned_home = true;
state.flags.m5_v10_home_reaction_seen = true;
state.flags.m5_v10_complete = true;
state.checkpoint = 'm5_v10_complete';
assert.equal(isVersionUnlocked(state, versions, 'vera_2_6'), true, 'completed VERA_1_0 must unlock VERA_2_6');

const v26Ids = Object.values(SCENE_INTERACTION_IDS.backup26);
const priorIds = new Set([
  ...Object.values(SCENE_INTERACTION_IDS.home),
  ...Object.values(SCENE_INTERACTION_IDS.backup03),
  ...Object.values(SCENE_INTERACTION_IDS.backup10)
]);
assert.equal(v26Ids.some(id => priorIds.has(id)), false, 'VERA_2_6 interaction IDs must not collide with earlier scenes');

const mounts = [];
const host = {
  writePlayerState(current) {
    current.player.position = [...current.player.position];
  },
  mountScene(sceneId) {
    mounts.push(sceneId);
  }
};
const homeTransform = structuredClone(state.player);
const router = new SceneRouter(state, host);
assert.equal(router.enterBackup26(), true, 'VERA_2_6 route must enter from HOME');
assert.equal(router.enterBackup26(), false, 'duplicate VERA_2_6 entry must be rejected');
assert.equal(state.world.activeScene, BACKUP_26_SCENE, 'active scene must persist VERA_2_6');
assert.deepEqual(state.world.returnPoint?.player, homeTransform, 'VERA_2_6 must preserve exact HOME return transform');
state.flags.m5_v26_entered = true;
state.flags.m5_v26_vera_met = true;
state.checkpoint = 'm5_v26_research_office';

const filesystem = new FileSystemService(fsDefinition, state, new EventBus());
for (const path of [V26_CONTROLLER_TRACE_PATH, V26_OPERATOR_SUMMARY_PATH, V26_ROOM_STATE_PATH]) {
  assert.equal(filesystem.exists(path), true, `${path} must be available inside Research Office audit`);
}
assert.equal(filesystem.exists(V26_RESULT_PATH), false, 'forced rollback result must remain locked before solving P10');

state.flags.m5_v26_evidence_door_seen = true;
state.flags.m5_v26_evidence_memory_seen = true;
state.flags.m5_v26_evidence_console_seen = true;
state.flags.m5_v26_controller_log_read = true;
state.flags.m5_v26_summary_read = true;
state.flags.m5_v26_room_log_read = true;

appendV26Command(state, versions.rollbackAudit.expectedOrder[0], versions.rollbackAudit);
appendV26Command(state, versions.rollbackAudit.expectedOrder[1], versions.rollbackAudit);
assert.deepEqual(parseV26CommandOrder(state), versions.rollbackAudit.expectedOrder.slice(0, 2), 'partial rollback order must persist by stable command IDs');

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const loadedPartial = await saves.load('omega_autosave');
assert.ok(loadedPartial, 'save inside Research Office must load');
upgradeStateForBackup03(loadedPartial);
upgradeStateForVersions(loadedPartial);
assert.equal(loadedPartial.world.activeScene, BACKUP_26_SCENE, 'M4+M5 upgrade chain must preserve reload inside VERA_2_6');
assert.equal(loadedPartial.checkpoint, 'm5_v26_research_office', 'later-version checkpoint must survive compatibility upgrade');
assert.deepEqual(parseV26CommandOrder(loadedPartial), versions.rollbackAudit.expectedOrder.slice(0, 2), 'partial command order must survive save/load');

resetV26CommandOrder(loadedPartial);
for (const commandId of versions.rollbackAudit.expectedOrder) appendV26Command(loadedPartial, commandId, versions.rollbackAudit);
assert.equal(evaluateRollbackOrder(versions.rollbackAudit, parseV26CommandOrder(loadedPartial)).ok, true, 'canonical rollback execution order must solve first audit phase');
loadedPartial.flags.m5_v26_order_solved = true;
assert.equal(evaluateTamperedRecord(versions.rollbackAudit, 'operator_summary').ok, true, 'operator summary must solve post-rollback edit phase');
assert.equal(filesystem.replaceState(loadedPartial), undefined, 'filesystem state replacement should remain side-effect compatible');
assert.equal(filesystem.restoreFile(V26_RESULT_PATH), true, 'solved audit must mount forced rollback result');
loadedPartial.flags.m5_v26_tamper_identified = true;
loadedPartial.flags.m5_v26_audit_solved = true;
loadedPartial.flags.m5_v26_clue_read = true;
loadedPartial.flags.m5_v26_choice_made = true;
loadedPartial.flags.m5_v26_told_vera_forced = true;
loadedPartial.checkpoint = 'm5_v26_return_home';
await saves.save('omega_autosave', loadedPartial);

const loadedSolved = await saves.load('omega_autosave');
assert.ok(loadedSolved, 'solved Research Office save must load');
assert.equal(loadedSolved.filesystem.entries[V26_RESULT_PATH]?.deleted, false, 'mounted forced rollback result must survive save/load');
assert.equal(loadedSolved.flags.m5_v26_told_vera_forced, true, 'VERA_2_6 truth choice must persist');

const returnRouter = new SceneRouter(loadedSolved, host);
assert.equal(returnRouter.returnHome(), true, 'Research Office return portal must restore HOME');
assert.equal(returnRouter.returnHome(), false, 'duplicate HOME return must be rejected');
assert.equal(loadedSolved.world.activeScene, HOME_SCENE, 'Research Office return must persist HOME');
assert.deepEqual(loadedSolved.player, homeTransform, 'Research Office return must restore exact HOME transform');
assert.equal(loadedSolved.world.returnPoint, undefined, 'successful Research Office return must clear transient return point');
loadedSolved.flags.m5_v26_returned_home = true;
loadedSolved.flags.m5_v26_home_reaction_seen = true;
loadedSolved.flags.m5_v26_complete = true;
assert.equal(isVersionUnlocked(loadedSolved, versions, 'vera_4_1'), true, 'completed VERA_2_6 must unlock VERA_4_1');

await saves.save('omega_autosave', loadedSolved);
const afterReturn = await saves.load('omega_autosave');
assert.ok(afterReturn, 'post-Research-Office save must load');
assert.equal(afterReturn.world.activeScene, HOME_SCENE, 'post-return reload must remain HOME');
assert.equal(afterReturn.flags.m5_v26_complete, true, 'VERA_2_6 completion must persist');

const fresh = createInitialGameState(12100);
upgradeStateForBackup03(fresh);
upgradeStateForVersions(fresh);
const freshFs = new FileSystemService(fsDefinition, fresh, new EventBus());
assert.equal(fresh.world.activeScene, HOME_SCENE, 'fresh game remains HOME');
assert.equal(fresh.flags.m5_v26_entered, false, 'fresh game must not invent VERA_2_6 progress');
assert.equal(freshFs.exists(V26_RESULT_PATH), false, 'fresh game keeps forced rollback result locked');

assert.deepEqual(mounts, [BACKUP_26_SCENE, HOME_SCENE], 'Research Office lifecycle must produce exactly one enter mount and one return mount');
console.log('M5 VERA 2.6 Research Office regression: PASS');
