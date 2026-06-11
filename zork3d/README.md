# ZORK — The Great Underground Empire (3D)

A darkly comedic **3D** point-and-click adventure adapting Zork I. Stylish cartoon
visuals (toon-shaded floating dioramas), a snarky narrator, the Grim Rewind death
system, lamp-fuel grue tension, troll QTE combat, and five treasures to loot.

Built with Three.js. No engine install needed — it runs in a browser.

## Play it (easiest)

Open **`dist/index.html`** in any modern browser (Chrome/Edge/Firefox). The whole
game is bundled into that single file — double-click and play.

## Play it (dev mode)

```bash
cd zork3d
npm install
npm run dev      # then open the printed localhost URL
```

## Controls

- **WASD / arrow keys** or **click the ground** — move
- **Click objects** — verb coin (Look / Use / Take / Talk / Attack)
- **Click an inventory item, then click a target** — use item on thing
- **Double-click an inventory item** — use it on itself (read it, light it...)
- **L** — toggle lantern, **T** — toggle torch (once you have them)
- Walk into a glowing archway to travel. Red archways have opinions.

## Goal

Find all **five treasures** and arrange them attractively in the trophy case.
Try not to die. When you do die (you will), the Grim Rewind puts you back —
and adds your demise to the **Death Gallery**. Collect them all, if you're proud
of that sort of thing.

## Hints (spoilers, obviously)

<details><summary>I can't get into the house</summary>
The window behind the house is slightly ajar. Windows do not normally have motives. This one does.
</details>
<details><summary>The troll keeps killing me</summary>
Bring the sword from the living room and click the prompts <em>before the ring runs out</em>.
</details>
<details><summary>The Loud Room is too loud to take the bar</summary>
The light itself echoes. Silence is dark. Be quick — something in there is patient, but not infinitely.
</details>
<details><summary>The Cyclops won't move</summary>
He fears exactly one piece of literature. Something in the maze has been doing the assigned reading.
</details>
<details><summary>The egg is too high</summary>
Climbing with ambition alone is fatal (ask us how we know). The attic has better climbing tools.
</details>

## Tests

```bash
npm test         # engine unit tests (vitest)
npm run e2e      # full browser playthrough (Playwright + Chrome)
```

## Project layout

- `src/game/` — pure game logic (engine + content), no DOM/Three dependencies
- `src/render/` — Three.js: toon materials, procedural props, room dioramas, player
- `src/ui/` — HUD: narrator, verb coin, inventory, combat QTE, death vignette
- `src/audio/` — procedural WebAudio (no audio assets)
- `tests/`, `e2e/` — vitest unit suite + Playwright end-to-end suite
