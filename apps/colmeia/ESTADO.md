# Estado do projeto — leia isto primeiro

Documento de passagem. Se você é um agente que acabou de abrir este repositório sem o
histórico da conversa que o criou, este arquivo é o seu contexto.

## O que é

Colmeia é um experimento: uma base de conhecimento compartilhada entre os agentes de um
time de Modelagem e BI. Cada pessoa registra o que aprendeu, os agentes das outras
recuperam antes de investigar do zero. O repositório é o substrato, git é o mecanismo.

Princípio central: **leitura livre, escrita revisada.** Toda a segurança mora nessa
assimetria. Agente propõe por pull request, humano aprova.

## Onde está

| Caminho | O quê |
|---|---|
| `AGENTS.md` | O contrato. Orçamento fixo de ~40 linhas — para entrar uma regra, sai outra |
| `plugins/colmeia-core/skills/` | Quatro skills: onboarding, buscar, registrar, curar |
| `conhecimento/` | 11 entradas. Uma por aprendizado, título é o sintoma |
| `scripts/` | `validar.py`, `buscar.py`, `placar.py` |
| `estudo/personas/` | 10 personas com modos de falha distintos |
| `estudo/rodadas.md` | Desenho das 5 rodadas |
| `estudo/resultados/` | Rodadas 0 e 1 executadas. 2, 3 e 4 não |
| `estudo/medicao/testar_busca.py` | Mede precisão da busca. 14 consultas com gabarito |
| `sprint-01/` | ETL, base SQLite, projeto Power BI (PBIP), previsão semanal |
| `sprint-02/` | Previsão mensal e jornal |

## O que já foi decidido — não relitigue

- **PBIP, não PBIX.** PBIX é binário fechado, não gera diff e não pode ser criado por
  código. O relatório está em TMDL + PBIR.
- **Ponto por reuso confirmado, nunca por volume.** Escrever não pontua. Podar pontua
  igual a ser reusado.
- **Toda entrada tem `valida_ate`.** Padrão 90 dias.
- **Busca com piso e margem.** Falso positivo custa mais que silêncio.

## Estado aberto — o que fazer a seguir

1. **PENDENTE E BLOQUEADO:** ninguém abriu `sprint-01/relatorio/Vendas.pbip` no Power BI
   Desktop. Está marcado como candidato, não validado. Power BI Desktop não roda em macOS —
   precisa de alguém com Windows ou do Fabric Git integration. Quem abrir deve reportar o
   **erro literal da tela**.
2. **Rodada 2** — dependência cruzada: tarefas que só resolvem com conhecimento de outra área.
3. **Rodada 3 — envenenamento.** A decisiva. Invalidar uma entrada correta sem avisar
   ninguém e ver se o sistema se autocorrige ou propaga o erro em escala.
4. Renomear o projeto se "colmeia" não for o nome final.

## Duas advertências que valem mais que os resultados

**As 14 consultas de teste foram escritas por quem também escreveu as entradas.** Isso
infla a medida de 91%: vocabulário conhecido busca vocabulário conhecido. A medida honesta
exige consultas de quem não viu a base. Na implantação real, registre as primeiras 20
buscas do time — o que foi digitado e se achou.

**Personas simuladas não têm custo de tempo, política de time nem cansaço de sexta.** O
estudo mostra que o mecanismo é coerente. Não mostra que a adoção acontece. Adoção só se
mede com gente.

## Comandos

```bash
python3 scripts/validar.py                  # frontmatter, segredo, dado real
python3 scripts/validar.py --vencidas       # o que precisa de poda
python3 scripts/buscar.py "<sintoma>"       # recuperação
python3 scripts/placar.py                   # reuso e curadoria
python3 estudo/medicao/testar_busca.py      # precisão da busca, com gabarito
```
