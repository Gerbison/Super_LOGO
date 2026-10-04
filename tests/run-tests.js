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
  ['PARA QUADRADO', /ainda não está disponível/],
  ['PF :lado', /Variáveis/],
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
  assert.match(codigo, /^TAR-[0-9A-Z]{8}-[0-9A-Z]{4}$/);
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
  const d = dados('Ana', { 5: { completed: true, stars: 3 }, 15: { completed: true, stars: 3 } });
  d.achievements = {}; d.galleryRuns = [];
  const ids = Ach.check('sync', {}, d).map((a) => a.id);
  assert.ok(ids.includes('quadrado') && ids.includes('mestre') && !ids.includes('estrela'));
});

/* ------------------------------- Fractais ------------------------------- */
test('Laboratório de Fractais: curva de Koch gera 4^n segmentos', () => {
  const s = Turtle.simulate(Fractals.kochActions(243, 3), Turtle.createState());
  assert.strictEqual(s.segments.length, 64);
  assert.ok(near(Math.hypot(s.x, s.y), 243, 1e-3));
});

console.log(`\n${passed} testes passaram, ${failed} falharam.`);
process.exit(failed ? 1 : 0);
