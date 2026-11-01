# Tela de Perfil Pessoal (#253)

T-E6.US28.FE.01. Substitui o placeholder da rota `Profile` pela `MyProfileScreen`, com
cabeçalho, abas e a grade de Recordas do usuário autenticado. Usa a base compartilhada da
feature profile (#252), cujos componentes visuais vieram da US29 (#255) no commit
`feat(profile): componentes compartilhados de perfil`.

## Escopo implementado

- **Camada de dados** (`src/features/profile/`):
  - tipos `ProfileRead`, `RecordaGridItem` e `RecordaGridPage`;
  - `profileService.getMyProfile` e `profileService.getUserRecordas`;
  - hooks `useMyProfile` e `useProfileRecordas`;
  - chaves `profileQueryKey` e `profileRecordasQueryKey`.
- **`RecordaGrid`:** grade de três colunas, só de apresentação, com estados de carregamento,
  vazio, erro, carregando mais e erro ao carregar mais.
- **Extensões aditivas do `ProfileHeader`:** chips de artistas e gêneros e contadores de
  seguidores e seguindo tocáveis, todos por props opcionais.
- **`FriendsScreen`:** parâmetro opcional `tab` para abrir direto em Seguidores ou Seguindo.
- **`MyProfileScreen`** registrada na rota `Profile`. O placeholder foi removido; o botão
  "Sair" já estava em Configurações (#261).
- **Atualização do perfil** depois de publicar, excluir uma Recorda e editar as preferências
  musicais.

## Contratos do backend

Conferidos na `dev` do backend:

| Endpoint                           | Resposta                                 | Observações                                                                                             |
| ---------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GET /users/me/profile`            | `ProfileRead`                            | 409 com onboarding musical incompleto                                                                   |
| `GET /users/{id}/recordas?cursor=` | `RecordaGridPage { items, next_cursor }` | Da mais recente para a mais antiga; 24 por página (padrão do backend); 403, 404 e 400 (cursor inválido) |
| `GET /users/me/music-preferences`  | `genres`, `artists` e `favorite_track`   | Lido pela integração existente (`getMusicPreferences`, `MUSIC_PREFERENCES_QUERY_KEY`)                   |
| `POST /recordas`                   | `RecordaRead`, com `user_id`             | Usado para saber de quem é o perfil a atualizar                                                         |

Nenhum campo ou endpoint foi inventado. O `ProfileRead` não ganhou artistas nem gêneros: eles
vêm das preferências musicais.

## Decisões de arquitetura

- **Chave com o id real.** O perfil próprio fica em `["profile", myUserId]`, com o id do
  cache de `/auth/me`, nunca em `"me"`. É a mesma chave que o perfil de terceiros usa.
- **Grade dentro do perfil.** `["profile", id, "recordas"]` fica sob `["profile", id]`, então
  invalidar o perfil atualiza também a grade.
- **Área de rolagem única.** A grade não rola sozinha; ela fica dentro do `ScrollView` da
  tela, junto com o cabeçalho e as abas, sem listas aninhadas. A tela pede a próxima página
  perto do fim da rolagem, usando `canLoadMore` para evitar pedidos duplicados. O puxar para
  atualizar recarrega perfil, grade e preferências.
- **Carregamentos independentes.** Só o perfil bloqueia a tela. Grade e preferências carregam
  à parte; se as preferências falharem, só os chips somem.
- **409.** O perfil responde 409 com o onboarding incompleto. A tela faz um único
  `navigation.reset` para `OnboardingArtists` e deixa de buscar a grade e as preferências.
- **Retry.** O 409 do perfil não é repetido, para chegar logo à tela. A grade não repete 400,
  401, 403 e 404.
- **Invalidações e sessão.** Seguem o padrão `getSessionGeneration` do projeto. Se a sessão
  mudar durante a operação, o perfil não é invalidado.
  - Publicar: `["profile", user_id da resposta]`, por prefixo (perfil e grade).
  - Excluir: `["profile", dono]`, por prefixo, só quando a Recorda é do usuário logado.
  - Editar preferências: `["profile", myUserId]` com `exact: true`, porque a grade não muda.
    Os chips leem o cache de preferências, que o editor já atualiza.
- **Componentes só de apresentação.** `ProfileHeader`, `ProfileTabs` e `RecordaGrid` não
  buscam dados nem navegam; a tela decide tudo.

## Divergências com a #252

| #252                                                   | Implementação                                            | Justificativa                                                          |
| ------------------------------------------------------ | -------------------------------------------------------- | ---------------------------------------------------------------------- |
| `headerRight` no `ProfileHeader`                       | Barra superior na tela                                   | A barra muda entre o perfil próprio e o de terceiros; decisão da US29. |
| `streakSlot` no `ProfileHeader`                        | Não existe ainda                                         | A #260 entra com uma prop opcional nova, sem quebrar nada.             |
| Ícone de editar ao lado da foto                        | `onEditAvatar` torna o avatar tocável, sem ícone         | O visual e o comportamento são da #254.                                |
| `ProfileTabs` com `metricsContent` e `calendarContent` | O conteúdo de cada aba é decidido pela tela              | O Épico 07 encaixa o conteúdo na tela.                                 |
| `useProfile(userId \| "me")`                           | `useMyProfile` (perfil próprio)                          | Mesma chave da US29 (`useUserProfile`); endpoints diferentes.          |
| Toque na grade → `RecordaView`                         | `PublishedRecorda({ postId })`                           | `RecordaView` não tem rota de entrada e usa dados simulados.           |
| `mocks/profileMocks.ts`                                | Não incluído                                             | O backend já atende o perfil próprio; o mock é da US29.                |
| `PrivateProfileNotice`                                 | `ProfilePrivateNotice`, com o texto aprovado pelo senior | Veio da US29.                                                          |

## Dependências

- **#254:** ícone e edição do avatar. O `ProfileHeader` já aceita `onEditAvatar`.
- **#260:** badge de streak. O backend já entrega `streak` no `ProfileRead`.
- **Épico 07:** conteúdo das abas Métricas e Calendário, que hoje mostram "Em breve".

## Decisões visuais provisórias

- Só o primeiro artista e o primeiro gênero das preferências. O backend não garante que o
  primeiro é o favorito. O `ProfileHeader` aceita mais itens.
- Gêneros com ícone de nota musical, como na referência visual, mesmo quando o backend tem
  imagem.
- Barra superior só com a engrenagem. A referência também mostra calendário e editar.
- Texto de grade vazia genérico ("Nenhuma Recorda publicada ainda."), também no próprio
  perfil.
- Vídeos na grade aparecem com a capa da música e o ícone de play: o contrato não tem
  miniatura de vídeo.

## Limitações conhecidas

- A próxima página da grade só é pedida ao rolar. Numa tela tão alta que a primeira página
  caiba inteira, a segunda não carregaria. Em celulares, 24 miniaturas passam da altura da
  tela.
- Com o onboarding incompleto, a busca de preferências também recebe 409 e é repetida uma
  vez (retry padrão) antes do redirecionamento.
- A tela depende do usuário no cache de `/auth/me`, preenchido pela Splash.
- Depois do redirecionamento por 409, voltar na tela de artistas encerra a sessão. Esse é o
  comportamento existente do `OnboardingArtistsRoute`.
- O teste `PublishedRecordaScreen › handles a Recorda with no comments` falha também na `dev`
  original: sempre quando o arquivo roda sozinho e às vezes na suíte completa. Não é desta
  task.

## Validação

**Ambiente.** O backend precisa estar na `dev` atual. Um container construído antes dos
endpoints de perfil devolve o schema antigo de `/users/me/profile` (sem `counts`), 404 na
grade e 405 nas preferências. Nesse caso, reconstruir a API:

```bash
cd recorda-backend
docker compose up -d --build api
```

O entrypoint aplica as migrações. Depois, configure `EXPO_PUBLIC_API_URL` com o IP do
computador e a porta 8000, rode `npx expo start -c` e entre com uma conta que concluiu o
onboarding.

**Já validado com dados reais no Expo Go:**

- perfil, contadores, música, artista e gênero favoritos;
- grade com Recordas reais e abertura dos detalhes;
- navegação para Configurações e para Seguidores e Seguindo;
- edição de preferências musicais;
- exclusão de uma Recorda, com grade e contador atualizados ao voltar ao perfil.

**Ainda não validado manualmente no iPhone:** a publicação. Ela está coberta por testes
automatizados, mas falta conferir no aparelho:

1. Anote o contador e a primeira miniatura do perfil.
2. Publique uma Recorda e volte ao perfil.
3. O contador deve subir 1 e a nova Recorda deve aparecer no topo, sem puxar para atualizar.

## Integração futura com a US29 e o Draft PR #268

- O #268 foi criado sobre uma `dev` antiga e já tinha conflitos com ela. Ao retomá-lo:
  - **`profileService.ts` e o teste dele:** juntar `getUserProfile` (terceiros) aos métodos
    desta task, no mesmo objeto.
  - **`types.ts` e `queryKeys.ts`:** manter a versão desta task, que acrescenta os tipos da
    grade e a chave da grade sem mudar `ProfileRead` nem `profileQueryKey`.
  - **`profile/index.ts`, traduções e `RootNavigator`:** conflitos simples de linhas
    adjacentes. As chaves `comingSoon`, `loading`, `loadError` e `retry` têm os mesmos nomes
    e textos nas duas tasks.
  - **`ProfileHeader`:** manter a versão desta task; as mudanças são aditivas.
  - **`FriendsScreen`:** descartar a mudança da US29. A `dev` já abre `Profile` para o
    próprio usuário e `UserProfile` para os outros.
  - **`useFollowMutation`:** reaplicar a invalidação de `["profile", userId]` sobre a versão
    atual da `dev`, que agora tem controle de sessão.
- **Melhorias possíveis para a `UserProfileScreen`:**
  - trocar o "Em breve" da aba Recordas pela `RecordaGrid` com `useProfileRecordas(userId)`
    quando `can_view_content` for verdadeiro;
  - não passar chips de artistas e gêneros: não há fonte para terceiros.
