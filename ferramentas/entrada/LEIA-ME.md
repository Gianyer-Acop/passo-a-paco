# Entradas manuais do gerador

Estes dois arquivos são editados à mão e lidos por `ferramentas/gerar_dados.py`.
Nada aqui é gerado automaticamente — o script só lê.

## nomes_linhas.json

Itinerário de cada linha, por extenso, sem abreviações. É o texto que aparece
ao lado do número na busca, na lista do ponto e na tela da linha.

- Chave: número da linha com 3 dígitos, como string (`"011"`, não `11`).
- Valor: o itinerário, ou `null` para a linha aparecer só com o número.
- Todas as linhas conhecidas já estão listadas. Não remova chaves: uma linha
  ausente aqui faz o gerador falhar, de propósito, para nada passar batido.

## escalas_evento.json

Tipo de escala com que cada linha **sem programação especial** vai operar em
cada dia do evento. Serve só para conferência: o gerador compara com o tipo
que está escrito na aba da planilha e avisa no relatório quando divergem.
Este texto **não aparece no site**.

- Valores aceitos: `"DOMINGO"`, `"SÁBADO"`, `"SÁBADO E DOMINGO"` ou `null`.
- `null` = ainda não conferido; vira aviso no relatório de conversão.
- Os valores iniciais foram copiados da própria planilha e **precisam de
  revisão**: 05 e 07/09 são feriados, então boa parte da frota roda escala de
  domingo mesmo em aba rotulada de outro jeito.
