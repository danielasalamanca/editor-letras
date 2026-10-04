// Vista de prueba: texto compuesto con el alfabeto.
import { compose, drawComposition } from '../export/composition.js';
import { getProject, live, commit } from '../state.js';

const PAD = 24;

export function createTestView(root) {
  const canvas = root.querySelector('#test-canvas');
  const text = root.querySelector('#test-text');
  const size = root.querySelector('#test-size');
  const ctx = canvas.getContext('2d');

  text.addEventListener('input', () => live((p) => { p.test.text = text.value; }));
  text.addEventListener('change', commit);
  size.addEventListener('input', () => live((p) => { p.test.size = Number(size.value); }));
  size.addEventListener('change', commit);

  const maxWidth = () => canvas.clientWidth - PAD * 2;

  function render() {
    const project = getProject();
    if (document.activeElement !== text && text.value !== project.test.text) text.value = project.test.text;
    if (Number(size.value) !== project.test.size) size.value = project.test.size;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = project.params.colorFondo;
    ctx.fillRect(0, 0, w, h);
    const { unit, layout } = compose(project, maxWidth());
    drawComposition(ctx, project, layout, PAD, Math.max(PAD / 2, (h - layout.height * unit) / 2), unit);
  }

  return { render, maxWidth };
}
