import * as T from 'three';

export const mix = (a, b, t) => a + (b - a) * t;
export const lerp2 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t)];
export function random(seed) {
  return () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
}
export function tint(hex, lightness) {
  return new T.Color(hex).offsetHSL(0, 0, lightness);
}

// A small number of material batches keeps every reveal and mullion in the model at street zoom.
export function workshop(scene, materials) {
  const sheets = new Map(),
    instances = new Map();
  const shapes = {
    box: new T.BoxGeometry(1, 1, 1),
    rod: new T.CylinderGeometry(0.5, 0.5, 1, 9),
    crown: new T.IcosahedronGeometry(1, 0),
    pebble: new T.IcosahedronGeometry(1, 1),
    ring: new T.TorusGeometry(1, 0.065, 5, 16),
  };
  const obj = new T.Object3D(),
    up = new T.Vector3(0, 1, 0);
  const col = new T.Color();

  function quad(mat, points, color, uv = [0, 0, 1, 0, 1, 1, 0, 1]) {
    if (!sheets.has(mat)) sheets.set(mat, { pos: [], col: [], uv: [], idx: [] });
    const b = sheets.get(mat),
      i = b.pos.length / 3;
    col.set(color);
    for (const p of points) {
      b.pos.push(...p);
      b.col.push(col.r, col.g, col.b);
    }
    b.uv.push(...uv);
    b.idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
  }
  function horizontal(mat, p, y, color, uv) {
    quad(
      mat,
      p.map(([x, z]) => [x, y, z]),
      color,
      uv
    );
  }
  function slab(p, y0, y1, sides, top, mat = 'stone', topMat = mat) {
    horizontal(topMat, p, y1, top);
    for (let i = 0; i < 4; i++) {
      const [x, z] = p[i],
        [u, v] = p[(i + 1) % 4];
      quad(
        mat,
        [
          [x, y0, z],
          [u, y0, v],
          [u, y1, v],
          [x, y1, z],
        ],
        sides
      );
    }
  }
  function add(shape, mat, color) {
    const key = `${shape}/${mat}`;
    if (!instances.has(key)) instances.set(key, { shape, mat, matrices: [], colors: [] });
    obj.updateMatrix();
    instances.get(key).matrices.push(obj.matrix.clone());
    instances.get(key).colors.push(new T.Color(color));
  }
  function prop(shape, color, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0, mat = 'solid') {
    obj.position.set(x, y, z);
    obj.scale.set(sx, sy, sz);
    obj.rotation.set(rx, ry, rz, 'YXZ');
    add(shape, mat, color);
  }
  function rod(a, b, diameter, color, mat = 'solid') {
    const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    obj.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
    obj.scale.set(diameter, d.length(), diameter);
    obj.quaternion.setFromUnitVectors(up, d.normalize());
    add('rod', mat, color);
  }
  function finish() {
    for (const [name, b] of sheets) {
      const g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(b.pos, 3));
      g.setAttribute('color', new T.Float32BufferAttribute(b.col, 3));
      g.setAttribute('uv', new T.Float32BufferAttribute(b.uv, 2));
      g.setIndex(b.idx);
      g.computeVertexNormals();
      const mesh = new T.Mesh(g, materials[name]);
      mesh.name = name;
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
    }
    for (const batch of instances.values()) {
      const mesh = new T.InstancedMesh(shapes[batch.shape], materials[batch.mat], batch.matrices.length);
      mesh.name = `${batch.shape} · ${batch.mat}`;
      batch.matrices.forEach((m, i) => {
        mesh.setMatrixAt(i, m);
        mesh.setColorAt(i, batch.colors[i]);
      });
      mesh.castShadow = mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      scene.add(mesh);
    }
  }
  return { quad, horizontal, slab, prop, rod, finish };
}

export function wall(a, b) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]),
    dx = (b[0] - a[0]) / len,
    dz = (b[1] - a[1]) / len;
  return { len, point: (u, y, out = 0) => [a[0] + dx * u - dz * out, y, a[1] + dz * u + dx * out] };
}
export function face(shop, w, mat, color, x0, x1, y0, y1, depth = 0) {
  shop.quad(
    mat,
    [w.point(x0, y0, depth), w.point(x1, y0, depth), w.point(x1, y1, depth), w.point(x0, y1, depth)],
    color
  );
}

export function makeMaterials() {
  const m = (args = {}) => new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.76, ...args });
  const night = { value: 0 };
  const glass = m({ metalness: 0.37, roughness: 0.23, envMapIntensity: 0.88 });
  glass.onBeforeCompile = (shader) => {
    shader.uniforms.uNight = night;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPane; varying vec3 vSite;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\nvPane=uv; vSite=(modelMatrix*vec4(position,1.)).xyz;'
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uNight; varying vec2 vPane; varying vec3 vSite;'
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float blind = fract(vColor.g*193.21+vColor.b*71.29);
        float lip = smoothstep(0.0,.14,vPane.y) * smoothstep(0.0,.048,1.0-vPane.y);
        diffuseColor.rgb *= .70+.30*lip;
        float shade = 1.-smoothstep(-.015,.015,vPane.y-(.32+.56*blind));
        diffuseColor.rgb *= 1.-.23*shade;
        float slat = .5+.5*cos(vPane.y*148.);
        diffuseColor.rgb *= 1.-.08*slat*(1.-shade)*(1.-smoothstep(.02,.07,fwidth(vPane.y)));
        vec3 planeN=normalize(cross(dFdx(vSite),dFdy(vSite)));
        vec3 ray=reflect(normalize(vSite-cameraPosition),planeN);
        float az=atan(ray.z,ray.x);
        float block=floor(az*17.+vSite.x*.025);
        float skyline=.18+.29*fract(sin(block*78.23)*4294.73);
        float inSky=smoothstep(skyline-.018,skyline+.018,ray.y+vSite.y*.023);
        diffuseColor.rgb*=mix(vec3(.53,.74,.73),vec3(1.09,1.16,1.16),inSky);
      `
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        float room = fract(vColor.r*127.41+vColor.g*437.2);
        float ceiling = smoothstep(.935,.96,vPane.y)*(1.-smoothstep(.98,.995,vPane.y));
        float post = 1.-.28*smoothstep(.0,.06,vPane.x)*(1.-smoothstep(.06,.08,vPane.x));
        vec3 lamp = mix(vec3(1.,.46,.16),vec3(1.,.80,.52),room);
        totalEmissiveRadiance += uNight * lamp * (.065 + step(.54,room)*(.30+.70*room)) * (.33+.67*lip) * post;
        totalEmissiveRadiance += lamp * ceiling * (.032+.25*uNight)*step(.59,room);
      `
      );
  };
  const stone = m();
  stone.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStone;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvStone=position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vStone;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        diffuseColor.rgb*=.975+.045*fract(sin(dot(floor(vStone.xz*19.),vec2(12.9898,78.233)))*43758.5453);`
      );
  };
  const water = m({ metalness: 0.45, roughness: 0.15, envMapIntensity: 0.7 });
  water.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPool;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPool=position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPool;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float r=sin(vPool.z*9.+1.4*sin(vPool.x*2.1))+sin(vPool.x*5.+vPool.z*3.);
        diffuseColor.rgb+=vec3(.09,.23,.21)*pow(clamp(r*.5,0.,1.),5.);`
      );
  };
  const pavers = m();
  pavers.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPave;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPave=position.xz*2.4;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vPave;')
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        vec2 cell = fract(vPave)-.5;
        float joint = max(abs(cell.x),abs(cell.y));
        vec2 flower = abs(cell)-vec2(.13);
        float ring = 1.-smoothstep(.014,.045,abs(length(flower)-.135));
        float detail = 1.-smoothstep(.09,.55,max(fwidth(vPave.x),fwidth(vPave.y)));
        diffuseColor.rgb *= 1.-detail*(.17*smoothstep(.465,.495,joint)+.07*ring);`
      );
  };
  return {
    night,
    glass,
    stone,
    water,
    pavers,
    metal: m({ metalness: 0.36, roughness: 0.47 }),
    dark: m({ roughness: 0.88 }),
    solid: new T.MeshStandardMaterial({ roughness: 0.75 }),
    leaves: new T.MeshStandardMaterial({ roughness: 1, flatShading: true }),
    lamp: new T.MeshStandardMaterial({ color: 'white', emissive: '#ffd497', emissiveIntensity: 0.15 }),
  };
}

// An original, low-frequency city panorama gives the glazing a skyline to reflect without external HDR assets.
export function reflectionMap(renderer) {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d'),
    grad = ctx.createLinearGradient(0, 0, 0, 512);
  for (const [pos, color] of [
    [0, '#6299ae'],
    [0.29, '#a4cbcf'],
    [0.47, '#ebead4'],
    [0.54, '#dad9c7'],
    [1, '#a79f87'],
  ])
    grad.addColorStop(pos, color);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1024, 512);
  const r = random(199);
  for (let layer = 0; layer < 2; layer++)
    for (let x = 0; x < 1024; ) {
      const w = 7 + r() * 35,
        h = 8 + r() * 45;
      ctx.fillStyle = layer ? '#737e77' : '#9caeac';
      ctx.fillRect(x, 284 - h + layer * 15, w, h + 75);
      ctx.fillStyle = layer ? '#9faaa0' : '#ced5c6';
      for (let xx = x + 3; xx < x + w - 2; xx += 5)
        for (let y = 288 - h + layer * 15; y < 289; y += 7) ctx.fillRect(xx, y, 2.6, 3);
      x += w + 2 + r() * 5;
    }
  const tx = new T.CanvasTexture(c);
  tx.mapping = T.EquirectangularReflectionMapping;
  tx.colorSpace = T.SRGBColorSpace;
  const gen = new T.PMREMGenerator(renderer),
    target = gen.fromEquirectangular(tx);
  tx.dispose();
  gen.dispose();
  return target.texture;
}
