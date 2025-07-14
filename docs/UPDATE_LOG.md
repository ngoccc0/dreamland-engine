# **Dreamland Engine - Nhật Ký Phát Triển (Update Log)**

Chào mừng các Đội trưởng và những người đồng hành đến với nhật ký phát triển chính thức của Dreamland Engine! Tại đây, chúng tôi sẽ ghi lại những thay đổi, nâng cấp và cả những quyết định thiết kế quan trọng đã định hình nên thế giới này.

---

## **Bản cập nhật v0.2.55 - "Nền Móng Vững Chắc" (14/07/2025)**

*Tên mã: Solid Foundation*

### 🌟 **Giới thiệu chung**

Bản cập nhật này là một bước tiến quan trọng trong việc củng cố "xương sống" của Dreamland Engine. Chúng ta đã thực hiện một đợt rà soát và tái cấu trúc sâu rộng trên toàn bộ mã nguồn, tập trung vào việc sửa các lỗi type-safety nghiêm trọng, chuẩn hóa cấu trúc dữ liệu và dọn dẹp các module logic. Mục tiêu là tạo ra một nền tảng lập trình vững chắc, đáng tin cậy và sẵn sàng cho việc triển khai các tính năng lớn sắp tới.

### ✨ **Thay đổi chính & Phân tích**

1.  **Tái cấu trúc và Sửa lỗi Module Logic:**
    *   **Phân tích:** Các hàm logic quan trọng (`getEffectiveChunk`, `generateOfflineNarrative`, v.v.) đã được di chuyển về đúng "nhà" của chúng trong các module engine (`generation.ts`, `offline.ts`). Các lỗi `Module not found` và `is not a function` đã được giải quyết triệt để bằng cách sửa lại toàn bộ các đường dẫn `import` trong các hook (`use-action-handlers.ts`, `useWorldRendering.ts`).
    *   **Insight:** Đây là một bài học về "tính đóng gói" (Encapsulation). Mỗi module giờ đây chỉ chịu trách nhiệm cho một nhiệm vụ duy nhất và "xuất khẩu" (export) các chức năng của mình một cách rõ ràng, giúp mã nguồn trở nên cực kỳ dễ theo dõi và bảo trì.

2.  **Chuẩn hóa Kiểu Dữ liệu Toàn cục (`TranslatableString` & `ItemCategory`):**
    *   **Phân tích:** Các lỗi TypeScript liên quan đến kiểu dữ liệu không nhất quán đã được khắc phục. Kiểu `TranslatableString` đã được chuẩn hóa để hỗ trợ đa ngôn ngữ một cách an toàn. `ItemCategorySchema` cũng được mở rộng để bao gồm các loại hợp lý như `Equipment` và `Support`.
    *   **Insight:** Một hệ thống kiểu dữ liệu (type system) mạnh mẽ và nhất quán là "bản hợp đồng" đảm bảo các phần khác nhau của chương trình "giao tiếp" với nhau một cách chính xác, ngăn ngừa các lỗi tiềm ẩn.

3.  **Tài liệu hóa Mã nguồn với TSDoc:**
    *   **Thay đổi:** Đã bắt đầu tích hợp các khối comment TSDoc (`/** ... */`) vào toàn bộ các file quan trọng, từ các flow AI, component giao diện, cho đến các hook và engine logic. Script `docs:api` đã được thêm vào `package.json` để chuẩn bị cho việc tự động sinh tài liệu.
    *   **Insight:** Chúng ta đang chuyển đổi từ việc "viết code" sang "xây dựng một hệ thống bền vững". Tài liệu hóa mã nguồn là một khoản đầu tư cho tương lai, giúp việc bảo trì và mở rộng trở nên dễ dàng hơn gấp nhiều lần.

### 🗺️ **Lộ Trình Phát Triển Tiếp Theo: Kế hoạch Ba Giai Đoạn**

Với nền móng đã được củng cố, chúng ta đã sẵn sàng để xây dựng những "tòa tháp" tính năng mới. Lộ trình phát triển tiếp theo sẽ được chia thành các giai đoạn rõ ràng:

*   **GIAI ĐOẠN 1: Nâng cấp Hệ thống Thời gian (Ngày/Đêm & Buổi trong ngày)**
    *   **Mục tiêu:** Vượt ra ngoài 'ngày' và 'đêm' đơn giản, thêm các buổi `Bình minh` và `Hoàng hôn`, ảnh hưởng đến `lightLevel`, mood tường thuật, và có thể cả hành động của NPC/sinh vật.

*   **GIAI ĐOẠN 2: Hệ thống Phát triển Nhân vật (XP & Cấp độ cơ bản)**
    *   **Mục tiêu:** Xây dựng một hệ thống kinh nghiệm (XP) và cấp độ (Level) đơn giản. Người chơi sẽ nhận được XP khi hoàn thành nhiệm vụ, hạ gục kẻ thù, hoặc chế tạo vật phẩm khó. Lên cấp sẽ cải thiện các chỉ số cơ bản.

*   **GIAI ĐOẠN 3: Rà soát và Ưu tiên các Hệ thống cốt lõi khác (Đang triển khai)**
    *   **Mục tiêu:** Tiếp tục cải tiến và thêm chiều sâu cho các hệ thống hiện có, đặc biệt là:
        *   **Hệ thống Kể chuyện Offline Nâng cao:** Thêm nhiều mẫu câu chuyện và logic phức tạp hơn.
        *   **Hệ thống Hợp nhất (Fusion) Offline:** Xây dựng một bộ quy tắc logic offline để quyết định kết quả của việc hợp nhất vật phẩm, giảm sự phụ thuộc vào AI.
        *   **Hệ thống Tương tác NPC:** Mở rộng khả năng hội thoại và nhiệm vụ của NPC.

Cảm ơn vì đã đồng hành. Chúng ta đang tiến những bước vững chắc!

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
