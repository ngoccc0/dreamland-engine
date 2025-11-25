# Dreamland Engine - Quick Reference for AI Agents

## 🎯 Project Essence
- **Type:** AI-driven narrative text adventure (Next.js 14 + Genkit)
- **Language:** TypeScript, strictly typed
- **Architecture:** Clean (UI → Hooks → Usecases → Domain → Infra)
- **Content:** Bilingual EN/VI, data-driven, moddable
- **Key Tech:** React, Genkit/Gemini, Dexie/IndexedDB, Firebase (optional)

---

## 🚀 Essential Commands

```powershell
npm run dev              # Start game on port 9003
npm run genkit:watch    # Start AI flows (run in 2nd terminal)
npm run typecheck       # Type validation (must pass before PR)
npm run test            # Jest tests (must pass before PR)
npm run validate:narrative  # Content validation (CI gate)
```

---

## 🏗️ Layer Mapping: Where to Put Code

| Need | Layer | File Pattern | Example |
|------|-------|--------------|---------|
| **UI component** | Presentation | `src/app/`, `src/components/` | GameLayout.tsx |
| **Game action** | Usecase | `src/core/usecases/` | `farming-usecase.ts` |
| **Type definition** | Domain | `src/core/types/` | `game.ts` |
| **Business rule** | Engine | `src/core/engines/` | `effect-engine.ts` |
| **Game logic hook** | Application | `src/hooks/` | `use-action-handlers.ts` |
| **Save/load logic** | Infrastructure | `src/infrastructure/persistence/` | `indexed-db.repository.ts` |
| **AI narrative** | AI Integration | `src/ai/flows/` | `generate-narrative-flow.ts` |
| **Game data** | Data | `src/lib/game/`, `src/lib/locales/` | `items.ts`, `creatures.ts` |

---

## 🎨 8 Core Patterns (Copy-Paste Templates)

### 1. Translation (ALL user text!)
```typescript
import { getTranslatedText } from '@/lib/utils';

const name = getTranslatedText(item.name, language, t);
// ✅ Accepts: { en: 'Sword', vi: 'Kiếm' }
// ✅ Accepts: { key: 'items.sword', params: {} }
// ✅ Accepts: 'translation_key'
// ❌ NEVER: item.name.en
```

### 2. Pure Usecase Function
```typescript
// src/core/usecases/my-feature.ts
export function doSomething(chunk: Chunk, data: any): Chunk {
  const next = { ...chunk };
  // mutate next, not chunk
  return next; // return updated copy
}
```

### 3. Hook Dispatch (UI → Logic)
```typescript
const { handleMyAction } = useActionHandlers(deps);
// Call from UI:
await handleMyAction(params);
// This will: call usecase → update state → save → generate narrative
```

### 4. Persistence (via adapter)
```typescript
const repo = getRepository(); // returns appropriate adapter
await repo.save(slotId, gameState);  // No Dexie calls in UI!
```

### 5. Engine (business rules)
```typescript
export class MyEngine {
  process(entity: Entity): Entity {
    // Pure logic, no side effects, no state mutations from outside
    return updatedEntity;
  }
}
```

### 6. Type Definition (with JSDoc)
```typescript
/**
 * MyEntity represents...
 * @property field1 - Does something (0-100)
 * @example
 * const x: MyEntity = { field1: 50 };
 */
export interface MyEntity {
  field1: number;
}
```

### 7. AI Flow (Genkit)
```typescript
'use server';
import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const InputSchema = z.object({
  prompt: z.string(),
  language: z.enum(['en', 'vi']),
});

export async function myFlow(input: z.infer<typeof InputSchema>) {
  const response = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    prompt: input.prompt,
    output: { schema: OutputSchema },
  });
  return response.output;
}
```

### 8. Bilingual Item Definition
```typescript
export const itemDefinitions: Record<string, ItemDefinition> = {
  my_item: {
    name: { en: 'My Item', vi: 'Vật Phẩm Của Tôi' },
    description: { en: 'Does X', vi: 'Làm X' },
    tier: 2,
    category: 'Weapon',
    emoji: '⚔️',
    baseQuantity: { min: 1, max: 1 },
    effects: [],
  }
};
```

---

## ✅ Pre-Code Checklist (REQUIRED)

Before writing any code, do this:

- [ ] Read files mentioned in the task
- [ ] Trace data flow (how does UI action reach persistence?)
- [ ] Write 3-part plan:
  1. **Goal:** What changes? (1-2 sentences)
  2. **Scope:** Which files? (list paths)
  3. **Architecture:** 2 options + recommendation (1 sentence each)
- [ ] For logic changes: Include Logic Deep Dive + Data Trace

---

## 🚫 Red Flags (Anti-Patterns)

| ❌ Don't | ✅ Do |
|--------|-----|
| `item.name.en` | `getTranslatedText(item.name, lang, t)` |
| Call Dexie/Firebase from UI | Use repository adapter |
| Hardcode items/enemies | Use JSON definitions + data-driven |
| `useState` for game state | Use useGameState + persist |
| Mutate state directly | Return new objects / use setters |
| Skip vi translations | Always support { en: '...', vi: '...' } |
| Add logic to components | Move to usecases/hooks |
| Test without mocking Genkit | Mock `src/ai/genkit.ts` in tests |

---

## 🔗 Key File References

| Task | File | Function |
|------|------|----------|
| **Translate text** | `src/lib/utils.ts` | `getTranslatedText()` |
| **Add item** | `src/lib/game/items.ts` | `itemDefinitions` |
| **Add creature** | `src/lib/game/data/creatures/` | creature def |
| **Add recipe** | `src/lib/game/recipes.ts` | `recipes` |
| **Save/load** | `src/infrastructure/persistence/` | repository |
| **Genkit model** | `src/ai/genkit.ts` | `ai` export |
| **Language enum** | `src/lib/i18n.ts` | `Language` |
| **Main hook** | `src/hooks/use-game-engine.ts` | orchestrator |
| **Action handlers** | `src/hooks/use-action-handlers.ts` | dispatcher |
| **Narrative flows** | `src/ai/flows/` | `generateNarrative()` |
| **Offline narratives** | `src/core/engines/game/offline.ts` | `analyze_chunk_mood()` |
| **Effect engine** | `src/core/engines/effect-engine.ts` | EffectEngine class |

---

## 📋 Test Pattern (Copy-Paste)

```typescript
import { tillSoil } from '@/core/usecases/farming-usecase';

describe('farming-usecase', () => {
  test('function description', () => {
    const input: any = { x: 0, y: 0 };
    const output = tillSoil(input as any);
    expect(output.soilType).toBe('tilled');
  });
});
```

Run: `npm run test`

---

## 🎮 Common Task Flows

### Adding a New Item Type
1. Define in `src/lib/game/items.ts`
2. Add translations if needed
3. Test: `npm run test`

### Adding a Combat Action
1. Create handler in `src/hooks/use-action-handlers.ts`
2. Call usecase (e.g., `calculateDamage()`)
3. Update state (`setPlayerStats`, `setWorld`)
4. Generate narrative via `generateNarrative()`
5. Call `advanceGameTime()`

### Adding Narrative for Biome
1. Add templates to `src/lib/game/data/narrative-templates.ts`
2. Add mood tags in `analyze_chunk_mood()`
3. Test narrative generation

### Adding Genkit Flow
1. Create flow in `src/ai/flows/`
2. Define Zod schema for input/output
3. Mark with `'use server'`
4. Call from hook with `await`
5. Handle errors gracefully

---

## 🔐 Type Safety

```typescript
// Always import types from @/core/types
import type { GameState, Chunk, Enemy, PlayerStatus } from '@/core/types/game';
import type { TranslatableString, Language } from '@/core/types/i18n';

// Strict mode enabled in tsconfig.json
// All functions should have full type signatures
```

---

## 📱 Deployment Targets

- **Web:** Next.js on Vercel/Firebase
- **PWA:** Built-in (@ducanh2912/next-pwa)
- **Android:** Capacitor build
- **Offline:** Works fully offline with IndexedDB

---

## 📞 When Unsure

1. Read `COPILOT_ANALYSIS.md` (sections 2-5 for architecture)
2. Find similar code in codebase; copy-paste pattern
3. Look at test files (`__tests__/`) for usage examples
4. Check `.github/copilot-instructions.md` (existing conventions)
5. Ask one targeted question: which layer + which file?

---

## 🎯 Success Criteria (Every PR)

- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (add tests if logic changed)
- [ ] `npm run validate:narrative` passes (if narrative edited)
- [ ] All user-visible text is bilingual EN/VI
- [ ] No direct Dexie/Firebase calls from UI
- [ ] No hardcoded content (use data-driven JSON)
- [ ] Logic in usecases, not components
- [ ] Public functions have JSDoc

---

**Reference:** `COPILOT_ANALYSIS.md` for comprehensive guide  
**Last Updated:** 2025-11-23  
**Current Branch:** chore/terrain-finalize
