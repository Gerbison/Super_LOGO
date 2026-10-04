/* =========================================================================
 * progresso.js — Código de progresso (o "save" que viaja entre computadores)
 * -------------------------------------------------------------------------
 * Mesmo sistema do AlgoBot: sem banco de dados, o progresso cabe num código
 * curto, por exemplo  TAR-3ZZZZK0-7QXM
 *
 *   TAR      prefixo do jogo
 *   bloco 1  estrelas de cada nível (2 bits por nível, na ordem de LEVELS)
 *            + aulas do tutorial concluídas (1 bit por aula)
 *   bloco 2  assinatura: resumo (hash) do nome do aluno
 *
 * O nome NÃO volta a partir do código (ele é curto demais). O que dá para
 * fazer é CONFERIR se o nome digitado bate — isso impede usar o código do
 * colega para pular níveis. Acentos são ignorados ("Luíza" = "Luiza").
 *
 * O aluno pode: ver o código, copiá-lo, mandá-lo para o próprio e-mail
 * ("Salvar e continuar depois") e colá-lo em outro computador.
 * Importar nunca piora nada: cada nível fica com o MELHOR resultado entre o
 * que já estava no computador e o que veio no código.
 * ========================================================================= */
(function (root) {
  'use strict';

  const PREFIXO = 'TAR';
  const NOME_JOGO = 'Jornada da Tartaruga';

  /* Base32 sem I, L, O e U: o aluno não confunde 1/I e 0/O ao copiar à mão. */
  const ALFABETO = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

  /* Hash FNV-1a de 32 bits (não é criptografia; só amarra o código ao nome). */
  function hashNome(nome) {
    const limpo = String(nome || '').trim().normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, ' ').toUpperCase();
    let h = 0x811c9dc5;
    for (let i = 0; i < limpo.length; i++) {
      h ^= limpo.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h >>> 0;
  }

  function bitsParaBase32(bits) {
    while (bits.length % 5 !== 0) bits += '0';
    let s = '';
    for (let i = 0; i < bits.length; i += 5) s += ALFABETO[parseInt(bits.slice(i, i + 5), 2)];
    return s;
  }

  function base32ParaBits(texto) {
    let bits = '';
    for (const ch of texto) {
      const v = ALFABETO.indexOf(ch);
      if (v < 0) return null;
      bits += v.toString(2).padStart(5, '0');
    }
    return bits;
  }

  function assinatura(nome) {
    return bitsParaBase32((hashNome(nome) & 0xfffff).toString(2).padStart(20, '0'));
  }

  /**
   * Gera o código a partir do progresso salvo (Store.data).
   * levels = Levels.LEVELS, lessons = TUTORIAL.
   */
  function gerarCodigo(data, levels, lessons) {
    let bits = '';
    levels.forEach((l) => {
      const r = data.levels[l.id];
      const e = r && r.completed ? Math.max(1, Math.min(3, r.stars || 1)) : 0;
      bits += e.toString(2).padStart(2, '0');
    });
    lessons.forEach((a) => { bits += data.lessons[a.id] ? '1' : '0'; });
    return `${PREFIXO}-${bitsParaBase32(bits)}-${assinatura(data.nome)}`;
  }

  /** Limpa o que o aluno colou: espaços, minúsculas, letras confundíveis. */
  function normalizar(codigo) {
    return String(codigo || '').trim().toUpperCase().replace(/\s+/g, '')
      .replace(/[–—]/g, '-').replace(/O/g, '0').replace(/[IL]/g, '1');
  }

  /**
   * Lê um código. Devolve { valido, estrelas[], aulas[], assinatura } ou
   * { valido: false, motivo }.
   */
  function decodificar(codigo, levels, lessons) {
    const partes = normalizar(codigo).split('-');
    if (partes.length !== 3 || partes[0] !== PREFIXO) {
      return { valido: false, motivo: `O código deve ter o formato ${PREFIXO}-XXXXXXXX-XXXX.` };
    }
    const bits = base32ParaBits(partes[1]);
    if (bits === null || base32ParaBits(partes[2]) === null || partes[2].length !== 4) {
      return { valido: false, motivo: 'O código tem letras que não existem no formato. Confira se copiou certinho.' };
    }
    const precisa = levels.length * 2 + lessons.length;
    if (bits.length < precisa) {
      return { valido: false, motivo: 'O código está incompleto. Confira se copiou ele inteiro.' };
    }
    const estrelas = levels.map((_, i) => parseInt(bits.slice(i * 2, i * 2 + 2), 2));
    const aulas = lessons.map((_, i) => bits[levels.length * 2 + i] === '1');
    return { valido: true, estrelas, aulas, assinatura: partes[2] };
  }

  function conferirNome(codigo, nome, levels, lessons) {
    const lido = decodificar(codigo, levels, lessons);
    return lido.valido && lido.assinatura === assinatura(nome);
  }

  /**
   * Junta o progresso do código ao progresso deste computador (Store.data),
   * mantendo sempre o melhor. Devolve { ok, motivo?, niveis, aulas }.
   */
  function importar(data, codigo, nome, levels, lessons) {
    nome = String(nome || '').trim();
    if (!nome) return { ok: false, motivo: 'Digite o seu nome antes de continuar.' };
    const lido = decodificar(codigo, levels, lessons);
    if (!lido.valido) return { ok: false, motivo: lido.motivo };
    if (lido.assinatura !== assinatura(nome)) {
      return { ok: false, motivo: 'Esse código não confere com esse nome. Digite o nome exatamente como da vez passada.' };
    }

    let niveis = 0, aulas = 0;
    levels.forEach((l, i) => {
      const e = lido.estrelas[i];
      if (!e) return;
      const atual = data.levels[l.id];
      if (!atual || !atual.completed || (atual.stars || 0) < e) {
        // o número de comandos não viaja no código: usamos o maior que ainda vale essas estrelas
        data.levels[l.id] = { completed: true, stars: e, size: e >= 3 ? l.par : (atual && atual.size) || l.par + 1 };
        niveis++;
      }
    });
    lessons.forEach((a, i) => {
      if (lido.aulas[i] && !data.lessons[a.id]) { data.lessons[a.id] = true; aulas++; }
    });
    data.nome = nome;
    return { ok: true, niveis, aulas };
  }

  /* ----------------------- "Salvar e continuar depois" ------------------- */
  function partesEmail(codigo, nome) {
    return {
      assunto: `${NOME_JOGO} — meu código para continuar depois`,
      corpo: [
        'Guarde este e-mail. Ele tem o código para continuar de onde você parou',
        `na ${NOME_JOGO}, em qualquer computador.`,
        '',
        `Nome usado no jogo: ${nome || '—'}`,
        `Código: ${codigo}`,
        '',
        `Para continuar: abra a ${NOME_JOGO} (${root.location ? root.location.href.split('#')[0] : ''}),`,
        'clique em "Já jogou em outro computador?", digite o nome EXATAMENTE',
        'como está acima e cole este código.',
      ].join('\n'),
    };
  }

  /** Gmail na web: não depende de programa de e-mail instalado (padrão). */
  function linkGmail(destino, codigo, nome) {
    const p = partesEmail(codigo, nome);
    return 'https://mail.google.com/mail/?view=cm&fs=1&to=' + encodeURIComponent(destino) +
      '&su=' + encodeURIComponent(p.assunto) + '&body=' + encodeURIComponent(p.corpo);
  }

  /** mailto: funciona com qualquer programa de e-mail configurado na máquina. */
  function linkMailto(destino, codigo, nome) {
    const p = partesEmail(codigo, nome);
    return 'mailto:' + destino + '?subject=' + encodeURIComponent(p.assunto) + '&body=' + encodeURIComponent(p.corpo);
  }

  const api = { PREFIXO, NOME_JOGO, hashNome, gerarCodigo, decodificar, conferirNome, importar, linkGmail, linkMailto, normalizar };
  root.Progresso = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
