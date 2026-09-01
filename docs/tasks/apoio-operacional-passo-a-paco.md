# Tasks: Site de Apoio Operacional — Sou Manaus Passo a Paço 2026

> **Spec:** docs/specs/apoio-operacional-passo-a-paco.md
> **Status:** 10/13 tasks concluídas | 4/6 ondas concluídas
> **Criado em:** 01/09/2026

---

## Como usar

Execute `/implement docs/tasks/apoio-operacional-passo-a-paco.md` para implementar a próxima onda pendente, ou `--onda N` para forçar uma onda específica.

Em ondas com `Estratégia: paralela`, o `/implement` mostra o consumo estimado das duas rotas e pergunta qual usar antes de despachar qualquer coisa; as demais rodam inline, em sequência. Em ambos os casos, só o agente principal commita.

---

## Contexto técnico que vale para todas as tasks

- **Stack:** HTML + CSS + JavaScript vanilla com ES modules. **Sem framework, sem bundler, sem npm, sem etapa de build.** Os arquivos do repositório são os arquivos servidos.
- **Hospedagem:** GitHub Pages, servindo a raiz do repositório.
- **Dados:** `dados/dados.json`, gerado por `ferramentas/gerar_dados.py`. Nenhuma task pode alterar a lógica de parsing desse script.
- **A regra que mais importa:** o horário exibido vem de `dias[X].passagens[]` (coluna VOLTA da planilha = passagem pelo ponto de embarque, **aproximada**). O campo `dias[X].saidasOrigem[]` é a partida do bairro e **nunca pode ser exibido** — usá-lo erra por 1 hora na linha 604.
- **Node** só é usado pelo teste-guarda em `ferramentas/`, nunca pelo site.

---

## ONDA 1 — Fundação: estrutura, tokens e assets (1 task)

> **Pré-requisitos:** nenhum
> **Estratégia:** sequencial
> **Arquivos compartilhados:** nenhum
> **Lote paralelo:** nenhum
> **Namespaces globais:** nenhum
> **Nomes reservados:** nenhum
> **Contrato compartilhado:** nenhum
> **Pares produtor/consumidor:** nenhum
> **Verificação de integração:** `index.html` abre no navegador sem erro de console e sem 404, exibindo o cabeçalho e os três botões de dia.

### TASK-01 — [FRONTEND] Criar o esqueleto do site, os tokens de design e os assets

**Descrição:**
Estabelecer toda a estrutura de arquivos do site e a base visual. Esta task define o padrão que as demais seguem — nada existe antes dela.

1. Criar a árvore de arquivos exatamente como abaixo. **Arquivos de tela ainda não são criados aqui** (isso é da TASK-02), mas o `index.html` já referencia todos eles.
2. Alterar em `ferramentas/gerar_dados.py` **apenas** a constante `SAIDA` (linha 34), de `PLANILHAS / "dados" / "dados.json"` para `RAIZ / "dados" / "dados.json"`. Motivo: o caminho atual (`Passo a paço/dados/`) tem espaço e cedilha e é ruim como URL no GitHub Pages. **Nenhuma outra linha do script pode ser tocada.** Rodar `python ferramentas/gerar_dados.py` em seguida e confirmar "Erros: 0".
3. Copiar `docs/assets/mapa-pontos.png` e `docs/assets/mapa-circulacao.png` para `assets/img/`.
4. Escrever `assets/css/base.css` com: reset mínimo, tokens CSS, tipografia e o layout de coluna única.

**Tokens obrigatórios em `assets/css/base.css`:**

```css
:root {
  --cor-evento-laranja: #F5821F;
  --cor-evento-azul: #312783;
  --cor-fundo: #FFFFFF;
  --cor-texto: #1A1A1A;

  /* cores funcionais dos 4 pontos — NÃO alterar por estética */
  --ponto-p1: #3FA45B;   /* verde   */
  --ponto-p2: #2B3990;   /* azul    */
  --ponto-p3: #F5821F;   /* laranja */
  --ponto-p4: #E31E24;   /* vermelho*/

  --fonte-corpo: 1rem;      /* >= 16px */
  --fonte-linha: 1.5rem;    /* >= 24px, número da linha */
  --alvo-toque: 44px;
}
```

**Árvore de arquivos a criar:**

```
/index.html
/assets/css/base.css
/assets/img/mapa-pontos.png
/assets/img/mapa-circulacao.png
/dados/dados.json          (gerado pelo passo 2)
```

**`index.html` deve conter:** cabeçalho com o nome do evento, o campo de busca (vazio, sem comportamento), os três botões de dia, uma barra de abas (Mapa / Circulação / Avisos), um `<main id="tela">` vazio onde as telas renderizam, e um `<footer id="rodape">`. Deve carregar `assets/css/base.css`, os 7 CSS de tela e, ao final, `<script type="module" src="app/principal.js"></script>`.

**Arquivos (exclusivos):**
- `index.html` — criar
- `assets/css/base.css` — criar
- `assets/css/telas/mapa.css`, `busca.css`, `ponto.css`, `linha.css`, `quadro.css`, `avisos.css`, `circulacao.css` — criar vazios (só um comentário de cabeçalho)
- `assets/img/mapa-pontos.png`, `assets/img/mapa-circulacao.png` — copiar
- `ferramentas/gerar_dados.py` — modificar **somente a linha 34**
- `dados/dados.json` — gerado

**Depende de:** nenhuma
**Bloqueante:** sim
**Paralelizável:** não
**Conflita com:** nenhuma
**Modelo sugerido:** opus
**Referência:** nenhuma

**Critério de conclusão:**
- [x] `python ferramentas/gerar_dados.py` grava em `dados/dados.json` e imprime "Erros: 0"
- [x] `git diff ferramentas/gerar_dados.py` mostra exatamente 1 linha alterada
- [x] `index.html` aberto no navegador não gera erro de console nem 404 — *exceto o 404 de `app/principal.js`, arquivo da TASK-02, que o próprio ticket manda referenciar aqui*
- [x] Os 4 tokens `--ponto-pN` existem com os valores exatos acima
- [x] Nenhuma requisição a domínio externo em toda a árvore (`grep -rE "https?://" index.html assets/` não retorna CDN)

**Status:** [x] Concluída

---

**Bug encontrado (TASK-01):** `assets/img/mapa-pontos.png` (2,1 MB) e `assets/img/mapa-circulacao.png` (1,8 MB) violam o RNF-01 da spec (WebP com fallback PNG, < 400 KB cada). A conversão não está no escopo de nenhuma task deste arquivo — precisa virar task nova.

**Nota (TASK-01):** o repositório git foi inicializado durante esta onda (`main`, remoto `origin` = `https://github.com/Gianyer-Acop/passo-a-paco.git`). Nada foi enviado ao remoto ainda — nenhum `git push` foi executado.

---

## ONDA 2 — Núcleo de dados, estado e tela de referência (1 task)

> **Pré-requisitos:** ONDA 1 concluída
> **Estratégia:** sequencial
> **Arquivos compartilhados:** nenhum
> **Lote paralelo:** nenhum
> **Namespaces globais:** chaves de tela no registro `telas.js`
> **Nomes reservados:** `mapa`, `busca`, `ponto`, `linha`, `quadro`, `avisos`, `circulacao` — cada uma pertence a exatamente uma task da ONDA 3; nenhuma outra chave pode ser criada
> **Contrato compartilhado:** `app/telas.js` (registro), `app/formato.js` (formatadores) e os 6 stubs em `app/telas/` — todos criados **aqui**, antes do despacho da ONDA 3, e por isso fora da lista exclusiva de qualquer task da ONDA 3
> **Pares produtor/consumidor:** nenhum (esta onda tem uma task só)
> **Verificação de integração:** `node ferramentas/verificar_contrato.mjs` passa; a aba Avisos renderiza no navegador.

### TASK-02 — [BACKEND] Núcleo: dados, formatadores, estado, registro de telas, tela Avisos e teste-guarda

**Descrição:**
Construir toda a fundação lógica que as 6 telas da ONDA 3 consomem, implementar a tela **Avisos** por inteiro como *referência do padrão de tela*, e criar o teste-guarda.

Esta é a task que **fecha as decisões de fundação**. O que ficar em aberto aqui será decidido 6 vezes, de 6 formas diferentes, pela onda seguinte.

**1. `app/dados.js`** — carrega `dados/dados.json` uma vez, expõe:
```js
export async function carregar()            // -> objeto completo, memoizado
export function linha(numero)               // -> objeto da linha ou undefined
export function pontos()                    // -> array dos 4 pontos
export function avisosDe(numero, diaISO)    // -> avisos aplicáveis à linha no dia
```

**2. `app/formato.js`** — formatadores. Congelar exatamente estas assinaturas:
```js
// "25:52" -> "01:52 (+1)" ; "05:19" -> "05:19"
export function hora(hhmm)
// minutos desde 00:00 do dia operacional; "25:52" -> 1552
export function minutos(hhmm)
// dia do evento vigente em America/Manaus, com virada as 03h.
// Entre 00:00 e 02:59 retorna o dia ANTERIOR. Fora de 05-07/09/2026 retorna
// { dia: "2026-09-05", foraDoEvento: true }
export function diaVigente(agora = new Date())
// -> { hora, emMinutos } da proxima passagem, ou null se nao ha mais hoje
export function proximaPassagem(passagens, agora = new Date())
```
A conversão de fuso deve usar `Intl.DateTimeFormat` com `timeZone: 'America/Manaus'`. **Não usar offset fixo.**

**3. `app/estado.js`** — estado da aplicação e navegação. Congelar:
```js
export function diaSelecionado()             // -> "2026-09-05"
export function selecionarDia(diaISO)        // re-renderiza preservando a tela atual
export function irPara(chaveTela, params = {})  // ex.: irPara('linha', { numero: '608' })
export function telaAtual()                  // -> { chave, params }
export function aoMudar(callback)            // observador
```
Trocar de dia **não** pode recarregar a página nem perder a linha em tela (RF-04).

**4. `app/telas.js`** — registro de telas. Congelar:
```js
export function registrar(chave, { titulo, render })
// render(elemento, params) -> void. Recebe <main id="tela"> ja limpo.
export function renderizar(chave, params)
export function chaves()                     // -> array das chaves registradas
```

**5. `app/telas/*.js`** — criar os 6 **stubs** (`mapa`, `busca`, `ponto`, `linha`, `quadro`, `circulacao`). Cada stub apenas registra a chave e renderiza um placeholder. A ONDA 3 preenche cada um.

**Contrato entre `linha` e `quadro` (congelado aqui, consumido na ONDA 3):**
```js
// app/telas/quadro.js exporta, alem de registrar a tela:
export function renderizarQuadroCompleto(elemento, objetoLinha, diaISO)
// app/telas/linha.js importa essa funcao para o botao "Ver quadro completo"
```

**6. `app/telas/avisos.js`** — **implementar por completo.** É a referência do padrão de tela para a ONDA 3: lê o estado, lê os dados, monta o DOM e registra a chave. Lista `dados.avisos` filtrados pelo `diaSelecionado()`, ordenados por `severidade` (`alta` > `media` > `info`).

**7. `app/principal.js`** — inicializa: carrega dados, resolve o dia via `diaVigente()`, liga os botões de dia e as abas, renderiza a tela inicial (`mapa`), preenche o `<footer>` com `Dados de <versaoDados>`.

**8. `ferramentas/verificar_contrato.mjs`** — teste-guarda em Node puro, sem dependências, rodando em ~1s. Deve afirmar:
- `dados/dados.json` existe e tem 77 linhas, 34 com `temProgramacaoEvento: true`
- toda linha com programação tem os 3 dias, e em cada dia `passagens.length === ` nº de viagens com `tipo !== "continuacao"`
- `passagens` está em ordem crescente em todos os blocos
- **`dados.linhas["604"].dias["2026-09-07"].passagens[0] === "16:46"`**
- **`dados.linhas["214"].dias["2026-09-05"].passagens[0] === "06:02"`**
- **`dados.linhas["113"].dias["2026-09-05"].passagens.length === 32`**
- as 7 chaves de tela aparecem exatamente uma vez em `app/telas/` (varredura textual de `registrar('...')`), sem duplicata e sem chave fora da lista reservada
- **nenhum arquivo em `app/telas/` contém a string `saidasOrigem`** — é o guarda contra o erro de exibir a partida do bairro

**Arquivos (exclusivos):**
- `app/dados.js`, `app/formato.js`, `app/estado.js`, `app/telas.js`, `app/principal.js` — criar
- `app/telas/avisos.js` — criar (implementação completa)
- `app/telas/mapa.js`, `busca.js`, `ponto.js`, `linha.js`, `quadro.js`, `circulacao.js` — criar como stubs
- `assets/css/telas/avisos.css` — preencher
- `ferramentas/verificar_contrato.mjs` — criar

**Depende de:** TASK-01 (ONDA 1)
**Bloqueante:** sim
**Paralelizável:** não
**Conflita com:** nenhuma
**Modelo sugerido:** opus
**Referência:** nenhuma

**Critério de conclusão:**
- [x] `node ferramentas/verificar_contrato.mjs` sai com código 0 e imprime as asserções
- [x] `diaVigente(new Date('2026-09-06T01:20:00-04:00'))` retorna `2026-09-05`
- [x] `diaVigente(new Date('2026-09-20T10:00:00-04:00'))` retorna `2026-09-05` com `foraDoEvento: true`
- [x] `hora('25:52')` retorna `'01:52 (+1)'`
- [x] A aba Avisos renderiza no navegador e muda de conteúdo ao trocar para 07/09 (9 → 11 avisos)
- [x] Os 6 stubs registram suas chaves e o `chaves()` devolve as 7

**Status:** [x] Concluída

---

**Bug encontrado (TASK-02):** os rótulos dos botões de dia em `index.html` estão com o dia da semana errado — dizem `sexta / sábado / domingo`, mas 05, 06 e 07/09/2026 são **sábado, domingo e segunda** (confere com `tipoDia` no `dados.json`: `SÁBADO`, `DOMINGO`, `SEGUNDA (PASSO A PAÇO)`). `index.html` é da TASK-01 e não está na lista exclusiva de nenhuma task pendente — precisa de correção própria. Enquanto isso, o subtítulo da tela Avisos, que calcula o dia da semana, contradiz visivelmente os botões.

**Desvio (TASK-02):** as classes `.estado-vazio`, `.estado-erro`, `.fora-do-evento` e `.rodape__versao` foram escritas em `assets/css/base.css`, que não está na lista exclusiva desta task. Motivo: são usadas por `app/telas.js` e pelos 7 arquivos de tela; deixá-las indefinidas faria as 6 tasks da ONDA 3 definirem, cada uma, a sua versão da mesma classe. `base.css` não pertence a nenhuma task pendente.

**Contrato adicional congelado na TASK-02** (além dos que o ticket já listava), para a ONDA 3:
- **Campo de busca → TASK-04:** `principal.js` liga o `input` de `#busca` a `irPara('busca', { termo })` a cada digitação; termo vazio volta para a tela `mapa`. O campo vive no `<header>`, fora do `<main>`, então re-renderizar não tira o foco nem o cursor (verificado com digitação real).
- **`proximaPassagem()` → TASK-06:** o campo `hora` do retorno é o valor **bruto** de `passagens[]` (pode ser `'25:47'`). Quem exibe passa por `formato.hora()`.
- **`avisosDe(numero, dia)`:** filtra por dia e por linha, e já devolve ordenado por severidade. O campo `linha.avisos` do JSON é dia-agnóstico e não deve ser usado direto.

---

## ONDA 3 — As seis telas (6 tasks)

> **Pré-requisitos:** ONDA 2 concluída
> **Estratégia:** paralela
> **Arquivos compartilhados:** nenhum — cada task detém 1 arquivo JS e 1 CSS, ambos já existentes como stub
> **Lote paralelo:** todas (TASK-03 … TASK-08)
> **Namespaces globais:** chaves de tela no registro `app/telas.js` (auto-descoberta por varredura textual no teste-guarda)
> **Nomes reservados:** cada task usa **exclusivamente** a chave indicada no seu bloco. Nenhuma task pode registrar chave nova, renomear a sua, nem tocar na chave `avisos` (já usada pela TASK-02)
> **Contrato compartilhado:** `app/telas.js`, `app/formato.js`, `app/dados.js`, `app/estado.js` e os stubs — todos criados na ONDA 2, fora da lista exclusiva de qualquer task desta onda
> **Pares produtor/consumidor:** TASK-07 produz `renderizarQuadroCompleto(elemento, objetoLinha, diaISO)` → TASK-06 consome. **A assinatura foi congelada na TASK-02** e nenhuma das duas pode alterá-la
> **Verificação de integração:** rodar `node ferramentas/verificar_contrato.mjs` após juntar as 6 — ele é o único que enxerga colisão de chave e uso indevido de `saidasOrigem`. Cada subagente deve rodá-lo junto do próprio trabalho.

### TASK-03 — [FRONTEND] Tela do mapa de pontos

**Descrição:** Renderizar `assets/img/mapa-pontos.png` como fundo com 4 hotspots clicáveis, mais a lista de cartões dos pontos abaixo. Chave de tela: **`mapa`**.

Hotspots posicionados em `%` lidos de `pontos[].hotspot` (`{x, y}`), com `position:absolute` sobre um contêiner `position:relative` que envolve a imagem — assim acompanham o redimensionamento. Imagem com `max-width:100%`. Alvos ≥ 44×44 px. `alt` descritivo.

Abaixo do mapa, um cartão por ponto com: número, cor (`--ponto-pN`), zonas atendidas e a contagem de linhas. Cartões navegáveis por teclado. Clicar em hotspot ou cartão chama `irPara('ponto', { id: 'P1' })`.

**Atenção (RNF-06):** a cor nunca pode ser o único indicador — todo cartão e hotspot precisa do número do ponto e da zona em texto.
**Atenção (edge case):** P1 (`y:28.4`) e P2 (`y:43.3`) são próximos; os alvos não podem se sobrepor.

**Arquivos (exclusivos):**
- `app/telas/mapa.js` — preencher
- `assets/css/telas/mapa.css` — preencher

**Depende de:** TASK-02 (ONDA 2)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** `app/telas/avisos.js` (padrão de tela)

**Critério de conclusão:**
- [x] Os 4 hotspots caem sobre os pins da arte em 360px e em 1280px de largura
- [x] Clicar no pin do Ponto 03 abre a lista com as 14 linhas do ponto
- [x] Navegação por Tab alcança os 4 cartões, com foco visível
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

### TASK-04 — [FRONTEND] Busca de linhas

**Descrição:** Ligar o campo de busca do `index.html`. Chave de tela: **`busca`**.

Filtra em tempo real sobre as **77** linhas, por número (`608`) ou por trecho do nome, sem acento e sem diferenciar maiúsculas (`petropolis` acha `PETROPOLIS / T1 / CENTRO`). Resultado mostra número em destaque, nome e o ponto com a cor. Selecionar chama `irPara('linha', { numero })`.

Linhas com `temProgramacaoEvento: false` aparecem com marcador discreto **"sem alteração"** (RF-14b) — o marcador informa, não penaliza.

Sem resultado: mensagem orientando consultar a escala regular. Vale tanto para número inexistente (`999`) quanto para linha fora de escopo (`442`).

**Atenção:** linhas com `nome: null` (011, 302, 305, 320, 357) exibem só o número — nunca a string "null" nem um espaço vazio no layout.

**Arquivos (exclusivos):**
- `app/telas/busca.js` — preencher
- `assets/css/telas/busca.css` — preencher

**Depende de:** TASK-02 (ONDA 2)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** `app/telas/avisos.js` (padrão de tela)

**Critério de conclusão:**
- [x] Digitar `608` chega à linha em no máximo 2 toques
- [x] Digitar `petropolis` e `PETRÓPOLIS` devolvem o mesmo resultado
- [x] Digitar `999` e `442` mostram a mensagem de não encontrado
- [x] Buscar `011` exibe só o número, sem "null"
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

### TASK-05 — [FRONTEND] Lista de linhas do ponto

**Descrição:** Listar as linhas de um ponto. Chave de tela: **`ponto`**. Recebe `params.id` (`'P1'`…`'P4'`).

Cabeçalho com número do ponto, cor, zonas atendidas e o dia selecionado. Lista ordenada numericamente, cada item com número em destaque e nome. Linhas com `temProgramacaoEvento: false` recebem o marcador "sem alteração". Clicar chama `irPara('linha', { numero })`.

Estruturalmente é a mesma coisa que `avisos.js`: lê estado, lê dados, monta lista, registra chave. **Replique aquele padrão** trocando a fonte de dados e o formato do item.

**Arquivos (exclusivos):**
- `app/telas/ponto.js` — preencher
- `assets/css/telas/ponto.css` — preencher

**Depende de:** TASK-02 (ONDA 2)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** haiku
**Referência:** `app/telas/avisos.js` — replicar o padrão de tela com outra fonte de dados

**Critério de conclusão:**
- [x] Ponto 03 lista 14 linhas: 7 com quadro e 7 marcadas "sem alteração"
- [x] Ordem numérica crescente
- [x] Trocar o dia no topo atualiza o cabeçalho sem sair da lista
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

### TASK-06 — [FRONTEND] Tela da linha — visão simplificada

**Descrição:** A tela mais importante do site. Chave de tela: **`linha`**. Recebe `params.numero`.

**Caso A — `temProgramacaoEvento: false` (43 linhas):** tela reduzida com número, nome, ponto de embarque com a cor, e a mensagem *"Esta linha não teve alteração para o Passo a Paço. Embarque no Ponto X e siga a escala regular."* **Nenhum horário na tela**, e nunca exibir `escalaBase.dataReferencia` (é metadado interno).

**Caso B — `temProgramacaoEvento: true` (34 linhas):**
- Cabeçalho fixo: número, nome, empresa (**omitir o rótulo quando `empresa` for `null`** — 15 das 34), ponto com a cor, dia.
- Avisos aplicáveis via `avisosDe(numero, dia)`, acima do quadro.
- `observacoes` e `legendaViagens` da linha (RF-15b).
- **Grade de `dias[dia].passagens[]`**, agrupada por hora, legível a distância, formatada com `formato.hora()`.
- **Rótulo obrigatório: "passagem prevista pelo ponto"**, sinalizando que é **aproximado**. Nunca a palavra "saída", nunca apresentar como horário exato.
- **Proibido ler `saidasOrigem`.** O teste-guarda falha se a string aparecer no arquivo. `saidasOrigem` é a partida do bairro: usá-la mostraria 15:46 no lugar de 16:46 na linha 604.
- Quando `dia === diaVigente()`, destaque de `proximaPassagem()`: *"próxima passagem por aqui, prevista para HH:MM (em N min)"*. Se já passou a última: *"sem mais passagens hoje"* — nunca `NaN` nem negativo. Se ainda não começou, a próxima é a primeira.
- Botão **"Ver quadro completo"** chamando `renderizarQuadroCompleto(elemento, objetoLinha, diaISO)`, importado de `app/telas/quadro.js`. **A assinatura está congelada na TASK-02 e não pode ser alterada.**

**Arquivos (exclusivos):**
- `app/telas/linha.js` — preencher
- `assets/css/telas/linha.css` — preencher

**Depende de:** TASK-02 (ONDA 2)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** `app/telas/avisos.js` (padrão de tela)

**Critério de conclusão:**
- [x] **Linha 604 em 07/09 mostra a primeira passagem às `16:46`.** Se aparecer `15:46`, a implementação usou `saidasOrigem` e está errada
- [x] **Linha 214 em 05/09 mostra `06:02`, não `05:20`**
- [x] Linha 113 em 05/09 lista 32 passagens, de `05:19` a `01:52 (+1)`
- [x] Linha 305 em 05/09 lista 14 passagens, de `04:30` a `00:23 (+1)`
- [x] Buscar `447` abre a tela reduzida, com o Ponto 04 em destaque e **nenhum horário**
- [x] Linha 604 em 07/09 exibe o aviso das 18h; em 05/09 não exibe
- [x] A tela usa a palavra "passagem" e sinaliza que o horário é aproximado
- [x] `grep -c saidasOrigem app/telas/linha.js` retorna 0
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

### TASK-07 — [FRONTEND] Quadro horário completo

**Descrição:** Visão operacional detalhada, aberta pelo botão da TASK-06. Chave de tela: **`quadro`**.

Além de registrar a chave, **exportar a função de contrato congelada na TASK-02**:
```js
export function renderizarQuadroCompleto(elemento, objetoLinha, diaISO)
```

Renderiza, por turno, uma tabela por TAB com: TAB, veículo, jornada, e as colunas IDA / VOLTA / TÉRMINO / T. VIAGEM. **Rotular as colunas para o operador:** `IDA` = saída do bairro, `VOLTA` = passagem pelo ponto. Exibir também a tabela de frequência (`frequencia[]`, hora/intervalo) quando existir.

**Edge cases obrigatórios:**
- `tipo: "continuacao"` (735 no conjunto) tem `volta: null` — renderizar a célula vazia **com legenda explicando que é perna de retorno, não passagem**.
- `tipo: "baixada"` (6, todas na linha 305) tem `ida: null` — não pode quebrar; legendar como viagem que começa no retorno.
- Horários `>= 24:00` via `formato.hora()`, com legenda `(+1) = madrugada do dia seguinte`.
- Tabela larga (a linha 640 tem 3 tabelas por turno) rola em `overflow-x:auto` **dentro do próprio contêiner** — o `body` nunca rola na horizontal.

**Arquivos (exclusivos):**
- `app/telas/quadro.js` — preencher
- `assets/css/telas/quadro.css` — preencher

**Depende de:** TASK-02 (ONDA 2)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** `app/telas/avisos.js` (padrão de tela)

**Critério de conclusão:**
- [x] A assinatura exportada é exatamente `renderizarQuadroCompleto(elemento, objetoLinha, diaISO)`
- [x] Linha 640 em 05/09 rola horizontalmente dentro do contêiner; o `body` não rola
- [x] Linha 305 em 05/09 renderiza as 6 baixadas sem quebrar
- [x] Célula vazia de continuação tem legenda
- [x] Em 360×640 a página não rola na horizontal
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

### TASK-08 — [FRONTEND] Aba de circulação

**Descrição:** Aba com o mapa de circulação. Chave de tela: **`circulacao`**.

Renderiza `assets/img/mapa-circulacao.png` (Av. Epaminondas, Terminal da Matriz, Praça da Saudade, plataforma interditada), ampliável em tela cheia ao toque, com `alt` descritivo. Abaixo, os 8 itens de circulação em texto legível — o conteúdo está em `docs/prd.md` §8 e na arte da pág. 4 do PDF.

Estruturalmente é a mesma coisa que `avisos.js`: uma imagem mais uma lista de texto estático. **Replique aquele padrão.**

**Arquivos (exclusivos):**
- `app/telas/circulacao.js` — preencher
- `assets/css/telas/circulacao.css` — preencher

**Depende de:** TASK-02 (ONDA 2)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** haiku
**Referência:** `app/telas/avisos.js` — replicar o padrão de tela, trocando a lista de avisos por imagem + texto estático

**Critério de conclusão:**
- [x] A imagem amplia em tela cheia ao toque e fecha
- [x] Os 8 itens aparecem em texto, legíveis sem zoom em 360px
- [x] Imagem com `alt` descritivo
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

## ONDA 4 — Offline e peso dos assets (2 tasks)

> **Pré-requisitos:** ONDA 3 concluída
> **Estratégia:** paralela
> **Arquivos compartilhados:** nenhum
> **Lote paralelo:** TASK-09, TASK-10
> **Namespaces globais:** nenhum (nenhuma das duas registra chave de tela)
> **Nomes reservados:** nenhum
> **Contrato compartilhado:** nenhum
> **Pares produtor/consumidor:** nenhum
> **Verificação de integração:** com modo avião após o primeiro acesso, o site abre e navega; o rodapé mostra a data de `versaoDados`.

### TASK-09 — [FRONTEND] Service worker, manifesto e carimbo de versão

**Descrição:** Fazer o site funcionar sem rede (RF-23, RF-24, RF-25).

`sw.js`: *cache-first* para `index.html`, CSS, JS e imagens; *stale-while-revalidate* para `dados/dados.json`. Versionar o nome do cache.

Rodapé: `Dados de <versaoDados>` (campo do JSON). Quando a revalidação trouxer um `versaoDados` mais novo que o do cache, exibir botão **"Atualizar"** que recarrega. Mitiga o risco de o operador ficar com programação antiga em campo.

`manifest.webmanifest` para "adicionar à tela de início": nome, ícone, `display: standalone`, cores do tema.

**Edge case:** primeiro acesso já offline, sem cache — mensagem clara, nunca tela branca.

**Arquivos (exclusivos):**
- `sw.js` — criar
- `manifest.webmanifest` — criar
- `app/rodape.js` — criar
- `index.html` — modificar (link do manifesto, registro do SW)

**Depende de:** TASK-06, TASK-07 (ONDA 3)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** nenhuma

**Critério de conclusão:**
- [x] Com modo avião após o primeiro acesso, o site abre e navega entre telas
- [x] O rodapé mostra a data de `versaoDados`
- [x] Regerar o `dados.json` e recarregar faz aparecer o botão "Atualizar"
- [x] Primeiro acesso offline mostra mensagem, não tela branca

**Status:** [x] Concluída

---

### TASK-10 — [FRONTEND] Converter as artes para WebP com fallback

**Descrição:** Atender ao RNF-01: cada mapa abaixo de 400 KB, conteúdo útil em menos de 2s em 3G.

Converter os dois PNG (1517×1190 e 1517×1237) para WebP com Pillow (já instalado), mantendo o PNG como fallback. Ajustar `mapa.js` e `circulacao.js` para usar `<picture>` com `<source type="image/webp">`.

Gravar o passo de conversão em `ferramentas/otimizar_imagens.py`, para ser repetível se a arte mudar.

**Atenção:** os hotspots da TASK-03 são posicionados em `%` — trocar o formato **não pode** deslocá-los. Manter as dimensões originais.

**Arquivos (exclusivos):**
- `ferramentas/otimizar_imagens.py` — criar
- `assets/img/mapa-pontos.webp`, `assets/img/mapa-circulacao.webp` — gerar
- `app/telas/mapa.js`, `app/telas/circulacao.js` — modificar (só a tag da imagem)
- `assets/css/telas/mapa.css`, `assets/css/telas/circulacao.css` — modificar se necessário

**Depende de:** TASK-03, TASK-08 (ONDA 3)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** nenhuma

**Critério de conclusão:**
- [x] Ambos os WebP abaixo de 400 KB
- [x] Os PNG continuam servindo de fallback
- [x] Os 4 hotspots seguem alinhados com os pins após a troca
- [x] `node ferramentas/verificar_contrato.mjs` passa

**Status:** [x] Concluída

---

**Desvios (ONDA 4):** três arquivos fora das listas exclusivas dos tickets, todos necessários e nenhum conflitante:
- `ferramentas/gerar_icones.py` e `assets/img/icone-{192,512,maskable-512}.png` — o manifesto exige ícones e nenhum ticket os previa.
- `app/principal.js` e `assets/css/base.css` — a TASK-09 manda criar `app/rodape.js`, que precisa ser importado e estilizado.
- `ferramentas/verificar_contrato.mjs` — recebeu as asserções das duas tasks (é o único harness de teste do projeto).

**Bug encontrado (TASK-09):** três defeitos no `sw.js`/`rodape.js` que passavam por qualquer verificação estática e falhavam em silêncio (botão "Atualizar" nunca aparecia): falta de `navigator.serviceWorker.startMessages()`; revalidação sem `evento.waitUntil()`; e `emCache.clone()` depois de a resposta já ter sido consumida pelo `respondWith`. Todos corrigidos e cobertos por asserção. Registrado aqui porque a lição vale para a ONDA 6: **guarda estático verde não é prova de comportamento de service worker.**

**Nota (ONDA 4):** o Browser pane não reexecuta o `install` de um service worker depois da primeira registração da sessão — registra e pula direto para `activated`, sem criar cache. A verificação de SW deste projeto precisa ser feita no Chrome real.

---

## ONDA 5 — Acessibilidade e documentação (2 tasks)

> **Pré-requisitos:** ONDA 4 concluída
> **Estratégia:** paralela
> **Arquivos compartilhados:** nenhum — TASK-11 mexe só em CSS, TASK-12 só em Markdown
> **Lote paralelo:** TASK-11, TASK-12
> **Namespaces globais:** nenhum
> **Nomes reservados:** nenhum
> **Contrato compartilhado:** nenhum
> **Pares produtor/consumidor:** nenhum
> **Verificação de integração:** nenhuma

### TASK-11 — [EDGE] Passe de acessibilidade e responsividade

**Descrição:** Varrer as 7 telas contra RNF-03 a RNF-07. É um passe de ajuste em CSS, sem mudar comportamento.

- 360×640: nenhuma tela rola na horizontal; só as tabelas do quadro rolam, dentro do contêiner.
- Alvos ≥ 44×44 px em tudo que é interativo.
- Corpo ≥ 16px; número da linha ≥ 24px.
- Contraste WCAG AA em todas as combinações, inclusive as 4 cores de ponto sobre branco.
- Foco visível em todo elemento navegável por teclado.
- **Cor nunca como único indicador** — todo ponto sempre acompanhado do número e da zona em texto.
- Verificar em 360×640, 768×1024 e 1280×800.

**Arquivos (exclusivos):**
- `assets/css/base.css` — modificar
- `assets/css/telas/*.css` (os 7) — modificar

**Depende de:** TASK-09, TASK-10 (ONDA 4)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** nenhuma

**Critério de conclusão:**
- [ ] Em 360×640 nenhuma tela rola na horizontal
- [ ] Todo alvo interativo mede ≥ 44×44 px
- [ ] Contraste AA verificado nas 4 cores de ponto sobre o fundo
- [ ] Percurso completo por teclado, com foco sempre visível
- [ ] Nenhuma informação depende só de cor

**Status:** [ ] Pendente

---

### TASK-12 — [DOCS] README com operação e publicação

**Descrição:** Escrever o `README.md` para quem mantém o site durante o evento — inclusive alguém que nunca viu o projeto, às 22h de um sábado.

Deve cobrir:
- O que o site é e para quem.
- **Como atualizar os dados:** editar as planilhas em `Passo a paço/`, rodar `python ferramentas/gerar_dados.py`, conferir "Erros: 0", rodar `node ferramentas/verificar_contrato.mjs`, commitar `dados/dados.json` e dar push. O GitHub Pages publica sozinho.
- **O que fazer quando o gerador acusa erro** — conflito painel × quadro não se resolve no código, vai para a operação. Apontar `docs/prd.md` §4 regra 5: não existe um lado que sempre vence.
- A distinção entre as 34 linhas alteradas e as 43 sem alteração, e por que as 43 não mostram horário.
- **Por que o site exibe `passagens` e nunca `saidasOrigem`.**
- Como publicar no GitHub Pages (branch, pasta raiz).
- Pendências abertas: P-01 (5 nomes de linha), P-02 (qual lista de viagem extra vale), e as 6 linhas fora de escopo.

**Arquivos (exclusivos):**
- `README.md` — criar

**Depende de:** TASK-09, TASK-10 (ONDA 4)
**Bloqueante:** não
**Paralelizável:** sim
**Conflita com:** nenhuma
**Modelo sugerido:** sonnet
**Referência:** nenhuma

**Critério de conclusão:**
- [ ] Um leitor que nunca viu o projeto consegue atualizar os dados só com o README
- [ ] O procedimento de atualização está em comandos copiáveis
- [ ] A regra `passagens` × `saidasOrigem` está explicada
- [ ] As pendências abertas estão listadas

**Status:** [ ] Pendente

---

## ONDA 6 — Validação final (1 task)

> **Pré-requisitos:** ONDA 5 concluída
> **Estratégia:** sequencial
> **Arquivos compartilhados:** nenhum
> **Lote paralelo:** nenhum
> **Namespaces globais:** nenhum
> **Nomes reservados:** nenhum
> **Contrato compartilhado:** nenhum
> **Pares produtor/consumidor:** nenhum
> **Verificação de integração:** os 15 critérios de aceite da spec, verificados no navegador.

### TASK-13 — [INTEGRAÇÃO] Percorrer os critérios de aceite e conferir a amostra manual

**Descrição:** Última barreira antes do evento. Percorrer os 15 critérios de aceite da spec no navegador, um a um, e registrar o resultado.

Inclui a **conferência manual de amostra**, que é o único ponto que a validação automática não cobre: o gerador cruza painel × quadro × total declarado *dentro* da planilha, então três fontes erradas juntas passariam. Escolher 3 linhas × 3 dias, abrir a planilha original e comparar os horários da tela **contra a coluna VOLTA** — não a IDA.

Sugestão de amostra, por cobrirem os casos difíceis: **305** (baixadas e dois terminais), **640** (a maior, 3 tabelas por turno) e **604** (programação especial de domingo, o caso onde IDA e VOLTA diferem em 1 hora).

Registrar o resultado em `docs/validacao-final.md`, com o que passou, o que falhou e o que ficou pendente com a operação.

**Arquivos (exclusivos):**
- `docs/validacao-final.md` — criar

**Depende de:** TASK-11, TASK-12 (ONDA 5)
**Bloqueante:** não
**Paralelizável:** não
**Conflita com:** nenhuma
**Modelo sugerido:** opus
**Referência:** nenhuma

**Critério de conclusão:**
- [ ] Os 15 critérios de aceite da spec percorridos, com resultado registrado
- [ ] Amostra de 3 linhas × 3 dias conferida contra a coluna VOLTA da planilha, batendo 100%
- [ ] `node ferramentas/verificar_contrato.mjs` passa
- [ ] Toda divergência encontrada está registrada como pendência, não silenciada

**Status:** [ ] Pendente

---

## Critérios de aceite da feature

Espelham a §7 da spec. A validação formal é a TASK-13.

- [ ] Abrindo às 01h de 06/09 no fuso de Manaus, o dia selecionado é **05/09**
- [ ] Digitando `608`, chega-se ao quadro em no máximo 2 toques, com "Ponto de Ônibus 01 — Verde" visível
- [ ] Linha 604 em 07/09 mostra a primeira passagem às **16:46** (não 15:46)
- [ ] Linha 214 em 05/09 mostra **06:02** (não 05:20)
- [ ] Pin do Ponto 03 abre as 14 linhas: 7 com quadro, 7 "sem alteração"
- [ ] Linha 604 em 07/09 exibe o aviso das 18h; em 05/09 não exibe
- [ ] Buscar `447` abre a tela reduzida, sem nenhum horário
- [ ] Linha 305 em 05/09 lista 14 passagens, de `04:30` a `00:23 (+1)`
- [ ] Última passagem da 227 em 05/09 aparece como `02:18 (+1)`, nunca `26:18`
- [ ] Linha 113 em 05/09 lista 32 passagens, de `05:19` a `01:52 (+1)`
- [ ] Nenhuma viagem de continuação aparece na visão simplificada
- [ ] A tela usa "passagem" e sinaliza que o horário é aproximado
- [ ] Com modo avião após o primeiro acesso, o site abre e navega
- [ ] Em 360×640 nenhuma tela rola na horizontal
- [ ] Trocar de dia na tela de uma linha mantém a mesma linha
- [ ] Amostra de 3 linhas × 3 dias bate 100% contra a coluna VOLTA

## Mapa de ondas

```
ONDA 1 (sequencial): TASK-01 [BLOQUEANTE] scaffold + tokens + assets
         ↓
ONDA 2 (sequencial): TASK-02 [BLOQUEANTE] núcleo + registro + tela-referência + teste-guarda
         ↓
ONDA 3 (paralela):   TASK-03 mapa | TASK-04 busca | TASK-05 ponto
                     TASK-06 linha | TASK-07 quadro | TASK-08 circulação
         ↓
ONDA 4 (paralela):   TASK-09 offline/PWA | TASK-10 WebP
         ↓
ONDA 5 (paralela):   TASK-11 a11y/responsivo | TASK-12 README
         ↓
ONDA 6 (sequencial): TASK-13 validação final
```

**Modelos por onda:** ONDA 1 opus · ONDA 2 opus · ONDA 3 sonnet×4 + haiku×2 · ONDA 4 sonnet×2 · ONDA 5 sonnet×2 · ONDA 6 opus
