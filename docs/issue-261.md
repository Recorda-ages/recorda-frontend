# Issue #261 — Logout pelas Configurações

Implementação local na branch `feat/261-settings-sign-out`, baseada em
`origin/dev` (`b1d8250`, integração do PR #269), em 21/10/2026.
As capturas foram aprovadas pelo responsável em 21/10/2026, que autorizou commit,
sincronização com `dev`, push e abertura do PR completo com evidências, sem merge.

## Comportamento

- `useSignOut`, em `features/auth/hooks`, é compartilhado por Configurações,
  Perfil provisório e pelo layout de todas as telas administrativas.
- O hook interrompe a prévia do feed, remove o foco da Recorda, limpa a sessão,
  reseta onboarding e rascunho e substitui o histórico de navegação por Login.
- `clearSession` usa `queryClient.clear()`: remove todas as queries e mutações,
  incluindo perfil, busca, follow e configurações, sem depender de uma lista de chaves.
  As queries em andamento são canceladas pela limpeza do QueryClient.
- São removidas somente as credenciais `auth_token`, `role` e `account_type`.
  A chave `app_language` e o idioma ativo são preservados.
- A confirmação de Configurações usa `destructiveDialogStyles`, com Cancelar e
  Sair. Cancelar fecha o diálogo sem encerrar a sessão. A confirmação de privacidade
  mantém seu comportamento anterior.

## Validação

| Verificação                                                                                                | Resultado                                                                         |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `npm run lint`                                                                                             | Aprovado, zero avisos/erros                                                       |
| `npm run format:check`                                                                                     | Aprovado                                                                          |
| `npm run typecheck`                                                                                        | Aprovado                                                                          |
| `npm test -- --coverage --maxWorkers=50% --forceExit --testTimeout=30000 --cacheDirectory ../tmp/jest-256` | 96 suítes, 809 testes aprovados                                                   |
| Cobertura focada: sessão, hook, settings e layout administrativo                                           | 38 testes; 100% de linhas, 98,52% de statements, 90% de branches, 100% de funções |
| `npx expo export --platform all --output-dir dist`                                                         | Android, iOS e Web aprovados                                                      |
| Revisão estática independente                                                                              | Nenhum novo problema confirmado                                                   |

O teste de regressão de cache falhou antes da correção: queries de perfil,
busca e follow permaneciam após o logout. Depois da correção, o cache de queries
e o de mutações ficam vazios. O teste do hook usa providers reais para verificar
os resets, a parada do player e a troca para outra conta sem os dados anteriores.
O teste de integração com o RootNavigator verifica que o histórico contém apenas
Login e que `canGoBack()` é falso.

Os logs preservam avisos de React já presentes nas evidências da #256, incluindo
`act(...)` e atualização entre telas de Configurações. A execução usa `--forceExit`,
como a CI do projeto. O export precisou executar fora do sandbox porque o Hermes
não conseguia gravar seu arquivo temporário dentro dele.

## Evidências

Capturas reais do Expo Web em uma área móvel de 393 × 720:

- [Configurações](evidence/261/settings.jpg)
- [Confirmação de logout](evidence/261/confirm-sign-out.jpg)
- [Login após sair](evidence/261/login-after-sign-out.jpg)
- [Terminal real de testes e cobertura](evidence/261/coverage-terminal.jpg)
- [Log da suíte completa](evidence/261/test-output.txt)
- [Log dos testes focados](evidence/261/feature-test-output.txt)

A inspeção manual confirmou o cancelamento e a saída para Login.
Android/iOS tiveram o bundle exportado; não houve inspeção visual em dispositivo.

## Prévia com exemplos

O responsável autorizou uma conta de exemplo e respostas simuladas somente na
prévia desta issue. O endpoint de Configurações depende do backend #111. O código
entregue continua usando a API autenticada; não foi adicionado fallback de exemplo.
Não foram necessárias novas imagens ou dependências.

Para reproduzir a prévia, copiar
[o entrypoint temporário](evidence/261/preview-entry.tsx.txt) para `App.web.tsx`
na raiz do frontend e executar `npx expo start --web --offline --port 8091`.
Abrir o app, acessar Perfil, Configurações e Sair. Apagar somente esse arquivo
temporário ao terminar; ele foi removido antes das validações finais e do export.
