import { measureStroke, resample } from '../skeleton/geometry.js';
import { rect } from './shapes.js';
import { jitter } from './random.js';

export default {
  id: 'pixeles',
  name: 'Píxeles',
  description: 'El trazo se rasteriza en una grilla de cuadrados. Densidad = finura de la grilla.',
  uses: ['grosor', 'densidad', 'tamano', 'rotacion', 'ruido', 'semilla'],
  labels: { tamano: 'Tamaño del cuadrado' },
  generate(strokes, p, rng) {
    const cell = 1 / p.densidad;
    const radius = Math.max(p.grosor / 2, cell * 0.5);
    const cells = new Map();
    for (const stroke of strokes) {
      for (const s of resample(measureStroke(stroke), cell / 3)) {
        const i0 = Math.floor((s.x - radius) / cell), i1 = Math.ceil((s.x + radius) / cell);
        const j0 = Math.floor((s.y - radius) / cell), j1 = Math.ceil((s.y + radius) / cell);
        for (let i = i0; i <= i1; i++) {
          for (let j = j0; j <= j1; j++) {
            const cx = (i + 0.5) * cell, cy = (j + 0.5) * cell;
            if (Math.hypot(cx - s.x, cy - s.y) <= radius) cells.set(`${i},${j}`, [cx, cy]);
          }
        }
      }
    }
    const rot = (p.rotacion * Math.PI) / 180;
    return [...cells.values()].map(([x, y]) =>
      rect(x + jitter(rng, p.ruido * cell), y + jitter(rng, p.ruido * cell), cell * p.tamano, cell * p.tamano, rot + jitter(rng, p.ruido * 0.8)));
  },
};
