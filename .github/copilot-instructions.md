## Copilot instructions — dreamland-engine (hợp nhất)

Mục tiêu ngắn gọn: cung cấp một tài liệu duy nhất, rõ ràng để AI agents nhanh chóng trở nên hữu dụng trong repo này — bao gồm lệnh dev/test/typecheck chính xác, các nguyên tắc bắt buộc, quy trình phân tích trước khi code, và điểm tham chiếu mã quan trọng.

Quick commands (dùng chính xác các npm scripts):

```powershell
# dev server (Next.js) trên cổng 9003
npm run dev

# kiểm tra kiểu (typecheck)
npm run typecheck

# chạy unit tests
npm run test

# validate narrative placeholders
npm run validate:narrative

# sao chép precomputed narrative vào public
npm run precompute:copy

# genkit AI dev tools
npm run genkit:dev
```

Quy ước bắt buộc (đọc kỹ trước khi sửa mã)
- Phân lớp sạch (Clean Architecture): tôn trọng separation of concerns.
  - Domain: `src/core/types`, `src/core/entities`
  - Application (Usecases): `src/core/usecases` — UI phải gọi usecases, không thao tác trực tiếp IndexedDB/engines.
  - Engines (business rules): `src/core/engines`
  - Infra: `src/infrastructure`, `src/ai`
- TypeScript + TSDoc: hàm/kiểu public cần typed và document rõ (@param, @returns, ví dụ khi cần).
- Dịch thuật: TUYỆT ĐỐI dùng `getTranslatedText(...)` từ `src/lib/utils.ts` để lấy chuỗi — không truy cập `.en`/`.vi` trực tiếp.
  - Ví dụ: `src/hooks/use-action-handlers.ts`, `src/lib/game/engine/offline.ts`.
- Persistence: dùng adapter trong `src/infrastructure/persistence` (Dexie/IndexedDB).
- Moddability: nội dung (items, terrain, enemies) nên nằm trong `src/lib/definitions/*` hoặc `src/lib/locales/*` (data-driven).

QUY TRÌNH BẮT BUỘC TRƯỚC KHI VIẾT MÃ (KHÔNG CODE NGAY)
1) Đọc và nắm bối cảnh: trước khi viết bất kỳ dòng mã nào, agent phải đọc các file liên quan (ít nhất: file được đề cập trong ticket/issue, các usecase/engine/infra liên quan, và các định nghĩa dữ liệu). Ghi rõ các file đã đọc trong đề xuất kế hoạch.
2) Trình bày kế hoạch ngắn (required): trả lời 3 phần ngắn gọn trước khi code:
   - Mục tiêu & deliverable: sẽ thay đổi gì (1-2 câu).
   - Phạm vi & vị trí sửa: liệt kê file/paths chính sẽ chỉnh sửa (vd: `src/core/usecases/foo.ts`, `src/lib/definitions/bar.json`).
   - Các lựa chọn kiến trúc (2 options tối đa) với pros/cons ngắn (1 câu mỗi cái) và lựa chọn đề xuất.
3) Khi được phép, hiện thực hoá theo kế hoạch đã trình bày và commit kèm mô tả thay đổi + ảnh hưởng ngắn.

LOGIC DEEP DIVE & DATA TRACE (MANDATORY WHEN CHANGING LOGIC)
* Khi thay đổi logic quan trọng (business rules, engines, usecases), kèm theo **Logic Deep Dive** ngắn (2-6 câu) giải thích cách hoạt động, và **Data Trace** nhỏ (1 ví dụ đầu vào → bước trung gian → kết quả) gồm:
  - Input mẫu (nhỏ, rõ ràng).
  - Các bước chính (tối đa 6 bước) và giá trị các biến quan trọng sau mỗi bước.
  - Kết quả đầu ra và tác động đổi mới tới hệ thống (1-2 câu).
* Mục tiêu: giúp reviewer hiểu nhanh vì sao thay đổi an toàn và chính xác.

Architecture & where to look
- Next.js frontend + server components (root `app/`, `src/app`).
- Clean-architecture layers in `src/core/`:
  - Domain: `src/core/types`, `src/core/entities`
  - Application: `src/core/usecases` (usecases orchestrate infra + domain)
  - Engines: `src/core/engines` (game rules)
- Infrastructure and adapters: `src/infrastructure/` and `src/ai/` (GenKit integrations).

Key project-specific conventions
- TypeScript & TSDoc: public functions/types should be typed and documented; prefer explicit types.
- Translations: ALWAYS use `getTranslatedText(...)` from `src/lib/utils.ts` for TranslatableString handling.
  - Examples: `src/hooks/use-action-handlers.ts`, `src/lib/game/engine/offline.ts`.
- UI → Usecases: UI code should call usecases/hooks (e.g., `src/hooks/*`) rather than touching IndexedDB/engines directly.
  - Example of wiring: `src/hooks/use-action-handlers.ts`.
- Persistence: Dexie/IndexedDB adapters live under `src/infrastructure/persistence` — use the adapter interfaces.
- Definitions/moddability: content (items, terrain, enemies) is defined in JSON/modules under `src/lib/definitions` and `src/lib/locales` — prefer data-driven additions.

Narrative & precompute tooling
- Narrative assembler: `src/lib/narrative/assembler.ts`.
- Precompute and validation scripts in `scripts/`:
  - `scripts/precompute-narrative.js`,
  - `scripts/copy-precomputed-to-public.js`,
  - `scripts/validate-narrative-placeholders.js` (run in CI/PRs when narrative changes).

PR checklist for agents
- Run `npm run typecheck` and `npm run test` locally on proposed changes.
- If editing translations, update `src/lib/locales/*` and ensure `src/lib/i18n.ts` merges keys correctly.
- For content changes (items/terrain/enemies), update JSON definitions under `src/lib/definitions/` and the registry using existing patterns; run narrative validation if relevant.

When unsure, ask exactly one targeted question: which layer should be modified (UI/usecase/engine/infrastructure) and name the file you intend to change.

---
Ghi chú: tệp này kết hợp các yêu cầu thực thi (typecheck/tests/narrative) và nguyên tắc kiến trúc/tiêu chuẩn mã của repo; phần "Logic Deep Dive & Data Trace" đã được giữ lại và làm ngắn gọn để phù hợp với quy trình review.
## Copilot instructions — dreamland-engine (concise)

Purpose: short, actionable guidance so AI agents can be productive immediately in this repo.

Quick commands (use these exact npm scripts):

```powershell
# dev server (Next.js) on port 9003
npm run dev

# typecheck only
npm run typecheck

# run unit tests
npm run test

# validate narrative placeholders
npm run validate:narrative

# copy precomputed narrative assets to public
npm run precompute:copy

# genkit AI dev tools
npm run genkit:dev
```

Architecture & where to look
- Next.js frontend + server components (root `app/`, `src/app`).
- Clean-architecture layers in `src/core/`:
  - Domain: `src/core/types`, `src/core/entities`
  - Application: `src/core/usecases` (usecases orchestrate infra + domain)
  - Engines: `src/core/engines` (game rules)
- Infrastructure and adapters: `src/infrastructure/` and `src/ai/` (GenKit integrations).

Key project-specific conventions
- TypeScript & TSDoc: public functions/types should be typed and documented; prefer explicit types.
- Translations: ALWAYS use `getTranslatedText(...)` from `src/lib/utils.ts` for TranslatableString handling.
  - Examples: `src/hooks/use-action-handlers.ts`, `src/lib/game/engine/offline.ts`.
- UI → Usecases: UI code should call usecases/hooks (e.g., `src/hooks/*`) rather than touching IndexedDB/engines directly.
  - Example of wiring: `src/hooks/use-action-handlers.ts`.
- Persistence: Dexie/IndexedDB adapters live under `src/infrastructure/persistence` — use the adapter interfaces.
- Definitions/moddability: content (items, terrain, enemies) is defined in JSON/modules under `src/lib/definitions` and `src/lib/locales` — prefer data-driven additions.

Narrative & precompute tooling
