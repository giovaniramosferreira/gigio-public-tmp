---
sintoma: "modelo de suavizacao exponencial devolve previsao NaN sem levantar erro"
escopo: [modelagem, series-temporais, statsmodels]
tambem_aparece_como: "MAPE volta NaN; serie temporal com periodo faltando; semana sem registro na serie; suavizacao exponencial sem resultado"
autor: rafael.bittencourt
criado: 2026-08-11
valida_ate: 2026-11-09
status: ouro
reusos: 1
---

## Contexto
Serie semanal montada com `asfreq`. O backtest roda, o codigo nao quebra, e a coluna de
MAPE volta NaN para os modelos de suavizacao — enquanto media movel e ingenuo funcionam.

## Causa
`asfreq` cria linha com NaN para todo periodo sem registro. No nosso caso, uma unica
semana sem transacao (a do Natal). Os modelos de suavizacao propagam o NaN pela serie
inteira e devolvem previsao NaN, sem excecao e sem aviso.

## Solucao
Contar os NaN logo depois de montar a serie e decidir explicitamente o que eles
significam **no negocio**. Em varejo, semana sem transacao e faturamento zero, nao dado
ausente — entao preencher com zero. Em sensor, seria interpolacao. A escolha muda o
resultado e precisa estar escrita.

## O que NÃO funciona
- Assumir que "rodou sem erro" significa "funcionou". Neste caso nao significa.
- `dropna()` na serie. Remove o periodo e desalinha todos os indices seguintes.
- Trocar de modelo achando que e limitacao da biblioteca. O problema esta na serie.
