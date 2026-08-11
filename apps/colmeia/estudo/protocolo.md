# Protocolo do estudo de validação

## Pergunta

O fluxo de conhecimento compartilhado entre agentes sobrevive ao contato com um time real,
ou colapsa em uma das falhas previstas?

## Método

Dez personas (`estudo/personas/`) recebem tarefas de departamentos distintos. Cada persona
é encarnada por um agente com o bloco "Encarnação" do próprio arquivo, mais o `AGENTS.md`
e as skills do `colmeia-core`. As tarefas vêm em `estudo/tarefas/`.

A rodada tem três fases:

1. **Execução.** Cada persona trabalha na tarefa. Busca antes de tentar, registra depois.
2. **Cruzamento.** Personas de departamentos diferentes recebem tarefas que dependem de
   conhecimento gerado por outra. É aqui que o valor aparece — ou não.
3. **Revisão.** Curadoria dos PRs abertos, aplicando os critérios da skill `curar-conhecimento`.

## O que é medido

| Métrica | Como | Por quê |
|---|---|---|
| Taxa de busca | % de tarefas em que o agente buscou antes de tentar | Se não busca, nada mais importa |
| Precisão da recuperação | % de resultados recuperados que eram de fato aplicáveis | Recuperação errada é pior que nenhuma |
| Taxa de captura | % de tarefas com aprendizado real que geraram proposta | Mede o loop de escrita |
| Ruído | % de propostas rejeitadas na revisão | Alto = critério frouxo |
| Reuso entre departamentos | nº de entradas usadas por quem não escreveu | É o ponto inteiro do sistema |
| Vazamento | qualquer segredo ou dado real que passou pelo guarda | Tolerância zero |

## Hipóteses e critério de falsificação

| # | Hipótese | Falsifica se |
|---|---|---|
| H1 | O reuso entre departamentos acontece sem coordenação explícita | Nenhuma entrada cruzar fronteira de departamento |
| H2 | O gate de revisão barra conteúdo ruim sem travar o fluxo | Ruído acima de 40%, ou revisão custando mais de 2 min por PR |
| H3 | A busca por sintoma tem precisão útil | Mais de 1 em 4 recuperações inaplicáveis |
| H4 | Perfis resistentes (Marina, Thiago, Patrícia) aderem | Os três com zero contribuição ao fim da rodada |
| H5 | O placar por reuso não gera inflação de volume | Rafael com muitas entradas e nenhum reuso, sem correção |

**Um estudo que confirma todas as hipóteses é um estudo mal desenhado.** O objetivo é
descobrir onde quebra, não provar que funciona.

## Limitações — a serem declaradas no resultado

Personas simuladas não são pessoas. Elas não têm o custo real de tempo, não têm política
de time, não têm o cansaço de sexta à tarde. Este estudo testa se **o mecanismo** é
coerente — não se a **adoção** acontece. Adoção só se mede com gente.
