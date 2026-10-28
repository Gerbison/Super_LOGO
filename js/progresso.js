/* =========================================================================
 * progresso.js — Código de progresso (o "save" que viaja entre computadores)
 * -------------------------------------------------------------------------
 * Mesmo sistema do AlgoBot: sem banco de dados, o progresso cabe num código
 * curto, por exemplo  TAR3-ZZZZZZZZZ00000000000000-7QXM
 *
 *   TAR3     prefixo do jogo (versão 3: 36 desafios, até 5 estrelas). Os códigos
 *            antigos "TAR2" (36 desafios, até 3 estrelas) e "TAR" (15 níveis)
 *            continuam sendo lidos.
 *   bloco 1  estrelas de cada desafio (3 bits por desafio, na ordem dos ids)
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

  const PREFIXO = 'TAR3';      // versão atual: 36 desafios, 3 bits por desafio (0 a 5 estrelas)
  const PREFIXO_V2 = 'TAR2';   // versão anterior: 2 bits por desafio (0 a 3) — ainda é lida
  const PREFIXO_V1 = 'TAR';    // versão antiga (15 níveis, 7 aulas) — ainda é lida

  /** Escala de 5 estrelas (Reino 3 em diante)? Usa js/cultivo.js quando carregado. */
  const cincoEstrelas = (id) => !!(root.Cultivo && root.Cultivo.maxEstrelas && root.Cultivo.maxEstrelas(id) === 5);
  /** Estrelas antigas (escala de 3) → escala de 5, para os desafios do Reino 3 em diante. */
  const converter = (id, e) => (e && cincoEstrelas(id) ? ({ 1: 3, 2: 4, 3: 5 }[e] || e) : e);
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

  const porId = (lista) => lista.slice().sort((x, y) => x.id - y.id);

  /**
   * Gera o código (versão TAR2) a partir do progresso salvo (Store.data).
   * levels = Levels.LEVELS, lessons = TUTORIAL. A ordem é sempre por id, então
   * reorganizar a jornada (reinos) não muda o significado do código.
   */
  function gerarCodigo(data, levels, lessons, versao) {
    // versao 1/2 (formatos antigos, 2 bits e estrelas até 3) só existe para os testes
    const antigo = versao === 1 || versao === 2;
    const largura = antigo ? 2 : 3;
    let bits = '';
    porId(levels).forEach((l) => {
      const r = data.levels[l.id];
      const e = r && r.completed ? Math.max(1, Math.min(antigo ? 3 : 5, r.stars || 1)) : 0;
      bits += e.toString(2).padStart(largura, '0');
    });
    porId(lessons).forEach((a) => { bits += data.lessons[a.id] ? '1' : '0'; });
    if (!antigo) {
      // 1 bit por desafio: usou todas as dicas? (o desconto acompanha o aluno em outro computador)
      porId(levels).forEach((l) => {
        const usadas = (data.hints && data.hints[l.id]) || 0;
        bits += l.hints && l.hints.length && usadas >= l.hints.length ? '1' : '0';
      });
    }
    const prefixo = versao === 1 ? PREFIXO_V1 : versao === 2 ? PREFIXO_V2 : PREFIXO;
    return `${prefixo}-${bitsParaBase32(bits)}-${assinatura(data.nome)}`;
  }

  /** Limpa o que o aluno colou: espaços, minúsculas, letras confundíveis. */
  function normalizar(codigo) {
    return String(codigo || '').trim().toUpperCase().replace(/\s+/g, '')
      .replace(/[–—]/g, '-').replace(/O/g, '0').replace(/[IL]/g, '1');
  }

  /**
   * Lê um código (TAR2 atual ou TAR antigo). Devolve
   *   { valido, versao, estrelas: {id: 0..5}, aulas: {id: bool}, assinatura }
   * Nos códigos antigos (TAR, TAR2) as estrelas dos desafios do Reino 3 em
   * diante vêm na escala de 3 e são convertidas para a de 5 (3→5, 2→4, 1→3).
   * ou { valido: false, motivo }.
   */
  function decodificar(codigo, levels, lessons) {
    const partes = normalizar(codigo).split('-');
    if (partes.length !== 3 || ![PREFIXO, PREFIXO_V2, PREFIXO_V1].includes(partes[0])) {
      return { valido: false, motivo: `O código deve ter o formato ${PREFIXO}-XXXXXXXXXXXXXXXXXXXXXXXX-XXXX.` };
    }
    const bits = base32ParaBits(partes[1]);
    if (bits === null || base32ParaBits(partes[2]) === null || partes[2].length !== 4) {
      return { valido: false, motivo: 'O código tem letras que não existem no formato. Confira se copiou certinho.' };
    }
    const v1 = partes[0] === PREFIXO_V1;
    const versao = v1 ? 1 : partes[0] === PREFIXO_V2 ? 2 : 3;
    const largura = versao === 3 ? 3 : 2; // bits por desafio
    // TAR antigo: 15 níveis (ids 1-15) e 7 aulas (ids 1-7), na ordem dos ids
    const levelIds = v1 ? Array.from({ length: 15 }, (_, i) => i + 1) : porId(levels).map((l) => l.id);
    const lessonIds = v1 ? Array.from({ length: 7 }, (_, i) => i + 1) : porId(lessons).map((a) => a.id);
    if (bits.length < levelIds.length * largura + lessonIds.length) {
      return { valido: false, motivo: 'O código está incompleto. Confira se copiou ele inteiro.' };
    }
    const estrelas = {}, aulas = {};
    levelIds.forEach((id, i) => {
      const e = Math.min(5, parseInt(bits.slice(i * largura, i * largura + largura), 2));
      estrelas[id] = versao === 3 ? e : converter(id, e);
    });
    lessonIds.forEach((id, i) => { aulas[id] = bits[levelIds.length * largura + i] === '1'; });
    // TAR3 mais novo: depois das aulas, 1 bit por desafio = usou todas as dicas
    const dicas = {};
    const inicioDicas = levelIds.length * largura + lessonIds.length;
    if (versao === 3 && bits.length >= inicioDicas + levelIds.length) {
      levelIds.forEach((id, i) => { dicas[id] = bits[inicioDicas + i] === '1'; });
    }
    return { valido: true, versao, estrelas, aulas, dicas, assinatura: partes[2] };
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
    levels.forEach((l) => {
      const e = lido.estrelas[l.id];
      if (!e) return;
      const atual = data.levels[l.id];
      if (!atual || !atual.completed || (atual.stars || 0) < e) {
        // o número de comandos não viaja no código: usamos o maior que ainda vale essas estrelas
        const par = root.Levels && root.Levels.parOf ? root.Levels.parOf(l) : l.par;
        const max = cincoEstrelas(l.id) ? 5 : 3;
        data.levels[l.id] = { completed: true, stars: e, size: e >= max ? par : (atual && atual.size) || par + 1 };
        if (max === 5) data.levels[l.id].escala = 5;
        niveis++;
      }
    });
    lessons.forEach((a) => {
      if (lido.aulas[a.id] && !data.lessons[a.id]) { data.lessons[a.id] = true; aulas++; }
    });
    levels.forEach((l) => {
      if (lido.dicas && lido.dicas[l.id] && l.hints) {
        data.hints = data.hints || {};
        data.hints[l.id] = Math.max(data.hints[l.id] || 0, l.hints.length);
      }
    });
    data.nome = nome;
    return { ok: true, niveis, aulas, versao: lido.versao };
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
