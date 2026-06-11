# Zork 3D — Web-Based 3D Adventure (Three.js)

Goal: Fully functional, tested, playable 3D adventure adapting the existing Zork
vertical slice. Stylish cartoon art (toon shading, low-poly dioramas), dark humor.
Platform: web (Three.js) — testable headlessly here, playable in any browser on Windows.

## Plan

- [x] 1. Scaffold `zork3d/` npm project (vite, three, vitest, playwright w/ system Chrome)
- [x] 2. Port game content: rooms, items, narrator text (+ fix dangling exits, add
      Odyssey-page clue item, add Loud Room + Narrow Passage w/ platinum bar puzzle)
- [x] 3. Pure game engine (`src/game/`): state, movement, flags, inventory, scoring,
      lamp fuel + grue, troll QTE state machine, cyclops puzzle, deaths w/ rewind
      snapshots, save/load
- [x] 4. Unit tests for the full engine (vitest) — 30 tests green, incl. win path
- [x] 5. 3D rendering (`src/render/`): toon-shaded diorama rooms (Sonnet agent),
      procedural cartoon player, exit portals, hotspot objects, lighting stages
- [x] 6. UI (`src/ui/`): narrator typewriter box, verb coin radial menu, inventory bar,
      score/rank, lamp gauge, death vignette w/ VHS rewind, title screen (Sonnet agent)
- [x] 7. Procedural audio (WebAudio): ambience + stings, no assets (Sonnet agent)
- [x] 8. E2E tests (playwright): 8/8 green — boot/render, portals/blocked exits, verb
      coin, troll QTE via real clicks, fall death + Grim Rewind, grue warning, FULL
      win playthrough (score 250/250), screenshot tour of all 20 rooms
- [x] 9. Single-file build (dist/index.html, 866KB), README, commit + push

## Review

Shipped a complete 3D web remake in `zork3d/` (Three.js + Vite). 20 rooms, 5 treasures,
4 deaths, troll QTE, cyclops/Odyssey puzzle, loud-room light-vs-silence puzzle,
lamp fuel + grue, autosave, procedural audio, toon-shaded diorama art.
38 automated tests green (30 unit + 8 e2e in headless Chrome).

Integration bugs found & fixed during testing:
- Grue clock no longer resets on room change (fleeing in the dark is deadly, as intended)
- Headless/background tabs throttle setTimeout → typewriters are now time-based
- Death vignette skippable in any phase
- Portals only trigger for a player in motion (spurious-move flake)
- House walls were rotated/positioned wrong in all 4 outdoor rooms
- Cyclops faced away from camera; attic roof beams occluded the whole room
- WebGL pixel assertions need preserveDrawingBuffer

Lesson captured in lessons.md: verify toolchain availability before planning around it
(no Godot on this box → pivoted to a web stack that's fully testable here).
