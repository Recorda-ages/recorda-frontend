# recorda-frontend

Frontend mobile do Recorda, uma rede social de memórias musicais. Esta base usa
React Native, Expo e TypeScript com arquitetura feature-first.

## Requisitos

- Node.js 22.13 ou superior
- npm
- Expo Go no celular, ou emulador Android/iOS configurado
- Xcode para executar iOS localmente
- Android Studio para executar Android localmente

## Como instalar

```bash
nvm use
npm ci
```

Se voce ainda nao tiver a versao do Node configurada no `.nvmrc`, instale com:

```bash
nvm install
```

Copie as variáveis de ambiente locais:

```bash
cp .env.example .env
```

Não coloque secrets no frontend. Variáveis públicas do Expo devem usar o prefixo
`EXPO_PUBLIC_`.

## Como executar

```bash
npm run start
```

## Android

```bash
npm run android
```

## iOS

```bash
npm run ios
```

## Qualidade

```bash
npm run lint
npm run format:check
npm run typecheck
npm run test
```

Use `npm run format` para formatar os arquivos com Prettier.

## Variáveis de ambiente

`EXPO_PUBLIC_API_URL` define a URL do backend FastAPI.

Exemplo:

```text
EXPO_PUBLIC_API_URL=http://localhost:8000
```

O cliente HTTP centralizado adiciona o prefixo `/api/v1` automaticamente.

## Arquitetura

```text
src/app          configuração da aplicação, providers e navegação
src/features     funcionalidades organizadas por domínio
src/components   componentes compartilhados e independentes de domínio
src/services     integrações externas, API e storage
src/theme        tokens visuais
src/i18n         internacionalização pt-BR, en e es
src/utils        helpers pequenos e reutilizáveis
src/types        tipos globais do projeto
```

## Convenções

- Features não devem importar detalhes internos de outras features arbitrariamente.
- Componentes compartilhados em `src/components/ui` não devem conhecer regras de negócio.
- Chamadas HTTP passam por `src/services/api`.
- Server state usa TanStack Query.
- Client state simples deve usar estado local ou Context quando necessário.
- Código gerado por OpenAPI deve ficar em `src/services/api/generated` e não deve ser editado manualmente.
- SDKs de Spotify, Apple Music, autenticação e notificações serão decisões futuras.

## Documentação

Decisões arquiteturais ficam em `docs/adr`.
