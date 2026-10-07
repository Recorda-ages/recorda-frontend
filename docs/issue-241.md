# #241 — Notificação de conteúdo removido

Entrega na branch `feat/241-content-removed-notification`, baseada em
`origin/dev` (`b91b935`), no [PR #244](https://github.com/Recorda-ages/recorda-frontend/pull/244).

## Comportamento

- `CONTENT_REMOVED` usa o ícone `shield-alert-outline`, sem avatar ou nome de usuário.
- A mensagem mostra o título da música e o motivo da remoção em português, inglês
  e espanhol. O motivo recebido da API é preservado; não é traduzido pelo app.
- O motivo completo pode ocupar mais de duas linhas.
- O toque nunca abre a Recorda removida ou um perfil.
- A central mantém a marcação de todas as notificações como lidas ao abrir,
  pelo endpoint existente `POST /notifications/read-all`. Se essa chamada falhar,
  tocar no aviso não lido tenta novamente. A chamada não se repete para um aviso já
  lido ou enquanto outra marcação/resposta de solicitação está em andamento.
- Os seis tipos anteriores mantêm texto, avatar, ações e navegação existentes.

## Contrato e integração pendente

O contrato segue a [issue #96 do backend](https://github.com/Recorda-ages/recorda-backend/issues/96):
`type: "CONTENT_REMOVED"`, `sender: null`, `recorda_song_title` e `removal_reason`.
Os campos novos são opcionais e aceitam `null` para manter compatibilidade com
respostas e notificações antigas. Valores ausentes ou vazios têm mensagens de
fallback traduzidas.

A issue do backend ainda estava aberta durante esta entrega. Os testes e a prévia
usam dados simulados; não comprovam que uma remoção real já gera o aviso na API.
Depois da integração do backend, validar remoção pela moderação, motivo e leitura
com uma sessão autenticada em Android/iOS.

O Figma vinculado na issue mostra a central existente, sem um aviso específico de
remoção. A implementação reaproveita sua estrutura, componentes e tokens atuais.

## Evidências e revisão visual

- [Português](evidence/241/notifications-web-pt-BR.png).
- [Inglês](evidence/241/notifications-web-en.png).
- [Espanhol](evidence/241/notifications-web-es.png).
- [Após tocar para recuperar uma falha de leitura](evidence/241/notifications-web-read-retry.png).
- [Log completo dos testes com cobertura](evidence/241/test-output.txt).

As imagens são capturas reais da tela React Native renderizada em Expo Web, com
viewport de 393 × 852 e serviços simulados. O entrypoint temporário foi removido
do app depois da verificação. Android/iOS ainda não foram conferidos visualmente.

Para reproduzir a prévia, copiar `docs/evidence/241/preview-entry.tsx.txt` para
`App.web.tsx` e executar `npx expo start --web --port 8083`. Abrir
`http://localhost:8083/`; usar `?language=en`, `?language=es` ou `?failRead=1` para
os outros cenários. Depois de conferir, encerrar o Metro e remover **somente** o
`App.web.tsx` temporário. Esse arquivo é exclusivo da demonstração e não deve ser
incluído em um commit.

## Validação

- Suíte completa: 68 suítes e 538 testes aprovados, incluindo 36 testes da tela
  de notificações, no Node 22.13.1 com os parâmetros da CI:
  `npm test -- --coverage --maxWorkers=50% --forceExit --testTimeout=30000`.
- Cobertura de linhas: 100% em `NotificationRow.tsx`, 95,83% em
  `NotificationsScreen.tsx` e 90,83% global. Cobertura de branches: 94,11% na linha
  de notificação e 96,07% na tela.
- ESLint sem avisos e TypeScript aprovados.
- Exportação do app real: `npx expo export --platform web` aprovada.
- Prettier dos arquivos alterados aprovado.
- O Prettier global passou com `--end-of-line auto` no checkout Windows.
  As três diferenças de formatação apontadas pela CI foram corrigidas em
  `src/services/api/useAuthImageSource.ts`,
  `tests/features/feed/PublishedRecordaScreen.test.tsx` e `tests/mocks/expoVideo.tsx`.
- As falhas de cleanup nos testes de autoplay e detalhes foram reproduzidas no Node 22.13.1.
  Os timers falsos agora preservam `setImmediate`, usado pelo agendamento de
  `act` do React. Os 11 testes de autoplay passam com timeout de 5 segundos;
  os 21 testes de detalhes também passam. A suíte completa terminou em 16,55 segundos.
  As verificações existentes e o timeout da CI foram mantidos.
- A suíte usa `--forceExit` porque o Jest mantém operações assíncronas abertas
  após terminar. Há avisos de `act` nos testes existentes do feed/detalhes; o log
  preserva esses avisos.
