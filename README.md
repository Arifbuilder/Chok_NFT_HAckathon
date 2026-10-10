# 🐸 Chog World — Your Chog, Your Identity

**Chog World** is a 2D real-time multiplayer island game inspired by the **Chog Genesis NFT collection on Monad**. Players select their unique Chog NFT identity, explore a top-down island, meet other players in real-time, wave, chat, and unlock ancient island landmarks.

---

## 🌟 Key Features

1. **Chog NFT Identity System**:
   - 4 original Chog preset characters with custom skins, headwear, glowing auras, and trait-based emote effects.
   - Clean, decoupled `NFTVerifierAdapter` pattern (`DemoNFTVerifier` local simulation + `MonadNFTVerifier` stub ready for future wallet RPCs).
   - Identity Card panel displaying token ID (`#0001`), rarity ranks, and cosmetic trait breakdowns.
   - Clearly labeled **Simulated Demo Mode** for fast local play without wallet prerequisites.

2. **2D Island Map & Phaser 3 Game Engine**:
   - Top-down island featuring lush grass, cobblestone paths, trees, rocks, a central social plaza, and a sparkling pond.
   - Collision boundaries preventing walking into water, through trees/rocks, or leaving map bounds.
   - Keyboard (`WASD` / `Arrow Keys`) and Pointer (`Click-to-Move`) navigation.

3. **Real-time Socket.IO Multiplayer**:
   - Live position & animation synchronization across connected browser sessions.
   - Room management with unique socket session IDs.
   - Overhead name tags showing player nicknames and character rarity badges.
   - Disconnecting players are automatically removed from the world.

4. **Social & Progression**:
   - Real-time text chat box with message length validation and auto-scrolling history.
   - Wave emote (`👋 Wave`) and character-specific trait emote (`⚡ Monad Voltage`, `🌟 Golden Starlight`, `🌐 Cyber Matrix`, `🌸 Nature Bloom`).
   - 3 Discoverable island landmarks (**Shrine of Monad**, **Pond of Tranquility**, **Monad Speed Plaza**). Visiting landmarks triggers a personalized discovery popup and saves session progression.

---

## 🛠️ Technology Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Game Engine**: Phaser 3 (2D Arcade Physics & procedural Canvas texture rendering)
- **Backend**: Node.js + Express + Socket.IO
- **Icons**: Lucide React

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18 or newer
- **npm**: v9 or newer

### 1. Installation
```bash
npm install
```

### 2. Launch Backend & Frontend Together
Run a single unified command to start both the Node/Socket server (Port `3001`) and Vite frontend dev server (Port `5173`):
```bash
npm run dev
```

### 3. Open in Browser
Visit **`http://localhost:5173`** to enter Chog World!

---

## 🧪 Testing Multiplayer Verification

To verify full real-time multiplayer functionality:
1. Open **two separate browser tabs or windows** pointing to `http://localhost:5173`.
2. In Tab 1, enter nickname `ChogMaster` and select **Genesis Monad Chog**. Click **Enter Chog World**.
3. In Tab 2, enter nickname `GoldVibes` and select **Aurum Sovereign Chog**. Click **Enter Chog World**.
4. **Real-time Movement**: Move the character in Tab 1 using `WASD` or clicking the map. Observe immediate position synchronization in Tab 2!
5. **Chat**: Type a message in Tab 1's chat box and verify it arrives in Tab 2.
6. **Emotes**: Click `👋 Wave` or `🌟 Golden Starlight` in Tab 2 and watch the overhead speech bubble and particle burst appear in Tab 1!
7. **Discovery**: Walk to the top right shrine at `(750, 220)` to trigger the **Shrine of Monad** discovery popup and check the landmark counter increase to `1/3`.

---

## 📁 Project Architecture & Layout

```
chog-hack/
├── server/
│   ├── server.ts         # Express + Socket.IO server setup & event routing
│   ├── roomManager.ts    # In-memory room state, player tracking & chat history
│   └── types.ts          # Server-side data types
├── src/
│   ├── data/
│   │   ├── characters.ts # Modular Chog character presets & trait definitions
│   │   └── locations.ts  # Discoverable island landmarks & lore
│   ├── services/
│   │   ├── socket.ts     # Client Socket.IO connection manager
│   │   └── nftAdapter.ts # NFTVerifierAdapter interface & DemoNFTVerifier
│   ├── game/
│   │   ├── PhaserGame.tsx            # React wrapper for Phaser 3
│   │   ├── scenes/
│   │   │   └── IslandScene.ts       # 2D Phaser map, physics, movement & emotes
│   │   └── utils/
│   │       └── textureGenerator.ts  # Procedural Canvas sprite & tile renderer
│   ├── components/
│   │   ├── StartScreen.tsx     # Polished landing screen & character picker
│   │   ├── IdentityPanel.tsx   # Verified traits & identity card popup
│   │   ├── ChatBox.tsx         # Real-time text chat widget
│   │   ├── PlayerList.tsx      # Active online players sidebar
│   │   ├── DiscoveryBanner.tsx # Personalized landmark discovery notification
│   │   ├── ConnectionBadge.tsx # Socket status & room code HUD
│   │   └── EmoteBar.tsx        # Quick action emote toolbar
│   ├── App.tsx                 # Main React container & state manager
│   └── main.tsx                # App entrypoint
├── package.json
└── vite.config.ts
```

---

## ⚙️ Adding New Characters or Locations

- **To add a new Chog character**: Open [`src/data/characters.ts`](file:///c:/Users/user/Desktop/chog%20hack/src/data/characters.ts) and append a new object to `CHOG_CHARACTERS`.
- **To add a new Island landmark**: Open [`src/data/locations.ts`](file:///c:/Users/user/Desktop/chog%20hack/src/data/locations.ts) and append a new location definition with `x`, `y`, `radius`, `name`, and `chogLore`.
