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
 * Os testes também podem consultar o progresso salvo (data = Store.data).
 * ========================================================================= */
(function (root) {
  'use strict';

  const ACHIEVEMENTS = [
    { id: 'primeiro', icon: '🐣', title: 'Primeiro comando', how: 'Execute seu primeiro programa.', test: (e) => e === 'run' },
    { id: 'aprendiz', icon: '📘', title: 'Aprendiz da Tartaruga', how: 'Conclua todas as aulas do tutorial.', test: (e, d, data) => Object.keys(data.lessons).length >= (root.TUTORIAL || []).length },
    { id: 'quadrado', icon: '⬜', title: 'Mestre do quadrado', how: 'Conclua o nível 5 (Quadrado com REPITA).', test: (e, d) => e === 'levelComplete' && d.level.id === 5 },
    { id: 'estrela', icon: '⭐', title: 'Criador de estrelas', how: 'Conclua o nível 8 (Estrela).', test: (e, d) => e === 'levelComplete' && d.level.id === 8 },
    { id: 'circulo', icon: '⭕', title: 'Senhor dos círculos', how: 'Conclua o nível 9 (Círculo).', test: (e, d) => e === 'levelComplete' && d.level.id === 9 },
    { id: 'repeticao', icon: '🔁', title: 'Mestre da repetição', how: 'Execute um programa com um REPITA dentro de outro REPITA.', test: (e, d) => e === 'run' && d.analysis.nestedRepeat },
    { id: 'persistente', icon: '💪', title: 'Persistente', how: 'Conclua um nível depois de errar pelo menos uma vez.', test: (e, d) => e === 'levelComplete' && d.hadErrors },
    { id: 'pensador', icon: '🧠', title: 'Pensador lógico', how: 'Ganhe 3 estrelas em 5 níveis.', test: (e, d, data) => Object.values(data.levels).filter((l) => l.stars >= 3).length >= 5 },
    { id: 'explorador', icon: '🧭', title: 'Explorador', how: 'Execute 5 exemplos diferentes da galeria.', test: (e, d, data) => data.galleryRuns.length >= 5 },
    { id: 'artista', icon: '🎨', title: 'Artista da Tartaruga', how: 'Salve ou compartilhe um desenho no Modo Livre.', test: (e) => e === 'art' },
    { id: 'mestre', icon: '🏆', title: 'Mestre da Tartaruga', how: 'Conclua o nível 15.', test: (e, d) => e === 'levelComplete' && d.level.id === 15 },
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
