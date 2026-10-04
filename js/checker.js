/* =========================================================================
 * checker.js — Verifica se o desenho do aluno corresponde ao desenho-alvo
 * -------------------------------------------------------------------------
 * NÃO comparamos o código do aluno com a solução. Comparamos o RESULTADO:
 *
 *   1. Espalhamos pontos a cada poucos passos sobre as linhas desenhadas.
 *   2. "Precisão": quantos pontos do aluno caem perto de alguma linha do alvo.
 *   3. "Cobertura": quantos pontos do alvo caem perto de alguma linha do aluno.
 *   4. Se as duas passam do limite (padrão 95%) e o comprimento total das
 *      linhas é parecido (±7%), o desenho está correto.
 *
 * Assim, PF 50 PF 50 vale o mesmo que PF 100; REPITA 36 [PF 10 PD 10]
 * vale o mesmo que REPITA 360 [PF 1 PD 1]; e a ordem do desenho não importa.
 *
 * No modo 'shape' também aceitamos o desenho deslocado, espelhado
 * (girando para o outro lado) ou girado em 90°, 180° ou 270°.
 * ========================================================================= */
(function (root) {
  'use strict';

  const len = (s) => Math.hypot(s.x2 - s.x1, s.y2 - s.y1);

  function totalLength(segs) {
    let t = 0;
    for (const s of segs) t += len(s);
    return t;
  }

  function bbox(segs) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of segs) {
      x0 = Math.min(x0, s.x1, s.x2); x1 = Math.max(x1, s.x1, s.x2);
      y0 = Math.min(y0, s.y1, s.y2); y1 = Math.max(y1, s.y1, s.y2);
    }
    return { x0, y0, x1, y1, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
  }

  function distToSeg(px, py, s) {
    const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
    const L2 = dx * dx + dy * dy;
    let t = L2 ? ((px - s.x1) * dx + (py - s.y1) * dy) / L2 : 0;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (s.x1 + t * dx), py - (s.y1 + t * dy));
  }

  /** Índice espacial simples (grade) para achar segmentos próximos rápido. */
  class SegmentIndex {
    constructor(segs, tol) {
      this.cell = Math.max(20, tol * 4);
      this.map = new Map();
      for (const s of segs) {
        const ax = Math.floor((Math.min(s.x1, s.x2) - tol) / this.cell);
        const bx = Math.floor((Math.max(s.x1, s.x2) + tol) / this.cell);
        const ay = Math.floor((Math.min(s.y1, s.y2) - tol) / this.cell);
        const by = Math.floor((Math.max(s.y1, s.y2) + tol) / this.cell);
        for (let i = ax; i <= bx; i++) {
          for (let j = ay; j <= by; j++) {
            const k = i + ',' + j;
            let list = this.map.get(k);
            if (!list) this.map.set(k, (list = []));
            list.push(s);
          }
        }
      }
    }
    near(px, py, tol) {
      const list = this.map.get(Math.floor(px / this.cell) + ',' + Math.floor(py / this.cell));
      if (!list) return false;
      for (const s of list) if (distToSeg(px, py, s) <= tol) return true;
      return false;
    }
  }

  function samplePoints(segs, step) {
    const pts = [];
    for (const s of segs) {
      const n = Math.max(1, Math.ceil(len(s) / step));
      for (let k = 0; k <= n; k++) pts.push([s.x1 + ((s.x2 - s.x1) * k) / n, s.y1 + ((s.y2 - s.y1) * k) / n]);
    }
    return pts;
  }

  function transform(segs, mirror, quarter) {
    const f = (x, y) => {
      if (mirror) x = -x;
      for (let q = 0; q < quarter; q++) { const t = x; x = y; y = -t; } // 90° horário
      return [x, y];
    };
    return segs.map((s) => {
      const [a, b] = f(s.x1, s.y1);
      const [c, d] = f(s.x2, s.y2);
      return { x1: a, y1: b, x2: c, y2: d };
    });
  }

  function translate(segs, dx, dy) {
    return segs.map((s) => ({ x1: s.x1 + dx, y1: s.y1 + dy, x2: s.x2 + dx, y2: s.y2 + dy }));
  }

  function fraction(points, test) {
    if (!points.length) return 0;
    let hit = 0;
    for (const p of points) if (test(p)) hit++;
    return hit / points.length;
  }

  const SHAPE_VARIANTS = [{ mirror: false, quarter: 0, translate: false }];
  [false, true].forEach((mirror) => {
    for (let q = 0; q < 4; q++) SHAPE_VARIANTS.push({ mirror, quarter: q, translate: true });
  });

  /**
   * Compara o desenho do aluno com o alvo.
   * options: { mode: 'exact' | 'shape', tolerance (passos), threshold (0..1) }
   * Retorna { ok, precision, coverage, lengthRatio, empty, variant }.
   */
  function compare(student, target, options) {
    const o = Object.assign({ mode: 'shape', tolerance: 5, threshold: 0.95, step: 2.5, lengthTolerance: 0.07 }, options || {});
    const S = student.filter((s) => len(s) > 1e-6);
    const T = target.filter((s) => len(s) > 1e-6);
    const result = {
      ok: false, precision: 0, coverage: 0, empty: S.length === 0,
      lengthRatio: totalLength(S) / (totalLength(T) || 1), variant: null,
    };
    if (!S.length || !T.length) return result;

    const tol = o.tolerance;
    const tIndex = new SegmentIndex(T, tol);
    const tPts = samplePoints(T, o.step);
    const tBox = bbox(T);
    const variants = o.mode === 'shape' ? SHAPE_VARIANTS : SHAPE_VARIANTS.slice(0, 1);

    let best = null;
    for (const v of variants) {
      let segs = transform(S, v.mirror, v.quarter);
      if (v.translate) {
        const b = bbox(segs);
        segs = translate(segs, tBox.cx - b.cx, tBox.cy - b.cy);
      }
      const sIndex = new SegmentIndex(segs, tol);
      const precision = fraction(samplePoints(segs, o.step), (p) => tIndex.near(p[0], p[1], tol));
      const coverage = fraction(tPts, (p) => sIndex.near(p[0], p[1], tol));
      const score = Math.min(precision, coverage);
      if (!best || score > best.score) best = { score, precision, coverage, variant: v };
      if (score >= 0.999) break;
    }
    result.precision = best.precision;
    result.coverage = best.coverage;
    result.variant = best.variant;
    // o comprimento total também precisa bater (PF 90 não vale por PF 100)
    result.ok = best.precision >= o.threshold && best.coverage >= o.threshold &&
      Math.abs(result.lengthRatio - 1) <= o.lengthTolerance;
    return result;
  }

  const Checker = { compare, totalLength, bbox, samplePoints, distToSeg };
  root.Checker = Checker;
  if (typeof module === 'object' && module.exports) module.exports = Checker;
})(typeof window !== 'undefined' ? window : globalThis);
