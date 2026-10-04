// Dibujo de una composición de texto (vista de prueba y PNG).
import { GRID } from '../skeleton/charset.js';
import { layoutText } from '../skeleton/layout.js';
import { glyphShapes } from '../skins/index.js';
import { traceShapes } from '../skins/shapes.js';

export const CAP_HEIGHT = GRID.baseline - GRID.cap;

/** Píxeles por unidad de grilla para un tamaño de mayúscula en px. */
export const unitFor = (capPx) => capPx / CAP_HEIGHT;

export function compose(project, maxWidthPx) {
  const unit = unitFor(project.test.size);
  return { unit, layout: layoutText(project, project.test.text, { maxWidth: maxWidthPx / unit, leading: project.test.leading }) };
}

export function drawComposition(ctx, project, layout, ox, oy, unit) {
  ctx.fillStyle = project.params.colorLetra;
  ctx.beginPath();
  for (const it of layout.items) traceShapes(ctx, glyphShapes(project, it.ch, it.glyph), ox + it.x * unit, oy + it.y * unit, unit);
  ctx.fill('nonzero');
}
