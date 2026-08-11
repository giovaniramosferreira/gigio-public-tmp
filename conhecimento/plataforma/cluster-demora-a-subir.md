---
sintoma: "cluster preso em Pending por mais de 10 minutos"
escopo: [databricks, compute]
autor: eduardo.sampaio
criado: 2026-07-28
valida_ate: 2026-10-26
status: prata
reusos: 0
---

## Contexto
Acontece com mais frequência no início da manhã, quando o time inteiro sobe ambiente
ao mesmo tempo.

## Causa
Fila de provisionamento na região. Não é erro de configuração.

## Solução
Usar um cluster compartilhado do time para exploração em vez de subir um dedicado.
Cluster dedicado só para carga que justifique o isolamento.

## O que NÃO funciona
- Cancelar e subir de novo. Volta para o fim da fila e piora seu próprio tempo.
- Aumentar o tamanho do nó achando que sobe mais rápido. Sobe mais devagar e custa mais.
