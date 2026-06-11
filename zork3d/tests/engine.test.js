import { describe, it, expect, beforeEach } from 'vitest';
import { ZorkEngine } from '../src/game/engine.js';
import { ROOMS, TREASURES, MAX_SCORE, PITY_FUEL } from '../src/game/content.js';

let g;
beforeEach(() => { g = new ZorkEngine(); g.begin(); g.drainEvents(); });

const texts = () => g.drainEvents().filter((e) => e.type === 'narrate').map((e) => e.text).join('\n');

// Helper: play through to a given milestone.
function enterHouse() {
  g.move('north'); g.move('east'); // -> east_of_house
  g.useObject('window');
  g.move('west'); // -> kitchen
}
function gearUp() {
  enterHouse();
  g.move('west'); // living room
  g.take('brass_lantern');
  g.take('elvish_sword');
}
function openCellar() {
  g.useObject('oriental_rug');
  g.useObject('trap_door');
}
function goCellar() {
  gearUp(); openCellar();
  g.toggleLamp();
  g.move('down');
}
function winCombat() {
  // strike, dodge, strike, dodge, strike -> troll dead (3 hits)
  g.combatPress(); g.combatPress(); g.combatPress(); g.combatPress(); g.combatPress();
}
function defeatTroll() {
  goCellar();
  g.move('north');
  g.attack('troll');
  winCombat();
}

describe('world data integrity', () => {
  it('every exit target is a real room', () => {
    for (const [id, room] of Object.entries(ROOMS)) {
      for (const [dir, exit] of Object.entries(room.exits)) {
        const target = typeof exit === 'string' ? exit : exit.target;
        expect(ROOMS[target], `${id} ${dir} -> ${target}`).toBeDefined();
      }
    }
  });
  it('treasure values sum within max score', () => {
    const sum = Object.values(TREASURES).reduce((a, b) => a + b, 0);
    expect(sum).toBeLessThanOrEqual(MAX_SCORE);
  });
});

describe('movement & blocked exits', () => {
  it('moves between rooms', () => {
    expect(g.move('north').ok).toBe(true);
    expect(g.state.room).toBe('north_of_house');
  });
  it('rejects nonexistent exits', () => {
    expect(g.move('east').ok).toBe(false); // west_of_house has no east exit
    expect(texts()).toContain('can’t go');
  });
  it('blocks kitchen window until opened, then allows', () => {
    g.move('north'); g.move('east'); g.drainEvents();
    expect(g.move('west').ok).toBe(false);
    expect(texts()).toContain('window is closed');
    g.useObject('window');
    expect(g.move('west').ok).toBe(true);
    expect(g.state.room).toBe('kitchen');
  });
  it('forest loop exits narrate and consume a turn but keep you in place', () => {
    g.move('west');
    const t0 = g.state.turns;
    const r = g.move('north');
    expect(r.looped).toBe(true);
    expect(g.state.room).toBe('forest_path');
    expect(g.state.turns).toBe(t0 + 1);
  });
});

describe('mailbox & leaflet', () => {
  it('mailbox yields the leaflet exactly once', () => {
    g.useObject('mailbox');
    expect(g.has('leaflet')).toBe(true);
    const n = g.state.inventory.length;
    g.useObject('mailbox');
    expect(g.state.inventory.length).toBe(n);
  });
});

describe('living room puzzles', () => {
  it('rug reveals trap door; trap door opens cellar', () => {
    gearUp(); g.drainEvents();
    expect(g.move('down').ok).toBe(false); // rug not moved
    g.useObject('oriental_rug');
    expect(g.flag('rug_moved')).toBe(true);
    expect(g.move('down').ok).toBe(false); // trap door closed
    g.useObject('trap_door');
    expect(g.move('down').ok).toBe(true);
    expect(g.state.room).toBe('cellar');
  });
  it('trap door appears in visibleObjects only after rug moved', () => {
    gearUp();
    expect(g.visibleObjects().some((o) => o.id === 'trap_door')).toBe(false);
    g.useObject('oriental_rug');
    expect(g.visibleObjects().some((o) => o.id === 'trap_door')).toBe(true);
  });
});

describe('lamp, darkness, and the grue', () => {
  it('dark room without light warns then kills after grace turns', () => {
    gearUp(); openCellar();
    g.move('down'); // into the dark cellar, lamp off
    let evs = g.drainEvents();
    expect(evs.some((e) => e.type === 'darkness')).toBe(true);
    g.move('north'); // 2nd dark turn: grue lurks
    evs = g.drainEvents();
    expect(evs.some((e) => e.text?.includes('breathing'))).toBe(true);
    g.move('south'); // 3rd dark turn: eaten
    evs = g.drainEvents();
    const death = evs.find((e) => e.type === 'death');
    expect(death?.id).toBe('grue');
  });
  it('lamp consumes fuel per turn and dies at zero', () => {
    gearUp();
    g.toggleLamp();
    const f0 = g.state.lampFuel;
    g.move('east'); g.move('west');
    expect(g.state.lampFuel).toBe(f0 - 2);
    g.state.lampFuel = 1;
    g.move('east');
    expect(g.state.lampOn).toBe(false);
    expect(g.lampStage()).toBe('dead');
  });
  it('grim rewind restores pre-death state, keeps death gallery, grants pity fuel', () => {
    goCellar(); // lamp on, in cellar
    g.state.lampFuel = 3;
    g.move('north'); g.drainEvents(); // snapshot taken at troll_room entry
    g.toggleLamp(); // lights off in dark room (turn 1)
    g.move('south'); // turn 2
    g.move('north'); // turn 3 -> grue
    const death = g.drainEvents().find((e) => e.type === 'death');
    expect(death?.id).toBe('grue');
    expect(g.state.mode).toBe('dead');
    g.grimRewind();
    expect(g.state.mode).toBe('play');
    expect(g.state.deaths).toContain('grue');
    expect(g.state.deathCount).toBe(1);
    expect(g.state.lampFuel).toBeGreaterThanOrEqual(PITY_FUEL);
  });
});

describe('troll combat', () => {
  it('cannot pass troll before defeat; attacking unarmed is mocked', () => {
    goCellar(); g.move('north'); g.drainEvents();
    expect(g.move('east').ok).toBe(false);
    expect(texts()).toContain('menacing troll');
    g.state.inventory = g.state.inventory.filter((i) => i !== 'elvish_sword');
    g.attack('troll');
    expect(g.state.mode).toBe('play'); // no combat without weapon
    expect(texts()).toContain('bare hands');
  });
  it('winning combat clears the passage and scores', () => {
    defeatTroll();
    expect(g.flag('troll_defeated')).toBe(true);
    expect(g.state.mode).toBe('play');
    expect(g.state.score).toBeGreaterThanOrEqual(25);
    expect(g.move('east').ok).toBe(true);
    expect(g.state.room).toBe('maze_entrance');
  });
  it('three failed dodges = death by troll', () => {
    goCellar(); g.move('north');
    g.attack('troll');
    // round1 strike: timeout (miss), round2 dodge: timeout (hit), repeat
    g.combatTimeout(); g.combatTimeout(); // miss, hit (hp2)
    g.combatTimeout(); g.combatTimeout(); // miss, hit (hp1)
    g.combatTimeout(); g.combatTimeout(); // miss, hit (hp0) -> dead
    const death = g.drainEvents().find((e) => e.type === 'death');
    expect(death?.id).toBe('troll');
    g.grimRewind();
    expect(g.state.room).toBe('troll_room'); // snapshot from combat start
    expect(g.flag('troll_defeated')).toBe(false);
  });
  it('running out of rounds loses the fight', () => {
    goCellar(); g.move('north');
    g.attack('troll');
    for (let i = 0; i < 9; i++) {
      if (g.state.mode !== 'combat') break;
      if (g.state.combat.phase === 'strike') g.combatTimeout(); // always miss
      else g.combatPress(); // always dodge successfully
    }
    expect(g.drainEvents().some((e) => e.type === 'death')).toBe(true);
  });
});

describe('forest & the egg', () => {
  it('climbing without rope is fatal; with rope yields the egg', () => {
    g.move('west'); g.drainEvents();
    g.useObject('great_tree');
    const death = g.drainEvents().find((e) => e.type === 'death');
    expect(death?.id).toBe('fall');
    g.grimRewind();
    expect(g.state.room).toBe('forest_path');
    g.state.inventory.push('rope');
    g.useItemOn('rope', 'great_tree');
    expect(g.has('jewel_encrusted_egg')).toBe(true);
    // idempotent
    g.useItemOn('rope', 'great_tree');
    expect(g.state.inventory.filter((i) => i === 'jewel_encrusted_egg').length).toBe(1);
  });
});

describe('loud room puzzle', () => {
  function toLoudRoom() {
    defeatTroll();
    g.move('east'); // maze_entrance
    g.move('east'); // maze_3
    g.move('north'); // round_room
    g.move('west'); // loud_room
  }
  it('cannot take the bar with light on', () => {
    toLoudRoom(); g.drainEvents();
    expect(g.take('platinum_bar').ok).toBe(false);
    expect(texts()).toContain('ERUPTS');
    expect(g.has('platinum_bar')).toBe(false);
  });
  it('taking the bar in darkness works but starts the grue clock', () => {
    toLoudRoom();
    g.toggleLamp(); // darkness turn 1: warning
    g.drainEvents();
    expect(g.take('platinum_bar').ok).toBe(true);
    expect(g.has('platinum_bar')).toBe(true);
    g.toggleLamp(); // light back on, safe
    expect(g.state.darknessTurns).toBe(0);
  });
  it('lingering in the dark loud room gets you eaten', () => {
    toLoudRoom();
    g.toggleLamp();
    g.take('platinum_bar');
    g.lookAt('platinum_bar'); // free action, no turn
    g.move('east'); // darkness turn 3 -> grue takes you mid-flight
    const death = g.drainEvents().find((e) => e.type === 'death');
    expect(death?.id).toBe('grue');
  });
});

describe('cyclops', () => {
  function toCyclops() {
    defeatTroll();
    g.move('east'); g.move('east'); g.move('north'); // round room
    g.move('north'); // cyclops_room
  }
  it('blocks the stairs; sword is a toothpick; page sends it fleeing', () => {
    toCyclops(); g.drainEvents();
    expect(g.move('up').ok).toBe(false);
    g.useItemOn('elvish_sword', 'cyclops');
    expect(texts()).toContain('toothpick');
    g.state.inventory.push('tattered_page');
    g.useItemOn('tattered_page', 'cyclops');
    expect(g.flag('cyclops_fled')).toBe(true);
    expect(texts()).toContain('ODYSSEUS');
    expect(g.move('up').ok).toBe(true);
    expect(g.state.room).toBe('treasure_room');
  });
  it('warns on first attack, kills on second', () => {
    toCyclops(); g.drainEvents();
    g.attack('cyclops');
    expect(texts()).toContain('will not be a second warning');
    expect(g.state.mode).toBe('play');
    g.attack('cyclops');
    const death = g.drainEvents().find((e) => e.type === 'death');
    expect(death?.id).toBe('cyclops');
  });
  it('fleeing opens the shortcut hole to the living room', () => {
    toCyclops();
    g.state.inventory.push('tattered_page');
    g.useItemOn('tattered_page', 'cyclops');
    expect(g.move('east').ok).toBe(true);
    expect(g.state.room).toBe('living_room');
    expect(g.move('west').ok).toBe(true); // and back through the hole
    expect(g.state.room).toBe('cyclops_room');
  });
  it('hole is invisible before the cyclops flees', () => {
    gearUp(); g.drainEvents();
    expect(g.move('west').ok).toBe(false); // living room west wall intact
    expect(Object.keys(g.exits())).not.toContain('west');
  });
});

describe('treasures, scoring, and winning', () => {
  it('full playthrough: all five treasures -> win', () => {
    // Gear up + rope first
    enterHouse();
    g.move('up'); // attic is dark... but lamp not held yet!
    // attic is dark: we entered without light. Back out before the grue clock runs out.
    g.move('down');
    g.move('west'); // living room
    g.take('brass_lantern'); g.take('elvish_sword');
    g.toggleLamp();
    g.move('east'); g.move('up'); // attic, lit
    g.take('rope'); g.take('nasty_knife');
    g.move('down'); g.move('west'); // back to living room
    openCellar();
    // Egg from the forest
    g.move('east'); // kitchen
    g.move('east'); // behind house
    g.move('north'); g.move('west'); g.move('west'); // forest_path
    g.useItemOn('rope', 'great_tree');
    expect(g.has('jewel_encrusted_egg')).toBe(true);
    // Underground
    g.move('east'); g.move('north'); g.move('east'); // -> east_of_house? (forest->west_of_house->north_of_house->east_of_house)
    g.move('west'); // kitchen
    g.move('west'); // living room
    g.move('down'); // cellar
    g.move('east'); // gallery
    g.take('painting');
    g.move('west'); g.move('north'); // troll room
    g.attack('troll'); winCombat();
    g.move('east'); // maze entrance
    g.move('north'); // maze_2: coins
    g.take('bag_of_coins');
    g.move('south'); g.move('south'); // dead end: the page
    g.take('tattered_page');
    g.move('south'); // back to entrance
    g.move('east'); g.move('north'); // maze_3 -> round room
    g.move('west'); // loud room
    g.toggleLamp();
    g.take('platinum_bar');
    g.toggleLamp();
    g.move('east'); // round room
    g.move('north'); // cyclops
    g.useItemOn('tattered_page', 'cyclops');
    g.move('up'); // treasure room
    g.take('silver_chalice');
    g.take('torch');
    g.move('down');
    g.move('east'); // through the cyclops hole straight to the living room!
    expect(g.state.room).toBe('living_room');
    g.useObject('trophy_case'); // places all five
    expect(g.state.treasuresPlaced.length).toBe(5);
    expect(g.state.mode).toBe('won');
    const win = g.drainEvents().find((e) => e.type === 'gameWon');
    expect(win).toBeDefined();
    expect(win.score).toBe(MAX_SCORE);
    expect(g.rank()).toBe('Greatest Underground Adventurer');
  });
  it('non-treasures are refused by the case', () => {
    gearUp();
    g.useObject('mailbox');
    g.drainEvents();
    g.useItemOn('leaflet', 'trophy_case');
    expect(texts()).toContain('whatever that is');
    expect(g.has('leaflet')).toBe(true);
  });
});

describe('save / load', () => {
  it('round-trips full state', () => {
    defeatTroll();
    g.move('east');
    const json = g.save();
    const g2 = new ZorkEngine();
    expect(g2.load(json)).toBe(true);
    expect(g2.state.room).toBe('maze_entrance');
    expect(g2.flag('troll_defeated')).toBe(true);
    expect(g2.state.score).toBe(g.state.score);
    expect(g2.has('brass_lantern')).toBe(true);
  });
  it('rejects garbage', () => {
    expect(new ZorkEngine().load('{"v":99}')).toBe(false);
    expect(new ZorkEngine().load('not json')).toBe(false);
  });
});

describe('narrator flavor', () => {
  it('idle pokes cycle without repeating immediately', () => {
    g.idlePoke();
    const a = texts();
    g.idlePoke();
    const b = texts();
    expect(a).not.toBe(b);
  });
  it('looking at items gives their description', () => {
    g.useObject('mailbox'); g.drainEvents();
    g.lookAt('leaflet');
    expect(texts()).toContain('WELCOME TO ZORK');
  });
});
