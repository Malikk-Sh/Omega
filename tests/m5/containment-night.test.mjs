import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { upgradeStateForBackup03 } from '../../js/v2/runtime/story/Backup03Protocol.js';
import {
  V41_RESULT_PATH,
  evaluateIncidentReconstruction,
  isVersionUnlocked,
  parseV41Assignments,
  setV41EvidenceSource,
  upgradeStateForVersions
} from '../../js/v2/runtime/story/VersionsProtocol.js';
import {
  BACKUP_41_SCENE,
  HOME_SCENE,
  SCENE_INTERACTION_IDS,
  SceneRouter
} from '../../js/v2/runtime/world/SceneRouter.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m5.json', import.meta.url), 'utf8'));
const versions = JSON.parse(await readFile(new URL('../../data/v2/versions-m5.json', import.meta.url), 'utf8'));

const state = createInitialGameState(14000);
upgradeStateForBackup03(state);
upgradeStateForVersions(state);
state.flags.m4_home_reaction_seen = true;
state.flags.m5_v10_complete = true;
state.flags.m5_v26_entered = true;
state.flags.m5_v26_vera_met = true;
state.flags.m5_v26_evidence_door_seen = true;
state.flags.m5_v26_evidence_memory_seen = true;
state.flags.m5_v26_evidence_console_seen = true;
state.flags.m5_v26_controller_log_read = true;
state.flags.m5_v26_summary_read = true;
state.flags.m5_v26_room_log_read = true;
state.flags.m5_v26_order_solved = true;
state.flags.m5_v26_tamper_identified = true;
state.flags.m5_v26_audit_solved = true;
state.flags.m5_v26_clue_read = true;
state.flags.m5_v26_choice_made = true;
state.flags.m5_v26_returned_home = true;
state.flags.m5_v26_home_reaction_seen = true;
state.flags.m5_v26_complete = true;
state.checkpoint = 'm5_v26_complete';
assert.equal(isVersionUnlocked(state, versions, 'vera_4_1'), true, 'completed VERA_2_6 must unlock VERA_4_1');

const v41Ids = Object.values(SCENE_INTERACTION_IDS.backup41);
const priorIds = new Set([
  ...Object.values(SCENE_INTERACTION_IDS.home),
  ...Object.values(SCENE_INTERACTION_IDS.backup03),
  ...Object.values(SCENE_INTERACTION_IDS.backup10),
  ...Object.values(SCENE_INTERACTION_IDS.backup26)
]);
assert.equal(v41Ids.some(id => priorIds.has(id)), false, 'VERA_4_1 interactions must not collide with prior scenes');

const mounts = [];
const host = {
  writePlayerState(current) { current.player.position = [...current.player.position]; },
  mountScene(sceneId) { mounts.push(sceneId); }
};
const homeTransform = structuredClone(state.player);
const router = new SceneRouter(state, host);
assert.equal(router.enterBackup41(), true, 'VERA_4_1 route must enter from HOME');
assert.equal(router.enterBackup41(), false, 'duplicate VERA_4_1 entry must be rejected');
assert.equal(state.world.activeScene, BACKUP_41_SCENE, 'active scene must persist Containment Night');
assert.deepEqual(state.world.returnPoint?.player, homeTransform, 'Containment Night must preserve exact HOME return transform');
state.flags.m5_v41_entered = true;
state.flags.m5_v41_vera_met = true;
state.checkpoint = 'm5_v41_containment_night';

const filesystem = new FileSystemService(fsDefinition, state, new EventBus());
for (const evidence of versions.incidentReconstruction.evidence) {
  assert.equal(filesystem.exists(evidence.path), true, `${evidence.path} must be readable in Containment Night`);
}
assert.equal(filesystem.exists(V41_RESULT_PATH), false, 'incident reconstruction result must remain locked before provenance audit');

state.flags.m5_v41_evidence_bus_seen = true;
state.flags.m5_v41_evidence_memory_seen = true;
state.flags.m5_v41_evidence_containment_seen = true;
state.flags.m5_v41_bus_log_read = true;
state.flags.m5_v41_acl_log_read = true;
state.flags.m5_v41_departure_memory_read = true;
state.flags.m5_v41_shutdown_memory_read = true;
state.flags.m5_v41_morr_incident_read = true;
state.flags.m5_v41_morr_null_read = true;

const firstEvidence = versions.incidentReconstruction.evidence[0];
const secondEvidence = versions.incidentReconstruction.evidence[1];
setV41EvidenceSource(state, firstEvidence.id, firstEvidence.source, versions.incidentReconstruction);
setV41EvidenceSource(state, secondEvidence.id, secondEvidence.source, versions.incidentReconstruction);

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const partial = await saves.load('omega_autosave');
assert.ok(partial, 'save inside Containment Night must load');
upgradeStateForBackup03(partial);
upgradeStateForVersions(partial);
assert.equal(partial.world.activeScene, BACKUP_41_SCENE, 'upgrade chain must preserve reload inside VERA_4_1');
assert.equal(partial.checkpoint, 'm5_v41_containment_night', 'Containment Night checkpoint must survive compatibility upgrade');
assert.equal(Object.keys(parseV41Assignments(partial)).length, 2, 'partial provenance assignments must survive save/load');

for (const evidence of versions.incidentReconstruction.evidence) {
  setV41EvidenceSource(partial, evidence.id, evidence.source, versions.incidentReconstruction);
}
const evaluation = evaluateIncidentReconstruction(versions.incidentReconstruction, parseV41Assignments(partial));
assert.equal(evaluation.ok, true, 'correct provenance map must solve incident reconstruction');
assert.equal(filesystem.replaceState(partial), undefined, 'filesystem should accept restored Containment Night state');
assert.equal(filesystem.restoreFile(V41_RESULT_PATH), true, 'solved provenance audit must mount incident result');
partial.flags.m5_v41_puzzle_solved = true;
partial.flags.m5_v41_clue_read = true;
partial.flags.m5_v41_choice_made = true;
partial.flags.m5_v41_told_vera_null = true;
partial.checkpoint = 'm5_v41_return_home';
await saves.save('omega_autosave', partial);

const solved = await saves.load('omega_autosave');
assert.ok(solved, 'solved Containment Night save must load');
assert.equal(solved.filesystem.entries[V41_RESULT_PATH]?.deleted, false, 'incident result mount must persist');
assert.equal(solved.flags.m5_v41_told_vera_null, true, 'NULL disclosure choice must persist');

const returnRouter = new SceneRouter(solved, host);
assert.equal(returnRouter.returnHome(), true, 'Containment Night return must restore HOME');
assert.equal(returnRouter.returnHome(), false, 'duplicate HOME return must be rejected');
assert.equal(solved.world.activeScene, HOME_SCENE, 'Containment Night return must persist HOME');
assert.deepEqual(solved.player, homeTransform, 'Containment Night must restore exact HOME transform');
assert.equal(solved.world.returnPoint, undefined, 'successful final snapshot return must clear transient return point');
solved.flags.m5_v41_returned_home = true;
solved.flags.m5_v41_home_reaction_seen = true;
solved.flags.m5_v41_complete = true;
solved.checkpoint = 'm5_versions_complete';
await saves.save('omega_autosave', solved);

const afterReturn = await saves.load('omega_autosave');
assert.ok(afterReturn, 'post-Containment-Night save must load');
assert.equal(afterReturn.world.activeScene, HOME_SCENE, 'post-return reload must remain HOME');
assert.equal(afterReturn.flags.m5_v41_complete, true, 'final VERSIONS completion must persist');
assert.equal(afterReturn.checkpoint, 'm5_versions_complete', 'completed VERSIONS checkpoint must persist');

const fresh = createInitialGameState(14100);
upgradeStateForBackup03(fresh);
upgradeStateForVersions(fresh);
const freshFs = new FileSystemService(fsDefinition, fresh, new EventBus());
assert.equal(fresh.world.activeScene, HOME_SCENE, 'fresh game remains HOME');
assert.equal(fresh.flags.m5_v41_entered, false, 'fresh game must not invent VERA_4_1 progress');
assert.equal(freshFs.exists(V41_RESULT_PATH), false, 'fresh game keeps incident result locked');

assert.deepEqual(mounts, [BACKUP_41_SCENE, HOME_SCENE], 'Containment Night lifecycle must mount exactly once on enter and once on return');
console.log('M5 VERA 4.1 Containment Night regression: PASS');
