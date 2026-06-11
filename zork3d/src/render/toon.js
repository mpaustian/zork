// Toon shading helpers: stepped gradient map, cel materials, inverted-hull outlines.
import * as THREE from 'three';

let _gradientMap = null;
export function gradientMap() {
  if (_gradientMap) return _gradientMap;
  // 4-step ramp for chunky cartoon shading.
  const data = new Uint8Array([90, 150, 210, 255]);
  const tex = new THREE.DataTexture(data, 4, 1, THREE.RedFormat);
  tex.needsUpdate = true;
  tex.minFilter = THREE.NearestFilter;
  tex.magFilter = THREE.NearestFilter;
  _gradientMap = tex;
  return tex;
}

const _matCache = new Map();
export function toon(color, opts = {}) {
  const key = `${color}|${opts.emissive ?? 0}|${opts.emissiveIntensity ?? 0}|${opts.transparent ?? false}|${opts.opacity ?? 1}`;
  if (!opts.noCache && _matCache.has(key)) return _matCache.get(key);
  const mat = new THREE.MeshToonMaterial({
    color,
    gradientMap: gradientMap(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
  });
  if (!opts.noCache) _matCache.set(key, mat);
  return mat;
}

const OUTLINE_MAT = new THREE.MeshBasicMaterial({ color: 0x1a1028, side: THREE.BackSide });

// Add a cartoon outline to a mesh via the inverted-hull trick.
export function outline(mesh, thickness = 0.035) {
  const hull = new THREE.Mesh(mesh.geometry, OUTLINE_MAT);
  hull.scale.setScalar(1 + thickness);
  hull.raycast = () => {}; // outlines must never swallow clicks
  mesh.add(hull);
  return mesh;
}

// Convenience: toon mesh + outline in one call.
export function tmesh(geometry, color, opts = {}) {
  const m = new THREE.Mesh(geometry, toon(color, opts));
  m.castShadow = opts.castShadow ?? true;
  m.receiveShadow = opts.receiveShadow ?? false;
  if (opts.outline !== false) outline(m, opts.thickness ?? 0.035);
  return m;
}

// Floating text label rendered to a canvas sprite (for exit portals etc).
export function textSprite(text, { size = 44, color = '#fff8e7', bg = 'rgba(26,16,40,0.82)', scale = 1 } = {}) {
  const pad = 26;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `bold ${size}px Trebuchet MS, sans-serif`;
  const w = Math.ceil(ctx.measureText(text).width) + pad * 2;
  const h = size + pad * 1.4;
  canvas.width = w; canvas.height = h;
  const c2 = canvas.getContext('2d');
  c2.fillStyle = bg;
  c2.beginPath();
  c2.roundRect(2, 2, w - 4, h - 4, h / 2);
  c2.fill();
  c2.strokeStyle = color; c2.lineWidth = 3; c2.stroke();
  c2.font = `bold ${size}px Trebuchet MS, sans-serif`;
  c2.fillStyle = color;
  c2.textAlign = 'center'; c2.textBaseline = 'middle';
  c2.fillText(text, w / 2, h / 2 + 2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  const aspect = w / h;
  sprite.scale.set(0.55 * aspect * scale, 0.55 * scale, 1);
  sprite.renderOrder = 50;
  return sprite;
}

// Deterministic pseudo-random for stable procedural scatter per room.
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}
