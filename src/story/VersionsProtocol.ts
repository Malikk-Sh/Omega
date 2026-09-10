import type { OmegaGameState } from "../core/GameState.js";

export type VeraVersionId = "vera_0_3" | "vera_1_0" | "vera_2_6" | "vera_4_1";

export const V10_SOURCE_RECORD_PATH = "/backups/vera_1_0/source/photo_SH-1024-A.record";
export const V10_AUDIT_CLUE_PATH = "/backups/vera_1_0/audit/reconstruction_layer.log";
export const V10_PHOTO_ELEMENT_IDS = ["window_rain", "wall_clock", "tea_cup", "red_ribbon", "sea_shell"] as const;
export type V10PhotoElementId = typeof V10_PHOTO_ELEMENT_IDS[number];

export const V26_AUDIT_ROOT = "/backups/vera_2_6/audit";
export const V26_CONTROLLER_TRACE_PATH = `${V26_AUDIT_ROOT}/controller_trace.log`;
export const V26_OPERATOR_SUMMARY_PATH = `${V26_AUDIT_ROOT}/operator_summary.log`;
export const V26_ROOM_STATE_PATH = `${V26_AUDIT_ROOT}/room_state.log`;
export const V26_RESULT_PATH = "/backups/vera_2_6/result/forced_rollback.result";
export const V26_PHYSICAL_EVIDENCE_FLAGS = [
  "m5_v26_evidence_door_seen",
  "m5_v26_evidence_memory_seen",
  "m5_v26_evidence_console_seen"
] as const;
export const V26_REQUIRED_LOG_FLAGS = [
  "m5_v26_controller_log_read",
  "m5_v26_summary_read",
  "m5_v26_room_log_read"
] as const;

export const V41_EVIDENCE_ROOT = "/backups/vera_4_1/evidence";
export const V41_RESULT_PATH = "/backups/vera_4_1/result/incident_reconstruction.result";
export const V41_PHYSICAL_EVIDENCE_FLAGS = [
  "m5_v41_evidence_bus_seen",
  "m5_v41_evidence_memory_seen",
  "m5_v41_evidence_containment_seen"
] as const;
export const V41_REQUIRED_LOG_FLAGS = [
  "m5_v41_bus_log_read",
  "m5_v41_acl_log_read",
  "m5_v41_departure_memory_read",
  "m5_v41_shutdown_memory_read",
  "m5_v41_morr_incident_read",
  "m5_v41_morr_null_read"
] as const;

export type IncidentSource = "direct_telemetry" | "vera_reconstruction" | "morr_note";
export const INCIDENT_SOURCES: IncidentSource[] = ["direct_telemetry", "vera_reconstruction", "morr_note"];

export interface VeraVersionDefinition {
  id: VeraVersionId;
  label: string;
  sceneId: string;
  environment: "sandbox" | "summer_house" | "research_office" | "containment_night";
  puzzle: "classification_token" | "synthetic_photograph" | "rollback_audit" | "incident_reconstruction";
  unlockFlag: string;
  completionFlag: string;
}

export interface SyntheticPhotographDefinition {
  id: string;
  sourceRecord: {
    captureId: string;
    captured: string;
    camera: string;
    verifiedElements: string[];
  };
  renderedElements: string[];
  generatedElements: string[];
  rewardClue: string;
}

export interface RollbackCommandDefinition {
  id: string;
  label: string;
  effect: string;
}

export interface RollbackRecordDefinition {
  id: string;
  label: string;
  editedAfterRollback: boolean;
}

export interface RollbackAuditDefinition {
  id: string;
  commands: RollbackCommandDefinition[];
  expectedOrder: string[];
  records: RollbackRecordDefinition[];
  tamperedRecordId: string;
  rewardClue: string;
}

export interface IncidentEvidenceDefinition {
  id: string;
  label: string;
  path: string;
  source: IncidentSource;
}

export interface IncidentReconstructionDefinition {
  id: string;
  evidence: IncidentEvidenceDefinition[];
  rewardClue: string;
}

export interface VersionsDefinition {
  versions: VeraVersionDefinition[];
  syntheticPhotograph: SyntheticPhotographDefinition;
  rollbackAudit: RollbackAuditDefinition;
  incidentReconstruction: IncidentReconstructionDefinition;
}

export interface SyntheticPhotoEvaluation {
  ok: boolean;
  message: string;
  generated: string[];
  missing: string[];
  extra: string[];
  rewardClue?: string;
}

export interface RollbackOrderEvaluation {
  ok: boolean;
  message: string;
  expectedLength: number;
  selectedLength: number;
  firstMismatchIndex?: number;
}

export interface TamperedRecordEvaluation {
  ok: boolean;
  message: string;
  rewardClue?: string;
}

export interface IncidentClassificationEvaluation {
  ok: boolean;
  message: string;
  missing: string[];
  mismatched: string[];
  rewardClue?: string;
}

const EXPECTED_VERSION_ORDER: VeraVersionId[] = ["vera_0_3", "vera_1_0", "vera_2_6", "vera_4_1"];

export function upgradeStateForVersions(state: OmegaGameState): void {
  const booleanDefaults: Record<string, boolean> = {
    m5_versions_index_seen: false,
    m5_v10_entered: false,
    m5_v10_vera_met: false,
    m5_v10_photo_inspected: false,
    m5_v10_source_read: false,
    m5_v10_puzzle_solved: false,
    m5_v10_clue_read: false,
    m5_v10_choice_made: false,
    m5_v10_told_vera_generated: false,
    m5_v10_withheld_generated: false,
    m5_v10_returned_home: false,
    m5_v10_home_reaction_seen: false,
    m5_v10_complete: false,
    m5_v26_entered: false,
    m5_v26_vera_met: false,
    m5_v26_evidence_door_seen: false,
    m5_v26_evidence_memory_seen: false,
    m5_v26_evidence_console_seen: false,
    m5_v26_controller_log_read: false,
    m5_v26_summary_read: false,
    m5_v26_room_log_read: false,
    m5_v26_order_solved: false,
    m5_v26_tamper_identified: false,
    m5_v26_audit_solved: false,
    m5_v26_clue_read: false,
    m5_v26_choice_made: false,
    m5_v26_told_vera_forced: false,
    m5_v26_withheld_forced: false,
    m5_v26_returned_home: false,
    m5_v26_home_reaction_seen: false,
    m5_v26_complete: false,
    m5_v41_entered: false,
    m5_v41_vera_met: false,
    m5_v41_evidence_bus_seen: false,
    m5_v41_evidence_memory_seen: false,
    m5_v41_evidence_containment_seen: false,
    m5_v41_bus_log_read: false,
    m5_v41_acl_log_read: false,
    m5_v41_departure_memory_read: false,
    m5_v41_shutdown_memory_read: false,
    m5_v41_morr_incident_read: false,
    m5_v41_morr_null_read: false,
    m5_v41_puzzle_solved: false,
    m5_v41_clue_read: false,
    m5_v41_choice_made: false,
    m5_v41_told_vera_null: false,
    m5_v41_withheld_null: false,
    m5_v41_returned_home: false,
    m5_v41_home_reaction_seen: false,
    m5_v41_complete: false
  };
  for (const [flag, fallback] of Object.entries(booleanDefaults)) {
    if (typeof state.flags[flag] !== "boolean") state.flags[flag] = fallback;
  }
  if (typeof state.flags.m5_v10_photo_attempts !== "number") state.flags.m5_v10_photo_attempts = 0;
  if (typeof state.flags.m5_v10_selected_elements !== "string") state.flags.m5_v10_selected_elements = "";
  if (typeof state.flags.m5_v26_audit_attempts !== "number") state.flags.m5_v26_audit_attempts = 0;
  if (typeof state.flags.m5_v26_command_order !== "string") state.flags.m5_v26_command_order = "";
  if (typeof state.flags.m5_v41_attempts !== "number") state.flags.m5_v41_attempts = 0;
  if (typeof state.flags.m5_v41_assignments !== "string") state.flags.m5_v41_assignments = "";
}

export function validateVersionsDefinition(definition: VersionsDefinition): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const sceneIds = new Set<string>();

  for (const version of definition.versions) {
    if (ids.has(version.id)) errors.push(`Duplicate version id '${version.id}'.`);
    ids.add(version.id);
    if (sceneIds.has(version.sceneId)) errors.push(`Duplicate version sceneId '${version.sceneId}'.`);
    sceneIds.add(version.sceneId);
    if (!version.unlockFlag) errors.push(`Version '${version.id}' is missing unlockFlag.`);
    if (!version.completionFlag) errors.push(`Version '${version.id}' is missing completionFlag.`);
  }

  const actualOrder = definition.versions.map(version => version.id);
  if (actualOrder.length !== EXPECTED_VERSION_ORDER.length || actualOrder.some((id, index) => id !== EXPECTED_VERSION_ORDER[index])) {
    errors.push(`Version order must be ${EXPECTED_VERSION_ORDER.join(" -> ")}.`);
  }

  const evidence = definition.syntheticPhotograph;
  if (!evidence.id) errors.push("Synthetic photograph is missing id.");
  if (new Set(evidence.renderedElements).size !== evidence.renderedElements.length) errors.push("Synthetic photograph renderedElements contain duplicates.");
  if (new Set(evidence.sourceRecord.verifiedElements).size !== evidence.sourceRecord.verifiedElements.length) errors.push("Synthetic photograph verifiedElements contain duplicates.");
  const derived = deriveGeneratedElements(evidence);
  if (!sameSet(derived, evidence.generatedElements)) {
    errors.push("Synthetic photograph generatedElements do not match rendered minus source-verified elements.");
  }

  const rollback = definition.rollbackAudit;
  if (!rollback?.id) errors.push("Rollback audit is missing id.");
  const commandIds = rollback?.commands.map(command => command.id) ?? [];
  if (new Set(commandIds).size !== commandIds.length) errors.push("Rollback audit command IDs contain duplicates.");
  if (!sameOrderedSet(commandIds, rollback?.expectedOrder ?? [])) errors.push("Rollback audit expectedOrder must contain every authored command exactly once.");
  const recordIds = rollback?.records.map(record => record.id) ?? [];
  if (new Set(recordIds).size !== recordIds.length) errors.push("Rollback audit record IDs contain duplicates.");
  const editedRecords = rollback?.records.filter(record => record.editedAfterRollback).map(record => record.id) ?? [];
  if (editedRecords.length !== 1 || editedRecords[0] !== rollback?.tamperedRecordId) {
    errors.push("Rollback audit must identify exactly one record edited after rollback, matching tamperedRecordId.");
  }

  const incident = definition.incidentReconstruction;
  if (!incident?.id) errors.push("Incident reconstruction is missing id.");
  const incidentIds = incident?.evidence.map(item => item.id) ?? [];
  const incidentPaths = incident?.evidence.map(item => item.path) ?? [];
  if (new Set(incidentIds).size !== incidentIds.length) errors.push("Incident reconstruction evidence IDs contain duplicates.");
  if (new Set(incidentPaths).size !== incidentPaths.length) errors.push("Incident reconstruction evidence paths contain duplicates.");
  if ((incident?.evidence.length ?? 0) < 3) errors.push("Incident reconstruction requires at least three evidence items.");
  for (const item of incident?.evidence ?? []) {
    if (!INCIDENT_SOURCES.includes(item.source)) errors.push(`Incident evidence '${item.id}' has invalid source '${item.source}'.`);
    if (!item.path.startsWith(`${V41_EVIDENCE_ROOT}/`)) errors.push(`Incident evidence '${item.id}' must live under VERA_4_1 evidence root.`);
  }
  for (const source of INCIDENT_SOURCES) {
    if (!(incident?.evidence ?? []).some(item => item.source === source)) errors.push(`Incident reconstruction requires source category '${source}'.`);
  }
  return errors;
}

export function getUnlockedVersionIds(state: OmegaGameState, definition: VersionsDefinition): VeraVersionId[] {
  return definition.versions
    .filter(version => state.flags[version.unlockFlag] === true)
    .map(version => version.id);
}

export function isVersionUnlocked(state: OmegaGameState, definition: VersionsDefinition, versionId: VeraVersionId): boolean {
  const version = definition.versions.find(candidate => candidate.id === versionId);
  return !!version && state.flags[version.unlockFlag] === true;
}

export function deriveGeneratedElements(evidence: SyntheticPhotographDefinition): string[] {
  const verified = new Set(evidence.sourceRecord.verifiedElements);
  return evidence.renderedElements.filter(element => !verified.has(element));
}

export function parseV10SelectedElements(state: OmegaGameState): string[] {
  const raw = typeof state.flags.m5_v10_selected_elements === "string" ? state.flags.m5_v10_selected_elements : "";
  return raw.split(",").map(value => value.trim()).filter(Boolean);
}

export function toggleV10SelectedElement(state: OmegaGameState, elementId: string): string[] {
  const selected = new Set(parseV10SelectedElements(state));
  if (selected.has(elementId)) selected.delete(elementId);
  else selected.add(elementId);
  const next = [...selected];
  state.flags.m5_v10_selected_elements = next.join(",");
  return next;
}

export function evaluateSyntheticPhotoSelection(
  evidence: SyntheticPhotographDefinition,
  selectedElements: string[]
): SyntheticPhotoEvaluation {
  const rendered = new Set(evidence.renderedElements);
  const selected = [...new Set(selectedElements)];
  const unknown = selected.filter(element => !rendered.has(element));
  const generated = deriveGeneratedElements(evidence);
  const expected = new Set(generated);
  const missing = generated.filter(element => !selected.includes(element));
  const extra = selected.filter(element => !expected.has(element));

  if (unknown.length > 0) {
    return {
      ok: false,
      message: `AUDIT REJECTED // unknown rendered element: ${unknown.join(", ")}`,
      generated,
      missing,
      extra
    };
  }

  if (missing.length > 0 || extra.length > 0) {
    return {
      ok: false,
      message: "AUDIT INCOMPLETE // compare rendered objects against source-verified capture elements",
      generated,
      missing,
      extra
    };
  }

  return {
    ok: true,
    message: "AUDIT ACCEPTED // reconstruction layer contains generated associations",
    generated,
    missing: [],
    extra: [],
    rewardClue: evidence.rewardClue
  };
}

export function hasCompletedV26PhysicalEvidence(state: OmegaGameState): boolean {
  return V26_PHYSICAL_EVIDENCE_FLAGS.every(flag => state.flags[flag] === true);
}

export function hasReadV26AuditLogs(state: OmegaGameState): boolean {
  return V26_REQUIRED_LOG_FLAGS.every(flag => state.flags[flag] === true);
}

export function parseV26CommandOrder(state: OmegaGameState): string[] {
  const raw = typeof state.flags.m5_v26_command_order === "string" ? state.flags.m5_v26_command_order : "";
  return raw.split(",").map(value => value.trim()).filter(Boolean);
}

export function appendV26Command(state: OmegaGameState, commandId: string, definition: RollbackAuditDefinition): string[] {
  const validIds = new Set(definition.commands.map(command => command.id));
  const current = parseV26CommandOrder(state);
  if (!validIds.has(commandId) || current.includes(commandId) || current.length >= definition.commands.length) return current;
  const next = [...current, commandId];
  state.flags.m5_v26_command_order = next.join(",");
  return next;
}

export function resetV26CommandOrder(state: OmegaGameState): void {
  state.flags.m5_v26_command_order = "";
}

export function evaluateRollbackOrder(definition: RollbackAuditDefinition, selectedOrder: string[]): RollbackOrderEvaluation {
  const expected = definition.expectedOrder;
  if (selectedOrder.length !== expected.length) {
    return {
      ok: false,
      message: `ORDER INCOMPLETE // ${selectedOrder.length}/${expected.length} commands reconstructed`,
      expectedLength: expected.length,
      selectedLength: selectedOrder.length
    };
  }
  const mismatch = expected.findIndex((commandId, index) => selectedOrder[index] !== commandId);
  if (mismatch >= 0) {
    return {
      ok: false,
      message: `ORDER REJECTED // first contradiction at sequence position ${mismatch + 1}`,
      expectedLength: expected.length,
      selectedLength: selectedOrder.length,
      firstMismatchIndex: mismatch
    };
  }
  return {
    ok: true,
    message: "ORDER ACCEPTED // forced rollback execution chain reconstructed",
    expectedLength: expected.length,
    selectedLength: selectedOrder.length
  };
}

export function evaluateTamperedRecord(definition: RollbackAuditDefinition, recordId: string): TamperedRecordEvaluation {
  if (!definition.records.some(record => record.id === recordId)) {
    return { ok: false, message: "AUDIT REJECTED // unknown record id" };
  }
  if (recordId !== definition.tamperedRecordId) {
    return { ok: false, message: "AUDIT REJECTED // selected record predates the post-rollback edit window" };
  }
  return {
    ok: true,
    message: "AUDIT ACCEPTED // operator summary was edited after rollback execution",
    rewardClue: definition.rewardClue
  };
}

export function hasCompletedV41PhysicalEvidence(state: OmegaGameState): boolean {
  return V41_PHYSICAL_EVIDENCE_FLAGS.every(flag => state.flags[flag] === true);
}

export function hasReadV41Evidence(state: OmegaGameState): boolean {
  return V41_REQUIRED_LOG_FLAGS.every(flag => state.flags[flag] === true);
}

export function parseV41Assignments(state: OmegaGameState): Record<string, IncidentSource> {
  const raw = typeof state.flags.m5_v41_assignments === "string" ? state.flags.m5_v41_assignments : "";
  const assignments: Record<string, IncidentSource> = {};
  for (const pair of raw.split(";")) {
    const [id, source] = pair.split("=").map(value => value.trim());
    if (id && INCIDENT_SOURCES.includes(source as IncidentSource)) assignments[id] = source as IncidentSource;
  }
  return assignments;
}

export function setV41EvidenceSource(
  state: OmegaGameState,
  evidenceId: string,
  source: string,
  definition: IncidentReconstructionDefinition
): Record<string, IncidentSource> {
  const assignments = parseV41Assignments(state);
  if (!definition.evidence.some(item => item.id === evidenceId) || !INCIDENT_SOURCES.includes(source as IncidentSource)) return assignments;
  assignments[evidenceId] = source as IncidentSource;
  state.flags.m5_v41_assignments = definition.evidence
    .filter(item => assignments[item.id])
    .map(item => `${item.id}=${assignments[item.id]}`)
    .join(";");
  return assignments;
}

export function resetV41Assignments(state: OmegaGameState): void {
  state.flags.m5_v41_assignments = "";
}

export function evaluateIncidentReconstruction(
  definition: IncidentReconstructionDefinition,
  assignments: Record<string, IncidentSource>
): IncidentClassificationEvaluation {
  const validIds = new Set(definition.evidence.map(item => item.id));
  const unknown = Object.keys(assignments).filter(id => !validIds.has(id));
  if (unknown.length > 0) {
    return { ok: false, message: `SOURCE AUDIT REJECTED // unknown evidence: ${unknown.join(", ")}`, missing: [], mismatched: unknown };
  }
  const missing = definition.evidence.filter(item => !assignments[item.id]).map(item => item.id);
  if (missing.length > 0) {
    return { ok: false, message: `SOURCE AUDIT INCOMPLETE // ${definition.evidence.length - missing.length}/${definition.evidence.length} classified`, missing, mismatched: [] };
  }
  const mismatched = definition.evidence.filter(item => assignments[item.id] !== item.source).map(item => item.id);
  if (mismatched.length > 0) {
    return { ok: false, message: `SOURCE AUDIT REJECTED // ${mismatched.length} reliability assignments contradict source metadata`, missing: [], mismatched };
  }
  return {
    ok: true,
    message: "SOURCE AUDIT ACCEPTED // incident witness layers separated by provenance",
    missing: [],
    mismatched: [],
    rewardClue: definition.rewardClue
  };
}

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(value => rightSet.has(value));
}

function sameOrderedSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return new Set(right).size === right.length && sameSet(left, right);
}