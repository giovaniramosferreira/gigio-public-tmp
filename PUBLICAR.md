# Como publicar no seu GitHub

Este repositório já está commitado localmente. Para publicar:

```bash
# 1. crie o repositório vazio em github.com/new  (sem README, sem .gitignore)
# 2. depois, aqui:
git remote add origin git@github.com:giovaniramosferreira/colmeia.git
git branch -M main
git push -u origin main
```

## Antes de tornar público, confira

- [ ] Nenhum nome de schema, catálogo ou tabela real do banco nas entradas de conhecimento.
      As três entradas semente são genéricas de propósito — se você adicionar as suas,
      revise uma por uma.
- [ ] Nenhuma referência a sistema interno, nome de projeto interno ou nome de colega.
      As dez personas são fictícias.
- [ ] `python3 scripts/validar.py` passando.
- [ ] Trocar o nome se "colmeia" não for o que você quer. É só renomear o repositório e
      os dois arquivos `.claude-plugin/*.json`.

Repositório privado primeiro é uma escolha defensável. Público é bom para reputação e
para o time se orgulhar; só não é reversível.
