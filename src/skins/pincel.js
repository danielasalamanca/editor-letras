import { measureStroke, resample } from '../skeleton/geometry.js';
import { ribbon } from './shapes.js';
import { noise1D } from './random.js';

export default {
  id: 'pincel',
  name: 'Pincel',
  description: 'Cerdas que se afinan en los extremos. Ruido = pincel seco. Rotación = ángulo del pincel.',
  uses: ['grosor', 'densidad', 'tamano', 'rotacion', 'ruido', 'semilla'],
  labels: { densidad: 'Cerdas', tamano: 'Grosor de cerda', rotacion: 'Ángulo' },
  generate(strokes, p, rng) {
    const shapes = [];
    const count = Math.max(2, Math.min(30, Math.round(p.densidad * 2)));
    const angle = (p.rotacion * Math.PI) / 180;
    for (const stroke of strokes) {
      const samples = resample(measureStroke(stroke), 0.05);
      for (let k = 0; k < count; k++) {
        const base = (rng() - 0.5) * p.grosor;
        const half = 0.03 * p.tamano * (0.5 + rng());
        const drift = noise1D(rng, 0.7);
        // Con ruido, algunas cerdas empiezan tarde o terminan antes.
        const t0 = rng() * p.ruido * 0.35;
        const t1 = 1 - rng() * p.ruido * 0.5;
        const part = samples.filter((s) => s.t >= t0 && s.t <= t1);
        if (part.length < 2) continue;
        const rib = ribbon(part, (s) => {
          const lt = (s.t - t0) / Math.max(1e-6, t1 - t0);
          const taper = Math.pow(Math.max(0, Math.sin(Math.PI * lt)), 0.35);
          const spread = 0.4 + 0.6 * Math.abs(Math.sin(s.a - angle));
          const o = base * spread + drift(s.s) * p.ruido * 0.15;
          const h = half * taper;
          return [h - o, h + o];
        });
        if (rib) shapes.push(rib);
      }
    }
    return shapes;
  },
};
