# Passo a Paço — site de apoio operacional

Site estático de consulta rápida para os dias **05, 06 e 07 de setembro de 2026**, durante o
evento **Sou Manaus Passo a Paço**, no Centro Histórico de Manaus.

Para quem é: fiscais de transporte, fiscais da ACOP e qualquer pessoa da operação que precise
responder, em campo e pelo celular, "de onde essa linha sai agora" e "que horas o próximo ônibus
passa no ponto". Não é um site institucional nem um painel administrativo — é a versão pública,
somente leitura, da programação especial da **OS Urbano nº 057/2025-IMMU**.

Funciona offline depois do primeiro acesso (service worker + manifesto), porque em campo a
conexão não é garantida.

## Como atualizar os dados

Toda a informação do site vem de um único arquivo gerado, `dados/dados.json`. Ele nunca é
editado à mão — é regenerado a partir das planilhas em `Passo a paço/` (`Grupo 1.xlsx` a
`Grupo 4.xlsx`, uma aba por linha de ônibus).

1. Edite as planilhas em `Passo a paço/`.
2. Rode o gerador:

```
python ferramentas/gerar_dados.py
```

3. Confira a última linha impressa no terminal. Ela precisa dizer:

```
Avisos: NN | Erros: 0
```

   `Avisos` é normal (avisos de conversão, não impedem a publicação). `Erros` **tem que ser 0**.
   Se não for, veja a seção "O gerador acusou erro" abaixo — **não** rode o resto do fluxo com
   erro pendente.

   O relatório completo, linha por linha, fica em `ferramentas/relatorio_conversao.txt`.

4. Rode o teste-guarda:

```
node ferramentas/verificar_contrato.mjs
```

   Ele confere a forma de `dados/dados.json`, o registro de telas em `app/telas/`, que nenhuma
   tela lê `saidasOrigem` e as assinaturas de `app/formato.js`. A última linha precisa dizer
   `0 falha(s)`.

5. Depois que as duas ferramentas passarem, commite só o que mudou e dê push:

```
git add dados/dados.json ferramentas/relatorio_conversao.txt
git commit -m "dados: atualiza planilhas do evento"
git push
```

O GitHub Pages publica sozinho a partir do push — não há passo manual de build ou deploy (ver
"Como publicar" abaixo). Não é preciso editar nenhum arquivo em `app/`, `assets/` ou `index.html`
para atualizar dados de linha.

**Nunca edite `ferramentas/gerar_dados.py`.** Ele é o parser das planilhas e faz parte do
contrato de dados do site; qualquer ajuste nele é uma mudança de comportamento, não uma
atualização de dados.

## O gerador acusou erro — e agora?

O erro mais comum não é um bug: é uma **divergência entre o painel "FREQUÊNCIA DA LINHA" e o
quadro de horários** da mesma aba. O gerador nunca decide sozinho qual dos dois está certo — ele
publica o painel (que é o que bate com o total de "N VIAGENS" declarado), grava a divergência no
campo `conflitos` da linha/dia afetada e **falha a validação de propósito**, até alguém da
operação decidir.

Isso está documentado em `docs/prd.md`, §4, regra 5 (regras de precedência): *"Painel × quadro:
não há um lado que sempre vence."* Nos casos das linhas `219` e `443` prevaleceu o painel de
frequência; na `227` prevaleceu a tabela. A resolução é caso a caso, feita pela operação — não
existe heurística de desempate a implementar no código.

Na prática, quando o terminal mostrar uma linha `CONFLITO painel x quadro`:

1. Não tente "corrigir" ajustando o script.
2. Leve o caso para quem tem a planilha de origem/operação: qual dos dois lados (painel ou
   tabela) está certo para aquela linha, naquele dia.
3. Corrija a célula errada na planilha `.xlsx` correspondente.
4. Rode o gerador de novo. Só publique quando `Erros: 0`.

## As 34 linhas com horário do evento e as 43 sem

Das 77 linhas com aba nas planilhas, **34 têm programação especial para os dias 05, 06 e 07/09**
e são as únicas que o site mostra com horário de passagem. As outras **43 abas contêm escala
regular**, sem qualquer alteração para o evento — muitas com data de referência de anos
anteriores (a planilha traz casos de até 2021).

Por isso essas 43 linhas aparecem no site **só com o ponto de embarque**, nunca com horário:
publicar a escala regular como se fosse o horário do evento seria dizer a um fiscal, num sábado
de setembro de 2026, um horário que na verdade é de uma escala antiga — erro operacional grave,
não um detalhe de exibição.

## Por que o site mostra `passagens` e nunca `saidasOrigem`

Cada linha/dia em `dados/dados.json` guarda dois horários diferentes para a mesma viagem:

- **`passagens[]`** — vem da coluna `VOLTA` da planilha: o momento em que o veículo **passa pelo
  ponto de embarque no Centro**. É o horário que interessa a quem está esperando o ônibus ali, e
  é **aproximado**.
- **`saidasOrigem[]`** — vem do painel "FREQUÊNCIA DA LINHA": a partida do **terminal no bairro**,
  antes do veículo rodar até o Centro. Serve só para o gerador validar a integridade da planilha
  (conferir que o total bate com o quadro).

O site **nunca exibe `saidasOrigem`**. Usá-lo erraria o horário mostrado ao público por até
**42 minutos na linha 214** e por até **1 hora na linha 604** — a diferença entre a partida do
bairro e a passagem real pelo Centro. Por isso `ferramentas/verificar_contrato.mjs` bloqueia
qualquer tela em `app/telas/` que leia `saidasOrigem` — é um teste-guarda, não uma sugestão.

Teste de sanidade citável: a linha **604** no dia **07/09** mostra a primeira passagem às
**16:46**. Se em algum lugar aparecer **15:46**, algo está lendo `saidasOrigem` em vez de
`passagens` — e está errado.

## Como publicar no GitHub Pages

O repositório é servido como está: não há passo de build. O deploy é o próprio `git push`.

1. Confirme que o Pages do repositório está configurado para publicar a partir da branch `main`,
   pasta raiz (`/`) — é onde vivem `index.html`, `app/`, `assets/`, `dados/`, `sw.js` e
   `manifest.webmanifest`.
2. Dê push na `main` com as mudanças já commitadas (dados ou código).
3. O GitHub Pages rebuilda e publica sozinho a cada push. Não é preciso rodar nada localmente
   além dos passos de "Como atualizar os dados" acima.

Se o site parecer desatualizado mesmo depois do push: o service worker (`sw.js`) cacheia o app
para uso offline. O rodapé do site (`app/rodape.js`) mostra um botão "Atualizar" quando detecta
uma versão nova — oriente quem estiver em campo a tocar nele em vez de simplesmente recarregar a
página.

## Pendências abertas

Estas pendências são conhecidas, não bloqueiam a operação do site, e estão detalhadas em
`docs/prd.md`, §11:

- **P-01 — nomes de linha ausentes.** As linhas `011`, `302`, `305`, `320` e `357` não têm nome
  no PDF de origem. A UI já trata isso: quando `nome` é `null`, mostra só o número da linha. Não
  é um bug a corrigir no código; falta a informação vir da operação.
- **P-02 — qual lista de "viagem extra" vale.** O PDF da OS 057 traz duas listas de linhas que
  fazem uma viagem extra a partir da 00h — uma na pág. 3, outra na arte da pág. 4 — e elas
  divergem parcialmente. O gerador adotou a lista da pág. 4 (é a que está em
  `ferramentas/gerar_dados.py`, aviso `viagem-extra-00h`). Isso precisa ser confirmado com a
  operação antes de tratar como definitivo; se a operação apontar a lista da pág. 3 como correta,
  o ajuste é no dicionário `AVISOS` do gerador, não no site.
- **6 linhas fora de escopo.** As linhas `209`, `502`, `610`, `616`, `690` e `442` aparecem na
  arte da pág. 5 do PDF (têm ponto de embarque definido) mas não têm aba de escala nas
  planilhas — por isso não têm entrada em `dados/dados.json` e não aparecem no site. Ficam de
  fora até a operação confirmar a participação delas no evento; confirmada, basta a planilha
  ganhar a aba correspondente e rodar o gerador de novo.
