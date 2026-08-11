---
name: buscar-conhecimento
description: Busca aprendizados registrados pelo time antes de tentar resolver um problema do zero. Use sempre que encontrar um erro, uma permissão negada, um comportamento inesperado de pipeline, catálogo, modelo ou dashboard — e antes de propor qualquer investigação longa.
---

# Buscar conhecimento

Alguém do time provavelmente já bateu nesta pedra. Consulte antes de investigar.

## Como buscar

1. Extraia o **sintoma literal**: a mensagem de erro como aparece na tela, sem
   interpretação. É por isso que os títulos são escritos como sintoma.
2. Rode `python3 scripts/buscar.py "<sintoma>"` a partir da raiz do repositório.
3. Leia os até 3 resultados mais bem pontuados. Não carregue mais que isso.

## Como avaliar o resultado — a parte que importa

Sintoma parecido com causa diferente é a principal forma de errar aqui. Uma entrada
recuperada só é aplicável se **o escopo bate**: mesmo catálogo, mesmo schema, mesma
camada, mesma ferramenta.

- Escopo não bate → descarte e diga à pessoa que não achou nada aplicável.
- `status: obsoleto` → não use. Avise que existe registro antigo e que ele venceu.
- `valida_ate` no passado → trate como suspeito. Confirme com a pessoa antes de agir.
- Nenhum resultado → diga isso explicitamente. Não invente relação com entrada distante.

## Depois de usar

Se a entrada resolveu o problema, **pergunte à pessoa para confirmar**. Com o "sim",
incremente `reusos` no arquivo e inclua a alteração no pull request do trabalho.
O reconhecimento vai para quem escreveu, e é isso que mantém a base viva.
