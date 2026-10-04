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
 *   repeatUseful true se REPITA é a forma "apropriada" (vale a 2ª estrela)
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

  /* Nível futuro — arquitetura preparada (ver js/fractals.js). */
  const FUTURE_LEVELS = [
    {
      id: 'fractais', icon: '❄️', title: 'Laboratório de Fractais', comingSoon: true,
      challenge: 'Em breve: criar a Curva de Koch usando procedimentos e recursividade.',
    },
  ];

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
      const options = Array.isArray(req) ? req : [req];
      if (!options.some((r) => analysis.commandsUsed.includes(r))) {
        return {
          completed: false, stars: 0, compare: cmp,
          title: 'O desenho ficou certo!',
          text: `Mas neste desafio é preciso usar ${requirementLabel(req)}. Que tal reescrever o programa usando ${requirementLabel(req)}?`,
        };
      }
    }

    if (level.finalAtStart && Math.hypot(state.x, state.y) > 2) {
      return {
        completed: false, stars: 0, compare: cmp,
        title: 'Quase!',
        text: 'O desenho está certo, mas a tartaruga não voltou ao ponto inicial. Quanto ela precisa andar para trás?',
      };
    }

    let stars = 1;
    if (!level.repeatUseful || analysis.usesRepeat) stars = 2;
    if (stars === 2 && analysis.size <= level.par) stars = 3;

    let efficiency;
    if (analysis.size <= level.par) efficiency = { label: 'Ótima', icon: '🌟', text: `${analysis.size} comando(s) — dentro da meta de ${level.par}.` };
    else if (analysis.size <= level.par * 2) efficiency = { label: 'Boa', icon: '👍', text: `${analysis.size} comandos. Meta para 3 estrelas: até ${level.par}.` };
    else efficiency = { label: 'Pode melhorar', icon: '🔧', text: `${analysis.size} comandos. Dá para escrever com menos — meta: ${level.par}.` };

    return { completed: true, stars, title: 'Muito bem!', text: level.success, compare: cmp, efficiency };
  }

  /** Dica sobre como ganhar mais estrelas (mostrada após concluir). */
  function nextStarTip(level, result, analysis) {
    if (result.stars >= 3) return null;
    if (result.stars === 1 && level.repeatUseful) return 'Para ganhar a 2ª estrela, tente resolver usando REPITA.';
    return `Para ganhar a 3ª estrela, tente usar no máximo ${level.par} comando(s). Você usou ${analysis.size}.`;
  }

  const api = { LEVELS, FUTURE_LEVELS, targetOf, evaluate, nextStarTip, requirementLabel, similarity };
  root.Levels = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
