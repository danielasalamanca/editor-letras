// Juego de caracteres editable y métricas de la grilla (en unidades de grilla, eje Y hacia abajo).
export const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
export const DIGITS = '0123456789'.split('');
export const CHARSET = [...UPPER, ...LOWER, ...DIGITS];

export const GROUPS = [
  { name: 'Mayúsculas', chars: UPPER },
  { name: 'Minúsculas', chars: LOWER },
  { name: 'Números', chars: DIGITS },
];

export const GRID = {
  top: 0, // ascendente
  cap: 1, // altura de mayúsculas
  xHeight: 3, // altura x
  baseline: 7, // línea base
  bottom: 9, // descendente
  snap: 0.5, // subdivisión de la grilla
};

export const GUIDES = [
  { y: GRID.top, label: 'ascendente' },
  { y: GRID.cap, label: 'mayúscula' },
  { y: GRID.xHeight, label: 'altura x' },
  { y: GRID.baseline, label: 'base' },
  { y: GRID.bottom, label: 'descendente' },
];

export const SPACE_WIDTH = 2.5;

const DIGIT_NAMES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
export function glyphName(ch) {
  const d = DIGITS.indexOf(ch);
  return d >= 0 ? DIGIT_NAMES[d] : ch;
}
