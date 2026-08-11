# Tarefas

Uma tarefa por arquivo, agrupada por departamento.

O desenho que faz o estudo valer alguma coisa: pelo menos uma tarefa de cada departamento
precisa **depender de conhecimento que outro departamento vai gerar**. Sem essa dependência
cruzada, o estudo mede só se agente sabe escrever markdown.

```
tarefas/
  engenharia-de-dados/
  ciencia-de-dados/
  bi-e-modelagem/
```

Formato:

```markdown
# <título curto>
persona: <id>
departamento: <nome>
depende_de: <id da tarefa que gera o conhecimento necessário, ou "nenhuma">

## Pedido
O que a área de negócio pediu, nas palavras dela.

## Obstáculo plantado
O que vai dar errado no meio do caminho. É isso que gera aprendizado.
```
