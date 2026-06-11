// Procedural cartoon prop library. Everything is built from primitives with
// toon materials and fat outlines — no external assets.
import * as THREE from 'three';
import { tmesh, toon, textSprite, rng } from './toon.js';

const G = THREE; // brevity

function group(...children) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

function at(obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z);
  if (ry) obj.rotation.y = ry;
  return obj;
}

// ---------- terrain ----------

export function islandBase(radiusX, radiusZ, topColor, dirtColor = 0x6b4a3a) {
  const g = new THREE.Group();
  // Top slab
  const top = new THREE.Mesh(
    new G.CylinderGeometry(1, 0.93, 0.5, 28).scale(radiusX, 1, radiusZ),
    toon(topColor),
  );
  top.position.y = -0.25;
  top.receiveShadow = true;
  g.add(top);
  // Chunky dirt underside, tapering — the "floating diorama" look.
  const dirt = new THREE.Mesh(
    new G.CylinderGeometry(0.93, 0.35, 2.6, 22).scale(radiusX, 1, radiusZ),
    toon(dirtColor),
  );
  dirt.position.y = -1.8;
  g.add(dirt);
  const tip = new THREE.Mesh(
    new G.ConeGeometry(0.36, 1.6, 18).scale(radiusX, 1, radiusZ),
    toon(dirtColor),
  );
  tip.rotation.x = Math.PI;
  tip.position.y = -3.9;
  g.add(tip);
  // A few floating rock chunks beneath, for whimsy.
  const r = rng(radiusX * 1000 + radiusZ);
  for (let i = 0; i < 4; i++) {
    const rock = tmesh(new G.DodecahedronGeometry(0.25 + r() * 0.3), dirtColor);
    rock.position.set((r() - 0.5) * radiusX * 1.6, -3.4 - r() * 1.8, (r() - 0.5) * radiusZ * 1.6);
    rock.userData.bob = { phase: r() * Math.PI * 2, amp: 0.12 + r() * 0.1 };
    g.add(rock);
  }
  return g;
}

// ---------- vegetation ----------

export function tree(seed = 1, scale = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const trunk = tmesh(new G.CylinderGeometry(0.14, 0.22, 1.2, 7), 0x7a5238);
  trunk.position.y = 0.6;
  g.add(trunk);
  const greens = [0x3f9e4d, 0x35854a, 0x55b35a];
  let y = 1.3;
  for (let i = 0; i < 3; i++) {
    const s = (1.1 - i * 0.28) * (0.9 + r() * 0.25);
    const blob = tmesh(new G.IcosahedronGeometry(s * 0.75, 1), greens[i % 3]);
    blob.position.set((r() - 0.5) * 0.3, y, (r() - 0.5) * 0.3);
    g.add(blob);
    y += s * 0.62;
  }
  g.scale.setScalar(scale);
  return g;
}

export function greatTree(eggVisible) {
  const g = new THREE.Group();
  const trunk = tmesh(new G.CylinderGeometry(0.45, 0.75, 4.2, 9), 0x6b4530);
  trunk.position.y = 2.1;
  g.add(trunk);
  // A judgmental face in the bark? No — just bark. Knots.
  for (const [x, y] of [[0.45, 1.4], [-0.4, 2.3]]) {
    const knot = tmesh(new G.SphereGeometry(0.13, 6, 6), 0x5a3826);
    knot.position.set(x, y, 0.45);
    g.add(knot);
  }
  let yy = 4.0;
  for (const s of [2.0, 1.6, 1.1]) {
    const blob = tmesh(new G.IcosahedronGeometry(s, 1), 0x2f7a40);
    blob.position.y = yy;
    g.add(blob);
    yy += s * 0.7;
  }
  if (eggVisible) {
    // Nest + glinting egg high in the branches.
    const nest = tmesh(new G.TorusGeometry(0.35, 0.13, 8, 14), 0x8a6a42);
    nest.rotation.x = Math.PI / 2;
    nest.position.set(0.9, 4.6, 0.7);
    g.add(nest);
    const egg = tmesh(new G.SphereGeometry(0.26, 10, 10).scale(1, 1.3, 1), 0xf3d34a, { emissive: 0xb8860b, emissiveIntensity: 0.45 });
    egg.position.set(0.9, 4.85, 0.7);
    egg.userData.sparkle = true;
    g.add(egg);
  }
  return g;
}

export function mushroomCluster(seed, color = 0x52e0d0) {
  const r = rng(seed);
  const g = new THREE.Group();
  const n = 2 + Math.floor(r() * 3);
  for (let i = 0; i < n; i++) {
    const h = 0.18 + r() * 0.3;
    const stem = tmesh(new G.CylinderGeometry(0.04, 0.06, h, 6), 0xd8d0c0);
    const cap = tmesh(new G.SphereGeometry(h * 0.55, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2), color, { emissive: color, emissiveIntensity: 0.6 });
    stem.position.y = h / 2;
    cap.position.y = h;
    const m = group(stem, cap);
    m.position.set((r() - 0.5) * 0.7, 0, (r() - 0.5) * 0.7);
    g.add(m);
  }
  return g;
}

// ---------- architecture ----------

export function houseWall(width, { door = false, window: win = false, windowOpen = false, boarded = true } = {}) {
  const g = new THREE.Group();
  const wall = tmesh(new G.BoxGeometry(width, 4.2, 0.5), 0xf2ead8, { thickness: 0.012 });
  wall.position.y = 2.1;
  g.add(wall);
  // Roof line
  const roof = tmesh(new G.BoxGeometry(width + 0.8, 0.5, 1.4), 0xa84f3f);
  roof.position.y = 4.45;
  g.add(roof);
  const trim = tmesh(new G.BoxGeometry(width, 0.35, 0.62), 0xd9cfb8);
  trim.position.y = 0.2;
  g.add(trim);
  if (door) {
    const doorM = tmesh(new G.BoxGeometry(1.3, 2.4, 0.18), 0x7a4a2e);
    doorM.position.set(0, 1.2, 0.3);
    doorM.userData.objectId = 'front_door';
    g.add(doorM);
    if (boarded) {
      for (const [y, rz] of [[1.6, 0.3], [1.0, -0.25], [0.5, 0.18]]) {
        const board = tmesh(new G.BoxGeometry(1.7, 0.22, 0.1), 0xb08d5e);
        board.position.set(0, y, 0.42);
        board.rotation.z = rz;
        board.userData.objectId = 'front_door';
        g.add(board);
      }
    }
  }
  if (win) {
    const frame = tmesh(new G.BoxGeometry(1.2, 1.2, 0.2), 0x8a6a42);
    frame.position.set(0, 1.6, 0.28);
    frame.userData.objectId = 'window';
    g.add(frame);
    const glassCol = windowOpen ? 0x251c38 : 0xbfe3ee;
    const glass = tmesh(new G.BoxGeometry(0.95, windowOpen ? 0.2 : 0.95, 0.1), glassCol, { outline: false });
    glass.position.set(0, windowOpen ? 2.05 : 1.6, 0.34);
    glass.userData.objectId = 'window';
    g.add(glass);
    if (windowOpen) {
      // Open hole with fluttering curtain
      const hole = tmesh(new G.BoxGeometry(0.95, 0.95, 0.06), 0x16121f, { outline: false });
      hole.position.set(0, 1.55, 0.32);
      hole.userData.objectId = 'window';
      g.add(hole);
      const curtain = tmesh(new G.PlaneGeometry(0.4, 0.8), 0xfff4f4, { outline: false });
      curtain.material = toon(0xfdf3e3, { noCache: true });
      curtain.material.side = THREE.DoubleSide;
      curtain.position.set(-0.25, 1.55, 0.4);
      curtain.userData.flutter = true;
      g.add(curtain);
    } else {
      const bars = tmesh(new G.BoxGeometry(0.08, 0.95, 0.12), 0x8a6a42, { outline: false });
      bars.position.set(0, 1.6, 0.36);
      g.add(bars);
    }
  }
  for (const m of [wall, roof, trim]) m.userData.objectId = 'white_house';
  return g;
}

export function mailbox() {
  const g = new THREE.Group();
  const post = tmesh(new G.CylinderGeometry(0.06, 0.08, 0.9, 7), 0x7a5238);
  post.position.y = 0.45;
  const box = tmesh(new G.BoxGeometry(0.55, 0.4, 0.38), 0x4a7fd4);
  box.position.y = 1.05;
  const lid = tmesh(new G.CylinderGeometry(0.19, 0.19, 0.55, 10, 1, false, 0, Math.PI), 0x3a6cba);
  lid.rotation.z = Math.PI / 2;
  lid.position.y = 1.25;
  const flag = tmesh(new G.BoxGeometry(0.06, 0.3, 0.12), 0xe04444);
  flag.position.set(0.32, 1.3, 0);
  flag.name = 'flag';
  g.add(post, box, lid, flag);
  g.traverse((o) => { o.userData.objectId = 'mailbox'; });
  return g;
}

export function woodFloor(w, d, color = 0xb98d5e) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new G.BoxGeometry(w, 0.3, d), toon(color));
  base.position.y = -0.15;
  base.receiveShadow = true;
  g.add(base);
  // plank lines
  const lineMat = toon(0x9a7148);
  for (let x = -w / 2 + 1; x < w / 2; x += 1.4) {
    const line = new THREE.Mesh(new G.BoxGeometry(0.05, 0.02, d), lineMat);
    line.position.set(x, 0.02, 0);
    line.raycast = () => {};
    g.add(line);
  }
  return g;
}

export function interiorWalls(w, d, color, openings = {}) {
  // Walls with gaps where exits are. openings: {north:true,...}
  const g = new THREE.Group();
  const h = 3.4, t = 0.4;
  const make = (len) => tmesh(new G.BoxGeometry(len, h, t), color, { thickness: 0.01 });
  const gap = 2.4;
  const sides = [
    ['north', 0, -d / 2, 0, w],
    ['south', 0, d / 2, 0, w],
    ['east', w / 2, 0, Math.PI / 2, d],
    ['west', -w / 2, 0, Math.PI / 2, d],
  ];
  for (const [dir, x, z, ry, len] of sides) {
    if (openings[dir]) {
      const seg = (len - gap) / 2;
      for (const sgn of [-1, 1]) {
        const wallSeg = make(seg);
        const off = sgn * (gap / 2 + seg / 2);
        wallSeg.position.set(x + (ry ? 0 : off), h / 2, z + (ry ? off : 0));
        wallSeg.rotation.y = ry;
        g.add(wallSeg);
      }
      // lintel above the gap
      const lin = make(gap);
      lin.position.set(x, h - 0.3, z);
      lin.rotation.y = ry;
      lin.scale.y = 0.18;
      g.add(lin);
    } else {
      const wall = make(len);
      wall.position.set(x, h / 2, z);
      wall.rotation.y = ry;
      g.add(wall);
    }
  }
  return g;
}

export function caveFloor(rx, rz, color = 0x5e6378) {
  const disc = new THREE.Mesh(new G.CylinderGeometry(1, 0.94, 0.5, 24).scale(rx, 1, rz), toon(color));
  disc.position.y = -0.25;
  disc.receiveShadow = true;
  return disc;
}

export function rockRing(rx, rz, seed, color = 0x474c63, openings = {}) {
  // Irregular boulders around the perimeter, with gaps at exits.
  const g = new THREE.Group();
  const r = rng(seed);
  const n = 26;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dx = Math.sin(a), dz = -Math.cos(a); // a=0 -> north
    const dir =
      Math.abs(dz) > Math.abs(dx) ? (dz < 0 ? 'north' : 'south') : (dx > 0 ? 'east' : 'west');
    if (openings[dir] && Math.abs(Math.abs(dz) > Math.abs(dx) ? dx : dz) < 0.34) continue;
    const s = 0.9 + r() * 1.4;
    const rock = tmesh(new G.DodecahedronGeometry(s, 0), color, { thickness: 0.02 });
    rock.position.set(dx * rx, s * 0.5, dz * rz);
    rock.rotation.set(r() * 3, r() * 3, r() * 3);
    rock.scale.y = 1.3 + r();
    g.add(rock);
  }
  // stalactites hanging in the void above
  for (let i = 0; i < 5; i++) {
    const st = tmesh(new G.ConeGeometry(0.18 + r() * 0.2, 1 + r() * 1.5, 6), color);
    st.rotation.x = Math.PI;
    st.position.set((r() - 0.5) * rx * 1.6, 4.5 + r() * 1.5, (r() - 0.5) * rz * 1.6);
    st.userData.bob = { phase: r() * 6, amp: 0.05 };
    g.add(st);
  }
  return g;
}

export function stairs(direction /* 'up' | 'down' */, color = 0x8a6a42) {
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const step = tmesh(new G.BoxGeometry(1.6, 0.18, 0.5), color);
    if (direction === 'up') step.position.set(0, 0.1 + i * 0.22, -i * 0.42);
    else step.position.set(0, 0.1 - i * 0.1, -i * 0.42);
    g.add(step);
  }
  if (direction === 'down') {
    const hole = new THREE.Mesh(new G.CircleGeometry(1.5, 20), new THREE.MeshBasicMaterial({ color: 0x0d0a14 }));
    hole.rotation.x = -Math.PI / 2;
    hole.position.y = 0.03;
    g.add(hole);
  }
  return g;
}

// ---------- furniture & set dressing ----------

export function table(w = 1.6, d = 1, color = 0x9a7148) {
  const g = new THREE.Group();
  const top = tmesh(new G.BoxGeometry(w, 0.12, d), color);
  top.position.y = 0.75;
  g.add(top);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const leg = tmesh(new G.BoxGeometry(0.1, 0.75, 0.1), color);
    leg.position.set(sx * (w / 2 - 0.1), 0.37, sz * (d / 2 - 0.1));
    g.add(leg);
  }
  return g;
}

export function fireplace() {
  const g = new THREE.Group();
  const body = tmesh(new G.BoxGeometry(2.6, 2.4, 0.7), 0x8d7b6a);
  body.position.y = 1.2;
  const hearth = tmesh(new G.BoxGeometry(1.4, 1.1, 0.5), 0x2a2030, { outline: false });
  hearth.position.set(0, 0.55, 0.18);
  const mantel = tmesh(new G.BoxGeometry(2.9, 0.18, 0.9), 0x6f5a40);
  mantel.position.y = 2.0;
  const fire = tmesh(new G.ConeGeometry(0.35, 0.7, 7), 0xff9a3c, { emissive: 0xff6a00, emissiveIntensity: 0.9, outline: false });
  fire.position.set(0, 0.45, 0.2);
  fire.userData.flicker = true;
  g.add(body, hearth, mantel, fire);
  return g;
}

export function trophyCase(treasureCount) {
  const g = new THREE.Group();
  const body = tmesh(new G.BoxGeometry(2.4, 2.2, 0.7), 0x6f4f2f);
  body.position.y = 1.1;
  g.add(body);
  const glass = tmesh(new G.BoxGeometry(2.0, 1.7, 0.55), 0xa9d8e8, { transparent: true, opacity: 0.35, outline: false });
  glass.position.set(0, 1.2, 0.12);
  g.add(glass);
  for (let i = 0; i < 2; i++) {
    const shelf = tmesh(new G.BoxGeometry(2.0, 0.06, 0.5), 0x8a6a42, { outline: false });
    shelf.position.set(0, 0.85 + i * 0.6, 0.1);
    g.add(shelf);
  }
  // Treasures appear inside as they are placed.
  const spots = [[-0.7, 0.95], [0, 0.95], [0.7, 0.95], [-0.4, 1.55], [0.4, 1.55]];
  const colors = [0xf3d34a, 0x7ec8e3, 0xd4af37, 0xe8e8f0, 0xc0c0cc];
  for (let i = 0; i < Math.min(treasureCount, 5); i++) {
    const t = tmesh(new G.IcosahedronGeometry(0.16, 0), colors[i], { emissive: colors[i], emissiveIntensity: 0.5 });
    t.position.set(spots[i][0], spots[i][1], 0.12);
    t.userData.sparkle = true;
    g.add(t);
  }
  if (treasureCount >= 5) {
    const glow = new THREE.PointLight(0xffd700, 2.2, 6);
    glow.position.set(0, 1.3, 0.6);
    g.add(glow);
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'trophy_case'; });
  return g;
}

export function rug(moved) {
  const g = new THREE.Group();
  if (!moved) {
    const r = tmesh(new G.BoxGeometry(2.6, 0.08, 1.8), 0xa83232, { thickness: 0.02 });
    r.position.y = 0.06;
    const border = tmesh(new G.BoxGeometry(2.2, 0.09, 1.4), 0xd4af37, { outline: false });
    border.position.y = 0.065;
    const inner = tmesh(new G.BoxGeometry(1.8, 0.1, 1.0), 0x8a2828, { outline: false });
    inner.position.y = 0.07;
    // the suspicious lump
    const lump = tmesh(new G.SphereGeometry(0.34, 8, 6).scale(1.4, 0.5, 1), 0xa83232, { outline: false });
    lump.position.set(0.3, 0.12, 0.1);
    g.add(r, border, inner, lump);
  } else {
    const rolled = tmesh(new G.CylinderGeometry(0.3, 0.3, 1.8, 10), 0xa83232);
    rolled.rotation.x = Math.PI / 2;
    rolled.position.set(-2.6, 0.3, 0.2);
    const swirl = tmesh(new G.CylinderGeometry(0.16, 0.16, 1.82, 10), 0xd4af37, { outline: false });
    swirl.rotation.x = Math.PI / 2;
    swirl.position.copy(rolled.position);
    g.add(rolled, swirl);
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'oriental_rug'; });
  return g;
}

export function trapDoor(open) {
  const g = new THREE.Group();
  const frame = tmesh(new G.BoxGeometry(1.7, 0.12, 1.7), 0x6f4f2f);
  frame.position.y = 0.05;
  g.add(frame);
  if (open) {
    const hole = new THREE.Mesh(new G.BoxGeometry(1.3, 0.05, 1.3), new THREE.MeshBasicMaterial({ color: 0x0d0a14 }));
    hole.position.y = 0.1;
    g.add(hole);
    const lid = tmesh(new G.BoxGeometry(1.3, 0.1, 1.3), 0x8a6a42);
    lid.position.set(0, 0.6, -0.85);
    lid.rotation.x = -Math.PI / 2.4;
    g.add(lid);
  } else {
    const lid = tmesh(new G.BoxGeometry(1.3, 0.1, 1.3), 0x8a6a42);
    lid.position.y = 0.12;
    const handle = tmesh(new G.TorusGeometry(0.12, 0.04, 6, 12), 0x444444);
    handle.rotation.x = Math.PI / 2;
    handle.position.set(0.4, 0.2, 0);
    g.add(lid, handle);
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'trap_door'; });
  return g;
}

export function paintingProp() {
  const g = new THREE.Group();
  const frame = tmesh(new G.BoxGeometry(1.5, 1.1, 0.1), 0xd4af37);
  // a tiny pastoral scene: sky, hill, smiling cow(ish blob)
  const sky = tmesh(new G.BoxGeometry(1.26, 0.86, 0.04), 0x9ad7f0, { outline: false });
  sky.position.z = 0.06;
  const hill = tmesh(new G.SphereGeometry(0.55, 10, 8).scale(1.3, 0.5, 0.2), 0x67c06a, { outline: false });
  hill.position.set(0, -0.3, 0.09);
  const cow = tmesh(new G.SphereGeometry(0.09, 6, 5), 0xffffff, { outline: false });
  cow.position.set(0.2, -0.15, 0.12);
  g.add(frame, sky, hill, cow);
  g.position.y = 1.3;
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'painting'; });
  return g;
}

export function pedestal(color = 0x6e7390) {
  const g = new THREE.Group();
  const base = tmesh(new G.CylinderGeometry(0.55, 0.7, 0.3, 10), color);
  base.position.y = 0.15;
  const column = tmesh(new G.CylinderGeometry(0.32, 0.4, 0.9, 10), color);
  column.position.y = 0.75;
  const top = tmesh(new G.CylinderGeometry(0.5, 0.4, 0.18, 10), color);
  top.position.y = 1.25;
  g.add(base, column, top);
  return g;
}

export function skeletonProp() {
  const g = new THREE.Group();
  const bone = 0xe8e2d0;
  const skull = tmesh(new G.SphereGeometry(0.22, 10, 8), bone);
  skull.position.set(0, 0.62, 0.1);
  for (const sx of [-1, 1]) {
    const eye = tmesh(new G.SphereGeometry(0.05, 6, 6), 0x16121f, { outline: false });
    eye.position.set(sx * 0.08, 0.65, 0.28);
    g.add(eye);
  }
  const ribs = tmesh(new G.CapsuleGeometry(0.18, 0.3, 4, 8), bone);
  ribs.position.y = 0.28;
  ribs.rotation.z = 0.3;
  const arm = tmesh(new G.CapsuleGeometry(0.05, 0.4, 4, 6), bone);
  arm.position.set(0.3, 0.25, 0.15);
  arm.rotation.z = -1.2;
  const legs = tmesh(new G.CapsuleGeometry(0.06, 0.5, 4, 6), bone);
  legs.position.set(0.1, 0.1, 0.35);
  legs.rotation.x = 1.4;
  g.add(skull, ribs, arm, legs);
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'skeleton'; });
  return g;
}

export function trollProp() {
  const g = new THREE.Group();
  const skin = 0x6da352, dark = 0x55813f;
  const body = tmesh(new G.CapsuleGeometry(0.65, 0.8, 6, 12), skin);
  body.position.y = 1.1;
  const belly = tmesh(new G.SphereGeometry(0.5, 10, 8), 0x8abf6e);
  belly.position.set(0, 0.95, 0.3);
  const head = tmesh(new G.SphereGeometry(0.45, 12, 10), skin);
  head.position.y = 2.15;
  const jaw = tmesh(new G.BoxGeometry(0.6, 0.25, 0.4), dark);
  jaw.position.set(0, 1.95, 0.2);
  for (const sx of [-1, 1]) {
    const eye = tmesh(new G.SphereGeometry(0.1, 8, 8), 0xfff2c8, { outline: false });
    eye.position.set(sx * 0.18, 2.25, 0.36);
    const pupil = tmesh(new G.SphereGeometry(0.045, 6, 6), 0x16121f, { outline: false });
    pupil.position.set(sx * 0.18, 2.25, 0.45);
    const ear = tmesh(new G.ConeGeometry(0.12, 0.4, 6), skin);
    ear.rotation.z = sx * -1.4;
    ear.position.set(sx * 0.5, 2.3, 0);
    const tusk = tmesh(new G.ConeGeometry(0.06, 0.2, 6), 0xfff8e7, { outline: false });
    tusk.position.set(sx * 0.18, 2.0, 0.38);
    g.add(eye, pupil, ear, tusk);
    const arm = tmesh(new G.CapsuleGeometry(0.18, 0.7, 4, 8), skin);
    arm.position.set(sx * 0.75, 1.3, 0);
    arm.rotation.z = sx * 0.5;
    const leg = tmesh(new G.CapsuleGeometry(0.2, 0.4, 4, 8), dark);
    leg.position.set(sx * 0.3, 0.35, 0);
    g.add(arm, leg);
  }
  // the infamous axe
  const haft = tmesh(new G.CylinderGeometry(0.05, 0.05, 1.5, 7), 0x7a5238);
  haft.position.set(1.15, 1.5, 0);
  haft.rotation.z = 0.4;
  const blade = tmesh(new G.CylinderGeometry(0.35, 0.35, 0.08, 12, 1, false, 0, Math.PI), 0xb8bcc8);
  blade.rotation.z = Math.PI / 2 + 0.4;
  blade.position.set(1.45, 2.2, 0);
  const blood = tmesh(new G.CylinderGeometry(0.36, 0.36, 0.06, 12, 1, false, 0.4, Math.PI * 0.5), 0xa32222, { outline: false });
  blood.rotation.z = Math.PI / 2 + 0.4;
  blood.position.set(1.45, 2.2, 0);
  g.add(body, belly, head, jaw, haft, blade, blood);
  g.userData.breathe = true;
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'troll'; });
  return g;
}

export function cyclopsProp() {
  const g = new THREE.Group();
  const skin = 0xc98a5b, dark = 0xa9714a;
  const body = tmesh(new G.CapsuleGeometry(1.05, 1.3, 6, 14), skin);
  body.position.y = 1.9;
  const head = tmesh(new G.SphereGeometry(0.75, 14, 12), skin);
  head.position.y = 3.6;
  // THE eye
  const eyeWhite = tmesh(new G.SphereGeometry(0.3, 12, 10), 0xfff8e7, { outline: false });
  eyeWhite.position.set(0, 3.7, 0.58);
  const iris = tmesh(new G.SphereGeometry(0.15, 8, 8), 0x3a7a3a, { outline: false });
  iris.position.set(0, 3.7, 0.82);
  const pupil = tmesh(new G.SphereGeometry(0.07, 6, 6), 0x16121f, { outline: false });
  pupil.position.set(0, 3.7, 0.93);
  pupil.name = 'pupil';
  const lid = tmesh(new G.SphereGeometry(0.32, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3), skin);
  lid.position.set(0, 3.78, 0.56);
  lid.rotation.x = -0.5;
  const mouth = tmesh(new G.BoxGeometry(0.5, 0.12, 0.2), 0x6b3a2a, { outline: false });
  mouth.position.set(0, 3.2, 0.62);
  const horn = tmesh(new G.ConeGeometry(0.14, 0.45, 7), 0xe8e2d0);
  horn.position.set(0, 4.35, 0);
  g.add(body, head, eyeWhite, iris, pupil, lid, mouth, horn);
  for (const sx of [-1, 1]) {
    const arm = tmesh(new G.CapsuleGeometry(0.3, 1.1, 4, 10), skin);
    arm.position.set(sx * 1.25, 2.2, 0);
    arm.rotation.z = sx * 0.4;
    const leg = tmesh(new G.CapsuleGeometry(0.32, 0.7, 4, 10), dark);
    leg.position.set(sx * 0.5, 0.6, 0);
    const ear = tmesh(new G.ConeGeometry(0.16, 0.5, 6), skin);
    ear.rotation.z = sx * -1.5;
    ear.position.set(sx * 0.8, 3.7, 0);
    g.add(arm, leg, ear);
  }
  g.userData.breathe = true;
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'cyclops'; });
  return g;
}

export function treasureHeap(seed, big = false) {
  const r = rng(seed);
  const g = new THREE.Group();
  const s = big ? 1.4 : 1;
  const mound = tmesh(new G.SphereGeometry(0.9 * s, 10, 8).scale(1.3, 0.55, 1), 0xd4af37, { emissive: 0x8a6a00, emissiveIntensity: 0.25 });
  mound.position.y = 0.3 * s;
  g.add(mound);
  const gemColors = [0xe05252, 0x52c8e0, 0x8a52e0, 0x52e07a];
  for (let i = 0; i < 5; i++) {
    const gem = tmesh(new G.OctahedronGeometry(0.14 * s, 0), gemColors[i % 4], { emissive: gemColors[i % 4], emissiveIntensity: 0.5 });
    gem.position.set((r() - 0.5) * 1.6 * s, 0.55 * s + r() * 0.2, (r() - 0.5) * 1.1 * s);
    gem.userData.sparkle = true;
    g.add(gem);
  }
  g.traverse((o) => { if (o.isMesh) o.userData.objectId = 'treasure_heaps'; });
  return g;
}

export function clawMarks() {
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const mark = tmesh(new G.BoxGeometry(0.06, 1.1, 0.05), 0x2a2436, { outline: false });
    mark.position.set(-0.3 + i * 0.2, 1.4, 0);
    mark.rotation.z = 0.15;
    g.add(mark);
  }
  g.traverse((o) => { o.userData.objectId = 'claw_marks'; });
  return g;
}

// ---------- carryable item props (world representation) ----------

export function itemProp(id) {
  const g = new THREE.Group();
  const add = (...ms) => g.add(...ms);
  switch (id) {
    case 'brass_lantern': {
      const body = tmesh(new G.CylinderGeometry(0.16, 0.2, 0.35, 10), 0xc9a227);
      body.position.y = 0.25;
      const top = tmesh(new G.ConeGeometry(0.16, 0.15, 10), 0xa8861f);
      top.position.y = 0.5;
      const handle = tmesh(new G.TorusGeometry(0.12, 0.025, 6, 12), 0xa8861f);
      handle.position.y = 0.6;
      const glassG = tmesh(new G.CylinderGeometry(0.11, 0.13, 0.2, 8), 0xfff2c8, { emissive: 0xffc84a, emissiveIntensity: 0.7, outline: false });
      glassG.position.y = 0.27;
      add(body, top, handle, glassG);
      break;
    }
    case 'elvish_sword': {
      const blade = tmesh(new G.BoxGeometry(0.07, 0.85, 0.02), 0xbfe3ee, { emissive: 0x4a9fd4, emissiveIntensity: 0.6 });
      blade.position.y = 0.65;
      const guard = tmesh(new G.BoxGeometry(0.28, 0.05, 0.06), 0xd4af37);
      guard.position.y = 0.23;
      const grip = tmesh(new G.CylinderGeometry(0.035, 0.035, 0.2, 7), 0x5a3826);
      grip.position.y = 0.12;
      add(blade, guard, grip);
      break;
    }
    case 'nasty_knife': {
      const blade = tmesh(new G.ConeGeometry(0.05, 0.4, 5), 0xb8bcc8);
      blade.position.y = 0.32;
      const grip = tmesh(new G.CylinderGeometry(0.035, 0.04, 0.16, 6), 0x2a2436);
      grip.position.y = 0.08;
      add(blade, grip);
      break;
    }
    case 'rope': {
      const coil = tmesh(new G.TorusGeometry(0.22, 0.07, 8, 14), 0xc8a96a);
      coil.rotation.x = Math.PI / 2;
      coil.position.y = 0.08;
      const coil2 = tmesh(new G.TorusGeometry(0.18, 0.06, 8, 14), 0xb8975a);
      coil2.rotation.x = Math.PI / 2;
      coil2.position.y = 0.18;
      add(coil, coil2);
      break;
    }
    case 'tattered_page':
    case 'leaflet': {
      const page = tmesh(new G.PlaneGeometry(0.34, 0.44), 0xf5ecd7);
      page.material = toon(0xf5ecd7, { noCache: true });
      page.material.side = THREE.DoubleSide;
      page.rotation.x = -Math.PI / 2 + 0.25;
      page.position.y = 0.05;
      for (let i = 0; i < 3; i++) {
        const line = tmesh(new G.PlaneGeometry(0.22, 0.025), 0x6b5a40, { outline: false });
        line.material.side = THREE.DoubleSide;
        line.rotation.copy(page.rotation);
        line.position.set(0, 0.06 + i * 0.004, -0.1 + i * 0.12);
        g.add(line);
      }
      add(page);
      break;
    }
    case 'jewel_encrusted_egg': {
      const egg = tmesh(new G.SphereGeometry(0.22, 10, 10).scale(1, 1.3, 1), 0xf3d34a, { emissive: 0xb8860b, emissiveIntensity: 0.4 });
      egg.position.y = 0.28;
      egg.userData.sparkle = true;
      add(egg);
      break;
    }
    case 'painting':
      return paintingProp();
    case 'bag_of_coins': {
      const bag = tmesh(new G.SphereGeometry(0.26, 8, 8).scale(1, 1.15, 1), 0x8a6a42);
      bag.position.y = 0.26;
      const tie = tmesh(new G.CylinderGeometry(0.07, 0.1, 0.12, 7), 0x6b4f30);
      tie.position.y = 0.55;
      const coin = tmesh(new G.CylinderGeometry(0.06, 0.06, 0.02, 8), 0xd4af37, { emissive: 0x8a6a00, emissiveIntensity: 0.4 });
      coin.position.set(0.22, 0.04, 0.12);
      coin.rotation.x = Math.PI / 2;
      add(bag, tie, coin);
      break;
    }
    case 'platinum_bar': {
      const bar = tmesh(new G.BoxGeometry(0.55, 0.2, 0.26), 0xe4e8f0, { emissive: 0x8a90a8, emissiveIntensity: 0.35 });
      bar.position.y = 0.12;
      bar.userData.sparkle = true;
      add(bar);
      break;
    }
    case 'silver_chalice': {
      const cup = tmesh(new G.CylinderGeometry(0.18, 0.1, 0.26, 10), 0xd8dce8, { emissive: 0x6a7088, emissiveIntensity: 0.35 });
      cup.position.y = 0.42;
      const stem = tmesh(new G.CylinderGeometry(0.04, 0.06, 0.22, 8), 0xc8ccd8);
      stem.position.y = 0.2;
      const foot = tmesh(new G.CylinderGeometry(0.13, 0.15, 0.06, 10), 0xc8ccd8);
      foot.position.y = 0.05;
      cup.userData.sparkle = true;
      add(cup, stem, foot);
      break;
    }
    case 'torch': {
      const stick = tmesh(new G.CylinderGeometry(0.05, 0.07, 0.5, 7), 0x7a5238);
      stick.position.y = 0.25;
      stick.rotation.z = 0.15;
      const flame = tmesh(new G.ConeGeometry(0.13, 0.3, 7), 0xff9a3c, { emissive: 0xff6a00, emissiveIntensity: 0.9, outline: false });
      flame.position.set(-0.08, 0.62, 0);
      flame.userData.flicker = true;
      add(stick, flame);
      break;
    }
    default: {
      const blob = tmesh(new G.IcosahedronGeometry(0.2, 0), 0xcccccc);
      blob.position.y = 0.2;
      add(blob);
    }
  }
  g.traverse((o) => { o.userData.objectId = id; });
  return g;
}

// ---------- exits ----------

const DIR_LABEL = { north: 'N', south: 'S', east: 'E', west: 'W', up: 'UP', down: 'DOWN' };

export function portal(dir, { blocked = false, kind = 'arch' } = {}) {
  const g = new THREE.Group();
  const col = blocked ? 0xe05252 : 0x52e0d0;
  if (kind === 'arch') {
    const arch = tmesh(new G.TorusGeometry(1.0, 0.13, 8, 18, Math.PI), col, { emissive: col, emissiveIntensity: 0.55 });
    arch.position.y = 0.1;
    g.add(arch);
    for (const sx of [-1, 1]) {
      const post = tmesh(new G.CylinderGeometry(0.12, 0.16, 1.0, 8), col, { emissive: col, emissiveIntensity: 0.4 });
      post.position.set(sx, 0.5, 0);
      g.add(post);
    }
  } else {
    // up/down: a glowing ring on the ground
    const ring = tmesh(new G.TorusGeometry(0.9, 0.09, 8, 20), col, { emissive: col, emissiveIntensity: 0.7 });
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.1;
    g.add(ring);
  }
  const label = textSprite(DIR_LABEL[dir] ?? dir, { color: blocked ? '#ffb0b0' : '#d8fff8' });
  label.position.y = kind === 'arch' ? 1.9 : 1.3;
  g.add(label);
  g.userData.portalDir = dir;
  g.userData.pulse = true;
  return g;
}

export function holeInWall() {
  // A cyclops-shaped hole. The silhouette is quite detailed. You can make out the panic.
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0x0d0a14 });
  const body = new THREE.Mesh(new G.CapsuleGeometry(0.9, 1.2, 6, 12), mat);
  body.position.y = 1.6;
  const head = new THREE.Mesh(new G.SphereGeometry(0.65, 12, 10), mat);
  head.position.y = 3.0;
  for (const sx of [-1, 1]) {
    const arm = new THREE.Mesh(new G.CapsuleGeometry(0.28, 1.0, 4, 8), mat);
    arm.position.set(sx * 1.1, 2.2, 0);
    arm.rotation.z = sx * 1.1; // arms up, fleeing
    g.add(arm);
  }
  g.add(body, head);
  return g;
}

export { group, at };
