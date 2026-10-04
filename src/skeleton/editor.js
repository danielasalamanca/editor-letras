// Editor de esqueleto: dibuja, mueve y borra trazos de la letra actual sobre la grilla.
import { GRID, GUIDES } from './charset.js';
import { strokePolyline, distToStroke } from './geometry.js';
import { glyphShapes } from '../skins/index.js';
import { traceShapes } from '../skins/shapes.js';
import { getProject, ui, live, commit, change } from '../state.js';

const ACCENT = '#2f5bff';
const HIT_PX = 10;
const r3 = (v) => Math.round(v * 1000) / 1000;
const same = (a, b) => Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6;

export function createEditor(canvas, { onToolChange } = {}) {
  const ctx = canvas.getContext('2d');
  const state = { tool: 'linea', snap: true, showSkin: true };
  let view = { ox: 0, oy: 0, unit: 40 };
  let drag = null;
  let hover = null;

  const glyph = () => getProject().glyphs[ui.current];

  function computeView() {
    const g = glyph();
    const w = canvas.clientWidth, h = canvas.clientHeight;
    const rows = GRID.bottom - GRID.top;
    const unit = Math.max(4, Math.min(w / (g.width + 4), h / (rows + 1.6)));
    view = { unit, ox: (w - g.width * unit) / 2, oy: (h - rows * unit) / 2 - GRID.top * unit };
  }

  const toScreen = ([x, y]) => [view.ox + x * view.unit, view.oy + y * view.unit];
  const toGrid = (e) => {
    const r = canvas.getBoundingClientRect();
    return [(e.clientX - r.left - view.ox) / view.unit, (e.clientY - r.top - view.oy) / view.unit];
  };
  const snapV = (v, e) => (state.snap && !e.altKey ? Math.round(v / GRID.snap) * GRID.snap : r3(v));
  const snapP = (p, e) => [snapV(p[0], e), snapV(p[1], e)];

  function hitPoint(gp) {
    let best = null, bestD = HIT_PX / view.unit;
    glyph().strokes.forEach((s, si) => {
      s.p.forEach((pt, i) => {
        const d = Math.hypot(pt[0] - gp[0], pt[1] - gp[1]);
        // Los extremos tienen prioridad sobre los controles en empate.
        const isEnd = i === 0 || i === s.p.length - 1;
        if (d < bestD || (d === bestD && isEnd)) { best = { si, i }; bestD = d; }
      });
    });
    return best;
  }

  function hitStroke(gp) {
    let best = -1, bestD = HIT_PX / view.unit;
    glyph().strokes.forEach((s, si) => {
      const d = distToStroke(gp[0], gp[1], s);
      if (d < bestD) { best = si; bestD = d; }
    });
    return best;
  }

  /** Al mover un extremo se arrastran los extremos coincidentes y sus manejadores. */
  function pointGroup({ si, i }) {
    const strokes = glyph().strokes;
    const s = strokes[si];
    const refs = [];
    if (i === 0 || i === s.p.length - 1) {
      const target = s.p[i];
      strokes.forEach((o, oi) => {
        [0, o.p.length - 1].forEach((oe) => {
          if (!same(o.p[oe], target)) return;
          refs.push({ si: oi, i: oe });
          if (o.type === 'curve') refs.push({ si: oi, i: oe === 0 ? 1 : 2 });
        });
      });
    } else {
      refs.push({ si, i });
    }
    return refs.map((r) => ({ ...r, orig: [...strokes[r.si].p[r.i]] }));
  }

  function setCurveFromEnds(s) {
    if (s.type !== 'curve') return;
    const [a, , , b] = s.p;
    s.p[1] = [r3(a[0] + (b[0] - a[0]) / 3), r3(a[1] + (b[1] - a[1]) / 3)];
    s.p[2] = [r3(a[0] + ((b[0] - a[0]) * 2) / 3), r3(a[1] + ((b[1] - a[1]) * 2) / 3)];
  }

  function onDown(e) {
    if (e.button !== 0) return;
    canvas.setPointerCapture(e.pointerId);
    const gp = toGrid(e);
    if (state.tool === 'linea' || state.tool === 'curva') {
      const start = snapP(gp, e);
      const stroke = state.tool === 'linea'
        ? { type: 'line', p: [start, [...start]] }
        : { type: 'curve', p: [start, [...start], [...start], [...start]] };
      live((p) => p.glyphs[ui.current].strokes.push(stroke));
      drag = { kind: 'new', stroke };
    } else if (state.tool === 'mover') {
      const hp = hitPoint(gp);
      if (hp) {
        drag = { kind: 'points', refs: pointGroup(hp), grab: [...glyph().strokes[hp.si].p[hp.i]] };
      } else {
        const si = hitStroke(gp);
        if (si >= 0) drag = { kind: 'stroke', si, start: gp, orig: structuredClone(glyph().strokes[si].p) };
      }
    } else if (state.tool === 'borrar') {
      drag = { kind: 'erase' };
      eraseAt(gp);
    }
  }

  function eraseAt(gp) {
    const si = hitStroke(gp);
    if (si >= 0) live((p) => p.glyphs[ui.current].strokes.splice(si, 1));
  }

  function onMove(e) {
    const gp = toGrid(e);
    if (!drag) {
      const prev = JSON.stringify(hover);
      hover = state.tool === 'mover' ? (hitPoint(gp) ? { point: hitPoint(gp) } : hitStroke(gp) >= 0 ? { stroke: hitStroke(gp) } : null)
        : state.tool === 'borrar' ? (hitStroke(gp) >= 0 ? { stroke: hitStroke(gp) } : null)
        : { cursor: snapP(gp, e) };
      canvas.style.cursor = state.tool === 'mover' ? (hover ? 'grab' : 'default') : state.tool === 'borrar' ? (hover ? 'pointer' : 'default') : 'crosshair';
      if (JSON.stringify(hover) !== prev) render();
      return;
    }
    if (drag.kind === 'new') {
      const end = snapP(gp, e);
      live(() => {
        const s = drag.stroke;
        s.p[s.p.length - 1] = end;
        setCurveFromEnds(s);
      });
    } else if (drag.kind === 'points') {
      const target = snapP(gp, e);
      const dx = target[0] - drag.grab[0], dy = target[1] - drag.grab[1];
      live((p) => {
        const strokes = p.glyphs[ui.current].strokes;
        for (const r of drag.refs) strokes[r.si].p[r.i] = [r3(r.orig[0] + dx), r3(r.orig[1] + dy)];
      });
    } else if (drag.kind === 'stroke') {
      const dx = snapV(gp[0] - drag.start[0], e), dy = snapV(gp[1] - drag.start[1], e);
      live((p) => {
        p.glyphs[ui.current].strokes[drag.si].p = drag.orig.map(([x, y]) => [r3(x + dx), r3(y + dy)]);
      });
    } else if (drag.kind === 'erase') {
      eraseAt(gp);
    }
  }

  function onUp() {
    if (!drag) return;
    if (drag.kind === 'new') {
      const s = drag.stroke;
      if (same(s.p[0], s.p[s.p.length - 1])) {
        live((p) => {
          const arr = p.glyphs[ui.current].strokes;
          arr.splice(arr.indexOf(s), 1);
        });
      }
    }
    drag = null;
    commit();
  }

  function onDblClick(e) {
    if (state.tool !== 'mover') return;
    const si = hitStroke(toGrid(e));
    if (si < 0) return;
    change((p) => {
      const s = p.glyphs[ui.current].strokes[si];
      if (s.type === 'line') {
        s.type = 'curve';
        s.p = [s.p[0], [0, 0], [0, 0], s.p[1]];
        setCurveFromEnds(s);
      } else {
        s.type = 'line';
        s.p = [s.p[0], s.p[3]];
      }
    });
  }

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('dblclick', onDblClick);
  canvas.addEventListener('pointerleave', () => { if (!drag && hover) { hover = null; render(); } });

  function render() {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    computeView();
    const project = getProject();
    const g = glyph();
    const { unit } = view;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // Guías horizontales
    ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    for (const guide of GUIDES) {
      const [, y] = toScreen([0, guide.y]);
      ctx.strokeStyle = guide.y === GRID.baseline ? '#c9c2b4' : '#e6e1d7';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(toScreen([-1.5, 0])[0], Math.round(y) + 0.5);
      ctx.lineTo(toScreen([g.width + 1.5, 0])[0], Math.round(y) + 0.5);
      ctx.stroke();
      ctx.fillStyle = '#a39d92';
      ctx.textAlign = 'right';
      ctx.fillText(guide.label, toScreen([-1.7, 0])[0], y);
    }
    // Caja del glifo
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = '#cfc8ba';
    for (const x of [0, g.width]) {
      const [sx] = toScreen([x, 0]);
      ctx.beginPath();
      ctx.moveTo(Math.round(sx) + 0.5, toScreen([0, GRID.top])[1]);
      ctx.lineTo(Math.round(sx) + 0.5, toScreen([0, GRID.bottom])[1]);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    // Puntos de la grilla
    for (let x = -1; x <= g.width + 1 + 1e-9; x += GRID.snap) {
      for (let y = GRID.top; y <= GRID.bottom + 1e-9; y += GRID.snap) {
        const [sx, sy] = toScreen([x, y]);
        const major = Number.isInteger(x) && Number.isInteger(y);
        ctx.fillStyle = x < 0 || x > g.width ? '#e4dfd5' : major ? '#bdb6a8' : '#dcd6ca';
        ctx.beginPath();
        ctx.arc(sx, sy, major ? 1.6 : 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Piel de fondo
    if (state.showSkin && g.strokes.length) {
      ctx.save();
      ctx.globalAlpha = 0.2;
      ctx.fillStyle = project.params.colorLetra;
      ctx.beginPath();
      traceShapes(ctx, glyphShapes(project, ui.current, g), view.ox, view.oy, unit);
      ctx.fill('nonzero');
      ctx.restore();
    }

    // Esqueleto
    g.strokes.forEach((s, si) => {
      const hot = hover?.stroke === si;
      ctx.strokeStyle = state.tool === 'borrar' && hot ? '#e5484d' : ACCENT;
      ctx.lineWidth = hot ? 3.5 : 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      strokePolyline(s).forEach((pt, i) => { const [x, y] = toScreen(pt); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.stroke();
      if (s.type === 'curve') {
        ctx.strokeStyle = 'rgba(47, 91, 255, 0.45)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]);
        for (const [a, b] of [[0, 1], [3, 2]]) {
          ctx.beginPath();
          ctx.moveTo(...toScreen(s.p[a]));
          ctx.lineTo(...toScreen(s.p[b]));
          ctx.stroke();
        }
        ctx.setLineDash([]);
      }
      s.p.forEach((pt, i) => {
        const [x, y] = toScreen(pt);
        const isEnd = i === 0 || i === s.p.length - 1;
        const hotPt = hover?.point && hover.point.si === si && hover.point.i === i;
        ctx.beginPath();
        ctx.arc(x, y, hotPt ? 6 : isEnd ? 4 : 3.5, 0, Math.PI * 2);
        ctx.fillStyle = isEnd ? ACCENT : '#fff';
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = 1.5;
        ctx.fill();
        ctx.stroke();
      });
    });

    // Cursor de dibujo
    if (hover?.cursor && !drag) {
      const [x, y] = toScreen(hover.cursor);
      ctx.strokeStyle = ACCENT;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.stroke();
    }

    if (!g.strokes.length) {
      ctx.fillStyle = '#a39d92';
      ctx.textAlign = 'center';
      ctx.font = '13px ui-sans-serif, system-ui, sans-serif';
      const fallback = ui.current !== ui.current.toUpperCase() && project.glyphs[ui.current.toUpperCase()]?.strokes.length;
      ctx.fillText(fallback ? 'Vacía: en la vista de prueba se usa la mayúscula. Dibuja para crear la tuya.' : 'Arrastra sobre la grilla para dibujar un trazo.', w / 2, h - 18);
    }
  }

  return {
    render,
    get tool() { return state.tool; },
    setTool(t) { state.tool = t; hover = null; onToolChange?.(t); render(); },
    setSnap(v) { state.snap = v; },
    setShowSkin(v) { state.showSkin = v; render(); },
  };
}
