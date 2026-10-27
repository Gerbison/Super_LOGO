/* =========================================================================
 * examples.js — Galeria "O que posso criar?"
 * Para adicionar um exemplo: { id, icon, title, text, code }.
 * O código NÃO aparece para o aluno (ele reproduz o desenho). Mantenha o
 * "text" neutro: sem números, ângulos, comandos ou técnicas que entreguem a resposta.
 * ========================================================================= */
(function (root) {
  'use strict';

  const EXAMPLES = [
    { id: 'quadrado', icon: '⬜', title: 'Quadrado', text: 'Uma forma simples e equilibrada.', code: 'REPITA 4 [PF 120 PD 90]' },
    { id: 'triangulo', icon: '△', title: 'Triângulo', text: 'Três pontas apontando para fora.', code: 'REPITA 3 [PF 150 PD 120]' },
    { id: 'estrela', icon: '⭐', title: 'Estrela', text: 'Cinco pontas brilhando.', code: 'REPITA 5 [PF 180 PD 144]' },
    { id: 'circulo', icon: '○', title: 'Círculo', text: 'Uma curva que volta ao começo.', code: 'REPITA 36 [PF 12 PD 10]' },
    {
      id: 'casa', icon: '🏠', title: 'Casa', text: 'Paredes e telhado de um pavilhão.',
      code: '; paredes\nREPITA 4 [PF 100 PD 90]\n; sobe até o telhado\nPF 100\nPD 30\n; telhado\nREPITA 3 [PF 100 PD 120]',
    },
    {
      id: 'sol', icon: '☀️', title: 'Sol', text: 'Um astro cercado de raios.',
      code: 'REPITA 24 [PF 18 PE 90 PF 45 PT 45 PD 105]',
    },
    { id: 'flor', icon: '🌸', title: 'Flor', text: 'Pétalas abertas ao redor do centro.', code: 'REPITA 8 [REPITA 36 [PF 7 PD 10] PD 45]' },
    {
      id: 'espiral', icon: '🌀', title: 'Espiral', text: 'Um caracol que se abre.',
      code: 'PD 90\nREPITA 18 [PF 2 PD 10]\nREPITA 18 [PF 4 PD 10]\nREPITA 18 [PF 6 PD 10]\nREPITA 18 [PF 8 PD 10]\nREPITA 18 [PF 10 PD 10]\nREPITA 18 [PF 12 PD 10]\nREPITA 18 [PF 14 PD 10]',
    },
    {
      id: 'floco', icon: '❄️', title: 'Floco de neve', text: 'Um cristal de gelo delicado.',
      code: 'REPITA 6 [\n  PF 100 PT 40\n  PE 45 PF 35 PT 35\n  PD 90 PF 35 PT 35\n  PE 45 PT 60\n  PD 60\n]',
    },
    { id: 'padroes', icon: '🧩', title: 'Padrões', text: 'Uma trama hipnótica.', code: 'REPITA 36 [REPITA 4 [PF 110 PD 90] PD 10]' },
    { id: 'catavento', icon: '🎡', title: 'Catavento', text: 'Pás que parecem girar ao vento.', code: 'REPITA 8 [REPITA 3 [PF 110 PD 120] PD 45]' },
    {
      id: 'tracejado', icon: '➖', title: 'Linha tracejada', text: 'Um caminho com intervalos.',
      code: 'PD 90\nLEVANTE PT 200 BAIXE\nREPITA 10 [PF 20 LEVANTE PF 20 BAIXE]',
    },
    { id: 'redemoinho', icon: '🌀', title: 'Redemoinho', text: 'Um turbilhão que cresce para fora.', code: 'REPITA 60 [PF REPCONT * 3 PD 91]' },
    {
      id: 'arvore', icon: '🌳', title: 'Árvore fractal', text: 'Galhos que se espalham como uma copa.',
      code: `PARA ARVORE :T :N
  SE :N = 0 [PARE]
  PF :T PE 25
  ARVORE :T * 0.72 :N - 1
  PD 50
  ARVORE :T * 0.72 :N - 1
  PE 25 PT :T
FIM
LEVANTE PT 160 BAIXE
ARVORE 95 8`,
    },
    {
      id: 'koch', icon: '❄️', title: 'Floco de Koch', text: 'Um floco de bordas infinitamente recortadas.',
      code: `PARA KOCH :T :N
  SE :N = 0 [PF :T PARE]
  KOCH :T / 3 :N - 1  PE 60
  KOCH :T / 3 :N - 1  PD 120
  KOCH :T / 3 :N - 1  PE 60
  KOCH :T / 3 :N - 1
FIM
PD 30
REPITA 3 [KOCH 220 4 PD 120]`,
    },
  ];

  root.EXAMPLES = EXAMPLES;
  if (typeof module === 'object' && module.exports) module.exports = EXAMPLES;
})(typeof window !== 'undefined' ? window : globalThis);
