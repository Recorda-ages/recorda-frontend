# Música favorita — issue #118

Referência: https://www.figma.com/design/8N7FbFVJPnl3TDm15wXlk6/-AGES--Recorda?node-id=840-3535

## Revisar a tela

Execute `npm ci` e `npm run web` (ou `npm start` para Expo Go). Na Home, use
“Prévia: música favorita”, disponível apenas em desenvolvimento. Busque “Tempo”,
“Evidencias” ou “Tribalistas”. A prévia usa cinco músicas locais e não envia
dados; serve para revisar layout e estados sem backend.

O Figma fornecido define o estado inicial. Resultados, seleção, carregamento,
lista vazia e erros foram estendidos com os tokens do projeto. O fundo e o
indicador de etapas são assets exportados do Figma. A barra de status é nativa.

## Fluxo real

A rota `OnboardingMusic` (`OnboardingMusicRoute`) é a etapa 3 integrada.
Ela recebe as seleções das etapas 1 e 2 por parâmetro de navegação:

```ts
navigation.navigate("OnboardingMusic", { artists, genres });
```

`artists` e `genres` são `MusicSelection[]` (`{ id, name }`, com o `id` do Deezer).
O backend exige no mínimo 3 de cada. Como as etapas 1 e 2 permanecem montadas na
pilha, `Voltar` preserva as seleções sem nenhum store compartilhado.

Endpoints usados (`src/features/onboarding/api/music.ts`):

- `GET /music/tracks/search?q=` → lista de tracks; `cover_url` vira `artworkUrl`.
- `POST /users/me/music-preferences` com
  `{ genres: [{deezer_id, name}], artists: [{deezer_id, name}], favorite_track: {deezer_id, name} }`.

O envio ocorre somente no botão final, exige Bearer token (lido de
`secureStorage`, chave `auth_token`), impede cliques duplicados e preserva as
escolhas em caso de erro. A busca tem debounce de 350 ms e propaga o
`AbortSignal` do React Query.

## Pendências fora desta issue

- Etapas 1 e 2 vivem nas branches de #99 e #117; ainda não navegam para cá.
- A rota `Feed` usa a tela atual de home/feed como componente temporário.
  Trocar apenas o componente da rota quando a tela definitiva existir.
- O token é lido a cada requisição; mover para o `apiClient` quando a camada de
  sessão de autenticação (#97) for integrada.
