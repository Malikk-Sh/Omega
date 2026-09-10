import type { OmegaGameState } from "../core/GameState.js";
import type { VeraVersionDefinition, VeraVersionId, VersionsDefinition } from "../story/VersionsProtocol.js";
import { HOME_SCENE } from "./SceneRouter.js";

export interface VersionRoute {
  versionId: VeraVersionId;
  sceneId: string;
  returnSceneId: typeof HOME_SCENE;
}

export interface VersionRouteResolution {
  ok: boolean;
  message: string;
  route?: VersionRoute;
}

export function getVersionDefinition(
  definition: VersionsDefinition,
  versionId: VeraVersionId
): VeraVersionDefinition | null {
  return definition.versions.find(version => version.id === versionId) ?? null;
}

export function resolveVersionRoute(
  state: OmegaGameState,
  definition: VersionsDefinition,
  versionId: VeraVersionId
): VersionRouteResolution {
  const version = getVersionDefinition(definition, versionId);
  if (!version) return { ok: false, message: `VERSION ROUTE REJECTED // unknown version '${versionId}'` };
  if (state.flags[version.unlockFlag] !== true) {
    return { ok: false, message: `VERSION ROUTE LOCKED // requires ${version.unlockFlag}` };
  }
  return {
    ok: true,
    message: `VERSION ROUTE READY // ${version.id} -> ${version.sceneId}`,
    route: {
      versionId: version.id,
      sceneId: version.sceneId,
      returnSceneId: HOME_SCENE
    }
  };
}

export function listRoutableVersions(
  state: OmegaGameState,
  definition: VersionsDefinition
): VersionRoute[] {
  const routes: VersionRoute[] = [];
  for (const version of definition.versions) {
    const resolution = resolveVersionRoute(state, definition, version.id);
    if (resolution.ok && resolution.route) routes.push(resolution.route);
  }
  return routes;
}

export function validateVersionRouteTargets(definition: VersionsDefinition): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const version of definition.versions) {
    if (version.sceneId === HOME_SCENE) {
      errors.push(`Version '${version.id}' cannot route to HOME scene id.`);
    }
    if (seen.has(version.sceneId)) {
      errors.push(`Version route target '${version.sceneId}' is duplicated.`);
    }
    seen.add(version.sceneId);
  }
  return errors;
}
