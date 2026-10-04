// Guardar / cargar el proyecto como .json (todo en el navegador).
import { normalizeProject } from '../state.js';
import { downloadBlob, fileSafe } from './download.js';

export function saveProjectFile(project) {
  const json = JSON.stringify(project, null, 1);
  downloadBlob(new Blob([json], { type: 'application/json' }), `${fileSafe(project.name)}.json`);
}

export async function readProjectFile(file) {
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('El archivo no es un JSON válido.');
  }
  return normalizeProject(data);
}
