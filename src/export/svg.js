import { compose } from './composition.js';
import { glyphShapes } from '../skins/index.js';
import { downloadBlob, fileSafe } from './download.js';

const PAD = 1.5;
const n = (v) => Math.round(v * 100) / 100;

/** Formas → atributo `d` de SVG (misma orientación que en Canvas). */
export function shapesToSvgPath(shapes, ox, oy, s) {
  let d = '';
  for (const sh of shapes) {
    if (sh.type === 'circle') {
      const cx = ox + sh.x * s, cy = oy + sh.y * s, r = sh.r * s;
      if (r <= 0) continue;
      d += `M${n(cx + r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)}A${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(cy)}Z`;
    } else {
      d += sh.pts.map(([x, y], i) => `${i ? 'L' : 'M'}${n(ox + x * s)} ${n(oy + y * s)}`).join('') + 'Z';
    }
  }
  return d;
}

export function exportSVG(project, maxWidthPx) {
  const { unit, layout } = compose(project, maxWidthPx);
  const w = n((layout.width + PAD * 2) * unit);
  const h = n((layout.height + PAD * 2) * unit);
  const paths = layout.items
    .map((it) => `  <path d="${shapesToSvgPath(glyphShapes(project, it.ch, it.glyph), (PAD + it.x) * unit, (PAD + it.y) * unit, unit)}"/>`)
    .join('\n');
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="100%" height="100%" fill="${project.params.colorFondo}"/>
  <g fill="${project.params.colorLetra}" fill-rule="nonzero">
${paths}
  </g>
</svg>
`;
  downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${fileSafe(project.name)}.svg`);
}
