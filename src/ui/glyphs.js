// Lista de glifos con miniaturas renderizadas con la piel actual.
import { GROUPS, GRID } from '../skeleton/charset.js';
import { glyphShapes } from '../skins/index.js';
import { traceShapes } from '../skins/shapes.js';
import { getProject, ui } from '../state.js';

const CELL_W = 46, CELL_H = 58;

export function createGlyphList(container, { onSelect }) {
  const cells = new Map();
  for (const group of GROUPS) {
    const h = document.createElement('h3');
    h.className = 'group-title';
    h.textContent = group.name;
    const grid = document.createElement('div');
    grid.className = 'glyph-grid';
    for (const ch of group.chars) {
      const btn = document.createElement('button');
      btn.className = 'glyph-cell';
      btn.title = `Editar «${ch}»`;
      const canvas = document.createElement('canvas');
      const label = document.createElement('span');
      label.textContent = ch;
      btn.append(canvas, label);
      btn.addEventListener('click', () => onSelect(ch));
      grid.append(btn);
      cells.set(ch, { btn, canvas });
    }
    container.append(h, grid);
  }

  function render() {
    const project = getProject();
    const dpr = window.devicePixelRatio || 1;
    const rows = GRID.bottom - GRID.top;
    for (const [ch, { btn, canvas }] of cells) {
      btn.classList.toggle('active', ch === ui.current);
      const g = project.glyphs[ch];
      btn.classList.toggle('empty', !g.strokes.length);
      if (canvas.width !== CELL_W * dpr) {
        canvas.width = CELL_W * dpr;
        canvas.height = CELL_H * dpr;
      }
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = project.params.colorFondo;
      ctx.fillRect(0, 0, CELL_W, CELL_H);
      if (!g.strokes.length) continue;
      const unit = Math.min((CELL_H - 6) / rows, (CELL_W - 10) / Math.max(g.width, 1));
      ctx.fillStyle = project.params.colorLetra;
      ctx.beginPath();
      traceShapes(ctx, glyphShapes(project, ch, g), (CELL_W - g.width * unit) / 2, (CELL_H - rows * unit) / 2 - GRID.top * unit, unit);
      ctx.fill('nonzero');
    }
  }

  return { render, scrollToCurrent: () => cells.get(ui.current)?.btn.scrollIntoView({ block: 'nearest' }) };
}
