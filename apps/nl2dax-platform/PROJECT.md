# NL2DAX Platform — Spec de Projeto

> Plataforma de IA que conversa com o modelo semântico do Power BI/Fabric via REST APIs,
> respondendo perguntas de negócio em linguagem natural, respeitando RLS e governança de dados.
> Objetivo de posicionamento: peça de portfólio "engenheiro de IA sênior" + produto com potencial
> de venda real (self-service "talk to your data", curado por quem entende as regras de negócio).

**Importante — propriedade intelectual:** este projeto é uma reimplementação do zero, usando
só APIs públicas da Microsoft e documentação oficial. Nenhum código, config, schema ou dado do
empregador atual entra aqui. A experiência de já ter feito isso no trabalho serve pra saber
*o que* construir e *quais armadilhas* evitar — não pra copiar artefato nenhum.

---

## 1. O problema que resolve

Analista de negócio quer resposta, não quer aprender DAX. Hoje as opções são:

- **Copilot for Power BI** — só dentro do relatório, exige modelo "AI-ready" bem rotulado,
  em muitos tenants trava atrás de capacidade Fabric cara (F64+) pra features avançadas.
- **Fabric Data Agent / "Chat with your Data"** — mais completo, mas ainda Microsoft-nativo,
  genérico, não é curado por quem manja da regra de negócio específica do cliente.
- **Nada no mercado hoje** entrega uma camada de curadoria humana + deploy rápido em qualquer
  tenant com licença simples (Pro), sem depender de capacidade Premium.

Ver seção 9 (pesquisa de mercado) pra detalhe da concorrência.

## 2. Diferencial da plataforma

1. **Roda com licença Pro** (confirmado: API `ExecuteQueries` não exige Premium/PPU/Fabric,
   funciona em shared capacity — ver seção 8). Isso derruba a barreira de entrada pra qualquer
   cliente que já tem Power BI, sem upsell de capacidade.
2. **Curadoria de regra de negócio**: não é só "pergunta → DAX genérico". Camada intermediária
   onde alguém que entende o negócio do cliente define contexto, sinônimos, métricas prioritárias,
   guardrails de pergunta ambígua.
3. **Respeita RLS nativamente** — a query roda no contexto do usuário autenticado, o motor do
   Power BI aplica RLS antes de qualquer coisa. Plataforma nunca vê dado fora da permissão do user.
4. **Deploy rápido** — pensado pra instalar num cliente novo em dias, não meses.

## 3. Arquitetura (visão alta)

```
Usuário (chat) 
   → App Web/API (backend)
       → LLM: gera DAX a partir da pergunta + metadata do modelo (schema-aware)
       → Fabric/Power BI REST API "Execute Queries" (autenticado como o usuário via OAuth,
         não como service principal — é isso que garante RLS)
       → Resultado tabular volta
       → LLM formata resposta em linguagem natural / sugestão de visual
   ← Resposta no chat
```

Componentes:

- **Metadata layer**: le schema do semantic model (tabelas, colunas, medidas, relacionamentos,
  descrições) via XMLA endpoint / INFO() DAX functions / Fabric REST — vira contexto do prompt.
- **NL→DAX engine**: LLM (Claude) com prompt grounded no schema real, gera DAX válido.
  Loop de validação: roda a query, se erro de sintaxe/coluna inexistente, corrige e tenta de novo
  (self-correction, poucas iterações, timeout curto).
- **Auth layer**: OAuth on-behalf-of do usuário final — nunca service principal genérico,
  senão RLS não se aplica. Esse é o ponto mais delicado de segurança do projeto inteiro.
- **Curadoria layer**: painel onde o "dono do negócio" cadastra glossário, medidas favoritas,
  perguntas frequentes pré-validadas, guardrails (o que o bot não deve responder).
- **Chat interface**: web simples pra V1. Slack/Teams como V2.

## 4. Stack sugerida

- Backend: Python (FastAPI) ou Node — o que o Gigio já domina rápido é Python.
- LLM: Claude via Anthropic SDK (tool use pra rodar query, self-correction loop).
- Auth: MSAL (Microsoft Authentication Library) pra OAuth delegado contra Power BI REST API.
- Frontend: Next.js — reaproveita padrão que ele já usa no poup/dark.
- Persistência de curadoria (glossário, regras): Postgres/Supabase.

## 5. Testar sem licença/empresa — como resolver AGORA

Ele não tem Pro nem tenant. Caminho gratuito, sem esperar nada:

1. **Microsoft 365 Developer Program** (https://developer.microsoft.com/microsoft-365/dev-program)
   — cadastro grátis, gera um **tenant sandbox E5 com 25 usuários**, renovável a cada 90 dias
   enquanto ativo. E5 inclui **Power BI Pro** pra todos os 25 usuários. Isso resolve licença
   E tenant ao mesmo tempo.
2. Ativar **"Instant sandbox with sample data"** no cadastro — já vem com dados de exemplo
   (Contoso) prontos, pra não perder tempo montando modelo do zero.
3. Semantic model de teste: usar o dataset de exemplo Contoso ou publicar um `.pbix` próprio
   (Power BI Desktop é grátis) com AdventureWorks — schema público, sem risco de PII/LGPD.
4. Habilitar tenant setting **"Dataset Execute Queries REST API"** em Admin Portal →
   Integration settings (ele vai ser admin do próprio tenant sandbox, então consegue ligar isso).
5. Testar RLS: criar 2 usuários no tenant sandbox, aplicar role de RLS no modelo, confirmar
   que a API retorna dado filtrado por usuário — esse teste é o coração da tese de segurança
   do produto, tem que estar em vídeo/print no portfólio.

Isso dá ambiente completo, grátis, isolado de qualquer empresa, pronto pra construir e gravar
demo sem esbarrar em NDA nenhum.

## 6. Fases de build

**Fase 0 — Setup**
- Criar tenant sandbox (seção 5).
- Publicar semantic model de exemplo com RLS configurado.
- Confirmar acesso à Execute Queries API via Postman/curl antes de escrever código.

**Fase 1 — Núcleo NL2DAX**
- Extrair metadata do modelo (schema-aware prompt).
- Prompt + Claude gera DAX a partir de pergunta simples ("total de vendas em 2024").
- Self-correction loop em cima de erro de query.
- CLI simples validando o pipeline ponta a ponta.

**Fase 2 — Auth delegado + RLS**
- Implementar OAuth on-behalf-of do usuário (não service principal).
- Testar com os 2 usuários RLS do sandbox — provar isolamento de dado.

**Fase 3 — Chat web**
- Interface de chat (Next.js) plugada no backend.
- Resposta em linguagem natural + tabela/visual simples do resultado.

**Fase 4 — Curadoria**
- Painel de glossário/regras de negócio.
- Perguntas pré-validadas, guardrails.

**Fase 5 — Deploy story**
- Documentar processo de onboarding de um cliente novo (quanto tempo leva, o que precisa
  do lado do cliente: admin habilitar tenant setting, permissão no modelo).
- Isso é o argumento de venda pro Leonardo/Bas: "instala em X dias, não meses".

## 7. Portfólio / narrativa

Ao terminar, o case entra no portfólio (giovaniramosferreira.github.io) com o critério que já
vale pros outros projetos: decisão de engenharia + trade-off, não lista de stack. Pontos fortes
pra puxar na narrativa:
- Por que OAuth delegado e não service principal (decisão de segurança, não genérica).
- Por que Pro é suficiente e como isso muda o modelo de negócio vs. concorrência.
- Self-correction loop do LLM gerando DAX — trade-off de latência vs. confiabilidade.

## 8. Licenciamento da API (confirmado por pesquisa)

- `Execute Queries` REST API roda em **Power BI Pro**, inclusive em **shared capacity**.
  Premium/PPU/Fabric **não é obrigatório**.
- Requer tenant setting "Dataset Execute Queries REST API" habilitada (Integration settings).
- Usuário precisa de permissão **read + build** no dataset.
- Rate limit: 40 requisições/minuto por usuário em Pro/PPU.
- Aceita **só DAX** (não M, não SQL).
- Fontes: [Microsoft Learn — Execute Queries](https://learn.microsoft.com/en-us/rest/api/power-bi/datasets/execute-queries),
  [endjin — Why care about ExecuteQueries API](https://endjin.com/blog/2022/01/why-care-about-new-power-bi-execute-queries-api)

## 9. Pesquisa de mercado (concorrência, levantada em 2026-08-11)

**Não existe hoje um SaaS independente vendendo "NL2DAX" como produto isolado.** O que existe:

- **Copilot for Power BI** — chat pane dentro do relatório, gera DAX/visual. Exige Q&A habilitado
  e modelo "AI-ready". [Microsoft Learn](https://learn.microsoft.com/en-us/power-bi/create-reports/copilot-introduction)
- **"Chat with your Data" (preview)** — experiência full-screen no Fabric, fora do relatório.
  [Blog oficial](https://powerbi.microsoft.com/en-us/blog/the-next-era-of-copilot-in-power-bi-chat-with-your-data/)
- **Fabric Data Agent** — conecta semantic model como fonte pra sistemas conversacionais
  (Teams, apps custom). É o mais parecido com a tese do produto.
  [Microsoft Learn](https://learn.microsoft.com/en-us/fabric/data-science/concept-data-agent)
- Update jun/2026 da Microsoft: empurrando semantic model como "API pra agentes", aparecendo
  até no M365 Copilot — sinal de que a direção do mercado valida a tese, mas também que a
  Microsoft pode nativizar isso rápido. Diferencial tem que ser curadoria + custo + velocidade
  de deploy, não a tecnologia em si.
  [Medium](https://medium.com/microsoft-power-bi/power-bi-june-2026-the-update-that-turns-your-semantic-model-into-an-api-for-agents-2f7d267f9781)
- **NL2DAX (GitHub, Arturo Quiroga/MSFT)** — protótipo pessoal de um engenheiro Microsoft,
  NL→DAX/SQL pra Azure SQL DB. Não é produto, é demo solta, sem manutenção de produto.
  [GitHub](https://github.com/Arturo-Quiroga-MSFT/NL2DAX)

**Conclusão:** espaço aberto pra um produto de nicho, especialmente em clientes que não querem
(ou não podem) pagar capacidade Fabric premium. Janela pode fechar conforme Microsoft nativiza
mais — vale mover rápido.

## 10. Riscos / pontos de atenção

- **Segurança do auth delegado** é o ponto que mais pode dar errado — se implementar errado e
  vazar RLS, o produto inteiro perde a tese. Testar isso obsessivamente antes de qualquer demo.
- **Custo de LLM por query** — cada pergunta = pelo menos 1 chamada de LLM (mais retries de
  self-correction). Modelar custo por cliente antes de precificar.
- **Confiabilidade do DAX gerado** — perguntas ambíguas geram DAX errado silenciosamente
  (roda, mas responde a pergunta errada). Curadoria (seção 3) existe justamente pra mitigar isso.

---

*Gerado em 2026-08-11 a partir de pesquisa de mercado e licenciamento feita em conversa com
Claude. Migrar este arquivo pro Claude Code pra iniciar Fase 0.*
