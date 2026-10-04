# Editor de letras experimentales

Editor web para diseñar alfabetos experimentales. Cada letra es un **esqueleto**
(líneas y curvas bézier sobre una grilla) que se **viste** con una *piel*:
círculos, rectángulos, líneas paralelas, pluma de contraste, puntos, pincel o píxeles.
Al cambiar un parámetro se transforma todo el alfabeto a la vez.

**Demo:** https://danielasalamanca.github.io/editor-letras/

## Funciones

- Editor de esqueleto con grilla e imán (A–Z, a–z, 0–9). Incluye esqueletos para A–Z.
  - **Línea / Curva:** arrastra entre dos puntos. **Mover:** arrastra puntos, manejadores o trazos
    completos; doble clic convierte línea ↔ curva. **Borrar:** clic o arrastre sobre un trazo.
  - `Alt` desactiva el imán, `←` `→` cambian de letra, `L` `C` `V` `E` cambian de herramienta.
  - Las minúsculas vacías usan la mayúscula correspondiente (también en la fuente exportada).
- 7 pieles con parámetros en vivo: grosor, densidad, tamaño, rotación, ruido, semilla,
  espaciado y colores.
- Vista de prueba con texto libre.
- Exportar PNG, SVG y fuente **.otf** (opentype.js, contornos CFF).
- Guardar / abrir proyecto `.json`, autoguardado en el navegador, deshacer / rehacer (`⌘Z`, `⇧⌘Z`).

## Desarrollo

```bash
npm install
npm run dev
```

`npm run build` genera el sitio estático en `dist/`. Cada push a `main` lo publica en
GitHub Pages mediante `.github/workflows/deploy.yml`.

## Estructura

```
src/
  state.js          proyecto, historial y autoguardado
  skeleton/         grilla, esqueletos predeterminados, geometría, composición y editor
  skins/            una piel por archivo + registro (index.js) y primitivas (shapes.js)
  ui/               miniaturas, panel de parámetros, vista de prueba
  export/           PNG, SVG, OTF y archivo de proyecto
```

### Agregar una piel

Crea `src/skins/mi-piel.js`:

```js
import { measureStroke, resample } from '../skeleton/geometry.js';
import { circle } from './shapes.js';

export default {
  id: 'mi-piel',
  name: 'Mi piel',
  description: 'Qué hace.',
  uses: ['grosor', 'densidad'],          // parámetros que aplica
  labels: { densidad: 'Cantidad' },      // opcional: renombrar controles
  generate(strokes, p, rng) {            // rng: aleatorio con semilla
    const shapes = [];
    for (const s of strokes)
      for (const pt of resample(measureStroke(s), 1 / p.densidad))
        shapes.push(circle(pt.x, pt.y, p.grosor / 2));
    return shapes;
  },
};
```

y agrégala a la lista en `src/skins/index.js`. Las formas (`circle`, `poly`, `rect`, `ribbon`)
son rellenos, así que se ven igual en pantalla, en SVG y en la fuente.
