import type { OmegaGameState } from "../core/GameState.js";

export const SEA_2017_INDEX_FIELD_IDS = [
  "date",
  "camera_sequence",
  "audio_timestamp",
  "tide_marker",
  "directory_order"
] as const;

export type Sea2017IndexFieldId = typeof SEA_2017_INDEX_FIELD_IDS[number];

export interface Sea2017IndexOption {
  id: string;
  label: string;
}

export interface Sea2017IndexField {
  id: Sea2017IndexFieldId;
  label: string;
  correctOptionId: string;
  options: Sea2017IndexOption[];
  evidencePaths: string[];
}

export interface Sea2017Definition {
  id: "sea_2017";
  sceneId: string;
  access: {
    backupClueFlags: string[];
    minimumBackupClues: number;
    metadataFlag: string;
    archiveKeyFlag: string;
  };
  archiveKey: {
    id: string;
    value: string;
    sourceHint: string;
    sourceEvidencePaths: string[];
  };
  index: {
    fields: Sea2017IndexField[];
    rewardArchivePath: string;
  };
  revealBoundary: {
    veraMorrWasReal: boolean;
    veraIsLiteralResurrection: boolean;
    veraContainsDerivedArchiveMaterial: boolean;
    morrMixedGriefAndResearch: boolean;
    externalReleaseStillDangerous: boolean;
  };
}

export interface Sea2017AccessEvaluation {
  ok: boolean;
  backupCluesFound: number;
  backupCluesRequired: number;
  metadataReady: boolean;
  archiveKeyReady: boolean;
  missing: string[];
}

export interface ArchiveKeyEvaluation {
  ok: boolean;
  message: string;
  missingPaths: string[];
  extraPaths: string[];
  archiveKey?: string;
}

export interface Sea2017IndexEvaluation {
  ok: boolean;
  message: string;
  missingFields: Sea2017IndexFieldId[];
  incorrectFields: Sea2017IndexFieldId[];
  rewardArchivePath?: string;
}

export function upgradeStateForSea2017(state: OmegaGameState): void {
  const booleanDefaults: Record<string, boolean> = {
    m6_archive_key_found: false,
    m6_sea_entered: false,
    m6_sea_index_solved: false,
    m6_final_archive_read: false,
    m6_sea_complete: false
  };
  for (const [flag, fallback] of Object.entries(booleanDefaults)) {
    if (typeof state.flags[flag] !== "boolean") state.flags[flag] = fallback;
  }
  if (typeof state.flags.m6_archive_key_attempts !== "number") state.flags.m6_archive_key_attempts = 0;
  if (typeof state.flags.m6_sea_index_attempts !== "number") state.flags.m6_sea_index_attempts = 0;
  if (typeof state.flags.m6_sea_index_assignments !== "string") state.flags.m6_sea_index_assignments = "{}";
}

export function validateSea2017Definition(definition: Sea2017Definition): string[] {
  const errors: string[] = [];
  if (definition.id !== "sea_2017") errors.push("Sea 2017 definition id must be 'sea_2017'.");
  if (!definition.sceneId) errors.push("Sea 2017 definition is missing sceneId.");

  const access = definition.access;
  if (new Set(access.backupClueFlags).size !== access.backupClueFlags.length) errors.push("Sea 2017 backup clue flags contain duplicates.");
  if (!Number.isInteger(access.minimumBackupClues) || access.minimumBackupClues < 3 || access.minimumBackupClues > access.backupClueFlags.length) {
    errors.push("Sea 2017 access must require at least three available backup clues.");
  }
  if (!access.metadataFlag) errors.push("Sea 2017 access is missing metadataFlag.");
  if (!access.archiveKeyFlag) errors.push("Sea 2017 access is missing archiveKeyFlag.");
  if (!definition.archiveKey.id || !definition.archiveKey.value) errors.push("Sea 2017 hidden archive key is incomplete.");
  if (definition.archiveKey.sourceEvidencePaths.length < 2) errors.push("Sea 2017 hidden archive key must correlate at least two evidence sources.");
  if (new Set(definition.archiveKey.sourceEvidencePaths).size !== definition.archiveKey.sourceEvidencePaths.length) {
    errors.push("Sea 2017 hidden archive-key evidence paths contain duplicates.");
  }

  const fields = definition.index.fields;
  const fieldIds = fields.map(field => field.id);
  if (fieldIds.length !== SEA_2017_INDEX_FIELD_IDS.length || fieldIds.some((id, index) => id !== SEA_2017_INDEX_FIELD_IDS[index])) {
    errors.push(`Sea Index fields must be ordered as ${SEA_2017_INDEX_FIELD_IDS.join(" -> ")}.`);
  }
  if (new Set(fieldIds).size !== fieldIds.length) errors.push("Sea Index field IDs contain duplicates.");

  for (const field of fields) {
    const optionIds = field.options.map(option => option.id);
    if (!field.label) errors.push(`Sea Index field '${field.id}' is missing label.`);
    if (field.options.length < 2) errors.push(`Sea Index field '${field.id}' must have at least two options.`);
    if (new Set(optionIds).size !== optionIds.length) errors.push(`Sea Index field '${field.id}' contains duplicate option IDs.`);
    if (!optionIds.includes(field.correctOptionId)) errors.push(`Sea Index field '${field.id}' correctOptionId is not an authored option.`);
    if (field.evidencePaths.length === 0) errors.push(`Sea Index field '${field.id}' has no evidence path.`);
  }

  if (!definition.index.rewardArchivePath) errors.push("Sea Index rewardArchivePath is missing.");
  const reveal = definition.revealBoundary;
  if (reveal.veraMorrWasReal !== true) errors.push("Sea 2017 reveal must establish that Vera Morr was real.");
  if (reveal.veraIsLiteralResurrection !== false) errors.push("Sea 2017 reveal must reject literal-resurrection identity.");
  if (reveal.veraContainsDerivedArchiveMaterial !== true) errors.push("Sea 2017 reveal must establish derived archive material.");
  if (reveal.morrMixedGriefAndResearch !== true) errors.push("Sea 2017 reveal must establish Morr's grief/research boundary failure.");
  if (reveal.externalReleaseStillDangerous !== true) errors.push("Sea 2017 reveal must preserve external-release risk.");
  return errors;
}

export function evaluateSea2017Access(state: OmegaGameState, definition: Sea2017Definition): Sea2017AccessEvaluation {
  const backupCluesFound = definition.access.backupClueFlags.filter(flag => state.flags[flag] === true).length;
  const metadataReady = state.flags[definition.access.metadataFlag] === true;
  const archiveKeyReady = state.flags[definition.access.archiveKeyFlag] === true;
  const missing: string[] = [];
  if (backupCluesFound < definition.access.minimumBackupClues) missing.push("backup_clues");
  if (!metadataReady) missing.push("sea_metadata");
  if (!archiveKeyReady) missing.push("archive_key");
  return {
    ok: missing.length === 0,
    backupCluesFound,
    backupCluesRequired: definition.access.minimumBackupClues,
    metadataReady,
    archiveKeyReady,
    missing
  };
}

export function evaluateArchiveKeySources(definition: Sea2017Definition, selectedPaths: string[]): ArchiveKeyEvaluation {
  const selected = [...new Set(selectedPaths)];
  const expected = definition.archiveKey.sourceEvidencePaths;
  const expectedSet = new Set(expected);
  const missingPaths = expected.filter(path => !selected.includes(path));
  const extraPaths = selected.filter(path => !expectedSet.has(path));
  if (missingPaths.length > 0 || extraPaths.length > 0) {
    return {
      ok: false,
      message: "ARCHIVE CORRELATION REJECTED // select only the evidence that links pre-persona HUMAN_CONTEXT to Morr's containment record",
      missingPaths,
      extraPaths
    };
  }
  return {
    ok: true,
    message: "ARCHIVE CORRELATION ACCEPTED // hidden SEA_2017 archive key reconstructed",
    missingPaths: [],
    extraPaths: [],
    archiveKey: definition.archiveKey.value
  };
}

export function parseSeaIndexAssignments(state: OmegaGameState): Record<string, string> {
  const raw = typeof state.flags.m6_sea_index_assignments === "string" ? state.flags.m6_sea_index_assignments : "{}";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const clean: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (typeof value === "string") clean[key] = value;
    }
    return clean;
  } catch {
    return {};
  }
}

export function setSeaIndexAssignment(
  state: OmegaGameState,
  definition: Sea2017Definition,
  fieldId: string,
  optionId: string
): Record<string, string> {
  const field = definition.index.fields.find(candidate => candidate.id === fieldId);
  if (!field || !field.options.some(option => option.id === optionId)) return parseSeaIndexAssignments(state);
  const next = { ...parseSeaIndexAssignments(state), [fieldId]: optionId };
  state.flags.m6_sea_index_assignments = JSON.stringify(next);
  return next;
}

export function resetSeaIndexAssignments(state: OmegaGameState): void {
  state.flags.m6_sea_index_assignments = "{}";
}

export function evaluateSeaIndex(
  definition: Sea2017Definition,
  assignments: Record<string, string>
): Sea2017IndexEvaluation {
  const authoredIds = new Set(definition.index.fields.map(field => field.id));
  const unknownFields = Object.keys(assignments).filter(fieldId => !authoredIds.has(fieldId as Sea2017IndexFieldId));
  if (unknownFields.length > 0) {
    return {
      ok: false,
      message: `SEA INDEX REJECTED // unknown field: ${unknownFields.join(", ")}`,
      missingFields: [],
      incorrectFields: []
    };
  }

  const missingFields = definition.index.fields
    .filter(field => !assignments[field.id])
    .map(field => field.id);
  if (missingFields.length > 0) {
    return {
      ok: false,
      message: `SEA INDEX INCOMPLETE // ${definition.index.fields.length - missingFields.length}/${definition.index.fields.length} channels aligned`,
      missingFields,
      incorrectFields: []
    };
  }

  const incorrectFields = definition.index.fields
    .filter(field => assignments[field.id] !== field.correctOptionId)
    .map(field => field.id);
  if (incorrectFields.length > 0) {
    return {
      ok: false,
      message: `SEA INDEX CONTRADICTION // ${incorrectFields.length} channel${incorrectFields.length === 1 ? "" : "s"} disagree with authored evidence`,
      missingFields: [],
      incorrectFields
    };
  }

  return {
    ok: true,
    message: "SEA INDEX ACCEPTED // cross-media archive reconstruction stable",
    missingFields: [],
    incorrectFields: [],
    rewardArchivePath: definition.index.rewardArchivePath
  };
}
