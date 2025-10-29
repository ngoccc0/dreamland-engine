## Type-change proposal — canonical core types (short, actionable)

Date: 2025-10-30

Summary
- Goal: reduce cross-cutting TypeScript friction caused by mixed shapes (TranslatableString vs string, optional numeric fields, loose setter signatures) by introducing a small set of canonical type changes and clear boundary normalization rules.
- Scope: small, reversible edits to `src/lib/game/types.ts` and `src/lib/utils.ts` (getTranslatedText), plus a short migration plan to safely apply changes across the codebase.

High-level principles
- Normalize at boundaries: keep internal canonical types strict and convert legacy/loose shapes at the edge (UI, AI adapters, data loaders).
- Minimal breaking changes: introduce gradual compatibility (allow legacy shapes where necessary) and provide migration shims.
- Prefer making optional numeric fields explicit and provide defaults via helper functions or runtime normalization.

Proposed concrete changes (snippets and rationale)

1) Canonicalize `playerLevel` and numeric progress fields

Rationale: different parts of the code accept `playerLevel` as number or object. Make canonical shape explicit and provide legacy compatibility.

BEFORE (excerpt from `src/lib/game/types.ts`):

```ts
// Player-level convenience fields that appear in some presets/tests.
// Migrate to a structured playerLevel where possible. Keep the legacy numeric
// field as optional for backwards compatibility; engine will coerce when needed.
playerLevel?: { level: number; experience: number } | number;
questsCompleted?: number;
```

AFTER (proposal):

```ts
/**
 * Canonical player level: structured object.
 * Older saves may have a legacy numeric level; use `normalizePlayerStatus` before
 * passing PlayerStatus to core logic.
 */
playerLevel: { level: number; experience: number };

/** Number of completed quests (default 0) */
questsCompleted: number;
```

Migration shim (runtime) — add a helper in `src/lib/game/normalize.ts`:

```ts
export function normalizePlayerStatus(s: Partial<PlayerStatus>): PlayerStatus {
  return {
    ...defaults,
    ...s,
    playerLevel: typeof s.playerLevel === 'number' ? { level: s.playerLevel, experience: 0 } : (s.playerLevel ?? { level: 1, experience: 0 }),
    questsCompleted: s.questsCompleted ?? 0,
    unlockProgress: {
      kills: s.unlockProgress?.kills ?? 0,
      damageSpells: s.unlockProgress?.damageSpells ?? 0,
      moves: s.unlockProgress?.moves ?? 0,
    }
  } as PlayerStatus;
}
```

2) Make numeric fields explicit with defaults

Rationale: fields such as `mana`, `stamina`, `unlockProgress.*`, `questsCompleted` were often undefined causing arithmetic issues.

BEFORE (examples scattered):

```ts
mana?: number; // optional
```

AFTER (proposal):

```ts
mana: number; // default 0
stamina: number; // default 100
```

Migration: use `normalizePlayerStatus` when loading saves or before passing PlayerStatus around. Update data fixtures/premade worlds to include the explicit fields where practical.

3) getTranslatedText: accept undefined at boundary

Rationale: many call sites pass TranslatableString | undefined to `getTranslatedText`. It's safer to allow undefined with a fallback and reduce callers needing to guard.

BEFORE (`src/lib/utils.ts` signature):

```ts
export function getTranslatedText(
    translatable: TranslatableString,
    language: Language,
    t?: (key: TranslationKey, options?: any) => string
): string { ... }
```

AFTER (proposal):

```ts
export function getTranslatedText(
    translatable: TranslatableString | undefined | null,
    language: Language,
    t?: (key: TranslationKey, options?: any) => string
): string {
  if (!translatable) return '';
  ... // previous logic
}
```

This is a non-breaking improvement; fewer callsites need to `?? { en: '' }`.

4) Unify React setter types across hooks

Rationale: several hooks accept custom setter function signatures instead of the standard React.Dispatch<SetStateAction<T>> which causes mismatches when passing setters around. Standardize on React.Dispatch types in core hook interfaces.

BEFORE (example):

```ts
setWorld: (fn: (prev: World) => World) => void;
```

AFTER (proposal):

```ts
setWorld: React.Dispatch<React.SetStateAction<World>>;
```

Migration: change hook type definitions, then update call sites to pass setters as-is (no runtime change). Where a call site expects a specific callback signature, adapt by wrapping: `setWorld(prev => newWorld)` stays valid.

Concrete patch notes (how to implement safely)

- Step 1: add `src/lib/game/normalize.ts` with `normalizePlayerStatus` and `normalizeChunkForAI`.
- Step 2: wire `normalizePlayerStatus` into `useGameInitialization` before `setPlayerStats` and anywhere loaded/remote state is applied.
- Step 3: change `getTranslatedText` signature to accept `undefined | null` and return `''` when not provided.
- Step 4: incrementally change `types.ts` canonical fields (playerLevel, mana, stamina, questsCompleted) and keep the normalization helper in place to avoid large cascade.
- Step 5: change hook deps to use React.Dispatch setter types. Run tsc and fix call sites.

Testing & validation
- Run typecheck: `tsc --noEmit` and fix errors incrementally.
- Add a small unit test for `normalizePlayerStatus` and for `getTranslatedText` with undefined input.
- Smoke test runtime flows: start the dev server and exercise new game creation, a few actions (move, attack, craft) to ensure no runtime null issues.

Risks & mitigations
- Large cascade: changing core types will reveal many compile errors. Mitigate by keeping `normalizePlayerStatus` and `normalizeChunkForAI` ready and applying changes incrementally.
- Data compatibility: premade world JSON may lack mandatory fields. Mitigate by normalizing during load and updating fixtures gradually.

Estimated effort
- Design + small prototype patches: 2–4 hours
- Incremental application & fixes across app: 1–2 days (depends on test coverage and data cleanliness)

Next actions I can take now (pick one):
- I can create the `normalizePlayerStatus` helper and wire it into `useGameInitialization` (low-risk, reduces many failures). 
- I can create the `getTranslatedText` signature change and apply it (safe, likely minimal edits). 
- I can prepare the actual patch for `types.ts` and attempt the compilation run (higher risk but I can roll back). 

If you confirm which to apply first, I'll implement the patch, run typecheck, and report back with any remaining errors and suggested fixes.

---
Approved-by: (you)
