---
sintoma: "faturamento do relatorio nao bate com o do sistema origem, sempre para mais"
escopo: [modelagem, varejo, camada:fato]
autor: bruno.carvalho
criado: 2026-08-11
valida_ate: 2026-11-09
status: bronze
reusos: 0
---

## Contexto
Base transacional de varejo com linhas de quantidade negativa. A tentacao e filtrar
`Quantidade > 0` para "limpar" a base.

## Causa
Quantidade negativa nao e sujeira: e devolucao. A nota de credito vem com o numero de
pedido comecando por "C". Filtrar essas linhas remove a devolucao do calculo e infla o
faturamento — no nosso caso, em 5,9%.

## Solucao
Marcar a linha com uma flag `EhDevolucao` em vez de excluir, e ter duas medidas separadas:
faturamento bruto (so venda) e faturamento liquido (venda menos devolucao). Deixar
explicito no nome da medida qual e qual, senao duas pessoas calculam coisas diferentes
com o mesmo nome.

## O que NÃO funciona
- Filtrar `Quantidade > 0` na ingestao. Perde a informacao para sempre e ninguem percebe.
- Usar ABS na quantidade. Transforma devolucao em venda e infla o dobro.
- Assumir que cliente ausente e linha invalida. E venda de balcao, e conta no faturamento.
