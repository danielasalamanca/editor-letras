// Estado del proyecto con historial (deshacer/rehacer) y autoguardado local.
import { CHARSET } from './skeleton/charset.js';
import { defaultGlyphs } from './skeleton/defaults.js';
import { skinById } from './skins/index.js';

const STORAGE_KEY = 'editor-letras:proyecto';
const HISTORY_LIMIT = 200;

export const PARAMS = [
  { key: 'grosor', label: 'Grosor', min: 0.05, max: 3, step: 0.01, value: 0.8 },
  { key: 'densidad', label: 'Densidad', min: 0.5, max: 12, step: 0.1, value: 3 },
  { key: 'tamano', label: 'Tamaño de forma', min: 0.1, max: 3, step: 0.01, value: 1 },
  { key: 'rotacion', label: 'Rotación', min: -180, max: 180, step: 1, value: 0, unit: '°' },
  { key: 'ruido', label: 'Ruido', min: 0, max: 1, step: 0.01, value: 0 },
  { key: 'semilla', label: 'Semilla', min: 1, max: 9999, step: 1, value: 1 },
  { key: 'espaciado', label: 'Espaciado', min: 0, max: 4, step: 0.05, value: 1.2 },
];

export function newProject() {
  const glyphs = {};
  for (const ch of CHARSET) glyphs[ch] = structuredClone(defaultGlyphs[ch] ?? { width: 4, strokes: [] });
  const params = Object.fromEntries(PARAMS.map((p) => [p.key, p.value]));
  return {
    version: 1,
    name: 'Mi alfabeto',
    skin: 'circulos',
    params: { ...params, colorLetra: '#141414', colorFondo: '#f3f0e8' },
    glyphs,
    test: { text: 'Letras experimentales', size: 56, leading: 1.15 },
  };
}

/** Completa y sanea un proyecto cargado desde archivo o almacenamiento. */
export function normalizeProject(data) {
  const base = newProject();
  if (!data || typeof data !== 'object' || typeof data.glyphs !== 'object') throw new Error('El archivo no parece un proyecto válido.');
  const glyphs = {};
  for (const ch of CHARSET) {
    const g = data.glyphs[ch];
    glyphs[ch] = g && Array.isArray(g.strokes)
      ? { width: Number(g.width) || 4, strokes: g.strokes.filter((s) => s && Array.isArray(s.p) && (s.type === 'line' || s.type === 'curve')) }
      : { width: 4, strokes: [] };
  }
  return {
    ...base,
    name: typeof data.name === 'string' ? data.name : base.name,
    skin: skinById[data.skin] ? data.skin : base.skin,
    params: { ...base.params, ...(data.params || {}) },
    glyphs,
    test: { ...base.test, ...(data.test || {}) },
  };
}

function loadStored() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeProject(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

let project = loadStored() ?? newProject();
let snapshot = JSON.stringify(project);
const undoStack = [];
const redoStack = [];
const listeners = new Set();
let saveTimer = 0;

export const ui = { current: 'A' };

export const getProject = () => project;
export const canUndo = () => undoStack.length > 0 || JSON.stringify(project) !== snapshot;
export const canRedo = () => redoStack.length > 0;

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emit() {
  for (const fn of listeners) fn(project);
}

function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, snapshot); } catch { /* sin almacenamiento */ }
  }, 300);
}

/** Cambio en vivo (p. ej. mientras se arrastra un slider); no crea paso de historial. */
export function live(fn) {
  fn(project);
  emit();
}

/** Registra el estado actual como un paso de historial si cambió. */
export function commit() {
  const next = JSON.stringify(project);
  if (next === snapshot) return;
  undoStack.push(snapshot);
  if (undoStack.length > HISTORY_LIMIT) undoStack.shift();
  redoStack.length = 0;
  snapshot = next;
  persist();
  emit();
}

/** Cambio + paso de historial. */
export function change(fn) {
  fn(project);
  commit();
}

export function undo() {
  commit();
  if (!undoStack.length) return;
  redoStack.push(snapshot);
  snapshot = undoStack.pop();
  project = JSON.parse(snapshot);
  persist();
  emit();
}

export function redo() {
  if (!redoStack.length) return;
  undoStack.push(snapshot);
  snapshot = redoStack.pop();
  project = JSON.parse(snapshot);
  persist();
  emit();
}

/** Reemplaza el proyecto completo (cargar / nuevo); se puede deshacer. */
export function replaceProject(next) {
  project = next;
  commit();
}
