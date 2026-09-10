import type { OmegaGameState } from "../core/GameState.js";

export type VeraVersionId = "vera_0_3" | "vera_1_0" | "vera_2_6" | "vera_4_1";

export const V10_SOURCE_RECORD_PATH = "/backups/vera_1_0/source/photo_SH-1024-A.record";
export const V10_AUDIT_CLUE_PATH = "/backups/vera_1_0/audit/reconstruction_layer.log";
export const V10_PHOTO_ELEMENT_IDS = ["window_rain", "wall_clock", "tea_cup", "red_ribbon", "sea_shell"] as const;
export type V10PhotoElementId = typeof V10_PHOTO_ELEMENT_IDS[number];

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

export interface VersionsDefinition {
  versions: VeraVersionDefinition[];
  syntheticPhotograph: SyntheticPhotographDefinition;
}

export interface SyntheticPhotoEvaluation {
  ok: boolean;
  message: string;
  generated: string[];
  missing: string[];
  extra: string[];
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
    m5_v26_complete: false,
    m5_v41_entered: false,
    m5_v41_complete: false
  };
  for (const [flag, fallback] of Object.entries(booleanDefaults)) {
    if (typeof state.flags[flag] !== "boolean") state.flags[flag] = fallback;
  }
  if (typeof state.flags.m5_v10_photo_attempts !== "number") state.flags.m5_v10_photo_attempts = 0;
  if (typeof state.flags.m5_v10_selected_elements !== "string") state.flags.m5_v10_selected_elements = "";
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

function sameSet(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  const rightSet = new Set(right);
  return left.every(value => rightSet.has(value));
}
