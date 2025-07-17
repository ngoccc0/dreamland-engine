# **Dreamland Engine - Nhật Ký Phát Triển (Update Log)**

Chào mừng các Đội trưởng và những người đồng hành đến với nhật ký phát triển chính thức của Dreamland Engine! Tại đây, chúng tôi sẽ ghi lại những thay đổi, nâng cấp và cả những quyết định thiết kế quan trọng đã định hình nên thế giới này.

---

## **Bản cập nhật v0.2.1 - "La Bàn Của Người Kể Chuyện" (13/07 - 23:22)**

*Tên mã: The Storyteller's Compass*

### 🌟 **Giới thiệu chung**

Đây là một bản vá nhỏ nhưng cực kỳ quan trọng, tập trung vào việc "chỉnh đốn" lại cấu trúc nội bộ của engine. Giống như việc hiệu chỉnh lại la bàn, bản cập nhật này đảm bảo các "luồng thông tin" tường thuật của chúng ta đi đúng hướng, giải quyết các lỗi nghiêm trọng và giúp hệ thống hoạt động ổn định hơn.

### ✨ **Thay đổi chính & Phân tích**

#### 1. **Tái cấu trúc và sửa lỗi Import Engine Tường thuật Offline**
*   **Thay đổi:** Di chuyển các hàm cốt lõi của engine tường thuật offline (`generateOfflineNarrative`, `generateOfflineActionNarrative`, `handleSearchAction`) từ `generation.ts` về đúng "nhà" của chúng trong `offline.ts`. Đồng thời, tất cả các lệnh `import` trong `use-action-handlers.ts` đã được cập nhật để trỏ đến vị trí mới chính xác.
*   **Phân tích:**
    *   **Nguyên nhân:** Các hàm logic tường thuật bị đặt sai chỗ, dẫn đến lỗi runtime nghiêm trọng (`... is not a function`) do `use-action-handlers` không thể tìm thấy chúng.
    *   **Giải pháp:** Bằng việc di chuyển và sửa các đường dẫn import, chúng ta đã thực thi một sự "phân tách vai trò" (separation of concerns) rõ ràng hơn: `generation.ts` chỉ chịu trách nhiệm tạo ra cấu trúc thế giới, trong khi `offline.ts` quản lý logic về cách thế giới đó được mô tả và tương tác khi không có AI.
*   **Insight:** Đây là một bài học kinh điển về kiến trúc phần mềm. Một cấu trúc module rõ ràng không chỉ giúp code dễ đọc hơn mà còn là yếu tố sống còn để ngăn ngừa các lỗi logic khó tìm. "La bàn" của chúng ta giờ đã chỉ đúng hướng.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Trải nghiệm người chơi:** Người chơi sẽ không còn gặp phải lỗi game bị "đứng hình" hoặc không phản hồi khi thực hiện các hành động trong chế độ offline. Trải nghiệm giờ đây sẽ liền mạch và ổn định hơn.
*   **Hướng phát triển:** Với cấu trúc đã được dọn dẹp, việc mở rộng engine tường thuật offline (ví dụ: thêm các hành động offline phức tạp hơn) sẽ trở nên dễ dàng và an toàn hơn rất nhiều.

---

## **Bản cập nhật lớn - Version 0.2: "The Architect's Blueprint"**

*Tên mã: Kiến trúc sư Tái cấu trúc*

### 🌟 **Giới thiệu chung**

Đây là một bản cập nhật nền tảng, tập trung vào việc tái cấu trúc sâu rộng "bộ não" của engine. Mặc dù người chơi có thể chưa thấy nhiều thay đổi trực tiếp về mặt "tính năng", nhưng những nâng cấp này là cực kỳ quan trọng, dọn đường cho vô số khả năng mới trong tương lai. Chúng ta đã thay thế nền móng cũ bằng một bộ khung kiến trúc mạnh mẽ, linh hoạt và sẵn sàng cho việc mở rộng.

### ✨ **Thay đổi chính & Phân tích**

#### 1. **Nâng cấp Engine Tường thuật Offline (Narrative Engine v2.0)**

*   **Thay đổi:** Loại bỏ hệ thống template tĩnh, đơn giản. Triển khai một engine tường thuật động hoàn toàn mới, dựa trên "Tâm trạng" (Mood).
*   **Phân tích:**
    *   Hàm `analyze_chunk_mood` giờ đây có thể "đọc vị" các chỉ số của một khu vực (độ nguy hiểm, ánh sáng, độ ẩm...) và chuyển đổi chúng thành các tag tâm trạng (ví dụ: `Danger`, `Mysterious`, `Lush`).
    *   Hệ thống sẽ lựa chọn các mẫu câu chuyện (`NarrativeTemplate`) dựa trên sự tương thích giữa tâm trạng của template và tâm trạng của khu vực, cũng như các điều kiện khác (thời gian, trạng thái người chơi).
*   **Insight:** Đây là bước chuyển mình từ một "con vẹt" đọc lại các câu có sẵn sang một "người kể chuyện" biết "cảm nhận" và mô tả môi trường một cách có hồn, ngay cả khi không có AI online.

#### 2. **Kiến trúc Đa ngôn ngữ "Hybrid" (i18n System Overhaul)**

*   **Thay đổi:** Triển khai một chiến lược đa ngôn ngữ kết hợp, cho phép hệ thống xử lý cả hai loại chuỗi văn bản:
    1.  **Translation Keys:** Dành cho các chuỗi UI tĩnh, được quản lý trong file ngôn ngữ.
    2.  **TranslatableString Objects (`{ en: '...', vi: '...' }`):** Dành cho các dữ liệu động trong game (tên vật phẩm, mô tả sự kiện) được định nghĩa trực tiếp trong file data.
*   **Phân tích:** Hàm helper `getTranslatedText` được tạo ra để xử lý linh hoạt cả hai trường hợp trên, đảm bảo code luôn gọn gàng và logic hiển thị văn bản được thống nhất.
*   **Insight:** Đây là một thay đổi CỰC KỲ QUAN TRỌNG, mở ra cánh cửa cho việc modding. Giờ đây, các modder có thể dễ dàng thêm vật phẩm, nhiệm vụ mới với đầy đủ mô tả đa ngôn ngữ mà không cần can thiệp vào hệ thống i18n phức tạp của game.

#### 3. **Chuẩn hóa Toàn bộ Dữ liệu Game**

*   **Thay đổi:** Tất cả các chỉ số môi trường trong game (`dangerLevel`, `lightLevel`, `moisture`...) đã được chuẩn hóa theo dải giá trị `0-100`.
*   **Phân tích:** Việc này giúp cho việc cân bằng game và thiết lập các điều kiện trở nên trực quan và nhất quán hơn rất nhiều. Các hàm logic như `analyze_chunk_mood` cũng đã được điều chỉnh để hoạt động chính xác với dải giá trị mới này.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Trải nghiệm người chơi:** Các mô tả môi trường trong chế độ offline giờ đây sẽ trở nên đa dạng, ít lặp lại và phù hợp với bối cảnh hơn rất nhiều. Người chơi sẽ cảm nhận được sự "thay đổi tâm trạng" của thế giới xung quanh họ.
*   **Hướng phát triển:** Với nền tảng kiến trúc mới, chúng ta đã sẵn sàng để xây dựng các hệ thống phức tạp hơn một cách dễ dàng, chẳng hạn như:
    *   Hệ thống sự kiện ngẫu nhiên có điều kiện phức tạp hơn.
    *   Logic tương tác với NPC sâu sắc hơn.
    *   Hệ thống modding mạnh mẽ.

### 🚀 **Kết luận & Bước tiếp theo**

Bản cập nhật "Kiến trúc sư" đã hoàn thành việc xây dựng lại "khung xương" và "hệ thần kinh" cho Dreamland Engine. Đây là một công việc thầm lặng nhưng là tiền đề cho mọi sự phát triển bùng nổ trong tương lai.

**Bước tiếp theo:** Tích hợp engine tường thuật mới này vào vòng lặp game chính và bắt đầu xây dựng các hệ thống con (như `build_entity_report`, `build_surrounding_peek`) để "thổi hồn" vào các mẫu câu chuyện.

Cảm ơn vì đã đồng hành! Chúng ta đang tạo ra một thứ thật đặc biệt.
