---
sintoma: "modelo de previsao tem MAPE pior que repetir o ultimo valor observado"
escopo: [modelagem, series-temporais, previsao-de-vendas]
tambem_aparece_como: "vale a pena agregar de semanal para mensal; suavizacao exponencial pior que o baseline; qual granularidade usar na previsao"
autor: marina.okada
criado: 2026-08-11
valida_ate: 2026-11-09
status: bronze
reusos: 0
---

## Contexto
Mesma serie de faturamento, dois graos. No semanal, a suavizacao exponencial ganhou do
ingenuo com folga (MAPE 32% contra 60%). No mensal, o ingenuo ganhou de todos: 24% contra
27% do melhor concorrente.

## Causa
Agregar reduz ruido e reduz numero de pontos ao mesmo tempo. Menos ruido favorece o
modelo simples; menos pontos impedem o modelo complexo de estimar seus parametros. Existe
um grao em que a troca deixa de compensar, e ele muda de serie para serie — nao da para
saber por teoria, so medindo.

## Solucao
Sempre rodar o baseline ingenuo junto com os candidatos, em todo grao testado. Se o
ingenuo ganhar, entregue o ingenuo: e mais barato de manter, mais facil de explicar em
comite, e nao tem parametro para desajustar.

Reportar tambem quantos pontos o backtest teve. Nosso MAPE mensal saiu de 4 pontos de
teste — o proprio numero e incerto, e omitir isso e vender precisao que nao existe.

## O que NÃO funciona
- Escolher o grao antes de medir. A intuicao de que "mensal e mais estavel, logo melhor
  de prever" so estava certa por acidente aqui.
- Comparar modelos entre si sem o ingenuo na tabela. Sem o baseline, o menos ruim de
  quatro modelos ruins parece bom.
- Concluir pelo MAPE menor sem olhar o tamanho do teste. 24% sobre 4 pontos e menos
  confiavel que 32% sobre 8.
