// Registro de pieles. Para agregar una nueva: crea un archivo en esta carpeta que
// exporte { id, name, description, uses, labels?, generate(strokes, params, rng) }
// devolviendo formas de ./shapes.js, e impórtala en la lista de abajo.
import circulos from './circulos.js';
import rectangulos from './rectangulos.js';
import lineas from './lineas.js';
import contraste from './contraste.js';
import puntos from './puntos.js';
import pincel from './pincel.js';
import pixeles from './pixeles.js';
import { mulberry32, hashString } from './random.js';

export const skins = [circulos, rectangulos, lineas, contraste, puntos, pincel, pixeles];
export const skinById = Object.fromEntries(skins.map((s) => [s.id, s]));

const cache = new Map();

/** Formas de un glifo con la piel y parámetros actuales (memorizado). */
export function glyphShapes(project, ch, glyph) {
  const { params } = project;
  const skin = skinById[project.skin] ?? skins[0];
  const key = `${skin.id}|${ch}|${params.grosor}|${params.densidad}|${params.tamano}|${params.rotacion}|${params.ruido}|${params.semilla}|${JSON.stringify(glyph.strokes)}`;
  let shapes = cache.get(key);
  if (!shapes) {
    const rng = mulberry32(hashString(ch) ^ Math.imul(params.semilla | 0, 2654435761));
    shapes = skin.generate(glyph.strokes, params, rng);
    if (cache.size > 800) cache.clear();
    cache.set(key, shapes);
  }
  return shapes;
}
