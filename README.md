# 🌌 Dreamland Engine

> **Where stories come alive.**
> Ein world of infinite Adventure, powered by AI.

**Dreamland Engine** mở ra một thế giới phiêu lưu nơi mọi lựa chọn của bạn đều có sức mạnh thay đổi vận mệnh, cảnh vật, và cả những câu chuyện chưa từng được kể. Được dẫn dắt bởi AI kể chuyện, bạn sẽ khám phá một vũ trụ sống động, nơi từng vùng đất, từng sinh vật, và từng thử thách đều phản ứng linh hoạt với hành động của bạn.

Không chỉ là một game text-based, Dreamland Engine là nơi bạn có thể tự do sáng tạo, khám phá, sinh tồn, và viết nên câu chuyện của riêng mình.

---

## 🚀 Công Nghệ Cốt Lõi

Dự án sử dụng stack công nghệ hiện đại nhất để đảm bảo hiệu năng và trải nghiệm người dùng:

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Ngôn ngữ**: [TypeScript](https://www.typescriptlang.org/)
*   **AI Core**: [Genkit](https://firebase.google.com/docs/genkit) (Google AI, OpenAI)
*   **UI/UX**: [React](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
*   **Mobile**: [Capacitor](https://capacitorjs.com/) (Android Build Support)
*   **Client DB**: [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
*   **Testing**: [Jest](https://jestjs.io/)
*   **Documentation**: [TypeDoc](https://typedoc.org/)

---

## 🛠️ Cài Đặt & Khởi Chạy

### 1. Clone Repository
```bash
git clone https://github.com/your-username/dreamland-engine.git
cd dreamland-engine
```

### 2. Cài Đặt Dependencies
```bash
npm install
```

### 3. Chạy Môi Trường Phát Triển
Hệ thống yêu cầu chạy song song ứng dụng Next.js và Genkit AI flows. Mở 2 terminal riêng biệt:

**Terminal 1: Web App**
```bash
npm run dev
# Truy cập tại: http://localhost:9003
```

**Terminal 2: AI Flows (Genkit)**
```bash
npm run genkit:watch
# Khởi động engine kể chuyện AI
```

### Các Lệnh Hữu Ích Khác
| Lệnh | Mô tả |
| :--- | :--- |
| `npm run build` | Build ứng dụng cho production (tối ưu hóa) |
| `npm run test` | Chạy bộ kiểm thử Jest |
| `npm run docs` | Tạo tài liệu API từ mã nguồn |

---

## 🎮 Hướng Dẫn Chơi

1.  **Khởi tạo thế giới**: Chọn kịch bản hoặc nhập ý tưởng, engine sẽ procedural generation thế giới với các biome độc đáo.
2.  **Khám phá**: Di chuyển (Arrow Keys/WASD). Mỗi bước đi là một *lượt (turn)*, ảnh hưởng đến thời gian và trạng thái thế giới.
3.  **Hành động**: Tương tác ngữ cảnh hoặc nhập lệnh tự do (VD: _"craft torch"_, _"look around"_). AI sẽ phản hồi bằng narrative sống động.
4.  **Sinh tồn**: Quản lý HP, Mana, Stamina, Body Temp. Chú ý các chỉ số môi trường như `DangerLevel`, `LightLevel`.
5.  **Tiến trình**: Thế giới "sống" và thay đổi theo thời gian thực trong game.

---

## 🏗️ Kiến Trúc & Cơ Chế

*   **AI Narrative Generation**: Sử dụng Genkit để điều phối các LLM, tạo ra nội dung phong phú và nhất quán.
*   **Chunk System**: Hệ thống load map thông minh 15x15 chunks xung quanh người chơi, hỗ trợ vô hạn thế giới mà vẫn mượt mà.
*   **Simulation Engine**:
    *   **Time**: 1 Turn = 10 phút in-game. Chu kỳ ngày/đêm động.
    *   **Environment**: Tính toán độ ẩm, ánh sáng, địa hình ảnh hưởng trực tiếp đến gameplay.
    *   **Mood**: Hệ thống "cảm xúc" của không gian (MoodTag) điều hướng văn phong của AI.

---

## 🧩 Modding (Mở Rộng Game)

Dreamland Engine được thiết kế để dễ dàng mở rộng thông qua các **JSON Mod Bundles**. Bạn có thể thêm Item, Recipe, Enemy mà không cần can thiệp sâu vào code lõi.

### 1. Item Mới (Vật Phẩm)
Cấu trúc JSON cho một vật phẩm:

```json
{
  "my_magic_stone": {
    "name": { "en": "Magic Stone", "vi": "Đá Ma Thuật" },
    "description": { "en": "A humming stone.", "vi": "Viên đá phát ra tiếng vo ve." },
    "tier": 2,
    "category": "Magic",
    "emoji": "💎",
    "baseQuantity": { "min": 1, "max": 3 }
  }
}
```

### 2. Recipe Mới (Công Thức)
```json
{
  "torch": {
    "result": { "itemId": "torch", "quantity": 1 },
    "ingredients": [
      { "itemId": "stick", "quantity": 1 },
      { "itemId": "cloth", "quantity": 1 }
    ]
  }
}
```

> 💡 Xem thêm chi tiết tại `docs/core_mechanics_report.md` để nắm rõ quy chuẩn data.

---

## 🤝 Đóng Góp

Mọi đóng góp đều được hoan nghênh! Hãy mở Issues hoặc Pull Request để cùng phát triển Dreamland Engine.

---

<p align="center">Made with ❤️ by Dreamland Team</p>
