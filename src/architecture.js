import * as T from 'three';
import { face, lerp2, mix, random, tint, wall } from './fabric.js';

// Simplified from footprints 32672 and 32673. Local +z faces the avenue; +x follows it eastward.
export const west = [
  [-35.5, 33],
  [-16.8, 33],
  [9.5, -22.4],
  [-0.1, -40.4],
];
export const east = [
  [2.2, 33],
  [20, 33],
  [40.4, -32.8],
  [20.7, -26.7],
];
export const sitePoint = (p, u, v) => lerp2(lerp2(p[0], p[3], v), lerp2(p[1], p[2], v), u);
const rect = (p, u0, u1, v0, v1) => [
  sitePoint(p, u0, v0),
  sitePoint(p, u1, v0),
  sitePoint(p, u1, v1),
  sitePoint(p, u0, v1),
];
const rand = random(228199);
const vary = (hex, amt = 0.025) => tint(hex, (rand() - 0.5) * amt);

function rim(s, p, y, height, width, col) {
  const length = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const u = width / length(p[0], p[1]),
    v = width / length(p[0], p[3]);
  for (const strip of [
    rect(p, 0, 1, 0, v),
    rect(p, 0, 1, 1 - v, 1),
    rect(p, 0, u, v, 1 - v),
    rect(p, 1 - u, 1, v, 1 - v),
  ])
    s.slab(strip, y, y + height, col, col, 'metal');
}

function podium(s, p, h, neighbor = false) {
  const lobby = 4.2,
    floors = neighbor ? 3 : 6,
    step = (h - lobby) / floors;
  s.slab(p, 0.04, h, '#243535', '#9a9c90', 'dark', 'stone');
  p.forEach((a, i) => {
    const w = wall(a, p[(i + 1) % 4]),
      n = Math.max(4, Math.round(w.len / 1.7)),
      bay = w.len / n;
    for (let j = 0; j < n; j++) {
      const x = j * bay;
      face(s, w, 'glass', vary('#446365', 0.13), x + 0.04, x + bay - 0.04, 0.27, 3.38, 0.055);
      face(s, w, 'glass', vary('#789697', 0.04), x + 0.04, x + bay - 0.04, 3.44, 3.92, 0.055);
      if (j % 3 === 0) face(s, w, 'metal', '#4b5552', x + 0.06, x + 0.17, 0.14, 3.92, 0.14);
      face(s, w, 'metal', '#303f3f', x, x + bay, 3.94, lobby, 0.16);
      for (let f = 0; f < floors; f++) {
        const lo = lobby + step * f,
          top = lo + step;
        const stone = ['#485859', '#526766', '#617778', '#738a89', '#92a3a0', '#a5b2ae'][f];
        const glazing = ['#3c5a5d', '#4c6e70', '#618387', '#759295', '#8da6a6', '#9caeaa'][f];
        const vent = !neighbor && f === floors - 1 && (j % 6 === 1 || j % 6 === 2);
        const opaque = (j + 2 * i) % 7 === 1;
        face(
          s,
          w,
          'metal',
          vary(stone, 0.037),
          x + 0.018,
          x + bay - 0.018,
          lo + 0.023,
          lo + step * 0.3,
          0.053
        );
        if (vent) {
          face(
            s,
            w,
            'dark',
            '#33413e',
            x + 0.045,
            x + bay - 0.045,
            lo + step * 0.3 + 0.025,
            top - 0.035,
            0.05
          );
          for (let k = 1; k < 7; k++)
            face(
              s,
              w,
              'metal',
              '#495752',
              x + 0.047,
              x + bay - 0.045,
              lo + step * (0.31 + k * 0.085),
              lo + step * (0.31 + k * 0.085) + 0.052,
              0.095
            );
        } else if (opaque)
          face(
            s,
            w,
            'metal',
            vary(stone, 0.05),
            x + 0.018,
            x + bay - 0.018,
            lo + step * 0.3 + 0.025,
            top - 0.025,
            0.054
          );
        else {
          face(
            s,
            w,
            'glass',
            vary(glazing, 0.125),
            x + 0.046,
            x + bay - 0.046,
            lo + step * 0.3 + 0.035,
            top - 0.033,
            0.052
          );
          if ((j + f) % 6 === 3)
            face(s, w, 'metal', '#6a7e7c', x + 0.045, x + bay - 0.045, top - 0.74, top - 0.7, 0.087);
        }
      }
    }
    face(s, w, 'metal', '#b9c3b9', 0, w.len, h - 0.16, h + 0.025, 0.12);
  });
  rim(s, p, h, 0.35, 0.17, '#b3beb4');
}

function reveal(s, w, l, r, b, t, depth) {
  for (const [x, y, xx, yy, col] of [
    [l, b, l, t, '#667575'],
    [r, t, r, b, '#84928c'],
    [l, t, r, t, '#565f5c'],
    [r, b, l, b, '#a9b2a8'],
  ]) {
    s.quad(
      'metal',
      [w.point(x, y, 0.05), w.point(xx, yy, 0.05), w.point(xx, yy, depth), w.point(x, y, depth)],
      col
    );
  }
}

function tower(s, p, bottom, top, floors, bronze = false) {
  s.slab(p, bottom, top, '#718482', bronze ? '#ada995' : '#a3aea6', 'dark', 'stone');
  p.forEach((a, side) => {
    const w = wall(a, p[(side + 1) % 4]);
    const n = Math.round(w.len / (bronze ? 1.48 : 1.29)),
      bay = w.len / n,
      step = (top - bottom) / floors;
    for (let i = 0; i < n; i++) {
      const x = i * bay,
        colShift = (rand() - 0.5) * 0.034;
      for (let f = 0; f < floors; f++) {
        const lo = bottom + f * step,
          hi = lo + step;
        const solid = tint(
          bronze ? '#b9ab94' : '#c7d0cb',
          colShift + (rand() - 0.5) * (bronze ? 0.08 : 0.037)
        );
        const band = (i + (Math.floor(f / 3) % 2) + side) % 5;
        const hasWindow =
          f < floors - 1 &&
          (bronze
            ? band === 1 || band === 3 || (band === 0 && (f + side) % 3 === 1)
            : band === 1 || (band === 3 && (f + side) % 4 !== 1) || (band === 0 && f % 5 === 0));
        if (!hasWindow) {
          face(s, w, 'metal', solid, x + 0.019, x + bay - 0.019, lo + 0.023, hi - 0.023, 0.05);
          continue;
        }
        const pad = bronze ? 0.19 : 0.105,
          l = x + pad,
          r = x + bay - pad,
          b = lo + (bronze ? 0.56 : 0.83),
          t = hi - (bronze ? 0.38 : 0.27);
        face(s, w, 'metal', solid, x + 0.019, x + bay - 0.019, lo + 0.02, b, 0.05);
        face(s, w, 'metal', solid, x + 0.019, x + bay - 0.019, t, hi - 0.02, 0.05);
        face(s, w, 'metal', solid, x + 0.019, l, b, t, 0.05);
        face(s, w, 'metal', solid, r, x + bay - 0.019, b, t, 0.05);
        // The outer sheet sits proud of the dark reveal, with a separate pane and operable transom.
        reveal(s, w, l, r, b, t, 0.008);
        face(
          s,
          w,
          'glass',
          vary(bronze ? '#65726c' : '#95a7a4', 0.16),
          l + 0.045,
          r - 0.045,
          b + 0.06,
          t - 0.06,
          0.012
        );
        face(
          s,
          w,
          'metal',
          bronze ? '#76786b' : '#a9b4ad',
          l,
          r,
          b + 0.64 * (t - b),
          b + 0.64 * (t - b) + 0.045,
          0.07
        );
        if ((i * 7 + f * 11 + side) % 31 === 0) {
          s.quad(
            'glass',
            [
              w.point(l, b + 0.08, 0.24),
              w.point(r, b + 0.08, 0.24),
              w.point(r, b + 0.63 * (t - b), 0.075),
              w.point(l, b + 0.63 * (t - b), 0.075),
            ],
            '#4e686b'
          );
          face(s, w, 'dark', '#4c5957', l, r, b, b + 0.095, 0.235);
        }
      }
    }
    face(s, w, 'metal', bronze ? '#d0c2a9' : '#e1e6dc', 0, w.len, top - 0.14, top + 0.08, 0.12);
  });
}

function rail(s, p, y, h = 1) {
  p.forEach((a, i) => {
    const b = p[(i + 1) % 4],
      n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2.5);
    for (let j = 0; j < n; j++) {
      const [x, z] = lerp2(a, b, j / n);
      s.rod([x, y, z], [x, y + h, z], 0.065, '#758880');
    }
    for (const dy of [h, h * 0.48])
      s.rod([a[0], y + dy, a[1]], [b[0], y + dy, b[1]], dy === h ? 0.085 : 0.034, '#9aaaa1');
  });
}

function rooftop(s, p, y, bronze = false) {
  rim(s, p, y, 0.7, 0.23, bronze ? '#c4b69d' : '#c3cfc5');
  const rear = rect(p, 0.13, 0.82, 0.64, 0.89);
  s.slab(rear, y + 0.01, y + 2.17, '#7c8882', '#c4c7b8');
  rear.forEach((a, i) => {
    const w = wall(a, rear[(i + 1) % 4]);
    for (let k = 0; k < 9; k++)
      face(s, w, 'metal', '#515f59', 0.14, w.len - 0.14, y + 0.2 + k * 0.19, y + 0.26 + k * 0.19, 0.02);
  });
  for (const u of [0.28, 0.55, 0.75]) {
    const [x, z] = sitePoint(p, u, 0.77);
    s.prop('rod', '#696f66', x, y + 2.29, z, 2, 0.25, 2);
    s.prop('rod', '#3e4844', x, y + 2.435, z, 1.64, 0.05, 1.64);
    for (let k = 0; k < 4; k++)
      s.prop('box', '#a7afa0', x, y + 2.49, z, 1.58, 0.04, 0.078, (k * Math.PI) / 4);
  }
  if (bronze) {
    for (let i = 0; i < 3; i++) {
      const array = rect(p, 0.18, 0.79, 0.12 + i * 0.125, 0.21 + i * 0.125);
      s.slab(array, y + 0.12, y + 0.37, '#667877', '#506a72', 'metal');
      for (let j = 1; j < 7; j++) {
        const a = lerp2(array[0], array[1], j / 7),
          b = lerp2(array[3], array[2], j / 7);
        s.rod([a[0], y + 0.395, a[1]], [b[0], y + 0.395, b[1]], 0.055, '#a9b5b0');
      }
    }
  } else {
    const deck = rect(p, 0.075, 0.925, 0.055, 0.58);
    s.slab(deck, y + 0.02, y + 0.15, '#9c8972', '#c59c71');
    const deckW = wall(deck[0], deck[1]);
    for (let v = 0.075; v < 0.57; v += 0.014) {
      const a = sitePoint(p, 0.075, v),
        b = sitePoint(p, 0.925, v);
      s.rod([a[0], y + 0.151, a[1]], [b[0], y + 0.151, b[1]], 0.039, '#957c60');
    }
    const pool = rect(p, 0.15, 0.53, 0.13, 0.48);
    s.slab(pool, y + 0.16, y + 0.33, '#c5c9b0', '#d9d9c4');
    s.horizontal('water', rect(p, 0.17, 0.51, 0.141, 0.469), y + 0.345, '#269d99');
    const lounge = (u, v) => {
      const [x, z] = sitePoint(p, u, v),
        ry = -Math.atan2(
          deckW.point(1, 0)[2] - deckW.point(0, 0)[2],
          deckW.point(1, 0)[0] - deckW.point(0, 0)[0]
        );
      s.prop('box', '#765f47', x, y + 0.32, z, 0.68, 0.21, 1.95, ry);
      s.prop('box', '#e6dcc2', x, y + 0.48, z, 0.7, 0.15, 1.78, ry);
      s.prop('box', '#f2e9d1', x, y + 0.62, z - 0.55, 0.69, 0.14, 0.64, ry, -0.34);
    };
    for (let i = 0; i < 5; i++) lounge(0.71, 0.145 + i * 0.077);
    rail(s, rect(p, 0.045, 0.96, 0.035, 0.6), y + 0.16, 1);
  }
}

function placard(scene, text, a, b, y, height) {
  const c = document.createElement('canvas');
  c.width = 384;
  c.height = 96;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#233c39';
  ctx.fillRect(0, 0, 384, 96);
  ctx.font = 'bold 49px sans-serif';
  ctx.fillStyle = '#f1ead9';
  ctx.textAlign = 'center';
  ctx.fillText(text, 192, 65);
  const tx = new T.CanvasTexture(c);
  tx.colorSpace = T.SRGBColorSpace;
  tx.repeat.x = -1;
  tx.offset.x = 1;
  const w = wall(a, b);
  const g = new T.BufferGeometry();
  g.setAttribute(
    'position',
    new T.Float32BufferAttribute(
      [
        w.point(0, y, 0.25),
        w.point(w.len, y, 0.25),
        w.point(w.len, y + height, 0.25),
        w.point(0, y + height, 0.25),
      ].flat(),
      3
    )
  );
  g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  g.computeVertexNormals();
  scene.add(new T.Mesh(g, new T.MeshStandardMaterial({ map: tx, roughness: 0.68 })));
}

export function architecture(s, scene) {
  const plinth = 24.8,
    crown = 62.2,
    towerP = rect(west, 0.017, 0.974, 0.252, 0.953);
  podium(s, west, plinth);
  tower(s, towerP, plinth + 0.02, crown, 12);
  rooftop(s, towerP, crown);

  const bridge = [west[1], east[0], sitePoint(east, 0, 0.53), sitePoint(west, 1, 0.58)];
  podium(s, bridge, 4.95, true);
  const inner = rect(bridge, 0.08, 0.93, 0.06, 0.9);
  s.slab(inner, 4.96, 5.05, '#9a9380', '#aa9e86');
  for (const t of [0.22, 0.52, 0.8]) {
    const light = rect(bridge, 0.21, 0.76, t, t + 0.08);
    s.slab(light, 5.05, 5.4, '#99a49b', '#8ba9a8', 'metal');
  }
  podium(s, east, 12.25, true);
  const eastP = rect(east, 0.018, 0.976, 0.075, 0.978);
  tower(s, eastP, 12.27, 49.4, 11, true);
  rooftop(s, eastP, 49.4, true);

  const canopy = [
    [-20.1, 34.48],
    [-13.4, 34.48],
    [-13.4, 32.85],
    [-20.1, 32.85],
  ];
  s.slab(canopy, 3.32, 3.66, '#435654', '#83918a', 'metal');
  placard(scene, 'DIAGONAL 199', [-19.4, 33.01], [-14.1, 33.01], 3.75, 0.94);
  const terrace = rect(west, 0.085, 0.91, 0.037, 0.203);
  rail(s, terrace, plinth + 0.03, 0.95);
  for (const u of [0.18, 0.44, 0.75]) {
    const [x, z] = sitePoint(west, u, 0.115);
    s.prop('box', '#b3ad94', x, plinth + 0.35, z, 1.8, 0.7, 0.84);
    s.prop('pebble', '#748056', x, plinth + 0.9, z, 1, 0.47, 0.57);
  }
}
