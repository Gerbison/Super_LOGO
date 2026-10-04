/* =========================================================================
 * fractals.js — Laboratório de Fractais (EM BREVE)
 * -------------------------------------------------------------------------
 * Este arquivo prepara o terreno para um futuro nível sobre RECURSIVIDADE,
 * usando como referência a Curva de Koch, clássica nos exemplos de LOGO.
 *
 * Hoje a linguagem do aluno ainda não tem procedimentos (PARA ... FIM),
 * variáveis (:tamanho) nem condicionais (SE). Por isso, aqui a curva é gerada
 * em JavaScript, produzindo a MESMA lista de ações que o interpretador gera
 * (move/turn). Ela já é usada para a prévia no mapa e no Modo Professor.
 *
 * Roteiro para ativar o laboratório:
 *   1. logo.js → expression(): aceitar variáveis (:tamanho) e contas (/ 3, - 1).
 *   2. logo.js → registrar PARA/FIM, guardando procedimentos em ctx.procedures.
 *   3. logo.js → registrar SE [condição] [comandos] e PARE.
 *   4. levels.js → criar o nível com solution = FUTURE_CODE e mode 'shape'.
 * ========================================================================= */
(function (root) {
  'use strict';

  /** Código que o aluno poderá escrever quando a linguagem tiver procedimentos. */
  const FUTURE_CODE = [
    'PARA KOCH :tamanho :nivel',
    '  SE :nivel = 0 [PF :tamanho PARE]',
    '  KOCH :tamanho / 3  :nivel - 1',
    '  PE 60',
    '  KOCH :tamanho / 3  :nivel - 1',
    '  PD 120',
    '  KOCH :tamanho / 3  :nivel - 1',
    '  PE 60',
    '  KOCH :tamanho / 3  :nivel - 1',
    'FIM',
    '',
    'REPITA 3 [KOCH 240 3  PD 120]',
  ].join('\n');

  /** Curva de Koch: lista de ações (mesmo formato do interpretador). */
  function kochActions(size, depth, out) {
    out = out || [];
    const loops = [];
    (function koch(s, d) {
      if (d === 0) { out.push({ type: 'move', dist: s, loops }); return; }
      koch(s / 3, d - 1); out.push({ type: 'turn', angle: -60, loops });
      koch(s / 3, d - 1); out.push({ type: 'turn', angle: 120, loops });
      koch(s / 3, d - 1); out.push({ type: 'turn', angle: -60, loops });
      koch(s / 3, d - 1);
    })(size, depth);
    return out;
  }

  /** Floco de neve de Koch: 3 curvas formando um triângulo. */
  function snowflakeActions(size, depth) {
    const out = [{ type: 'turn', angle: 30, loops: [] }];
    for (let i = 0; i < 3; i++) {
      kochActions(size, depth, out);
      out.push({ type: 'turn', angle: 120, loops: [] });
    }
    return out;
  }

  const api = {
    FUTURE_CODE, kochActions, snowflakeActions,
    title: 'Laboratório de Fractais',
    description: 'Fractais são figuras que se repetem dentro de si mesmas. A Curva de Koch é feita trocando cada linha reta por 4 linhas menores — e repetindo isso de novo e de novo. Para programá-la, a tartaruga vai aprender a criar seus próprios comandos que chamam a si mesmos: a RECURSIVIDADE.',
  };
  root.Fractals = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
