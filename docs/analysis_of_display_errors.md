# Báo cáo Phân tích Lỗi Hiển thị & Trạng thái Engine

**Ngày:** 17/07/2025
**Người thực hiện:** AI Code Partner
**Mục tiêu:** Trả lời các câu hỏi chẩn đoán của Đội trưởng để làm rõ nguyên nhân gốc rễ của các lỗi hiển thị và logic hiện tại.

---

## Vấn đề 1: Tên skill hiển thị lỗi (ví dụ: `skillFireballName`)

### 1. Tên skill được lưu trữ ở đâu?

- **Vị trí:** Tên và toàn bộ định nghĩa của skill được lưu trữ trong một mảng tĩnh có tên `skillDefinitions` tại file: `src/lib/game/skills.ts`.

### 2. Cấu trúc dữ liệu của một skill trông như thế nào?

- **Cấu trúc:** Tên và mô tả của skill hiện tại đang là một chuỗi `string` đơn thuần, đóng vai trò như một "key" (mã định danh).
- **Ví dụ từ `skills.ts`:**
  ```typescript
  {
      name: 'skillFireballName', // <--- Đây là một string, không phải object {en, vi}
      description: 'skillFireballDesc',
      tier: 1,
      // ... các thuộc tính khác
  }
  ```

### 3. Đoạn code nào đang hiển thị tên skill?

- **Vị trí:** Component `src/components/game/game-layout.tsx`, trong một vòng lặp `.map()` qua `playerStats.skills`.
- **Đoạn code:**
  ```tsx
  <Button>
      {t(skill.name)} {/* <--- Lỗi xảy ra ở đây */}
  </Button>
  ```
- **Phân tích:** `skill.name` đang là một chuỗi (ví dụ: "skillFireballName"). Hàm `t()` (hàm dịch thuật) khi không tìm thấy key "skillFireballName" trong các file ngôn ngữ, nó sẽ trả về chính key đó. Đây là nguyên nhân gốc rễ của lỗi hiển thị.

---

## Vấn đề 2: Không hiển thị map và minimap

### 1. Dữ liệu bản đồ được lưu trữ ở đâu?

- **Vị trí:** Toàn bộ dữ liệu của thế giới, bao gồm tất cả các `chunk` đã được tạo, được lưu trữ trong một state có tên `world` trong hook `useGameState`. State này có kiểu `World`, là một object với key là tọa độ (ví dụ: "0,0") và value là object `Chunk`.

### 2. Component nào đang render bản đồ?

- **Component chính:** `src/components/game/minimap.tsx`. Component này chịu trách nhiệm hiển thị cả bản đồ nhỏ 5x5 và bản đồ lớn trong popup.
- **Logic tạo grid:** Logic để lấy dữ liệu từ state `world` và chuyển thành một mảng 2D (grid) cho minimap nằm trong `src/components/game/game-layout.tsx`, cụ thể là trong hàm `generateMapGrid`.

### 3. Có sử dụng thư viện đồ họa nào không?

- **Không.** Bản đồ hoàn toàn được render bằng các thẻ `<div>` của HTML, được tạo kiểu bằng Tailwind CSS để tạo ra một lưới ô vuông.

### 4. Có log lỗi nào liên quan không?

- **Hiện tại chưa có.** Các log trước đây liên quan đến việc render các object không hợp lệ. Tuy nhiên, việc bản đồ trống cho thấy có thể `generateMapGrid` đang trả về một mảng rỗng, hoặc dữ liệu `world` trong state chưa được khởi tạo đúng cách khi game bắt đầu.

---

## Vấn đề 3: Nhiệt độ môi trường cực cao (76°C)

### 1. Nhiệt độ MT được tính toán dựa trên những yếu tố nào?

- **Yếu tố chính:**
    1.  **Nhiệt độ cơ bản của Biome:** Mỗi loại địa hình (ví dụ: `forest`, `desert`) có một dải nhiệt độ mặc định, được định nghĩa trong `src/lib/game/world-config.ts`.
    2.  **Mùa trong năm:** Mỗi mùa (`spring`, `winter`,...) có một giá trị `temperatureMod` (điều chỉnh nhiệt độ), được định nghĩa trong `seasonConfig` tại `world-config.ts`.
    3.  **Thời tiết hiện tại:** Mỗi trạng thái thời tiết (ví dụ: `light_rain`, `blizzard`) có một giá trị `temperature_delta` (thay đổi nhiệt độ), được định nghĩa trong `src/lib/game/weatherPresets.ts`.
    4.  **Tác động từ công trình:** Một số công trình do người chơi xây dựng (ví dụ: `Lửa trại`) có thể có thuộc tính `heatValue` làm thay đổi nhiệt độ của chunk đó.

### 2. Hàm/logic nào chịu trách nhiệm tính toán?

- **Hàm chính:** `getEffectiveChunk` trong file `src/lib/game/engine/generation.ts`.
- **Logic:** Hàm này lấy `baseChunk` (dữ liệu chunk gốc), sau đó áp dụng các `delta` từ `weather` và các hiệu ứng khác để tính ra nhiệt độ cuối cùng mà người chơi cảm nhận được.
- **Phỏng đoán:** Nhiệt độ 76°C có thể là kết quả của việc các giá trị đầu vào cho công thức (ví dụ: nhiệt độ cơ bản từ `world-config`) đang được định nghĩa theo một thang đo khác (ví dụ: 0-10), nhưng lại được hiển thị như thể nó là độ C. Hoặc có một lỗi trong logic cộng dồn các giá trị điều chỉnh.

### 3. Có GameSetting/WorldSetting mặc định nào không?

- **Có.** File `src/lib/game/world-config.ts` chứa tất cả các cấu hình mặc định cho các biome, bao gồm cả `defaultValueRanges` cho `temperature`. Đây là nguồn dữ liệu quan trọng nhất cần kiểm tra.

---

## Vấn đề 4: Kể chuyện (narrative) quá ngắn/lỗi

### 1. Narrative được lấy từ đâu?

- **Nguồn chính:**
    - **Khi bắt đầu game:** Từ `worldSetup.initialNarrative` (được sinh ra bởi AI trong `generate-world-setup.ts`).
    - **Khi di chuyển (offline):** Từ hàm `generateOfflineNarrative` trong `src/lib/game/engine/offline.ts`. Hàm này sẽ chọn các template từ `src/lib/game/data/narrative-templates.ts` dựa trên `mood` của chunk.

### 2. Cấu trúc của một narrative/mô tả khu vực?

- **Đa dạng:**
    - Các narrative khởi tạo (`initialNarrative`) và các key như `worldName_driftingAcademy` là các `TranslatableString` (`{en, vi}`).
    - Các template trong `narrative-templates.ts` là các chuỗi `string` có chứa các placeholder (ví dụ: `Bạn đang ở trong một khu rừng [adjective].`).

### 3. Game chọn/sinh ra câu chuyện như thế nào?

- **Offline:** Hàm `generateOfflineNarrative` là "bộ não". Nó:
    1.  Phân tích chunk để ra `mood` (ví dụ: "Danger", "Peaceful").
    2.  Lọc các `NarrativeTemplate` phù hợp với `mood` và các điều kiện khác.
    3.  Chọn một template ngẫu nhiên theo trọng số (`weight`).
    4.  Dùng hàm `fill_template` để điền vào các placeholder (ví dụ: thay `[adjective]` bằng một tính từ ngẫu nhiên).
- **Online (AI):** Gọi flow `generateNarrative` để AI tự viết câu chuyện.

### 4. `worldName_driftingAcademy` có phải là ID không?

- **Chính xác.** Các chuỗi như `worldName_driftingAcademy` và `mage_narrative1` là các "key" (mã định danh) để tra cứu trong các file ngôn ngữ (ví dụ: `src/lib/locales/premade-worlds.ts`). Lỗi hiển thị xảy ra khi hàm `t()` không tìm thấy bản dịch cho key đó và trả về chính key.