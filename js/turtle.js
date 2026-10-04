/* =========================================================================
 * turtle.js — A tartaruga: estado, desenho no Canvas e animação
 * -------------------------------------------------------------------------
 * Coordenadas do "mundo" da tartaruga:
 *   - (0, 0) é o centro da tela; y cresce PARA CIMA (como na matemática).
 *   - heading (direção) em graus: 0 = para cima, 90 = direita, 180 = baixo.
 *     PD soma graus (sentido horário), PE subtrai.
 *
 * Partes deste arquivo:
 *   - createState / apply / simulate : o "modelo" (sem Canvas, roda no Node)
 *   - Stage   : desenha o mundo num <canvas> e anima a execução
 *   - renderFit / exportPNG : miniaturas e imagem para baixar
 * ========================================================================= */
(function (root) {
  'use strict';

  const DEG = Math.PI / 180;

  /* Velocidades: passos por segundo, graus por segundo e pausa entre comandos. */
  const SPEEDS = {
    lenta: { move: 80, turn: 100, pause: 0.2, arc: true },
    normal: { move: 240, turn: 360, pause: 0.03, arc: true },
    rapida: { move: 1600, turn: 2600, pause: 0, arc: false },
  };

  /* Cores usadas para mostrar cada volta do REPITA (Aula 7). */
  const ITER_COLORS = ['#e4572e', '#2e86ab', '#e9a33b', '#7b2cbf', '#17a398', '#d63c7a', '#3a6fd8', '#6a994e'];

  /* ------------------------------ Modelo ------------------------------ */
  function createState() {
    return { x: 0, y: 0, heading: 0, penDown: true, color: null, width: 3, segments: [] };
  }

  function cloneState(s) {
    return Object.assign({}, s, { segments: s.segments.slice() });
  }

  /** Volta ao início (mantém cor e espessura escolhidas pelo aluno). */
  function resetState(s) {
    s.x = 0; s.y = 0; s.heading = 0; s.penDown = true; s.segments = [];
    return s;
  }

  const round = (v) => Math.round(v * 1e6) / 1e6;
  const normAngle = (a) => { const r = round(((a % 360) + 360) % 360); return r === 360 ? 0 : r; };

  /**
   * Aplica UMA ação ao estado. Retorna o segmento desenhado (ou null).
   * Esta é a única função que "move" a tartaruga de verdade.
   */
  function apply(state, a) {
    switch (a.type) {
      case 'move': {
        const r = state.heading * DEG;
        const nx = round(state.x + Math.sin(r) * a.dist);
        const ny = round(state.y + Math.cos(r) * a.dist);
        let seg = null;
        if (state.penDown && a.dist !== 0) {
          seg = {
            x1: state.x, y1: state.y, x2: nx, y2: ny,
            color: state.color, width: state.width,
            iter: a.loops && a.loops.length ? a.loops[0].i : 0,
          };
          state.segments.push(seg);
        }
        state.x = nx; state.y = ny;
        return seg;
      }
      case 'turn': state.heading = normAngle(state.heading + a.angle); break;
      case 'pen': state.penDown = !!a.down; break;
      case 'clear': state.segments = []; break;
      case 'home': state.x = 0; state.y = 0; state.heading = 0; break;
      default: break; // FUTURO: novas ações (cor, preenchimento...) entram aqui
    }
    return null;
  }

  function simulate(actions, state) {
    state = state || createState();
    for (const a of actions) apply(state, a);
    return state;
  }

  function bounds(segs) {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const s of segs) {
      x0 = Math.min(x0, s.x1, s.x2); x1 = Math.max(x1, s.x1, s.x2);
      y0 = Math.min(y0, s.y1, s.y2); y1 = Math.max(y1, s.y1, s.y2);
    }
    return { x0, y0, x1, y1 };
  }

  /* ------------------------- Desenho da tartaruga ------------------------ */
  function drawTurtleSprite(c, sx, sy, heading, opts) {
    const s = opts.size || 13;
    const t = opts.theme;
    const wig = Math.sin(opts.legPhase || 0) * 0.35;
    c.save();
    c.translate(sx, sy);
    c.rotate(heading * DEG);
    c.lineWidth = 1.5;
    c.strokeStyle = t.turtleDark;

    // pernas
    c.fillStyle = t.turtleSkin;
    [[-1, -1, 1], [1, -1, -1], [-1, 1, -1], [1, 1, 1]].forEach(([lx, ly, k]) => {
      c.save();
      c.translate(lx * s * 0.78, ly * s * 0.6);
      c.rotate(lx * ly * 0.7 + k * wig);
      c.beginPath();
      c.ellipse(0, 0, s * 0.42, s * 0.25, 0, 0, Math.PI * 2);
      c.fill(); c.stroke();
      c.restore();
    });
    // cauda
    c.beginPath();
    c.moveTo(0, s * 1.28); c.lineTo(-s * 0.17, s * 0.86); c.lineTo(s * 0.17, s * 0.86); c.closePath();
    c.fill(); c.stroke();
    // cabeça
    c.beginPath();
    c.ellipse(0, -s * 1.22, s * 0.36, s * 0.44, 0, 0, Math.PI * 2);
    c.fill(); c.stroke();
    c.fillStyle = t.turtleDark;
    c.beginPath(); c.arc(-s * 0.16, -s * 1.36, s * 0.07, 0, Math.PI * 2); c.fill();
    c.beginPath(); c.arc(s * 0.16, -s * 1.36, s * 0.07, 0, Math.PI * 2); c.fill();
    // casco
    c.fillStyle = t.turtleShell;
    c.beginPath();
    c.ellipse(0, 0, s * 0.84, s * 1.02, 0, 0, Math.PI * 2);
    c.fill(); c.stroke();
    // desenho do casco: hexágono central e ligações até a borda
    c.strokeStyle = t.turtleDark;
    c.lineWidth = 1;
    const hr = s * 0.36;
    c.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = (k * 60 + 30) * DEG;
      const px = Math.cos(a) * hr, py = Math.sin(a) * hr * 1.15;
      if (k === 0) c.moveTo(px, py); else c.lineTo(px, py);
    }
    c.closePath(); c.stroke();
    for (let k = 0; k < 6; k++) {
      const a = (k * 60 + 30) * DEG;
      c.beginPath();
      c.moveTo(Math.cos(a) * hr, Math.sin(a) * hr * 1.15);
      c.lineTo(Math.cos(a) * s * 0.8, Math.sin(a) * s * 0.98);
      c.stroke();
    }
    // caneta (centro): cheia = abaixada, vazada = levantada
    c.beginPath();
    c.arc(0, 0, s * 0.2, 0, Math.PI * 2);
    if (opts.penDown) {
      c.fillStyle = opts.penColor || t.ink;
      c.fill();
      c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke();
    } else {
      c.fillStyle = t.turtleShell; c.fill();
      c.setLineDash([2, 2]); c.strokeStyle = '#ffffff'; c.lineWidth = 1.5; c.stroke(); c.setLineDash([]);
    }
    c.restore();
  }

  function readTheme(el) {
    const cs = getComputedStyle(el || document.documentElement);
    const v = (name, fb) => (cs.getPropertyValue(name) || '').trim() || fb;
    return {
      bg: v('--canvas-bg', '#fbfdfc'),
      grid: v('--canvas-grid', '#e5ece9'),
      axis: v('--canvas-axis', '#c3d1cb'),
      label: v('--canvas-label', '#8a9b95'),
      ink: v('--canvas-ink', '#16302a'),
      ghost: v('--canvas-ghost', '#e9a33b'),
      arc: v('--canvas-arc', '#7b5cff'),
      turtleShell: v('--turtle-shell', '#2f9e6e'),
      turtleDark: v('--turtle-dark', '#1b5e43'),
      turtleSkin: v('--turtle-skin', '#9ad48f'),
    };
  }

  /* ---------------------------------------------------------------------
   * Stage — o mundo da tartaruga num <canvas>
   * ------------------------------------------------------------------- */
  class Stage {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        viewHalf: 260,          // metade da altura visível, em passos
        grid: true,
        showGhost: true,
        showArc: true,
        showTurtle: true,
        colorIterations: false,
      }, options || {});
      this.state = createState();
      this.ghost = null;
      this.layer = document.createElement('canvas'); // desenho já concluído
      this.lctx = this.layer.getContext('2d');
      this.w = 0; this.h = 0; this.dpr = 1; this.scale = 1;
      this.pose = null; this.partial = null; this.arc = null;
      this.legPhase = 0;
      this.player = null;
      this.theme = readTheme(canvas);
      this.resize();
      if (typeof ResizeObserver !== 'undefined') {
        this.ro = new ResizeObserver(() => this.resize());
        this.ro.observe(canvas);
      }
    }

    refreshTheme() { this.theme = readTheme(this.canvas); this.redrawLayer(); this.draw(); }

    setOption(key, value) { this.opts[key] = value; if (key === 'viewHalf') this.resize(); else { this.redrawLayer(); this.draw(); } }

    resize() {
      const r = this.canvas.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height; this.dpr = dpr;
      [this.canvas, this.layer].forEach((c) => {
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
      });
      this.scale = Math.min(this.w, this.h) / (2 * this.opts.viewHalf);
      this.redrawLayer();
      this.draw();
    }

    toScreen(x, y) {
      return [this.w / 2 + x * this.scale, this.h / 2 - y * this.scale];
    }

    segColor(s) {
      if (this.opts.colorIterations && s.iter) return ITER_COLORS[(s.iter - 1) % ITER_COLORS.length];
      return s.color || this.theme.ink;
    }

    drawSeg(c, s) {
      const [a, b] = this.toScreen(s.x1, s.y1);
      const [d, e] = this.toScreen(s.x2, s.y2);
      c.strokeStyle = this.segColor(s);
      c.lineWidth = s.width || 3;
      c.lineCap = 'round';
      c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke();
    }

    redrawLayer() {
      if (!this.w) return;
      const c = this.lctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.clearRect(0, 0, this.w, this.h);
      for (const s of this.state.segments) this.drawSeg(c, s);
    }

    setState(state) { this.state = state; this.redrawLayer(); this.draw(); }

    setGhost(segs) { this.ghost = segs; this.draw(); }

    drawGrid(c) {
      const t = this.theme, step = 50;
      const [cx, cy] = this.toScreen(0, 0);
      const mx = this.w / 2 / this.scale, my = this.h / 2 / this.scale;
      c.lineWidth = 1;
      for (let x = -Math.floor(mx / step) * step; x <= mx; x += step) {
        const sx = Math.round(cx + x * this.scale) + 0.5;
        c.strokeStyle = x === 0 ? t.axis : t.grid;
        c.beginPath(); c.moveTo(sx, 0); c.lineTo(sx, this.h); c.stroke();
      }
      for (let y = -Math.floor(my / step) * step; y <= my; y += step) {
        const sy = Math.round(cy - y * this.scale) + 0.5;
        c.strokeStyle = y === 0 ? t.axis : t.grid;
        c.beginPath(); c.moveTo(0, sy); c.lineTo(this.w, sy); c.stroke();
      }
      // números nos eixos (a cada 100 passos) para ajudar a medir
      c.fillStyle = t.label;
      c.font = '10px system-ui, sans-serif';
      for (let x = -Math.floor(mx / 100) * 100; x <= mx; x += 100) {
        if (x !== 0) c.fillText(String(x), cx + x * this.scale + 3, cy - 4);
      }
      for (let y = -Math.floor(my / 100) * 100; y <= my; y += 100) {
        if (y !== 0) c.fillText(String(y), cx + 4, cy - y * this.scale - 3);
      }
    }

    drawGhost(c) {
      c.save();
      c.strokeStyle = this.theme.ghost;
      c.globalAlpha = 0.85;
      c.lineWidth = 3;
      c.lineCap = 'round';
      c.setLineDash([7, 7]);
      c.beginPath();
      for (const s of this.ghost) {
        const [a, b] = this.toScreen(s.x1, s.y1);
        const [d, e] = this.toScreen(s.x2, s.y2);
        c.moveTo(a, b); c.lineTo(d, e);
      }
      c.stroke();
      c.restore();
    }

    drawArc(c, pose) {
      const [sx, sy] = this.toScreen(pose.x, pose.y);
      const a0 = (this.arc.from - 90) * DEG;
      const a1 = (this.arc.from + this.arc.delta - 90) * DEG;
      const r = 38;
      c.save();
      c.fillStyle = this.theme.arc;
      c.globalAlpha = 0.16;
      c.beginPath(); c.moveTo(sx, sy); c.arc(sx, sy, r, a0, a1, this.arc.delta < 0); c.closePath(); c.fill();
      c.globalAlpha = 1;
      c.strokeStyle = this.theme.arc;
      c.lineWidth = 2;
      c.beginPath(); c.arc(sx, sy, r, a0, a1, this.arc.delta < 0); c.stroke();
      // linha de referência: para onde olhava antes do giro
      c.setLineDash([3, 4]);
      c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + Math.cos(a0) * (r + 10), sy + Math.sin(a0) * (r + 10)); c.stroke();
      c.setLineDash([]);
      const mid = (a0 + a1) / 2;
      c.fillStyle = this.theme.arc;
      c.font = 'bold 13px system-ui, sans-serif';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(Math.round(Math.abs(this.arc.delta)) + '°', sx + Math.cos(mid) * (r + 18), sy + Math.sin(mid) * (r + 18));
      c.restore();
    }

    draw() {
      if (!this.w) return;
      const c = this.ctx;
      c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      c.fillStyle = this.theme.bg;
      c.fillRect(0, 0, this.w, this.h);
      if (this.opts.grid) this.drawGrid(c);
      if (this.ghost && this.opts.showGhost) this.drawGhost(c);
      c.drawImage(this.layer, 0, 0, this.w, this.h);
      if (this.partial) this.drawSeg(c, this.partial);
      const pose = this.pose || this.state;
      if (this.arc) this.drawArc(c, pose);
      if (this.opts.showTurtle) {
        const [sx, sy] = this.toScreen(pose.x, pose.y);
        drawTurtleSprite(c, sx, sy, pose.heading, {
          theme: this.theme, legPhase: this.legPhase,
          penDown: this.state.penDown, penColor: this.state.color,
        });
      }
    }

    /* ----------------------------- Animação ----------------------------- */
    motionCost(a, sp) {
      const s = this.state;
      switch (a.type) {
        case 'move': return Math.abs(a.dist) / sp.move;
        case 'turn': return Math.abs(a.angle) / sp.turn;
        case 'home': {
          const d = Math.hypot(s.x, s.y);
          const turn = Math.min(s.heading, 360 - s.heading);
          return Math.min(1.5, d / sp.move / 2 + turn / sp.turn);
        }
        default: return 0;
      }
    }

    /** Executa as ações instantaneamente (miniaturas, verificação). */
    runInstant(actions) {
      this.stop();
      simulate(actions, this.state);
      this.redrawLayer();
      this.draw();
    }

    /**
     * Anima a lista de ações.
     * callbacks: onAction(ação, índice) quando cada ação começa; onDone().
     */
    play(actions, { speed = 'normal', onAction, onDone } = {}) {
      this.stop();
      const sp = SPEEDS[speed] || SPEEDS.normal;
      // pausas entre comandos só para programas curtos (senão fica lento demais)
      const pause = actions.length > 150 ? 0 : sp.pause;
      const p = { idx: 0, cur: null, last: performance.now(), raf: 0 };
      this.player = p;

      const tick = (now) => {
        if (this.player !== p) return;
        const dt = Math.max(0, Math.min(0.1, (now - p.last) / 1000));
        p.last = now;
        let budget = dt;
        let processed = 0;
        while (budget > 0 && p.idx < actions.length && processed < 4000) {
          if (!p.cur) {
            const a = actions[p.idx];
            const motion = this.motionCost(a, sp);
            p.cur = { a, motion, total: motion + pause, done: 0 };
            if (onAction) onAction(a, p.idx);
          }
          const need = p.cur.total - p.cur.done;
          if (budget >= need) {
            budget -= need;
            this.finishAction(p.cur.a);
            p.cur = null;
            p.idx++;
            processed++;
          } else {
            p.cur.done += budget;
            budget = 0;
          }
        }
        this.updatePartial(p.cur, sp);
        if (p.cur && (p.cur.a.type === 'move' || p.cur.a.type === 'turn')) this.legPhase += dt * 14;

        if (p.idx >= actions.length && !p.cur) {
          this.player = null;
          this.pose = this.partial = this.arc = null;
          this.draw();
          if (onDone) onDone();
          return;
        }
        this.draw();
        p.raf = requestAnimationFrame(tick);
      };
      p.raf = requestAnimationFrame(tick);
    }

    finishAction(a) {
      const seg = apply(this.state, a);
      if (a.type === 'clear') this.redrawLayer();
      else if (seg) this.drawSeg(this.lctx, seg);
    }

    updatePartial(cur, sp) {
      this.pose = this.partial = this.arc = null;
      if (!cur) return;
      const a = cur.a, s = this.state;
      const k = cur.motion > 0 ? Math.min(1, cur.done / cur.motion) : 1;
      if (a.type === 'move') {
        const r = s.heading * DEG;
        const x = s.x + Math.sin(r) * a.dist * k;
        const y = s.y + Math.cos(r) * a.dist * k;
        this.pose = { x, y, heading: s.heading };
        if (s.penDown && k > 0) {
          this.partial = { x1: s.x, y1: s.y, x2: x, y2: y, color: s.color, width: s.width, iter: a.loops.length ? a.loops[0].i : 0 };
        }
      } else if (a.type === 'turn') {
        this.pose = { x: s.x, y: s.y, heading: s.heading + a.angle * k };
        if (this.opts.showArc && sp.arc && Math.abs(a.angle) >= 5) this.arc = { from: s.heading, delta: a.angle * k };
      } else if (a.type === 'home') {
        const target = s.heading > 180 ? 360 : 0;
        this.pose = { x: s.x * (1 - k), y: s.y * (1 - k), heading: s.heading + (target - s.heading) * k };
      }
    }

    get running() { return !!this.player; }

    /** Interrompe a animação. A tartaruga fica no último comando concluído. */
    stop() {
      const was = !!this.player;
      if (this.player) cancelAnimationFrame(this.player.raf);
      this.player = null;
      this.pose = this.partial = this.arc = null;
      if (was) this.draw();
      return was;
    }
  }

  /* ---------------------------------------------------------------------
   * renderFit — desenha segmentos ajustados ao tamanho do canvas
   * (miniaturas da galeria, desenho-alvo e exportação PNG).
   * ------------------------------------------------------------------- */
  function renderFit(canvas, segs, options) {
    const o = Object.assign({ padding: 16, showStart: false, bg: null, ink: null, lineWidth: null, width: null, height: null, colorIterations: false }, options || {});
    const theme = readTheme(canvas.isConnected ? canvas : document.documentElement);
    const dpr = o.width ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    const W = o.width || canvas.clientWidth || canvas.width;
    const H = o.height || canvas.clientHeight || canvas.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    const c = canvas.getContext('2d');
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.fillStyle = o.bg || theme.bg;
    c.fillRect(0, 0, W, H);

    const pts = segs.slice();
    if (o.showStart) pts.push({ x1: 0, y1: 0, x2: 0, y2: 0 });
    if (!pts.length) return canvas;
    const b = bounds(pts);
    const bw = Math.max(b.x1 - b.x0, 1), bh = Math.max(b.y1 - b.y0, 1);
    const sc = Math.min((W - 2 * o.padding) / bw, (H - 2 * o.padding) / bh, 3);
    const ox = W / 2 - ((b.x0 + b.x1) / 2) * sc;
    const oy = H / 2 + ((b.y0 + b.y1) / 2) * sc;
    const lw = o.lineWidth || Math.max(1.5, Math.min(4, sc * 2.5));

    c.lineCap = 'round';
    c.lineJoin = 'round';
    for (const s of segs) {
      c.strokeStyle = (o.colorIterations && s.iter) ? ITER_COLORS[(s.iter - 1) % ITER_COLORS.length] : (s.color || o.ink || theme.ink);
      c.lineWidth = o.lineWidth ? o.lineWidth : (s.width && s.width !== 3 ? s.width * Math.min(1, sc * 1.5) : lw);
      c.beginPath();
      c.moveTo(ox + s.x1 * sc, oy - s.y1 * sc);
      c.lineTo(ox + s.x2 * sc, oy - s.y2 * sc);
      c.stroke();
    }
    if (o.showStart) {
      // pequeno triângulo: onde a tartaruga começa e para onde olha
      const sx = ox, sy = oy;
      c.fillStyle = theme.turtleShell;
      c.strokeStyle = '#ffffff';
      c.lineWidth = 1.5;
      c.beginPath();
      c.moveTo(sx, sy - 9); c.lineTo(sx - 6, sy + 5); c.lineTo(sx + 6, sy + 5); c.closePath();
      c.fill(); c.stroke();
    }
    return canvas;
  }

  /** Gera um PNG (data URL) do desenho, com fundo branco e margens. */
  function exportPNG(segs, options) {
    const canvas = document.createElement('canvas');
    const o = Object.assign({ width: 1200, height: 900 }, options || {});
    renderFit(canvas, segs, { width: o.width, height: o.height, padding: 60, bg: '#ffffff', ink: '#16302a' });
    const c = canvas.getContext('2d');
    c.fillStyle = '#8a9b95';
    c.font = '20px system-ui, sans-serif';
    c.fillText('🐢 Jornada da Tartaruga', 24, o.height - 24);
    return canvas.toDataURL('image/png');
  }

  const Turtle = {
    SPEEDS, ITER_COLORS, createState, cloneState, resetState, apply, simulate, bounds,
    Stage, renderFit, exportPNG, drawTurtleSprite, readTheme,
  };
  root.Turtle = Turtle;
  if (typeof module === 'object' && module.exports) module.exports = Turtle;
})(typeof window !== 'undefined' ? window : globalThis);
