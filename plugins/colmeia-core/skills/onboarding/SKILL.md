---
name: onboarding
description: Configura o ambiente Colmeia na primeira execução. Use quando não existir ~/.colmeia/config.yaml, quando o usuário disser que acabou de clonar o repositório, ou quando qualquer skill do Colmeia falhar por falta de configuração.
---

# Onboarding

Objetivo: em menos de dez minutos, sair de "acabei de clonar" para "consulta de teste
funcionou". Este é o momento em que o projeto ganha ou perde a pessoa.

## Regras

- **Verifique antes de perguntar.** Nunca peça o que já existe.
- **Nada de segredo no repositório.** A configuração vai para `~/.colmeia/config.yaml`,
  o token para o keychain do sistema ou variável de ambiente.
- **Falha nunca é silenciosa.** Toda mensagem de erro diz o que fazer e com quem falar.

## Passos

1. Verificar se `~/.colmeia/config.yaml` existe. Se sim, validar e pular para o passo 5.
2. Verificar dependências: git, python3, e o CLI do Databricks. Reportar o que falta com
   o comando exato de instalação.
3. Perguntar, em uma única interação: host do workspace, catálogo padrão, e-mail
   corporativo (vira `autor` nos aprendizados).
4. Pedir o token. Instruir a gerar com escopo somente leitura. Gravar fora do repositório.
5. **Consulta de teste real.** Listar os schemas do catálogo padrão. Só isso comprova
   que funcionou.
6. Rodar `scripts/indexar.py` para montar o índice local de conhecimento.
7. Imprimir: `Ambiente pronto. N entradas de conhecimento disponíveis.`

## Quando falhar

| Sintoma | O que dizer |
|---|---|
| Token inválido | "Token rejeitado. Gere um novo em User Settings > Developer. Se persistir, fale com a plataforma." |
| Sem permissão no catálogo | "Sua conta não tem leitura em `<catálogo>`. Abra chamado pedindo grant no catálogo **e** no schema." |
| Host inacessível | "Sem rota até o workspace. Verifique a VPN antes de tentar de novo." |
