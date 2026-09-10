import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { upgradeStateForBackup03 } from '../../js/v2/runtime/story/Backup03Protocol.js';
import {
  V10_AUDIT_CLUE_PATH,
  V10_SOURCE_RECORD_PATH,
  evaluateSyntheticPhotoSelection,
  parseV10SelectedElements,
  toggleV10SelectedElement,
  upgradeStateForVersions
} from '../../js/v2/runtime/story/VersionsProtocol.js';
import {
  BACKUP_10_SCENE,
  HOME_SCENE,
  SCENE_INTERACTION_IDS,
  SceneRouter
} from '../../js/v2/runtime/world/SceneRouter.js';
import { isVersionUnlocked } from '../../js/v2/runtime/story/VersionsProtocol.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m5.json', import.meta.url), 'utf8'));
const versions = JSON.parse(await readFile(new URL('../../data/v2/versions-m5.json', import.meta.url), 'utf8'));

const state = createInitialGameState(9000);
upgradeStateForBackup03(state);
upgradeStateForVersions(state);
state.flags.m3_contact_choice_made = true;
state.flags.m4_backup_entered = true;
state.flags.m4_vera03_met = true;
state.flags.m4_classification_solved = true;
state.flags.m4_archive_read = true;
state.flags.m4_truth_choice_made = true;
state.flags.m4_returned_home = true;
state.flags.m4_home_reaction_seen = true;
state.checkpoint = 'm4_backup_complete';
assert.equal(isVersionUnlocked(state, versions, 'vera_1_0'), true, 'completed M4 must unlock VERA_1_0');

const backup10Ids = Object.values(SCENE_INTERACTION_IDS.backup10);
const existingIds = new Set([
  ...Object.values(SCENE_INTERACTION_IDS.home),
  ...Object.values(SCENE_INTERACTION_IDS.backup03)
]);
assert.equal(backup10Ids.some(id => existingIds.has(id)), false, 'VERA_1_0 interaction IDs must not collide with HOME or VERA_0_3');

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
assert.equal(router.enterBackup10(), true, 'VERA_1_0 route must enter from HOME');
assert.equal(router.enterBackup10(), false, 'duplicate VERA_1_0 enter must be rejected');
assert.equal(state.world.activeScene, BACKUP_10_SCENE, 'active scene must persist VERA_1_0');
assert.deepEqual(state.world.returnPoint?.player, homeTransform, 'VERA_1_0 must preserve exact HOME return transform');
state.flags.m5_v10_entered = true;
state.flags.m5_v10_vera_met = true;
state.checkpoint = 'm5_v10_summer_house';

const filesystem = new FileSystemService(fsDefinition, state, new EventBus());
assert.equal(filesystem.exists(V10_SOURCE_RECORD_PATH), true, 'VERA_1_0 source record must be available on entry');
assert.equal(filesystem.exists(V10_AUDIT_CLUE_PATH), false, 'VERA_1_0 audit clue must start locked');

state.flags.m5_v10_source_read = true;
state.flags.m5_v10_photo_inspected = true;
toggleV10SelectedElement(state, 'red_ribbon');
assert.deepEqual(parseV10SelectedElements(state), ['red_ribbon'], 'physical selection must persist by stable evidence ID');
let evaluation = evaluateSyntheticPhotoSelection(versions.syntheticPhotograph, parseV10SelectedElements(state));
assert.equal(evaluation.ok, false, 'one generated association must not solve the audit');
assert.deepEqual(evaluation.missing, ['sea_shell'], 'partial audit must identify the missing generated association');

toggleV10SelectedElement(state, 'wall_clock');
evaluation = evaluateSyntheticPhotoSelection(versions.syntheticPhotograph, parseV10SelectedElements(state));
assert.equal(evaluation.ok, false, 'source-verified wall clock must make the selection invalid');
assert.deepEqual(evaluation.extra, ['wall_clock'], 'verified object must be reported as extra');
toggleV10SelectedElement(state, 'wall_clock');
toggleV10SelectedElement(state, 'sea_shell');
evaluation = evaluateSyntheticPhotoSelection(versions.syntheticPhotograph, parseV10SelectedElements(state));
assert.equal(evaluation.ok, true, 'red ribbon plus sea shell must solve the reconstruction audit');
assert.equal(filesystem.restoreFile(V10_AUDIT_CLUE_PATH), true, 'successful audit must mount reconstruction clue');
state.flags.m5_v10_puzzle_solved = true;
state.flags.m5_v10_clue_read = true;
state.flags.m5_v10_choice_made = true;
state.flags.m5_v10_told_vera_generated = true;
state.checkpoint = 'm5_v10_return_home';

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const loadedInside = await saves.load('omega_autosave');
assert.ok(loadedInside, 'save inside Summer House must load');
upgradeStateForBackup03(loadedInside);
upgradeStateForVersions(loadedInside);
assert.equal(loadedInside.world.activeScene, BACKUP_10_SCENE, 'M4+M5 upgrade chain must preserve reload inside VERA_1_0');
assert.equal(loadedInside.checkpoint, 'm5_v10_return_home', 'M4 upgrader must not rewrite later-version checkpoint');
assert.deepEqual(parseV10SelectedElements(loadedInside), ['red_ribbon', 'sea_shell'], 'audit element selection must survive save/load');
assert.equal(loadedInside.filesystem.entries[V10_AUDIT_CLUE_PATH]?.deleted, false, 'mounted reconstruction audit must survive save/load');

const returnRouter = new SceneRouter(loadedInside, host);
assert.equal(returnRouter.returnHome(), true, 'Summer House return portal must restore HOME');
assert.equal(returnRouter.returnHome(), false, 'duplicate HOME return must be rejected');
assert.equal(loadedInside.world.activeScene, HOME_SCENE, 'Summer House return must persist HOME');
assert.deepEqual(loadedInside.player, homeTransform, 'Summer House return must restore the exact HOME transform');
assert.equal(loadedInside.world.returnPoint, undefined, 'successful return must clear transient return point');

loadedInside.flags.m5_v10_returned_home = true;
loadedInside.flags.m5_v10_home_reaction_seen = true;
loadedInside.flags.m5_v10_complete = true;
assert.equal(isVersionUnlocked(loadedInside, versions, 'vera_2_6'), true, 'completed VERA_1_0 must unlock VERA_2_6 in authored graph');
await saves.save('omega_autosave', loadedInside);
const afterReturn = await saves.load('omega_autosave');
assert.ok(afterReturn, 'post-Summer-House save must load');
assert.equal(afterReturn.world.activeScene, HOME_SCENE, 'post-return reload must remain in HOME');
assert.equal(afterReturn.flags.m5_v10_complete, true, 'VERA_1_0 completion must persist');

const fresh = createInitialGameState(9100);
upgradeStateForBackup03(fresh);
upgradeStateForVersions(fresh);
const freshFs = new FileSystemService(fsDefinition, fresh, new EventBus());
assert.equal(fresh.world.activeScene, HOME_SCENE, 'fresh game remains HOME');
assert.equal(fresh.flags.m5_v10_entered, false, 'fresh game must not invent VERA_1_0 progress');
assert.equal(freshFs.exists(V10_AUDIT_CLUE_PATH), false, 'fresh game keeps reconstruction audit locked');

assert.deepEqual(mounts, [BACKUP_10_SCENE, HOME_SCENE], 'Summer House lifecycle must produce exactly one enter mount and one return mount');
console.log('M5 VERA 1.0 Summer House regression: PASS');
