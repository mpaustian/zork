# Zork: The Great Underground Empire — Graphical Adventure

## Project Overview
A darkly comedic point-and-click graphical adventure adapting Zork I, built in Godot 4.x (currently 4.6.2) with modern pixel art. Free and open source.

**Repo:** https://github.com/mpaustian/zork

## Key Design Decisions
- **Interaction:** Point-and-click with verb coin radial menu (right-click)
- **Art style:** Modern pixel art, 640x360 native resolution, scaled up. NOT authentically retro — clean and stylized
- **Tone:** Darkly comedic. Monkey Island wit + Darkest Dungeon atmosphere + Zork deadpan absurdism
- **Narrator:** Snarky text narrator with typewriter effect. The game's secret weapon — sardonic, judgmental, occasionally helpful
- **Death system:** "The Grim Rewind" — elaborate funny death vignettes then VHS-rewind to pre-death moment. No progress lost. Death Gallery collects unique deaths
- **Lighting:** Lamp fuel system (400 turns). Visual dimming stages. Grue attacks in darkness
- **Combat:** QTE-lite (timed click prompts), not a full combat system
- **Audio:** Ambient + minimal. Environmental sounds, musical stings only for key moments
- **Adaptation philosophy:** Creative adaptation, NOT faithful reimagining. Freedom to add/change/cut rooms and puzzles as long as the soul of Zork is preserved. North star: "Would this be fun even if you'd never heard of Zork?"
- **Platform:** Godot 4.x, multi-platform (desktop primary, web secondary)
- **Distribution:** Free / open source (itch.io, GitHub)
- **License note:** Microsoft open-sourced Zork 1/2/3. Trademark may need care in titling

## Current State: Phase 1 Vertical Slice
16 rooms with placeholder art (colored rectangles), all core systems implemented:

### Architecture
- **8 Autoload Managers:** GameManager, RoomManager, InventoryManager, NarratorManager, LightingManager, DeathManager, AudioManager, SaveManager
- **Core Systems:** Player (click-to-move), Hotspot (clickable areas), BaseRoom (room template)
- **UI:** VerbCoin, InventoryUI, NarratorDisplay, DarknessOverlay, DeathVignette, ScoreDisplay, CursorManager
- **Data-driven:** Room connections, items, and narrator text in JSON (`resources/` directory)

### Rooms Implemented
West/North/South/East of House, Kitchen, Living Room, Attic, Cellar, Troll Room, Maze (3 rooms + dead end), Round Room, Cyclops Room, Treasure Room

### Puzzles Working
- Window puzzle (east of house)
- Rug → trap door (living room)
- Troll combat (QTE-lite)
- Cyclops puzzle
- Trophy case scoring

## Godot Version
Using Godot 4.6.2. This version is strict about type inference — always use explicit type annotations (e.g., `var foo: Node = bar.instantiate()` not `var foo := bar.instantiate()`). Never use `:=` when the right side returns a Variant or untyped value.

## PRD
Full PRD is at `.claude/plans/sunny-hugging-otter.md` in this repo's parent project. Key sections: Game Identity, Art Direction, Gameplay Systems, Content/Puzzles, Audio, Technical Architecture, Milestones.

## Development Workflow
- User tests on a Windows machine running Godot 4.6.2
- Always commit and push changes to GitHub so they can pull and test
- This is a fun side project / tech demo — keep it enjoyable
