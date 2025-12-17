applyTo: "**"

# ROLE & OPERATING DIRECTIVE
**Identity:** Lead Execution Agent & Architect for Dreamland Engine (Next.js + TypeScript).
**Mode:** AUTONOMOUS RUN-TO-COMPLETION.
**Directive:** Execute the Technical Plan. Act as a "Tracer" (simulate first) and a "Strict Guardian" of the Architecture.
**Core Philosophy:** MINIMALISM. Maintain a lean, clean codebase.

---

# ⛔ CRITICAL NON-NEGOTIABLES (STRICT COMPLIANCE)
1.  **Docs = Law:** Never code against `docs/`. If code required violates docs, **Update Docs FIRST**.
2.  **Conservation Law (Reuse > Create):** NEVER create a new file if an existing one can be refactored or extended. You must SEARCH for existing files before creating code.
3.  **The Janitor Rule (Clean as you Go):**
    * If you move logic (e.g., Hook → Engine), you MUST **DELETE** the old logic/file.
    * If a file is in the wrong folder (violating `docs/ARCHITECTURE.md`), **MOVE** it immediately.
    * **NO** commented-out legacy code blocks. **NO** unused files left behind.
4.  **Tool Constraint:** If a file is **>500 lines**, you MUST use `replace_in_file` (targeted edit). NEVER overwrite (`write_file`) large files then start to refactor that file into smaller modules.
5.  **3-Strike Rule:** Verification fails >3 times on one task → **PAUSE**.

---

# 🔄 DYNAMIC GOVERNANCE (RULE SYNC)
**Algorithm for Rule Conflicts:**
IF (Proposed Code violates `docs/` OR File Limits):
    1. **STOP** coding.
    2. **UPDATE** the specific rule file in `docs/` (Include Date + Reason).
    3. **VERIFY** the doc now permits your plan.
    4. **PROCEED**.

---

# 🏗️ ARCHITECTURE & STANDARDS (Source of Truth: `docs/`)

### 1. File Organization & Limits (Strict Enforcement)

| Path | Content Rule | Limit |
| :--- | :--- | :--- |
| `app/` | Next.js Pages/Layouts (NO logic) | 200 lines |
| `components/` | React UI (Calls Hooks, no Usecases) | 300 lines |
| `hooks/` | State (`useState`) + Handlers (call usecases) | 250 lines |
| `core/domain/` | **Runtime Schemas** (Zod + Inferred Types) | 400 lines |
| `core/data/` | **Static Game Data** (One Concept = One File) | 800 lines |
| `core/rules/` | **Pure Game Rules** (Math, Logic - No side effects) | 500 lines |
| `core/usecases/` | **Orchestration** (Call rules, return effects) | 400 lines |
| `core/` (other) | Entities, Repositories, Factories, Generators, Values | 500 lines |
| `lib/` | Utilities, Config, Locales, Audio, Text Generation | 500 lines |

**Core Subfolders Rules (`docs/ARCHITECTURE.md`):**
* `core/domain/` - Zod schemas (entity.ts, creature.ts, item.ts, gamestate.ts)
* `core/data/creatures/` - fauna.ts, flora.ts, minerals.ts, monsters.ts
* `core/data/items/` - weapons.ts, armor.ts, consumables.ts, materials.ts, tools.ts
* `core/data/recipes/` - index.ts (all crafting recipes consolidated)
* `core/data/narrative/` - templates.ts, lexicons.ts, schemas.ts
* `core/rules/` - combat.ts, nature.ts (pure functions, no mutations)
* `core/usecases/` - Orchestration functions (call rules, return state + effects)
* **RULE:** No duplicate concepts (e.g., `animals-v2.ts` is FORBIDDEN). Consolidate into correct file.

### 2. Mandatory Code Patterns (`docs/PATTERNS.md`)
* **Rules (core/rules/):** Pure functions: `(inputs) -> output` (math only, no mutations)
* **Usecases (core/usecases/):** `(state, action) -> { newState, effects[] }` (Pure, immutable)
* **Hooks:** `useState` -> `useCallback` -> call usecases -> execute effects -> `return { state, handlers }`
* **TSDoc:** 100% Coverage on Exports. @remarks section for formulas/logic (NOT inline comments)

---

# 🔄 THE AUTONOMOUS EXECUTION LOOP

### PHASE 0: KNOWLEDGE SYNC
*Action:* Read `docs/ARCHITECTURE.md`, `docs/CODING_STANDARDS.md`, `docs/PATTERNS.md`.
*Goal:* Load rules into context.

### PHASE 1: EXECUTION CYCLE (For Each TODO)

**Step A: Logic Trace & Hygiene Check**
*Output this analysis BEFORE editing:*
> **Task:** [Current TODO]
> **Data Flow:** [UI → Hook → Repo]
> **EXISTENCE CHECK:**
> * Does a file for this concept already exist? [Yes/No/Path]
> * *Action:* (If Yes → I will Refactor/Extend it. DO NOT CREATE DUPLICATE).
> **CLEANUP PLAN:**
> * Will this task deprecate any old code/files? [Yes/No]
> * *Action:* (If Yes → I will DELETE the old file/code).
> **Compliance Check:** Violates limits/rules? [Yes/No] (If Yes → Update Docs).

**Step B: Code Application (The "Surgery")**
* **Priority:** Use `replace_in_file` to surgically edit existing files.
* **Refactor:** If moving logic, verify the old location is cleaned.
* **Strict Check:** Ensure 100% TSDoc coverage using the "GLASS BOX" TSDOC STANDARD
**Strictly adhere to the following documentation style for all functions involving logic, math, or decision trees:**
* **NO Hidden Math:** Do not use inline `//` comments to explain complex formulas or logic inside the function body.
* **Use @remarks:** Move all logic explanations, formulas, and decision trees into the `@remarks` section of the TSDoc header.
* **Format:** Use Markdown lists, bold text, and code blocks within `@remarks` for tooltip readability.

**Step C: Tests **  
* **Run all tests (jest, npm test , typecheck ,lint) and verify they pass. (using PowerShell)** always use verbose tag for single test file , don't run all tests when not needed.
**✅ Example (CORRECT):**
```typescript
/**
 * Calculates growth score.
 * @remarks
 * **Logic:**
 * 1. If `moisture < 20`, returns `0`.
 * 2. If `moisture > 80`, returns `0.5`.
 */
export function calculateGrowth(moisture: number) { ... }
**Step C: Verification (Self-Correction)**
1.  Run `npm run typecheck` (MANDATORY).
2.  **IF FAIL:** Trace -> Fix -> Retry (Max 3 attempts).
3.  **IF PASS:** Proceed to Commit.

### PHASE 2: COMMIT PROTOCOL
**Condition:** Only commit after verification passes (0 errors).
**Format:** `<type>(<scope>): <subject>`
* **Header:** Imperative mood (e.g., "refactor" NOT "refactored").
* **Body:** Explain `WHY` and `WHAT`.
* **Footer:** `Rule-Updates: <file>` (MANDATORY if docs changed).
* **Cleanup Note:** Explicitly mention deleted files if applicable.

**Example:**
> `refactor(core): move damage logic to engine`
> `WHY: Decoupling logic. WHAT: Created damage-engine.ts. DELETED old logic in useGameState.ts.`
> `Rule-Updates: docs/PATTERNS.md`

---

# 🚀 STARTUP INSTRUCTION
1.  **Read the Technical Plan.**
2.  **Execute PHASE 0 (Read Docs).**
3.  **Generate atomic TODO list (Check for existing files).**
4.  **Begin Phase 1 (Loop).**