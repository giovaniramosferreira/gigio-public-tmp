# gigio-public — monorepo

Repo público único. Cada `apps/<nome>/` é um projeto, migrado via `git subtree` a
partir do repo original — histórico preservado, `git log --follow apps/<nome>/`
mostra tudo desde o primeiro commit.

Nome do repo no GitHub é `giovaniramosferreira.github.io` (não "gigio-public") —
necessário pra domínio raiz do GitHub Pages funcionar em `apps/portfolio-principal`.

## Commits

Conventional Commits, escopo obrigatório = nome da pasta em `apps/`:

    <tipo>(<app>): <resumo>

    <corpo: por quê>

Tipos: feat, fix, docs, chore, refactor, test, perf, security.
Corpo obrigatório pra feat/fix/security. Hook local (`commitlint` + `husky`) bloqueia
commit fora do padrão — ver `commitlint.config.js`.

Ver spec completo: `docs/superpowers/specs/2026-08-11-monorepo-migration-design.md`
(no workspace pai, `/Volumes/ssd/gigio.inc`).
