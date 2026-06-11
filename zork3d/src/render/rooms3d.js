// rooms3d.js — per-room 3D layout definitions.
// Exports ENVS (environment settings) and LAYOUTS (one entry per room).
// build(view) returns a THREE.Group of all static scenery.
// Item props for floorItems are placed by the scene manager using itemSpots.

import * as THREE from 'three';
import * as P from './props.js';
import { tmesh, toon, rng } from './toon.js';

// ─── Helper: position an object and optionally rotate it ───────────────────
function at(obj, x, y, z, ry = 0) {
  obj.position.set(x, y, z);
  if (ry) obj.rotation.y = ry;
  return obj;
}

function group(...children) {
  const g = new THREE.Group();
  for (const c of children) g.add(c);
  return g;
}

// ─── Small inline prop builders ────────────────────────────────────────────

function barrel(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const body = tmesh(new THREE.CylinderGeometry(0.3, 0.28, 0.65, 10), 0x8a6a42);
  body.position.y = 0.32;
  g.add(body);
  for (const yy of [0.15, 0.32, 0.5]) {
    const hoop = tmesh(new THREE.CylinderGeometry(0.32, 0.32, 0.05, 10), 0x555a60, { outline: false });
    hoop.position.y = yy;
    g.add(hoop);
  }
  g.rotation.y = r() * Math.PI * 2;
  return g;
}

function bones(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const bone = tmesh(new THREE.CapsuleGeometry(0.04, 0.3 + r() * 0.2, 4, 6), 0xe8e2d0, { outline: false });
    bone.position.set((r() - 0.5) * 1.0, 0.02, (r() - 0.5) * 0.8);
    bone.rotation.y = r() * Math.PI * 2;
    bone.rotation.z = (r() - 0.5) * 0.5;
    g.add(bone);
  }
  return g;
}

function bloodStain(x, z, radius = 0.4) {
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(radius, 12),
    new THREE.MeshBasicMaterial({ color: 0x8a0f0f }),
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(x, 0.02, z);
  disc.userData.outline = false;
  return disc;
}

function standingStone(seed = 1) {
  const r = rng(seed);
  const g = new THREE.Group();
  const h = 1.0 + r() * 0.8;
  const stone = tmesh(new THREE.BoxGeometry(0.35 + r() * 0.15, h, 0.18 + r() * 0.12), 0x6a7090);
  stone.position.y = h / 2;
  g.add(stone);
  // rune dot
  const rune = tmesh(
    new THREE.SphereGeometry(0.06, 6, 6),
    0x52e0c8,
    { emissive: 0x52e0c8, emissiveIntensity: 0.8, outline: false },
  );
  rune.position.set(0, h * 0.55, 0.12);
  g.add(rune);
  return g;
}

function easel() {
  const g = new THREE.Group();
  const legColor = 0x8a6a42;
  // two front legs
  for (const sx of [-1, 1]) {
    const leg = tmesh(new THREE.BoxGeometry(0.06, 1.4, 0.06), legColor);
    leg.position.set(sx * 0.35, 0.7, 0);
    leg.rotation.z = sx * 0.18;
    g.add(leg);
  }
  // back leg
  const backLeg = tmesh(new THREE.BoxGeometry(0.06, 1.4, 0.06), legColor);
  backLeg.position.set(0, 0.7, 0.4);
  backLeg.rotation.x = -0.25;
  g.add(backLeg);
  // cross-bar
  const bar = tmesh(new THREE.BoxGeometry(0.78, 0.06, 0.06), legColor);
  bar.position.set(0, 0.85, 0);
  g.add(bar);
  return g;
}

function smallPedestal(color = 0x6e7390) {
  const g = new THREE.Group();
  const base = tmesh(new THREE.CylinderGeometry(0.22, 0.28, 0.12, 8), color);
  base.position.y = 0.06;
  const col = tmesh(new THREE.CylinderGeometry(0.13, 0.16, 0.36, 8), color);
  col.position.y = 0.30;
  const top = tmesh(new THREE.CylinderGeometry(0.2, 0.16, 0.07, 8), color);
  top.position.y = 0.52;
  g.add(base, col, top);
  return g;
}

// ─── Environment presets ───────────────────────────────────────────────────

export const ENVS = {
  outside:     { sky: 0x87c5e8, skyBottom: 0xd8ef9a, fog: 0xa8d4ec, fogNear: 18, fogFar: 55,  ambient: 0xbfd4e8, ambientIntensity: 0.9,  sun: 0xfff2d8, sunIntensity: 1.6  },
  house:       { sky: 0x3a3050, skyBottom: 0x6a5a40, fog: 0x2a2438, fogNear: 16, fogFar: 45,  ambient: 0xc8b090, ambientIntensity: 0.75, sun: 0xffd9a0, sunIntensity: 1.1  },
  underground: { sky: 0x0d0a18, skyBottom: 0x1d1535, fog: 0x0d0a18, fogNear: 14, fogFar: 40,  ambient: 0x6a7a9a, ambientIntensity: 0.42, sun: 0x9ab0d8, sunIntensity: 0.55 },
  maze:        { sky: 0x0a0812, skyBottom: 0x171028, fog: 0x0a0812, fogNear: 10, fogFar: 32,  ambient: 0x5a6a8a, ambientIntensity: 0.38, sun: 0x8aa0c8, sunIntensity: 0.45 },
};

// ─── Room layouts ──────────────────────────────────────────────────────────

export const LAYOUTS = {

  // ── Outside rooms ────────────────────────────────────────────────────────

  west_of_house: {
    size: [9, 7],
    env: 'outside',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [9, 7];
      g.add(P.islandBase(rx + 1, rz + 1, 0x6fbf5a));

      // House wall on the EAST edge, running north-south, door facing west
      const wall = P.houseWall(10, { door: true, boarded: true });
      wall.position.set(rx - 0.25, 0, 0);
      wall.rotation.y = -Math.PI / 2; // front normal points west (into play area)
      g.add(wall);

      // Mailbox
      const mb = P.mailbox();
      mb.position.set(-2, 0, 2);
      g.add(mb);

      // Trees around the rim
      const treeDefs = [
        [-7.5, -5, 1, 1.1], [7.5, -5, 2, 0.95], [-7, 5.5, 3, 1.2],
        [6, 6, 4, 1.0], [-5, -6, 5, 0.9], [4, -6.5, 6, 1.05],
      ];
      for (const [tx, tz, seed, sc] of treeDefs) {
        g.add(at(P.tree(seed, sc), tx, 0, tz));
      }
      return g;
    },
  },

  north_of_house: {
    size: [9, 6],
    env: 'outside',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [9, 6];
      g.add(P.islandBase(rx + 1, rz + 1, 0x6fbf5a));

      // House wall on the SOUTH edge, front facing north into the play area
      const wall = P.houseWall(10, { boarded: true });
      wall.position.set(0, 0, rz - 0.25);
      wall.rotation.y = Math.PI;
      g.add(wall);

      const treeDefs = [[-7, -4, 10, 1.1], [7, -4, 11, 1.0], [-6, 4, 12, 0.9], [5, 3, 13, 1.15]];
      for (const [tx, tz, seed, sc] of treeDefs) g.add(at(P.tree(seed, sc), tx, 0, tz));
      return g;
    },
  },

  south_of_house: {
    size: [9, 6],
    env: 'outside',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [9, 6];
      g.add(P.islandBase(rx + 1, rz + 1, 0x6fbf5a));

      // House wall on the NORTH edge, front facing south into the play area
      const wall = P.houseWall(10, { boarded: true });
      wall.position.set(0, 0, -(rz - 0.25));
      wall.rotation.y = 0;
      g.add(wall);

      const treeDefs = [[-7, 4, 20, 1.0], [7, 4, 21, 1.1], [-5, -4, 22, 0.95], [6, -3, 23, 1.05]];
      for (const [tx, tz, seed, sc] of treeDefs) g.add(at(P.tree(seed, sc), tx, 0, tz));
      return g;
    },
  },

  east_of_house: {
    size: [9, 7],
    env: 'outside',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [9, 7];
      g.add(P.islandBase(rx + 1, rz + 1, 0x6fbf5a));

      // House wall on the WEST edge, running north-south, window facing east
      const wall = P.houseWall(10, { window: true, windowOpen: !!view.flags.window_open });
      wall.position.set(-(rx - 0.25), 0, 0);
      wall.rotation.y = Math.PI / 2; // front normal points east (into play area)
      g.add(wall);

      const treeDefs = [
        [6, -5.5, 30, 1.1], [7.5, 4, 31, 1.0], [-5, -6, 32, 0.95], [4, 6, 33, 1.15],
      ];
      for (const [tx, tz, seed, sc] of treeDefs) g.add(at(P.tree(seed, sc), tx, 0, tz));
      return g;
    },
  },

  forest_path: {
    size: [10, 8],
    env: 'outside',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [10, 8];
      g.add(P.islandBase(rx + 1, rz + 1, 0x5aaa48));

      // The great tree prominently on the north side
      const gt = P.greatTree(!view.flags.egg_taken);
      gt.position.set(2.5, 0, -2);
      g.add(gt);

      // Many trees crowding the rim
      const treeDefs = [
        [-8, -6, 40, 1.3], [7, -5, 41, 1.1], [-7, 4, 42, 1.2], [8, 6, 43, 0.9],
        [-9, 0, 44, 1.0], [9, 0, 45, 1.15], [-6, -7, 46, 0.85], [5, 7, 47, 1.05],
        [0, -7.5, 48, 1.2], [-4, 7, 49, 0.95], [7, 2, 50, 1.0],
      ];
      for (const [tx, tz, seed, sc] of treeDefs) g.add(at(P.tree(seed, sc), tx, 0, tz));

      // Mushrooms for color
      g.add(at(P.mushroomCluster(51, 0xff8844), -3, 0, 2));
      g.add(at(P.mushroomCluster(52, 0x88eeaa), 5, 0, 4));
      return g;
    },
  },

  // ── House rooms ──────────────────────────────────────────────────────────

  kitchen: {
    size: [7, 6],
    env: 'house',
    portalPos: { up: [2, -3.5] },
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [w, d] = [14, 12];
      g.add(P.woodFloor(w, d));
      g.add(P.interiorWalls(w, d, 0xd9cfb8, { west: true, east: true, up: false, down: false }));

      // Table at center-north
      const tbl = P.table(1.8, 1.0, 0x9a7148);
      tbl.position.set(0, 0, -3);
      g.add(tbl);

      // Small food deco on table — bread loaf
      const bread = tmesh(new THREE.SphereGeometry(0.18, 8, 6).scale(1.5, 0.75, 1), 0xd4963a);
      bread.position.set(-0.35, 0.82, -3);
      g.add(bread);

      // Bottle
      const bottle = tmesh(new THREE.CylinderGeometry(0.06, 0.08, 0.28, 8), 0x5a9a5a);
      bottle.position.set(0.3, 0.89, -3);
      const bottleNeck = tmesh(new THREE.CylinderGeometry(0.03, 0.06, 0.12, 8), 0x5a9a5a);
      bottleNeck.position.set(0.3, 1.07, -3);
      g.add(bottle, bottleNeck);

      // Stairs up at portalPos.up
      const stairsUp = P.stairs('up');
      stairsUp.position.set(2, 0, -3.5);
      g.add(stairsUp);

      return g;
    },
  },

  living_room: {
    size: [8, 7],
    env: 'house',
    portalPos: { down: [0, 0.5] },
    itemSpots: {
      brass_lantern: [-2.5, 2.2],
      elvish_sword:  [-1.2, 2.2],
    },
    build(view) {
      const g = new THREE.Group();
      const [w, d] = [16, 14];
      g.add(P.woodFloor(w, d));

      // Openings: east to kitchen, west if cyclops_fled (wall breach), down is floor trap
      const openings = { east: true };
      if (view.flags.cyclops_fled) openings.west = true;
      g.add(P.interiorWalls(w, d, 0xd2c9b8, openings));

      // Fireplace against north wall
      const fp = P.fireplace();
      fp.position.set(-2, 0, -(d / 2 - 0.4));
      g.add(fp);

      // Trophy case in the north-east corner area
      const tc = P.trophyCase(view.treasureCount);
      tc.position.set(4.5, 0, -(d / 2 - 0.4));
      g.add(tc);

      // Rug center
      const rugG = P.rug(!!view.flags.rug_moved);
      rugG.position.set(0, 0, 0.5);
      g.add(rugG);

      // Trap door revealed when rug moved
      if (view.flags.rug_moved) {
        const td = P.trapDoor(!!view.flags.trap_door_open);
        td.position.set(0, 0, 0.5);
        g.add(td);
      }

      // Cyclops-shaped hole in west wall if cyclops fled
      if (view.flags.cyclops_fled) {
        const hole = P.holeInWall();
        hole.position.set(-(w / 2 - 0.2), 0, 0);
        hole.rotation.y = Math.PI / 2;
        g.add(hole);
      }

      return g;
    },
  },

  attic: {
    size: [6, 5],
    env: 'house',
    portalPos: { down: [0, 2] },
    itemSpots: {
      nasty_knife: [0.5, -0.5],
      rope:        [-0.8, -0.5],
    },
    build(view) {
      const g = new THREE.Group();
      const [w, d] = [12, 10];
      g.add(P.woodFloor(w, d, 0x8a6540));
      g.add(P.interiorWalls(w, d, 0xb8a890, {}));

      // Short rafter stubs along the north wall only — suggests a sloped roof
      // without putting a lid between the camera and the room.
      const beamColor = 0x7a5838;
      for (let i = 0; i < 5; i++) {
        const beam = tmesh(new THREE.BoxGeometry(0.16, 0.16, 1.6), beamColor);
        beam.position.set(-w * 0.4 + i * (w * 0.2), 3.0, -d / 2 + 0.9);
        beam.rotation.x = 0.6;
        g.add(beam);
      }

      // Dusty table
      const tbl = P.table(1.4, 0.9, 0x7a6040);
      tbl.position.set(0, 0, -1);
      g.add(tbl);

      // Cobweb-ish: thin stretched spheres in corners
      const cobColor = 0x8888a0;
      for (const [cx, cz] of [[-5, -4], [5, -4], [-5, 4]]) {
        const web = tmesh(new THREE.SphereGeometry(0.4, 6, 4).scale(1.6, 0.4, 1.6), cobColor, { outline: false });
        web.position.set(cx, 3.0, cz);
        g.add(web);
      }

      // Stairs ring for down portal
      const ring = tmesh(
        new THREE.TorusGeometry(0.9, 0.09, 8, 20),
        0x52e0d0,
        { emissive: 0x52e0d0, emissiveIntensity: 0.7, outline: false },
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.1, 2);
      g.add(ring);

      return g;
    },
  },

  // ── Underground rooms ─────────────────────────────────────────────────────

  cellar: {
    size: [7, 6],
    env: 'underground',
    portalPos: { up: [-2, 2.5] },
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [7, 6];
      g.add(P.caveFloor(rx, rz, 0x5a5e70));
      g.add(P.rockRing(rx, rz, 100, 0x474c63, { north: true, east: true, up: false }));

      // Stairs up to living room
      const stairsUp = P.stairs('up');
      stairsUp.position.set(-2, 0, 2.5);
      g.add(stairsUp);

      // Barrels
      for (const [bx, bz, seed] of [[-4, -2, 200], [3, -3, 201], [-3, 3, 202]]) {
        g.add(at(barrel(seed), bx, 0, bz));
      }

      // Mushroom clusters for color
      g.add(at(P.mushroomCluster(210, 0x52e0d0), 4, 0, 2));
      g.add(at(P.mushroomCluster(211, 0xc052e0), -5, 0, -1));

      return g;
    },
  },

  gallery: {
    size: [6, 6],
    env: 'underground',
    itemSpots: {
      painting: [0, -3],
    },
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [6, 6];
      g.add(P.caveFloor(rx, rz, 0x626075));
      g.add(P.rockRing(rx, rz, 110, 0x504e68, { west: true }));

      // Easel near north wall for the painting spot
      const ea = easel();
      ea.position.set(0, 0, -3.5);
      g.add(ea);

      // Mushrooms
      g.add(at(P.mushroomCluster(220, 0x52c8e0), 4, 0, 2));

      return g;
    },
  },

  troll_room: {
    size: [7, 6],
    env: 'underground',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [7, 6];
      g.add(P.caveFloor(rx, rz, 0x5a5060));
      g.add(P.rockRing(rx, rz, 120, 0x484059, { south: true, east: true }));

      if (!view.flags.troll_defeated) {
        // Troll blocks the EAST exit
        const troll = P.trollProp();
        troll.position.set(3.5, 0, 0);
        troll.rotation.y = -Math.PI / 4; // props face +z; angle it southwest toward the player
        g.add(troll);
      } else {
        // Blood stains
        g.add(bloodStain(3.5, 0, 0.5));
        g.add(bloodStain(2.8, 0.5, 0.3));
        g.add(bloodStain(4.0, -0.3, 0.4));
      }

      // Bones scattered either way
      g.add(at(bones(300), -2, 0, -1));
      g.add(at(bones(301), 1, 0, 2));

      // Mushrooms
      g.add(at(P.mushroomCluster(310, 0xe052a0), -4, 0, -2));

      return g;
    },
  },

  // ── Maze rooms (eerily identical — same seed, same rocks) ─────────────────

  maze_entrance: {
    size: [6, 6],
    env: 'maze',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [6, 6];
      const MAZE_SEED = 999; // same for all maze rooms
      g.add(P.caveFloor(rx, rz, 0x404050));
      g.add(P.rockRing(rx, rz, MAZE_SEED, 0x383448, { west: true, north: true, east: true, south: true }));

      // Identical interior rocks in ALL maze rooms
      const r = rng(MAZE_SEED);
      for (const [ix, iz] of [[-2.5, -2], [2, 2.5], [-1.5, 2.8]]) {
        const rock = tmesh(new THREE.DodecahedronGeometry(0.6 + r() * 0.4, 0), 0x3a3848);
        rock.position.set(ix, 0.3, iz);
        rock.rotation.set(r() * 2, r() * 2, r() * 2);
        g.add(rock);
      }

      g.add(at(P.mushroomCluster(MAZE_SEED + 1, 0x52e0a0), -3, 0, 0));
      return g;
    },
  },

  maze_2: {
    size: [6, 6],
    env: 'maze',
    itemSpots: {
      bag_of_coins: [2.5, 1],
      skeleton:     [2.5, 1],
    },
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [6, 6];
      const MAZE_SEED = 999;
      g.add(P.caveFloor(rx, rz, 0x404050));
      g.add(P.rockRing(rx, rz, MAZE_SEED, 0x383448, { south: true, east: true, north: true }));

      // Identical interior rocks
      const r = rng(MAZE_SEED);
      for (const [ix, iz] of [[-2.5, -2], [2, 2.5], [-1.5, 2.8]]) {
        const rock = tmesh(new THREE.DodecahedronGeometry(0.6 + r() * 0.4, 0), 0x3a3848);
        rock.position.set(ix, 0.3, iz);
        rock.rotation.set(r() * 2, r() * 2, r() * 2);
        g.add(rock);
      }

      // Skeleton slumped against east wall
      const skel = P.skeletonProp();
      skel.position.set(3.0, 0, 1);
      skel.rotation.y = Math.PI; // facing inward
      g.add(skel);

      g.add(at(P.mushroomCluster(MAZE_SEED + 1, 0x52e0a0), -3, 0, 0));
      return g;
    },
  },

  maze_3: {
    size: [6, 6],
    env: 'maze',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [6, 6];
      const MAZE_SEED = 999;
      g.add(P.caveFloor(rx, rz, 0x404050));
      g.add(P.rockRing(rx, rz, MAZE_SEED, 0x383448, { west: true, south: true, north: true }));

      // Identical interior rocks
      const r = rng(MAZE_SEED);
      for (const [ix, iz] of [[-2.5, -2], [2, 2.5], [-1.5, 2.8]]) {
        const rock = tmesh(new THREE.DodecahedronGeometry(0.6 + r() * 0.4, 0), 0x3a3848);
        rock.position.set(ix, 0.3, iz);
        rock.rotation.set(r() * 2, r() * 2, r() * 2);
        g.add(rock);
      }

      g.add(at(P.mushroomCluster(MAZE_SEED + 1, 0x52e0a0), -3, 0, 0));
      return g;
    },
  },

  maze_dead_end: {
    size: [5, 5],
    env: 'maze',
    itemSpots: {
      tattered_page: [0, -2.5],
    },
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [5, 5];
      const MAZE_SEED = 999;
      g.add(P.caveFloor(rx, rz, 0x404050));
      g.add(P.rockRing(rx, rz, MAZE_SEED, 0x383448, { south: true }));

      // Identical interior rocks
      const r = rng(MAZE_SEED);
      for (const [ix, iz] of [[-2.5, -2], [2, 2.5], [-1.5, 2.8]]) {
        const rock = tmesh(new THREE.DodecahedronGeometry(0.6 + r() * 0.4, 0), 0x3a3848);
        rock.position.set(ix, 0.3, iz);
        rock.rotation.set(r() * 2, r() * 2, r() * 2);
        g.add(rock);
      }

      // Claw marks on north wall rock area
      const cm = P.clawMarks();
      cm.position.set(0, 0, -rx + 0.2);
      cm.rotation.y = 0; // facing south (toward player)
      g.add(cm);

      g.add(at(P.mushroomCluster(MAZE_SEED + 1, 0x52e0a0), -2, 0, 2));
      return g;
    },
  },

  // ── Deep underground rooms ─────────────────────────────────────────────────

  round_room: {
    size: [7, 7],
    env: 'underground',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [7, 7];
      // Circular: rx == rz
      g.add(P.caveFloor(rx, rz, 0x585e78));
      g.add(P.rockRing(rx, rz, 400, 0x4a5070, { south: true, north: true, east: true, west: true }));

      // Ring of carved standing stones
      const stoneCount = 8;
      for (let i = 0; i < stoneCount; i++) {
        const a = (i / stoneCount) * Math.PI * 2;
        const sx = Math.sin(a) * (rx - 2);
        const sz = -Math.cos(a) * (rz - 2);
        const stone = standingStone(400 + i);
        stone.position.set(sx, 0, sz);
        stone.rotation.y = a; // face outward
        g.add(stone);
      }

      // Faint glowing ring on ceiling height ~5 — ancient carvings
      const ceilingRing = tmesh(
        new THREE.TorusGeometry(3.5, 0.12, 8, 40),
        0x52d8c8,
        { emissive: 0x52d8c8, emissiveIntensity: 0.7, outline: false },
      );
      ceilingRing.rotation.x = Math.PI / 2;
      ceilingRing.position.y = 5;
      ceilingRing.userData.objectId = 'ceiling_carvings';
      g.add(ceilingRing);

      // Inner ring also tagged
      const innerRing = tmesh(
        new THREE.TorusGeometry(1.8, 0.07, 6, 30),
        0x8080ff,
        { emissive: 0x8080ff, emissiveIntensity: 0.5, outline: false },
      );
      innerRing.rotation.x = Math.PI / 2;
      innerRing.position.y = 4.8;
      innerRing.userData.objectId = 'ceiling_carvings';
      g.add(innerRing);

      g.add(at(P.mushroomCluster(410, 0xd052e8), 4, 0, 3));
      g.add(at(P.mushroomCluster(411, 0x52e0c8), -4, 0, -2));
      return g;
    },
  },

  narrow_passage: {
    size: [3.5, 6],
    env: 'underground',
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [3.5, 6];
      g.add(P.caveFloor(rx, rz, 0x545870));
      // Narrow, claustrophobic — tight rock ring with openings only west and north
      g.add(P.rockRing(rx, rz, 500, 0x464060, { west: true, north: true }));

      // Extra inline walls to emphasize narrowness
      for (const sx of [-1, 1]) {
        const wallSlice = tmesh(new THREE.BoxGeometry(0.3, 3.5, rz * 2 - 2), 0x404060, { thickness: 0.01 });
        wallSlice.position.set(sx * (rx - 0.15), 1.75, 0);
        g.add(wallSlice);
      }

      g.add(at(P.mushroomCluster(510, 0x52c8e0), 0, 0, 3));
      return g;
    },
  },

  loud_room: {
    size: [7, 6],
    env: 'underground',
    portalPos: {},
    itemSpots: {
      platinum_bar: [0, -2.5],
    },
    itemHeights: {
      platinum_bar: 1.34,
    },
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [7, 6];
      g.add(P.caveFloor(rx, rz, 0x5a5e72));
      g.add(P.rockRing(rx, rz, 600, 0x4c5068, { east: true }));

      // Pedestal at center-north holding the platinum bar
      const ped = P.pedestal(0x6e7390);
      ped.position.set(0, 0, -2.5);
      g.add(ped);

      // Sound rings: 2-3 large emissive tori, scene manager animates when light is on
      const ringColors = [0x52d8f8, 0xa052f8, 0xf85252];
      for (let i = 0; i < 3; i++) {
        const sr = tmesh(
          new THREE.TorusGeometry(2.0 + i * 1.2, 0.07, 6, 32),
          ringColors[i],
          { emissive: ringColors[i], emissiveIntensity: 0.6, outline: false },
        );
        sr.rotation.x = Math.PI / 2;
        sr.position.y = 0.15 + i * 0.12;
        sr.userData.soundRing = true;
        g.add(sr);
      }

      g.add(at(P.mushroomCluster(610, 0x52e0d0), -4, 0, 2));
      g.add(at(P.mushroomCluster(611, 0xe052d0), 4, 0, 3));
      return g;
    },
  },

  cyclops_room: {
    size: [8, 7],
    env: 'underground',
    portalPos: { up: [-1, -3] },
    itemSpots: {},
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [8, 7];
      g.add(P.caveFloor(rx, rz, 0x5c5a6a));
      const wallOpenings = { south: true };
      if (view.flags.cyclops_fled) {
        wallOpenings.east = true;
        wallOpenings.up = true;
      }
      g.add(P.rockRing(rx, rz, 700, 0x4e4c60, wallOpenings));

      if (!view.flags.cyclops_fled) {
        // Cyclops guarding the stairs
        const cyc = P.cyclopsProp();
        cyc.position.set(2, 0, -2.6);
        cyc.scale.setScalar(0.82); // keep that single enormous eye in frame
        // props face +z (south, toward the camera) by default — no rotation needed
        g.add(cyc);
      } else {
        // Hole in EAST wall
        const hole = P.holeInWall();
        hole.position.set(rx - 0.2, 0, 0);
        hole.rotation.y = Math.PI / 2;
        g.add(hole);

        // Knocked-over chair (inline boxes)
        const chairColor = 0x7a5838;
        const seat = tmesh(new THREE.BoxGeometry(0.55, 0.08, 0.55), chairColor);
        seat.position.set(-3, 0.12, 2);
        seat.rotation.y = 0.7;
        const back = tmesh(new THREE.BoxGeometry(0.55, 0.6, 0.08), chairColor);
        back.position.set(-3, 0.3, 2.24);
        back.rotation.y = 0.7;
        g.add(seat, back);

        // Big footprint discs (oval = circle scaled on one axis)
        for (const [fx, fz] of [[-1, 1], [1, 0], [2.5, -1]]) {
          const fp = new THREE.Mesh(
            new THREE.CircleGeometry(0.32, 10),
            new THREE.MeshBasicMaterial({ color: 0x2a1a30 }),
          );
          fp.scale.set(1, 1, 0.6);
          fp.rotation.x = -Math.PI / 2;
          fp.position.set(fx, 0.02, fz);
          g.add(fp);
        }
      }

      // Stairs up behind/beside the cyclops position
      const stairsUp = P.stairs('up');
      stairsUp.position.set(-1, 0, -3);
      g.add(stairsUp);

      g.add(at(P.mushroomCluster(710, 0xe0c852), 4, 0, 3));

      return g;
    },
  },

  treasure_room: {
    size: [8, 7],
    env: 'underground',
    portalPos: { down: [0, 3] },
    itemSpots: {
      silver_chalice: [-1.5, -2],
      torch:          [2, 1],
    },
    itemHeights: {
      silver_chalice: 0.58,
    },
    build(view) {
      const g = new THREE.Group();
      const [rx, rz] = [8, 7];
      g.add(P.caveFloor(rx, rz, 0x6a6050));
      g.add(P.rockRing(rx, rz, 800, 0x585040, { down: true }));

      // Treasure heaps
      const heapPositions = [
        [-4, -2, 801, true],
        [3, -3, 802, true],
        [-2, 2, 803, false],
        [4, 1, 804, false],
        [0, -4, 805, true],
      ];
      for (const [hx, hz, hseed, big] of heapPositions) {
        const heap = P.treasureHeap(hseed, big);
        heap.position.set(hx, 0, hz);
        g.add(heap);
      }

      // Gold ambient glow
      const goldLight = new THREE.PointLight(0xffd700, 1.8, 12);
      goldLight.position.set(0, 2, 0);
      g.add(goldLight);

      // Small pedestal for silver_chalice
      const chalicePed = smallPedestal(0x8a8888);
      chalicePed.position.set(-1.5, 0, -2);
      g.add(chalicePed);

      // Stairs down ring
      const ring = tmesh(
        new THREE.TorusGeometry(0.9, 0.09, 8, 20),
        0x52e0d0,
        { emissive: 0x52e0d0, emissiveIntensity: 0.7, outline: false },
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.1, 3);
      g.add(ring);

      g.add(at(P.mushroomCluster(810, 0xe0c852), -5, 0, 3));
      g.add(at(P.mushroomCluster(811, 0xff5588), 5, 0, -1));

      return g;
    },
  },
};
