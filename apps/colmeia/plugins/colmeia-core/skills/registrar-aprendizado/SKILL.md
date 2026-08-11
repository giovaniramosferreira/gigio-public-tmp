---
name: registrar-aprendizado
description: Propõe um novo aprendizado para a base compartilhada do time. Use ao final de uma tarefa em que houve sequência de falha seguida de solução, quando o usuário disser "aprendi", ou quando descobrir que algo documentado deixou de ser verdade.
---

# Registrar aprendizado

## Quando registrar

Só quando houve **aprendizado real**: uma sequência de tentativa frustrada seguida de
solução, ou a descoberta de que algo documentado deixou de ser verdade.

Não registre: tarefa que correu bem na primeira tentativa, preferência pessoal,
conhecimento que está na documentação oficial da ferramenta.

Se ficar em dúvida, não registre. Base pequena e confiável vale mais que base grande.

## Como escrever

Copie `conhecimento/_template.md`. Salve em `conhecimento/<área>/<sintoma-em-kebab>.md`.

**O título é o sintoma que aparece na tela.** Ninguém busca por "refatoração da camada
gold em março". As pessoas buscam pela mensagem de erro. Se você escrever o título como
causa, o arquivo nunca vai ser encontrado e o trabalho foi perdido.

Obrigatório: `sintoma`, `escopo`, `autor`, `criado`, `valida_ate` (padrão 90 dias),
`status: bronze`, `reusos: 0`.

A seção **"O que NÃO funciona"** é obrigatória e é a mais valiosa do arquivo. Caminho
morto documentado economiza mais tempo do que solução documentada, porque é exatamente
onde o próximo agente ia gastar as próximas duas horas.

## Antes de abrir o PR

- Rode `python3 scripts/validar.py`. Ele barra segredo, dado real e frontmatter incompleto.
- Confira: nenhum resultado de query, nenhum identificador de cliente, nenhum nome de
  pessoa fora do campo `autor`.
- Abra **pull request**. Nunca commite direto em `conhecimento/`.
