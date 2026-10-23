/* =========================================================================
 * cultivo.js — O Dao dos Algoritmos: reinos, estágios e progressão
 * -------------------------------------------------------------------------
 * 6 reinos de cultivo × 3 estágios (Inicial, Intermediário e Pico).
 * Cada estágio tem 2 desafios (36 no total). Os desafios em si estão em
 * js/levels.js; aqui fica só ONDE cada um aparece na jornada.
 *
 * Desbloqueio por estágio:
 *   - o 1º estágio do Reino 1 está sempre aberto;
 *   - um estágio abre quando TODOS os desafios do estágio anterior foram
 *     concluídos;
 *   - retrocompatível: se o aluno já concluiu algum desafio deste estágio
 *     ou de um estágio mais adiante (progresso da versão antiga, de 15
 *     níveis), o estágio também fica aberto.
 * Pico (Gargalo): vencer os 2 desafios do Pico rompe o reino (Breakthrough).
 *
 * Para mudar a jornada: altere REINOS (ids dos desafios em cada estágio).
 * ========================================================================= */
(function (root) {
  'use strict';

  const ESTAGIOS = {
    INICIAL: { nome: 'Estágio Inicial', curto: 'Inicial' },
    INTERMEDIARIO: { nome: 'Estágio Intermediário', curto: 'Intermediário' },
    PICO: { nome: 'Pico do Reino', curto: 'Pico (Gargalo)' },
  };

  const REINOS = [
    {
      id: 1, nome: 'O Primeiro Traço', subtitulo: 'Despertar da Tartaruga', icone: '🐢', corAura: '#4ade80',
      descricao: 'O despertar da tartaruga espiritual: movimento em linha reta, giros exatos e precisão no plano mundano.',
      foco: 'PF, PT, PD, PE, LEVANTE e BAIXE: sequência e precisão.',
      titulo: 'Discípulo do Traço',
      citacao: 'Uma jornada de mil li começa com um único passo.',
      subEstagios: [
        { tipo: 'INICIAL', desafiosIds: [1, 2] },
        { tipo: 'INTERMEDIARIO', desafiosIds: [3, 16] },
        { tipo: 'PICO', desafiosIds: [4, 17] },
      ],
    },
    {
      id: 2, nome: 'O Laço Harmônico', subtitulo: 'Ciclo Elemental', icone: '🔁', corAura: '#38bdf8',
      descricao: 'A energia opera em ciclos rítmicos e fechados. Repetir é ganhar força sem gastar palavras.',
      foco: 'REPITA, polígonos regulares e a volta completa de 360°.',
      titulo: 'Cultivador do Ciclo',
      citacao: 'A água que pinga sem parar fura a pedra.',
      subEstagios: [
        { tipo: 'INICIAL', desafiosIds: [5, 6] },
        { tipo: 'INTERMEDIARIO', desafiosIds: [7, 18] },
        { tipo: 'PICO', desafiosIds: [8, 9] },
      ],
    },
    {
      id: 3, nome: 'Geometria Espiritual', subtitulo: 'Manifestação dos Padrões', icone: '🪷', corAura: '#c084fc',
      descricao: 'A fusão de vários ciclos manifesta mandalas, flores de lótus e matrizes místicas.',
      foco: 'Laços aninhados, decomposição, rosetas e simetria rotacional.',
      titulo: 'Artífice das Mandalas',
      citacao: 'O todo é maior do que a soma das partes.',
      subEstagios: [
        { tipo: 'INICIAL', desafiosIds: [10, 13] },
        { tipo: 'INTERMEDIARIO', desafiosIds: [11, 12] },
        { tipo: 'PICO', desafiosIds: [19, 20] },
      ],
    },
    {
      id: 4, nome: 'Refinamento Puro', subtitulo: 'Cura do Desvio de Qi', icone: '⚗️', corAura: '#fbbf24',
      descricao: 'Eliminar o desperdício de energia: onde o mundano usa trinta blocos, o refinado usa cinco.',
      foco: 'Otimização: limite máximo de comandos, padrões mínimos e camadas de repetição.',
      titulo: 'Refinador do Qi',
      citacao: 'A perfeição é alcançada quando não há mais nada a retirar.',
      subEstagios: [
        { tipo: 'INICIAL', desafiosIds: [21, 14] },
        { tipo: 'INTERMEDIARIO', desafiosIds: [22, 23] },
        { tipo: 'PICO', desafiosIds: [24, 15] },
      ],
    },
    {
      id: 5, nome: 'Mestre da Matriz', subtitulo: 'Visão Abstrata', icone: '🌀', corAura: '#f472b6',
      descricao: 'O cultivador enxerga além do canvas: espirais cósmicas, proporções áureas e padrões que contêm a si mesmos.',
      foco: 'REPCONT, procedimentos (PARA … FIM), parâmetros, SE e a primeira recursão.',
      titulo: 'Mestre da Matriz',
      citacao: 'Quem conhece os outros é sábio; quem conhece a si mesmo é iluminado.',
      subEstagios: [
        { tipo: 'INICIAL', desafiosIds: [25, 26] },
        { tipo: 'INTERMEDIARIO', desafiosIds: [27, 28] },
        { tipo: 'PICO', desafiosIds: [29, 30] },
      ],
    },
    {
      id: 6, nome: 'O Iluminado do Dao', subtitulo: 'A Tartaruga Celestial', icone: '☯️', corAura: '#fde047',
      descricao: 'O estado supremo de não-ação (Wu Wei): códigos elegantes que formam geometrias sagradas impecáveis.',
      foco: 'Recursão avançada: Koch, árvores fractais, curva do dragão e mandalas celestiais.',
      titulo: 'Iluminado do Dao',
      citacao: 'O Dao nada faz, e nada fica por fazer.',
      subEstagios: [
        { tipo: 'INICIAL', desafiosIds: [31, 32] },
        { tipo: 'INTERMEDIARIO', desafiosIds: [33, 34] },
        { tipo: 'PICO', desafiosIds: [35, 36] },
      ],
    },
  ];

  /* ---------------------------- Estrutura ------------------------------ */
  // Lista linear de estágios (18) e posição de cada desafio na jornada.
  const STAGES = [];
  const WHERE = Object.create(null); // id do desafio → { reino, estagio, stageIndex, ordem }
  let ordem = 0;
  REINOS.forEach((r) => {
    r.subEstagios.forEach((st) => {
      st.nome = ESTAGIOS[st.tipo].nome;
      const stageIndex = STAGES.length;
      STAGES.push({ reino: r, estagio: st, index: stageIndex });
      st.desafiosIds.forEach((id) => {
        ordem++;
        WHERE[id] = { reino: r, estagio: st, stageIndex, ordem };
      });
    });
  });
  const ORDER = STAGES.flatMap((s) => s.estagio.desafiosIds);

  const levelsApi = () => root.Levels;
  const done = (data, id) => !!(data.levels[id] && data.levels[id].completed);

  /** Desafios na ordem da jornada (objetos de js/levels.js). */
  function orderedLevels() {
    return ORDER.map((id) => levelsApi().byId(id));
  }

  /** Posição do desafio na jornada (1 a 36) — é o "número" mostrado ao aluno. */
  function numero(id) {
    return WHERE[id] ? WHERE[id].ordem : null;
  }

  function onde(id) {
    return WHERE[id] || null;
  }

  function stageDone(data, k) {
    return STAGES[k].estagio.desafiosIds.every((id) => done(data, id));
  }

  /** O estágio k está aberto para jogar? */
  function stageUnlocked(data, k) {
    if (data.unlockAll || k === 0) return true;
    if (stageDone(data, k - 1)) return true;
    // retrocompatibilidade: já concluiu algo deste estágio ou de um posterior
    for (let j = k; j < STAGES.length; j++) {
      if (STAGES[j].estagio.desafiosIds.some((id) => done(data, id))) return true;
    }
    return false;
  }

  function levelUnlocked(data, id) {
    const w = WHERE[id];
    return !!w && stageUnlocked(data, w.stageIndex);
  }

  /** Reino rompido = os dois desafios do Pico concluídos. */
  function reinoRompido(data, reinoId) {
    const r = REINOS[reinoId - 1];
    return r.subEstagios[2].desafiosIds.every((id) => done(data, id));
  }

  /**
   * Situação atual do cultivador:
   *   reino     o reino mais avançado já aberto
   *   estagio   o estágio mais avançado aberto dentro dele
   *   qi        % de desafios concluídos nesse reino (energia até o rompimento)
   *   titulo    título marcial (o do último reino rompido)
   */
  function situacao(data) {
    let k = 0;
    for (let j = 0; j < STAGES.length; j++) if (stageUnlocked(data, j)) k = j;
    const reino = STAGES[k].reino;
    const estagio = STAGES[k].estagio;
    const ids = reino.subEstagios.flatMap((s) => s.desafiosIds);
    const feitos = ids.filter((id) => done(data, id)).length;
    const rompidos = REINOS.filter((r) => reinoRompido(data, r.id));
    const ultimo = rompidos[rompidos.length - 1];
    const completo = rompidos.length === REINOS.length;
    return {
      reino, estagio, qi: Math.round((feitos / ids.length) * 100), feitos, total: ids.length,
      rompido: reinoRompido(data, reino.id), completo,
      titulo: ultimo ? ultimo.titulo : 'Discípulo Mundano',
      rompidos: rompidos.map((r) => r.id),
    };
  }

  /** Próximo desafio aberto e ainda não concluído (na ordem da jornada). */
  function proximo(data, depoisDeId) {
    const start = depoisDeId ? ORDER.indexOf(+depoisDeId) + 1 : 0;
    const seq = ORDER.slice(start).concat(ORDER.slice(0, start));
    const id = seq.find((x) => levelUnlocked(data, x) && !done(data, x));
    return id ? levelsApi().byId(id) : null;
  }

  /**
   * Confere rompimentos novos depois de uma conclusão (ou importação).
   * Grava em data.cultivo.rompimentos e devolve os reinos recém-rompidos.
   * silencioso = true marca sem celebrar (progresso antigo ou importado).
   */
  function registrarRompimentos(data) {
    data.cultivo = data.cultivo || { rompimentos: {} };
    data.cultivo.rompimentos = data.cultivo.rompimentos || {};
    const novos = [];
    REINOS.forEach((r) => {
      if (reinoRompido(data, r.id) && !data.cultivo.rompimentos[r.id]) {
        data.cultivo.rompimentos[r.id] = new Date().toISOString();
        novos.push(r);
      }
    });
    const s = situacao(data);
    data.cultivo.reinoAtual = s.reino.id;
    data.cultivo.estagioAtual = s.estagio.tipo;
    return novos;
  }

  const api = {
    REINOS, ESTAGIOS, STAGES, ORDER, orderedLevels, numero, onde,
    stageUnlocked, stageDone, levelUnlocked, reinoRompido, situacao, proximo, registrarRompimentos,
  };
  root.Cultivo = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
