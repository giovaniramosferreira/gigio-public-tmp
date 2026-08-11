---
name: curar-conhecimento
description: Revisa a base de conhecimento em busca de entradas vencidas, duplicadas ou que deixaram de ser verdade. Use na revisão semanal do time, quando alguém disser que uma entrada está errada, ou depois de mudança de infraestrutura que invalide conhecimento anterior.
---

# Curar conhecimento

Instrução obsoleta não é neutra — é ativamente danosa. O agente segue com confiança a
informação errada em vez de ir ler a fonte. Podar é trabalho de primeira classe e vale
o mesmo reconhecimento que contribuir.

## Rotina semanal — dez minutos

1. `python3 scripts/validar.py --vencidas` lista o que passou de `valida_ate`.
2. Para cada uma, três perguntas:
   - **Ainda é verdade?** Fato desatualizado é pior que fato ausente: é confiantemente errado.
   - **Foi usada?** `reusos: 0` depois de 90 dias é sinal de que o título não está
     encontrável. Reescreva o título como sintoma antes de arquivar.
   - **Foi escrita com raiva?** Regra criada logo depois de um incidente costuma estar
     superajustada àquele caso. Reescreva como princípio geral ou apague.
3. Decidir: renovar `valida_ate`, reescrever, ou `status: obsoleto`.

## Arquivar

Não delete. Mude `status` para `obsoleto` e acrescente `motivo:` no frontmatter.
O arquivo sai do índice de busca e continua no histórico do git.

## Duplicatas

Duas entradas com o mesmo sintoma dividem o reuso e enfraquecem as duas. Funda numa só,
mantenha os autores originais em `autor` e preserve a soma dos `reusos`.
