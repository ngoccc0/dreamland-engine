# CODE PATTERNS & DOCUMENTATION INDEX

This folder contains the architectural patterns and guidelines for Dreamland Engine.

## 📚 Documentation Files

### 1. **CODING_PATTERNS.md** - Architectural & Code Standards
Theoretical foundations and patterns used throughout the codebase.

**Patterns covered:**
- Usecase Pattern (Pure Functions)
- Hook Pattern (React State Wiring)
- Rules Pattern (core/rules/ - Pure Game Logic)
- Component Pattern (React UI)
- Repository Pattern (Data Access Abstraction)
- Effect/Side-Effect Pattern
- Immutability Pattern
- Bilingual Text Pattern (EN/VI support)
- TSDoc Standards (GLASS BOX PATTERN)

**When to read**: Understanding code structure, architecture decisions, code reviews, writing new modules.

---

### 2. **GUIDES_HOW_TO.md** - Practical Implementation Guides
Step-by-step instructions for common tasks in Dreamland Engine.

**Guides covered:**
- How to Add a New Quest
- How to Add an Achievement
- How to Extend Statistics
- How to Add a New Event Type
- How to Query Action History
- How to Add a New Component
- How to Debug Events
- How to Add a New Location/Biome
- Common Patterns & Troubleshooting

**When to read**: Implementing features, debugging issues, following best practices.

---

### 3. **ARCHITECTURE.md** - System Design
Overall system architecture, file organization, and integration patterns.

**Covers:**
- System layers (UI → Hooks → Core → Data)
- File organization with line limits
- Integration flow diagram
- Phase progress tracking

**When to read**: Understanding system structure, where to place files, design decisions.

---

### 4. **CODING_STANDARDS.md** - Code Style & Organization
Code style, documentation requirements, and file organization rules.

**Covers:**
- File organization by path (with line limits)
- TSDoc documentation requirements (100% coverage)
- Import/export standards
- Code style conventions
- Naming conventions

**When to read**: Writing code, setting up new files, naming variables/functions/files.

---

## 🚀 Quick Start by Task

| Task | Document | Section |
|------|----------|---------|
| Add a new quest | GUIDES_HOW_TO.md | How to Add a New Quest |
| Add an achievement | GUIDES_HOW_TO.md | How to Add an Achievement |
| Extend statistics | GUIDES_HOW_TO.md | How to Extend Statistics |
| Add a new event type | GUIDES_HOW_TO.md | How to Add a New Event Type |
| Query action history | GUIDES_HOW_TO.md | How to Query Action History |
| Create a component | GUIDES_HOW_TO.md | How to Add a New Component |
| Debug events | GUIDES_HOW_TO.md | How to Debug Events |
| Add a location/biome | GUIDES_HOW_TO.md | How to Add a New Location/Biome |
| Understand usecase pattern | CODING_PATTERNS.md | Usecase Pattern |
| Understand hook pattern | CODING_PATTERNS.md | Hook Pattern |
| Understand rules pattern | CODING_PATTERNS.md | Rules Pattern |
| Learn immutability | CODING_PATTERNS.md | Immutability Pattern |
| See file organization | CODING_STANDARDS.md | File Organization |
| Debug issues | GUIDES_HOW_TO.md | Troubleshooting |
| Understand TSDoc | CODING_PATTERNS.md | TSDoc Standards |

---

## 📋 System Architecture Summary

```
┌─────────────────────────────────────────────┐
│          React Components (UI Layer)        │
│  (display state, handle user input)         │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│         React Hooks (State Layer)           │
│  (useState, useCallback, call usecases)     │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│      Core Usecases (Orchestration)          │
│  (call rules, return [state, effects])      │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│     Core Rules (Pure Game Logic)            │
│  (math, calculations, NO mutations)         │
└────────────────┬────────────────────────────┘
                 │
┌────────────────▼────────────────────────────┐
│  Static Game Data (Never Changes)           │
│  (creatures, items, locations, etc)         │
└─────────────────────────────────────────────┘
```

---

## 🎯 Phase Progress

**Phase 2.0: Statistics Engine** ✅ COMPLETE
- Event-driven architecture
- 9 discriminated union event types
- Statistics tracking (4 categories)
- Action history immutable log
- Quest/Achievement auto-evaluation

**Phase I-1: Event Emission** ✅ COMPLETE
- CREATURE_KILLED, ITEM_GATHERED, ITEM_CRAFTED, DAMAGE, LEVEL_UP

**Phase I-2: Action Tracker + XP** ✅ COMPLETE
- Immutable action history
- XP rewards on combat
- LEVEL_UP event emission

**Phase I-3: Unit Testing** ❌ SKIPPED
- Can be added later if needed
- Focus on practical development

**Phase I-4: Developer Guides** ✅ IN PROGRESS
- See GUIDES_HOW_TO.md

---

## Key Principles

1. **Immutability**: Never mutate state directly, use spread operators
2. **Pure Functions**: Core logic has no side effects, returns [newState, effects]
3. **Separation of Concerns**: UI, State, Logic, Data are separate layers
4. **Type Safety**: Full TypeScript strict mode, no `any` types
5. **Documentation**: 100% TSDoc coverage on exports, logic in @remarks
6. **Sparse Data**: Only non-zero values stored in nested objects
7. **Discriminated Unions**: Event types use z.discriminatedUnion for type safety

---

## Common Workflows

### Creating a New Feature
1. Define data in `src/core/data/`
2. Create schema in `src/core/domain/`
3. Create rules in `src/core/rules/` (pure logic)
4. Create usecase in `src/core/usecases/` (orchestration)
5. Create hook in `src/hooks/` (state management)
6. Create component in `src/components/` (UI)
7. Add documentation to GUIDES_HOW_TO.md

### Adding a Quest
1. Define template in `src/core/data/quests/`
2. Done! (auto-evaluation + completion)

### Debugging a System
1. Enable event logging in core/event-dispatcher.ts
2. Check console for event flow
3. Inspect localStorage for statistics
4. Query ActionHistory for action log
5. See GUIDES_HOW_TO.md → Troubleshooting

---

## File Structure

```
docs/
├── PATTERNS.md ← You are here (index file)
├── CODING_PATTERNS.md (patterns + standards, ~600 lines)
├── GUIDES_HOW_TO.md (how-to guides, ~530 lines)
├── ARCHITECTURE.md (system design)
└── CODING_STANDARDS.md (code style + organization)

src/
├── app/ (Next.js pages/layouts, <200 lines each)
├── components/ (React UI, <300 lines each)
├── hooks/ (State wiring, <250 lines each)
├── core/ (Game logic)
│   ├── domain/ (Zod schemas, <400 lines each)
│   ├── data/ (Static game data)
│   ├── rules/ (Pure game math)
│   ├── usecases/ (Orchestration)
│   ├── statistics/ (Statistics engine)
│   ├── action-tracker/ (Action history)
│   └── event-dispatcher/ (Event emission)
├── lib/ (Utilities)
└── infrastructure/ (External services)
```

---

## Important Notes

- **Always refer to CODING_PATTERNS.md** when unsure about how to structure code
- **Always refer to GUIDES_HOW_TO.md** when implementing features
- **Keep files under line limits** specified in CODING_STANDARDS.md
- **Write TSDoc for all exports** with @remarks explaining logic
- **Use discriminated unions** for event types and game entities
- **Process effects after state updates** in hooks

---

## Support

- **Questions about patterns?** → See CODING_PATTERNS.md
- **Need to implement a feature?** → See GUIDES_HOW_TO.md
- **Need file organization rules?** → See CODING_STANDARDS.md
- **Need system overview?** → See ARCHITECTURE.md
