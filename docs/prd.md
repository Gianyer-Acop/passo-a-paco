# PRD — Site de Apoio Operacional | Sou Manaus Passo a Paço 2026

**Status:** pronto para `/to-spec` — dados validados, 0 erros
**Data:** 01/09/2026
**Evento:** Sou Manaus Passo a Paço 2026 — 05, 06 e 07 de setembro de 2026, Largo do Paço Municipal e Porto de Manaus, Centro Histórico. Início previsto 17h.
**Base documental:** OS Urbano nº 057/2025-DVTC/VP-TRANSPORTE/IMMU e as planilhas `Grupo 1..4.xlsx`.

---

## 1. Problema

Durante os três dias do evento, a operação das linhas de ônibus no Centro é alterada: o corredor do Terminal Central próximo ao Banco do Brasil fica inoperante a partir das 19h, as linhas são redistribuídas em 4 pontos de embarque na Av. Epaminondas por zona da cidade, e várias linhas têm programação especial. Os operadores e fiscais em campo precisam responder rápido, no celular, a três perguntas:

1. Onde o passageiro pega a linha X?
2. Que horas passa a próxima?
3. O que muda hoje nessa linha?

Hoje essa informação está espalhada entre um PDF de 6 páginas e 4 planilhas com 77 abas.

## 2. Objetivo

Um site estático, informativo e interativo, consultável em segundos no celular, que responda às três perguntas acima para as linhas com programação especial nos dias 05, 06 e 07/09/2026.

### Não-objetivos

- Não é landing page, site institucional nem material de divulgação do evento.
- Não tem login, backend, banco de dados ou área administrativa.
- Não faz roteirização, rastreamento de veículo em tempo real nem cálculo de itinerário.
- Não cobre linhas fora das planilhas nesta versão (ver §4).

## 3. Público

**Primário:** operadores e fiscais da ACOP / IMMU em campo.
**Secundário:** o passageiro, que eventualmente vê a tela quando o operador vira o celular.

Consequência de design: a tela de linha precisa ser legível por leigo por padrão, com o detalhe técnico atrás de um toque.

## 4. Escopo de dados

As planilhas passaram a cobrir **77 linhas**, mas em dois estados muito diferentes — e a distinção é o ponto mais importante desta seção.

| Estado | Qtd. | O que significa | O que o site faz |
|---|---|---|---|
| **Alterada para o evento** | **34** | A linha teve a operação modificada. A aba traz 3 blocos de dia (05, 06 e 07/09/2026), tipo de dia `SÁBADO/DOMINGO/SEGUNDA (PASSO A PAÇO)` | Ponto de embarque + quadro horário do evento, por dia |
| **Sem alteração para o evento** | **43** | **A linha não sofreu alteração para atender o Passo a Paço.** A aba existe só para definir em qual dos 4 pontos ela para; o conteúdo é a escala regular vigente, com data de referência própria (de 22/01/2021 a 29/08/2026) | Ponto de embarque + "sem alteração para o evento; segue a escala regular". **Não exibe horário** — a escala regular não é o horário do evento |
| **Fora do escopo** | **6** | `209`, `502`, `610`, `616`, `690`, `442` constam na arte da pág. 5 mas não têm aba | Não aparecem |

**As 34 com programação do evento:**

| Ponto | Cor | Zonas | Linhas |
|---|---|---|---|
| Ponto de Ônibus 01 | Verde | Zonas Sul, Centro-Sul e Centro-Oeste | 214, 227, 608, 612, 713 |
| Ponto de Ônibus 02 | Azul | Zona Oeste | 011, 101, 113, 120, 121, 126, 219, 302, 305, 320, 321 |
| Ponto de Ônibus 03 | Laranja | Zona Leste | 535, 540, 604, 621, 650, 652, 676 |
| Ponto de Ônibus 04 | Vermelho | Zona Norte | 315, 340, 356, 357, 422, 440, 443, 448, 500, 560, 640 |

### Regras de precedência (decididas)

1. **A escala regular nunca é publicada como horário do evento.** As 43 abas sem programação existem para dizer *onde a linha para*, não *que horas ela passa no evento*. Exibir uma escala de domingo de 2021 como horário do dia 05/09 — um sábado — seria erro operacional grave. Elas aparecem só com o ponto de embarque.
2. **O ponto de embarque vem da arte da pág. 5 do PDF**, para todas as 83 linhas. A planilha manda no horário; a arte manda no ponto.
3. **Aba duplicada**: se a mesma linha aparecer em mais de um arquivo, vale a do grupo correspondente ao ponto de embarque, nunca a ordem de leitura. Regra criada quando a `219` ficou nos Grupos 1 e 2 com versões diferentes — a do Grupo 1 era a não corrigida. A duplicata já foi removida na origem, mas a regra fica.
4. A linha **219** embarca no **Ponto 02**, conforme a arte.
5. **Painel × quadro: não há um lado que sempre vence.** Nos casos `219` e `443` prevaleceu o painel de frequência; na `227` prevaleceu a tabela, por incompatibilidade entre uma viagem e a seguinte. A resolução é da operação, caso a caso. O parser **nunca escolhe sozinho**: publica o painel (que é o que bate com o "N VIAGENS" declarado), registra a divergência em `conflitos` e falha a validação até alguém decidir. Quem for implementar não deve inferir uma regra automática de desempate.

## 5. Arquitetura

- **Site 100% estático**: HTML + CSS + JavaScript vanilla. Sem framework, sem bundler, sem etapa de build.
- **Hospedagem: GitHub Pages.** Escolhido por ser gratuito, sem cold start e com deploy por push. (Render foi descartado: o plano free hiberna e o primeiro acesso pode levar ~50s, inaceitável em campo.)
- **Fonte de dados única:** um arquivo `dados.json` versionado no repositório, gerado offline a partir dos `.xlsx` (ver §9). O site **não** lê Excel em runtime.
- **Sem chaves de API, sem dependências externas em CDN.** Tudo servido do próprio domínio, requisito do modo offline.

Estrutura sugerida:

```
/index.html
/assets/css/estilo.css
/assets/js/app.js
/assets/img/mapa-pontos.png        (pág. 5 do PDF, 1517×1190)
/assets/img/mapa-circulacao.png    (pág. 4 do PDF, 1517×1237)
/dados/dados.json
/sw.js
/manifest.webmanifest
```

## 6. Modelo de dados (`dados.json`)

```jsonc
{
  "versaoDados": "2026-09-01T18:30:00-04:00",
  "evento": { "nome": "Sou Manaus Passo a Paço 2026", "dias": ["2026-09-05", "2026-09-06", "2026-09-07"] },

  "pontos": [
    {
      "id": "P1",
      "numero": 1,
      "nome": "Ponto de Ônibus 01",
      "cor": "verde",
      "corHex": "#3FA45B",
      "zonas": "Zonas Sul, Centro-Sul e Centro-Oeste",
      "hotspot": { "x": 25.0, "y": 28.4 },   // % relativo à imagem do mapa
      "linhas": ["214", "227", "608", "612", "713", "..."],       // todas as do ponto
      "linhasComProgramacao": ["214", "227", "608", "612", "713"],
      "linhasSemProgramacao": ["004", "203", "..."],              // só escala regular
      "linhasSemPlanilha": ["209", "502", "610"]                  // na arte, sem aba
    }
    // P2, P3, P4...
  ],

  "linhas": {
    "214": {
      "numero": "214",
      "nome": "CONJ. HILÉIA / CENTRO",
      "empresa": "VIA VERDE",
      "pontoId": "P1",
      "temProgramacaoEvento": true,             // false => sem quadro, só o ponto
      "escalaBase": null,                       // quando false: {dataReferencia, tipoDia}
      "avisos": ["viagem-extra-00h"],           // ids de §8
      "dias": {
        "2026-09-05": {
          "tipoDia": "SÁBADO (PASSO A PAÇO)",
          "totalViagens": 20,
          "passagens": ["06:02", "06:52", "07:35", "…"],   // VOLTA — o que o site mostra
          "saidasOrigem": ["05:20", "06:05", "06:50", "…"], // IDA — referência, não exibir
          "frequencia": [ { "hora": "06:05", "intervalo": "00:45" } ],  // painel = origem
          "turnos": [
            {
              "nome": "1º TURNO",
              "tabelas": [
                {
                  "tab": "TAB - 0101",
                  "veiculo": "1",
                  "jornada": "07:15",
                  "viagens": [
                    { "ida": "05:20", "volta": "06:02", "termino": "06:45", "tempoViagem": "01:25" }
                  ]
                }
              ]
            }
          ]
        }
        // "2026-09-06", "2026-09-07"
      }
    }
  },

  "avisos": [ /* ver §8 */ ]
}
```

Notas de formato:

- Horários como string `"HH:MM"` em 24h. Horários **após a meia-noite** são representados como `"24:15"`, `"25:30"` etc., para manter a ordenação cronológica correta dentro da operação de um mesmo dia. Na exibição, renderizar como `00:15 (+1)`. O arquivo gerado tem **264 passagens** nessa faixa.
- **`passagens` é o campo que o site exibe. Vem da coluna `VOLTA`.** Regra mais importante do modelo: `IDA` é a saída do terminal de origem, no bairro; `VOLTA` é o momento em que o veículo está no Centro — que é onde ficam os 4 pontos da Av. Epaminondas. **O operador no ponto precisa da `VOLTA`.** Publicar `IDA` erraria por 42 min na linha 214 e por 1 hora na 604. O horário é **aproximado** e a UI precisa dizer isso.
- **`saidasOrigem` e `frequencia` são referência interna, nunca a lista principal.** Trazem as partidas do terminal de origem, que é o que o painel de frequência da planilha lista. Servem para validar a integridade do dado.
- Invariantes verdadeiras nos 102 blocos: `len(passagens)` == nº de viagens de receita (normal + baixada), e toda viagem de receita tem `VOLTA` preenchida.
- **`temProgramacaoEvento: false`** significa que a aba é escala regular antiga: `dias` vem `{}` e `escalaBase` traz `{dataReferencia, tipoDia}` para rastreio. A UI mostra o ponto de embarque e o aviso de que não há programação especial — **nunca um horário**.
- Cada viagem tem `tipo`: `"normal"`, `"continuacao"` ou `"baixada"`.
  - **`continuacao`** — VOLTA em branco e IDA igual ao TÉRMINO da anterior. É perna de retorno, **não é saída**; aparece só no quadro completo (RF-17). O campo booleano `continuacao` é mantido como atalho.
  - **`baixada`** — IDA em branco e VOLTA preenchida: a viagem começa no retorno, depois do intervalo no outro terminal. **É saída**, e a partida é o `volta`. Ocorre só na linha 305.
- `frequencia[i]` alinha-se por índice com `saidasOrigem[i]` e traz `{hora, intervalo, origem}`. `origem` só existe na 305, onde a planilha usa a coluna FREQ. para marcar o terminal de partida (`KM 41` / `CENTRO`) em vez do intervalo.
- `origemMista: true` afeta apenas `saidasOrigem`/`frequencia`. Como o site publica `passagens`, o problema do KM 41 não chega à tela.
- `observacoes` (por linha) traz o texto livre da planilha, ex.: *"A LINHA SAIRÁ DA PRAÇA DA SAUDADE E ATENDERÁ O CENTRO"* (302 e 305) e *"INTERVALO NO KM 41"* (305). Exibir junto dos avisos na tela da linha.
- `legendaViagens` (por linha) decodifica os sufixos do campo `linha` das viagens. Na 305: `305` = viagens completas, `305.1` = inicia no posto de gasolina ao lado do Veicular Transportes, `305.2` = finaliza na Dafra.
- `conflitos` (array) registra divergência de origem entre painel e quadro. **Vazio na versão atual.**
- `empresa` é `null` em 15 das 34 linhas alteradas: a planilha simplesmente não informa. Exibir só quando presente.
- Campos ausentes na planilha viram `null`, nunca string vazia.

## 7. Requisitos funcionais

### Seleção de dia

- **RF-01** — Ao abrir, o site detecta a data/hora atual no fuso `America/Manaus` e seleciona automaticamente o dia do evento correspondente.
- **RF-02** — **Virada às 03h**: entre 00:00 e 02:59, o site considera ainda o dia anterior. Ex.: 01:20 do dia 06/09 → seleciona **05/09**. Motivo: a operação do dia 05 se estende madrugada adentro.
- **RF-03** — Fora do período 05–07/09/2026, o site abre em **05/09** e exibe um aviso discreto de que a data atual está fora do evento.
- **RF-04** — Os três dias ficam sempre visíveis como botões no topo; trocar de dia recarrega o conteúdo sem recarregar a página e sem perder o contexto (se o usuário estiver vendo a linha 214, ao trocar o dia continua na 214, no novo dia).

### Busca

- **RF-05** — Campo de busca fixo e sempre acessível no topo. Digitar o número da linha (ex.: `608`) filtra em tempo real; a busca também aceita parte do nome (`petropolis`).
- **RF-06** — Selecionar um resultado leva direto à tela da linha, já com o ponto de embarque e a cor em destaque no topo.
- **RF-07** — Busca sem resultado exibe: "Linha X não está na programação especial do evento. Consulte a escala regular." (mensagem exata a validar com a operação).

### Mapa

- **RF-08** — Tela de mapa usa a **imagem oficial da pág. 5 do PDF** (`assets/img/mapa-pontos.png`, 1517×1190) como fundo, com 4 áreas clicáveis posicionadas em coordenadas percentuais sobre os pins. Não usar Leaflet, Google Maps nem qualquer API de mapas. Coordenadas medidas na imagem e já gravadas em `dados.json`: P1 `25.0 / 28.4`, P2 `25.0 / 43.3`, P3 `30.3 / 63.2`, P4 `36.7 / 72.5` (% da largura / altura, centro do pin).
- **RF-09** — A imagem é responsiva (`max-width: 100%`); os hotspots acompanham por serem posicionados em `%`. Alvos de toque de no mínimo 44×44 px.
- **RF-10** — Abaixo do mapa, os 4 pontos também aparecem como lista de cartões (cor, número, zonas, quantidade de linhas) — garante uso em tela pequena e acessibilidade por teclado/leitor de tela.
- **RF-11** — Clicar num ponto (no mapa ou na lista) abre a lista de linhas daquele ponto.
- **RF-12** — Segunda aba **"Circulação"** com a imagem da pág. 4 do PDF (Av. Epaminondas, Terminal da Matriz, Praça da Saudade, plataforma interditada) e, em texto legível abaixo, os 8 itens de circulação daquela arte. A imagem deve permitir zoom (toque para ampliar em tela cheia).

### Lista de linhas do ponto

- **RF-13** — Lista com número em destaque + nome da linha, ordenada por número.
- **RF-14** — Cabeçalho da lista mostra o ponto (número, cor, zonas atendidas) e o dia selecionado.

### Quadro horário da linha

- **RF-15** — **Visão simplificada (padrão)**: lista/grade de `passagens[]` do dia selecionado, em blocos por hora, legível a distância, sem jargão de escala. São os horários em que o veículo **passa pelo ponto de embarque** (coluna `VOLTA`). O rótulo da tela deve dizer "passagem prevista pelo ponto" e sinalizar que é **aproximado** — nunca "saída" nem horário exato. **Não usar `saidasOrigem`**: é a partida do bairro e erraria por até 1 hora.
- **RF-14a** — Linha com `temProgramacaoEvento: false` abre uma tela reduzida: número, nome, ponto de embarque com a cor, e a mensagem "Esta linha **não teve alteração** para o Passo a Paço. Embarque no Ponto X e siga a escala regular da linha." **Nunca exibir horário para essas linhas**, nem a data de referência de `escalaBase` (campo interno, de rastreio).
- **RF-14b** — Na lista do ponto e na busca, essas linhas aparecem com marcador discreto ("sem alteração") que as distingue das que têm quadro do evento. O marcador informa, não penaliza: para o operador, "essa linha não mudou" é resposta boa.
- **RF-15a** — *(Absorvido pelo RF-15.)* Com `passagens` vindo da `VOLTA`, partidas do KM 41 não chegam à tela. `origemMista` fica só como metadado do painel de referência.
- **RF-15b** — Exibir `observacoes` e `legendaViagens` da linha na tela dela, junto dos avisos.
- **RF-16** — **Próxima passagem**: quando o dia selecionado é o dia corrente em `America/Manaus`, destacar a próxima entrada de `passagens[]` — "próxima passagem por aqui, prevista para HH:MM (em N min)". Fora do dia corrente, não exibir o destaque.
- **RF-17** — Botão **"Ver quadro completo"** expande a visão operacional: turnos, TAB, veículo, IDA / VOLTA / TÉRMINO / TEMPO DE VIAGEM, jornada. Tabela com rolagem horizontal própria (`overflow-x: auto`) — a página nunca rola na horizontal.
- **RF-18** — Exibir a tabela de frequência (hora / intervalo) quando existir na planilha.
- **RF-19** — Horários após a meia-noite exibidos como `00:15 (+1)`, com legenda "(+1) = madrugada do dia seguinte".
- **RF-20** — Cabeçalho fixo da tela de linha: número, nome, empresa, ponto de embarque com a cor, e dia.

### Avisos operacionais

- **RF-21** — Aba **"Avisos"** listando as regras operacionais do dia selecionado (conteúdo em §8), filtradas pelo dia.
- **RF-22** — Na tela de uma linha, exibir os avisos que se aplicam **àquela linha naquele dia**, acima do quadro horário. Ex.: ao abrir a 604 no dia 07/09, mostrar "Opera a partir das 18h neste dia".

### Offline

- **RF-23** — Service worker com cache de todos os assets e do `dados.json`, estratégia *cache-first* para assets e *stale-while-revalidate* para `dados.json`. Após o primeiro acesso, o site abre sem rede.
- **RF-24** — Rodapé exibe "Dados de `<versaoDados>`". Se houver versão mais nova disponível, mostrar um botão "Atualizar". *(Incluído para mitigar o risco de operador ficar com cache antigo; custo baixo.)*
- **RF-25** — `manifest.webmanifest` para permitir "adicionar à tela de início".

## 8. Conteúdo dos avisos (extraído da OS 057)

Cada aviso tem `id`, `texto`, `dias` aplicáveis e `linhas` afetadas (`"todas"` ou array).

| id | Texto | Dias | Linhas |
|---|---|---|---|
| `corredor-bb-19h` | A partir das 19h, o corredor de ônibus à direita do Terminal Central, próximo ao Banco do Brasil, fica inoperante. Usar apenas o corredor próximo à Igreja e Praça da Matriz. | 05, 06, 07 | todas |
| `desvio-itamaraca` | Linhas que trafegam na Rua Itamaracá desviam pela Rua da Instalação para acessar o Terminal Central. | 05, 06, 07 | todas |
| `paradas-inoperantes-00h` | Após as 00h, as paradas Dom Bosco e Colégio Militar ficam inoperantes; permanece ativo apenas o Terminal da Matriz. | 05, 06, 07 | todas |
| `onibus-extras-00h` | 25 ônibus extras disponibilizados a partir das 00h para apoio à operação das linhas. | 05, 06, 07 | todas |
| `frota-apoio-t1` | Frota de apoio estacionada nas proximidades do T1: 15 articulados, 3 trucados e 7 convencionais, reduzida gradativamente conforme demanda. | 05, 06, 07 | todas |
| `viagem-extra-00h` | Realiza mais uma viagem a partir das 00h. | 05, 06, 07 | 101, 113, 120, 121, 126, 214, 216, 219, 227, 315, 321, 356, 422, 440, 443, 448, 500, 535, 540, 560, 604, 608, 612, 621, 640, 650, 652, 676, 705, 713 |
| `opera-ate-centro` | Opera até a área central da cidade durante os dias do evento. | 05, 06, 07 | 011, 216, 302, 305, 320, 321, 357, 444, 560, 621 |
| `604-676-domingo-18h` | Programação especial no dia 07/09 a partir das 18h, para apoio ao evento. | 07 | 604, 676 |
| `121-substitui-019` | No dia 07/09 substitui a operação da linha 019, com frota de 2 veículos. | 07 | 121 |
| `terminal-302-305` | De 01/09 a 09/09, o terminal das linhas 302 e 305 fica transferido para a Praça da Saudade. | 05, 06, 07 | 302, 305 |
| `orientacao-fiscais` | Seguir as orientações dos Fiscais de Transportes e Fiscais da ACOP presentes no local. | 05, 06, 07 | todas |

> Observação: `viagem-extra-00h` acima é a lista da arte da pág. 4. A pág. 3 traz duas listas ("mais uma viagem" com 14 linhas e "mais duas viagens" com 17 linhas) cujos itens conflitam parcialmente. **Pendência P-02 (§11).**

## 9. Pipeline de dados (xlsx → JSON)

Etapa executada **uma vez, fora do site**, por um script Python (`ferramentas/gerar_dados.py`, `openpyxl`). O resultado, `dados/dados.json`, é commitado.

Estrutura real das planilhas, para o script:

- Cada arquivo `Grupo N.xlsx` tem **uma aba por linha**, nomeada com o número da linha (`"214"`, `"011"`…).
- Dentro de cada aba, os **três dias estão empilhados verticalmente**. Cada bloco começa numa linha cuja coluna B contém a data (`05/09/2026 - SÁBADO`) e a coluna C contém `QUADRO OPERACIONAL`.
- Cada bloco de dia contém `1º TURNO` e `2º TURNO`. Dentro de cada turno, blocos de tabela horizontais rotulados `TAB - 0101`, `TAB - 0102`, `TAB - 0201`… cada um com as colunas `DESLOCAMENTO, IDA, VOLTA, TÉRM., T. VIAG., LINHA, VEIC.`.
- Ao fim de cada turno há uma linha com o nome da empresa (`VIA VERDE - CO…`) e uma linha `JORN.` com a jornada.
- Uma faixa lateral à direita (colunas ~U-Y) traz `FREQUÊNCIA DA LINHA`, o tipo de dia (`SÁBADO (PASSO A PAÇO)`), o total de viagens (`20 VIAGENS`) e pares `HORA / FREQ.`.

**Status: implementado e validado.** O script é `ferramentas/gerar_dados.py`; o relatório sai em `ferramentas/relatorio_conversao.txt`.

Armadilhas — todas encontradas na prática, todas tratadas:

1. **Horários pós-meia-noite** vêm como `datetime(1900,1,1,HH,MM)`. Converter para `"24:MM"`, `"25:MM"`. Durações (`T. VIAG.`, `JORN.`) usam conversão separada e **nunca** somam 24h.
2. **Larguras variáveis**: o nº de colunas vai de 20 (Grupo 3) a 69 (aba 640) porque o nº de tabelas por turno varia. Localizar tudo por rótulo (`TAB`, `IDA`, `JORN.`, `HORA`), nunca por posição fixa.
3. **Linhas de continuação**: onde `VOLTA` está vazia, os valores escorregam uma coluna — `T. VIAG.` cai na coluna de `LINHA`. Detectar por tipo e marcar `continuacao: true`.
4. **O painel de frequência lista partidas do terminal de origem (IDA), não passagens pelo ponto.** Serve para conferir a integridade da planilha — na 113/05-09 o quadro tem 36 IDAs mas o painel declara 32, e as 4 excedentes são justamente as linhas de continuação. **Mas não é o que o site publica:** a lista exibida vem da coluna `VOLTA`.
5. **O painel pode ser mais alto que o bloco do dia.** Na aba 640 ele invade 2 linhas do bloco seguinte. Ler o painel até a primeira célula vazia da coluna, e não até o fim do bloco.
6. **A data do bloco pode vir como `datetime` com hora zerada** (abas 604 e 676, 3º bloco) — aparece como `00:00`. Aceitar `datetime`, não só string.
7. **A aba 448 rotula o 3º bloco como `05/09/2026`** — erro de digitação da origem. A **posição** do bloco vence o rótulo; o script emite aviso quando os dois discordam.
8. **`JORN.` ≠ `DESLOCAMENTO`.** A jornada fica na linha rotulada `JORN.`, na coluna da TAB (ex.: `07:55`). A coluna C do início do turno é o deslocamento (`00:15`) e não é jornada.
9. **A célula de empresa/veículo mistura formatos**: `"VIA VERDE - CONVENCIONAL AR P.E"` e `"CONVENCIONAL AR"`. Atribuir empresa só por lista branca das concessionárias da OS; caso contrário `null`.
10. **Nomes de aba com zero à esquerda** (`"011"`) — string sempre, nunca int.
11. **Nome e empresa são por linha, não globais.** Não propagar o valor da primeira aba lida para as demais.
12. **A madrugada nem sempre chega como serial >24h.** Correções digitadas à mão entram como hora simples (`01:20` em vez de `25:20`). Dentro de uma tabela os horários de um veículo só avançam, então todo horário que "anda para trás" na sequência recebe +24h. Vale para o quadro e para o painel.
13. **Baixada**: IDA em branco com VOLTA preenchida é viagem que começa no retorno — é saída legítima e o painel a conta. Sem isso, a 305 acusa falso conflito.
14. **A coluna FREQ. nem sempre é um intervalo.** Na 305 ela traz o terminal de origem. Guardar em `origem` e nunca tentar converter para duração.

Validações do script (falha alto, nunca silenciosamente):

- Toda aba com 3 blocos de dia do evento é lida por completo; abas de escala regular são separadas e não entram na validação de horário.
- `len(saidas) == totalViagens` (o "N VIAGENS" declarado no painel) em todos os 102 blocos.
- `saidas` em ordem cronológica; todo horário casa `^\d{2}:\d{2}$` entre `00:00` e `29:59`.
- `len(passagens)` == nº de viagens de receita do bloco, e toda viagem de receita tem `VOLTA`.
- `passagens` em ordem cronológica.
- Toda entrada do painel corresponde ao IDA ou ao VOLTA de uma viagem não-continuação, e todo IDA de viagem normal aparece no painel. O que sobrar vai para `conflitos` + relatório.
- Jornada < 02:00 acusa leitura da coluna errada.

15. **Recuo de horário nem sempre é virada de meia-noite.** A normalização só soma 24h quando o recuo passa de 12h. Recuos curtos são sobreposições reais da planilha — na 227 uma viagem parte às `00:00` enquanto a anterior termina `00:14` — e empurrá-las geraria `48:00`.

**Resultado da última execução:** 77 linhas na base, das quais **34 alteradas para o evento** (102 blocos linha-dia) e 43 sem alteração. **2.963 saídas publicadas — idêntico à soma dos "N VIAGENS" das planilhas** —, 3.695 viagens no quadro completo (2.954 normais, 735 de continuação, 6 baixadas), 202 saídas pós-meia-noite, 0 dias ausentes, **0 conflitos e 0 erros de validação**. Resta 1 aviso informativo: o rótulo trocado do 3º bloco da aba 448.

Nomes de linha conhecidos (pág. 3 do PDF), a preencher no JSON:

`101` SÃO RAIMUNDO/ GLÓRIA/ T1/ CENTRO · `113` AV BRASIL/ T1/ CENTRO · `120` PONTA NEGRA/ T1/ CENTRO · `121` VILA MARINHO/ T1/ CENTRO · `126` SIPAM/ AV. BRASIL/ T1/ CENTRO · `214` CONJ. HILÉIA/ CENTRO · `219` A. MONTENEGRO/ T1/ CENTRO · `315` STA. ETELVINA/ E4/ DJ. BATISTA/ T1/ CENTRO · `321` COM. SÃO JOÃO/ E3-E2-E1/ T1/ CENTRO · `340` T7/ E3-E2-E1/ T1/ CENTRO · `356` RESID. VIVER MELHOR/ T1/ CENTRO · `422` OSWALDO AMÉRICO/ CENTRO · `440` AMAZ. MENDES II/ T1/ CENTRO · `443` N. CIDADE/ EST. 4-3/ DJ. BATISTA/ T1/ CENTRO · `448` CIDADE DE DEUS/ T1/ CENTRO · `500` NOVO ISRAEL/ T1/ CENTRO · `535` ARMANDO MENDES/ CENTRO · `540` OURO VERDE/ T1/ CENTRO · `560` T4/ C. DEUS/ NOVA CIDADE/ T1/ CENTRO · `604` ANT. ALEIXO/ T2/ CENTRO · `608` PETROPOLIS/ T1/ CENTRO · `612` JAPIIM/ T2/ CENTRO · `640` T4-3/ C. NOVA/ E4-E3-E2-E1/ T1/ CENTRO · `650` T4/ T5/ TEFÉ/ T2/ CENTRO · `652` T4-T5/ E. SALES/ E1/ T1/ CENTRO · `676` VALPARAÍSO/ ALEIXO/ DJALMA/ CENTRO · `713` JARDIM MAUÁ/ CEASA/ T2/ CENTRO

Faltam os nomes de **011, 302, 305, 320, 357** — pendência P-01 (§11).

## 10. Design e não-funcionais

- **Mobile-first.** Testar em 360×640. Desktop apenas como ampliação do layout de coluna única.
- **Identidade do evento sem exagero**: usar a paleta da arte oficial — laranja `#F5821F`, azul-violeta `#312783`, branco. As cores dos 4 pontos (verde/azul/laranja/vermelho) são funcionais e não devem ser alteradas por estética. Logo do evento apenas no cabeçalho, discreto; créditos IMMU / Prefeitura de Manaus no rodapé.
- **Alto contraste e tipografia grande**: uso noturno, ao ar livre, com pressa. Corpo mínimo 16px; números de linha em destaque (≥ 24px).
- **Alvos de toque ≥ 44×44 px.**
- **Acessibilidade**: navegável por teclado, `alt` descritivo nas imagens de mapa, contraste WCAG AA. Nunca usar cor como único indicador — sempre acompanhar do número e do nome da zona.
- **Desempenho**: carregamento útil em < 2s em 3G. Otimizar as duas imagens de mapa (WebP com fallback PNG, alvo < 400 KB cada).
- **Sem tracking, sem cookies, sem coleta de dados.**
- **Idioma**: português do Brasil apenas.

## 11. Pendências e riscos

| id | Item | Impacto | Encaminhamento |
|---|---|---|---|
| P-01 | Nomes das linhas 011, 302, 305, 320, 357 não constam no PDF | Cosmético — `nome: null`, UI exibe só o número | Pedir à operação |
| P-02 | Listas de "mais uma viagem" (pág. 3) vs. lista da arte (pág. 4) divergem | Aviso pode ficar errado em algumas linhas | Confirmar com a operação qual lista vale antes do deploy |
| P-03 | ~~Divergência do ponto da linha 219~~ | — | **Resolvido em 01/09/2026:** 219 embarca no Ponto 02; escala vem do `Grupo 1.xlsx` |
| P-04 | ~~6 linhas da arte sem aba~~ | — | **Decidido em 01/09/2026:** `209`, `502`, `610`, `616`, `690` e `442` ficam **fora deste escopo**. Se a participação for confirmada, a equipe regenera o `dados.json` |
| P-05 | Mudança de programação em cima da hora | Operador com cache antigo | Mitigado por RF-24; alteração exige novo `dados.json` + push |
| P-06 | Conversão do Excel com estrutura irregular | Horário errado em campo é o pior defeito possível | **Resolvido em 01/09/2026:** parser fecha 2.963/2.963 saídas. Falta a conferência manual de amostra (critério de aceite 5) |
| P-07 | ~~Linha 227: painel × quadro~~ | — | **Resolvido em 01/09/2026** nos três dias, valendo `24:28` / `25:45`. Aqui prevaleceu a **tabela** sobre o painel, por incompatibilidade entre uma viagem e a seguinte — ao contrário de 219/443, onde prevaleceu o painel. Ver regra 5 do §4 |
| ~~P-07a~~ | ~~Painel e quadro discordam em 219, 443 e 305~~ | — | **Resolvido em 01/09/2026.** `219` e `443` corrigidos na planilha nos três dias, valendo o horário do painel. `305` não era erro: são baixadas, agora modeladas como `tipo: "baixada"` |
| P-08 | ~~A 305 mistura partidas do `KM 41` e do `CENTRO`~~ | — | **Resolvido em 01/09/2026 pela mudança para `VOLTA`.** O site não publica mais partidas de origem, então partidas do KM 41 não chegam à tela. A 305 exibe 14 passagens pelo ponto, não as 15 do painel |
| P-10 | O horário de passagem é **aproximado** | Operador pode tratar como exato e ser cobrado por atraso de poucos minutos | A UI precisa deixar explícito ("passagem prevista", "aprox."). Requisito RF-15 |
| P-09 | ~~43 abas com escala antiga~~ | — | **Esclarecido pela operação em 01/09/2026: não é lacuna de dado.** Essas linhas não sofreram alteração para o evento; a aba serve só para definir o ponto de parada. Comportamento atual (ponto sim, horário não) é o correto |

## 12. Critérios de aceite

1. Abrindo o site às 01h do dia 06/09 no fuso de Manaus, o dia selecionado é **05/09**.
2. Digitando `608` na busca, chega-se ao quadro horário da linha em no máximo 2 toques, com "Ponto de Ônibus 01 — Verde" visível.
2a. A linha 604 em 07/09 mostra a primeira passagem às **16:46**, não às 15:46 (que é a partida do bairro).
3. Clicando no pin do Ponto 03 no mapa, aparecem as 14 linhas do ponto — 7 com quadro do evento e 7 marcadas como "sem alteração".
4. A tela da linha 604 no dia 07/09 exibe o aviso "Programação especial a partir das 18h"; no dia 05/09, não exibe.
5. Todos os horários exibidos batem com a **coluna VOLTA** da planilha de origem, para uma amostra de 3 linhas × 3 dias conferida manualmente.
6. Com o modo avião ligado após o primeiro acesso, o site abre e navega normalmente.
7. Em 360×640 nenhuma tela rola horizontalmente; a tabela do quadro completo rola dentro do próprio contêiner.
8. Trocar de dia estando na tela de uma linha mantém a mesma linha.
9. Buscar `447` (linha sem alteração) leva à tela reduzida com o Ponto 04 em destaque e **nenhum horário na tela**.
10. A tela da linha 305 exibe o terminal de origem (`KM 41` / `CENTRO`) ao lado de cada horário.
11. Um horário pós-meia-noite (ex.: `25:45` da linha 227) é exibido como `01:45 (+1)`, e não como `25:45`.

## 13. Fora de escopo

Escalas em PDF por linha; mapa interativo com geolocalização; tempo real; multi-idioma; painel administrativo; analytics. As 6 linhas sem aba (`209`, `502`, `610`, `616`, `690`, `442`) ficam fora até a operação confirmar a participação.
