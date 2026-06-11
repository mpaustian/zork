// Entry point: wires the pure engine to the 3D scene, the HUD, and audio.
import { ZorkEngine } from './game/engine.js';
import { ROOMS, ITEMS, SCENERY, DEATHS, MAX_SCORE } from './game/content.js';
import { SceneManager, OPPOSITE } from './render/scene.js';
import { LAYOUTS } from './render/rooms3d.js';
import { HUD } from './ui/hud.js';
import { GameAudio } from './audio/sound.js';

const SAVE_KEY = 'zork3d-save';
const COMBAT_WINDOW_MS = 1500;

const VERBS_FOR = {
  troll: ['look', 'talk', 'attack'],
  cyclops: ['look', 'talk', 'attack'],
  skeleton: ['look', 'talk'],
  mailbox: ['look', 'use'],
  front_door: ['look', 'use'],
  window: ['look', 'use'],
  great_tree: ['look', 'use'],
  oriental_rug: ['look', 'use'],
  trap_door: ['look', 'use'],
  trophy_case: ['look', 'use'],
  white_house: ['look'],
  kitchen_table: ['look'],
  attic_table: ['look'],
  claw_marks: ['look'],
  ceiling_carvings: ['look'],
  treasure_heaps: ['look'],
};

class Game {
  constructor() {
    this.engine = new ZorkEngine();
    this.audio = new GameAudio();
    this.pendingMoveDir = null;
    this.started = false;
    this.idleTimer = null;
    this.instantActions = false; // e2e hook: skip the walk-to-act animation

    // The browser context menu has no business in the Great Underground Empire.
    document.addEventListener('contextmenu', (e) => e.preventDefault());

    const canvas = document.getElementById('game-canvas');
    this.scene = new SceneManager(canvas, {
      onObjectClicked: (id, kind, x, y) => this.objectClicked(id, kind, x, y),
      onPortalEnter: (dir) => this.portalEntered(dir),
    });

    this.hud = new HUD(document.getElementById('hud-root'), {
      onNewGame: () => this.newGame(),
      onContinue: () => this.continueGame(),
      onPlayAgain: () => this.newGame(),
      onVerb: (verb, objectId) => this.doVerb(verb, objectId),
      onItemArmed: () => {},
      onUseItemOnSelf: (itemId) => this.useItemOnSelf(itemId),
      onCombatPress: () => { this.engine.combatPress(); this.afterAction(); },
      onCombatTimeout: () => { this.engine.combatTimeout(); this.afterAction(); },
      onRewindDone: () => this.finishRewind(),
      onMuteToggle: (muted) => this.audio.setMuted(muted),
    });

    this.hud.showTitle(!!localStorage.getItem(SAVE_KEY));
    this._loop();
  }

  // ---- lifecycle ----
  newGame() {
    this.audio.attach();
    localStorage.removeItem(SAVE_KEY);
    this.engine = new ZorkEngine();
    this.engine.begin();
    this.hud.hideTitle();
    this.started = true;
    this.rebuildRoom(null);
    this.afterAction();
    this._armIdleTimer();
  }

  continueGame() {
    this.audio.attach();
    const json = localStorage.getItem(SAVE_KEY);
    this.engine = new ZorkEngine();
    if (!json || !this.engine.load(json)) { this.newGame(); return; }
    this.hud.hideTitle();
    this.started = true;
    this.rebuildRoom(null);
    this.afterAction();
    this.hud.toast('Game restored. The Empire missed you.');
    this._armIdleTimer();
  }

  _armIdleTimer() {
    clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      if (this.started && this.engine.state.mode === 'play') {
        this.engine.idlePoke();
        this.afterAction(false);
      }
      this._armIdleTimer();
    }, 50000);
  }

  // ---- interaction ----
  objectClicked(objectId, kind, x, y) {
    if (this.engine.state.mode !== 'play') return;
    const armed = this.hud.armedItem;
    if (armed) {
      this.hud.disarm();
      this._approachThen(objectId, () => {
        this.engine.useItemOn(armed, objectId);
        this.afterAction();
      });
      return;
    }
    const name = SCENERY[objectId]?.name ?? ITEMS[objectId]?.name ?? objectId;
    const verbs = kind === 'item' ? ['look', 'take'] : (VERBS_FOR[objectId] ?? ['look', 'use']);
    this.hud.openVerbCoin(x, y, { objectId, name, verbs });
  }

  // Walk the avatar over to the object before acting on it (looking is free —
  // you have eyes). Distant interactions teleporting results feels wrong.
  _approachThen(objectId, fn) {
    const d = this.scene.distanceToObject(objectId);
    if (this.instantActions || d == null || d <= 2.4) { fn(); return; }
    this.scene.approachObject(objectId, fn);
  }

  doVerb(verb, objectId) {
    const e = this.engine;
    const run = () => {
      if (verb === 'look') e.lookAt(objectId);
      else if (verb === 'take') e.take(objectId);
      else if (verb === 'use') e.useObject(objectId);
      else if (verb === 'talk') e.talkTo(objectId);
      else if (verb === 'attack') e.attack(objectId);
      this.afterAction();
    };
    if (verb === 'look') { run(); return; }
    this._approachThen(objectId, run);
  }

  useItemOnSelf(itemId) {
    const e = this.engine;
    if (itemId === 'brass_lantern') e.toggleLamp();
    else if (itemId === 'torch') e.toggleTorch();
    else e.lookAt(itemId);
    this.afterAction();
  }

  portalEntered(dir) {
    if (this.engine.state.mode !== 'play') return;
    this.pendingMoveDir = dir;
    const res = this.engine.move(dir);
    if (!res.ok) {
      this.scene.bounceBack(dir);
      this.pendingMoveDir = null;
    } else if (res.looped) {
      this.audio.sting('portal');
      this.fadeSwap(() => this.scene.recenterPlayer());
      this.pendingMoveDir = null;
    }
    // Successful real moves are handled by the roomChanged event in afterAction.
    this.afterAction();
  }

  // ---- engine event pump ----
  afterAction(save = true) {
    const events = this.engine.drainEvents();
    for (const ev of events) this.handleEvent(ev);
    this.syncHud();
    if (save && this.started && this.engine.state.mode === 'play') {
      localStorage.setItem(SAVE_KEY, this.engine.save());
    }
    this._armIdleTimer();
  }

  handleEvent(ev) {
    switch (ev.type) {
      case 'narrate':
        this.hud.narrate(ev.text);
        if (ev.key === 'treasure_placed') this.audio.sting('treasure');
        if (ev.key === 'lamp_on' || ev.key === 'torch_on') this.audio.sting('lamp_on');
        if (ev.key === 'lamp_off' || ev.key === 'torch_off') this.audio.sting('lamp_off');
        break;
      case 'roomChanged': {
        const fromDir = this.pendingMoveDir ? OPPOSITE[this.pendingMoveDir] : null;
        this.pendingMoveDir = null;
        this.audio.sting('portal');
        this.fadeSwap(() => this.rebuildRoom(fromDir));
        break;
      }
      case 'itemTaken':
        this.audio.sting('take');
        this.rebuildRoom('keep');
        break;
      case 'worldChanged':
        this.rebuildRoom('keep');
        break;
      case 'inventoryChanged':
      case 'scoreChanged':
      case 'lampChanged':
        break; // syncHud covers these
      case 'darkness':
        this.audio.sting('grue');
        break;
      case 'combatStart':
        this.audio.sting('combat_start');
        this.scene.setCombatFocus(true);
        this.scene.lockInput(true);
        this.hud.showCombat();
        break;
      case 'combatPrompt':
        this.hud.combatPrompt({ ...ev, windowMs: COMBAT_WINDOW_MS });
        break;
      case 'combatHit':
        this.audio.sting('combat_hit');
        this.hud.combatFlash(ev.target === 'troll' ? 'hit-troll' : 'hit-player');
        if (ev.target === 'player') this.scene.shake(0.5);
        break;
      case 'combatMiss':
        this.audio.sting('combat_miss');
        this.hud.combatFlash('miss');
        break;
      case 'combatDodged':
        this.audio.sting('combat_miss');
        this.hud.combatFlash('dodge');
        break;
      case 'combatEnd':
        this.hud.hideCombat();
        this.scene.setCombatFocus(false);
        this.scene.lockInput(false);
        break;
      case 'death':
        this.audio.sting('death');
        this.scene.lockInput(true);
        this.hud.showDeath({
          title: ev.title, text: ev.text,
          galleryCount: ev.gallery.length, galleryTotal: Object.keys(DEATHS).length,
        });
        break;
      case 'rewound':
        this.audio.sting('rewind');
        break;
      case 'treasurePlaced':
        this.rebuildRoom('keep'); // case fills up
        break;
      case 'gameWon':
        this.audio.sting('win');
        localStorage.removeItem(SAVE_KEY);
        setTimeout(() => {
          this.hud.showWin({
            score: ev.score, max: ev.max, rank: ev.rank,
            turns: ev.turns, deaths: ev.deaths, gallery: ev.gallery,
          });
        }, 3500);
        break;
    }
  }

  finishRewind() {
    this.engine.grimRewind();
    this.scene.lockInput(false);
    this.hud.hideCombat();
    this.scene.setCombatFocus(false);
    // grimRewind emits roomChanged → rebuild via afterAction
    this.afterAction();
  }

  // ---- scene sync ----
  roomView() {
    const e = this.engine;
    const exits = {};
    for (const [dir, info] of Object.entries(e.exits())) {
      exits[dir] = { blocked: !!(info.requiresFlag && !e.flag(info.requiresFlag)) };
    }
    return {
      flags: e.state.flags,
      treasureCount: e.state.treasuresPlaced.length,
      items: e.state.roomItems[e.state.room] ?? [],
      exits,
    };
  }

  rebuildRoom(fromDir) {
    const e = this.engine;
    const keepPos = fromDir === 'keep' ? this.scene.avatar.group.position.clone() : null;
    this.scene.setRoom(e.state.room, this.roomView(), fromDir === 'keep' ? null : fromDir);
    if (keepPos) {
      this.scene.avatar.group.position.copy(keepPos);
      this.scene.refreshPortalCooldown();
    }
    this.hud.setRoomName(ROOMS[e.state.room].name);
    const env = LAYOUTS[e.state.room].env;
    this.audio.setRegion(env);
    this.syncLight();
  }

  syncLight() {
    const e = this.engine;
    const dark = e.roomIsDark();
    const hasLight = e.hasLight();
    this.scene.setLightState({
      dark, hasLight,
      intensity: e.lightIntensity(),
      torchLit: e.state.torchLit,
      lampOn: e.state.lampOn,
      hasLantern: e.has('brass_lantern'),
      hasSword: e.has('elvish_sword'),
    });
    this.scene.soundRingsActive = e.state.room === 'loud_room' && hasLight;
    this.audio.setLoudRoomHum(e.state.room === 'loud_room' && hasLight);
    let level = 0;
    if (dark && !hasLight) level = 1;
    else if (dark) level = 0.55 - 0.3 * e.lightIntensity();
    this.hud.setDarkness(level, e.state.darknessTurns >= 1 && dark && !hasLight);
  }

  syncHud() {
    const e = this.engine;
    this.hud.setScore(e.state.score, MAX_SCORE, e.rank());
    this.hud.setInventory(
      e.state.inventory.map((id) => ({ id, name: ITEMS[id].name, type: ITEMS[id].type })),
      this.hud.armedItem,
    );
    this.hud.setLamp({
      hasLantern: e.has('brass_lantern'),
      on: e.state.lampOn,
      fuel: e.state.lampFuel,
      max: 150,
      stage: e.lampStage(),
      hasTorch: e.has('torch'),
      torchLit: e.state.torchLit,
    });
    this.syncLight();
  }

  // Test/debug hook: jump straight to a room (used by the e2e suite).
  debugTeleport(roomId, { light = false } = {}) {
    const e = this.engine;
    if (!ROOMS[roomId]) return;
    if (light) {
      if (!e.has('brass_lantern')) e.state.inventory.push('brass_lantern');
      e.state.lampOn = true;
    }
    e.state.room = roomId;
    e.state.visited[roomId] = true;
    this.rebuildRoom(null);
    this.afterAction(false);
  }

  // ---- transitions ----
  fadeSwap(mid) {
    const f = document.getElementById('fade');
    f.style.opacity = '1';
    setTimeout(() => {
      mid();
      f.style.opacity = '0';
    }, 240);
  }

  _loop() {
    requestAnimationFrame(() => this._loop());
    this.scene.update();
  }
}

// Keyboard shortcuts for the lamp & torch.
window.addEventListener('keydown', (e) => {
  if (!window.__game?.started) return;
  if (e.code === 'KeyL') window.__game.useItemOnSelf('brass_lantern');
  if (e.code === 'KeyT') window.__game.useItemOnSelf('torch');
});

const game = new Game();
window.__game = game; // test hook (used by the e2e suite)
