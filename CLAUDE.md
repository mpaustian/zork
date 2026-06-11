# Zork: The Great Underground Empire — Graphical Adventure

## Project Overview
A darkly comedic adventure adapting Zork I. Free and open source.

**Repo:** https://github.com/mpaustian/zork

Two implementations live here:
- **`zork3d/` — the active project**: a full 3D web remake (Three.js + Vite, toon-shaded
  cartoon dioramas). Runs in any browser; `zork3d/dist/index.html` is a self-contained
  playable build. Tests: `npm test` (vitest unit) and `npm run e2e` (Playwright +
  system Chrome, fully runnable on this Linux box). See `zork3d/README.md`.
- **Godot 4.6.2 2D point-and-click** (repo root): the original Phase 1 vertical slice,
  kept as reference. NOTE: Godot is NOT installed on this Linux machine — the user
  runs Godot only on a separate Windows machine.

## Key Design Decisions
- **Interaction:** Point-and-click with verb coin radial menu (right-click hotspots)
- **Art style:** Modern pixel art, 640x360 native resolution, scaled up. Currently using colored placeholder rectangles
- **Tone:** Darkly comedic. Monkey Island wit + Darkest Dungeon atmosphere + Zork deadpan absurdism
- **Narrator:** Snarky text narrator with typewriter effect. Sardonic, judgmental, occasionally helpful
- **Death system:** "The Grim Rewind" — funny death vignettes then VHS-rewind to pre-death moment. No progress lost. Death Gallery
- **Lighting:** Lamp fuel system (400 turns). Visual dimming stages. Grue attacks in darkness. Torch (infinite light) obtainable in coal mine
- **Combat:** QTE-lite (timed click prompts), not a full combat system
- **Audio:** Ambient + minimal. Environmental sounds, musical stings only for key moments
- **Adaptation philosophy:** Creative adaptation, NOT faithful reimagining. Freedom to change as long as the soul of Zork is preserved
- **Platform:** Godot 4.x, multi-platform (desktop primary, web secondary)
- **Distribution:** Free / open source (itch.io, GitHub)

## Current State: Phase 2 — Full Underground

### Stats
- **65 rooms** across 7 areas
- **37 items** (15 treasures worth 127 points)
- **208+ narrator text entries**
- **13 room-specific scripts** with puzzle logic
- **9 autoload managers** (GameManager, RoomManager, InventoryManager, NarratorManager, LightingManager, DeathManager, AudioManager, SaveManager, ThiefManager)

### Architecture
- **9 Autoload Managers:** GameManager, RoomManager, InventoryManager, NarratorManager, LightingManager, DeathManager, AudioManager, SaveManager, ThiefManager
- **Core Systems:** Player (click-to-move), Hotspot (clickable areas), BaseRoom (room template)
- **UI:** VerbCoin, InventoryUI (right-click lantern to toggle), NarratorDisplay, DarknessOverlay, DeathVignette, ScoreDisplay
- **Data-driven:** Room connections, items, and narrator text in JSON (`resources/` directory)
- **Input:** main.gd dispatches clicks to hotspots directly (bypasses Godot's physics picking due to CanvasLayer interference)

### Areas Implemented
1. **Above Ground (10 rooms):** House (4 sides), Kitchen, Living Room, Attic, Forest (3), Clearing, Canyon (3), Stone Barrow, Garden, Cliff Edge
2. **The House (3 rooms):** Kitchen (lantern), Living Room (trophy case, rug/trap door, sword), Attic (knife, rope)
3. **Underground Core (12 rooms):** Cellar, Dark Passage, Troll Room, Maze (4), Round Room, Cyclops Room, Treasure Room, Engravings Cave, Dome Room
4. **Dam & River (12 rooms):** Dam, Dam Lobby, Maintenance Room, Dam Base, Reservoir (2), Stream, River Bank, Aragain Falls, Rainbow Room, End of Rainbow, Underground River
5. **Temple/Hades (6 rooms):** Temple, Egyptian Room, Altar, Crypt, Hades Entrance, Land of the Dead
6. **Mirror/Gallery (4 rooms):** Mirror Rooms (N/S), Gallery, Studio
7. **Coal Mine (7 rooms):** Coal Mine Entrance, Shaft, Timber, Drafty, Gas, Machine, Mine Tunnel

### Puzzles Working
- Window puzzle (east of house → kitchen)
- Mailbox opening (west of house)
- Rug → trap door → cellar (living room)
- Troll combat (QTE-lite with elvish sword)
- Cyclops puzzle (show Odysseus scroll)
- Trophy case scoring (place treasures)
- Dam drain puzzle (wrench → loosen bolts → blue button)
- Loud Room platinum bar (requires dam drained)
- Bell/book/candle altar puzzle (banishes spirits → Hades access)
- Coal machine → torch (critical infinite light)
- Rainbow bridge (wave sceptre at Aragain Falls)
- Tree climbing for egg (clearing)
- Raft inflation (air pump at river bank)

### Active Systems
- **Thief AI:** Roams underground, steals treasures, can be defeated
- **Lamp fuel:** 400 turns, visual dimming, Grue attacks in darkness
- **Scoring:** MAX_SCORE = 200, 9 rank tiers
- **Death & Grim Rewind:** Multiple death types (grue, troll, thief, explosion, fall, drowning)
- **Save/Load:** Auto-save on room transitions, includes all manager state

## Godot Version
Using Godot 4.6.2. This version is strict about type inference — always use explicit type annotations (e.g., `var foo: Node = bar.instantiate()` not `var foo := bar.instantiate()`). Never use `:=` when the right side returns a Variant or untyped value.

## PRD
Full PRD is at `docs/PRD.md`. Key sections: Game Identity, Art Direction, Gameplay Systems, Content/Puzzles, Audio, Technical Architecture, Milestones.

## Development Workflow
- User tests on a Windows machine running Godot 4.6.2 (installed at G:\godot)
- Development happens on WSL Ubuntu 24.04
- Always commit and push changes to GitHub so they can pull and test
- This is a fun side project / tech demo — keep it enjoyable
