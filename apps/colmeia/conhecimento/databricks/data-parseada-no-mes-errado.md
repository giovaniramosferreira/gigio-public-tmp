---
sintoma: "vendas aparecem em meses errados depois de carregar CSV com data"
escopo: [etl, pandas, csv, ingestao]
tambem_aparece_como: "data no formato americano trocando dia e mes; periodo da serie maior que o esperado; mes errado depois da ingestao"
autor: bruno.carvalho
criado: 2026-08-11
valida_ate: 2026-11-09
status: bronze
reusos: 0
---

## Contexto
Fonte com data no formato americano M/D/AAAA. O carregamento roda sem erro nenhum e o
relatorio fica pronto. So que o faturamento de marco esta em janeiro.

## Causa
Sem `format` explicito, o parser infere linha a linha. Em todo dia menor ou igual a 12
a leitura de dia e mes e ambigua e ele escolhe uma — nem sempre a mesma. Nao levanta
excecao porque as duas leituras sao datas validas.

## Solucao
Sempre passar `format` explicito na leitura. Depois, conferir se o minimo e o maximo da
serie batem com o periodo que a origem promete. Se a origem diz um ano e a serie tem
treze meses, o parse esta errado.

## O que NÃO funciona
- Confiar no carregamento ter rodado sem erro. Este bug e 100% silencioso.
- Olhar so as primeiras linhas. Se o dia da primeira linha for maior que 12, parece certo.
- Ordenar por data e olhar. A ordenacao fica coerente com a leitura errada.
