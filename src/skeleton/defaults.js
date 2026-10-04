// Esqueletos predeterminados A–Z. Coordenadas en unidades de grilla:
// x de 0 al ancho del glifo, y = 1 altura de mayúscula, y = 7 línea base.

const r3 = (v) => Math.round(v * 1000) / 1000;
const rad = (deg) => (deg * Math.PI) / 180;

const L = (x1, y1, x2, y2) => ({ type: 'line', p: [[x1, y1], [x2, y2]] });

// Arco de elipse dividido en curvas bézier cúbicas de ≤ 90°.
// Ángulos en grados, 0 = derecha, 90 = abajo (eje Y hacia abajo).
function arc(cx, cy, rx, ry, a0, a1) {
  const out = [];
  const n = Math.max(1, Math.ceil(Math.abs(a1 - a0) / 90 - 1e-9));
  const step = (a1 - a0) / n;
  for (let i = 0; i < n; i++) {
    const t0 = rad(a0 + step * i);
    const t1 = rad(a0 + step * (i + 1));
    const k = (4 / 3) * Math.tan((t1 - t0) / 4);
    const p0 = [cx + rx * Math.cos(t0), cy + ry * Math.sin(t0)];
    const p3 = [cx + rx * Math.cos(t1), cy + ry * Math.sin(t1)];
    const c1 = [p0[0] - k * rx * Math.sin(t0), p0[1] + k * ry * Math.cos(t0)];
    const c2 = [p3[0] + k * rx * Math.sin(t1), p3[1] - k * ry * Math.cos(t1)];
    out.push({ type: 'curve', p: [p0, c1, c2, p3].map(([x, y]) => [r3(x), r3(y)]) });
  }
  return out;
}

const g = (width, ...parts) => ({ width, strokes: parts.flat() });

export const defaultGlyphs = {
  A: g(4, L(0, 7, 2, 1), L(2, 1, 4, 7), L(1, 4, 3, 4)),
  B: g(4,
    L(0, 1, 0, 7), L(0, 1, 2, 1), arc(2, 2.5, 1.5, 1.5, -90, 90), L(2, 4, 0, 4),
    L(0, 4, 2.5, 4), arc(2.5, 5.5, 1.5, 1.5, -90, 90), L(2.5, 7, 0, 7)),
  C: g(4, arc(2, 4, 2, 3, -45, -315)),
  D: g(4, L(0, 1, 0, 7), L(0, 1, 1, 1), arc(1, 4, 3, 3, -90, 90), L(1, 7, 0, 7)),
  E: g(3.5, L(0, 1, 0, 7), L(0, 1, 3.5, 1), L(0, 4, 3, 4), L(0, 7, 3.5, 7)),
  F: g(3.5, L(0, 1, 0, 7), L(0, 1, 3.5, 1), L(0, 4, 3, 4)),
  G: g(4, arc(2, 4, 2, 3, -45, -360), L(4, 4, 2, 4)),
  H: g(4, L(0, 1, 0, 7), L(4, 1, 4, 7), L(0, 4, 4, 4)),
  I: g(1, L(0.5, 1, 0.5, 7)),
  J: g(3, L(3, 1, 3, 5.5), arc(1.5, 5.5, 1.5, 1.5, 0, 180)),
  K: g(4, L(0, 1, 0, 7), L(4, 1, 0, 5), L(2, 3, 4, 7)),
  L: g(3.5, L(0, 1, 0, 7), L(0, 7, 3.5, 7)),
  M: g(5, L(0, 7, 0, 1), L(0, 1, 2.5, 5), L(2.5, 5, 5, 1), L(5, 1, 5, 7)),
  N: g(4, L(0, 7, 0, 1), L(0, 1, 4, 7), L(4, 7, 4, 1)),
  O: g(4, arc(2, 4, 2, 3, 0, 360)),
  P: g(4, L(0, 1, 0, 7), L(0, 1, 2.5, 1), arc(2.5, 2.75, 1.5, 1.75, -90, 90), L(2.5, 4.5, 0, 4.5)),
  Q: g(4, arc(2, 4, 2, 3, 0, 360), L(2.5, 5.5, 4, 7.5)),
  R: g(4, L(0, 1, 0, 7), L(0, 1, 2.5, 1), arc(2.5, 2.75, 1.5, 1.75, -90, 90), L(2.5, 4.5, 0, 4.5), L(2, 4.5, 4, 7)),
  S: g(4, arc(2, 2.5, 1.75, 1.5, -15, -270), arc(2, 5.5, 2, 1.5, -90, 165)),
  T: g(4, L(0, 1, 4, 1), L(2, 1, 2, 7)),
  U: g(4, L(0, 1, 0, 5), arc(2, 5, 2, 2, 180, 0), L(4, 5, 4, 1)),
  V: g(4, L(0, 1, 2, 7), L(2, 7, 4, 1)),
  W: g(5, L(0, 1, 1.25, 7), L(1.25, 7, 2.5, 3), L(2.5, 3, 3.75, 7), L(3.75, 7, 5, 1)),
  X: g(4, L(0, 1, 4, 7), L(4, 1, 0, 7)),
  Y: g(4, L(0, 1, 2, 4), L(4, 1, 2, 4), L(2, 4, 2, 7)),
  Z: g(4, L(0, 1, 4, 1), L(4, 1, 0, 7), L(0, 7, 4, 7)),
};
