# **Dreamland Engine - Nhật Ký Phát Triển (Update Log)**

Chào mừng các Đội trưởng và những người đồng hành đến với nhật ký phát triển chính thức của Dreamland Engine! Tại đây, chúng tôi sẽ ghi lại những thay đổi, nâng cấp và cả những quyết định thiết kế quan trọng đã định hình nên thế giới này.

---

## **Bản cập nhật v0.3.1 - "Giao diện Chế tạo Thông minh" (18/07/2025)**

*Tên mã: The Artisan's Workbench*

### 🌟 **Giới thiệu chung**

Bản cập nhật này tập trung hoàn toàn vào việc cải thiện trải nghiệm người dùng (UX) cho một trong những tính năng cốt lõi nhất: Chế tạo. Dựa trên bản kế hoạch chi tiết, chúng ta đã biến một danh sách công thức đơn giản thành một giao diện thông minh, có khả năng sắp xếp và lọc, giúp người chơi dễ dàng tìm thấy thứ họ cần và đưa ra quyết định nhanh hơn.

### ✨ **Thay đổi chính & Phân tích**

1.  **Tính năng Sắp xếp theo Khả năng Chế tạo (`Sort by Craftability`):**
    *   **Vấn đề:** Các công thức được liệt kê một cách lộn xộn, khiến người chơi phải cuộn và kiểm tra từng công thức để xem họ có thể chế tạo những gì.
    *   **Giải pháp:**
        *   Một thuật toán mới đã được triển khai để tính toán `craftabilityScore` (điểm khả năng chế tạo) cho mỗi công thức. Điểm này được tính bằng tỷ lệ `(số nguyên liệu sở hữu / tổng số nguyên liệu yêu cầu)`.
        *   Thêm một nút "Sắp xếp" vào giao diện, cho phép người chơi chuyển đổi giữa hai chế độ:
            *   **Mặc định (`Craftability`):** Sắp xếp công thức theo `craftabilityScore` giảm dần. Các công thức có thể chế tạo ngay (100%) sẽ luôn được đẩy lên đầu.
            *   **Theo vần (`A-Z`):** Sắp xếp theo tên vật phẩm kết quả.
    *   **Kết quả:** Người chơi giờ đây có thể thấy ngay lập tức những gì họ có thể chế tạo và những gì họ sắp có thể chế tạo, giúp việc lập kế hoạch thu thập tài nguyên trở nên dễ dàng hơn rất nhiều.

2.  **Bộ lọc "Chỉ Hiển thị có thể Chế tạo" (`Show only craftable`):**
    *   **Vấn đề:** Khi có hàng trăm công thức, việc tìm kiếm những công thức đã đủ nguyên liệu vẫn còn khó khăn.
    *   **Giải pháp:** Thêm một công tắc (`Switch`) vào giao diện. Khi được bật, nó sẽ lọc danh sách và chỉ hiển thị những công thức có `craftabilityScore` là 100%.
    *   **Kết quả:** Cung cấp một chế độ xem "tập trung", loại bỏ mọi sự phân tâm và giúp người chơi thực hiện hành động chế tạo một cách nhanh chóng.

3.  **Cải thiện Phản hồi Trực quan (Visual Feedback):**
    *   **Vấn đề:** Giao diện cũ không cho người chơi biết rõ họ thiếu gì.
    *   **Giải pháp:**
        *   **Màu sắc Nguyên liệu:** Trong danh sách nguyên liệu, các vật phẩm đã đủ số lượng sẽ có màu xanh lá cây, trong khi những vật phẩm còn thiếu sẽ có màu đỏ.
        *   **Tooltip chi tiết:** Di chuột qua một công thức sẽ hiển thị một `Tooltip` thông báo chính xác các nguyên liệu còn thiếu (ví dụ: "Bạn còn thiếu: 2x Sắt, 1x Than củi").
        *   **Tooltip cho nút Crafting chính:** Tooltip của nút Búa trên giao diện chính giờ sẽ hiển thị số lượng công thức có thể chế tạo ngay (`"Mở cửa sổ chế tạo. (3 có thể chế tạo ngay)"`), cung cấp thông tin hữu ích mà không cần mở popup.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Trải nghiệm người chơi:** Giao diện chế tạo giờ đây trực quan, thông minh và ít gây khó chịu hơn đáng kể. Người chơi có thể nhanh chóng đánh giá tình hình tài nguyên và đưa ra quyết định chế tạo một cách hiệu quả.
*   **Khả năng mở rộng:** Nền tảng logic `craftabilityScore` này có thể được tái sử dụng trong tương lai cho các tính năng khác, ví dụ như gợi ý cho người chơi nên đi thu thập tài nguyên gì tiếp theo.

---

## **Bản cập nhật v0.2.62 - "Kiến trúc Bất hoại" (17/07/2025)**

*Tên mã: Indestructible Architecture*

### 🌟 **Giới thiệu chung**

Đây là một bản cập nhật quan trọng, giải quyết triệt để lỗi cấu trúc dữ liệu đã gây ra các lỗi `TypeError` trong engine sinh thế giới. Bằng cách tái cấu trúc lại cách các `structure` (công trình) được định nghĩa và tham chiếu, chúng ta đã tạo ra một hệ thống dữ liệu nhất quán, mạnh mẽ và loại bỏ hoàn toàn các lỗi liên quan đến "entity không hợp lệ".

### ✨ **Thay đổi chính & Phân tích**

1.  **Tái cấu trúc `StructureDefinitionSchema`:**
    *   **Vấn đề:** Các thuộc tính `loot` và `conditions` cho các công trình được định nghĩa một cách không nhất quán, đôi khi nằm trong file template, đôi khi lại thiếu, gây ra lỗi khi engine cố gắng xử lý chúng như một thực thể độc lập.
    *   **Giải pháp:** Đã thực hiện một cuộc "đại tu" nhỏ nhưng quan trọng cho `StructureDefinitionSchema` (trong `src/lib/game/definitions/structure.ts`). Thuộc tính `loot` và `conditions` giờ đây đã chính thức trở thành một phần của định nghĩa gốc của một công trình. Điều này đảm bảo rằng bất kỳ công trình nào cũng có một cấu trúc dữ liệu chuẩn, dễ dự đoán.

2.  **Chuẩn hóa Dữ liệu trong `structures.ts`:**
    *   **Vấn đề:** Dữ liệu về `loot` và `conditions` của "Cửa hầm mỏ bỏ hoang" bị đặt sai chỗ trong các file template (`mountain.ts`, `cave.ts`).
    *   **Giải pháp:** Toàn bộ thông tin `loot` và `conditions` đã được di chuyển về đúng "nhà" của nó: file định nghĩa gốc `src/lib/game/structures.ts`. Giờ đây, file này là nguồn chân lý duy nhất cho tất cả các thuộc tính của một công trình.

3.  **Đơn giản hóa Tham chiếu Template:**
    *   **Vấn đề:** Các file template như `mountain.ts` và `cave.ts` phải sử dụng một "wrapper" object phức tạp (`{ data: ..., conditions: ... }`) để tham chiếu đến công trình.
    *   **Giải pháp:** Sau khi đã chuẩn hóa dữ liệu gốc, các file template giờ đây chỉ cần tham chiếu trực tiếp đến `structureDefinitions['Cửa hầm mỏ bỏ hoang']`. Cách làm này không chỉ sửa lỗi mà còn giúp cho các file template trở nên sạch sẽ, dễ đọc và dễ bảo trì hơn rất nhiều.

### 🎮 **Ảnh hưởng đến Trải nghiệm & Tương lai**

*   **Độ tin cậy tuyệt đối:** Lỗi `SKIPPING entity data is missing 'name' or 'type' property` liên quan đến `structure` đã được loại bỏ hoàn toàn. Engine sinh thế giới giờ đây sẽ không bao giờ gặp phải lỗi do dữ liệu công trình không nhất quán.
*   **Khả năng bảo trì:** Việc tập trung tất cả các thuộc tính của một thực thể vào một nơi duy nhất giúp việc quản lý, cân bằng game và thêm nội dung mới trong tương lai trở nên dễ dàng và ít rủi ro hơn. Nền móng dữ liệu của chúng ta giờ đây thực sự vững chắc.
