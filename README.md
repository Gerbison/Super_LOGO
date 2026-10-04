# 🐢 Jornada da Tartaruga — Aprenda Programação Desenhando

Ambiente educacional **gratuito**, que roda **direto no navegador**, para ensinar lógica de programação com uma linguagem inspirada na **LOGO** e na tradicional *tartaruga gráfica*.

> ✍️ Eu escrevo o comando → 🐢 a tartaruga executa → 👀 eu observo o resultado → 🔎 identifico o erro → 🔧 corrijo o código.

**Acesse:** https://gerbison.github.io/Super_LOGO/

---

## Objetivo e público-alvo

- **Público:** alunos do Ensino Médio Técnico, disciplina de programação / lógica de programação.
- **Objetivo:** aprender sequência, ângulos, repetição (loop), laços aninhados, decomposição e engenharia reversa **construindo desenhos**.
- **Progressão:** APRENDER → EXPERIMENTAR → RESOLVER DESAFIOS → CONQUISTAR NÍVEIS → CRIAR → PROGRAMAR LIVREMENTE.

## O que tem

| Área | Descrição |
|---|---|
| 📘 **Aprender** | Tutorial "Aprenda a falar com a Tartaruga" em 7 aulas (PF, PT, PD/PE com demonstração de 90°/180°/270°/360°, caneta, limpar, REPITA com cada volta colorida e o conceito de LOOP). |
| 🗺️ **Desafios** | Mapa com 15 níveis, desenho-alvo, verificação automática pelo **resultado** (não pelo código), 3 dicas por nível, estrelas e desbloqueio progressivo. |
| 🎨 **Modo Livre** | Canvas grande, cores, espessura, caneta, centro, desfazer/refazer, zoom, salvar desenhos, exportar PNG e baixar o código (.txt). |
| 🖼️ **Galeria** | 12 exemplos (quadrado, triângulo, estrela, círculo, casa, sol, flor, espiral, floco, padrões...) para ver, executar e editar. |
| 📚 **Comandos** | Biblioteca visual com um cartão por comando. |
| 🏅 **Conquistas** | 11 badges (Primeiro comando, Mestre do quadrado, Senhor dos círculos, Mestre da repetição, Persistente...). |
| 👨‍🏫 **Professor** | Visão geral dos níveis, objetivos pedagógicos, sugestões para a sala, Desafios do Professor, **criador de desafios por link**, prévia do Laboratório de Fractais, desbloquear todos os níveis, imprimir. |

Também: erros pedagógicos (nunca "SyntaxError"), destaque do comando em execução no editor, indicador "Repetição 2 de 4", ângulo desenhado durante os giros, três velocidades, tema claro/escuro, navegação por teclado (`Ctrl+Enter` executa, `Esc` para) e layout responsivo (computador, notebook, tablet).

## Salvamento e código de progresso

Mesmo sistema do AlgoBot, **sem banco de dados**:

- Na primeira visita o aluno digita o **nome ou apelido**. O progresso é salvo automaticamente no navegador daquele computador.
- O botão **🔑 Meu código** (também no mapa e nas Conquistas) mostra um código curto, por exemplo `TAR-ZG000000-MSPS`. Ele **carrega todo o progresso**: as estrelas de cada nível e as aulas concluídas, assinadas pelo nome.
- **💾 Salvar e continuar depois** manda o código para o **próprio e-mail** do aluno (abre o Gmail na web; "Usar outro programa de e-mail" usa `mailto:`).
- Em outro computador: **"Já jogou em outro computador?"** na tela de boas-vindas, ou **📥 Importar código** na janela do código. O aluno digita o mesmo nome (acentos e maiúsculas não importam) e cola o código.
- Importar **nunca piora** nada: cada nível fica com o melhor resultado. O código não funciona com o nome de outro aluno, então não serve para pular níveis com o código do colega.
- O professor pode pedir o código para conferir o progresso de quem jogou sem internet.

Detalhes em `js/progresso.js`: 2 bits de estrelas por nível + 1 bit por aula, em base32 sem I/L/O/U, + hash FNV-1a do nome.

## Tecnologias

HTML5, CSS3, JavaScript moderno e Canvas API. **Sem backend, sem banco de dados, sem bibliotecas e sem APIs externas.** O progresso fica no `localStorage` do navegador. Funciona offline depois de carregado — e até abrindo o `index.html` direto do computador (os scripts não usam módulos ES justamente por isso).

## Executar localmente

Opção 1 — dê dois cliques em `index.html`.

Opção 2 — com um servidor local (opcional):

```bash
node tools/serve.js
```

e abra http://localhost:8080. (Também serve `python -m http.server`.)

Testes automáticos (opcional, precisa de Node.js): `npm test` — verifica interpretador, ângulos, REPITA, mensagens de erro, todos os níveis (soluções alternativas aceitas e erradas recusadas), galeria e tutorial.

## Publicar no GitHub Pages

1. Envie os arquivos para um repositório no GitHub (o `index.html` deve ficar na raiz).
2. No repositório: **Settings → Pages → Build and deployment → Source: "Deploy from a branch"**, branch **`main`**, pasta **`/ (root)`** → **Save**.
3. Em 1–2 minutos o site estará em `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

O arquivo `.nojekyll` evita que o GitHub processe os arquivos com Jekyll.

## Estrutura de arquivos

```
index.html            página única (as telas são trocadas por #/endereço)
css/style.css         visual; cores em variáveis no topo (tema claro e escuro)
js/logo.js            INTERPRETADOR: tokenizer → parser (AST) → ações; erros pedagógicos
js/turtle.js          estado da tartaruga, desenho no Canvas, animação, PNG
js/checker.js         compara o desenho do aluno com o desenho-alvo
js/levels.js          os 15 níveis + avaliação e estrelas
js/fractals.js        Laboratório de Fractais (preparado para o futuro)
js/tutorial.js        aulas do tutorial
js/examples.js        exemplos da galeria
js/achievements.js    conquistas
js/storage.js         salvamento no localStorage
js/progresso.js       código de progresso (continuar em outro computador)
js/workspace.js       componente Canvas + editor + botões (reutilizado em todas as telas)
js/app.js             telas, navegação, modais, Modo Professor
assets/               ícone
tests/run-tests.js    testes automáticos (Node.js, opcional)
tools/serve.js        servidor local para testes (opcional)
```

## Como funciona o interpretador

O código do aluno passa por três etapas (`js/logo.js`):

1. **tokenize** — separa palavras, números e colchetes. Aceita qualquer espaçamento e quebras de linha, maiúsculas/minúsculas, acentos, números com vírgula ou ponto, e comentários com `;`.
2. **parse** — monta a árvore do programa (comandos e blocos `REPITA n [ ... ]`). Aqui nascem os **erros pedagógicos**: número faltando (`PF ???`), comando parecido ("Você quis dizer PF?"), comando em inglês (FD → PF), `PF100` sem espaço, colchete faltando/sobrando, vírgulas, parênteses etc. Cada erro guarda a posição para ser destacado no editor.
3. **run** — percorre a árvore e gera uma lista de **ações simples**: `move`, `turn`, `pen`, `clear`, `home`. Cada ação sabe de qual comando veio (destaque no editor) e em qual volta do REPITA está.

A tartaruga (`js/turtle.js`) só entende essas ações e as anima. Convenções: origem no centro, y para cima, direção 0° = para cima, `PD` gira no sentido horário. `CENTRO` volta ao meio **sem desenhar**; `LIMPE` apaga o desenho **sem mover** a tartaruga.

### Verificação dos desafios

`js/checker.js` espalha pontos sobre as linhas do aluno e do alvo e mede **precisão** (o aluno não desenhou fora do alvo) e **cobertura** (o aluno desenhou todo o alvo), com tolerância de alguns passos, além do comprimento total. Por isso `PF 50 PF 50` vale como `PF 100`, `REPITA 36 [PF 10 PD 10]` vale como `REPITA 360 [PF 1 PD 1]`, e a ordem do desenho não importa. No modo `shape`, desenhos deslocados, espelhados (PE em vez de PD) ou girados em 90° também são aceitos.

**Estrelas:** ⭐ desenho correto · ⭐⭐ usou REPITA quando o nível pede repetição (ou o nível não precisa dela) · ⭐⭐⭐ usou no máximo `par` comandos.

## Como adicionar novos níveis / desafios

Abra `js/levels.js` e copie um objeto da lista `LEVELS`:

```js
{
  id: 16, icon: '⬡', title: 'Hexágono',
  challenge: 'Desenhe um hexágono com lados de 80 passos.',
  solution: 'REPITA 6 [PF 80 PD 60]',   // gera o desenho-alvo automaticamente
  par: 3,                               // meta para 3 estrelas
  repeatUseful: true,                   // REPITA vale a 2ª estrela
  requires: [],                         // ex.: ['REPITA'] ou [['PD','PE']]
  match: 'shape',                       // 'exact' = mesma posição
  hints: ['Dica leve', 'Dica média', 'Dica forte (sem dar a resposta)'],
  success: 'Hexágono perfeito!',
  concept: { title: '💡 ...', text: '...' },
  goal: '...', commands: ['REPITA','PF','PD'], concepts: ['Loop'], teacherTip: '...',
}
```

O nível entra automaticamente no mapa, no Modo Professor e nos testes. **Para alterar um desenho-alvo, basta mudar o `solution`.**

Sem mexer em código, o professor também pode criar desafios em **Modo Professor → Criar desafio personalizado**: escreve o código da solução e recebe um link para enviar aos alunos (o desafio vai dentro do próprio link).

Galeria: `js/examples.js`. Aulas: `js/tutorial.js`. Conquistas: `js/achievements.js`.

## Como alterar ou criar comandos

Em `js/logo.js`, use `defineCommand`:

```js
defineCommand({
  name: 'PF',
  aliases: ['PARAFRENTE'],
  args: [{ name: 'passos', missing: 'PF precisa saber quantos passos a tartaruga deve andar.' }],
  doc: { title: 'PARA FRENTE', icon: '🐢 → →', group: 'Movimento', text: '...', example: 'PF 100' },
  run(ctx, [n]) { ctx.emit({ type: 'move', dist: n }); },
});
```

O cartão da Biblioteca de Comandos e a Ajuda são gerados a partir de `doc`. Para uma ação nova (ex.: cor), trate o novo `type` em `apply()` de `js/turtle.js`.

## Preparado para evoluir

- **Variáveis, contas e funções:** entram em `expression()` (parser) e `evalExpr()` (interpretador).
- **Procedimentos e recursividade (`PARA ... FIM`):** espaço reservado em `ctx.procedures`; as palavras `PARA`, `FIM`, `SE`, `MUDECOR`... já respondem "em breve".
- **Laboratório de Fractais:** `js/fractals.js` já gera a Curva de Koch (no mesmo formato de ações) e mostra o código-alvo futuro; o roteiro de ativação está no topo do arquivo.

## Licença

Uso educacional livre (MIT). Linguagem e interpretador próprios, inspirados nas ideias gerais da LOGO.
