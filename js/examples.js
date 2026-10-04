/* =========================================================================
 * examples.js — Galeria "O que posso criar?"
 * Para adicionar um exemplo: { id, icon, title, text, code }.
 * ========================================================================= */
(function (root) {
  'use strict';

  const EXAMPLES = [
    { id: 'quadrado', icon: '⬜', title: 'Quadrado', text: '4 lados iguais e 4 giros de 90°.', code: 'REPITA 4 [PF 120 PD 90]' },
    { id: 'triangulo', icon: '△', title: 'Triângulo', text: '360 ÷ 3 = 120° em cada canto.', code: 'REPITA 3 [PF 150 PD 120]' },
    { id: 'estrela', icon: '⭐', title: 'Estrela', text: 'Duas voltas completas: 720 ÷ 5 = 144°.', code: 'REPITA 5 [PF 180 PD 144]' },
    { id: 'circulo', icon: '○', title: 'Círculo', text: 'Muitos passos pequenos e giros pequenos.', code: 'REPITA 36 [PF 12 PD 10]' },
    {
      id: 'casa', icon: '🏠', title: 'Casa', text: 'Quadrado (paredes) + triângulo (telhado).',
      code: '; paredes\nREPITA 4 [PF 100 PD 90]\n; sobe até o telhado\nPF 100\nPD 30\n; telhado\nREPITA 3 [PF 100 PD 120]',
    },
    {
      id: 'sol', icon: '☀️', title: 'Sol', text: 'Um círculo que desenha um raio a cada passo.',
      code: 'REPITA 24 [PF 18 PE 90 PF 45 PT 45 PD 105]',
    },
    { id: 'flor', icon: '🌸', title: 'Flor', text: 'Círculos girando em volta do centro (loop aninhado).', code: 'REPITA 8 [REPITA 36 [PF 7 PD 10] PD 45]' },
    {
      id: 'espiral', icon: '🌀', title: 'Espiral', text: 'Meias-voltas cada vez maiores.',
      code: 'PD 90\nREPITA 18 [PF 2 PD 10]\nREPITA 18 [PF 4 PD 10]\nREPITA 18 [PF 6 PD 10]\nREPITA 18 [PF 8 PD 10]\nREPITA 18 [PF 10 PD 10]\nREPITA 18 [PF 12 PD 10]\nREPITA 18 [PF 14 PD 10]',
    },
    {
      id: 'floco', icon: '❄️', title: 'Floco de neve', text: '6 braços, cada um com dois galhinhos em V.',
      code: 'REPITA 6 [\n  PF 100 PT 40\n  PE 45 PF 35 PT 35\n  PD 90 PF 35 PT 35\n  PE 45 PT 60\n  PD 60\n]',
    },
    { id: 'padroes', icon: '🧩', title: 'Padrões', text: 'Um quadrado girado 36 vezes.', code: 'REPITA 36 [REPITA 4 [PF 110 PD 90] PD 10]' },
    { id: 'catavento', icon: '🎡', title: 'Catavento', text: 'Triângulos girando em volta do início.', code: 'REPITA 8 [REPITA 3 [PF 110 PD 120] PD 45]' },
    {
      id: 'tracejado', icon: '➖', title: 'Linha tracejada', text: 'LEVANTE e BAIXE dentro de um REPITA.',
      code: 'PD 90\nLEVANTE PT 200 BAIXE\nREPITA 10 [PF 20 LEVANTE PF 20 BAIXE]',
    },
  ];

  root.EXAMPLES = EXAMPLES;
  if (typeof module === 'object' && module.exports) module.exports = EXAMPLES;
})(typeof window !== 'undefined' ? window : globalThis);
