import './style.css';
import { setIcon } from './icons.js';

document.querySelectorAll('[data-icon]').forEach((el) => setIcon(el, el.dataset.icon));
const $ = (id) => document.getElementById(id);
const stage = $('stage'),
  viewer = $('visor'),
  notes = $('notes'),
  expand = $('expand');
const live = document.querySelectorAll('.live-control,[data-view],button[data-light]');
const pressed = (selector, attr, value) =>
  document
    .querySelectorAll(selector)
    .forEach((b) => b.setAttribute('aria-pressed', String(b.dataset[attr] === value)));

document
  .querySelectorAll('[data-open-notes]')
  .forEach((b) => b.addEventListener('click', () => notes.showModal()));
$('close').addEventListener('click', () => notes.close());
notes.addEventListener('click', (e) => {
  const r = notes.getBoundingClientRect();
  if (
    e.target === notes &&
    (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom)
  )
    notes.close();
});

function expandedState() {
  const active = document.fullscreenElement === viewer || viewer.classList.contains('expanded');
  expand.setAttribute('aria-label', active ? 'Reducir el visor' : 'Ampliar el visor');
  expand.title = expand.getAttribute('aria-label');
  setIcon(expand.firstElementChild, active ? 'contract' : 'expand');
}
function expandInPage(active) {
  viewer.classList.toggle('expanded', active);
  document.body.style.overflow = active ? 'hidden' : '';
  expandedState();
  document.querySelectorAll('.intro,.masthead,.folio').forEach((el) => {
    el.inert = active;
  });
  expand.focus();
}
expand.addEventListener('click', async () => {
  if (document.fullscreenElement === viewer) {
    await document.exitFullscreen();
    return;
  }
  if (viewer.classList.contains('expanded')) {
    expandInPage(false);
    return;
  }
  if (viewer.requestFullscreen && document.fullscreenEnabled) {
    try {
      await viewer.requestFullscreen();
      return;
    } catch (error) {
      console.info('Pantalla completa no disponible; ampliando dentro de la página.', error);
    }
  }
  expandInPage(true);
});
document.addEventListener('fullscreenchange', expandedState);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && viewer.classList.contains('expanded')) expandInPage(false);
});

function fallback(text) {
  stage.classList.remove('ready');
  stage.classList.add('fallback');
  stage.dataset.light = 'dia';
  live.forEach((b) => {
    b.disabled = true;
  });
  $('status').textContent = text;
  $('caption').textContent = 'Perspectiva del conjunto · imagen fija';
  pressed('button[data-light]', 'light', 'dia');
  pressed('[data-view]', 'view', 'conjunto');
  document.querySelector('.gesture').hidden = true;
  $('marks').hidden = true;
  $('field-note').hidden = true;
}
async function start() {
  try {
    const { mountViewer } = await import('./viewer.js');
    const model = mountViewer(
      stage,
      (key, label) => {
        pressed('[data-view]', 'view', key);
        $('caption').textContent = label;
      },
      (active) => {
        $('orbit').setAttribute('aria-pressed', String(active));
        $('orbit').setAttribute(
          'aria-label',
          active ? 'Detener giro automático' : 'Activar giro automático'
        );
      },
      () => fallback('Se ha perdido el contexto 3D. Recarga para volver a explorar.')
    );
    document
      .querySelectorAll('[data-view]')
      .forEach((b) => b.addEventListener('click', () => model.view(b.dataset.view)));
    document.querySelectorAll('button[data-light]').forEach((b) =>
      b.addEventListener('click', () => {
        model.mood(b.dataset.light);
        pressed('button[data-light]', 'light', b.dataset.light);
      })
    );
    const labels = [
      [
        '01 · Basamento del 199',
        'La piel de vidrio pasa del verde oscuro de la calle a tonos más claros cerca de la cornisa.',
      ],
      [
        '02 · Volumen del hotel',
        'El retranqueo deja una terraza sobre el basamento. Más arriba, huecos estrechos interrumpen la trama clara.',
      ],
      [
        '03 · Pieza vecina del 197',
        'El segundo cuerpo sigue otra alineación: la separación entre los dos cambia a lo largo de la manzana.',
      ],
    ];
    const detail = $('field-note');
    $('keys').addEventListener('click', () => {
      const show = $('marks').hidden;
      $('marks').hidden = !show;
      $('keys').setAttribute('aria-pressed', String(show));
      detail.hidden = true;
      pressed('[data-mark]', 'mark', '');
      model.invalidate();
    });
    document.querySelectorAll('[data-mark]').forEach((b) =>
      b.addEventListener('click', () => {
        const show = b.getAttribute('aria-pressed') !== 'true',
          [title, body] = labels[Number(b.dataset.mark)];
        const strong = document.createElement('strong');
        strong.textContent = title;
        detail.replaceChildren(strong, document.createTextNode(body));
        detail.hidden = !show;
        pressed('[data-mark]', 'mark', show ? b.dataset.mark : '');
      })
    );
    $('in').addEventListener('click', () => model.zoom(0.82));
    $('out').addEventListener('click', () => model.zoom(1.22));
    $('reset').addEventListener('click', () => model.view('conjunto'));
    $('orbit').addEventListener('click', () => model.orbit());
    stage.classList.add('ready');
    $('status').textContent = '';
    live.forEach((b) => {
      b.disabled = false;
    });
  } catch (error) {
    console.warn('No se ha podido iniciar la maqueta 3D.', error);
    fallback('Vista fija · El visor 3D necesita WebGL 2.');
  }
}
start();
