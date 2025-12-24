# Dreamland Engine

**Dreamland Engine** is an event-driven, text-adventure game platform powered by Generative AI. It combines procedural generation with LLM-based narrative to create an infinite, reactive world.

---

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Running the Project](#running-the-project)
- [Project Structure](#project-structure)
- [Key Mechanics](#key-mechanics)
- [Contributing](#contributing)

---

## ✨ Features

- **Infinite World**: Procedural chunk generation with biome diversity (Forest, Desert, Swamp, etc.).
- **AI Narrative**: Integrated **Genkit** (Google AI/OpenAI) flow for context-aware storytelling that reacts to player actions, inventory, and improved status.
- **Simulation**:
    - **Day/Night Cycle**: 1 Turn = 10 minutes. Affects visibility and spawn rates.
    - **Weather System**: Dynamic weather (Rain, Storm, Fog) impacting gameplay physics and crop growth.
- **Player Systems**:
    - **Stats**: Health, Mana, Stamina, Hunger, Body Temperature.
    - **Skills**: Skill trees and ability casting.
    - **Inventory**: Slot-based inventory with equipment and hotbar.
    - **Crafting & Farming**: Recipe-based crafting and tile-based farming logic.
- **Persistence**: Full state persistence using **IndexedDB** (Dexie.js), supporting offline play.
- **Mobile Support**: PWA capability and Capacitor support for native Android builds.

---

## 🛠 Technology Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **AI Orchestration**: [Genkit](https://firebase.google.com/docs/genkit)
- **UI Components**: [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Shadcn/UI](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Database (Client)**: [Dexie.js](https://dexie.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

---

## ⚙️ Prerequisites

- **Node.js**: Version 20.0.0 or higher.
- **npm**: Version 10.0.0 or higher.
- **API Keys**: Google Gemini API Key or OpenAI API Key (configured in `.env`).

---

## � Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/dreamland-engine.git
    cd dreamland-engine
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Environment Setup**:
    Create a `.env` file in the root directory (refer to `.env.example`) and add your API keys:
    ```env
    GOOGLE_GENAI_API_KEY=your_api_key_here
    ```

---

## ▶️ Running the Project

The system requires two processes running in parallel:

**1. Web Application (Frontend)**
```bash
npm run dev
# Runs at http://localhost:9003
```

**2. AI Flow Server (Backend Logic)**
```bash
npm run genkit:watch
# Watches for AI flow changes and handles LLM requests
```

---

## 📐 Project Structure

```
src/
├── app/                  # Next.js App Router pages
├── components/           # React components
│   ├── game/             # Game-specific UI (HUD, Map, Dialogs)
│   └── ui/               # Generic UI library (Buttons, Inputs)
├── core/                 # Pure Business Logic (Domain)
│   ├── data/             # Static game data (Items, Biomes)
│   ├── domain/           # Zod schemas & TypeScript types
│   ├── engines/          # Game Systems (Stats, Action Tracker)
│   ├── rules/            # Pure rule functions (Combat, Crafting)
│   └── usecases/         # State orchestration
├── hooks/                # React Hooks bridging UI and Core
│   └── actions/          # Action handlers (Move, Attack, Harvest)
├── lib/                  # Utilities (Math, Formatting)
└── store/                # Zustand UI Stores
```

---

## 🎮 Key Mechanics

### Action System
All interactions go through the **Action Tracker**, creating an immutable history used for Quest evaluation and Statistics.

### Quest System
Passive, event-driven system. Quests monitor `PlayerStatistics` and auto-complete when criteria are met (Kill Count, Exploration, Crafting).

### Weather
Global weather patterns update periodically. Localized weather (like caves) overrides global state.

---

## 🤝 Contributing

Please read `docs/ARCHITECTURE.md` before submitting code.
Key rules:
1.  **No God Files**: Keep files focused (Single Responsibility).
2.  **Strict Types**: No `any`. Use Zod for runtime validation.
3.  **Docs First**: Update documentation if changing core logic.

---

## 📝 License

[MIT License](LICENSE)
