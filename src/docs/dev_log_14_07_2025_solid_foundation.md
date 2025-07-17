# Báo cáo sửa lỗi & Tái cấu trúc - "Nền Móng Vững Chắc" (14/07/2025)

**Người yêu cầu:** Đội trưởng
**Người thực hiện:** AI Code Partner
**Trạng thái:** Hoàn tất

## I. Tóm tắt

Báo cáo này cung cấp chi tiết về các thay đổi mã nguồn được thực hiện để giải quyết một loạt lỗi type-safety nghiêm trọng (TS2739, TS18047, TS2345) và các vấn đề logic khác. Mục tiêu là chuẩn hóa cấu trúc dữ liệu cốt lõi và ổn định các hook xử lý game.

---

## II. Phân tích & Giải pháp chi tiết

### 1. Định nghĩa `PlayerAttributesSchema` (Lỗi TS2739 & TS2740)

**Vấn đề:** Các đối tượng `attributes` trong mã nguồn (định nghĩa vật phẩm, trạng thái người chơi ban đầu) không cung cấp đầy đủ tất cả các thuộc tính được yêu cầu bởi kiểu `PlayerAttributes`, dẫn đến lỗi "missing properties".

**Giải pháp:** Chỉnh sửa `PlayerAttributesSchema` trong `src/lib/game/definitions/base.ts` để làm cho tất cả các thuộc tính trở thành tùy chọn (`optional()`) và có giá trị mặc định là `0`. Điều này cho phép chúng ta chỉ khai báo các thuộc tính có giá trị khác 0 khi định nghĩa vật phẩm, giúp mã nguồn gọn gàng và linh hoạt hơn.

**Nội dung đã sửa đổi (`src/lib/game/definitions/base.ts`):**
```typescript
// ... (các import khác)

/**
 * @description Defines the combat attributes that can be applied to a player or an item.
 * All attributes are optional and default to 0 if not specified, allowing for flexible item creation.
 */
export const PlayerAttributesSchema = z.object({
    physicalAttack: z.number().optional().default(0).describe("Damage dealt by physical attacks."),
    magicalAttack: z.number().optional().default(0).describe("Damage dealt by magical attacks."),
    physicalDefense: z.number().optional().default(0).describe("Reduces incoming physical damage."),
    magicalDefense: z.number().optional().default(0).describe("Reduces incoming magical damage."),
    critChance: z.number().optional().default(0).describe("Chance to deal critical damage (%)."),
    attackSpeed: z.number().optional().default(0).describe("Speed of attacks (e.g., attacks per second)."),
    cooldownReduction: z.number().optional().default(0).describe("Reduces skill cooldowns (%)."),
}).describe("Defines various combat and utility attributes for a player or item.");
export type PlayerAttributes = z.infer<typeof PlayerAttributesSchema>;

// ... (phần còn lại của file)
```

---

### 2. Xử lý biến có thể `null` & Lỗi `useState` (TS18047 & TS2345)

**Vấn đề:** Trong `useGameInitialization.ts`, biến `stateToInitialize` có thể `null` khi chưa tải xong dữ liệu, nhưng mã nguồn lại truy cập trực tiếp các thuộc tính của nó, gây ra lỗi. Ngoài ra, các hàm `set...` của `useState` được gọi với cú pháp không chính xác.

**Giải pháp:**
-   Bọc toàn bộ logic khởi tạo trong một khối `if (stateToInitialize)` để đảm bảo chỉ chạy khi có dữ liệu.
-   Chuyển đổi các lệnh gọi `set...` sang dạng functional update (ví dụ: `setPlayerStats(() => state.playerStats)`) để tuân thủ đúng yêu cầu của React.
-   Thêm tham số `language` còn thiếu khi gọi `generateOfflineNarrative`.
-   Sửa các lỗi truy cập thuộc tính sai (ví dụ: `outcome.description` thay vì `outcome.descriptionKey`).
-   Đảm bảo `providesShelter` tồn tại trong kiểu `Structure`.

**Nội dung đã sửa đổi (`src/hooks/game-lifecycle/useGameInitialization.ts`):**

```typescript
// ... (các import khác)
import { getTranslatedText } from '@/lib/utils';
import { useLanguage } from '@/context/language-context';
import { useAuth } from '@/context/auth-context';

// ... (định nghĩa type GameInitializationDeps)

export function useGameInitialization(deps: GameInitializationDeps) {
  const {
    // ... (destructure các deps)
  } = deps;

  const { t, language } = useLanguage();
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const loadGame = async () => {
      // ... (logic tải game từ repository)
      
      const stateToInitialize = loadedState;

      if (!isMounted || (!stateToInitialize && !finalWorldSetup)) {
          logger.warn(`[GameInit] No loaded state and no finalWorldSetup for slot ${gameSlot}. Aborting init.`);
          if (!finalWorldSetup) setIsLoaded(false);
          return;
      }
      
      if (stateToInitialize) {
        logger.info(`[GameInit] Initializing game state from loaded data for slot ${gameSlot}.`);
        
        // Bọc toàn bộ logic trong khối if
        const finalCatalogArray = Array.from(finalCatalogMap.values());
        setWorldProfile(stateToInitialize.worldProfile);
        setCurrentSeason(stateToInitialize.currentSeason);
        setGameTime(stateToInitialize.gameTime || 360);
        setDay(stateToInitialize.day);
        setTurn(stateToInitialize.turn || 1);
        // ... (các lệnh set... khác)

        // Sửa lỗi setter
        setPlayerStats(() => stateToInitialize.playerStats);
        setFinalWorldSetup(() => stateToInitialize.worldSetup);
        setPlayerPosition(() => stateToInitialize.playerPosition || { x: 0, y: 0 });
        setPlayerBehaviorProfile(() => stateToInitialize.playerBehaviorProfile || { moves: 0, attacks: 0, crafts: 0, customActions: 0 });

        let worldSnapshot = stateToInitialize.world || {};
        
        // ... (logic sinh chunk ban đầu)
        
        setWorld(() => worldSnapshot);
        setRegions(() => regionsSnapshot);
        setRegionCounter(() => regionCounterSnapshot);
        setWeatherZones(() => weatherZonesSnapshot);

        if ((stateToInitialize.narrativeLog || []).length === 0) {
             const startingChunk = worldSnapshot[initialPosKey];
             if (startingChunk) {
                // Thêm 'language' bị thiếu
                const chunkDescription = generateOfflineNarrative(startingChunk, 'long', worldSnapshot, stateToInitialize.playerPosition, t, language);
                const fullIntro = `${getTranslatedText(stateToInitialize.worldSetup.initialNarrative, language, t)}\n\n${chunkDescription}`;
                addNarrativeEntry(fullIntro, 'narrative');
            }
        } else {
             setNarrativeLog(stateToInitialize.narrativeLog);
        }

        setIsLoaded(true);
      }
    };

    loadGame();

    return () => {
      isMounted = false;
    };
  }, [gameSlot, finalWorldSetup, gameStateRepository, language, user]); // Thêm các dependency cần thiết
}
```

---

### 3. Cập nhật `attributes` trong các định nghĩa Vật phẩm

**Vấn đề:** Các vật phẩm trong `equipment.ts` vẫn thiếu các thuộc tính phòng thủ trong `attributes`.

**Giải pháp:** Bổ sung đầy đủ các thuộc tính `physicalDefense: 0` và `magicalDefense: 0` (và các thuộc tính khác nếu cần) vào tất cả các định nghĩa `attributes` để chúng khớp hoàn toàn với `PlayerAttributesSchema`.

**Ví dụ đã sửa đổi (`src/lib/game/data/items/equipment.ts`):**

```typescript
// ... (các item khác)
'stone_dagger': {
    id: 'stone_dagger',
    name: { en: 'Stone Dagger', vi: 'Dao Găm Đá' },
    //...
    attributes: { physicalAttack: 2, critChance: 1, magicalAttack: 0, physicalDefense: 0, magicalDefense: 0, attackSpeed: 0, cooldownReduction: 0 },
    spawnEnabled: false,
},
'wooden_shield': {
    id: 'wooden_shield',
    name: { en: 'Wooden Shield', vi: 'Khiên Gỗ' },
    //...
    attributes: { physicalDefense: 5, physicalAttack: 0, magicalAttack: 0, magicalDefense: 0, critChance: 0, attackSpeed: 0, cooldownReduction: 0 },
    spawnEnabled: false,
},
// ... (và các item còn lại)
```

---

Bằng cách thực hiện các thay đổi trên, chúng ta đã giải quyết được phần lớn các lỗi nghiêm trọng về type-safety, giúp mã nguồn trở nên ổn định và dễ bảo trì hơn đáng kể.