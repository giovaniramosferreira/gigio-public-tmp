# NL2DAX Platform — Plano de Execução Detalhado

> Complementa `PROJECT.md` (visão/arquitetura alta). Este arquivo é o "como fazer",
> passo a passo, pra Fase 0 e pros fundamentos técnicos do motor NL→DAX.
> Pesquisado em 2026-08-11. Fontes citadas em cada seção.

---

## FASE 0 — Ambiente de teste (bloqueante, faz isso primeiro)

Sem isso, nada mais roda. Objetivo: tenant Microsoft próprio, com Power BI Pro, semantic
model publicado, RLS configurado com 2 usuários, e a API `Execute Queries` respondendo.

### 0.1 — Criar o tenant sandbox (grátis)

1. Ir em https://developer.microsoft.com/microsoft-365/dev-program e entrar no programa
   (conta Microsoft pessoal serve).
2. No fluxo de setup, escolher **"Instant sandbox"** (opção padrão, topo da lista) —
   ambiente E5 pré-configurado, pronto em minutos.
3. Vai pedir conta de billing (nome, telefone, endereço) só pra cadastro — **não cobra nada**
   a menos que você compre algo manualmente depois. Confirmar isso durante o setup.
4. Marcar a opção de **dados de exemplo** (sample data) se aparecer — evita ter que montar
   schema do zero.
5. Resultado: tenant com **25 licenças Power BI Pro** (parte do E5), você é Global Admin.

Fonte: [Microsoft Learn — Set up a Microsoft 365 developer sandbox subscription](https://learn.microsoft.com/en-us/office/developer-program/microsoft-365-developer-program-get-started)

### 0.2 — Habilitar a API Execute Queries no tenant

1. Entrar no **Power BI Admin Portal** (fabric.microsoft.com/admin-portal) com a conta
   Global Admin do sandbox.
2. Ir em **Tenant settings → Integration settings**.
3. Habilitar **"Dataset Execute Queries REST API"**.
4. (Escopo: habilitar pro tenant inteiro é suficiente pra ambiente de teste; em produção
   real dá pra restringir por grupo de segurança.)

### 0.3 — Publicar semantic model de teste com RLS

1. Power BI Desktop (grátis) → montar/importar modelo com dataset público
   (AdventureWorks ou o Contoso de exemplo do sandbox).
2. Modeling tab → **Manage Roles** → criar 2 roles com filtro DAX diferente
   (ex: `[Regiao] = "Sul"` vs `[Regiao] = "Norte"`).
3. Testar localmente com **View As** antes de publicar (Modeling → View As Roles).
4. Publicar no workspace do tenant sandbox.
5. No Service, ir em **Security** do dataset → mapear os 2 usuários de teste
   (criar 2 usuários no sandbox: Admin Portal → Users) cada um numa role diferente.

Fonte: [Microsoft Fabric — Row-level security (RLS)](https://learn.microsoft.com/en-us/fabric/security/service-admin-row-level-security)

### 0.4 — Registrar o app no Azure AD (Entra ID) — **delegado, não service principal**

Ponto crítico, ler com atenção: **RLS + Execute Queries só funciona com token delegado do
usuário final.** Service principal (app-only) tem suporte quebrado/limitado pra RLS nessa
API especificamente — confirmado por múltiplos threads da comunidade Fabric. Se você
registrar como service principal achando que é mais simples, o produto inteiro perde a
tese de segurança (RLS não aplica de verdade).

Passo a passo:

1. Azure Portal (portal.azure.com, dentro do tenant sandbox) → **Entra ID → App registrations
   → New registration**.
2. Nome: `nl2dax-platform-dev`. Tipo de conta: single tenant (só o sandbox, por enquanto).
3. **Redirect URI**: tipo "Mobile and desktop applications" ou "Web" dependendo de onde vai
   rodar o backend — pra teste local, `http://localhost:3000/auth/callback` funciona.
4. **API permissions → Add a permission → Power BI Service** (não "Microsoft Graph") →
   **Delegated permissions** → adicionar:
   - `Dataset.Read.All` (ler metadata + rodar Execute Queries)
   - `Workspace.Read.All` (listar workspaces, opcional mas útil)
5. Clicar **Grant admin consent** (você é Global Admin do sandbox, pode conceder direto).
6. Guardar **Application (client) ID** e **Directory (tenant) ID** — vão pro `.env` do
   backend, nunca hardcoded (ver [[gigio-secret-hardcoded-pattern]] na memória do workspace).

Fluxo de auth: usuário loga (MSAL, browser redirect) → backend recebe token delegado do
usuário → usa esse token pra chamar `Execute Queries` → RLS aplica automaticamente baseado
em quem é o usuário logado, sem precisar passar `EffectiveIdentity` manual (isso só é
necessário no cenário "embed for customers"/app-owns-data, que não é o nosso caso).

Fontes:
[Microsoft Q&A — Delegated vs Service Principal](https://community.fabric.microsoft.com/t5/Fabric-platform/Power-BI-Rest-API-Delegated-permissions-vs-Service-principal/m-p/4133831),
[Community — Service Principal + RLS + ExecuteQueries (limitação confirmada)](https://community.fabric.microsoft.com/t5/Developer/Service-Principal-RLS-ExecuteQueries-REST-API/m-p/4805401)

### 0.5 — Teste de fumaça (antes de escrever qualquer código do produto)

1. Via Postman/curl, autenticar como usuário 1 (MSAL device code flow serve pra teste manual).
2. Chamar `POST /v1.0/myorg/groups/{workspaceId}/datasets/{datasetId}/executeQueries` com
   uma DAX simples (`EVALUATE VALUES('Tabela'[Coluna])`).
3. Confirmar que o resultado vem filtrado pela role do usuário 1.
4. Repetir com usuário 2, confirmar resultado diferente.
5. **Só depois desse teste passar** começa a Fase 1 do PROJECT.md.

Isso é o "Definition of Done" da Fase 0 — sem isso confirmado, não adianta escrever backend.

---

## Arquitetura do motor NL→DAX (fundamentos técnicos)

### Extração de schema (grounding do prompt)

O LLM precisa saber a estrutura real do modelo antes de gerar DAX — nunca alucinar nome de
tabela/coluna. Fonte de metadata: **DAX INFO functions** (`INFO.VIEW.TABLES()`,
`INFO.VIEW.MEASURES()`, `INFO.VIEW.COLUMNS()`, `INFO.VIEW.RELATIONSHIPS()`) — rodam como
query DAX normal via Execute Queries, retornam tabela com nome/tipo/descrição de cada
tabela, coluna, medida e relacionamento do modelo.

Pipeline: ao conectar num modelo novo, rodar essas 4 queries INFO uma vez, cachear o
resultado como contexto estruturado (JSON) — isso vira parte fixa do system prompt do LLM
pra aquele modelo específico. Refresh do cache quando o modelo muda (webhook ou TTL).

Fontes: [RADACAD — Power BI Model Analysis using DAX INFO Functions](https://radacad.com/power-bi-model-analysis-using-dax-info-functions/),
[Microsoft Learn — INFO.VIEW.RELATIONSHIPS](https://learn.microsoft.com/en-us/dax/info-view-relationships-function-dax)

### Geração de DAX — padrão de prompt

- Contexto: schema (seção acima) + glossário de negócio curado (ver seção 4 do PROJECT.md)
  + 2-3 exemplos de pergunta→DAX validados manualmente (few-shot).
  Boa prática 2026: manter prompt enxuto — degradação de raciocínio aumenta depois de
  ~3000 tokens, ponto ideal por tarefa fica entre 150-300 palavras de instrução real
  (o schema em si pode ser maior, mas a instrução precisa ser cirúrgica).
- Output estruturado: pedir só o código DAX, sem explicação, delimitado
  (ex: bloco ```dax) pra parsing determinístico — não pedir prosa junto.

Fonte: [Groundy — Prompt Engineering Patterns 2026](https://groundy.com/articles/prompt-engineering-patterns-2026-what-actually-works/)

### Self-correction loop — usar feedback de execução, não introspecção

Achado importante da pesquisa: sistemas que só pedem pro LLM "reler" o próprio DAX sem
executar ganham pouco (1-3 pontos percentuais de acurácia). O que realmente funciona é
**loop com feedback de execução real**: roda a query, se der erro de sintaxe/coluna
inexistente/resultado vazio suspeito, manda o erro de volta pro LLM como contexto e pede
nova tentativa. Padrão usado por sistemas de referência (MAC-SQL, ReFoRCE) em text-to-SQL,
mesmo princípio aplica a text-to-DAX.

Regras de implementação:
- Limite duro de retries (2-3 tentativas) — nunca loop infinito.
- Cada retry recebe o erro exato retornado pela API, não um resumo genérico.
- Se esgotar tentativas, responder pro usuário "não consegui responder com confiança"
  em vez de devolver um DAX que roda mas responde a pergunta errada (risco descrito na
  seção 10 do PROJECT.md).

Fontes: [MAC-SQL / execution feedback loops (survey)](https://arxiv.org/html/2604.16511v1),
[ReFoRCE — iterative self-refinement, líder Spider 2.0](https://arxiv.org/html/2511.01008v1)

### Avaliação (antes de declarar "funciona")

Montar um conjunto de 15-20 perguntas de teste (cobrindo: agregação simples, filtro por
data, comparação entre categorias, pergunta ambígua de propósito) com a resposta DAX
esperada, e rodar isso como suite de regressão sempre que mexer no prompt ou no schema.
Sem isso, qualquer ajuste no prompt é mudança às cegas.

---

## Checklist de "Definition of Done" por fase

- [ ] **Fase 0**: tenant sandbox ativo, RLS testado com 2 usuários via Execute Queries,
      resultado comprovadamente diferente por usuário.
- [ ] **Fase 1**: pipeline schema→prompt→DAX→resultado funcionando em CLI pra 5 perguntas
      simples, sem self-correction ainda.
- [ ] **Fase 2**: self-correction loop implementado, suite de 15-20 perguntas rodando com
      taxa de acerto documentada (não precisa ser 100%, precisa ser *medido*).
- [ ] **Fase 3**: auth delegado (MSAL) plugado de ponta a ponta, RLS confirmado no fluxo
      real do produto (não só no teste manual da Fase 0).
- [ ] **Fase 4**: chat web funcional, ligado no pipeline real.
- [ ] **Fase 5**: painel de curadoria (glossário/regras) influenciando o prompt de verdade.
