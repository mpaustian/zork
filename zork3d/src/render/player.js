// The adventurer: a plucky cartoon hero built from primitives.
// Articulated for a bouncy walk cycle; carries a lantern light and a back sword.
import * as THREE from 'three';
import { tmesh } from './toon.js';

export class PlayerAvatar {
  constructor() {
    const g = new THREE.Group();
    this.group = g;

    // Legs (pivot at hip)
    this.legL = this._leg(); this.legL.position.set(-0.13, 0.42, 0);
    this.legR = this._leg(); this.legR.position.set(0.13, 0.42, 0);
    g.add(this.legL, this.legR);

    // Body: a sturdy adventuring coat
    this.body = new THREE.Group();
    const coat = tmesh(new THREE.CapsuleGeometry(0.26, 0.34, 6, 12), 0x8a5a30);
    coat.position.y = 0.25;
    const belt = tmesh(new THREE.CylinderGeometry(0.27, 0.28, 0.08, 12), 0x4a3320);
    belt.position.y = 0.1;
    const buckle = tmesh(new THREE.BoxGeometry(0.1, 0.07, 0.04), 0xd4af37, { outline: false });
    buckle.position.set(0, 0.1, 0.27);
    const collar = tmesh(new THREE.CylinderGeometry(0.2, 0.28, 0.12, 10), 0xa9714a);
    collar.position.y = 0.48;
    this.body.add(coat, belt, buckle, collar);
    this.body.position.y = 0.55;
    g.add(this.body);

    // Arms
    this.armL = this._arm(); this.armL.position.set(-0.3, 0.5, 0);
    this.armR = this._arm(); this.armR.position.set(0.3, 0.5, 0);
    this.body.add(this.armL, this.armR);

    // Head
    this.head = new THREE.Group();
    const skull = tmesh(new THREE.SphereGeometry(0.24, 14, 12), 0xf0bf94);
    for (const sx of [-1, 1]) {
      const eye = tmesh(new THREE.SphereGeometry(0.05, 8, 8), 0xffffff, { outline: false });
      eye.position.set(sx * 0.09, 0.04, 0.2);
      const pupil = tmesh(new THREE.SphereGeometry(0.022, 6, 6), 0x16121f, { outline: false });
      pupil.position.set(sx * 0.09, 0.04, 0.245);
      this.head.add(eye, pupil);
    }
    const nose = tmesh(new THREE.SphereGeometry(0.05, 8, 8), 0xe8ab7e, { outline: false });
    nose.position.set(0, -0.02, 0.24);
    // The Hat. Every adventurer needs The Hat.
    const brim = tmesh(new THREE.CylinderGeometry(0.36, 0.38, 0.05, 14), 0x4a6a35);
    brim.position.y = 0.16;
    const crown = tmesh(new THREE.CylinderGeometry(0.17, 0.22, 0.2, 12), 0x4a6a35);
    crown.position.y = 0.28;
    const band = tmesh(new THREE.CylinderGeometry(0.225, 0.225, 0.06, 12), 0xa83232, { outline: false });
    band.position.y = 0.2;
    this.head.add(skull, nose, brim, crown, band);
    this.head.position.y = 1.18;
    g.add(this.head);

    // Backpack
    const pack = tmesh(new THREE.BoxGeometry(0.3, 0.34, 0.18), 0x6b4a3a);
    pack.position.set(0, 0.3, -0.3);
    this.body.add(pack);

    // Sword on back (hidden until taken)
    this.sword = new THREE.Group();
    const blade = tmesh(new THREE.BoxGeometry(0.05, 0.6, 0.015), 0xbfe3ee, { emissive: 0x4a9fd4, emissiveIntensity: 0.5 });
    blade.position.y = 0.34;
    const guard = tmesh(new THREE.BoxGeometry(0.18, 0.04, 0.04), 0xd4af37);
    const swGrip = tmesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 6), 0x5a3826);
    swGrip.position.y = -0.08;
    this.sword.add(blade, guard, swGrip);
    this.sword.position.set(0.12, 0.45, -0.42);
    this.sword.rotation.z = 0.5;
    this.sword.visible = false;
    this.body.add(this.sword);

    // Lantern in hand (hidden until taken); the light source lives here.
    this.lantern = new THREE.Group();
    const lbody = tmesh(new THREE.CylinderGeometry(0.09, 0.11, 0.2, 8), 0xc9a227);
    const lglass = tmesh(new THREE.CylinderGeometry(0.065, 0.075, 0.12, 8), 0xfff2c8, { emissive: 0xffc84a, emissiveIntensity: 1.2, outline: false });
    this.lanternGlass = lglass;
    const ltop = tmesh(new THREE.ConeGeometry(0.09, 0.08, 8), 0xa8861f);
    ltop.position.y = 0.13;
    this.lantern.add(lbody, lglass, ltop);
    this.lantern.position.set(-0.12, -0.42, 0.1);
    this.lantern.visible = false;
    this.armL.add(this.lantern);

    this.light = new THREE.PointLight(0xffc04a, 0, 9, 1.6);
    this.light.position.set(0, 1.4, 0.3);
    this.light.castShadow = false;
    g.add(this.light);

    this._t = 0;
    this._moving = false;
    g.traverse((o) => { o.userData.player = true; });
  }

  _leg() {
    const pivot = new THREE.Group();
    const leg = tmesh(new THREE.CapsuleGeometry(0.08, 0.22, 4, 8), 0x4a3a50);
    leg.position.y = -0.18;
    const boot = tmesh(new THREE.BoxGeometry(0.16, 0.1, 0.24), 0x5a3826);
    boot.position.set(0, -0.38, 0.04);
    pivot.add(leg, boot);
    return pivot;
  }

  _arm() {
    const pivot = new THREE.Group();
    const arm = tmesh(new THREE.CapsuleGeometry(0.07, 0.26, 4, 8), 0x8a5a30);
    arm.position.y = -0.2;
    const hand = tmesh(new THREE.SphereGeometry(0.07, 8, 8), 0xf0bf94);
    hand.position.y = -0.38;
    pivot.add(arm, hand);
    return pivot;
  }

  setEquipment({ sword = false, lantern = false, lanternLit = false, lightIntensity = 0, torchLit = false }) {
    this.sword.visible = sword;
    this.lantern.visible = lantern;
    const lit = lanternLit || torchLit;
    this.lanternGlass.material.emissiveIntensity = lanternLit ? 1.2 : 0.05;
    this.light.intensity = lit ? 2.8 + 3.6 * lightIntensity : 0;
    this.light.color.set(torchLit ? 0xff8a3c : 0xffc04a);
    this.light.distance = 7 + 9 * lightIntensity;
  }

  update(dt, moving) {
    this._moving = moving;
    this._t += dt * (moving ? 9 : 2);
    const t = this._t;
    if (moving) {
      const swing = Math.sin(t) * 0.7;
      this.legL.rotation.x = swing;
      this.legR.rotation.x = -swing;
      this.armL.rotation.x = -swing * 0.8;
      this.armR.rotation.x = swing * 0.8;
      this.group.position.y = Math.abs(Math.sin(t)) * 0.06;
      this.body.rotation.x = 0.08;
      this.head.rotation.z = Math.sin(t * 0.5) * 0.04;
    } else {
      // gentle idle breathing
      for (const part of [this.legL, this.legR, this.armL, this.armR]) {
        part.rotation.x *= 0.85;
      }
      this.body.rotation.x *= 0.85;
      this.group.position.y *= 0.85;
      this.body.scale.y = 1 + Math.sin(t) * 0.012;
      this.head.position.y = 1.18 + Math.sin(t) * 0.008;
    }
  }
}
