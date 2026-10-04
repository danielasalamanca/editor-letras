// Aleatoriedad reproducible: misma semilla → mismas formas.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Ruido 1D suave en [-1, 1], interpolado entre valores aleatorios cada `scale` unidades. */
export function noise1D(rng, scale = 1) {
  const vals = [];
  const at = (i) => {
    while (vals.length <= i) vals.push(rng() * 2 - 1);
    return vals[i];
  };
  return (s) => {
    const x = Math.max(0, s / scale);
    const i = Math.floor(x);
    const f = x - i;
    const k = f * f * (3 - 2 * f);
    return at(i) * (1 - k) + at(i + 1) * k;
  };
}

/** Valor centrado en cero con amplitud dada. */
export const jitter = (rng, amount) => (rng() - 0.5) * 2 * amount;
