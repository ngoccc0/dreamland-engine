# Báo cáo sửa lỗi: Xử lý `TranslatableString` trong các Component UI

**Ngày:** 15/07/2024
**Người thực hiện:** AI Code Partner
**Yêu cầu bởi:** Đội trưởng

## I. Tóm Tắt Vấn Đề

Một loạt lỗi TypeScript đã phát sinh trên các tệp component giao diện người dùng (UI), cụ thể là `inventory-popup.tsx`, `minimap.tsx`, `status-popup.tsx`, và `world-setup.tsx`.

Nguyên nhân gốc rễ của các lỗi này là do việc truyền một đối tượng `TranslatableString` (có dạng `{ en: '...', vi: '...' }`) trực tiếp vào hàm `t()` của thư viện i18n. Hàm `t()` được thiết kế để chỉ nhận một chuỗi `string` làm khóa dịch (translation key), dẫn đến lỗi không tương thích kiểu dữ liệu: `Argument of type 'string | { en: string; vi: string; }' is not assignable to parameter of type 'string'`.

## II. Kế Hoạch & Giải Pháp Thực Hiện

Dựa trên chỉ thị rõ ràng của Đội trưởng, giải pháp chung đã được áp dụng thống nhất trên tất cả các file bị ảnh hưởng:

1.  **Sử dụng `getTranslatedText` Utility:** Một hàm tiện ích có tên `getTranslatedText` đã được sử dụng như một "bộ điều hợp" (adapter). Hàm này nhận vào một `TranslatableString` và ngôn ngữ hiện tại, sau đó trả về chuỗi văn bản phù hợp cho ngôn ngữ đó.
2.  **Lấy Ngôn ngữ từ Context:** Trong mỗi component, hook `useLanguage` được sử dụng để lấy ra biến `language` hiện tại và hàm `t`.
3.  **Bọc các biến lỗi:** Tất cả các biến gây lỗi (ví dụ: `enemy.type`, `item.name`, `skill.description`) đã được bọc trong hàm `getTranslatedText` trước khi truyền vào hàm `t()` hoặc sử dụng làm `key` trong React.

    *   **Ví dụ (trước khi sửa):** `t(item.name)`
    *   **Ví dụ (sau khi sửa):** `t(getTranslatedText(item.name, language, t))` hoặc chỉ `getTranslatedText(item.name, language)` nếu không cần dịch thêm.

4.  **Sửa lỗi React `key`:** Đối với các phần tử được render bằng `.map()`, `key` của React cần phải là một chuỗi duy nhất và ổn định. Giải pháp tạm thời được áp dụng là sử dụng phiên bản tiếng Anh của tên làm key: `key={getTranslatedText(item.name, 'en')}`.

## III. Chi Tiết Thay Đổi Theo Từng File

### 1. `src/components/game/inventory-popup.tsx`

*   **Lỗi:** `t(enemy!.type)` trong `DropdownMenuItem` gây lỗi.
*   **Sửa đổi:** Đã import `getTranslatedText` và `useLanguage`, sau đó sửa lại thành `getTranslatedText(enemy!.type, language, t)`. Đồng thời, các thuộc tính khác như `item.name` và `definition.description` cũng được cập nhật để sử dụng `getTranslatedText`.

### 2. `src/components/game/minimap.tsx`

*   **Lỗi:** `t()` được gọi với `s.name`, `item.name`, `chunk.enemy.type`, `npc.name` trong component `MapCellDetails`.
*   **Sửa đổi:** Component `MapCellDetails` giờ đây cũng sử dụng `useLanguage` và áp dụng `getTranslatedText` cho tất cả các thuộc tính đa ngôn ngữ trước khi hiển thị. `aria-label` cho `structure` cũng được sửa tương tự.

### 3. `src/components/game/status-popup.tsx`

*   **Lỗi:** Các thuộc tính `item.name`, `skill.name`, và `pet.type` được truyền vào `t()` một cách không an toàn.
*   **Sửa đổi:** Đã áp dụng `getTranslatedText` cho tất cả các thuộc tính này để đảm bảo chỉ có chuỗi `string` được truyền vào hàm dịch.

### 4. `src/components/game/world-setup.tsx`

*   **Lỗi:** Trong component `SelectionCard`, các thuộc tính `option.name` và `option.description` của `Skill` được truyền vào `t()`. Trong phần render danh sách vật phẩm, `item.name` cũng gặp lỗi tương tự.
*   **Sửa đổi:** Đã sử dụng `getTranslatedText` để xử lý các thuộc tính này trước khi hiển thị, đảm bảo tính nhất quán và loại bỏ lỗi.

## IV. Kết Luận

Đợt sửa lỗi này đã giải quyết thành công nhóm lỗi lớn nhất liên quan đến việc xử lý chuỗi đa ngôn ngữ. Các component UI giờ đây đã hoàn toàn tuân thủ đúng kiểu dữ liệu, giúp hệ thống i18n hoạt động ổn định và đáng tin cậy.

**Trạng thái:** **Hoàn tất.** Các lỗi `TranslatableString` đã được khắc phục. Sẵn sàng cho chỉ thị tiếp theo.
