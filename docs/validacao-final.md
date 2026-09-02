# Validação final — Site de Apoio Operacional, Sou Manaus Passo a Paço 2026

> **Task:** TASK-13 (ONDA 6)
> **Executada em:** 02/09/2026
> **Ambiente:** `python -m http.server 8765` servindo a raiz do repositório; navegador com
> service worker ativo; viewport de teste 360×640 e desktop.
> **Estado validado:** a árvore em 02/09/2026, já com a correção descrita em D-01.

---

## 1. Resumo

| | |
|---|---|
| Critérios de aceite | **15 de 15 passam** |
| Amostra manual (3 linhas × 3 dias) | **9 de 9 blocos batem 100%** contra a coluna VOLTA |
| Teste-guarda `node ferramentas/verificar_contrato.mjs` | **73 asserções ok, 0 falhas** |
| Divergências encontradas | **1 corrigida (D-01)**, **2 registradas como pendência (D-02, D-03)** |
| Observações para a operação | 2 (O-01, O-02) |

O site está apto a ir ao ar. As duas pendências abertas são de rótulo e de acessibilidade;
nenhuma altera horário exibido.

---

## 2. Amostra manual contra a coluna VOLTA

Este é o único ponto que a validação automática **não** cobre. O gerador cruza painel ×
quadro × total declarado *dentro* da planilha: três fontes erradas juntas passariam. A
conferência abaixo foi feita com um **leitor independente**, escrito para esta validação,
que não reaproveita nenhuma linha de `ferramentas/gerar_dados.py`:

- segmenta os dias pelo valor da **coluna B** de cada bloco (aceita tanto `datetime` quanto
  a variante em texto `05/09/2026 - COM COBRADOR`, que é como a aba 305 grava a data);
- coleta **apenas as colunas rotuladas VOLTA** dentro do bloco, em todas as tabelas do dia;
- descarta as linhas `JORN.`;
- linhas de continuação caem fora naturalmente, porque nelas a célula de VOLTA é vazia;
- normaliza a madrugada (`datetime` com ano 1900) para `24:MM`/`25:MM`/`26:MM`;
- compara o conjunto ordenado contra `dias[X].passagens[]` de `dados/dados.json`.

Amostra escolhida pelos casos difíceis: **305** (baixadas e dois terminais), **640** (a maior,
3 tabelas por turno) e **604** (programação especial, o caso onde IDA e VOLTA diferem em
1 hora).

| Linha | Dia | Planilha (VOLTA) | Site | Faixa | Resultado |
|---|---|---|---|---|---|
| 305 | 05/09 | 14 | 14 | 04:30 … 24:23 | **bate** |
| 305 | 06/09 | 14 | 14 | 04:30 … 24:23 | **bate** |
| 305 | 07/09 | 14 | 14 | 04:30 … 24:23 | **bate** |
| 640 | 05/09 | 75 | 75 | 05:34 … 26:55 | **bate** |
| 640 | 06/09 | 59 | 59 | 05:28 … 25:33 | **bate** |
| 640 | 07/09 | 70 | 70 | 05:34 … 26:01 | **bate** |
| 604 | 05/09 | 35 | 35 | 04:54 … 27:10 | **bate** |
| 604 | 06/09 | 16 | 16 | 18:08 … 27:05 | **bate** |
| 604 | 07/09 | 12 | 12 | 16:46 … 26:10 | **bate** |

**9 blocos, 0 divergências — 100%.** Nenhum horário do site veio da coluna IDA.

O caso 604 / 07/09 é o que valida a regra central: a primeira passagem é **16:46** (VOLTA).
A IDA correspondente é 15:46 — exibi-la erraria por uma hora inteira.

---

## 3. Os 15 critérios de aceite

| # | Critério | Como foi verificado | Resultado |
|---|---|---|---|
| 1 | Abrindo às 01h de 06/09 no fuso de Manaus, o dia selecionado é 05/09 | `diaVigente()` usa `partesEmManaus()` e a virada às 03h; teste-guarda cobre `06/09 01:20 → 05/09` e `06/09 03:01 → 06/09` | **passa** |
| 2 | Digitando `608`, chega-se ao quadro em no máximo 2 toques, com o ponto visível | Busca fixa no cabeçalho: toque 1 = digitar, toque 2 = tocar no resultado, já na tela da linha com o quadro | **passa** (ver D-02 quanto ao rótulo do ponto) |
| 3 | Linha 604 em 07/09 mostra a primeira passagem às 16:46 | Tela da linha, dia 07/09: primeira passagem `16:46` | **passa** |
| 4 | Linha 214 em 05/09 mostra 06:02 | `dados.json` e tela: `06:02` | **passa** |
| 5 | Pin do Ponto 03 abre as 14 linhas: 7 com quadro, 7 "sem alteração" | Tela do ponto: 14 linhas; 7 com quadro (535, 540, 604, 621, 650, 652, 676), 7 marcadas "sem alteração" | **passa** |
| 6 | Linha 604 em 07/09 exibe o aviso das 18h; em 05/09 não | Aviso `604-676-domingo-18h` restrito a `["2026-09-07"]`; confirmado nas duas telas | **passa** |
| 7 | Buscar `447` abre a tela reduzida, sem nenhum horário | Tela mostra só número, ponto e a frase de orientação; zero horários no DOM | **passa** |
| 8 | Linha 305 em 05/09 lista 14 passagens, de 04:30 a 00:23 (+1) | Tela: 14 passagens, `04:30` … `00:23 (+1)` | **passa** |
| 9 | Última passagem da 227 em 05/09 aparece como 02:18 (+1), nunca 26:18 | Tela: `02:18 (+1)`; a string `26:18` não ocorre no DOM | **passa** |
| 10 | Linha 113 em 05/09 lista 32 passagens, de 05:19 a 01:52 (+1) | Tela: 32 passagens, `05:19` … `01:52 (+1)` | **passa** |
| 11 | Nenhuma viagem de continuação aparece na visão simplificada | Teste-guarda: `passagens.length == viagens com tipo != continuacao` em todos os blocos; e a amostra da §2, onde as continuações (VOLTA vazia) ficaram de fora dos dois lados | **passa** |
| 12 | A tela usa "passagem" e sinaliza que o horário é aproximado | Tela da linha: "Passagem prevista pelo ponto" + "Horário aproximado — não é uma partida garantida" | **passa** |
| 13 | Com modo avião após o primeiro acesso, o site abre e navega | Servidor **derrubado** e página recarregada: o site abriu, o mapa renderizou, a busca por `608` funcionou e a tela da linha exibiu os horários; as artes WebP vieram do cache | **passa** |
| 14 | Em 360×640 nenhuma tela rola na horizontal | As 7 telas em 360×640: `scrollWidth == clientWidth == 360` em todas. O quadro completo tem tabela de 527 px, mas contida em `.quadro__rolagem` (`overflow-x: auto`) — rola a tabela, não a página | **passa** |
| 15 | Trocar de dia na tela de uma linha mantém a mesma linha | Na 608, troca 05/09 → 07/09 → 05/09: permanece na 608, só o quadro e os avisos mudam | **passa** |

O 16º item da lista da feature ("amostra de 3 linhas × 3 dias bate 100%") está coberto na §2.

O service worker precacheia as 29 entradas do app shell — incluindo `/`, `/index.html`,
`/manifest.webmanifest` e os dois formatos de cada arte. Uma leitura feita **durante** o
`install` mostra a lista incompleta; a conferência vale depois do `activated`.

---

## 4. Divergências encontradas

### D-01 — Nomes dos dias da semana errados no seletor de dia — **CORRIGIDA**

**O que estava errado:** os três botões de dia em `index.html` traziam `sexta`, `sábado` e
`domingo` para 05/09, 06/09 e 07/09. As datas reais de 2026 são **sábado, domingo e
segunda-feira**, e é isso que os quadros operacionais das planilhas declaram
(`QUADRO OPERACIONAL, SÁBADO / DOMINGO / SEGUNDA-FEIRA`).

**Por que passou despercebido até aqui:** os rótulos estavam escritos à mão no HTML, enquanto
as telas de linha, ponto e avisos calculam o dia da semana a partir da data. O site se
contradizia na mesma janela: o botão dizia "sexta" e o cabeçalho da linha, logo abaixo,
dizia "Sábado, 05/09". Nenhum teste comparava os dois.

**Correção aplicada:** `index.html`, os três `<span class="dia-nome">`, agora `sábado`,
`domingo` e `segunda`. Verificado no navegador após a mudança; teste-guarda segue em 73/73.

**Fica como pendência de origem:** os rótulos continuam escritos à mão. Se as datas do
evento mudarem, o erro volta. O certo é derivá-los da data, como as telas já fazem, e
cobrir isso no teste-guarda.

### D-02 — O nome do ponto aparece abreviado e a cor é transmitida só por cor — **PENDENTE**

O critério 2 pede "Ponto de Ônibus 01 — Verde" visível. O que a tela mostra é **"Ponto 01"**
pintado de verde (`#3FA45B`), e a tela do ponto mostra **"Ponto 3 — Zona Leste"**. O usuário
chega ao ponto certo, então o critério de navegação está cumprido, mas:

- a palavra da cor ("Verde", "Azul", "Laranja", "Vermelho") não é escrita em lugar nenhum;
- nos resultados da busca o ponto é indicado **apenas** por um quadrado colorido sem texto
  (`<span class="resultado-busca__ponto ponto-p2">`, vazio, sem `aria-label`).

Isso é informação transmitida exclusivamente por cor — quem não distingue as cores, ou usa
leitor de tela, não recebe o dado. Vale WCAG 1.4.1.

**Sugestão:** escrever a cor junto do número ("Ponto 01 — Verde") e dar um rótulo textual ou
`aria-label` ao marcador colorido da busca. Não foi corrigido aqui porque atravessa o texto
de quatro telas, fora do escopo de uma task de validação.

### D-03 — Botões de dia sem nome acessível coerente — **PENDENTE**

Os três botões do seletor expõem à árvore de acessibilidade o texto cru `05/09 sábado`. O
grupo tem `aria-label="Dia do evento"` e o `aria-pressed` alterna corretamente, então são
operáveis por teclado e anunciados — mas a leitura sai truncada e sem o mês por extenso. Um
`aria-label="Sábado, 05 de setembro"` em cada botão resolveria.

Baixa severidade. Registrado para não ficar silenciado.

---

## 5. Observações para a operação

### O-01 — A linha 305 tem os três dias idênticos na planilha

Nas abas de origem, os blocos de 05/09, 06/09 e 07/09 da linha 305 trazem **exatamente as
mesmas 14 passagens** (04:30 … 24:23). O site reproduz fielmente o que a planilha diz, e a
conferência da §2 bate nos três dias.

Ainda assim vale confirmar com a operação se a programação da 305 é mesmo igual nos três
dias, ou se um dos blocos foi copiado sem ser ajustado na montagem da escala. **É uma
pergunta para a origem do dado, não um defeito do site.**

### O-02 — A tela do quadro completo não atualiza o título da aba

Ao abrir "Ver quadro completo", o `document.title` permanece `Linha — Passo a Paço 2026`,
enquanto as demais telas atualizam ("Mapa de pontos", "Busca de linhas", "Circulação",
"Avisos", "Linhas do ponto"). Não afeta o uso; afeta histórico e leitor de tela.

---

## 6. O que **não** foi verificado

Registrado explicitamente para não ser confundido com aprovação:

- **Modo avião real, em aparelho real.** O teste do critério 13 derrubou o servidor local, o
  que exercita o service worker de verdade, mas não cobre perda de rede móvel intermitente
  (rede presente e lenta, que é o caso pior em rua cheia) nem instalação via "Adicionar à
  tela de início" em Android/iOS.
- **Leitor de tela real** (TalkBack/VoiceOver). As verificações de acessibilidade foram
  feitas sobre a árvore de acessibilidade, não com o leitor rodando.
- **Publicação no GitHub Pages.** Tudo foi validado em `localhost` na raiz. Se o site for
  servido em subdiretório, os caminhos relativos do service worker precisam de nova
  conferência.
- **As demais 74 linhas** fora da amostra de 3. Elas são cobertas pelo cruzamento automático
  do gerador e pelo teste-guarda, não por conferência manual contra a planilha.
