# Tela de Perfil de Terceiros (#255)

T-E6.US29.FE.01. Substitui o placeholder da rota `UserProfile` pela `UserProfileScreen` e faz
todo avatar ou username de outra pessoa abrir o perfil dela. Inclui, por decisão explícita da
responsável, o item "Denunciar perfil" da T-E9.US41.FE.01.

Branch `feat/255-user-profile-screen`, Draft PR #268. O merge depende da validação contra o
backend PR #152 (T-E6.US29.BE.01, #109), que **ainda não foi aprovado nem integrado à `dev`**
do backend.

## Escopo e critérios de aceite

Critérios da #255:

1. O perfil de terceiro mostra avatar, nome e `username`, os contadores quando permitidos, um
   único indicador de streak, a música favorita e os chips de artistas e gêneros. Numa conta
   privada sem acesso, mantém os três rótulos de aba, oculta contadores e Recordas e mostra a
   mensagem de conteúdo restrito.
2. Seguir, cancelar solicitação e deixar de seguir funcionam no próprio perfil visitado e
   atualizam a tela.
3. Feed, Detalhes, comentários, lista de seguidores, busca e notificações levam ao perfil
   certo; o próprio usuário cai no Perfil Pessoal.

A situação de cada item está em [Critérios de aceite](#situação-dos-critérios-de-aceite).

## Arquitetura

### Reutilizado da US28 (#253)

| Peça                                         | Uso na US29                                          |
| -------------------------------------------- | ---------------------------------------------------- |
| `ProfileHeader`                              | Sem `onEditAvatar` e sem chips de artistas e gêneros |
| `ProfileTabs`                                | Mesmas três abas                                     |
| `ProfileGlow`                                | Camada fixa da tela, centralizada no avatar          |
| `RecordaGrid` e `canLoadMore`                | Grade da aba Recordas                                |
| `useProfileRecordas`, `getUserRecordas`      | Grade paginada por cursor                            |
| `profileQueryKey`, `profileRecordasQueryKey` | `["profile", id]` e `["profile", id, "recordas"]`    |
| `ProfileRead`                                | Mesmo tipo do perfil próprio                         |

Esses componentes nasceram nesta branch e entraram na `dev` pela US28. Continuam só de
apresentação: não buscam dados, não navegam e não sabem quem está vendo o perfil.

### Próprios da US29

- `UserProfileScreen`, na rota `UserProfile` (`{ userId }`).
- `ProfilePrivateNotice`, com o texto aprovado: "Siga este perfil para ver suas Recordas."
- `useUserProfile` e `profileService.getUserProfile`.
- Variante `size="block"` do `FollowButton` e o `UnfollowDialog` (vale em todo o app).

### `useMyProfile` × `useUserProfile`

|               | `useMyProfile` (US28)   | `useUserProfile` (US29)     |
| ------------- | ----------------------- | --------------------------- |
| Endpoint      | `GET /users/me/profile` | `GET /users/{id}/profile`   |
| Chave         | `["profile", myUserId]` | `["profile", userId]`       |
| Erro especial | 409 → onboarding        | 404 → "perfil indisponível" |
| Sem retry     | 409                     | 401, 403 e 404              |

As duas usam o id real na chave, nunca `"me"`. Por isso a mutation de follow atualiza os dois
perfis pela mesma função `profileQueryKey`. A tela de terceiros nunca pede o próprio perfil ao
endpoint de terceiros (ver [Navegação](#pontos-de-entrada)).

## Contrato esperado do backend (PR #152)

Conferido no branch `feat/109-endpoint-perfil-de-terceiros` (`18b1deb`). **O PR está aberto e
não faz parte da `dev`**. Validado localmente com chamadas reais à API em 2026-11-05 (ver
[Validação de integração](#validação-de-integração-com-o-pr-152)).

| Endpoint                             | Resposta e regras                                                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `GET /users/{id}/profile`            | `ProfileRead`. 404 para usuário inexistente, suspenso ou sem onboarding. No próprio id responde como o perfil próprio. |
| `GET /users/{id}/recordas?cursor=`   | Já na `dev` (US28). 403 em conta privada sem acesso; 404; 400 para cursor inválido; 24 por página.                     |
| `POST` / `DELETE /users/{id}/follow` | Já na `dev`. O `DELETE` também apaga uma solicitação `PENDING`.                                                        |
| `POST /users/{id}/reports`           | Já na `dev` (US41).                                                                                                    |

Campos do `ProfileRead`: `user_id`, `name`, `username`, `profile_picture_url`, `is_private`,
`counts` (`null` sem acesso), `favorite_song`, `streak` (já calculado no PR #152),
`relationship { is_self, follow_status, follow_id }` e `can_view_content`.

- Identidade, música favorita e streak são sempre visíveis; `counts` só com acesso.
- Seguidores e seguindo contam só follows aceitos.
- Nenhum campo ou endpoint foi inventado. Não há fallback para `GET /users/{id}`, que é rota
  administrativa.

## Privacidade e `can_view_content`

A tela decide só por `can_view_content`; não infere permissão de `is_private` nem de
`follow_status`.

- **Sem acesso:** ficam avatar, nome, username, música favorita e `FollowButton`. Somem
  contadores e Recordas. Os três rótulos de aba continuam, e o `ProfilePrivateNotice` aparece
  em qualquer aba.
- **Contadores:** só são repassados ao cabeçalho com acesso, mesmo que o backend os envie.
- **Grade:** a query só fica habilitada com acesso. O puxar para atualizar e a rolagem também
  não pedem a grade sem acesso (`refetch` ignora `enabled`, então a tela checa antes).
- **Perda de acesso:** a tela remove do cache só `["profile", userId, "recordas"]`, com
  `exact: true`. As grades de outros perfis e a própria ficam intactas. Ao recuperar o acesso,
  a grade é pedida de novo ao servidor.
- **Erros** nunca viram "conta privada": 404 mostra "perfil indisponível" e os demais mostram
  erro com "Tentar novamente".

## Grade de Recordas

- `RecordaGrid` na aba Recordas, com os estados de carregamento, vazio, erro com retry,
  carregando mais e erro ao carregar mais. A ordem é a do backend (mais recente primeiro).
- **Rolagem única:** a grade fica dentro do `ScrollView` da tela. A próxima página é pedida a
  400 pt do fim, só na aba Recordas, com `fetchNextPage({ cancelRefetch: false })`: eventos de
  rolagem repetidos durante o carregamento não cancelam nem duplicam o pedido. A mesma
  correção foi aplicada na `MyProfileScreen`.
- **Puxar para atualizar:** recarrega o perfil e, só com acesso, a grade.
- **Toque numa miniatura:** abre `PublishedRecorda({ postId })`.
- **Métricas e Calendário** continuam com "Em breve" (Épico 07).

## Follow a partir do perfil

O `FollowButton` é reutilizado; a lógica de follow da US20 foi preservada.

- **Cancelar solicitação** ("Solicitado") usa `DELETE /users/{id}/follow`, sem confirmação.
- **Deixar de seguir** ("Seguindo") pede confirmação no `UnfollowDialog`, que fica aberto e
  com o botão desabilitado até a requisição terminar.
- O botão informa o status anterior (`previousStatus`) para a mutation saber se foi
  cancelamento ou unfollow.

### Invalidações (`useFollowMutation`)

| Query                                                  | Quando                                   | Modo          |
| ------------------------------------------------------ | ---------------------------------------- | ------------- |
| `["profile", userId]`                                  | Sempre, no `onSettled`                   | `exact: true` |
| `["profile", myUserId]`                                | No `onSuccess`, só se o "Seguindo" mudar | `exact: true` |
| Grades (`.../"recordas"`)                              | Nunca                                    | —             |
| `users`, `feed`, `friends`, `notifications`, sugestões | Como já era na US20                      | prefixo       |

- **Perfil visitado, exato:** seguir não muda a grade. Uma invalidação por prefixo pediria a
  grade antes de o perfil novo dizer que o acesso acabou.
- **Contador do perfil próprio:** só follows aceitos contam. O perfil próprio é atualizado ao
  seguir uma conta pública (resposta `seguindo`) e ao deixar de seguir quem já era seguido.
  Seguir uma conta privada (resposta `solicitado`) e cancelar uma solicitação não mudam o
  contador. Se o status anterior não for informado, atualiza por segurança. Falhas e o próprio
  id não atualizam.
- **Id do usuário logado:** lido do cache de `/auth/me` no `onMutate`, na sessão que iniciou a
  operação.
- **Sessão:** tudo passa pelo `getSessionGeneration()`. Se a sessão mudar durante a
  requisição, nada é invalidado nem restaurado.

### Atualização otimista e rollback

- **Listas de usuários (US20):** `follow_status` muda na hora e volta ao snapshot em caso de
  erro.
- **Perfil privado visível, ao deixar de seguir:** o `onMutate` cancela o refetch em andamento
  e marca o perfil em cache como `can_view_content: false` e `counts: null`. As Recordas saem
  da tela antes da resposta do servidor. Perfis públicos e os demais perfis não mudam.
- **Erro:** o perfil anterior é restaurado e a grade é recarregada. O rollback só acontece se
  nenhum dado mais novo chegou ao perfil durante a requisição (comparação do
  `dataUpdateCount`). Assim, um refetch que já reflete o unfollow — por exemplo, quando o
  servidor aplicou a operação e só a resposta se perdeu — não é sobrescrito pelo snapshot
  antigo.
- **Sucesso:** o perfil fica restrito até o refetch confirmar; a grade não é pedida.

## Pontos de entrada

| Origem                                          | Navegação                                                      |
| ----------------------------------------------- | -------------------------------------------------------------- |
| Autor no `RecordaCard` (as duas abas do feed)   | `UserProfile`                                                  |
| Autor nos Detalhes (`RecordaDetailView`)        | `UserProfile`                                                  |
| Autor de cada comentário                        | `UserProfile` (`toFeedComment` preserva o `user_id`)           |
| `FriendsScreen` (seguidores e seguindo)         | `Profile` para o próprio usuário; `UserProfile` para os outros |
| Busca e perfis sugeridos                        | `UserProfile` (já existia)                                     |
| Notificações `NEW_FOLLOWER` / `FOLLOW_ACCEPTED` | `UserProfile` (já existia)                                     |

A `UserProfileScreen` manda o próprio usuário para `Profile` com `navigation.replace`. Primeiro
compara o `userId` da rota com o usuário em cache, sem pedir o perfil; se o usuário ainda não
estiver em cache, usa `relationship.is_self`. Por isso os pontos de entrada não repetem a
regra. Comentários locais sem `userId` não viram link. `features/recorda-view` ficou de fora:
nenhuma rota leva até ela.

## Denúncia (US41)

O menu de três pontos tem "Denunciar perfil" e abre o fluxo existente
(`useReportDialog` → `openReport({ type: "USER", userId })` → `POST /users/{id}/reports`). Não
há formulário nem serviço paralelo.

- Justificativa limitada a 500 caracteres pelo `ReportDialog`.
- 409 mostra "já denunciado"; 403 e 404 mostram "indisponível".
- O menu fica desabilitado até o perfil carregar e nunca aparece no próprio perfil, por causa
  do redirecionamento.

A T-E9.US41.FE.01 não tem issue própria; foi incorporada à #255. O restante da US41 não faz
parte desta entrega.

## Situação dos critérios de aceite

Legenda: **T** implementado e testado; **B** implementado, mas depende de validação com o
backend real; **X** bloqueado por contrato ou dependência externa; **P** pendente de
implementação.

| Critério                                                        | Situação | Observação                                           |
| --------------------------------------------------------------- | -------- | ---------------------------------------------------- |
| Avatar, nome e `username`                                       | T, B     | Validado por API e no app                            |
| Contadores quando permitidos                                    | T, B     | `counts` só com `can_view_content`                   |
| Um único indicador de streak                                    | X        | Badge na US35 (#260); o PR #152 já envia o valor     |
| Música favorita                                                 | T, B     |                                                      |
| Chips de artistas e gêneros                                     | X        | Sem campo no `ProfileRead` para terceiros            |
| Privado sem acesso: três abas, sem contadores e Recordas, aviso | T, B     | `can_view_content` vem do PR #152                    |
| Grade de Recordas com acesso                                    | T, B     | Validado por API (paginação) e no app                |
| Seguir a partir do perfil atualiza a tela                       | T, B     | Inclui o contador do perfil próprio                  |
| Cancelar solicitação                                            | T, B     | `DELETE /users/{id}/follow`                          |
| Deixar de seguir, com confirmação                               | T, B     | Inclui a restrição otimista                          |
| Feed (as duas abas)                                             | T        | A API envia `author.user_id`                         |
| Detalhes da Recorda                                             | T        | Idem                                                 |
| Comentários                                                     | T        | Idem                                                 |
| Seguidores e seguindo                                           | T        | Correção do bug que levava sempre a `Profile`        |
| Busca e perfis sugeridos                                        | T        | Idem                                                 |
| Notificações                                                    | T        | A API envia o id do remetente                        |
| Próprio usuário cai no Perfil Pessoal                           | T        | Pelo `userId` em cache ou por `relationship.is_self` |
| Remover `UserProfilePlaceholderScreen`                          | T        |                                                      |
| Menu de três pontos com "Denunciar perfil" (T-E9.US41.FE.01)    | T, B     | `POST /users/{id}/reports` já na `dev`               |

Nenhum item está pendente de implementação. Os itens **X** precisam ter a distribuição
registrada no aceite com a equipe.

## Limitações conhecidas

- **Artistas e gêneros favoritos de terceiros:** o `ProfileRead` não tem esses campos, e
  `GET /users/me/music-preferences` é só do próprio usuário. A tela mostra apenas a música
  favorita. O `ProfileHeader` já aceita os chips quando houver fonte.
- **Streak:** o PR #152 já envia o valor, visível mesmo sem acesso. A badge é da US35 (#260) e
  não aparece nesta tela.
- **Métricas e Calendário:** conteúdo do Épico 07.
- **Próxima página só ao rolar:** numa tela alta em que 24 miniaturas caibam inteiras, a
  segunda página não seria pedida. Mesma limitação da US28.
- **Puxar para atualizar durante um unfollow pendente:** se o servidor ainda não aplicou o
  unfollow, a resposta pode mostrar o conteúdo por um instante. O `onSettled` atualiza o
  perfil logo em seguida.
- **Operações simultâneas no mesmo perfil:** o botão fica desabilitado durante a requisição, e
  não há outro controle de concorrência. O rollback das listas de usuários (US20) não confere
  se chegou dado mais novo.

## Testes

Automatizados, com `QueryClient` real e services simulados por `jest.mock`:

- `tests/features/profile/UserProfileScreen.test.tsx`:
  - próprio perfil, carregamento e erros (404 separado);
  - perfil público; privado com e sem acesso; solicitação pendente; seguindo;
  - grade: público, privado com e sem acesso, sem pedidos sem acesso;
  - perda de acesso, restrição antes da resposta e restauração após falha;
  - recuperação de acesso e isolamento do cache;
  - vazio, erro e retry, paginação sem pedidos duplicados, puxar para atualizar e detalhes;
  - denúncia e barra inferior.
- `tests/features/follow/useFollowMutation.test.ts`:
  - invalidações dos dois perfis;
  - contador próprio em follow, solicitação, unfollow e cancelamento;
  - falha e troca de sessão;
  - restrição otimista;
  - rollback, inclusive após troca de sessão e com dado mais novo no cache.
- `tests/features/follow/FollowButton.test.tsx`: estados, `previousStatus`, diálogo de
  unfollow e tamanhos.
- `tests/features/profile/MyProfileScreen.test.tsx`: rolagem repetida pede a próxima página uma
  única vez.
- Pontos de entrada: `FeedScreen`, `PublishedRecordaScreen` (autor e comentários),
  `FriendsScreen`, `UserSearchScreen` e `NotificationsScreen`.
- Componentes, hooks e service: `ProfileComponents`, `RecordaGrid`, `useUserProfile`,
  `useProfileRecordas` e `profileService`.

## Validação de integração com o PR #152

Executada em 2026-11-05, com o backend do PR #152 (`18b1deb`) numa API separada (porta 8001),
sobre o banco local da `dev` (migração `0009_content_removed`, sem migrações novas no PR).
Foram usadas contas criadas só para isso (`qa255_viewer`, `qa255_public` com 26 Recordas,
`qa255_private` com 3 Recordas e `qa255_incomplete`, sem onboarding).

### Chamadas reais à API

47 verificações automatizadas: 45 passaram direto. As outras duas eram erros do próprio
roteiro: o feed traz o id em `author.user_id`, não em `user_id` (conferido à parte), e a
checagem de denúncia esperava 422 para corpo vazio (ver abaixo).

| Cenário                           | Resultado | Verificado                                                                                                                                                   |
| --------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contrato                          | Sucesso   | Chaves de `ProfileRead`, `favorite_song`, `relationship`, `counts` e da grade idênticas aos tipos do frontend                                                |
| Perfil público                    | Sucesso   | `can_view_content: true`, contadores, `nenhuma`, `follow_id: null`                                                                                           |
| Grade e paginação                 | Sucesso   | 24 + 2 itens com `next_cursor`, sem repetição, mais recente primeiro; cursor inválido 400; detalhes 200                                                      |
| Privado sem acesso                | Sucesso   | `can_view_content: false`, `counts: null`, identidade e música presentes; grade 403                                                                          |
| Solicitação pendente              | Sucesso   | `solicitado` com `follow_id`, ainda sem acesso; "Seguindo" próprio inalterado                                                                                |
| Cancelar solicitação              | Sucesso   | `DELETE /follow` → `nenhuma`; "Seguindo" próprio inalterado                                                                                                  |
| Follow aceito (privado)           | Sucesso   | `seguindo`, acesso, contadores; seguidores do dono +1; "Seguindo" próprio +1; grade 200                                                                      |
| Deixar de seguir (privado)        | Sucesso   | Acesso perdido, `counts: null`, grade 403; "Seguindo" próprio −1                                                                                             |
| Seguir e deixar de seguir público | Sucesso   | `seguindo` direto; seguidores +1 e "Seguindo" próprio +1; tudo volta após o unfollow                                                                         |
| Próprio id                        | Sucesso   | 200 com `is_self: true` (o app redireciona antes de pedir)                                                                                                   |
| Indisponível                      | Sucesso   | Inexistente 404; sem onboarding 404; id inválido 422; sem token 401                                                                                          |
| Dados dos pontos de entrada       | Sucesso   | Busca com `user_id` e `follow_status`; feed com `author.user_id`; notificações `NEW_FOLLOWER` e `FOLLOW_ACCEPTED` com o remetente; seguidores de privado 403 |
| Denúncia                          | Sucesso   | Rota ativa; repetição devolve 409 "Você já denunciou este perfil."                                                                                           |

Nenhuma incompatibilidade entre frontend e backend foi encontrada; nenhum código mudou.

Durante a verificação da rota de denúncia, um corpo vazio foi aceito (a descrição é
opcional) e **uma denúncia de teste foi registrada** de `qa255_viewer` contra `qa255_public`.
Com autorização da responsável, ela foi removida do banco local numa transação que conferiu
exatamente um registro (`DELETE 1`); nenhum outro dado mudou.

### Validação visual no app

Feita manualmente pela responsável em 05/11/2026, no aplicativo conectado ao backend do PR #152,
com as contas de teste. **Resultado: aprovado.** Não foram identificados problemas visuais nem
funcionais nos cenários examinados. O resultado foi registrado em conjunto, não item a item. O
roteiro preparado para a validação foi:

1. Perfil público: dados, contadores, grade, paginação e detalhes.
2. Perfil privado sem acesso: aviso, sem contadores e sem Recordas.
3. Seguir conta privada → "Solicitado"; cancelar → "Seguir".
4. Aceitar a solicitação na outra conta e puxar para atualizar → grade aparece.
5. Deixar de seguir conta privada → conteúdo some na hora.
6. Seguir conta pública → contadores sobem.
7. Abrir o perfil pelos pontos de entrada e o próprio perfil.
8. Abrir o menu "Denunciar perfil" sem enviar.

### Não verificado

Sem evidência individual, estes cenários não contam como verificados:

- **Usuário suspenso → 404:** exige uma conta de administrador.
- **Comentários de contas de teste:** não havia comentários nelas; o campo é coberto pelos
  testes automatizados.
- **Usuário inexistente na tela:** validado só por API (404).

### Situação da integração

A validação foi local. O PR #152 continua aberto e fora da `dev` do backend; a integração
oficial depende do merge dele.
