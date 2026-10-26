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

  const { Logo, Turtle, Levels, Store, Achievements, Workspace, TUTORIAL, EXAMPLES, Fractals, Progresso, Cultivo } = window;
  const LEVELS = Levels.LEVELS;              // por id (progresso e código TAR2)
  const JORNADA = Cultivo.orderedLevels();   // na ordem dos reinos (o que o aluno vê)
  const esc = Workspace.esc;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  Store.load();
  // Estrelas antigas (escala de 3) dos desafios do Reino 3 em diante → escala de 5.
  Cultivo.migrarEstrelas(Store.data);
  // Progresso antigo (15 níveis): marca em silêncio os reinos já rompidos.
  Cultivo.registrarRompimentos(Store.data);
  Store.save();

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

  function starsHTML(n, total) {
    total = total || 3;
    return `<span class="stars" aria-label="${n} de ${total} estrelas"><span aria-hidden="true">${starsText(n, total)}</span></span>`;
  }

  /** Janela modal genérica (usa <dialog>). */
  function openModal({ title, html, actions, wide, onClose }) {
    const dlg = $('#modal');
    $('#modal-title').innerHTML = title;
    $('#modal-body').innerHTML = html;
    dlg.classList.toggle('wide', !!wide);
    dlg.classList.remove('celebrate', 'breakthrough-modal');
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
    runOnClose(); // não depende do evento "close" (que pode atrasar)
  }

  /** Executa (uma única vez) o que foi pedido para depois de fechar a janela. */
  function runOnClose() {
    const dlg = $('#modal');
    if (dlg._onClose) { const f = dlg._onClose; dlg._onClose = null; f(); }
  }

  $('#modal').addEventListener('close', runOnClose); // Esc ou fechamento pelo navegador
  $('#modal-close').addEventListener('click', closeModal);

  /* ===================================================================== *
   *  Progresso, HUD e conquistas
   * ===================================================================== */
  function progress() {
    const done = JORNADA.filter((l) => Store.level(l.id).completed).length;
    const stars = JORNADA.reduce((s, l) => s + (Store.level(l.id).stars || 0), 0);
    const maxStars = JORNADA.reduce((s, l) => s + Levels.maxStarsOf(l), 0);
    const next = Cultivo.proximo(Store.data) || JORNADA[JORNADA.length - 1];
    return { done, stars, maxStars, next, total: JORNADA.length, badges: Object.keys(Store.data.achievements).length };
  }

  /** Rótulo curto de um desafio: "Desafio 9". */
  function nomeDesafio(level) {
    return `Desafio ${Cultivo.numero(level.id)}`;
  }

  /** Cabeçalho: reino de cultivo, estágio, título marcial, barra de Qi e estrelas do desafio em foco. */
  function updateHUD() {
    const p = progress();
    const sit = Cultivo.situacao(Store.data);
    const card = $('#hud-realm-card');
    card.style.setProperty('--aura', sit.reino.corAura);
    $('#hud-insignia').textContent = sit.reino.icone;
    $('#hud-realm').textContent = `Reino ${sit.reino.id}: ${sit.reino.nome}`;
    $('#hud-stage').textContent = sit.completo ? `Grande Perfeição · ${sit.titulo}` : `${sit.estagio.nome} · ${sit.titulo}`;
    $('#hud-qi').style.width = Math.max(sit.qi, 3) + '%';
    $('#hud-qi-pct').textContent = sit.qi + '%';
    $('#hud-qibar').setAttribute('aria-valuenow', String(sit.qi));
    card.setAttribute('aria-label', `Reino ${sit.reino.id}: ${sit.reino.nome}, ${sit.estagio.nome}. Título: ${sit.titulo}. Energia espiritual (Qi) ${sit.qi}% até o rompimento.`);
    const lvl = (currentView === 'desafio' && activeLevel && activeLevel.id !== 'custom') ? activeLevel : p.next;
    const st = Store.level(lvl.id).stars || 0;
    const maxS = Levels.maxStarsOf(lvl);
    const box = $('#hud-stars');
    box.classList.toggle('five', maxS === 5);
    box.innerHTML = Array.from({ length: maxS }, (_, k) => k + 1).map((i) => `<span class="${i <= st ? 'on' : ''}" aria-hidden="true">${i <= st ? '★' : '☆'}</span>`).join('');
    box.setAttribute('aria-label', `${nomeDesafio(lvl)}: ${st} de ${maxS} estrelas. Total: ${p.stars} de ${p.maxStars}.`);
    box.title = `Estrelas do ${nomeDesafio(lvl).toLowerCase()} · total ${p.stars}/${p.maxStars}`;
    const nb = $('#nav-badges');
    if (nb) nb.textContent = p.badges ? ` ${p.badges}` : '';
  }

  /* ===================================================================== *
   *  Acesso do professor (senha)
   * ---------------------------------------------------------------------
   *  Site estático: a senha é conferida no próprio navegador, comparando o
   *  SHA-256 do que foi digitado com o resumo abaixo (a senha em si não
   *  fica no código). Barra o aluno comum; quem souber programar contorna.
   *  Para trocar a senha, gere um novo resumo (ver README) e cole aqui.
   *  O acesso vale só até fechar a aba (sessionStorage).
   * ===================================================================== */
  const ADMIN_SALT = 'jornada-tartaruga:professor:';
  const ADMIN_HASH = '50b7e692e2dc18e4956d0ff38a18f5d2bb5e99dc19877952f0050d0800be1ed2';
  const ADMIN_KEY = 'jornada-tartaruga:admin';

  function isAdmin() {
    try { return sessionStorage.getItem(ADMIN_KEY) === '1'; } catch (e) { return !!App.adminFallback; }
  }

  function setAdmin(on) {
    try { if (on) sessionStorage.setItem(ADMIN_KEY, '1'); else sessionStorage.removeItem(ADMIN_KEY); }
    catch (e) { App.adminFallback = on; }
    document.body.classList.toggle('is-admin', on);
    updateHUD();
  }

  async function sha256(text) {
    const data = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  async function checkAdminPassword(pw) {
    if (!window.crypto || !crypto.subtle) throw new Error('sem-crypto');
    return (await sha256(ADMIN_SALT + String(pw).trim())) === ADMIN_HASH;
  }

  /** Desafio liberado para jogar? (o professor vê todos, sem mexer no progresso do aluno) */
  function canPlay(levelId) {
    return isAdmin() || Cultivo.levelUnlocked(Store.data, levelId);
  }

  function fireEvent(name, details) {
    if (isAdmin()) return; // no modo professor nada conta como conquista do aluno
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
      `<tr><th scope="row"><code>${c.name}${c.args.length ? ' n' : ''}${c.block ? ' [ ]' : ''}</code></th><td>${esc(c.doc.text)}</td><td><code>${esc(c.doc.example.split('\n')[0])}</code></td></tr>`).join('') +
      Logo.KEYWORD_DOCS.map((d) =>
        `<tr><th scope="row"><code>${esc(d.name)}</code><br><small class="muted">Reino 5+</small></th><td>${esc(d.text)}</td><td><code>${esc(d.short.split('\n')[0])}</code></td></tr>`).join('');
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
    Cultivo.registrarRompimentos(Store.data); // rompimentos trazidos pelo código (sem celebração)
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
            <p class="lead small-lead">☯️ <b>O Dao dos Algoritmos:</b> atravesse 6 reinos de cultivo — do Primeiro Traço ao Iluminado do Dao — rompendo o gargalo de cada um.</p>
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
          <li><a href="#/aprender" class="journey-step"><span class="j-icon">📘</span><b>Aprender</b><small>${TUTORIAL.length} aulas curtas sobre os comandos</small></a></li>
          <li><a href="#/comandos" class="journey-step"><span class="j-icon">🧪</span><b>Experimentar</b><small>Biblioteca de comandos com exemplos</small></a></li>
          <li><a href="#/desafios" class="journey-step"><span class="j-icon">🧩</span><b>Resolver desafios</b><small>${JORNADA.length} desafios em 6 reinos de cultivo</small></a></li>
          <li><a href="#/conquistas" class="journey-step"><span class="j-icon">☯️</span><b>Romper reinos</b><small>O Dao dos Algoritmos: estrelas, Qi e rompimentos</small></a></li>
          <li><a href="#/galeria" class="journey-step"><span class="j-icon">🎨</span><b>Criar</b><small>Galeria: o que posso criar?</small></a></li>
          <li><a href="#/livre" class="journey-step"><span class="j-icon">🚀</span><b>Programar livremente</b><small>Modo Livre, sem regras</small></a></li>
        </ol>`;
      heroStage = new Turtle.Stage($('.hero-canvas', view), { grid: false, viewHalf: 135, showArc: false });
    }
    const cont = $('#hero-continue');
    if (p.done > 0) {
      cont.href = '#/desafio/' + p.next.id;
      cont.textContent = `▶ Continuar: ${nomeDesafio(p.next).toLowerCase()}`;
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
      lessonWS.setAdvanced(!!lesson.avancada);
      lessonWS.setCode(Store.code('aula-' + lesson.id, lesson.code));
      lessonWS.resetWorld();
    }
  }

  function completeLesson(lesson) {
    if (!lesson || Store.data.lessons[lesson.id] || isAdmin()) return;
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
  /** Cartão de um desafio dentro do mapa dos reinos. */
  function levelCard(id, open, nextId) {
    const l = Levels.byId(id);
    const res = Store.level(id);
    const state = res.completed ? 'done' : open ? 'open' : 'locked';
    const n = Cultivo.numero(id);
    const maxS = Levels.maxStarsOf(l);
    const minS = Cultivo.minEstrelas(id);
    const abaixo = state === 'done' && minS && res.stars < minS;
    const label = `Desafio ${n}: ${l.title}. ` + (state === 'done' ? `Concluído com ${res.stars} de ${maxS} estrelas.${abaixo ? ` Precisa de ${minS} para romper o reino.` : ''}` : state === 'open' ? 'Disponível.' : 'Selado.');
    const inner = `
      <span class="lvl-num" aria-hidden="true">${n}</span>
      <span class="lvl-icon" aria-hidden="true">${state === 'locked' ? '🔒' : l.icon}</span>
      <span class="lvl-text" aria-hidden="true">
        <b>${esc(l.title)}</b>
        <small>${esc(l.shape || '')}</small>
        <span class="lvl-state">${state === 'done' ? `<span class="stars">${starsText(res.stars, maxS)}</span>${abaixo ? ` <span class="below-tag">precisa de ${minS}★</span>` : ''}` : state === 'open' ? '▶ Cultivar' : '🔒 Selado'}</span>
      </span>`;
    const cls = `lvl-card ${state}${id === nextId && (state === 'open' || abaixo) ? ' current' : ''}${l.limit ? ' limited' : ''}${abaixo ? ' below-min' : ''}`;
    return state === 'locked'
      ? `<div class="${cls}" role="img" aria-label="${esc(label)}">${inner}</div>`
      : `<a class="${cls}" href="#/desafio/${id}" aria-label="${esc(label)}">${inner}</a>`;
  }

  function renderMapa() {
    const p = progress();
    const sit = Cultivo.situacao(Store.data);
    const reinos = Cultivo.REINOS.map((r) => {
      const ks = r.subEstagios.map((st) => Cultivo.STAGES.findIndex((x) => x.estagio === st));
      const rompido = Cultivo.reinoRompido(Store.data, r.id);
      const aberto = ks.some((k) => isAdmin() || Cultivo.stageUnlocked(Store.data, k));
      const ids = r.subEstagios.flatMap((st) => st.desafiosIds);
      const feitos = ids.filter((id) => Store.level(id).completed).length;
      // Qi = desafios concluídos COM as estrelas mínimas (igual ao cabeçalho)
      const qi = Math.round((ids.filter((id) => Cultivo.cumprido(Store.data, id)).length / ids.length) * 100);
      const estado = rompido ? 'rompido' : aberto ? 'aberto' : 'selado';
      const picoVencido = r.subEstagios[2].desafiosIds.every((id) => Store.level(id).completed);
      const faltam = Cultivo.faltamEstrelas(Store.data, r.id);
      return `
        <section class="realm realm-${estado}${sit.reino.id === r.id ? ' realm-current' : ''}" style="--aura:${r.corAura}" aria-labelledby="realm-${r.id}">
          <header class="realm-head">
            <span class="realm-seal" aria-hidden="true">${estado === 'selado' ? '🔒' : r.icone}</span>
            <div class="realm-title">
              <p class="realm-kicker">Reino ${r.id} · ${esc(r.subtitulo)}</p>
              <h3 id="realm-${r.id}">${esc(r.nome)}</h3>
              <p class="realm-desc">${esc(r.descricao)}</p>
              <p class="realm-focus"><b>Foco:</b> ${esc(r.foco)}</p>
              ${r.estrelasMinimas ? `<p class="realm-min">⛰️ Para romper: pelo menos <b>${r.estrelasMinimas} de 5 ★</b> em cada desafio do reino.</p>` : ''}
            </div>
            <div class="realm-status">
              <span class="realm-badge">${rompido ? '✨ Rompido' : picoVencido && (faltam.length || ids.some((id) => !Store.level(id).completed)) ? '⚠️ Faltam estrelas' : aberto ? '🔥 Em cultivo' : '🔒 Selado'}</span>
              <span class="qi-line"><span class="qi-label">Qi</span>
                <span class="qi-bar" role="progressbar" aria-label="Energia espiritual do Reino ${r.id}" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${qi}"><i style="width:${Math.max(qi, 2)}%"></i></span>
                <b>${qi}%</b></span>
              <small>${feitos}/${ids.length} desafios${rompido ? ' · título: ' + esc(r.titulo) : ''}${faltam.length ? ` · ${faltam.length} abaixo do mínimo` : ''}</small>
            </div>
          </header>
          <div class="realm-stages">
            ${r.subEstagios.map((st, j) => {
              const open = isAdmin() || Cultivo.stageUnlocked(Store.data, ks[j]);
              return `
                <div class="stage stage-${st.tipo.toLowerCase()}${open ? '' : ' locked'}">
                  <p class="stage-name"><span aria-hidden="true">${st.tipo === 'PICO' ? '⛰️' : j === 0 ? '🌱' : '🌿'}</span> ${esc(Cultivo.ESTAGIOS[st.tipo].curto)}${open ? '' : ' <small>· selado</small>'}</p>
                  <div class="stage-levels">${st.desafiosIds.map((id) => levelCard(id, open, p.next.id)).join('')}</div>
                </div>`;
            }).join('')}
          </div>
        </section>`;
    }).join('');

    $('#view-desafios').innerHTML = `
      <div class="page-head">
        <h2>☯️ O Dao dos Algoritmos — Os 6 Reinos</h2>
        <p>Cada desafio mostra um desenho-alvo: escreva o programa que faz a tartaruga desenhá-lo. Conclua os dois desafios de um estágio para abrir o próximo. Vencer os dois desafios do <b>Pico (Gargalo)</b> rompe o reino e abre o seguinte.</p>
      </div>
      <div class="map-layout">
        <div class="realms">${reinos}</div>
        <aside class="map-side">
          <div class="card cultivator" style="--aura:${sit.reino.corAura}">
            <h3>Seu cultivo</h3>
            <p class="cult-realm"><span aria-hidden="true">${sit.reino.icone}</span> Reino ${sit.reino.id}: ${esc(sit.reino.nome)}</p>
            <p class="cult-stage">${esc(sit.completo ? 'Grande Perfeição' : sit.estagio.nome)} · <b>${esc(sit.titulo)}</b></p>
            <p class="big-number">${p.done}<small>/${p.total} desafios</small></p>
            <p><span class="stars big">★</span> ${p.stars} de ${p.maxStars} estrelas</p>
            <a class="btn btn-primary btn-block" href="#/desafio/${p.next.id}">▶ Cultivar: ${esc(nomeDesafio(p.next).toLowerCase())}</a>
            <div class="identity">
              <span>Jogador: <b>${esc(Store.data.nome || '—')}</b></span>
              <span>Código: <b class="mono">${myCode()}</b></span>
            </div>
            <button type="button" class="btn btn-sm btn-block" data-open-code>🔑 Salvar / importar progresso</button>
          </div>
          <div class="card legend">
            <h3>Como ganhar estrelas</h3>
            <ul>
              <li><b>Reinos 1 e 2 (3 ★):</b> <span class="stars">★</span> desenho correto · <span class="stars">★★</span> com a técnica · <span class="stars">★★★</span> código eficiente</li>
              <li><b>Reino 3 em diante (5 ★):</b> desenho certo vale passar; você começa com <span class="stars">★★★★★</span> e perde 1 ★ por: não usar a técnica pedida, passar da meta de comandos (2 se passar do dobro), passar do limite, repetir linhas por cima do tracejado ou usar todas as dicas.</li>
            </ul>
            <p class="muted">⛰️ Para romper os Reinos 3 a 5: pelo menos 3 ★ em cada desafio. Reino 6: pelo menos 4 ★.</p>
          </div>
          <div class="card legend">
            <h3>⛰️ O Gargalo</h3>
            <p class="muted">Cada reino tem 3 estágios: 🌱 Inicial, 🌿 Intermediário e ⛰️ Pico. O Pico só abre depois do Intermediário — e vencê-lo provoca o <b>Rompimento de Reino</b>.</p>
          </div>
        </aside>
      </div>`;
    $('#view-desafios [data-open-code]').addEventListener('click', openCodeModal);
  }

  /* ===================================================================== *
   *  DESAFIO — tela de um nível
   * ===================================================================== */
  let levelWS = null;
  let activeLevel = null;
  let levelSession = null; // { hints, hadErrors }

  function renderDesafio(params) {
    const level = Levels.byId(params[0]);
    if (!level || !Cultivo.numero(level.id)) { location.hash = '#/desafios'; return; }
    if (!canPlay(level.id)) {
      toast('🔒 Este desafio ainda está selado. Conclua o estágio anterior do reino primeiro.');
      location.hash = '#/desafios';
      return;
    }
    openLevel(level, false);
    if (params[1] === 'solucao' && isAdmin()) {
      requestAnimationFrame(() => { levelWS.stage.resize(); showSolution(level); });
    }
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
    const pos = Cultivo.ORDER.indexOf(level.id);
    const prevId = !custom && pos > 0 ? Cultivo.ORDER[pos - 1] : null;
    const onde = custom ? null : Cultivo.onde(level.id);
    const tech = Levels.techniqueOf(level);
    const par = Levels.parOf(level);
    const CRIT2 = { REPITA: 'Usou o REPITA', PARA: 'Criou um procedimento', REPCONT: 'Usou REPCONT', RECURSAO: 'Usou recursão' };
    const maxS = Levels.maxStarsOf(level);
    const minS = onde ? onde.reino.estrelasMinimas : 0;
    const flex = maxS === 5;
    const crit2 = tech ? CRIT2[tech] : 'Sem comandos sobrando';
    info.innerHTML = `
      <div class="aside-head">
        <a class="back-btn" href="${custom ? '#/inicio' : '#/desafios'}" aria-label="Voltar ${custom ? 'ao início' : 'ao mapa de níveis'}">‹</a>
        <h2 id="level-title">${custom ? 'Desafio do Professor' : `${nomeDesafio(level)} de ${JORNADA.length}`}</h2>
      </div>
      ${onde ? `<p class="realm-line" style="--aura:${onde.reino.corAura}"><span aria-hidden="true">${onde.reino.icone}</span> Reino ${onde.reino.id} · ${esc(onde.reino.nome)} — <b>${esc(onde.estagio.nome)}</b></p>` : ''}

      <div class="in-card challenge-card">
        <span class="ch-icon" aria-hidden="true">${level.icon}</span>
        <div>
          <b class="ch-title">${esc(level.title)}</b>
          ${level.shape ? `<small class="ch-shape">${esc(level.shape)}</small>` : ''}
          ${level.lore ? `<p class="ch-lore">${esc(level.lore)}</p>` : ''}
          <p class="challenge">${esc(level.challenge)}</p>
        </div>
      </div>

      <figure class="in-card target">
        <canvas class="target-canvas" role="img" aria-label="Desenho-alvo do nível"></canvas>
        <figcaption>🎯 Desenho-alvo · <span class="start-mark" aria-hidden="true">▲</span> início da tartaruga</figcaption>
        <ul class="chips" aria-label="Regras do desafio">
          ${reqs.map((r) => flex
            ? `<li class="chip chip-req">📌 Pedido: ${esc(Levels.requirementLabel(r))} (sem ele, −1 ★)</li>`
            : `<li class="chip chip-req">📌 Obrigatório: ${esc(Levels.requirementLabel(r))}</li>`).join('')}
          ${level.finalAtStart ? '<li class="chip chip-req">📍 Termine no ponto inicial</li>' : ''}
          ${level.limit ? `<li class="chip chip-limit">📏 Limite: até ${level.limit} comandos${flex ? ' (acima, −1 ★)' : ''}</li>` : ''}
          ${minS ? `<li class="chip chip-min">⛰️ Mínimo para romper: ${minS} ★</li>` : ''}
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
          ${flex ? `
          <li>★★★★★ desenho certo${tech ? ', ' + esc(Levels.TECHNIQUE_LABEL[tech]) : ''}, com até ${par} comandos</li>
          ${tech || reqs.length ? '<li>−1 ★ não usar a técnica pedida</li>' : ''}
          <li>−1 ★ passar da meta de comandos (−2 se passar do dobro)</li>
          ${level.limit ? `<li>−1 ★ passar do limite de ${level.limit} comandos</li>` : ''}
          <li>−1 ★ repetir linhas por cima do tracejado</li>
          <li>−1 ★ usar todas as dicas</li>` : `
          <li>★ desenho correto</li>
          <li>★★ ${tech ? Levels.TECHNIQUE_LABEL[tech] : 'sem comandos sobrando'}</li>
          <li>★★★ até ${par} comando${par > 1 ? 's' : ''}</li>`}
        </ul>
      </section>

      <section class="in-card level-progress" aria-labelledby="lp-title">
        <h3 id="lp-title"><span class="sec-icon" aria-hidden="true">🏁</span> Progresso do Desafio</h3>
        <div class="lp-body">
          <div class="ring" role="img" aria-label="0% concluído"><span>0%</span></div>
          <ul class="criteria">${flex ? `
            <li data-key="desenho"><span class="ck" aria-hidden="true"></span> Desenho correto</li>
            <li data-key="tecnica"><span class="ck" aria-hidden="true"></span> ${tech ? crit2 : 'Técnica pedida'}</li>
            <li data-key="meta"><span class="ck" aria-hidden="true"></span> Dentro da meta${level.limit ? ' e do limite' : ''}</li>
            <li data-key="repetidas"><span class="ck" aria-hidden="true"></span> Sem linhas repetidas</li>
            <li data-key="dicas"><span class="ck" aria-hidden="true"></span> Sem usar todas as dicas</li>` : `
            <li data-crit="1"><span class="ck" aria-hidden="true"></span> Desenho correto</li>
            <li data-crit="2"><span class="ck" aria-hidden="true"></span> ${crit2}</li>
            <li data-crit="3"><span class="ck" aria-hidden="true"></span> Solução eficiente</li>`}
          </ul>
        </div>
        <p class="lp-note muted small"></p>
      </section>

      ${isAdmin() ? `
      <section class="in-card admin-solution" aria-labelledby="sol-title">
        <h3 id="sol-title"><span class="sec-icon" aria-hidden="true">👨‍🏫</span> Solução (professor)</h3>
        <pre class="snippet">${esc(level.solution)}</pre>
        <p class="muted small">Meta para ${maxS} ★: até ${par} comando${par > 1 ? 's' : ''}${level.limit ? ` (limite: ${level.limit})` : ''}${minS ? ` · mínimo para romper: ${minS} ★` : ''}. Outras soluções que gerem o mesmo desenho também valem.</p>
        <div class="custom-actions">
          <button type="button" class="btn btn-sm btn-primary" data-show-solution>▶ Ver resolvendo</button>
          <button type="button" class="btn btn-sm" data-copy-solution>📋 Copiar</button>
        </div>
        <p class="muted small">Modo professor: o que você executar aqui não é salvo no progresso deste computador.</p>
      </section>` : ''}

      <div class="aside-nav">
        ${prevId ? `<a class="btn btn-ghost" href="#/desafio/${prevId}" aria-label="Desafio anterior">‹ Anterior</a>` : ''}
        <a class="btn map-btn" href="#/desafios">☯️ Mapa dos Reinos</a>
      </div>`;

    // o painel lê o desafio aberto e a sessão: defina-os antes de atualizar
    activeLevel = level;
    levelSession = { hints: 0, hadErrors: false, level, custom };
    updateLevelPanel(res.completed ? res.stars : 0, 'best');
    updateHintButton();
    $('[data-hint]', info).addEventListener('click', showHint);
    $('[data-ghost]', info).addEventListener('change', (e) => {
      Store.settings.ghost = e.target.checked;
      Store.save();
      levelWS.stage.opts.showGhost = e.target.checked;
      levelWS.stage.draw();
    });

    activeLevel = level;
    const admin = isAdmin();
    // no modo professor o editor não grava por cima do código do aluno
    levelWS.opts.storageKey = custom || admin ? null : 'nivel-' + level.id;
    levelWS.setCode(custom ? '' : Store.code('nivel-' + level.id, ''));
    if (admin) {
      $('[data-show-solution]', info).addEventListener('click', () => showSolution(level));
      $('[data-copy-solution]', info).addEventListener('click', async () => {
        try { await navigator.clipboard.writeText(level.solution); toast('📋 Solução copiada.'); }
        catch (e) { toast('Selecione o código e use Ctrl+C.'); }
      });
    }
    levelWS.resetWorld();
    levelWS.stage.setOption('viewHalf', 260);
    levelWS.stage.setGhost(Levels.targetOf(level));
    // blocos PARA/REPCONT/SE/PARE no painel a partir do Reino 5
    levelWS.setAdvanced(custom || (onde && onde.reino.id >= 5) || /PARA|REPCONT/i.test(level.solution));
    // meta de comandos e linhas, logo abaixo da tela da tartaruga
    levelWS.setGoal(Levels.metaOf(level));
    // a partir do Reino 3 os blocos laterais são só consulta: o aluno digita no teclado
    levelWS.setInsertEnabled(custom || !onde || onde.reino.id < 3);
    requestAnimationFrame(() => renderTargetPreview(level));
  }

  /** Modo professor: coloca a solução no editor e executa devagar. */
  function showSolution(level) {
    levelWS.setCode(level.solution);
    levelWS.run({ speed: 'normal' });
  }

  /**
   * Atualiza Recompensas e o anel "Progresso do Desafio".
   * result (opcional) = avaliação da última execução: na escala de 5 estrelas
   * marca cada critério conforme os descontos.
   */
  function updateLevelPanel(stars, source, result) {
    const view = $('#view-desafio');
    const lvl = activeLevel;
    const maxS = lvl ? Levels.maxStarsOf(lvl) : 3;
    const minS = lvl && Cultivo.onde(lvl.id) ? Cultivo.minEstrelas(lvl.id) : 0;
    const best = levelSession && levelSession.custom ? 0 : (lvl ? Store.level(lvl.id).stars || 0 : 0);
    const rs = $('.reward-stars', view);
    if (!rs) return;
    rs.classList.toggle('five', maxS === 5);
    rs.innerHTML = Array.from({ length: maxS }, (_, k) => k + 1).map((i) => `<span class="${i <= best ? 'on' : ''}">${i <= best ? '★' : '☆'}</span>`).join('');
    $('.reward-text', view).textContent = best
      ? `Sua melhor marca: ${best} de ${maxS} estrelas.${minS && best < minS ? ` Para romper o reino, precisa de ${minS}.` : best < maxS ? ' Dá para melhorar!' : ' Perfeito!'}`
      : 'Conclua o desafio para ganhar suas estrelas!';
    if (maxS === 5) {
      const keys = result && result.deductions ? result.deductions.map((d) => (d.key === 'meta2' || d.key === 'limite' ? 'meta' : d.key)) : null;
      $$('.criteria li', view).forEach((li) => {
        const k = li.dataset.key;
        let ok;
        if (result) ok = !!result.completed && (k === 'desenho' || !keys.includes(k));
        else ok = stars > 0 && (k === 'desenho' || stars >= 5);
        li.classList.toggle('ok', ok);
        $('.ck', li).textContent = ok ? '✓' : '';
      });
    }
    const pct = Math.round((stars / maxS) * 100);
    const ring = $('.ring', view);
    ring.style.setProperty('--p', pct);
    ring.setAttribute('aria-label', pct + '% concluído');
    $('span', ring).textContent = pct + '%';
    $$('.criteria li[data-crit]', view).forEach((li) => {
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
    else {
      const custa = Levels.maxStarsOf(s.level) === 5 && s.hints === total - 1 ? ' — custa 1 ★' : '';
      b.textContent = (s.hints ? `Mais uma dica (${s.hints + 1} de ${total})` : `Mostrar dica (1 de ${total})`) + custa;
      b.disabled = false;
    }
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
    const result = Levels.evaluate(level, { analysis: compiled.analysis, stats: compiled.stats, state, hintsUsed: s.hints });

    updateLevelPanel(result.completed ? result.stars : 0, 'try', result);
    if (!result.completed) {
      s.hadErrors = true;
      if (!s.custom && !isAdmin()) { Store.data.attempts[level.id] = (Store.data.attempts[level.id] || 0) + 1; Store.save(); }
      const sim = result.compare ? Math.round(Levels.similarity(result.compare) * 100) : null;
      const encourage = s.hints < level.hints.length ? ' Se quiser, peça uma 💡 dica.' : '';
      levelWS.showMessage(`
        <p class="msg-title">🤏 ${esc(result.title)}</p>
        <p>${esc(result.text)}</p>
        ${sim !== null && !result.compare.ok ? `<p class="similarity"><span class="meter"><i style="width:${sim}%"></i></span> Seu desenho combina ${sim}% com o alvo.</p>` : ''}
        <p class="muted">Errar faz parte de programar. Ajuste o código e execute de novo!${encourage}</p>`, 'warn');
      return;
    }

    if (isAdmin()) {
      levelWS.showMessage(`<p class="msg-title">✅ A solução confere: ${result.stars} de ${result.maxStars} estrelas.</p><p class="muted">Modo professor: nada foi salvo no progresso deste computador.</p>`, 'success');
      return;
    }
    levelWS.showMessage(`<p class="msg-title">🎉 ${esc(result.title)} ${esc(level.success)}</p>`, 'success');
    if (!s.custom) {
      Store.recordLevel(level.id, result.stars, compiled.analysis.size, result.maxStars === 5);
      updateLevelPanel(result.stars, 'try', result);
      fireEvent('levelComplete', { level, stars: result.stars, hadErrors: s.hadErrors || (Store.data.attempts[level.id] || 0) > 0 });
      const rompidos = Cultivo.registrarRompimentos(Store.data);
      Store.save();
      rompidos.forEach((r) => fireEvent('breakthrough', { reino: r }));
      updateHUD();
      showSuccess(level, result, compiled, rompidos);
      return;
    }
    showSuccess(level, result, compiled, []);
  }

  /** Modal celebratório do Rompimento de Reino (Breakthrough). */
  function showBreakthrough(reinos) {
    if (!reinos.length) return;
    const r = reinos[0];
    const prox = Cultivo.REINOS[r.id]; // o próximo reino (ids começam em 1)
    openModal({
      title: '✨ Rompimento de Reino!',
      wide: true,
      html: `
        <div class="breakthrough" style="--aura:${r.corAura}">
          <div class="bt-aura" aria-hidden="true"><span>${r.icone}</span></div>
          <p class="bt-kicker">Reino ${r.id} · ${esc(r.nome)}</p>
          <p class="bt-title">Gargalo rompido!</p>
          <blockquote class="bt-quote">“${esc(r.citacao)}”</blockquote>
          <p>Novo título marcial: <b class="bt-rank">${esc(r.titulo)}</b></p>
          ${prox
            ? `<p class="bt-next">O <b>Reino ${prox.id}: ${esc(prox.nome)}</b> (${esc(prox.subtitulo)}) se abre diante de você.<br><span class="muted">${esc(prox.foco)}</span></p>`
            : '<p class="bt-next">Você atravessou os seis reinos e alcançou a <b>Grande Perfeição</b>. A tartaruga tornou-se celestial! ☯️</p>'}
        </div>`,
      actions: prox
        ? [{ label: `Entrar no Reino ${prox.id} ▶`, cls: 'btn-primary', href: '#/desafios' }, { label: 'Continuar aqui' }]
        : [{ label: '☯️ Ver a jornada completa', cls: 'btn-primary', href: '#/desafios' }, { label: '🎨 Modo Livre', href: '#/livre' }],
      onClose: () => setTimeout(() => showBreakthrough(reinos.slice(1)), 250),
    });
    $('#modal').classList.add('breakthrough-modal');
  }

  function showSuccess(level, result, compiled, rompidos) {
    const a = compiled.analysis, st = compiled.stats;
    const next = levelSession.custom ? null : Cultivo.proximo(Store.data, level.id);
    const tip = Levels.nextStarTip(level, result, a);
    const custom = levelSession.custom;

    const html = `
      <div class="success-head">
        <p class="success-text">${esc(level.success)}</p>
        <p class="stars-big${result.maxStars === 5 ? ' five' : ''}" aria-label="${result.stars} de ${result.maxStars} estrelas"><span aria-hidden="true">${starsText(result.stars, result.maxStars)}</span></p>
        <p class="sr-only">Você ganhou ${result.stars} de ${result.maxStars} estrelas.</p>
      </div>
      ${result.deductions ? (result.deductions.length
        ? `<div class="deductions"><p class="ded-title">Descontos</p><ul>${result.deductions.map((d) => `<li><b>−${d.stars} ★</b> ${esc(d.text)}</li>`).join('')}</ul></div>`
        : '<p class="deductions ded-none">✨ Nenhum desconto: técnica perfeita!</p>') : ''}
      ${(() => {
        const minS = custom ? 0 : Cultivo.minEstrelas(level.id);
        const best = Store.level(level.id).stars || 0;
        return minS && best < minS
          ? `<p class="min-warning">⛰️ Desafio concluído! Mas para romper o Reino ${Cultivo.onde(level.id).reino.id} você precisa de pelo menos <b>${minS} ★</b> aqui. Refaça corrigindo os descontos.</p>`
          : '';
      })()}
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
      actions.push({ label: '☯️ Mapa', href: '#/desafios' });
    } else if (custom) {
      actions.push({ label: 'Fechar', cls: 'btn-primary' });
    } else {
      if (next) actions.push({ label: `Próximo: ${esc(nomeDesafio(next).toLowerCase())} ▶`, cls: 'btn-primary', href: '#/desafio/' + next.id });
      if (result.stars < result.maxStars) actions.push({ label: '🔁 Tentar mais estrelas' });
      actions.push({ label: '☯️ Mapa', href: '#/desafios' });
    }
    const title = level.final ? '☯️ Grande Perfeição!' : '🎉 Técnica dominada!';
    setTimeout(() => {
      openModal({ title, html, actions, wide: true, onClose: () => setTimeout(() => showBreakthrough(rompidos || []), 250) });
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
        bigStage: true,      // Modo Livre: mundo bem maior
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
    // linguagem avançada (Reinos 5 e 6): mesmo formato de cartão
    Logo.KEYWORD_DOCS.forEach((d) => { (groups[d.group] = groups[d.group] || []).push({ name: d.name, doc: d, aliases: [] }); });
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
          <li>Reino 5 em diante: contas com <code>+ - * /</code> e parênteses (<code>PF :T / 3</code>). Atenção: <code>:N - 1</code> e <code>:N-1</code> são conta; <code>:N -1</code> (espaço só antes) são dois valores.</li>
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
        <div class="stat card"><span class="stat-num">${p.done}/${p.total}</span><span>desafios concluídos</span></div>
        <div class="stat card"><span class="stat-num">${Cultivo.situacao(Store.data).rompidos.length}/${Cultivo.REINOS.length}</span><span>reinos rompidos</span></div>
        <div class="stat card"><span class="stat-num">${p.stars}/${p.maxStars}</span><span>estrelas</span></div>
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
    if (!isAdmin()) return renderProfessorLock(view);
    const rows = JORNADA.map((l) => `
      <tr>
        <th scope="row">${l.icon} ${Cultivo.numero(l.id)}. ${esc(l.title)}<br><small class="muted">R${Cultivo.onde(l.id).reino.id} · ${esc(Cultivo.ESTAGIOS[Cultivo.onde(l.id).estagio.tipo].curto)}</small></th>
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
        <p>Visão pedagógica da jornada, todas as fases com as soluções, sugestões para a sala de aula e ferramentas para criar desafios.</p>
        <p class="custom-actions no-print">
          <button type="button" class="btn btn-sm" data-print>🖨️ Imprimir esta página</button>
          <button type="button" class="btn btn-sm btn-danger" data-logout>🔒 Sair do modo professor</button>
        </p>
      </div>

      <section class="card" aria-labelledby="all-levels-title">
        <h3 id="all-levels-title">🗝️ Todas as fases e soluções</h3>
        <p class="muted">Enquanto o modo professor estiver ativo (até fechar esta aba), todas as fases ficam abertas e cada desafio mostra a solução. Nada do que você executar é salvo no progresso deste computador.</p>
        ${Cultivo.REINOS.map((r) => `
        <h4 class="sol-realm" style="--aura:${r.corAura}">${r.icone} Reino ${r.id} · ${esc(r.nome)}</h4>
        <div class="solutions-grid">
          ${r.subEstagios.flatMap((st) => st.desafiosIds).map((id) => Levels.byId(id)).map((l) => `
            <article class="solution-card">
              <canvas class="sol-thumb" data-level="${l.id}" role="img" aria-label="Desenho-alvo do nível ${l.id}"></canvas>
              <div class="sol-body">
                <h4>${l.icon} ${Cultivo.numero(l.id)}. ${esc(l.title)} <small class="muted">· ${esc(Cultivo.ESTAGIOS[Cultivo.onde(l.id).estagio.tipo].curto)}</small></h4>
                <p class="small">${esc(l.challenge)}</p>
                <pre class="snippet small">${esc(l.solution)}</pre>
                <p class="muted small">🎯 Meta: ${Levels.metaOf(l).comandos} comandos em ${Levels.metaOf(l).linhas} linha${Levels.metaOf(l).linhas > 1 ? 's' : ''} · ${Levels.maxStarsOf(l)} ★ com até ${Levels.parOf(l)} comandos${l.limit ? ` · 📏 limite ${l.limit}` : ''}${Cultivo.minEstrelas(l.id) ? ` · mín. ${Cultivo.minEstrelas(l.id)} ★ para romper` : ''}${(l.requires || []).filter((r) => r !== 'PF').length ? ' · obrigatório: ' + l.requires.filter((r) => r !== 'PF').map(Levels.requirementLabel).join(', ') : ''}</p>
                <details class="small"><summary>Dicas do nível</summary><ol>${l.hints.map((h) => `<li>${esc(h)}</li>`).join('')}</ol></details>
                <div class="custom-actions">
                  <a class="btn btn-sm btn-primary" href="#/desafio/${l.id}/solucao">▶ Ver resolvendo</a>
                  <a class="btn btn-sm" href="#/desafio/${l.id}">Abrir fase</a>
                </div>
              </div>
            </article>`).join('')}
        </div>`).join('')}
      </section>

      <section class="card">
        <h3>🎯 Objetivo e progressão</h3>
        <p>O aluno aprende lógica de programação construindo desenhos: <b>escreve → executa → observa → identifica o erro → corrige</b>.
        A progressão vai de comandos simples (sequência) a ângulos, repetição (loop), laços aninhados, decomposição e engenharia reversa.</p>
        <p class="flow">APRENDER → EXPERIMENTAR → RESOLVER DESAFIOS → ROMPER REINOS → CRIAR → PROGRAMAR LIVREMENTE</p>
        <p><b>Estrelas:</b> Reinos 1 e 2 usam 3 estrelas. A partir do Reino 3, são 5: o desafio passa sempre que o desenho estiver certo, e cada regra não cumprida tira 1 estrela (técnica, meta de comandos — 2 se passar do dobro —, limite, linhas repetidas por cima do tracejado, uso de todas as dicas). Para romper os Reinos 3 a 5, todos os desafios precisam de pelo menos 3 estrelas; no Reino 6, de 4. A partir do Reino 3 os blocos de comandos da lateral não inserem código: o aluno digita.</p>
        <p><b>O Dao dos Algoritmos:</b> 36 desafios em 6 reinos × 3 estágios (Inicial, Intermediário, Pico). Um estágio abre quando o anterior é concluído; vencer o Pico rompe o reino. Reino 1: sequência e precisão · Reino 2: REPITA e polígonos · Reino 3: laços aninhados · Reino 4: otimização com limite de comandos · Reino 5: REPCONT, procedimentos e a primeira recursão · Reino 6: fractais e recursão avançada.</p>
        <p class="muted">A verificação dos desafios compara o <b>desenho</b>, não o código: soluções diferentes são aceitas. Desenhos espelhados (PE em vez de PD), girados em 90° ou deslocados também valem.</p>
      </section>

      <section class="card">
        <h3>🗺️ Visão geral dos 36 desafios</h3>
        <div class="table-scroll">
          <table class="teacher-table">
            <thead><tr><th>Desafio</th><th>Desafio</th><th>Objetivo pedagógico</th><th>Comandos</th><th>Conceitos</th><th>Sugestão</th><th>Solução</th></tr></thead>
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
        <h3>❄️ Linguagem avançada: procedimentos e recursão <span class="tag">Reinos 5 e 6</span></h3>
        <div class="fractal-box">
          <canvas class="fractal-preview" width="300" height="240" role="img" aria-label="Floco de neve de Koch"></canvas>
          <div>
            <p>${esc(Fractals.description)}</p>
            <p class="muted">A partir do Reino 5 a linguagem tem PARA … FIM com parâmetros, contas, SE, PARE e REPCONT. O floco de Koch, por exemplo:</p>
            <pre class="snippet">${esc(Fractals.FUTURE_CODE)}</pre>
            <p class="muted small">As aulas 8, 9 e 10 do tutorial apresentam REPCONT, procedimentos e recursão.</p>
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
    $('[data-logout]', view).addEventListener('click', () => {
      setAdmin(false);
      toast('🔒 Modo professor encerrado.');
      route(true);
    });
    requestAnimationFrame(() => $$('.sol-thumb', view).forEach((c) => {
      const lvl = Levels.byId(c.dataset.level);
      Turtle.renderFit(c, Levels.targetOf(lvl), { showStart: true, padding: 10 });
    }));
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

  /** Tela de senha da aba Professor. */
  function renderProfessorLock(view) {
    view.innerHTML = `
      <div class="lock-wrap">
        <form class="card lock-card" onsubmit="return false">
          <p class="lock-icon" aria-hidden="true">🔒</p>
          <h2>Área do Professor</h2>
          <p class="muted">Aqui ficam todas as fases com as soluções e as ferramentas do professor. Digite a senha para entrar.</p>
          <label class="field">Senha <input type="password" id="admin-pass" autocomplete="current-password" inputmode="numeric"></label>
          <button type="submit" class="btn btn-primary btn-block" data-login>Entrar</button>
          <p class="form-status" aria-live="polite"></p>
        </form>
      </div>`;
    const input = $('#admin-pass', view);
    const st = $('.form-status', view);
    setTimeout(() => input.focus(), 50);
    $('.lock-card', view).addEventListener('submit', async () => {
      if (!input.value.trim()) { setStatus(st, 'Digite a senha.', true); input.focus(); return; }
      try {
        if (await checkAdminPassword(input.value)) {
          setAdmin(true);
          toast('👨‍🏫 Modo professor ativo: todas as fases e soluções liberadas.');
          route(true);
        } else {
          setStatus(st, 'Senha incorreta.', true);
          input.select();
        }
      } catch (e) {
        setStatus(st, 'Este navegador não conseguiu conferir a senha. Abra o jogo pelo site (https).', true);
      }
    });
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
  document.body.classList.toggle('is-admin', isAdmin());
  updatePlayer();
  updateHUD();
  route(true);
  if (!Store.data.nome) setTimeout(askName, 400);
  // conquistas de rompimento para quem já tinha progresso da versão antiga
  setTimeout(() => fireEvent('sync'), 800);
})();
