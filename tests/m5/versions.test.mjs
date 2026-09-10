import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { upgradeStateForBackup03 } from '../../js/v2/runtime/story/Backup03Protocol.js';
import {
  deriveGeneratedElements,
  evaluateSyntheticPhotoSelection,
  getUnlockedVersionIds,
  isVersionUnlocked,
  upgradeStateForVersions,
  validateVersionsDefinition
} from '../../js/v2/runtime/story/VersionsProtocol.js';
import { HOME_SCENE } from '../../js/v2/runtime/world/SceneRouter.js';
import {
  listRoutableVersions,
  resolveVersionRoute,
  validateVersionRouteTargets
} from '../../js/v2/runtime/world/VersionRoute.js';

const definition = JSON.parse(await readFile(new URL('../../data/v2/versions-m5.json', import.meta.url), 'utf8'));
assert.deepEqual(validateVersionsDefinition(definition), [], 'M5 authored version definition must validate');
assert.deepEqual(validateVersionRouteTargets(definition), [], 'M5 version scene targets must be unique and distinct from HOME');

const state = createInitialGameState(8000);
upgradeStateForBackup03(state);
state.world.activeScene = HOME_SCENE;
state.flags.m3_contact_choice_made = true;
state.flags.m4_backup_entered = true;
state.flags.m4_vera03_met = true;
state.flags.m4_classification_solved = true;
state.flags.m4_archive_read = true;
state.flags.m4_truth_choice_made = true;
state.flags.m4_returned_home = true;
state.flags.m4_home_reaction_seen = true;
const preservedM4Checkpoint = state.checkpoint;

upgradeStateForVersions(state);
assert.equal(state.world.activeScene, HOME_SCENE, 'M5 state upgrade must not move an existing M4 save to another scene');
assert.equal(state.flags.m4_home_reaction_seen, true, 'M5 state upgrade must preserve completed M4 knowledge');
assert.equal(state.checkpoint, preservedM4Checkpoint, 'M5 state upgrade must not rewrite the active checkpoint');
assert.equal(state.flags.m5_v10_puzzle_solved, false, 'M5 VERA_1_0 puzzle must start unsolved');

assert.deepEqual(
  getUnlockedVersionIds(state, definition),
  ['vera_0_3', 'vera_1_0'],
  'completed M4 should expose VERA_1_0 while keeping VERA_2_6 and VERA_4_1 locked'
);
assert.equal(isVersionUnlocked(state, definition, 'vera_1_0'), true, 'VERA_1_0 must unlock after M4 reconciliation');
assert.equal(isVersionUnlocked(state, definition, 'vera_2_6'), false, 'VERA_2_6 must remain locked before VERA_1_0 completion');

assert.deepEqual(
  listRoutableVersions(state, definition).map(route => route.versionId),
  ['vera_0_3', 'vera_1_0'],
  'route layer must expose only versions unlocked by canonical state'
);
assert.equal(resolveVersionRoute(state, definition, 'vera_1_0').route?.sceneId, 'backup_1_0', 'VERA_1_0 must resolve to its authored scene target');
const lockedRoute = resolveVersionRoute(state, definition, 'vera_2_6');
assert.equal(lockedRoute.ok, false, 'route layer must reject a locked version even when its scene metadata exists');
assert.match(lockedRoute.message, /m5_v10_complete/, 'locked route response must identify the canonical unlock flag');

state.flags.m5_v10_complete = true;
assert.deepEqual(
  getUnlockedVersionIds(state, definition),
  ['vera_0_3', 'vera_1_0', 'vera_2_6'],
  'completing VERA_1_0 must unlock VERA_2_6 only'
);
assert.equal(resolveVersionRoute(state, definition, 'vera_2_6').route?.sceneId, 'backup_2_6', 'newly unlocked VERA_2_6 must become routable without router-specific hardcoding');
state.flags.m5_v26_complete = true;
assert.deepEqual(
  getUnlockedVersionIds(state, definition),
  ['vera_0_3', 'vera_1_0', 'vera_2_6', 'vera_4_1'],
  'completing VERA_2_6 must unlock the final VERA_4_1 snapshot'
);
assert.equal(resolveVersionRoute(state, definition, 'vera_4_1').route?.returnSceneId, HOME_SCENE, 'all version routes must return through canonical HOME');

const evidence = definition.syntheticPhotograph;
assert.deepEqual(
  deriveGeneratedElements(evidence),
  ['red_ribbon', 'sea_shell'],
  'synthetic photo solution must be derived from rendered minus source-verified elements'
);

const partial = evaluateSyntheticPhotoSelection(evidence, ['red_ribbon']);
assert.equal(partial.ok, false, 'partial anomaly selection must be rejected');
assert.deepEqual(partial.missing, ['sea_shell'], 'partial selection must identify the remaining generated element');

const overSelected = evaluateSyntheticPhotoSelection(evidence, ['red_ribbon', 'sea_shell', 'wall_clock']);
assert.equal(overSelected.ok, false, 'selecting a verified source element as generated must be rejected');
assert.deepEqual(overSelected.extra, ['wall_clock'], 'audit feedback must expose the incorrectly selected verified element');

const unknown = evaluateSyntheticPhotoSelection(evidence, ['red_ribbon', 'sea_shell', 'missing_prop']);
assert.equal(unknown.ok, false, 'unknown rendered element IDs must never solve the audit');
assert.match(unknown.message, /unknown rendered element/, 'unknown element rejection must be descriptive');

const solved = evaluateSyntheticPhotoSelection(evidence, ['sea_shell', 'red_ribbon', 'red_ribbon']);
assert.equal(solved.ok, true, 'correct generated elements must solve regardless of selection order or duplicate taps');
assert.equal(solved.rewardClue, 'v10_reconstruction_layer_detected', 'valid audit must issue the authored clue ID');

state.flags.m5_v10_entered = true;
state.flags.m5_v10_vera_met = true;
state.flags.m5_v10_photo_inspected = true;
state.flags.m5_v10_source_read = true;
state.flags.m5_v10_photo_attempts = 3;
state.flags.m5_v10_puzzle_solved = true;
state.flags.m5_v10_clue_read = true;
state.flags.m5_v10_choice_made = true;
const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', state);
const loaded = await saves.load('omega_autosave');
assert.ok(loaded, 'M5 foundation save should load');
upgradeStateForVersions(loaded);
assert.equal(loaded.flags.m5_v10_puzzle_solved, true, 'VERA_1_0 puzzle state must persist');
assert.equal(loaded.flags.m5_v10_photo_attempts, 3, 'synthetic photo audit attempts must persist');
assert.equal(loaded.flags.m4_home_reaction_seen, true, 'M4 completion must remain intact after M5 save/load');

const legacyM4 = createInitialGameState(8100);
upgradeStateForBackup03(legacyM4);
legacyM4.flags.m4_home_reaction_seen = true;
upgradeStateForVersions(legacyM4);
assert.equal(legacyM4.flags.m5_v10_entered, false, 'upgrading an older M4 save must add M5 defaults without fake progress');
assert.equal(isVersionUnlocked(legacyM4, definition, 'vera_1_0'), true, 'an upgraded completed-M4 save must immediately expose VERA_1_0');
assert.deepEqual(listRoutableVersions(legacyM4, definition).map(route => route.sceneId), ['backup_1_0'], 'legacy completed-M4 save must route only to VERA_1_0 until the older M3 route flag is present');

console.log('M5 VERSIONS foundation regression: PASS');
