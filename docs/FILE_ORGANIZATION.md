# FILE ORGANIZATION RULES - docs/ FOLDER & NON-CODE FILES

## RULE: ALL NON-CODE FILES → docs/

### Definition: Non-Code Files
- 📄 Documentation (.md, .txt)
- 📋 Configuration guides (.md)
- 🗓️ Long-term plans, TODOs
- 📊 Architecture diagrams
- 📚 Reference guides
- 🎓 Learning materials

### Definition: Code Files (NOT in docs/)
- ✅ .ts, .tsx (TypeScript)
- ✅ .js (JavaScript)
- ✅ .json (Configuration: tsconfig.json, package.json, etc.)
- ✅ .css (Styles)
- ✅ Test files (.test.ts, .spec.ts)

---

## FOLDER STRUCTURE

```
d:/dreamland-engine/
├── docs/                      ← ALL documentation here
│   ├── ARCHITECTURE.md        ← Folder structure & placement rules
│   ├── CODING_STANDARDS.md    ← Code style, TSDoc, naming, file size rules
│   ├── DATA_DEFINITIONS.md    ← lib/game/data rules (specific, intentional design)
│   ├── FILE_ORGANIZATION.md   ← This file: docs/ folder & non-code files
│   ├── PATTERNS.md            ← Reusable code patterns
│   │
│   ├── guides/                ← How-to guides
│   │   ├── setup.md           ← Dev environment setup
│   │   ├── testing.md         ← Testing guide
│   │   ├── deployment.md      ← Deployment guide
│   │   └── debugging.md       ← Debugging common issues
│   │
│   ├── references/            ← Reference materials
│   │   ├── game-balance.md    ← Game balance notes
│   │   ├── creature-stats.md  ← Creature stat reference
│   │   ├── item-economy.md    ← Item economy reference
│   │   └── api-endpoints.md   ← API documentation
│   │
│   └── architecture/          ← Detailed architecture docs
│       ├── data-flow.md       ← Game state data flow diagram
│       ├── event-system.md    ← Event system architecture
│       └── persistence.md     ← Data persistence architecture
│
├── LONG_TERM_NOTES.md         ← Tech debt, TODO list (root level)
├── CHANGELOG.md               ← Version history (already exists)
│
├── src/
├── public/
├── package.json
├── tsconfig.json
└── ...
```

---

## FILE MAPPING: WHERE TO PUT WHAT

| Type | Location | Example | Update Frequency |
|------|----------|---------|------------------|
| **Folder structure & placement rules** | docs/ARCHITECTURE.md | "core/ contains business logic" | When new folder added |
| **Code style, naming, TSDoc, file size** | docs/CODING_STANDARDS.md | "Exports must have JSDoc", "Max 400 lines" | When new standard needed |
| **lib/game/data specific rules** | docs/DATA_DEFINITIONS.md | "One weapon file, one armor file", "No duplicates" | When new data category added |
| **File organization & non-code** | docs/FILE_ORGANIZATION.md | "All docs in docs/", "Non-code files here" | When new doc type added |
| **Reusable code patterns** | docs/PATTERNS.md | "Usecase pattern returns [State, Effects[]]" | When new pattern discovered |
| **Long-term TODOs, tech debt, future work** | LONG_TERM_NOTES.md (root) | "Effect engine needs immutability refactor" | Continuously updated |
| **Setup/testing guides** | docs/guides/ | How-to for developers | When process changes |
| **Game balance notes** | docs/references/game-balance.md | Creature stats, item values, difficulty curves | When game balance adjusted |
| **Creature/Item/Skill reference** | docs/references/[type].md | Stats, spawn rates, recipes | When data changes |
| **Architecture diagrams** | docs/architecture/ | Data flow, event system, persistence | When architecture changes |
| **API documentation** | docs/references/api-endpoints.md | Endpoint list, request/response format | When API changes |
| **Version history** | CHANGELOG.md (root) | "v1.0.0 - Initial release" | After each release |

---

## DOCUMENTATION RULES

### New Documentation Checklist
When adding new documentation:

1. **Determine the type**
   - Is it a guide (how-to)? → `docs/guides/`
   - Is it a reference (data/lookup)? → `docs/references/`
   - Is it architecture? → `docs/architecture/`
   - Is it a rule/standard? → `docs/` (root of docs/)

2. **Check for duplication**
   - Does similar doc already exist?
   - Can you expand existing doc instead?
   - If new: create in appropriate folder

3. **Add to this file's mapping** (table above)

4. **Link in README.md** if publicly facing

5. **Update related rule files**
   - If new architecture rule → update ARCHITECTURE.md
   - If new code standard → update CODING_STANDARDS.md
   - If new data category → update DATA_DEFINITIONS.md

---

## LONG_TERM_NOTES.md (Root Level)

Located at: **d:/dreamland-engine/LONG_TERM_NOTES.md**

**Purpose**: Central tracking of:
- 🔴 Critical bugs and breaking changes needed
- 🟡 Tech debt and refactoring tasks
- 🟠 Medium-priority improvements
- 🟢 Nice-to-have enhancements
- 📋 Current status of each task
- ⏱️ Estimated effort for planning

**Format** (see LONG_TERM_NOTES.md itself for detailed format)
```markdown
## 🔴 CRITICAL (Breaking Changes, Architecture)

### Effect Engine: Fix Mutations to Immutability
**Status**: NOT STARTED
**File**: src/core/engines/effect-engine.ts
**Issue**: Mutations break immutability
**Plan**:
  - [ ] Refactor to return new objects
  - [ ] Update all callers
**Estimated Effort**: 2-3 days
**Blocker**: Breaking change
```

**When to update LONG_TERM_NOTES.md**:
- After discovering a bug or technical debt
- When starting work (mark as IN PROGRESS)
- When completing work (mark as COMPLETED)
- When reprioritizing (move sections around)
- When estimated effort changes

---

## docs/PATTERNS.md

**Purpose**: Document reusable code patterns observed/established in codebase

**Contents**:
- Usecase pattern
- Hook pattern
- Engine pattern
- Component pattern
- Repository pattern
- Effect/side-effect pattern

**When to update**:
- When establishing a new pattern
- When refactoring an existing pattern
- When documenting discovered best practices

---

## docs/guides/ Folder

**Purpose**: Step-by-step guides for developers

### docs/guides/setup.md
- How to set up development environment
- Prerequisites (Node.js, npm, etc.)
- Running local dev server
- Database setup

### docs/guides/testing.md
- How to run tests
- Writing new tests
- Smoke tests vs unit tests
- Coverage requirements

### docs/guides/deployment.md
- Build process
- Deployment steps
- Environment variables
- Production checklist

### docs/guides/debugging.md
- Common errors and solutions
- Debugging tools (DevTools, logger, etc.)
- Performance profiling
- Type errors troubleshooting

---

## docs/references/ Folder

**Purpose**: Lookup/reference materials (not guides, not architecture)

### docs/references/game-balance.md
- Creature stats reference table
- Item drop rates
- Experience curves
- Difficulty progression
- Economy balance (gold, prices, etc.)

### docs/references/creature-stats.md
- HP ranges by level
- Damage ranges
- Defense calculations
- Creature behavior reference
- Spawn conditions

### docs/references/item-economy.md
- Item prices
- Crafting costs
- Sell values
- Drop rates
- Rarity distribution

### docs/references/api-endpoints.md
- REST endpoints
- Request/response format
- Authentication requirements
- Rate limits

---

## docs/architecture/ Folder

**Purpose**: Deep-dive into system architecture (not code style, not folder structure)

### docs/architecture/data-flow.md
Diagram and explanation of how game state flows:
```
UI Component
  ↓
Hook (useGameState)
  ↓
Usecase (performAttack)
  ↓
Engine (calculateDamage)
  ↓
Return [NewState, Effects]
  ↓
Hook updates React state
  ↓
Component re-renders with new state
```

### docs/architecture/event-system.md
- Event types
- Event listeners
- Event flow
- Side effects from events

### docs/architecture/persistence.md
- Data storage layers (IndexedDB, Firebase, LocalStorage)
- Repository pattern implementation
- Data synchronization
- Save/load flow

---

## INLINE DOCUMENTATION (In Code Files)

### File Header Comments
For files > 300 lines, add header:
```typescript
/**
 * @file combat-usecase.ts
 * @description All combat-related usecases (attack, defend, skill use)
 * 
 * RELATED FILES:
 *   - src/core/engines/combat-engine.ts (math calculations)
 *   - src/hooks/use-combat.ts (orchestration)
 *   - src/lib/game/data/creatures/ (creature definitions)
 * 
 * RESPONSIBILITIES:
 *   - Transform attack actions to new state
 *   - Calculate side effects (damage, effects)
 *   - Ensure immutability
 * 
 * DEPENDENCIES:
 *   - core/types/ (types only)
 *   - core/engines/ (math functions)
 * 
 * NOTE: Keep this file under 400 lines. If it grows beyond that,
 * split into: attack.usecase.ts, defend.usecase.ts, skill.usecase.ts
 */
```

### TODO Comments (For Future Work)
Use structured TODO comments:
```typescript
// TODO: [PRIORITY] [EFFORT] Description
// TODO: HIGH/MED/LOW | 1d/2d/1w | description

function calculateDamage(attacker: Creature, defender: Creature): number {
  // TODO: HIGH | 1d | Refactor mutation-based effect application (see LONG_TERM_NOTES.md#Effect-Engine)
  let damage = attacker.damage;
  
  // TODO: MED | 0.5d | Add critical hit logic
  return damage;
}
```

**TODO Prefix Meanings**:
- `HIGH`: Blocks other work or causes bugs
- `MED`: Important but not urgent
- `LOW`: Nice-to-have, polish

**Effort Estimation**:
- `1d` = 1 day
- `2d` = 2 days
- `1w` = 1 week
- `2w` = 2 weeks

---

## RULE: DOCUMENTATION UPDATES

### When Adding a New Folder/Pattern:
1. Update `docs/ARCHITECTURE.md` with new folder rules
2. Add example in `docs/PATTERNS.md` if applicable
3. Add to `LONG_TERM_NOTES.md` if incomplete

### When Changing Code Rules:
1. Update relevant docs/ file
2. Add note to `LONG_TERM_NOTES.md` if affects AI behavior
3. Link in ARCHITECTURE.md or CODING_STANDARDS.md

### When Discovering New Pattern:
1. Document in `docs/PATTERNS.md`
2. Optionally create detailed guide in `docs/guides/`
3. Add example in code files

### When Planning New Feature:
1. Add to `LONG_TERM_NOTES.md`
2. Create in `docs/references/` if it's game balance related
3. Create in `docs/guides/` if it's a process

---

## SUMMARY: NON-CODE FILE LOCATIONS

| File | Location | Purpose |
|------|----------|---------|
| ARCHITECTURE.md | docs/ | Folder structure & placement rules |
| CODING_STANDARDS.md | docs/ | Code style, TSDoc, naming, file size |
| DATA_DEFINITIONS.md | docs/ | lib/game/data structure & rules |
| FILE_ORGANIZATION.md | docs/ | Non-code file organization |
| PATTERNS.md | docs/ | Reusable code patterns |
| LONG_TERM_NOTES.md | **root** | Tech debt, TODOs, long-term planning |
| guides/ | docs/guides/ | How-to guides for processes |
| references/ | docs/references/ | Game balance, stats, economy data |
| architecture/ | docs/architecture/ | System architecture deep-dives |
| CHANGELOG.md | **root** | Version history |

