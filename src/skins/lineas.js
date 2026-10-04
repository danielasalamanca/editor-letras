import { measureStroke, resample } from '../skeleton/geometry.js';
import { ribbon } from './shapes.js';
import { noise1D } from './random.js';

export default {
  id: 'lineas',
  name: 'Líneas paralelas',
  description: 'Varias líneas finas que recorren el trazo. Densidad = cantidad de líneas.',
  uses: ['grosor', 'densidad', 'tamano', 'ruido', 'semilla'],
  labels: { densidad: 'Líneas', tamano: 'Grosor de línea' },
  generate(strokes, p, rng) {
    const shapes = [];
    const n = Math.max(1, Math.min(16, Math.round(p.densidad)));
    const half = Math.max(0.005, 0.04 * p.tamano);
    for (const stroke of strokes) {
      const samples = resample(measureStroke(stroke), 0.05);
      for (let k = 0; k < n; k++) {
        const offset = n === 1 ? 0 : -p.grosor / 2 + (p.grosor * k) / (n - 1);
        const wobble = noise1D(rng, 0.8);
        const rib = ribbon(samples, (s) => {
          const o = offset + wobble(s.s) * p.ruido * 0.35;
          return [half - o, half + o];
        });
        if (rib) shapes.push(rib);
      }
    }
    return shapes;
  },
};
