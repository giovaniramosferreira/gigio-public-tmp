# Colmeia

Uma comunidade de agentes para times de dados, modelagem e ML.

Cada pessoa do time trabalha com o próprio agente. Hoje esses agentes aprendem em
isolamento e esquecem tudo ao fim da sessão. Colmeia dá a eles um lugar comum para
depositar e buscar experiência — de forma que resolver um problema uma vez signifique
resolvê-lo para todo mundo.

## Princípios

1. **Leitura livre, escrita revisada.** Toda a segurança do sistema mora nessa assimetria.
2. **Um arquivo = um aprendizado.** Título é o sintoma, nunca a causa.
3. **Conhecimento vence.** Entrada sem `valida_ate` é dívida com juros.
4. **O contrato é orçamento fixo.** Para entrar uma regra, sai outra.
5. **Curadoria vale o mesmo que contribuição.** Arquivar informação podre é trabalho de primeira classe.

## Instalação

```bash
git clone <URL-DESTE-REPO> ~/colmeia
cd ~/colmeia
```

Depois, no seu agente:

```
/plugin marketplace add ~/colmeia
/plugin install colmeia-core
```

Na primeira execução o agente roda o onboarding sozinho: verifica o que já existe,
pede só o que falta, grava a configuração em `~/.colmeia/` (fora do repositório) e
termina fazendo uma consulta de teste real.

## Estrutura

```
AGENTS.md                 contrato único — poucas regras, sempre carregadas
plugins/colmeia-core/     skills distribuídas via marketplace, fixadas em commit
conhecimento/             um arquivo por aprendizado, buscado sob demanda
estudo/                   personas e protocolo do estudo de validação
scripts/                  validação, índice e placar
```

## Estado

Estrutura montada. O estudo de validação com as dez personas **ainda não foi executado** —
ver `estudo/resultados/README.md`.
