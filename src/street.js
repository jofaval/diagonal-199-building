import * as T from 'three';
import { random, lerp2, tint } from './fabric.js';

const rand = random(4041);
const westEdge = (z) => -35.5 - (z - 33) * 0.484;
const eastEdge = (z) => 25 - (z - 33) * 0.33;
const left = (z) => westEdge(z) - 15.5;
const bed = (a, b, z0, z1) => [
  [a(z0), z0],
  [b(z0), z0],
  [b(z1), z1],
  [a(z1), z1],
];
const y = 0.025;

function tree(s, x, z, scale) {
  const bend = 0.35 + rand() * 0.3;
  const bark = '#8e8a72';
  s.prop('box', '#979789', x, 0.045, z, 2.05, 0.105, 2.05);
  s.prop('box', '#645e4c', x, 0.107, z, 1.82, 0.035, 1.82);
  for (let g = -3; g <= 3; g++)
    if (g) s.prop('box', '#8a8c7b', x + g * 0.22, 0.139, z, 0.062, 0.035, 1.72);
  s.rod([x, 0.08, z], [x + bend, 3.8 * scale, z + 0.14], 0.36 * scale, bark);
  s.rod([x + bend, 3.4 * scale, z + 0.14], [x + 0.22, 5.8 * scale, z - 0.25], 0.24 * scale, '#95907b');
  for (let k = 0; k < 8; k++) {
    const ang = k * 2.399 + rand() * 0.42,
      span = (k === 7 ? 0.65 : 1.2 + rand() * 1.5) * scale;
    const cx = x + Math.cos(ang) * span,
      cz = z + Math.sin(ang) * span;
    const cy = (k === 7 ? 8.4 : 6.25 + rand() * 1.15) * scale;
    s.rod(
      [x + bend, 3.3 * scale, z + 0.1],
      [cx, cy - 0.5 * scale, cz],
      (0.14 + rand() * 0.08) * scale,
      bark
    );
    for (let j = 0; j < 13; j++) {
      const a = rand() * Math.PI * 2,
        l = Math.sqrt(rand()) * 1.48 * scale;
      const h = (rand() - 0.5) * 1.5 * scale,
        size = (0.65 + rand() * 0.62) * scale;
      const col = tint(
        ['#818d52', '#88965d', '#99a76b', '#78875b', '#a4a765'][Math.floor(rand() * 5)],
        (h / scale) * 0.028
      );
      s.prop(
        'crown',
        col,
        cx + Math.cos(a) * l,
        cy + h,
        cz + Math.sin(a) * l,
        size,
        size * (0.66 + rand() * 0.3),
        size * 0.85,
        a,
        rand(),
        rand(),
        'leaves'
      );
    }
  }
}

function bench(s, x, z, ry = 0) {
  const at = (dx, dz) => [
    x + Math.cos(ry) * dx + Math.sin(ry) * dz,
    z - Math.sin(ry) * dx + Math.cos(ry) * dz,
  ];
  for (const d of [-0.82, 0.82]) {
    const [xx, zz] = at(d, 0);
    s.prop('box', '#58635c', xx, 0.27, zz, 0.12, 0.5, 0.53, ry);
  }
  for (const d of [-0.19, 0, 0.19]) {
    const [xx, zz] = at(0, d);
    s.prop('box', '#a67f56', xx, 0.53, zz, 2.26, 0.105, 0.15, ry);
  }
  for (const h of [0.82, 1.06]) {
    const [xx, zz] = at(0, -0.26);
    s.prop('box', '#aa855e', xx, h, zz, 2.26, 0.14, 0.075, ry);
  }
}

function lamppost(s, x, z, dx = 0, dz = 1) {
  const h = 7.4;
  s.rod([x, 0.08, z], [x, h, z], 0.155, '#63736b');
  s.rod([x, h - 0.53, z], [x + dx * 1.5, h + 0.25, z + dz * 1.5], 0.13, '#64746c');
  s.prop('box', '#53645f', x + dx * 1.52, h + 0.24, z + dz * 1.52, 0.41, 0.14, 0.82, Math.atan2(dx, dz));
  s.prop(
    'box',
    '#ffe0a3',
    x + dx * 1.52,
    h + 0.155,
    z + dz * 1.52,
    0.31,
    0.045,
    0.69,
    Math.atan2(dx, dz),
    0,
    0,
    'lamp'
  );
}

function person(s, x, z, h, coat, ry) {
  const p = (a, b, c) => [
    x + (a * Math.cos(ry) + c * Math.sin(ry)) * h,
    b * h,
    z + (c * Math.cos(ry) - a * Math.sin(ry)) * h,
  ];
  s.rod(p(-0.07, 0.46, 0), p(-0.08, 0.05, 0.105), 0.105 * h, '#4c5551');
  s.rod(p(0.07, 0.46, 0), p(0.085, 0.055, -0.09), 0.105 * h, '#535c56');
  s.prop('pebble', coat, ...p(0, 0.61, 0), 0.145 * h, 0.245 * h, 0.12 * h, ry);
  s.rod(p(-0.12, 0.73, 0), p(-0.16, 0.47, -0.035), 0.075 * h, coat);
  s.rod(p(0.12, 0.73, 0), p(0.16, 0.5, 0.1), 0.072 * h, coat);
  s.prop('pebble', '#bb9474', ...p(0, 0.9, 0), 0.099 * h, 0.107 * h, 0.099 * h, ry);
  s.prop('pebble', '#635c4f', ...p(0, 0.955, -0.015), 0.1 * h, 0.062 * h, 0.098 * h, ry);
}

function bicycle(s, x, z, ry) {
  const p = (a, b, c = 0) => [
    x + Math.cos(ry) * a + Math.sin(ry) * c,
    b,
    z - Math.sin(ry) * a + Math.cos(ry) * c,
  ];
  for (const dx of [-0.58, 0.58]) {
    s.prop('ring', '#414c47', ...p(dx, 0.38), 0.36, 0.36, 0.36, ry);
    for (let i = 0; i < 4; i++) {
      const a = (Math.PI * i) / 4;
      s.rod(
        p(dx - 0.32 * Math.cos(a), 0.38 - 0.32 * Math.sin(a)),
        p(dx + 0.32 * Math.cos(a), 0.38 + 0.32 * Math.sin(a)),
        0.015,
        '#a5aca0'
      );
    }
  }
  for (const [a, b] of [
    [
      [-0.58, 0.38],
      [-0.2, 0.83],
    ],
    [
      [-0.58, 0.38],
      [0, 0.38],
    ],
    [
      [-0.2, 0.83],
      [0, 0.38],
    ],
    [
      [0, 0.38],
      [0.43, 0.85],
    ],
    [
      [0.43, 0.85],
      [-0.2, 0.83],
    ],
    [
      [0.58, 0.38],
      [0.43, 0.93],
    ],
  ])
    s.rod(p(...a), p(...b), 0.048, '#9e614b');
  s.prop('box', '#535851', ...p(-0.23, 0.91), 0.27, 0.075, 0.12, ry);
  s.rod(p(0.43, 0.95, -0.19), p(0.43, 0.95, 0.19), 0.044, '#4d5952');
}

function car(s, x, z, ry, color) {
  const p = (a, b, c) => [
    x + Math.cos(ry) * a + Math.sin(ry) * c,
    b,
    z - Math.sin(ry) * a + Math.cos(ry) * c,
  ];
  s.prop('box', '#39423c', ...p(0, 0.33, 0), 3.94, 0.3, 1.55, ry);
  s.prop('box', color, ...p(0, 0.68, 0), 4.14, 0.55, 1.68, ry);
  s.prop('box', '#506969', ...p(-0.1, 1.09, 0), 2.46, 0.5, 1.49, ry);
  s.prop('box', color, ...p(-0.11, 1.38, 0), 2.26, 0.13, 1.49, ry);
  for (const side of [-1, 1]) {
    s.prop('box', color, ...p(-0.25, 1.12, side * 0.754), 0.092, 0.42, 0.024, ry);
    for (const dx of [-1.31, 1.31]) {
      const a = p(dx, 0.39, side * 0.72),
        b = p(dx, 0.39, side * 0.9);
      s.rod(a, b, 0.76, '#39423d');
      s.rod(p(dx, 0.39, side * 0.9), p(dx, 0.39, side * 0.915), 0.4, '#a4aa99');
    }
    s.prop('box', '#e9ddad', ...p(2.08, 0.72, side * 0.56), 0.035, 0.14, 0.35, ry);
    s.prop('box', '#9f5742', ...p(-2.08, 0.7, side * 0.62), 0.034, 0.12, 0.3, ry);
  }
}

function avenuePlate(scene) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 66;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#34463f';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#eadfc4';
  ctx.font = '36px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('A V I N G U D A   D I A G O N A L', 512, 46);
  const tex = new T.CanvasTexture(c);
  tex.colorSpace = T.SRGBColorSpace;
  tex.repeat.x = -1;
  tex.offset.x = 1;
  const m = new T.Mesh(
    new T.PlaneGeometry(23.4, 1.5),
    new T.MeshStandardMaterial({ map: tex, roughness: 0.8 })
  );
  m.position.set(-6, -1.15, 51.035);
  scene.add(m);
}

export function streets(s, scene) {
  const base = bed(left, (z) => eastEdge(z) + 3, 51, -47);
  s.slab(base, -2.65, -2.25, '#867b65', '#a8a18c');
  s.slab(base, -2.25, -0.16, '#34463f', '#667068');
  s.slab(base, -0.16, -0.02, '#afb09a', '#828980');
  const shadowMap = document.createElement('canvas');
  shadowMap.width = shadowMap.height = 512;
  const ctx = shadowMap.getContext('2d'),
    span = 162;
  ctx.filter = 'blur(8px)';
  ctx.fillStyle = '#384b42';
  ctx.beginPath();
  base.forEach(([x, z], i) => {
    const u = 256 + (x * 512) / span,
      v = 256 + (z * 512) / span;
    if (i) ctx.lineTo(u, v);
    else ctx.moveTo(u, v);
  });
  ctx.closePath();
  ctx.fill();
  const soft = new T.Mesh(
    new T.PlaneGeometry(span, span),
    new T.MeshBasicMaterial({
      map: new T.CanvasTexture(shadowMap),
      transparent: true,
      opacity: 0.32,
      depthWrite: false,
    })
  );
  soft.rotation.x = -Math.PI / 2;
  soft.position.y = -2.67;
  scene.add(soft);
  avenuePlate(scene);
  // A continuous street skin, bike lane and pavement follow the oblique parcel, not a rectangular tile.
  const walk = bed(
    (z) => westEdge(z) - 3.3,
    (z) => eastEdge(z) + 1.1,
    37.2,
    -44.3
  );
  s.slab(walk, -0.022, 0.07, '#b6b8a6', '#c9c7b4', 'stone', 'pavers');
  s.horizontal(
    'stone',
    bed(
      (z) => westEdge(z) - 7.05,
      (z) => westEdge(z) - 4.25,
      37.2,
      -45.6
    ),
    y,
    '#ae8976'
  );
  s.horizontal(
    'stone',
    bed(
      (z) => westEdge(z) - 7.11,
      (z) => westEdge(z) - 7.01,
      37.2,
      -45.6
    ),
    y + 0.01,
    '#ded8c2'
  );
  for (let z = -42; z < 32; z += 6.1) {
    s.horizontal(
      'stone',
      bed(
        (z) => westEdge(z) - 10.98,
        (z) => westEdge(z) - 10.82,
        z + 2.6,
        z
      ),
      y,
      '#e0ddc9'
    );
    s.horizontal(
      'stone',
      bed(
        (z) => westEdge(z) - 3.4,
        (z) => westEdge(z) - 3.2,
        z + 0.08,
        z - 0.1
      ),
      0.09,
      '#9e9f8f'
    );
  }
  for (let x = left(46) + 1; x < eastEdge(46); x += 7)
    s.horizontal(
      'stone',
      [
        [x, 44.75],
        [x + 3.1, 44.75],
        [x + 3.1, 44.58],
        [x, 44.58],
      ],
      y,
      '#e8e2ca'
    );
  for (let n = 0; n < 8; n++) {
    const z = 38.35 + n * 1.5,
      x = westEdge(z) + 3.3;
    s.horizontal(
      'stone',
      [
        [x, z + 0.67],
        [x + 3.4, z + 0.67],
        [x + 3.72, z],
        [x + 0.32, z],
      ],
      y + 0.02,
      '#e6e1ce'
    );
  }
  for (let i = 0; i < 8; i++) {
    const z = 25.7 + i * 0.07,
      x = westEdge(z) - 4 - i * 1.35;
    s.horizontal(
      'stone',
      [
        [x, z],
        [x + 0.67, z],
        [x + 2.13, z - 3.1],
        [x + 1.45, z - 3.1],
      ],
      y + 0.02,
      '#e6e1ce'
    );
  }
  // Flush kerb stones and drainage slots remain visible in the street preset.
  for (let x = westEdge(37.2) - 3; x < eastEdge(37.2); x += 1.4) {
    s.prop('box', '#a6a99c', x, 0.09, 37.04, 0.026, 0.035, 0.32);
    if (Math.round(x) % 9 === 0) s.prop('box', '#68736b', x, 0.035, 37.45, 0.8, 0.026, 0.28);
  }
  for (const [x, z, k] of [
    [-33.8, 35.65, 0.89],
    [-10.3, 35.7, 0.91],
    [11.6, 35.8, 0.85],
    [21.2, 35.7, 0.72],
    ...[17, 1, -15, -32].map((z, i) => [westEdge(z) - 1.9, z, 0.85 + (i % 2) * 0.13]),
    [30, -10, 0.87],
    [32, -25, 0.68],
  ])
    tree(s, x, z, k);
  for (const x of [-26, 4, 19.4]) lamppost(s, x, 36.3);
  for (const z of [12, -20, -38]) lamppost(s, westEdge(z) - 2.8, z, -0.9, -0.4);
  bench(s, -6.5, 35.4);
  bench(s, 16.2, 35.4);
  bench(s, westEdge(-7) - 1.75, -7, 1.12);
  for (const x of [-0.3, 0.5, 1.3, 2.1]) {
    const z = 35.7;
    s.rod([x, 0.1, z - 0.4], [x, 0.9, z - 0.4], 0.064, '#68796e');
    s.rod([x, 0.9, z - 0.4], [x, 0.9, z + 0.4], 0.064, '#68796e');
    s.rod([x, 0.9, z + 0.4], [x, 0.1, z + 0.4], 0.064, '#68796e');
  }
  bicycle(s, -0.39, 35.6, 1.46);
  bicycle(s, 1.38, 35.6, 1.42);
  for (const [x, z, c] of [
    [-22, 34.5, '#b56046'],
    [-20.9, 34.8, '#647d84'],
    [-7.2, 36.1, '#c0a269'],
    [6.8, 35.1, '#596f68'],
    [westEdge(15) - 2.5, 15, '#9a6854'],
    [westEdge(-5) - 1.7, -5, '#697a85'],
    [18.2, 34.3, '#c7a275'],
  ])
    person(s, x, z, 1.63 + rand() * 0.2, c, rand() * 6);
  car(s, -3, 40.4, 0, '#d0c8ae');
  car(s, westEdge(-7) - 12, -7, 1.12, '#6b8283');
  // Warm in-ground fixtures pick out the entrances after dark.
  for (const x of [-31, -26, -21, -15, 6, 13, 18])
    s.prop('rod', '#ffe3ac', x, 0.09, 33.8, 0.24, 0.055, 0.24, 0, 0, 0, 'lamp');
}
