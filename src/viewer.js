import * as T from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { architecture, west, east, sitePoint } from './architecture.js';
import { streets } from './street.js';
import { workshop, makeMaterials, reflectionMap } from './fabric.js';

const v = (x, y, z) => new T.Vector3(x, y, z);
const physical = ([x, z], height) => v(-x, height, z);
const limits = [
  ...[
    [-59.7, 51],
    [22.1, 51],
    [54.4, -47],
    [-12.3, -47],
  ].map((p) => physical(p, -2.65)),
  ...west.map((p) => physical(p, 25)),
  ...east.map((p) => physical(p, 49.8)),
  ...[
    [0, 0.25],
    [1, 0.25],
    [1, 0.953],
    [0, 0.953],
  ].map(([u, t]) => physical(sitePoint(west, u, t), 63.1)),
];
const names = {
  conjunto: 'Perspectiva del conjunto',
  calle: 'Desde la esquina de la Diagonal',
  cubierta: 'Las cubiertas y el patio entre las dos piezas',
};
const moods = {
  dia: {
    sky: '#d4eaf1',
    ground: '#b5ae9d',
    hemi: 1.05,
    sun: '#fff0d4',
    power: 2.85,
    dir: [-47, 102, 62],
    env: 0.76,
    night: 0,
    shadow: 0.14,
    exposure: 1,
  },
  ocaso: {
    sky: '#ffd1ab',
    ground: '#af9191',
    hemi: 1.0,
    sun: '#ffb46d',
    power: 3.55,
    dir: [76, 39, 29],
    env: 0.53,
    night: 0.18,
    shadow: 0.16,
    exposure: 1.02,
  },
  noche: {
    sky: '#9fb8e4',
    ground: '#688091',
    hemi: 0.49,
    sun: '#b4d5ff',
    power: 0.9,
    dir: [-61, 66, -25],
    env: 0.21,
    night: 1.0,
    shadow: 0.15,
    exposure: 0.85,
  },
};

export function mountViewer(stage, onView, onOrbit, onLoss) {
  const host = stage.querySelector('.surface'),
    needle = stage.querySelector('#needle'),
    northLabel = stage.querySelector('#north-label');
  const marks = stage.querySelector('#marks'),
    pins = [...marks.children];
  const anchors = [
    physical(sitePoint(west, 0.68, 0.036), 24.95),
    physical(sitePoint(west, 0.51, 0.262), 61.9),
    physical(sitePoint(east, 0.48, 0.106), 48.4),
  ];
  const renderer = new T.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  });
  renderer.setClearColor(0, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.85));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    'aria-label',
    'Maqueta 3D de Diagonal 199. Usa las flechas para girar y los signos más y menos para acercar o alejar.'
  );
  host.append(canvas);
  const scene = new T.Scene(),
    group = new T.Group();
  group.scale.x = -1;
  scene.add(group);
  const materials = makeMaterials(),
    shop = workshop(group, materials);
  scene.environment = reflectionMap(renderer);
  architecture(shop, group);
  streets(shop, group);
  shop.finish();
  const hemi = new T.HemisphereLight(),
    sun = new T.DirectionalLight();
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.00038;
  sun.shadow.normalBias = 0.065;
  Object.assign(sun.shadow.camera, { left: -94, right: 94, bottom: -94, top: 94, near: 1, far: 300 });
  sun.target.position.set(0, 12, 0);
  scene.add(hemi, sun, sun.target);
  const entries = [
    [16, 3.5, 34],
    [-11, 3.4, 34],
    [19, 3, -15],
  ].map((p) => {
    const lamp = new T.PointLight('#ffbe75', 0, 17, 2);
    lamp.position.set(...p);
    scene.add(lamp);
    return lamp;
  });
  const shadow = new T.ShadowMaterial({ color: '#34463b', opacity: 0.2, depthWrite: false });
  const ground = new T.Mesh(new T.PlaneGeometry(1200, 1200), shadow);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2.69;
  ground.receiveShadow = true;
  scene.add(ground);
  const camera = new T.PerspectiveCamera(33, 1, 0.55, 1250),
    controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.1;
  controls.enablePan = false;
  controls.minDistance = 24;
  controls.maxDistance = 520;
  controls.minPolarAngle = 0.12;
  controls.maxPolarAngle = 1.84;
  controls.rotateSpeed = 0.65;
  controls.zoomSpeed = 0.85;
  controls.autoRotateSpeed = 0.65;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 'conjunto',
    flight = null,
    frame = 0,
    previous = 0,
    visible = true,
    lost = false,
    dirty = true;
  let width = 0,
    height = 0,
    altered = false;
  const spherical = new T.Spherical(),
    position = v(0, 0, 0);
  const clock = () => performance.now();
  const request = () => {
    if (!frame && visible && !document.hidden && !lost) frame = requestAnimationFrame(tick);
  };
  function tick(now) {
    frame = 0;
    const dt = Math.min(0.05, (now - (previous || now)) / 1000);
    previous = now;
    if (flight) {
      const t = Math.min(1, (now - flight.start) / flight.ms),
        p = t * t * (3 - 2 * t);
      const f = flight;
      controls.target.lerpVectors(f.fromT, f.toT, p);
      spherical.set(
        T.MathUtils.lerp(f.from.radius, f.to.radius, p),
        T.MathUtils.lerp(f.from.phi, f.to.phi, p),
        T.MathUtils.lerp(f.from.theta, f.to.theta, p)
      );
      camera.position.copy(controls.target).add(position.setFromSpherical(spherical));
      if (t === 1) flight = null;
      dirty = true;
    }
    const moving = controls.update(dt);
    if (camera.position.y < 1.65) {
      camera.position.y = 1.65;
      camera.lookAt(controls.target);
      dirty = true;
    }
    if (moving || dirty) {
      // In this local frame true north is rotated ~19° towards the east end of the avenue.
      const angle = controls.getAzimuthalAngle() + Math.PI + (18.7 * Math.PI) / 180;
      needle.setAttribute('transform', `rotate(${(angle * 180) / Math.PI} 18 23)`);
      northLabel.setAttribute('x', 18 + 15 * Math.sin(angle));
      northLabel.setAttribute('y', 25.5 - 15 * Math.cos(angle));
      renderer.render(scene, camera);
      if (!marks.hidden)
        anchors.forEach((a, i) => {
          const p = position.copy(a).project(camera);
          pins[i].hidden = p.z < -1 || p.z > 1 || Math.abs(p.x) > 0.96 || Math.abs(p.y) > 0.93;
          pins[i].style.transform =
            `translate(${((p.x + 1) * width) / 2 - 14}px,${((1 - p.y) * height) / 2 - 14}px)`;
        });
      dirty = false;
    }
    if (flight || controls.autoRotate || moving) request();
  }
  const invalidate = () => {
    dirty = true;
    request();
  };
  function mood(key) {
    const m = moods[key];
    stage.dataset.light = key;
    hemi.color.set(m.sky);
    hemi.groundColor.set(m.ground);
    hemi.intensity = m.hemi;
    sun.color.set(m.sun);
    sun.intensity = m.power;
    sun.position.set(...m.dir).multiplyScalar(1.6);
    scene.environmentIntensity = m.env;
    materials.night.value = m.night;
    materials.lamp.emissiveIntensity = 0.12 + m.night * 2.6;
    entries.forEach((l) => (l.intensity = m.night * 65));
    shadow.opacity = m.shadow;
    renderer.toneMappingExposure = m.exposure;
    renderer.shadowMap.needsUpdate = true;
    invalidate();
  }
  function overview(dir, fill) {
    dir.normalize();
    const right = v(0, 1, 0).cross(dir).normalize(),
      up = dir.clone().cross(right),
      target = v(0, 24, 0);
    const tan = Math.tan(T.MathUtils.degToRad(camera.fov / 2));
    let distance = 0;
    // Centre the projected silhouette, rather than including the empty corners of a 3D bounding box.
    for (let pass = 0; pass < 3; pass++) {
      distance = 0;
      for (const point of limits) {
        const d = point.clone().sub(target);
        distance = Math.max(
          distance,
          d.dot(dir) +
            Math.max(
              Math.abs(d.dot(right)) / (tan * camera.aspect * fill),
              Math.abs(d.dot(up)) / (tan * fill)
            )
        );
      }
      if (pass === 2) break;
      let x0 = Infinity,
        x1 = -Infinity,
        y0 = Infinity,
        y1 = -Infinity;
      for (const point of limits) {
        const d = point.clone().sub(target),
          k = distance / (distance - d.dot(dir)),
          x = d.dot(right) * k,
          y = d.dot(up) * k;
        x0 = Math.min(x0, x);
        x1 = Math.max(x1, x);
        y0 = Math.min(y0, y);
        y1 = Math.max(y1, y);
      }
      target.addScaledVector(right, (x0 + x1) * 0.5).addScaledVector(up, (y0 + y1) * 0.5);
    }
    return { target, offset: dir.multiplyScalar(distance) };
  }
  function preset(key) {
    if (key === 'calle') {
      const target = v(4, 28, 5),
        eye = v(102, 4.2, 101);
      return { target, offset: eye.sub(target).multiplyScalar(camera.aspect < 0.88 ? 1.19 : 1) };
    }
    return key === 'cubierta'
      ? overview(v(-0.38, 2.48, 0.63), 0.84)
      : overview(
          camera.aspect < 1 ? v(1.2, 0.76, 0.9) : v(-0.46, 0.64, 1.1),
          camera.aspect < 1 ? 0.92 : 0.87
        );
  }
  function stopOrbit() {
    if (controls.autoRotate) {
      controls.autoRotate = false;
      onOrbit(false);
    }
  }
  function fly(target, offset, ms) {
    if (reduce.matches || ms === 0) {
      flight = null;
      controls.target.copy(target);
      camera.position.copy(target).add(offset);
      controls.update();
      invalidate();
      return;
    }
    const from = new T.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
    const to = new T.Spherical().setFromVector3(offset);
    to.theta =
      from.theta + T.MathUtils.euclideanModulo(to.theta - from.theta + Math.PI, Math.PI * 2) - Math.PI;
    flight = { from, to, fromT: controls.target.clone(), toT: target.clone(), ms, start: clock() };
    request();
  }
  function view(key, animate = true) {
    stopOrbit();
    altered = false;
    current = key;
    const { target, offset } = preset(key);
    fly(target, offset, animate ? 800 : 0);
    onView(key, names[key]);
  }
  function zoom(factor) {
    flight = null;
    altered = true;
    const d = camera.position.clone().sub(controls.target);
    d.setLength(T.MathUtils.clamp(d.length() * factor, controls.minDistance, controls.maxDistance));
    fly(controls.target.clone(), d, 210);
  }
  function orbit() {
    flight = null;
    controls.autoRotate = !controls.autoRotate;
    if (controls.autoRotate) altered = true;
    onOrbit(controls.autoRotate);
    request();
  }
  controls.addEventListener('start', () => {
    flight = null;
    altered = true;
    stopOrbit();
  });
  controls.addEventListener('change', invalidate);
  canvas.addEventListener('keydown', (e) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '=', '-', 'Home'].includes(e.key))
      return;
    e.preventDefault();
    if (e.key === 'Home') {
      view('conjunto');
      return;
    }
    if (['+', '=', '-'].includes(e.key)) {
      zoom(e.key === '-' ? 1.18 : 0.85);
      return;
    }
    flight = null;
    stopOrbit();
    altered = true;
    spherical.setFromVector3(camera.position.clone().sub(controls.target));
    if (e.key === 'ArrowLeft') spherical.theta -= 0.11;
    if (e.key === 'ArrowRight') spherical.theta += 0.11;
    if (e.key === 'ArrowUp') spherical.phi -= 0.085;
    if (e.key === 'ArrowDown') spherical.phi += 0.085;
    spherical.phi = T.MathUtils.clamp(spherical.phi, controls.minPolarAngle, controls.maxPolarAngle);
    camera.position.copy(controls.target).add(position.setFromSpherical(spherical));
    invalidate();
  });
  function resize() {
    const w = host.clientWidth,
      h = host.clientHeight;
    if (!w || !h || (w === width && h === height)) return;
    width = w;
    height = h;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);
    if (!altered) view(current, false);
    else invalidate();
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) invalidate();
  }).observe(stage);
  document.addEventListener('visibilitychange', () => {
    previous = 0;
    if (!document.hidden) invalidate();
  });
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    lost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    stopOrbit();
    onLoss();
  });
  resize();
  mood('dia');
  controls.update();
  renderer.render(scene, camera);
  return { view, mood, orbit, zoom, invalidate };
}
