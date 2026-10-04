import './style.css';
import { CHARSET } from './skeleton/charset.js';
import { createEditor } from './skeleton/editor.js';
import { createGlyphList } from './ui/glyphs.js';
import { createPanel } from './ui/panel.js';
import { createTestView } from './ui/testview.js';
import { exportPNG } from './export/png.js';
import { exportSVG } from './export/svg.js';
import { exportOTF } from './export/otf.js';
import { saveProjectFile, readProjectFile } from './export/project.js';
import { getProject, subscribe, ui, change, live, commit, undo, redo, canUndo, canRedo, replaceProject, newProject } from './state.js';

const $ = (sel) => document.querySelector(sel);

const HINTS = {
  linea: 'Arrastra entre dos puntos de la grilla para crear una línea. Alt: sin imán.',
  curva: 'Arrastra para crear una curva; luego ajústala con Mover arrastrando sus manejadores.',
  mover: 'Arrastra puntos o trazos completos. Los extremos unidos se mueven juntos. Doble clic: línea ↔ curva.',
  borrar: 'Haz clic (o arrastra) sobre un trazo para borrarlo.',
};

const toolButtons = [...document.querySelectorAll('[data-tool]')];
const editor = createEditor($('#editor-canvas'), {
  onToolChange(tool) {
    toolButtons.forEach((b) => b.classList.toggle('active', b.dataset.tool === tool));
    $('#hint').textContent = HINTS[tool];
  },
});
const glyphList = createGlyphList($('#glyph-list'), { onSelect: select });
const panel = createPanel($('#panel'));
const testView = createTestView($('#test'));

function select(ch) {
  ui.current = ch;
  scheduleRender();
  glyphList.scrollToCurrent();
}

// --- Render agrupado por cuadro ---
let frame = 0;
function scheduleRender() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    const project = getProject();
    editor.render();
    glyphList.render();
    panel.render();
    testView.render();
    $('#current-char').textContent = ui.current;
    $('#width-value').textContent = project.glyphs[ui.current].width;
    if (document.activeElement !== $('#project-name')) $('#project-name').value = project.name;
    $('#undo').disabled = !canUndo();
    $('#redo').disabled = !canRedo();
  });
}
subscribe(scheduleRender);
new ResizeObserver(scheduleRender).observe(document.body);

// --- Herramientas y acciones de glifo ---
toolButtons.forEach((b) => b.addEventListener('click', () => editor.setTool(b.dataset.tool)));
$('#snap').addEventListener('change', (e) => editor.setSnap(e.target.checked));
$('#show-skin').addEventListener('change', (e) => editor.setShowSkin(e.target.checked));

const setWidth = (d) => change((p) => {
  const g = p.glyphs[ui.current];
  g.width = Math.max(0.5, Math.min(10, g.width + d));
});
$('#width-minus').addEventListener('click', (e) => { e.preventDefault(); setWidth(-0.5); });
$('#width-plus').addEventListener('click', (e) => { e.preventDefault(); setWidth(0.5); });

let clipboard = null;
$('#copy').addEventListener('click', () => {
  clipboard = structuredClone(getProject().glyphs[ui.current]);
  toast(`«${ui.current}» copiada`);
});
$('#paste').addEventListener('click', () => {
  if (!clipboard) return toast('Primero copia una letra');
  change((p) => { p.glyphs[ui.current] = structuredClone(clipboard); });
});
$('#clear').addEventListener('click', () => change((p) => { p.glyphs[ui.current].strokes = []; }));

// --- Proyecto ---
$('#project-name').addEventListener('input', (e) => live((p) => { p.name = e.target.value; }));
$('#project-name').addEventListener('change', commit);
$('#undo').addEventListener('click', undo);
$('#redo').addEventListener('click', redo);
$('#new').addEventListener('click', () => {
  if (confirm('¿Empezar un proyecto nuevo? Podrás deshacerlo con ⌘Z.')) replaceProject(newProject());
});
$('#save').addEventListener('click', () => saveProjectFile(getProject()));
$('#open').addEventListener('click', () => $('#file-input').click());
$('#file-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  e.target.value = '';
  if (!file) return;
  try {
    replaceProject(await readProjectFile(file));
    toast(`Proyecto «${getProject().name}» cargado`);
  } catch (err) {
    toast(err.message);
  }
});

$('#export-png').addEventListener('click', () => exportPNG(getProject(), testView.maxWidth()));
$('#export-svg').addEventListener('click', () => exportSVG(getProject(), testView.maxWidth()));
$('#export-otf').addEventListener('click', () => {
  try {
    exportOTF(getProject());
  } catch (err) {
    console.error(err);
    toast(`No se pudo generar la fuente: ${err.message}`);
  }
});

// --- Teclado ---
window.addEventListener('keydown', (e) => {
  const mod = e.metaKey || e.ctrlKey;
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) && document.activeElement.type !== 'range' && document.activeElement.type !== 'checkbox';
  if (mod && e.key.toLowerCase() === 'z') {
    if (typing && document.activeElement.type !== 'color') return;
    e.preventDefault();
    e.shiftKey ? redo() : undo();
    return;
  }
  if (mod && e.key.toLowerCase() === 'y') { if (!typing) { e.preventDefault(); redo(); } return; }
  if (typing || mod || e.altKey) return;
  const tools = { l: 'linea', c: 'curva', v: 'mover', e: 'borrar' };
  if (tools[e.key.toLowerCase()]) editor.setTool(tools[e.key.toLowerCase()]);
  if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
    const i = CHARSET.indexOf(ui.current);
    select(CHARSET[(i + (e.key === 'ArrowRight' ? 1 : -1) + CHARSET.length) % CHARSET.length]);
    e.preventDefault();
  }
});

let toastTimer = 0;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

editor.setTool('linea');
scheduleRender();
