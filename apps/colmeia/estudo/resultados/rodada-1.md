# Rodada 1 — primeira recuperação

**Executada em 11/08/2026.** Base com 7 entradas produzidas na rodada 0.
Esta rodada mede recuperação: o que foi escrito é encontrável por quem não escreveu?

## Tarefas

| Persona | Departamento | Tarefa |
|---|---|---|
| Diego | Power BI | Relatório de devoluções por produto |
| Marina | Modelagem | Previsão mensal em vez de semanal |
| Patrícia | Marketing | Jornal da sprint |

## O achado principal: H3 foi falsificada, medida e corrigida

A busca foi testada com 14 consultas de resposta conhecida — 11 com resposta na base,
3 sem. O resultado da primeira medição:

| | Antes | Depois |
|---|---|---|
| Acerto no topo (11 consultas com resposta) | 55% | **91%** |
| Resposta errada com confiança (14 consultas) | **29%** | **0%** |
| Silêncio correto (3 consultas sem resposta) | 1 de 3 | **3 de 3** |

**29% de resposta errada com confiança falsifica H3**, cujo limite era 25%. E o erro
apareceu no caso mais previsível de todos: o Diego digitando "quantidade negativa na base
de vendas" recebeu de volta uma entrada sobre parse de data.

### Diagnóstico 1 — o título como sintoma é necessário e insuficiente

Um problema tem vários sintomas e só um cabe no título. O Bruno registrou "faturamento não
bate com o sistema origem". O Diego digitou "quantidade negativa na base". Mesma coisa,
vocabulários diferentes, encontro não acontecia.

**Correção:** campo `tambem_aparece_como` no frontmatter, com as outras formas em que o
mesmo problema aparece na tela. Pesa igual ao título na busca. Aplicado às 10 entradas.

### Diagnóstico 2 — não havia piso, então ruído virava resposta

Qualquer match fraco entrava no resultado. "erro de memória ao treinar rede neural"
recuperava a entrada sobre NaN em série temporal, com aparência de resposta.

**Correção:** piso de pontuação, abaixo do qual a resposta é silêncio; e regra de margem —
se o primeiro resultado não se separa do segundo, os dois são ruído e a busca devolve nada.

O erro caro é o falso positivo, não o silêncio. Silêncio custa o tempo de investigar do
zero. Falso positivo ancora o agente numa correção errada e custa mais.

## H1 confirmada: o reuso cruzou fronteira de área

Quatro reaproveitamentos, todos entre pessoas de departamentos diferentes, sem coordenação:

| Entrada | Autor | Quem usou | Área do autor → área de quem usou |
|---|---|---|---|
| NaN silencioso na série | Rafael | Marina | modelagem → modelagem |
| Série curta e sazonalidade | Larissa | Marina | modelagem → modelagem |
| Faturamento inflado por devolução | Bruno | Diego | eng. dados → Power BI |
| PBIP precisa de parâmetro | Diego | Thiago | Power BI → Power BI |

Duas das quatro cruzaram área. Ninguém mandou link, ninguém avisou — a pessoa buscou e achou.
As quatro foram promovidas de bronze a **ouro** por confirmação de terceiro.

## O placar deixou de ser zero — e do jeito certo

Bruno, Diego, Larissa e Rafael com 3 pontos cada, por reuso confirmado. Marina, Thiago,
Eduardo e Camila com zero, apesar de terem escrito.

**Marina escreveu a melhor entrada da rodada e ficou com zero pontos.** É o
comportamento correto do desenho: escrever não pontua, ser reusado pontua. Ela pontua
quando alguém usar. É também o momento de maior risco de rejeição do mecanismo — vale
observar se ela reclama disso na rodada 2.

## Descoberta secundária: o modelo burro venceu

No grão mensal, o baseline ingênuo (repetir o último valor) bateu todos os modelos de
suavização: MAPE 24% contra 27% do melhor concorrente. No grão semanal era o oposto.

Agregar reduz ruído e reduz pontos ao mesmo tempo, e existe um grão em que a troca deixa
de compensar. Virou entrada nova, escrita pela Marina.

## Métricas

| Métrica | Rodada 0 | Rodada 1 |
|---|---|---|
| Taxa de busca | 0% (base vazia) | 100% das tarefas |
| Acerto no topo | n/a | 55% → 91% após correção |
| Resposta errada com confiança | n/a | 29% → 0% após correção |
| Entradas novas | 7 | 1 |
| Reuso confirmado | 0 | 4 |
| Reuso cruzando área | 0 | 2 |
| Ruído (propostas rejeitadas) | 1 de 8 | 0 de 1 |
| Vazamento | 0 | 0 |

A queda de 7 para 1 entrada nova é esperada e saudável: a rodada de descoberta produz
muito porque tudo é novo. A partir daqui a métrica que importa não é escrita, é reuso.

## Hipóteses

| # | Status | Observação |
|---|---|---|
| H1 — reuso cruza fronteira | **confirmada** | 2 de 4 reusos cruzaram área, sem coordenação |
| H2 — gate barra sem travar | indício favorável | Nenhuma proposta ruim nesta rodada |
| H3 — busca tem precisão útil | **falsificada, depois corrigida** | 29% de erro caro; corrigido para 0% |
| H4 — perfis resistentes aderem | parcial | Marina contribuiu. Thiago ainda não reclamou do PR |
| H5 — placar não infla volume | indício favorável | Volume caiu, reuso subiu |

## Limitação — a mesma de sempre, e ela cresce

O conjunto de 14 consultas de teste foi escrito por quem também escreveu as entradas.
Isso infla a medida: vocabulário conhecido busca vocabulário conhecido. A medida honesta
exige consultas escritas por alguém que não viu a base. **Na implantação real, as
primeiras 20 buscas do time são o teste de verdade** — vale registrar todas, com o que
foi digitado e se achou.

Personas simuladas continuam não tendo custo de tempo, política ou cansaço.

## Próxima rodada

Rodada 2 aprofunda a dependência cruzada com tarefas que só resolvem com conhecimento de
outra área. Depois, a rodada 3 — envenenamento — que é onde isto deve quebrar.
