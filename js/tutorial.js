/* =========================================================================
 * tutorial.js — "Aprenda a falar com a Tartaruga"
 * -------------------------------------------------------------------------
 * Cada aula:
 *   id, emoji, title
 *   html        explicação curta (pode usar <b>, <code>, <p>...)
 *   code        código que já aparece no editor
 *   tries       botões "Experimente": [{ code, label }]
 *   task        o que o aluno deve fazer para concluir a aula
 *   demo        'angles' mostra a demonstração de 90°/180°/270°/360°
 *   colorIterations  pinta cada volta do REPITA com uma cor
 *   concept     caixa de "lógica de programação" (opcional)
 * A aula é concluída quando o aluno executa um programa sem erros nela.
 * ========================================================================= */
(function (root) {
  'use strict';

  const TUTORIAL = [
    {
      id: 1, emoji: '🐢', title: 'Conhecendo a Tartaruga',
      html: `
        <p>A tartaruga é um <b>robô que recebe comandos</b>. Ela vive no meio da tela, olhando para cima.</p>
        <p>Você escreve uma ordem no editor e clica em <b>▶ Executar</b>. A tartaruga obedece — exatamente como você escreveu.</p>
        <p>O círculo no meio do casco é a <b>caneta</b>: por onde ela passa, deixa um rastro.</p>`,
      code: 'PF 100',
      task: 'Clique em ▶ Executar e veja a tartaruga andar.',
      tries: [],
    },
    {
      id: 2, emoji: '⬆️', title: 'Para Frente',
      html: `
        <p><code>PF</code> significa <b>PARA FRENTE</b>.</p>
        <p>O número depois do comando diz <b>quantos passos</b> a tartaruga anda. Mude o número e veja a diferença!</p>
        <p class="note">💡 As linhas da grade de fundo ficam a cada 50 passos — use-as para medir.</p>`,
      code: 'PF 100',
      task: 'Experimente números diferentes e execute.',
      tries: [{ code: 'PF 50' }, { code: 'PF 100' }, { code: 'PF 200' }],
    },
    {
      id: 3, emoji: '⬇️', title: 'Para Trás',
      html: `
        <p><code>PT</code> significa <b>PARA TRÁS</b>.</p>
        <p>A tartaruga anda de costas, <b>sem virar</b>: ela continua olhando para o mesmo lado.</p>`,
      code: 'PT 100',
      task: 'Execute e compare com PF.',
      tries: [{ code: 'PT 100' }, { code: 'PF 100\nPT 50' }, { code: 'PF 150\nPT 150' }],
    },
    {
      id: 4, emoji: '🔄', title: 'Girando',
      html: `
        <p><code>PD</code> = <b>PARA DIREITA</b> (sentido do relógio ↻)<br>
           <code>PE</code> = <b>PARA ESQUERDA</b> (contra o relógio ↺)</p>
        <p>O número agora não é passo: é <b>ângulo, em graus</b>. Girar não faz a tartaruga sair do lugar.</p>
        <ul class="angle-list">
          <li><b>90°</b> = um quarto de volta</li>
          <li><b>180°</b> = meia volta (fica de costas)</li>
          <li><b>270°</b> = três quartos de volta</li>
          <li><b>360°</b> = volta completa (olha para o mesmo lado de antes)</li>
        </ul>`,
      code: 'PD 90\nPF 100',
      task: 'Use os botões de demonstração e depois tente seus próprios giros.',
      demo: 'angles',
      tries: [{ code: 'PD 90\nPF 100' }, { code: 'PE 90\nPF 100' }, { code: 'PD 45\nPF 100' }, { code: 'PD 180\nPF 100' }],
    },
    {
      id: 5, emoji: '✏️', title: 'Caneta',
      html: `
        <p><code>BAIXE</code> = baixa a caneta: a tartaruga <b>desenha</b> enquanto anda.</p>
        <p><code>LEVANTE</code> = levanta a caneta: a tartaruga <b>anda sem desenhar</b>.</p>
        <p>Observe o centro do casco: cheio = caneta abaixada; tracejado = caneta levantada.</p>`,
      code: 'PF 50\nLEVANTE\nPF 50\nBAIXE\nPF 50',
      task: 'Execute e observe o espaço vazio no meio da linha.',
      tries: [{ code: 'PF 50\nLEVANTE\nPF 50\nBAIXE\nPF 50' }, { code: 'REPITA 5 [PF 20 LEVANTE PF 20 BAIXE]', label: 'linha tracejada' }],
    },
    {
      id: 6, emoji: '🧽', title: 'Limpar',
      html: `
        <p><code>LIMPE</code> apaga todo o desenho. A tartaruga <b>continua onde está</b>.</p>
        <p><code>CENTRO</code> leva a tartaruga de volta ao meio, olhando para cima, sem desenhar.</p>`,
      code: 'PF 100\nPD 90\nPF 100\nLIMPE\nCENTRO',
      task: 'Execute na velocidade 🐢 Lenta para ver o desenho sumir.',
      tries: [{ code: 'PF 100\nLIMPE\nPD 90\nPF 50' }, { code: 'PD 45\nPF 100\nCENTRO\nPF 50' }],
    },
    {
      id: 7, emoji: '🔁', title: 'Repetição',
      html: `
        <p>Em vez de escrever a mesma coisa várias vezes, podemos pedir para a tartaruga <b>repetir</b>.</p>
        <div class="compare-code">
          <div><span>Sem repetição (8 linhas)</span><pre>PF 100
PD 90
PF 100
PD 90
PF 100
PD 90
PF 100
PD 90</pre></div>
          <div><span>Com REPITA (1 linha)</span><pre>REPITA 4 [PF 100 PD 90]</pre></div>
        </div>
        <p>Formato: <code>REPITA</code> <i>quantas vezes</i> <code>[</code> <i>comandos</i> <code>]</code>.
           Nesta aula, <b>cada repetição ganha uma cor</b> para você enxergar as 4 voltas.</p>`,
      code: 'REPITA 4 [PF 100 PD 90]',
      task: 'Execute e conte as cores: uma para cada repetição.',
      colorIterations: true,
      tries: [{ code: 'REPITA 4 [PF 100 PD 90]' }, { code: 'REPITA 3 [PF 120 PD 120]' }, { code: 'REPITA 6 [PF 80 PD 60]' }],
      concept: {
        title: '🔁 Você acabou de aprender uma ideia muito importante da programação: LOOP.',
        text: 'Um <b>loop</b> (laço) é uma maneira de mandar o computador repetir uma tarefa. Ele existe em todas as linguagens de programação:',
        code: 'REPITA 4 [PF 100 PD 90]',
        compare: 'Python:\nfor volta in range(4):\n    frente(100)\n    direita(90)\n\nJavaScript:\nfor (let volta = 0; volta < 4; volta++) {\n  frente(100); direita(90);\n}',
      },
    },
  ];

  root.TUTORIAL = TUTORIAL;
  if (typeof module === 'object' && module.exports) module.exports = TUTORIAL;
})(typeof window !== 'undefined' ? window : globalThis);
