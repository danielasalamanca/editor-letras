// Primitivas que producen las pieles. Todas son formas rellenas, de modo que
// Canvas, SVG y la fuente OTF dibujan exactamente lo mismo.
//   { type: 'circle', x, y, r }
//   { type: 'poly', pts: [[x, y], ...] }   (orientación normalizada)

export const circle = (x, y, r) => ({ type: 'circle', x, y, r: Math.max(0, r) });

function signedArea(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += pts[j][0] * pts[i][1] - pts[i][0] * pts[j][1];
  return a / 2;
}

/** Polígono con orientación uniforme (horaria con Y hacia abajo) para que los solapes no hagan huecos. */
export function poly(pts) {
  return { type: 'poly', pts: signedArea(pts) < 0 ? pts.slice().reverse() : pts };
}

/** Rectángulo centrado en (cx, cy) de largo w y alto h, rotado `angle` radianes. */
export function rect(cx, cy, w, h, angle) {
  const c = Math.cos(angle), s = Math.sin(angle);
  const hw = w / 2, hh = h / 2;
  return poly([[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]));
}

/**
 * Cinta a lo largo de unas muestras { x, y, a }. widthAt(sample, i) devuelve
 * [izquierda, derecha]: distancias a cada lado sobre la normal (pueden ser negativas para desplazar).
 */
export function ribbon(samples, widthAt) {
  if (samples.length < 2) return null;
  const left = [], right = [];
  samples.forEach((smp, i) => {
    // Normal promediada en el vértice para que la cinta no se abra en las curvas.
    const prev = samples[Math.max(0, i - 1)], next = samples[Math.min(samples.length - 1, i + 1)];
    let tx = next.x - prev.x, ty = next.y - prev.y;
    const len = Math.hypot(tx, ty);
    if (len < 1e-9) { tx = Math.cos(smp.a); ty = Math.sin(smp.a); } else { tx /= len; ty /= len; }
    const nx = -ty, ny = tx;
    const [l, r] = widthAt(smp, i);
    left.push([smp.x - nx * l, smp.y - ny * l]);
    right.push([smp.x + nx * r, smp.y + ny * r]);
  });
  return poly([...left, ...right.reverse()]);
}

/** Traza las formas en un contexto Canvas 2D. scale = píxeles por unidad. */
export function traceShapes(ctx, shapes, ox, oy, scale) {
  for (const sh of shapes) {
    if (sh.type === 'circle') {
      ctx.moveTo(ox + (sh.x + sh.r) * scale, oy + sh.y * scale);
      ctx.arc(ox + sh.x * scale, oy + sh.y * scale, sh.r * scale, 0, Math.PI * 2);
    } else {
      sh.pts.forEach(([x, y], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, ox + x * scale, oy + y * scale));
      ctx.closePath();
    }
  }
}
