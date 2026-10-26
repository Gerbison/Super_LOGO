/* =========================================================================
 * logo.js — Interpretador da linguagem da Tartaruga
 * -------------------------------------------------------------------------
 * Linguagem educacional PRÓPRIA, inspirada nas ideias gerais da LOGO.
 *
 * O código do aluno passa por 3 etapas:
 *
 *   1. tokenize(código) → "fichas": palavras, números, :valores, contas e colchetes.
 *   2. parse(código)    → árvore de sintaxe (AST): comandos, blocos REPITA,
 *                         procedimentos (PARA ... FIM), SE e chamadas.
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
 * Linguagem avançada (Reinos 5 e 6): PARA/FIM com parâmetros (:LADO),
 * contas (+ - * / e parênteses), comparações, SE [ ] SENAO [ ], PARE e
 * REPCONT — o bastante para espirais, fractais e recursão.
 *
 * Pontos de extensão:
 *   - evalExpr(): novos tipos de valor (funções como SEN, COS...).
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
        try {
          ctx.execBlock(node.body);
        } finally {
          ctx.loopStack.pop(); // também quando um PARE interrompe o bloco
        }
      }
    },
  });

  /* ---------------------------------------------------------------------
   * Linguagem avançada (Reinos 5 e 6 — O Dao dos Algoritmos)
   * Não são comandos do registro: o parser trata estas palavras à parte.
   *   PARA nome :a :b ... FIM   cria um procedimento (um comando novo)
   *   SE condição [ ... ]       executa só se a condição for verdadeira
   *     SENAO [ ... ]           (opcional) caso contrário
   *   PARE                      encerra o procedimento atual
   *   REPCONT                   número da volta atual do REPITA (um valor)
   *   :nome                     valor recebido pelo procedimento
   *   + - * / ( )  = < > <= >= <>   contas e comparações
   * ------------------------------------------------------------------- */
  const KEYWORDS = new Set(['PARA', 'APRENDA', 'FIM', 'SE', 'SENAO', 'PARE', 'REPCONT']);
  const MAX_DEPTH = 200;      // chamadas de procedimento aninhadas (recursão)

  /** Documentação das palavras avançadas (Biblioteca de Comandos e Ajuda). */
  const KEYWORD_DOCS = [
    {
      name: 'PARA … FIM', title: 'CRIAR UM COMANDO', icon: '📜 ✨', group: 'Avançado (Reino 5)',
      color: '#0f766e', hl: '#5eead4', label: 'Cria um comando novo', short: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM',
      note: 'procedimento com parâmetro',
      text: 'Ensina um comando novo à tartaruga. Os valores com dois-pontos (como :LADO) são os parâmetros: cada vez que o comando é usado, recebe um número diferente.',
      example: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM\nQUADRADO 50\nQUADRADO 100',
    },
    {
      name: 'REPCONT', title: 'NÚMERO DA VOLTA', icon: '🔢 1 2 3', group: 'Avançado (Reino 5)',
      color: '#b45309', hl: '#fbbf24', label: 'Número da volta', short: 'REPITA 30 [PF REPCONT * 5 PD 90]',
      note: '1 na 1ª volta, 2 na 2ª...',
      text: 'Dentro de um REPITA, vale o número da volta atual: 1, 2, 3... Ótimo para espirais que crescem.',
      example: 'REPITA 40 [PF REPCONT * 5 PD 90]',
    },
    {
      name: 'SE … [ ]', title: 'DECIDIR', icon: '🔀 ?', group: 'Avançado (Reino 5)',
      color: '#be185d', hl: '#f472b6', label: 'Decide o que fazer', short: 'SE :N = 0 [PARE]',
      note: 'condição + bloco',
      text: 'Executa o bloco só se a condição for verdadeira. Comparações: = < > <= >= <>. Pode ter SENAO [ ... ] depois.',
      example: 'PARA DEGRAU :N\n  SE :N = 0 [PARE]\n  PF 20 PD 90 PF 20 PE 90\n  DEGRAU :N - 1\nFIM\nDEGRAU 6',
    },
    {
      name: 'PARE', title: 'PARAR O PROCEDIMENTO', icon: '✋', group: 'Avançado (Reino 5)',
      color: '#991b1b', hl: '#f87171', label: 'Encerra o procedimento', short: 'SE :N = 0 [PARE]',
      note: 'fim da recursão',
      text: 'Termina o procedimento atual na hora. É o que faz uma recursão (um comando que chama a si mesmo) parar.',
      example: 'PARA ESPIRAL :T\n  SE :T > 150 [PARE]\n  PF :T PD 90\n  ESPIRAL :T + 10\nFIM\nESPIRAL 10',
    },
  ];

  /* Palavras que ainda não existem, mas que já respondem com carinho. */
  const FUTURE_WORDS = {
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
    TO: 'PARA', END: 'FIM', IF: 'SE', STOP: 'PARE', REPCOUNT: 'REPCONT',
    ANDE: 'PF', ANDA: 'PF', ANDAR: 'PF', FRENTE: 'PF', AVANCE: 'PF',
    VOLTE: 'PT', VOLTA: 'PT', TRAS: 'PT', RECUE: 'PT',
    DIREITA: 'PD', ESQUERDA: 'PE', VIRE: 'PD ou PE', GIRE: 'PD ou PE', GIRA: 'PD ou PE', VIRA: 'PD ou PE',
    DESENHE: 'BAIXE', APAGUE: 'LIMPE', APAGA: 'LIMPE', APAGAR: 'LIMPE',
    MEIO: 'CENTRO', INICIO: 'CENTRO', REPITAR: 'REPITA', SENÃO: 'SENAO', ENTAO: 'SE … [ ]',
  };
  const ENGLISH = new Set(['FD', 'FORWARD', 'BK', 'BACK', 'RT', 'RIGHT', 'LT', 'LEFT', 'REPEAT', 'PU', 'PENUP', 'PENDOWN', 'CS', 'CLEARSCREEN', 'CLEAN', 'HOME', 'TO', 'END', 'IF', 'STOP', 'REPCOUNT']);

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

  /** Procura o comando (ou procedimento) mais parecido com uma palavra desconhecida. */
  function suggest(upper, procNames) {
    if (COMMON_MISTAKES[upper]) return COMMON_MISTAKES[upper];
    if (upper.length <= 2 && upper[0] === 'P') return 'PF, PT, PD ou PE';
    let best = null, bestD = Infinity;
    const candidates = Object.keys(aliasMap).map((a) => [a, commands[aliasMap[a]].name])
      .concat((procNames || []).map((p) => [p, p]))
      .concat(['PARA', 'FIM', 'SE', 'SENAO', 'PARE', 'REPCONT'].map((k) => [k, k]));
    for (const [alias, name] of candidates) {
      const d = levenshtein(upper, alias);
      if (d < bestD) { bestD = d; best = name; }
    }
    const limit = upper.length <= 3 ? 1 : 2;
    return bestD <= limit ? best : null;
  }

  /* ---------------------------------------------------------------------
   * 1) TOKENIZE — separa o texto em fichas.
   *    Aceita qualquer combinação de espaços e quebras de linha.
   *    Comentários: tudo depois de ; ou // até o fim da linha.
   *    Um "-" antes de número vira sinal (PT -50) — exceto logo depois de um
   *    valor, onde é conta (:N - 1, :N-1).
   * ------------------------------------------------------------------- */
  function tokenize(src) {
    const tokens = [];
    const isDigit = (c) => c >= '0' && c <= '9';
    const isLetter = (c) => /[A-Za-zÀ-ÖØ-öø-ÿ_]/.test(c);
    const prevIsValue = () => {
      const p = tokens[tokens.length - 1];
      return !!p && (p.type === 'number' || p.type === 'var' || (p.type === 'op' && p.text === ')') ||
        (p.type === 'word' && p.upper === 'REPCONT'));
    };
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

      // Números: 100, -50, 2.5, 2,5. Depois de um valor, "-1" colado no número
      // e com espaço antes é negativo (DRAGAO :N - 1 -1); "- 1" e "-1" sem
      // espaço antes são conta — a mesma regra da LOGO original.
      const signedNumber = (c === '-' || c === '+') && isDigit(next) &&
        (!prevIsValue() || /\s/.test(src[i - 1] || ''));
      if (isDigit(c) || signedNumber) {
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

      // Valores de procedimento: :LADO
      if (c === ':' && isLetter(next)) {
        let j = i + 1;
        while (j < src.length && (isLetter(src[j]) || isDigit(src[j]))) j++;
        const text = src.slice(i, j);
        tokens.push({ type: 'var', text, name: normalizeWord(text.slice(1)), start, end: j, line });
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

      // Contas e comparações
      const two = c + next;
      if (two === '<=' || two === '>=' || two === '<>') {
        tokens.push({ type: 'op', text: two, start, end: i + 2, line });
        i += 2;
        continue;
      }
      if ('+-*/()=<>'.includes(c)) {
        tokens.push({ type: 'op', text: c, start, end: i + 1, line });
        i++;
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
  const DIRECTION_SHORTCUT = { FRENTE: 'PF', TRAS: 'PT', DIREITA: 'PD', ESQUERDA: 'PE' };

  function parse(src) {
    const tokens = tokenize(src);
    let pos = 0;

    const at = (t, info) => new LogoError(Object.assign({ start: t.start, end: t.end, line: t.line }, info));

    // 1ª passada: descobre os procedimentos (assim dá para chamá-los antes de
    // definir, e um procedimento pode chamar a si mesmo — recursão).
    const procs = Object.create(null);
    for (let k = 0; k < tokens.length; k++) {
      const t = tokens[k];
      if (t.type !== 'word' || (t.upper !== 'PARA' && t.upper !== 'APRENDA')) continue;
      const nameTok = tokens[k + 1];
      if (!nameTok || nameTok.type !== 'word' || DIRECTION_SHORTCUT[nameTok.upper]) continue;
      const params = [];
      for (let j = k + 2; j < tokens.length && tokens[j].type === 'var'; j++) params.push(tokens[j].name);
      if (procs[nameTok.upper]) {
        throw at(nameTok, {
          title: `📜 Já existe um comando chamado ${nameTok.upper}.`,
          message: 'Cada PARA precisa de um nome diferente. Troque o nome de um deles.',
          snippet: `PARA ${nameTok.upper}2 ...\nFIM`,
        });
      }
      procs[nameTok.upper] = { name: nameTok.upper, params };
    }
    const procNames = Object.keys(procs);

    const program = { type: 'program', body: [], source: src, procedures: Object.create(null) };
    while (pos < tokens.length) program.body.push(statement({ inBlock: false, inProc: null }));
    return program;

    /* ------------------------------ comandos ------------------------------ */
    function statement(ctx) {
      const t = tokens[pos];

      if (t.type === 'number') throw loneNumber(t);
      if (t.type === ']') {
        throw at(t, {
          title: '🧩 Tem um ] sobrando.',
          message: ctx.inBlock ? 'Este colchete fecha algo que não foi aberto.'
            : 'Cada [ precisa de um ] para fechar — e aqui há um ] a mais. Apague-o ou confira os colchetes do REPITA.',
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (t.type === '[') {
        throw at(t, {
          title: '🧩 Colchete [ fora do lugar.',
          message: 'Os colchetes [ ] só aparecem depois de REPITA (e de um número) ou de SE (e de uma condição).',
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (t.type === 'symbol' || t.type === 'op') throw strangeSymbol(t);
      if (t.type === 'var') {
        throw at(t, {
          title: `🔢 O valor ${t.text} está sozinho.`,
          message: `Um valor como ${t.text} precisa vir depois de um comando, por exemplo PF ${t.text}.`,
          snippet: `PF ${t.text}`,
        });
      }

      const up = t.upper;
      if ((up === 'PARA' || up === 'APRENDA') && !isDirectionShortcut()) return defineProc(t, ctx);
      if (up === 'FIM') {
        throw at(t, {
          title: '📜 FIM sem PARA.',
          message: 'FIM fecha um procedimento que começou com PARA. Aqui não há nenhum PARA aberto.',
          snippet: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM',
        });
      }
      if (up === 'SE') return ifStatement(t, ctx);
      if (up === 'SENAO') {
        throw at(t, {
          title: '🔀 SENAO precisa vir logo depois de um SE.',
          message: 'Use assim: SE condição [ ... ] SENAO [ ... ]',
          snippet: 'SE :N = 0 [PARE] SENAO [PF :N]',
        });
      }
      if (up === 'PARE') {
        pos++;
        return { type: 'stop', name: 'PARE', start: t.start, end: t.end, line: t.line };
      }
      if (up === 'REPCONT') {
        throw at(t, {
          title: '🔢 REPCONT é um número, não um comando.',
          message: 'Use REPCONT como valor de um comando, dentro de um REPITA. Exemplo: PF REPCONT * 5',
          snippet: 'REPITA 30 [PF REPCONT * 5 PD 90]',
        });
      }

      if (procs[up]) return callProc(t);

      const name = lookup(t.text);
      if (!name) throw unknownWord(t);
      const def = commands[name];
      pos++;

      const node = {
        type: 'command', name, word: t.text, args: [],
        start: t.start, end: t.end, line: t.line,
      };

      def.args.forEach((argDef) => {
        const e = argument(t, argDef.missing, def.block ? `${t.text.toUpperCase()} ??? [PF 100 PD 90]` : `${t.text.toUpperCase()} ???`);
        node.args.push(e);
        node.end = e.end;
      });

      if (def.block) {
        const n = node.args[0] ? node.args[0].text : '4';
        const head = `${t.text.toUpperCase()} ${n}`;
        const b = block(t, head, ctx, 'repetidos');
        node.headerEnd = b.headerEnd;
        node.body = b.body;
        node.end = b.end;
      }
      return node;
    }

    function isDirectionShortcut() {
      const nx = tokens[pos + 1];
      return !!(nx && nx.type === 'word' && DIRECTION_SHORTCUT[nx.upper]);
    }

    /** Lê [ comandos ]. head = texto do cabeçalho para as mensagens. */
    function block(t, head, ctx, what) {
      const open = tokens[pos];
      if (!open || open.type !== '[') {
        const isParen = open && open.type === 'op' && open.text === '(';
        throw at(open || t, {
          start: t.start, end: (open || t).end,
          title: isParen ? '🧩 Aqui usamos colchetes [ ] em vez de (.' : `🧩 Faltou abrir os colchetes depois de ${head}.`,
          message: `Coloque os comandos ${what} entre colchetes [ ].`,
          snippet: `${head} [PF 100 PD 90]`,
        });
      }
      pos++;
      const body = [];
      while (pos < tokens.length && tokens[pos].type !== ']') {
        if (tokens[pos].type === 'word' && tokens[pos].upper === 'FIM' && ctx.inProc) break;
        body.push(statement({ inBlock: true, inProc: ctx.inProc }));
      }
      const close = tokens[pos];
      if (!close || close.type !== ']') {
        throw at(open, {
          title: '🧩 Faltou fechar o colchete ].',
          message: `Você abriu um [ depois de ${head}, mas não fechou. Coloque um ] no fim dos comandos ${what}.`,
          snippet: `${head} [PF 100 PD 90 ]`,
        });
      }
      if (!body.length) {
        throw at(open, {
          start: t.start, end: close.end,
          title: '🫙 Os colchetes estão vazios.',
          message: `Coloque dentro deles os comandos ${what}.`,
          snippet: `${head} [PF 100 PD 90]`,
        });
      }
      pos++;
      return { body, headerEnd: open.end, end: close.end };
    }

    function defineProc(t, ctx) {
      if (ctx.inBlock || ctx.inProc) {
        throw at(t, {
          title: '📜 PARA não pode ficar dentro de outro bloco.',
          message: 'Crie cada procedimento separado, fora de REPITA, SE ou de outro PARA.',
          snippet: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM\nQUADRADO 80',
        });
      }
      pos++;
      const nameTok = tokens[pos];
      if (!nameTok || nameTok.type !== 'word') {
        throw at(t, {
          title: '📜 Depois de PARA vem o nome do novo comando.',
          message: 'Escolha um nome (sem espaços) e, se quiser, os valores que ele recebe com dois-pontos.',
          snippet: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM',
        });
      }
      if (lookup(nameTok.text) || KEYWORDS.has(nameTok.upper)) {
        throw at(nameTok, {
          title: `📜 ${nameTok.upper} já é uma palavra da tartaruga.`,
          message: 'Escolha outro nome para o seu comando (por exemplo, QUADRADO, PETALA, ESPIRAL).',
          snippet: 'PARA MEUQUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM',
        });
      }
      pos++;
      const params = [];
      while (pos < tokens.length && tokens[pos].type === 'var') { params.push(tokens[pos].name); pos++; }
      const node = {
        type: 'define', name: nameTok.upper, params, body: [],
        start: t.start, end: nameTok.end, headerEnd: (tokens[pos - 1] || nameTok).end, line: t.line,
      };
      const inner = { inBlock: false, inProc: node.name };
      while (pos < tokens.length && !(tokens[pos].type === 'word' && tokens[pos].upper === 'FIM')) {
        node.body.push(statement(inner));
      }
      const fim = tokens[pos];
      if (!fim) {
        throw at(t, {
          end: nameTok.end,
          title: `📜 Faltou o FIM do procedimento ${node.name}.`,
          message: 'Todo PARA termina com a palavra FIM, numa linha própria, depois dos comandos.',
          snippet: `PARA ${node.name} ...\n  (comandos)\nFIM`,
        });
      }
      if (!node.body.length) {
        throw at(t, {
          end: fim.end,
          title: `🫙 O procedimento ${node.name} está vazio.`,
          message: 'Coloque entre o PARA e o FIM os comandos que ele deve executar.',
          snippet: `PARA ${node.name}\n  PF 100 PD 90\nFIM`,
        });
      }
      pos++;
      node.end = fim.end;
      program.procedures[node.name] = node;
      return node;
    }

    function callProc(t) {
      const p = procs[t.upper];
      pos++;
      const node = { type: 'call', name: p.name, word: t.text, args: [], start: t.start, end: t.end, line: t.line };
      p.params.forEach((param) => {
        const e = argument(t,
          `${p.name} precisa de ${p.params.length} valor${p.params.length > 1 ? 'es' : ''}: ${p.params.map((x) => ':' + x).join(' ')}.`,
          `${p.name} ${p.params.map(() => '???').join(' ')}`);
        node.args.push(e);
        node.end = e.end;
      });
      return node;
    }

    function ifStatement(t, ctx) {
      pos++;
      const cond = expr();
      if (!cond) {
        throw at(t, {
          title: '🔀 SE precisa de uma condição.',
          message: 'Depois de SE escreva uma comparação, como :N = 0 ou :T < 5, e depois o bloco [ ].',
          snippet: 'SE :N = 0 [PARE]',
        });
      }
      const head = `SE ${cond.text}`;
      const b = block(t, head, ctx, 'que só acontecem quando a condição é verdadeira');
      const node = { type: 'if', name: 'SE', cond, body: b.body, elseBody: null, start: t.start, end: b.end, headerEnd: b.headerEnd, line: t.line };
      const nx = tokens[pos];
      if (nx && nx.type === 'word' && nx.upper === 'SENAO') {
        pos++;
        const e = block(nx, 'SENAO', ctx, 'do caso contrário');
        node.elseBody = e.body;
        node.end = e.end;
      }
      return node;
    }

    /* ------------------------------ valores ------------------------------- */
    /** Um parâmetro de comando: uma expressão obrigatória. */
    function argument(cmdTok, missing, snippet) {
      const e = expr();
      if (e) return e;
      const t = tokens[pos];
      const cmd = cmdTok.text.toUpperCase();
      const isWordNumber = t && t.type === 'word' && /^(UM|DOIS|TRES|QUATRO|CINCO|DEZ|CEM|MIL|NOVENTA)$/.test(t.upper);
      throw at(cmdTok, {
        end: isWordNumber ? t.end : cmdTok.end,
        title: `⚠️ Está faltando um número depois de ${cmd}.`,
        message: missing + (isWordNumber ? ' Escreva o número com algarismos (por exemplo, 100).' : ''),
        snippet,
      });
    }

    function isOp(t, list) { return !!t && t.type === 'op' && list.includes(t.text); }

    /** expr := soma [comparação soma]. Devolve null se não houver valor aqui. */
    function expr() {
      const left = sum();
      if (!left) return null;
      const t = tokens[pos];
      if (isOp(t, ['=', '<', '>', '<=', '>=', '<>'])) {
        pos++;
        const right = sum() || missingOperand(t);
        return bin(t.text, left, right);
      }
      return left;
    }

    function sum() {
      let left = term();
      if (!left) return null;
      while (isOp(tokens[pos], ['+', '-'])) {
        const t = tokens[pos++];
        left = bin(t.text, left, term() || missingOperand(t));
      }
      return left;
    }

    function term() {
      let left = unary();
      if (!left) return null;
      while (isOp(tokens[pos], ['*', '/'])) {
        const t = tokens[pos++];
        left = bin(t.text, left, unary() || missingOperand(t));
      }
      return left;
    }

    function unary() {
      const t = tokens[pos];
      if (isOp(t, ['-'])) {
        pos++;
        const arg = unary() || missingOperand(t);
        return withText({ type: 'neg', arg, start: t.start, end: arg.end });
      }
      return primary();
    }

    function primary() {
      const t = tokens[pos];
      if (!t) return null;
      if (t.type === 'number') { pos++; return { type: 'number', value: t.value, text: t.text, start: t.start, end: t.end }; }
      if (t.type === 'var') { pos++; return { type: 'var', name: t.name, text: t.text, start: t.start, end: t.end, line: t.line }; }
      if (t.type === 'word' && t.upper === 'REPCONT') { pos++; return { type: 'repcount', text: t.text, start: t.start, end: t.end }; }
      if (isOp(t, ['('])) {
        pos++;
        const inner = expr();
        const close = tokens[pos];
        if (!inner || !isOp(close, [')'])) {
          throw at(t, {
            title: '🧩 Faltou fechar o parêntese ).',
            message: 'Parênteses servem para contas, como (:T + 10) / 2. Cada ( precisa de um ).',
            snippet: 'PF (:T + 10) / 2',
          });
        }
        pos++;
        return withText({ type: 'group', arg: inner, start: t.start, end: close.end });
      }
      return null;
    }

    function bin(op, left, right) {
      return withText({ type: 'binary', op, left, right, start: left.start, end: right.end });
    }

    function withText(node) {
      node.text = src.slice(node.start, node.end);
      return node;
    }

    function missingOperand(opTok) {
      throw at(opTok, {
        title: `🔢 Faltou um número depois de ${opTok.text}.`,
        message: 'Toda conta precisa de um valor dos dois lados, como :N - 1 ou :T / 3.',
        snippet: 'KOCH :T / 3  :N - 1',
      });
    }

    /* ------------------------------- erros -------------------------------- */
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
          message: 'Os comandos repetidos ficam entre colchetes. Parênteses só servem para contas, como PF (:T + 10) / 2.',
          snippet: 'REPITA 4 [PF 100 PD 90]',
        });
      }
      if (t.text === ':') {
        return at(t, {
          title: '🔢 Depois dos dois-pontos vem um nome.',
          message: 'Valores de procedimento são escritos juntos, como :LADO ou :N.',
          snippet: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM',
        });
      }
      if (t.type === 'op') {
        return at(t, {
          title: `🔢 A conta com “${t.text}” está fora de lugar.`,
          message: 'Contas só aparecem como valor de um comando, por exemplo PF :T / 2.',
          snippet: 'PF :T / 2',
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
      if (up === 'PARA' || up === 'APRENDA') {
        const nx = tokens[pos + 1];
        const dir = nx && nx.type === 'word' ? nx.upper : '';
        const sc = DIRECTION_SHORTCUT[dir];
        if (sc) {
          return at(t, {
            end: nx.end,
            title: `✂️ Escreva “PARA ${dir}” de forma curta: ${sc}.`,
            message: `A tartaruga entende ${sc} (ou PARA${dir} tudo junto).`,
            snippet: `${sc} ${sc === 'PF' || sc === 'PT' ? 100 : 90}`,
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

      const s = suggest(up, procNames);
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
          : 'Verifique se você escreveu PF, PT, PD, PE, REPITA, BAIXE, LEVANTE, LIMPE ou CENTRO corretamente.' +
            (procNames.length ? ` Seus comandos criados: ${procNames.join(', ')}.` : ''),
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
  const STOP = { stop: true }; // sinal interno do PARE

  function evalExpr(e, ctx) {
    let v;
    switch (e.type) {
      case 'number': return e.value;
      case 'group': return evalExpr(e.arg, ctx);
      case 'neg': return -evalExpr(e.arg, ctx);
      case 'var': {
        for (let k = ctx.frames.length - 1; k >= 0; k--) {
          if (e.name in ctx.frames[k].vars) return ctx.frames[k].vars[e.name];
        }
        return ctx.error({
          start: e.start, end: e.end,
          title: `🤔 A tartaruga não conhece ${e.text}.`,
          message: ctx.frames.length > 1
            ? `${e.text} não é um dos valores que este procedimento recebe. Confira o nome escrito depois do PARA.`
            : `Valores como ${e.text} só existem dentro de um procedimento que os recebe: PARA NOME ${e.text} ... FIM.`,
          snippet: `PARA QUADRADO ${e.text}\n  REPITA 4 [PF ${e.text} PD 90]\nFIM`,
        });
      }
      case 'repcount': {
        const top = ctx.loopStack[ctx.loopStack.length - 1];
        if (!top) {
          return ctx.error({
            start: e.start, end: e.end,
            title: '🔢 REPCONT só funciona dentro de um REPITA.',
            message: 'REPCONT é o número da volta atual: 1 na primeira, 2 na segunda...',
            snippet: 'REPITA 30 [PF REPCONT * 5 PD 90]',
          });
        }
        return top.i;
      }
      case 'binary': {
        const a = evalExpr(e.left, ctx), b = evalExpr(e.right, ctx);
        switch (e.op) {
          case '+': v = a + b; break;
          case '-': v = a - b; break;
          case '*': v = a * b; break;
          case '/':
            if (b === 0) {
              return ctx.error({
                start: e.start, end: e.end,
                title: '➗ Divisão por zero.',
                message: `Em ${e.text} o divisor vale 0 — não dá para dividir por zero.`,
              });
            }
            v = a / b; break;
          case '=': v = Math.abs(a - b) < 1e-9 ? 1 : 0; break;
          case '<>': v = Math.abs(a - b) >= 1e-9 ? 1 : 0; break;
          case '<': v = a < b ? 1 : 0; break;
          case '>': v = a > b ? 1 : 0; break;
          case '<=': v = a <= b + 1e-9 ? 1 : 0; break;
          case '>=': v = a >= b - 1e-9 ? 1 : 0; break;
          default: throw new Error('Operador desconhecido: ' + e.op);
        }
        if (!Number.isFinite(v)) {
          return ctx.error({ start: e.start, end: e.end, title: '🔢 Essa conta deu um número grande demais.', message: `Confira a conta ${e.text}.` });
        }
        return v;
      }
      default: throw new Error('Expressão desconhecida: ' + e.type);
    }
  }

  function run(program, options) {
    const max = (options && options.maxActions) || MAX_ACTIONS;
    const actions = [];
    const loopStack = [];
    const stats = { moves: 0, turns: 0, distance: 0, loopIterations: 0, calls: 0, maxDepth: 0 };

    const ctx = {
      node: null,
      loopStack,
      stats,
      frames: [{ name: null, vars: Object.create(null) }],
      procedures: program.procedures || Object.create(null),
      emit(a) {
        if (actions.length >= max) {
          throw new LogoError({
            title: '😵 Ufa! São passos demais.',
            message: `Seu programa pede mais de ${max.toLocaleString('pt-BR')} ações. Diminua os números do REPITA (ou o nível da recursão).`,
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
      const prev = ctx.node;
      ctx.node = node;
      try {
        switch (node.type) {
          case 'command': {
            const values = node.args.map((e) => evalExpr(e, ctx));
            commands[node.name].run(ctx, values, node);
            break;
          }
          case 'define': break; // a definição só guarda o procedimento
          case 'call': callProc(node); break;
          case 'if':
            if (evalExpr(node.cond, ctx)) ctx.execBlock(node.body);
            else if (node.elseBody) ctx.execBlock(node.elseBody);
            break;
          case 'stop': throw STOP;
          default: throw new Error('Nó desconhecido: ' + node.type);
        }
      } finally {
        ctx.node = prev;
      }
    }

    function callProc(node) {
      const def = ctx.procedures[node.name];
      const values = node.args.map((e) => evalExpr(e, ctx));
      if (ctx.frames.length > MAX_DEPTH) {
        ctx.error({
          title: '🌀 Recursão sem fim?',
          message: `${node.name} chamou a si mesmo mais de ${MAX_DEPTH} vezes seguidas. Confira se existe um SE ... [PARE] que faça a recursão parar.`,
          snippet: `PARA ${node.name} :N\n  SE :N = 0 [PARE]\n  ...\n  ${node.name} :N - 1\nFIM`,
        });
      }
      const vars = Object.create(null);
      def.params.forEach((p, i) => { vars[p] = values[i]; });
      ctx.frames.push({ name: def.name, vars });
      stats.calls++;
      stats.maxDepth = Math.max(stats.maxDepth, ctx.frames.length - 1);
      try {
        ctx.execBlock(def.body);
      } catch (e) {
        if (e !== STOP) throw e;
      } finally {
        ctx.frames.pop();
      }
    }

    try {
      ctx.execBlock(program.body);
    } catch (e) {
      if (e !== STOP) throw e; // PARE fora de procedimento: encerra o programa
    }
    return { actions, stats };
  }

  /** Análise estática: tamanho do código, comandos usados, REPITAs, procedimentos. */
  function analyze(program) {
    const used = [];
    const use = (n) => { if (!used.includes(n)) used.push(n); };
    let size = 0, repeats = 0, maxDepth = 0, procCount = 0, usesRepcount = false, recursive = false;

    function walkExpr(e) {
      if (!e) return;
      if (e.type === 'repcount') usesRepcount = true;
      ['arg', 'left', 'right'].forEach((k) => walkExpr(e[k]));
    }
    function containsCall(list, name) {
      return list.some((n) => (n.type === 'call' && n.name === name) ||
        (n.body && containsCall(n.body, name)) || (n.elseBody && containsCall(n.elseBody, name)));
    }
    (function walk(list, repDepth) {
      for (const n of list) {
        size++;
        (n.args || []).forEach(walkExpr);
        if (n.cond) walkExpr(n.cond);
        if (n.type === 'command') use(n.name);
        if (n.type === 'define') {
          use('PARA');
          procCount++;
          if (containsCall(n.body, n.name)) recursive = true;
          walk(n.body, 0);
          continue;
        }
        if (n.type === 'if') { use('SE'); walk(n.body, repDepth); if (n.elseBody) walk(n.elseBody, repDepth); continue; }
        if (n.type === 'stop') use('PARE');
        if (n.type === 'call') use('CHAMADA');
        if (n.name === 'REPITA') {
          repeats++;
          maxDepth = Math.max(maxDepth, repDepth + 1);
          walk(n.body, repDepth + 1);
        }
      }
    })(program.body, 0);
    if (usesRepcount) use('REPCONT');
    if (recursive) use('RECURSAO');
    return {
      size, commandsUsed: used.filter((c) => c !== 'CHAMADA' && c !== 'RECURSAO'), repeatCount: repeats, maxDepth,
      usesRepeat: repeats > 0, nestedRepeat: maxDepth > 1,
      usesProcedures: procCount > 0, procedureCount: procCount, recursive, usesRepcount,
      techniques: used,
    };
  }

  /** Atalho: texto → { program, analysis, actions, stats }. Lança LogoError. */
  function compile(src) {
    const program = parse(src);
    const result = run(program);
    return { program, analysis: analyze(program), actions: result.actions, stats: result.stats };
  }

  /** Palavra-chave da linguagem avançada? (usado para colorir o editor) */
  /** Linhas com código (ignora linhas vazias e comentários com ; ou //). */
  function countLines(src) {
    return String(src || '').split('\n')
      .map((l) => l.replace(/;.*$/, '').replace(/\/\/.*$/, '').trim())
      .filter(Boolean).length;
  }

  function isKeyword(word) {
    return KEYWORDS.has(normalizeWord(word));
  }

  const Logo = {
    tokenize, parse, run, analyze, compile, defineCommand, lookup, normalizeWord, isKeyword, countLines,
    commands, KEYWORD_DOCS, FUTURE_WORDS, LogoError, MAX_ACTIONS, MAX_REPEAT, MAX_DEPTH,
  };

  root.Logo = Logo;
  if (typeof module === 'object' && module.exports) module.exports = Logo;
})(typeof window !== 'undefined' ? window : globalThis);
