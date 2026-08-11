# Sprint 01 — rodada 0 do estudo

Base de conhecimento vazia no início. Esta rodada **só produz**, não consome.

## Fonte de dados

UCI Machine Learning Repository, Online Retail Data Set (subconjunto França).
8.557 transações, 01/12/2010 a 09/12/2011. Dados públicos, nenhum dado real do banco.

## Como reproduzir

```bash
python3 etl/construir_base.py      # gera dados/varejo.db e os CSVs
python3 modelo/prever_vendas.py    # backtest e previsão
```

## Como abrir o relatório

1. Abrir `relatorio/Vendas.pbip` no Power BI Desktop.
2. Transformar dados > Gerenciar parâmetros > `PastaDados` = caminho absoluto da pasta
   `sprint-01/dados` na sua máquina.
3. Fechar e aplicar.

O passo 2 é obrigatório: Power Query não tem caminho relativo. Sem ele, todas as tabelas
falham na atualização.

**Status do entregável: candidato, não validado.** Os arquivos foram gerados conforme a
especificação pública de TMDL e PBIR e têm sintaxe válida, mas não existe Power BI Desktop
no ambiente que os produziu. Ninguém abriu ainda. Ver
`conhecimento/plataforma/agente-nao-valida-entregavel-power-bi.md`.

## Estrutura

```
etl/          ETL de origem para star schema
dados/        varejo.db (SQLite) + CSVs consumidos pelo Power BI
relatorio/    projeto Power BI em formato aberto (TMDL + PBIR)
modelo/       previsão de faturamento semanal com backtest
marketing/    jornal da sprint
```
