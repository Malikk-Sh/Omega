import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createInitialGameState } from "../../js/v2/runtime/core/GameState.js";
import {
  SEA_2017_INDEX_FIELD_IDS,
  evaluateSea2017Access,
  evaluateSeaIndex,
  parseSeaIndexAssignments,
  resetSeaIndexAssignments,
  setSeaIndexAssignment,
  upgradeStateForSea2017,
  validateSea2017Definition
} from "../../js/v2/runtime/story/Sea2017Protocol.js";

const definition = JSON.parse(await readFile(new URL("../../data/v2/sea-2017-m6.json", import.meta.url), "utf8"));
assert.deepEqual(validateSea2017Definition(definition), [], "authored Sea 2017 definition must validate");
assert.deepEqual(definition.index.fields.map(field => field.id), SEA_2017_INDEX_FIELD_IDS, "P12 must keep the five authored cross-media channels in order");
assert.equal(definition.access.minimumBackupClues, 3, "Sea 2017 must require at least three backup clues");

const state = createInitialGameState();
const originalScene = state.world.activeScene;
const originalCheckpoint = state.checkpoint;
upgradeStateForSea2017(state);
assert.equal(state.world.activeScene, originalScene, "M6 upgrader must not rewrite active scene");
assert.equal(state.checkpoint, originalCheckpoint, "M6 upgrader must not invent checkpoint progress");
assert.equal(state.flags.m6_sea_index_solved, false);
assert.equal(state.flags.m6_sea_index_attempts, 0);
assert.deepEqual(parseSeaIndexAssignments(state), {});

let access = evaluateSea2017Access(state, definition);
assert.equal(access.ok, false);
assert.deepEqual(access.missing.sort(), ["archive_key", "backup_clues", "sea_metadata"]);

state.flags.m4_archive_read = true;
state.flags.m5_v10_clue_read = true;
state.flags.m5_v26_clue_read = true;
access = evaluateSea2017Access(state, definition);
assert.equal(access.backupCluesFound, 3);
assert.equal(access.ok, false, "three backup clues alone must not bypass metadata and hidden archive key");

state.flags.m2_photo_scanned = true;
access = evaluateSea2017Access(state, definition);
assert.equal(access.ok, false);
assert.deepEqual(access.missing, ["archive_key"]);
state.flags.m6_archive_key_found = true;
access = evaluateSea2017Access(state, definition);
assert.equal(access.ok, true, "three backup clues + metadata + hidden archive key must unlock Sea 2017 access");

const beforeUnknown = state.flags.m6_sea_index_assignments;
setSeaIndexAssignment(state, definition, "unknown_channel", "x");
assert.equal(state.flags.m6_sea_index_assignments, beforeUnknown, "unknown field must not mutate assignment state");
setSeaIndexAssignment(state, definition, "date", "unknown_option");
assert.equal(state.flags.m6_sea_index_assignments, beforeUnknown, "unknown option must not mutate assignment state");

for (const field of definition.index.fields.slice(0, 4)) {
  setSeaIndexAssignment(state, definition, field.id, field.correctOptionId);
}
let evaluation = evaluateSeaIndex(definition, parseSeaIndexAssignments(state));
assert.equal(evaluation.ok, false);
assert.deepEqual(evaluation.missingFields, ["directory_order"], "partial five-channel solve must remain incomplete");

const orderField = definition.index.fields.find(field => field.id === "directory_order");
const wrongOrder = orderField.options.find(option => option.id !== orderField.correctOptionId);
setSeaIndexAssignment(state, definition, orderField.id, wrongOrder.id);
evaluation = evaluateSeaIndex(definition, parseSeaIndexAssignments(state));
assert.equal(evaluation.ok, false);
assert.deepEqual(evaluation.incorrectFields, ["directory_order"], "wrong complete reconstruction must identify the contradictory channel");
assert.equal(evaluation.rewardArchivePath, undefined, "wrong solve must not expose Morr final archive");

resetSeaIndexAssignments(state);
for (const field of definition.index.fields) {
  setSeaIndexAssignment(state, definition, field.id, field.correctOptionId);
}
evaluation = evaluateSeaIndex(definition, parseSeaIndexAssignments(state));
assert.equal(evaluation.ok, true);
assert.equal(evaluation.rewardArchivePath, "/archives/morr/final/sea_2017_final.msg");

const saved = JSON.parse(JSON.stringify(state));
upgradeStateForSea2017(saved);
assert.deepEqual(parseSeaIndexAssignments(saved), parseSeaIndexAssignments(state), "Sea Index assignments must survive save/load serialization");
assert.equal(evaluateSea2017Access(saved, definition).ok, true, "Sea 2017 access prerequisites must survive save/load");

saved.flags.m6_sea_index_assignments = "{broken";
assert.deepEqual(parseSeaIndexAssignments(saved), {}, "malformed legacy assignment payload must fail closed");

const invalidReveal = structuredClone(definition);
invalidReveal.revealBoundary.veraIsLiteralResurrection = true;
assert.ok(validateSea2017Definition(invalidReveal).some(error => error.includes("literal-resurrection")), "definition validation must protect the central identity boundary");

console.log("M6 SEA INDEX foundation regression: PASS");
