/* =========================================================================
 * logo.js — Interpretador da linguagem da Tartaruga
 * -------------------------------------------------------------------------
 * Linguagem educacional PRÓPRIA, inspirada nas ideias gerais da LOGO.
 *
 * O código do aluno passa por 3 etapas:
 *
 *   1. tokenize(código) → "fichas": palavras, números e colchetes.
 *   2. parse(código)    → árvore de sintaxe (AST): comandos e blocos REPITA.
 *   3. run(ast)         → lista de AÇÕES simples que a tartaruga entende:
 *        { type: 'move',  dist }    andar (dist negativa = para trás)
 *        { type: 'turn',  angle }   girar (positivo = direita)
 *        { type: 'pen',   down }    baixar / levantar a caneta
 *        { type: 'clear' }          limpar o desenho
 *        { type: 'home' }           voltar ao centro
 *
 * Para criar um comando novo basta chamar Logo.defineCommand({...})
 * (veja os comandos abaixo e a seção "Como alterar comandos" do README).
 *
 * Pontos de extensão já preparados para o futuro:
 *   - evalExpr(): hoje só entende números; é aqui que entrarão variáveis
 *     (:lado), contas (+ - * /) e funções.
 *   - ctx.procedures: espaço reservado para procedimentos (PARA ... FIM),
 *     que permitirão recursividade (Laboratório de Fractais).
 *   - FUTURE_WORDS: palavras reservadas que já respondem "em breve".
 * ========================================================================= */
(function (root) {
  'use strict';

  const MAX_ACTIONS = 200000; // proteção contra programas gigantes
  const MAX_REPEAT = 10000;   // maior número aceito em REPITA

  /* ---------------------------------------------------------------------
   * Erro pedagógico: nunca mostramos "SyntaxError" para o aluno.
   * Campos: title, message, snippet (exemplo de código), start/end
   * (posição no texto, para destacar no editor) e line.
   * ------------------------------------------------------------------- */
  class LogoError extends Error {
    constructor(info) {
      super(info.message || info.title);
      this.name = 'LogoError';
      Object.assign(this, info);
    }
  }

  /** Remove acentos e coloca em maiúsculas: "repíta" → "REPITA". */
  function normalizeWord(w) {
    return String(w).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
  }

  /* ---------------------------------------------------------------------
   * Registro de comandos
   * ------------------------------------------------------------------- */
  const commands = Object.create(null); // nome oficial → definição
  const aliasMap = Object.create(null); // qualquer apelido → nome oficial

  /**
   * Registra um comando.
   *   name    nome oficial (ex.: 'PF')
   *   aliases outros nomes aceitos (ex.: ['PARAFRENTE'])
   *   args    lista de parâmetros numéricos: [{ name, missing }]
   *           "missing" é a explicação mostrada quando o número falta.
   *   block   true se o comando recebe [ comandos ] (como REPITA)
   *   doc     informações para a Biblioteca de Comandos
   *   run(ctx, valores, node)  gera as ações com ctx.emit({...})
   */
  function defineCommand(def) {
    def.args = def.args || [];
    commands[def.name] = def;
    [def.name].concat(def.aliases || []).forEach((a) => { aliasMap[normalizeWord(a)] = def.name; });
    return def;
  }

  function lookup(word) {
    return aliasMap[normalizeWord(word)] || null;
  }

  /* ----------------------------- Movimento ----------------------------- */
  defineCommand({
    name: 'PF',
    aliases: ['PARAFRENTE'],
    args: [{ name: 'passos', missing: 'PF precisa saber quantos passos a tartaruga deve andar.' }],
    doc: {
      title: 'PARA FRENTE', icon: '🐢 → → → →', group: 'Movimento',
      color: '#16a34a', hl: '#4ade80', label: 'Para frente', short: 'PF 100', note: 'anda 100 passos',
      text: 'Faz a tartaruga andar para frente, na direção em que está olhando.',
      example: 'PF 100',
    },
    run(ctx, [n]) { ctx.emit({ type: 'move', dist: n }); },
  });

  defineCommand({
    name: 'PT',
    aliases: ['PARATRAS'],
    args: [{ name: 'passos', missing: 'PT precisa saber quantos passos a tartaruga deve andar para trás.' }],
    doc: {
      title: 'PARA TRÁS', icon: '← ← ← ← 🐢', group: 'Movimento',
      color: '#9333ea', hl: '#c084fc', label: 'Para trás', short: 'PT 100', note: 'anda 100 passos para trás',
      text: 'Faz a tartaruga andar de costas, sem virar.',
      example: 'PF 100\nPT 50',
    },
    run(ctx, [n]) { ctx.emit({ type: 'move', dist: -n }); },
  });

  defineCommand({
    name: 'PD',
    aliases: ['PARADIREITA'],
    args: [{ name: 'graus', missing: 'PD precisa saber quantos graus a tartaruga deve girar para a direita.' }],
    doc: {
      title: 'PARA DIREITA', icon: '🐢 ↻', group: 'Giro',
      color: '#2563eb', hl: '#60a5fa', label: 'Para direita', short: 'PD 90', note: 'gira 90° para a direita',
      text: 'Gira a tartaruga para a direita (sentido do relógio). O número é o ângulo em graus.',
      example: 'PD 90\nPF 100',
    },
    run(ctx, [n]) { ctx.emit({ type: 'turn', angle: n }); },
  });

  defineCommand({
    name: 'PE',
    aliases: ['PARAESQUERDA'],
    args: [{ name: 'graus', missing: 'PE precisa saber quantos graus a tartaruga deve girar para a esquerda.' }],
    doc: {
      title: 'PARA ESQUERDA', icon: '🐢 ↺', group: 'Giro',
      color: '#ea580c', hl: '#fb923c', label: 'Para esquerda', short: 'PE 90', note: 'gira 90° para a esquerda',
      text: 'Gira a tartaruga para a esquerda (contra o relógio). O número é o ângulo em graus.',
      example: 'PE 90\nPF 100',
    },
    run(ctx, [n]) { ctx.emit({ type: 'turn', angle: -n }); },
  });

  /* ------------------------------ Caneta ------------------------------- */
  defineCommand({
    name: 'BAIXE',
    aliases: ['BAIXA', 'BAIXAR'],
    doc: {
      title: 'BAIXAR A CANETA', icon: '🐢✏️ ———', group: 'Caneta',
      color: '#e11d48', hl: '#fb7185', label: 'Baixa a caneta', short: 'BAIXE', note: 'desenha enquanto anda',
      text: 'A tartaruga volta a desenhar enquanto anda.',
      example: 'LEVANTE\nPF 50\nBAIXE\nPF 50',
    },
    run(ctx) { ctx.emit({ type: 'pen', down: true }); },
  });

  defineCommand({
    name: 'LEVANTE',
    aliases: ['LEVANTA', 'LEVANTAR'],
    doc: {
      title: 'LEVANTAR A CANETA', icon: '🐢✋ · · ·', group: 'Caneta',
      color: '#0d9488', hl: '#2dd4bf', label: 'Levanta a caneta', short: 'LEVANTE', note: 'anda sem desenhar',
      text: 'A tartaruga anda sem desenhar (como tirar o lápis do papel).',
      example: 'PF 50\nLEVANTE\nPF 50\nBAIXE\nPF 50',
    },
    run(ctx) { ctx.emit({ type: 'pen', down: false }); },
  });

  /* ------------------------------- Tela -------------------------------- */
  defineCommand({
    name: 'LIMPE',
    aliases: ['LIMPA', 'LIMPAR'],
    doc: {
      title: 'LIMPAR', icon: '🧽 ✨', group: 'Tela',
      color: '#7c3aed', hl: '#a78bfa', label: 'Limpa o desenho', short: 'LIMPE', note: 'apaga tudo',
      text: 'Apaga todo o desenho. A tartaruga continua onde está.',
      example: 'PF 100\nLIMPE\nPD 90\nPF 50',
    },
    run(ctx) { ctx.emit({ type: 'clear' }); },
  });

  defineCommand({
    name: 'CENTRO',
    aliases: ['PARACENTRO'],
    doc: {
      title: 'VOLTAR AO CENTRO', icon: '🎯 🐢↑', group: 'Tela',
      color: '#475569', hl: '#94a3b8', label: 'Volta ao centro', short: 'CENTRO', note: 'posição inicial',
      text: 'Leva a tartaruga de volta ao meio da tela, olhando para cima, sem desenhar.',
      example: 'PF 100\nPD 90\nPF 50\nCENTRO',
    },
    run(ctx) { ctx.emit({ type: 'home' }); },
  });

  /* ---------------------------- Repetição ------------------------------ */
  defineCommand({
    name: 'REPITA',
    aliases: ['REPETIR', 'REPITE', 'REPETE'],
    args: [{ name: 'vezes', missing: 'REPITA precisa saber quantas vezes deve repetir.' }],
    block: true,
    doc: {
      title: 'REPETIR', icon: '🔁', group: 'Repetição',
      color: '#eab308', hl: '#facc15', dark: true, label: 'Repete comandos', short: 'REPITA 4 [PF 100 PD 90]', note: 'repete 4 vezes os comandos',
      text: 'Faz a tartaruga repetir uma sequência de comandos. Os comandos repetidos ficam entre colchetes [ ].',
      example: 'REPITA 4 [PF 100 PD 90]',
    },
    run(ctx, [n], node) {
      if (!Number.isInteger(n)) {
        ctx.error({
          title: `🔢 REPITA ${fmt(n)} não dá certo.`,
          message: 'A tartaruga só consegue repetir um número inteiro de vezes (1, 2, 3...).',
          snippet: `REPITA ${Math.max(1, Math.round(n))} [ ... ]`,
        });
      }
      if (n < 1) {
        ctx.error({
          title: '🔢 Para repetir, o número precisa ser pelo menos 1.',
          message: `REPITA ${fmt(n)} pede para repetir ${fmt(n)} vezes — isso não faz a tartaruga fazer nada.`,
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (n > MAX_REPEAT) {
        ctx.error({
          title: '😵 É repetição demais!',
          message: `O maior número aceito no REPITA é ${MAX_REPEAT}.`,
          snippet: 'REPITA 360 [PF 1 PD 1]',
        });
      }
      for (let i = 1; i <= n; i++) {
        ctx.loopStack.push({ i, n, node });
        ctx.stats.loopIterations++;
        ctx.execBlock(node.body);
        ctx.loopStack.pop();
      }
    },
  });

  /* ---------------------------------------------------------------------
   * Palavras que ainda não existem, mas que já respondem com carinho.
   * ------------------------------------------------------------------- */
  const FUTURE_WORDS = {
    PARA: 'criar seus próprios comandos (procedimentos)',
    APRENDA: 'criar seus próprios comandos (procedimentos)',
    FIM: 'terminar um procedimento',
    SE: 'tomar decisões (condicionais)',
    SENAO: 'tomar decisões (condicionais)',
    FACA: 'guardar valores em variáveis',
    ATRIBUA: 'guardar valores em variáveis',
    MUDECOR: 'mudar a cor da caneta pelo código',
    MUDECL: 'mudar a cor da caneta pelo código',
    MUDEEL: 'mudar a espessura da linha pelo código',
    PINTE: 'pintar (preencher) figuras',
    MOSTRE: 'mostrar mensagens e valores',
  };

  /* Erros comuns: palavras em inglês (LOGO original) ou "parecidas". */
  const COMMON_MISTAKES = {
    FD: 'PF', FORWARD: 'PF', BK: 'PT', BACK: 'PT', RT: 'PD', RIGHT: 'PD',
    LT: 'PE', LEFT: 'PE', REPEAT: 'REPITA', PU: 'LEVANTE', PENUP: 'LEVANTE',
    PENDOWN: 'BAIXE', CS: 'LIMPE', CLEARSCREEN: 'LIMPE', CLEAN: 'LIMPE', HOME: 'CENTRO',
    ANDE: 'PF', ANDA: 'PF', ANDAR: 'PF', FRENTE: 'PF', AVANCE: 'PF',
    VOLTE: 'PT', VOLTA: 'PT', TRAS: 'PT', RECUE: 'PT',
    DIREITA: 'PD', ESQUERDA: 'PE', VIRE: 'PD ou PE', GIRE: 'PD ou PE', GIRA: 'PD ou PE', VIRA: 'PD ou PE',
    DESENHE: 'BAIXE', APAGUE: 'LIMPE', APAGA: 'LIMPE', APAGAR: 'LIMPE',
    MEIO: 'CENTRO', INICIO: 'CENTRO', REPITAR: 'REPITA',
  };
  const ENGLISH = new Set(['FD', 'FORWARD', 'BK', 'BACK', 'RT', 'RIGHT', 'LT', 'LEFT', 'REPEAT', 'PU', 'PENUP', 'PENDOWN', 'CS', 'CLEARSCREEN', 'CLEAN', 'HOME']);

  function fmt(n) {
    return String(Math.round(n * 1000) / 1000).replace('.', ',');
  }

  function levenshtein(a, b) {
    const m = a.length, n = b.length;
    const d = Array.from({ length: m + 1 }, (_, i) => [i]);
    for (let j = 1; j <= n; j++) d[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
    }
    return d[m][n];
  }

  /** Procura o comando mais parecido com uma palavra desconhecida. */
  function suggest(upper) {
    if (COMMON_MISTAKES[upper]) return COMMON_MISTAKES[upper];
    if (upper.length <= 2 && upper[0] === 'P') return 'PF, PT, PD ou PE';
    let best = null, bestD = Infinity;
    for (const alias of Object.keys(aliasMap)) {
      const d = levenshtein(upper, alias);
      if (d < bestD) { bestD = d; best = commands[aliasMap[alias]].name; }
    }
    const limit = upper.length <= 3 ? 1 : 2;
    return bestD <= limit ? best : null;
  }

  /* ---------------------------------------------------------------------
   * 1) TOKENIZE — separa o texto em fichas.
   *    Aceita qualquer combinação de espaços e quebras de linha.
   *    Comentários: tudo depois de ; ou // até o fim da linha.
   * ------------------------------------------------------------------- */
  function tokenize(src) {
    const tokens = [];
    const isDigit = (c) => c >= '0' && c <= '9';
    const isLetter = (c) => /[A-Za-zÀ-ÖØ-öø-ÿ_]/.test(c);
    let i = 0, line = 1;

    while (i < src.length) {
      const c = src[i];
      if (c === '\n') { line++; i++; continue; }
      if (/\s/.test(c)) { i++; continue; }
      if (c === ';' || (c === '/' && src[i + 1] === '/')) {
        while (i < src.length && src[i] !== '\n') i++;
        continue;
      }
      const start = i;
      const next = src[i + 1] || '';

      if (c === '[' || c === ']') {
        tokens.push({ type: c, text: c, start, end: i + 1, line });
        i++;
        continue;
      }

      // Números: 100, -50, 2.5, 2,5
      if (isDigit(c) || ((c === '-' || c === '+') && isDigit(next))) {
        let j = i;
        if (src[j] === '-' || src[j] === '+') j++;
        while (j < src.length && isDigit(src[j])) j++;
        if ((src[j] === '.' || src[j] === ',') && isDigit(src[j + 1] || '')) {
          j++;
          while (j < src.length && isDigit(src[j])) j++;
        }
        const text = src.slice(i, j);
        tokens.push({ type: 'number', value: parseFloat(text.replace(',', '.')), text, start, end: j, line });
        i = j;
        continue;
      }

      // Palavras: PF, REPITA, repita, PF100 (este último vira erro amigável)
      if (isLetter(c)) {
        let j = i;
        while (j < src.length && (isLetter(src[j]) || isDigit(src[j]))) j++;
        const text = src.slice(i, j);
        tokens.push({ type: 'word', text, upper: normalizeWord(text), start, end: j, line });
        i = j;
        continue;
      }

      tokens.push({ type: 'symbol', text: c, start, end: i + 1, line });
      i++;
    }
    return tokens;
  }

  /* ---------------------------------------------------------------------
   * 2) PARSE — monta a árvore do programa e gera erros pedagógicos.
   * ------------------------------------------------------------------- */
  function parse(src) {
    const tokens = tokenize(src);
    let pos = 0;

    const program = { type: 'program', body: [], source: src };
    while (pos < tokens.length) program.body.push(statement(false));
    return program;

    function at(t, info) {
      return new LogoError(Object.assign({ start: t.start, end: t.end, line: t.line }, info));
    }

    function statement(insideBlock) {
      const t = tokens[pos];

      if (t.type === 'number') throw loneNumber(t);
      if (t.type === ']') {
        throw at(t, {
          title: '🧩 Tem um ] sobrando.',
          message: insideBlock ? 'Este colchete fecha algo que não foi aberto.'
            : 'Cada [ precisa de um ] para fechar — e aqui há um ] a mais. Apague-o ou confira os colchetes do REPITA.',
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (t.type === '[') {
        throw at(t, {
          title: '🧩 Colchete [ fora do lugar.',
          message: 'Os colchetes [ ] só aparecem depois de REPITA e de um número.',
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (t.type === 'symbol') throw strangeSymbol(t);

      // Palavra
      const name = lookup(t.text);
      if (!name) throw unknownWord(t);
      const def = commands[name];
      pos++;

      const node = {
        type: 'command', name, word: t.text, args: [],
        start: t.start, end: t.end, line: t.line,
      };

      def.args.forEach((argDef) => {
        const e = expression(def, argDef, t);
        node.args.push(e);
        node.end = e.end;
      });

      if (def.block) {
        const open = tokens[pos];
        const n = node.args[0] ? node.args[0].text : '4';
        if (!open || open.type !== '[') {
          throw at(open || t, {
            start: t.start, end: (open || t).end,
            title: `🧩 Faltou abrir os colchetes depois de ${t.text.toUpperCase()} ${n}.`,
            message: 'Coloque os comandos que serão repetidos entre colchetes [ ].',
            snippet: `${t.text.toUpperCase()} ${n} [PF 100 PD 90]`,
          });
        }
        pos++;
        node.headerEnd = open.end;
        node.body = [];
        while (pos < tokens.length && tokens[pos].type !== ']') node.body.push(statement(true));
        const close = tokens[pos];
        if (!close) {
          throw at(open, {
            title: '🧩 Faltou fechar o colchete ].',
            message: `Você abriu um [ depois de ${t.text.toUpperCase()} ${n}, mas não fechou. Coloque um ] no fim dos comandos que serão repetidos.`,
            snippet: `${t.text.toUpperCase()} ${n} [PF 100 PD 90 ]`,
          });
        }
        if (!node.body.length) {
          throw at(open, {
            start: t.start, end: close.end,
            title: '🫙 Os colchetes estão vazios.',
            message: 'Coloque dentro deles os comandos que a tartaruga deve repetir.',
            snippet: `${t.text.toUpperCase()} ${n} [PF 100 PD 90]`,
          });
        }
        pos++;
        node.end = close.end;
      }
      return node;
    }

    /**
     * Lê um valor (parâmetro). Hoje: apenas números.
     * FUTURO: variáveis (:lado), contas e funções entram aqui.
     */
    function expression(def, argDef, cmdTok) {
      const t = tokens[pos];
      if (t && t.type === 'number') {
        pos++;
        return { type: 'number', value: t.value, text: t.text, start: t.start, end: t.end };
      }
      if (t && t.type === 'symbol' && t.text === ':') throw strangeSymbol(t);
      const cmd = cmdTok.text.toUpperCase();
      const isWordNumber = t && t.type === 'word' && /^(UM|DOIS|TRES|QUATRO|CINCO|DEZ|CEM|MIL|NOVENTA)$/.test(t.upper);
      throw at(cmdTok, {
        end: isWordNumber ? t.end : cmdTok.end,
        title: `⚠️ Está faltando um número depois de ${cmd}.`,
        message: argDef.missing + (isWordNumber ? ' Escreva o número com algarismos (por exemplo, 100).' : ''),
        snippet: def.block ? `${cmd} ??? [PF 100 PD 90]` : `${cmd} ???`,
      });
    }

    function loneNumber(t) {
      const prev = tokens[pos - 1];
      const afterNumber = prev && prev.type === 'number';
      return at(t, {
        title: `🔢 O número ${t.text} está sozinho.`,
        message: afterNumber
          ? `Parece que faltou um comando antes de ${t.text}. Cada comando recebe só um número.`
          : 'Todo número precisa vir logo depois de um comando.',
        snippet: 'PF 100\nPD 90',
      });
    }

    function strangeSymbol(t) {
      if (t.text === ',') {
        return at(t, {
          title: '✂️ Não precisa de vírgula.',
          message: 'Separe os comandos só com espaços ou quebras de linha.',
          snippet: 'PF 100 PD 90',
        });
      }
      if (t.text === '(' || t.text === ')' || t.text === '{' || t.text === '}') {
        return at(t, {
          title: `🧩 Aqui usamos colchetes [ ] em vez de ${t.text}.`,
          message: 'Os comandos repetidos ficam entre colchetes.',
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (t.text === ':') {
        return at(t, {
          title: '🚧 Variáveis ainda não estão disponíveis.',
          message: 'Nomes com dois-pontos (como :lado) chegarão numa próxima versão. Por enquanto, use números.',
          snippet: 'PF 100',
        });
      }
      return at(t, {
        title: `🤔 A tartaruga não conhece o símbolo “${t.text}”.`,
        message: 'Use apenas comandos, números e colchetes [ ].',
        snippet: 'REPITA 4 [PF 100 PD 90]',
      });
    }

    function unknownWord(t) {
      const up = t.upper;

      // PF100 → faltou espaço
      const glued = up.match(/^([A-Z]+?)(\d+)$/);
      if (glued && lookup(glued[1])) {
        const cmd = commands[lookup(glued[1])].name;
        return at(t, {
          title: `✂️ Faltou um espaço entre ${glued[1]} e ${glued[2]}.`,
          message: 'O comando e o número precisam estar separados por um espaço.',
          snippet: `${cmd} ${glued[2]}`,
        });
      }

      // PARA FRENTE → escrever junto
      if (up === 'PARA') {
        const nx = tokens[pos + 1];
        const dir = nx && nx.type === 'word' ? nx.upper : '';
        const map = { FRENTE: 'PF', TRAS: 'PT', DIREITA: 'PD', ESQUERDA: 'PE' };
        if (map[dir]) {
          return at(t, {
            end: nx.end,
            title: `✂️ Escreva “PARA ${dir}” de forma curta: ${map[dir]}.`,
            message: `A tartaruga entende ${map[dir]} (ou PARA${dir} tudo junto).`,
            snippet: `${map[dir]} ${map[dir] === 'PF' || map[dir] === 'PT' ? 100 : 90}`,
          });
        }
      }

      if (FUTURE_WORDS[up]) {
        return at(t, {
          title: `🚧 “${t.text}” ainda não está disponível.`,
          message: `Esse comando serve para ${FUTURE_WORDS[up]} e chegará numa próxima versão. ` +
            'Por enquanto use PF, PT, PD, PE, REPITA, BAIXE, LEVANTE, LIMPE e CENTRO.',
        });
      }

      const s = suggest(up);
      if (s && ENGLISH.has(up)) {
        return at(t, {
          title: `🌎 “${t.text}” é um comando em inglês.`,
          message: `Aqui usamos comandos em português: em vez de ${up}, use ${s}.`,
          snippet: exampleFor(s),
        });
      }
      return at(t, {
        title: `🤔 Parece que a tartaruga não entendeu “${t.text}”.`,
        message: s ? `Você quis dizer ${s}?`
          : 'Verifique se você escreveu PF, PT, PD, PE, REPITA, BAIXE, LEVANTE, LIMPE ou CENTRO corretamente.',
        snippet: s ? exampleFor(s) : undefined,
      });
    }
  }

  function exampleFor(name) {
    const d = commands[name];
    return d && d.doc ? d.doc.example.split('\n')[0] : undefined;
  }

  /* ---------------------------------------------------------------------
   * 3) RUN — percorre a árvore e produz a lista de ações.
   *    Cada ação guarda o "node" de origem (para destacar no editor) e a
   *    pilha de repetições (para mostrar "Repetição 2 de 4").
   * ------------------------------------------------------------------- */
  const NO_LOOPS = Object.freeze([]);

  function evalExpr(expr /* , ctx */) {
    switch (expr.type) {
      case 'number': return expr.value;
      // FUTURO: case 'variable': return ctx.vars[expr.name];
      // FUTURO: case 'binary':   return evalExpr(expr.left) + evalExpr(expr.right) ...
      default: throw new Error('Expressão desconhecida: ' + expr.type);
    }
  }

  function run(program, options) {
    const max = (options && options.maxActions) || MAX_ACTIONS;
    const actions = [];
    const loopStack = [];
    const stats = { moves: 0, turns: 0, distance: 0, loopIterations: 0 };

    const ctx = {
      node: null,
      loopStack,
      stats,
      procedures: Object.create(null), // FUTURO: PARA nome ... FIM
      emit(a) {
        if (actions.length >= max) {
          throw new LogoError({
            title: '😵 Ufa! São passos demais.',
            message: `Seu programa pede mais de ${max.toLocaleString('pt-BR')} ações. Diminua os números do REPITA.`,
            start: ctx.node.start, end: ctx.node.end, line: ctx.node.line,
          });
        }
        a.node = ctx.node;
        a.loops = loopStack.length ? loopStack.map((l) => ({ i: l.i, n: l.n })) : NO_LOOPS;
        if (a.type === 'move') { stats.moves++; stats.distance += Math.abs(a.dist); }
        if (a.type === 'turn') stats.turns++;
        actions.push(a);
      },
      error(info) {
        throw new LogoError(Object.assign({ start: ctx.node.start, end: ctx.node.end, line: ctx.node.line }, info));
      },
      execBlock(list) {
        for (const n of list) execNode(n);
      },
    };

    function execNode(node) {
      const def = commands[node.name];
      const values = node.args.map((e) => evalExpr(e, ctx));
      const prev = ctx.node;
      ctx.node = node;
      def.run(ctx, values, node);
      ctx.node = prev;
    }

    ctx.execBlock(program.body);
    return { actions, stats };
  }

  /** Análise estática: tamanho do código, comandos usados, REPITAs. */
  function analyze(program) {
    const used = [];
    let size = 0, repeats = 0, maxDepth = 0;
    (function walk(list, depth) {
      for (const n of list) {
        size++;
        if (!used.includes(n.name)) used.push(n.name);
        if (n.body) {
          repeats++;
          maxDepth = Math.max(maxDepth, depth + 1);
          walk(n.body, depth + 1);
        }
      }
    })(program.body, 0);
    return {
      size, commandsUsed: used, repeatCount: repeats, maxDepth,
      usesRepeat: repeats > 0, nestedRepeat: maxDepth > 1,
    };
  }

  /** Atalho: texto → { program, analysis, actions, stats }. Lança LogoError. */
  function compile(src) {
    const program = parse(src);
    const result = run(program);
    return { program, analysis: analyze(program), actions: result.actions, stats: result.stats };
  }

  const Logo = {
    tokenize, parse, run, analyze, compile, defineCommand, lookup, normalizeWord,
    commands, FUTURE_WORDS, LogoError, MAX_ACTIONS, MAX_REPEAT,
  };

  root.Logo = Logo;
  if (typeof module === 'object' && module.exports) module.exports = Logo;
})(typeof window !== 'undefined' ? window : globalThis);
