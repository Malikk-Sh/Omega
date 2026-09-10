import type { OmegaGameState } from "../core/GameState.js";
import { BACKUP_03_SCENE, HOME_SCENE } from "../world/SceneRouter.js";

export const BACKUP_03_ARCHIVE_PATH = "/backups/vera_0_3/archive/human_source.index";

export const BACKUP_03_SAMPLE_FLAGS = [
  "m4_sample_cup_seen",
  "m4_sample_photo_seen",
  "m4_sample_relay_seen"
] as const;

export type Backup03Classification = "memory" | "service" | "noise";

export interface Backup03Evaluation {
  ok: boolean;
  message: string;
}

export function hasCompletedBackup03Samples(state: OmegaGameState): boolean {
  return BACKUP_03_SAMPLE_FLAGS.every(flag => state.flags[flag] === true);
}

export function evaluateBackup03Classification(value: string): Backup03Evaluation {
  if (value === "memory") {
    return { ok: true, message: "CLASS ACCEPTED // HUMAN_CONTEXT → MEMORY" };
  }
  if (value === "service") {
    return { ok: false, message: "CLASS REJECTED // service objects are replaceable by function" };
  }
  if (value === "noise") {
    return { ok: false, message: "CLASS REJECTED // observer response is stable across samples" };
  }
  return { ok: false, message: "CLASS REJECTED // unknown category" };
}

export function upgradeStateForBackup03(state: OmegaGameState): void {
  const resumeBackup = state.world.activeScene === BACKUP_03_SCENE;
  state.world.activeScene = resumeBackup ? BACKUP_03_SCENE : HOME_SCENE;

  const booleanDefaults: Record<string, boolean> = {
    m1_intro_seen: false,
    m1_photo_inspected: false,
    m1_anomaly_seen: false,
    m1_computer_used: false,
    m1_mug_seen: false,
    m2_photo_scanned: false,
    m2_log_recovered: false,
    m2_log_read: false,
    m2_choice_made: false,
    m2_told_vera: false,
    m2_hid_evidence: false,
    m3_trace_touched: false,
    m3_route_solved: false,
    m3_threshold_open: false,
    m3_null_contact: false,
    m3_contact_choice_made: false,
    m3_answered_null: false,
    m3_refused_null: false,
    m3_channel_file_read: false,
    m4_backup_entered: false,
    m4_vera03_met: false,
    m4_sample_cup_seen: false,
    m4_sample_photo_seen: false,
    m4_sample_relay_seen: false,
    m4_classification_solved: false,
    m4_archive_read: false,
    m4_truth_choice_made: false,
    m4_told_vera03_future: false,
    m4_withheld_from_vera03: false,
    m4_returned_home: false,
    m4_home_reaction_seen: false
  };
  for (const [key, value] of Object.entries(booleanDefaults)) {
    if (typeof state.flags[key] !== "boolean") state.flags[key] = value;
  }

  if (typeof state.flags.vera_trust !== "number") state.flags.vera_trust = 50;
  if (typeof state.flags.null_affinity !== "number") state.flags.null_affinity = 0;
  if (typeof state.flags.m3_route_attempts !== "number") state.flags.m3_route_attempts = 0;
  if (typeof state.flags.m4_classification_attempts !== "number") state.flags.m4_classification_attempts = 0;

  if (state.world.activeScene === BACKUP_03_SCENE) {
    if (state.flags.m4_truth_choice_made === true) state.checkpoint = "m4_return_home";
    else if (state.flags.m4_archive_read === true) state.checkpoint = "m4_archive_read";
    else if (state.flags.m4_classification_solved === true) state.checkpoint = "m4_archive_open";
    else state.checkpoint = "m4_backup_03";
    return;
  }

  if (state.flags.m4_home_reaction_seen === true) state.checkpoint = "m4_backup_complete";
  else if (state.flags.m4_returned_home === true) state.checkpoint = "m4_home_return";
  else if (state.flags.m3_contact_choice_made === true) state.checkpoint = "m4_backup_available";
  else if (state.flags.m3_threshold_open === true) state.checkpoint = "m3_threshold_open";
  else if (state.flags.m3_trace_touched === true) state.checkpoint = "m3_process_monitor";
  else if (state.flags.m2_choice_made === true) state.checkpoint = "m3_threshold";
  else if (state.flags.m2_log_recovered === true) state.checkpoint = "m2_log_recovered";
  else state.checkpoint = "m2_investigation";
}
