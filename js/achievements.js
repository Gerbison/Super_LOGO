/* =========================================================================
 * achievements.js — Conquistas (badges)
 * -------------------------------------------------------------------------
 * Cada conquista tem um teste test(evento, dados). O app chama
 * Achievements.check(evento, dados) e recebe as conquistas recém-ganhas.
 *
 * Eventos enviados pelo app:
 *   'run'           { analysis }                 programa executado sem erro
 *   'levelComplete' { level, stars, hadErrors }  nível concluído
 *   'lesson'        {}                           aula concluída
 *   'art'           {}                           desenho salvo/exportado
 *   'gallery'       {}                           exemplo da galeria executado
 *   'sync'          {}                           progresso importado por código
 *   'breakthrough'  { reino }                    Rompimento de Reino (cultivo.js)
 * Os testes também podem consultar o progresso salvo (data = Store.data).
 * ========================================================================= */
(function (root) {
  'use strict';

  /* Nível concluído agora — ou já concluído, ao trazer progresso por código. */
  const levelDone = (id) => (e, d, data) =>
    (e === 'levelComplete' && d.level.id === id) || (e === 'sync' && !!(data.levels[id] && data.levels[id].completed));

  /* Reino rompido (os dois desafios do Pico) — também ao importar um código. */
  const rompeu = (reino) => (e, d, data) =>
    (e === 'breakthrough' && d.reino && d.reino.id === reino) ||
    (e === 'sync' && !!(data.cultivo && data.cultivo.rompimentos && data.cultivo.rompimentos[reino]));

  const ACHIEVEMENTS = [
    { id: 'primeiro', icon: '🐣', title: 'O Primeiro Sopro', how: 'Execute seu primeiro programa.', test: (e) => e === 'run' },
    { id: 'aprendiz', icon: '📜', title: 'Discípulo dos Pergaminhos', how: 'Conclua todas as aulas do tutorial.', test: (e, d, data) => Object.keys(data.lessons).length >= (root.TUTORIAL || []).length },
    { id: 'quadrado', icon: '⬜', title: 'O Selo do Quadrado', how: 'Conclua “O Ciclo dos Quatro Ventos” (quadrado com REPITA).', test: levelDone(5) },
    { id: 'estrela', icon: '⭐', title: 'Estrela das Cinco Virtudes', how: 'Conclua “A Estrela das Cinco Virtudes”.', test: levelDone(8) },
    { id: 'circulo', icon: '⭕', title: 'Senhor do Ciclo Eterno', how: 'Conclua “O Círculo do Ciclo Eterno”.', test: levelDone(9) },
    { id: 'repeticao', icon: '🔁', title: 'Laço dentro do Laço', how: 'Execute um programa com um REPITA dentro de outro REPITA.', test: (e, d) => e === 'run' && d.analysis.nestedRepeat },
    { id: 'persistente', icon: '💪', title: 'Coração Persistente', how: 'Conclua um desafio depois de errar pelo menos uma vez.', test: (e, d) => e === 'levelComplete' && d.hadErrors },
    { id: 'pensador', icon: '🧠', title: 'Mente Refinada', how: 'Ganhe 3 estrelas em 5 desafios.', test: (e, d, data) => Object.values(data.levels).filter((l) => l.stars >= 3).length >= 5 },
    { id: 'explorador', icon: '🧭', title: 'Andarilho das Galerias', how: 'Execute 5 exemplos diferentes da galeria.', test: (e, d, data) => data.galleryRuns.length >= 5 },
    { id: 'artista', icon: '🎨', title: 'Pincel do Dao', how: 'Salve ou compartilhe um desenho no Modo Livre.', test: (e) => e === 'art' },
    { id: 'tecnica', icon: '📜', title: 'Técnica Nomeada', how: 'Execute um programa que cria um comando com PARA … FIM.', test: (e, d) => e === 'run' && d.analysis.usesProcedures },
    { id: 'recursao', icon: '🌀', title: 'Espelho Infinito', how: 'Execute um programa com recursão (um comando que chama a si mesmo).', test: (e, d) => e === 'run' && d.analysis.recursive },
    { id: 'reino1', icon: '🐢', title: 'Rompimento: O Primeiro Traço', how: 'Vença o Pico do Reino 1.', test: rompeu(1) },
    { id: 'reino2', icon: '🔁', title: 'Rompimento: O Laço Harmônico', how: 'Vença o Pico do Reino 2.', test: rompeu(2) },
    { id: 'reino3', icon: '🪷', title: 'Rompimento: Geometria Espiritual', how: 'Vença o Pico do Reino 3.', test: rompeu(3) },
    { id: 'reino4', icon: '⚗️', title: 'Rompimento: Refinamento Puro', how: 'Vença o Pico do Reino 4.', test: rompeu(4) },
    { id: 'reino5', icon: '🌀', title: 'Rompimento: Mestre da Matriz', how: 'Vença o Pico do Reino 5.', test: rompeu(5) },
    { id: 'mestre', icon: '☯️', title: 'Iluminado do Dao', how: 'Vença o Pico do Reino 6 (A Mandala Celestial do Dao).', test: (e, d, data) => levelDone(36)(e, d, data) || rompeu(6)(e, d, data) },
  ];

  /** Retorna as conquistas novas (e já as marca em data.achievements). */
  function check(event, details, data) {
    const unlocked = [];
    for (const a of ACHIEVEMENTS) {
      if (data.achievements[a.id]) continue;
      let ok = false;
      try { ok = a.test(event, details || {}, data); } catch (err) { ok = false; }
      if (ok) {
        data.achievements[a.id] = new Date().toISOString();
        unlocked.push(a);
      }
    }
    return unlocked;
  }

  const api = { ACHIEVEMENTS, check };
  root.Achievements = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
