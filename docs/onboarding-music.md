# Música favorita — issue #118

Referência: https://www.figma.com/design/8N7FbFVJPnl3TDm15wXlk6/-AGES--Recorda?node-id=840-3535

## Revisar a tela

Lucas, para baixar esta versão no repositório local:

```bash
git fetch origin
git checkout feat/118-onboarding-musica-favorita
git pull --ff-only origin feat/118-onboarding-musica-favorita
npm ci
npm run web
```

Execute `npm ci` e `npm run web` (ou `npm start` para Expo Go). Na Home, use
“Prévia: música favorita”, disponível apenas em desenvolvimento. Busque “Tempo”,
“Evidencias” ou “Tribalistas”. A busca da prévia usa cinco músicas locais;
a conclusão mostra uma mensagem de demonstração e não envia dados.

O Figma fornecido define o estado inicial. Resultados, seleção, carregamento,
lista vazia e erros foram estendidos com os tokens do projeto. O fundo e o
indicador de etapas são assets exportados do Figma. A barra de status é nativa.

## Integrar ao fluxo real

`OnboardingMusicScreen` recebe a música selecionada e os IDs das etapas anteriores
do componente pai. Mantenha esse estado acima do navegador de onboarding para
preservá-lo ao voltar para gêneros. Passe `onBack` para a etapa 2 e `onComplete`
para substituir o onboarding pelo Feed após o envio bem-sucedido.

Injete `searchTracks(query, signal)` e `savePreferences(preferences)` usando o
cliente central `apiClient`. Os endpoints descritos na issue são
`GET /music/tracks/search` e `POST /users/me/music-preferences`. A branch atual
não fornece seus contratos, autenticação, etapas 1/2 ou Feed: os nomes de campos
HTTP e o formato da resposta precisam ser confirmados antes de criar o adapter.
`MusicTrack` e `MusicPreferences` são modelos da interface, não contratos HTTP.

A busca tem debounce de 350 ms e fornece AbortSignal. Somente uma música é
selecionada. A escolha fica visível mesmo ao trocar a pesquisa. O envio ocorre
somente no botão final, impede cliques duplicados e preserva as escolhas em erro.
Falhas de busca têm nova tentativa; falhas de envio permitem tentar novamente.

Esta entrega é a tela e sua prévia; não encerra os critérios de integração da #118.

## Validação realizada

- TypeScript e ESLint passaram.
- Seis testes passaram, incluindo busca, seleção única e falha no envio.
- Prévia web conferida na largura de 393 px do Figma, com busca e conclusão.
- Formatação dos arquivos alterados passou. A checagem global ainda aponta
  problemas preexistentes em arquivos fora desta entrega.
- Android/iOS e integração HTTP real ainda não foram validados.
