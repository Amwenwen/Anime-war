# ⚔ Anime War — MOBA Game

A browser-based MOBA game inspired by Mobile Legends, featuring anime heroes.

## Features

- **11 Anime Heroes** across 6 roles: Assassin, Fighter, Mage, Tank, Support, Marksman
- **3v3 Mode** (5v5 extensible)
- **Bot AI** — Easy / Medium / Hard difficulty
- **Player Invites** — Invite online players to your room
- **Quick Match** — Auto-join or create a room instantly
- **8 Battle Spells** — Flash, Heal, Ignite, Sprint, Purify, Execute, Vengeance, Flicker
- **4 Skills per Hero** — 3 regular + 1 ultimate (Q/W/E/R)
- **RPG-style map** — Towers, bases, minion waves, jungle, river
- **Minimap, HUD, Kill Feed, Respawn system**
- **Real-time multiplayer** via Socket.IO (20 tick/sec server)

## Heroes Roster

| Hero | Anime | Role |
|------|-------|------|
| Naruto Uzumaki | Naruto | Assassin |
| Son Goku | Dragon Ball Z | Fighter |
| Ichigo Kurosaki | Bleach | Mage |
| Monkey D. Luffy | One Piece | Tank |
| Rem | Re:Zero | Support |
| Sasuke Uchiha | Naruto | Marksman |
| Vegeta | Dragon Ball Z | Fighter |
| Roronoa Zoro | One Piece | Fighter |
| Erza Scarlet | Fairy Tail | Fighter |
| Nezuko Kamado | Demon Slayer | Assassin |
| Meliodas | Seven Deadly Sins | Assassin |

## Controls

| Key | Action |
|-----|--------|
| Right Click | Move to location |
| Q | Skill 1 (toward cursor) |
| W | Skill 2 |
| E | Skill 3 |
| R | Ultimate |
| D | Battle Spell |
| ESC | Pause menu |

## How to Run

### 1. Install dependencies
```bash
npm install
```

### 2. Start the server
```bash
npm start
```
Server runs on **http://localhost:3000**

### 3. Open in browser
Go to `http://localhost:3000` in your browser.  
Open multiple tabs to test multiplayer!

## Project Structure

```
anime-war/
├── client/               # Phaser 3 browser game
│   ├── src/
│   │   ├── scenes/       # BootScene, LobbyScene, HeroSelectScene, BattleScene, HUDScene, ResultScene
│   │   └── utils/        # Constants, NetworkManager
│   └── index.html
├── server/
│   ├── game/
│   │   ├── RoomManager.js  # Room lifecycle, matchmaking, invites
│   │   ├── Room.js         # Room state, player/bot management
│   │   └── GameState.js    # Authoritative game simulation, bot AI
│   └── index.js            # Express + Socket.IO server
├── shared/
│   ├── heroes.js           # All hero definitions with skill logic
│   └── spells.js           # Battle spell definitions
└── package.json
```

## Adding New Heroes

Edit `shared/heroes.js` — copy an existing hero block and define:
- `id`, `name`, `anime`, `role`, `color`
- `baseHp`, `baseAtk`, `baseDef`, `speed`, `attackRange`, `attackSpeed`  
- `skills`: array of 4 objects with `id`, `name`, `cooldown`, `description`, `execute(caster, target, gs)`

Also add the hero to `HEROES_CLIENT` in `client/src/utils/Constants.js`.
