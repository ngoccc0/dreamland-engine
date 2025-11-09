## Hướng dẫn di chuyển & authoring cho hệ thống Narrative (tóm tắt)

Mục đích: cung cấp ví dụ nhanh cho content authors khi migrate templates sang JSON, và giới thiệu các patterns mới (continuation, continuation_fragment, eventMemory, voice-aware picks).

1) Quy ước chung
- Placeholders sử dụng snake_case invariant across locales (ví dụ `{{jungle_terrain_desc}}`).
- Các slot phải tồn tại trong lexicon cho mọi locale được hỗ trợ; validator sẽ cảnh báo nếu thiếu.

2) Hai cách dùng continuation (khi player lặp hành động)

a) Inline continuation (khuyến nghị cho control nhất quán)

Template JSON example:

```json
{
  "id": "forest_step_continue",
  "patterns": [
    {
      "id": "p1",
      "template": "{{continuation_fragment}} The path ahead is {{forest_desc}}.",
      "slots": ["continuation_fragment","forest_desc"]
    }
  ]
}
```

Ở cách này, `{{continuation_fragment}}` sẽ được lexicon thay bằng các cụm như "You keep going," hoặc giọng nội tâm tương ứng. Selector sẽ ưu tiên template chứa slot này khi `state.repeatCount` lớn.

b) Implicit continuation (assembler tự thêm vào nếu template không có slot)

Template JSON example (no continuation slot):

```json
{
  "id": "forest_step_simple",
  "patterns": [
    { "id": "p1", "template": "The path ahead is {{forest_desc}}.", "slots": ["forest_desc"] }
  ]
}
```

Assembler sẽ tự thêm một `continuation_phrase` từ lexicon trước câu khi `state.repeatCount >= 2`.

3) Lexicon: continuation phrases

Lexicon slot: `continuation_phrase` (per-locale)

Example `src/lib/narrative/data/lexicon/en.json`:

```json
{
  "continuation_phrase": [
    { "id": "en.cont.1", "text": "You keep going,", "weight": 1, "toneTags": ["neutral"] },
    { "id": "en.cont.2", "text": "You continue on,", "weight": 1, "toneTags": ["warm"] }
  ]
}
```

4) Event memory & repetition handling

- State stores `eventMemory: Record<eventKey, count>` và `repeatCount`.
- Selector nên giảm `desiredDetail` (hoặc tăng penalty cho high-detail templates) khi `eventMemory[eventKey]` vượt thresholds. Ví dụ:
  - 0-1 → normal
  - 2-3 → prefer medium/low detail
  - 4+ → minimal phrasing / continuation-only

Pseudocode selector rule:

```
if (eventMemory[eventKey] >= 3) desiredDetail = Math.max(0, desiredDetail - 1);
if (eventMemory[eventKey] >= 6) desiredDetail = 0; // very short
```

5) Voice / character internal monologue

- Templates may include `{{internal_monologue}}` or `{{character_thought}}` slots.
- Lexicon entries can have `toneTags` or `voice` metadata. At pick time pass `options.tone` or `options.persona.voice` to `Lexicon.pick` to bias selections.

Example slot:

```json
"internal_monologue": [
  { "id": "en.int.1", "text": "You wonder if this is the right path.", "voice": ["thoughtful"], "weight": 1 }
]
```

6) Migration checklist (per-PR small batch)
- Add JSON templates + lexicon for 5–10 templates.
- Add Zod validation (schema must pass) and run `npm run validate:narrative`.
- Run `npm test` and fix any placeholder failures.
- Push PR and request content-team preview via `/dev/narrative-preview`.

7) Tests to run locally

```powershell
npm run validate:narrative
npm test -- -i
```

8) Authoring tips
- Prefer `{{continuation_fragment}}` inline when you need the continuation phrase placed exactly.
- Use `tags` on templates (e.g., `tags: ["transition","continuation_candidate"]`) to help selector heuristics.
- Keep lexicon entry arrays balanced; use `weight` to prefer common vs rare picks.

9) Example: transition template for biome change

```json
{
  "id": "biome_transition_forest_to_swamp",
  "tags": ["transition","forest->swamp"],
  "patterns": [
    { "template": "{{continuation_fragment}} The trees thin and the ground turns soggy.", "slots": ["continuation_fragment"] }
  ]
}
```

If you'd like, I can add a short Zod schema sample and an automated migration helper in the next PR.

---
Tóm tắt: tài liệu này là reference nhanh cho content authors. Tiếp theo tôi sẽ cập nhật validator để kiểm tra `continuation_phrase` trên mỗi locale khi cần và thêm zod schema mẫu nếu bạn OK.
