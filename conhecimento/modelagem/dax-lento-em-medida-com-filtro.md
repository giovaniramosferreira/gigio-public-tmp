---
sintoma: "medida DAX com CALCULATE aninhado leva mais de 20s para renderizar"
escopo: [power-bi, dax, camada:gold]
autor: diego.nakamura
criado: 2026-08-06
valida_ate: 2026-11-04
status: bronze
reusos: 0
---

## Contexto
Visual de cartão que era instantâneo passou a demorar depois que a tabela fato cresceu.

## Causa
Contexto de filtro sendo recalculado por linha em vez de resolvido uma vez.

## Solução
Trocar o filtro embutido no CALCULATE por variável calculada antes, com VAR, e reutilizar.
Na medida que eu ajustei, o tempo caiu para menos de 2s.

## O que NÃO funciona
- Reduzir o período do visual. Mascara o sintoma sem resolver e volta no mês seguinte.
- Trocar para modo DirectQuery. Piorou: passou de 20s para mais de 40s.
