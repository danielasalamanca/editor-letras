import { measureStroke, pointAt } from '../skeleton/geometry.js';
import { circle } from './shapes.js';
import { jitter } from './random.js';

export default {
  id: 'puntos',
  name: 'Puntos aleatorios',
  description: 'Nube de puntos dentro del grosor del trazo. Cambia la semilla para otra distribución.',
  uses: ['grosor', 'densidad', 'tamano', 'ruido', 'semilla'],
  generate(strokes, p, rng) {
    const shapes = [];
    for (const stroke of strokes) {
      const m = measureStroke(stroke);
      const count = Math.min(4000, Math.round(Math.max(1, m.length) * p.densidad * Math.max(0.15, p.grosor) * 8));
      for (let i = 0; i < count; i++) {
        const s = pointAt(m, rng() * m.length);
        const off = jitter(rng, p.grosor / 2) + jitter(rng, p.ruido * 0.6) * rng();
        const nx = -Math.sin(s.a), ny = Math.cos(s.a);
        const r = 0.05 * p.tamano * (0.4 + rng());
        shapes.push(circle(s.x + nx * off, s.y + ny * off, r));
      }
    }
    return shapes;
  },
};
