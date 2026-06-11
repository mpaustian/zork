// sound.js — synthesized audio for Zork 3D
// Pure Web Audio API, zero external assets, zero dependencies.
// All methods are safe no-ops before attach() is called.

export class GameAudio {
  constructor() {
    this._ctx = null;
    this._master = null;
    this._ambienceBus = null;
    this._sfxBus = null;

    this._region = null;
    this._regionNodes = [];       // active ambient nodes for current region
    this._regionTimeouts = [];    // scheduled random-event timeouts
    this._regionGain = null;      // main gain for current ambient bed (for crossfade)

    this._loudHumNodes = [];      // loud room hum nodes
    this._loudHumOn = false;

    this._muted = false;
    this._attached = false;

    // Shared noise buffer (created once on attach)
    this._noiseBuffer = null;
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────────

  attach() {
    if (this._attached) {
      // Resume if the browser suspended the context after a period of silence
      try { if (this._ctx && this._ctx.state === 'suspended') this._ctx.resume(); } catch (_) {}
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this._ctx = new AudioCtx();

      // Master gain
      this._master = this._ctx.createGain();
      this._master.gain.value = this._muted ? 0 : 1;
      this._master.connect(this._ctx.destination);

      // Ambience bus (quiet overall)
      this._ambienceBus = this._ctx.createGain();
      this._ambienceBus.gain.value = 0.25;
      this._ambienceBus.connect(this._master);

      // SFX bus
      this._sfxBus = this._ctx.createGain();
      this._sfxBus.gain.value = 1.0;
      this._sfxBus.connect(this._master);

      // Build shared noise buffer (2 seconds of white noise)
      this._noiseBuffer = this._buildNoiseBuffer(2);

      this._attached = true;

      // Re-apply region / hum if they were set before attach
      if (this._region) {
        const r = this._region;
        this._region = null;
        this.setRegion(r);
      }
      if (this._loudHumOn) {
        this._loudHumOn = false;
        this.setLoudRoomHum(true);
      }
    } catch (_) { /* silently fail — AudioContext unavailable */ }
  }

  // ── Master mute ──────────────────────────────────────────────────────────────

  setMuted(muted) {
    this._muted = !!muted;
    if (this._master) {
      const now = this._ctx.currentTime;
      this._master.gain.cancelScheduledValues(now);
      this._master.gain.setTargetAtTime(this._muted ? 0 : 1, now, 0.05);
    }
  }

  get muted() { return this._muted; }

  // ── Region ───────────────────────────────────────────────────────────────────

  setRegion(region) {
    if (region === this._region) return;
    this._region = region;
    if (!this._attached) return;

    // Fade out current ambient bed and cancel random schedulers
    this._teardownRegion();

    // Fade in new ambient bed
    this._startRegion(region);
  }

  _teardownRegion(fadeTime = 1.5) {
    // Cancel pending random-event timeouts
    for (const id of this._regionTimeouts) clearTimeout(id);
    this._regionTimeouts = [];

    // Fade out then disconnect existing nodes
    const now = this._ctx.currentTime;
    for (const node of this._regionNodes) {
      try {
        if (node._gainNode) {
          node._gainNode.gain.cancelScheduledValues(now);
          node._gainNode.gain.setTargetAtTime(0, now, fadeTime / 4);
        }
        // Stop oscillators / buffer sources after fade
        if (node.stop) {
          try { node.stop(now + fadeTime); } catch (_) {}
        }
      } catch (_) {}
    }
    this._regionNodes = [];
    this._regionGain = null;
  }

  _startRegion(region) {
    switch (region) {
      case 'outside':    this._startOutside();    break;
      case 'house':      this._startHouse();      break;
      case 'underground': this._startUnderground(); break;
      case 'maze':       this._startMaze();       break;
      default: break; // unknown region — silence is fine
    }
  }

  // ── Outside ──────────────────────────────────────────────────────────────────

  _startOutside() {
    const ctx = this._ctx;
    const bus = this._ambienceBus;
    const now = ctx.currentTime;

    // Wind: looping noise through a lowpass filter with a slow gain LFO
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this._noiseBuffer;
    noiseSource.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 400;
    lp.Q.value = 0.5;

    // Slow gain LFO for wind gusts (period ~4s)
    const windGain = ctx.createGain();
    windGain.gain.value = 0;

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.25;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;

    lfo.connect(lfoGain);
    lfoGain.connect(windGain.gain);

    noiseSource.connect(lp);
    lp.connect(windGain);
    windGain.connect(bus);

    noiseSource._gainNode = windGain;
    lfo.start(now);
    noiseSource.start(now);

    // Fade in base wind
    windGain.gain.setValueAtTime(0, now);
    windGain.gain.linearRampToValueAtTime(0.15, now + 1.5);

    lfo.start && void 0; // already started above

    this._regionNodes.push(noiseSource, lfo);

    // Schedule bird chirps
    this._scheduleBirdChirp();
  }

  _scheduleBirdChirp() {
    if (!this._attached) return;
    const delay = (3 + Math.random() * 6) * 1000; // 3–9 s
    const id = setTimeout(() => {
      this._removeTimeout(id);
      this._chirp();
      this._scheduleBirdChirp();
    }, delay);
    this._regionTimeouts.push(id);
  }

  _chirp() {
    if (!this._attached || this._region !== 'outside') return;
    const ctx = this._ctx;
    const now = ctx.currentTime;
    // Two-note descending chirp ~2.5-3.5 kHz
    const freqs = [2800 + Math.random() * 600, 2400 + Math.random() * 500];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, now + i * 0.05);
      g.gain.linearRampToValueAtTime(0.06, now + i * 0.05 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.08);
      osc.connect(g);
      g.connect(this._sfxBus);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.1);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
    });
  }

  // ── House ─────────────────────────────────────────────────────────────────────

  _startHouse() {
    const ctx = this._ctx;
    const bus = this._ambienceBus;
    const now = ctx.currentTime;

    // Room tone: brownish noise, lowpass 200 Hz
    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = this._noiseBuffer;
    noiseSource.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    lp.Q.value = 0.7;

    const roomGain = ctx.createGain();
    roomGain.gain.setValueAtTime(0, now);
    roomGain.gain.linearRampToValueAtTime(0.06, now + 1.5);

    noiseSource.connect(lp);
    lp.connect(roomGain);
    roomGain.connect(bus);

    noiseSource._gainNode = roomGain;
    noiseSource.start(now);
    this._regionNodes.push(noiseSource);

    // Schedule wood creaks
    this._scheduleCreak();
  }

  _scheduleCreak() {
    if (!this._attached) return;
    const delay = (8 + Math.random() * 12) * 1000; // 8–20 s
    const id = setTimeout(() => {
      this._removeTimeout(id);
      this._creak();
      this._scheduleCreak();
    }, delay);
    this._regionTimeouts.push(id);
  }

  _creak() {
    if (!this._attached || this._region !== 'house') return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const buf = ctx.createBufferSource();
    buf.buffer = this._noiseBuffer;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(300, now);
    lp.frequency.exponentialRampToValueAtTime(80, now + 0.25);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    buf.connect(lp);
    lp.connect(g);
    g.connect(this._sfxBus);
    buf.start(now);
    buf.stop(now + 0.35);
    buf.onended = () => { try { buf.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) {} };
  }

  // ── Underground ───────────────────────────────────────────────────────────────

  _startUnderground() {
    const ctx = this._ctx;
    const bus = this._ambienceBus;
    const now = ctx.currentTime;

    // Two detuned oscillators: 55 Hz and 82 Hz
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 82.3; // slight detune for beating

    // Slow tremolo
    const tremoloLFO = ctx.createOscillator();
    tremoloLFO.type = 'sine';
    tremoloLFO.frequency.value = 0.3;

    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.04;

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.18, now + 1.5);

    tremoloLFO.connect(tremoloGain);
    tremoloGain.connect(droneGain.gain);

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(bus);

    osc1._gainNode = droneGain;
    osc2._gainNode = droneGain;

    osc1.start(now);
    osc2.start(now);
    tremoloLFO.start(now);

    this._regionNodes.push(osc1, osc2, tremoloLFO);

    // Schedule drips
    this._scheduleDrip('underground');
  }

  _scheduleDrip(region) {
    if (!this._attached) return;
    const isMaze = region === 'maze';
    const minS = isMaze ? 4 : 2;
    const maxS = isMaze ? 10 : 6;
    const delay = (minS + Math.random() * (maxS - minS)) * 1000;
    const id = setTimeout(() => {
      this._removeTimeout(id);
      this._drip();
      this._scheduleDrip(region);
    }, delay);
    this._regionTimeouts.push(id);
  }

  _drip() {
    if (!this._attached) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const freq = 800 + Math.random() * 600; // 800–1400 Hz

    // Primary drip
    this._singleDrip(freq, now, 0.08);
    // Echo repeat
    this._singleDrip(freq * 0.97, now + 0.15, 0.04);
  }

  _singleDrip(freq, when, gain) {
    const ctx = this._ctx;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;

    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, when);
    g.gain.exponentialRampToValueAtTime(0.001, when + 0.18);

    osc.connect(g);
    g.connect(this._sfxBus);
    osc.start(when);
    osc.stop(when + 0.2);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
  }

  // ── Maze ──────────────────────────────────────────────────────────────────────

  _startMaze() {
    const ctx = this._ctx;
    const bus = this._ambienceBus;
    const now = ctx.currentTime;

    // Same two-osc drone but with more detune (unsettling beating)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 54;

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 83.5; // more detune = faster beating

    const tremoloLFO = ctx.createOscillator();
    tremoloLFO.type = 'sine';
    tremoloLFO.frequency.value = 0.18; // slower, more ominous

    const tremoloGain = ctx.createGain();
    tremoloGain.gain.value = 0.05;

    const droneGain = ctx.createGain();
    droneGain.gain.setValueAtTime(0, now);
    droneGain.gain.linearRampToValueAtTime(0.15, now + 1.5);

    tremoloLFO.connect(tremoloGain);
    tremoloGain.connect(droneGain.gain);

    osc1.connect(droneGain);
    osc2.connect(droneGain);
    droneGain.connect(bus);

    osc1._gainNode = droneGain;
    osc2._gainNode = droneGain;

    osc1.start(now);
    osc2.start(now);
    tremoloLFO.start(now);

    this._regionNodes.push(osc1, osc2, tremoloLFO);

    // Sparse drips
    this._scheduleDrip('maze');

    // Occasional distant skitter
    this._scheduleSkitter();
  }

  _scheduleSkitter() {
    if (!this._attached) return;
    const delay = (15 + Math.random() * 15) * 1000; // 15–30 s
    const id = setTimeout(() => {
      this._removeTimeout(id);
      this._skitter();
      this._scheduleSkitter();
    }, delay);
    this._regionTimeouts.push(id);
  }

  _skitter() {
    if (!this._attached || this._region !== 'maze') return;
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const count = 5 + Math.floor(Math.random() * 4); // 5–8 ticks
    for (let i = 0; i < count; i++) {
      const when = now + i * (0.04 + Math.random() * 0.03);
      const buf = ctx.createBufferSource();
      buf.buffer = this._noiseBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 6000 + Math.random() * 3000;
      bp.Q.value = 2;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.04, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.02);

      buf.connect(bp);
      bp.connect(g);
      g.connect(this._sfxBus);
      buf.start(when);
      buf.stop(when + 0.025);
      buf.onended = () => { try { buf.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {} };
    }
  }

  // ── Loud Room Hum ─────────────────────────────────────────────────────────────

  setLoudRoomHum(on) {
    this._loudHumOn = !!on;
    if (!this._attached) return;

    if (on) {
      this._startLoudHum();
    } else {
      this._stopLoudHum();
    }
  }

  _startLoudHum() {
    if (this._loudHumNodes.length > 0) return; // already running
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Sawtooth at 110 Hz through a bandpass with LFO-swept frequency
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 110;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 600;
    bp.Q.value = 8;

    // LFO sweeps bp frequency 300–1200 Hz, period ~2s
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 450; // ± 450 Hz around 600 → sweeps ~150–1050 Hz

    lfo.connect(lfoGain);
    lfoGain.connect(bp.frequency);

    const humGain = ctx.createGain();
    humGain.gain.setValueAtTime(0, now);
    humGain.gain.linearRampToValueAtTime(0.55, now + 0.8); // oppressive

    osc.connect(bp);
    bp.connect(humGain);
    humGain.connect(this._master); // bypass ambience bus — it's loud on purpose

    osc.start(now);
    lfo.start(now);

    this._loudHumNodes = [osc, lfo, bp, humGain, lfoGain];
  }

  _stopLoudHum() {
    if (this._loudHumNodes.length === 0) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Find the gain node (index 3) and fade it out
    const humGain = this._loudHumNodes[3];
    if (humGain && humGain.gain) {
      humGain.gain.cancelScheduledValues(now);
      humGain.gain.setTargetAtTime(0, now, 0.2);
    }
    const nodes = this._loudHumNodes;
    this._loudHumNodes = [];
    setTimeout(() => {
      for (const n of nodes) { try { if (n.stop) n.stop(); n.disconnect(); } catch (_) {} }
    }, 900);
  }

  // ── Stings ────────────────────────────────────────────────────────────────────

  sting(name) {
    if (!this._attached) return;
    try {
      switch (name) {
        case 'take':         this._stingTake();        break;
        case 'treasure':     this._stingTreasure();    break;
        case 'death':        this._stingDeath();       break;
        case 'rewind':       this._stingRewind();      break;
        case 'win':          this._stingWin();         break;
        case 'combat_hit':   this._stingCombatHit();   break;
        case 'combat_miss':  this._stingCombatMiss();  break;
        case 'combat_start': this._stingCombatStart(); break;
        case 'grue':         this._stingGrue();        break;
        case 'portal':       this._stingPortal();      break;
        case 'click':        this._stingClick();       break;
        case 'lamp_on':      this._stingLamp(true);    break;
        case 'lamp_off':     this._stingLamp(false);   break;
        default: break; // silently ignore unknown
      }
    } catch (_) { /* never throw */ }
  }

  _stingTake() {
    // Quick pluck: sine 600→900 Hz, 0.12s
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.linearRampToValueAtTime(900, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(g); g.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 0.13);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
  }

  _stingTreasure() {
    // Ascending major arpeggio C5 E5 G5 C6 + C7 shimmer, ~0.7s
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 2093]; // C5 E5 G5 C6 C7
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      const t = now + i * 0.12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(i === 4 ? 0.12 : 0.25, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      osc.connect(g); g.connect(this._sfxBus);
      osc.start(t); osc.stop(t + 0.38);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
    });
  }

  _stingDeath() {
    // Descending chromatic womp: sawtooth 220→55 Hz glide over 1.2s, lowpass closing
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(55, now + 1.2);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(2000, now);
    lp.frequency.exponentialRampToValueAtTime(80, now + 1.2);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.5, now);
    g.gain.setValueAtTime(0.5, now + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(lp); lp.connect(g); g.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 1.25);
    osc.onended = () => { try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) {} };
  }

  _stingRewind() {
    // Fast tape-rewind squeal: sine 400→2400→300 Hz, 1.0s, with flutter LFO
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.linearRampToValueAtTime(2400, now + 0.4);
    osc.frequency.linearRampToValueAtTime(300, now + 1.0);

    // Flutter: amplitude LFO at ~18 Hz
    const flutter = ctx.createOscillator();
    flutter.type = 'sine';
    flutter.frequency.value = 18;

    const flutterGain = ctx.createGain();
    flutterGain.gain.value = 0.1;
    flutter.connect(flutterGain);

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.3, now);
    g.gain.setValueAtTime(0.3, now + 0.8);
    g.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

    flutterGain.connect(g.gain);

    osc.connect(g); g.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 1.05);
    flutter.start(now); flutter.stop(now + 1.05);
    const cleanup = () => {
      try { osc.disconnect(); flutter.disconnect(); flutterGain.disconnect(); g.disconnect(); } catch (_) {}
    };
    osc.onended = cleanup;
  }

  _stingWin() {
    // Triumphant fanfare: 5 square-wave notes ~1.5s
    // Simple tune: C5 E5 G5 E5 C6 (ascending, with a bounce)
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 659.25, 1046.5, 1174.66]; // C5 E5 G5 E5 C6 D6
    const durations = [0.15, 0.15, 0.15, 0.15, 0.3, 0.3];
    let t = now;
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.18, t + 0.01);
      g.gain.setValueAtTime(0.18, t + durations[i] - 0.03);
      g.gain.linearRampToValueAtTime(0, t + durations[i]);
      osc.connect(g); g.connect(this._sfxBus);
      osc.start(t); osc.stop(t + durations[i] + 0.01);
      osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
      t += durations[i];
    });
  }

  _stingCombatHit() {
    // Punchy thud: lowpass noise burst + 90 Hz sine knock, 0.15s
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Low sine knock
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.5, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
    osc.connect(g1); g1.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 0.16);
    osc.onended = () => { try { osc.disconnect(); g1.disconnect(); } catch (_) {} };

    // Noise thud
    const buf = ctx.createBufferSource();
    buf.buffer = this._noiseBuffer;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 200;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.4, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    buf.connect(lp); lp.connect(g2); g2.connect(this._sfxBus);
    buf.start(now); buf.stop(now + 0.15);
    buf.onended = () => { try { buf.disconnect(); lp.disconnect(); g2.disconnect(); } catch (_) {} };
  }

  _stingCombatMiss() {
    // Whiff: short bandpass noise sweep down, 0.2s
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const buf = ctx.createBufferSource();
    buf.buffer = this._noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(1200, now);
    bp.frequency.exponentialRampToValueAtTime(300, now + 0.2);
    bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    buf.connect(bp); bp.connect(g); g.connect(this._sfxBus);
    buf.start(now); buf.stop(now + 0.22);
    buf.onended = () => { try { buf.disconnect(); bp.disconnect(); g.disconnect(); } catch (_) {} };
  }

  _stingCombatStart() {
    // Dramatic two-note brass-ish stab: detuned saws, 0.5s
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const freqs = [[220, 221.5], [330, 331.8]]; // two notes, each with two detuned saws
    freqs.forEach(([f1, f2], noteI) => {
      const t = now + noteI * 0.22;
      [f1, f2].forEach(freq => {
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = freq;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1800;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.22, t + 0.02);
        g.gain.setValueAtTime(0.22, t + 0.16);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
        osc.connect(lp); lp.connect(g); g.connect(this._sfxBus);
        osc.start(t); osc.stop(t + 0.25);
        osc.onended = () => { try { osc.disconnect(); lp.disconnect(); g.disconnect(); } catch (_) {} };
      });
    });
  }

  _stingGrue() {
    // Low growl: 1.2s, amplitude-modulated low noise + 45 Hz sine
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // 45 Hz sub sine
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 45;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.4, now + 0.15);
    g1.gain.setValueAtTime(0.4, now + 0.9);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc.connect(g1); g1.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 1.25);
    osc.onended = () => { try { osc.disconnect(); g1.disconnect(); } catch (_) {} };

    // Amplitude-modulated noise (growl texture)
    const buf = ctx.createBufferSource();
    buf.buffer = this._noiseBuffer;
    buf.loop = true;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 180;

    // AM at ~6 Hz
    const amLFO = ctx.createOscillator();
    amLFO.type = 'sine';
    amLFO.frequency.value = 6;
    const amGainMod = ctx.createGain();
    amGainMod.gain.value = 0.12;
    amLFO.connect(amGainMod);

    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.18, now + 0.1);
    g2.gain.setValueAtTime(0.18, now + 0.9);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    amGainMod.connect(g2.gain);

    buf.connect(lp); lp.connect(g2); g2.connect(this._sfxBus);
    amLFO.start(now); amLFO.stop(now + 1.25);
    buf.start(now); buf.stop(now + 1.25);
    buf.onended = () => { try { buf.disconnect(); lp.disconnect(); g2.disconnect(); amLFO.disconnect(); amGainMod.disconnect(); } catch (_) {} };
  }

  _stingPortal() {
    // Soft magical whoosh: filtered noise sweep up + faint sine gliss, 0.4s
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Noise sweep
    const buf = ctx.createBufferSource();
    buf.buffer = this._noiseBuffer;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(200, now);
    bp.frequency.exponentialRampToValueAtTime(3000, now + 0.4);
    bp.Q.value = 2;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0, now);
    g1.gain.linearRampToValueAtTime(0.2, now + 0.1);
    g1.gain.linearRampToValueAtTime(0, now + 0.4);
    buf.connect(bp); bp.connect(g1); g1.connect(this._sfxBus);
    buf.start(now); buf.stop(now + 0.42);
    buf.onended = () => { try { buf.disconnect(); bp.disconnect(); g1.disconnect(); } catch (_) {} };

    // Sine glissando
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0, now);
    g2.gain.linearRampToValueAtTime(0.1, now + 0.05);
    g2.gain.linearRampToValueAtTime(0, now + 0.4);
    osc.connect(g2); g2.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 0.42);
    osc.onended = () => { try { osc.disconnect(); g2.disconnect(); } catch (_) {} };
  }

  _stingClick() {
    // Tiny UI tick: 2ms noise + 1200 Hz blip, 0.05s
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const buf = ctx.createBufferSource();
    buf.buffer = this._noiseBuffer;
    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.15, now);
    g1.gain.exponentialRampToValueAtTime(0.001, now + 0.002);
    buf.connect(g1); g1.connect(this._sfxBus);
    buf.start(now); buf.stop(now + 0.003);
    buf.onended = () => { try { buf.disconnect(); g1.disconnect(); } catch (_) {} };

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 1200;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.12, now);
    g2.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
    osc.connect(g2); g2.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 0.06);
    osc.onended = () => { try { osc.disconnect(); g2.disconnect(); } catch (_) {} };
  }

  _stingLamp(on) {
    // Small metallic clink: triangle blip
    // lamp_on: ~1800 Hz, lamp_off: ~900 Hz
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const freq = on ? 1800 : 900;
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.7, now + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.25, now);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc.connect(g); g.connect(this._sfxBus);
    osc.start(now); osc.stop(now + 0.2);
    osc.onended = () => { try { osc.disconnect(); g.disconnect(); } catch (_) {} };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────────

  _buildNoiseBuffer(seconds) {
    const sampleRate = this._ctx.sampleRate;
    const length = Math.ceil(sampleRate * seconds);
    const buf = this._ctx.createBuffer(1, length, sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buf;
  }

  _removeTimeout(id) {
    const idx = this._regionTimeouts.indexOf(id);
    if (idx !== -1) this._regionTimeouts.splice(idx, 1);
  }
}
