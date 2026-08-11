---
sintoma: "modelo sazonal anual nao converge ou devolve resultado sem sentido"
escopo: [modelagem, series-temporais, previsao-de-vendas]
tambem_aparece_como: "quanto historico preciso para modelar sazonalidade; poucos meses de dados para previsao; modelo sazonal com serie curta"
autor: larissa.antunes
criado: 2026-08-11
valida_ate: 2027-02-11
status: ouro
reusos: 1
---

## Contexto
Serie semanal com pouco mais de um ano de historico. O pedido era prever venda com
sazonalidade de fim de ano.

## Causa
Estimar componente sazonal de periodo 52 exige pelo menos dois ciclos completos, ou seja
104 pontos. Com 53 pontos o modelo tem menos de um ciclo para aprender a forma da
sazonalidade — ele nao esta mal configurado, ele esta sem dado.

## Solucao
Declarar o limite antes de comecar, e nao depois de tentar. Com menos de dois ciclos:
usar modelo sem componente sazonal, comparar sempre contra o baseline ingenuo, e reportar
o MAPE do backtest junto com a previsao — nunca a previsao sozinha.

No nosso caso o melhor modelo ficou em MAPE de 32% com intervalo de confianca de 146% da
propria previsao. Isso serve como indicacao de tendencia e **nao serve** para decisao de
compra ou estoque. Entregar sem essa frase e o erro real.

## O que NÃO funciona
- Aumentar a granularidade para "ter mais pontos". Passar de semanal para diario multiplica
  o ruido sem adicionar informacao sazonal.
- Reduzir o periodo sazonal de 52 para 12 na serie semanal. Cria sazonalidade trimestral
  ficticia que nao existe no negocio.
- Entregar so o numero previsto. Sem o erro do backtest, quem recebe assume precisao que
  nao existe.
