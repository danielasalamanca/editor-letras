import { measureStroke, resample } from '../skeleton/geometry.js';
import { ribbon, circle } from './shapes.js';
import { noise1D } from './random.js';

export default {
  id: 'contraste',
  name: 'Contraste',
  description: 'Trazo de grosor variable, como una pluma de punta ancha. Rotación = ángulo de la pluma.',
  uses: ['grosor', 'tamano', 'rotacion', 'ruido', 'semilla'],
  labels: { tamano: 'Contraste', rotacion: 'Ángulo de pluma' },
  generate(strokes, p, rng) {
    const shapes = [];
    const nib = (p.rotacion * Math.PI) / 180;
    const thin = Math.max(0.04, 1 / (1 + p.tamano * 2.5));
    for (const stroke of strokes) {
      const samples = resample(measureStroke(stroke), 0.04);
      const n = noise1D(rng, 0.6);
      const halfAt = (s) => (p.grosor / 2) * (thin + (1 - thin) * Math.abs(Math.sin(s.a - nib))) * Math.max(0.05, 1 + n(s.s) * p.ruido);
      const rib = ribbon(samples, (s) => { const h = halfAt(s); return [h, h]; });
      if (rib) shapes.push(rib);
      // Remates redondos en los extremos.
      const a = samples[0], b = samples[samples.length - 1];
      shapes.push(circle(a.x, a.y, halfAt(a)), circle(b.x, b.y, halfAt(b)));
    }
    return shapes;
  },
};
