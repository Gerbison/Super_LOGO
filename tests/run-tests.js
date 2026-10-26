/* =========================================================================
 * Testes automáticos (opcionais) — rodar com:  node tests/run-tests.js
 * Não são necessários para usar o site; servem para o professor/desenvolvedor
 * conferir que interpretador, ângulos, REPITA e níveis continuam corretos.
 * ========================================================================= */
'use strict';
const assert = require('assert');
const Logo = require('../js/logo.js');
const Turtle = require('../js/turtle.js');
require('../js/checker.js');
const Levels = require('../js/levels.js');
const Fractals = require('../js/fractals.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; } catch (e) { failed++; console.log('✗ ' + name + '\n   ' + e.message); }
}

function draw(code) {
  const r = Logo.compile(code);
  const state = Turtle.simulate(r.actions, Turtle.createState());
  return { ...r, state };
}
function errorOf(code) {
  try { Logo.compile(code); } catch (e) { if (e instanceof Logo.LogoError) return e; throw e; }
  return null;
}
const near = (a, b, eps = 1e-6) => Math.abs(a - b) < eps;

/* ----------------------------- Interpretador ---------------------------- */
test('REPITA 4 [PF 100 PD 90] expande para 8 ações na ordem certa', () => {
  const r = Logo.compile('REPITA 4 [PF 100 PD 90]');
  assert.deepStrictEqual(r.actions.map((a) => a.type + (a.dist ?? a.angle)), ['move100', 'turn90', 'move100', 'turn90', 'move100', 'turn90', 'move100', 'turn90']);
  assert.strictEqual(r.actions[2].loops[0].i, 2);
  assert.strictEqual(r.actions[2].loops[0].n, 4);
});

test('espaços, quebras de linha, minúsculas e acentos', () => {
  const a = Logo.compile('PF 100 PD 90').actions.length;
  const b = Logo.compile('PF 100\nPD 90').actions.length;
  const c = Logo.compile('  pf   100\n\n\tpd 90  ').actions.length;
  const d = Logo.compile('répita 2 [ pf 10 ]').actions.length;
  assert.deepStrictEqual([a, b, c, d], [2, 2, 2, 2]);
});

test('comentários com ; e // são ignorados', () => {
  assert.strictEqual(Logo.compile('PF 10 ; anda\n// gira\nPD 90').actions.length, 2);
});

test('números decimais com vírgula e ponto, e negativos', () => {
  const s = draw('PF 2,5 PF 2.5 PT -5').state;
  assert.ok(near(s.y, 10));
});

test('quadrado volta ao início olhando para cima', () => {
  const s = draw('REPITA 4 [PF 100 PD 90]').state;
  assert.ok(near(s.x, 0) && near(s.y, 0) && s.heading === 0);
  assert.strictEqual(s.segments.length, 4);
});

test('ângulos: PD 90 aponta para a direita, PE 90 para a esquerda', () => {
  assert.ok(near(draw('PD 90 PF 100').state.x, 100));
  assert.ok(near(draw('PE 90 PF 100').state.x, -100));
  assert.ok(near(draw('PD 180 PF 100').state.y, -100));
  assert.strictEqual(draw('PE 90').state.heading, 270);
  assert.strictEqual(draw('PD 450').state.heading, 90);
});

test('círculo REPITA 360 [PF 1 PD 1] fecha no início', () => {
  const s = draw('REPITA 360 [PF 1 PD 1]').state;
  assert.ok(Math.hypot(s.x, s.y) < 0.01);
});

test('LEVANTE não desenha; BAIXE volta a desenhar', () => {
  const s = draw('PF 50 LEVANTE PF 50 BAIXE PF 50').state;
  assert.strictEqual(s.segments.length, 2);
  assert.ok(near(s.y, 150));
});

test('LIMPE apaga o desenho mas mantém a posição; CENTRO volta sem desenhar', () => {
  let s = draw('PF 100 LIMPE').state;
  assert.strictEqual(s.segments.length, 0);
  assert.ok(near(s.y, 100));
  s = draw('PD 45 PF 100 CENTRO').state;
  assert.ok(s.x === 0 && s.y === 0 && s.heading === 0 && s.segments.length === 1);
});

test('REPITA aninhado', () => {
  const r = Logo.compile('REPITA 3 [REPITA 2 [PF 10] PD 120]');
  assert.strictEqual(r.actions.length, 9);
  assert.strictEqual(r.analysis.maxDepth, 2);
  assert.strictEqual(r.analysis.size, 4);
  assert.ok(r.analysis.nestedRepeat);
});

test('apelidos PARAFRENTE / REPETIR', () => {
  assert.strictEqual(Logo.compile('PARAFRENTE 10 REPETIR 2 [PARADIREITA 90]').actions.length, 3);
});

/* -------------------------- Erros pedagógicos --------------------------- */
const errorCases = [
  ['PF', /faltando um número depois de PF/, 'PF ???'],
  ['PF\nPD 90', /faltando um número depois de PF/],
  ['PF100', /Faltou um espaço/, 'PF 100'],
  ['PG 100', /não entendeu/],
  ['FD 100', /inglês/],
  ['100', /sozinho/],
  ['PF 100 200', /faltou um comando/],
  ['REPITA [PF 100]', /faltando um número depois de REPITA/],
  ['REPITA 4 PF 100 PD 90', /Faltou abrir os colchetes/],
  ['REPITA 4 [PF 100 PD 90', /Faltou fechar/],
  ['PF 100 ]', /sobrando/],
  ['REPITA 4 []', /vazios/],
  ['REPITA 2,5 [PF 10]', /REPITA 2,5 não dá certo/],
  ['REPITA 0 [PF 10]', /pelo menos 1/],
  ['REPITA 20000 [PF 1]', /repetição demais/],
  ['REPITA 1000 [REPITA 1000 [PF 1]]', /passos demais/],
  ['PF 100, PD 90', /vírgula/],
  ['REPITA 4 (PF 100 PD 90)', /colchetes/],
  ['PARA FRENTE 100', /PF/],
  ['PARA QUADRADO', /Faltou o FIM/],
  ['PF :lado', /não conhece :lado/],
  ['PF cem', /algarismos/],
];
errorCases.forEach(([code, re, snippet]) => {
  test(`erro amigável: ${JSON.stringify(code)}`, () => {
    const e = errorOf(code);
    assert.ok(e, 'deveria gerar erro');
    assert.match(e.title + ' ' + e.message, re);
    assert.ok(!/SyntaxError|undefined|NaN/.test(e.title + e.message), 'mensagem técnica: ' + e.title + e.message);
    assert.ok(typeof e.start === 'number' && e.end > e.start, 'posição do erro');
    if (snippet) assert.strictEqual(e.snippet, snippet);
  });
});

test('erro em linha 3 aponta a linha 3', () => {
  assert.strictEqual(errorOf('PF 10\nPD 90\nPF').line, 3);
});

/* ------------------------------- Níveis --------------------------------- */
function play(level, code) {
  const r = draw(code);
  return Levels.evaluate(level, { analysis: r.analysis, stats: r.stats, state: r.state });
}

assert.ok(Levels.LEVELS.length >= 15, 'pelo menos 15 níveis');

// soluções alternativas que DEVEM ser aceitas e tentativas que DEVEM falhar
const alt = {
  1: { ok: ['PF 50 PF 50', 'PF 25\nPF 75'], bad: ['PF 90', 'PT 100', 'PD 90 PF 100'] },
  2: { ok: ['PF 50 PF 50 PT 100', 'PF 100 PT 50 PT 50'], bad: ['PF 100', 'PF 100 PT 50'] },
  3: { ok: ['PF 100 PE 90 PF 100', 'PF 50 PF 50 PD 90 PF 100'], bad: ['PF 100 PD 45 PF 100', 'PF 100 PD 90 PF 50'] },
  4: { ok: ['REPITA 4 [PF 100 PD 90]', 'REPITA 4 [PF 100 PE 90]', 'PD 90 REPITA 4 [PF 100 PD 90]', 'LEVANTE PF 30 BAIXE REPITA 4 [PF 100 PD 90]'], bad: ['REPITA 3 [PF 100 PD 90]', 'REPITA 4 [PF 120 PD 90]', 'REPITA 4 [PF 100 PD 80]'] },
  5: { ok: ['REPITA 4 [PF 150 PE 90]', 'REPITA 2 [PF 150 PD 90 PF 150 PD 90]'], bad: ['PF 150 PD 90 PF 150 PD 90 PF 150 PD 90 PF 150', 'REPITA 4 [PF 100 PD 90]'] },
  6: { ok: ['REPITA 2 [PF 200 PD 90 PF 100 PD 90]', 'PF 100 PD 90 PF 200 PD 90 PF 100 PD 90 PF 200'], bad: ['REPITA 4 [PF 100 PD 90]', 'REPITA 2 [PF 100 PD 90 PF 150 PD 90]'] },
  7: { ok: ['REPITA 3 [PF 150 PE 120]', 'PD 60 REPITA 3 [PF 150 PD 120]'], bad: ['REPITA 3 [PF 150 PD 60]', 'REPITA 3 [PF 100 PD 120]'] },
  8: { ok: ['REPITA 5 [PF 150 PE 144]'], bad: ['REPITA 5 [PF 150 PD 72]', 'REPITA 5 [PF 150 PD 150]'] },
  9: { ok: ['REPITA 36 [PF 10 PD 10]', 'REPITA 72 [PF 5 PE 5]', 'REPITA 180 [PF 2 PD 2]'], bad: ['REPITA 36 [PF 20 PD 10]', 'REPITA 4 [PF 90 PD 90]', 'REPITA 18 [PF 10 PD 10]'] },
  10: { ok: ['PF 100 PD 90 PF 100 PD 90 PF 100 PD 90 PF 100 PD 90 PF 100 PD 30 PF 100 PD 120 PF 100 PD 120 PF 100'], bad: ['REPITA 4 [PF 100 PD 90]', 'REPITA 4 [PF 100 PD 90] PF 100 REPITA 3 [PF 100 PD 120]'] },
  11: { ok: ['REPITA 18 [PF 20 PE 90 PF 30 PT 30 PD 90 PD 20]', 'REPITA 18 [PF 20 PD 90 PF 30 PT 30 PE 110]'], bad: ['REPITA 18 [PF 20 PD 20]', 'REPITA 18 [PF 20 PD 90 PF 30 PT 30 PD 70]'] },
  12: { ok: ['REPITA 6 [REPITA 36 [PF 8 PE 10] PE 60]', 'REPITA 6 [REPITA 72 [PF 4 PD 5] PD 60]'], bad: ['REPITA 5 [REPITA 36 [PF 8 PD 10] PD 72]', 'REPITA 36 [PF 8 PD 10]'] },
  13: { ok: ['REPITA 3 [PF 100 PE 120]\nREPITA 4 [PF 100 PD 90]\nPD 90\nREPITA 360 [PF 1 PD 1]'], bad: ['REPITA 4 [PF 100 PD 90]\nREPITA 3 [PF 100 PE 120]'] },
  14: { ok: ['REPITA 6 [REPITA 3 [PF 80 PE 120] PE 60]'], bad: ['REPITA 6 [REPITA 3 [PF 80 PD 120] PD 30]', 'REPITA 6 [PF 80 PD 60]'] },
  15: { ok: ['REPITA 6 [REPITA 36 [PF 5 PD 10] PD 60]\nREPITA 12 [REPITA 4 [PF 70 PD 90] PD 30]'], bad: ['REPITA 12 [REPITA 4 [PF 70 PD 90] PD 30]'] },
};

Levels.LEVELS.forEach((level) => {
  test(`nível ${level.id} (${level.title}): solução de referência é aceita`, () => {
    const res = play(level, level.solution);
    assert.ok(res.completed, res.text);
    assert.ok(res.stars >= 2);
  });
  test(`nível ${level.id}: desenho-alvo cabe na tela`, () => {
    const b = Turtle.bounds(Levels.targetOf(level));
    assert.ok(Math.max(-b.x0, b.x1, -b.y0, b.y1) <= 250, JSON.stringify(b));
  });
  (alt[level.id] ? alt[level.id].ok : []).forEach((code) => test(`nível ${level.id}: aceita ${JSON.stringify(code)}`, () => {
    const res = play(level, code);
    assert.ok(res.completed, res.text + ' ' + JSON.stringify(res.compare));
  }));
  (alt[level.id] ? alt[level.id].bad : []).forEach((code) => test(`nível ${level.id}: recusa ${JSON.stringify(code)}`, () => {
    assert.ok(!play(level, code).completed);
  }));
  test(`nível ${level.id}: 3 dicas`, () => assert.strictEqual(level.hints.length, 3));
});

test('estrelas: quadrado sem REPITA (nível 4) = 2⭐, com REPITA = 3⭐', () => {
  const L4 = Levels.LEVELS[3];
  assert.strictEqual(play(L4, L4.solution).stars, 2);
  assert.strictEqual(play(L4, 'REPITA 4 [PF 100 PD 90]').stars, 3);
});
test('estrelas: retângulo sem REPITA (nível 6) = 1⭐', () => {
  assert.strictEqual(play(Levels.LEVELS[5], 'PF 100 PD 90 PF 200 PD 90 PF 100 PD 90 PF 200').stars, 1);
});
test('nível 5 exige REPITA mesmo com desenho certo', () => {
  const res = play(Levels.LEVELS[4], 'PF 150 PD 90 PF 150 PD 90 PF 150 PD 90 PF 150');
  assert.ok(!res.completed && /REPITA/.test(res.text));
});
test('desenho vazio dá mensagem gentil', () => {
  const res = play(Levels.LEVELS[0], 'LEVANTE PF 100');
  assert.ok(!res.completed && /BAIXE/.test(res.text));
});

/* ------------------- Galeria, tutorial e biblioteca --------------------- */
const EXAMPLES = require('../js/examples.js');
const TUTORIAL = require('../js/tutorial.js');
EXAMPLES.forEach((ex) => test(`galeria: "${ex.title}" executa e cabe na tela`, () => {
  const s = draw(ex.code).state;
  assert.ok(s.segments.length > 0);
  const b = Turtle.bounds(s.segments);
  assert.ok(Math.max(-b.x0, b.x1, -b.y0, b.y1) <= 260, JSON.stringify(b));
}));
TUTORIAL.forEach((l) => test(`aula ${l.id}: exemplos executam sem erro`, () => {
  [l.code].concat(l.tries.map((t) => t.code)).forEach((c) => Logo.compile(c));
}));
Object.values(Logo.commands).forEach((c) => test(`biblioteca: exemplo de ${c.name} executa`, () => Logo.compile(c.doc.example)));

/* --------------------- Código de progresso (save) ---------------------- */
const Progresso = require('../js/progresso.js');
const L = Levels.LEVELS;
function dados(nome, levels, lessons) {
  return { nome, levels: levels || {}, lessons: lessons || {} };
}

test('código de progresso: ida e volta em outro computador', () => {
  const origem = dados('Luíza', { 1: { completed: true, stars: 3 }, 2: { completed: true, stars: 1 }, 15: { completed: true, stars: 2 } }, { 1: true, 7: true });
  const codigo = Progresso.gerarCodigo(origem, L, TUTORIAL);
  assert.match(codigo, /^TAR3-[0-9A-Z]{24}-[0-9A-Z]{4}$/);
  const novo = dados('');
  const r = Progresso.importar(novo, codigo, 'Luiza', L, TUTORIAL); // sem acento também vale
  assert.ok(r.ok, r.motivo);
  assert.deepStrictEqual([novo.levels[1].stars, novo.levels[2].stars, novo.levels[15].stars], [3, 1, 2]);
  assert.ok(!novo.levels[3] && novo.lessons[1] && novo.lessons[7] && !novo.lessons[2]);
  assert.strictEqual(novo.nome, 'Luiza');
});

test('código de progresso: nome diferente é recusado', () => {
  const codigo = Progresso.gerarCodigo(dados('Ana', { 1: { completed: true, stars: 3 } }), L, TUTORIAL);
  const r = Progresso.importar(dados(''), codigo, 'Pedro', L, TUTORIAL);
  assert.ok(!r.ok && /não confere/.test(r.motivo));
});

test('código de progresso: importar nunca piora o que já existe', () => {
  const codigo = Progresso.gerarCodigo(dados('Ana', { 1: { completed: true, stars: 1 }, 2: { completed: true, stars: 3 } }), L, TUTORIAL);
  const aqui = dados('Ana', { 1: { completed: true, stars: 3, size: 1 } });
  Progresso.importar(aqui, codigo, 'Ana', L, TUTORIAL);
  assert.strictEqual(aqui.levels[1].stars, 3);
  assert.strictEqual(aqui.levels[2].stars, 3);
});

test('código de progresso: aceita minúsculas, espaços e O/I trocados', () => {
  const codigo = Progresso.gerarCodigo(dados('Ana', { 4: { completed: true, stars: 2 } }), L, TUTORIAL);
  const baguncado = '  ' + codigo.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i') + ' ';
  const r = Progresso.importar(dados(''), baguncado, 'ana', L, TUTORIAL);
  assert.ok(r.ok, r.motivo);
});

test('código de progresso: formato inválido dá mensagem clara', () => {
  ['', 'ALG-123-4567', 'TAR-12-AB', 'TAR-!!!!!!!!-ABCD'].forEach((c) => {
    const r = Progresso.importar(dados(''), c, 'Ana', L, TUTORIAL);
    assert.ok(!r.ok && r.motivo.length > 10, c);
  });
});

test('conquistas são recuperadas ao importar (evento sync)', () => {
  const Ach = require('../js/achievements.js');
  const d = dados('Ana', { 5: { completed: true, stars: 3 }, 36: { completed: true, stars: 3 } });
  d.achievements = {}; d.galleryRuns = [];
  const ids = Ach.check('sync', {}, d).map((a) => a.id);
  assert.ok(ids.includes('quadrado') && ids.includes('mestre') && !ids.includes('estrela'));
});

/* ------------------- Linguagem avançada (Reinos 5 e 6) ------------------ */
test('PARA … FIM com parâmetro e chamadas', () => {
  const s = draw('PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM\nQUADRADO 40\nQUADRADO 80').state;
  assert.strictEqual(s.segments.length, 8);
  assert.ok(near(s.x, 0) && near(s.y, 0));
});
test('procedimento pode ser chamado antes de ser definido', () => {
  assert.strictEqual(draw('LINHA 30\nPARA LINHA :T\n PF :T\nFIM').state.segments.length, 1);
});
test('contas, parênteses e precedência', () => {
  assert.ok(near(draw('PF 2 + 3 * 4').state.y, 14));
  assert.ok(near(draw('PF (2 + 3) * 4').state.y, 20));
  assert.ok(near(draw('PF 100 / 4 - 5').state.y, 20));
  assert.ok(near(draw('PF - 10 + 30').state.y, 20));
});
test('regra do sinal: ":N - 1" e ":N-1" são conta; ":N -1" são dois valores', () => {
  const p = 'PARA A :X :Y\n PF :X PD 90 PF :Y\nFIM\n';
  assert.ok(near(draw(p + 'A 10 - 1 5').state.x, 5));
  assert.ok(near(draw(p + 'A 10-1 5').state.y, 9));
  assert.ok(near(draw(p + 'A 10 -1').state.x, -1));
});
test('REPCONT vale o número da volta (e a volta do REPITA mais interno)', () => {
  assert.ok(near(draw('REPITA 4 [PF REPCONT]').state.y, 10));
  assert.ok(near(draw('REPITA 2 [REPITA 3 [PF REPCONT]]').state.y, 12));
});
test('SE / SENAO e comparações', () => {
  const p = 'PARA X :N\n SE :N > 2 [PF 10] SENAO [PT 10]\nFIM\n';
  assert.ok(near(draw(p + 'X 3').state.y, 10));
  assert.ok(near(draw(p + 'X 1').state.y, -10));
  assert.ok(near(draw('PARA Y :N\n SE :N <> 0 [PF 1]\nFIM\nY 0 Y 2 Y 5').state.y, 2));
});
test('recursão com PARE (escada) e PARE fora de procedimento encerra o programa', () => {
  const r = draw('PARA DEGRAU :N\n SE :N = 0 [PARE]\n PF 10 PD 90 PF 10 PE 90\n DEGRAU :N - 1\nFIM\nDEGRAU 5');
  assert.strictEqual(r.state.segments.length, 10);
  assert.ok(r.analysis.recursive && r.analysis.usesProcedures);
  assert.strictEqual(draw('PF 10 PARE PF 10').state.segments.length, 1);
});
test('PARE dentro de REPITA num procedimento não deixa a contagem de voltas presa', () => {
  const r = Logo.compile('PARA P\n REPITA 5 [PF 1 PARE]\nFIM\nP\nREPITA 2 [PF REPCONT]');
  assert.strictEqual(r.actions[r.actions.length - 1].loops.length, 1);
});
test('análise: técnicas usadas', () => {
  const a = Logo.compile('PARA K :N\n SE :N = 0 [PARE]\n REPITA 2 [PF REPCONT]\n K :N - 1\nFIM\nK 2').analysis;
  assert.ok(a.usesProcedures && a.recursive && a.usesRepcount && a.usesRepeat);
  assert.ok(a.commandsUsed.includes('PARA') && a.commandsUsed.includes('SE') && a.commandsUsed.includes('REPCONT'));
});
[
  ['PARA X :N\n X :N + 1\nFIM\nX 1', /Recursão sem fim/],
  ['PF REPCONT', /REPCONT só funciona dentro de um REPITA/],
  ['PF 10 / 0', /Divisão por zero/],
  ['PARA PF\n PT 1\nFIM', /já é uma palavra da tartaruga/],
  ['PARA QUADRADO :L\n PF :L\n', /Faltou o FIM/],
  ['FIM', /FIM sem PARA/],
  ['SE 1 = [PF 10]', /Faltou um número depois de =/],
  ['PF (10 + 5', /Faltou fechar o parêntese/],
  ['SENAO [PF 1]', /SENAO precisa vir logo depois de um SE/],
  ['SE [PF 1]', /SE precisa de uma condição/],
  ['PARA A :X\n PF :Y\nFIM\nA 1', /não conhece :Y/],
  ['PARA A :X\n PF :X\nFIM\nA', /Está faltando um número depois de A/],
  ['REPITA 2 [PARA B\n PF 1\nFIM]', /PARA não pode ficar dentro de outro bloco/],
  ['PARA A\n PF 1\nFIM\nPARA A\n PT 1\nFIM', /Já existe um comando chamado A/],
  ['REPCONT', /REPCONT é um número, não um comando/],
  [':LADO', /está sozinho/],
  ['PF 10 * ', /Faltou um número depois de \*/],
  ['TO QUADRADO', /inglês/],
].forEach(([code, re]) => test(`erro amigável (avançado): ${JSON.stringify(code)}`, () => {
  const e = errorOf(code);
  assert.ok(e, 'deveria gerar erro');
  assert.match(e.title + ' ' + e.message, re);
  assert.ok(typeof e.start === 'number' && e.end > e.start, 'posição do erro');
}));

/* --------------------- O Dao dos Algoritmos (cultivo) ------------------- */
const Cultivo = require('../js/cultivo.js');
const Achievements = require('../js/achievements.js');
const vazio = () => ({ levels: {}, lessons: {}, achievements: {}, galleryRuns: [], cultivo: { rompimentos: {} } });
const conclui = (d, ids, stars) => ids.forEach((id) => { d.levels[id] = { completed: true, stars: stars || 3, size: 1 }; });

test('36 desafios: 6 reinos × 3 estágios × 2, cada id uma única vez', () => {
  assert.strictEqual(Levels.LEVELS.length, 36);
  assert.strictEqual(Cultivo.REINOS.length, 6);
  assert.strictEqual(Cultivo.STAGES.length, 18);
  Cultivo.STAGES.forEach((s) => assert.strictEqual(s.estagio.desafiosIds.length, 2));
  assert.deepStrictEqual(Cultivo.ORDER.slice().sort((a, b) => a - b), Levels.LEVELS.map((l) => l.id));
  assert.ok(Cultivo.orderedLevels().every(Boolean));
});
test('os 15 originais ficam nos Reinos 1-4 e os básicos no Reino 1', () => {
  [1, 2, 3, 4].forEach((id) => assert.strictEqual(Cultivo.onde(id).reino.id, 1));
  [5, 6, 7, 8, 9].forEach((id) => assert.strictEqual(Cultivo.onde(id).reino.id, 2));
  [10, 11, 12, 13].forEach((id) => assert.strictEqual(Cultivo.onde(id).reino.id, 3));
});
test('desbloqueio por estágio: começo, Intermediário e Pico (gargalo)', () => {
  const d = vazio();
  assert.ok(Cultivo.levelUnlocked(d, 1) && Cultivo.levelUnlocked(d, 2));
  assert.ok(!Cultivo.levelUnlocked(d, 3) && !Cultivo.levelUnlocked(d, 16));
  conclui(d, [1]);
  assert.ok(!Cultivo.levelUnlocked(d, 3), 'o estágio só abre com os dois desafios concluídos');
  conclui(d, [2]);
  assert.ok(Cultivo.levelUnlocked(d, 3) && Cultivo.levelUnlocked(d, 16));
  assert.ok(!Cultivo.levelUnlocked(d, 4), 'o Pico espera o Intermediário');
  conclui(d, [3, 16]);
  assert.ok(Cultivo.levelUnlocked(d, 4) && Cultivo.levelUnlocked(d, 17));
  assert.ok(!Cultivo.levelUnlocked(d, 5), 'o Reino 2 espera o rompimento');
});
test('Rompimento de Reino: só ao vencer os dois desafios do Pico, uma única vez', () => {
  const d = vazio();
  conclui(d, [1, 2, 3, 16, 4]);
  assert.deepStrictEqual(Cultivo.registrarRompimentos(d), []);
  conclui(d, [17]);
  const r = Cultivo.registrarRompimentos(d);
  assert.deepStrictEqual(r.map((x) => x.id), [1]);
  assert.deepStrictEqual(Cultivo.registrarRompimentos(d), []);
  assert.ok(Cultivo.levelUnlocked(d, 5));
  const s = Cultivo.situacao(d);
  assert.strictEqual(s.reino.id, 2);
  assert.strictEqual(s.titulo, 'Discípulo do Traço');
  assert.strictEqual(d.cultivo.reinoAtual, 2);
});
test('retrocompatível: quem concluiu os 15 níveis antigos não perde nada', () => {
  const d = vazio();
  conclui(d, Array.from({ length: 15 }, (_, i) => i + 1));
  for (let id = 1; id <= 15; id++) assert.ok(Cultivo.levelUnlocked(d, id), 'nível antigo ' + id);
  [16, 17, 18, 19, 20, 21, 22, 23, 24].forEach((id) => assert.ok(Cultivo.levelUnlocked(d, id), 'novo ' + id));
  assert.ok(!Cultivo.levelUnlocked(d, 25), 'o Reino 5 exige romper o Reino 4');
  assert.strictEqual(Cultivo.situacao(d).reino.id, 4);
  assert.strictEqual(Cultivo.proximo(d).id, 16);
  assert.deepStrictEqual(Cultivo.registrarRompimentos(d).map((r) => r.id), [2]); // R2: 8 e 9 já vencidos
});
test('Qi do reino e próximo desafio', () => {
  const d = vazio();
  assert.strictEqual(Cultivo.proximo(d).id, 1);
  conclui(d, [1, 2, 3]);
  const s = Cultivo.situacao(d);
  assert.strictEqual(s.reino.id, 1);
  assert.strictEqual(s.qi, 50);
  assert.strictEqual(Cultivo.proximo(d, 3).id, 16);
});
test('professor/demonstração: unlockAll abre tudo', () => {
  const d = vazio();
  d.unlockAll = true;
  assert.ok(Cultivo.levelUnlocked(d, 36));
});
test('conquistas de rompimento (evento breakthrough e sync)', () => {
  const d = vazio();
  const r1 = Cultivo.REINOS[0];
  assert.ok(Achievements.check('breakthrough', { reino: r1 }, d).map((a) => a.id).includes('reino1'));
  const d2 = vazio();
  conclui(d2, [8, 9]);
  Cultivo.registrarRompimentos(d2);
  assert.ok(Achievements.check('sync', {}, d2).map((a) => a.id).includes('reino2'));
});

/* ------------------- Desafios novos: alternativas e limites ------------- */
const PK = 'PARA K :T :N\n SE :N < 1 [PF :T PARE]\n K :T/3 :N-1 PE 60 K :T/3 :N-1 PD 120 K :T/3 :N-1 PE 60 K :T/3 :N-1\nFIM\n';
const altNovos = {
  16: { ok: ['REPITA 2 [PF 40 LEVANTE PF 20 BAIXE] PF 40'], bad: ['PF 160', 'PF 40 LEVANTE PF 20 BAIXE PF 40'] },
  17: { ok: ['PF 150 PE 90 PF 80 PE 90 PF 50 PE 90 PF 80'], bad: ['PF 150 PD 90 PF 80 PD 90 PF 80 PD 90 PF 80'] },
  18: { ok: ['REPITA 6 [PF 80 PE 60]'], bad: ['REPITA 6 [PF 80 PD 50]'] },
  19: { ok: ['REPITA 12 [REPITA 6 [PF 50 PE 60] PE 30]'], bad: ['REPITA 6 [REPITA 6 [PF 50 PD 60] PD 60]'] },
  20: { ok: ['REPITA 24 [REPITA 3 [PF 100 PE 120] PE 15]'], bad: ['REPITA 12 [REPITA 3 [PF 100 PD 120] PD 30]'] },
  21: { ok: ['REPITA 8 [PF 25 PD 90 PF 25 PE 90]'], bad: ['REPITA 8 [PF 25 PD 90 PF 20 PE 90]'] },
  25: { ok: ['REPITA 40 [PF 5 * REPCONT PD 90]'], bad: ['REPITA 40 [PF REPCONT * 4 PD 90]'] },
  26: { ok: ['PARA Q :L\n REPITA 4 [PF :L PD 90]\nFIM\nREPITA 4 [Q REPCONT * 40]'], bad: [] },
  28: { ok: ['PARA E :T\n REPITA 8 [PF :T PD 135]\nFIM\nE 60 E 120 E 180'], bad: ['PARA E :T\n REPITA 8 [PF :T PD 135]\nFIM\nE 60 E 120'] },
  32: { ok: [PK + 'PD 30\nREPITA 3 [K 240 3 PD 120]'], bad: [PK + 'PD 30\nREPITA 3 [K 240 2 PD 120]'] },
  33: { ok: [], bad: ['PARA A :T :N\n SE :N = 0 [PARE]\n PF :T PE 25 A :T*0.7 :N-1 PD 50 A :T*0.7 :N-1 PE 25 PT :T\nFIM\nLEVANTE PT 150 BAIXE\nA 100 6'] },
  34: { ok: ['PARA DRAGAO :N :S\n SE :N = 0 [PF 6 PARE]\n DRAGAO :N - 1 1\n PE 90 * :S\n DRAGAO :N - 1 -1\nFIM\nDRAGAO 10 1'], bad: [] },
  36: { ok: [PK + 'REPITA 12 [K 54 3 PD 30]'], bad: [PK + 'REPITA 12 [K 54 2 PD 30]'] },
};
Object.entries(altNovos).forEach(([id, { ok, bad }]) => {
  const level = Levels.byId(id);
  ok.forEach((code) => test(`desafio ${id}: aceita ${JSON.stringify(code.slice(0, 50))}`, () => {
    const res = play(level, code);
    assert.ok(res.completed, res.text + ' ' + JSON.stringify(res.compare));
  }));
  bad.forEach((code) => test(`desafio ${id}: recusa ${JSON.stringify(code.slice(0, 50))}`, () => {
    assert.ok(!play(level, code).completed);
  }));
});
/* ------------- Reino 3+: 5 estrelas, regras descontam (não bloqueiam) ------------- */
test('escala: 3 estrelas nos Reinos 1-2, 5 a partir do Reino 3', () => {
  [1, 4, 17, 5, 9, 18].forEach((id) => assert.strictEqual(Levels.maxStarsOf(Levels.byId(id)), 3, 'id ' + id));
  [10, 19, 21, 15, 25, 36].forEach((id) => assert.strictEqual(Levels.maxStarsOf(Levels.byId(id)), 5, 'id ' + id));
  assert.strictEqual(play(Levels.byId(36), Levels.byId(36).solution).stars, 5);
});
test('Reino 4: acima do limite de comandos passa, mas perde estrelas', () => {
  const longa = Array.from({ length: 8 }, () => 'PF 25 PD 90 PF 25 PE 90').join('\n');
  const res = play(Levels.byId(21), longa);
  assert.ok(res.completed, res.text);
  const keys = res.deductions.map((d) => d.key);
  ['tecnica', 'meta', 'meta2', 'limite'].forEach((k) => assert.ok(keys.includes(k), k));
  assert.strictEqual(res.stars, 1);
});
test('desafio 25 sem REPCONT e 26 sem PARA passam com desconto', () => {
  const longa = Array.from({ length: 40 }, (_, i) => `PF ${(i + 1) * 5} PD 90`).join('\n');
  const r25 = play(Levels.byId(25), longa);
  assert.ok(r25.completed && r25.deductions.some((d) => /REPCONT/.test(d.text)));
  const r26 = play(Levels.byId(26), 'REPITA 4 [PF 40 PD 90] REPITA 4 [PF 80 PD 90] REPITA 4 [PF 120 PD 90] REPITA 4 [PF 160 PD 90]');
  assert.ok(r26.completed && r26.deductions.some((d) => /PARA/.test(d.text)));
  assert.ok(r26.stars < 5);
});
test('desafio 27 sem REPCONT, 144 comandos em 72 linhas: 1 de 5 estrelas', () => {
  const longa = Array.from({ length: 72 }, (_, i) => `PF ${(i + 1) / 2} PD 15`).join('\n');
  const res = play(Levels.byId(27), longa);
  assert.ok(res.completed, res.text);
  assert.strictEqual(res.stars, 1);
  assert.ok(res.deductions.some((d) => d.key === 'linhas'));
  assert.strictEqual(play(Levels.byId(27), 'REPITA 72 [PF REPCONT / 2 PD 15]').stars, 5);
});
test('traço repetido por cima do tracejado: passa no Reino 3+, reprova no Reino 2', () => {
  const r19 = play(Levels.byId(19), 'REPITA 24 [REPITA 6 [PF 50 PD 60] PD 30]'); // roseta desenhada 2 vezes
  assert.ok(r19.completed, r19.text);
  assert.ok(r19.deductions.some((d) => d.key === 'repetidas'));
  assert.ok(!play(Levels.byId(18), 'REPITA 12 [PF 80 PD 60]').completed); // hexágono 2 vezes, Reino 2
});
test('usar todas as dicas tira 1 estrela (Reino 3+)', () => {
  const lvl = Levels.byId(20);
  const r = Logo.compile(lvl.solution);
  const st = Turtle.simulate(r.actions, Turtle.createState());
  assert.strictEqual(Levels.evaluate(lvl, { analysis: r.analysis, stats: r.stats, state: st, hintsUsed: 2 }).stars, 5);
  assert.strictEqual(Levels.evaluate(lvl, { analysis: r.analysis, stats: r.stats, state: st, hintsUsed: 3 }).stars, 4);
});
test('desenho errado continua reprovando no Reino 3+', () => {
  assert.ok(!play(Levels.byId(19), 'REPITA 12 [REPITA 6 [PF 40 PD 60] PD 30]').completed);
});

/* --------------- estrelas mínimas para romper (Reino 3 em diante) --------------- */
const idsDoReino = (n) => Cultivo.REINOS[n - 1].subEstagios.flatMap((st) => st.desafiosIds);
test('Reino 3: precisa de 3 de 5 estrelas em todos os desafios para romper', () => {
  const d = vazio();
  conclui(d, idsDoReino(1).concat(idsDoReino(2)));
  conclui(d, idsDoReino(3), 5);
  d.levels[11].stars = 2; // um desafio abaixo do mínimo
  assert.ok(!Cultivo.reinoRompido(d, 3));
  assert.ok(!Cultivo.levelUnlocked(d, 21), 'o Reino 4 continua selado');
  assert.deepStrictEqual(Cultivo.faltamEstrelas(d, 3), [11]);
  assert.strictEqual(Cultivo.proximo(d).id, 11, 'o próximo é refazer o desafio abaixo do mínimo');
  d.levels[11].stars = 3;
  assert.ok(Cultivo.reinoRompido(d, 3) && Cultivo.levelUnlocked(d, 21));
});
test('Reino 6: precisa de 4 de 5 estrelas', () => {
  const d = vazio();
  conclui(d, Cultivo.ORDER, 3);
  assert.ok(Cultivo.reinoRompido(d, 5));
  assert.ok(!Cultivo.reinoRompido(d, 6));
  conclui(d, idsDoReino(6), 4);
  assert.ok(Cultivo.reinoRompido(d, 6));
});
test('Qi conta só os desafios com as estrelas mínimas', () => {
  const d = vazio();
  conclui(d, idsDoReino(1).concat(idsDoReino(2)));
  conclui(d, [10, 13], 2);
  assert.strictEqual(Cultivo.situacao(d).qi, 0);
  conclui(d, [10], 4);
  assert.strictEqual(Cultivo.situacao(d).qi, 17);
});
test('estrelas antigas (escala de 3) do Reino 3+ são convertidas para 5', () => {
  const d = vazio();
  d.levels = { 4: { completed: true, stars: 2 }, 10: { completed: true, stars: 3 }, 11: { completed: true, stars: 2 }, 14: { completed: true, stars: 1 } };
  assert.ok(Cultivo.migrarEstrelas(d));
  assert.deepStrictEqual([d.levels[4].stars, d.levels[10].stars, d.levels[11].stars, d.levels[14].stars], [2, 5, 4, 3]);
  assert.ok(!Cultivo.migrarEstrelas(d), 'não converte duas vezes');
});

/* ---------------- código de progresso: versão antiga (TAR) -------------- */
test('código antigo TAR- (15 níveis, 7 aulas) continua sendo importado', () => {
  const antigos = Levels.LEVELS.filter((l) => l.id <= 15);
  const aulas7 = TUTORIAL.filter((a) => a.id <= 7);
  const origem = dados('Bia', { 1: { completed: true, stars: 3 }, 9: { completed: true, stars: 2 }, 15: { completed: true, stars: 1 } }, { 2: true });
  const v1 = Progresso.gerarCodigo(origem, antigos, aulas7, 1);
  const novo = dados('');
  const r = Progresso.importar(novo, v1, 'Bia', L, TUTORIAL);
  assert.ok(r.ok, r.motivo);
  assert.strictEqual(r.versao, 1);
  // nível 15 está no Reino 4 (escala de 5): 1 estrela antiga vira 3 de 5
  assert.deepStrictEqual([novo.levels[1].stars, novo.levels[9].stars, novo.levels[15].stars], [3, 2, 3]);
  assert.ok(novo.lessons[2] && !novo.levels[16]);
});
test('código TAR2 (anterior) é lido e convertido para a escala de 5', () => {
  const origem = dados('Duda', { 10: { completed: true, stars: 3 }, 5: { completed: true, stars: 2 } });
  const c = Progresso.gerarCodigo(origem, L, TUTORIAL, 2);
  assert.match(c, /^TAR2-/);
  const novo = dados('');
  const r = Progresso.importar(novo, c, 'Duda', L, TUTORIAL);
  assert.ok(r.ok && r.versao === 2, r.motivo);
  assert.deepStrictEqual([novo.levels[10].stars, novo.levels[10].escala, novo.levels[5].stars], [5, 5, 2]);
});
test('código TAR3 leva os 36 desafios (até 5 estrelas) e as 10 aulas', () => {
  const origem = dados('Caio', { 36: { completed: true, stars: 5 }, 30: { completed: true, stars: 4 }, 16: { completed: true, stars: 2 } }, { 10: true });
  const c = Progresso.gerarCodigo(origem, L, TUTORIAL);
  const novo = dados('');
  assert.ok(Progresso.importar(novo, c, 'Caio', L, TUTORIAL).ok);
  assert.deepStrictEqual([novo.levels[36].stars, novo.levels[30].stars, novo.levels[16].stars], [5, 4, 2]);
  assert.ok(novo.lessons[10]);
});

/* ----------------- meta de comandos e linhas (abaixo da tela) ----------------- */
test('countLines ignora linhas vazias e comentários', () => {
  assert.strictEqual(Logo.countLines('PF 10\n\n; comentário\nPD 90 // gira\n   '), 2);
});
test('todos os 36 desafios têm meta de comandos e linhas coerente com a solução', () => {
  Levels.LEVELS.forEach((l) => {
    const m = Levels.metaOf(l);
    const ref = l.solucaoOtima || l.solution;
    assert.ok(m.comandos >= 1 && m.linhas >= 1, 'id ' + l.id);
    assert.ok(Logo.compile(ref).analysis.size <= m.comandos, 'comandos id ' + l.id);
    assert.strictEqual(Logo.countLines(ref), m.linhas, 'linhas id ' + l.id);
    assert.ok(play(l, ref).completed, 'a solução de referência passa: id ' + l.id);
  });
});
test('desafio 7 (quadrado com REPITA): 3 comandos em 1 linha', () => {
  const m = Levels.metaOf(Cultivo.orderedLevels()[6]);
  assert.deepStrictEqual([m.comandos, m.linhas], [3, 1]);
});

test('linhas acima da meta: −1 ★ no Reino 3+, sem a 3ª estrela nos Reinos 1-2', () => {
  // Desafio 20 (id 14, meta 5 comandos em 1 linha) com os mesmos comandos em 3 linhas
  const r = play(Levels.byId(14), 'REPITA 6 [\n  REPITA 3 [PF 80 PD 120] PD 60\n]');
  assert.ok(r.completed);
  assert.deepStrictEqual(r.deductions.map((d) => d.key), ['linhas']);
  assert.strictEqual(r.stars, 4);
  // Desafio 7 (id 5, meta 3 comandos em 1 linha) com REPITA em 3 linhas
  const tres = 'REPITA 4 [\n  PF 150 PD 90\n]';
  const q = play(Levels.byId(5), tres);
  assert.ok(q.completed);
  assert.strictEqual(q.stars, 2);
  assert.match(Levels.nextStarTip(Levels.byId(5), q, Logo.compile(tres).analysis), /1 linha/);
  assert.strictEqual(play(Levels.byId(5), 'REPITA 4 [PF 150 PD 90]').stars, 3);
});

/* ------------------------------- Fractais ------------------------------- */
test('Laboratório de Fractais: curva de Koch gera 4^n segmentos', () => {
  const s = Turtle.simulate(Fractals.kochActions(243, 3), Turtle.createState());
  assert.strictEqual(s.segments.length, 64);
  assert.ok(near(Math.hypot(s.x, s.y), 243, 1e-3));
});

console.log(`\n${passed} testes passaram, ${failed} falharam.`);
process.exit(failed ? 1 : 0);
