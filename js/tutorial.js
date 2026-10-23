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
    /* ---------- Pergaminhos avançados (preparam os Reinos 5 e 6) ---------- */
    {
      id: 8, emoji: '🔢', title: 'O Número da Volta (REPCONT)', avancada: true,
      html: `
        <p class="note">📜 Pergaminho do Reino 5 — Mestre da Matriz.</p>
        <p>Dentro de um <code>REPITA</code>, a palavra <code>REPCONT</code> vale o <b>número da volta atual</b>: 1 na primeira, 2 na segunda, 3 na terceira...</p>
        <p>Com ela dá para fazer contas: <code>PF REPCONT * 5</code> anda 5, depois 10, depois 15... Use <code>+ - * /</code> e parênteses.</p>`,
      code: 'REPITA 40 [PF REPCONT * 5 PD 90]',
      task: 'Execute e veja a espiral crescer. Depois troque o 90 por 91.',
      tries: [{ code: 'REPITA 40 [PF REPCONT * 5 PD 90]' }, { code: 'REPITA 60 [PF REPCONT * 3 PD 91]' }, { code: 'REPITA 72 [PF REPCONT / 2 PD 15]' }],
      concept: {
        title: '🔢 O contador do laço',
        text: 'Toda linguagem tem um jeito de saber em que volta o laço está. Em outras linguagens ele costuma se chamar <b>i</b>:',
        code: 'REPITA 40 [PF REPCONT * 5 PD 90]',
        compare: 'Python:\nfor i in range(1, 41):\n    frente(i * 5)\n    direita(90)',
      },
    },
    {
      id: 9, emoji: '📜', title: 'Criando Comandos (PARA … FIM)', avancada: true,
      html: `
        <p class="note">📜 Pergaminho do Reino 5 — Mestre da Matriz.</p>
        <p>Você pode <b>ensinar comandos novos</b> à tartaruga com <code>PARA</code> <i>nome</i> ... <code>FIM</code>.</p>
        <p>Valores com dois-pontos, como <code>:LADO</code>, são <b>parâmetros</b>: cada vez que o comando é usado, recebe um número diferente.</p>
        <pre class="snippet">PARA QUADRADO :LADO
  REPITA 4 [PF :LADO PD 90]
FIM
QUADRADO 50
QUADRADO 100</pre>`,
      code: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM\nQUADRADO 50\nQUADRADO 100\nQUADRADO 150',
      task: 'Execute e depois crie um TRIANGULO :LADO.',
      tries: [
        { code: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM\nREPITA 8 [QUADRADO 80 PD 45]', label: '8 quadrados girando' },
        { code: 'PARA POLIGONO :N :LADO\n  REPITA :N [PF :LADO PD 360 / :N]\nFIM\nPOLIGONO 3 100\nPOLIGONO 5 80\nPOLIGONO 8 50', label: 'polígono de N lados' },
      ],
      concept: {
        title: '📜 Procedimentos (funções)',
        text: 'Dar nome a um pedaço de código e reaproveitá-lo é uma das ideias mais poderosas da programação. Em outras linguagens chama-se <b>função</b>:',
        compare: 'Python:\ndef quadrado(lado):\n    for i in range(4):\n        frente(lado)\n        direita(90)\n\nquadrado(50)\nquadrado(100)',
      },
    },
    {
      id: 10, emoji: '🌀', title: 'Decidir e Recursão (SE, PARE)', avancada: true,
      html: `
        <p class="note">📜 Pergaminho do Reino 6 — O Iluminado do Dao.</p>
        <p><code>SE</code> <i>condição</i> <code>[ ... ]</code> só executa o bloco quando a condição é verdadeira. Comparações: <code>=  &lt;  &gt;  &lt;=  &gt;=  &lt;&gt;</code>. Pode ter <code>SENAO [ ... ]</code>.</p>
        <p><code>PARE</code> encerra o procedimento na hora.</p>
        <p>Um procedimento pode <b>chamar a si mesmo</b> com um valor menor: isso é <b>recursão</b>. O <code>SE ... [PARE]</code> é a condição de parada — sem ela, nunca terminaria!</p>`,
      code: 'PARA ESPIRAL :T\n  SE :T > 150 [PARE]\n  PF :T PD 90\n  ESPIRAL :T + 8\nFIM\nESPIRAL 8',
      task: 'Execute e depois experimente a árvore.',
      tries: [
        { code: 'PARA ARVORE :T :N\n  SE :N = 0 [PARE]\n  PF :T PE 30\n  ARVORE :T * 0.7 :N - 1\n  PD 60\n  ARVORE :T * 0.7 :N - 1\n  PE 30 PT :T\nFIM\nLEVANTE PT 120 BAIXE\nARVORE 80 5', label: 'árvore recursiva' },
        { code: 'PARA DEGRAU :N\n  SE :N = 0 [PARE]\n  PF 20 PD 90 PF 20 PE 90\n  DEGRAU :N - 1\nFIM\nDEGRAU 8', label: 'escada recursiva' },
      ],
      concept: {
        title: '🌀 Recursividade',
        text: 'Recursão é resolver um problema usando uma versão menor do mesmo problema. Os fractais (Koch, Sierpinski, árvores) são desenhados assim.',
        compare: 'Python:\ndef espiral(t):\n    if t > 150:\n        return\n    frente(t)\n    direita(90)\n    espiral(t + 8)',
      },
    },
  ];

  root.TUTORIAL = TUTORIAL;
  if (typeof module === 'object' && module.exports) module.exports = TUTORIAL;
})(typeof window !== 'undefined' ? window : globalThis);
