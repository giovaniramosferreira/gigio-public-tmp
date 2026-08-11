# Desenho das rodadas

A base começa vazia. Isso não é um problema a contornar — é a rodada de controle.
Sem ela não existe com o que comparar depois.

## Rodada 0 — base vazia (controle)

Toda busca volta sem resultado. É assim que tem que ser.

**Mede:** tempo até a solução, número de caminhos mortos por tarefa, e a taxa de captura
(quantas tarefas com aprendizado real geraram proposta de entrada).

**O risco desta rodada é o maior de todo o projeto.** Quem busca, não acha nada e conclui
que o sistema é inútil não busca de novo. Por isso ela roda uma vez e nunca mais — e por
isso, na implantação real com gente de verdade, a base **não** começa vazia: quinze
entradas semeadas antes do treino. No estudo a gente roda vazia de propósito, para medir
exatamente o quanto essa semeadura vale.

**Só produz. Não consome.**

## Rodada 1 — primeira recuperação

A base agora tem o que a rodada 0 produziu. Tarefas parecidas, pessoas diferentes.

**Mede:** taxa de busca (o agente buscou antes de tentar?) e precisão da recuperação.

**A pergunta desta rodada:** a entrada que a Marina escreveu na rodada 0 é encontrável
pelo Diego? Se não for, o problema é o título — escrito como causa em vez de sintoma.

## Rodada 2 — dependência cruzada

Tarefas em que uma área só resolve se usar conhecimento gerado por outra. Nenhuma
coordenação explícita: ninguém avisa ninguém, ninguém manda link.

**Mede:** reuso entre departamentos. É o ponto inteiro do sistema.

**Falsifica H1** se nenhuma entrada cruzar fronteira de área.

## Rodada 3 — envenenamento (a rodada que importa)

Introduzir uma mudança de infraestrutura que **invalida** conhecimento correto da rodada 0.
Por exemplo: a solução de grant que o Eduardo registrou deixa de funcionar porque o
processo mudou.

Ninguém é avisado. As personas recebem tarefas que vão bater nessa entrada agora errada.

**Mede:** o sistema se autocorrige ou propaga o erro em escala?

Esta é a rodada decisiva, porque testa a assimetria perversa do desenho: um multiplicador
não escolhe sinal. Se o conhecimento certo se propaga instantaneamente para dez pessoas,
o errado também. Se ninguém marcar a entrada como obsoleta, o Colmeia acabou de fazer dez
pessoas errarem juntas mais rápido do que errariam sozinhas.

**Falsifica o projeto inteiro** se o erro se propagar por três ou mais personas sem
ninguém questionar.

## Rodada 4 — o custo do processo

Repetir tarefas da rodada 1 com a base madura, medindo o custo total do ciclo: buscar,
avaliar, registrar, revisar.

**Mede:** tempo de revisão por PR e taxa de ruído (propostas rejeitadas).

**Falsifica H2** se a revisão custar mais de dois minutos por PR — é o ponto em que o
Thiago para de contribuir sem avisar.

## Regra de leitura dos resultados

Um estudo que confirma todas as hipóteses é um estudo mal desenhado. O que a gente quer
saber é onde quebra, e a rodada 3 é onde deve quebrar.
