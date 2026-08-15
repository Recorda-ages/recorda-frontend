# Contribuindo

Este repositório usa uma arquitetura feature-first para facilitar trabalho em paralelo.

## Fluxo

Issue -> branch -> commits -> Pull Request -> CI -> review -> merge.

A branch principal é `main`. Não usamos Git Flow ou branch `develop`.

## Branches

Use nomes objetivos:

```text
feat/REC-123-description
fix/REC-123-description
chore/REC-123-description
refactor/REC-123-description
```

## Convenções

- Código de domínio deve ficar dentro da feature correspondente em `src/features`.
- Componentes em `src/components/ui` não devem conhecer regras de negócio.
- Chamadas HTTP devem passar por `src/services/api`.
- Estado de servidor deve usar TanStack Query.
- Estado local simples deve permanecer local ao componente sempre que possível.
- Código gerado por OpenAPI deve ficar em `src/services/api/generated` e não deve ser editado manualmente.
- Não adicione secrets ao repositório.

## Antes de abrir PR

Execute:

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
```
