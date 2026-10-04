// Geometría de trazos: muestreo de líneas y béziers, medición por longitud de arco.

const CURVE_SEGMENTS = 48;

function cubic(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t;
  return [a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]];
}

/** Convierte un trazo en una polilínea densa [[x, y], ...]. */
export function strokePolyline(stroke) {
  const p = stroke.p;
  if (stroke.type === 'curve') {
    const out = [];
    for (let i = 0; i <= CURVE_SEGMENTS; i++) out.push(cubic(p[0], p[1], p[2], p[3], i / CURVE_SEGMENTS));
    return out;
  }
  return [p[0], p[1]];
}

/** Precalcula longitudes acumuladas de una polilínea. */
export function measure(poly) {
  const cum = [0];
  for (let i = 1; i < poly.length; i++) {
    cum.push(cum[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  }
  return { pts: poly, cum, length: cum[cum.length - 1] };
}

/** Punto, ángulo de la tangente y normal a una distancia s del inicio. */
export function pointAt(m, s) {
  const { pts, cum } = m;
  if (pts.length === 1 || m.length === 0) return { x: pts[0][0], y: pts[0][1], a: 0, s: 0, t: 0 };
  s = Math.max(0, Math.min(m.length, s));
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] <= s) lo = mid; else hi = mid;
  }
  // Saltar segmentos de longitud cero para obtener una tangente válida.
  let i = lo;
  while (i < pts.length - 2 && cum[i + 1] - cum[i] === 0) i++;
  const seg = cum[i + 1] - cum[i] || 1;
  const f = Math.max(0, Math.min(1, (s - cum[i]) / seg));
  const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
  return { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f, a: Math.atan2(y1 - y0, x1 - x0), s, t: s / m.length };
}

/** Muestras equidistantes que incluyen ambos extremos del trazo. */
export function resample(m, spacing) {
  const n = Math.max(1, Math.round(m.length / Math.max(spacing, 1e-3)));
  const out = [];
  for (let i = 0; i <= n; i++) out.push(pointAt(m, (m.length * i) / n));
  return out;
}

export function measureStroke(stroke) {
  return measure(strokePolyline(stroke));
}

function distToSegment(px, py, [x0, y0], [x1, y1]) {
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  const t = len2 ? Math.max(0, Math.min(1, ((px - x0) * dx + (py - y0) * dy) / len2)) : 0;
  return Math.hypot(px - (x0 + t * dx), py - (y0 + t * dy));
}

/** Distancia mínima de un punto a un trazo. */
export function distToStroke(px, py, stroke) {
  const poly = strokePolyline(stroke);
  let d = Infinity;
  for (let i = 1; i < poly.length; i++) d = Math.min(d, distToSegment(px, py, poly[i - 1], poly[i]));
  return d;
}
