# Spec: Site de Apoio Operacional — Sou Manaus Passo a Paço 2026

> **Status:** Rascunho
> **Criado em:** 01/09/2026
> **PRD de origem:** `docs/prd.md`
> **Arquivo de tarefas:** docs/tasks/apoio-operacional-passo-a-paco.md *(gerado com /to-ticket)*

---

## 1. Contexto

Nos dias 05, 06 e 07 de setembro de 2026 o evento Sou Manaus Passo a Paço ocupa o Centro Histórico de Manaus. A OS Urbano nº 057/2025-IMMU altera a operação do transporte coletivo: o corredor do Terminal Central próximo ao Banco do Brasil fica inoperante a partir das 19h, as linhas são redistribuídas em 4 pontos de embarque na Av. Epaminondas segmentados por zona da cidade, e 34 linhas ganham programação especial.

Operadores e fiscais da ACOP/IMMU precisam responder, no celular e em segundos, a três perguntas: onde o passageiro pega a linha X, que horas passa a próxima, e o que muda hoje nessa linha. Hoje a informação está espalhada entre um PDF de 6 páginas e 4 planilhas Excel com 77 abas de estrutura irregular.

Os dados já foram extraídos e validados: `Passo a paço/dados/dados.json` (1,6 MB) é gerado por `ferramentas/gerar_dados.py`, com 0 erros de validação. **Esta spec cobre apenas a construção do site sobre esse JSON pronto.**

**A regra mais importante desta spec:** o horário que o site exibe é o campo **`passagens[]`**, que vem da coluna `VOLTA` da planilha — o momento em que o veículo passa pelo ponto de embarque no Centro, e é **aproximado**. O campo `saidasOrigem[]` é a partida do terminal no bairro e **não pode ser exibido**: usá-lo erraria por 42 minutos na linha 214 e por 1 hora na 604.

## 2. Objetivo

Construir um site estático em HTML/CSS/JS puro, hospedado no GitHub Pages, que permita a operadores em campo localizar qualquer uma das 77 linhas do evento, ver seu ponto de embarque e — para as 34 com programação especial — consultar o quadro horário do dia selecionado.

## 3. Escopo

### Incluído nesta spec

- Página única (sem framework) com navegação por estado interno, sem recarga.
- Seleção de dia (05, 06, 07/09/2026) com detecção automática pelo fuso `America/Manaus` e virada às 03h.
- Mapa de pontos: imagem oficial da pág. 5 do PDF com 4 hotspots clicáveis posicionados em porcentagem.
- Aba "Circulação": imagem da pág. 4 do PDF com zoom, mais os 8 itens de circulação em texto.
- Busca por número ou nome da linha, cobrindo as 77 linhas.
- Lista de linhas por ponto.
- Tela de linha em dois níveis: visão simplificada (passagens pelo ponto) e quadro completo (turnos, TAB, veículo, ida/volta/término/tempo de viagem, jornada).
- Destaque da próxima passagem quando o dia selecionado for o dia corrente.
- Avisos operacionais filtrados por dia e por linha.
- Funcionamento offline via service worker, com carimbo de versão dos dados.
- Consumo do `dados.json` existente, sem alterá-lo.

### Fora do escopo (não nesta iteração)

- **Alterar o parser ou o `dados.json`.** A geração de dados está pronta e validada; mexer nela é fora desta spec.
- **Publicar horário para as 43 linhas sem alteração.** Suas abas contêm escala regular com data de referência de até 2021; exibi-las como horário do evento seria erro operacional grave.
- **As 6 linhas sem aba** (`209`, `502`, `610`, `616`, `690`, `442`): ficam de fora até a operação confirmar participação.
- Escalas em PDF por linha, mapa com geolocalização, tempo real, multi-idioma, painel administrativo, analytics, backend, login.

## 4. Requisitos Funcionais

| ID    | Requisito | Prioridade |
|-------|-----------|------------|
| RF-01 | Detectar a data atual em `America/Manaus` e pré-selecionar o dia do evento correspondente | Alta |
| RF-02 | Virada às 03h: entre 00:00 e 02:59 considerar ainda o dia anterior (01:20 de 06/09 → seleciona 05/09) | Alta |
| RF-03 | Fora do período 05–07/09/2026, abrir em 05/09 com aviso discreto de data fora do evento | Média |
| RF-04 | Três dias sempre visíveis como botões no topo; trocar de dia não recarrega a página e preserva a linha em tela | Alta |
| RF-05 | Busca fixa no topo, filtrando em tempo real por número (`608`) ou parte do nome (`petropolis`), sobre as 77 linhas | Alta |
| RF-06 | Selecionar resultado abre a tela da linha com ponto de embarque e cor em destaque | Alta |
| RF-07 | Busca sem resultado exibe mensagem orientando consultar a escala regular | Média |
| RF-08 | Mapa usa `assets/img/mapa-pontos.png` (1517×1190) como fundo, com 4 hotspots em coordenadas percentuais lidas de `pontos[].hotspot`. Proibido Leaflet, Google Maps ou qualquer API de mapa | Alta |
| RF-09 | Imagem responsiva (`max-width:100%`), hotspots acompanham por serem posicionados em `%`, alvos ≥ 44×44 px | Alta |
| RF-10 | Abaixo do mapa, os 4 pontos também como lista de cartões (cor, número, zonas, contagem de linhas), navegável por teclado | Alta |
| RF-11 | Clicar num ponto (mapa ou cartão) abre a lista de linhas daquele ponto | Alta |
| RF-12 | Aba "Circulação" com `assets/img/mapa-circulacao.png`, ampliável em tela cheia, e os 8 itens de circulação em texto legível abaixo | Média |
| RF-13 | Lista do ponto com número em destaque + nome, ordenada numericamente | Alta |
| RF-14 | Cabeçalho da lista mostra ponto (número, cor, zonas) e dia selecionado | Média |
| RF-14a | Linha com `temProgramacaoEvento: false` abre tela reduzida: número, nome, ponto com cor, e "Esta linha não teve alteração para o Passo a Paço. Embarque no Ponto X e siga a escala regular." **Nunca exibir horário nem a data de `escalaBase`** | Alta |
| RF-14b | Na lista e na busca, essas linhas recebem marcador discreto ("sem alteração"), que informa sem penalizar | Média |
| RF-15 | Visão simplificada (padrão): grade de `passagens[]` legível a distância, agrupada por hora, sem jargão de escala. Rotular como **"passagem prevista pelo ponto"** e sinalizar que é aproximado — nunca "saída", nunca horário exato. **Proibido exibir `saidasOrigem[]`** | Alta |
| RF-15a | *(Absorvido pelo RF-15.)* Com `passagens` vindo da `VOLTA`, partidas do KM 41 não chegam à tela; `origemMista` é só metadado do painel de referência | — |
| RF-15b | Exibir `observacoes` e `legendaViagens` da linha junto dos avisos | Média |
| RF-16 | Quando o dia selecionado é o dia corrente em Manaus, destacar a próxima entrada de `passagens[]`: "próxima passagem por aqui, prevista para HH:MM (em N min)". Fora do dia corrente, não exibir | Alta |
| RF-17 | Botão "Ver quadro completo" expande turnos, TAB, veículo, IDA/VOLTA/TÉRMINO/T.VIAGEM, jornada. Rotular as colunas para o operador: IDA = saída do bairro, VOLTA = passagem pelo ponto. Tabela com `overflow-x:auto` própria | Alta |
| RF-18 | Exibir a tabela de frequência (hora / intervalo) quando existir | Média |
| RF-19 | Horários ≥ 24:00 exibidos como `01:45 (+1)`, com legenda "(+1) = madrugada do dia seguinte" | Alta |
| RF-20 | Cabeçalho fixo da tela de linha: número, nome, empresa (quando houver), ponto com cor, e dia | Média |
| RF-21 | Aba "Avisos" listando as regras operacionais do dia selecionado | Alta |
| RF-22 | Na tela da linha, exibir os avisos aplicáveis àquela linha naquele dia, acima do quadro (ex.: 604 em 07/09 mostra "opera a partir das 18h") | Alta |
| RF-23 | Service worker: *cache-first* para assets, *stale-while-revalidate* para `dados.json`. Após o primeiro acesso o site abre sem rede | Alta |
| RF-24 | Rodapé exibe "Dados de `<versaoDados>`" e um botão "Atualizar" quando houver versão nova | Alta |
| RF-25 | `manifest.webmanifest` permitindo "adicionar à tela de início" | Baixa |

## 5. Requisitos Não-Funcionais

| ID | Requisito | Métrica |
|----|-----------|---------|
| RNF-01 | Carregamento | Conteúdo útil em < 2s em 3G; imagens de mapa em WebP com fallback PNG, < 400 KB cada |
| RNF-02 | Sem dependências externas | Zero requisições a CDN, API ou fonte remota — requisito do modo offline |
| RNF-03 | Mobile-first | Layout de coluna única validado em 360×640; nenhuma tela rola horizontalmente |
| RNF-04 | Alvos de toque | ≥ 44×44 px em todo elemento interativo |
| RNF-05 | Legibilidade | Corpo ≥ 16px; número da linha ≥ 24px. Uso noturno, ao ar livre, com pressa |
| RNF-06 | Acessibilidade | Navegável por teclado; `alt` descritivo nos mapas; contraste WCAG AA; cor **nunca** como único indicador — sempre acompanhada do número do ponto e da zona |
| RNF-07 | Identidade visual | Paleta do evento: laranja `#F5821F`, azul-violeta `#312783`, branco. As 4 cores dos pontos são funcionais e não podem ser alteradas por estética |
| RNF-08 | Privacidade | Sem cookies, sem tracking, sem coleta de dados |
| RNF-09 | Build | Nenhuma etapa de build: os arquivos do repositório são os arquivos servidos |
| RNF-10 | Idioma | Português do Brasil apenas |

## 6. Edge Cases

- [ ] Acesso às 01h do dia 06/09 — deve selecionar **05/09**, não 06/09 (RF-02).
- [ ] Acesso fora dos três dias (ex.: 20/09/2026) — abre em 05/09 com aviso, não em branco.
- [ ] Linha sem alteração para o evento (`temProgramacaoEvento: false`, 43 casos) — tela reduzida, nenhum horário exibido.
- [ ] Linha com `nome: null` (5 casos: 011, 302, 305, 320, 357) — exibir só o número, sem "null" nem espaço vazio no layout.
- [ ] Linha com `empresa: null` (15 das 34) — omitir o campo, não exibir rótulo vazio.
- [ ] Horário ≥ 24:00 (264 passagens) — nunca exibir "25:52"; renderizar "01:52 (+1)".
- [ ] Linha 305: `passagens` tem 14 entradas contra 15 em `saidasOrigem` — a diferença é uma partida do KM 41, que não é passagem pelo ponto. A tela deve mostrar 14.
- [ ] Linha 305: viagens com `tipo: "baixada"` têm `ida: null` — o quadro completo não pode quebrar nem exibir célula vazia sem explicação.
- [ ] Viagens com `tipo: "continuacao"` (735 casos) têm `volta: null` e **não são passagens** — já estão excluídas de `passagens[]`; jamais reconstruir a lista a partir de `turnos[]`.
- [ ] Viagens com `tipo: "baixada"` têm `ida: null` mas **`volta` preenchida** — são passagens válidas e já constam de `passagens[]`.
- [ ] Dia selecionado é o corrente mas já passou a última passagem — RF-16 deve dizer "sem mais passagens hoje", não exibir NaN ou horário negativo.
- [ ] Dia corrente antes da primeira passagem — a próxima é a primeira da lista.
- [ ] `dados.json` em cache mais antigo que o publicado — RF-24 deve sinalizar e permitir atualizar.
- [ ] Primeiro acesso já offline (sem cache) — mensagem clara, não tela branca.
- [ ] Quadro completo de linha larga (a 640 tem 3 tabelas por turno) — rola dentro do contêiner, o `body` não.
- [ ] Busca por linha inexistente na base (ex.: `999`) — RF-07.
- [ ] Busca por linha fora de escopo (ex.: `442`, na arte mas sem aba) — mesma mensagem do RF-07.
- [ ] Toque no mapa entre dois pins próximos (P1 e P2 distam ~15% na vertical) — alvos não podem se sobrepor.

## 7. Critérios de Aceite

- [ ] Abrindo às 01h do dia 06/09 no fuso de Manaus, o dia selecionado é **05/09**.
- [ ] Digitando `608` na busca, chega-se ao quadro horário em no máximo 2 toques, com "Ponto de Ônibus 01 — Verde" visível.
- [ ] A linha 604 em 07/09 mostra a primeira passagem às **16:46**. Se aparecer 15:46, a implementação usou `saidasOrigem` e está errada.
- [ ] A linha 214 em 05/09 mostra a primeira passagem às **06:02**, não às 05:20.
- [ ] Clicando no pin do Ponto 03, aparecem as 14 linhas do ponto — 7 com quadro do evento e 7 marcadas como "sem alteração".
- [ ] A tela da linha 604 em 07/09 exibe "Programação especial a partir das 18h"; em 05/09 não exibe.
- [ ] Buscar `447` leva à tela reduzida com o Ponto 04 em destaque e **nenhum horário na tela**.
- [ ] A linha 305 em 05/09 lista 14 passagens, de `04:30` a `00:23 (+1)`.
- [ ] A última passagem da linha 227 em 05/09 aparece como `02:18 (+1)`, nunca como `26:18`.
- [ ] A visão simplificada da linha 113 em 05/09 lista exatamente 32 passagens, de `05:19` a `01:52 (+1)`.
- [ ] Nenhuma viagem de continuação aparece na visão simplificada.
- [ ] A tela usa a palavra "passagem" (ou equivalente) e sinaliza que o horário é aproximado — nunca apresenta o horário como saída exata.
- [ ] Com modo avião ligado após o primeiro acesso, o site abre e navega normalmente.
- [ ] Em 360×640 nenhuma tela rola horizontalmente; o quadro completo rola dentro do próprio contêiner.
- [ ] Trocar de dia estando na tela de uma linha mantém a mesma linha.
- [ ] Amostra de 3 linhas × 3 dias conferida manualmente contra a **coluna VOLTA** da planilha de origem bate 100%.

## 8. Referências

- `docs/prd.md` — PRD completo, com o modelo de dados comentado (§6), as regras de precedência (§4), o conteúdo dos avisos (§8) e as 15 armadilhas do parser (§9).
- `Passo a paço/dados/dados.json` — fonte única de dados, pronta e validada.
- `ferramentas/gerar_dados.py` — gerador; **não deve ser alterado nesta spec**.
- `ferramentas/relatorio_conversao.txt` — relatório de conversão, 102 blocos linha-dia.
- `docs/assets/mapa-pontos.png` (1517×1190) e `docs/assets/mapa-circulacao.png` (1517×1237) — artes oficiais extraídas das págs. 5 e 4 do PDF.
- `Passo a paço/OS_057- ACOP-EMPRESAS - PROGRAMAÇÃO PASSO A PAÇO 20262.pdf` — ordem de serviço de origem.

### Pendências herdadas do PRD (não bloqueiam a implementação)

- **P-01** — nomes das linhas 011, 302, 305, 320, 357 ausentes; a UI já trata `nome: null`.
- **P-02** — as listas de "viagem extra" da pág. 3 e da pág. 4 do PDF divergem; adotada a da pág. 4, a confirmar com a operação.
- **P-08** — resolvida: com `passagens` vindo da `VOLTA`, partidas do KM 41 não chegam à tela.
- **P-10** — o horário de passagem é aproximado por natureza; a UI precisa dizer isso (RF-15), para o operador não ser cobrado por atraso de poucos minutos.
- **Conferência manual de amostra** — a validação do parser cruza painel × quadro × total declarado *dentro* da planilha; três fontes erradas juntas passariam. Coberto pelo último critério de aceite.
