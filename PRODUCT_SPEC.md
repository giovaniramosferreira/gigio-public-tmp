# WinFit — Especificação de Produto (Documento-Mestre)

**Versão:** 1.0
**Data:** Julho 2026
**Status:** Fonte de verdade para product planning, design, engenharia, analytics, monetização e lançamento.
**Escopo:** MVP + visão de evolução (fases 2 e 3).

> **Nota de rigor:** este documento não cita estatísticas de mercado inventadas. Onde uma decisão depende de hipótese, ela está marcada como **[HIPÓTESE]**. Onde há alternativas viáveis, a recomendação está explícita com o racional.

---

# 1. Product Overview

## O que é

WinFit é um aplicativo mobile (iOS e Android) que monta, guia e evolui o treino de musculação do usuário — na academia ou em casa. Ele substitui três coisas que hoje convivem mal: a ficha genérica da academia, o caderninho/planilha de anotação de cargas e o personal trainer que a maioria não pode (ou não quer) pagar continuamente.

O produto tem três núcleos funcionais inseparáveis:

1. **Prescrição:** um gerador de plano de treino semi-determinístico que transforma respostas do onboarding (objetivo, nível, frequência, equipamento, tempo, limitações) em um plano semanal estruturado, com exercícios, séries, repetições e progressão definida.
2. **Execução:** um player de treino otimizado para uso durante o esforço físico — logging de séries em poucos toques, timer de descanso automático, substituição de exercício em contexto, persistência à prova de falha (fechar o app no meio do treino nunca perde dados).
3. **Evolução:** uma camada de acompanhamento e adaptação que registra carga, volume e consistência, celebra recordes pessoais, mostra progresso de forma tangível (gráficos, mapa muscular, resumo semanal) e ajusta o plano ao longo do tempo com regras explicáveis.

## Para quem é

Para quem treina (ou quer treinar) musculação sem orientação individual contínua: o iniciante que se sente perdido na academia, o intermediário que estagnou por falta de progressão estruturada, quem treina em casa com equipamento limitado, e quem está voltando depois de uma pausa. Mercado inicial: Brasil, experiência em PT-BR.

## Por que existe

O problema central não é falta de informação sobre treino — é excesso de informação sem estrutura aplicada ao caso individual. Entre o personal trainer (caro, dependente de agenda) e o treino improvisado (ineficiente, desmotivador), existe um vazio: orientação estruturada, individualizada e barata. O Befit e similares provaram que esse vazio é monetizável por assinatura. O WinFit existe para ocupar o mesmo espaço com execução superior: sessão de treino que nunca se perde, personalização que o usuário entende, paywall que não sabota a ativação, e retenção construída sobre progresso percebido em vez de gamificação vazia.

## Qual transformação gera

O usuário entra sem saber o que fazer na academia e, em semanas, tem: um plano que confia, um histórico que prova evolução (mais carga, mais volume, mais consistência) e um hábito sustentado por feedback concreto. A transformação vendável não é estética ("corpo dos sonhos") — é competência e progresso mensurável ("sei o que fazer, e está funcionando").

## Categoria mental

"Treinador inteligente de bolso" — na cabeça do usuário, o WinFit compete com o personal trainer e com a ficha da academia, não com apps de meditação ou contadores de passos. Categoria de loja: Health & Fitness, subcategoria workout planner + gym logger.

---

# 2. Market Thesis

## Comportamento do consumidor fitness (raciocínio qualitativo)

A tese se apoia em cinco observações comportamentais consistentes e verificáveis por qualquer pessoa que frequente academias no Brasil — não em estatísticas:

1. **A academia vende acesso, não orientação.** O modelo low-cost (Smart Fit e similares) massificou o acesso à academia no Brasil, mas o serviço incluído é uma ficha genérica montada em minutos por um instrutor sobrecarregado, raramente revisada. Milhões de pessoas têm onde treinar, mas não têm o quê nem como treinar bem. Essa é a lacuna estrutural que sustenta a categoria.

2. **Dor de orientação:** o iniciante não sabe montar treino, não sabe executar exercícios, e sente vergonha de perguntar. Resultado típico: copia o que vê, treina sem lógica, não vê resultado, desiste. A dor é real, recorrente e emocionalmente carregada (insegurança, constrangimento).

3. **Dor de consistência:** mesmo quem sabe treinar abandona. Os principais quebradores de hábito são ausência de feedback de progresso ("não sei se está funcionando"), fricção de decisão ("o que treino hoje?") e interrupções de rotina (viagem, doença, mudança de agenda) sem plano de retorno.

4. **Dor de progressão:** o intermediário que treina há 1–3 anos frequentemente estagna porque repete o mesmo treino com as mesmas cargas. Progressão exige registro e método — exatamente o que um app faz melhor que memória e papel.

5. **Limitação do personal trainer:** o personal resolve orientação e progressão, mas custa (no Brasil, tipicamente centenas de reais a mais de mil reais por mês — ordem de grandeza, não estatística), depende de agenda compatível e é geograficamente preso. O personal é o benchmark de valor, não o concorrente direto: o WinFit captura quem nunca pagaria personal e quem pagou e parou.

## Por que assinatura mobile funciona aqui

- **Uso recorrente natural:** treino acontece 3–5x por semana; o app tem motivo legítimo de abertura frequente, o que sustenta percepção contínua de valor (pré-condição para assinatura sobreviver).
- **Valor acumulativo:** o histórico de cargas e recordes cria custo de troca real. Quanto mais o usuário treina com o app, mais caro é sair.
- **Ancoragem de preço favorável:** contra personal (centenas de R$/mês) e contra a própria mensalidade da academia (~R$100–150), uma assinatura de R$20–30/mês é percebida como acessório barato de algo em que o usuário já investe.
- **Benchmark validado:** Befit, Hevy, Fitbod, MFIT e outros provam que o modelo freemium + assinatura funciona na categoria. A pergunta não é "existe mercado?", é "dá para executar melhor?".

## [HIPÓTESE] central da tese

A hipótese que o MVP precisa validar: **um plano gerado automaticamente, explicado com transparência e executado num logger confiável gera retenção de 4+ semanas suficiente para sustentar conversão freemium→premium em taxa viável para UA paga.** Tudo neste documento — onboarding, paywall, adaptação, analytics — está desenhado para testar e maximizar essa hipótese.

## Onde o Befit deixa espaço

Análise qualitativa das fraquezas recorrentes em apps dessa categoria (reclamações públicas em reviews de loja e padrões observáveis na concorrência — inferência estratégica, não auditoria formal):

- **Paywall agressivo antes do valor:** onboarding longo que desemboca em paywall antes do usuário ver o plano ou treinar uma vez. Mata ativação e envenena reviews.
- **Perda de dados de sessão:** logger que perde séries registradas quando o app é fechado, o telefone toca ou a conexão cai. Numa categoria onde o histórico É o produto, isso é falha existencial.
- **Personalização opaca:** o usuário responde 15 perguntas e recebe um plano sem entender a relação entre respostas e resultado. Sem explicação, o plano parece genérico — e o usuário trata como genérico.
- **Adaptação inexistente pós-geração:** o plano nasce e congela. Usuário evolui, plano não.

Cada uma dessas fraquezas vira um requisito de produto explícito nas seções 18–23.

---

# 3. Target Audience

Segmentação por comportamento e contexto de treino, não por demografia. Demografia (18–45, classes B/C, urbano) é alvo de mídia; os clusters abaixo são alvo de produto.

## Cluster 1 — Novato Inseguro
- **Quem:** nunca treinou sério ou treina há menos de 6 meses. Acabou de se matricular numa academia low-cost.
- **Comportamento:** entra na academia sem saber por onde começar. Faz esteira e 3 máquinas aleatórias. Evita a área de pesos livres por vergonha.
- **O que precisa do produto:** plano pronto e simples, instrução visual de execução, sensação de "estou fazendo certo".
- **Sensibilidade:** alta fricção de onboarding derruba; jargão técnico assusta; paywall antes do primeiro treino mata.
- **Peso estratégico:** maior volume de mercado, maior churn natural. É onde ativação e onboarding decidem o negócio.

## Cluster 2 — Praticante Sem Plano
- **Quem:** treina há 6 meses–3 anos, com regularidade razoável, mas sem estrutura: repete os mesmos treinos, não registra carga, progride devagar.
- **Comportamento:** conhece os exercícios, tem opinião sobre treino, consome conteúdo fitness em vídeo.
- **O que precisa:** progressão estruturada, registro rápido de cargas, prova de que está evoluindo.
- **Sensibilidade:** logger lento ou plano que parece "de iniciante" derruba. Quer controle: trocar exercício, ajustar volume.
- **Peso estratégico:** melhor perfil de retenção e conversão. É quem mais valoriza o histórico e os PRs. Público-âncora do premium.

## Cluster 3 — Recomeçante
- **Quem:** já treinou (às vezes por anos), parou por 6+ meses (trabalho, filhos, lesão, pandemia de motivação) e está voltando.
- **Comportamento:** superestima a própria capacidade, tenta voltar no volume antigo, sente dor, desiste de novo — ou tem medo exagerado e subtreina.
- **O que precisa:** plano de retorno progressivo, expectativa calibrada, reconhecimento de que "recomeçar" é um estado distinto de "começar".
- **Peso estratégico:** cluster subatendido pela concorrência (quase nenhum onboarding pergunta "você está voltando?"). Diferenciação barata e defensável no onboarding e no motor de geração.

## Cluster 4 — Treino em Casa
- **Quem:** treina em casa por economia, conveniência ou desconforto com academia. Equipamento varia de "nada" a "halteres ajustáveis + banco + elásticos".
- **O que precisa:** plano que respeita rigorosamente o equipamento disponível, progressões de peso corporal (quando não há carga para aumentar, progride-se por alavanca/reps/tempo), treinos com tempo enxuto.
- **Sensibilidade:** o pior erro possível é prescrever exercício que a pessoa não pode fazer. Um "supino com barra" para quem só tem elásticos destrói a credibilidade do gerador inteiro.
- **Peso estratégico:** amplia TAM e reduz dependência do contexto academia. O motor de equivalência de exercícios (seção 20) existe em grande parte por causa deste cluster.

## Cluster 5 — Otimizador de Tempo
- **Quem:** treina com janela curta (30–45 min no almoço, antes do trabalho). Frequentemente sobrepõe com clusters 2 e 4.
- **O que precisa:** treinos que cabem no tempo declarado, logging em segundos, zero navegação supérflua durante a sessão.
- **Peso estratégico:** valida o princípio de produto "velocidade de logging acima de tudo" (seção 8). Se o app é bom para quem tem 35 minutos, é bom para todos.

## Anti-persona (fora do alvo no MVP)
- **Atleta avançado/competidor:** quer periodização ondulatória, RPE por série, percentuais de 1RM. Atendê-lo no MVP infla complexidade e polui a UX dos clusters principais. Fica para fase 3, se fizer sentido.
- **Usuário de aula coletiva/cardio puro:** crossfit, spinning, corrida. Outra categoria de produto.

---

# 4. Core Problem

## Problema central

**Pessoas que querem resultado com musculação não têm um método individual, confiável e acessível para decidir o que treinar, executar bem e progredir — e por isso treinam mal, não veem resultado e desistem.**

## Subproblemas (cada um mapeia para um módulo do produto)

| # | Subproblema | Manifestação | Módulo que resolve |
|---|---|---|---|
| P1 | Não sabe montar treino | Ficha genérica, treino copiado, improviso | Gerador de plano (seç. 19) |
| P2 | Não sabe executar | Técnica errada, medo de lesão, vergonha | Biblioteca de exercícios com mídia (seç. 20) |
| P3 | Não sabe progredir | Mesma carga há meses, estagnação | Motor de progressão + registro (seç. 19, 22) |
| P4 | Não acompanha evolução | Sem registro, sem prova de resultado, desmotivação | Progress tracking (seç. 22) |
| P5 | Perde consistência | Quebra de rotina sem plano de retorno | Adaptação + CRM (seç. 23, 26) |
| P6 | Orientação individual é cara | Personal fora do orçamento | Modelo de assinatura (seç. 25, 29) |
| P7 | Fica perdido na academia | Ansiedade de decisão a cada sessão | Player de treino "abrir e seguir" (seç. 21) |

## O que NÃO é o problema (delimitação)

- Não é falta de motivação abstrata. Motivação é consequência de progresso percebido, não insumo. O produto não vende frases motivacionais; vende evidência de evolução.
- Não é dieta. Nutrição fica explicitamente fora do escopo do MVP (seção 12) — é outra competência, outro risco regulatório-percebido e outro ciclo de produto. Entra como candidato de fase 3.

---

# 5. Value Proposition

## Proposta principal

**"O WinFit monta seu treino, guia cada série e ajusta seu plano conforme você evolui — como um bom personal faria, por menos do que custa uma hora dele por mês."**

Essa formulação responde: o que faz (monta, guia, ajusta), como se diferencia de tracker (prescreve, não só registra), como se diferencia de ficha (evolui), e a âncora econômica (fração do personal).

## Camadas de valor

### Valor funcional
- Plano de treino individualizado em menos de 3 minutos de onboarding, com base em objetivo, nível, frequência, equipamento e tempo.
- Execução guiada: cada exercício com vídeo/animação, séries e reps prescritas, carga sugerida com base no histórico.
- Registro de série em ≤2 toques no caso comum (aceitar prescrição) — velocidade de logging como feature central.
- Progressão automática: quando o usuário cumpre a meta de reps, o app sugere aumento de carga na sessão seguinte (dupla progressão, seção 19).
- Histórico completo: cargas, volume, recordes, frequência, mapa muscular de estímulo semanal.
- Adaptação: plano se ajusta a faltas, trocas de equipamento, dor reportada e platôs.

### Valor emocional
- **Segurança:** "sei o que fazer quando entro na academia." Elimina a ansiedade de decisão e o constrangimento do novato.
- **Competência:** "estou treinando do jeito certo." A explicação da personalização (por que este plano, por que este exercício) transforma obediência em entendimento.
- **Prova de progresso:** "está funcionando." PRs celebrados, gráficos de carga subindo, resumo semanal. É o antídoto contra o churn por "não vejo resultado".

### Valor econômico
- Substituição parcial do personal: orientação estruturada por ~5–8% do custo mensal típico de um personal.
- Melhor ROI da mensalidade da academia já paga: "você já paga a academia; o WinFit faz esse dinheiro render."

## Propostas secundárias (por cluster)
- Novato: "Nunca mais entre na academia sem saber o que fazer."
- Praticante sem plano: "Pare de repetir treino. Progrida com método."
- Recomeçante: "Volte a treinar sem se machucar e sem começar do zero."
- Treino em casa: "Treino sério com o equipamento que você tem — inclusive nenhum."
- Otimizador de tempo: "Treino completo no tempo que você tem. 35 minutos contam."

---

# 6. Product Positioning

## Declaração de posicionamento

Para **quem treina ou quer treinar musculação sem orientação individual**, o WinFit é o **treinador de bolso** que **monta, guia e evolui seu treino de verdade** — diferente da ficha genérica da academia (que não é sua), dos apps de registro (que não te dizem o que fazer) e do personal trainer (que custa 20x mais), porque combina **prescrição individualizada explicável, execução guiada confiável e progressão automática baseada no seu histórico**.

## Mensagem-mestra e hierarquia de mensagens

**Mensagem-mestra:** "Treine com método. Veja o resultado nos números."

Hierarquia para marketing e loja (da mais concreta à mais aspiracional — nunca inverter):
1. **O que faz:** "Seu treino montado para você em 3 minutos. Academia ou casa."
2. **Como guia:** "Cada série registrada, cada descanso cronometrado, cada exercício com vídeo."
3. **Como prova:** "Veja sua carga subir semana a semana. Recordes, gráficos, evolução real."
4. **Âncora econômica:** "Orientação de verdade por menos de R$1 por dia."

## O que o posicionamento proíbe

- Slogans de transformação vaga ("transforme sua jornada", "desbloqueie seu potencial") — banidos do produto, da loja e da mídia.
- Promessas estéticas com prazo ("perca X kg em Y semanas") — risco de credibilidade e de política de loja.
- Enquadrar como "app de IA". A inteligência é meio, não mensagem. "IA" como promessa central gera expectativa de mágica e ceticismo simultaneamente. A personalização se prova mostrando o racional, não invocando a sigla.

---

# 7. Competitive Framing

O concorrente real do WinFit, em volume, não é outro app: é o improviso (treinar sem plano) e a ficha da academia. Apps são concorrentes na loja; improviso é concorrente na vida.

| Alternativa | Onde ela ganha | Onde o WinFit ganha | Cuidado estratégico |
|---|---|---|---|
| **Personal trainer** | Correção de técnica em tempo real, accountability humano, ajuste fino imediato | Preço (~5% do custo), disponibilidade 24/7, histórico de dados perfeito, sem dependência de agenda | Nunca prometer ser "igual a um personal" — prometer "o que um personal faz de método, sem o preço". Personal é âncora de valor, não inimigo declarado |
| **Ficha da academia** | Grátis, feita por humano presente | Individualização real, progressão automática (ficha congela por meses), registro integrado, funciona em qualquer academia ou em casa | A ficha é "boa o suficiente" para muita gente. O ataque certo: "quando foi a última vez que revisaram sua ficha?" |
| **Planilha/caderno** | Controle total, custo zero, flexível | Velocidade de logging, prescrição (planilha não pensa), timer, mídia de exercícios, gráficos automáticos | Usuários de planilha (cluster 2) são exigentes: se o logger for mais lento que o caderno, eles voltam para o caderno |
| **Tracker simples (ex.: Hevy free)** | Logging excelente, comunidade, grátis | Prescrição e progressão: tracker registra o que você decide; WinFit decide com você. Onboarding → plano é o diferencial inteiro | Precisamos ser ≥90% tão bons no logging quanto o melhor tracker, senão o cluster 2 não migra. Logging medíocre + prescrição boa perde para logging ótimo + prescrição nenhuma |
| **App fitness genérico / Befit** | Marca estabelecida, catálogo, UA rodando | Confiabilidade de sessão, paywall pós-valor, personalização explicável, adaptação contínua, recomeçante como cluster tratado | Não vencemos por lista de features — eles têm mais. Vencemos por execução dos 20% que importam: logger, plano, progressão, primeiro dia de uso |
| **Conteúdo grátis (YouTube/TikTok)** | Grátis, infinito, entretenimento | Estrutura e sequência: conteúdo informa, não prescreve nem acompanha. O usuário de YouTube ainda não sabe o que fazer HOJE, com O SEU equipamento, no SEU nível | Não competir por conteúdo. Usar criadores como canal (seção 28), não tentar ser mídia |

## Síntese competitiva

A aposta é ganhar em **profundidade dos 20% críticos** (plano → execução → progressão → prova de progresso), não em amplitude de catálogo de features. Toda decisão de escopo do MVP (seção 30) deriva disso.

---

# 8. Product Principles

Princípios são regras de desempate para decisões de design e engenharia. Cada um tem consequência prática declarada — princípio sem consequência é decoração.

1. **Confiabilidade é feature número um.** Perder uma série registrada é o pior bug possível — pior que crash. *Consequência:* persistência local write-through a cada toque no logger; sessão de treino sobrevive a fechamento de app, reboot e falta de rede; sync é assíncrono e invisível. Critério de aceite formal na seção 36.

2. **Velocidade de logging > riqueza de configuração.** Durante o treino, o usuário está suado, com foco fragmentado e o telefone na mão por 10 segundos entre séries. *Consequência:* caso comum (fez o prescrito) = 1 toque; ajuste de reps/carga = steppers grandes, sem teclado quando evitável; nenhuma feature pode adicionar toque ao caminho crítico do log sem aprovação explícita de produto.

3. **Personalização explicável > IA mágica.** O usuário só trata o plano como "seu" se entender por que ele é seu. *Consequência:* toda saída do gerador vem com racional legível ("4x/semana + hipertrofia + intermediário → divisão superior/inferior, porque..."); nunca usar "nossa IA calculou" como explicação.

4. **Valor antes de paywall.** O usuário vê o plano completo e treina pelo menos uma vez antes de qualquer pedido de dinheiro. *Consequência:* paywall posicionado após o preview do plano com trial, e nunca bloqueando o primeiro treino (detalhe na seção 25). Ativação é sagrada; monetização espera dias, não minutos.

5. **Retenção por progresso percebido, não por culpa.** Streaks e lembretes existem, mas o motor de retorno é "quero ver meu número subir". *Consequência:* notificações lideram com progresso e treino do dia, não com "você está falhando"; quebra de streak tem recuperação, não punição (seção 24).

6. **O plano se adapta à vida, não o contrário.** Faltas, viagens, mudança de equipamento e dor são estados normais do usuário, não exceções. *Consequência:* o motor de adaptação (seção 23) trata "3 faltas seguidas" como input de replanejamento, não como falha de engajamento.

7. **Clareza > completude.** Cada tela tem um trabalho. *Consequência:* Home responde "o que eu faço hoje?"; Progresso responde "está funcionando?"; qualquer conteúdo que não sirva ao trabalho da tela sai dela.

8. **PT-BR nativo, não traduzido.** Nomes de exercícios, microcopy e tom escritos por quem treina em academia brasileira ("remada curvada", "posterior de coxa", "treino de perna"), não localizados de template em inglês. *Consequência:* copy é disciplina de produto com dono, não etapa final de tradução.

---

# 9. Jobs To Be Done

## Jobs funcionais

- Quando **começo a treinar numa academia nova**, quero **um plano pronto e adequado ao meu nível**, para **não desperdiçar meus treinos nem depender do instrutor da recepção**.
- Quando **chego na academia**, quero **abrir o app e saber exatamente o que fazer, em que ordem e com que carga**, para **treinar sem decidir nada sob pressão**.
- Quando **termino uma série**, quero **registrá-la em um toque e saber quanto descansar**, para **manter o ritmo sem burocracia**.
- Quando **um equipamento está ocupado ou não existe na minha academia**, quero **um substituto equivalente na hora**, para **não pular o estímulo daquele músculo**.
- Quando **cumpro as metas de reps por algumas sessões**, quero **que o app me diga quando e quanto subir a carga**, para **progredir sem chutar**.
- Quando **treino em casa**, quero **um plano que use só o que eu tenho**, para **não abandonar por inviabilidade prática**.
- Quando **passo semanas treinando**, quero **ver provas objetivas de evolução**, para **decidir continuar com convicção**.

## Jobs emocionais

- Quando **entro na área de pesos livres**, quero **me sentir competente e com propósito**, para **não me sentir um impostor observado**.
- Quando **volto a treinar depois de meses parado**, quero **um recomeço que respeite meu estado atual**, para **não me machucar nem me frustrar na primeira semana**.
- Quando **bato um recorde pessoal**, quero **que isso seja reconhecido**, para **sentir que o esforço está pagando**.
- Quando **falho uma semana de treinos**, quero **um caminho de volta sem sermão**, para **não transformar uma falha em abandono**.

## Jobs sociais

- Quando **alguém pergunta como estou treinando**, quero **mostrar um método sério**, para **ser percebido como alguém disciplinado**.
- Quando **bato um PR relevante**, quero **compartilhar de forma que pareça conquista e não propaganda**, para **registrar socialmente meu progresso** (alimenta o growth loop da seção 28).

---

# 10. User Personas

Seis personas operacionais. Cada uma existe para decidir trade-offs concretos: quando design e engenharia divergirem, perguntar "isso ajuda ou atrapalha a Camila?" é mais útil que debater abstrações.

## Persona 1 — Camila, 24, Novata Insegura
- **Contexto:** analista júnior, matriculou-se na Smart Fit há 3 semanas. Vai 2–3x/semana, faz esteira + 4 máquinas que aprendeu no dia da ficha.
- **Objetivo declarado:** "tonificar, perder um pouco de gordura." Objetivo real: sentir-se confiante no próprio corpo e na academia.
- **Frustração:** a ficha que fizeram para ela tem nomes que ela não entende; tem vergonha de perguntar; sente que está "enrolando" na academia.
- **Comportamento digital:** consome fitness no TikTok/Instagram, nunca pagou app, desconfia de assinatura.
- **Barreiras:** jargão, telas densas, paywall precoce ("nem sei se vou continuar treinando").
- **Gatilho de conversão:** depois de 2–3 semanas vendo o próprio progresso ("agacho 10 kg a mais que no início"), o valor fica concreto. Trial anual com desconto no momento do primeiro resumo mensal.
- **Risco de churn:** altíssimo nas 2 primeiras semanas. Se o primeiro treino for confuso ou intimidador, não há segunda chance.
- **Decisões que ela força:** microcopy sem jargão, vídeo de execução em destaque, primeiro treino curto e de baixa fricção, paywall tardio.

## Persona 2 — Rafael, 31, Praticante Sem Plano
- **Contexto:** treina há 4 anos, 4x/semana, academia de bairro. Sabe executar, mas repete o mesmo ABC há mais de um ano. Anota cargas "de cabeça".
- **Objetivo:** ganhar massa, quebrar o platô do supino parado há 8 meses.
- **Frustração:** sabe que deveria progredir com método, mas planilha dá trabalho e ele não confia em "app de treino de iniciante".
- **Comportamento digital:** já usou Hevy grátis por 2 meses, abandonou por preguiça de montar as rotinas. Paga Spotify e streaming; pagaria app que prove valor.
- **Barreiras:** ceticismo com prescrição automática ("vai me mandar fazer rosca no banco Scott?"), logging lento.
- **Gatilho de conversão:** progressão automática + histórico de PRs. Quando o app sugerir aumento de carga fundamentado no histórico dele e funcionar, converte.
- **Risco de churn:** médio; se o plano parecer genérico ou o logger for mais lento que a memória, sai. Se ficar, fica anos (âncora de LTV).
- **Decisões que ele força:** troca de exercício livre, edição do plano, densidade de dados no Progresso, respeito pelo nível declarado.

## Persona 3 — Marcos, 38, Recomeçante
- **Contexto:** gerente, dois filhos. Treinou sério dos 22 aos 30. Parou. Terceira tentativa de volta em 2 anos: as duas anteriores morreram em menos de um mês (semana 1 no volume antigo → dor absurda → "semana que vem eu volto").
- **Objetivo:** voltar a ter constância, perder 8 kg, "não virar o pai sedentário".
- **Frustração:** o ego lembra do corpo de 28; o corpo discorda. Fichas e apps o tratam como iniciante (humilhante) ou como ativo (perigoso).
- **Barreiras:** tempo (janela de 45 min), autossabotagem por comparação com o passado.
- **Gatilho de conversão:** o onboarding perguntar "você está voltando depois de uma pausa?" e o plano refletir isso. Sentir-se compreendido é o gatilho — converte cedo se o produto acertar esse tom.
- **Risco de churn:** concentrado na semana 2–3 (quando a dor muscular encontra a agenda). Notificação de recuperação de rotina (seção 26) existe para ele.
- **Decisões que ele força:** estado "recomeçante" no onboarding e no gerador (volume inicial reduzido com rampa), planos de 30–45 min, mensagens de retorno sem culpa.

## Persona 4 — Juliana, 29, Treino em Casa
- **Contexto:** designer freelancer, treina na sala: halteres ajustáveis até 20 kg, elásticos, colchonete. Sem intenção de ir à academia.
- **Objetivo:** hipertrofia glúteo/inferiores, manter braços e core.
- **Frustração:** apps mandam exercícios com equipamento que ela não tem; vídeos de YouTube não têm progressão — "hoje treino braço com a Grow with Jo, amanhã sei lá".
- **Barreiras:** limite real de carga (20 kg) exige progressão por reps/tempo/alavanca, que quase nenhum app faz direito.
- **Gatilho de conversão:** um plano 100% executável com o inventário dela, com progressão visível mesmo sem adicionar carga.
- **Risco de churn:** instantâneo se aparecer um exercício inviável. Tolerância zero.
- **Decisões que ela força:** inventário de equipamento granular no onboarding, motor de equivalência rigoroso, progressões calistênicas no catálogo.

## Persona 5 — Fernando, 42, Otimizador de Tempo
- **Contexto:** diretor comercial, viaja 1 semana por mês. Treina na academia do prédio (equipada, vazia) das 6h30 às 7h10. 40 minutos, cronometrados.
- **Objetivo:** manter força e composição corporal com o mínimo de tempo. Eficiência é o objetivo.
- **Frustração:** planos de 60–75 min não cabem; cortar exercícios por conta própria destrói a lógica do treino.
- **Gatilho de conversão:** o app gerar treino que cabe em 40 min de verdade (contando descansos) e se adaptar nas semanas de viagem (plano de hotel: halteres + peso corporal). Converte rápido — dinheiro não é a barreira, confiança é.
- **Risco de churn:** baixo se o produto cumprir o tempo prometido. Ele é o melhor pagador de anual.
- **Decisões que ele força:** tempo-alvo como restrição dura do gerador (com estimativa de duração por exercício + descansos), troca rápida de contexto de equipamento ("modo viagem").

## Persona 6 — Beatriz, 21, Universitária Econômica
- **Contexto:** estudante, academia da faculdade. Treina 3x/semana com amigas. Orçamento apertado.
- **Objetivo:** hipertrofia estética, seguir o que está em alta, compartilhar progresso.
- **Comportamento:** heavy user do free tier; compartilha treino e PRs em stories; traz amigas.
- **Gatilho de conversão:** baixo no curto prazo — o papel dela no negócio é distribuição (compartilhamento, indicação), não receita imediata. Converte em anual com desconto estudantil ou promo sazonal, se converter.
- **Risco de churn:** alto e sazonal (provas, férias).
- **Decisões que ela força:** free tier genuinamente utilizável (seção 25), cards de compartilhamento bonitos (seção 28), programa de indicação.

---

# 11. User Pains and Motivations

## Mapa dor → motivação → resposta do produto

| Dor (verbatim plausível) | Motivação subjacente | Resposta do produto | Onde aparece |
|---|---|---|---|
| "Não sei o que fazer quando chego lá" | Competência, evitar constrangimento | Treino do dia na Home, ordem definida, player guiado | Home, Player |
| "Não sei se estou fazendo certo" | Segurança, medo de lesão | Vídeo/animação por exercício, dicas de execução, erros comuns | Player, Biblioteca |
| "Faço sempre a mesma coisa e nada muda" | Progresso, retorno do esforço | Dupla progressão automática, alerta de platô, variação planejada de ciclo | Gerador, Adaptação |
| "Não tenho prova de que melhorei" | Validação, decisão de continuar | PRs, gráficos de carga/volume, resumo semanal, mapa muscular | Progresso, Notificações |
| "Perdi o ritmo e não consigo voltar" | Identidade ("sou alguém que treina") | Replanejamento pós-falta, plano de retorno, mensagem sem culpa | Adaptação, CRM |
| "Personal é caro demais" | Custo-benefício | Assinatura ~R$25/mês ancorada contra personal | Paywall, marketing |
| "A máquina está sempre ocupada" | Fluidez do treino | Substituto equivalente em 2 toques, filtrado pelo equipamento do local | Player |
| "Anotar treino é um saco" | Mínimo esforço | Log em 1 toque no caso comum, valores pré-preenchidos do histórico | Player |
| "App me mandou fazer exercício que não tenho como fazer" | Confiança no sistema | Inventário de equipamento como restrição dura do gerador | Onboarding, Gerador |
| "Toda hora o app quer que eu pague" | Respeito, controle | Paywall pós-valor, free tier funcional, pedido de pagamento com contexto | Paywall |

## Hierarquia de motivações (para priorizar mensagens)

1. **Progresso visível** — a motivação mestra; sustenta retenção e conversão.
2. **Competência/segurança** — domina as primeiras 2 semanas (ativação).
3. **Eficiência** — domina a decisão diária de abrir o app ou não.
4. **Identidade** — domina o longo prazo ("sou uma pessoa que treina") e o social.

Regra prática: mensagens de ativação falam de competência ("saiba exatamente o que fazer"); mensagens de retenção falam de progresso ("sua carga no agachamento subiu 15%"); mensagens de conversão falam de eficiência + progresso; mensagens de brand falam de identidade.

---

# 12. Product Scope

## In scope — MVP (v1.0)

| Área | Incluído |
|---|---|
| Auth | Cadastro/login e-mail + Apple + Google; sessão persistente; recuperação de senha |
| Onboarding | Fluxo completo de 9 passos → parâmetros do plano; preview do plano; estado "recomeçante" |
| Gerador de plano | Motor semi-determinístico baseado em templates parametrizados (seção 19); regeneração ao mudar parâmetros |
| Catálogo | ~250 exercícios PT-BR com vídeo curto/animação, músculos, instruções, equivalências (seção 20) |
| Player de treino | Sessão ativa com log de séries, timer de descanso, substituição, pular, retomar, autosave local (seção 21) |
| Progresso | Histórico de sessões, gráficos de carga por exercício, PRs, volume semanal, frequência, mapa muscular simples |
| Progressão | Dupla progressão automática (sugestão de carga por exercício) |
| Assinatura | Freemium + premium mensal/anual via RevenueCat; trial 7 dias; paywall pós-preview |
| Notificações | Push: treino do dia, plano não iniciado, PR, resumo semanal, win-back básico (seção 26) |
| Analytics | Taxonomia completa da seção 27 desde o dia 1 |
| Offline | Treino executável e logável 100% offline; sync ao reconectar |

## Later phase (v1.1+, fase 2, fase 3 — detalhado na seção 31)

- Medidas corporais e fotos de progresso (v1.1)
- Deload automático e detecção de platô (v1.1–v1.2)
- Cards de compartilhamento de PR e programa de indicação (v1.2)
- Apple Health / Health Connect (fase 2)
- Wearables e timer no relógio (fase 2)
- Programas fechados de treino (fase 2)
- Social leve / treino com amigos (fase 3)
- Nutrição (candidato fase 3, decisão adiada)
- Internacionalização (fase 3)

## Out of scope (decisão explícita, não esquecimento)

- **Nutrição no MVP:** outra competência, outro conteúdo, outro risco. Diluiria o foco do diferencial (treino).
- **Marketplace de personal / chat com humano:** modelo operacional distinto (supply-side); só faz sentido com base de usuários.
- **Feed social aberto:** custo de moderação e frieza de rede vazia. Social no WinFit começa assimétrico (compartilhar para fora) e privado (amigos), nunca feed público no MVP.
- **Aulas em vídeo longas / treino guiado por voz contínua:** categoria "fitness content" (Nike Training Club), não a nossa.
- **Periodização avançada para atletas (RPE, %1RM, blocos):** anti-persona no MVP.
- **Web app para o usuário final:** mobile-first; web só para landing/SEO e admin.

---

# 13. Functional Modules

| Módulo | Responsabilidade | Depende de | Criticidade MVP |
|---|---|---|---|
| **M1. Auth & Profile** | Identidade, sessão, dados de perfil, preferências | — | Alta |
| **M2. Onboarding** | Coleta de parâmetros, cálculo do perfil de treino, handoff para gerador | M1 (pode rodar antes do cadastro — ver seção 18) | Alta |
| **M3. Plan Generator** | Templates → plano personalizado; regeneração; explicação do racional | M2, M5 | Alta |
| **M4. Workout Player/Logger** | Sessão ativa, logging, timer, substituições, persistência | M3, M5 | Altíssima (coração do produto) |
| **M5. Exercise Database** | Catálogo, taxonomia, mídia, equivalências, busca | Admin (M10) | Alta |
| **M6. Progress Analytics** | Agregações de histórico, PRs, gráficos, resumo semanal | M4 | Alta |
| **M7. Adaptation Engine** | Regras de progressão, resposta a faltas/dor/mudanças, deload (fase 2) | M4, M6, M3 | Média no MVP (só progressão), alta na fase 2 |
| **M8. Subscription & Paywall** | Entitlements, trial, compra, restore, gating de features | M1 | Alta |
| **M9. Notifications & CRM** | Push/e-mail/in-app orientados a eventos | M4, M6, M8 | Média |
| **M10. Admin & Content Ops** | CMS de exercícios e templates, painel de suporte, flags | — | Média (mínimo viável interno) |

Fronteira arquitetural importante: **M4 (player) nunca depende de rede**. Ele lê plano e catálogo do cache local e escreve logs localmente; M6 e o sync consomem depois. Essa fronteira é o que garante o princípio 1.

---

# 14. Detailed Feature Specification

Formato: nome, objetivo, descrição, inputs, outputs, regras de negócio, estados, exceções, dependências, impacto no negócio, prioridade (P0 = MVP obrigatório, P1 = MVP desejável, P2 = pós-MVP).

## F1. Cadastro e login — P0
- **Objetivo:** identidade com fricção mínima; nunca perder dados de onboarding feitos antes do cadastro.
- **Descrição:** Sign in with Apple (obrigatório na App Store), Google e e-mail/senha. Cadastro acontece **depois** do onboarding e do preview do plano (seção 18) — o plano é o incentivo para criar conta.
- **Inputs:** provedor OAuth ou e-mail+senha; dados de onboarding em storage local anônimo.
- **Outputs:** usuário autenticado; merge do perfil anônimo local no perfil remoto.
- **Regras:** conta anônima local criada no first open (device-scoped UUID); no cadastro, migrar tudo (respostas, plano, sessões eventuais). Se e-mail já existe, fluxo de login + decisão de merge (manter dados remotos, oferecer manter plano local se mais recente).
- **Estados:** anônimo, autenticado, sessão expirada (re-auth silenciosa via refresh token; nunca deslogar no meio de treino).
- **Exceções:** falha de OAuth → fallback e-mail; sem rede no cadastro → permitir continuar anônimo e tentar depois (banner discreto "seus dados estão só neste aparelho").
- **Impacto no negócio:** cada ponto de fricção aqui reduz ativação; cadastro pós-valor aumenta taxa de conclusão do onboarding.

## F2. Onboarding de perfil de treino — P0
Detalhado na seção 18. Resumo: 9 passos, ~2,5 min, coleta objetivo, experiência, estado (novo/ativo/recomeçante), frequência, tempo, local/equipamento, limitações, dados corporais básicos, preferências. Output: `TrainingProfile` completo → gerador.

## F3. Geração de plano — P0
Detalhado na seção 19. Resumo: `TrainingProfile` → `TrainingPlan` (divisão semanal, dias, exercícios, séries×reps, descansos, regra de progressão), com racional explicável por dia e por exercício.

- **Regras-chave:** geração local e determinística (mesmo input → mesmo output, com seed para variação); tempo de geração < 2 s percebidos; nenhum exercício fora do inventário de equipamento; regeneração preserva histórico (plano antigo arquivado, nunca deletado).
- **Exceções:** combinação de parâmetros sem template ideal (ex.: 6x/semana iniciante) → degradar para template válido mais próximo + explicar ("para seu nível, 4 dias bem executados rendem mais que 6").

## F4. Preview do plano — P0
- **Objetivo:** materializar o valor antes do cadastro e do paywall; é o clímax do onboarding.
- **Descrição:** tela que mostra a semana completa (divisão, dias, duração estimada, músculos por dia) + racional ("Montamos assim porque você escolheu X, Y, Z") + amostra expandível do primeiro treino.
- **Regras:** 100% visível no free e antes do cadastro; CTA principal "Salvar meu plano" → cadastro; pós-cadastro → oferta de trial (paywall soft, dispensável).
- **Impacto:** é a tela de maior alavancagem de ativação do produto inteiro.

## F5. Home / Treino do dia — P0
- **Objetivo:** responder "o que eu faço hoje?" em menos de 1 segundo de leitura.
- **Descrição:** card dominante do treino do dia (nome, músculos, nº de exercícios, duração estimada, CTA "Começar treino"); abaixo: streak semanal (bolinhas seg–dom), próximo treino, último PR.
- **Estados:** dia de treino (card ativo); dia de descanso (card "Descanso programado" + opção "treinar mesmo assim" → escolher treino da semana); sessão em andamento (card vira "Continuar treino — 4/8 exercícios"); plano concluído na semana (card de parabéns + antecipação da próxima semana); sem plano (empty state → onboarding/regeração).
- **Exceções:** usuário abre em dia sem treino após 3 faltas → card de replanejamento (seção 23).

## F6. Player de treino — P0
Detalhado na seção 21. Coração do produto. Resumo das regras críticas:
- Log do caso comum em 1 toque (✓ na série = aceita reps e carga sugeridas).
- Timer de descanso auto-inicia ao logar série; notificação local quando acaba (funciona com app em background/tela bloqueada).
- Toda mutação persiste localmente de forma síncrona antes do feedback visual.
- Substituição de exercício em contexto: 2 toques até a lista de equivalentes filtrada por equipamento.
- Sessão inacabada retomável por 8 h; depois, oferta de "salvar parcial" ou descartar.

## F7. Timer de descanso — P0
- **Inputs:** descanso prescrito por exercício (default por tipo: composto pesado 120–180 s, acessório 60–90 s, isolado 45–60 s); ajuste manual ±15 s persistente por exercício.
- **Regras:** inicia automático no log da série (configurável); roda em background com notificação local no fim (som/vibração); pular timer = 1 toque; timer visível no player e em Live Activity/notificação persistente (iOS Live Activities em v1.1; notificação com chronometer no Android desde v1).
- **Exceções:** permissão de notificação negada → timer só in-app + aviso único explicando o benefício.

## F8. Substituição de exercício — P0
- **Objetivo:** resolver "máquina ocupada / não tem esse aparelho / não gosto" sem quebrar o estímulo do treino.
- **Inputs:** exercício atual, motivo (opcional: ocupado / não tenho / desconforto / prefiro outro), inventário de equipamento do contexto.
- **Outputs:** lista ranqueada de equivalentes (mesmo padrão de movimento e músculo primário — seção 20); troca aplicável só hoje ou permanentemente no plano.
- **Regras:** motivo "desconforto/dor" alimenta o motor de adaptação (evitar padrão similar, sugerir avaliação — seção 23); troca permanente re-explica o racional; livre no free (restringir substituição seria monetizar a frustração — decisão de princípio).

## F9. Histórico e gráficos de progresso — P0
Detalhado na seção 22. MVP: lista de sessões concluídas, gráfico de carga máxima e de volume por exercício, PRs, frequência semanal, mapa muscular de volume semanal (visual simples de calor por grupo).

## F10. Recordes pessoais (PR) — P0
- **Regras:** PR detectado no log da série (maior carga no exercício para ≥ reps X; maior e1RM estimado via fórmula de Epley — usado só como índice interno de comparação, exibido como "melhor marca"); celebração inline no player (discreta — usuário está treinando) + destaque no fim do treino; feed de PRs na aba Progresso.
- **Exceções:** primeiras 2 semanas geram PRs triviais em cascata → PRs só a partir da 2ª sessão de um exercício, e celebração forte só para PRs com ≥3 sessões de histórico.

## F11. Resumo pós-treino — P0
- **Descrição:** ao encerrar sessão: duração, volume total, séries concluídas, PRs da sessão, comparação com a última execução do mesmo treino ("+2,5 kg no supino"). CTA: fechar; secundário: compartilhar (v1.2), nota do treino (RPE simples 1–5 emoji — input para adaptação).
- **Impacto:** é o momento de pico emocional; ponto ideal para pedir review de loja (após 3º treino concluído com PR, no máximo 1x — seção 37).

## F12. Assinatura e paywall — P0
Detalhado na seção 25. Resumo: free funcional (plano gerado + player + histórico limitado), premium destrava profundidade (gráficos completos, adaptação, regeneração ilimitada, mapa muscular, resumo semanal rico); trial 7 dias; RevenueCat; restore.

## F13. Notificações — P0 (conjunto básico)
Detalhado na seção 26.

## F14. Regeneração / edição de plano — P0 (regeneração), P1 (edição fina)
- **Regras:** mudar qualquer parâmetro (frequência, local, objetivo, tempo) → regeração com diff explicado ("Seu novo plano tem 3 dias em vez de 4; agrupamos peito e ombro"); plano anterior arquivado com histórico intacto; edição manual de exercícios individuais (reordenar, remover, adicionar) em P1 — o Rafael (persona 2) precisa disso cedo.
- **Free vs premium:** 1 regeneração completa/mês no free; ilimitada no premium. Substituição de exercício sempre livre.

## F15. Medidas corporais e fotos — P2 (v1.1)
Peso, medidas (cintura, quadril, braço, coxa, peito), fotos privadas com comparador lado a lado. Fotos: storage criptografado, nunca em backup social, disclaimers claros.

## F16. Modo viagem / troca de contexto — P1
- **Descrição:** perfil de equipamento alternativo ("hotel: halteres leves + peso corporal"); alternância em 2 toques gera versão adaptada do treino do dia sem tocar no plano principal.
- **Racional:** ataca diretamente o churn por quebra de rotina (Fernando, Marcos). Barato de construir sobre o motor de equivalência.

---

# 15. User Flows

## Fluxo 1 — First open → primeiro treino concluído (fluxo de ativação, o mais importante do produto)

1. **First open** → splash → 2 telas de proposta de valor (o que o app faz, sem pedir nada) → CTA "Montar meu treino".
2. **Onboarding** (9 passos, seção 18) — sem cadastro, progresso salvo localmente a cada passo.
3. **Geração** — tela de construção (1,5–2 s, mostra os parâmetros sendo "aplicados": "Ajustando ao seu equipamento… Distribuindo volume em 4 dias…"). Honesta: o tempo é real de processamento + carregamento de mídia, não teatro vazio; se levar 300 ms, mostrar 1,2 s mínimo para dar peso à personalização. **[Trade-off assumido: micro-teatro de 1 s a favor da percepção de personalização.]**
4. **Preview do plano** (F4) → "Salvar meu plano".
5. **Cadastro** (Apple/Google/e-mail) → merge do perfil anônimo.
6. **Oferta de trial** (paywall soft, dispensável com "Agora não" visível — seção 25).
7. **Home** com treino do dia em destaque → "Começar treino".
8. **Player**: primeiro treino tem tooltips únicos (como logar, como funciona o timer, como substituir) — máximo 3, nunca repetidos.
9. **Encerrar** → resumo pós-treino → Home atualizada (streak 1/semana).
10. **Push D+1** (se permitido): "Seu treino de amanhã está pronto: Inferiores, 45 min."

Métricas do fluxo: conclusão de onboarding, tempo até plano, taxa preview→cadastro, cadastro→primeiro treino iniciado, iniciado→concluído. Metas na seção 37.

## Fluxo 2 — Treino recorrente (dia típico)
Abrir app → Home mostra treino do dia → Começar → player pré-carregado (plano + mídia em cache) → logar séries → timer entre séries → eventual substituição → encerrar → resumo → sync em background.

Requisito de fluidez: da abertura do app ao primeiro exercício pronto para logar, ≤ 3 toques e ≤ 4 segundos.

## Fluxo 3 — Replanejamento (mudança de vida)
Perfil → "Meu plano" → "Ajustar plano" → editar parâmetros (frequência/local/tempo/objetivo) → regeneração com diff explicado → confirmação → plano anterior arquivado. Alternativa de entrada: card contextual na Home quando o motor de adaptação detecta desalinhamento (3+ faltas, seção 23).

## Fluxo 4 — Troca de exercício durante o treino
No player, no card do exercício → ícone trocar → lista de equivalentes (filtrada por equipamento, ranqueada por similaridade) → escolher → "Só hoje" ou "Sempre" → volta ao player com histórico do novo exercício carregado (se houver).

## Fluxo 5 — Upgrade para premium
Gatilhos de entrada: (a) fim do trial; (b) toque em feature bloqueada (gráfico avançado, 2ª regeneração no mês, mapa muscular); (c) momentos de pico de valor (pós-PR, resumo semanal). Fluxo: paywall contextual (headline referencia o que o usuário tentou fazer) → planos mensal/anual com ancoragem → compra nativa → confirmação → retorno exato ao ponto de origem com a feature destravada. Nunca redirecionar para a Home após compra.

## Fluxo 6 — Retomada após abandono
- **7 dias sem treino:** push "Seu plano continua aqui. Quer retomar de onde parou ou recomeçar mais leve?" → deep link para tela de retomada com 2 opções: continuar plano / gerar semana de readaptação (volume reduzido).
- **21+ dias:** e-mail win-back com resumo do que ele conquistou ("você chegou a X kg no supino") + retomada em 1 toque.
- **Regra de tom:** nunca culpa, sempre porta aberta. Detalhes na seção 26.

## Fluxo 7 — Sessão interrompida
App fechado/crash/bateria no meio do treino → próxima abertura em ≤ 8 h: Home mostra "Continuar treino (4/8 exercícios)" → player restaura exatamente onde parou (série, timer descartado). Após 8 h: modal "Você não terminou Superiores A ontem" → salvar como parcial (conta no histórico com flag) ou descartar.

---

# 16. Information Architecture

## Navegação principal: 4 tabs + player modal

```
┌─────────────────────────────────────────────┐
│  Home  │  Progresso  │  Biblioteca  │ Perfil │
└─────────────────────────────────────────────┘
          Player de treino = fullscreen modal
          sobreposto (não é tab; tem presença
          persistente via mini-bar quando ativo)
```

**Decisão: 4 tabs, não 5.** Alternativa considerada: tab "Treino" separada da Home. Rejeitada: a Home É o treino do dia (princípio 7); duplicar cria ambiguidade de "onde começo meu treino". O plano completo mora dentro da Home (seção "Minha semana") e do Perfil ("Meu plano").

- **Home:** treino do dia, semana atual, streak, continuar sessão, cards contextuais de adaptação. Trabalho da tela: "o que eu faço hoje?"
- **Progresso:** dashboard (volume, frequência, PRs recentes, mapa muscular), histórico de sessões, gráficos por exercício, resumo semanal. Trabalho: "está funcionando?"
- **Biblioteca:** busca e navegação do catálogo por grupo muscular/equipamento/padrão; detalhe de exercício (mídia, instrução, histórico pessoal). Trabalho: "como faz / o que existe?"
- **Perfil:** dados, meu plano (ver/ajustar/regenerar), equipamentos, assinatura, notificações, suporte. Trabalho: "configurar e gerenciar".

**Player como modal fullscreen:** durante sessão ativa, mini-bar persistente acima da tab bar (nome do treino, timer se rodando, "Continuar") em qualquer tab — padrão player de música. Garante que navegar para a Biblioteca no meio do treino (ver execução de um exercício) nunca "perde" a sessão.

## Hierarquia completa

```
Home
├── Treino do dia → Player (modal)
├── Minha semana (dias da semana, estado de cada)
├── Card contextual (adaptação/retomada, quando aplicável)
Progresso
├── Dashboard (padrão)
├── Histórico de sessões → Detalhe da sessão
├── Exercícios → Gráfico por exercício (carga, volume, histórico de sets)
├── PRs (lista)
└── Resumo semanal (premium)
Biblioteca
├── Busca + filtros (músculo, equipamento, padrão)
├── Grupos musculares → lista → Detalhe do exercício
Perfil
├── Meu plano → visualizar / ajustar parâmetros / regenerar / arquivo de planos
├── Equipamentos (perfis: academia / casa / viagem)
├── Assinatura (status, upgrade, restore)
├── Notificações (granular por tipo)
├── Dados pessoais / conta / privacidade / exportar dados / excluir conta
└── Ajuda e suporte
```

---

# 17. Screen-by-Screen App Structure

Para cada tela: objetivo, componentes, CTAs, estados. Telas do onboarding detalhadas na seção 18; player na 21.

## S1. Splash + Value Intro (2 telas)
- **Objetivo:** setar expectativa em ≤10 s e levar ao onboarding.
- **Conteúdo:** tela 1 — "Seu treino, montado para você" + visual do plano; tela 2 — "Registre, progrida, veja resultado" + visual do gráfico de carga. Skippável.
- **CTA principal:** "Montar meu treino" · **Secundário:** "Já tenho conta" (login).
- **Estados:** só default. Sem rede: segue normal (onboarding é local).

## S2–S10. Onboarding — ver seção 18.

## S11. Geração do plano (transitória)
- **Objetivo:** dar peso à personalização; mascarar carregamento real.
- **Conteúdo:** checklist animado dos parâmetros aplicados. Duração 1,2–2,5 s.
- **Erro:** falha de geração (não deveria ocorrer — é local) → retry automático 1x → fallback template padrão do objetivo + log de erro para telemetria.

## S12. Preview do plano
- **Objetivo:** provar valor; converter para cadastro.
- **Componentes:** header com resumo ("4 treinos/semana · Superiores/Inferiores · ~50 min"); card de racional expandível ("Por que este plano?" — 3 bullets ligando respostas a decisões); lista dos dias com músculos e duração; primeiro treino expandível exercício a exercício.
- **CTA principal:** "Salvar meu plano" → cadastro. **Secundário:** "Ajustar respostas" (volta ao onboarding com respostas preservadas).
- **Estados:** default apenas. É a tela mais importante do funil — sem paywall, sem cadastro forçado antes dela.

## S13. Cadastro / Login
- **Componentes:** Apple, Google, e-mail. Microcopy: "Crie sua conta para não perder seu plano."
- **Erro:** OAuth falhou → toast + alternativas; e-mail existente → fluxo login/merge (F1).

## S14. Oferta de trial (paywall soft pós-cadastro)
- **Objetivo:** apresentar premium sem bloquear; capturar high-intent cedo.
- **Componentes:** timeline do trial (hoje: tudo liberado → dia 5: lembrete → dia 7: cobrança), preço anual em destaque com equivalente mensal, mensal como alternativa; lista curta do que é premium; **"Agora não" sempre visível no primeiro scroll** (regra dura — seção 25).
- **Estados:** compra ok → confirmação → Home; dispensa → Home igual (free).

## S15. Home
- **Componentes:** saudação + data; card do treino do dia (dominante, ~40% da viewport); "Minha semana" (7 slots com estado: concluído ✓ / hoje / futuro / perdido); card de PR ou insight recente; card contextual de adaptação (condicional).
- **CTA principal:** "Começar treino". **Secundários:** ver semana, ver treino sem iniciar.
- **Estados:** descrito em F5 (dia de treino / descanso / sessão em andamento / semana concluída / sem plano / pós-faltas).
- **Loading:** conteúdo local — skeleton ≤300 ms apenas no cold start.

## S16. Detalhe do treino (pré-início)
- **Objetivo:** deixar o usuário inspecionar antes de começar (reduz ansiedade do novato; dá controle ao intermediário).
- **Componentes:** lista de exercícios (mídia thumbnail, séries×reps, carga sugerida), duração estimada, músculos, botão de trocar exercício já disponível aqui.
- **CTA:** "Começar treino". Secundário: "Trocar exercícios".

## S17. Player de treino — detalhado na seção 21.

## S18. Resumo pós-treino — descrito em F11.

## S19. Progresso (dashboard)
- **Componentes:** seletor de período (semana/mês/3 meses); cards: treinos concluídos vs. meta, volume total, PRs no período; mapa muscular de calor semanal (premium); lista dos últimos PRs; link para histórico e por-exercício.
- **Empty state:** antes do 1º treino — ilustração + "Seus números aparecem aqui após o primeiro treino" + CTA para Home. Nunca gráfico vazio.
- **Free vs premium:** free vê últimos 30 dias e gráfico básico de carga; premium vê tudo (seção 25).

## S20. Gráfico por exercício
- **Componentes:** gráfico de linha (carga máx da sessão; toggle para volume); melhor marca; tabela de histórico de sets; nota sobre progressão ativa ("próxima meta: 3×10 → sobe 2,5 kg").
- **Estados:** <2 sessões → "Registre mais um treino para ver sua evolução".

## S21. Biblioteca (lista + busca)
- **Componentes:** busca com tolerância a nomes populares ("levantamento terra", "stiff", "cadeira extensora"); filtros: grupo muscular, equipamento, padrão de movimento; grid por grupo muscular.
- **Estados:** sem resultado → sugerir termos próximos + "Sugerir exercício" (feedback para content ops).

## S22. Detalhe do exercício
- **Componentes:** vídeo/animação em loop (autoplay sem som); músculos primários/secundários (visual anatômico simples); passos de execução (3–5 bullets); erros comuns (2–3); equipamento; equivalentes; **histórico pessoal do usuário neste exercício** (diferencial vs. biblioteca estática).
- **CTA contextual:** se aberto de dentro do player → "Voltar ao treino".

## S23. Perfil e sub-telas
Padrão de settings; destaques: "Meu plano" (plano atual visual + parâmetros + botões ajustar/regenerar + arquivo de planos anteriores); "Equipamentos" (perfis múltiplos, checklist visual por categoria); "Assinatura" (status, gestão, restore); exportar dados (JSON/CSV — barato e gera confiança); excluir conta (obrigatório, LGPD/lojas).

## Padrões globais
- **Loading:** skeleton screens, nunca spinner de tela cheia; conteúdo local primeiro, rede depois.
- **Erro de rede:** app funcional offline por padrão; banner discreto "Sem conexão — seus treinos estão salvos no aparelho" só quando relevante (ex.: mídia não cacheada).
- **Erro irrecuperável:** tela com retry + código de erro curto para suporte.
- **Acessibilidade:** alvos ≥44 pt no player, contraste AA, Dynamic Type nos textos de leitura (player tem layout próprio otimizado, testado até 120% de escala).
---

# 18. Onboarding System

## Objetivos e restrições

- Coletar o mínimo necessário para gerar um plano crível: cada pergunta precisa alterar o output do gerador; pergunta que não altera output sai.
- Duração-alvo: ≤ 2,5 min, 9 passos, 1 pergunta por tela.
- Sem cadastro antes do preview (F1). Sem paywall antes do preview (princípio 4).
- Progresso salvo localmente a cada resposta — fechar o app no passo 6 e voltar retoma no passo 6.

## Ordem das perguntas e racional da ordem

A ordem segue três regras: (1) começar por identidade/motivação (engaja e é fácil), (2) intercalar perguntas de esforço baixo, (3) deixar dados sensíveis/numéricos para o fim, quando o sunk cost já sustenta a conclusão.

| # | Pergunta | Tipo | Obrigatória | Vira parâmetro |
|---|---|---|---|---|
| 1 | **Qual seu objetivo principal?** (Ganhar músculo / Perder gordura / Ficar mais forte / Voltar à forma / Saúde e disposição) | single choice | Sim | `goal` → seleção de template, rep ranges, cardio acessório |
| 2 | **Qual sua experiência com musculação?** (Nunca treinei / Já treinei um pouco / Treino há 6m–2a / Treino há 2+ anos) | single choice | Sim | `experience_level` → volume, complexidade de exercícios |
| 3 | **Como está sua rotina de treino hoje?** (Treinando regularmente / Treinando às vezes / Parado há alguns meses / Parado há muito tempo) | single choice | Sim | `current_state` → flag recomeçante → rampa de volume |
| 4 | **Onde você vai treinar?** (Academia completa / Academia básica ou condomínio / Em casa com equipamentos / Em casa sem equipamentos) | single choice | Sim | `location` → abre passo 5 condicional |
| 5 | **O que você tem disponível?** (checklist condicional: halteres, barra+anilhas, banco, elásticos, barra fixa, kettlebell, máquinas…) | multi choice | Sim se casa/básica | `equipment[]` → filtro duro do catálogo |
| 6 | **Quantos dias por semana você consegue treinar de verdade?** (2/3/4/5/6) — microcopy: "Seja realista. Dá para ajustar depois." | single choice | Sim | `frequency` → divisão de treino |
| 7 | **Quanto tempo por treino?** (até 30 / ~45 / ~60 / 75+ min) | single choice | Sim | `session_time` → nº de exercícios e séries |
| 8 | **Alguma região com dor ou limitação?** (Nenhuma / Joelho / Lombar / Ombro / Punho / Outra) | multi choice | Sim (com "Nenhuma") | `limitations[]` → exclusão de padrões de risco + disclaimer |
| 9 | **Sobre você:** sexo (opcional, com "prefiro não dizer"), idade, peso, altura — microcopy: "Usamos para calibrar volume e acompanhar seu progresso." | form curto | Idade sim; resto opcional | `biometrics` → calibragens finas + baseline de progresso |

Passo 3 é a diferenciação silenciosa: nenhum concorrente relevante trata "recomeçante" como estado de primeira classe. Custa uma tela; rende a persona Marcos inteira.

## Mecânicas anti-drop-off

- **Progress bar** fina no topo (passo x de 9), sempre visível.
- **Retorno de valor intercalado:** após o passo 4, interstitial de 1 tela (não interativa, 2 s ou tap para pular): "Já dá para adiantar: com seu objetivo, seus treinos terão foco em [X]." Mostra que as respostas estão trabalhando. Um único interstitial — mais que isso vira ruído.
- **Escolhas com ícone + texto**, alvos grandes, resposta em 1 toque avança automático (com micro-delay de 250 ms para percepção de registro).
- **"Ajustar depois" explícito** nos passos 6 e 7 — reduz paralisia de decisão.
- **Sem login wall, sem permissão de push, sem ATT** durante o onboarding. Push é pedido em contexto (fim do 1º treino: "quer que a gente te lembre do próximo?"). ATT/tracking só depois da ativação.

## Do formulário ao parâmetro

Output do onboarding é um objeto `TrainingProfile` versionado:

```json
{
  "goal": "hypertrophy",
  "experience_level": "beginner",
  "current_state": "returning",
  "location": "gym_full",
  "equipment": ["all_gym"],
  "frequency": 4,
  "session_time_min": 45,
  "limitations": ["knee"],
  "biometrics": { "sex": "f", "age": 24, "weight_kg": 63, "height_cm": 165 },
  "profile_version": 1
}
```

Toda mudança futura (via "Ajustar plano") edita este objeto e dispara regeração com diff. O racional exibido no preview é gerado a partir dele por templates de texto (determinístico, auditável).

---

# 19. Workout Generation Engine

## Filosofia

O gerador é **semi-determinístico e baseado em templates parametrizados** — não é um LLM, não é uma caixa-preta. Racional da escolha:

- **Qualidade controlável:** cada template é desenhado/revisado por profissional de educação física. Erro de prescrição é risco de produto e de marca; templates auditáveis eliminam a cauda de outputs absurdos que geração livre produz.
- **Explicabilidade:** cada decisão do motor tem um "porquê" textual mapeado (princípio 3).
- **Offline e barato:** roda no cliente em milissegundos, sem custo de inferência, sem dependência de rede.
- **Suficiente:** o espaço de bons planos para os clusters-alvo é bem coberto por ~40 templates × parametrização. Personalização percebida vem da combinação (objetivo × nível × frequência × equipamento × tempo × limitações × recomeço), que gera milhares de variações reais.

**[Alternativa considerada e rejeitada para o MVP]:** geração via LLM com validação por regras. Ganha flexibilidade de long tail; perde auditabilidade, adiciona custo/latência/rede e risco de prescrição ruim. Reavaliação na fase 3 para casos de borda (limitações múltiplas complexas).

## Pipeline de geração (5 estágios)

### Estágio 1 — Seleção de divisão (split)

Função de `frequency` × `experience_level`:

| Frequência | Iniciante | Intermediário | Avançado |
|---|---|---|---|
| 2x | Full body A/B | Full body A/B | Full body A/B |
| 3x | Full body A/B/C | Full body A/B/C ou ABC push/pull/legs* | Push/Pull/Legs |
| 4x | Superior/Inferior ×2 | Superior/Inferior ×2 | Superior/Inferior ou ABCD |
| 5x | Superior/Inferior + FB (na prática: recusar → sugerir 4x) | ABC + Sup/Inf híbrido | PPL + Sup/Inf |
| 6x | Recusar → sugerir 4x com explicação | PPL ×2 (com aviso) | PPL ×2 |

\* desempate por preferência implícita: se `session_time ≤ 45`, full body (menos exercícios por sessão distribui melhor o volume).

Regra de degradação honesta: quando a combinação é desaconselhável (iniciante 6x), o motor **não obedece cegamente** — gera a alternativa recomendada e explica ("Para quem está começando, 4 treinos bem feitos + descanso rendem mais que 6. Se quiser 6 mesmo assim, ajuste aqui."). Manter a escolha final com o usuário, mas com fricção informada.

### Estágio 2 — Alocação de volume semanal por grupo muscular

Alvos de séries semanais por grupo (valores de partida, baseados em prática consolidada de prescrição; ajustáveis por content ops sem release):

| Grupo | Iniciante | Intermediário | Avançado |
|---|---|---|---|
| Grandes (peito, costas, quadríceps, posterior/glúteo) | 8–10 | 10–14 | 14–18 |
| Médios (ombro, bíceps, tríceps) | 6–8 | 8–10 | 10–14 |
| Pequenos (panturrilha, abdômen) | 4–6 | 6–8 | 8–10 |

Modificadores:
- `current_state = returning` → −40% no ciclo 1, −20% no ciclo 2, normal no ciclo 3 (rampa de recomeço — a feature do Marcos).
- `goal = fat_loss` → volume mantido (músculo é prioridade no déficit) + finalizadores metabólicos opcionais de 5–8 min marcados como opcionais.
- `goal = strength` → −20% de volume acessório, +ênfase nos básicos.
- Ênfase por preferência (fase 2): usuário poderá marcar grupos prioritários (+30% no grupo, −15% distribuído).

### Estágio 3 — Seleção de exercícios por slot

Cada dia do template é uma sequência de **slots** tipados, não de exercícios fixos:

```
Dia "Inferiores A" (template intermediário, 45 min):
  slot 1: composto_joelho_dominante   (primário: quadríceps)   3–4 séries
  slot 2: composto_quadril_dominante  (primário: post./glúteo)  3 séries
  slot 3: unilateral_inferior         (quadríceps/glúteo)       3 séries
  slot 4: isolado_posterior           (posterior)               3 séries
  slot 5: isolado_panturrilha         (panturrilha)             3 séries
  slot 6*: core                       (abdômen)                 2 séries   *cortável por tempo
```

O preenchimento de cada slot consulta o catálogo com filtros em cascata:
1. **Filtro duro — equipamento:** só exercícios executáveis com `equipment[]`. Inegociável (persona Juliana).
2. **Filtro duro — limitações:** `limitations` excluem padrões mapeados (joelho → sem afundo profundo/extensora pesada no ciclo 1; lombar → sem terra do chão/remada curvada livre → variações apoiadas; ombro → sem desenvolvimento por trás/mergulho). Mapeamento limitação→exclusões mantido por profissional no CMS.
3. **Filtro duro — nível:** exercícios têm `skill_level`; iniciante não recebe movimento técnico alto (terra convencional, snatch etc.) — recebe a variante regressada (terra romeno com halteres, leg press).
4. **Ranking:** prioridade do exercício no slot (curadoria), variedade entre dias (não repetir o mesmo isolado em dias distintos quando há opções), histórico do usuário (fase 2: preferir exercícios com histórico, para continuidade de progressão).
5. **Seed determinística por usuário:** desempates usam hash do userId → dois usuários idênticos podem receber variações diferentes (percepção de individualização), mas o mesmo usuário regenera consistente.

### Estágio 4 — Prescrição de séries, reps, descanso e carga inicial

Rep ranges por objetivo (aplicados por tipo de slot):

| Objetivo | Compostos | Acessórios/isolados | Descanso compostos | Descanso isolados |
|---|---|---|---|---|
| Hipertrofia | 6–10 | 10–15 | 90–120 s | 60 s |
| Força | 4–6 | 8–12 | 150–180 s | 90 s |
| Perda de gordura | 8–12 | 12–15 | 75–90 s | 45–60 s |
| Saúde/geral | 8–12 | 10–15 | 90 s | 60 s |

Carga inicial: o app **não chuta carga absoluta** na primeira sessão de um exercício. Prescreve "encontre um peso que desafie nas últimas 2 repetições" com microcopy de calibragem, e registra o que o usuário usar como baseline. A partir da 2ª sessão, sugere carga = último desempenho + regra de progressão. **[Trade-off assumido:** estimar carga por biometria (percentual de peso corporal) parece mais "mágico" mas erra feio nos extremos e gera risco; calibragem assistida na sessão 1 é honesta e segura. Exceção: sugestões qualitativas para peso corporal e elásticos.]

### Estágio 5 — Ajuste ao tempo disponível

Estimativa de duração: `Σ séries × (tempo_execução ~40s + descanso) + setup entre exercícios (~60s) + aquecimento (5 min)`. Se estimativa > `session_time`:
1. Cortar slots marcados `cortável` (core, isolados redundantes).
2. Reduzir séries dos acessórios (3→2), nunca dos 2 primeiros compostos.
3. Converter pares de isolados em superset (marca no player).
4. Se ainda estourar → avisar no preview: "Este treino leva ~52 min; você pediu 45. Sugestões: [reduzir exercícios] [aceitar 52 min]".

Nunca cortar silenciosamente abaixo do volume mínimo eficaz do estágio 2 — se tempo × frequência não comportam o volume, o motor sugere redistribuir (+1 dia ou aceitar progresso mais lento), com explicação.

## Regra de progressão (dupla progressão)

Cada exercício carrega meta `séries × faixa de reps` (ex.: 3 × 8–12):
- Usuário fecha todas as séries no topo da faixa (3×12) em uma sessão → próxima sessão sugere +2,5 kg (superiores) / +5 kg (inferiores/máquinas) ou o menor incremento disponível, voltando ao piso da faixa (3×8).
- Não fechou → repete carga, meta é adicionar reps.
- Peso corporal: progressão por reps → depois variação mais difícil (mapa de progressão do catálogo, seção 20).
- Falhou o piso da faixa em 2 sessões seguidas → reduzir 10% e reconstruir (micro-deload por exercício; deload de programa completo é fase 2, seção 23).

Explicabilidade: o player mostra "Meta: 3×8–12 · Fechou 12? Semana que vem sobe." — a regra é ensinada ao usuário, não escondida. Usuário que entende a regra confia na sugestão e cria fluência no método (retenção via competência).

## Estrutura de ciclos

Plano gerado em **ciclos de 6 semanas**: semanas 1–5 progressão, semana 6 → revisão automática (seção 23) → novo ciclo com variação parcial de exercícios (troca ~30% dos acessórios, mantém compostos-chave para preservar linhas de progressão). Racional: variação combate monotonia (churn) sem resetar o progresso mensurável (os gráficos que sustentam retenção).

---

# 20. Exercise Library System

## Papel estratégico

O catálogo é infraestrutura de três features: geração (slots), substituição (equivalência) e execução (mídia/instrução). Qualidade > quantidade: 250 exercícios bem parametrizados batem 1.500 mal etiquetados, porque cada erro de metadado vira prescrição errada.

## Schema do exercício

```yaml
Exercise:
  id: uuid
  slug: "supino-reto-barra"
  name_ptbr: "Supino reto com barra"
  aliases: ["supino", "bench press", "supino reto"]     # busca
  movement_pattern: horizontal_push                      # taxonomia nível 1
  slot_types: [composto_empurrar_horizontal]             # onde o gerador pode usá-lo
  primary_muscles: [peitoral]
  secondary_muscles: [triceps, deltoide_anterior]
  equipment_required: [barra, banco]                     # AND
  equipment_alternatives: []                             # variações são exercícios próprios
  skill_level: 2            # 1 fácil · 2 médio · 3 técnico
  load_type: external       # external | bodyweight | band | assisted
  min_increment_kg: 2.5
  unilateral: false
  contraindications: [ombro_severo]                      # liga com limitations
  instructions: ["...", "...", "..."]                   # 3–5 passos
  common_mistakes: ["...", "..."]                       # 2–3
  media:
    video_url: ...          # 5–10 s, loop, sem áudio, 2 ângulos quando relevante
    thumbnail_url: ...
  equivalence_group: "empurrar_horizontal_peito"        # família de substituição
  equivalence_rank: 1                                    # ordem de preferência na família
  progression_of: null      # id do exercício que este progride (calistenia)
  regression_of: null
  status: published | draft | deprecated
  version: 3
```

## Taxonomia

- **Padrões de movimento (nível 1):** empurrar horizontal, empurrar vertical, puxar horizontal, puxar vertical, joelho-dominante, quadril-dominante, unilateral inferior, core anti-extensão/anti-rotação, isolados por músculo, carregar/condicionamento.
- **Grupos musculares (nível 2):** peitoral, costas (dorsal/trapézio), deltoides (ant/lat/post), bíceps, tríceps, antebraço, quadríceps, posteriores, glúteos, panturrilhas, abdômen/core, lombar.
- **Equipamento (nível 3):** barra, halteres, máquina específica (leg press, extensora…), polia, peso corporal, elástico, kettlebell, banco, barra fixa, smith.

## Equivalência e substituição

`equivalence_group` = mesmo padrão + mesmo músculo primário. Substituição: mesma família, filtrada por equipamento do contexto, ordenada por `equivalence_rank` e proximidade de `skill_level`. Ex.: família "empurrar_horizontal_peito": supino barra → supino halteres → supino máquina → crossover/crucifixo (parcial, marcado "estímulo semelhante, não idêntico") → flexão (bodyweight) → flexão com elástico.

Progressões calistênicas encadeadas via `progression_of`: flexão inclinada → flexão → flexão declinada → flexão arqueiro. O motor de progressão usa essa cadeia quando `load_type = bodyweight` e as reps estouram o teto da faixa.

## Mídia

- Vídeo curto (5–10 s) em loop, sem áudio, modelo real, ângulo que mostra a mecânica; formato vertical; H.264 + poster.
- Pipeline: gravação em lotes por grupo muscular; MVP pode lançar com mix de vídeo próprio (top 100 exercícios por frequência de prescrição) + animação 3D licenciada para a cauda. **[Recomendação:** priorizar vídeo humano nos 100 mais prescritos — é onde a percepção de qualidade se forma.]
- Entrega: CDN + cache local agressivo (mídia do plano ativo baixa em Wi-Fi antecipadamente; player nunca espera rede).

## Operação do catálogo

Vive no backend com CMS (seção 34); app sincroniza um bundle versionado (delta updates). Publicação exige checklist: mídia aprovada, músculos revisados, equivalências setadas, contraindicações revisadas por profissional. Exercício `deprecated` nunca some do histórico do usuário — apenas deixa de ser prescrito.

---

# 21. Workout Execution System

O player é o produto. Tudo aqui deriva de dois princípios: velocidade de logging e confiabilidade absoluta.

## Anatomia da tela do player

- **Topo:** progresso da sessão (exercício 3/7 + barra), relógio de sessão, botão minimizar (vira mini-bar), menu (encerrar/descartar).
- **Centro:** card do exercício atual — nome, thumbnail/vídeo (tap expande), meta ("3 × 8–12 · 40 kg sugerido"), tabela de séries:

```
  Série   Anterior      Meta        Hoje
  1       40kg × 10    40kg × 8–12   [40] [10]  ✓
  2       40kg × 9     40kg × 8–12   [40] [ 9]  ✓
  3       40kg × 8     40kg × 8–12   [40] [__]  ( )
```

- Coluna "Anterior" = último desempenho real (referência instantânea, mata o caderninho).
- Campos pré-preenchidos com a sugestão; **✓ = 1 toque loga a série como está**.
- Ajuste: tap no valor abre stepper grande (±2,5 kg / ±1 rep) — teclado numérico só por long-press (casos raros). Alvos ≥ 44 pt, botões na metade inferior da tela (alcance de polegar).
- **Base:** timer de descanso (aparece pós-log, contagem regressiva grande, +30 s / pular), próximo exercício em preview.

## Comportamentos

- **Log da série:** toque no ✓ → persiste local síncrono → animação de confirmação (≤150 ms) → timer inicia → detecção de PR (badge discreto). Ordem inegociável: persistir antes de animar.
- **Timer:** roda em background; notificação local com som/vibração no fim; lockscreen mostra contagem (notificação chronometer / Live Activity v1.1). Ajuste fino por exercício persiste.
- **Supersets:** pares marcados pelo gerador rodam alternados (A1 → A2 → descanso) com UI encadeada explícita.
- **Substituir exercício:** fluxo 4 (seção 15), 2 toques até a lista.
- **Pular exercício:** menu do card → pular (motivo opcional: sem tempo / ocupado / desconforto — 1 toque, dispensável). Motivo alimenta adaptação.
- **Adicionar série extra / exercício extra:** permitido (respeitar o usuário avançado); marcado como extra para não poluir a linha de progressão prescrita.
- **Editar série já logada:** tap na linha → editar/excluir. Erros de digitação acontecem com dedos suados.
- **Encerrar:** botão no menu + auto-sugestão quando todas as séries logadas ("Fechar treino?"). Encerrar com séries pendentes pede confirmação leve e salva como completo-parcial.

## Persistência e recuperação (contrato de engenharia)

1. Toda mutação da sessão (log, edição, troca, pulo) grava em SQLite local **antes** do feedback de UI, em transação.
2. Sessão ativa tem estado serializado contínuo: exercício corrente, séries logadas, timestamps, timer (âncora absoluta de relógio, não contador — sobrevive a suspensão de processo).
3. Crash/força-fechamento/reboot → app reabre → detecta sessão `active` com heartbeat < 8 h → oferece retomada em 1 toque (fluxo 7).
4. Sync com backend: fila de eventos append-only, envio assíncrono com retry exponencial; conflito impossível por design no caminho comum (uma sessão pertence a um device; edição remota inexistente no MVP). Duplicidade prevenida por `session_uuid` gerado no cliente + idempotência no servidor.
5. Duas sessões ativas (usuário iniciou no telefone antigo): última a sincronizar não sobrescreve — ambas persistem como sessões distintas; UI de histórico permite mesclar/excluir (edge case, seção 35).

## UX sob esforço físico

- Modo de alto contraste automático no player; tipografia maior que no resto do app.
- Zero navegação obrigatória entre séries: a tela do exercício atual contém tudo.
- Tudo operável com uma mão e polegar; nada crítico no terço superior.
- Manter tela ativa opcional ("manter tela ligada durante o treino", default on com dimming).
- Sem áudio obrigatório (academia = fones com música do usuário); feedbacks por vibração.

---

# 22. Progress Tracking System

## O que é rastreado

| Métrica | Fonte | Granularidade | Free/Premium |
|---|---|---|---|
| Carga por exercício (máx da sessão, por série) | SetLog | por sessão | Free (30 dias) / Premium (tudo) |
| Volume (kg × reps) por sessão, semana, grupo muscular | agregação de SetLog | diária/semanal | básico free / completo premium |
| e1RM estimado (índice interno "melhor marca") | Epley sobre SetLog | por exercício | premium |
| PRs (carga, reps na carga, melhor marca) | detecção no log | evento | free (lista) / premium (histórico completo) |
| Frequência e aderência (treinos feitos ÷ planejados) | WorkoutSession | semanal | free |
| Consistência (semanas consecutivas na meta) | derivada | semanal | free |
| Mapa muscular (séries semanais por grupo vs. alvo) | SetLog × Exercise | semanal | premium |
| Peso corporal | input manual | livre | free |
| Medidas e fotos | input manual | livre | v1.1, premium |
| RPE da sessão (emoji 1–5) | resumo pós-treino | por sessão | free (input), usado pela adaptação |

## Onde cada coisa aparece

- **Dashboard (Progresso):** a resposta de 10 segundos para "está funcionando?" — treinos da semana vs. meta, volume do período com tendência, 3 PRs mais recentes, mapa muscular. Nada de tabela crua aqui.
- **Por exercício (S20):** a resposta profunda — linha de carga, volume, histórico de sets, próxima meta de progressão. É a tela que o Rafael abre entre séries.
- **Resumo semanal (premium, push domingo à noite):** treinos feitos, volume vs. semana anterior, PRs, grupo muscular em destaque, e **1 insight acionável** ("Seu supino progrediu 3 semanas seguidas. Posterior de coxa está 30% abaixo do alvo — o treino de quinta faz falta."). Regra: máximo 1 insight por resumo; insight raso destrói a credibilidade de todos os outros.
- **Detalhe da sessão (histórico):** reprodução fiel do que foi feito, com diffs vs. sessão anterior equivalente.

## Princípios de apresentação

- Todo gráfico responde uma pergunta nomeada; sem "dashboard de vaidade".
- Tendência > ponto: destacar direção ("+8% este mês"), não o valor absoluto.
- Períodos sem dados não quebram visual: gaps explícitos ("semana sem treino"), nunca interpolação enganosa.
- Comparações sempre contra o próprio usuário. Nunca contra outros usuários (fora de escopo social) — comparação social em fitness é churn disfarçado para a maioria dos clusters.

---

# 23. Adaptation and Intelligence Layer

Camada de regras explícitas sobre o histórico — sem fantasia de IA. Cada regra tem gatilho, ação e mensagem. Rollout: progressão de carga (MVP) → resposta a faltas e dor (MVP/v1.1) → platô e deload (v1.2).

## R1 — Progressão de carga (MVP)
Já especificada na seção 19 (dupla progressão). É a regra de maior valor percebido por real investido.

## R2 — Resposta a faltas (MVP básico, v1.1 completo)
- **1 falta:** nada no app; push do dia seguinte segue normal. Falta isolada é vida, não evento.
- **2 faltas na semana:** o treino perdido de maior prioridade (menos volume acumulado do grupo no ciclo) reentra na fila; a semana "desliza" em vez de pular conteúdo. Mensagem apenas contextual na Home ("Reorganizamos sua semana — hoje: Inferiores").
- **3+ treinos perdidos consecutivos / 10+ dias:** card de replanejamento na Home: "Sua rotina mudou? Ajuste o plano em 1 minuto" com atalhos (menos dias / menos tempo / pausar plano). A leitura correta de faltas repetidas: o plano está errado para a vida atual, não o usuário está falhando.
- **Pausa declarada** (férias/lesão): plano congela, streak protegido (seção 24), retorno com rampa se pausa > 21 dias (regra do recomeçante reaplicada em escala).

## R3 — Resposta a dor/desconforto (MVP: registro + substituição; v1.1: padrões)
- Usuário marca "desconforto" ao pular/trocar → registro por região articular inferida do exercício.
- 2+ registros na mesma região em 14 dias → (a) gerador passa a evitar os padrões de maior estresse naquela região no ciclo corrente; (b) mensagem transparente: "Notamos desconforto no ombro em 2 treinos. Trocamos [desenvolvimento] por [variação neutra] neste ciclo. Se a dor persistir, procure um profissional de saúde."
- **Regra dura de compliance:** o app nunca diagnostica, nunca promete reabilitação; sempre encaminha dor persistente a profissional. Copy revisada juridicamente.

## R4 — Platô por exercício (v1.2)
Gatilho: 4 sessões consecutivas sem progresso (reps ou carga) num exercício com histórico ≥ 8 sessões. Ações oferecidas (não impostas): trocar variação (novo estímulo, família de equivalência), micro-deload (−10% e reconstruir), ajustar faixa de reps. Mensagem ensina o conceito em 2 frases — platô virou momento de educação, não de frustração muda.

## R5 — Deload de programa (v1.2)
Gatilho combinado: fim de ciclo de 6 semanas **e** sinais de fadiga (RPE médio ≥ 4,5/5 nas últimas 6 sessões, ou regressão simultânea em 3+ exercícios). Ação: semana de deload gerada (−40% volume, −10% carga) com explicação do porquê. Usuário pode recusar. Sem sinais de fadiga → ciclo novo direto.

## R6 — Mudança de contexto (MVP)
Troca de perfil de equipamento (casa↔academia, modo viagem) → adaptação imediata do treino do dia via equivalências, preservando slots e progressão onde o exercício se mantém.

## Princípio transversal

Toda ação da camada de adaptação: (1) é explicada em linguagem simples, (2) é reversível, (3) aparece no momento de uso (não em um "central de insights" que ninguém abre). A inteligência do produto se manifesta como um bom treinador se manifestaria: intervenções pequenas, oportunas e justificadas.

---

# 24. Gamification and Retention Loops

Postura: retenção por progresso real, mecânicas de jogo como moldura — nunca como conteúdo. Nada de mascotes, moedas, níveis abstratos ou ligas. O público (Rafael, Fernando, Marcos) tem alergia a infantilização; o novato (Camila) precisa de encorajamento, não de circo.

## Loop central de retenção (o produto inteiro é este loop)

```
Plano diz o que fazer → treino executado com fricção mínima →
progresso registrado sem esforço → evidência de evolução (PR, gráfico, resumo) →
convicção ("está funcionando") → volta amanhã → plano se adapta → repete
```

Toda mecânica abaixo existe para lubrificar uma aresta específica deste loop.

## Mecânicas

- **Meta semanal (não streak diário):** a unidade de consistência é a semana (ex.: 4/4 treinos). Racional: streak diário pune o descanso — que é parte do treino — e quebra por design 3x por semana. Sequência exibida = semanas consecutivas batendo a meta. Proteção: 1 "semana flexível" a cada 8 (meta batida com n−1 treinos mantém a sequência) + pausa declarada congela.
- **Celebração de PR:** inline discreta no player; destaque no resumo pós-treino; card de compartilhamento (v1.2). Regras anti-inflação da F10 — PR barato desvaloriza PR caro.
- **Resumo semanal:** o ritual de domingo (seção 22). É a mecânica de retenção premium mais importante: materializa a semana em evidência.
- **Marcos de jornada:** 10º treino, 3 meses, 50º treino, primeira tonelada de volume num mês, aniversário de treino. Aparecem como cards no resumo — não como popups.
- **Primeiras 2 semanas (janela crítica de ativação):** roteiro próprio — d1 primeiro treino simplificado com tooltips; d2–3 push do treino seguinte com conteúdo concreto; primeiro PR real ≈ sessão 3–4 (por design, dado que baselines vêm da calibragem); resumo da semana 1 com narrativa de partida ("baseline registrado: agora todo treino vira comparação").
- **Sensação de evolução do plano:** a cada ciclo de 6 semanas, o "novo ciclo" é apresentado como conquista ("Ciclo 2: seu volume sobe 10% — você aguenta mais do que quando começou").

## O que deliberadamente NÃO fazemos

- Streak diário com fogo — pune descanso, gera ansiedade, quebra barato.
- Ranking entre usuários — desmotiva a maioria para animar uma minoria que ficaria de qualquer jeito.
- Badges por trivialidades ("abriu o app 5 dias!") — inflaciona e infantiliza.
- Notificação de culpa ("você falhou com você mesmo") — churn com data marcada.
---

# 25. Subscription and Paywall Strategy

## Arquitetura freemium: onde passa a linha

Princípio de corte: **o free entrega o hábito; o premium entrega a otimização do hábito.** Free precisa ser genuinamente utilizável — usuário free ativo é pipeline de conversão + distribuição (Beatriz); usuário bloqueado é desinstalação + review de 1 estrela.

| Capacidade | Free | Premium |
|---|---|---|
| Onboarding + geração do plano | ✔ completo | ✔ |
| Player, logging, timer, substituição | ✔ completo, sem limites | ✔ |
| Histórico de sessões | últimos 30 dias | ilimitado |
| Gráficos por exercício | carga básica, 30 dias | todos, período completo |
| PRs | lista simples | histórico + celebrações ricas |
| Regeneração de plano | 1/mês | ilimitada |
| Novos ciclos (6 semanas) | ciclo renova com variação básica | ciclos completos + deload + platô |
| Mapa muscular | — | ✔ |
| Resumo semanal com insight | versão mínima (nº treinos) | completo |
| Modo viagem / múltiplos perfis de equipamento | 1 perfil | ilimitado |
| Medidas/fotos (v1.1) | peso corporal | completo |
| Exportar dados | ✔ (confiança, LGPD) | ✔ |

**O que jamais é bloqueado:** gerar o primeiro plano, treinar, logar, substituir exercício, ver que progrediu (básico). Bloquear o core loop cedo é trocar LTV por centavos.

**A alavanca real de conversão:** profundidade do histórico + inteligência de progressão. O free vê o próprio progresso escapar da janela de 30 dias — o dado é dele (exportável), mas a leitura rica é premium. Converte pelo acúmulo de valor, não pela frustração artificial.

## Trial e timing do paywall

- **Trial:** 7 dias, tudo liberado, via assinatura com trial nativo (mensal e anual). 7 dias ≈ 3–4 treinos + 1 resumo semanal — o suficiente para provar o loop.
- **Momento 1 (paywall soft):** pós-cadastro, pós-preview (S14). Dispensável com "Agora não" visível sem scroll. Captura high-intent sem custo de ativação.
- **Momento 2 (contextual):** toque em feature premium → paywall com headline referente à feature tocada.
- **Momento 3 (pico de valor):** após resumo semanal 2 e após PR significativo — card (não modal) "Veja a análise completa do seu progresso".
- **Regra dura:** nenhum paywall entre o usuário e um treino. Nunca modal de upgrade ao abrir o app (exceto fim de trial, 1x, com estado claro).

## Preço (Brasil, hipóteses a testar)

| Plano | Preço | Racional |
|---|---|---|
| Mensal | R$ 29,90 | Acima do "app barato", abaixo de dor; referência de ancoragem |
| **Anual (herói)** | **R$ 149,90 (≈ R$ 12,50/mês)** | ~58% off vs. mensal — desconto agressivo porque anual = retenção comprada e LTV antecipado |
| Vitalício (teste, fase 2) | R$ 399 | Só como experimento de captura de caixa em promoções |

Ancoragens de copy: anual < 2 sessões de personal por ano; < R$ 0,50/dia. **[HIPÓTESE]** todos os preços; testar via RevenueCat experiments (mensal 24,90 vs. 29,90; anual 129,90 vs. 149,90 vs. 179,90).

## Estrutura do paywall (tela)

1. Headline orientada a resultado, contextual quando possível ("Veja tudo o que seu histórico diz" > "Seja Premium").
2. 4–5 benefícios concretos com ícone (nunca lista de 12 features).
3. Seletor anual (pré-selecionado, badge de economia) / mensal.
4. Linha de confiança: "Cancele quando quiser, direto na loja."
5. CTA "Começar 7 dias grátis" (quando trial disponível) — o CTA fala do trial, não da cobrança.
6. Restore + termos no rodapé; "Agora não" acessível.

## Testes A/B prioritários (ordem)

1. Preço do anual (129,90 / 149,90 / 179,90) — maior alavanca de receita.
2. Momento 1 presente vs. ausente (mede envenenamento de ativação vs. captura early).
3. Trial 7 vs. 14 dias (14 pega 2 resumos semanais — pode converter melhor).
4. Paywall hard vs. soft no fim do trial.
5. Desconto win-back (50% anual) para trial expirado sem conversão, d+7.

---

# 26. Notifications and CRM Logic

Regras globais: push só com valor concreto no corpo (dado, treino, conquista — nunca "sentimos sua falta" seco); cap de 1 push comportamental/dia e 5/semana; quiet hours 21h30–7h respeitando fuso; todo tipo tem opt-out granular (S23); permissão pedida em contexto (pós 1º treino), não no first open.

| Trigger | Canal | Timing | Mensagem (exemplo) | Objetivo | Regra de supressão |
|---|---|---|---|---|---|
| Onboarding abandonado | push (se já permitido; senão nada) / e-mail se cadastrado | +4 h | "Seu plano está a 2 perguntas de ficar pronto." | ativação | 1x apenas |
| Plano gerado, treino nunca iniciado | push | d+1, 18h | "Seu primeiro treino leva 40 min: Superiores A. Que tal amanhã cedo?" | ativação | máx 2 (d+1, d+3), depois e-mail d+5 |
| Treino do dia | push | hora preferida (aprendida do histórico de sessões; default 17h) | "Hoje: Inferiores · 6 exercícios · ~45 min" | hábito | só em dias planejados; auto-off se ignorado 5x seguidas (re-opt-in via card) |
| Timer de descanso | notificação local | fim do descanso | "Descanso encerrado — Série 3 de Supino" | execução | sessão ativa apenas |
| PR batido | in-app + push opcional | imediato / consolidado no fim | "Novo recorde: Agachamento 80 kg × 8 🎯" | retenção emocional | máx 1 push de PR/dia |
| Resumo semanal | push + e-mail | domingo 19h | "Sua semana: 4 treinos, +340 kg de volume, 2 recordes" | retenção/ritual | pular se 0 treinos (vira mensagem de retomada) |
| Risco de quebra de meta | push | penúltimo dia viável da semana, 1x | "Faltam 2 treinos para fechar sua semana — dá tempo: hoje e sábado." | consistência | só se meta ainda alcançável; nunca tom de culpa |
| Inatividade 7 dias | push | d+7, 18h | "Retomar de onde parou ou voltar mais leve? Seu plano se ajusta em 1 toque." | win-back | 1x |
| Inatividade 21 dias | e-mail | d+21 | Resumo do que conquistou + retomada 1 toque | win-back | 1x; d+45 último e-mail; depois silêncio |
| Trial d5 | push + e-mail | 2 dias antes da cobrança | "Seu trial termina em 2 dias. Até agora: 3 treinos, 1 recorde." | conversão transparente | obrigatória (confiança + política de loja) |
| Trial expirado sem conversão | e-mail | d+7 | oferta win-back (teste A/B nº 5) | conversão | 1x |
| Renovação anual próxima | e-mail | 7 dias antes | aviso transparente + resumo do ano de treino | anti-chargeback, confiança | obrigatória |

Infra: push comportamental via ferramenta de engagement (OneSignal ou similar) alimentada pelos eventos da seção 27; notificações de timer e treino do dia são locais (agendadas no device — funcionam offline e não dependem de backend). E-mail transacional + CRM: Resend/Loops ou similar. Toda mensagem com deep link para o ponto exato de ação.

---

# 27. Analytics Event Taxonomy

Convenções: `snake_case`, `objeto_ação`; propriedades globais em todo evento: `user_id` (ou anon_id), `platform`, `app_version`, `subscription_status`, `days_since_install`, `plan_cycle_week`. Ferramenta: Amplitude ou PostHog (recomendação: **PostHog** — custo, feature flags e session replay juntos; reavaliar na escala). Eventos gravados offline e enviados em batch.

## Onboarding e ativação

| Evento | Dispara | Propriedades-chave | Por que importa |
|---|---|---|---|
| `onboarding_started` | tap em "Montar meu treino" | — | topo do funil |
| `onboarding_step_completed` | cada passo | `step_number`, `step_name`, `answer_value`, `time_on_step_ms` | localizar drop-off por passo; distribuição de respostas alimenta produto (ex.: % recomeçantes) |
| `onboarding_abandoned` | app fechado sem concluir | `last_step` | dispara CRM |
| `plan_generated` | fim da geração | `split_type`, `frequency`, `goal`, `experience`, `is_returning`, `generation_ms` | assinatura do plano gerado; correlacionar tipo de plano × retenção |
| `plan_preview_viewed` | S12 visível | `expanded_day` (bool), `rationale_opened` (bool) | mede se o racional é lido — valida princípio 3 |
| `signup_completed` | conta criada | `method`, `from_step` | conversão preview→conta |
| `first_workout_started` / `first_workout_completed` | primeira sessão | `hours_since_install`, `duration_min`, `sets_logged` | **métrica de ativação oficial: `first_workout_completed` ≤ 72 h do install** |

## Treino (core loop)

| Evento | Dispara | Propriedades | Por que importa |
|---|---|---|---|
| `workout_started` | início de sessão | `workout_day_id`, `source` (home/push/deep_link), `is_resumed` | frequência real; atribuição de push |
| `set_logged` | cada série | `exercise_id`, `set_number`, `weight`, `reps`, `was_suggested_accepted` (bool), `input_method` (one_tap/stepper/keyboard) | `was_suggested_accepted` mede a qualidade da prescrição; `input_method` mede a velocidade do logger |
| `exercise_substituted` | troca | `from`, `to`, `reason`, `scope` (today/always) | exercícios muito trocados = curadoria errada no template |
| `exercise_skipped` | pulo | `exercise_id`, `reason` | idem + input de adaptação |
| `rest_timer_completed` / `rest_timer_skipped` | timer | `prescribed_s`, `actual_s` | aderência ao descanso; calibrar estimativa de duração |
| `workout_completed` | encerramento | `duration_min`, `sets_completed`, `sets_prescribed`, `completion_ratio`, `prs_count`, `rpe` | qualidade da sessão; `duration` vs. estimada calibra o gerador |
| `workout_abandoned` | sessão expirada sem fechar | `exercises_completed`, `last_exercise_id` | onde os treinos morrem (exercício? tempo?) |
| `pr_achieved` | detecção | `exercise_id`, `pr_type`, `value` | alimenta CRM e loops de share |
| `session_recovered` | retomada pós-crash/fechamento | `gap_minutes` | monitora o mecanismo mais crítico de confiabilidade |

## Progressão e adaptação

`progression_suggested` (`exercise_id`, `increment`), `progression_accepted` (aceite = confiança no motor — north star da camada de inteligência), `plan_regenerated` (`trigger`: user/adaptation, `changed_params`), `adaptation_card_shown` / `adaptation_card_accepted` (`rule_id`: R2/R3/R4/R5), `pain_reported` (`region`).

## Monetização

| Evento | Propriedades | Por que importa |
|---|---|---|
| `paywall_viewed` | `placement` (post_signup/contextual/peak/trial_end), `trigger_feature` | conversão por placement — decide os A/B da seção 25 |
| `paywall_dismissed` | `placement`, `time_on_screen_ms` | |
| `trial_started` | `plan_selected`, `placement` | |
| `subscription_started` / `renewed` / `cancelled` / `expired` | `plan`, `price`, `days_since_install` | fonte: webhooks RevenueCat, server-side (fonte da verdade de receita) |
| `premium_feature_blocked` | `feature` | quais bloqueios geram paywall_view vs. abandono |

## Retenção e risco de churn

`app_opened` (`source`), `notification_received/opened` (`type`), `weekly_goal_met` (`streak_weeks`), `weekly_summary_viewed`, `plan_paused` (`reason`), `data_exported`, `account_deleted` (`reason` se dado). Sinal composto de churn risk (calculado, não evento): 2 semanas consecutivas < 50% da meta + queda de abertura → alimenta CRM R2/win-back.

## Dashboards mínimos no D1 do lançamento

1. Funil de ativação: install → onboarding done → plan → signup → 1º treino ≤ 72 h.
2. Retenção por coorte semanal (semana 1–8), segmentada por cluster de onboarding (`goal`, `is_returning`, `location`).
3. Funil de monetização: paywall_viewed → trial → paid, por placement.
4. Saúde do core loop: treinos/usuário ativo/semana, `was_suggested_accepted`, `completion_ratio`, `session_recovered`.

---

# 28. Growth Loops

Ordem de investimento: (1º) loops orgânicos de produto, (2º) UA paga quando os números da seção 37 fecharem, (3º) creators/afiliados como amplificador.

## Loop 1 — Compartilhamento de conquista (v1.2)
PR ou resumo semanal → card visual (número grande, marca discreta, estética que valoriza quem posta) → story Instagram/WhatsApp → audiência vê prova concreta de progresso + método → install. O card compartilha a **conquista da pessoa**, não o anúncio do app — regra de design inegociável, senão ninguém posta. Instrumentação: `share_card_generated/shared`, UTM no deep link.

## Loop 2 — Indicação com incentivo dos dois lados (v1.2+)
"Convide um amigo: ele ganha 14 dias de premium, você ganha 1 mês quando ele assinar." Racional do desenho: recompensa do indicador condicionada à conversão do indicado (anti-fraude, alinhamento com receita). Treinar junto é comportamento natural da categoria (Beatriz) — o convite tem contexto social real, não é spam de recompensa.

## Loop 3 — Quiz público de treino (SEO/mídia, fase 2)
Landing web "Descubra seu treino ideal em 2 minutos" = onboarding steps 1–7 em versão web → preview resumido → "Baixe o app para destravar o plano completo". Serve de LP para UA paga (pré-qualifica clique antes do install — CPI menor, qualidade maior) e de asset de SEO.

## Loop 4 — SEO de biblioteca (fase 2)
Páginas web públicas por exercício ("como fazer remada curvada", "substitutos do supino em casa") geradas do catálogo que já existe. Custo marginal baixo, tráfego de intenção alta, CTA para o app. PT-BR tem concorrência de conteúdo fraca em cauda longa de exercícios — **[HIPÓTESE]** verificável barata com 30 páginas-piloto.

## Loop 5 — Creators e afiliados (fase 2)
Micro-influenciadores fitness BR (10k–200k) com cupom de trial estendido + rev-share via afiliação (RevenueCat + link de atribuição). Começar com 5–10 parcerias-piloto medindo CAC efetivo por creator antes de escalar. Não fazer: pagar post avulso sem atribuição.

## UA paga (quando ativar)
Pré-condições (seção 37): crash-free > 99,5%, ativação ≥ 40%, retenção W4 ≥ 20%, trial→paid ≥ 30% **[metas-hipótese]**. Canais: Meta (Reels/Stories) e TikTok — criativos de produto real (player, gráfico subindo, antes/depois de carga — nunca corpo). Google App Campaigns depois, quando houver volume de conversão para otimizar.

---

# 29. Monetization Strategy

## Núcleo (anos 1–2): assinatura B2C
Detalhada na seção 25. Meta estrutural: **anual ≥ 60% das assinaturas ativas** — anual antecipa caixa, compra retenção e reduz exposição ao churn mensal. Todas as decisões de pricing/promos empurram para o anual.

## Extensões realistas (ordem de probabilidade)

1. **Upsell in-app de programas fechados (fase 2):** ciclos temáticos de 8–12 semanas ("Força base", "Glúteo 12 semanas", "Volta ao jogo 8 semanas") inclusos no premium como conteúdo de retenção — **não** como compra avulsa no início. **[Trade-off:** vender avulso geraria receita incremental mas fragmentaria a proposta "uma assinatura resolve"; programas como benefício premium fortalecem o anual.]
2. **B2B2C (fase 3):** licenças para academias independentes/redes médias (white-label leve: logo da academia, plano do aluno no app) e para programas de bem-estar corporativo (Gympass/Wellhub como canal ou concorrente — avaliar na época). Pré-requisito: painel admin multi-tenant, fora do escopo até lá.
3. **Marketplace de treinadores (fase 3+, opcional):** personal remoto revisa/ajusta o plano do usuário por assinatura adicional. Alto potencial, alto custo operacional (supply, qualidade, responsabilidade) — só com base grande e time maduro.

## O que não fazer
- Anúncios no free: RPM baixo em PT-BR não paga o dano de percepção premium.
- Venda de dados: nunca (LGPD + marca).
- Moeda virtual/microtransação: incompatível com a categoria e o posicionamento.

## Unit economics (moldura, sem números inventados)
LTV = f(preço anual, % anual, churn anual, trial→paid). Disciplina: CAC pago só escala quando LTV/CAC estimado ≥ 3 com dados próprios de coorte (não benchmark de terceiros). Até lá, crescimento por loops orgânicos e UA-piloto de aprendizado (budget fixo pequeno, objetivo = calibrar funil, não crescer).

---

# 30. MVP Definition

## Critério de corte
Uma feature entra no MVP se, e somente se, remove um bloqueador da validação da hipótese central (seção 2): plano automático explicável + logger confiável → retenção de 4+ semanas → conversão viável. Feature que "agrega valor" mas não destrava validação: fora.

## MVP v1.0 — obrigatório

| # | Item | Por que é obrigatório |
|---|---|---|
| 1 | Onboarding 9 passos + preview com racional | sem isso não há personalização percebida — a tese cai |
| 2 | Gerador (seção 19, estágios 1–5 + dupla progressão) | o produto É isto |
| 3 | Catálogo ~250 exercícios com mídia e equivalências | qualidade mínima da prescrição e da substituição |
| 4 | Player completo com persistência à prova de falha | confiabilidade é a aposta competitiva nº 1 |
| 5 | Progresso: histórico, gráfico por exercício, PRs, frequência | sem prova de progresso não há retenção |
| 6 | Adaptação R1 (progressão), R2 básica (faltas), R6 (contexto) | mínimo de "plano vivo" |
| 7 | Freemium + trial + paywall (3 momentos) via RevenueCat | validação de conversão faz parte da tese |
| 8 | Push: treino do dia, plano não iniciado, PR, resumo, win-back 7d | retenção não valida sem CRM mínimo |
| 9 | Analytics completo (seção 27) + crash reporting | sem medição não há validação — inegociável no D1 |
| 10 | Offline-first no core loop | subordinado ao item 4 |
| 11 | LGPD: exportar/excluir conta, política de privacidade | obrigação legal e de loja |

## Explicitamente fora do v1.0 (com gatilho de entrada)

| Item | Entra em | Gatilho |
|---|---|---|
| Medidas corporais + fotos | v1.1 | ativação validada; pedido recorrente esperado |
| Live Activities / notificação rica de timer | v1.1 | polimento pós-estabilidade |
| Edição fina do plano (add/reorder exercício) | v1.1 | demanda do cluster 2 medida via feedback + `exercise_substituted` |
| Deload (R5) + platô (R4) | v1.2 | precisa de 8+ semanas de dados reais de usuários |
| Compartilhamento + indicação | v1.2 | só faz sentido com retenção provada (viralizar produto ruim queima mercado) |
| Quiz web, SEO, creators | fase 2 | funil interno saudável |
| Health/wearables, programas fechados | fase 2 | — |
| B2B2C, marketplace, nutrição, i18n | fase 3 | escala |

## Definition of done do MVP (gates de lançamento)
Critérios técnicos e de métrica na seção 36 (aceite) e 37 (lançamento). Resumo: crash-free > 99,5% em beta, zero perda de dados de sessão em suíte de teste de interrupção, funil instrumentado ponta a ponta, beta fechado de 100–200 usuários com 4 semanas de dados antes da loja aberta.

---

# 31. Phase 2 Roadmap

## Linha do tempo (relativa, não datada — datas dependem do time; assumindo squad de 4–6)

### MVP v1.0 — "O loop existe" (~4 meses de build + 1 de beta)
Escopo da seção 30. Objetivo de aprendizado: ativação e retenção W2–W4. Beta fechado → soft launch na loja sem UA.

### v1.1 — "O loop fica sólido" (+6–8 semanas)
- Medidas, peso e fotos de progresso; Live Activities/timer rico; edição fina do plano; hora preferida de push aprendida; melhorias do funil apontadas pelos dados do beta (esta linha é 30–40% do escopo da versão — reservar capacidade).
- Objetivo: retenção W4 e conversão trial→paid nos alvos; primeiros A/B de preço.

### v1.2 — "O loop cresce" (+8 semanas)
- Compartilhamento de PR/resumo; programa de indicação; platô (R4) + deload (R5); review prompt otimizado; win-back com oferta.
- Objetivo: primeiros loops orgânicos medidos; UA-piloto de aprendizado.

### Fase 2 — "Expansão de superfície" (trimestres 3–4)
- Apple Health / Health Connect; quiz web + SEO de biblioteca; programas fechados de 8–12 semanas; ênfase muscular por preferência no gerador; modo escuro se ainda não incluído; programa de creators/afiliados; UA escalada se unit economics fecharem.
- Objetivo: crescimento composto — cada superfície nova alimenta o funil existente.

### Fase 3 — "Novas linhas de negócio" (ano 2)
Candidatos avaliados por dados, não por roadmap fixo: social privado (treinar com amigos), B2B2C academias/corporativo, marketplace de revisão por treinador, nutrição (build/partner/skip), i18n (ES-LATAM primeiro — proximidade cultural e de catálogo), atleta avançado (RPE, periodização).

## Regras do roadmap
1. Nenhuma fase nova começa com a métrica-objetivo da anterior abaixo do alvo (crescer sobre funil quebrado só amplia o vazamento).
2. Capacidade permanente reservada para confiabilidade e dívida (~20%) — o princípio 1 não se sustenta sozinho.
3. Roadmap público curto (próxima versão apenas); visão longa é interna.
---

# 32. Technical Architecture

## Visão geral

```
┌──────────────────────────────────────────────────────┐
│  App (React Native + Expo)                            │
│  ┌──────────────┐  ┌───────────────┐  ┌────────────┐ │
│  │ UI (tabs +   │  │ Domínio local │  │ SQLite     │ │
│  │ player modal)│──│ gerador/regras│──│ (fonte da  │ │
│  └──────────────┘  └───────────────┘  │ verdade    │ │
│         │            sync engine ─────│ do device) │ │
└─────────┼──────────────────┬──────────┴────────────┘ │
          │                  │  fila de eventos (append-only)
   RevenueCat SDK            ▼
          │        ┌──────────────────────────┐
          ▼        │ Backend (Postgres +      │
   Lojas (IAP)     │ API: Supabase ou         │
          │        │ Node/NestJS + Postgres)  │
          ▼        │ auth · sync · catálogo · │
   RevenueCat ────▶│ webhooks assinatura      │
   (webhooks)      └───────┬──────────────────┘
                           │
        ┌──────────┬───────┴────────┬─────────────┐
        ▼          ▼                ▼             ▼
     CDN mídia   PostHog        OneSignal      Sentry
     (catálogo)  (analytics/    (push/CRM)     (crash)
                 flags/replay)
```

## Decisões e racionais

| Decisão | Escolha | Racional | Alternativa rejeitada |
|---|---|---|---|
| Framework mobile | **React Native + Expo (EAS)** | 1 codebase iOS/Android com squad pequeno; ecossistema BR de devs; Expo resolve build/OTA/push; performance suficiente (player é UI de formulário + timer, não jogo) | Flutter (equivalente tecnicamente; decisão por pool de contratação JS/TS e reuso web futuro). Nativo duplo: custo 2x injustificável no MVP |
| Persistência local | **SQLite (expo-sqlite) + camada de repositório**; considerar WatermelonDB se sync crescer | Fonte da verdade do device (princípio 1); transações reais; queries de histórico rápidas | AsyncStorage/MMKV para dados relacionais: inadequado. Realm: lock-in e manutenção incerta |
| Sync | **Fila de eventos append-only cliente→servidor + snapshots servidor→cliente** | Logs de treino são naturalmente append-only; idempotência simples via UUIDs de cliente; conflito raro por design (1 usuário, 1 device ativo no caso comum) | CRDT/sync framework genérico: complexidade injustificada para o modelo de dados |
| Backend | **Supabase (Postgres gerenciado + Auth + Storage + Edge Functions)** no MVP | Time-to-market; Postgres real (sem lock-in de modelo de dados); auth social pronta; RLS para isolamento | Firebase: Firestore dificulta agregações analíticas e a eventual migração; Node próprio desde o início: mais controle, menos velocidade — migrar para serviço próprio quando regras server-side crescerem (fase 2–3) |
| Gerador de treino | **No cliente (TypeScript puro, pacote isolado, sem I/O)** | offline, latência zero, testável por golden files; templates/parâmetros vêm de config versionada baixada do backend (ajustável sem release) | no servidor: quebraria offline-first do replanejamento |
| Assinaturas | **RevenueCat** | abstrai StoreKit/Play Billing, webhooks server-side como fonte de verdade de receita, experiments de preço prontos | integração direta com lojas: semanas de trabalho sem diferencial |
| Analytics + flags + replay | **PostHog** | 3 ferramentas em 1 no estágio inicial; self-serve; custo | Amplitude (melhor análise, mais caro, sem flags nativos) — migração possível pois a taxonomia (seção 27) é neutra de fornecedor |
| Crash | **Sentry** | padrão de mercado RN; source maps via EAS | — |
| Push | **OneSignal** (comportamental) + **notificações locais** (timer, treino do dia) | locais funcionam offline e sem backend — alinhado ao princípio 1 | — |
| Mídia | **CDN (Cloudflare R2/Stream ou Mux)** + cache local com pré-download do plano ativo em Wi-Fi | player nunca espera rede | embutir mídia no app: tamanho de binário proibitivo |
| CI/CD | GitHub Actions + EAS Build/Submit; OTA updates (expo-updates) para JS fixes | hotfix de logger em horas, não em ciclo de review de loja | — |

## Requisitos não-funcionais

- Cold start → Home interativa: < 2 s em hardware mediano Android (região prioritária tem muito Android de entrada — testar em device de R$ 1.200, não só em flagship).
- Tamanho do app: < 60 MB no download inicial (mídia é remota/cache).
- Player: 60 fps nas interações de log; zero jank no timer.
- Bateria: sessão de 60 min com tela ativa não pode ser reclamação recorrente — dimming automático + timer eficiente.
- Segurança: TLS everywhere; tokens em secure storage; RLS por usuário no Postgres; fotos de progresso (v1.1) em bucket privado com URLs assinadas curtas.
- LGPD: consentimento de analytics separado do funcional; exportação e exclusão automatizadas (S23); dados em repouso criptografados (default do provedor); DPA com subprocessadores.

---

# 33. Data Model

Entidades essenciais (Postgres server-side; espelho parcial em SQLite no device). PK = `id uuid` gerado no cliente quando a entidade nasce no device (idempotência de sync). Timestamps `created_at/updated_at` e `deleted_at` (soft delete) em tudo.

```
User            (id, email, auth_provider, created_at, locale, timezone)
Profile         (user_id FK, name, sex?, birth_year, height_cm?, weight_kg?,
                 preferred_workout_hour?, onboarding_completed_at)
TrainingProfile (id, user_id, goal, experience_level, current_state,
                 frequency, session_time_min, limitations[], version, active)
EquipmentProfile(id, user_id, label "Academia"/"Casa"/"Viagem",
                 equipment_tags[], is_default)
TrainingPlan    (id, user_id, training_profile_id FK, split_type,
                 cycle_length_weeks, cycle_number, status active|archived,
                 rationale_json, generated_by_version, created_at)
WorkoutDay      (id, plan_id FK, position, label "Inferiores A",
                 target_muscles[], est_duration_min)
WorkoutExercise (id, workout_day_id FK, exercise_id FK, position,
                 slot_type, sets, rep_min, rep_max, rest_s,
                 superset_group?, is_optional, substituted_from?)
Exercise        (schema completo na seção 20; server-owned, versionado,
                 sincronizado como bundle)
ExerciseMedia   (id, exercise_id FK, kind video|thumb, url, duration_s, checksum)
WorkoutSession  (id, user_id, workout_day_id FK?, plan_id FK,
                 started_at, ended_at?, status active|completed|partial|discarded,
                 duration_s, rpe?, device_id, notes?)
SetLog          (id, session_id FK, workout_exercise_id FK?, exercise_id FK,
                 set_number, weight_kg, reps, is_extra, is_pr,
                 logged_at, suggested_weight_kg?, suggested_accepted bool)
PRRecord        (id, user_id, exercise_id FK, pr_type max_weight|reps_at_weight|e1rm,
                 value, set_log_id FK, achieved_at)
ProgressMetric  (id, user_id, metric weight_kg|..., value, recorded_at)   -- peso etc.
BodyMeasurement (id, user_id, site waist|hip|arm|thigh|chest, value_cm,
                 recorded_at)                                              -- v1.1
ProgressPhoto   (id, user_id, storage_key, taken_at, angle front|side|back) -- v1.1
Subscription    (user_id, revenuecat_id, product_id, status, tier,
                 trial_ends_at?, renews_at?, source_platform)             -- espelho de webhook
NotificationPreference (user_id, type, channel, enabled, quiet_hours)
AdaptationEvent (id, user_id, rule_id R1..R6, trigger_json, action_json,
                 accepted?, created_at)                                   -- auditoria da inteligência
EventLog        (fila local de sync: id, entity, op, payload, synced_at?) -- device-side
```

Relações-chave: `User 1—N TrainingPlan` (histórico de planos preservado); `TrainingPlan 1—N WorkoutDay 1—N WorkoutExercise`; `WorkoutSession N—1 WorkoutDay` (nullable — sessão livre existe); `SetLog` referencia `exercise_id` diretamente além do `workout_exercise_id`, para que a linha de progressão de um exercício sobreviva a regenerações de plano (decisão importante: **o histórico pertence ao exercício, não ao plano**).

Índices críticos: `SetLog(user via session, exercise_id, logged_at)` para gráficos; `WorkoutSession(user_id, started_at)`; `PRRecord(user_id, exercise_id)`.

---

# 34. Admin and Operations Needs

Ferramentas internas mínimas para operar sem engenharia no caminho crítico:

- **CMS de catálogo (prioridade 1):** CRUD de exercícios com o schema da seção 20, upload/aprovação de mídia, edição de equivalências e contraindicações, fluxo draft→review→published (revisão obrigatória por profissional de educação física), versionamento e publicação de bundle. MVP aceitável: Retool/Directus sobre o Postgres — não construir do zero.
- **Editor de templates e parâmetros do gerador:** templates de split, alvos de volume, rep ranges e regras de tempo como configuração versionada (JSON no backend) com ambiente de preview ("simular usuário: intermediário, 4x, casa, joelho") antes de publicar. Elimina release de app para tuning de prescrição.
- **Painel de suporte:** busca de usuário, status de assinatura (link RevenueCat), últimos eventos, reenvio de e-mail, exclusão/exportação LGPD manual como fallback, concessão de premium cortesia (até X dias, com log).
- **Experimentos e flags:** PostHog flags para gating de rollout; RevenueCat experiments para preço; documento vivo de experimentos (hipótese → métrica → resultado → decisão).
- **CRM:** edição de templates de push/e-mail (OneSignal/ferramenta de e-mail) sem deploy; calendário de mensagens para evitar colisões com o cap da seção 26.
- **Observabilidade de negócio:** dashboards da seção 27 + alertas: queda de crash-free < 99,5%, falha de webhook de assinatura, taxa de `session_recovered` anômala (sinal de bug de persistência), erro de geração > 0.
- **Runbook de conteúdo:** processo quinzenal de revisão de exercícios mais trocados/pulados (`exercise_substituted/skipped` por template) → ajuste de curadoria.

Time operacional mínimo no lançamento: 1 pessoa de conteúdo/EF (catálogo + templates), suporte compartilhado (founder/CS part-time), produto/growth nos experimentos.

---

# 35. Edge Cases and Failure Scenarios

| # | Cenário | Comportamento exigido |
|---|---|---|
| 1 | App fechado/crash/reboot no meio do treino | Sessão restaurada por completo na reabertura (≤ 8 h): série corrente, logs, relógio de sessão via âncora absoluta. Timer de descanso em curso é descartado (retomar contagem velha confunde). Zero perda de SetLog — garantido por write-through (seção 21) |
| 2 | Sem internet (academia com sinal ruim é o caso comum, não a exceção) | Core loop 100% funcional: plano, player, log, timer, substituição (catálogo local), progresso (dados locais). Mídia não cacheada → thumbnail + instruções de texto. Sync silencioso ao reconectar. Banner apenas quando algo visível é afetado |
| 3 | Usuário muda objetivo no meio do ciclo | Regeração com diff explicado; plano antigo arquivado; histórico e linhas de progressão preservados (histórico pertence ao exercício — seção 33); ciclo reinicia |
| 4 | Troca academia → casa (ou modo viagem) | Perfil de equipamento alternativo → adaptação por equivalência do treino do dia sem tocar no plano; troca permanente → regeração completa com diff |
| 5 | Exercício prescrito não executável (máquina quebrada, ocupada, incapacidade) | Substituição em 2 toques; se a família de equivalência não tem opção para o equipamento → nunca beco sem saída: oferecer pular com registro + fallback bodyweight genérico do mesmo músculo |
| 6 | Plano incompatível com a rotina real (faltas sistemáticas) | R2: 3+ faltas → card de replanejamento; leitura "o plano está errado", não "o usuário falhou" |
| 7 | Usuário sente dor durante exercício | Ação imediata no player: "Senti desconforto" no menu do exercício → interrompe exercício, oferece substituto de baixo estresse ou pular; registra para R3; dor persistente → mensagem padrão de encaminhamento a profissional. Nunca minimizar, nunca diagnosticar |
| 8 | Timer falha (app suspenso pelo OS, permissão negada, modo foco) | Timer baseado em timestamp absoluto — recalcula correto ao voltar; notificação local como redundância; sem permissão → in-app + aviso único. Pior caso degradado: usuário conta o descanso — o log nunca é afetado |
| 9 | Duplicidade de sessão (2 devices, restore de backup, retry de sync) | Idempotência por UUID de cliente; sessões de devices distintos coexistem no histórico com badge de device; ferramenta de mesclar/excluir no detalhe da sessão |
| 10 | Assinatura expira no meio do treino | Nada muda até a sessão terminar. Gating premium se aplica na navegação seguinte. Nunca interromper treino por cobrança |
| 11 | Restore de compra falha / troca de aparelho | "Restaurar compras" no Perfil + verificação automática de entitlement no login (RevenueCat por user_id) |
| 12 | Peso/reps absurdos digitados (500 kg × 1 no supino da Camila) | Validação suave: valor > 2,5× o máximo histórico → confirmação inline ("Confirmar 180 kg?"); nunca bloquear (o valor pode ser real). PR só com confirmação nesses casos — protege a integridade das celebrações e dos futuros cards sociais |
| 13 | Catálogo desatualizado no device vs. plano novo do servidor | Plano referencia versões de exercício; bundle delta baixa antes de ativar plano novo; incompatibilidade → app segura o plano antigo até completar o download (nunca plano com buracos) |
| 14 | Fuso horário / virada de dia durante treino noturno | Sessão pertence ao dia de `started_at` local; streak semanal calculado no fuso do usuário; viagem com mudança de fuso não quebra a semana |
| 15 | Exclusão de conta com assinatura ativa | Fluxo avisa que a assinatura deve ser cancelada na loja (não podemos cancelar por ele), executa exclusão LGPD, registra `account_deleted` com motivo opcional |

---

# 36. QA and Acceptance Criteria

Critérios de aceite por módulo — cada um vira caso de teste (unitário, integração ou E2E via Maestro/Detox).

## Onboarding e geração
- [ ] Fechar o app em qualquer passo e reabrir retoma no mesmo passo com respostas preservadas.
- [ ] Onboarding completo executável 100% offline.
- [ ] Toda combinação válida de parâmetros gera plano sem erro (teste combinatório: 5 objetivos × 4 níveis × 4 estados × 4 locais × 5 frequências × 4 tempos × 6 limitações — suite de golden files do gerador).
- [ ] Nenhum plano gerado contém exercício fora do inventário de equipamento (asserção automática na suíte).
- [ ] Nenhum plano viola exclusões de limitação (idem).
- [ ] Duração estimada de cada dia ≤ tempo declarado + 15% (idem).
- [ ] Mesmo perfil + mesma seed → mesmo plano (determinismo).
- [ ] Racional exibido no preview cita corretamente ≥ 3 respostas do usuário.

## Player e persistência (suíte mais crítica do produto)
- [ ] Log do caso comum em 1 toque; série aparece confirmada em ≤ 150 ms.
- [ ] Kill do processo imediatamente após log de série → reabrir → série presente. (Teste automatizado de interrupção: matar o app após cada operação mutante e verificar estado.)
- [ ] Reboot do device com sessão ativa → retomada íntegra.
- [ ] Modo avião durante sessão inteira → treino completo → reconectar → sync sem perda nem duplicata (verificar por UUIDs no backend).
- [ ] Timer correto após 10 min de app em background (âncora absoluta, desvio < 1 s).
- [ ] Notificação de fim de descanso dispara com app em background e tela bloqueada (iOS e Android, incluindo Android com battery optimization agressiva — testar Xiaomi/Samsung).
- [ ] Substituição filtra por equipamento do contexto ativo; "sempre" persiste no plano; "hoje" não.
- [ ] Sessão inativa > 8 h → oferta salvar parcial/descartar; parcial aparece no histórico com flag.
- [ ] Duas sessões simultâneas de devices distintos → ambas persistem, nenhuma sobrescreve.

## Progresso
- [ ] Gráfico por exercício consistente com SetLogs (teste de reconciliação com dataset conhecido).
- [ ] PR detectado corretamente nos 3 tipos; sem PRs em cascata na semana 1 (regra F10).
- [ ] Volume semanal bate com Σ(peso×reps) das sessões da semana no fuso do usuário.
- [ ] Free vê exatamente 30 dias; premium vê tudo; transição free→premium revela histórico antigo intacto (dados nunca são apagados, só ocultados).

## Assinatura
- [ ] Trial→paid, cancelamento, expiração e restore refletem entitlement correto em ≤ 5 min (webhook) e imediatamente após restore manual.
- [ ] Compra no meio do fluxo contextual devolve o usuário ao ponto de origem com a feature ativa.
- [ ] Expiração durante sessão ativa não interrompe o treino (edge 10).
- [ ] Sandbox de ambas as lojas coberto em checklist de release.

## Notificações
- [ ] Cada trigger da seção 26 dispara nas condições e respeita supressões, caps e quiet hours (testes de integração com relógio simulado).
- [ ] Opt-out granular efetivo por tipo.
- [ ] Deep links de todas as mensagens abrem a tela correta com app morto, em background e aberto.

## Transversal
- [ ] Crash-free sessions > 99,5% no beta antes de loja aberta.
- [ ] Cold start < 2 s no device Android de referência (entrada).
- [ ] Todos os eventos da seção 27 verificados em staging com QA de payload (nome, propriedades, momento).
- [ ] Exportação de dados gera arquivo completo; exclusão remove dados pessoais e é confirmada por e-mail.
- [ ] Acessibilidade: player operável com Dynamic Type 120%, alvos ≥ 44 pt auditados, contraste AA.

---

# 37. App Store and Launch Readiness

## Assets de loja
- **Nome/subtítulo (ASO PT-BR):** "WinFit — Treino de Academia" / subtítulo com keywords reais de busca: "Ficha de treino, musculação". Pesquisa de keywords antes do lançamento (ferramenta de ASO); nome final validado contra disponibilidade de marca e domínio.
- **Screenshots (6–8, narrativa na ordem):** 1) plano personalizado (preview real), 2) player com log e timer, 3) gráfico de carga subindo, 4) PR celebrado, 5) treino em casa/equipamentos, 6) resumo semanal. Cada uma com headline de benefício em PT-BR. Sem corpos sarados de banco de imagem — screenshots do produto real (posicionamento, seção 6).
- **Preview em vídeo (15–20 s):** fluxo real onboarding→plano→log de série→gráfico.
- **Descrição:** primeiro parágrafo = proposta de valor da seção 5; lista de capacidades concretas; transparência de assinatura (preço, trial, cancelamento) — reduz reviews negativas de "cobrança surpresa".

## Estratégia de reviews
- Prompt nativo de avaliação após o 3º treino concluído **e** ≥ 1 PR na sessão (pico emocional), máx. 1x/versão, nunca após sessão com erro.
- Resposta a reviews negativas ≤ 48 h; reviews citando perda de dados = incidente P0 com investigação obrigatória.

## Gates para abrir UA paga (do beta/soft launch)
**[Metas-hipótese — a régua importa mais que o número exato; recalibrar com as primeiras coortes]**
- Crash-free sessions > 99,5%; zero incidentes de perda de dados em 4 semanas.
- Onboarding→plano ≥ 70%; instal→primeiro treino ≤ 72 h ≥ 40%.
- Retenção W2 ≥ 30%, W4 ≥ 20% (coortes orgânicas).
- Trial→paid ≥ 30%; refund rate < 5%.
- Funil da seção 27 auditado e dashboards vivos.

## Plano de lançamento
1. **Beta fechado (TestFlight/Internal testing, 100–200 usuários recrutados em comunidades fitness BR)** — 4 semanas, foco em confiabilidade e ativação.
2. **Soft launch (loja aberta, sem mídia)** — 4–6 semanas, coortes orgânicas + ASO, iteração v1.1.
3. **Lançamento com mídia** — UA-piloto + creators-piloto, somente com gates verdes.

---

# 38. Brand and UX Direction

## Sensação-alvo
Equipamento profissional, não brinquedo: o app deve transmitir a sensação de uma boa balança de academia ou um bom relógio esportivo — preciso, sóbrio, confiável, com momentos de calor humano nos picos (PR, resumo). Premium aqui significa **clareza, velocidade e consistência**, não gradientes e efeitos.

## Direção visual
- **Base escura no player** (contexto de academia, contraste sob luz ruim, menos bateria em OLED) com modo claro no restante configurável; tipografia forte para números — os números são os heróis visuais do produto (carga, reps, timer, PRs).
- Paleta: neutros profundos + 1 cor de ação vibrante e própria (evitar o verde-fluor e o laranja que saturam a categoria) + cor de celebração usada exclusivamente em PRs/conquistas (escassez preserva o significado).
- Iconografia sólida e literal; anatomia estilizada limpa no mapa muscular (nada de ilustração médica agressiva nem boneco infantil).
- Motion: funcional e curto (≤ 250 ms); a única animação "generosa" permitida é a celebração de PR.

## Linguagem e tom
- PT-BR direto, de treinador bom: firme, encorajador, sem gritar. "Fechou as 12? Semana que vem sobe." / "Semana difícil. O plano se ajusta — bora recomeçar leve."
- Proibido: motivacional vazio ("acredite em você!"), culpa ("você falhou"), diminutivos infantilizantes, anglicismo desnecessário ("workout" → "treino"), jargão de fisiologia sem explicação na primeira ocorrência.
- Números sempre com contexto de tendência ("+2,5 kg vs. último treino"), nunca soltos.

## O que evitar (anti-referências)
- Estética "suplemento de marketplace": preto + vermelho agressivo + caveiras.
- Estética "wellness pastel": suave demais para a promessa de método e progressão.
- Excesso de fotografia de corpos: o produto celebra números e consistência; corpos idealizados alienam exatamente as personas de maior volume (Camila, Marcos).

---

# 39. Risks and Mitigation

| # | Risco | Prob. | Impacto | Mitigação | Sinal de alerta (métrica) |
|---|---|---|---|---|---|
| 1 | Retenção W2–W4 abaixo do viável (a tese não fecha) | média | fatal | roteiro das 2 primeiras semanas (seção 24); beta de 4 semanas antes de escalar; ciclo de iteração curto sobre o funil de ativação | retenção por coorte; `first_workout_completed` |
| 2 | Onboarding com drop-off alto | média | alto | 9 passos, 1 pergunta/tela, medição por passo, corte de pergunta que não muda output | `onboarding_step_completed` por passo |
| 3 | Percepção de plano genérico ("me deu ficha de app") | média | alto | racional explícito no preview e nas mudanças; seed de variação; qualidade dos templates com revisão profissional | `rationale_opened`; churn D1–D3; reviews |
| 4 | Paywall cedo/agressivo envenena ativação | baixa (por design) | alto | princípio 4 codificado; A/B do momento 1; monitorar reviews mencionando cobrança | conversão vs. retenção por coorte de exposição a paywall |
| 5 | Catálogo fraco (mídia ruim, equivalência errada, exercício inviável prescrito) | média | alto | checklist de publicação com revisão de EF; asserções automáticas de equipamento/limitação; runbook quinzenal (seção 34) | `exercise_substituted/skipped` por exercício; reviews |
| 6 | Bug de perda de dados no logger | baixa (se o contrato da seção 21 for cumprido) | fatal para a marca | suíte de testes de interrupção no CI; write-through; alerta de `session_recovered` anômalo; resposta P0 a review citando perda | `session_recovered`; reviews 1 estrela |
| 7 | Diferenciação insuficiente vs. Befit/Hevy/Fitbod | média | alto | não competir por lista de features; concentrar nos 20% (seção 7); recomeçante e explicabilidade como cunhas visíveis no marketing | trial→paid; CAC de UA-piloto |
| 8 | Analytics incompleto no lançamento → decisões cegas | baixa | alto | taxonomia é item P0 do MVP (seção 30, item 9); QA de eventos como critério de aceite | auditoria pré-launch |
| 9 | Custo de mídia do catálogo estoura | média | médio | top 100 em vídeo próprio + cauda em animação licenciada; produção em lotes | orçamento de produção |
| 10 | Dependência de fornecedores (Supabase/RevenueCat/PostHog) | baixa | médio | dados em Postgres padrão + taxonomia neutra + exportação contínua; camadas de abstração finas no app | — |
| 11 | Risco regulatório-percebido (prescrição de exercício, dor) | baixa | médio | copy revisada juridicamente; R3 sempre encaminha a profissional; disclaimers no onboarding com limitações; sem promessas de saúde | — |
| 12 | Sazonalidade fitness (pico jan., vale no inverno) | alta | médio | planejamento de caixa e UA contracíclica; win-back forte; anual como amortecedor de churn sazonal | MRR por mês |

---

# 40. Final Product Verdict

## Avaliação honesta da tese

A tese é boa e é executável — mas não porque a ideia seja nova. Apps de treino com geração de plano existem e monetizam; isso é evidência de mercado, não obstáculo. A oportunidade real está em três assimetrias que a concorrência deixa abertas:

1. **Confiabilidade como diferencial competitivo de verdade.** Na categoria, o histórico é o produto — e ainda assim perder dados de sessão é falha comum. Um logger que comprovadamente nunca perde uma série é diferencial técnico barato de comunicar ("seus dados, sempre") e caríssimo de copiar depois que a arquitetura errada está no lugar. É a aposta mais defensável deste documento.

2. **Explicabilidade da personalização.** O gerador semi-determinístico com racional visível transforma o mesmo output técnico em valor percebido superior. Custa templates bem curados e frases bem escritas — não custa pesquisa de IA. Alavanca de percepção desproporcional ao custo.

3. **Paywall pós-valor + free funcional.** A concorrência monetiza a ansiedade do primeiro dia; este produto monetiza o acúmulo de valor da quarta semana. É uma aposta de fluxo de caixa mais lenta e de LTV maior — coerente com a meta de 60% de assinaturas anuais.

## Maiores alavancas (em ordem)

1. **Ativação:** install → primeiro treino concluído em 72 h. Tudo entre o first open e o fim do primeiro treino merece obsessão desproporcional.
2. **Prova de progresso nas semanas 2–4:** o primeiro PR real e o primeiro resumo semanal são os eventos que decidem retenção — e retenção decide tudo.
3. **Preço do anual e momento do paywall:** as duas variáveis de maior elasticidade de receita; testáveis desde cedo com RevenueCat.
4. **Qualidade do catálogo:** invisível quando boa, fatal quando ruim.

## Maiores riscos

O risco fatal é o nº 1 da tabela: retenção estrutural da categoria fitness é baixa porque o comportamento subjacente (treinar) é difícil. Nenhum app resolve isso por completo; o produto está desenhado para mover a margem (progresso percebido, adaptação a faltas, recomeçante como cidadão de primeira classe), e a margem é onde o negócio vive ou morre. O segundo risco é disciplina de escopo: este documento corta muito (nutrição, social, atleta avançado) — a tentação de reabrir esses cortes antes de validar o core é o modo de falha clássico.

## Onde está a vantagem competitiva real

Não está em nenhuma feature isolada — todas são copiáveis. Está na **coerência do sistema**: um conjunto de decisões (offline-first, explicabilidade, free funcional, retenção por progresso, recomeçante, PT-BR nativo) que se reforçam e que a concorrência, com arquiteturas e modelos de monetização já comprometidos, não copia sem custo estrutural. Produtos ganham de incumbentes não por fazer mais, mas por estar inteiramente certos sobre menos coisas.

**Veredito: construir.** Com a sequência exata da seção 31, os gates da seção 37 e a disciplina de não escalar mídia antes de retenção validada.

---

*Fim do documento. Próximos passos naturais: (1) wireframes das telas S1–S23 a partir da seção 17; (2) golden files do gerador a partir da seção 19; (3) backlog do MVP a partir das seções 14 e 30, na ordem M4 → M3 → M5 → M2 → M6 → M8 → M9.*
