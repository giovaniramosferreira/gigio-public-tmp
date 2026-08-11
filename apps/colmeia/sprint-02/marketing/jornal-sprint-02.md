# O que a área entregou — Sprint 02

*Boletim quinzenal de Modelagem e BI · 11 de agosto de 2026*

---

## Em uma frase

Pela primeira vez, alguém resolveu um problema sem precisar descobrir a solução: quatro
das sete lições da sprint passada foram reaproveitadas por outra pessoa, em outra área.

---

## O que aconteceu de diferente

Na sprint passada a equipe registrou sete aprendizados. Nesta, eles foram usados.

A Marina precisava montar uma previsão mensal. Dois dos problemas que ela ia enfrentar já
tinham sido resolvidos pelo Rafael e pela Larissa duas semanas antes — um erro silencioso
que devolve resultado em branco sem avisar, e o limite de quanto histórico é necessário
para prever sazonalidade. Ela não precisou descobrir nenhum dos dois.

O mesmo aconteceu no Power BI: o Diego evitou um erro de cálculo que teria inflado o
faturamento em quase 6%, porque o Bruno já tinha documentado a armadilha.

**Quatro reaproveitamentos, entre pessoas de áreas diferentes, sem ninguém coordenar nada.**
Ninguém mandou link, ninguém avisou. A pessoa procurou e achou.

---

## A descoberta desconfortável

A equipe testou se prever por mês é melhor que prever por semana. É — o erro cai de 32%
para 24%.

Só que o modelo que venceu foi o mais burro de todos: **repetir o valor do mês anterior**.
Todas as técnicas mais sofisticadas perderam para ele.

Isso é um resultado, não um fracasso. Significa que, com o histórico que temos, o método
caro não se paga. A equipe podia ter entregado o modelo complexo e ficado bem na foto —
ninguém iria conferir. Preferiu entregar o simples e explicar por quê.

E registrou a lição: sempre comparar contra o método mais burro possível. Sem essa
comparação, o menos ruim de quatro modelos ruins parece bom.

---

## O que a equipe corrigiu no próprio processo

O sistema de busca falhava em 3 de cada 10 consultas — e o pior: falhava com confiança,
devolvendo a resposta errada em vez de dizer que não sabia.

A equipe mediu, entendeu por quê e corrigiu. **Agora acerta 9 em cada 10, e quando não
sabe, diz que não sabe.**

O motivo do erro era simples e vale para além do sistema: um problema tem vários sintomas,
e só um deles cabe no título. Quem escreveu registrou "faturamento não bate com o sistema
origem". Quem procurou digitou "quantidade negativa na base". Mesma coisa, palavras
diferentes, e o encontro não acontecia.

---

## Números da quinzena

| | Sprint 01 | Sprint 02 |
|---|---|---|
| Lições registradas | 7 | 1 |
| Reaproveitadas por outra pessoa | 0 | 4 |
| Acerto da busca | — | 91% |
| Resposta errada com confiança | — | 0% |

A queda no número de lições novas é esperada e saudável. A primeira rodada descobre muito
porque tudo é novo. O que importa a partir daqui não é quanto se registra — é quanto se
reaproveita.

---

## O que continua pendente

O relatório da sprint passada ainda não foi aberto por ninguém em Power BI Desktop. Ele
está marcado no repositório como entregue mas não validado, e assim continua até alguém
confirmar. A equipe decidiu que esse tipo de entrega nunca é dada como pronta sem um
humano abrindo antes.

---

*Preparado por Patrícia Lins, Marketing Analytics.*
*Dados: base pública de varejo online (UCI Machine Learning Repository), ambiente de teste.
Nenhum dado de cliente do banco foi utilizado.*
