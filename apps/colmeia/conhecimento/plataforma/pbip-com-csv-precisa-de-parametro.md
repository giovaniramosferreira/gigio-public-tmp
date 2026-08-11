---
sintoma: "PBIP abre mas todas as tabelas falham ao atualizar em outra maquina"
escopo: [power-bi, pbip, portabilidade]
tambem_aparece_como: "tabelas falham ao atualizar em outra maquina; caminho do arquivo nao encontrado no Power Query; projeto abre mas dados nao carregam"
autor: diego.nakamura
criado: 2026-08-11
valida_ate: 2026-11-09
status: ouro
reusos: 1
---

## Contexto
Projeto PBIP versionado no git, lendo CSV da propria pasta do repositorio. Funciona na
maquina de quem criou e quebra em todas as outras.

## Causa
O Power Query nao tem caminho relativo. O caminho absoluto de quem criou fica gravado na
consulta e nao existe na maquina de quem clonou.

## Solucao
Criar um parametro de texto com a pasta dos dados e usar `Parametro & "\arquivo.csv"` em
todas as consultas. Quem clona ajusta o parametro uma vez, em Transformar dados >
Gerenciar parametros. Documentar isso no README ao lado do projeto, senao a pessoa abre,
ve tudo vermelho e conclui que o entregavel esta quebrado.

## O que NÃO funciona
- Caminho de rede compartilhada. Resolve para quem esta na VPN e quebra para o resto.
- Pedir para cada um editar a consulta na mao. Vira dez versoes divergentes do mesmo
  relatorio na primeira semana.
