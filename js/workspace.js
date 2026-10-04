/* =========================================================================
 * workspace.js — Área de trabalho reutilizável: Canvas + editor + botões
 * -------------------------------------------------------------------------
 * Usada no Tutorial, nos Desafios, na Galeria e no Modo Livre.
 *
 *   const ws = new Workspace(elemento, {
 *     storageKey: 'livre',        // onde salvar o código (localStorage)
 *     initialCode: 'PF 100',
 *     resetEachRun: true,         // cada execução começa do zero?
 *     redo: false,                // mostrar botão Refazer
 *     freeTools: false,           // cores, espessura, PNG, .txt (Modo Livre)
 *     bigStage: false,            // mundo maior (Modo Livre)
 *     colorIterations: false,     // uma cor por volta do REPITA
 *     onFinish(compiled, state),  // execução terminou
 *     onError(err), onRunStart(compiled), onSave(ws)
 *   });
 * ========================================================================= */
(function (root) {
  'use strict';

  const { Logo, Turtle, Store } = root;
  let uid = 0;

  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  /* Ordem dos blocos no painel "Comandos da Linguagem". */
  const CMD_ORDER = ['PF', 'PT', 'PD', 'PE', 'BAIXE', 'LEVANTE', 'LIMPE', 'CENTRO', 'REPITA'];

  const PEN_COLORS = [
    { v: '', name: 'Automática' }, { v: '#e4572e', name: 'Vermelho' }, { v: '#f08a24', name: 'Laranja' },
    { v: '#e9b500', name: 'Amarelo' }, { v: '#2f9e44', name: 'Verde' }, { v: '#1c7ed6', name: 'Azul' },
    { v: '#7048e8', name: 'Roxo' }, { v: '#d6336c', name: 'Rosa' }, { v: '#7c5a3a', name: 'Marrom' },
  ];

  /* Ícones de linha (SVG) usados nos títulos dos painéis. */
  const ICON = {
    keyboard: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/></svg>',
    result: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 12l3 3 5-6"/></svg>',
    info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>',
    book: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/></svg>',
    gauge: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 18a9 9 0 1 1 16 0"/><path d="M12 14l4-5"/></svg>',
    palette: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a9 9 0 1 0 0 18c1.2 0 2-.8 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.2 0-1.1.9-2 2-2h2.3A4.7 4.7 0 0 0 22 9.8C22 6 17.5 3 12 3z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7" r="1"/></svg>',
  };

  const COMPASS = `
    <svg class="compass" viewBox="0 0 80 80" aria-hidden="true">
      <circle cx="40" cy="40" r="30" class="c-ring"/>
      <path d="M40 14 L46 40 L40 66 L34 40 Z" class="c-ns"/>
      <path d="M40 14 L46 40 L34 40 Z" class="c-north"/>
      <path d="M14 40 L40 35 L66 40 L40 45 Z" class="c-we"/>
      <circle cx="40" cy="40" r="3" class="c-dot"/>
      <text x="40" y="9" class="c-txt">N</text><text x="40" y="78" class="c-txt">S</text>
      <text x="4" y="43" class="c-txt">O</text><text x="76" y="43" class="c-txt">L</text>
    </svg>`;

  function commandTiles() {
    return CMD_ORDER.filter((n) => Logo.commands[n]).map((n) => {
      const d = Logo.commands[n].doc;
      return `
        <button type="button" class="cmd-tile" data-insert="${esc(d.short)}" style="--c:${d.color}" title="Inserir ${esc(d.short)} no editor">
          <span class="cmd-badge${d.dark ? ' dark' : ''}">${n}</span>
          <span class="cmd-info">
            <b>${esc(d.label)}</b>
            <span class="cmd-ex"><code>${esc(d.short)}</code> <small>(${esc(d.note)})</small></span>
          </span>
        </button>`;
    }).join('');
  }

  function template(o, id) {
    return `
    <div class="ws${o.bigStage ? ' ws-big' : ''}">
      <div class="ws-main">
        <div class="panel stage-panel">
          <div class="stage-wrap">
            <canvas class="stage-canvas" role="img" aria-label="Mundo da tartaruga: a tartaruga começa no centro, olhando para cima."></canvas>
            ${COMPASS}
            <div class="stage-top">
              <span class="badge loop-badge" hidden></span>
              <span class="badge pen-badge" hidden>✋ Caneta levantada</span>
            </div>
            <div class="stage-zoom" role="group" aria-label="Zoom do mundo">
              <button type="button" class="icon-btn" data-act="zoom-out" title="Afastar" aria-label="Afastar">−</button>
              <button type="button" class="icon-btn" data-act="zoom-fit" title="Ajustar ao desenho" aria-label="Ajustar ao desenho">⤢</button>
              <button type="button" class="icon-btn" data-act="zoom-in" title="Aproximar" aria-label="Aproximar">+</button>
            </div>
            <div class="stage-status"></div>
          </div>
        </div>

        <div class="panel editor-panel">
          <div class="panel-head">
            <label class="panel-title" for="code-${id}">${ICON.keyboard} Editor de Código</label>
            <div class="toolbar" role="toolbar" aria-label="Controles do programa">
              <button type="button" class="tbtn tbtn-run" data-act="run">▶ <span>Executar</span></button>
              <button type="button" class="tbtn tbtn-stop" data-act="stop" disabled>■ <span>Parar</span></button>
              <button type="button" class="tbtn" data-act="undo">↶ <span>Desfazer</span></button>
              ${o.redo ? '<button type="button" class="tbtn" data-act="redo">↷ <span>Refazer</span></button>' : ''}
              <button type="button" class="tbtn" data-act="clear">🗑 <span>Limpar</span></button>
              <button type="button" class="tbtn" data-act="save">💾 <span>Salvar</span></button>
            </div>
          </div>
          <div class="editor-body">
            <div class="gutter" aria-hidden="true"></div>
            <div class="code-area">
              <pre class="code-layer marks" aria-hidden="true"><code></code></pre>
              <pre class="code-layer hl" aria-hidden="true"><code></code></pre>
              <textarea id="code-${id}" class="code-input" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off"
                placeholder="${esc(o.placeholder)}"></textarea>
            </div>
          </div>
          <p class="editor-foot"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> executa · <kbd>Esc</kbd> para · clique num comando à direita para inseri-lo</p>
        </div>

        <div class="ws-bottom">
          <section class="panel result-panel">
            <div class="panel-head small"><h3 class="panel-title">${ICON.result} Resultado</h3></div>
            <div class="ws-result" aria-live="polite"></div>
          </section>
          <section class="panel msg-panel">
            <div class="panel-head small">
              <h3 class="panel-title">${ICON.info} Mensagens</h3>
              <button type="button" class="icon-btn icon-btn-ghost" data-act="msg-clear" title="Limpar mensagens" aria-label="Limpar mensagens">✕</button>
            </div>
            <div class="ws-message" role="status" aria-live="polite"></div>
          </section>
        </div>
      </div>

      <div class="ws-side">
        ${o.freeTools ? freeToolsTemplate(id) : ''}
        ${o.palette ? `
        <section class="panel commands-panel">
          <div class="panel-head"><h3 class="panel-title">${ICON.book} Comandos da Linguagem</h3></div>
          <div class="cmd-list">${commandTiles()}</div>
        </section>` : ''}
        <section class="panel speed-panel">
          <div class="panel-head"><h3 class="panel-title" id="speed-title-${id}">${ICON.gauge} Controle de Velocidade</h3></div>
          <div class="speed" role="radiogroup" aria-labelledby="speed-title-${id}">
            <label class="speed-opt"><input type="radio" name="speed-${id}" value="lenta"><span class="sp-icon">🐢</span><span>Lenta</span></label>
            <label class="speed-opt"><input type="radio" name="speed-${id}" value="normal"><span class="sp-icon">🚶</span><span>Normal</span></label>
            <label class="speed-opt"><input type="radio" name="speed-${id}" value="rapida"><span class="sp-icon">⚡</span><span>Rápida</span></label>
          </div>
        </section>
      </div>
    </div>`;
  }

  function freeToolsTemplate(id) {
    return `
      <section class="panel free-tools">
        <div class="panel-head"><h3 class="panel-title">${ICON.palette} Ferramentas de desenho</h3></div>
        <div class="tool-row">
          <span class="tool-label">Cor da caneta</span>
          <div class="swatches" role="radiogroup" aria-label="Cor da caneta">
            ${PEN_COLORS.map((c) => `<button type="button" class="swatch${c.v ? '' : ' swatch-auto'}" data-color="${c.v}" style="${c.v ? `--sw:${c.v}` : ''}" title="${c.name}" aria-label="${c.name}" role="radio" aria-checked="false">${c.v ? '' : 'A'}</button>`).join('')}
            <label class="swatch swatch-custom" title="Outra cor"><span class="sr-only">Outra cor</span><input type="color" data-act="color-custom" value="#1c7ed6"></label>
          </div>
        </div>
        <div class="tool-row">
          <label class="tool-label" for="width-${id}">Espessura</label>
          <input type="range" id="width-${id}" min="1" max="12" step="1" data-act="width">
          <output class="width-out">3</output>
        </div>
        <div class="tool-row tool-buttons">
          <button type="button" class="btn btn-sm" data-act="pen">✋ Levantar caneta</button>
          <button type="button" class="btn btn-sm" data-act="home">🎯 Voltar ao centro</button>
        </div>
        <label class="check"><input type="checkbox" data-act="continue"> Continuar o desenho entre execuções</label>
        <div class="tool-row tool-buttons">
          <button type="button" class="btn btn-sm" data-act="png">📤 Compartilhar desenho (PNG)</button>
          <button type="button" class="btn btn-sm" data-act="txt">⬇️ Baixar código (.txt)</button>
        </div>
      </section>`;
  }

  /* Pinta o código: cada comando com a cor do seu bloco. */
  const TOKEN_RE = /(;[^\n]*|\/\/[^\n]*)|([A-Za-zÀ-ÖØ-öø-ÿ_][A-Za-zÀ-ÖØ-öø-ÿ_0-9]*)|([-+]?\d+(?:[.,]\d+)?)|([[\]])/g;

  function highlight(text) {
    let out = '', last = 0, m;
    TOKEN_RE.lastIndex = 0;
    while ((m = TOKEN_RE.exec(text))) {
      out += esc(text.slice(last, m.index));
      const t = esc(m[0]);
      if (m[1]) out += `<span class="tk-com">${t}</span>`;
      else if (m[2]) {
        const name = Logo.lookup(m[2]);
        out += name ? `<span class="tk-cmd" style="color:${Logo.commands[name].doc.hl}">${t}</span>` : `<span class="tk-unk">${t}</span>`;
      } else if (m[3]) out += `<span class="tk-num">${t}</span>`;
      else out += `<span class="tk-br">${t}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last));
  }

  class Workspace {
    constructor(container, options) {
      this.opts = Object.assign({
        storageKey: null, initialCode: '', resetEachRun: true, redo: false, freeTools: false,
        palette: true, colorIterations: false, bigStage: false, saveLabel: 'Código salvo neste navegador.',
        placeholder: 'Escreva seus comandos aqui...\nExemplo: PF 100',
        onFinish: null, onError: null, onRunStart: null, onSave: null,
      }, options || {});
      this.id = ++uid;
      container.innerHTML = template(this.opts, this.id);
      this.root = container.querySelector('.ws');
      this.$ = (sel) => this.root.querySelector(sel);

      this.textarea = this.$('.code-input');
      this.marksLayer = this.$('.code-layer.marks');
      this.hlLayer = this.$('.code-layer.hl');
      this.resultEl = this.$('.ws-result');
      this.gutter = this.$('.gutter');
      this.msg = this.$('.ws-message');
      this.loopBadge = this.$('.loop-badge');
      this.penBadge = this.$('.pen-badge');
      this.statusEl = this.$('.stage-status');

      const s = Store.settings;
      this.stage = new Turtle.Stage(this.$('.stage-canvas'), {
        grid: s.grid, showArc: s.arc, colorIterations: this.opts.colorIterations,
      });
      if (this.opts.freeTools) {
        this.stage.state.color = s.penColor || null;
        this.stage.state.width = s.penWidth || 3;
      }

      this.undoStack = [];
      this.redoStack = [];
      this.running = false;
      this.mark = null;          // { start, end, kind }
      this.currentNode = null;

      this.setCode(this.opts.storageKey ? Store.code(this.opts.storageKey, this.opts.initialCode) : this.opts.initialCode);
      this.clearMessage();
      this.setResult('idle', '<p class="muted">Nenhuma execução ainda.</p>');
      this.applySettings();
      this.bind();
      this.updateStatus();
    }

    /* ------------------------------ Eventos ------------------------------ */
    bind() {
      this.root.addEventListener('click', (e) => {
        const b = e.target.closest('[data-act], [data-insert], [data-color]');
        if (!b || b.disabled) return;
        if (b.dataset.insert !== undefined) return this.insert({ code: b.dataset.insert });
        if (b.dataset.color !== undefined) return this.setPenColor(b.dataset.color);
        const act = b.dataset.act;
        const fn = {
          run: () => this.run(), stop: () => this.stop(true), undo: () => this.undo(), redo: () => this.redo(),
          clear: () => this.clear(), save: () => this.save(), pen: () => this.togglePen(), home: () => this.home(),
          png: () => this.sharePNG(), txt: () => this.downloadTxt(),
          'msg-clear': () => this.clearMessage(), 'zoom-in': () => this.zoom(0.8), 'zoom-out': () => this.zoom(1.25), 'zoom-fit': () => this.zoomFit(),
        }[act];
        if (fn) fn();
      });

      this.textarea.addEventListener('input', () => {
        this.mark = null;
        this.renderEditor();
        if (this.opts.storageKey) {
          clearTimeout(this.saveTimer);
          this.saveTimer = setTimeout(() => Store.setCode(this.opts.storageKey, this.textarea.value), 400);
        }
      });
      this.textarea.addEventListener('scroll', () => this.syncScroll());
      this.textarea.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.run(); }
      });
      this.root.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.running) { e.preventDefault(); this.stop(true); }
      });

      this.root.querySelectorAll('.speed input').forEach((r) => {
        r.addEventListener('change', () => {
          Store.settings.speed = r.value;
          Store.save();
          document.dispatchEvent(new CustomEvent('tartaruga:settings'));
        });
      });

      if (this.opts.freeTools) {
        const w = this.$('[data-act="width"]');
        w.value = this.stage.state.width;
        this.$('.width-out').textContent = w.value;
        w.addEventListener('input', () => {
          this.stage.state.width = +w.value;
          this.$('.width-out').textContent = w.value;
          Store.settings.penWidth = +w.value;
          Store.save();
        });
        this.$('[data-act="color-custom"]').addEventListener('input', (e) => this.setPenColor(e.target.value));
        const cont = this.$('[data-act="continue"]');
        cont.checked = !!Store.settings.continueDrawing;
        cont.addEventListener('change', () => { Store.settings.continueDrawing = cont.checked; Store.save(); });
        this.markSwatch();
      }
    }

    applySettings() {
      const s = Store.settings;
      this.root.querySelectorAll('.speed input').forEach((r) => { r.checked = r.value === s.speed; });
      this.root.style.setProperty('--code-size', (s.fontSize || 16) + 'px');
      this.stage.opts.grid = s.grid;
      this.stage.opts.showArc = s.arc;
      this.stage.opts.showGhost = s.ghost;
      this.stage.refreshTheme();
      this.renderEditor();
    }

    /* ------------------------------ Editor ------------------------------- */
    get code() { return this.textarea.value; }

    setCode(code) {
      this.textarea.value = code || '';
      this.mark = null;
      this.renderEditor();
      if (this.opts.storageKey) Store.setCode(this.opts.storageKey, this.textarea.value);
    }

    insert(p) {
      const ta = this.textarea;
      const { selectionStart: a, selectionEnd: b, value } = ta;
      const before = value.slice(0, a);
      const sep = before && !/\s$/.test(before) ? (before.endsWith('[') ? ' ' : '\n') : '';
      const text = sep + p.code;
      ta.setRangeText(text, a, b, 'end');
      if (p.caret) { const pos = ta.selectionEnd + p.caret; ta.setSelectionRange(pos, pos); }
      ta.focus();
      ta.dispatchEvent(new Event('input'));
    }

    renderEditor() {
      const text = this.textarea.value;
      const m = this.mark;
      const marks = m && m.end > m.start
        ? esc(text.slice(0, m.start)) + `<mark class="${m.kind}">` + esc(text.slice(m.start, m.end)) + '</mark>' + esc(text.slice(m.end))
        : esc(text);
      this.marksLayer.firstChild.innerHTML = marks + '\n';
      this.hlLayer.firstChild.innerHTML = highlight(text) + '\n';
      const lines = text.split('\n').length;
      const activeLine = m ? text.slice(0, m.start).split('\n').length : 0;
      let g = '';
      for (let i = 1; i <= lines; i++) g += `<div class="${i === activeLine ? 'ln ' + m.kind : 'ln'}">${i}</div>`;
      this.gutter.innerHTML = g;
      this.syncScroll();
    }

    syncScroll() {
      for (const l of [this.marksLayer, this.hlLayer]) {
        l.scrollTop = this.textarea.scrollTop;
        l.scrollLeft = this.textarea.scrollLeft;
      }
      this.gutter.scrollTop = this.textarea.scrollTop;
    }

    setMark(start, end, kind) {
      this.mark = start == null ? null : { start, end, kind };
      this.renderEditor();
      if (this.mark) this.scrollToMark();
    }

    scrollToMark() {
      const ta = this.textarea;
      const line = ta.value.slice(0, this.mark.start).split('\n').length - 1;
      const lh = parseFloat(getComputedStyle(ta).lineHeight) || 24;
      const top = line * lh;
      if (top < ta.scrollTop || top > ta.scrollTop + ta.clientHeight - lh * 2) {
        ta.scrollTop = Math.max(0, top - ta.clientHeight / 2);
        this.syncScroll();
      }
    }

    /* ------------------------------ Mensagens ---------------------------- */
    showMessage(html, kind) {
      this.msg.className = 'ws-message show ' + (kind || 'info');
      this.msg.innerHTML = html;
    }

    clearMessage() {
      this.msg.className = 'ws-message idle';
      this.msg.innerHTML = '<p>💡 Pronto para executar.</p><p class="muted">Clique em <b>▶ Executar</b> para ver a tartaruga em ação!</p>';
    }

    /** Painel "Resultado": o que aconteceu na última execução. */
    setResult(kind, html) {
      this.resultEl.className = 'ws-result ' + kind;
      this.resultEl.innerHTML = html;
    }

    showError(e) {
      if (!(e instanceof Logo.LogoError)) {
        console.error(e);
        e = new Logo.LogoError({ title: '🤔 Algo deu errado.', message: 'A tartaruga se confundiu com este programa. Confira os comandos e tente de novo.' });
      }
      const line = e.line ? `<span class="err-line">Linha ${e.line}</span>` : '';
      this.showMessage(`
        <p class="msg-title">${esc(e.title)} ${line}</p>
        <p>${esc(e.message || '')}</p>
        ${e.snippet ? `<p class="msg-snippet-label">${e.snippet.includes('???') ? 'O que está faltando:' : 'Exemplo correto:'}</p><pre class="snippet">${esc(e.snippet)}</pre>` : ''}`, 'error');
      if (typeof e.start === 'number') this.setMark(e.start, e.end, 'err');
      this.setResult('error', `<p class="res-line"><span class="res-icon">✕</span> O programa tem um erro${e.line ? ` na linha ${e.line}` : ''}.</p><p class="muted">Veja a explicação em Mensagens.</p>`);
    }

    /* ------------------------------ Execução ----------------------------- */
    get speed() { return Store.settings.speed || 'normal'; }

    /** Executa o programa do editor. opts.speed força uma velocidade (demonstrações). */
    run(opts) {
      opts = opts || {};
      if (this.running) this.stop(false);
      this.clearMessage();
      this.setMark(null);
      let compiled;
      try {
        compiled = Logo.compile(this.textarea.value);
      } catch (e) {
        this.showError(e);
        if (this.opts.onError) this.opts.onError(e);
        return;
      }
      if (!compiled.program.body.length) {
        this.showMessage('✍️ Escreva algum comando primeiro. Por exemplo: <code>PF 100</code>', 'info');
        return;
      }
      this.pushUndo();
      const keep = this.opts.freeTools && Store.settings.continueDrawing;
      if (this.opts.resetEachRun && !keep) Turtle.resetState(this.stage.state);
      this.stage.redrawLayer();
      this.setRunning(true);
      this.setResult('running', '<p class="res-line"><span class="res-icon">▶</span> Executando…</p><p class="muted">Acompanhe o comando destacado no editor.</p>');
      if (this.opts.onRunStart) this.opts.onRunStart(compiled);
      this.currentNode = null;
      this.stage.play(compiled.actions, {
        speed: opts.speed || this.speed,
        onAction: (a) => this.onAction(a),
        onDone: () => this.finish(compiled),
      });
    }

    onAction(a) {
      if (a.node !== this.currentNode) {
        this.currentNode = a.node;
        if (a.node && Store.settings.highlight !== false) this.setMark(a.node.start, a.node.end, 'cur');
      }
      if (a.loops.length) {
        this.loopBadge.hidden = false;
        this.loopBadge.innerHTML = '🔁 ' + a.loops.map((l) => `Repetição <b>${l.i}</b> de ${l.n}`).join(' › ');
      } else {
        this.loopBadge.hidden = true;
      }
      this.updateStatus();
    }

    finish(compiled) {
      this.setRunning(false);
      this.setMark(null);
      this.loopBadge.hidden = true;
      this.updateStatus();
      const st = compiled.stats, a = compiled.analysis;
      this.setResult('ok', `<p class="res-line"><span class="res-icon">✓</span> Programa executado com sucesso!</p>
        <p class="res-sub">🐢 Desenho concluído · ${a.size} comando${a.size > 1 ? 's' : ''} · ${st.moves} movimento${st.moves === 1 ? '' : 's'}${a.repeatCount ? ` · ${st.loopIterations} repetições` : ''}</p>`);
      if (this.opts.onFinish) this.opts.onFinish(compiled, this.stage.state);
    }

    stop(userAction) {
      const was = this.stage.stop();
      this.setRunning(false);
      this.setMark(null);
      this.loopBadge.hidden = true;
      this.updateStatus();
      if (was && userAction) this.setResult('stopped', '<p class="res-line"><span class="res-icon">■</span> Execução interrompida.</p>');
      if (was && userAction) this.showMessage('⏹ Execução interrompida. A tartaruga parou no último comando concluído.', 'info');
    }

    setRunning(on) {
      this.running = on;
      this.root.classList.toggle('is-running', on);
      this.$('[data-act="stop"]').disabled = !on;
      this.$('[data-act="run"] span').textContent = on ? 'Reiniciar' : 'Executar';
    }

    updateStatus() {
      const s = this.stage.state;
      const r = (v) => Math.round(v);
      this.statusEl.textContent = `📍 x ${r(s.x)} · y ${r(s.y)} · direção ${r(s.heading)}° · ${s.penDown ? '✏️ caneta abaixada' : '✋ caneta levantada'}`;
      this.penBadge.hidden = s.penDown;
      if (this.opts.freeTools) this.$('[data-act="pen"]').textContent = s.penDown ? '✋ Levantar caneta' : '✏️ Baixar caneta';
    }

    /* ------------------------- Desfazer / Refazer ------------------------ */
    pushUndo() {
      this.undoStack.push(Turtle.cloneState(this.stage.state));
      if (this.undoStack.length > 40) this.undoStack.shift();
      this.redoStack = [];
    }

    undo() {
      this.stop(false);
      if (!this.undoStack.length) return this.showMessage('Nada para desfazer.', 'info');
      this.redoStack.push(Turtle.cloneState(this.stage.state));
      this.stage.setState(this.undoStack.pop());
      this.updateStatus();
      this.showMessage('↶ Desfeito: voltamos ao desenho anterior.', 'info');
    }

    redo() {
      this.stop(false);
      if (!this.redoStack.length) return this.showMessage('Nada para refazer.', 'info');
      this.undoStack.push(Turtle.cloneState(this.stage.state));
      this.stage.setState(this.redoStack.pop());
      this.updateStatus();
      this.showMessage('↷ Refeito.', 'info');
    }

    clear() {
      this.stop(false);
      this.pushUndo();
      const s = Turtle.resetState(Turtle.cloneState(this.stage.state));
      this.stage.setState(s);
      this.clearMessage();
      this.updateStatus();
    }

    /** Limpa o mundo sem guardar histórico (ao trocar de nível/aula). */
    resetWorld() {
      this.stop(false);
      this.undoStack = [];
      this.redoStack = [];
      this.stage.setState(Turtle.resetState(Turtle.cloneState(this.stage.state)));
      this.clearMessage();
      this.updateStatus();
    }

    save() {
      if (this.opts.onSave) return this.opts.onSave(this);
      if (this.opts.storageKey) Store.setCode(this.opts.storageKey, this.textarea.value);
      root.App && root.App.toast('💾 ' + this.opts.saveLabel);
    }

    /* --------------------------- Ferramentas livres ---------------------- */
    setPenColor(color) {
      this.stage.state.color = color || null;
      Store.settings.penColor = color || '';
      Store.save();
      this.markSwatch();
      this.stage.draw();
    }

    markSwatch() {
      const cur = Store.settings.penColor || '';
      this.root.querySelectorAll('.swatch[data-color]').forEach((b) => {
        b.setAttribute('aria-checked', String(b.dataset.color === cur));
      });
    }

    togglePen() {
      this.stage.state.penDown = !this.stage.state.penDown;
      this.stage.draw();
      this.updateStatus();
    }

    home() {
      const s = this.stage.state;
      s.x = 0; s.y = 0; s.heading = 0;
      this.stage.draw();
      this.updateStatus();
    }

    zoom(f) {
      const v = Math.max(60, Math.min(3000, this.stage.opts.viewHalf * f));
      this.stage.setOption('viewHalf', v);
    }

    zoomFit() {
      this.fitSegments(this.stage.state.segments.concat(this.stage.ghost || []), 80);
    }

    /** Ajusta o zoom para caber o desenho que o código atual vai produzir. */
    zoomFitCode() {
      try {
        const r = Logo.compile(this.textarea.value);
        this.fitSegments(Turtle.simulate(r.actions, Turtle.createState()).segments, 260);
      } catch (e) { /* o erro aparece ao executar */ }
    }

    /** Zoom (centrado na origem) para que os segmentos caibam na tela. */
    fitSegments(segs, min) {
      const st = this.stage;
      if (!segs.length) return st.setOption('viewHalf', 260);
      const b = Turtle.bounds(segs);
      const ratio = st.w / st.h || 1;
      const needY = (Math.max(Math.abs(b.y0), Math.abs(b.y1), Math.abs(st.state.y)) + 30) * Math.min(ratio, 1);
      const needX = (Math.max(Math.abs(b.x0), Math.abs(b.x1), Math.abs(st.state.x)) + 30) / Math.max(ratio, 1);
      st.setOption('viewHalf', Math.max(min, needY, needX));
    }

    pngDataURL() {
      return Turtle.exportPNG(this.stage.state.segments);
    }

    async sharePNG() {
      if (!this.stage.state.segments.length) return this.showMessage('🎨 Desenhe algo primeiro — o mundo está vazio.', 'info');
      const url = this.pngDataURL();
      const name = 'meu-desenho-tartaruga.png';
      try {
        if (navigator.canShare) {
          const blob = await (await fetch(url)).blob();
          const file = new File([blob], name, { type: 'image/png' });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file], title: 'Meu desenho — Jornada da Tartaruga' });
            root.App && root.App.event('art');
            return;
          }
        }
      } catch (e) {
        if (e && e.name === 'AbortError') return;
      }
      download(url, name);
      root.App && root.App.toast('📤 Imagem PNG baixada: ' + name);
      root.App && root.App.event('art');
    }

    downloadTxt() {
      const blob = new Blob([this.textarea.value], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      download(url, 'meu-codigo-tartaruga.txt');
      setTimeout(() => URL.revokeObjectURL(url), 2000);
      root.App && root.App.toast('⬇️ Código baixado: meu-codigo-tartaruga.txt');
    }
  }

  function download(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  Workspace.esc = esc;
  root.Workspace = Workspace;
})(window);
