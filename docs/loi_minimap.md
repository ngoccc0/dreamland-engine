# Báo cáo Chẩn đoán: Nguyên nhân Minimap và Bản đồ lớn hiển thị màu đen

**Ngày:** 18/07/2025
**Mục tiêu:** Phân tích toàn diện các lý do có thể khiến component Minimap và Bản đồ lớn (FullMapPopup) không hiển thị dữ liệu (render một màu đen hoặc trống rỗng), từ khâu tạo dữ liệu đến logic render của component.

---

## 1. Phân tích Luồng Dữ liệu (Data Flow)

Bản đồ được render dựa trên state `world`, là một object chứa tất cả các `Chunk` đã được tạo. Dữ liệu này đi qua các bước sau:

1.  **Khởi tạo (`useGameInitialization`):** Tải `GameState` (bao gồm cả `world`) từ Repository (Firebase/IndexedDB).
2.  **Tạo Mới (`generateChunksInRadius`):** Khi người chơi di chuyển, các chunk mới xung quanh sẽ được tạo ra và thêm vào state `world`.
3.  **Truyền Dữ liệu (`GameLayout`):** State `world` được truyền vào `GameLayout`.
4.  **Xử lý Grid (`generateMapGrid`):** `GameLayout` gọi hàm này để trích xuất một grid 5x5 từ state `world` xung quanh vị trí người chơi.
5.  **Render (`Minimap` component):** Grid 5x5 này được truyền vào component `Minimap` để render.

Lỗi có thể xảy ra ở bất kỳ bước nào trong chuỗi này.

---

## 2. Các Nguyên nhân Tiềm ẩn & Cách Kiểm tra

### Nguyên nhân 1: Dữ liệu `world` bị rỗng hoặc chưa được tải kịp

-   **Mô tả:** Đây là nguyên nhân phổ biến nhất. `GameLayout` có thể đã render trước khi `useGameInitialization` hoàn tất việc tải dữ liệu từ repository. Khi đó, `world` là một object rỗng `{}`.
-   **Kiểm tra:**
    1.  Hàm `generateMapGrid` trong `game-layout.tsx` có một "guard clause": `if (!isLoaded || !finalWorldSetup) return [];`.
    2.  Nếu `isLoaded` là `false` hoặc `finalWorldSetup` là `null`, hàm sẽ trả về một mảng rỗng `[]`.
    3.  Component `Minimap` khi nhận được một `grid` rỗng sẽ hiển thị một bản đồ trống (màu đen/xám theo theme).
-   **Kết luận:** Vấn đề rất có thể nằm ở việc quản lý trạng thái tải game (`isLoaded`), khiến cho việc tạo grid bản đồ bị bỏ qua trong các lần render đầu tiên.

### Nguyên nhân 2: Logic trong `generateMapGrid` trả về grid không chính xác

-   **Mô tả:** Có thể có lỗi trong logic tính toán tọa độ (`wx`, `wy`) bên trong `generateMapGrid`, khiến nó không thể tìm thấy các chunk tương ứng trong state `world`, ngay cả khi `world` đã có dữ liệu.
-   **Kiểm tra:**
    *   Thêm `console.log(wx, wy, chunkKey, world[chunkKey])` vào bên trong vòng lặp của `generateMapGrid` để xem các chunk có được truy xuất thành công không.
-   **Kết luận:** Ít có khả năng hơn, nhưng vẫn cần kiểm tra nếu Nguyên nhân 1 đã được loại trừ.

### Nguyên nhân 3: Lỗi render trong component `Minimap`

-   **Mô tả:** Dữ liệu `grid` được truyền vào đúng, nhưng logic render bên trong `Minimap` lại gặp lỗi.
-   **Kiểm tra:**
    1.  **Điều kiện `explored`:** Code có câu lệnh `if (!cell.explored) { return ... }`. Nếu cờ `explored` của chunk không bao giờ được cập nhật thành `true`, tất cả các ô sẽ bị render thành ô trống (màu xám). Đây là một nghi phạm lớn.
    2.  **Màu Biome:** Biến `biomeColors` có thể thiếu định nghĩa cho một loại địa hình (`Terrain`) mới nào đó. Nếu `biomeColors[cell.terrain]` trả về `undefined`, ô sẽ không có màu nền.
    3.  **Icon:** Tương tự, `biomeIcons` có thể thiếu icon cho một địa hình nào đó.
-   **Kết luận:** Lỗi logic trong việc cập nhật cờ `explored` là nguyên nhân rất có khả năng.

### Nguyên nhân 4: Vấn đề về CSS

-   **Mô tả:** Các ô được render trong DOM, nhưng bị ẩn đi do CSS.
-   **Kiểm tra:**
    *   Dùng DevTools của trình duyệt để kiểm tra các thẻ `<div>` của minimap.
    *   Kiểm tra xem chúng có các thuộc tính như `opacity: 0` hoặc `display: none` không.
    *   Kiểm tra xem các lớp CSS màu nền (ví dụ: `bg-map-forest`) có được định nghĩa đúng trong `tailwind.config.ts` và `globals.css` không.
-   **Kết luận:** Ít khả năng nhưng vẫn cần xác minh nếu các nguyên nhân khác đã được loại trừ.

---

## 🎯 Giả thuyết chính

**Giả thuyết có khả năng cao nhất là sự kết hợp của Nguyên nhân 1 và Nguyên nhân 3:**

> **`GameLayout` render quá sớm khi `isLoaded` vẫn còn `false`, khiến `generateMapGrid` trả về một mảng rỗng. Ngay cả khi state được cập nhật, có thể logic cập nhật cờ `explored` của chunk đang bị lỗi, khiến cho tất cả các ô đều bị render thành ô trống màu xám ngay cả khi chúng đã được tải.**

**Hướng giải quyết đề xuất:**

1.  **Rà soát `useGameInitialization` và `useGameState`:** Đảm bảo `isLoaded` chỉ được set thành `true` sau khi toàn bộ state game đã được tải và sẵn sàng.
2.  **Rà soát `useActionHandlers` (cụ thể là `handleMove`):** Đảm bảo rằng khi người chơi di chuyển, chunk mới mà họ bước vào phải được cập nhật với `explored: true` và `lastVisited: turn`. Đây là bước cực kỳ quan trọng.
3.  **Nâng cấp logic render của `Minimap`:** Hiển thị một ô màu xám/mờ cho các chunk có `explored: false` thay vì không render gì cả. Điều này cải thiện UX và giúp việc gỡ lỗi dễ dàng hơn.
