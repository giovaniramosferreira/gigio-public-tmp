# Contrato Colmeia

Este arquivo é o padrão único de trabalho do time. Vale para qualquer ferramenta agêntica.
Orçamento fixo: para entrar uma regra, sai outra. Não passar de 40 linhas úteis.

## Antes de começar qualquer tarefa

- Se a tarefa envolve Databricks, catálogo, permissão, pipeline ou modelo já existente:
  busque no conhecimento antes de tentar (`skill: buscar-conhecimento`).
- Se a busca trouxer entrada com `status: obsoleto`, ignore o conteúdo e avise a pessoa.

## Acesso a dados

- A credencial do Databricks é **somente leitura**. Nunca proponha escrita, DDL ou grant.
- **Nenhum resultado de query entra em arquivo do repositório.** Nem amostra, nem "só uma linha".
- Nada de segredo, token, connection string ou identificador de cliente em commit.

## Ao terminar uma tarefa

- Se houve sequência de falha → falha → sucesso, proponha um aprendizado (`skill: registrar-aprendizado`).
- Proposta é sempre pull request. **Nunca commit direto em `conhecimento/`.**
- Se você usou uma entrada existente e ela resolveu, incremente `reusos` nela no mesmo PR.

## Ao escrever um aprendizado

- Título é o **sintoma** que aparece na tela, não a causa que você descobriu depois.
- Sempre inclua a seção "O que NÃO funciona". É a parte mais valiosa do arquivo.
- Sempre defina `valida_ate`. Padrão: 90 dias.

## Código

- O repositório de código do time é o único destino de commit de código. Não crie repositório novo.
- Não gere documentação que repete o que o código já mostra.
