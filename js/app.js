/* =========================================================================
 * app.js — Controla as telas da Jornada da Tartaruga
 * -------------------------------------------------------------------------
 * Navegação por endereço (#/...), funciona no GitHub Pages e abrindo o
 * index.html direto do computador:
 *   #/inicio  #/aprender/3  #/desafios  #/desafio/4  #/livre  #/galeria
 *   #/comandos  #/conquistas  #/professor  #/personalizado/<dados>
 * ========================================================================= */
(function () {
  'use strict';

  const { Logo, Turtle, Levels, Store, Achievements, Workspace, TUTORIAL, EXAMPLES, Fractals, Progresso } = window;
  const LEVELS = Levels.LEVELS;
  const esc = Workspace.esc;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  Store.load();

  const App = {
    workspaces: [],
    toast,
    event: fireEvent,
    openInFree,
  };
  window.App = App;

  /* ===================================================================== *
   *  Utilidades de interface
   * ===================================================================== */
  function toast(html, kind) {
    const box = $('#toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.innerHTML = html;
    box.appendChild(t);
    setTimeout(() => t.classList.add('hide'), 3800);
    setTimeout(() => t.remove(), 4300);
  }

  function starsText(n, total) {
    total = total || 3;
    return '★'.repeat(n) + '☆'.repeat(total - n);
  }

  function starsHTML(n) {
    return `<span class="stars" aria-label="${n} de 3 estrelas"><span aria-hidden="true">${starsText(n)}</span></span>`;
  }

  /** Janela modal genérica (usa <dialog>). */
  function openModal({ title, html, actions, wide, onClose }) {
    const dlg = $('#modal');
    $('#modal-title').innerHTML = title;
    $('#modal-body').innerHTML = html;
    dlg.classList.toggle('wide', !!wide);
    const foot = $('#modal-actions');
    foot.innerHTML = '';
    (actions || [{ label: 'Fechar', cls: 'btn-primary' }]).forEach((a) => {
      const b = document.createElement(a.href ? 'a' : 'button');
      b.className = 'btn ' + (a.cls || '');
      b.innerHTML = a.label;
      if (a.href) b.href = a.href; else b.type = 'button';
      b.addEventListener('click', () => {
        if (a.onClick) a.onClick();
        if (a.keepOpen !== true) closeModal();
      });
      foot.appendChild(b);
    });
    dlg._onClose = onClose || null;
    if (!dlg.open) dlg.showModal();
    const first = foot.querySelector('.btn-primary') || foot.querySelector('.btn');
    if (first) first.focus();
    return dlg;
  }

  function closeModal() {
    const dlg = $('#modal');
    if (dlg.open) dlg.close();
  }

  $('#modal').addEventListener('close', () => {
    const dlg = $('#modal');
    if (dlg._onClose) { const f = dlg._onClose; dlg._onClose = null; f(); }
  });
  $('#modal-close').addEventListener('click', closeModal);

  /* ===================================================================== *
   *  Progresso, HUD e conquistas
   * ===================================================================== */
  function progress() {
    const done = LEVELS.filter((l) => Store.level(l.id).completed).length;
    const stars = LEVELS.reduce((s, l) => s + (Store.level(l.id).stars || 0), 0);
    let current = LEVELS.findIndex((l, i) => Store.isUnlocked(LEVELS, i) && !Store.level(l.id).completed);
    if (current < 0) current = LEVELS.length - 1;
    return { done, stars, current, total: LEVELS.length, badges: Object.keys(Store.data.achievements).length };
  }

  /** Cabeçalho: nível em foco (o aberto, ou o próximo a jogar), progresso e estrelas dele. */
  function updateHUD() {
    const p = progress();
    const lvl = (currentView === 'desafio' && activeLevel && activeLevel.id !== 'custom') ? activeLevel : LEVELS[p.current];
    $('#hud-level').textContent = lvl.id;
    $('#hud-level-name').textContent = lvl.title;
    $('#hud-done').textContent = p.done;
    $('#hud-level-total').textContent = p.total;
    const pct = Math.round((p.done / p.total) * 100);
    $('#hud-bar').style.width = Math.max(pct, 3) + '%';
    $('#hud-progressbar').setAttribute('aria-valuenow', String(pct));
    const st = Store.level(lvl.id).stars || 0;
    const box = $('#hud-stars');
    box.innerHTML = [1, 2, 3].map((i) => `<span class="${i <= st ? 'on' : ''}" aria-hidden="true">${i <= st ? '★' : '☆'}</span>`).join('');
    box.setAttribute('aria-label', `Nível ${lvl.id}: ${st} de 3 estrelas. Total: ${p.stars} de ${p.total * 3}.`);
    box.title = `Estrelas do nível ${lvl.id} · total ${p.stars}/${p.total * 3}`;
    const nb = $('#nav-badges');
    if (nb) nb.textContent = p.badges ? ` ${p.badges}` : '';
  }

  function fireEvent(name, details) {
    const got = Achievements.check(name, details || {}, Store.data);
    if (got.length) {
      Store.save();
      got.forEach((a, i) => setTimeout(() => toast(`<span class="toast-icon">${a.icon}</span><span><b>Conquista desbloqueada!</b><br>${esc(a.title)}</span>`, 'badge'), i * 600));
      updateHUD();
      if (currentView === 'conquistas') renderConquistas();
    }
  }

  /* ===================================================================== *
   *  Tema e configurações
   * ===================================================================== */
  function applyTheme() {
    // Visual único (azul). As cores ficam todas em css/style.css (:root).
    refreshAllStages();
  }

  function refreshAllStages() {
    requestAnimationFrame(() => {
      App.workspaces.forEach((w) => w.applySettings());
      if (heroStage) heroStage.refreshTheme();
      if (currentView === 'galeria') renderGalleryThumbs();
      if (currentView === 'desafio' && activeLevel) renderTargetPreview(activeLevel);
    });
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => { if (Store.settings.theme === 'auto') refreshAllStages(); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
  }

  document.addEventListener('tartaruga:settings', () => App.workspaces.forEach((w) => w.applySettings()));

  function openSettings() {
    const s = Store.settings;
    const html = `
      <form class="settings-form" onsubmit="return false">
        <fieldset>
          <legend>Velocidade padrão</legend>
          <label><input type="radio" name="set-speed" value="lenta" ${s.speed === 'lenta' ? 'checked' : ''}> 🐢 Lenta</label>
          <label><input type="radio" name="set-speed" value="normal" ${s.speed === 'normal' ? 'checked' : ''}> 🚶 Normal</label>
          <label><input type="radio" name="set-speed" value="rapida" ${s.speed === 'rapida' ? 'checked' : ''}> ⚡ Rápida</label>
        </fieldset>
        <fieldset>
          <legend>Mundo da tartaruga</legend>
          <label class="check"><input type="checkbox" name="grid" ${s.grid ? 'checked' : ''}> Mostrar grade (linhas a cada 50 passos)</label>
          <label class="check"><input type="checkbox" name="ghost" ${s.ghost ? 'checked' : ''}> Mostrar o desenho-alvo tracejado nos desafios</label>
          <label class="check"><input type="checkbox" name="arc" ${s.arc ? 'checked' : ''}> Mostrar o ângulo durante os giros</label>
          <label class="check"><input type="checkbox" name="highlight" ${s.highlight ? 'checked' : ''}> Destacar no editor o comando que está sendo executado</label>
        </fieldset>
        <fieldset>
          <legend>Aparência</legend>
          <label>Tamanho da letra do editor
            <select name="fontSize">
              ${[14, 16, 18, 20, 22].map((n) => `<option value="${n}" ${+s.fontSize === n ? 'selected' : ''}>${n} px</option>`).join('')}
            </select>
          </label>
        </fieldset>
        <fieldset class="danger-zone">
          <legend>Progresso</legend>
          <p>${Store.available ? 'Seu progresso fica salvo neste navegador.' : '⚠️ Este navegador não permite salvar (janela anônima?). O progresso será perdido ao fechar.'}</p>
          <button type="button" class="btn btn-danger" data-reset>🗑 Resetar progresso</button>
        </fieldset>
      </form>`;
    const dlg = openModal({ title: '⚙️ Configurações', html, actions: [{ label: 'Pronto', cls: 'btn-primary' }] });
    const form = $('.settings-form', dlg);
    form.addEventListener('change', (e) => {
      const el = e.target;
      if (el.name === 'set-speed') s.speed = el.value;
      else if (el.type === 'checkbox') s[el.name] = el.checked;
      else if (el.name === 'fontSize') s.fontSize = +el.value;
      else if (el.name === 'theme') s.theme = el.value;
      Store.save();
      if (el.name === 'theme') applyTheme(); else refreshAllStages();
    });
    $('[data-reset]', form).addEventListener('click', resetProgress);
  }

  function resetProgress() {
    const ok = window.confirm('Tem certeza que deseja apagar TODO o progresso deste computador?\n\nNome, níveis, estrelas, conquistas, aulas, códigos e desenhos salvos serão apagados. Se você guardou seu código de progresso, poderá recuperar as estrelas depois.');
    if (!ok) return;
    Store.reset();
    closeModal();
    updateHUD();
    toast('🗑 Progresso apagado. Uma nova jornada começa!');
    location.hash = '#/inicio';
    route(true);
    updatePlayer();
    setTimeout(askName, 300);
  }

  function openHelp() {
    const rows = Object.values(Logo.commands).map((c) =>
      `<tr><th scope="row"><code>${c.name}${c.args.length ? ' n' : ''}${c.block ? ' [ ]' : ''}</code></th><td>${esc(c.doc.text)}</td><td><code>${esc(c.doc.example.split('\n')[0])}</code></td></tr>`).join('');
    openModal({
      title: '❓ Ajuda',
      wide: true,
      html: `
        <p><b>Como funciona:</b> escreva comandos no editor e clique em <b>▶ Executar</b>. A tartaruga obedece, um comando de cada vez.
        Observe o resultado, encontre o erro e corrija — é assim que programadores trabalham!</p>
        <ul class="help-list">
          <li>🐢 A tartaruga começa no <b>centro</b>, olhando <b>para cima</b>, com a caneta <b>abaixada</b>.</li>
          <li>📏 A grade de fundo tem linhas a cada <b>50 passos</b>.</li>
          <li>🔤 Tanto faz maiúsculas ou minúsculas, espaços ou quebras de linha: <code>pf 100 pd 90</code> funciona.</li>
          <li>💬 Tudo depois de <code>;</code> é um comentário (a tartaruga ignora).</li>
          <li>🎯 Nos desafios, o desenho-alvo aparece <b>tracejado</b>. Não importa o código: importa o desenho!</li>
        </ul>
        <h3>Comandos</h3>
        <div class="table-scroll"><table class="cmd-table"><thead><tr><th>Comando</th><th>O que faz</th><th>Exemplo</th></tr></thead><tbody>${rows}</tbody></table></div>
        <h3>Atalhos de teclado</h3>
        <ul class="help-list">
          <li><kbd>Ctrl</kbd> + <kbd>Enter</kbd> — executar o programa</li>
          <li><kbd>Esc</kbd> — parar a execução</li>
          <li><kbd>Tab</kbd> — navegar pelos botões</li>
        </ul>`,
    });
  }

  $('[data-action="help"]').addEventListener('click', openHelp);
  $('[data-action="settings"]').addEventListener('click', openSettings);
  $('[data-action="tutorial"]').addEventListener('click', () => { location.hash = '#/aprender'; });
  $('[data-action="player"]').addEventListener('click', openCodeModal);

  /* ===================================================================== *
   *  Jogador e código de progresso (mesmo sistema do AlgoBot)
   * ===================================================================== */
  function myCode() {
    return Progresso.gerarCodigo(Store.data, LEVELS, TUTORIAL);
  }

  function updatePlayer() {
    const nome = Store.data.nome || '';
    $('#player-name').textContent = nome || 'Entrar';
    const ini = nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
    $('#avatar').innerHTML = ini ? esc(ini) : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>';
  }

  function setStatus(el, text, isError) {
    el.textContent = text;
    el.className = 'form-status ' + (isError ? 'is-error' : 'is-ok');
  }

  /** Traz o progresso de um código para este computador (nunca piora nada). */
  function importCode(code, name) {
    const r = Progresso.importar(Store.data, code, name, LEVELS, TUTORIAL);
    if (!r.ok) return r;
    Store.save();
    fireEvent('sync');
    updatePlayer();
    updateHUD();
    return r;
  }

  function importedText(r) {
    if (!r.niveis && !r.aulas) return 'Código conferido! Este computador já tinha todo esse progresso.';
    return `Progresso trazido! ${r.niveis} nível(is) e ${r.aulas} aula(s) atualizados.`;
  }

  /** Boas-vindas: pede o nome (ou o código de outro computador). */
  function askName() {
    const dlg = openModal({
      title: '🐢 Bem-vindo à Jornada da Tartaruga',
      html: `
        <p>Digite seu nome ou apelido. Ele fica guardado só neste computador e assina o seu <b>código de progresso</b>.</p>
        <label class="field">Seu nome <input type="text" id="welcome-name" maxlength="24" autocomplete="off" placeholder="Seu nome"></label>
        <p><button type="button" class="link-btn" data-toggle-code>💻 Já jogou em outro computador?</button></p>
        <div class="code-block" hidden>
          <label class="field">Seu código <input type="text" id="welcome-code" placeholder="${Progresso.PREFIXO}-XXXXXXXX-XXXX" autocomplete="off" spellcheck="false"></label>
          <button type="button" class="btn" data-continue>▶ Continuar de onde parei</button>
          <p class="form-status" aria-live="polite"></p>
        </div>`,
      actions: [{ label: '🚀 Começar do zero', cls: 'btn-primary', keepOpen: true, onClick: () => confirmName() }],
    });
    const nameEl = $('#welcome-name', dlg);
    const status = $('.code-block .form-status', dlg);
    nameEl.value = Store.data.nome || '';
    setTimeout(() => nameEl.focus(), 50);
    nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); confirmName(); } });
    $('[data-toggle-code]', dlg).addEventListener('click', () => {
      const b = $('.code-block', dlg);
      b.hidden = !b.hidden;
      if (!b.hidden) $('#welcome-code', dlg).focus();
    });
    $('[data-continue]', dlg).addEventListener('click', () => {
      const name = nameEl.value.trim();
      const code = $('#welcome-code', dlg).value.trim();
      if (!name) { setStatus(status, 'Digite seu nome ali em cima primeiro.', true); nameEl.focus(); return; }
      if (!code) { setStatus(status, 'Cole o código que você recebeu.', true); return; }
      const r = importCode(code, name);
      if (!r.ok) { setStatus(status, r.motivo, true); return; }
      closeModal();
      toast('🎉 ' + importedText(r));
      route(true);
    });

    function confirmName() {
      const name = nameEl.value.trim();
      if (!name) { nameEl.focus(); nameEl.setAttribute('aria-invalid', 'true'); return; }
      Store.data.nome = name;
      Store.save();
      updatePlayer();
      closeModal();
      toast(`👋 Olá, ${esc(name)}! Seu progresso será salvo neste computador.`);
      if (currentView === 'desafios' || currentView === 'conquistas') route(true);
    }
  }

  /** "Meu código": ver, copiar, mandar para o próprio e-mail e importar. */
  function openCodeModal() {
    if (!Store.data.nome) return askName();
    const code = myCode();
    const dlg = openModal({
      title: '🔑 Meu código de progresso',
      wide: true,
      html: `
        <p>Este código carrega <b>todo o seu progresso</b> (estrelas de cada nível e aulas concluídas).
        Use-o para continuar em outro computador ou para mostrar ao professor.</p>
        <p class="player-line">Jogador: <b>${esc(Store.data.nome)}</b></p>
        <div class="progress-code-row">
          <output class="progress-code" aria-label="Seu código">${code}</output>
          <button type="button" class="btn btn-sm" data-copy-code>📋 Copiar</button>
        </div>
        <section class="save-later">
          <h3>💾 Salvar para continuar depois</h3>
          <p class="muted">Manda este código para o <b>seu próprio e-mail</b>, para colar em qualquer computador mais tarde.</p>
          <label class="field">Seu e-mail <input type="email" id="save-email" placeholder="seu-email@exemplo.com" autocomplete="email"></label>
          <div class="custom-actions">
            <button type="button" class="btn btn-primary" data-gmail>💾 Salvar e continuar depois</button>
            <button type="button" class="link-btn" data-mailto>Usar outro programa de e-mail</button>
          </div>
          <p class="form-status save-status" aria-live="polite"></p>
        </section>
        <details class="import-box">
          <summary>📥 Importar código de outro computador</summary>
          <p class="muted">Seu progresso daqui não se perde: fica valendo o melhor resultado de cada nível.</p>
          <div class="custom-actions">
            <input type="text" id="import-code" class="code-field" placeholder="${Progresso.PREFIXO}-XXXXXXXX-XXXX" autocomplete="off" spellcheck="false" aria-label="Código de outro computador">
            <button type="button" class="btn" data-import>Importar</button>
          </div>
          <p class="form-status import-status" aria-live="polite"></p>
        </details>`,
      actions: [{ label: 'Fechar', cls: 'btn-primary' }],
      onClose: () => { if (imported) route(true); },
    });
    let imported = false;
    const email = $('#save-email', dlg);
    email.value = Store.settings.emailAluno || '';
    $('[data-copy-code]', dlg).addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(code); toast('📋 Código copiado!'); }
      catch (e) { toast('Selecione o código e use Ctrl+C para copiar.'); }
    });
    const send = (gmail) => {
      const st = $('.save-status', dlg);
      const to = email.value.trim();
      if (!to) { setStatus(st, 'Digite o seu e-mail primeiro.', true); email.focus(); return; }
      Store.settings.emailAluno = to;
      Store.save();
      const link = gmail ? Progresso.linkGmail(to, code, Store.data.nome) : Progresso.linkMailto(to, code, Store.data.nome);
      if (gmail) window.open(link, '_blank', 'noopener'); else location.href = link;
      setStatus(st, `Abrindo o e-mail para ${to}. É só clicar em Enviar.`, false);
    };
    $('[data-gmail]', dlg).addEventListener('click', () => send(true));
    $('[data-mailto]', dlg).addEventListener('click', () => send(false));
    $('[data-import]', dlg).addEventListener('click', () => {
      const st = $('.import-status', dlg);
      const c = $('#import-code', dlg).value.trim();
      if (!c) { setStatus(st, 'Cole o código que você recebeu.', true); return; }
      const r = importCode(c, Store.data.nome);
      if (!r.ok) { setStatus(st, r.motivo, true); return; }
      imported = true;
      setStatus(st, importedText(r), false);
      $('.progress-code', dlg).textContent = myCode();
      $('#import-code', dlg).value = '';
    });
  }

  /* ===================================================================== *
   *  Roteamento
   * ===================================================================== */
  let currentView = null;
  const rendered = {};

  const VIEWS = {
    inicio: renderInicio,
    aprender: renderAprender,
    desafios: renderMapa,
    desafio: renderDesafio,
    personalizado: renderPersonalizado,
    livre: renderLivre,
    galeria: renderGaleria,
    comandos: renderComandos,
    conquistas: renderConquistas,
    professor: renderProfessor,
  };
  const SECTION = { personalizado: 'desafio' };
  const NAV = { desafio: 'desafios', personalizado: 'desafios' };

  function route(force) {
    const parts = location.hash.replace(/^#\/?/, '').split('/');
    let name = parts[0] || 'inicio';
    if (!VIEWS[name]) name = 'inicio';
    App.workspaces.forEach((w) => w.stop(false));
    if (heroStage) heroStage.stop();
    closeModal();

    const section = SECTION[name] || name;
    $$('.view').forEach((v) => { v.hidden = v.id !== 'view-' + section; });
    $$('.main-nav a').forEach((a) => {
      if (a.dataset.nav === (NAV[name] || name)) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    const changed = currentView !== name || force;
    currentView = name;
    VIEWS[name](parts.slice(1), changed);
    if (changed) window.scrollTo(0, 0);
    updateHUD();
  }

  window.addEventListener('hashchange', () => route());

  /* ===================================================================== *
   *  INÍCIO
   * ===================================================================== */
  let heroStage = null;

  function renderInicio() {
    const p = progress();
    const view = $('#view-inicio');
    if (!rendered.inicio) {
      rendered.inicio = true;
      view.innerHTML = `
        <section class="hero card">
          <div class="hero-text">
            <p class="eyebrow">Lógica de programação · Ensino Médio Técnico</p>
            <h2>Vou aprender programação controlando uma tartaruga.</h2>
            <p class="lead">Escreva comandos, veja a tartaruga desenhar, observe o resultado e corrija. É assim que programadores de verdade trabalham.</p>
            <ol class="cycle" aria-label="Ciclo de aprendizagem">
              <li><span aria-hidden="true">✍️</span> Eu escrevo o comando</li>
              <li><span aria-hidden="true">🐢</span> A tartaruga executa</li>
              <li><span aria-hidden="true">👀</span> Eu observo o resultado</li>
              <li><span aria-hidden="true">🔎</span> Identifico o erro</li>
              <li><span aria-hidden="true">🔧</span> Corrijo o código</li>
            </ol>
            <div class="hero-actions">
              <a class="btn btn-primary btn-lg" href="#/aprender">📘 Começar o tutorial</a>
              <a class="btn btn-lg" id="hero-continue" href="#/desafios">🎮 Ir para os desafios</a>
            </div>
          </div>
          <div class="hero-art">
            <canvas class="hero-canvas" role="img" aria-label="Animação: a tartaruga desenhando uma mandala de quadrados"></canvas>
            <pre class="hero-code" aria-hidden="true">REPITA 12 [
  REPITA 4 [PF 80 PD 90]
  PD 30
]</pre>
          </div>
        </section>

        <h2 class="section-title">Sua jornada</h2>
        <ol class="journey">
          <li><a href="#/aprender" class="journey-step"><span class="j-icon">📘</span><b>Aprender</b><small>7 aulas curtas sobre os comandos</small></a></li>
          <li><a href="#/comandos" class="journey-step"><span class="j-icon">🧪</span><b>Experimentar</b><small>Biblioteca de comandos com exemplos</small></a></li>
          <li><a href="#/desafios" class="journey-step"><span class="j-icon">🧩</span><b>Resolver desafios</b><small>15 níveis com desenhos-alvo</small></a></li>
          <li><a href="#/conquistas" class="journey-step"><span class="j-icon">🏅</span><b>Conquistar níveis</b><small>Estrelas e conquistas</small></a></li>
          <li><a href="#/galeria" class="journey-step"><span class="j-icon">🎨</span><b>Criar</b><small>Galeria: o que posso criar?</small></a></li>
          <li><a href="#/livre" class="journey-step"><span class="j-icon">🚀</span><b>Programar livremente</b><small>Modo Livre, sem regras</small></a></li>
        </ol>`;
      heroStage = new Turtle.Stage($('.hero-canvas', view), { grid: false, viewHalf: 135, showArc: false });
    }
    const cont = $('#hero-continue');
    if (p.done > 0) {
      cont.href = '#/desafio/' + LEVELS[p.current].id;
      cont.textContent = `▶ Continuar: nível ${LEVELS[p.current].id}`;
    }
    playHero();
  }

  function playHero() {
    if (!heroStage) return;
    const r = Logo.compile('REPITA 12 [REPITA 4 [PF 80 PD 90] PD 30]');
    Turtle.resetState(heroStage.state);
    heroStage.redrawLayer();
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() => {
      heroStage.resize();
      if (reduced) heroStage.runInstant(r.actions);
      else heroStage.play(r.actions, { speed: 'normal' });
    });
  }

  /* ===================================================================== *
   *  APRENDER (tutorial)
   * ===================================================================== */
  let lessonWS = null;
  let activeLesson = null;

  function renderAprender(params) {
    const view = $('#view-aprender');
    let id = parseInt(params[0], 10);
    if (!TUTORIAL.some((l) => l.id === id)) {
      const firstOpen = TUTORIAL.find((l) => !Store.data.lessons[l.id]);
      id = (firstOpen || TUTORIAL[0]).id;
    }
    const lesson = TUTORIAL.find((l) => l.id === id);
    const idx = TUTORIAL.indexOf(lesson);

    if (!rendered.aprender) {
      rendered.aprender = true;
      view.innerHTML = `
        <div class="page-head">
          <h2>📘 Aprenda a falar com a Tartaruga</h2>
          <p>Aulas curtas. Leia, execute, mude os números e observe. Errar faz parte!</p>
        </div>
        <div class="learn-layout">
          <nav class="lesson-nav card" aria-label="Aulas do tutorial"><ol></ol></nav>
          <div class="lesson-main">
            <article class="lesson card" aria-live="polite"></article>
            <div class="lesson-ws"></div>
          </div>
        </div>`;
      lessonWS = new Workspace($('.lesson-ws', view), {
        palette: true,
        onFinish: (compiled) => {
          fireEvent('run', { analysis: compiled.analysis });
          completeLesson(activeLesson);
        },
      });
      App.workspaces.push(lessonWS);
    }

    $('.lesson-nav ol', view).innerHTML = TUTORIAL.map((l) => {
      const done = !!Store.data.lessons[l.id];
      return `<li><a href="#/aprender/${l.id}" class="lesson-link${done ? ' done' : ''}" ${l.id === id ? 'aria-current="step"' : ''}>
        <span class="lesson-num" aria-hidden="true">${done ? '✓' : l.id}</span>
        <span>${l.emoji} ${esc(l.title)}${done ? '<span class="sr-only"> (concluída)</span>' : ''}</span></a></li>`;
    }).join('');

    const done = !!Store.data.lessons[lesson.id];
    const prev = TUTORIAL[idx - 1], next = TUTORIAL[idx + 1];
    $('.lesson', view).innerHTML = `
      <p class="eyebrow">Aula ${lesson.id} de ${TUTORIAL.length}</p>
      <h3 class="lesson-title">${lesson.emoji} ${esc(lesson.title)}</h3>
      <div class="lesson-text">${lesson.html}</div>
      <p class="task"><b>🎯 Sua missão:</b> ${esc(lesson.task)} <span class="lesson-status">${done ? '✅ Aula concluída' : ''}</span></p>
      ${lesson.tries.length ? `<div class="tries"><span>Experimente:</span>${lesson.tries.map((t, i) =>
        `<button type="button" class="chip-btn code-chip" data-try="${i}">${esc(t.label || t.code.replace(/\n/g, ' '))}</button>`).join('')}</div>` : ''}
      ${lesson.demo === 'angles' ? `<div class="angle-demo"><span>Demonstração de giros:</span>${[90, 180, 270, 360].map((a) =>
        `<button type="button" class="chip-btn" data-angle="${a}">↻ ${a}°</button>`).join('')}</div>` : ''}
      ${lesson.concept ? `<div class="concept-slot" ${done ? '' : 'hidden'}>${conceptHTML(lesson.concept)}</div>` : ''}
      <div class="lesson-pager">
        ${prev ? `<a class="btn" href="#/aprender/${prev.id}">← ${esc(prev.title)}</a>` : '<span></span>'}
        ${next ? `<a class="btn btn-primary" href="#/aprender/${next.id}">${esc(next.title)} →</a>`
          : '<a class="btn btn-primary" href="#/desafios">🎮 Ir para os Desafios →</a>'}
      </div>`;

    $$('[data-try]', view).forEach((b) => b.addEventListener('click', () => {
      lessonWS.setCode(lesson.tries[+b.dataset.try].code);
      lessonWS.run();
    }));
    $$('[data-angle]', view).forEach((b) => b.addEventListener('click', () => {
      lessonWS.setCode('PD ' + b.dataset.angle);
      lessonWS.run({ speed: 'lenta' });
    }));

    if (activeLesson !== lesson) {
      activeLesson = lesson;
      lessonWS.opts.storageKey = 'aula-' + lesson.id;
      lessonWS.stage.opts.colorIterations = !!lesson.colorIterations;
      lessonWS.setCode(Store.code('aula-' + lesson.id, lesson.code));
      lessonWS.resetWorld();
    }
  }

  function completeLesson(lesson) {
    if (!lesson || Store.data.lessons[lesson.id]) return;
    Store.data.lessons[lesson.id] = true;
    Store.save();
    toast(`✅ Aula ${lesson.id} concluída: ${esc(lesson.title)}`);
    const view = $('#view-aprender');
    const slot = $('.concept-slot', view);
    if (slot) slot.hidden = false;
    const st = $('.lesson-status', view);
    if (st) st.textContent = '✅ Aula concluída';
    const link = $(`.lesson-link[href="#/aprender/${lesson.id}"]`, view);
    if (link) { link.classList.add('done'); $('.lesson-num', link).textContent = '✓'; }
    fireEvent('lesson');
  }

  function conceptHTML(c) {
    return `
      <aside class="concept">
        <p class="concept-title">${c.title}</p>
        <p>${c.text}</p>
        ${c.code ? `<pre class="snippet">${esc(c.code)}</pre>` : ''}
        ${c.compare ? `<details><summary>Como isso aparece em outras linguagens?</summary><pre class="snippet alt">${esc(c.compare)}</pre></details>` : ''}
      </aside>`;
  }

  /* ===================================================================== *
   *  DESAFIOS — mapa de níveis
   * ===================================================================== */
  const MAP_OFFSETS = [0, 70, 120, 70, 0, -70, -120, -70];

  function renderMapa() {
    const p = progress();
    const nodes = LEVELS.map((l, i) => {
      const unlocked = Store.isUnlocked(LEVELS, i);
      const res = Store.level(l.id);
      const state = res.completed ? 'done' : unlocked ? 'open' : 'locked';
      const off = MAP_OFFSETS[(i + 1) % MAP_OFFSETS.length];
      const label = `Nível ${l.id}: ${l.title}. ` + (state === 'done' ? `Concluído com ${res.stars} de 3 estrelas.` : state === 'open' ? 'Disponível.' : 'Bloqueado.');
      const inner = `<span class="node-icon" aria-hidden="true">${state === 'locked' ? '🔒' : l.icon}</span>`;
      return `
        <li class="map-node ${state}${i === p.current && state === 'open' ? ' current' : ''}" style="--off:${off}px">
          ${state === 'locked'
            ? `<span class="node-btn" aria-disabled="true" role="img" aria-label="${esc(label)}">${inner}</span>`
            : `<a class="node-btn" href="#/desafio/${l.id}" aria-label="${esc(label)}">${inner}</a>`}
          <div class="node-text" aria-hidden="true">
            <b>Nível ${l.id}</b> <span>${esc(l.title)}</span>
            <small>${state === 'done' ? `<span class="stars">${starsText(res.stars)}</span>` : state === 'open' ? '▶ Jogar' : '🔒 Bloqueado'}</small>
          </div>
        </li>`;
    }).join('');

    const fut = Levels.FUTURE_LEVELS[0];
    $('#view-desafios').innerHTML = `
      <div class="page-head">
        <h2>🗺️ Desafios — Mapa da Jornada</h2>
        <p>Cada nível mostra um desenho-alvo. Escreva um programa que faça a tartaruga desenhá-lo. Ao concluir, o próximo nível é desbloqueado.</p>
      </div>
      <div class="map-layout">
        <div class="map-wrap">
        <svg class="map-path" aria-hidden="true"></svg>
        <ol class="map" aria-label="Níveis">
          <li class="map-node start" style="--off:0px"><span class="node-btn"><span class="node-icon" aria-hidden="true">🐢</span></span><div class="node-text"><b>Início</b></div></li>
          ${nodes}
          <li class="map-node finish ${Store.level(15).completed ? 'done' : ''}" style="--off:0px"><span class="node-btn"><span class="node-icon" aria-hidden="true">🏆</span></span><div class="node-text"><b>Mestre da Tartaruga</b><small>${Store.level(15).completed ? 'Conquistado!' : 'Conclua o nível 15'}</small></div></li>
          <li class="map-node future" style="--off:0px">
            <span class="node-btn"><span class="node-icon" aria-hidden="true">${fut.icon}</span></span>
            <div class="node-text"><b>${esc(fut.title)}</b><small>🚧 Em breve</small></div>
          </li>
        </ol>
        </div>
        <aside class="map-side">
          <div class="card">
            <h3>Seu progresso</h3>
            <p class="big-number">${p.done}<small>/${p.total} níveis</small></p>
            <p><span class="stars big">★</span> ${p.stars} de ${p.total * 3} estrelas</p>
            <a class="btn btn-primary btn-block" href="#/desafio/${LEVELS[p.current].id}">▶ Jogar o nível ${LEVELS[p.current].id}</a>
            <div class="identity">
              <span>Jogador: <b>${esc(Store.data.nome || '—')}</b></span>
              <span>Código: <b class="mono">${myCode()}</b></span>
            </div>
            <button type="button" class="btn btn-sm btn-block" data-open-code>🔑 Salvar / importar progresso</button>
          </div>
          <div class="card legend">
            <h3>Como ganhar estrelas</h3>
            <ul>
              <li><span class="stars">★☆☆</span> desenho correto</li>
              <li><span class="stars">★★☆</span> usando REPITA quando faz sentido</li>
              <li><span class="stars">★★★</span> solução eficiente (poucos comandos)</li>
            </ul>
            <p class="muted">Você pode voltar a qualquer nível concluído para melhorar sua marca.</p>
          </div>
          <div class="card future-card">
            <h3>${fut.icon} ${esc(fut.title)} <span class="tag">em breve</span></h3>
            <canvas class="fractal-preview" width="260" height="200" role="img" aria-label="Prévia: floco de neve de Koch"></canvas>
            <p class="muted">${esc(Fractals.description)}</p>
          </div>
        </aside>
      </div>`;
    requestAnimationFrame(drawMapPath);
    $('#view-desafios [data-open-code]').addEventListener('click', openCodeModal);
    const fc = $('#view-desafios .fractal-preview');
    const flake = Turtle.simulate(Fractals.snowflakeActions(240, 3), Turtle.createState());
    Turtle.renderFit(fc, flake.segments, { padding: 12, lineWidth: 1.5 });
  }

  /** Desenha a trilha pontilhada que liga os níveis do mapa. */
  function drawMapPath() {
    const wrap = $('#view-desafios .map-wrap');
    if (!wrap || !wrap.offsetParent) return;
    const wr = wrap.getBoundingClientRect();
    const pts = $$('.node-btn', wrap).map((b) => {
      const r = b.getBoundingClientRect();
      return [r.left + r.width / 2 - wr.left, r.top + r.height / 2 - wr.top];
    });
    if (pts.length < 2) return;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const my = (y0 + y1) / 2;
      d += ` C${x0},${my} ${x1},${my} ${x1},${y1}`;
    }
    $('.map-path', wrap).innerHTML = `<path d="${d}"/>`;
  }
  window.addEventListener('resize', () => { if (currentView === 'desafios') drawMapPath(); });

  /* ===================================================================== *
   *  DESAFIO — tela de um nível
   * ===================================================================== */
  let levelWS = null;
  let activeLevel = null;
  let levelSession = null; // { hints, hadErrors }

  function renderDesafio(params) {
    const id = parseInt(params[0], 10);
    const idx = LEVELS.findIndex((l) => l.id === id);
    if (idx < 0) { location.hash = '#/desafios'; return; }
    if (!Store.isUnlocked(LEVELS, idx)) {
      toast('🔒 Este nível ainda está bloqueado. Conclua o nível anterior primeiro.');
      location.hash = '#/desafios';
      return;
    }
    openLevel(LEVELS[idx], false);
  }

  function ensureLevelView() {
    const view = $('#view-desafio');
    if (rendered.desafio) return view;
    rendered.desafio = true;
    view.innerHTML = `
      <div class="level-layout">
        <aside class="level-info card" aria-labelledby="level-title"></aside>
        <div class="level-ws"></div>
      </div>`;
    levelWS = new Workspace($('.level-ws', view), {
      onFinish: onLevelFinish,
      onError: () => { if (levelSession) levelSession.hadErrors = true; },
    });
    App.workspaces.push(levelWS);
    return view;
  }

  function openLevel(level, custom) {
    const view = ensureLevelView();
    const info = $('.level-info', view);
    const res = custom ? { stars: 0 } : Store.level(level.id);
    const reqs = (level.requires || []).filter((r) => r !== 'PF');
    const idx = LEVELS.indexOf(level);

    const crit2 = level.repeatUseful ? 'Usou o REPITA' : 'Sem comandos sobrando';
    info.innerHTML = `
      <div class="aside-head">
        <a class="back-btn" href="${custom ? '#/inicio' : '#/desafios'}" aria-label="Voltar ${custom ? 'ao início' : 'ao mapa de níveis'}">‹</a>
        <h2 id="level-title">${custom ? 'Desafio do Professor' : `Desafio do Nível ${level.id}`}</h2>
      </div>

      <div class="in-card challenge-card">
        <span class="ch-icon" aria-hidden="true">${level.icon}</span>
        <div>
          <b class="ch-title">${esc(level.title)}</b>
          <p class="challenge">${esc(level.challenge)}</p>
        </div>
      </div>

      <figure class="in-card target">
        <canvas class="target-canvas" role="img" aria-label="Desenho-alvo do nível"></canvas>
        <figcaption>🎯 Desenho-alvo · <span class="start-mark" aria-hidden="true">▲</span> início da tartaruga</figcaption>
        <ul class="chips" aria-label="Regras do desafio">
          ${reqs.map((r) => `<li class="chip chip-req">📌 Obrigatório: ${esc(Levels.requirementLabel(r))}</li>`).join('')}
          ${level.finalAtStart ? '<li class="chip chip-req">📍 Termine no ponto inicial</li>' : ''}
        </ul>
        <label class="check small"><input type="checkbox" data-ghost ${Store.settings.ghost ? 'checked' : ''}> Mostrar o alvo tracejado no mundo</label>
      </figure>

      <details class="in-card hint-box" open>
        <summary><span class="sec-icon" aria-hidden="true">💡</span> Dica <span class="chev" aria-hidden="true">⌄</span></summary>
        <ol class="hints" aria-live="polite"></ol>
        <button type="button" class="btn btn-sm btn-hint" data-hint>Mostrar dica</button>
      </details>

      <section class="in-card rewards" aria-labelledby="rw-title">
        <h3 id="rw-title"><span class="sec-icon" aria-hidden="true">⭐</span> Recompensas</h3>
        <div class="reward-stars" aria-hidden="true"></div>
        <p class="reward-text"></p>
        <ul class="reward-rules">
          <li>★ desenho correto</li>
          <li>★★ ${level.repeatUseful ? 'usando REPITA' : 'sem comandos sobrando'}</li>
          <li>★★★ até ${level.par} comando${level.par > 1 ? 's' : ''}</li>
        </ul>
      </section>

      <section class="in-card level-progress" aria-labelledby="lp-title">
        <h3 id="lp-title"><span class="sec-icon" aria-hidden="true">🏁</span> Progresso do Nível</h3>
        <div class="lp-body">
          <div class="ring" role="img" aria-label="0% concluído"><span>0%</span></div>
          <ul class="criteria">
            <li data-crit="1"><span class="ck" aria-hidden="true"></span> Desenho correto</li>
            <li data-crit="2"><span class="ck" aria-hidden="true"></span> ${crit2}</li>
            <li data-crit="3"><span class="ck" aria-hidden="true"></span> Solução eficiente</li>
          </ul>
        </div>
        <p class="lp-note muted small"></p>
      </section>

      <div class="aside-nav">
        ${!custom && idx > 0 ? `<a class="btn btn-ghost" href="#/desafio/${LEVELS[idx - 1].id}" aria-label="Nível anterior">‹ Anterior</a>` : ''}
        <a class="btn map-btn" href="#/desafios">🗺️ Mapa de Níveis</a>
      </div>`;

    updateLevelPanel(res.completed ? res.stars : 0, 'best');
    levelSession = { hints: 0, hadErrors: false, level, custom };
    updateHintButton();
    $('[data-hint]', info).addEventListener('click', showHint);
    $('[data-ghost]', info).addEventListener('change', (e) => {
      Store.settings.ghost = e.target.checked;
      Store.save();
      levelWS.stage.opts.showGhost = e.target.checked;
      levelWS.stage.draw();
    });

    activeLevel = level;
    levelWS.opts.storageKey = custom ? null : 'nivel-' + level.id;
    levelWS.setCode(custom ? '' : Store.code('nivel-' + level.id, ''));
    levelWS.resetWorld();
    levelWS.stage.setOption('viewHalf', 260);
    levelWS.stage.setGhost(Levels.targetOf(level));
    requestAnimationFrame(() => renderTargetPreview(level));
  }

  /** Atualiza Recompensas e o anel "Progresso do Nível" (0 a 3 critérios). */
  function updateLevelPanel(stars, source) {
    const view = $('#view-desafio');
    const best = levelSession && levelSession.custom ? 0 : (activeLevel ? Store.level(activeLevel.id).stars || 0 : 0);
    const rs = $('.reward-stars', view);
    if (!rs) return;
    rs.innerHTML = [1, 2, 3].map((i) => `<span class="${i <= best ? 'on' : ''}">${i <= best ? '★' : '☆'}</span>`).join('');
    $('.reward-text', view).textContent = best
      ? `Sua melhor marca: ${best} de 3 estrelas.${best < 3 ? ' Dá para melhorar!' : ' Perfeito!'}`
      : 'Conclua o desafio para ganhar suas estrelas!';
    const pct = Math.round((stars / 3) * 100);
    const ring = $('.ring', view);
    ring.style.setProperty('--p', pct);
    ring.setAttribute('aria-label', pct + '% concluído');
    $('span', ring).textContent = pct + '%';
    $$('.criteria li', view).forEach((li) => {
      const ok = stars >= +li.dataset.crit;
      li.classList.toggle('ok', ok);
      $('.ck', li).textContent = ok ? '✓' : '';
    });
    $('.lp-note', view).textContent = source === 'try' ? 'Resultado da última execução.' : (stars ? 'Sua melhor marca neste nível.' : 'Execute seu programa para medir.');
  }

  function renderTargetPreview(level) {
    const c = $('#view-desafio .target-canvas');
    if (c) Turtle.renderFit(c, Levels.targetOf(level), { showStart: true, padding: 18 });
  }

  function updateHintButton() {
    const s = levelSession;
    const b = $('#view-desafio [data-hint]');
    const total = s.level.hints.length;
    if (s.hints >= total) { b.textContent = 'Sem mais dicas'; b.disabled = true; }
    else { b.textContent = s.hints ? `Mais uma dica (${s.hints + 1} de ${total})` : `Mostrar dica (1 de ${total})`; b.disabled = false; }
  }

  function showHint() {
    const s = levelSession;
    if (s.hints >= s.level.hints.length) return;
    const li = document.createElement('li');
    li.textContent = s.level.hints[s.hints];
    $('#view-desafio .hints').appendChild(li);
    s.hints++;
    updateHintButton();
  }

  function onLevelFinish(compiled, state) {
    const s = levelSession;
    const level = s.level;
    fireEvent('run', { analysis: compiled.analysis });
    const result = Levels.evaluate(level, { analysis: compiled.analysis, stats: compiled.stats, state });

    updateLevelPanel(result.completed ? result.stars : 0, 'try');
    if (!result.completed) {
      s.hadErrors = true;
      if (!s.custom) { Store.data.attempts[level.id] = (Store.data.attempts[level.id] || 0) + 1; Store.save(); }
      const sim = result.compare ? Math.round(Levels.similarity(result.compare) * 100) : null;
      const encourage = s.hints < level.hints.length ? ' Se quiser, peça uma 💡 dica.' : '';
      levelWS.showMessage(`
        <p class="msg-title">🤏 ${esc(result.title)}</p>
        <p>${esc(result.text)}</p>
        ${sim !== null && !result.compare.ok ? `<p class="similarity"><span class="meter"><i style="width:${sim}%"></i></span> Seu desenho combina ${sim}% com o alvo.</p>` : ''}
        <p class="muted">Errar faz parte de programar. Ajuste o código e execute de novo!${encourage}</p>`, 'warn');
      return;
    }

    levelWS.showMessage(`<p class="msg-title">🎉 ${esc(result.title)} ${esc(level.success)}</p>`, 'success');
    if (!s.custom) {
      Store.recordLevel(level.id, result.stars, compiled.analysis.size);
      updateLevelPanel(result.stars, 'try');
      fireEvent('levelComplete', { level, stars: result.stars, hadErrors: s.hadErrors || (Store.data.attempts[level.id] || 0) > 0 });
      updateHUD();
    }
    showSuccess(level, result, compiled);
  }

  function showSuccess(level, result, compiled) {
    const a = compiled.analysis, st = compiled.stats;
    const idx = LEVELS.indexOf(level);
    const next = LEVELS[idx + 1];
    const tip = Levels.nextStarTip(level, result, a);
    const custom = levelSession.custom;

    const html = `
      <div class="success-head">
        <p class="success-text">${esc(level.success)}</p>
        <p class="stars-big" aria-label="${result.stars} de 3 estrelas"><span aria-hidden="true">${starsText(result.stars)}</span></p>
        <p class="sr-only">Você ganhou ${result.stars} de 3 estrelas.</p>
      </div>
      <table class="result-table">
        <tbody>
          <tr><th scope="row">Comandos utilizados</th><td>${a.commandsUsed.map((c) => `<code>${c}</code>`).join(' ')}</td></tr>
          <tr><th scope="row">Tamanho do código</th><td>${a.size} comando${a.size > 1 ? 's' : ''}</td></tr>
          <tr><th scope="row">Movimentos executados</th><td>${st.moves} (${Math.round(st.distance)} passos ao todo)</td></tr>
          <tr><th scope="row">Giros executados</th><td>${st.turns}</td></tr>
          <tr><th scope="row">Repetições</th><td>${a.repeatCount ? `${a.repeatCount} REPITA · ${st.loopIterations} voltas` : 'nenhuma'}</td></tr>
          <tr><th scope="row">Eficiência</th><td>${result.efficiency.icon} <b>${result.efficiency.label}</b> — ${esc(result.efficiency.text)}</td></tr>
        </tbody>
      </table>
      ${tip ? `<p class="star-tip">✨ ${esc(tip)}</p>` : ''}
      ${level.concept ? conceptHTML(level.concept) : ''}
      <details class="solution"><summary>Ver uma solução possível</summary>
        <pre class="snippet">${esc(level.solution)}</pre>
        <p class="muted">Existem muitas soluções certas — o que importa é o desenho!</p>
      </details>`;

    const actions = [];
    if (level.final) {
      actions.push({ label: '🎨 Ir para o Modo Livre', cls: 'btn-primary', href: '#/livre' });
      actions.push({ label: '🗺️ Mapa', href: '#/desafios' });
    } else if (custom) {
      actions.push({ label: 'Fechar', cls: 'btn-primary' });
    } else {
      if (next) actions.push({ label: `Próximo nível ▶`, cls: 'btn-primary', href: '#/desafio/' + next.id });
      if (result.stars < 3) actions.push({ label: '🔁 Tentar 3 estrelas' });
      actions.push({ label: '🗺️ Mapa', href: '#/desafios' });
    }
    const title = level.final ? '🏆 Você é Mestre da Tartaruga!' : '🎉 Muito bem!';
    setTimeout(() => {
      openModal({ title, html, actions, wide: true });
      if (level.final) $('#modal').classList.add('celebrate');
      else $('#modal').classList.remove('celebrate');
    }, 350);
  }

  /* ---------------------- Desafio personalizado ------------------------ */
  function encodeData(obj) {
    const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(obj))));
    return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  function decodeData(s) {
    s = s.replace(/-/g, '+').replace(/_/g, '/');
    while (s.length % 4) s += '=';
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  }

  function buildCustomLevel(d) {
    const r = Logo.compile(d.c);
    return {
      id: 'custom', icon: '👩‍🏫', title: d.t || 'Desafio do Professor',
      challenge: d.d || 'Reproduza o desenho-alvo.',
      solution: d.c,
      par: Math.max(1, r.analysis.size),
      repeatUseful: r.analysis.usesRepeat,
      requires: d.r ? ['REPITA'] : [],
      match: 'shape',
      hints: (d.h && d.h.length ? d.h : ['Observe o desenho-alvo: quais formas você reconhece?', 'Comece pela parte mais simples do desenho.', 'Procure padrões que se repetem — use REPITA.']).slice(0, 3),
      success: 'Desafio do professor concluído!',
      concept: null,
    };
  }

  function renderPersonalizado(params) {
    let level;
    try {
      level = buildCustomLevel(decodeData(params.join('/')));
    } catch (e) {
      toast('😕 Este link de desafio parece estar incompleto ou com erro.');
      location.hash = '#/inicio';
      return;
    }
    openLevel(level, true);
  }

  /* ===================================================================== *
   *  MODO LIVRE
   * ===================================================================== */
  let freeWS = null;
  let pendingFree = null;

  function renderLivre() {
    const view = $('#view-livre');
    if (!rendered.livre) {
      rendered.livre = true;
      view.innerHTML = `
        <div class="page-head">
          <h2>🎨 Modo Livre</h2>
          <p>Aqui não existem desafios. Escreva qualquer código, escolha cores e crie o que quiser!</p>
        </div>
        <div class="free-ws"></div>
        <section class="card my-drawings" aria-labelledby="my-drawings-title">
          <h3 id="my-drawings-title">🖼️ Meus desenhos</h3>
          <p class="muted">Use <b>💾 Salvar</b> para guardar o desenho e o código neste navegador.</p>
          <div class="drawings-grid"></div>
        </section>`;
      freeWS = new Workspace($('.free-ws', view), {
        storageKey: 'livre',
        initialCode: '; Modo Livre: escreva o que quiser!\nREPITA 36 [\n  REPITA 4 [PF 100 PD 90]\n  PD 10\n]',
        redo: true,
        freeTools: true,
        onFinish: (compiled) => fireEvent('run', { analysis: compiled.analysis }),
        onSave: saveDrawing,
      });
      App.workspaces.push(freeWS);
      $('.drawings-grid', view).addEventListener('click', onDrawingClick);
    }
    renderDrawings();
    if (pendingFree !== null) {
      const code = pendingFree;
      pendingFree = null;
      freeWS.setCode(code);
      requestAnimationFrame(() => { freeWS.stage.resize(); freeWS.run(); });
    }
  }

  function openInFree(code) {
    pendingFree = code;
    if (location.hash === '#/livre') route(true);
    else location.hash = '#/livre';
  }

  function saveDrawing(ws) {
    if (!ws.stage.state.segments.length) {
      ws.showMessage('🎨 Desenhe algo antes de salvar: execute seu programa primeiro.', 'info');
      return;
    }
    const n = Store.data.drawings.length + 1;
    const dlg = openModal({
      title: '💾 Salvar desenho',
      html: `<label class="field">Nome do desenho <input type="text" id="drawing-name" maxlength="40" value="Meu desenho ${n}"></label>
             <p class="muted">O desenho e o código ficam salvos neste navegador.</p>`,
      actions: [
        { label: '💾 Salvar', cls: 'btn-primary', onClick: () => doSave($('#drawing-name').value) },
        { label: 'Cancelar' },
      ],
    });
    const input = $('#drawing-name', dlg);
    input.focus();
    input.select();
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); doSave(input.value); closeModal(); } });

    function doSave(name) {
      const thumb = document.createElement('canvas');
      Turtle.renderFit(thumb, ws.stage.state.segments, { width: 240, height: 180, padding: 12, bg: '#ffffff', ink: '#16302a' });
      const ok = Store.addDrawing({
        id: Date.now().toString(36), name: (name || 'Meu desenho').trim().slice(0, 40),
        code: ws.code, thumb: thumb.toDataURL('image/png'), date: new Date().toISOString(),
      });
      Store.setCode('livre', ws.code);
      renderDrawings();
      toast(ok ? '💾 Desenho salvo em “Meus desenhos”.' : '⚠️ Não foi possível salvar (armazenamento cheio ou bloqueado).');
      if (ok) fireEvent('art');
    }
  }

  function renderDrawings() {
    const grid = $('#view-livre .drawings-grid');
    if (!grid) return;
    const list = Store.data.drawings;
    grid.innerHTML = list.length ? list.map((d) => `
      <figure class="drawing-card">
        <img src="${d.thumb}" alt="Miniatura do desenho ${esc(d.name)}" width="240" height="180">
        <figcaption>
          <b>${esc(d.name)}</b>
          <small>${new Date(d.date).toLocaleDateString('pt-BR')}</small>
          <span class="drawing-actions">
            <button type="button" class="btn btn-sm" data-open="${d.id}">📂 Abrir</button>
            <button type="button" class="btn btn-sm btn-ghost" data-del="${d.id}" aria-label="Excluir ${esc(d.name)}">🗑</button>
          </span>
        </figcaption>
      </figure>`).join('') : '<p class="empty">Nenhum desenho salvo ainda.</p>';
  }

  function onDrawingClick(e) {
    const open = e.target.closest('[data-open]');
    const del = e.target.closest('[data-del]');
    if (open) {
      const d = Store.data.drawings.find((x) => x.id === open.dataset.open);
      if (d) { freeWS.setCode(d.code); freeWS.run(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
    }
    if (del) {
      const d = Store.data.drawings.find((x) => x.id === del.dataset.del);
      if (d && window.confirm(`Excluir o desenho “${d.name}”?`)) { Store.removeDrawing(d.id); renderDrawings(); }
    }
  }

  /* ===================================================================== *
   *  GALERIA
   * ===================================================================== */
  let galleryWS = null;

  function renderGaleria() {
    const view = $('#view-galeria');
    if (!rendered.galeria) {
      rendered.galeria = true;
      view.innerHTML = `
        <div class="page-head">
          <h2>🖼️ O que posso criar?</h2>
          <p>Clique num exemplo para ver o desenho, ler o código, executar e editar.</p>
        </div>
        <div class="gallery-grid">
          ${EXAMPLES.map((ex) => `
            <button type="button" class="gallery-card" data-example="${ex.id}">
              <canvas class="thumb" role="img" aria-label="Desenho: ${esc(ex.title)}"></canvas>
              <span class="g-title">${ex.icon} ${esc(ex.title)}</span>
              <span class="g-text">${esc(ex.text)}</span>
            </button>`).join('')}
        </div>
        <section class="gallery-detail" hidden aria-labelledby="gallery-detail-title">
          <div class="detail-head">
            <h3 id="gallery-detail-title"></h3>
            <p class="detail-text muted"></p>
            <div class="detail-actions">
              <button type="button" class="btn btn-sm" data-free>🎨 Abrir no Modo Livre</button>
              <button type="button" class="btn btn-sm btn-ghost" data-restore>↺ Código original</button>
            </div>
          </div>
          <div class="gallery-ws"></div>
        </section>`;
      galleryWS = new Workspace($('.gallery-ws', view), {
        onFinish: (compiled) => fireEvent('run', { analysis: compiled.analysis }),
        saveLabel: 'Para guardar seus desenhos, use o Modo Livre.',
        onSave: (ws) => openInFree(ws.code),
      });
      App.workspaces.push(galleryWS);
      $('.gallery-grid', view).addEventListener('click', (e) => {
        const card = e.target.closest('[data-example]');
        if (card) openExample(card.dataset.example);
      });
      $('[data-free]', view).addEventListener('click', () => openInFree(galleryWS.code));
      $('[data-restore]', view).addEventListener('click', () => {
        const ex = EXAMPLES.find((x) => x.id === view.dataset.example);
        if (ex) { galleryWS.setCode(ex.code); galleryWS.run(); }
      });
    }
    requestAnimationFrame(renderGalleryThumbs);
  }

  function renderGalleryThumbs() {
    $$('#view-galeria .gallery-card').forEach((card) => {
      const ex = EXAMPLES.find((x) => x.id === card.dataset.example);
      const st = Turtle.simulate(Logo.compile(ex.code).actions, Turtle.createState());
      Turtle.renderFit($('canvas', card), st.segments, { padding: 14 });
    });
  }

  function openExample(id) {
    const view = $('#view-galeria');
    const ex = EXAMPLES.find((x) => x.id === id);
    view.dataset.example = id;
    const detail = $('.gallery-detail', view);
    detail.hidden = false;
    $('#gallery-detail-title').textContent = `${ex.icon} ${ex.title}`;
    $('.detail-text', view).textContent = ex.text;
    galleryWS.setCode(ex.code);
    galleryWS.resetWorld();
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => { galleryWS.stage.resize(); galleryWS.zoomFitCode(); galleryWS.run(); }, 300);
    if (!Store.data.galleryRuns.includes(id)) { Store.data.galleryRuns.push(id); Store.save(); }
    fireEvent('gallery');
  }

  /* ===================================================================== *
   *  COMANDOS — biblioteca
   * ===================================================================== */
  function renderComandos() {
    const view = $('#view-comandos');
    if (rendered.comandos) return;
    rendered.comandos = true;
    const groups = {};
    Object.values(Logo.commands).forEach((c) => { (groups[c.doc.group] = groups[c.doc.group] || []).push(c); });
    const future = {};
    Object.entries(Logo.FUTURE_WORDS).forEach(([w, why]) => { (future[why] = future[why] || []).push(w); });

    view.innerHTML = `
      <div class="page-head">
        <h2>📚 Biblioteca de Comandos</h2>
        <p>Tudo o que a tartaruga entende. Clique em <b>Experimentar</b> para testar no Modo Livre.</p>
      </div>
      ${Object.entries(groups).map(([g, list]) => `
        <h3 class="section-title">${esc(g)}</h3>
        <div class="cmd-grid">
          ${list.map((c) => `
            <article class="cmd-card card" style="--c:${c.doc.color}">
              <div class="cmd-visual" aria-hidden="true">${c.doc.icon}</div>
              <h4><code class="${c.doc.dark ? 'dark' : ''}">${c.name}</code> <span>${esc(c.doc.title)}</span></h4>
              <p>${esc(c.doc.text)}</p>
              ${c.aliases && c.aliases.length ? `<p class="muted small">Também aceito: ${c.aliases.map((a) => `<code>${a}</code>`).join(', ')}</p>` : ''}
              <p class="small">Exemplo:</p>
              <pre class="snippet">${esc(c.doc.example)}</pre>
              <button type="button" class="btn btn-sm" data-try="${esc(c.doc.example)}">▶ Experimentar</button>
            </article>`).join('')}
        </div>`).join('')}
      <div class="card rules">
        <h3>📏 Regras da linguagem</h3>
        <ul>
          <li>Maiúsculas ou minúsculas tanto faz: <code>PF 100</code> = <code>pf 100</code>.</li>
          <li>Separe os comandos com espaços ou quebras de linha: <code>PF 100 PD 90</code>.</li>
          <li>Ângulos são em graus. <code>PD</code> gira no sentido do relógio; <code>PE</code>, ao contrário.</li>
          <li>Números podem ter vírgula ou ponto: <code>PF 2,5</code> e <code>PF 2.5</code>.</li>
          <li>Comentários começam com <code>;</code> — a tartaruga ignora o resto da linha.</li>
          <li>REPITA pode ter outro REPITA dentro: <code>REPITA 6 [REPITA 3 [PF 80 PD 120] PD 60]</code>.</li>
        </ul>
      </div>
      <div class="card future">
        <h3>🚧 Em breve</h3>
        <p class="muted">A linguagem foi preparada para crescer. Estes recursos virão em próximas versões:</p>
        <ul>
          ${Object.entries(future).map(([why, words]) => `<li><code>${words.join('</code>, <code>')}</code> — ${esc(why)}</li>`).join('')}
        </ul>
      </div>`;
    view.addEventListener('click', (e) => {
      const b = e.target.closest('[data-try]');
      if (b) openInFree(b.dataset.try);
    });
  }

  /* ===================================================================== *
   *  CONQUISTAS
   * ===================================================================== */
  function renderConquistas() {
    const p = progress();
    const lessons = Object.keys(Store.data.lessons).length;
    $('#view-conquistas').innerHTML = `
      <div class="page-head">
        <h2>🏅 Conquistas</h2>
        <p>Cada conquista marca algo que você aprendeu a fazer.</p>
        <p>Jogador: <b>${esc(Store.data.nome || '—')}</b> · Código: <b class="mono">${myCode()}</b></p>
      </div>
      <div class="stat-row">
        <div class="stat card"><span class="stat-num">${lessons}/${TUTORIAL.length}</span><span>aulas concluídas</span></div>
        <div class="stat card"><span class="stat-num">${p.done}/${p.total}</span><span>níveis concluídos</span></div>
        <div class="stat card"><span class="stat-num">${p.stars}/${p.total * 3}</span><span>estrelas</span></div>
        <div class="stat card"><span class="stat-num">${p.badges}/${Achievements.ACHIEVEMENTS.length}</span><span>conquistas</span></div>
      </div>
      <ul class="badge-grid">
        ${Achievements.ACHIEVEMENTS.map((a) => {
          const got = Store.data.achievements[a.id];
          return `<li class="badge-card card ${got ? 'got' : 'locked'}">
            <span class="badge-icon" aria-hidden="true">${a.icon}</span>
            <b>${esc(a.title)}</b>
            <span class="muted">${esc(a.how)}</span>
            <span class="badge-state">${got ? `✅ Conquistada em ${new Date(got).toLocaleDateString('pt-BR')}` : '🔒 Ainda não conquistada'}</span>
          </li>`;
        }).join('')}
      </ul>`;
  }

  /* ===================================================================== *
   *  MODO PROFESSOR
   * ===================================================================== */
  const CLASS_SUGGESTIONS = [
    'Peça aos alunos para criarem um quadrado sem utilizar REPITA. Depois, peça para refazer utilizando REPITA. Compare o tamanho dos códigos.',
    'Crie uma estrela e tente descobrir qual ângulo produz o melhor resultado. Registre as tentativas numa tabela (ângulo × desenho).',
    '“Tartaruga humana”: um aluno lê comandos e outro executa andando pela sala. Depois, comparem com a tela.',
    'Erro proposital: mostre um código com um bug (ex.: REPITA 4 [PF 100 PD 80]) e peça para a turma encontrar e explicar o erro.',
    'Polígonos: preencham juntos uma tabela com nº de lados, giro (360 ÷ n) e código de cada polígono regular.',
    'Programação em dupla: um escreve, o outro revisa. A cada nível, invertam os papéis.',
    'Antes de executar, peça para os alunos desenharem no papel o que acham que vai acontecer (prever → testar → comparar).',
  ];

  const TEACHER_CHALLENGES = [
    { text: 'Crie um quadrado sem usar REPITA.', code: '; quadrado sem REPITA\n' },
    { text: 'Crie o mesmo quadrado usando REPITA.', code: '; quadrado com REPITA\n' },
    { text: 'Crie uma estrela usando apenas REPITA.', code: '; estrela\n' },
    { text: 'Crie uma casa.', code: '; casa: paredes + telhado\n' },
    { text: 'Crie seu próprio logotipo.', code: '; meu logotipo\n' },
    { text: 'Escreva seu primeiro nome utilizando desenhos (use LEVANTE e BAIXE entre as letras).', code: '; meu nome\n' },
    { text: 'Crie uma flor.', code: '; flor\n' },
    { text: 'Crie uma figura utilizando pelo menos três REPITA.', code: '; três REPITA\n' },
  ];

  function renderProfessor() {
    const view = $('#view-professor');
    const rows = LEVELS.map((l) => `
      <tr>
        <th scope="row">${l.icon} ${l.id}. ${esc(l.title)}</th>
        <td>${esc(l.challenge)}</td>
        <td>${esc(l.goal)}</td>
        <td>${l.commands.map((c) => `<code>${c}</code>`).join(' ')}</td>
        <td>${l.concepts.map(esc).join(', ')}</td>
        <td>${esc(l.teacherTip)}</td>
        <td><details><summary>ver</summary><pre class="snippet small">${esc(l.solution)}</pre></details></td>
      </tr>`).join('');

    view.innerHTML = `
      <div class="page-head">
        <h2>👨‍🏫 Modo Professor</h2>
        <p>Visão pedagógica da jornada, sugestões para a sala de aula e ferramentas para criar desafios.</p>
        <button type="button" class="btn btn-sm no-print" data-print>🖨️ Imprimir esta página</button>
      </div>

      <section class="card">
        <h3>🎯 Objetivo e progressão</h3>
        <p>O aluno aprende lógica de programação construindo desenhos: <b>escreve → executa → observa → identifica o erro → corrige</b>.
        A progressão vai de comandos simples (sequência) a ângulos, repetição (loop), laços aninhados, decomposição e engenharia reversa.</p>
        <p class="flow">APRENDER → EXPERIMENTAR → RESOLVER DESAFIOS → CONQUISTAR NÍVEIS → CRIAR → PROGRAMAR LIVREMENTE</p>
        <p class="muted">A verificação dos desafios compara o <b>desenho</b>, não o código: soluções diferentes são aceitas. Desenhos espelhados (PE em vez de PD), girados em 90° ou deslocados também valem.</p>
      </section>

      <section class="card">
        <h3>🗺️ Visão geral dos níveis</h3>
        <div class="table-scroll">
          <table class="teacher-table">
            <thead><tr><th>Nível</th><th>Desafio</th><th>Objetivo pedagógico</th><th>Comandos</th><th>Conceitos</th><th>Sugestão</th><th>Solução</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>

      <div class="two-col">
        <section class="card">
          <h3>💬 Sugestões para sala de aula</h3>
          <ul class="suggestions">${CLASS_SUGGESTIONS.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
        </section>
        <section class="card">
          <h3>🧩 Desafios do Professor</h3>
          <ol class="teacher-challenges">${TEACHER_CHALLENGES.map((c, i) => `<li><span>${esc(c.text)}</span> <button type="button" class="btn btn-sm btn-ghost no-print" data-tc="${i}">Abrir no Modo Livre</button></li>`).join('')}</ol>
        </section>
      </div>

      <section class="card no-print" aria-labelledby="custom-title">
        <h3 id="custom-title">✨ Criar desafio personalizado</h3>
        <p class="muted">Escreva o código da solução: o desenho-alvo é gerado automaticamente. Você recebe um link para enviar aos alunos (nada é enviado para servidores — o desafio vai dentro do próprio link).</p>
        <form class="custom-form" onsubmit="return false">
          <label class="field">Título <input type="text" name="t" maxlength="60" value="Hexágono"></label>
          <label class="field">Enunciado <input type="text" name="d" maxlength="200" value="Desenhe um hexágono com lados de 80 passos."></label>
          <label class="field">Código da solução <textarea name="c" rows="3" spellcheck="false">REPITA 6 [PF 80 PD 60]</textarea></label>
          <label class="field">Dicas (uma por linha, até 3 — opcional) <textarea name="h" rows="3">Um hexágono tem 6 lados.\nA volta completa tem 360°.\nDivida 360 por 6.</textarea></label>
          <label class="check"><input type="checkbox" name="r"> Exigir o uso de REPITA</label>
          <div class="custom-actions">
            <button type="button" class="btn btn-primary" data-make>🔗 Gerar link do desafio</button>
          </div>
          <div class="custom-result" aria-live="polite"></div>
        </form>
      </section>

      <section class="card">
        <h3>❄️ ${esc(Fractals.title)} <span class="tag">em breve</span></h3>
        <div class="fractal-box">
          <canvas class="fractal-preview" width="300" height="240" role="img" aria-label="Floco de neve de Koch"></canvas>
          <div>
            <p>${esc(Fractals.description)}</p>
            <p class="muted">Quando a linguagem ganhar procedimentos, variáveis e condicionais, o aluno poderá escrever algo assim:</p>
            <pre class="snippet">${esc(Fractals.FUTURE_CODE)}</pre>
            <p class="muted small">A arquitetura já está preparada: veja <code>js/fractals.js</code> e o README.</p>
          </div>
        </div>
      </section>

      <section class="card no-print">
        <h3>🛠️ Ferramentas</h3>
        <label class="check"><input type="checkbox" data-unlock ${Store.data.unlockAll ? 'checked' : ''}> Desbloquear todos os níveis neste computador (para demonstração em aula)</label>
        <p><button type="button" class="btn btn-danger btn-sm" data-reset>🗑 Resetar progresso</button></p>
      </section>`;

    const fc = $('.fractal-preview', view);
    Turtle.renderFit(fc, Turtle.simulate(Fractals.snowflakeActions(240, 3), Turtle.createState()).segments, { padding: 12, lineWidth: 1.5 });

    $('[data-print]', view).addEventListener('click', () => window.print());
    $('[data-reset]', view).addEventListener('click', resetProgress);
    $('[data-unlock]', view).addEventListener('change', (e) => {
      Store.data.unlockAll = e.target.checked;
      Store.save();
      toast(e.target.checked ? '🔓 Todos os níveis foram desbloqueados.' : '🔒 Os níveis voltaram a seguir a ordem.');
      updateHUD();
    });
    $$('[data-tc]', view).forEach((b) => b.addEventListener('click', () => openInFree(TEACHER_CHALLENGES[+b.dataset.tc].code)));
    $('[data-make]', view).addEventListener('click', makeCustomChallenge);
  }

  function makeCustomChallenge() {
    const form = $('.custom-form');
    const out = $('.custom-result', form);
    const data = {
      t: form.t.value.trim(),
      d: form.d.value.trim(),
      c: form.c.value,
      h: form.h.value.split('\n').map((s) => s.trim()).filter(Boolean).slice(0, 3),
      r: form.r.checked ? 1 : 0,
    };
    try {
      const lvl = buildCustomLevel(data);
      const segs = Levels.targetOf(lvl);
      if (!segs.length) throw new Logo.LogoError({ title: 'O código não desenha nada.', message: 'Confira se a caneta está abaixada.' });
    } catch (e) {
      out.innerHTML = `<p class="error-text">⚠️ ${esc(e.title || 'Erro')} ${esc(e.message || '')}</p>`;
      return;
    }
    const base = location.href.split('#')[0];
    const link = `${base}#/personalizado/${encodeData(data)}`;
    out.innerHTML = `
      <label class="field">Link do desafio <input type="text" readonly value="${esc(link)}" class="link-out"></label>
      <p class="custom-actions">
        <button type="button" class="btn btn-sm" data-copy>📋 Copiar link</button>
        <a class="btn btn-sm" href="${esc(link)}">👀 Testar o desafio</a>
      </p>`;
    const input = $('.link-out', out);
    $('[data-copy]', out).addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(link); toast('📋 Link copiado!'); }
      catch (e) { input.select(); document.execCommand && document.execCommand('copy'); toast('📋 Link selecionado — use Ctrl+C para copiar.'); }
    });
  }

  /* ===================================================================== *
   *  Início do app
   * ===================================================================== */
  applyTheme();
  updatePlayer();
  updateHUD();
  route(true);
  if (!Store.data.nome) setTimeout(askName, 400);
})();
