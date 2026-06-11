// SceneManager: owns the Three.js world — camera, lights, the current room
// diorama, the player avatar, input (walk + click), portals, and animation.
import * as THREE from 'three';
import { LAYOUTS, ENVS } from './rooms3d.js';
import * as P from './props.js';
import { PlayerAvatar } from './player.js';

const DIR_VEC = {
  north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0],
};
export const OPPOSITE = {
  north: 'south', south: 'north', east: 'west', west: 'east', up: 'down', down: 'up',
};

const PORTAL_TRIGGER = 1.15;
const PORTAL_RESET = 1.9;

export class SceneManager {
  // callbacks: { onObjectClicked(objectId, kind, clientX, clientY), onPortalEnter(dir) }
  constructor(canvas, callbacks = {}) {
    this.callbacks = callbacks;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(42, 1, 0.1, 200);
    this.cameraBase = new THREE.Vector3(0, 9.5, 11.5);
    this.cameraTarget = new THREE.Vector3(0, 0.8, 0);
    this.combatFocus = false;

    this.ambient = new THREE.AmbientLight(0xffffff, 0.8);
    this.sun = new THREE.DirectionalLight(0xfff2d8, 1.4);
    this.sun.position.set(6, 12, 7);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(1024, 1024);
    const sc = this.sun.shadow.camera;
    sc.left = -12; sc.right = 12; sc.top = 12; sc.bottom = -12;
    this.scene.add(this.ambient, this.sun, this.sun.target);

    this.avatar = new PlayerAvatar();
    this.scene.add(this.avatar.group);

    this.roomGroup = null;
    this.portals = new Map(); // dir -> {group, pos: Vector3, blocked}
    this.roomSize = [8, 6];
    this.roomId = null;
    this.layout = null;

    this.keys = new Set();
    this.walkTarget = null;
    this.moving = false;
    this.portalCooldown = new Set(); // dirs we must walk away from before they can trigger
    this.inputLocked = false;
    this.soundRingsActive = false;
    this.darkMode = { dark: false, hasLight: true, intensity: 1, torchLit: false };
    this._envColors = { ambient: new THREE.Color(), sun: new THREE.Color() };
    this._skyCache = new Map();
    this._raycaster = new THREE.Raycaster();
    this._pointer = new THREE.Vector2();
    this._hovered = null;
    this._clock = new THREE.Clock();
    this._t = 0;

    this._bindInput(canvas);
    this._resize();
    window.addEventListener('resize', () => this._resize());
  }

  _resize() {
    const w = window.innerWidth, h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  _bindInput(canvas) {
    window.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());

    canvas.addEventListener('pointermove', (e) => {
      this._pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    });
    canvas.addEventListener('pointerdown', (e) => {
      if (this.inputLocked) return;
      this._pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
      const hit = this._pick();
      if (hit?.objectId) {
        this.callbacks.onObjectClicked?.(hit.objectId, hit.kind, e.clientX, e.clientY, hit.point);
      } else if (hit?.floorPoint) {
        this.walkTarget = hit.floorPoint.clone();
      }
    });
  }

  _pick() {
    if (!this.roomGroup) return null;
    this._raycaster.setFromCamera(this._pointer, this.camera);
    const hits = this._raycaster.intersectObjects(this.roomGroup.children, true);
    for (const h of hits) {
      let o = h.object;
      while (o && o !== this.roomGroup) {
        if (o.userData.objectId) {
          return { objectId: o.userData.objectId, kind: o.userData.kind ?? 'scenery', point: h.point };
        }
        o = o.parent;
      }
      // First non-interactive hit that is roughly horizontal = walk there.
      if (h.point.y < 0.6) {
        const [rx, rz] = this.roomSize;
        const p = h.point.clone();
        p.x = THREE.MathUtils.clamp(p.x, -rx + 0.6, rx - 0.6);
        p.z = THREE.MathUtils.clamp(p.z, -rz + 0.6, rz - 0.6);
        p.y = 0;
        return { floorPoint: p };
      }
    }
    return null;
  }

  hoveredObjectId() {
    const hit = this._pick();
    return hit?.objectId ?? null;
  }

  // ---- room construction ----

  // view: { flags, treasureCount, items: [itemId], exits: {dir:{blocked}}, env }
  setRoom(roomId, view, spawnFromDir = null) {
    if (this.roomGroup) {
      this.scene.remove(this.roomGroup);
      this.roomGroup.traverse((o) => { o.geometry?.dispose?.(); });
    }
    this.roomId = roomId;
    this.layout = LAYOUTS[roomId];
    this.roomSize = this.layout.size;
    const group = this.layout.build({ flags: view.flags, treasureCount: view.treasureCount });

    // Floor items
    for (const itemId of view.items) {
      const spot = this.layout.itemSpots?.[itemId] ?? [0, 0];
      const h = this.layout.itemHeights?.[itemId] ?? 0;
      const prop = P.itemProp(itemId);
      prop.position.set(spot[0], h, spot[1]);
      prop.userData.kind = 'item';
      prop.traverse((o) => { o.userData.kind = 'item'; });
      group.add(prop);
    }

    // Portals
    this.portals.clear();
    for (const [dir, info] of Object.entries(view.exits)) {
      const pos = this._portalPos(dir);
      const kind = dir === 'up' || dir === 'down' ? 'ring' : 'arch';
      const portal = P.portal(dir, { blocked: info.blocked, kind });
      portal.position.set(pos.x, 0, pos.z);
      if (kind === 'arch') {
        const [dx, dz] = DIR_VEC[dir];
        portal.rotation.y = Math.atan2(dx, dz) + Math.PI;
      }
      group.add(portal);
      this.portals.set(dir, { group: portal, pos, blocked: info.blocked });
    }

    this.scene.add(group);
    this.roomGroup = group;
    this._applyEnv(ENVS[this.layout.env]);
    this._collectAnimated(group);

    // Spawn player
    let spawn = new THREE.Vector3(0, 0, this.roomSize[1] * 0.45);
    let face = Math.PI; // face north-ish (toward -z means rotation.y = PI given model faces +z)
    if (spawnFromDir && this.portals.has(spawnFromDir)) {
      const p = this.portals.get(spawnFromDir).pos.clone();
      const inward = p.clone().multiplyScalar(-1).setY(0);
      inward.normalize();
      spawn = p.add(inward.multiplyScalar(1.5));
      face = Math.atan2(inward.x, inward.z);
    }
    this.avatar.group.position.copy(spawn);
    this.avatar.group.position.y = 0;
    this.avatar.group.rotation.y = face;
    this.walkTarget = null;
    this.refreshPortalCooldown();
    // Snap camera to the new room
    this._updateCamera(1);
  }

  // Put every portal the player currently stands near on cooldown, so spawning
  // or being repositioned inside a portal's radius never triggers a move.
  refreshPortalCooldown() {
    this.portalCooldown.clear();
    const pos = this.avatar.group.position;
    for (const [dir, p] of this.portals) {
      if (Math.hypot(pos.x - p.pos.x, pos.z - p.pos.z) < PORTAL_RESET) {
        this.portalCooldown.add(dir);
      }
    }
  }

  _portalPos(dir) {
    const [rx, rz] = this.roomSize;
    const override = this.layout.portalPos?.[dir];
    if (override) return new THREE.Vector3(override[0], 0, override[1]);
    const [dx, dz] = DIR_VEC[dir] ?? [0, 0];
    return new THREE.Vector3(dx * (rx - 0.7), 0, dz * (rz - 0.7));
  }

  setPortalBlocked(dir, blocked) {
    const p = this.portals.get(dir);
    if (p) p.blocked = blocked;
  }

  _applyEnv(env) {
    const key = `${env.sky}-${env.skyBottom}`;
    if (!this._skyCache.has(key)) {
      const c = document.createElement('canvas');
      c.width = 2; c.height = 256;
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 0, 256);
      grad.addColorStop(0, `#${env.sky.toString(16).padStart(6, '0')}`);
      grad.addColorStop(1, `#${env.skyBottom.toString(16).padStart(6, '0')}`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 2, 256);
      const tex = new THREE.CanvasTexture(c);
      tex.colorSpace = THREE.SRGBColorSpace;
      this._skyCache.set(key, tex);
    }
    this.scene.background = this._skyCache.get(key);
    this.scene.fog = new THREE.Fog(env.fog, env.fogNear, env.fogFar);
    this._env = env;
    this._applyLightLevels();
  }

  // dark = room is dark; hasLight = player carries light; intensity 0..1
  setLightState({ dark, hasLight, intensity, torchLit, lampOn, hasLantern, hasSword }) {
    this.darkMode = { dark, hasLight, intensity, torchLit };
    this.avatar.setEquipment({
      sword: hasSword,
      lantern: hasLantern,
      lanternLit: lampOn && intensity > 0,
      torchLit,
      lightIntensity: intensity,
    });
    this._applyLightLevels();
  }

  _applyLightLevels() {
    if (!this._env) return;
    const env = this._env;
    const { dark, hasLight, intensity } = this.darkMode;
    if (!dark) {
      this.ambient.color.set(env.ambient);
      this.ambient.intensity = env.ambientIntensity;
      this.sun.color.set(env.sun);
      this.sun.intensity = env.sunIntensity;
    } else if (hasLight) {
      this.ambient.color.set(env.ambient);
      this.ambient.intensity = env.ambientIntensity * (0.55 + 0.6 * intensity);
      this.sun.color.set(env.sun);
      this.sun.intensity = env.sunIntensity * 0.55;
    } else {
      // Pitch black: the HUD overlay finishes the job; keep a whisper of shape.
      this.ambient.intensity = 0.035;
      this.sun.intensity = 0;
    }
  }

  setCombatFocus(on) { this.combatFocus = on; }
  lockInput(locked) { this.inputLocked = locked; if (locked) { this.keys.clear(); this.walkTarget = null; } }

  _collectAnimated(group) {
    this._animated = [];
    group.traverse((o) => {
      const u = o.userData;
      if (u.bob || u.flicker || u.sparkle || u.pulse || u.breathe || u.flutter || u.soundRing) {
        this._animated.push({ obj: o, base: o.position.y, baseScale: o.scale.x });
      }
    });
  }

  shake(strength = 0.25) { this._shake = strength; }

  // ---- per-frame ----
  update() {
    const dt = Math.min(this._clock.getDelta(), 0.05);
    this._t += dt;
    this._updatePlayer(dt);
    this._updateAnimations(dt);
    this._updateCamera(dt * 4.5);
    this._updateHoverCursor();
    this.renderer.render(this.scene, this.camera);
  }

  _updatePlayer(dt) {
    if (this.inputLocked) { this.avatar.update(dt, false); this.moving = false; return; }
    const pos = this.avatar.group.position;
    const dirV = new THREE.Vector3();
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) dirV.z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) dirV.z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) dirV.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) dirV.x += 1;

    let moving = false;
    if (dirV.lengthSq() > 0) {
      this.walkTarget = null;
      dirV.normalize().multiplyScalar(3.4 * dt);
      pos.add(dirV);
      this.avatar.group.rotation.y = lerpAngle(this.avatar.group.rotation.y, Math.atan2(dirV.x, dirV.z), 0.25);
      moving = true;
    } else if (this.walkTarget) {
      const to = this.walkTarget.clone().sub(pos); to.y = 0;
      const dist = to.length();
      if (dist < 0.12) {
        this.walkTarget = null;
      } else {
        to.normalize().multiplyScalar(Math.min(3.4 * dt, dist));
        pos.add(to);
        this.avatar.group.rotation.y = lerpAngle(this.avatar.group.rotation.y, Math.atan2(to.x, to.z), 0.25);
        moving = true;
      }
    }
    // Clamp to room bounds (elliptical-ish)
    const [rx, rz] = this.roomSize;
    pos.x = THREE.MathUtils.clamp(pos.x, -rx + 0.45, rx - 0.45);
    pos.z = THREE.MathUtils.clamp(pos.z, -rz + 0.45, rz - 0.45);
    this.moving = moving;
    this.avatar.update(dt, moving);

    // Portal proximity — portals only trigger for a player in motion.
    let nearAny = null;
    for (const [dir, p] of this.portals) {
      const d = Math.hypot(pos.x - p.pos.x, pos.z - p.pos.z);
      if (d > PORTAL_RESET) this.portalCooldown.delete(dir);
      else if (d < PORTAL_TRIGGER && !this.portalCooldown.has(dir)) nearAny = dir;
    }
    if (moving && nearAny) {
      this.portalCooldown.add(nearAny);
      this.walkTarget = null;
      this.callbacks.onPortalEnter?.(nearAny);
    }
  }

  bounceBack(dir) {
    // Pushed back from a blocked exit.
    const p = this.portals.get(dir);
    if (!p) return;
    const inward = p.pos.clone().multiplyScalar(-1).setY(0).normalize();
    this.avatar.group.position.add(inward.multiplyScalar(1.3));
    this.shake(0.18);
  }

  recenterPlayer() {
    this.avatar.group.position.set(0, 0, 0);
    this.walkTarget = null;
    this.refreshPortalCooldown();
  }

  _updateAnimations(dt) {
    for (const a of this._animated ?? []) {
      const u = a.obj.userData;
      if (u.bob) a.obj.position.y = a.base + Math.sin(this._t * 1.3 + u.bob.phase) * u.bob.amp;
      if (u.flicker) {
        const s = 0.9 + Math.sin(this._t * 17 + a.base * 7) * 0.12 + Math.sin(this._t * 31) * 0.06;
        a.obj.scale.set(a.baseScale * s, a.baseScale * (2 - s), a.baseScale * s);
      }
      if (u.sparkle) a.obj.rotation.y += dt * 1.2;
      if (u.pulse) {
        const s = 1 + Math.sin(this._t * 2.4) * 0.04;
        a.obj.scale.setScalar(s);
      }
      if (u.breathe) {
        const s = 1 + Math.sin(this._t * 1.8) * 0.02;
        a.obj.scale.y = s;
      }
      if (u.flutter) a.obj.rotation.y = Math.sin(this._t * 3.2) * 0.5;
      if (u.soundRing) {
        if (this.soundRingsActive) {
          a.obj.visible = true;
          const phase = (this._t * 0.7 + a.base) % 1;
          a.obj.scale.setScalar(0.4 + phase * a.baseScale * 1.6);
          if (a.obj.material) a.obj.material.opacity = 1 - phase;
        } else {
          a.obj.visible = false;
        }
      }
    }
  }

  _updateCamera(alpha) {
    const pos = this.avatar.group.position;
    const base = this.combatFocus
      ? new THREE.Vector3(pos.x * 0.4 + 1.5, 4.2, pos.z * 0.4 + 6)
      : this.cameraBase.clone().add(new THREE.Vector3(pos.x * 0.35, 0, pos.z * 0.22));
    const look = this.combatFocus
      ? new THREE.Vector3(1.8, 1.6, 0)
      : new THREE.Vector3(pos.x * 0.45, 0.9, pos.z * 0.3);
    if (this._shake && this._shake > 0.01) {
      base.x += (Math.random() - 0.5) * this._shake;
      base.y += (Math.random() - 0.5) * this._shake;
      this._shake *= 0.88;
    }
    this.camera.position.lerp(base, Math.min(alpha, 1));
    this.cameraTarget.lerp(look, Math.min(alpha, 1));
    this.camera.lookAt(this.cameraTarget);
    this.sun.target.position.copy(pos);
  }

  _updateHoverCursor() {
    const id = this.inputLocked ? null : this.hoveredObjectId();
    this.renderer.domElement.style.cursor = id ? 'pointer' : 'default';
    if (id !== this._hovered) this._hovered = id;
  }
}

function lerpAngle(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * t;
}
