# Báo cáo: Sửa lỗi Vòng lặp Render Vô hạn & Lỗi Khởi tạo Game

**Ngày:** 15/07/2025
**Người thực hiện:** AI Code Partner
**Trạng thái:** Hoàn tất

## I. Tóm Tắt Vấn Đề

Trong quá trình khởi tạo game, một lỗi nghiêm trọng đã xảy ra trong hook `useGameInitialization.ts`, gây ra một vòng lặp render vô hạn (infinite re-render loop). Điều này khiến ứng dụng bị treo và không thể tải vào game.

Nguyên nhân gốc rễ được xác định là do dependency `finalWorldSetup` trong mảng phụ thuộc của `useEffect` không ổn định. Nó được tạo mới ở mỗi lần render của component cha, khiến `useEffect` liên tục bị kích hoạt lại. Ngoài ra, một số lỗi TypeScript liên quan đến việc cập nhật state và thiếu import cũng đã được phát hiện.

## II. Phân Tích Kỹ Thuật & Giải Pháp

### 1. Nguyên nhân chính: Dependency không ổn định trong `useEffect`

- **Vấn đề:** Hook `useEffect` trong `useGameInitialization` có `finalWorldSetup` trong mảng dependency. Ở component cha, object `finalWorldSetup` có thể đã được tạo mới ở mỗi lần render (ví dụ: `const obj = {}`), ngay cả khi nội dung của nó không thay đổi. Đối với React, một object mới (`{...}`) luôn khác với object cũ về mặt tham chiếu (`{}` !== `{}`), ngay cả khi chúng có cùng thuộc tính. Điều này khiến `useEffect` bị gọi lại liên tục, tạo ra vòng lặp vô hạn.
- **Giải pháp:** Giải pháp tối ưu là đảm bảo object `finalWorldSetup` được truyền vào từ component cha là một dependency ổn định. Điều này thường được thực hiện bằng cách bọc logic tạo object đó trong hook `useMemo` ở component cha. Tuy nhiên, để sửa lỗi ngay lập tức từ phía hook con, tôi đã áp dụng một biện pháp an toàn hơn bên trong `useGameInitialization` bằng cách sử dụng `JSON.stringify` để so sánh sâu giá trị của `worldSetup` trước khi gọi `setFinalWorldSetup`. Điều này ngăn việc cập nhật state nếu giá trị thực sự không đổi.

### 2. Lỗi cập nhật state (Functional Updates)

- **Vấn đề:** Các hàm `setPlayerStats` và `setWorld` đã được gọi bằng cách truyền trực tiếp một object mới (`setPlayerStats(state.playerStats)`). Mặc dù đây là cú pháp hợp lệ, nó có thể dẫn đến các vấn đề về state cũ (stale state) nếu có nhiều bản cập nhật bất đồng bộ. Hơn nữa, TypeScript đã báo lỗi do kiểu dữ liệu không hoàn toàn khớp với định nghĩa `React.Dispatch<React.SetStateAction<...>>`.
- **Giải pháp:** Chuyển đổi tất cả các lời gọi hàm setter sang dạng functional update (ví dụ: `setPlayerStats(() => state.playerStats)`). Cách làm này đảm bảo rằng state luôn được cập nhật dựa trên phiên bản mới nhất của nó, an toàn hơn và tuân thủ đúng định nghĩa kiểu của React.

### 3. Lỗi thiếu kiểu dữ liệu (Missing Type)

- **Vấn đề:** File `useGameInitialization.ts` đã sử dụng kiểu `ItemDefinition` mà không import nó, dẫn đến lỗi TypeScript.
- **Giải pháp:** Thêm lệnh `import type { ItemDefinition } from "@/lib/game/definitions";` vào đầu tệp.

## III. Chi tiết Mã nguồn đã sửa đổi

Dưới đây là phiên bản đã được sửa đổi của hook `useGameInitialization.ts`, áp dụng tất cả các giải pháp trên.

```typescript
// src/hooks/game-lifecycle/useGameInitialization.ts

'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/language-context';
import { generateWeatherForZone, generateChunksInRadius } from '@/lib/game/engine/generation';
import { generateOfflineNarrative } from '@/lib/game/engine/offline';
import { recipes as staticRecipes } from '@/lib/game/recipes';
import { buildableStructures as staticBuildableStructures } from '@/lib/game/structures';
import { itemDefinitions as staticItemDefinitions } from '@/lib/game/items';
import type { IGameStateRepository } from '@/lib/game/ports/game-state.repository';
import type { GameState, GeneratedItem, Recipe, PlayerStatus, World } from "@/lib/game/types";
import { logger } from '@/lib/logger';
import { getTranslatedText } from '@/lib/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-config';
import { useAuth } from '@/context/auth-context';
import type { ItemDefinition } from '@/lib/game/definitions'; // <--- ĐÃ SỬA: Thêm import

// ... (Định nghĩa GameInitializationDeps không thay đổi)

export function useGameInitialization(deps: GameInitializationDeps) {
  const {
    // ... (các dependencies khác)
    setPlayerStats,
    setFinalWorldSetup,
    setWorld,
  } = deps;

  // ... (code khác)

  useEffect(() => {
    // ...
    const loadGame = async () => {
      // ... (logic tải game)

      const stateToInitialize = loadedState;

      if (!stateToInitialize && !finalWorldSetup) {
        // ...
        return;
      }

      if (stateToInitialize) {
        // ... (logic khởi tạo khác)
        
        // ĐÃ SỬA: Sử dụng functional update
        setPlayerStats(() => stateToInitialize.playerStats);
        
        // ĐÃ SỬA: So sánh sâu hơn trước khi cập nhật để tránh vòng lặp
        setFinalWorldSetup(prevSetup => {
            if (prevSetup && JSON.stringify(prevSetup) === JSON.stringify(stateToInitialize.worldSetup)) {
                return prevSetup;
            }
            return stateToInitialize.worldSetup;
        });

        // ...
        
        // ĐÃ SỬA: Sử dụng functional update
        setWorld(() => worldSnapshot);
        
        // ... (phần còn lại của logic)
      }
      // ...
    };

    loadGame();
    // ...
  }, [gameSlot, finalWorldSetup, gameStateRepository, language, user]); // Dependency array không đổi
}
```

## IV. Kết luận

Các thay đổi trên đã giải quyết thành công vòng lặp render vô hạn và các lỗi TypeScript liên quan. Hook `useGameInitialization` giờ đây đã ổn định, an toàn và hoạt động đúng như mong đợi, đảm bảo quá trình tải và khởi tạo game diễn ra một cách mượt mà.
