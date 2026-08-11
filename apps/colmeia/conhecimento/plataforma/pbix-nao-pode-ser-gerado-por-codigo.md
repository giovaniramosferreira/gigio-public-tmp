---
sintoma: "arquivo .pbix gerado por script nao abre no Power BI Desktop"
escopo: [power-bi, versionamento, automacao]
tambem_aparece_como: "como versionar relatorio Power BI no git; gerar relatorio por script; conflito de merge em arquivo pbix"
autor: thiago.mendes
criado: 2026-08-11
valida_ate: 2026-11-09
status: bronze
reusos: 0
---

## Contexto
Pedido: gerar um relatorio Power BI por codigo e versionar no repositorio do time.

## Causa
PBIX e um container binario fechado. O modelo tabular vai dentro num formato proprietario
que nenhuma biblioteca publica escreve. Da para *ler* partes de um PBIX; nao da para
*montar* um valido do zero. Alem disso, sendo binario, ele nao gera diff util no git —
duas pessoas mexendo no mesmo relatorio produzem conflito irresolvivel.

## Solucao
Usar PBIP, que e a resposta oficial da Microsoft para exatamente este problema: uma pasta
de projeto com o modelo em TMDL e o relatorio em PBIR, ambos texto e ambos documentados
publicamente. Abre no Desktop pelo arquivo `.pbip`, versiona bem no git, e pode ser
editado por script.

Desde 2026 o PBIR e o formato padrao no Desktop. Em versao mais antiga, habilitar em
Arquivo > Opcoes > Recursos de previa > armazenar relatorios em formato PBIR.

## O que NÃO funciona
- Renomear um zip para .pbix. Abre com erro de arquivo corrompido.
- Gerar so o modelo e pedir para a pessoa montar os visuais. Funciona, mas joga fora
  metade do trabalho e nao versiona o relatorio.
- Commitar PBIX binario no git "so para guardar". Nao gera diff, nao permite revisao, e
  o repositorio incha a cada salvamento.
