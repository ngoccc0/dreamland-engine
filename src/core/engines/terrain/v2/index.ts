// Terrain v2 compatibility shim.
// During migration some modules referenced top-level `game/terrain` sources that
// are not present in all workspaces. Provide a lightweight shim so the repo
// typechecks while the migration is in progress.
// Intentionally export nothing here; replace with real re-exports when the
// terrain API is consolidated.
export {};
