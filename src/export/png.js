import { compose, drawComposition } from './composition.js';
import { downloadBlob, fileSafe } from './download.js';

const PAD = 1.5; // unidades de grilla alrededor del texto
const SCALE = 2; // resolución de exportación

export function exportPNG(project, maxWidthPx) {
  const { unit, layout } = compose(project, maxWidthPx);
  const u = unit * SCALE;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.ceil((layout.width + PAD * 2) * u));
  canvas.height = Math.max(1, Math.ceil((layout.height + PAD * 2) * u));
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = project.params.colorFondo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawComposition(ctx, project, layout, PAD * u, PAD * u, u);
  canvas.toBlob((blob) => downloadBlob(blob, `${fileSafe(project.name)}.png`), 'image/png');
}
