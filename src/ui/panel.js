// Panel de piel: selector de estilo, parámetros en vivo y colores.
import { skins, skinById } from '../skins/index.js';
import { PARAMS, getProject, live, commit, change } from '../state.js';

const fmt = (p, v) => (p.step >= 1 ? String(Math.round(v)) : Number(v).toFixed(p.step < 0.05 ? 2 : 1)) + (p.unit || '');

export function createPanel(root) {
  const skinList = root.querySelector('#skin-list');
  const skinDesc = root.querySelector('#skin-desc');
  const paramsBox = root.querySelector('#params');

  const skinButtons = skins.map((skin) => {
    const b = document.createElement('button');
    b.className = 'chip';
    b.textContent = skin.name;
    b.addEventListener('click', () => change((p) => { p.skin = skin.id; }));
    skinList.append(b);
    return [skin.id, b];
  });

  const rows = PARAMS.map((param) => {
    const row = document.createElement('label');
    row.className = 'param';
    row.innerHTML = `<span class="param-name"></span><output></output><input type="range" min="${param.min}" max="${param.max}" step="${param.step}">`;
    const input = row.querySelector('input');
    const out = row.querySelector('output');
    input.addEventListener('input', () => live((p) => { p.params[param.key] = Number(input.value); }));
    input.addEventListener('change', commit);
    if (param.key === 'semilla') {
      const dice = document.createElement('button');
      dice.className = 'icon-btn dice';
      dice.type = 'button';
      dice.title = 'Semilla aleatoria';
      dice.textContent = '⚄';
      dice.addEventListener('click', (e) => {
        e.preventDefault();
        change((p) => { p.params.semilla = 1 + Math.floor(Math.random() * 9999); });
      });
      row.append(dice);
    }
    paramsBox.append(row);
    return { param, row, input, out, name: row.querySelector('.param-name') };
  });

  for (const key of ['colorLetra', 'colorFondo']) {
    const input = root.querySelector(`#${key}`);
    input.addEventListener('input', () => live((p) => { p.params[key] = input.value; }));
    input.addEventListener('change', commit);
  }

  root.querySelector('#swap-colors').addEventListener('click', () => change((p) => {
    [p.params.colorLetra, p.params.colorFondo] = [p.params.colorFondo, p.params.colorLetra];
  }));

  function render() {
    const project = getProject();
    const skin = skinById[project.skin] ?? skins[0];
    for (const [id, b] of skinButtons) b.classList.toggle('active', id === skin.id);
    skinDesc.textContent = skin.description;
    for (const { param, row, input, out, name } of rows) {
      const v = project.params[param.key];
      if (document.activeElement !== input || Number(input.value) !== v) input.value = v;
      out.textContent = fmt(param, v);
      name.textContent = skin.labels?.[param.key] ?? param.label;
      // Espaciado afecta a todas las pieles; el resto depende de la piel.
      row.classList.toggle('unused', param.key !== 'espaciado' && !skin.uses.includes(param.key));
    }
    for (const key of ['colorLetra', 'colorFondo']) root.querySelector(`#${key}`).value = project.params[key];
  }

  return { render };
}
