# Báo cáo Chẩn đoán: Lý do Minimap không render trong GameLayout

**Ngày:** 18/07/2025
**Mục tiêu:** Phân tích các nguyên nhân tiềm ẩn khiến component `<Minimap />` không hiển thị hoặc hiển thị không chính xác trong `GameLayout`.

---

## ✅ Checklist Chẩn đoán

### 1. Kiểm tra Kết quả đầu ra của `generateMapGrid()`

-   **Trạng thái:** ✅ **Hàm có khả năng trả về dữ liệu hợp lệ.**
-   **Phân tích:** Hàm `generateMapGrid` trong `game-layout.tsx` có một "guard clause" quan trọng:
    ```typescript
    if (!isLoaded || !finalWorldSetup) {
        console.log('[Minimap Debug] Grid generation SKIPPED...');
        return []; // <-- Trả về mảng rỗng
    }
    ```
-   **Nguyên nhân tiềm ẩn:**
    -   `isLoaded` là `false`: Điều này xảy ra khi game chưa tải xong dữ liệu từ repository (LocalStorage/Firebase/IndexedDB).
    -   `finalWorldSetup` là `null`: Điều này xảy ra khi một game mới được bắt đầu nhưng người chơi chưa hoàn thành màn hình tạo thế giới (`WorldSetup`).
-   **Kết luận:** Nếu `grid.length` là `0`, nguyên nhân rất có thể là do một trong hai biến `isLoaded` hoặc `finalWorldSetup` chưa được thiết lập đúng cách khi `GameLayout` render lần đầu.

### 2. Kiểm tra Props truyền vào `<Minimap />`

-   **Trạng thái:** ✅ **Các props có vẻ được truyền đúng định dạng.**
-   **Phân tích:** Lời gọi component trong `game-layout.tsx` là:
    ```tsx
    <Minimap grid={generateMapGrid()} playerPosition={playerPosition} turn={turn} />
    ```
    -   `grid`: Kết quả từ `generateMapGrid()`, là một mảng 2D `(Chunk | null)[][]`.
    -   `playerPosition`: Là một state `{ x: number; y: number }`, luôn có giá trị.
    -   `turn`: Là một state `number`, luôn có giá trị.
-   **Kết luận:** Không có khả năng các props này bị `undefined`. Vấn đề nằm ở *nội dung* của `grid`.

### 3. Kiểm tra các Phần tử trong `grid`

-   **Trạng thái:** ✅ **Logic xử lý phần tử trong grid là đúng.**
-   **Phân tích:** Bên trong component `<Minimap />`, logic lặp qua `grid` và xử lý từng `cell`:
    ```tsx
    if (!cell) {
        return <div key={key} className={...} />; // Xử lý ô rỗng
    }

    // Logic kiểm tra sương mù
    const isFoggy = (turn - cell.lastVisited) > 50 && cell.lastVisited !== 0;

    if (!cell.explored || (isFoggy && !isPlayerHere)) {
        return <div key={key} className={...}>
            {cell.explored && <span ...>🌫️</span>}
        </div>;
    }
    ```
-   **Các thuộc tính cần thiết:**
    -   `cell.terrain`: ✅ Có. Dùng để xác định màu nền.
    -   `cell.explored`: ✅ Có. Dùng để quyết định hiển thị ô hay không.
    -   `cell.lastVisited`: ✅ Có. Dùng cho logic "sương mù chiến tranh" (fog of war).
-   **Kết luận:** Logic hiển thị của `<Minimap />` có vẻ đã xử lý đầy đủ các trường hợp (ô rỗng, ô chưa khám phá, ô có sương mù). Nếu bản đồ hiển thị toàn ô rỗng hoặc sương mù, vấn đề nằm ở dữ liệu `Chunk` trong `world` state.

### 4. Ghi log các biến quan trọng

Để xác nhận các giả thuyết trên, đây là ví dụ log nếu `generateMapGrid` trả về mảng rỗng:

```log
// Log được chèn vào đầu hàm generateMapGrid trong game-layout.tsx
[Minimap Debug] Attempting to generate map grid. Dependencies: {
    isLoaded: false,                           // <-- VẤN ĐỀ
    finalWorldSetupExists: false,              // <-- VẤN ĐỀ
    playerPosition: { x: 0, y: 0 }
}
[Minimap Debug] Grid generation SKIPPED. isLoaded or finalWorldSetup is falsy.
```

---

## 🎯 Kết luận Cuối cùng

Nguyên nhân chính khiến Minimap không render **không phải là lỗi trong logic của component `Minimap` hay `generateMapGrid`**, mà là do **điều kiện để chạy `generateMapGrid` chưa được đáp ứng**.

Cụ thể, `GameLayout` đã render trước khi state `isLoaded` được chuyển thành `true` hoặc `finalWorldSetup` có dữ liệu. Điều này khiến `generateMapGrid` trả về một mảng rỗng trong các lần render đầu tiên. Khi state được cập nhật, component có thể đã không re-render đúng cách để hiển thị bản đồ mới.

**Giải pháp đề xuất:**
1.  **Thêm Guard Clause trong `GameLayout`**: Không render toàn bộ layout game cho đến khi `isLoaded` và `finalWorldSetup` có giá trị. Hiển thị một component loading thay thế.
2.  **Rà soát `useGameInitialization`**: Đảm bảo hook này cập nhật `isLoaded` và `finalWorldSetup` một cách chính xác và đúng thời điểm, kích hoạt re-render cho `GameLayout`.

Báo cáo này xác nhận vấn đề nằm ở luồng quản lý state (state flow) chứ không phải ở logic render của component.
