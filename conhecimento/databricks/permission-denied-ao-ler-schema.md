---
sintoma: "PERMISSION_DENIED: User does not have SELECT on Table"
escopo: [databricks, unity-catalog]
tambem_aparece_como: "sem acesso a tabela do catalogo; grant aplicado mas continua negando; USE CATALOG faltando"
autor: eduardo.sampaio
criado: 2026-08-04
valida_ate: 2026-11-02
status: prata
reusos: 0
---

## Contexto
Aparece ao consultar tabela de um schema ao qual você teoricamente já tem acesso.
Comum logo depois de mudanças de estrutura de catálogo.

## Causa
No Unity Catalog o privilégio não é herdado para cima: ter grant no schema não basta se
faltar `USE CATALOG` no catálogo pai.

## Solução
Pedir os dois níveis no mesmo chamado: `USE CATALOG` no catálogo e `SELECT` no schema.
Pedir separado gera dois chamados e dobra o tempo de espera.

## O que NÃO funciona
- Recriar o cluster. Não tem relação. Custa cerca de 15 minutos.
- Criar view em cima da tabela para contornar. A view herda a mesma restrição.
- Reautenticar o CLI. O token está correto; o problema é de privilégio.
