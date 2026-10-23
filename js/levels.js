/* =========================================================================
 * levels.js — Os desafios (níveis) da Jornada da Tartaruga
 * -------------------------------------------------------------------------
 * COMO ADICIONAR UM NÍVEL: copie um objeto da lista LEVELS e altere.
 * O desenho-alvo é gerado AUTOMATICAMENTE a partir de "solution" — não é
 * preciso desenhar nada à mão. O aluno pode resolver com qualquer código
 * que produza o mesmo desenho.
 *
 * Campos de um nível:
 *   id           número do nível (ordem no mapa)
 *   icon, title  ícone e nome
 *   challenge    o desafio, em linguagem simples (o que o aluno lê)
 *   solution     um código que desenha o alvo (gera o desenho-alvo)
 *   par          meta de tamanho do código para ganhar ⭐⭐⭐ (nº de comandos)
 *   technique    técnica que vale a 2ª estrela: 'REPITA' | 'PARA' | 'REPCONT' |
 *                'RECURSAO' | null (nos antigos: repeatUseful true = 'REPITA')
 *   limit        (Reino 4) máximo de comandos — acima disso não conta
 *   title/shape/lore  nome de cultivo, forma geométrica e ambientação
 *   (reino e estágio de cada desafio ficam em js/cultivo.js)
 *   requires     comandos obrigatórios. Ex.: ['REPITA'] ou [['PD','PE']] (um dos dois)
 *   match        'exact' (mesmo lugar) ou 'shape' (aceita deslocar/espelhar/girar 90°)
 *   tolerance    distância aceita, em passos (padrão 5)
 *   finalAtStart a tartaruga precisa terminar no ponto inicial?
 *   mystery      true = não dá pistas de código no enunciado
 *   hints        3 dicas, da mais leve à mais forte (nunca a resposta pronta)
 *   success      frase de parabéns
 *   concept      explicação de lógica de programação mostrada ao concluir
 *   goal, commands, concepts, teacherTip  → usados no Modo Professor
 * ========================================================================= */
(function (root) {
  'use strict';

  const LEVELS = [
    {
      id: 1, icon: '🐢', title: 'Primeiros Passos',
      challenge: 'Faça a tartaruga andar 100 passos para frente.',
      solution: 'PF 100',
      par: 1, repeatUseful: false, requires: ['PF'], match: 'exact',
      hints: [
        'Para andar para frente usamos o comando PF.',
        'Depois de PF, escreva quantos passos a tartaruga deve andar.',
        'O número de passos deste desafio é 100.',
      ],
      success: 'Você deu os primeiros passos com a tartaruga!',
      concept: {
        title: '💡 Comando + parâmetro',
        text: 'Muitos comandos precisam de uma informação extra para funcionar. Em <code>PF 100</code>, o número 100 é o <b>parâmetro</b> do comando PF: ele diz <i>quanto</i> andar.',
      },
      goal: 'Reconhecer que um programa é feito de comandos e que o número é um parâmetro.',
      commands: ['PF'], concepts: ['Comando', 'Parâmetro'],
      teacherTip: 'Peça para testarem PF 50, PF 200 e PF -100 e explicarem a diferença.',
    },
    {
      id: 2, icon: '↩️', title: 'Voltando',
      challenge: 'Faça a tartaruga andar 100 passos para frente e depois voltar ao ponto inicial.',
      solution: 'PF 100\nPT 100',
      par: 2, repeatUseful: false, requires: ['PT'], match: 'exact', finalAtStart: true,
      hints: [
        'PT significa PARA TRÁS: a tartaruga anda de costas.',
        'Para voltar ao início, ande para trás a mesma distância que andou para frente.',
        'Primeiro um PF, depois um PT — os dois com o mesmo número.',
      ],
      success: 'A tartaruga foi e voltou direitinho!',
      concept: {
        title: '💡 Ações opostas',
        text: 'PF e PT são <b>ações opostas</b>: uma desfaz a outra. Perceber isso ajuda a planejar caminhos e a corrigir erros.',
      },
      goal: 'Usar PT e perceber movimentos opostos.',
      commands: ['PF', 'PT'], concepts: ['Sequência', 'Ações opostas'],
      teacherTip: 'Pergunte: o que acontece com PF 100 PT 150? Onde a tartaruga para?',
    },
    {
      id: 3, icon: '📐', title: 'Primeiro Giro',
      challenge: 'Ande 100 passos, gire 90° e ande mais 100 passos, formando um ângulo reto (um “L”).',
      solution: 'PF 100\nPD 90\nPF 100',
      par: 3, repeatUseful: false, requires: [['PD', 'PE']], match: 'shape',
      hints: [
        'Primeiro a tartaruga anda para frente.',
        'PD 90 faz a tartaruga girar um quarto de volta para a direita.',
        'Depois do giro, ela anda para frente de novo.',
      ],
      success: 'Você fez a tartaruga formar um ângulo!',
      concept: {
        title: '💡 Sequência',
        text: 'O computador executa os comandos <b>um depois do outro, na ordem em que foram escritos</b>. Trocar a ordem muda o resultado — experimente!',
      },
      goal: 'Combinar movimento e giro; entender ângulo reto.',
      commands: ['PF', 'PD', 'PE'], concepts: ['Sequência', 'Ângulo'],
      teacherTip: 'Compare PD 90 e PE 90: o desenho espelha. Os dois são aceitos.',
    },
    {
      id: 4, icon: '⬜', title: 'Quadrado',
      challenge: 'Desenhe um quadrado com lados de 100 passos.',
      solution: 'PF 100\nPD 90\nPF 100\nPD 90\nPF 100\nPD 90\nPF 100\nPD 90',
      // repeatUseful false: aqui o aluno ainda não conhece REPITA; 8 comandos já valem ⭐⭐
      par: 3, repeatUseful: false, requires: [], match: 'shape',
      hints: [
        'Um quadrado possui 4 lados.',
        'Todos os lados possuem o mesmo tamanho e todos os cantos têm 90°.',
        'Ande e gire... e faça isso 4 vezes. Será que dá para escrever isso mais curto?',
      ],
      success: 'Você conseguiu criar um quadrado.',
      concept: {
        title: '💡 Encontrando padrões',
        text: 'Percebeu que você escreveu os mesmos comandos 4 vezes? Quando algo se <b>repete</b>, a programação tem um atalho. Você vai conhecê-lo no próximo nível!',
      },
      goal: 'Construir um polígono por sequência e perceber o padrão que se repete.',
      commands: ['PF', 'PD'], concepts: ['Sequência', 'Padrão'],
      teacherTip: 'Peça para criarem o quadrado SEM REPITA e contarem as linhas do código.',
    },
    {
      id: 5, icon: '🔁', title: 'Quadrado com REPITA',
      challenge: 'Desenhe um quadrado com lados de 150 passos usando REPITA.',
      solution: 'REPITA 4 [PF 150 PD 90]',
      par: 3, repeatUseful: true, requires: ['REPITA'], match: 'shape',
      hints: [
        'REPITA faz a tartaruga repetir comandos.',
        'O formato é: REPITA quantas-vezes [ comandos ].',
        'Quais comandos se repetem num quadrado? E quantas vezes?',
      ],
      success: 'Você desenhou um quadrado com uma única linha de código!',
      concept: {
        title: '🔁 Você aprendeu LOOP!',
        text: 'Você acabou de aprender uma ideia muito importante da programação: o <b>LOOP</b> (laço de repetição). Um loop é uma maneira de mandar o computador repetir uma tarefa.',
        code: 'REPITA 4 [PF 150 PD 90]',
        compare: 'Em Python seria:\nfor volta in range(4):\n    frente(150)\n    direita(90)',
      },
      goal: 'Introduzir o laço de repetição (loop).',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop', 'Abstração'],
      teacherTip: 'Compare o tamanho do código com o do nível 4: 8 comandos contra 1 linha.',
    },
    {
      id: 6, icon: '▭', title: 'Retângulo',
      challenge: 'Desenhe um retângulo com 200 passos de largura e 100 passos de altura.',
      solution: 'REPITA 2 [PF 100 PD 90 PF 200 PD 90]',
      par: 5, repeatUseful: true, requires: [], match: 'shape',
      hints: [
        'Um retângulo tem lados opostos iguais: dois lados de 100 e dois de 200.',
        'Ande 100, gire, ande 200, gire... e depois? O que se repete?',
        'O bloco que se repete tem 4 comandos e acontece 2 vezes.',
      ],
      success: 'Você criou um retângulo — nem todo desenho precisa de lados iguais!',
      concept: {
        title: '💡 O bloco que se repete',
        text: 'Nem sempre o padrão é um único passo. Aqui o bloco repetido tem <b>4 comandos</b> e se repete <b>2 vezes</b>. Encontrar o bloco certo é uma habilidade de programador.',
      },
      goal: 'Identificar padrões compostos (bloco com mais de um lado).',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop', 'Padrão'],
      teacherTip: 'Desafie: desenhar o retângulo deitado e em pé. Os dois são aceitos.',
    },
    {
      id: 7, icon: '△', title: 'Triângulo',
      challenge: 'Desenhe um triângulo com 3 lados iguais de 150 passos.',
      solution: 'REPITA 3 [PF 150 PD 120]',
      par: 3, repeatUseful: true, requires: [], match: 'shape',
      hints: [
        'Um triângulo equilátero tem 3 lados iguais e 3 giros iguais.',
        'Para fechar a figura, a tartaruga precisa dar uma volta completa: 360°.',
        'Divida a volta completa (360°) pelo número de lados.',
      ],
      success: 'Triângulo perfeito! Você descobriu o ângulo certo.',
      concept: {
        title: '💡 A regra da volta completa',
        text: 'Em qualquer polígono regular a tartaruga gira, no total, 360°. Por isso: <b>giro = 360 ÷ número de lados</b>. Triângulo: 120°. Quadrado: 90°. Hexágono: 60°.',
      },
      goal: 'Relacionar ângulo externo e número de lados (360° ÷ n).',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop', 'Ângulo externo'],
      teacherTip: 'Muitos alunos tentam PD 60 (ângulo interno). Deixe-os errar e observar!',
    },
    {
      id: 8, icon: '⭐', title: 'Estrela',
      challenge: 'Desenhe uma estrela de 5 pontas com linhas de 150 passos.',
      solution: 'REPITA 5 [PF 150 PD 144]',
      par: 3, repeatUseful: true, requires: [], match: 'shape', tolerance: 6,
      hints: [
        'A estrela tem 5 pontas: algo se repete 5 vezes.',
        'Os giros da estrela são bem maiores que os de um pentágono (72°).',
        'Para desenhar a estrela, a tartaruga dá DUAS voltas completas: 2 × 360°.',
      ],
      success: 'Você criou uma estrela! ⭐',
      concept: {
        title: '💡 Experimentar faz parte',
        text: 'Programadores testam hipóteses: "e se o ângulo for 144?". Mudar um número e observar o resultado é uma forma poderosa de aprender.',
      },
      goal: 'Experimentar ângulos e repetições; perceber voltas múltiplas.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Experimentação', 'Ângulo'],
      teacherTip: 'Proponha testar PD 144, PD 150, PD 160 e descrever o que muda.',
    },
    {
      id: 9, icon: '○', title: 'Círculo',
      challenge: 'Desenhe um círculo usando muitos passos pequenos e giros pequenos. O caminho todo deve somar 360 passos.',
      solution: 'REPITA 360 [PF 1 PD 1]',
      par: 3, repeatUseful: true, requires: [], match: 'shape',
      hints: [
        'O computador não desenha círculos perfeitos: ele faz um polígono com muitos ladinhos.',
        'Se a tartaruga girar 1° de cada vez, quantas vezes ela precisa girar para dar uma volta completa?',
        'Tente REPITA 36 [ PF ? PD 10 ]. Quanto ela precisa andar em cada passo para somar 360?',
      ],
      success: 'Um círculo feito de linhas retas — que esperto!',
      concept: {
        title: '💡 Aproximação',
        text: 'Um círculo pode ser <b>aproximado</b> com muitos pequenos movimentos e pequenos giros. Quanto menores os passos, mais redondo fica. Computadores fazem isso o tempo todo!',
      },
      goal: 'Entender aproximação: curva como muitos segmentos.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Aproximação', 'Loop'],
      teacherTip: 'Compare REPITA 360 [PF 1 PD 1] e REPITA 36 [PF 10 PD 10]: os dois são aceitos.',
    },
    {
      id: 10, icon: '🏠', title: 'Casa',
      challenge: 'Desenhe uma casa: um quadrado de lado 100 com um telhado triangular (lados de 100) em cima.',
      solution: 'REPITA 4 [PF 100 PD 90]\nPF 100\nPD 30\nREPITA 3 [PF 100 PD 120]',
      par: 8, repeatUseful: true, requires: [], match: 'shape',
      hints: [
        'Divida o problema: primeiro as paredes (quadrado), depois o telhado (triângulo).',
        'Depois do quadrado, a tartaruga precisa subir até o topo da parede para começar o telhado.',
        'Antes do telhado, gire 30° para a direita: assim o triângulo fica apoiado em cima da parede.',
      ],
      success: 'Que casa bonita! Você combinou duas formas.',
      concept: {
        title: '💡 Decomposição',
        text: 'Você dividiu um problema grande em partes menores (paredes + telhado). Isso se chama <b>decomposição</b> — é como programadores resolvem problemas complexos.',
      },
      goal: 'Decompor uma figura em partes e posicionar a tartaruga entre elas.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Decomposição', 'Estado da tartaruga'],
      teacherTip: 'Peça para desenharem a casa no papel e marcarem onde a tartaruga está após cada parte.',
    },
    {
      id: 11, icon: '☀️', title: 'Sol',
      challenge: 'Desenhe um sol: um círculo de 18 ladinhos (20 passos cada) com um raio de 30 passos para fora em cada cantinho.',
      solution: 'REPITA 18 [PF 20 PE 90 PF 30 PT 30 PD 110]',
      par: 6, repeatUseful: true, requires: ['REPITA'], match: 'shape',
      hints: [
        'Comece desenhando só o círculo: REPITA 18 [PF 20 PD 20].',
        'Em cada passo do círculo, desenhe um raio para fora: vire, ande, volte e desvire.',
        'Para fora do círculo é para a ESQUERDA (o círculo gira para a direita). Não esqueça de desfazer o giro do raio!',
      ],
      success: 'O sol está brilhando! ☀️',
      concept: {
        title: '💡 Um bloco com várias tarefas',
        text: 'O bloco dentro do REPITA pode fazer várias coisas: andar um pedaço do círculo <b>e</b> desenhar um raio. Cada volta do loop executa o bloco inteiro.',
      },
      goal: 'Montar um bloco de repetição com várias tarefas.',
      commands: ['REPITA', 'PF', 'PT', 'PD', 'PE'], concepts: ['Loop', 'Ida e volta'],
      teacherTip: 'Mostre que PE 90 ... PD 90 se anulam: dá para juntar PD 90 + PD 20 em PD 110.',
    },
    {
      id: 12, icon: '🌸', title: 'Flor',
      challenge: 'Desenhe uma flor com 6 pétalas redondas. Cada pétala é um círculo de 36 ladinhos de 8 passos.',
      solution: 'REPITA 6 [REPITA 36 [PF 8 PD 10] PD 60]',
      par: 5, repeatUseful: true, requires: ['REPITA'], match: 'shape',
      hints: [
        'Cada pétala é um círculo: REPITA 36 [PF 8 PD 10].',
        'Depois de cada pétala, gire a tartaruga. 6 pétalas dividem a volta completa em 6 partes.',
        'Você pode colocar um REPITA dentro de outro REPITA!',
      ],
      success: 'Uma flor desabrochou! 🌸',
      concept: {
        title: '🔁 Loop dentro de loop',
        text: 'Você usou um <b>laço aninhado</b>: um REPITA dentro de outro. O de dentro desenha uma pétala; o de fora repete a pétala 6 vezes.',
        compare: 'Em Python seria:\nfor petala in range(6):\n    for passo in range(36):\n        frente(8)\n        direita(10)\n    direita(60)',
      },
      goal: 'Usar repetição aninhada.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop aninhado'],
      teacherTip: 'Peça para variarem o número de pétalas (8 pétalas → giro de 45°).',
    },
    {
      id: 13, icon: '🧩', title: 'Composição',
      challenge: 'Desenhe três formas que partem do ponto inicial: um quadrado (lado 100) para a direita, um triângulo (lado 100) para a esquerda e, embaixo, um círculo de 36 ladinhos de 10 passos.',
      solution: 'REPITA 4 [PF 100 PD 90]\nREPITA 3 [PF 100 PE 120]\nPD 90\nREPITA 36 [PF 10 PD 10]',
      par: 10, repeatUseful: true, requires: [], match: 'shape',
      hints: [
        'Faça uma forma de cada vez. Comece pelo quadrado — depois dele a tartaruga volta ao início.',
        'O triângulo fica à esquerda do quadrado: gire para a esquerda (PE) nos cantos.',
        'O círculo fica embaixo de tudo: antes dele, a tartaruga precisa olhar para a direita.',
      ],
      success: 'Composição completa: quadrado + triângulo + círculo!',
      concept: {
        title: '💡 Estado da tartaruga',
        text: 'Toda forma fechada devolve a tartaruga ao ponto e à direção de onde começou. Saber <b>onde a tartaruga está e para onde olha</b> (o “estado”) é essencial para combinar partes.',
      },
      goal: 'Combinar várias formas controlando posição e direção.',
      commands: ['REPITA', 'PF', 'PD', 'PE'], concepts: ['Composição', 'Estado'],
      teacherTip: 'Peça que expliquem por que a tartaruga volta ao início depois de cada forma fechada.',
    },
    {
      id: 14, icon: '❓', title: 'Desafio Misterioso', mystery: true,
      challenge: 'Observe a imagem-alvo e descubra o programa que a desenha. Desta vez não há pistas de código!',
      solution: 'REPITA 6 [REPITA 3 [PF 80 PD 120] PD 60]',
      par: 5, repeatUseful: true, requires: [], match: 'shape',
      hints: [
        'Quantas figuras iguais você enxerga? Que figura é essa?',
        'São triângulos com lados de 80 passos, girando em volta do ponto inicial.',
        'Seis figuras dão uma volta completa em torno do início. Quanto girar entre elas?',
      ],
      success: 'Mistério resolvido! Você leu o desenho como um programador.',
      concept: {
        title: '🔎 Engenharia reversa',
        text: 'Você observou um resultado e descobriu o programa que o gera. Isso se chama <b>engenharia reversa</b> — e exige muito raciocínio lógico!',
      },
      goal: 'Analisar um resultado e deduzir o algoritmo (engenharia reversa).',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Engenharia reversa', 'Loop aninhado'],
      teacherTip: 'Deixe os alunos discutirem em duplas antes de usar as dicas.',
    },
    {
      id: 15, icon: '🏆', title: 'Mestre da Tartaruga', final: true,
      challenge: 'Crie a Mandala: 12 quadrados (lado 70) girando em volta do início, 30° entre eles, e uma flor de 6 círculos pequenos (36 ladinhos de 5 passos).',
      solution: 'REPITA 12 [REPITA 4 [PF 70 PD 90] PD 30]\nREPITA 6 [REPITA 36 [PF 5 PD 10] PD 60]',
      par: 10, repeatUseful: true, requires: ['REPITA'], match: 'shape',
      hints: [
        'São duas partes: a roda de quadrados e a flor de círculos. Faça uma de cada vez.',
        'Roda: um quadrado de lado 70, depois gire 30°. Quantos quadrados até a volta completa?',
        'Flor: cada pétala é REPITA 36 [PF 5 PD 10]. Use um REPITA por fora para as 6 pétalas.',
      ],
      success: '🏆 Você dominou os fundamentos da programação com a Tartaruga!',
      concept: {
        title: '🏆 Você é Mestre da Tartaruga!',
        text: 'Você usou <b>sequência</b>, <b>ângulos</b>, <b>repetição</b>, <b>laços aninhados</b> e <b>decomposição</b>. Esses são os fundamentos de qualquer linguagem de programação. Continue criando no Modo Livre!',
      },
      goal: 'Integrar todos os conceitos num projeto final.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Integração', 'Loop aninhado', 'Decomposição'],
      teacherTip: 'Proponha que cada aluno crie sua própria mandala e apresente o código para a turma.',
    },
  ];

  /* =======================================================================
   * O Dao dos Algoritmos — tema de cultivo dos 15 desafios originais.
   * Os ids NÃO mudam (o progresso salvo e o código TAR- dependem deles).
   *   title  nome de cultivo   · shape  a forma geométrica (subtítulo)
   *   lore   frase de ambientação mostrada acima do enunciado
   * ===================================================================== */
  const CULTIVO_ORIGINAIS = {
    1: { title: 'O Despertar', shape: 'Linha reta', lore: 'A tartaruga espiritual abre os olhos. Todo caminho começa com um único traço.' },
    2: { title: 'O Passo de Retorno', shape: 'Ida e volta', lore: 'O cultivador que sabe avançar também sabe voltar à origem.' },
    3: { title: 'O Primeiro Giro do Qi', shape: 'Ângulo reto', lore: 'A energia muda de direção: o primeiro giro desperta o Qi.' },
    4: { title: 'O Selo Quadrado', shape: 'Quadrado', lore: 'Quatro lados, quatro cantos: o primeiro selo do Reino Mundano.' },
    5: { title: 'O Ciclo dos Quatro Ventos', shape: 'Quadrado com REPITA', lore: 'Os quatro ventos sopram em ciclo — o que se repete pode ser dito uma só vez.' },
    6: { title: 'O Portão Retangular', shape: 'Retângulo', lore: 'O portão do templo tem lados desiguais, mas o padrão ainda se repete.' },
    7: { title: 'A Tríade Harmônica', shape: 'Triângulo', lore: 'Três lados em harmonia: a volta completa dividida por três.' },
    8: { title: 'A Estrela das Cinco Virtudes', shape: 'Estrela de 5 pontas', lore: 'Para tocar as cinco virtudes, a tartaruga precisa girar além de uma volta.' },
    9: { title: 'O Círculo do Ciclo Eterno', shape: 'Círculo', lore: 'O ciclo eterno nasce de passos pequenos e giros pequenos.' },
    10: { title: 'O Pavilhão do Mestre', shape: 'Casa', lore: 'O pavilhão é feito de partes: paredes e telhado.' },
    11: { title: 'O Sol do Meio-Dia', shape: 'Sol com raios', lore: 'A cada passo do círculo, um raio de energia se projeta para fora.' },
    12: { title: 'A Flor de Lótus', shape: 'Flor de 6 pétalas', lore: 'Um ciclo dentro de outro ciclo faz a flor de lótus desabrochar.' },
    13: { title: 'A Tríade das Formas', shape: 'Composição', lore: 'Quadrado, triângulo e círculo nascem do mesmo ponto de origem.' },
    14: {
      title: 'O Selo Oculto', shape: 'Desafio misterioso', limit: 6,
      lore: 'Um selo antigo, sem pergaminho que o explique. Leia a forma e economize energia.',
    },
    15: {
      title: 'A Mandala do Refinamento', shape: 'Mandala', limit: 12, final: false,
      lore: 'A mandala dos mestres antigos: quadrados que giram e uma flor de círculos.',
      success: 'A mandala está completa — e com pouca energia desperdiçada!',
      concept: {
        title: '💡 Refinamento',
        text: 'Você combinou <b>repetições aninhadas</b> e <b>decomposição</b> gastando poucos comandos. Cada linha a menos é energia (Qi) economizada.',
      },
    },
  };

  /* =======================================================================
   * Desafios novos (ids 16 a 36). Ordem e reinos em js/cultivo.js.
   * ===================================================================== */
  const NOVOS = [
    /* --------------------------- Reino 1 ------------------------------ */
    {
      id: 16, icon: '➖', title: 'O Traço Partido', shape: 'Linha tracejada',
      lore: 'O cultivador aprende a mover-se sem deixar rastro — e a voltar a marcar o caminho.',
      challenge: 'Desenhe uma linha de 3 traços de 40 passos, com espaços de 20 passos entre eles.',
      solution: 'PF 40\nLEVANTE\nPF 20\nBAIXE\nPF 40\nLEVANTE\nPF 20\nBAIXE\nPF 40',
      par: 9, technique: null, requires: ['LEVANTE', 'BAIXE'], match: 'shape',
      hints: [
        'Para andar sem desenhar, levante a caneta.',
        'LEVANTE antes do espaço, BAIXE depois dele.',
        'Traço de 40, espaço de 20, traço de 40, espaço de 20, traço de 40.',
      ],
      success: 'Você controla quando a energia deixa marca!',
      concept: { title: '💡 Estado da caneta', text: 'A caneta tem um <b>estado</b>: abaixada ou levantada. O mesmo comando PF desenha ou não, dependendo desse estado.' },
      goal: 'Controlar o estado da caneta (LEVANTE/BAIXE).',
      commands: ['PF', 'LEVANTE', 'BAIXE'], concepts: ['Estado', 'Sequência'],
      teacherTip: 'Pergunte: o que muda se esquecermos o último BAIXE?',
    },
    {
      id: 17, icon: '🚩', title: 'A Bandeira do Clã', shape: 'Bandeira',
      lore: 'Para provar seu despertar, erga a bandeira do clã com traços precisos.',
      challenge: 'Desenhe um mastro de 150 passos e, no topo, uma bandeira retangular de 80 de largura por 50 de altura, para a direita.',
      solution: 'PF 150\nPD 90\nPF 80\nPD 90\nPF 50\nPD 90\nPF 80',
      par: 7, technique: null, requires: [], match: 'shape',
      hints: [
        'Comece pelo mastro: ande para cima.',
        'No topo, a bandeira é um retângulo de 80 por 50 que fica à direita do mastro.',
        'Depois do mastro: gire, 80, gire, 50, gire, 80. O lado do mastro já existe!',
      ],
      success: 'A bandeira do clã tremula. Você rompeu o primeiro gargalo!',
      concept: { title: '💡 Precisão', text: 'Programas fazem <b>exatamente</b> o que está escrito. Medir as distâncias e os giros antes de escrever evita erros.' },
      goal: 'Combinar movimentos e giros com precisão de medidas.',
      commands: ['PF', 'PD'], concepts: ['Sequência', 'Precisão'],
      teacherTip: 'Peça que desenhem a bandeira no papel quadriculado e anotem cada comando antes de digitar.',
    },
    /* --------------------------- Reino 2 ------------------------------ */
    {
      id: 18, icon: '⬡', title: 'O Hexágono da Colmeia', shape: 'Hexágono',
      lore: 'As abelhas espirituais constroem com seis lados — o ciclo perfeito para guardar energia.',
      challenge: 'Desenhe um hexágono com 6 lados de 80 passos.',
      solution: 'REPITA 6 [PF 80 PD 60]',
      par: 3, technique: 'REPITA', requires: [], match: 'shape',
      hints: [
        'Um hexágono tem 6 lados iguais.',
        'A volta completa (360°) dividida em 6 cantos dá o giro de cada canto.',
        'REPITA 6 [ ... ] com um passo e um giro dentro.',
      ],
      success: 'O hexágono está perfeito — a colmeia agradece!',
      concept: { title: '💡 Generalizando', text: 'Triângulo: 360÷3. Quadrado: 360÷4. Hexágono: 360÷6. Quando uma regra vale para todos os casos, você descobriu uma <b>generalização</b>.' },
      goal: 'Aplicar a regra 360° ÷ n a um novo polígono.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop', 'Generalização'],
      teacherTip: 'Peça para preverem o ângulo de um octógono antes de testar.',
    },
    /* --------------------------- Reino 3 ------------------------------ */
    {
      id: 19, icon: '❋', title: 'A Roseta de Doze Pétalas', shape: 'Roseta de 12 hexágonos',
      lore: 'Doze hexágonos girando em torno da origem formam a roseta do Pico Espiritual.',
      challenge: 'Desenhe 12 hexágonos (lados de 50) girando 30° entre eles em volta do ponto inicial.',
      solution: 'REPITA 12 [REPITA 6 [PF 50 PD 60] PD 30]',
      par: 5, technique: 'REPITA', requires: ['REPITA'], match: 'shape',
      hints: [
        'Primeiro desenhe um hexágono de lado 50.',
        'Depois de cada hexágono, gire 30°. Quantos hexágonos fecham a volta?',
        'Um REPITA dentro de outro REPITA.',
      ],
      success: 'A roseta floresce em doze direções!',
      concept: { title: '🔁 Laço duplo', text: 'O laço de dentro desenha uma forma; o laço de fora gira e repete essa forma. Isso cria <b>simetria rotacional</b>.' },
      goal: 'Usar laços aninhados para criar simetria rotacional.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop aninhado', 'Simetria'],
      teacherTip: 'Compare 12 hexágonos/30° com 6 hexágonos/60°: o que muda no desenho?',
    },
    {
      id: 20, icon: '✴️', title: 'A Roseta de Vinte e Quatro Pontas', shape: 'Roseta de 24 triângulos',
      lore: 'No pico do terceiro reino, vinte e quatro triângulos giram como uma mandala viva.',
      challenge: 'Desenhe 24 triângulos (lados de 100) girando 15° entre eles em volta do ponto inicial.',
      solution: 'REPITA 24 [REPITA 3 [PF 100 PD 120] PD 15]',
      par: 5, technique: 'REPITA', requires: ['REPITA'], match: 'shape',
      hints: [
        'A forma que se repete é um triângulo de lado 100.',
        'Quanto girar entre os triângulos para fazer 24 deles darem a volta completa?',
        '360 ÷ 24 = 15. Use um REPITA por dentro (triângulo) e outro por fora.',
      ],
      success: 'Vinte e quatro pontas! Você rompeu o gargalo da Geometria Espiritual.',
      concept: { title: '💡 Densidade', text: 'Mudar só dois números (quantas vezes e quanto girar) transforma uma forma simples numa mandala densa. Pequenas mudanças, grandes efeitos.' },
      goal: 'Dominar laços aninhados com cálculo de giro (360 ÷ n).',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop aninhado', 'Simetria'],
      teacherTip: 'Desafie a turma a criar a própria roseta trocando a forma interna.',
    },
    /* --------------------------- Reino 4 ------------------------------ */
    {
      id: 21, icon: '🪜', title: 'A Escadaria do Templo', shape: 'Escada de 8 degraus',
      lore: 'Um discípulo mundano escreve dezesseis linhas para subir a escada. O refinado escreve uma.',
      challenge: 'Desenhe uma escada de 8 degraus (25 passos para cima e 25 para a direita em cada degrau) usando no máximo 6 comandos.',
      solution: 'REPITA 8 [PF 25 PD 90 PF 25 PE 90]',
      par: 5, limit: 6, technique: 'REPITA', requires: [], match: 'shape',
      hints: [
        'Um degrau é: subir, virar, andar, desvirar.',
        'Escreva um degrau e repita-o.',
        'REPITA 8 [ subir 25, girar à direita, andar 25, girar à esquerda ].',
      ],
      success: 'Oito degraus com uma linha só. Refinamento puro!',
      concept: { title: '💡 Código enxuto', text: 'Programadores procuram o <b>menor código claro</b> que resolve o problema: menos linhas, menos erros, mais fácil de mudar.' },
      goal: 'Encontrar o bloco mínimo que se repete (limite de comandos).',
      commands: ['REPITA', 'PF', 'PD', 'PE'], concepts: ['Otimização', 'Loop'],
      teacherTip: 'Mostre uma solução de 32 comandos e peça para a turma reduzir.',
    },
    {
      id: 22, icon: '🎋', title: 'O Pente de Bambu', shape: 'Pente (dentes e base)',
      lore: 'Sete hastes de bambu presas a uma base. A técnica refinada faz ida e volta sem desperdício.',
      challenge: 'Desenhe 7 dentes de 80 passos, espaçados de 20 em 20 sobre uma base, usando no máximo 7 comandos.',
      solution: 'REPITA 7 [PF 80 PT 80 PD 90 PF 20 PE 90]',
      par: 6, limit: 7, technique: 'REPITA', requires: [], match: 'shape',
      hints: [
        'Cada dente é uma ida e volta: PF e PT com o mesmo número.',
        'Depois do dente, a tartaruga anda 20 para o lado (base) e volta a olhar para cima.',
        'REPITA 7 [ dente (ida e volta), virar, andar 20, desvirar ].',
      ],
      success: 'O pente de bambu está pronto — sem um movimento desperdiçado.',
      concept: { title: '💡 Ida e volta', text: 'PF seguido de PT com o mesmo valor desenha e devolve a tartaruga ao lugar. É um truque para desenhar "galhos" sem perder a posição.' },
      goal: 'Usar ida e volta (PF/PT) dentro de repetições.',
      commands: ['REPITA', 'PF', 'PT', 'PD', 'PE'], concepts: ['Otimização', 'Ida e volta'],
      teacherTip: 'Pergunte por que a base fica 20 passos mais comprida que o último dente.',
    },
    {
      id: 23, icon: '🏯', title: 'A Muralha dos Doze Blocos', shape: 'Moldura de quadrados',
      lore: 'A muralha que protege o templo tem doze blocos ao redor do pátio.',
      challenge: 'Desenhe a muralha: quadrados de 40 formando a moldura de um pátio. Use no máximo 8 comandos.',
      solution: 'REPITA 4 [REPITA 3 [REPITA 4 [PF 40 PD 90] PF 40] PD 90]',
      par: 7, limit: 8, technique: 'REPITA', requires: ['REPITA'], match: 'shape', tolerance: 6,
      hints: [
        'Comece desenhando 3 quadrados de 40 em fila, um em cima do outro.',
        'Depois de cada fila de 3, gire 90° — são 4 filas.',
        'Três REPITA, um dentro do outro: quadrado, fila e muralha.',
      ],
      success: 'Muralha erguida com três níveis de repetição!',
      concept: { title: '🔁 Três níveis', text: 'Quadrado → fila de quadrados → muralha. Cada nível de repetição constrói em cima do anterior: isso é <b>abstração em camadas</b>.' },
      goal: 'Construir abstrações em camadas com três laços aninhados.',
      commands: ['REPITA', 'PF', 'PD'], concepts: ['Loop aninhado', 'Abstração'],
      teacherTip: 'Peça para explicarem em voz alta o que cada REPITA faz.',
    },
    {
      id: 24, icon: '🔯', title: 'O Selo dos Oito Trigramas', shape: 'Octógono com quadrados',
      lore: 'Os oito trigramas cercam o centro: um quadrado guarda cada lado do octógono.',
      challenge: 'Desenhe um octógono (lados de 50, girando para a esquerda) com um quadrado de 50 do lado de fora de cada lado. Máximo de 7 comandos.',
      solution: 'REPITA 8 [REPITA 4 [PF 50 PD 90] PF 50 PE 45]',
      par: 6, limit: 7, technique: 'REPITA', requires: ['REPITA'], match: 'shape',
      hints: [
        'O octógono gira 45° em cada canto (360 ÷ 8).',
        'Em cada lado, antes de andar, desenhe um quadrado — ele termina onde começou.',
        'REPITA 8 [ quadrado, lado do octógono, giro ].',
      ],
      success: 'O selo dos oito trigramas brilha!',
      concept: { title: '💡 Forma fechada = volta à origem', text: 'Um quadrado completo devolve a tartaruga ao ponto e à direção iniciais. Por isso dá para "encaixar" formas no meio de outras sem se perder.' },
      goal: 'Encaixar formas fechadas dentro de outra repetição.',
      commands: ['REPITA', 'PF', 'PD', 'PE'], concepts: ['Loop aninhado', 'Estado'],
      teacherTip: 'Peça para trocarem PE por PD no octógono e observarem para onde vão os quadrados.',
    },
    /* --------------------------- Reino 5 ------------------------------ */
    {
      id: 25, icon: '🌀', title: 'O Redemoinho de Qi', shape: 'Espiral quadrada',
      lore: 'O Mestre da Matriz enxerga o número de cada volta. A energia cresce a cada giro.',
      challenge: 'Desenhe uma espiral quadrada de 40 lados: o 1º lado tem 5 passos, o 2º tem 10, o 3º tem 15... Use REPCONT.',
      solution: 'REPITA 40 [PF REPCONT * 5 PD 90]',
      par: 3, technique: 'REPCONT', requires: ['REPCONT'], match: 'shape',
      hints: [
        'Dentro de um REPITA, REPCONT vale o número da volta: 1, 2, 3...',
        'O lado da volta 1 tem 5 passos; o da volta 2 tem 10. Qual conta dá isso?',
        'PF REPCONT * 5 (e um giro de 90° em cada volta).',
      ],
      success: 'O redemoinho gira e cresce. Você enxerga além do canvas!',
      concept: { title: '🔢 Valores que mudam', text: 'REPCONT é um valor que <b>muda a cada volta</b>. Contas com ele (REPCONT * 5) geram padrões que crescem — a base das espirais.', compare: 'Em Python:\nfor volta in range(1, 41):\n    frente(volta * 5)\n    direita(90)' },
      goal: 'Usar o contador do laço para criar padrões crescentes.',
      commands: ['REPITA', 'REPCONT', 'PF', 'PD'], concepts: ['Contador', 'Expressões'],
      teacherTip: 'Mostre a ligação com o "i" do for em outras linguagens.',
    },
    {
      id: 26, icon: '📜', title: 'A Técnica Nomeada', shape: 'Quadrados concêntricos no canto',
      lore: 'O mestre dá nome à sua técnica. Uma vez nomeada, ela pode ser invocada com qualquer força.',
      challenge: 'Crie o comando QUADRADO :LADO com PARA ... FIM e desenhe quatro quadrados de 40, 80, 120 e 160 a partir do mesmo canto.',
      solution: 'PARA QUADRADO :LADO\n  REPITA 4 [PF :LADO PD 90]\nFIM\nQUADRADO 40\nQUADRADO 80\nQUADRADO 120\nQUADRADO 160',
      technique: 'PARA', requires: ['PARA'], match: 'shape',
      hints: [
        'PARA QUADRADO :LADO ... FIM ensina um comando novo. :LADO é o valor que ele recebe.',
        'Dentro do PARA, use :LADO no lugar do número: REPITA 4 [PF :LADO PD 90].',
        'Depois do FIM, use o seu comando: QUADRADO 40, QUADRADO 80...',
      ],
      success: 'Sua técnica tem nome — e funciona com qualquer tamanho!',
      concept: { title: '📜 Procedimento e parâmetro', text: 'Você criou um <b>procedimento</b> (uma função) com um <b>parâmetro</b>. Escreve uma vez, usa quantas vezes quiser, com valores diferentes.', compare: 'Em Python:\ndef quadrado(lado):\n    for i in range(4):\n        frente(lado)\n        direita(90)\n\nquadrado(40)\nquadrado(80)' },
      goal: 'Definir procedimentos com parâmetro (funções).',
      commands: ['PARA', 'FIM', 'REPITA', 'PF', 'PD'], concepts: ['Procedimento', 'Parâmetro'],
      teacherTip: 'Peça para criarem TRIANGULO :LADO e HEXAGONO :LADO.',
    },
    {
      id: 27, icon: '🐚', title: 'A Concha de Arquimedes', shape: 'Espiral arquimediana',
      lore: 'A concha cresce devagar, sempre girando o mesmo ângulo: a espiral de Arquimedes.',
      challenge: 'Desenhe uma espiral suave: 72 passos girando 15° cada, em que o passo da volta n mede n ÷ 2.',
      solution: 'REPITA 72 [PF REPCONT / 2 PD 15]',
      par: 3, technique: 'REPCONT', requires: [], match: 'shape',
      hints: [
        'É parecida com o redemoinho, mas o giro é pequeno (15°) e o passo cresce devagar.',
        'O passo da volta n é n dividido por 2.',
        'REPITA 72 [ PF REPCONT / 2  PD 15 ].',
      ],
      success: 'A concha de Arquimedes se desenrola diante de você.',
      concept: { title: '💡 Crescimento linear', text: 'Quando o passo cresce sempre o mesmo tanto, a espiral se afasta do centro de forma regular: é a <b>espiral arquimediana</b>.' },
      goal: 'Controlar crescimento com expressões (divisão) e giros pequenos.',
      commands: ['REPITA', 'REPCONT', 'PF', 'PD'], concepts: ['Expressões', 'Espiral'],
      teacherTip: 'Troque o 15 por 10 e por 20 e discuta o efeito.',
    },
    {
      id: 28, icon: '✳️', title: 'As Estrelas Aninhadas', shape: 'Três octagramas',
      lore: 'Três estrelas de oito pontas nascem umas dentro das outras, cada uma com o dobro da força.',
      challenge: 'Crie ESTRELA :T (8 linhas de :T girando 135°) e desenhe estrelas de 60, 120 e 180 passos.',
      solution: 'PARA ESTRELA :T\n  REPITA 8 [PF :T PD 135]\nFIM\nREPITA 3 [ESTRELA REPCONT * 60]',
      technique: 'PARA', requires: ['PARA'], match: 'shape',
      hints: [
        'A estrela de 8 pontas gira 135° em cada ponta (3 voltas completas ÷ 8).',
        'Crie o comando com PARA ESTRELA :T ... FIM.',
        'Para os tamanhos 60, 120 e 180, dá para usar REPITA 3 com REPCONT * 60.',
      ],
      success: 'Três estrelas, uma técnica. A matriz se revela!',
      concept: { title: '💡 Combinando ferramentas', text: 'Procedimento + REPITA + REPCONT: cada ferramenta resolve uma parte. Combinar ferramentas é o coração da programação.' },
      goal: 'Combinar procedimento, laço e contador.',
      commands: ['PARA', 'REPITA', 'REPCONT', 'PF', 'PD'], concepts: ['Procedimento', 'Composição'],
      teacherTip: 'Desafie: estrelas de 7 pontas (giro = 3×360÷7).',
    },
    {
      id: 29, icon: '🔺', title: 'O Triângulo de Sierpinski', shape: 'Fractal de Sierpinski',
      lore: 'Dentro de cada triângulo há três triângulos menores — e dentro deles, outros mais. É o primeiro fractal.',
      challenge: 'Desenhe o Triângulo de Sierpinski de tamanho 200 e nível 3, com um procedimento que chama a si mesmo.',
      solution: 'PARA SIERP :T :N\n  SE :N = 0 [REPITA 3 [PF :T PD 120] PARE]\n  REPITA 3 [SIERP :T / 2 :N - 1 PF :T PD 120]\nFIM\nSIERP 200 3',
      technique: 'RECURSAO', requires: ['PARA'], match: 'shape',
      hints: [
        'No nível 0, SIERP só desenha um triângulo. Use SE :N = 0 [ ... PARE].',
        'Nos outros níveis: em cada canto do triângulo, desenhe um SIERP com metade do tamanho e um nível a menos.',
        'REPITA 3 [ SIERP :T / 2 :N - 1  PF :T  PD 120 ].',
      ],
      success: 'Você desenhou um fractal! Formas dentro de formas, para sempre.',
      concept: { title: '🌀 Recursividade', text: 'Um procedimento que <b>chama a si mesmo</b> com um problema menor se chama <b>recursivo</b>. O SE ... [PARE] é a "condição de parada": sem ela, nunca terminaria.', compare: 'Em Python:\ndef sierp(t, n):\n    if n == 0:\n        triangulo(t)\n        return\n    for i in range(3):\n        sierp(t / 2, n - 1)\n        frente(t)\n        direita(120)' },
      goal: 'Introduzir recursão com condição de parada.',
      commands: ['PARA', 'SE', 'PARE', 'REPITA', 'PF', 'PD'], concepts: ['Recursão', 'Fractal'],
      teacherTip: 'Rode com níveis 0, 1, 2 e 3 na velocidade lenta e peça para descreverem o padrão.',
    },
    {
      id: 30, icon: '🐌', title: 'A Espiral Dourada', shape: 'Espiral de Fibonacci',
      lore: 'Os números de Fibonacci (1, 1, 2, 3, 5, 8, 13...) guardam a proporção áurea das conchas e galáxias.',
      challenge: 'Desenhe 7 quartos de círculo com raios 10, 10, 20, 30, 50, 80 e 130 (cada raio é a soma dos dois anteriores).',
      solution: 'PARA ARCO :R\n  REPITA 18 [PF :R * 0.0873 PD 5]\nFIM\nPARA FIB :A :B :N\n  SE :N = 0 [PARE]\n  ARCO :B\n  FIB :B :A + :B :N - 1\nFIM\nFIB 0 10 7',
      technique: 'PARA', requires: ['PARA'], match: 'shape',
      hints: [
        'Um quarto de círculo: 18 passos girando 5° (18 × 5 = 90°). O passo para raio R é R × 0,0873.',
        'Crie ARCO :R e depois chame ARCO 10, ARCO 10, ARCO 20... — ou use recursão.',
        'Recursão: FIB :A :B :N desenha ARCO :B e chama FIB :B (:A + :B) (:N - 1).',
      ],
      success: 'A espiral dourada se abre como uma galáxia. Você é Mestre da Matriz!',
      concept: { title: '✨ Proporção áurea', text: 'Cada raio é a soma dos dois anteriores: a <b>sequência de Fibonacci</b>. A razão entre raios vizinhos se aproxima de 1,618 — a proporção áurea.' },
      goal: 'Usar procedimentos com vários parâmetros (e, opcionalmente, recursão).',
      commands: ['PARA', 'SE', 'PARE', 'REPITA', 'PF', 'PD'], concepts: ['Procedimento', 'Recursão', 'Fibonacci'],
      teacherTip: 'Aceite a solução com 7 chamadas de ARCO; a recursiva vale como desafio extra.',
    },
    /* --------------------------- Reino 6 ------------------------------ */
    {
      id: 31, icon: '🪷', title: 'O Lótus de Trinta e Seis Pétalas', shape: 'Flor de 36 pétalas',
      lore: 'Na Grande Perfeição, cada pétala é uma técnica, e o lótus inteiro é um só pensamento.',
      challenge: 'Crie PETALA :R (dois arcos de 90°, cada um com 30 passos de :R girando 3°) e desenhe 36 pétalas girando 10°.',
      solution: 'PARA PETALA :R\n  REPITA 2 [REPITA 30 [PF :R PD 3] PD 90]\nFIM\nREPITA 36 [PETALA 3 PD 10]',
      technique: 'PARA', requires: ['PARA'], match: 'shape',
      hints: [
        'Uma pétala = arco, giro de 90°, arco, giro de 90°.',
        'Cada arco: REPITA 30 [PF :R PD 3] (30 × 3° = 90°).',
        'Depois da pétala, gire 10°: 36 pétalas × 10° = 360°.',
      ],
      success: 'O lótus celestial desabrocha.',
      concept: { title: '💡 Abstração', text: 'Com PETALA pronta, você parou de pensar em passos e passou a pensar em <b>pétalas</b>. Esconder detalhes atrás de um nome é <b>abstração</b>.' },
      goal: 'Abstração com procedimentos dentro de repetições.',
      commands: ['PARA', 'REPITA', 'PF', 'PD'], concepts: ['Abstração', 'Procedimento'],
      teacherTip: 'Peça para criarem flores com 12 e 18 pétalas.',
    },
    {
      id: 32, icon: '❄️', title: 'O Floco de Koch', shape: 'Floco de neve de Koch',
      lore: 'Cada linha reta se quebra em quatro, de novo e de novo: o floco de neve infinito.',
      challenge: 'Desenhe o floco de Koch: 3 curvas de Koch de tamanho 240 e nível 3, girando 120° (comece com PD 30).',
      solution: 'PARA KOCH :T :N\n  SE :N = 0 [PF :T PARE]\n  KOCH :T / 3 :N - 1\n  PE 60\n  KOCH :T / 3 :N - 1\n  PD 120\n  KOCH :T / 3 :N - 1\n  PE 60\n  KOCH :T / 3 :N - 1\nFIM\nPD 30\nREPITA 3 [KOCH 240 3 PD 120]',
      technique: 'RECURSAO', requires: ['PARA'], match: 'shape',
      hints: [
        'No nível 0, a curva de Koch é só uma linha reta: SE :N = 0 [PF :T PARE].',
        'Nos outros níveis: 4 curvas menores (:T / 3, nível :N - 1) com giros PE 60, PD 120, PE 60 entre elas.',
        'O floco são 3 curvas de Koch formando um triângulo: REPITA 3 [KOCH 240 3 PD 120].',
      ],
      success: 'O floco de Koch cintila — um perímetro que cresce para sempre!',
      concept: { title: '❄️ Fractal clássico', text: 'A curva de Koch é um exemplo clássico da LOGO: uma regra simples aplicada repetidamente gera uma figura infinitamente detalhada.' },
      goal: 'Recursão múltipla (4 chamadas) com parâmetros.',
      commands: ['PARA', 'SE', 'PARE', 'REPITA', 'PF', 'PD', 'PE'], concepts: ['Recursão', 'Fractal'],
      teacherTip: 'Rode com nível 0, 1, 2 e 3 para a turma ver a regra se aplicando.',
    },
    {
      id: 33, icon: '🌳', title: 'A Árvore Fractal', shape: 'Árvore recursiva',
      lore: 'Cada galho se divide em dois galhos menores. A árvore inteira nasce de uma única regra.',
      challenge: 'Desenhe a árvore: tronco de 100 que se divide em dois galhos (30° para cada lado) com 70% do tamanho, até o nível 6. Comece 150 passos abaixo do centro.',
      solution: 'PARA ARVORE :T :N\n  SE :N = 0 [PARE]\n  PF :T\n  PE 30\n  ARVORE :T * 0.7 :N - 1\n  PD 60\n  ARVORE :T * 0.7 :N - 1\n  PE 30\n  PT :T\nFIM\nLEVANTE PT 150 BAIXE\nARVORE 100 6',
      technique: 'RECURSAO', requires: ['PARA'], match: 'shape',
      hints: [
        'Um galho: ande :T, desenhe as duas sub-árvores e volte (PT :T) para onde começou.',
        'Esquerda: PE 30 e ARVORE menor. Direita: PD 60 (desfaz os 30 e gira mais 30) e outra ARVORE.',
        'Não esqueça de desvirar (PE 30) e voltar (PT :T) no fim — e do SE :N = 0 [PARE].',
      ],
      success: 'A árvore cresceu de uma única semente de código.',
      concept: { title: '🌳 Voltar ao estado inicial', text: 'Toda chamada recursiva da árvore termina <b>exatamente onde começou</b>. Essa disciplina (desfazer giros e voltar) é o que mantém a recursão organizada.' },
      goal: 'Recursão em árvore com restauração do estado.',
      commands: ['PARA', 'SE', 'PARE', 'PF', 'PT', 'PD', 'PE', 'LEVANTE', 'BAIXE'], concepts: ['Recursão', 'Estado'],
      teacherTip: 'Troque 30° por 20° e 0.7 por 0.6 para ver árvores diferentes.',
    },
    {
      id: 34, icon: '🐉', title: 'A Curva do Dragão Celestial', shape: 'Curva do dragão',
      lore: 'Dobre uma tira de papel ao meio, de novo e de novo... ao abrir, surge o dragão.',
      challenge: 'Desenhe a curva do dragão de nível 10 com passos de 6: DRAGAO :N :S chama DRAGAO :N - 1 1, gira 90 × :S e chama DRAGAO :N - 1 -1.',
      solution: 'PARA DRAGAO :N :S\n  SE :N = 0 [PF 6 PARE]\n  DRAGAO :N - 1 1\n  PD 90 * :S\n  DRAGAO :N - 1 -1\nFIM\nDRAGAO 10 1',
      technique: 'RECURSAO', requires: ['PARA'], match: 'shape', tolerance: 4,
      hints: [
        'No nível 0, o dragão é um passo: SE :N = 0 [PF 6 PARE].',
        ':S vale 1 ou -1 e decide o lado do giro: PD 90 * :S gira para a direita ou para a esquerda.',
        'Atenção: em DRAGAO :N - 1 -1, o -1 colado é um número negativo (o segundo valor).',
      ],
      success: 'O dragão celestial desperta das dobras do papel!',
      concept: { title: '🐉 Parâmetro de sinal', text: 'Um parâmetro que vale 1 ou -1 muda a direção do giro. Um mesmo procedimento desenha duas versões espelhadas de si mesmo.' },
      goal: 'Recursão com parâmetro de controle (sinal).',
      commands: ['PARA', 'SE', 'PARE', 'PF', 'PD'], concepts: ['Recursão', 'Parâmetro'],
      teacherTip: 'Mostre os níveis 1, 2, 3 e 4 e relacione com dobrar uma tira de papel.',
    },
    {
      id: 35, icon: '🌲', title: 'A Árvore de Pitágoras', shape: 'Árvore de quadrados',
      lore: 'Sobre cada quadrado nascem dois quadrados menores, inclinados como os lados de um triângulo.',
      challenge: 'Desenhe a Árvore de Pitágoras com quadrado inicial de 50 e nível 7 (cada novo quadrado tem 0,7071 do lado anterior e gira 45°).',
      solution: 'PARA PIT :T :N\n  SE :N = 0 [PARE]\n  REPITA 4 [PF :T PD 90]\n  PF :T\n  PE 45\n  PIT :T * 0.7071 :N - 1\n  PD 90\n  PF :T * 0.7071\n  PIT :T * 0.7071 :N - 1\n  PT :T * 0.7071\n  PE 45\n  PT :T\nFIM\nPIT 50 7',
      technique: 'RECURSAO', requires: ['PARA'], match: 'shape',
      hints: [
        'Desenhe o quadrado de lado :T e suba até o canto de cima à esquerda.',
        'Gire PE 45 e chame PIT menor (lado × 0,7071). Depois PD 90, ande o lado menor e chame PIT de novo.',
        'Desfaça tudo no fim: volte o lado menor, PE 45 e PT :T — a tartaruga precisa terminar onde começou.',
      ],
      success: 'A Árvore de Pitágoras floresce em mil quadrados. O gargalo final está próximo!',
      concept: { title: '📐 Geometria + recursão', text: '0,7071 é √2 ÷ 2: o lado de cada quadrado novo, tirado do <b>teorema de Pitágoras</b>. Matemática e programação juntas!' },
      goal: 'Recursão dupla com geometria (Pitágoras).',
      commands: ['PARA', 'SE', 'PARE', 'REPITA', 'PF', 'PT', 'PD', 'PE'], concepts: ['Recursão', 'Geometria'],
      teacherTip: 'Ligue com o teorema de Pitágoras: os dois quadrados menores somam a área do maior.',
    },
    {
      id: 36, icon: '☯️', title: 'A Mandala Celestial do Dao', shape: 'Doze curvas de Koch',
      lore: 'Wu Wei: sem esforço desnecessário. Doze curvas de Koch, uma única ideia, a Grande Perfeição.',
      challenge: 'Desenhe 12 curvas de Koch de tamanho 54 e nível 3, girando 30° (PD) depois de cada uma.',
      solution: 'PARA KOCH :T :N\n  SE :N = 0 [PF :T PARE]\n  KOCH :T / 3 :N - 1\n  PE 60\n  KOCH :T / 3 :N - 1\n  PD 120\n  KOCH :T / 3 :N - 1\n  PE 60\n  KOCH :T / 3 :N - 1\nFIM\nREPITA 12 [KOCH 54 3 PD 30]',
      technique: 'RECURSAO', requires: ['PARA'], match: 'shape', final: true,
      hints: [
        'Você já criou KOCH no Floco de Koch — reaproveite!',
        '12 curvas × 30° = 360°: a figura fecha.',
        'REPITA 12 [KOCH 54 3 PD 30].',
      ],
      success: '☯️ Você alcançou a Grande Perfeição: é um Iluminado do Dao dos Algoritmos!',
      concept: { title: '☯️ Iluminado do Dao', text: 'Você percorreu <b>sequência</b>, <b>ângulos</b>, <b>repetição</b>, <b>laços aninhados</b>, <b>otimização</b>, <b>procedimentos</b>, <b>parâmetros</b>, <b>condicionais</b> e <b>recursão</b>: os fundamentos de toda linguagem de programação.' },
      goal: 'Reutilizar um procedimento recursivo numa composição final.',
      commands: ['PARA', 'SE', 'PARE', 'REPITA', 'PF', 'PD', 'PE'], concepts: ['Reuso', 'Recursão', 'Integração'],
      teacherTip: 'Proponha que cada aluno crie a própria mandala celestial e explique o código.',
    },
  ];

  /* Aplica o tema de cultivo aos 15 originais e junta os novos (ordem por id). */
  LEVELS.forEach((l) => {
    const c = CULTIVO_ORIGINAIS[l.id];
    if (c) Object.assign(l, c);
  });
  NOVOS.forEach((l) => LEVELS.push(l));
  LEVELS.sort((a, b) => a.id - b.id);

  /** Nível pelo id (os ids não mudam; a ordem da jornada fica em js/cultivo.js). */
  function byId(id) {
    return LEVELS.find((l) => l.id === +id) || null;
  }

  /** Técnica que vale a 2ª estrela (REPITA, PARA, REPCONT, RECURSAO ou nenhuma). */
  function techniqueOf(level) {
    if (level.technique !== undefined) return level.technique;
    return level.repeatUseful ? 'REPITA' : null;
  }

  const TECHNIQUE_LABEL = { REPITA: 'usando REPITA', PARA: 'criando um procedimento (PARA)', REPCONT: 'usando REPCONT', RECURSAO: 'usando recursão' };

  function usesTechnique(analysis, tech) {
    switch (tech) {
      case null: case undefined: return true;
      case 'REPITA': return analysis.usesRepeat;
      case 'PARA': return !!analysis.usesProcedures;
      case 'REPCONT': return !!analysis.usesRepcount;
      case 'RECURSAO': return !!analysis.recursive;
      default: return true;
    }
  }

  /** Meta de comandos para ⭐⭐⭐ (se não informada, vale o tamanho da solução). */
  function parOf(level) {
    if (level.par) return level.par;
    targetOf(level);
    return level._solutionAnalysis.size;
  }


  /* O Laboratório de Fractais virou realidade nos Reinos 5 e 6. */
  const FUTURE_LEVELS = [];

  /* ------------------------- Desenho-alvo ------------------------------ */
  function targetOf(level) {
    if (!level._target) {
      const r = root.Logo.compile(level.solution);
      const st = root.Turtle.simulate(r.actions, root.Turtle.createState());
      level._target = st.segments;
      level._solutionAnalysis = r.analysis;
    }
    return level._target;
  }

  /** Quanto o desenho se parece com o alvo (0 a 1), para mostrar ao aluno. */
  function similarity(cmp) {
    if (!cmp) return 0;
    return Math.max(0, Math.min(cmp.precision, cmp.coverage, 1 - Math.abs(1 - cmp.lengthRatio)));
  }

  function requirementLabel(req) {
    return Array.isArray(req) ? req.join(' ou ') : req;
  }

  /**
   * Avalia uma tentativa do aluno.
   *   attempt = { analysis, stats, state }   (state = estado final da tartaruga)
   * Retorna { completed, stars, title, text, compare, efficiency }
   */
  function evaluate(level, attempt) {
    const { analysis, state } = attempt;
    const segs = state.segments;
    const target = targetOf(level);

    if (!segs.length) {
      return {
        completed: false, stars: 0, title: 'Quase!',
        text: state.penDown
          ? 'A tartaruga ainda não desenhou nada. Use PF para ela andar e deixar um rastro.'
          : 'A caneta está levantada, então a tartaruga não deixou rastro. Use BAIXE antes de andar.',
      };
    }

    const cmp = root.Checker.compare(segs, target, { mode: level.match || 'shape', tolerance: level.tolerance || 5 });

    if (!cmp.ok) {
      let text;
      const shapeOk = cmp.precision >= 0.95 && cmp.coverage >= 0.9;
      if (cmp.lengthRatio > 1.15) {
        text = 'Seu desenho tem linhas a mais (ou maiores) que o alvo. Observe: em que momento a tartaruga se afastou do tracejado?';
      } else if (cmp.lengthRatio < 0.85) {
        text = 'Ainda falta desenhar uma parte. Compare com o alvo tracejado: o que está faltando?';
      } else if (shapeOk && cmp.lengthRatio < 1) {
        text = 'Está quase igual! Mas seu desenho ficou um pouco menor que o alvo. Confira os números de passos.';
      } else if (shapeOk) {
        text = 'Está quase igual! Mas seu desenho ficou um pouco maior que o alvo (ou repetiu alguma linha). Confira os números.';
      } else {
        text = 'O tamanho está quase certo, mas a forma está diferente. Observe o desenho e pense: a tartaruga virou demais ou de menos?';
      }
      return { completed: false, stars: 0, title: 'Quase!', text, compare: cmp };
    }

    for (const req of level.requires || []) {
      if (req === 'PARA' && analysis.usesProcedures) continue;
      if (req === 'REPCONT' && analysis.usesRepcount) continue;
      const options = Array.isArray(req) ? req : [req];
      if (!options.some((r) => analysis.commandsUsed.includes(r))) {
        return {
          completed: false, stars: 0, compare: cmp,
          title: 'O desenho ficou certo!',
          text: `Mas neste desafio é preciso usar ${requirementLabel(req)}. Que tal reescrever o programa usando ${requirementLabel(req)}?`,
        };
      }
    }

    if (level.limit && analysis.size > level.limit) {
      return {
        completed: false, stars: 0, compare: cmp,
        title: 'O desenho está perfeito!',
        text: `Mas a técnica ainda gasta Qi demais: ${analysis.size} comandos. O limite deste desafio é ${level.limit}. Procure o padrão que se repete e refine o código.`,
      };
    }

    if (level.finalAtStart && Math.hypot(state.x, state.y) > 2) {
      return {
        completed: false, stars: 0, compare: cmp,
        title: 'Quase!',
        text: 'O desenho está certo, mas a tartaruga não voltou ao ponto inicial. Quanto ela precisa andar para trás?',
      };
    }

    const par = parOf(level);
    let stars = 1;
    if (usesTechnique(analysis, techniqueOf(level))) stars = 2;
    if (stars === 2 && analysis.size <= par) stars = 3;

    let efficiency;
    if (analysis.size <= par) efficiency = { label: 'Ótima', icon: '🌟', text: `${analysis.size} comando(s) — dentro da meta de ${par}.` };
    else if (analysis.size <= par * 2) efficiency = { label: 'Boa', icon: '👍', text: `${analysis.size} comandos. Meta para 3 estrelas: até ${par}.` };
    else efficiency = { label: 'Pode melhorar', icon: '🔧', text: `${analysis.size} comandos. Dá para escrever com menos — meta: ${par}.` };

    return { completed: true, stars, title: 'Muito bem!', text: level.success, compare: cmp, efficiency };
  }

  /** Dica sobre como ganhar mais estrelas (mostrada após concluir). */
  function nextStarTip(level, result, analysis) {
    if (result.stars >= 3) return null;
    const tech = techniqueOf(level);
    if (result.stars === 1 && tech) return `Para ganhar a 2ª estrela, tente resolver ${TECHNIQUE_LABEL[tech]}.`;
    return `Para ganhar a 3ª estrela, tente usar no máximo ${parOf(level)} comando(s). Você usou ${analysis.size}.`;
  }

  const api = {
    LEVELS, FUTURE_LEVELS, targetOf, evaluate, nextStarTip, requirementLabel, similarity,
    byId, techniqueOf, usesTechnique, parOf, TECHNIQUE_LABEL,
  };
  root.Levels = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
