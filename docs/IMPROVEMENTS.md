# 🎯 Game Improvements Checklist

**Last Updated**: December 16, 2025
**Status**: Planning Phase

---

## 🐛 Bug Fixes & Stability

### High Priority (Game-Breaking)
- [ ] **Weather rules test failures** - 6+ tests failing in weather-rules.test.ts
  - Issue: `getGrowthScore()` returns 0.3875 instead of > 1.0
  - Impact: Plant growth calculations incorrect
  - Fix: Review weather formula in `src/core/rules/weather.ts`

- [ ] **Crafting rules failures** - validateRecipe() returns false when should be true
  - Issue: Recipe validation broken for wooden_bow, health_potion
  - Impact: Players cannot craft items
  - Fix: Debug crafting-rules.ts logic

- [ ] **Narrative rules failures** - buildTemplate() not replacing placeholders
  - Issue: Returns "An event occurred." instead of "Rose bloomed"
  - Impact: Narrative generation broken
  - Fix: Check placeholder replacement in narrative-rules.ts

- [ ] **Loot rules failures** - calculateRarity() clamping wrong
  - Issue: Returns 3 instead of 5 for (1, 100)
  - Impact: Loot rarity calculation incorrect
  - Fix: Review rarity formula in loot-rules.ts

### Medium Priority (Gameplay Issues)
- [ ] Mountain biome missing enemy data reference
  - Issue: `naturePlusMountainEnemies` was undefined
  - Status: Fixed by removing reference (Dec 16)
  - Todo: Add proper mountain enemies if needed

- [ ] Unused imports cleanup (all done ✅)
  - Status: Completed Dec 16
  - Files: offline/actions.ts, offline/templates.ts, hunting.ts, migrate-lib-game.ps1

---

## 🎮 Gameplay Features

### Core Game Loop
- [ ] **Combat System** - Review balance
  - [ ] Damage calculation feels right?
  - [ ] Critical hit rates reasonable?
  - [ ] Status effects apply correctly?

- [ ] **Plant Growth** - Make it feel organic
  - [ ] Growth speed appropriate?
  - [ ] Moisture/temperature scaling correct?
  - [ ] Visual feedback clear?

- [ ] **Creature AI** - Behavior improvements
  - [ ] Creature-engine.ts (771 lines) - needs refactor
  - [ ] Hunting behavior realistic?
  - [ ] Herding mechanics engaging?
  - [ ] Mood system balanced?

- [ ] **Crafting System** - Quality of life
  - [ ] Recipe discovery intuitive?
  - [ ] Crafting animation smooth?
  - [ ] Resource requirements fair?

### World Generation
- [ ] **Chunk Generation** - Variety & performance
  - [ ] Biome transitions smooth?
  - [ ] Entity density appropriate?
  - [ ] Item spawning feels fair?
  - [ ] Performance acceptable? (check generation time)

- [ ] **Terrain Generation** - Believable world
  - [ ] Biome features distinctive?
  - [ ] Weather patterns logical?
  - [ ] Seasonal changes visible?

### Player Experience
- [ ] **UI/UX** - Polish
  - [ ] Inventory interface intuitive?
  - [ ] Combat feedback clear?
  - [ ] Farming UI helpful?
  - [ ] Mobile responsive?

- [ ] **Narrative** - Story quality
  - [ ] Action descriptions engaging?
  - [ ] NPC dialogue interesting?
  - [ ] Random events entertaining?

- [ ] **Progression** - Pacing
  - [ ] Early game too easy/hard?
  - [ ] Mid-game feels grindy?
  - [ ] Endgame goals clear?

---

## ⚡ Performance & Optimization

### Speed
- [ ] Chunk generation time < 100ms
- [ ] World generation batching efficient
- [ ] Entity selection O(n log n)?
- [ ] Creature AI updates not blocking

### Memory
- [ ] Large save files load quickly
- [ ] World state not bloated
- [ ] No memory leaks in React components
- [ ] Asset streaming working?

### Network (if applicable)
- [ ] Save sync works reliably
- [ ] Conflict resolution for multiplayer
- [ ] Bandwidth optimization

---

## 🏗️ Code Quality & Architecture

### Refactoring Needed
- [ ] **creature-engine.ts** (771 lines)
  - Break into: ai-state.ts, behavior.ts, mood.ts, hunting.ts
  - Extract pure logic to `core/rules/creature.ts`

- [ ] **offline/actions.ts** (143 lines)
  - Consider split by action type?

- [ ] **offline/templates.ts** (234 lines)
  - Extract template selection logic?

- [ ] **entity-generation.ts** (check line count)
  - Oversized? Needs refactor?

### Code Quality
- [ ] All files < 500 lines ✅ chunk-generation done
- [ ] All functions have TSDoc (check coverage)
- [ ] No commented-out code
- [ ] Type safety maximum (no `any` types)
- [ ] Test coverage > 80%?

### Documentation
- [ ] README.md updated with latest changes
- [ ] Architecture docs current?
- [ ] Patterns.md examples valid?
- [ ] API documentation complete?

---

## 🧪 Testing

### Unit Tests
- [ ] Fix failing rule tests
  - [ ] weather-rules (6 failures)
  - [ ] crafting-rules (2 failures)
  - [ ] narrative-rules (2 failures)
  - [ ] loot-rules (3 failures)

- [ ] Add tests for new modules
  - [ ] spawn-candidates.ts
  - [ ] resource-scoring.ts

### Integration Tests
- [ ] Full game loop works end-to-end
- [ ] Save/load preserves game state
- [ ] World generation consistent

### Smoke Tests
- [ ] Game boots without errors
- [ ] Can move, fight, craft, farm
- [ ] No console errors in prod

---

## 📚 Documentation

### User-Facing
- [ ] Game tutorial clear?
- [ ] Help text informative?
- [ ] Error messages helpful?

### Developer-Facing
- [ ] Contributing guide updated?
- [ ] Setup instructions current?
- [ ] Architecture guide complete?
- [ ] Code examples work?

---

## 🚀 Feature Roadmap

### Tier 1 (Foundation)
- [x] Basic chunk generation
- [x] Entity spawning (items, creatures, NPCs)
- [x] Crafting system
- [x] Combat basics
- [ ] **Fix failing tests** ← PRIORITY

### Tier 2 (Depth)
- [ ] Seasonal cycles
- [ ] More creature types
- [ ] Advanced crafting (alchemy, enchanting)
- [ ] Boss battles
- [ ] Quest system?

### Tier 3 (Polish)
- [ ] Visual effects
- [ ] Sound design
- [ ] Music system
- [ ] Accessibility features
- [ ] Localization complete

### Tier 4 (Expansion)
- [ ] Multiplayer?
- [ ] PvP elements?
- [ ] Community features?
- [ ] Content creator tools?

---

## 📋 Monthly Goals

### This Month (Dec 2025)
- [x] Refactor chunk-generation.ts ✅ DONE
- [ ] Fix failing tests (weather, crafting, narrative, loot)
- [ ] Review performance metrics
- [ ] Plan Q1 features

### Next Month (Jan 2026)
- [ ] Continue code cleanup (creature-engine.ts)
- [ ] Implement Tier 2 features
- [ ] Optimize world generation
- [ ] Add more unit tests

### Q1 2026
- [ ] Refactor remaining oversized files
- [ ] Launch public beta?
- [ ] Community feedback integration
- [ ] Performance optimization pass

---

## ✅ Completed Items

- [x] **Dec 16**: chunk-generation.ts refactored (967 → 781 lines, 9 modules)
- [x] **Dec 16**: All lint errors & warnings fixed
- [x] **Dec 16**: Tests passing for chunk-generation
- [x] **Dec 15**: offline.ts refactored (559 → 6 modules)
- [x] Multiple commits with detailed messages
- [x] Documentation updated

---

## 🔗 Related Documents

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
- [CURRENT_STRUCTURE_AUDIT.md](./CURRENT_STRUCTURE_AUDIT.md) - File organization
- [PATTERNS.md](./PATTERNS.md) - Code patterns
