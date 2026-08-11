# O que a área entregou — Sprint 01

*Boletim quinzenal de Modelagem e BI · 11 de agosto de 2026*

---

## Em uma frase

A área construiu, do zero, uma base de vendas, um painel e um modelo de previsão — e,
no caminho, descobriu sete coisas que agora ninguém mais precisa descobrir sozinho.

---

## O que existe agora que não existia antes

**Um painel de vendas.** Faturamento, pedidos, ticket médio e devoluções, com quebra por
produto, por período e por tipo de cliente. Duas páginas: a visão geral e o detalhe de
devoluções.

**Uma previsão de faturamento para as próximas quatro semanas.** Com uma ressalva que a
equipe fez questão de deixar em destaque, e sobre a qual eu volto abaixo.

**Um jeito de não repetir erro.** Sete aprendizados registrados num lugar comum. Quando
alguém da equipe bater no mesmo problema, a resposta já está lá.

---

## O número que interessa

Faturamento no período analisado: **209,7 mil**, com **5,9% de devolução**.

Esse segundo número é o achado da sprint. Ele estava invisível: o jeito intuitivo de
preparar a base — descartar as linhas de quantidade negativa — apagava justamente as
devoluções e mostrava um faturamento 5,9% maior do que o real. A equipe pegou isso e
separou as duas medidas de forma explícita.

---

## A ressalva que a equipe fez questão de registrar

A previsão de vendas tem margem de erro de cerca de **32%**. Em números: para uma semana
prevista em 6,7 mil, o intervalo real vai de 1,8 mil a 11,5 mil.

O motivo não é o modelo — é o histórico. Temos pouco mais de um ano de dados, e prever
sazonalidade de fim de ano exige dois ciclos completos. A equipe testou quatro abordagens,
comparou todas contra o baseline mais simples possível e escolheu a melhor. A melhor
ainda assim é imprecisa.

**Serve para indicar tendência. Não serve para decisão de compra ou estoque.**

Eu destaco isso porque a tentação natural é usar o número como se fosse firme. A equipe
poderia ter entregado só a previsão e ficado bem na foto. Preferiu entregar a previsão com
o erro ao lado.

---

## O que travou

O formato padrão de arquivo do Power BI não pode ser gerado por código — é um binário
fechado, e além disso não permite comparar versões nem trabalhar em dois ao mesmo tempo.
A equipe migrou para o formato de projeto aberto da própria Microsoft, que resolve os três
problemas de uma vez.

Custou tempo. Mas passa a valer para todo relatório daqui pra frente, não só para este.

---

## O que vem na próxima sprint

O teste de verdade: as pessoas vão receber tarefas que **dependem** do que foi aprendido
agora. Se o que a equipe registrou nesta sprint fizer outra pessoa resolver mais rápido,
a coisa funciona. Se não fizer, a gente descobre o porquê.

---

*Preparado por Patrícia Lins, Marketing Analytics.*
*Fonte dos dados: base pública de varejo online (UCI Machine Learning Repository),
usada como ambiente de teste. Nenhum dado de cliente do banco foi utilizado.*
