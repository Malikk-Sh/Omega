import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { EventBus } from '../../js/v2/runtime/core/EventBus.js';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import { MemorySaveAdapter, SaveManager } from '../../js/v2/runtime/core/SaveManager.js';
import { FileSystemService } from '../../js/v2/runtime/omega-os/FileSystemService.js';
import { WorldBindingSystem } from '../../js/v2/runtime/world/WorldBinding.js';
import { BACKUP_03_SCENE, HOME_SCENE, SCENE_INTERACTION_IDS, SceneRouter } from '../../js/v2/runtime/world/SceneRouter.js';
import {
  BACKUP_03_ARCHIVE_PATH,
  evaluateBackup03Classification,
  hasCompletedBackup03Samples,
  upgradeStateForBackup03
} from '../../js/v2/runtime/story/Backup03Protocol.js';

const fsDefinition = JSON.parse(await readFile(new URL('../../data/v2/filesystem-m4.json', import.meta.url), 'utf8'));
const bindingsDefinition = JSON.parse(await readFile(new URL('../../data/v2/world-bindings-m4.json', import.meta.url), 'utf8'));

const m3State = createInitialGameState(6000);
m3State.world.activeScene = 'apartment_home_m3';
m3State.flags.m1_intro_seen = true;
m3State.flags.m1_photo_inspected = true;
m3State.flags.m1_anomaly_seen = true;
m3State.flags.m2_photo_scanned = true;
m3State.flags.m2_log_recovered = true;
m3State.flags.m2_log_read = true;
m3State.flags.m2_choice_made = true;
m3State.flags.m2_told_vera = true;
m3State.flags.m3_trace_touched = true;
m3State.flags.m3_route_solved = true;
m3State.flags.m3_threshold_open = true;
m3State.flags.m3_null_contact = true;
m3State.flags.m3_contact_choice_made = true;
m3State.flags.m3_answered_null = true;
m3State.flags.null_affinity = 5;
m3State.filesystem.entries['/system/logs/recovery_1703.log'] = { deleted: false };
m3State.filesystem.entries['/system/processes/null_channel.proc'] = { deleted: false };
m3State.checkpoint = 'm3_threshold_complete';

const saves = new SaveManager(new MemorySaveAdapter());
await saves.save('omega_autosave', m3State);
const loadedM3 = await saves.load('omega_autosave');
assert.ok(loadedM3, 'M3 save must load without reset');
upgradeStateForBackup03(loadedM3);
assert.equal(loadedM3.world.activeScene, HOME_SCENE, 'legacy HOME scene must migrate to M4 HOME');
assert.equal(loadedM3.flags.m3_answered_null, true, 'M3 choice must survive M4 upgrade');
assert.equal(loadedM3.filesystem.entries['/system/processes/null_channel.proc']?.deleted, false, 'open M3 threshold channel must survive M4 upgrade');

const events = new EventBus();
const filesystem = new FileSystemService(fsDefinition, loadedM3, events);
const bindings = new WorldBindingSystem(bindingsDefinition, filesystem, events);
let thresholdVisible = null;
bindings.registerTarget('apartment.threshold_corridor', { setVisible(value) { thresholdVisible = value; } });
bindings.evaluateAll();
assert.equal(thresholdVisible, true, 'M3 threshold must remain available after migration');

const homeIds = new Set(Object.values(SCENE_INTERACTION_IDS.home));
const backupIds = Object.values(SCENE_INTERACTION_IDS.backup03);
assert.equal(backupIds.some(id => homeIds.has(id)), false, 'backup interaction IDs must not collide with HOME IDs');

const mounts = [];
const host = {
  writePlayerState(state) {
    state.player.position = [...state.player.position];
  },
  mountScene(sceneId) {
    mounts.push(sceneId);
  }
};
const router = new SceneRouter(loadedM3, host);
const homePosition = [...loadedM3.player.position];
assert.equal(router.enterBackup03(), true, 'open threshold should route into BACKUP_0_3');
assert.equal(router.enterBackup03(), false, 'repeated traversal input must not mount BACKUP_0_3 twice');
assert.equal(router.isTransitioning, false, 'router transition guard must release after a successful mount');
assert.equal(loadedM3.world.activeScene, BACKUP_03_SCENE, 'traversal must persist active backup scene');
assert.deepEqual(loadedM3.world.returnPoint?.player.position, homePosition, 'HOME return transform must be preserved');
assert.deepEqual(mounts, [BACKUP_03_SCENE], 'double traversal must still produce exactly one backup mount');

loadedM3.flags.m4_backup_entered = true;
loadedM3.flags.m4_vera03_met = true;
for (const flag of ['m4_sample_cup_seen', 'm4_sample_photo_seen', 'm4_sample_relay_seen']) loadedM3.flags[flag] = true;
assert.equal(hasCompletedBackup03Samples(loadedM3), true, 'all three physical samples must unlock classification');
assert.equal(evaluateBackup03Classification('service').ok, false, 'invalid SERVICE classification must be rejected');
assert.equal(filesystem.exists(BACKUP_03_ARCHIVE_PATH), false, 'wrong classification must not unlock archive');
assert.equal(evaluateBackup03Classification('memory').ok, true, 'HUMAN_CONTEXT must classify as MEMORY');
assert.equal(filesystem.restoreFile(BACKUP_03_ARCHIVE_PATH), true, 'valid classification must unlock archive');
loadedM3.flags.m4_classification_solved = true;
loadedM3.flags.m4_archive_read = true;
loadedM3.flags.m4_truth_choice_made = true;
loadedM3.flags.m4_told_vera03_future = true;
loadedM3.checkpoint = 'm4_return_home';

await saves.save('omega_autosave', loadedM3);
const loadedBackup = await saves.load('omega_autosave');
assert.ok(loadedBackup, 'M4 backup save should load');
assert.equal(loadedBackup.world.activeScene, BACKUP_03_SCENE, 'reload inside backup must stay in backup');
assert.equal(loadedBackup.flags.m4_vera03_met, true, 'V.E.R.A. 0.3 first encounter must persist');
assert.equal(loadedBackup.flags.m4_classification_solved, true, 'classification solution must persist');
assert.equal(loadedBackup.filesystem.entries[BACKUP_03_ARCHIVE_PATH]?.deleted, false, 'archive unlock must persist');

const returnRouter = new SceneRouter(loadedBackup, host);
assert.equal(returnRouter.returnHome(), true, 'backup threshold should return to HOME');
assert.equal(returnRouter.returnHome(), false, 'repeated return input must not mount HOME twice');
assert.equal(loadedBackup.world.activeScene, HOME_SCENE, 'return must restore HOME as active scene');
assert.deepEqual(loadedBackup.player.position, homePosition, 'return must restore HOME position');
let restoredThresholdVisible = null;
bindings.clearTargets();
filesystem.replaceState(loadedBackup);
bindings.registerTarget('apartment.threshold_corridor', { setVisible(value) { restoredThresholdVisible = value; } });
bindings.evaluateAll();
assert.equal(restoredThresholdVisible, true, 'returning HOME must restore existing M1-M3 bindings');

loadedBackup.flags.m4_returned_home = true;
loadedBackup.flags.m4_home_reaction_seen = true;
await saves.save('omega_autosave', loadedBackup);
const afterReturn = await saves.load('omega_autosave');
assert.ok(afterReturn, 'returned M4 save should load');
assert.equal(afterReturn.world.activeScene, HOME_SCENE, 'reload after return must not spawn in backup');
assert.equal(afterReturn.flags.m4_home_reaction_seen, true, 'current V.E.R.A. reaction must persist');

const failedEnterState = createInitialGameState(6500);
upgradeStateForBackup03(failedEnterState);
failedEnterState.player.position = [1.25, 1.62, -0.75];
const failedEnterPosition = [...failedEnterState.player.position];
const failedEnterMounts = [];
let failBackupMount = true;
const failedEnterRouter = new SceneRouter(failedEnterState, {
  writePlayerState() {},
  mountScene(sceneId) {
    failedEnterMounts.push(sceneId);
    if (sceneId === BACKUP_03_SCENE && failBackupMount) {
      failBackupMount = false;
      throw new Error('backup build failed');
    }
  }
});
assert.throws(() => failedEnterRouter.enterBackup03(), /backup build failed/, 'failed backup mount must surface its error');
assert.equal(failedEnterState.world.activeScene, HOME_SCENE, 'failed backup mount must roll canonical scene back to HOME');
assert.deepEqual(failedEnterState.player.position, failedEnterPosition, 'failed backup mount must restore HOME player transform');
assert.equal(failedEnterState.world.returnPoint, undefined, 'failed backup mount must not leave a stale return point');
assert.equal(failedEnterRouter.isTransitioning, false, 'failed mount must release the transition guard');
assert.deepEqual(failedEnterMounts, [BACKUP_03_SCENE, HOME_SCENE], 'failed backup mount must remount the previous HOME scene');
assert.equal(failedEnterRouter.enterBackup03(), true, 'router must allow a clean retry after rollback');
assert.equal(failedEnterState.world.activeScene, BACKUP_03_SCENE, 'retry after rollback must reach backup');

const failedReturnState = structuredClone(failedEnterState);
const failedReturnPoint = structuredClone(failedReturnState.world.returnPoint);
const failedReturnMounts = [];
let failHomeMount = true;
const failedReturnRouter = new SceneRouter(failedReturnState, {
  writePlayerState() {},
  mountScene(sceneId) {
    failedReturnMounts.push(sceneId);
    if (sceneId === HOME_SCENE && failHomeMount) {
      failHomeMount = false;
      throw new Error('home build failed');
    }
  }
});
assert.throws(() => failedReturnRouter.returnHome(), /home build failed/, 'failed HOME remount must surface its error');
assert.equal(failedReturnState.world.activeScene, BACKUP_03_SCENE, 'failed HOME mount must roll canonical scene back to backup');
assert.deepEqual(failedReturnState.world.returnPoint, failedReturnPoint, 'failed HOME mount must preserve the original HOME return point');
assert.equal(failedReturnRouter.isTransitioning, false, 'failed HOME mount must release the transition guard');
assert.deepEqual(failedReturnMounts, [HOME_SCENE, BACKUP_03_SCENE], 'failed HOME mount must remount the previous backup scene');
assert.equal(failedReturnRouter.returnHome(), true, 'HOME return must be retryable after rollback');
assert.equal(failedReturnState.world.activeScene, HOME_SCENE, 'retry after HOME rollback must succeed');
assert.equal(failedReturnState.world.returnPoint, undefined, 'successful HOME retry must consume the return point');

const resetState = createInitialGameState(7000);
upgradeStateForBackup03(resetState);
const resetFilesystem = new FileSystemService(fsDefinition, resetState, new EventBus());
assert.equal(resetState.world.activeScene, HOME_SCENE, 'new game must still initialize HOME');
assert.equal(resetFilesystem.exists('/system/processes/null_channel.proc'), false, 'new game must keep NULL channel closed');
assert.equal(resetFilesystem.exists(BACKUP_03_ARCHIVE_PATH), false, 'new game must keep backup archive locked');

assert.deepEqual(mounts, [BACKUP_03_SCENE, HOME_SCENE], 'normal scene lifecycle must mount exactly one backup and one HOME scene');
console.log('M4 BACKUP 0.3 regression: PASS');
