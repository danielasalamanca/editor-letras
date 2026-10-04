// Composición de texto con el alfabeto: posiciones de cada glifo en unidades de grilla.
import { GRID, SPACE_WIDTH } from './charset.js';

const LINE_HEIGHT = GRID.bottom - GRID.top;

/** Glifo a usar para un carácter; las minúsculas vacías heredan la mayúscula. */
export function resolveGlyph(project, ch) {
  const g = project.glyphs[ch];
  if (g && g.strokes.length) return { ch, glyph: g };
  const up = ch.toUpperCase();
  if (up !== ch && project.glyphs[up]?.strokes.length) return { ch: up, glyph: project.glyphs[up] };
  return g ? { ch, glyph: g } : null;
}

export function advanceOf(project, ch) {
  const r = resolveGlyph(project, ch);
  return (r ? r.glyph.width : SPACE_WIDTH) + project.params.espaciado;
}

/**
 * Distribuye el texto en líneas. maxWidth (unidades) activa el ajuste por palabras.
 * Devuelve { items: [{ ch, glyph, x, y }], width, height } donde (x, y) es el origen del glifo.
 */
export function layoutText(project, text, { maxWidth = Infinity, leading = 1.1 } = {}) {
  const lineStep = LINE_HEIGHT * leading;
  const lines = [];
  for (const para of text.split('\n')) {
    const words = para.split(/( +)/).filter((w) => w.length);
    let line = '';
    let lineW = 0;
    for (const word of words) {
      const w = [...word].reduce((acc, c) => acc + advanceOf(project, c), 0);
      if (line && lineW + w > maxWidth && word.trim()) {
        lines.push(line.replace(/ +$/, ''));
        line = '';
        lineW = 0;
      }
      if (!line && !word.trim()) continue;
      line += word;
      lineW += w;
    }
    lines.push(line);
  }

  const items = [];
  let width = 0;
  lines.forEach((line, li) => {
    let x = 0;
    for (const c of line) {
      const r = resolveGlyph(project, c);
      if (r && r.glyph.strokes.length) items.push({ ch: r.ch, glyph: r.glyph, x: x + project.params.espaciado / 2, y: li * lineStep });
      x += advanceOf(project, c);
    }
    width = Math.max(width, x);
  });
  const height = lines.length ? (lines.length - 1) * lineStep + LINE_HEIGHT : 0;
  return { items, width, height };
}
