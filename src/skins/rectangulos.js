import { measureStroke, resample } from '../skeleton/geometry.js';
import { rect } from './shapes.js';
import { jitter } from './random.js';

export default {
  id: 'rectangulos',
  name: 'Rectángulos',
  description: 'Rectángulos orientados según la tangente del trazo. Tamaño 1 = se tocan.',
  uses: ['grosor', 'densidad', 'tamano', 'rotacion', 'ruido', 'semilla'],
  labels: { tamano: 'Largo' },
  generate(strokes, p, rng) {
    const shapes = [];
    const spacing = 1 / p.densidad;
    const rot = (p.rotacion * Math.PI) / 180;
    for (const stroke of strokes) {
      for (const s of resample(measureStroke(stroke), spacing)) {
        const angle = s.a + rot + jitter(rng, p.ruido * Math.PI * 0.5);
        shapes.push(rect(s.x + jitter(rng, p.ruido * 0.3), s.y + jitter(rng, p.ruido * 0.3), spacing * p.tamano, p.grosor, angle));
      }
    }
    return shapes;
  },
};
