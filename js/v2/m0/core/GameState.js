export const SAVE_SCHEMA_VERSION = 1;
export function createInitialGameState(now = Date.now()) {
    return {
        schemaVersion: SAVE_SCHEMA_VERSION,
        checkpoint: "m0_apartment",
        world: { activeScene: "apartment_m0" },
        player: {
            position: [0, 1.65, 3.4],
            yaw: 0,
            pitch: 0
        },
        filesystem: {
            entries: {
                "/memories/test_photo.img": { deleted: false }
            }
        },
        flags: {
            m0_intro_seen: false
        },
        meta: { updatedAt: now }
    };
}
export function cloneGameState(state) {
    return structuredClone(state);
}
export function validateGameState(value) {
    if (!value || typeof value !== "object")
        return false;
    const state = value;
    return state.schemaVersion === SAVE_SCHEMA_VERSION
        && typeof state.checkpoint === "string"
        && !!state.player
        && Array.isArray(state.player.position)
        && state.player.position.length === 3
        && !!state.filesystem
        && typeof state.filesystem.entries === "object";
}
