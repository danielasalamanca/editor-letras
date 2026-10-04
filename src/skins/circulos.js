import { measureStroke, resample } from '../skeleton/geometry.js';
import { circle } from './shapes.js';
import { jitter } from './random.js';

export default {
  id: 'circulos',
  name: 'Círculos',
  description: 'Círculos repartidos a lo largo del trazo.',
  uses: ['grosor', 'densidad', 'tamano', 'ruido', 'semilla'],
  generate(strokes, p, rng) {
    const shapes = [];
    for (const stroke of strokes) {
      for (const s of resample(measureStroke(stroke), 1 / p.densidad)) {
        const r = (p.grosor / 2) * p.tamano * (1 + jitter(rng, p.ruido * 0.6));
        shapes.push(circle(s.x + jitter(rng, p.ruido * 0.5), s.y + jitter(rng, p.ruido * 0.5), r));
      }
    }
    return shapes;
  },
};
