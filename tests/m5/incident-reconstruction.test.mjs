import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createInitialGameState } from '../../js/v2/runtime/core/GameState.js';
import {
  INCIDENT_SOURCES,
  evaluateIncidentReconstruction,
  parseV41Assignments,
  resetV41Assignments,
  setV41EvidenceSource,
  upgradeStateForVersions,
  validateVersionsDefinition
} from '../../js/v2/runtime/story/VersionsProtocol.js';

const versions = JSON.parse(await readFile(new URL('../../data/v2/versions-m5.json', import.meta.url), 'utf8'));
assert.deepEqual(validateVersionsDefinition(versions), [], 'M5 authored data including incident reconstruction must validate');

const state = createInitialGameState(13000);
upgradeStateForVersions(state);
const incident = versions.incidentReconstruction;
assert.equal(incident.evidence.length, 6, 'P11 should provide six evidence items across three provenance classes');
for (const source of INCIDENT_SOURCES) {
  assert.equal(incident.evidence.filter(item => item.source === source).length, 2, `P11 should balance ${source} evidence`);
}

let evaluation = evaluateIncidentReconstruction(incident, {});
assert.equal(evaluation.ok, false, 'empty incident reconstruction must fail');
assert.equal(evaluation.missing.length, 6, 'empty reconstruction must report all missing evidence');

for (const item of incident.evidence.slice(0, 5)) setV41EvidenceSource(state, item.id, item.source, incident);
evaluation = evaluateIncidentReconstruction(incident, parseV41Assignments(state));
assert.equal(evaluation.ok, false, 'partial source classification must fail');
assert.equal(evaluation.missing.length, 1, 'partial source classification must identify one missing item');

const last = incident.evidence[5];
setV41EvidenceSource(state, last.id, 'direct_telemetry', incident);
evaluation = evaluateIncidentReconstruction(incident, parseV41Assignments(state));
assert.equal(evaluation.ok, false, 'wrong provenance must fail even after all items are classified');
assert.equal(evaluation.mismatched.includes(last.id), true, 'wrong provenance must identify the contradictory evidence item');

setV41EvidenceSource(state, 'unknown_evidence', 'morr_note', incident);
assert.equal(Object.keys(parseV41Assignments(state)).includes('unknown_evidence'), false, 'unknown evidence IDs must not mutate state');
setV41EvidenceSource(state, last.id, 'unknown_source', incident);
assert.notEqual(parseV41Assignments(state)[last.id], 'unknown_source', 'unknown source categories must not mutate state');

setV41EvidenceSource(state, last.id, last.source, incident);
evaluation = evaluateIncidentReconstruction(incident, parseV41Assignments(state));
assert.equal(evaluation.ok, true, 'correct source reliability assignment must solve P11');
assert.equal(evaluation.rewardClue, 'v41_external_control_and_null_creation', 'P11 reward clue must be deterministic');
assert.equal(parseV41Assignments(state).external_bus_write, 'direct_telemetry', 'direct telemetry assignment must persist');
assert.equal(parseV41Assignments(state).departure_memory, 'vera_reconstruction', 'VERA reconstruction assignment must persist');
assert.equal(parseV41Assignments(state).morr_null_spec, 'morr_note', 'Morr note assignment must persist');

resetV41Assignments(state);
assert.deepEqual(parseV41Assignments(state), {}, 'assignment reset must clear P11 state');
console.log('M5 VERA 4.1 incident reconstruction regression: PASS');
