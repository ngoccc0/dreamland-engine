# 📋 Oversized Files Analysis & Refactoring Priority

**Generated**: December 16, 2025  
**Total Files > 400 lines**: 25 files

---

## 🔴 CRITICAL (> 700 lines)

| File | Lines | Category | Priority | Notes |
|------|-------|----------|----------|-------|
| `src/core/types/game.ts` | 1069 | Types | 🔴 URGENT | Master type definitions, split by concern |
| `src/hooks/use-action-handlers.ts` | 772 | React Hook | 🔴 URGENT | Game action handlers, needs decomposition |
| `src/ai/tools/game-actions-impl.ts` | 724 | AI Integration | 🔴 HIGH | Genkit action implementations |
| `src/lib/locales/ui.ts` | 726 | Localization | 🔴 HIGH | UI text strings, split by feature |
| `src/core/data/items/materials.ts` | 714 | Game Data | 🟡 MEDIUM | Static data, consider splitting by material type |

---

## 🟠 HIGH (500-700 lines)

| File | Lines | Category | Priority | Notes |
|------|-------|----------|----------|-------|
| `src/core/data/creatures/plants.ts` | 553 | Game Data | 🟡 MEDIUM | Static plant definitions |
| `src/core/entities/character.ts` | 551 | Entity | 🟡 MEDIUM | Character entity, split by concern |
| `src/lib/audio/assets.ts` | 549 | Audio | 🟡 MEDIUM | Audio asset mappings |
| `src/core/data/items/modded/nature_plus.ts` | 531 | Game Data | 🟡 MEDIUM | Modded items, standalone OK |
| `src/core/entities/exploration.ts` | 570 | Entity | 🟡 MEDIUM | Exploration entity |
| `src/core/entities/skill.ts` | 576 | Entity | 🟡 MEDIUM | Skill entity definitions |
| `src/core/entities/weather.ts` | 639 | Entity | 🟡 MEDIUM | Weather entity |
| `src/core/rules/nature.ts` | 565 | Rules | 🟡 MEDIUM | Nature/plant rules |
| `src/hooks/move-orchestrator.ts` | 535 | React Hook | 🟡 MEDIUM | Move orchestration logic |

---

## 🟡 MEDIUM (400-500 lines)

| File | Lines | Category | Priority | Notes |
|------|-------|----------|----------|-------|
| `src/core/engines/game/chunk-generation.ts` | 730 | Engine | ✅ DONE | Already refactored Dec 16 ✓ |
| `src/core/engines/effect-engine.ts` | 436 | Engine | 🟡 MEDIUM | Status effects, move to rules/ |
| `src/core/engines/weather-engine.ts` | 439 | Engine | 🟡 MEDIUM | Weather simulation, move to rules/ |
| `src/core/rules/combat.ts` | 415 | Rules | 🟡 MEDIUM | Combat calculations |
| `src/core/usecases/exploration-usecase.ts` | 428 | Usecase | 🟡 MEDIUM | Exploration orchestration |
| `src/core/usecases/world-usecase.ts` | 446 | Usecase | 🟡 MEDIUM | World updates |
| `src/core/usecases/terrain-weather-discovery.usecase.ts` | 440 | Usecase | 🟡 MEDIUM | Terrain/weather discovery |
| `src/core/entities/terrain-definitions.ts` | 405 | Entity | 🟡 MEDIUM | Terrain definitions |
| `src/ai/flows/generate-narrative-flow.ts` | 417 | AI | 🟡 MEDIUM | Narrative generation flow |
| `src/core/data/narrative/templates.ts` | 403 | Game Data | 🟡 MEDIUM | Narrative templates |
| `src/core/data/recipes/nature_plus.ts` | 414 | Game Data | 🟡 MEDIUM | Nature+ recipes |
| `src/hooks/use-game-engine.ts` | 502 | React Hook | 🟡 MEDIUM | Main game engine hook |

---

## 📊 Breakdown by Category

### Game Data (Static)
**Total**: 5 files, 2,945 lines
- `materials.ts` (714) - Can be split by material category
- `plants.ts` (553) - Already organized by type
- `nature_plus.ts` items (531) - Standalone, OK
- `nature_plus.ts` recipes (414) - Standalone, OK
- `templates.ts` (403) - Could split by biome

**Action**: Consider splitting by feature, but these are data files so less critical

### React Hooks
**Total**: 3 files, 1,809 lines
- `use-action-handlers.ts` (772) - 🔴 **CRITICAL** - Split by action type
- `move-orchestrator.ts` (535) - 🟡 MEDIUM - Extract orchestration logic
- `use-game-engine.ts` (502) - 🟡 MEDIUM - Main hook, consider custom hooks

**Action**: Extract logic to core/usecases, keep hooks thin

### Game Entities
**Total**: 6 files, 3,372 lines
- `weather.ts` (639) - Move logic to rules/
- `skill.ts` (576) - Move logic to rules/
- `exploration.ts` (570) - Move logic to usecases/
- `character.ts` (551) - Extract sections
- `terrain-definitions.ts` (405) - Data file, maybe OK
- (Others under 400)

**Action**: Move business logic to rules/ or usecases/

### Core Rules (Pure Logic)
**Total**: 2 files, 980 lines
- `nature.ts` (565) - Split by concern
- `combat.ts` (415) - Could extract utility functions

**Action**: Extract pure utilities to helpers

### Core Usecases (Orchestration)
**Total**: 3 files, 1,314 lines
- `world-usecase.ts` (446)
- `terrain-weather-discovery.usecase.ts` (440)
- `exploration-usecase.ts` (428)

**Action**: Extract helper functions or sub-usecases

### Core Engines
**Total**: 2 files, 875 lines
- `weather-engine.ts` (439) - Move to rules/
- `effect-engine.ts` (436) - Move to rules/

**Action**: Consolidate into core/rules/

### Library Utilities
**Total**: 2 files, 1,275 lines
- `locales/ui.ts` (726) - 🔴 **CRITICAL** - Split by feature
- `audio/assets.ts` (549) - Audio mappings, OK size-wise

**Action**: Split UI locales by component/feature

### AI/Genkit
**Total**: 2 files, 1,141 lines
- `game-actions-impl.ts` (724) - 🔴 **CRITICAL** - Split by action
- `generate-narrative-flow.ts` (417) - Flow definition, OK

**Action**: Decompose action implementations

### Types
**Total**: 1 file, 1069 lines
- `core/types/game.ts` (1069) - 🔴 **CRITICAL** - Major split needed

**Action**: Split by domain (game, creature, item, etc.)

---

## 🎯 Refactoring Strategy by Priority

### Phase 1: CRITICAL FILES (This Week)
**Goal**: Reduce code smell, improve maintainability

1. **`core/types/game.ts` (1069 lines)**
   - Split into domain files: entity.ts, creature.ts, item.ts, game.ts, npc.ts, etc.
   - Estimated: 8-10 files of 100-150 lines each
   - Effort: HIGH
   - Benefit: Core to entire codebase

2. **`hooks/use-action-handlers.ts` (772 lines)**
   - Extract handlers to separate files by action type
   - Move logic to core/usecases/
   - Estimated: 5-6 files + 1 thin hook
   - Effort: MEDIUM
   - Benefit: React hook reusability

3. **`lib/locales/ui.ts` (726 lines)**
   - Split by feature: inventory.ts, combat.ts, farming.ts, narrative.ts, etc.
   - Estimated: 8-10 files of 60-100 lines each
   - Effort: LOW (just organization)
   - Benefit: Easier to find/update strings

4. **`ai/tools/game-actions-impl.ts` (724 lines)**
   - Extract each action to its own file
   - Create action factory pattern
   - Estimated: 10+ files
   - Effort: MEDIUM
   - Benefit: Cleaner Genkit integration

### Phase 2: HIGH-PRIORITY FILES (Next Week)
**Goal**: Clean up entities and rules

1. **`core/entities/weather.ts` (639 lines)**
   - Move logic to core/rules/weather.ts
   - Keep only type definitions
   - Estimated: 2-3 files
   - Effort: MEDIUM

2. **`core/entities/skill.ts` (576 lines)**
   - Move logic to core/rules/skill.ts
   - Estimated: 2-3 files
   - Effort: MEDIUM

3. **`core/rules/nature.ts` (565 lines)**
   - Extract sections: growth.ts, breeding.ts, foraging.ts
   - Estimated: 3-4 files of 150-200 lines
   - Effort: MEDIUM

4. **`core/data/items/materials.ts` (714 lines)**
   - Could split by type: metals.ts, wood.ts, stone.ts, organic.ts
   - Or keep as-is if not frequently modified
   - Estimated: 4-5 files if split
   - Effort: LOW

### Phase 3: MEDIUM-PRIORITY FILES (Later)
**Goal**: Optimize remaining large files

1. **`hooks/move-orchestrator.ts` (535 lines)**
2. **`core/usecases/world-usecase.ts` (446 lines)**
3. **`core/engines/weather-engine.ts` (439 lines)**
4. **etc.**

---

## 💡 Refactoring Principles

### For Type Files
- Split by domain concern (creature types, item types, etc.)
- One main type per file if possible
- Use barrel exports (index.ts) for clean imports

### For Data Files
- Keep if data is cohesive and stable
- Split if file contains multiple unrelated data types
- Consider file size only secondary to organization

### For Hooks
- Keep only state/effect logic
- Extract business logic to core/usecases/
- Create custom hooks for reusable patterns

### For Rules/Usecases
- Extract helper functions
- Break by business domain
- Keep pure functions in rules, orchestration in usecases

---

## 📈 Expected Improvements

**After completing Phase 1-2:**
- ✅ No files > 600 lines (except intentional data files)
- ✅ Types organized by domain
- ✅ Hooks thin and focused
- ✅ Business logic in rules/ & usecases/
- ✅ Better code navigation
- ✅ Easier testing
- ✅ Faster development speed

---

## 📋 Checklist

### Phase 1 (This Week)
- [ ] Split core/types/game.ts (1069 → 8-10 files)
- [ ] Refactor hooks/use-action-handlers.ts (772 → 5-6 files)
- [ ] Reorganize lib/locales/ui.ts (726 → 8-10 files)
- [ ] Decompose ai/tools/game-actions-impl.ts (724 → 10+ files)
- [ ] Run typecheck & tests after each
- [ ] Document new file organization

### Phase 2 (Next Week)
- [ ] Refactor core/entities files (move logic to rules/)
- [ ] Consolidate core/engines/ into core/rules/
- [ ] Verify all < 500 lines

### Phase 3 (Later)
- [ ] Handle remaining files
- [ ] Performance profiling
- [ ] Final cleanup

---

**Total Estimated Lines to Refactor**: 13,500+ lines  
**Estimated Time**: 2-4 weeks  
**Benefit**: Significantly improved code organization and maintainability
