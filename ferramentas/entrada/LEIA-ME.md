# Entradas manuais do gerador

`nomes_linhas.json` é editado à mão e lido por `ferramentas/gerar_dados.py`.
Nada aqui é gerado automaticamente — o script só lê.

## nomes_linhas.json

Itinerário de cada linha, por extenso, sem abreviações. É o texto que aparece
ao lado do número na busca, na lista do ponto e na tela da linha.

- Chave: número da linha com 3 dígitos, como string (`"011"`, não `11`).
- Valor: o itinerário, ou `null` para a linha aparecer só com o número.
- Todas as linhas conhecidas já estão listadas. Uma linha que exista na planilha
  mas falte aqui é publicada sem itinerário e vira aviso no relatório.

**De onde vieram os nomes que já estão preenchidos:** das tabelas de viagens
extras da OS 057 (31 linhas), transcritos no commit inicial do projeto. Já
chegam abreviados de lá (`STA. ETELVINA/ E4/ DJ. BATISTA/ T1/ CENTRO`).
**Nenhuma aba de planilha traz itinerário** — as abas só têm horário. Por isso
as demais estão em `null`: não há de onde puxá-las automaticamente.

## E o tipo de escala?

Não tem arquivo. O tipo (domingo, sábado, sábado e domingo, ou a escala especial
do evento) é lido do cabeçalho da própria aba, por `ler_escala_base`. Serve só
para o relatório de conversão — **a tela nunca mostra escala nem data de
referência**. Para mudar a escala com que uma linha opera, edite a aba.
