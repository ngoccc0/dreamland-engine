# Dreamland Engine - Ký Sự Lãng Du

Chào mừng bạn đến với **Dreamland Engine**, một game phiêu lưu text-based được kiến tạo bởi trí tuệ nhân tạo. Tại đây, mỗi quyết định, mỗi hành động của bạn không chỉ định hình nên nhân vật mà còn cả một thế giới sống động, luôn biến đổi và đầy bất ngờ.

## ✨ Tính Năng Nổi Bật

- **Người Kể Chuyện AI & Chế Độ Offline:** Lựa chọn giữa một AI kể chuyện sáng tạo hoặc một chế độ offline dựa trên quy tắc.
- **Kiến Tạo Thế Giới Đa Tác Nhân:** Một đội ngũ "chuyên gia" AI cùng nhau tạo ra thế giới độc đáo cho bạn.
- **Thế Giới Sống:** Hệ sinh thái, thời tiết, và tài nguyên luôn biến đổi.
- **Hệ Thống Sinh Tồn & Chế Tạo Sâu Sắc:** Quản lý chỉ số, thân nhiệt, chế tạo công cụ, xây dựng nơi trú ẩn và thử nghiệm hợp nhất vật phẩm.
- **Hệ Thống Mod Linh Hoạt:** Dễ dàng thêm nội dung mới vào game thông qua các gói mod dạng JSON.

---

## 🎮 Cách Chơi

1.  **Tạo thế giới:** Mô tả ý tưởng của bạn hoặc chọn một kịch bản có sẵn.
2.  **Lựa chọn & Kết hợp:** Trộn lẫn các yếu tố bạn thích từ các phiên bản AI đề xuất để tạo ra thế giới cuối cùng.
3.  **Khám phá:** Sử dụng các nút mũi tên hoặc phím `W,A,S,D` để di chuyển.
4.  **Tương tác:** Sử dụng các nút hành động theo ngữ cảnh hoặc nhập bất kỳ hành động nào bạn muốn vào ô văn bản. Hãy sáng tạo! AI sẽ diễn giải và phản hồi lại.
5.  **Sinh tồn:** Để mắt đến các chỉ số, chế tạo công cụ, xây dựng nơi trú ẩn và chiến đấu để tồn tại.

---

## 🛠️ Hướng Dẫn Modding (Cơ bản)

Dreamland Engine được thiết kế với khả năng tùy biến cao. Bạn có thể dễ dàng thêm vật phẩm, công thức, và sinh vật mới vào game mà không cần sửa đổi mã nguồn.

### Cấu trúc cơ bản của một Gói Mod

Một gói mod (ModBundle) là một đối tượng JSON duy nhất chứa tất cả nội dung bạn muốn thêm vào.

**Ví dụ cấu trúc `ModBundle` (Dạng TypeScript để tham khảo):**

```typescript
// file: my_awesome_mod.ts (Để phát triển với type-checking)
import type { ModBundle } from './src/lib/game/types'; // Import các định nghĩa

export const myMod: ModBundle = {
  id: "my_awesome_mod", // ID duy nhất cho mod của bạn
  items: {
    // ... định nghĩa các vật phẩm ở đây
  },
  recipes: {
    // ... định nghĩa các công thức ở đây
  },
  enemies: {
    // ... định nghĩa các kẻ địch ở đây
  },
};
```

**Cách sử dụng:**
1.  Viết mod của bạn trong một tệp `.ts` (ví dụ: `my_awesome_mod.ts`) để tận dụng type-checking.
2.  Sau khi hoàn thành, sao chép đối tượng JSON từ `myMod` (không bao gồm `export const myMod =`).
3.  Vào game, mở **Cài đặt (Settings)** -> **Tab Mods**.
4.  Dán mã JSON của bạn vào ô văn bản và nhấn **"Apply Mods"**.

### 1. Thêm Vật phẩm mới (`items`)

Mỗi vật phẩm được định nghĩa là một đối tượng trong `items`.

**Cấu trúc `ItemDefinition`:**

| Thuộc tính         | Kiểu dữ liệu                                       | Bắt buộc? | Mô tả                                                                                              |
| ------------------ | -------------------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| `name`             | `{ en: string, vi: string }`                       | **Có**    | Tên hiển thị đa ngôn ngữ của vật phẩm.                                                              |
| `description`      | `{ en: string, vi: string }`                       | **Có**    | Mô tả đa ngôn ngữ.                                                                                  |
| `tier`             | `number`                                           | **Có**    | Cấp độ của vật phẩm (1-6), ảnh hưởng đến độ hiếm và sức mạnh.                                         |
| `category`         | `string` (xem danh sách bên dưới)                  | **Có**    | Loại vật phẩm.                                                                                     |
| `emoji`            | `string`                                           | **Có**    | Một emoji duy nhất đại diện cho vật phẩm.                                                            |
| `baseQuantity`     | `{ min: number, max: number }`                     | **Có**    | Số lượng vật phẩm thường xuất hiện khi được tạo ra trong thế giới.                                   |
| `effects`          | `Array` của `ItemEffect`                           | **Có**    | Mảng các hiệu ứng khi sử dụng vật phẩm (có thể là mảng rỗng `[]`).                                   |
| `equipmentSlot`    | `'weapon'`, `'armor'`, `'accessory'`               | Không     | Nếu là trang bị, nó thuộc khe nào.                                                                  |
| `attributes`       | `PlayerAttributes`                                 | Không     | Các chỉ số cộng thêm khi trang bị.                                                                  |
| `weight`           | `number`                                           | Không     | Trọng lượng của vật phẩm. (Hiện chỉ để tham khảo)                                                   |
| `stackable`        | `number`                                           | Không     | Số lượng tối đa trong một ô chứa đồ. (Hiện chỉ để tham khảo)                                        |

**Ví dụ: Thêm "Đá Ma Thuật"**

```json
{
  "my_magic_stone": {
    "name": { "en": "Magic Stone", "vi": "Đá Ma Thuật" },
    "description": { "en": "A stone humming with faint magical energy.", "vi": "Một viên đá rung động với năng lượng ma thuật yếu." },
    "tier": 2,
    "category": "Magic",
    "emoji": "💎",
    "effects": [{ "type": "RESTORE_MANA", "amount": 10 }],
    "baseQuantity": { "min": 1, "max": 3 }
  }
}
```

### 2. Thêm Công thức mới (`recipes`)

Mỗi công thức được định nghĩa là một đối tượng trong `recipes`.

**Cấu trúc `Recipe`:**

| Thuộc tính       | Kiểu dữ liệu                     | Bắt buộc? | Mô tả                                                               |
| ---------------- | -------------------------------- | --------- | ------------------------------------------------------------------- |
| `result`         | `{ itemId: string, quantity: number }` | **Có**    | ID và số lượng vật phẩm tạo ra.                                      |
| `ingredients`    | `Array` của `RecipeIngredient`     | **Có**    | Danh sách các nguyên liệu cần thiết (từ 1 đến 5).                      |
| `description`    | `{ en: string, vi: string }`     | **Có**    | Mô tả đa ngôn ngữ về công thức.                                      |
| `requiredTool`   | `string` (Item ID)               | Không     | ID của công cụ cần có trong hành trang để thực hiện công thức.      |

**Ví dụ: Công thức chế tạo "Đuốc"**

```json
{
  "torch": {
    "result": { "itemId": "torch", "quantity": 1 },
    "description": { "en": "A simple torch to light your way.", "vi": "Một ngọn đuốc đơn giản để soi sáng đường đi." },
    "ingredients": [
      { "itemId": "sturdyBranch", "quantity": 1 },
      { "itemId": "tornCloth", "quantity": 1 }
    ],
    "requiredTool": "flint"
  }
}
```
*Lưu ý: `itemId` phải là ID duy nhất của vật phẩm (ví dụ: `healingHerb`, không phải tên hiển thị "Healing Herb").*

### 3. Thêm Kẻ địch mới (`enemies`)

Kẻ địch được thêm vào một khu vực (biome) cụ thể.

**Cấu trúc `EnemySpawn`:**

| Thuộc tính   | Kiểu dữ liệu                 | Bắt buộc? | Mô tả                                                            |
| ------------ | ---------------------------- | --------- | ---------------------------------------------------------------- |
| `data`       | `object` (chi tiết kẻ địch)  | **Có**    | Chứa các thông tin như `type`, `hp`, `damage`, `loot`...            |
| `conditions` | `SpawnConditions`            | **Có**    | Các điều kiện để kẻ địch xuất hiện (ví dụ: `chance`, `timeOfDay`). |

**Ví dụ: Thêm "Quái vật Bùn" vào Đầm lầy**

```json
{
  "swamp": [
    {
      "data": {
        "type": "Mud Monster",
        "emoji": "🧌",
        "hp": 60,
        "damage": 10,
        "behavior": "territorial",
        "size": "medium",
        "diet": ["Fish"],
        "satiation": 0,
        "maxSatiation": 2,
        "loot": [
          { "name": "MuddyWater", "chance": 0.5, "quantity": { "min": 1, "max": 2 } }
        ]
      },
      "conditions": {
        "chance": 0.2,
        "moisture": { "min": 8 }
      }
    }
  ]
}
```

---
Hãy sáng tạo và làm cho thế giới của Dreamland Engine trở nên phong phú hơn