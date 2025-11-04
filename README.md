
# Dreamland Engine

**Dreamland Engine** mở ra một thế giới phiêu lưu nơi mọi lựa chọn của bạn đều có sức mạnh thay đổi vận mệnh, cảnh vật, và cả những câu chuyện chưa từng được kể. Được dẫn dắt bởi AI kể chuyện, bạn sẽ khám phá một vũ trụ sống động, nơi từng vùng đất, từng sinh vật, và từng thử thách đều phản ứng linh hoạt với hành động của bạn.

Không chỉ là một game text-based, Dreamland Engine là nơi bạn có thể tự do sáng tạo, khám phá, sinh tồn, và viết nên câu chuyện của riêng mình. Thế giới không ngừng biến đổi, các hệ thống thời gian, thời tiết, và tâm trạng tạo ra những trải nghiệm mới mẻ mỗi lần chơi. Bạn có thể mở rộng game bằng mod, tự tạo vật phẩm, kẻ thù, hoặc thậm chí cả những vùng đất mới chỉ với vài dòng JSON hoặc TypeScript.

## 🚀 Công nghệ sử dụng

- **Framework:** Next.js 14 (App Router)
- **Ngôn ngữ:** TypeScript
- **Giao diện:** React, Tailwind CSS, Shadcn/UI
- **AI:** Genkit (Google AI, OpenAI)
- **Mobile:** Capacitor (hỗ trợ build ra app Android)
- **Lưu trữ phía Client:** Dexie.js (IndexedDB wrapper)
- **Kiểm thử:** Jest
- **Tài liệu:** TypeDoc

## 🛠️ Cài đặt & Chạy dự án

1.  **Clone repository:**
    ```bash
    git clone https://github.com/your-username/dreamland-engine.git
    cd dreamland-engine
    ```

2.  **Cài đặt dependencies:**
    ```bash
    npm install
    ```

3.  **Chạy môi trường phát triển:**
    Để chạy ứng dụng Next.js và các flow AI cùng lúc, bạn cần mở hai terminal:

    *   **Terminal 1: Chạy app Next.js**
        ```bash
        npm run dev
        ```
        Ứng dụng sẽ có sẵn tại `http://localhost:9003`.

    *   **Terminal 2: Chạy Genkit AI flows**
        ```bash
        npm run genkit:watch
        ```
        Thao tác này sẽ khởi động và theo dõi các flow AI, cho phép narrative được sinh ra tự động.

4.  **Các script hữu ích khác:**
    *   `npm run build`: Build ứng dụng cho môi trường production.
    *   `npm run test`: Chạy các bài test bằng Jest.
    *   `npm run docs`: Tạo tài liệu từ mã nguồn TypeScript bằng TypeDoc.

## 🎮 Cách chơi & trải nghiệm

1. **Khởi tạo thế giới:** Chọn kịch bản hoặc nhập ý tưởng, engine sẽ sinh thế giới với các vùng, địa hình, và hệ sinh thái động.
2. **Khám phá:** Di chuyển bằng các phím mũi tên hoặc WASD, mỗi hành động là một lượt (turn), thời gian trong game sẽ thay đổi theo từng lượt.
3. **Tương tác:** Sử dụng các nút hành động theo ngữ cảnh hoặc nhập lệnh tự do (ví dụ: "search", "attack", "craft torch"). AI sẽ diễn giải và phản hồi lại bằng narrative động.
4. **Sinh tồn & chiến đấu:** Quản lý chỉ số (HP, mana, stamina, bodyTemperature), chế tạo vật phẩm, xây dựng nơi trú ẩn, và tham gia combat theo lượt với kẻ thù. Các chỉ số môi trường (lightLevel, dangerLevel, moisture, ...) ảnh hưởng trực tiếp đến gameplay và kết quả hành động.
5. **Modding:** Có thể thêm nội dung mới (items, recipes, enemies) bằng cách paste JSON mod bundle vào game. Mod có thể viết bằng TypeScript để kiểm tra kiểu dữ liệu trước khi sử dụng.
6. **Tiến trình & sự kiện:** Thế giới thay đổi theo thời gian, thời tiết, và hành động của người chơi. Các sự kiện đặc biệt, trạng thái môi trường, và mood sẽ ảnh hưởng đến narrative và gameplay.

## 🏗️ Kiến trúc & Cơ chế cốt lõi

- **AI Narrative Generation:** Phần lõi của trải nghiệm được vận hành bởi **Genkit**, một framework AI cho phép tạo ra các flow sinh nội dung (như nhiệm vụ, mô tả, sự kiện) một cách linh hoạt, có thể kết hợp nhiều model ngôn ngữ khác nhau (Google AI, OpenAI).
- **Cross-Platform:** Dự án được xây dựng trên nền tảng web với **Next.js** và có thể được đóng gói thành ứng dụng di động cho Android bằng **Capacitor**.
- **Hệ thống thời gian:** Mỗi hành động = 1 turn, mỗi turn = +10 phút. Ngày/đêm động, lightLevel ảnh hưởng bởi biome, thời gian, thời tiết, thảm thực vật.
- **Chunk & World Generation:** Chunk là tile chứa địa hình, vật phẩm, kẻ thù, chỉ số môi trường. Sinh chủ động 15x15 quanh người chơi, bất đồng bộ để mượt UX. Có hệ thống Region và LOD cho chunk xa.
- **Chỉ số & Mood:** Chunk có các chỉ số (dangerLevel, lightLevel, moisture, elevation, magicAffinity, ...), player có hp, mana, stamina, bodyTemperature. MoodTag được sinh từ stats, dùng cho narrative động.
- **Engines & Usecases:** EffectEngine (buff/debuff, stacking, conditions), WeatherEngine (thời tiết động, hiệu ứng vùng), Usecase điều phối hành động (exploration, combat, weather, experience).

## 🧩 Modding & mở rộng

- Mod viết bằng TypeScript, paste JSON vào game.
- Data schemas versioned, extensible, validated bằng Zod.
- Nội dung mới luôn modular, tránh hardcode.
- Xem `docs/core_mechanics_report.md` và `docs/dreamland_engine_report.md` để cập nhật conventions và kiến trúc.

## 📝 Ví dụ & best practices

- **Mod Bundle:** Viết bằng TypeScript, paste JSON vào game. Xem `docs/core_mechanics_report.md` để biết cấu trúc.
- **Entity Extension:** Mở rộng interface ở `src/core/types/attributes.ts`, implement logic ở `src/core/entities/`.
- **AI Flow:** Thêm flow mới ở `src/ai/flows/`, đăng ký qua plugin ở `src/ai/plugins/`.
- **Combat/Exploration:** Logic theo lượt, outcome dựa trên stats, narrative chọn theo mood.


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
