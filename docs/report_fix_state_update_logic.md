# Báo cáo: Sửa lỗi Logic Cập nhật State & Stale State

**Ngày:** 15/07/2025
**Người thực hiện:** AI Code Partner
**Trạng thái:** Hoàn tất

## I. Tóm Tắt Vấn Đề

Một lỗi logic nghiêm trọng đã được phát hiện trong hook `useActionHandlers.ts`. Nguyên nhân gốc rễ là do **trạng thái người chơi (`playerStats`) không được cập nhật một cách nhất quán** sau khi các hành động được thực hiện.

Cụ thể, các hàm xử lý hành động (ví dụ: `handleOfflineAttack`, `handleOfflineItemUse`) đã tạo ra một bản sao cục bộ của `playerStats`, thay đổi nó, nhưng sau đó lại **quên gọi hàm `setPlayerStats`** để thông báo cho React về sự thay đổi này. Thay vào đó, bản sao đã thay đổi này chỉ được truyền cho hàm `advanceGameTime`.

Điều này dẫn đến một loạt các vấn đề:
1.  **Stale State (Trạng thái cũ):** Các thành phần giao diện người dùng (ví dụ: thanh HP) không được cập nhật để phản ánh trạng thái mới nhất.
2.  **Logic không nhất quán:** Các hành động tiếp theo sẽ hoạt động dựa trên `playerStats` cũ, gây ra các lỗi tính toán không chính xác.
3.  **Vòng lặp render tiềm ẩn:** Nếu một `useEffect` nào đó phụ thuộc vào `playerStats`, nó có thể không được kích hoạt đúng cách, hoặc kích hoạt một cách không mong muốn.

## II. Phân Tích Kỹ Thuật & Giải Pháp

Dựa trên phân tích chính xác của Đội trưởng, giải pháp tập trung vào việc đảm bảo luồng dữ liệu một chiều (one-way data flow) của React được tôn trọng.

### 1. Nguyên nhân chính: Thiếu lệnh gọi `setPlayerStats`

-   **Vấn đề:** Các hàm như `handleOfflineAttack` tạo ra `nextPlayerStats`, sửa đổi `nextPlayerStats.hp`, nhưng không bao giờ gọi `setPlayerStats(nextPlayerStats)`.
-   **Giải pháp:** Sau khi tất cả các tính toán cho một hành động đã hoàn tất, một lệnh gọi `setPlayerStats(() => nextPlayerStats)` đã được thêm vào cuối mỗi hàm xử lý hành động có liên quan, ngay trước khi gọi `advanceGameTime`. Việc sử dụng functional update (`() => nextPlayerStats`) là một phương pháp an toàn để cập nhật state.

### 2. Dọn dẹp Dependencies của `useCallback`

-   **Vấn đề:** Một số `useCallback` (đặc biệt là `handleOfflineAction`) có một danh sách dependency quá dài, chứa nhiều state và hàm không được sử dụng trực tiếp trong logic của hook đó. Điều này làm tăng khả năng hàm callback được tạo lại một cách không cần thiết, ảnh hưởng đến hiệu suất.
-   **Giải pháp:** Rà soát lại danh sách dependency của mỗi `useCallback` và loại bỏ các biến không cần thiết. Các hàm setter từ `useState` (ví dụ: `setIsLoading`, `setWorld`) được React đảm bảo là có reference ổn định, nên việc đưa chúng vào dependency array thường là an toàn nhưng không phải lúc nào cũng cần thiết nếu chúng không thay đổi. Trong lần sửa lỗi này, chúng được giữ lại để đảm bảo tính tường minh, nhưng các state không được sử dụng đã bị loại bỏ.

## III. Chi tiết Mã nguồn đã sửa đổi

Dưới đây là một ví dụ về sự thay đổi trong `handleOfflineAttack` để minh họa cho giải pháp. Các hàm khác như `handleOnlineNarrative`, `handleOfflineItemUse`, `handleOfflineSkillUse` cũng được áp dụng logic tương tự.

```typescript
// src/hooks/use-action-handlers.ts

// ... (các import và code khác)

  const handleOfflineAttack = useCallback(() => {
    // ... (logic tính toán combat giữ nguyên)

    let nextPlayerStats = {...playerStats};
    nextPlayerStats.hp = Math.max(0, nextPlayerStats.hp - enemyDamage);
    if (enemyDefeated) {
        nextPlayerStats.unlockProgress = { ...nextPlayerStats.unlockProgress, kills: nextPlayerStats.unlockProgress.kills + 1 };
    }

    // ... (logic tạo narrative và cập nhật world)

    setWorld(prev => {
        // ...
        return newWorld;
    });

    // SỬA ĐỔI QUAN TRỌNG: Cập nhật state chính của playerStats
    setPlayerStats(() => nextPlayerStats);

    // Truyền state đã được tính toán vào advanceGameTime
    advanceGameTime(nextPlayerStats);
  }, [
      // ... dependencies đã được dọn dẹp, có bao gồm setPlayerStats
      playerPosition, world, addNarrativeEntry, settings.diceType, t, playerStats, 
      language, customItemDefinitions, advanceGameTime, setWorld, weatherZones, gameTime, setPlayerStats
  ]);
```

## IV. Kết luận

Các thay đổi này đã giải quyết thành công lỗi logic nghiêm trọng về quản lý state. `playerStats` giờ đây được cập nhật một cách nhất quán và đáng tin cậy sau mỗi hành động, đảm bảo giao diện người dùng và các logic game khác luôn hoạt động với dữ liệu mới nhất, đồng thời loại bỏ nguy cơ về "stale state" và các vòng lặp không mong muốn.
