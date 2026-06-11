// HUD — 2D UI layer over the Three.js canvas.
// Pure ES module, no frameworks. CSS is imported for Vite bundling.
import './hud.css';

// ---- Item metadata -------------------------------------------------
const ITEM_ICONS = {
  brass_lantern:        '🏮',
  elvish_sword:         '🗡️',
  nasty_knife:          '🔪',
  rope:                 '🪢',
  leaflet:              '📜',
  tattered_page:        '📃',
  jewel_encrusted_egg:  '🥚',
  painting:             '🖼️',
  bag_of_coins:         '💰',
  platinum_bar:         '🧱',
  silver_chalice:       '🏆',
  torch:                '🔥',
};
const ITEM_DEFAULT_ICON = '📦';

const TREASURE_IDS = new Set([
  'jewel_encrusted_egg', 'painting', 'bag_of_coins', 'platinum_bar', 'silver_chalice',
]);

// Deaths map from content.js (duplicated here to avoid circular dependency at runtime)
const DEATH_TITLES = {
  grue:    'Eaten by a Grue',
  troll:   'Axed a Question',
  cyclops: 'A Particularly Crunchy Snack',
  fall:    'Gravity: 1, You: 0',
};

// ---- Rotating taglines ---------------------------------------------
const TAGLINES = [
  '"You will be eaten by a grue."',
  '"Now with 100% more dimensions."',
  '"The house is committed to its privacy."',
  '"Darkness: not just a lifestyle choice."',
  '"The narrator judges you. Constantly."',
  '"Adventure awaits. So does the troll."',
];

// ---- Verb definitions ----------------------------------------------
const VERBS = [
  { id: 'look',   icon: '👁️',  label: 'Look'   },
  { id: 'use',    icon: '✋',  label: 'Use'    },
  { id: 'take',   icon: '🫳',  label: 'Take'   },
  { id: 'talk',   icon: '💬',  label: 'Talk'   },
  { id: 'attack', icon: '⚔️',  label: 'Attack' },
];

// ---- Helpers -------------------------------------------------------
function el(tag, cls) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  return e;
}

function hidden(elem) { elem.classList.add('hidden'); }
function show(elem)   { elem.classList.remove('hidden'); }

// Safe text setter — never innerHTML user/game content
function setText(elem, text) { elem.textContent = String(text ?? ''); }

// Clamp a value to [lo, hi]
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ---- HUD class -----------------------------------------------------
export class HUD {
  constructor(root, callbacks = {}) {
    this._root = root;
    this._cb   = callbacks;

    // State
    this._armed       = null;   // currently armed inventory item id or null
    this._muted       = false;
    this._items       = [];     // [{id, name, type}]
    this._narQueue    = [];     // queued narrator strings
    this._narTyping   = false;
    this._narFull     = false;  // current text fully rendered
    this._narTimer    = null;

    this._combatActive = false;
    this._combatTimerId = null;
    this._combatPressed = false;
    this._combatExpired = false;

    this._taglineIdx = Math.floor(Math.random() * TAGLINES.length);
    this._taglineInterval = null;

    this._build();
    this._bindKeys();
  }

  // ===================================================================
  // BUILD — construct DOM skeleton
  // ===================================================================
  _build() {
    const r = this._root;
    r.className = 'hud';

    // Title screen
    this._titleEl = this._buildTitle();
    r.appendChild(this._titleEl);

    // Win screen
    this._winEl = this._buildWin();
    r.appendChild(this._winEl);

    // Persistent HUD elements
    this._scoreEl     = this._buildScore();
    this._roomEl      = this._buildRoom();
    this._toprightEl  = this._buildTopRight();
    this._narratorEl  = this._buildNarrator();
    this._inventoryEl = this._buildInventory();
    this._lampEl      = this._buildLamp();

    r.appendChild(this._scoreEl);
    r.appendChild(this._roomEl);
    r.appendChild(this._toprightEl);
    r.appendChild(this._narratorEl);
    r.appendChild(this._inventoryEl);
    r.appendChild(this._lampEl);

    // Hidden full-text narration transcript (screen readers + test hooks):
    // every narrated line lands here immediately, untouched by the typewriter.
    this._transcriptEl = el('div', 'hud-transcript');
    this._transcriptEl.id = 'narrator-transcript';
    this._transcriptEl.setAttribute('aria-live', 'polite');
    r.appendChild(this._transcriptEl);

    // Verb coin (hidden by default)
    this._verbCoinEl = this._buildVerbCoin();
    r.appendChild(this._verbCoinEl);

    // Combat overlay
    this._combatEl    = this._buildCombat();
    this._flashEl     = el('div', 'hud-combat-flash');
    r.appendChild(this._combatEl);
    r.appendChild(this._flashEl);

    // Death screen
    this._deathEl = this._buildDeath();
    r.appendChild(this._deathEl);

    // Darkness overlay
    this._darknessEl = this._buildDarkness();
    r.appendChild(this._darknessEl);

    // Click outside verb coin to close
    document.addEventListener('click', (e) => {
      if (!this._verbCoinEl.classList.contains('hidden') &&
          !this._verbCoinEl.contains(e.target)) {
        this.closeVerbCoin();
      }
    }, true);
  }

  // ---- Title screen ------------------------------------------------
  _buildTitle() {
    const wrap = el('div', 'hud-title');

    // Vignette
    wrap.appendChild(el('div', 'hud-title__vignette'));

    const logo = el('div', 'hud-title__logo');
    setText(logo, 'ZORK');
    wrap.appendChild(logo);

    const sub = el('div', 'hud-title__subtitle');
    setText(sub, 'The Great Underground Empire');
    wrap.appendChild(sub);

    const tagline = el('div', 'hud-title__tagline');
    setText(tagline, TAGLINES[this._taglineIdx]);
    this._taglineEl = tagline;
    wrap.appendChild(tagline);

    this._titleBtnsEl = el('div', 'hud-title__buttons');
    wrap.appendChild(this._titleBtnsEl);

    const hint = el('div', 'hud-title__hint');
    setText(hint, 'WASD / arrows to move  •  click things to poke them  •  L = lamp');
    wrap.appendChild(hint);

    hidden(wrap);
    return wrap;
  }

  // ---- Win screen --------------------------------------------------
  _buildWin() {
    const wrap = el('div', 'hud-win');
    const inner = el('div', 'hud-win__inner');

    this._winTitleEl = el('div', 'hud-win__title');
    setText(this._winTitleEl, 'A Legend, Behind Glass');
    inner.appendChild(this._winTitleEl);

    this._winRankEl = el('div', 'hud-win__rank');
    inner.appendChild(this._winRankEl);

    this._winStatsEl = el('div', 'hud-win__stats');
    inner.appendChild(this._winStatsEl);

    this._winGalleryTitleEl = el('div', 'hud-win__gallery-title');
    setText(this._winGalleryTitleEl, 'Death Gallery');
    inner.appendChild(this._winGalleryTitleEl);

    this._winGalleryEl = el('ul', 'hud-win__gallery');
    inner.appendChild(this._winGalleryEl);

    const btn = el('button', 'hud-btn hud-btn--primary');
    setText(btn, 'Play Again');
    btn.addEventListener('click', () => this._cb.onPlayAgain?.());
    inner.appendChild(btn);

    wrap.appendChild(inner);
    hidden(wrap);
    return wrap;
  }

  // ---- Score -------------------------------------------------------
  _buildScore() {
    const panel = el('div', 'hud-score');
    this._scoreTextEl = el('span', '');
    this._scoreRankEl = el('span', 'hud-score__rank');
    panel.appendChild(this._scoreTextEl);
    panel.appendChild(this._scoreRankEl);
    return panel;
  }

  // ---- Room name ---------------------------------------------------
  _buildRoom() {
    const panel = el('div', 'hud-room');
    this._roomTextEl = panel;
    return panel;
  }

  // ---- Top right (mute + toasts) -----------------------------------
  _buildTopRight() {
    const wrap = el('div', 'hud-topright');
    const mute = el('div', 'hud-mute');
    setText(mute, '🔊');
    this._muteEl = mute;
    mute.addEventListener('click', () => {
      this._muted = !this._muted;
      setText(mute, this._muted ? '🔇' : '🔊');
      this._cb.onMuteToggle?.(this._muted);
    });
    wrap.appendChild(mute);
    this._toastContainer = wrap;
    return wrap;
  }

  // ---- Narrator panel ----------------------------------------------
  _buildNarrator() {
    const panel = el('div', 'hud-narrator');

    const textEl = el('div', 'hud-narrator__text');
    this._narTextEl = textEl;

    const moreEl = el('div', 'hud-narrator__more hidden');
    setText(moreEl, '▼');
    this._narMoreEl = moreEl;

    panel.appendChild(textEl);
    panel.appendChild(moreEl);

    // Click: skip typewriter or advance queue
    panel.addEventListener('click', () => this._narratorClick());

    return panel;
  }

  // ---- Inventory ---------------------------------------------------
  _buildInventory() {
    const wrap = el('div', 'hud-inventory');
    const label = el('div', 'hud-inventory__label');
    setText(label, 'Inventory');
    this._invChipsEl = el('div', 'hud-inventory__chips');
    wrap.appendChild(label);
    wrap.appendChild(this._invChipsEl);
    return wrap;
  }

  // ---- Lamp widget -------------------------------------------------
  _buildLamp() {
    const wrap = el('div', 'hud-lamp hidden');
    const inner = el('div', 'hud-lamp__inner');

    this._lampBtn = el('button', 'hud-lamp__btn');
    setText(this._lampBtn, '🏮');
    this._lampBtn.addEventListener('click', () => {
      this._cb.onUseItemOnSelf?.('brass_lantern');
    });

    this._lampGaugeWrap = el('div', 'hud-lamp__gauge-wrap');
    this._lampGaugeBar  = el('div', 'hud-lamp__gauge-bar');
    this._lampGaugeBar.setAttribute('data-stage', 'off');
    this._lampGaugeWrap.appendChild(this._lampGaugeBar);

    this._torchBtn = el('button', 'hud-lamp__btn');
    setText(this._torchBtn, '🔥');
    this._torchBtn.addEventListener('click', () => {
      this._cb.onUseItemOnSelf?.('torch');
    });
    this._torchBtn.style.display = 'none';

    inner.appendChild(this._lampBtn);
    inner.appendChild(this._lampGaugeWrap);
    inner.appendChild(this._torchBtn);
    wrap.appendChild(inner);
    return wrap;
  }

  // ---- Verb coin ---------------------------------------------------
  _buildVerbCoin() {
    const wrap = el('div', 'hud-verbcoin hidden');
    this._vcLabelEl = el('div', 'hud-verbcoin__label');
    wrap.appendChild(this._vcLabelEl);
    this._vcWrap = wrap;
    return wrap;
  }

  // ---- Combat overlay ----------------------------------------------
  _buildCombat() {
    const wrap = el('div', 'hud-combat hidden');

    // HP display
    const hp = el('div', 'hud-combat__hp');
    const youSide = el('div', '');
    const youLabel = el('span', 'hud-combat__hp-label');
    setText(youLabel, 'You');
    this._yourHpEl = el('div', '');
    youSide.appendChild(youLabel);
    youSide.appendChild(this._yourHpEl);

    const sep = el('div', '');
    setText(sep, 'vs');
    sep.style.cssText = 'display:flex;align-items:center;font-size:12px;opacity:0.4;';

    const trollSide = el('div', '');
    const trollLabel = el('span', 'hud-combat__hp-label');
    setText(trollLabel, 'Troll');
    this._trollHpEl = el('div', '');
    trollSide.appendChild(trollLabel);
    trollSide.appendChild(this._trollHpEl);

    hp.appendChild(youSide);
    hp.appendChild(sep);
    hp.appendChild(trollSide);
    wrap.appendChild(hp);

    // QTE prompt
    const promptWrap = el('div', 'hud-combat__prompt-wrap');
    this._qteEl = el('div', 'hud-combat__qte');
    this._qteIcon  = el('div', 'hud-combat__qte-icon');
    this._qteLabel = el('div', 'hud-combat__qte-label');
    this._qteEl.appendChild(this._qteIcon);
    this._qteEl.appendChild(this._qteLabel);
    hidden(this._qteEl);
    promptWrap.appendChild(this._qteEl);
    wrap.appendChild(promptWrap);

    this._qteEl.addEventListener('click', () => this._onQteClick());
    return wrap;
  }

  // ---- Death screen ------------------------------------------------
  _buildDeath() {
    const wrap = el('div', 'hud-death hidden');

    this._deathFlashEl = el('div', 'hud-death__flash');
    wrap.appendChild(this._deathFlashEl);

    this._deathCardEl = el('div', 'hud-death__card');

    this._deathTitleEl = el('div', 'hud-death__title');
    this._deathTextEl  = el('div', 'hud-death__text');
    this._deathGallEl  = el('div', 'hud-death__gallery');

    // VHS rewind layer
    this._deathVhsEl = el('div', 'hud-death__vhs');
    const vhsLabel = el('div', 'hud-death__vhs-label');
    setText(vhsLabel, '◀◀ THE GRIM REWIND');
    this._deathVhsEl.appendChild(vhsLabel);
    // Two tracking lines
    this._deathVhsEl.appendChild(el('div', 'hud-death__tracking'));
    this._deathVhsEl.appendChild(el('div', 'hud-death__tracking'));

    this._deathCardEl.appendChild(this._deathTitleEl);
    this._deathCardEl.appendChild(this._deathTextEl);
    this._deathCardEl.appendChild(this._deathGallEl);
    this._deathCardEl.appendChild(this._deathVhsEl);
    wrap.appendChild(this._deathCardEl);

    // Click to skip to VHS phase
    wrap.addEventListener('click', () => this._deathSkip());

    return wrap;
  }

  // ---- Darkness overlay --------------------------------------------
  _buildDarkness() {
    const wrap = el('div', 'hud-darkness');

    this._darkMaskEl = el('div', 'hud-darkness__mask');
    this._darkMaskEl.style.setProperty('--darkness-level', '0');
    this._darkMaskEl.style.setProperty('--darkness-edge', '0');

    this._darkEyesEl = el('div', 'hud-darkness__eyes');
    const eye1 = el('div', 'hud-darkness__eye');
    const eye2 = el('div', 'hud-darkness__eye');
    this._darkEyesEl.appendChild(eye1);
    this._darkEyesEl.appendChild(eye2);

    this._darkThreatEl = el('div', 'hud-darkness__threat');

    wrap.appendChild(this._darkMaskEl);
    wrap.appendChild(this._darkEyesEl);
    wrap.appendChild(this._darkThreatEl);
    return wrap;
  }

  // ---- Key bindings ------------------------------------------------
  _bindKeys() {
    document.addEventListener('keydown', (e) => {
      if (this._combatActive && !this._combatPressed && !this._combatExpired) {
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this._onQteClick();
        }
      }
    });
  }

  // ===================================================================
  // PUBLIC API — Title / Meta screens
  // ===================================================================
  showTitle(hasSave) {
    // Build buttons freshly each time
    this._titleBtnsEl.innerHTML = '';

    const newBtn = el('button', 'hud-btn hud-btn--primary');
    setText(newBtn, '⚔️  New Game');
    newBtn.addEventListener('click', () => {
      this.hideTitle();
      this._cb.onNewGame?.();
    });
    this._titleBtnsEl.appendChild(newBtn);

    if (hasSave) {
      const contBtn = el('button', 'hud-btn');
      setText(contBtn, '📖  Continue');
      contBtn.addEventListener('click', () => {
        this.hideTitle();
        this._cb.onContinue?.();
      });
      this._titleBtnsEl.appendChild(contBtn);
    }

    show(this._titleEl);

    // Rotate taglines
    if (this._taglineInterval) clearInterval(this._taglineInterval);
    this._taglineInterval = setInterval(() => {
      this._taglineIdx = (this._taglineIdx + 1) % TAGLINES.length;
      this._taglineEl.style.opacity = '0';
      setTimeout(() => {
        setText(this._taglineEl, TAGLINES[this._taglineIdx]);
        this._taglineEl.style.opacity = '1';
      }, 500);
    }, 4000);
  }

  hideTitle() {
    hidden(this._titleEl);
    if (this._taglineInterval) { clearInterval(this._taglineInterval); this._taglineInterval = null; }
  }

  showWin({ score, max, rank, turns, deaths, gallery }) {
    setText(this._winRankEl, rank);

    // Build stats
    this._winStatsEl.innerHTML = '';
    const lines = [
      `Score: ${score} / ${max}`,
      `Turns taken: ${turns}`,
      `Deaths suffered: ${deaths}`,
    ];
    for (const line of lines) {
      const p = el('p', '');
      setText(p, line);
      this._winStatsEl.appendChild(p);
    }

    // Gallery
    this._winGalleryEl.innerHTML = '';
    if (!gallery || gallery.length === 0) {
      const li = el('li', '');
      setText(li, 'You survived without dying. Suspicious.');
      this._winGalleryEl.appendChild(li);
    } else {
      for (const id of gallery) {
        const li = el('li', '');
        setText(li, DEATH_TITLES[id] ?? id);
        this._winGalleryEl.appendChild(li);
      }
    }

    show(this._winEl);
  }

  // ===================================================================
  // PUBLIC API — Persistent HUD
  // ===================================================================
  narrate(text) {
    const s = String(text ?? '');
    this._narQueue.push(s);
    const line = el('div', '');
    setText(line, s);
    this._transcriptEl.appendChild(line);
    while (this._transcriptEl.childNodes.length > 40) {
      this._transcriptEl.removeChild(this._transcriptEl.firstChild);
    }
    this._updateMoreIndicator();
    if (!this._narTyping && !this._narFull) {
      this._dequeueNarrate();
    }
  }

  _dequeueNarrate() {
    if (this._narQueue.length === 0) {
      this._narTyping = false;
      this._narFull = false;
      this._updateMoreIndicator();
      return;
    }
    const text = this._narQueue.shift();
    this._updateMoreIndicator();
    this._typewrite(text);
  }

  _typewrite(text) {
    if (this._narTimer) { clearTimeout(this._narTimer); this._narTimer = null; }
    this._narTyping = true;
    this._narFull   = false;
    setText(this._narTextEl, '');

    // Accelerate if there's a big queue
    const qlen = this._narQueue.length;
    const delay = qlen >= 2 ? 6 : 16;

    // Time-based reveal: immune to setTimeout throttling (headless/background tabs).
    const start = performance.now();
    const tick = () => {
      const target = Math.min(text.length, Math.floor((performance.now() - start) / delay) + 1);
      this._narTextEl.textContent = text.slice(0, target);
      if (target >= text.length) {
        this._narTyping = false;
        this._narFull   = true;
        // Auto-advance queue after brief pause if more items waiting
        if (this._narQueue.length > 0) {
          this._narTimer = setTimeout(() => this._dequeueNarrate(), 900);
        }
        this._updateMoreIndicator();
        return;
      }
      this._narTimer = setTimeout(tick, 24);
    };
    // Store the full text for skip functionality
    this._narCurrentText = text;
    tick();
  }

  _narratorClick() {
    if (this._narTyping) {
      // Skip to end of current text
      if (this._narTimer) { clearTimeout(this._narTimer); this._narTimer = null; }
      setText(this._narTextEl, this._narCurrentText ?? '');
      this._narTyping = false;
      this._narFull   = true;
      if (this._narQueue.length > 0) {
        this._narTimer = setTimeout(() => this._dequeueNarrate(), 700);
      }
      this._updateMoreIndicator();
    } else if (this._narFull && this._narQueue.length > 0) {
      // Advance to next queued message
      if (this._narTimer) { clearTimeout(this._narTimer); this._narTimer = null; }
      this._narFull = false;
      this._dequeueNarrate();
    }
  }

  _updateMoreIndicator() {
    if (this._narQueue.length > 0) {
      show(this._narMoreEl);
    } else {
      hidden(this._narMoreEl);
    }
  }

  setRoomName(name) {
    setText(this._roomTextEl, name ?? '');
  }

  setScore(score, max, rank) {
    setText(this._scoreTextEl, `Score ${score}/${max}`);
    setText(this._scoreRankEl, rank ?? '');
  }

  setInventory(items, armedId) {
    this._items  = items ?? [];
    this._armed  = armedId ?? null;

    const chips = this._invChipsEl;
    chips.innerHTML = '';

    for (const item of this._items) {
      const chip = el('div', 'hud-inv-chip');
      if (item.type === 'treasure') chip.classList.add('treasure');
      if (item.id === this._armed)  chip.classList.add('armed');

      const icon = el('span', 'hud-inv-chip__icon');
      setText(icon, ITEM_ICONS[item.id] ?? ITEM_DEFAULT_ICON);

      const name = el('span', 'hud-inv-chip__name');
      setText(name, item.name ?? item.id);

      chip.appendChild(icon);
      chip.appendChild(name);

      // Single click: arm / disarm
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._armed === item.id) {
          this.disarm();
        } else {
          this._armed = item.id;
          this._refreshChips();
          this._cb.onItemArmed?.(item.id);
        }
      });

      // Double click: use on self
      chip.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        this._cb.onUseItemOnSelf?.(item.id);
      });

      chips.appendChild(chip);
    }
  }

  _refreshChips() {
    // Re-render armed state without full rebuild
    const chips = this._invChipsEl.querySelectorAll('.hud-inv-chip');
    let idx = 0;
    for (const chip of chips) {
      const item = this._items[idx++];
      if (!item) break;
      chip.classList.toggle('armed', item.id === this._armed);
    }
  }

  setLamp({ hasLantern, on, fuel, max, stage, hasTorch, torchLit }) {
    const hasAny = hasLantern || hasTorch;
    if (!hasAny) { hidden(this._lampEl); return; }
    show(this._lampEl);

    // Lantern
    this._lampBtn.style.display = hasLantern ? '' : 'none';
    this._lampGaugeWrap.style.display = hasLantern ? '' : 'none';

    if (hasLantern) {
      const pct = max > 0 ? clamp((fuel / max) * 100, 0, 100) : 0;
      this._lampGaugeBar.style.width = `${pct}%`;
      this._lampGaugeBar.setAttribute('data-stage', stage ?? (on ? 'bright' : 'off'));
      // Dim the lantern button icon when off
      this._lampBtn.style.opacity = (on && fuel > 0) ? '1' : '0.45';
    }

    // Torch
    this._torchBtn.style.display = hasTorch ? '' : 'none';
    if (hasTorch) {
      this._torchBtn.style.opacity = torchLit ? '1' : '0.45';
    }
  }

  get armedItem() { return this._armed; }

  disarm() {
    this._armed = null;
    this._refreshChips();
    this._cb.onItemArmed?.(null);
  }

  // ===================================================================
  // PUBLIC API — Verb coin
  // ===================================================================
  openVerbCoin(x, y, { objectId, name, verbs }) {
    this.closeVerbCoin();

    const wrap = this._vcWrap;
    // Remove old buttons
    while (wrap.firstChild) wrap.removeChild(wrap.firstChild);

    // Object name label
    const label = el('div', 'hud-verbcoin__label');
    setText(label, name ?? objectId);
    wrap.appendChild(label);

    // Fan the verb buttons in a semicircle beneath the label
    const allowedVerbs = VERBS.filter((v) => verbs.includes(v.id));
    const count = allowedVerbs.length;
    const radius = 64;
    // Spread from ~210° to ~330° (bottom fan, kept mostly below click point)
    const startAngle = -90 - ((count - 1) * 36) / 2;

    for (let i = 0; i < count; i++) {
      const v = allowedVerbs[i];
      const angleDeg = startAngle + i * 36;
      const rad = (angleDeg * Math.PI) / 180;
      const bx = Math.round(Math.cos(rad) * radius);
      const by = Math.round(Math.sin(rad) * radius);

      const btn = el('div', 'hud-verbcoin__btn');
      const iconEl = el('span', '');
      setText(iconEl, v.icon);
      const lbl = el('span', 'hud-verbcoin__btn-label');
      setText(lbl, v.label);
      btn.appendChild(iconEl);
      btn.appendChild(lbl);
      btn.style.left = `${bx}px`;
      btn.style.top  = `${by}px`;

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._cb.onVerb?.(v.id, objectId);
        this.closeVerbCoin();
      });

      wrap.appendChild(btn);
    }

    // Position the verb coin, clamping to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const safeX = clamp(x, 80, vw - 80);
    const safeY = clamp(y, 80, vh - 80);

    wrap.style.left = `${safeX}px`;
    wrap.style.top  = `${safeY}px`;
    show(wrap);
  }

  closeVerbCoin() {
    hidden(this._vcWrap);
  }

  // ===================================================================
  // PUBLIC API — Combat
  // ===================================================================
  showCombat() {
    this._combatActive = true;
    show(this._combatEl);
  }

  combatPrompt({ phase, round, trollHp, playerHp, windowMs = 1500 }) {
    // Update HP bars
    this._renderHp(this._yourHpEl, playerHp, 3, '❤️', '🩶');
    this._renderHp(this._trollHpEl, trollHp, 3, '💀', '🩶');

    // Reset QTE state
    this._combatPressed = false;
    this._combatExpired = false;
    if (this._combatTimerId) { clearInterval(this._combatTimerId); this._combatTimerId = null; }

    const isStrike = phase === 'strike';
    setText(this._qteIcon,  isStrike ? '⚔️' : '🛡️');
    setText(this._qteLabel, isStrike ? 'STRIKE!' : 'DODGE!');
    this._qteEl.setAttribute('data-phase', phase);
    show(this._qteEl);

    // Countdown ring via CSS custom property --progress
    const startTime = performance.now();
    this._qteEl.style.setProperty('--progress', '0%');

    this._combatTimerId = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = clamp((elapsed / windowMs) * 100, 0, 100);
      this._qteEl.style.setProperty('--progress', `${pct}%`);

      if (elapsed >= windowMs) {
        clearInterval(this._combatTimerId);
        this._combatTimerId = null;
        if (!this._combatPressed) {
          this._combatExpired = true;
          hidden(this._qteEl);
          this._cb.onCombatTimeout?.();
        }
      }
    }, 32);

    void round; // acknowledged (used for future difficulty scaling)
  }

  _onQteClick() {
    if (!this._combatActive) return;
    if (this._combatPressed || this._combatExpired) return;
    this._combatPressed = true;
    if (this._combatTimerId) { clearInterval(this._combatTimerId); this._combatTimerId = null; }
    hidden(this._qteEl);
    this._cb.onCombatPress?.();
  }

  combatFlash(kind) {
    const flash = this._flashEl;
    // Reset animation
    flash.className = 'hud-combat-flash';
    void flash.offsetWidth; // reflow

    switch (kind) {
      case 'hit-troll':
        flash.classList.add('flash-hit-troll');
        break;
      case 'hit-player':
        flash.classList.add('flash-hit-player');
        // Add shake to hud root
        this._root.classList.remove('hud-shake');
        void this._root.offsetWidth;
        this._root.classList.add('hud-shake');
        setTimeout(() => this._root.classList.remove('hud-shake'), 420);
        break;
      case 'miss':
        flash.classList.add('flash-miss');
        break;
      case 'dodge':
        flash.classList.add('flash-dodge');
        break;
    }
  }

  hideCombat() {
    this._combatActive = false;
    this._combatPressed = false;
    this._combatExpired = false;
    if (this._combatTimerId) { clearInterval(this._combatTimerId); this._combatTimerId = null; }
    hidden(this._combatEl);
    hidden(this._qteEl);
  }

  _renderHp(el, current, max, fullIcon, emptyIcon) {
    let s = '';
    for (let i = 0; i < max; i++) {
      s += i < current ? fullIcon : emptyIcon;
    }
    setText(el, s);
  }

  // ===================================================================
  // PUBLIC API — Death: The Grim Rewind
  // ===================================================================
  showDeath({ title, text, galleryCount, galleryTotal }) {
    if (this._deathTimer) { clearTimeout(this._deathTimer); this._deathTimer = null; }
    this._deathSkipAvail = false;
    this._deathPhase = 'flash';

    const wrap   = this._deathEl;
    const card   = this._deathCardEl;
    const flash  = this._deathFlashEl;
    const vhs    = this._deathVhsEl;

    // Reset
    wrap.style.opacity  = '0';
    card.style.opacity  = '0';
    card.style.transform = 'scale(0.95)';
    vhs.style.opacity   = '0';
    vhs.style.pointerEvents = 'none';
    setText(this._deathTitleEl, title ?? 'You Have Died');
    setText(this._deathTextEl,  '');
    this._deathCurrentText = text ?? '';
    setText(this._deathGallEl,  `Death Gallery: ${galleryCount}/${galleryTotal} collected`);

    flash.style.display = 'block';
    show(wrap);

    // Phase 1: red flash + fade-in container (0.6s)
    wrap.style.animation = 'death-fadein 0.6s ease forwards';
    this._deathTimer = setTimeout(() => {
      this._deathPhase = 'card';
      this._deathSkipAvail = true;
      wrap.style.opacity = '1';
      card.style.animation = 'death-card-in 0.45s ease forwards';

      // Typewrite the death text
      this._typewriteDeath(text ?? '', () => {
        // After text + 1.6s pause → VHS phase
        this._deathTimer = setTimeout(() => this._startVhsPhase(), 1600);
      });
    }, 620);
  }

  _typewriteDeath(text, onDone) {
    const el = this._deathTextEl;
    setText(el, '');
    // Time-based reveal: immune to setTimeout throttling.
    const start = performance.now();
    const tick = () => {
      const target = Math.min(text.length, Math.floor((performance.now() - start) / 22) + 1);
      el.textContent = text.slice(0, target);
      if (target >= text.length) { onDone(); return; }
      this._deathTimer = setTimeout(tick, 24);
    };
    this._deathCurrentText  = text;
    this._deathOnTypeDone   = onDone;
    this._deathTypewriting  = true;
    tick();
  }

  _deathSkip() {
    // A click anywhere during the flash or card phase fast-forwards to the rewind.
    if (this._deathPhase === 'flash' || this._deathPhase === 'card') {
      if (this._deathTimer) { clearTimeout(this._deathTimer); this._deathTimer = null; }
      setText(this._deathTextEl, this._deathCurrentText ?? '');
      this._deathTypewriting = false;
      this._startVhsPhase();
    }
  }

  _startVhsPhase() {
    this._deathPhase = 'vhs';
    this._deathSkipAvail = false;

    const vhs = this._deathVhsEl;
    vhs.style.opacity = '1';
    vhs.style.pointerEvents = 'none';

    // VHS phase lasts ~2.2s then fade out and call onRewindDone
    this._deathTimer = setTimeout(() => {
      // Fade out entire death screen
      this._deathEl.style.transition = 'opacity 0.5s ease';
      this._deathEl.style.opacity = '0';
      this._deathTimer = setTimeout(() => {
        hidden(this._deathEl);
        this._deathEl.style.transition = '';
        this._deathEl.style.opacity = '1';
        this._cb.onRewindDone?.();
      }, 520);
    }, 2200);
  }

  // ===================================================================
  // PUBLIC API — Darkness
  // ===================================================================
  setDarkness(level, threatening) {
    const l = clamp(level, 0, 1);
    // The radial mask goes from transparent center to full black at edges,
    // scaling linearly with level.
    this._darkMaskEl.style.setProperty('--darkness-level', String(l));
    this._darkMaskEl.style.setProperty('--darkness-edge', String(l * 0.7));

    if (threatening) {
      this._darkEyesEl.classList.add('visible');
      this._darkThreatEl.classList.add('visible');
      // Drift eyes slowly
      this._driftEyes(level);
    } else {
      this._darkEyesEl.classList.remove('visible');
      this._darkThreatEl.classList.remove('visible');
    }
  }

  _driftEyes(level) {
    if (!this._darkEyesEl.classList.contains('visible')) return;
    const eyes = this._darkEyesEl.querySelectorAll('.hud-darkness__eye');
    // Place in lower-center area, slightly off-center (where a crouching grue might lurk)
    const cx = window.innerWidth  * 0.5;
    const cy = window.innerHeight * 0.62;
    const spread = 18 + level * 10;

    if (eyes[0]) {
      eyes[0].style.left = `${cx - spread}px`;
      eyes[0].style.top  = `${cy}px`;
    }
    if (eyes[1]) {
      eyes[1].style.left = `${cx + spread - 10}px`;
      eyes[1].style.top  = `${cy + 2}px`;
    }
  }

  // ===================================================================
  // PUBLIC API — Toast
  // ===================================================================
  toast(text) {
    const t = el('div', 'hud-toast');
    setText(t, text ?? '');
    this._toastContainer.appendChild(t);
    setTimeout(() => {
      if (t.parentNode) t.parentNode.removeChild(t);
    }, 2200);
  }

  // ===================================================================
  // PUBLIC API — Mute visibility
  // ===================================================================
  setMuteVisible() {
    this._muteEl.style.display = '';
  }
}
