# Báo cáo Kỹ thuật Lỗi Hiển thị Localization Key (worldName_blackwoodManor, mansion_narrative1)

**Ngày:** 18/07/2025
**Mục tiêu:** Thu thập thông tin chi tiết về việc các key bản địa hóa (localization keys) đang hiển thị trực tiếp trên giao diện người dùng thay vì nội dung đã được dịch, cụ thể là các key `worldName_blackwoodManor` và `mansion_narrative1`.

---

## 1. Mô tả Lỗi & Bối cảnh Hiện tại

### Phân tích
- **Hành vi lỗi:** Các key như `worldName_blackwoodManor` và `mansion_narrative1` đang hiển thị nguyên văn trên giao diện người dùng, thay vì các chuỗi "Blackwood Manor" hoặc "Một tia chớp lóe lên...".
- **Vị trí lỗi:** Lỗi này xảy ra ở màn hình chọn thế giới (save slot) và trong phần tường thuật chính của game.
- **Tần suất:** Lỗi xảy ra một cách nhất quán mỗi khi một "thế giới tạo sẵn" (pre-made world) được tải hoặc hiển thị.
- **Ảnh hưởng:** Lỗi làm cho game trông chưa hoàn thiện, thiếu chuyên nghiệp và gây khó hiểu cho người chơi, phá vỡ sự nhập vai.

---

## 2. Thông tin về Hệ thống Localization (i18n)

### Phân tích
- **Thư viện/Framework:** Hệ thống sử dụng một giải pháp **custom**, không phụ thuộc vào các thư viện bên ngoài như `react-i18next`. Logic dịch thuật được quản lý hoàn toàn trong `src/context/language-context.tsx`.
- **File cấu hình i18n:** Logic tập trung tại `src/lib/i18n.ts`, nơi nó tổng hợp tất cả các module dịch từ thư mục `src/lib/locales/`.
- **Cách tích hợp với React:** Toàn bộ ứng dụng được bọc trong `LanguageProvider` tại `src/app/layout.tsx`, cung cấp hàm dịch `t()` và ngôn ngữ hiện tại `language` cho tất cả các component con thông qua hook `useLanguage`.

### Trích dẫn Code/Cấu hình

**`src/lib/i18n.ts` (Cách tổng hợp):**
```typescript
import { commonTranslations } from './locales/common';
// ... import các module khác
import { premadeWorldTranslations } from './locales/premade-worlds';
// ...

const modules = [
  commonTranslations,
  // ...
  premadeWorldTranslations,
  // ...
];

let translations_en = {};
let translations_vi = {};

modules.forEach(module => {
  translations_en = mergeDeep(translations_en, module.en);
  translations_vi = mergeDeep(translations_vi, module.vi);
});

export const translations = {
  en: translations_en,
  vi: translations_vi,
};
```

**`src/app/layout.tsx` (Cách cung cấp cho App):**
```tsx
//...
import { LanguageProvider } from '@/context/language-context';

export default function RootLayout({ children }: { children: React.ReactNode; }) {
  return (
    <html lang="en" className="dark">
      {/* ... */}
      <body>
        <LanguageProvider>
          {/* ... các provider khác ... */}
          {children}
        </LanguageProvider>
        {/* ... */}
      </body>
    </html>
  );
}
```

---

## 3. Cấu trúc & Nội dung File Dịch

### Phân tích
- **Cấu trúc thư mục:** Các file dịch được tổ chức theo module trong `src/lib/locales/`, ví dụ `premade-worlds.ts`, `items.ts`, `ui.ts`. Mỗi file export một object có hai key `en` và `vi`.
- **Nội dung cụ thể:** Các key `worldName_blackwoodManor` và `mansion_narrative1` được định nghĩa trong `src/lib/locales/premade-worlds.ts`.

### Trích dẫn Code/Cấu hình

**`src/lib/locales/premade-worlds.ts`:**
```typescript
export const premadeWorldTranslations = {
  en: {
    // World Names
    worldName_blackwoodManor: 'Blackwood Manor',
    // ... các tên thế giới khác
    
    // Narratives
    mansion_narrative1: "A crack of lightning illuminates the imposing silhouette of Blackwood Manor. You find yourself trapped inside, the heavy oak door slamming shut behind you. A cold whisper echoes down the grand hallway. This house is alive, and it does not want you to leave.",
    // ... các tường thuật khác
  },
  vi: {
    // World Names
    worldName_blackwoodManor: 'Biệt thự Blackwood',
    // ...
    
    // Narratives
    mansion_narrative1: "Một tia chớp lóe lên soi sáng hình bóng hùng vĩ của Biệt thự Blackwood. Bạn thấy mình bị mắc kẹt bên trong, cánh cửa gỗ sồi nặng nề đóng sầm lại sau lưng bạn. Một lời thì thầm lạnh lẽo vang vọng xuống hành lang lớn. Ngôi nhà này còn sống, và nó không muốn bạn rời đi.",
    // ...
  }
};
```
**Kết luận:** Các key **CÓ TỒN TẠI** và có giá trị hợp lệ trong file dịch. Do đó, lỗi không nằm ở việc thiếu key.

---

## 4. Cách sử dụng Localization Keys trong Codebase

### Phân tích
- **Vị trí lỗi:**
  1.  **Tên Thế giới:** `src/app/page.tsx`, bên trong `CardTitle` khi hiển thị các save slot.
  2.  **Tường thuật:** `src/hooks/game-lifecycle/useGameInitialization.ts`, khi khởi tạo tường thuật cho game mới.
- **Nguyên nhân cốt lõi:** Cả hai vị trí đều đang sử dụng `getTranslatedText` để xử lý một `TranslatableString`. Tuy nhiên, `worldName` và `initialNarrative` từ các "thế giới tạo sẵn" là các `string` (key), không phải là object `{ en, vi }`. Hàm `getTranslatedText` khi nhận vào một string, nó sẽ trả về chính string đó **nếu không được cung cấp hàm `t` để tra cứu**.
 
### Trích dẫn Code/Cấu hình

**`src/app/page.tsx` (Lỗi hiển thị tên thế giới):**
```tsx
// ...
<CardTitle className="truncate">{getTranslatedText(slot.worldSetup.worldName, language, t)}</CardTitle>
// ...
```
*Ghi chú: Mã nguồn này đã được sửa ở một bước trước đó. Phiên bản gây lỗi chỉ là `getTranslatedText(slot.worldSetup.worldName, language)`. Tôi đã thêm `t` vào.*

**`src/hooks/game-lifecycle/useGameInitialization.ts` (Lỗi hiển thị tường thuật):**
```tsx
//...
if ((stateToInitialize.narrativeLog || []).length === 0) {
     const startingChunk = worldSnapshot[initialPosKey];
     if (startingChunk) {
        // Lỗi ở đây: `initialNarrative` là key, nhưng không được dịch bằng t()
        const initialNarrative = getTranslatedText(stateToInitialize.worldSetup.initialNarrative, language, t);
        addNarrativeEntry(initialNarrative, 'narrative');
    }
} 
//...
```

**`src/lib/utils.ts` (Hàm getTranslatedText):**
```typescript
export function getTranslatedText(
    translatable: TranslatableString,
    language: Language,
    t?: (key: TranslationKey, options?: any) => string
): string {
    if (typeof translatable === 'string') {
        // Nếu là string, nó cần hàm `t` để dịch. Nếu không có `t`, nó trả về chính nó.
        return t ? t(translatable) : translatable;
    }
    if (typeof translatable === 'object' && translatable !== null) {
        return translatable[language] || translatable['en'] || '';
    }
    return '';
}
```

---

## 5. Log và Báo lỗi từ Console/Compiler

### Phân tích
- **Console Log:** Không có lỗi trực tiếp nào từ console của trình duyệt. Thư viện i18n không báo lỗi "missing key" vì hệ thống là custom và không có cơ chế cảnh báo này. Lỗi chỉ biểu hiện ra ở mặt giao diện.
- **Compiler/Build:** Không có lỗi nào trong quá trình biên dịch.

---

## 6. Kết luận & Đề xuất

- **Nguyên nhân gốc rễ:** Vấn đề không nằm ở việc thiếu key dịch, mà là do sự **không nhất quán về kiểu dữ liệu** của `worldName` và `initialNarrative` giữa các "thế giới tạo sẵn" (pre-made, dùng key `string`) và "thế giới do AI tạo" (dùng object `{ en, vi }`). Hàm `getTranslatedText` đã xử lý đúng, nhưng các lời gọi đến nó ở một số nơi đã không cung cấp hàm dịch `t()` cần thiết để xử lý các key `string`.

- **Giải pháp đề xuất:**
  1.  **Sửa logic `useGameInitialization.ts`:** Đảm bảo `getTranslatedText` được gọi với đủ 3 tham số (`key`, `language`, `t`) khi khởi tạo tường thuật đầu tiên.
  2.  **(Tùy chọn - Dài hạn):** Để mã nguồn sạch hơn, có thể cân nhắc việc chuẩn hóa tất cả dữ liệu pre-made. Thay vì dùng key, hãy chuyển đổi tất cả `worldName` và `initialNarrative` trong `premade-worlds/*.ts` thành object `{ en: '...', vi: '...' }`. Điều này sẽ loại bỏ sự cần thiết phải truyền hàm `t` vào `getTranslatedText` trong nhiều trường hợp.
  
Báo cáo này xác nhận rằng việc sửa lỗi cần tập trung vào logic gọi hàm dịch, chứ không phải là nội dung của các file dịch.
