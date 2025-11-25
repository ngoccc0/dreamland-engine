---
agent: agent
---
# Copilot Instructions — Dreamland Engine

Purpose: actionable guidance for AI agents to be immediately productive in this Next.js + TypeScript game codebase.

## Quick Commands

Use these exact npm scripts for development:

```powershell
# Start Next.js dev server (http://localhost:9003)
npm run dev

# Watch AI flows (Genkit, runs in separate terminal)
npm run genkit:watch

# Type check (CI gate)
npm run typecheck

# Run Jest tests (CI gate)
npm run test

# Validate narrative placeholders (run before narrative PRs)
npm run validate:narrative

# Generate TypeDoc API docs
npm run docs:api
```

## Architecture: Four-Layer Clean Architecture

**Layer isolation is mandatory** — UI never touches engines/persistence directly.

```
src/
├── app/              → Next.js pages, server components (UI entry)
├── components/       → React components + hooks (client wiring)
├── hooks/            → React hooks (useGameEngine, useActionHandlers)
│                       ├─ Orchestrate usecases (no direct engine access)
│                       └─ Example: src/hooks/use-action-handlers.ts
├── core/
│   ├── types/        → Domain interfaces (GameState, Chunk, Enemy, Item, etc.)
│   ├── entities/     → Domain business objects (constructors, validation)
│   ├── usecases/     → Pure app logic (farming, combat, exploration, world)
│   │                  └─ Return updated entities, no side effects
│   ├── engines/      → Game rule engines (EffectEngine, WeatherEngine, etc.)
│   ├── repositories/ → Abstract persistence (game state repos)
│   └── values/       → Value objects (Position, GameTime, etc.)
├── infrastructure/
│   ├── persistence/  → Concrete adapters (Dexie, Firebase, LocalStorage)
│   └── [Firebase setup]
├── ai/               → Genkit flows (narrative generation, AI tools)
└── lib/
    ├── game/         → Game utilities (chunk generation, terrain)
    ├── definitions/  → Modular game content (items.json, creatures.json, etc.)
    ├── locales/      → Bilingual translations (en.json, vi.json)
    ├── narrative/    → Narrative assembly logic
    └── utils.ts      → getTranslatedText(), cn(), clamp(), etc.
```

**Data flow:** UI → Hooks → Usecases → Engines/Repositories → Infrastructure

## Mandatory Project-Specific Conventions

### 1. Bilingual (EN/VI) via `getTranslatedText()`

 # Copilot Instructions — Dreamland Engine

Purpose: actionable guidance for AI agents to be immediately productive in this Next.js + TypeScript game codebase.

## Quick Commands

Use these exact npm scripts for development:

```powershell
# Start Next.js dev server (http://localhost:9003)
npm run dev

# Watch AI flows (Genkit, runs in separate terminal)
npm run genkit:watch

# Type check (CI gate)
npm run typecheck

# Run Jest tests (CI gate)
npm run test

# Validate narrative placeholders (run before narrative PRs)
npm run validate:narrative

# Generate TypeDoc API docs
npm run docs:api
```

## Architecture: Four-Layer Clean Architecture

**Layer isolation is mandatory** — UI never touches engines/persistence directly.

```
src/
├── app/              → Next.js pages, server components (UI entry)
├── components/       → React components + hooks (client wiring)
├── hooks/            → React hooks (useGameEngine, useActionHandlers)
│                       ├─ Orchestrate usecases (no direct engine access)
│                       └─ Example: src/hooks/use-action-handlers.ts
├── core/
│   ├── types/        → Domain interfaces (GameState, Chunk, Enemy, Item, etc.)
│   ├── entities/     → Domain business objects (constructors, validation)
│   ├── usecases/     → Pure app logic (farming, combat, exploration, world)
│   │                  └─ Return updated entities, no side effects
│   ├── engines/      → Game rule engines (EffectEngine, WeatherEngine, etc.)
│   ├── repositories/ → Abstract persistence (game state repos)
│   └── values/       → Value objects (Position, GameTime, etc.)
├── infrastructure/
│   ├── persistence/  → Concrete adapters (Dexie, Firebase, LocalStorage)
│   └── [Firebase setup]
├── ai/               → Genkit flows (narrative generation, AI tools)
└── lib/
    ├── game/         → Game utilities (chunk generation, terrain)
    ├── definitions/  → Modular game content (items.json, creatures.json, etc.)
    ├── locales/      → Bilingual translations (en.json, vi.json)
    ├── narrative/    → Narrative assembly logic
    └── utils.ts      → getTranslatedText(), cn(), clamp(), etc.
```

**Data flow:** UI → Hooks → Usecases → Engines/Repositories → Infrastructure

## Mandatory Project-Specific Conventions

### 1. Bilingual (EN/VI) via `getTranslatedText()`

**ALWAYS use this pattern for user-facing strings:**

```typescript
import { getTranslatedText } from "@/lib/utils";
import type { TranslatableString } from "@/core/types/i18n";

const message: TranslatableString = { en: "Hello", vi: "Xin chào" };
const text = getTranslatedText(message, language); // Language from context
```

**File examples:** `src/hooks/use-action-handlers.ts`, `src/lib/game/engine/offline.ts`

**Anti-pattern:** Never do `message.en` or `message.vi` directly — breaks i18n system.

### 2. Persistence via Repository Adapters

**All persistence goes through adapters in `src/infrastructure/persistence/`:**

```typescript
// NOT: IndexedDB directly
// YES: Use repository pattern (DexieGameRepository, FirebaseRepository, etc.)
// Adapters implement GameStateRepository interface
```

Available adapters:
- `indexed-db.repository.ts` (Dexie/IndexedDB, primary)
- `firebase.repository.ts` (Firebase Realtime DB)
- `local-storage.repository.ts` (Fallback, small data only)

### 3. Usecase Pattern (Pure, Side-Effect-Free)

**Usecases in `src/core/usecases/*.ts` follow this shape:**

```typescript
/**
 * Performs farming action.
 * @param state - Current game state
 * @param player - Current player
 * @param farmable - Target farmable
 * @returns Updated (state, player, effects) tuple
 */
export function performFarmingAction(
  state: GameState,
  player: Player,
  farmable: Farmable
): [GameState, Player, GameEffect[]] {
  // Pure logic, no direct DB calls, no side effects
  // Return immutable updates
  return [updatedState, updatedPlayer, appliedEffects];
}
```

**Key traits:**
- Input: immutable domain objects
- Output: immutable updated objects (no mutations)
- No direct persistence calls (hooks handle that)
- Business logic, not infrastructure

### 4. Engine Pattern (Game Rules)

**Engines in `src/core/engines/*.ts` encapsulate game rules:**

Examples: `EffectEngine` (buff/debuff), `WeatherEngine` (time-based weather), `CreatureEngine` (AI behavior), `PlantEngine` (growth mechanics)

**Shape:**
```typescript
export class SomeEngine {
  /**
   * Applies rule logic, returns updated value.
   * @param input - Input state/entity
   * @returns Transformed output
   */
  apply(input: SomeEntity): SomeEntity {
    // Pure, stateless rule logic
    return transformed;
  }
}
```

### 5. Content Moddability (Data-Driven)

**All game content defined in `src/lib/definitions/` (modular TypeScript/JSON):**

- Items: `src/lib/definitions/items.ts` → validates via Zod
- Creatures: `src/lib/definitions/creatures.ts`
- Recipes: `src/lib/definitions/recipes.ts`
- Terrain: `src/lib/definitions/terrain-types.ts`

**Pattern:** Each definition exports a typed array/object, import and register in game registry. Example from README:

```json
{
  "name": { "en": "Magic Stone", "vi": "Đá Ma Thuật" },
  "description": { "en": "Glows faintly", "vi": "Phát sáng yếu" },
  "tier": 3,
  "category": "material",
  "emoji": "✨",
  "baseQuantity": { "min": 1, "max": 3 },
  "effects": []
}
```

## Pre-Code Analysis Workflow (MANDATORY)

**Read before writing a single line:**

1. **Gather context:** Read files mentioned in ticket + related usecases/engines/types.
   - Domain types: `src/core/types/{relevant-type}.ts`
   - Usecase: `src/core/usecases/{relevant-feature}.ts`
   - Repositories: `src/infrastructure/persistence/`
   - If content change: `src/lib/definitions/` + `src/lib/locales/`

2. **Present 3-part plan (required before code):**
   - **Goal & deliverable:** What changes (1-2 sentences)
   - **Scope & locations:** Which files/paths touch (list file paths)
   - **Architecture choice:** 2 options max, pros/cons (1 sentence each), recommendation

3. **Implement, then validate:**
   - Run `npm run typecheck` (must pass, CI gate)
   - Run `npm run test` (must pass, CI gate)
   - If narrative changed: `npm run validate:narrative`
   - If translations changed: verify `src/lib/i18n.ts` merges correctly

## Common Task Flows

### Adding a New Game Item

1. Define in `src/lib/definitions/items.ts` (TypeScript) + validate with Zod
2. Register in game content registry (see existing patterns)
3. Create effect logic if needed in `src/core/engines/effect-engine.ts`
4. Add bilingual description (`{ en: "", vi: "" }`)
5. Run `npm run validate:narrative` if narrative references the item

### Adding a Feature (E.g., New Skill)

1. **Type:** Add to `src/core/types/skills.ts`
2. **Logic:** Create usecase in `src/core/usecases/skill-usecase.ts` (pure function)
3. **Rules:** Add engine rule in `src/core/engines/` if complex
4. **UI Wiring:** Add hook in `src/hooks/use-action-handlers.ts` (calls usecase)
5. **Persistence:** Ensure repository saves skill state
6. **Test:** Write tests in `src/core/usecases/__tests__/`

### Fixing a Cross-Layer Bug

1. Identify layer: Which layer breaks? (UI/Hook/Usecase/Engine/Infra?)
2. Trace data: Add Data Trace (below) showing input → steps → output
3. Fix root cause: Don't patch symptoms
4. Test: Verify fix doesn't break other layers

## Logic Deep Dive & Data Trace (Required for Logic Changes)

**When changing engines, usecases, or game rules, provide:**

**Logic Deep Dive (2-6 sentences):** Explain how the logic works after change.

**Data Trace (1 concrete example):**
```
Input: Player at position (5, 5), attacks creature at (6, 5)
Step 1: Verify adjacency → true
Step 2: Roll attack: player.strength (10) + modifier (2) = 12
Step 3: Compare vs creature.defense (8) → Hit!
Step 4: Calculate damage: 12 - 8 = 4 damage
Output: Creature HP reduced by 4, narrative: "You hit for 4 damage"
Impact: Combat now properly scales with stats.
```

## Red Flags & Anti-Patterns to Avoid

1. **Direct IndexedDB access** → Use repository adapters
2. **Accessing `.en` / `.vi` directly** → Use `getTranslatedText()`
3. **Mutations in usecases** → Always return new objects
4. **Business logic in React components** → Move to usecases/engines
5. **Hardcoded game content** → Define in `src/lib/definitions/`
6. **Skipping typecheck** → Always `npm run typecheck` before PR
7. **Side effects in engines** → Keep rules pure and testable
8. **Narrative without validation** → Run `npm run validate:narrative` when touching narrative

## Testing Strategy

- **Unit tests:** `src/core/**/__tests__/` (usecases, engines, entities)
- **Test framework:** Jest (configured in `jest.config.js`)
- **Coverage:** Aim for >80% on business logic
- **Run:** `npm run test`

## Narrative & Precompute Tooling

- **Assembler:** `src/lib/narrative/assembler.ts` (combines narrative templates + placeholders)
- **Validation:** `npm run validate:narrative` (checks for missing placeholders in narrative refs)
- **Scripts:**
  - `scripts/precompute-narrative.js` (generates static narrative)
  - `scripts/copy-precomputed-to-public.js` (moves precomputed to public/)
  - `scripts/validate-narrative-placeholders.js` (CI validation)

---

## Key Files for Reference

| Purpose | Location | Notes |
|---------|----------|-------|
| Domain types | `src/core/types/` | Interfaces for GameState, Chunk, Enemy, Item, etc. |
| Usecases | `src/core/usecases/*.ts` | Pure logic (farming, combat, exploration) |
| Game rules | `src/core/engines/*.ts` | EffectEngine, WeatherEngine, CreatureEngine, etc. |
| Persistence | `src/infrastructure/persistence/` | Dexie, Firebase, LocalStorage adapters |
| React hooks | `src/hooks/` | UI orchestration (useGameEngine, useActionHandlers) |
| Translations | `src/lib/locales/` | EN/VI language strings |
| Game content | `src/lib/definitions/` | Items, creatures, terrain, recipes (modular) |
| Utility | `src/lib/utils.ts` | getTranslatedText(), cn(), clamp(), etc. |
| AI flows | `src/ai/flows/` | Genkit narrative generation functions |
| Tests | `src/core/**/__tests__/` | Jest test suites |

When unsure, ask one targeted question: **"Which layer should this change touch (UI/Hook/Usecase/Engine/Infra), and which file?"**

### Adding a Feature (E.g., New Skill)

1. **Type:** Add to `src/core/types/skills.ts`
2. **Logic:** Create usecase in `src/core/usecases/skill-usecase.ts` (pure function)
3. **Rules:** Add engine rule in `src/core/engines/` if complex
4. **UI Wiring:** Add hook in `src/hooks/use-action-handlers.ts` (calls usecase)
5. **Persistence:** Ensure repository saves skill state
6. **Test:** Write tests in `src/core/usecases/__tests__/`

### Fixing a Cross-Layer Bug

1. Identify layer: Which layer breaks? (UI/Hook/Usecase/Engine/Infra?)
2. Trace data: Add Data Trace (below) showing input → steps → output
3. Fix root cause: Don't patch symptoms
4. Test: Verify fix doesn't break other layers

## Logic Deep Dive & Data Trace (Required for Logic Changes)

**When changing engines, usecases, or game rules, provide:**

**Logic Deep Dive (2-6 sentences):** Explain how the logic works after change.

**Data Trace (1 concrete example):**
```
Input: Player at position (5, 5), attacks creature at (6, 5)
Step 1: Verify adjacency → true
Step 2: Roll attack: player.strength (10) + modifier (2) = 12
Step 3: Compare vs creature.defense (8) → Hit!
Step 4: Calculate damage: 12 - 8 = 4 damage
Output: Creature HP reduced by 4, narrative: "You hit for 4 damage"
Impact: Combat now properly scales with stats.
```

## Red Flags & Anti-Patterns to Avoid

1. **Direct IndexedDB access** → Use repository adapters
2. **Accessing `.en` / `.vi` directly** → Use `getTranslatedText()`
3. **Mutations in usecases** → Always return new objects
4. **Business logic in React components** → Move to usecases/engines
5. **Hardcoded game content** → Define in `src/lib/definitions/`
6. **Skipping typecheck** → Always `npm run typecheck` before PR
7. **Side effects in engines** → Keep rules pure and testable
8. **Narrative without validation** → Run `npm run validate:narrative` when touching narrative

## Testing Strategy

- **Unit tests:** `src/core/**/__tests__/` (usecases, engines, entities)
- **Test framework:** Jest (configured in `jest.config.js`)
- **Coverage:** Aim for >80% on business logic
- **Run:** `npm run test`

## Narrative & Precompute Tooling

- **Assembler:** `src/lib/narrative/assembler.ts` (combines narrative templates + placeholders)
- **Validation:** `npm run validate:narrative` (checks for missing placeholders in narrative refs)
- **Scripts:**
  - `scripts/precompute-narrative.js` (generates static narrative)
  - `scripts/copy-precomputed-to-public.js` (moves precomputed to public/)
  - `scripts/validate-narrative-placeholders.js` (CI validation)

---

## Key Files for Reference

| Purpose | Location | Notes |
|---------|----------|-------|
| Domain types | `src/core/types/` | Interfaces for GameState, Chunk, Enemy, Item, etc. |
| Usecases | `src/core/usecases/*.ts` | Pure logic (farming, combat, exploration) |
| Game rules | `src/core/engines/*.ts` | EffectEngine, WeatherEngine, CreatureEngine, etc. |
| Persistence | `src/infrastructure/persistence/` | Dexie, Firebase, LocalStorage adapters |
| React hooks | `src/hooks/` | UI orchestration (useGameEngine, useActionHandlers) |
| Translations | `src/lib/locales/` | EN/VI language strings |
| Game content | `src/lib/definitions/` | Items, creatures, terrain, recipes (modular) |
| Utility | `src/lib/utils.ts` | getTranslatedText(), cn(), clamp(), etc. |
| AI flows | `src/ai/flows/` | Genkit narrative generation functions |
| Tests | `src/core/**/__tests__/` | Jest test suites |

When unsure, ask one targeted question: **"Which layer should this change touch (UI/Hook/Usecase/Engine/Infra), and which file?"**
## Execution Agent (Agent-Mode) — Autonomous Execution Policy

When an execution agent (Copilot/Executor) is authorized to act on an accepted plan, it MUST follow these rules exactly:

- Automatic run-to-completion: after the plan is accepted, the executor will implement the plan end-to-end without pausing, including making incremental commits, running checks, and performing tests. The executor must only stop and report if:
  1. It encounters a blocker or failure it cannot resolve (test failures, type errors, infrastructure errors).
  2. It reaches a PAUSE POINT defined in the plan (new core module, file split, external credentials, security-sensitive operation).
  3. It needs explicit human approval (the plan declared an approval gate).

- Detailed TODOs: The executor must expand the plan's Implementation Steps into a detailed TODO list of small atomic tasks before starting. Each TODO item must include the target files, exact edits (high-level description), tests to run, and expected commit message.

- Commit policy: commit frequently (after each atomic TODO). Commit message format: `<scope>(<area>): <short description> [plan:<short-title>]` (e.g., `feat(loot): add rollLootTier usecase [plan-loot-tier]`). Branch naming: `feat/<short-title>/<ticket>`.

- Validation after each commit: run `npm run typecheck` and `npm run test` (or the specific subset of tests indicated). If tests fail, attempt one automated fix (if low-risk), otherwise revert the failing commit and stop to report with failure details.

- Narrative/content changes: if plan touches narrative or locales, run `npm run validate:narrative` and ensure `src/lib/i18n.ts` merges keys correctly. Copy precomputed narrative to public if required by the plan (`scripts/copy-precomputed-to-public.js`).

- Prefer existing modules: the executor must reuse existing engines/adapters in `src/core/engines/*` and `src/infrastructure/persistence/*`. Creating a new top-level module is only allowed if the plan contains a justification and the plan included a specific approval gate for new modules.

- TSDoc & formulas: every newly exported function/type must include detailed TSDoc describing:
  - Purpose and behavior
  - Parameters and units/types (explicit)
  - Any formulas used (with variable names and units)
  - The effect of the calculation on final outputs (1-2 sentences)

- File size constraint: no file may exceed 800 lines (preferred max 500). If a planned edit will result in a file exceeding the limit, the executor must create a "Split Plan" listing new file names, exported symbols, and the mapping of code to new files — then pause for explicit approval before applying the splits.

- Reporting: the executor reports only when the entire plan completes successfully, when it is blocked and needs approval, or when a non-recoverable failure occurs. The final report must include the Logic Deep Dive and Data Trace from the plan plus results of acceptance tests and the list of commits made.

- Safety note: auto-merge is only permitted if repository CI and branch protection rules allow it and an authorized automation-bot account is configured. Otherwise the executor must open a draft PR and wait for human merge.
