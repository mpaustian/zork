// Pure game engine. No DOM, no Three.js — fully unit-testable.
// Emits events into a queue that the presentation layer drains.

import {
  ROOMS, ITEMS, SCENERY, TEXT, DEATHS, TREASURES, EVENT_SCORES, RANKS,
  MAX_SCORE, MAX_LAMP_FUEL, LAMP_THRESHOLDS, GRUE_GRACE_TURNS, PITY_FUEL,
  IDLE_LINES, fmt,
} from './content.js';

const COMBAT = { trollHp: 3, playerHp: 3, maxRounds: 8 };

export class ZorkEngine {
  constructor() {
    this.events = [];
    this.state = this._freshState();
    this._snapshot = null;
    this._idleIndex = 0;
  }

  _freshState() {
    const roomItems = {};
    for (const [id, room] of Object.entries(ROOMS)) {
      roomItems[id] = [...(room.floorItems ?? [])].filter((it) => ITEMS[it]);
    }
    return {
      room: 'west_of_house',
      mode: 'play', // play | combat | dead | won
      turns: 0,
      score: 0,
      flags: {},
      inventory: [],
      roomItems,
      treasuresPlaced: [],
      visited: {},
      lampFuel: MAX_LAMP_FUEL,
      lampOn: false,
      torchLit: false,
      darknessTurns: 0,
      deaths: [], // unique death ids collected (the Death Gallery)
      deathCount: 0,
      combat: null,
    };
  }

  // ---- events ----
  _emit(type, data = {}) { this.events.push({ type, ...data }); }
  _narrate(key, params) { this._emit('narrate', { text: fmt(key, params), key }); }
  _narrateRaw(text) { this._emit('narrate', { text }); }
  drainEvents() { const e = this.events; this.events = []; return e; }

  // ---- queries ----
  get room() { return ROOMS[this.state.room]; }
  flag(name) { return !!this.state.flags[name]; }
  setFlag(name, v = true) { this.state.flags[name] = v; }
  has(itemId) { return this.state.inventory.includes(itemId); }
  hasWeapon() { return this.has('elvish_sword') || this.has('nasty_knife'); }

  hasLight() {
    return this.state.torchLit || (this.state.lampOn && this.state.lampFuel > 0);
  }

  roomIsDark() { return !!this.room.dark; }
  inDarkness() { return this.roomIsDark() && !this.hasLight(); }

  rank() {
    let r = RANKS[0][1];
    for (const [threshold, name] of RANKS) if (this.state.score >= threshold) r = name;
    return r;
  }

  lampStage() {
    if (this.state.lampFuel <= 0) return 'dead';
    if (!this.state.lampOn) return 'off';
    const f = this.state.lampFuel;
    if (f > LAMP_THRESHOLDS.bright) return 'bright';
    if (f > LAMP_THRESHOLDS.warm) return 'warm';
    if (f > LAMP_THRESHOLDS.flicker) return 'flicker';
    return 'sputter';
  }

  lightIntensity() {
    if (this.state.torchLit) return 1.0;
    return { bright: 1.0, warm: 0.75, flicker: 0.5, sputter: 0.25 }[this.lampStage()] ?? 0;
  }

  // Visible exits for the current room (hiddenUntilFlag exits stay hidden).
  exits() {
    const out = {};
    for (const [dir, exit] of Object.entries(this.room.exits)) {
      const e = typeof exit === 'string' ? { target: exit } : exit;
      if (e.hiddenUntilFlag && !this.flag(e.hiddenUntilFlag)) continue;
      out[dir] = e;
    }
    return out;
  }

  // Objects (scenery + floor items) present in the current room right now.
  visibleObjects() {
    const objs = [];
    for (const id of this.room.objects ?? []) {
      if (id === 'troll' && this.flag('troll_defeated')) continue;
      if (id === 'cyclops' && this.flag('cyclops_fled')) continue;
      if (id === 'trap_door' && !this.flag('rug_moved')) continue;
      objs.push({ id, kind: 'scenery', name: SCENERY[id].name });
    }
    for (const id of this.state.roomItems[this.state.room] ?? []) {
      objs.push({ id, kind: 'item', name: ITEMS[id].name });
    }
    return objs;
  }

  // ---- turn engine ----
  _advanceTurn() {
    if (this.state.mode !== 'play' && this.state.mode !== 'combat') return;
    this.state.turns++;
    if (this.state.lampOn && this.state.lampFuel > 0) {
      this.state.lampFuel--;
      const stage = this.lampStage();
      if (this.state.lampFuel === LAMP_THRESHOLDS.warm) this._narrate('lamp_warm');
      else if (this.state.lampFuel === LAMP_THRESHOLDS.flicker) this._narrate('lamp_flicker');
      else if (this.state.lampFuel === 5) this._narrate('lamp_sputter');
      else if (this.state.lampFuel === 0) {
        this.state.lampOn = false;
        this._narrate('lamp_out');
      }
      this._emit('lampChanged', { fuel: this.state.lampFuel, stage: this.lampStage() });
      void stage;
    }
    this._checkDarkness();
  }

  _checkDarkness() {
    if (!this.inDarkness()) { this.state.darknessTurns = 0; return; }
    this.state.darknessTurns++;
    if (this.state.darknessTurns === 1) {
      this._emit('darkness');
      this._narrate('darkness_warning');
    } else if (this.state.darknessTurns === GRUE_GRACE_TURNS) {
      this._emit('darkness');
      this._narrate('grue_lurk');
    } else if (this.state.darknessTurns > GRUE_GRACE_TURNS) {
      this._die('grue');
    }
  }

  // ---- score ----
  _addScore(points) {
    if (points <= 0) return;
    const oldRank = this.rank();
    this.state.score = Math.min(this.state.score + points, MAX_SCORE);
    this._emit('scoreChanged', { score: this.state.score, max: MAX_SCORE });
    const newRank = this.rank();
    if (newRank !== oldRank) {
      this._emit('rankChanged', { rank: newRank });
      this._narrateRaw(`You have been promoted to: ${newRank}. The pay is the same. There is no pay.`);
    }
  }

  _scoreEvent(eventId) {
    const key = `scored_${eventId}`;
    if (this.flag(key)) return;
    this.setFlag(key);
    this._addScore(EVENT_SCORES[eventId] ?? 0);
  }

  // ---- death & the Grim Rewind ----
  takeSnapshot() { this._snapshot = JSON.parse(JSON.stringify(this.state)); }

  _die(deathId) {
    const death = DEATHS[deathId];
    this.state.mode = 'dead';
    this.state.deathCount++;
    if (!this.state.deaths.includes(deathId)) this.state.deaths.push(deathId);
    this._emit('death', { id: deathId, title: death.title, text: death.text, gallery: [...this.state.deaths] });
  }

  // Called by UI after the death vignette + VHS rewind animation finishes.
  grimRewind() {
    if (this.state.mode !== 'dead') return;
    const deaths = [...this.state.deaths];
    const deathCount = this.state.deathCount;
    if (this._snapshot) {
      this.state = JSON.parse(JSON.stringify(this._snapshot));
    } else {
      this.state = this._freshState();
    }
    this.state.deaths = deaths;
    this.state.deathCount = deathCount;
    this.state.mode = 'play';
    this.state.darknessTurns = 0;
    this.state.combat = null;
    // Pity fuel: never strand the player in an unwinnable darkness loop.
    if (this.state.lampFuel < PITY_FUEL) {
      this.state.lampFuel = PITY_FUEL;
      this._narrate('pity_fuel');
    }
    // If the snapshot itself was a dark spot, give them light to escape with.
    if (this.inDarkness() && this.has('brass_lantern') && this.state.lampFuel > 0) {
      this.state.lampOn = true;
    }
    this._emit('rewound', { room: this.state.room });
    this._emit('roomChanged', { room: this.state.room, name: this.room.name });
  }

  // ---- movement ----
  move(dir) {
    if (this.state.mode !== 'play') return { ok: false };
    const exit = this.room.exits[dir];
    if (!exit) { this._narrate('no_exit'); return { ok: false }; }
    const e = typeof exit === 'string' ? { target: exit } : exit;
    if (e.hiddenUntilFlag && !this.flag(e.hiddenUntilFlag)) {
      this._narrate('no_exit');
      return { ok: false };
    }
    if (e.requiresFlag && !this.flag(e.requiresFlag)) {
      this._narrateRaw(e.blockedMessage ?? fmt('no_exit'));
      return { ok: false };
    }
    if (e.loopMessage) {
      this._narrateRaw(e.loopMessage);
      this._advanceTurn();
      return { ok: true, looped: true };
    }
    this.takeSnapshot();
    this._enterRoom(e.target);
    return { ok: true };
  }

  _enterRoom(roomId) {
    this.state.room = roomId;
    // Note: darknessTurns deliberately does NOT reset here — running blindly
    // through dark rooms is exactly how one gets eaten by a grue.
    const room = ROOMS[roomId];
    const first = !this.state.visited[roomId];
    this.state.visited[roomId] = true;
    this._emit('roomChanged', { room: roomId, name: room.name, first });
    this._narrateRoom(roomId, first);
    if (roomId === 'cellar') this._scoreEvent('visit_cellar');
    if (roomId === 'treasure_room') this._scoreEvent('visit_treasure_room');
    this._advanceTurn();
  }

  _narrateRoom(roomId, first) {
    if (this.inDarkness()) return; // the darkness check will speak for itself
    let key = `room_${roomId}`;
    if (roomId === 'troll_room' && this.flag('troll_defeated')) key = 'room_troll_room_after';
    else if (roomId === 'cyclops_room' && this.flag('cyclops_fled')) key = 'room_cyclops_room_after';
    else if (first && TEXT[`room_${roomId}_first`]) key = `room_${roomId}_first`;
    this._narrate(key);
  }

  // Re-narrate current room (used after combat, lighting changes, etc.)
  lookAround() {
    if (this.inDarkness()) { this._narrate('darkness_warning'); return; }
    this._narrateRoom(this.state.room, false);
  }

  // ---- verbs ----
  lookAt(id) {
    if (this.state.mode !== 'play') return;
    const handlers = {
      mailbox: () => this._narrate(this.flag('mailbox_opened') ? 'look_mailbox_empty' : 'look_mailbox'),
      front_door: () => this._narrate('look_front_door'),
      white_house: () => this._narrate('look_white_house'),
      window: () => this._narrate(this.flag('window_open') ? 'look_window_open' : 'look_window_closed'),
      great_tree: () => this._narrate(this.flag('egg_taken') ? 'look_great_tree_taken' : 'look_great_tree'),
      kitchen_table: () => this._narrate('look_kitchen_table'),
      attic_table: () => this._narrate('look_attic_table'),
      trophy_case: () => {
        const n = this.state.treasuresPlaced.length;
        if (n === 0) this._narrate('look_trophy_case');
        else if (n < Object.keys(TREASURES).length) this._narrate('look_trophy_case_partial', { count: n });
        else this._narrate('look_trophy_case_full');
      },
      oriental_rug: () => this._narrate(this.flag('rug_moved') ? 'look_oriental_rug_moved' : 'look_oriental_rug'),
      trap_door: () => this._narrate(this.flag('trap_door_open') ? 'look_trap_door_open' : 'look_trap_door'),
      troll: () => this._narrate('look_troll'),
      cyclops: () => this._narrate('look_cyclops'),
      skeleton: () => this._narrate('look_skeleton'),
      claw_marks: () => this._narrate('look_claw_marks'),
      ceiling_carvings: () => this._narrate('look_ceiling_carvings'),
      treasure_heaps: () => this._narrate('look_treasure_heaps'),
    };
    if (handlers[id]) { handlers[id](); return; }
    if (ITEMS[id]) { this._narrateRaw(ITEMS[id].description); return; }
    this._narrate('use_generic');
  }

  take(id) {
    if (this.state.mode !== 'play') return { ok: false };
    const here = this.state.roomItems[this.state.room] ?? [];
    if (!here.includes(id)) {
      if (SCENERY[id]) this._narrate('cant_take');
      return { ok: false };
    }
    // Loud room: the platinum bar can only be taken in silence (= darkness).
    if (id === 'platinum_bar' && this.state.room === 'loud_room' && this.hasLight()) {
      this._narrate('take_bar_loud');
      this._advanceTurn();
      return { ok: false };
    }
    this.takeSnapshot();
    this.state.roomItems[this.state.room] = here.filter((x) => x !== id);
    this.state.inventory.push(id);
    if (id === 'platinum_bar' && this.state.room === 'loud_room') this._narrate('take_bar_quiet');
    else if (id === 'brass_lantern') this._narrate('take_lantern');
    else if (id === 'elvish_sword') this._narrate('take_sword');
    else this._narrate('take_generic');
    this._emit('itemTaken', { id });
    this._emit('inventoryChanged', { inventory: [...this.state.inventory] });
    this._advanceTurn();
    return { ok: true };
  }

  talkTo(id) {
    if (this.state.mode !== 'play') return;
    const lines = { troll: 'talk_troll', cyclops: 'talk_cyclops', skeleton: 'talk_skeleton' };
    if (lines[id]) this._narrate(lines[id]);
    else this._narrateRaw('It says nothing. The silence is judgmental.');
  }

  attack(id) {
    if (this.state.mode !== 'play') return;
    if (id === 'troll') {
      if (!this.hasWeapon()) { this._narrate('attack_troll_unarmed'); return; }
      this.startCombat();
      return;
    }
    if (id === 'cyclops') {
      if (!this.flag('cyclops_warned')) {
        this.takeSnapshot();
        this.setFlag('cyclops_warned');
        this._narrate('attack_cyclops_warning');
        this._advanceTurn();
      } else {
        this._die('cyclops');
      }
      return;
    }
    this._narrateRaw('You swing at it heroically. It is unmoved, in every sense.');
  }

  // "Use" with bare hands (open, push, operate).
  useObject(id) {
    if (this.state.mode !== 'play') return;
    switch (id) {
      case 'mailbox':
        if (this.flag('mailbox_opened')) { this._narrate('look_mailbox_empty'); return; }
        this.setFlag('mailbox_opened');
        this.state.inventory.push('leaflet');
        this._narrate('open_mailbox');
        this._emit('inventoryChanged', { inventory: [...this.state.inventory] });
        this._advanceTurn();
        return;
      case 'front_door':
        this._narrate('use_front_door');
        return;
      case 'window':
        if (this.flag('window_open')) { this._narrate('window_already_open'); return; }
        this.setFlag('window_open');
        this._narrate('window_opened');
        this._emit('worldChanged', { what: 'window_open' });
        this._advanceTurn();
        return;
      case 'great_tree':
        if (this.flag('egg_taken')) { this._narrate('look_great_tree_taken'); return; }
        if (this.has('rope')) { this._getEggWithRope(); return; }
        this.takeSnapshot();
        this._narrate('climb_tree_no_rope');
        this._die('fall');
        return;
      case 'oriental_rug':
        if (this.flag('rug_moved')) { this._narrate('rug_already_moved'); return; }
        this.setFlag('rug_moved');
        this._narrate('rug_moved');
        this._emit('worldChanged', { what: 'rug_moved' });
        this._advanceTurn();
        return;
      case 'trap_door':
        if (this.flag('trap_door_open')) { this._narrate('trap_door_already_open'); return; }
        this.setFlag('trap_door_open');
        this._narrate('trap_door_opened');
        this._emit('worldChanged', { what: 'trap_door_open' });
        this._advanceTurn();
        return;
      case 'trophy_case':
        this._placeAllTreasures();
        return;
      case 'troll':
        this.attack('troll');
        return;
      case 'cyclops':
        this.talkTo('cyclops');
        return;
      default:
        if (ITEMS[id] && (this.state.roomItems[this.state.room] ?? []).includes(id)) {
          this.take(id);
          return;
        }
        this._narrate('use_generic');
    }
  }

  useItemOn(itemId, targetId) {
    if (this.state.mode !== 'play') return;
    if (!this.has(itemId)) return;
    if (targetId === 'cyclops') {
      if (itemId === 'tattered_page') { this._cyclopsFlees(); return; }
      if (itemId === 'elvish_sword') { this._narrate('show_cyclops_sword'); return; }
      this._narrate('show_cyclops_generic', { item: ITEMS[itemId].name });
      return;
    }
    if (targetId === 'troll' && (itemId === 'elvish_sword' || itemId === 'nasty_knife')) {
      this._narrate('use_sword_on_troll');
      this.startCombat();
      return;
    }
    if (targetId === 'great_tree' && itemId === 'rope') {
      if (this.flag('egg_taken')) { this._narrate('look_great_tree_taken'); return; }
      this._getEggWithRope();
      return;
    }
    if (targetId === 'trophy_case') {
      this._placeTreasure(itemId);
      return;
    }
    this._narrate('use_item_generic', { item: ITEMS[itemId]?.name ?? itemId });
  }

  _getEggWithRope() {
    this.setFlag('egg_taken');
    this.state.inventory.push('jewel_encrusted_egg');
    this._narrate('use_rope_on_tree');
    this._emit('worldChanged', { what: 'egg_taken' });
    this._emit('inventoryChanged', { inventory: [...this.state.inventory] });
    this._advanceTurn();
  }

  _cyclopsFlees() {
    this.setFlag('cyclops_fled');
    this._scoreEvent('cyclops_fled');
    this._narrate('cyclops_flees');
    this._emit('worldChanged', { what: 'cyclops_fled' });
    this._advanceTurn();
  }

  // ---- lamp & torch ----
  toggleLamp() {
    if (this.state.mode !== 'play') return;
    if (!this.has('brass_lantern')) return;
    if (this.state.lampFuel <= 0) { this._narrate('lamp_dead'); return; }
    this.state.lampOn = !this.state.lampOn;
    this._narrate(this.state.lampOn ? 'lamp_on' : 'lamp_off');
    this._emit('lampChanged', { fuel: this.state.lampFuel, stage: this.lampStage() });
    if (this.state.room === 'loud_room' && !this.hasLight()) this._narrate('room_loud_room_quiet');
    this._advanceTurn();
  }

  toggleTorch() {
    if (this.state.mode !== 'play') return;
    if (!this.has('torch')) return;
    this.state.torchLit = !this.state.torchLit;
    this._narrate(this.state.torchLit ? 'torch_on' : 'torch_off');
    this._emit('lampChanged', { fuel: this.state.lampFuel, stage: this.lampStage() });
    if (this.state.room === 'loud_room' && !this.hasLight()) this._narrate('room_loud_room_quiet');
    this._advanceTurn();
  }

  // ---- treasures ----
  _placeAllTreasures() {
    const carried = this.state.inventory.filter((id) => ITEMS[id]?.type === 'treasure');
    if (carried.length === 0) { this._narrate('trophy_case_no_treasure'); return; }
    for (const id of carried) this._placeTreasure(id);
  }

  _placeTreasure(itemId) {
    if (ITEMS[itemId]?.type !== 'treasure') { this._narrate('trophy_case_wrong_item'); return; }
    if (!this.has(itemId)) return;
    this.state.inventory = this.state.inventory.filter((x) => x !== itemId);
    this.state.treasuresPlaced.push(itemId);
    this._narrate('treasure_placed', { item: ITEMS[itemId].name });
    this._addScore(TREASURES[itemId] ?? 0);
    this._emit('treasurePlaced', { id: itemId, count: this.state.treasuresPlaced.length });
    this._emit('inventoryChanged', { inventory: [...this.state.inventory] });
    this._advanceTurn();
    if (this.state.treasuresPlaced.length === Object.keys(TREASURES).length) {
      this.state.mode = 'won';
      this._narrate('game_won');
      this._emit('gameWon', {
        score: this.state.score, max: MAX_SCORE, rank: this.rank(),
        turns: this.state.turns, deaths: this.state.deathCount, gallery: [...this.state.deaths],
      });
    }
  }

  // ---- troll combat (QTE state machine; UI owns the clock) ----
  startCombat() {
    if (this.flag('troll_defeated') || this.state.mode !== 'play') return;
    this.takeSnapshot();
    this.state.mode = 'combat';
    this.state.combat = {
      round: 0, trollHp: COMBAT.trollHp, playerHp: COMBAT.playerHp, phase: null,
    };
    this._narrate(this.has('elvish_sword') ? 'combat_intro' : 'combat_intro_knife');
    this._emit('combatStart');
    this._combatNextRound();
  }

  _combatNextRound() {
    const c = this.state.combat;
    c.round++;
    if (c.round > COMBAT.maxRounds) { this._combatLose(); return; }
    c.phase = c.round % 2 === 1 ? 'strike' : 'dodge';
    this._emit('combatPrompt', { phase: c.phase, round: c.round, trollHp: c.trollHp, playerHp: c.playerHp });
  }

  // Player clicked the QTE in time.
  combatPress() {
    if (this.state.mode !== 'combat') return;
    const c = this.state.combat;
    if (c.phase === 'strike') {
      c.trollHp--;
      this._narrate('combat_hit');
      this._emit('combatHit', { target: 'troll', trollHp: c.trollHp, playerHp: c.playerHp });
      if (c.trollHp <= 0) { this._combatWin(); return; }
    } else {
      this._narrate('combat_dodge');
      this._emit('combatDodged');
    }
    this._advanceTurn();
    if (this.state.mode === 'combat') this._combatNextRound();
  }

  // QTE window expired.
  combatTimeout() {
    if (this.state.mode !== 'combat') return;
    const c = this.state.combat;
    if (c.phase === 'strike') {
      this._narrate('combat_miss');
      this._emit('combatMiss');
    } else {
      c.playerHp--;
      this._narrate('combat_fail_dodge');
      this._emit('combatHit', { target: 'player', trollHp: c.trollHp, playerHp: c.playerHp });
      if (c.playerHp <= 0) { this._combatLose(); return; }
    }
    this._advanceTurn();
    if (this.state.mode === 'combat') this._combatNextRound();
  }

  _combatWin() {
    this.state.mode = 'play';
    this.state.combat = null;
    this.setFlag('troll_defeated');
    this._scoreEvent('troll_defeated');
    this._narrate('troll_defeated');
    this._emit('combatEnd', { won: true });
    this._emit('worldChanged', { what: 'troll_defeated' });
  }

  _combatLose() {
    this.state.combat = null;
    this._emit('combatEnd', { won: false });
    this._die('troll');
  }

  // ---- idle narrator ----
  idlePoke() {
    if (this.state.mode !== 'play') return;
    const key = IDLE_LINES[this._idleIndex % IDLE_LINES.length];
    this._idleIndex++;
    this._narrate(key);
  }

  // ---- save / load ----
  save() { return JSON.stringify({ v: 1, state: this.state }); }

  load(json) {
    try {
      const data = JSON.parse(json);
      if (data?.v !== 1 || !data.state?.room || !ROOMS[data.state.room]) return false;
      this.state = data.state;
      if (this.state.mode === 'combat' || this.state.mode === 'dead') {
        this.state.mode = 'play';
        this.state.combat = null;
      }
      this._emit('roomChanged', { room: this.state.room, name: this.room.name });
      this._emit('inventoryChanged', { inventory: [...this.state.inventory] });
      this._emit('scoreChanged', { score: this.state.score, max: MAX_SCORE });
      this._emit('lampChanged', { fuel: this.state.lampFuel, stage: this.lampStage() });
      return true;
    } catch {
      return false;
    }
  }

  // ---- game start ----
  begin() {
    this.state.visited[this.state.room] = true;
    this._emit('roomChanged', { room: this.state.room, name: this.room.name, first: true });
    this._narrate('room_west_of_house_first');
  }
}
