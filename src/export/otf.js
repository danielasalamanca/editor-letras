// Exporta el alfabeto completo como fuente .otf (contornos CFF) con opentype.js.
import { Font, Glyph, Path } from 'opentype.js';
import { CHARSET, GRID, SPACE_WIDTH, glyphName } from '../skeleton/charset.js';
import { resolveGlyph } from '../skeleton/layout.js';
import { glyphShapes } from '../skins/index.js';
import { downloadBlob, fileSafe } from './download.js';

const S = 100; // unidades de fuente por unidad de grilla
const KAPPA = 0.5522847498;

function shapesToFontPath(shapes, ox) {
  const path = new Path();
  const X = (x) => Math.round((x + ox) * S);
  const Y = (y) => Math.round((GRID.baseline - y) * S);
  for (const sh of shapes) {
    if (sh.type === 'circle') {
      const cx = X(sh.x), cy = Y(sh.y), r = sh.r * S, k = r * KAPPA;
      if (r < 1) continue;
      // Sentido antihorario (convención PostScript para contornos exteriores).
      path.moveTo(cx + r, cy);
      path.curveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
      path.curveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
      path.curveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
      path.curveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
      path.close();
    } else {
      // Al invertir el eje Y la orientación se invierte; recorremos al revés para quedar antihorario.
      const pts = sh.pts.slice().reverse();
      pts.forEach(([x, y], i) => (i ? path.lineTo(X(x), Y(y)) : path.moveTo(X(x), Y(y))));
      path.close();
    }
  }
  return path;
}

export function buildFont(project) {
  const { espaciado } = project.params;
  const glyphs = [
    new Glyph({ name: '.notdef', unicode: 0, advanceWidth: Math.round((4 + espaciado) * S), path: new Path() }),
    new Glyph({ name: 'space', unicode: 32, advanceWidth: Math.round((SPACE_WIDTH + espaciado) * S), path: new Path() }),
  ];
  for (const ch of CHARSET) {
    const r = resolveGlyph(project, ch);
    if (!r || !r.glyph.strokes.length) continue;
    glyphs.push(new Glyph({
      name: glyphName(ch),
      unicode: ch.codePointAt(0),
      advanceWidth: Math.round((r.glyph.width + espaciado) * S),
      path: shapesToFontPath(glyphShapes(project, r.ch, r.glyph), espaciado / 2),
    }));
  }
  const familyName = (project.name || 'Alfabeto').trim() || 'Alfabeto';
  return new Font({
    familyName,
    styleName: 'Regular',
    unitsPerEm: 1000,
    ascender: (GRID.baseline - GRID.top) * S,
    descender: -(GRID.bottom - GRID.baseline) * S,
    designer: 'Editor de letras experimentales',
    glyphs,
  });
}

export function exportOTF(project) {
  const font = buildFont(project);
  downloadBlob(new Blob([font.toArrayBuffer()], { type: 'font/otf' }), `${fileSafe(project.name)}.otf`);
}
