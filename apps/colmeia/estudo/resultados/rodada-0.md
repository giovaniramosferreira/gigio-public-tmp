# Rodada 0 — base vazia

**Executada em 11/08/2026.** Base de conhecimento vazia no início, por desenho.
Esta rodada mede produção de conhecimento, não recuperação.

## Tarefas

| Departamento | Tarefa | Entregue |
|---|---|---|
| Power BI / Analytics | Relatório sobre banco SQL aberto, versionado no repositório | Sim, como candidato não validado |
| Modelagem | Modelo de previsão sobre os mesmos dados | Sim, com ressalva de precisão |
| Marketing | Jornal da sprint a partir do que está no repositório | Sim |

## Métricas

| Métrica | Resultado | Leitura |
|---|---|---|
| Taxa de busca | 0% | Correto. Base vazia, não havia o que buscar |
| Precisão da recuperação | n/a | Nada foi recuperado |
| Taxa de captura | 7 entradas em 3 tarefas | Alta, como esperado numa rodada de descoberta |
| Ruído | 1 proposta rejeitada de 8 | 12,5% |
| Reuso entre departamentos | 0 | Esperado nesta rodada; é o teste da rodada 2 |
| Vazamento | 0 | Nenhum segredo ou dado real. Guarda testado com token e CPF plantados |

## A proposta que foi rejeitada

Rafael propôs registrar que `s.iloc[-k:-k+1]` com `k=1` devolve fatia vazia, porque índice
negativo não "dá a volta". É verdade e custou tempo. Foi rejeitada mesmo assim: é
comportamento documentado da linguagem, não conhecimento do nosso ambiente. Entra na
documentação da ferramenta, não na base do time.

**O critério funcionou na primeira oportunidade de falhar.** É o modo de falha previsto
para o Rafael, e ele apareceu exatamente onde a persona dizia que apareceria.

## Descobertas

**1. O formato padrão do Power BI é incompatível com o projeto.** PBIX é binário fechado:
não pode ser gerado por código, não gera diff no git e produz conflito irresolvível quando
duas pessoas editam. A migração para PBIP resolve os três, e essa decisão vale para todo
relatório futuro do time — não só para este.

**2. Agente não consegue validar o próprio entregável de Power BI.** Esta é a descoberta
mais importante da rodada, e ela vale para o projeto inteiro, não para esta tarefa. O
agente gerou TMDL e PBIR completos, validou sintaxe e schema, e ainda assim não pode
afirmar que abre — porque não existe Power BI Desktop no ambiente dele, e sintaxe válida
não garante carregamento.

Consequência de processo: **todo entregável que dependa de aplicativo proprietário para
validar é candidato, nunca pronto.** Precisa de um passo humano explícito antes do merge,
e quem revisar tem que reportar o erro literal da tela — é o único sinal que o agente não
consegue obter sozinho.

**3. Três dos sete aprendizados são de falha silenciosa.** Data lida no mês errado,
devolução apagada na limpeza, NaN propagado na série. Nenhum dos três levanta erro. Todos
os três produzem número plausível e errado. Isso sugere que a seção "O que NÃO funciona"
do template deveria ter uma irmã: **"como você sabe que deu errado"**. Fica como proposta
de mudança no template para a rodada 1.

**4. O placar ficou todo zerado, e está certo.** Sete entradas escritas, zero ponto para
todo mundo. Escrever não pontua — reuso pontua. Numa rodada sem consumo, ninguém pontua.
Se o placar tivesse premiado as sete entradas, o incentivo estaria medindo esforço em vez
de valor.

## Hipóteses

| # | Status | Observação |
|---|---|---|
| H1 — reuso cruza fronteira | não testada | Requer base populada. Rodada 2 |
| H2 — gate barra sem travar | indício favorável | 1 rejeição em 8, critério aplicado corretamente |
| H3 — busca tem precisão útil | não testada | Requer base populada. Rodada 1 |
| H4 — perfis resistentes aderem | não testada | Requer múltiplas rodadas |
| H5 — placar não infla volume | indício favorável | Proposta genérica do Rafael foi barrada |

## Limitação a declarar

Personas simuladas não têm o custo real de tempo, nem política de time, nem o cansaço de
sexta à tarde. Esta rodada mostra que o **mecanismo** produz conhecimento coerente. Não
mostra que a **adoção** acontece. Adoção só se mede com gente.

## Próxima rodada

Rodada 1: tarefas parecidas, pessoas diferentes, base agora com sete entradas. A pergunta
é se a entrada que o Bruno escreveu sobre devolução é encontrável pelo Diego — ou se o
título foi escrito de um jeito que ninguém acha.
