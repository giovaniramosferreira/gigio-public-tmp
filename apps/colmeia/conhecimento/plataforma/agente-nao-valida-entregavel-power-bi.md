---
sintoma: "entregavel de Power BI feito por agente so falha quando um humano abre"
escopo: [power-bi, processo, revisao]
tambem_aparece_como: "entregavel gerado mas nao testado; como revisar artefato de Power BI feito por agente"
autor: camila.ferraz
criado: 2026-08-11
valida_ate: 2027-02-11
status: bronze
reusos: 0
---

## Contexto
Descoberto na sprint 01. O agente conseguiu produzir modelo TMDL e relatorio PBIR
completos e validar a sintaxe dos arquivos. Nao conseguiu abrir no Power BI Desktop.

## Causa
Nao existe Power BI Desktop no ambiente do agente, e nao existe validador oficial fora
dele. Sintaxe valida nao garante que o Desktop carrega: nomes de visual, referencias de
medida e versao de schema so sao verificados na abertura.

## Solucao
Todo entregavel de Power BI produzido por agente e **candidato**, nunca pronto. O fluxo
tem um passo humano obrigatorio: alguem abre no Desktop, confirma que carrega, e so
entao o PR e aprovado. Quem revisar deve reportar o erro literal da tela — e o unico
sinal que o agente nao consegue obter sozinho.

Vale para qualquer formato que dependa de aplicativo proprietario para validar.

## O que NÃO funciona
- Confiar em validacao de JSON e de schema. Passa e mesmo assim pode nao abrir.
- Marcar o entregavel como concluido porque os arquivos foram gerados. Gerado nao e aberto.
