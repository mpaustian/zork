# PRD: Zork I — Graphical Adventure Adaptation

## Context

Zork I: The Great Underground Empire (1980) is one of the most influential text adventures ever made. This PRD defines a graphical adventure game adaptation that uses Zork's world, characters, and puzzles as a creative foundation — not a rigid blueprint. The game is free and open source, built in Godot for cross-platform distribution.

The goal is a game that stands on its own. Zork's DNA is in everything — the locations, the tone, the Grue, the thief — but the graphical medium opens doors the text parser never could. We have freedom to add new rooms, rework puzzles that don't translate well to visual play, expand characters, and introduce new mechanics. The north star is: **would this be fun to play even if you'd never heard of Zork?** If yes, and it still feels like Zork, we're on track.

### Adaptation Philosophy
- **Preserve the soul:** The darkly comedic tone, the sense of exploring a vast underground empire, the resource tension of the lamp, the cat-and-mouse with the thief, the satisfaction of hoarding treasures. These are non-negotiable.
- **Evolve what needs evolving:** Some text puzzles are arbitrary ("guess the verb"). Redesign them with visual logic. Some rooms exist only as connector nodes — combine or enrich them. The maze can be trimmed if 15 identical rooms isn't fun in a visual medium.
- **Add where it serves the game:** New rooms, expanded NPC interactions, environmental storytelling, side discoveries, visual gags. The Great Underground Empire should feel *bigger* and more alive than the original.
- **Cut what doesn't work:** If a puzzle is unfun or obscure even with visual cues, replace it with something better that serves the same narrative purpose.

---

## 1. Game Identity

### Title (Working)
**Zork I: The Great Underground Empire — A Graphical Reimagining**
*(Final title TBD — could be something cheeky like "Return to the Great Underground Empire" or "Zork: Unseen" or "Zork: Into the Dark")*

### Elevator Pitch
A darkly comedic point-and-click adventure set in the Great Underground Empire. Inspired by the legendary text adventure, rebuilt from the ground up for a visual medium with new surprises, expanded lore, and a snarky narrator who never lets you forget how many ways you can die underground. Veteran Zork players will feel at home — and still be surprised.

### Tone & Personality
- **Darkly comedic.** The Great Underground Empire is menacing, absurd, and funny in equal measure. The Grue is genuinely terrifying. The narrator is genuinely annoying. Dying is genuinely hilarious.
- Think: *Monkey Island*'s wit meets *Darkest Dungeon*'s atmosphere, filtered through Zork's deadpan absurdism.
- The narrator is a character — sardonic, judgmental, occasionally helpful, always watching. They comment on failed interactions, mock poor decisions, and deliver death scenes with relish.

---

## 2. Art Direction

### Style: Modern Pixel Art
- **Resolution:** 640x360 native, scaled up. Clean pixel art with deliberate aesthetic choices — not retro for retro's sake.
- **Color palette:** Rich but controlled. Each area has a distinct palette identity:
  - **Above ground:** Warm greens, golden light, blue sky. Peaceful, inviting.
  - **Underground general:** Cool blues, grays, deep purples. Mysterious.
  - **Dam & river:** Steel grays, rushing blue-whites, industrial tones.
  - **Egypt/Temple:** Warm golds, sandstone, flickering torch orange.
  - **Coal mine:** Near-black with harsh lamplight cutting through dust.
  - **Hades:** Sickly greens, bone whites, unnatural glow.
  - **Maze:** Deliberately samey browns/grays — the visual monotony IS the puzzle.
- **Lighting is a first-class system.** The lamp and torch cast dynamic light. Shadows move. The edges of every underground room fade to black — that's where the Grue lives. When your lamp dims, the world literally shrinks around you.
- **Character design:** The adventurer is a slightly hapless, wide-eyed explorer. Exaggerated proportions (big head, expressive eyes). Animations should be snappy and characterful — a stumble when entering a dark room, a flinch when the Grue growls.

### Key Visual Setpieces
Each of these rooms should be a visual showpiece that rewards the player for reaching them:
1. **The White House** — The iconic opening. Afternoon light, a boarded front door, a mailbox. Simple but perfect.
2. **Flood Control Dam #3** — Massive brutalist dam stretching across the screen. Industrial catwalks, churning water below.
3. **The Crystal Grotto / Dome Room** — Glittering crystal formations, prismatic light reflections.
4. **The Egyptian Room** — Ancient tomb aesthetic with hieroglyphics that hint at puzzle solutions.
5. **The Temple & Altar** — Soaring underground cathedral carved from living rock.
6. **Aragain Falls** — The underground river plunging into mist. Rainbow visible when conditions are right.
7. **The Coal Mine** — Claustrophobic tunnels, timber supports, your lamp the only light.
8. **Entrance to Hades** — The game's darkest room. Spirits, bone, unnatural cold.
9. **The Treasure Room** — The payoff. A glittering hoard behind the Cyclops's lair.

---

## 3. Gameplay Systems

### 3.1 Point-and-Click Interface

**Interaction model:** Verb coin / radial menu on right-click (or long-press on touch). Verbs:
- **Look** (eye icon) — Triggers narrator description. Every object has flavor text.
- **Use / Take** (hand icon) — Pick up items, operate mechanisms, open doors.
- **Talk** (speech bubble) — For the rare NPC interactions (Cyclops taunting, Thief gloating).
- **Attack** (sword icon) — Context-sensitive combat for Troll, Thief encounters.

**Left-click:** Walk to location. Pathfinding handles navigation within a room.

**Inventory:** Bottom-of-screen tray, scrollable. Drag items onto the world or onto each other to combine/use. Weight limit visualized as a backpack capacity meter (Zork's original 100-unit weight system, abstracted visually).

### 3.2 Room Navigation

- **Flip-screen rooms** like classic Sierra/LucasArts. Each of Zork's ~92 rooms is a hand-crafted screen.
- **Exit hotspots** glow subtly when the cursor is near them. Directional arrows appear at screen edges.
- **Room transitions:** Quick crossfade with a brief walking animation. No loading screens.
- **Automap:** An in-game parchment map that fills in as the player explores. Critical for the Maze — but the maze map deliberately shows rooms that look identical, preserving the puzzle.

### 3.3 The Narrator

The narrator is the game's secret weapon — the voice of the original text adventure, transplanted into a visual world.

- **Narrator text box:** Appears at top of screen in a stylized parchment/terminal aesthetic. Typewriter text effect.
- **Triggers:**
  - Examining any object ("It's a nasty-looking knife. You consider your life choices.")
  - Failed puzzle attempts ("You try to open the door with the egg. The door is unimpressed.")
  - Entering new rooms (abbreviated descriptions — the visuals do the heavy lifting now)
  - Death scenes (elaborate, purple prose)
  - Idle too long ("The adventurer stands motionless. The Grue considers this an invitation.")
- **Narrator personality:** Draws directly from Zork's original text. Dry, slightly condescending, occasionally poetic. Never breaks the fourth wall too hard — this isn't Deadpool. The humor comes from taking absurd situations completely seriously.

### 3.4 Death & Failure System

**"The Grim Rewind"**
- When the player dies, the screen goes to a stylized death scene — a unique pixel art vignette for each death type:
  - **Grue death:** Screen goes black. Two glowing eyes appear. Crunching sounds. The narrator delivers a eulogy.
  - **Troll death:** Slow-mo axe swing. Comically exaggerated impact.
  - **Thief death:** The thief bows after stabbing you, tips his hat, steals your corpse's wallet.
  - **Drowning:** Bubbles. Peaceful. The narrator notes it's "not the worst way to go, all things considered."
  - **Falls:** Long scream, distant thud, narrator counts the seconds.
- After the death vignette (3-5 seconds), the game rewinds with a VHS-rewind visual effect to the moment just before the fatal action.
- **No progress lost. Ever.** Death is entertainment, not punishment.
- A "Death Gallery" in the menu collects all unique deaths the player has witnessed. Completionists will seek them out.

### 3.5 Light & Darkness

The lamp battery is Zork's original time-pressure mechanic and it's preserved here as a core system:

- **Brass lantern:** ~400 turns of light. Visually dims in stages (bright → warm → flickering → sputtering → dark).
- **Torch:** Found in the coal mine area. Infinite light, but must be obtained before the lamp dies.
- **Darkness:** When light fails, the screen goes almost completely black. The player can still see a tiny circle around themselves — enough to stumble one room. Grue growls echo. Stay more than one turn and it's death-vignette time.
- **This is the game's central tension arc.** The lamp is ticking down. The player must balance exploration against the need to find the torch. The visual dimming creates genuine atmospheric dread.

### 3.6 Combat

Zork's combat is simple and the graphical version keeps it simple:

- **Troll encounter:** Short animated sequence. Player chooses attack/dodge timing with simple click prompts. Not a full combat system — more of a QTE-lite interactive cutscene. Can also be bypassed by puzzle solutions.
- **Thief encounters:** The thief appears randomly, steals items, and can be fought. Same QTE-lite system but harder. The thief is fast, evasive, and taunts you.
- **Cyclops:** Cannot be defeated by combat (strength 10000 in original). Must be solved as a puzzle (saying "ODYSSEUS" / "ULYSSES" — adapted as finding and showing a specific item or triggering dialogue).

### 3.7 The Thief (Roaming NPC)

The thief is Zork's most dynamic element and deserves special treatment:

- **Visually:** A shadowy figure in a cloak. You occasionally see him darting at the edge of a room before he appears. His eyes glint in darkness.
- **Behavior:** Appears semi-randomly in underground rooms. Steals carried treasures. Hides them in his lair (Treasure Room).
- **Visual tells:** Rooms the thief has visited show subtle disturbance — knocked-over objects, footprints in dust.
- **Endgame:** Must be defeated to recover stolen treasures and access the final area.

---

## 4. Content: Rooms, Puzzles & Progression

### Design Freedom Guidelines

The original game has 92 rooms, 26 puzzles, and 17 treasures. These are the *starting ingredients*, not a checklist. During development:

- **Rooms can be merged, split, added, or cut.** A text-only connector room ("You are in a narrow passage") might become part of an adjacent room, while a rich room ("The Egyptian Room") might expand into multiple screens with deeper environmental storytelling.
- **Puzzles should be redesigned for visual logic.** "Guess the right word to type" becomes "notice the visual clue, find the right item, use it in the right place." Some original puzzles are great and just need visual cues. Others need total rethinking.
- **New content is encouraged.** Optional side rooms with lore, environmental gags, hidden narrator commentary, visual easter eggs, expanded NPC encounters. The underground should feel like it has secrets the original never had room to express.
- **The maze should be fun, not tedious.** Trim to 6-8 rooms max. Make the visual sameness deliberate and unsettling rather than just frustrating. Consider subtle visual tells (scratch marks, slightly different stone patterns) that reward careful observation.

### 4.1 World Structure (7 major areas, room count flexible)

**Area 1: Above Ground (13 rooms)**
- West of House, North/South/East of House, Forest paths, Clearing, Canyon, Stone Barrow
- Purpose: Tutorial area. Establish tone, find the way in.

**Area 2: The House (3 rooms)**
- Kitchen, Living Room, Attic
- Purpose: First items (lamp, sword, knife). Discover the trap door.

**Area 3: Underground Core (Cellar → Troll → Maze) (flexible, ~15-20 rooms)**
- Cellar, Troll Room, the Maze (trimmed to ~6-8 rooms), Dead ends
- Purpose: First major challenge. Troll combat gate, maze navigation puzzle.
- *Adaptation opportunity:* Maze rooms could have subtle environmental differences (claw marks, bone piles, different drip sounds) that reward careful players. Add a Grue near-miss encounter in the maze to establish that threat early.

**Area 4: The Dam & River (~19 rooms)**
- Flood Control Dam, Maintenance Room, Reservoir, River (5 boat rooms), Aragain Falls, Rainbow Room
- Purpose: Multi-step mechanical puzzles. Dam controls, boat navigation, rainbow treasure.

**Area 5: Temple, Egypt & Hades (~7 rooms)**
- Temple, Egyptian Room, Altar, Entrance to Hades, Land of the Dead
- Purpose: Atmospheric puzzle area. Bell/book/candle puzzle for Hades access.

**Area 6: Round Room, Mirror Rooms & Cyclops (~14 rooms)**
- Round Room hub, Mirror Rooms (North/South), Cyclops Room, Treasure Room, Strange Passage
- Purpose: Late-game exploration hub. Cyclops puzzle gates the trophy case shortcut.

**Area 7: Coal Mine (~11 rooms)**
- Shaft, Timber rooms, Drafty Room, Gas Room, Coal Mine, Machine Room
- Purpose: The torch (critical item). Gas/explosion puzzle. Claustrophobic atmosphere.

### 4.2 Major Puzzles (Adapted & Evolved for Graphical Play)

The original's 26 puzzles serve as the foundation. Some translate directly with visual cues. Others need reworking or replacement. New puzzles can be added where the visual medium enables something the text couldn't do. The table below shows the original puzzles with adaptation notes — during development, any puzzle that isn't fun should be reworked or replaced with something that serves the same gating purpose:

| # | Puzzle | Original Solution | Graphical Adaptation |
|---|--------|-------------------|----------------------|
| 1 | Enter the house | Open window | Window visually ajar, curtains blowing. Click to open. |
| 2 | Find the cellar | Move rug, open trap door | Rug has visible lump/outline. Drag to reveal door. |
| 3 | Defeat the troll | Combat with sword | QTE-lite combat sequence. Sword glows near troll. |
| 4 | Navigate the maze | Drop items to mark rooms | Rooms look identical. Inventory items visible on floor when dropped. |
| 5 | Operate the dam | Push/turn controls in Maintenance Room | Interactive control panel with labeled buttons/levers. |
| 6 | Cross the river | Inflate raft with pump, board, navigate | Deflated raft visible on shore. Pump in inventory. River current animated. |
| 7 | Access the rainbow | Wave sceptre at rainbow | Rainbow shimmers near Aragain Falls. Sceptre glows when held near it. |
| 8 | Enter Hades | Ring bell, read book, light candles at altar | Items glow/pulse when in correct location. Ghosts visibly react to each step. |
| 9 | Defeat the Cyclops | Say "Odysseus" | Adapted: find a scroll/book referencing Odysseus, show it to Cyclops. He flees. |
| 10 | Get the torch | Navigate coal mine, use machine | Machine has visible coal input, torch output. Environmental puzzle cues. |
| 11 | Avoid gas explosion | Don't use lamp in gas room (use torch) | Gas visually seeps, lamp flame flickers dangerously. Visual warning. |
| 12 | Retrieve the egg | Climb the tree, find nest | Tree visually climbable (branches as platforms). Egg visible in canopy. |
| 13 | Open the egg | Give to thief (he opens it) or use tools | Egg has visible seam. Thief examines it with interest if you're carrying it. |
| 14 | Get the gold coffin | Navigate Egyptian room | Coffin prominent in room. Weight is the challenge (shown via inventory meter). |
| 15 | Defeat the thief | Combat in Treasure Room | Final confrontation. Multi-stage QTE. His stolen goods scatter when defeated. |

### 4.3 Scoring & Progression

- **Treasures** as the core collectible (original has 17, we can add more or adjust). Trophy Case in the Living Room remains the central scoring mechanic.
- Placing treasures triggers a satisfying animation + narrator acknowledgment. Each treasure could have a unique placement animation.
- **Rank titles** displayed on the automap: Beginner → Amateur → Seasoned → Junior → Master Adventurer.
- **Completion:** All treasures in case → endgame sequence. The narrator breaks composure for the first and only time to congratulate the player.
- *Adaptation opportunity:* Consider optional "discovery" achievements beyond treasures — finding hidden rooms, triggering all narrator easter eggs, collecting all deaths in the Death Gallery. These reward thorough exploration without gating progression.

---

## 5. Audio Direction

### Sound Design: Ambient + Minimal

- **No continuous background music in most rooms.** The underground is quiet. Oppressively quiet.
- **Environmental audio is king:**
  - Dripping water echoing in stone chambers
  - Distant rumbles in deep areas
  - River rushing near dam rooms
  - Wind howling through the coal mine shaft
  - Your own footsteps changing based on surface (stone, wood, dirt, water)
  - The lamp's faint hiss
- **The Grue:** Low growl that increases in volume as light dims. The most important sound in the game.
- **Musical stings for key moments only:**
  - Treasure discovered (triumphant 3-note motif)
  - Death (comic descending trombone + minor chord)
  - Puzzle solved (satisfying mechanical click + ascending notes)
  - Entering a new major area (brief atmospheric theme, then silence)
  - Endgame completion (the only full musical piece in the game)
- **Narrator text:** Typewriter click sounds as text appears. Subtle but satisfying.

---

## 6. Technical Architecture

### Engine: Godot 4.x (GDScript)

**Why Godot:**
- Free and open source (matches project ethos)
- Excellent 2D support with built-in lighting system
- Exports to Windows, Mac, Linux, and HTML5 (web)
- Active community, well-documented
- GDScript is accessible for contributors

### Core Systems

```
├── Room System
│   ├── Room scenes (92 .tscn files, one per room)
│   ├── Room manager (transitions, state tracking)
│   └── Automap generator
├── Interaction System
│   ├── Verb coin UI
│   ├── Hotspot detection (clickable areas per room)
│   ├── Inventory manager (items, weight, drag-and-drop)
│   └── Puzzle state machine
├── Narrator System
│   ├── Text database (all narrator lines, keyed by trigger)
│   ├── Typewriter text renderer
│   └── Trigger system (room enter, item use, idle, death)
├── NPC System
│   ├── Thief AI (roaming, stealing, combat)
│   ├── Troll (stationary, combat)
│   ├── Cyclops (stationary, puzzle)
│   └── Grue (darkness detector, death trigger)
├── Lighting System
│   ├── Lamp state machine (bright→dim→flicker→dead)
│   ├── Torch (infinite light)
│   ├── Per-room ambient lighting
│   └── Darkness overlay + Grue system
├── Death System
│   ├── Death vignette scenes (one per death type)
│   ├── Rewind effect
│   ├── Auto-save (pre-death state)
│   └── Death gallery tracker
├── Audio System
│   ├── Ambient sound per room
│   ├── Footstep surface detection
│   ├── Musical stings (event-triggered)
│   └── Grue growl (proximity/light-based volume)
└── Save System
    ├── Auto-save on room transitions
    ├── Manual save slots
    └── Game state serialization
```

### Data-Driven Design
- Room connections, item properties, puzzle states, and narrator text stored in resource files (JSON or Godot resources), not hardcoded.
- This makes the game moddable and content easily auditable.

### Export Targets
1. **Desktop (primary):** Windows, macOS, Linux
2. **Web (secondary):** HTML5 via Godot's web export
3. **Distribution:** itch.io (primary), GitHub releases, potentially Steam (free)

---

## 7. UX & Accessibility

- **Hint system:** Optional. The narrator can be asked for hints ("I notice you've been staring at that door for a while..."). Three tiers: vague nudge → moderate hint → explicit solution. Opt-in only.
- **Automap:** Fills in as rooms are discovered. Shows connections, locked doors, item locations.
- **Hotspot highlight:** Press a key (Tab/Space) to briefly highlight all clickable objects in the current room. Prevents pixel-hunting frustration.
- **Text size options:** Narrator text scalable for readability.
- **Colorblind modes:** Palette adjustments for common types of color vision deficiency.
- **Control options:** Full keyboard navigation as alternative to mouse. Gamepad support.

---

## 8. Scope & Milestones

### Phase 1: Vertical Slice (Core proof of concept)
- 10 rooms: White House → Kitchen → Living Room → Cellar → Troll Room → 3 Maze rooms → Round Room → Treasure Room
- Core systems: point-and-click, inventory, narrator, lighting, one combat (troll), one death (grue)
- Art: 10 room backgrounds, player character, troll, basic UI

### Phase 2: Full Underground
- All 92 rooms with art and connections
- All puzzles implemented
- Thief AI, Cyclops, all NPCs
- Complete narrator text
- Full audio pass

### Phase 3: Polish & Release
- Death gallery, hint system, automap
- Accessibility features
- Playtesting and puzzle balancing
- Web export
- Distribution setup (itch.io, GitHub)

---

## 9. Verification Plan

- **Completability test:** Play from start to 350 points with all puzzles solvable
- **Death coverage:** Trigger every death type, verify rewind works correctly
- **Lamp timer:** Verify the torch can be obtained before the lamp dies on a reasonable playthrough
- **Thief behavior:** Verify thief steals/hides items correctly, can be defeated, stolen items recoverable
- **All rooms reachable:** Walk every connection in the automap
- **Web export:** Verify HTML5 build runs in Chrome, Firefox, Safari
- **Accessibility:** Verify hint system, hotspot highlighting, keyboard navigation all functional

---

## 10. Open Questions

1. **Licensing:** Microsoft open-sourced Zork 1, 2, and 3 (the source code is on GitHub at historicalsource/zork1). Verify the specific license terms to confirm graphical adaptations are covered, but this largely clears the IP concern. The Zork trademark may still require care in titling/marketing.
2. **Narrator text volume:** The original game has hundreds of unique text responses. How much do we write for v1 vs. expand post-launch?
3. **New content scope:** How many new rooms/puzzles/NPCs do we add in v1 vs. saving expansion for post-launch? Need to balance creative ambition with shipping.
4. **Modding support:** Given the open-source nature, should we invest in formal modding tools (room editor, narrator text editor) in Phase 3?
5. **Thief expansion:** The thief is Zork's most dynamic character. Should we expand him into a richer antagonist with more personality, dialogue, and a storyline arc? Could make the endgame confrontation more satisfying.
