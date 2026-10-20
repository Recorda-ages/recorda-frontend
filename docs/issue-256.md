# #256 — Configurações e privacidade

Branch `feat/256-settings-privacy`, criada a partir de `origin/dev` (`dcc27ca`).
Sincronizada por rebase em 20/10/2026 com `origin/dev` (`0e7418c`), preservando
as novas telas administrativas e todas as traduções existentes.

## Comportamento

- A engrenagem do Perfil Pessoal abre a rota `Settings`.
- A tela reúne Conta, Preferências e Sessão, seguindo os tokens e a referência
  visual anexada à issue, com textos em português, inglês e espanhol.
- O interruptor usa o estado retornado pelo servidor. Durante o carregamento ou
  uma atualização, não permite alterações concorrentes. Falhas de leitura têm
  mensagem e opção de tentar novamente.
- Tornar privada exige confirmação do efeito sobre Recordas antigas e informa
  que os seguidores atuais continuam aprovados.
- Tornar pública exige confirmação do efeito retroativo e da aceitação de todos
  os pedidos pendentes. O sucesso informa a quantidade retornada pela API,
  com singular/plural; zero não gera aviso.
- A alteração é otimista, com reversão e mensagem em erro. O sucesso invalida
  `profile`, `feed` e `notifications`.
- Sair pede confirmação e reutiliza a limpeza local de sessão, onboarding e
  rascunho já existente. O cache de configurações é removido ao sair, e respostas
  de mutações antigas não podem sobrescrever uma nova sessão.
- O bloqueio de gravação é compartilhado entre montagens: sair e reabrir a tela
  durante um PATCH mantém o interruptor bloqueado até a resposta, evitando
  alterações simultâneas e refetch que sobrescreva o valor otimista.

## Integração e limites

O serviço autenticado implementa o contrato da
[issue backend #111](https://github.com/Recorda-ages/recorda-backend/issues/111):

- `GET /api/v1/users/me/settings` → `{ is_private, language }`.
- `PATCH /api/v1/users/me/settings`, com `{ is_private: boolean }` →
  `{ is_private, language, accepted_requests }`.

O cliente central acrescenta `/api/v1` e o bearer token. O frontend não aceita
pedidos de seguidores localmente; essa transação pertence ao backend.

A issue backend #111 estava aberta e a rota não existia no backend local durante
esta implementação. O usuário autorizou dados de exemplo exclusivamente para
testes e prévia. As evidências comprovam a interface e o fluxo HTTP com respostas
simuladas; a persistência, a aceitação transacional e a retroatividade no servidor
ainda precisam ser validadas quando essa integração estiver disponível.

O Perfil Pessoal permanece a tela provisória existente em `dev`, agora com a
engrenagem. Minha conta, Preferências musicais e Idioma abrem destinos identificados
como em construção para as respectivas tasks do épico. O item Sair usa o fluxo
local existente; não implementa revogação remota de sessão da task de logout.

## Ajustes para executar o app completo na Web

A verificação real do app revelou dois bloqueios preexistentes de inicialização:

- `expo-media-library` tentava carregar um módulo nativo na importação do serviço
  de compartilhamento. Ele agora só é carregado ao salvar na galeria em dispositivo;
  o caminho Web de download permanece o mesmo.
- O pré-carregamento chamava `Image.resolveAssetSource`, ausente em React Native Web.
  A Web agora usa o cache normal do navegador; o aquecimento dos caches nativos
  foi preservado. Há teste do cenário sem o resolvedor nativo.
  Essa correção já chegou pela `dev` durante o rebase e foi preservada.

## Evidências

Capturas reais do app completo no Expo Web, com fonte e navegação reais,
largura de 393 px e dados de exemplo autorizados:

- [Conta privada](evidence/256/settings-private.png).
- [Confirmação para tornar pública](evidence/256/confirm-public.png).
- [Conta pública e três pedidos aceitos](evidence/256/settings-public-accepted.png).
- [Confirmação para tornar privada](evidence/256/confirm-private.png).
- [Reversão após erro](evidence/256/settings-error-rollback.png).
- [Terminal Web executando Jest com cobertura da feature](evidence/256/coverage-terminal.png).
- [Saída completa da suíte com cobertura](evidence/256/test-output.txt).

As imagens da interface foram recortadas apenas para remover a área externa à
viewport de 393 × 720. A captura do terminal mostra uma execução real do Jest em
um terminal Web xterm.js temporário, sem reconstrução gráfica do relatório.
Android/iOS foram validados por exportação de bundles e testes, sem inspeção
visual em dispositivo.

Para reproduzir a prévia, copiar
`docs/evidence/256/preview-entry.tsx.txt` para `App.web.tsx` e executar
`npx expo start --web --port 8085`. Abrir o app em viewport mobile, entrar no Perfil
pela barra inferior e tocar a engrenagem. `?private=0` inicia com conta pública;
`?failPatch=1` simula uma falha no primeiro PATCH; `?language=en` e `?language=es`
trocam o idioma da prévia. O arquivo temporário intercepta apenas as chamadas
necessárias e não faz login nem altera contas reais. Depois de verificar, remover
somente o `App.web.tsx` temporário. Ele não faz parte da entrega.

## Validação

- Suíte completa após rebase: **95 suítes e 807 testes aprovados**, com os parâmetros da CI:
  `npm test -- --coverage --maxWorkers=50% --forceExit --testTimeout=30000`.
- 25 testes da feature: confirmações, cancelamento, estado real e refetch, rollback
  nas duas direções, bloqueio durante gravação, contagem de pedidos, invalidações,
  falha de leitura/retry, navegação real, saída, proteção entre sessões e
  reabertura durante uma gravação pendente.
- Cobertura da feature: **98,63% de linhas**, **93,75% de branches** e **96% de
  funções**. Tela principal: **97,56% de linhas**. Hook, serviço e destinos
  provisórios: **100% de linhas**. Cobertura global de linhas: **92,51%**.
- Lint, formatação, typecheck e exportação Expo de Android/iOS/Web validados.
- O cache do Jest foi direcionado a `../tmp/jest-256` por restrições do diretório
  temporário do sandbox. A execução final ocorreu fora do sandbox no Node 24.14.1.
- O Prettier normalizou CRLF do checkout Windows; essas normalizações não
  acrescentaram alterações de conteúdo fora dos arquivos da tarefa.
- O Jest ainda emite avisos de `act`/atualização durante renderização nos testes e usa
  `--forceExit`, como a CI. O log preserva esses avisos.
- A revisão independente identificou a concorrência ao reabrir a tela durante
  PATCH. Um teste de regressão falhou antes da correção e passou após compartilhar
  o estado de gravação pelo TanStack Query. A correção foi reavaliada e aprovada.

Revisão visual aprovada pelo usuário em 20/10/2026, com autorização de commit,
sincronização com `dev`, push e PR. Merge permanece fora do escopo.
