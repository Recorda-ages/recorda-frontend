# Perfil de Terceiros: notas de implementação

Registro das decisões da feature `profile`, para revisões humanas e automatizadas. As
issues e os contratos oficiais continuam sendo a fonte de verdade. Este arquivo só
resume o que foi decidido e o que ainda está em aberto.

Última atualização: 2026-10-19 (preparação do Draft PR, após a validação visual no Expo
Go).

Legenda:

- **Confirmado**: decidido pela responsável pela implementação.
- **Provisório**: escolha técnica feita para permitir a implementação. Pode mudar sem
  impacto no restante do código e precisa de confirmação.
- **Pendente**: depende de alinhamento com a equipe ou de outra task. Não deve ser
  tratado como regra.

## 0. Resumo para revisão

Leitura rápida. Os detalhes estão nas seções indicadas.

**A. Componentes compartilhados (confirmado).** `ProfileHeader`, `ProfileTabs`,
`ProfilePrivateNotice` e `ProfileGlow` foram feitos na US29 porque a US28 (Perfil Próprio)
ainda está no backlog. São visuais e foram pensados para reuso pela US28. A tela de perfil
próprio **não** faz parte desta entrega. Ver §2.1, §2.2 e §11.1.

**B. Streak (transferido, decisão definitiva).** A badge aparece na #255 e nas referências,
mas será implementada numa task específica da **US35**, sob a mesma responsável. A ausência
é intencional, não esquecimento. Ver §2.8.

**C. Artistas e gêneros favoritos (bloqueado por contrato/backend).** O `ProfileRead`
adotado não traz esses dados, e não há fonte confirmada para terceiros. Por isso só o chip
de música favorita existe. Não é decisão de produto remover os chips, e nenhum campo ou
endpoint foi inventado. Ver §5.

**D. Grade de Recordas (bloqueado por dependência).** Depende de um endpoint de Recordas
por usuário, que ainda não existe. A aba mostra um estado temporário ("Em breve"), não uma
lista vazia real do usuário. Integração futura necessária. Ver §6.2.

**E. Métricas e Calendário (transferido).** As abas existem; o conteúdo é do Épico 07.
Até lá mostram "Em breve". Ver §2.5.

**F. Denúncia (confirmado).** A T-E9.US41.FE.01 foi incorporada à #255 por decisão
explícita, reutilizando a infraestrutura de denúncia existente. Ver §2.6.

**G. Follow (confirmado).** A lógica existente foi preservada. Entraram a variante visual
`block` do `FollowButton`, o novo diálogo de unfollow e a invalidação de
`["profile", userId]`. Ver §2.4 e §11.3.

**H. Mock de desenvolvimento (confirmado, temporário).** Perfis fictícios e um seletor
"DEV · Perfis de teste" para validar a interface sem a #109, isolados da produção.
**Decisão atual:** o mock fica no Draft PR e sua remoção será reavaliada antes do merge,
depois da integração com a #109. Ver §10.

**I. Status da entrega:**

| Status                            | Itens                                                                                                                                                                                                                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Implementado e testado            | Componentes compartilhados; estados da tela (carregando, erro, 404, público, privado com e sem acesso, solicitado, seguindo); redirecionamento do próprio perfil; pontos de entrada; variante `block` e diálogo de unfollow; menu de denúncia; i18n (pt-BR, en, es); refinamentos visuais; mock e seletor de dev. |
| Implementado, mas não integrado   | Busca do perfil de terceiros (path provisório, §6.1); atualização do perfil após follow contra o backend real; denúncia a partir do perfil real (a rota de denúncia existe, mas a tela só carrega perfis reais depois da #109). Testado só com services simulados.                                                |
| Deliberadamente transferido       | Badge de streak (US35); conteúdo de Métricas e Calendário (Épico 07); tela de Perfil Próprio (US28).                                                                                                                                                                                                              |
| Bloqueado por dependência externa | Endpoint de perfil de terceiros (#109); endpoint de Recordas por usuário; artistas e gêneros favoritos de terceiros; divergências de contrato do §7.                                                                                                                                                              |

**J. Refinamentos visuais (confirmado).** Brilho do avatar sem corte durante o scroll
(§11.1); texto definitivo "Siga este perfil para ver suas Recordas." (§11.2); novo diálogo
de unfollow (§11.3); ajustes tipográficos do diálogo após a validação no Expo Go (§11.3).

## 1. Tasks envolvidas

| Task                                                                                      | Escopo nesta branch                                                                     |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **T-E6.US29.FE.01** ([#255](https://github.com/Recorda-ages/recorda-frontend/issues/255)) | Tela `UserProfileScreen`, componentes compartilhados e pontos de entrada para o perfil. |
| **T-E9.US41.FE.01**                                                                       | Item "Denunciar perfil" no menu de três pontos da tela.                                 |

A T-E9.US41.FE.01 não tem issue própria no Projects. Ela foi **incorporada à #255 por
decisão explícita da responsável pela implementação**. Referências: história US41
([#223](https://github.com/Recorda-ages/recorda-frontend/issues/223)) e endpoint
T-E9.US41.BE.01 ([backend#81](https://github.com/Recorda-ages/recorda-backend/issues/81)).

Branch: `feat/255-user-profile-screen`.

## 2. Decisões confirmadas

### 2.1 Componentes compartilhados

- Esta task cria `ProfileHeader`, `ProfileTabs`, `ProfilePrivateNotice` e `ProfileGlow` em
  `src/features/profile/components/`. A US28 (Perfil Próprio) ainda está no backlog e deve
  reutilizar `ProfileHeader`, `ProfileTabs` e `ProfileGlow`. O `ProfilePrivateNotice` só
  faz sentido para terceiros.
- Os componentes são visuais. Não conhecem serviços, endpoints, follow, privacidade,
  navegação nem quem está vendo o perfil. Essas regras ficam na tela que os usa.
- `ProfileHeader` contém: avatar, nome, username, música favorita (quando houver),
  contadores (só quando `counts` é informado), `actionSlot` e `onEditAvatar` (opcional; o
  avatar só é pressionável quando a prop é passada). O brilho verde é desenhado pela tela
  com `ProfileGlow` (§11.1).
- `ProfileTabs` contém só a barra das abas Recordas, Métricas e Calendário. O conteúdo de
  cada aba é decidido pela tela, e é por aí que o Épico 07 e a US28 vão encaixar seus
  conteúdos.

### 2.2 Barra superior

- A barra superior (voltar, nome do usuário e menu de três pontos) pertence à
  `UserProfileScreen`, **não** ao `ProfileHeader`. Assim a US28 usa o mesmo cabeçalho com
  a navegação dela.

### 2.3 Privacidade

A tela decide pelo `can_view_content` do backend. Não infere permissão a partir de
`is_private` nem de `follow_status`.

Quando `can_view_content = false`:

- continuam visíveis: avatar, nome, username, as informações musicais disponíveis e o
  `FollowButton`;
- ficam ocultos: contadores e Recordas;
- os três rótulos das abas continuam visíveis;
- `ProfilePrivateNotice` aparece abaixo das abas, em qualquer aba selecionada.

### 2.4 Follow

- O `FollowButton` é reutilizado sem mudar a lógica de follow. O cancelamento de
  solicitação continua usando `DELETE /users/{id}/follow`. A apresentação da confirmação
  de "deixar de seguir" mudou na rodada de refinamentos (§11.3).
- Mudanças no componente, ambas só de apresentação:
  - a prop visual `size?: "compact" | "block"`. O padrão `compact` mantém a aparência em
    busca e sugestões. O ícone "+" ganhou um `testID` para o teste verificar a ausência dele
    no `block`;
  - o `UnfollowDialog` no lugar do `Alert` nativo (§11.3). Vale em todo o app, inclusive na
    busca.
- **Chave de cache:** `["profile", userId]`, como prevê a #255.
- **Invalidação:** o `useFollowMutation` também passa a invalidar
  `["profile", userId]` no `onSettled`, junto com as invalidações que ele já fazia.
  - É uma linha a mais, sem duplicar a lógica de follow e sem reorganizar o cache.
  - O `onSettled` cobre o sucesso exigido pela #255 e também o caso de erro em que o
    servidor já está em outro estado (ex.: 409).
- A tela não guarda cópia própria do estado de follow. `follow_status`, `counts` e
  `can_view_content` vêm sempre da query. Não há atualização otimista do perfil.

### 2.5 Abas sem conteúdo disponível

- **Métricas e Calendário:** mostram "Em breve" (`pt-BR`, `en`, `es`) enquanto o
  Épico 07 não existir.
- **Recordas:** ver §6.2. Não existe fonte de dados para a grade.

### 2.6 Denúncia de perfil (US41)

O menu de três pontos oferece "Denunciar perfil" e abre o fluxo existente
(`useReportDialog` com `openReport({ type: "USER", userId })`). Nada de formulário ou
serviço paralelo. A infraestrutura atual já cobre a US41:

- `reportService.reportUser` chama `POST /users/{id}/reports`, rota que já existe em
  `dev` no backend;
- `ReportDialog` limita a justificativa a 500 caracteres;
- `useReportDialog` mostra "já denunciado" no 409 e "indisponível" no 403/404;
- a regra de não denunciar o próprio perfil é garantida pelo redirecionamento do §2.7:
  o menu nunca aparece no próprio perfil.

### 2.7 Navegação

- **Próprio usuário:** a `UserProfileScreen` chama `navigation.replace("Profile")`.
  - Primeiro compara o `userId` da rota com `useCurrentUser()`, antes de buscar o perfil.
  - Se o usuário atual ainda não estiver em cache, usa `relationship.is_self` como
    proteção adicional.
  - Os pontos de entrada não repetem essa regra.
- **Pontos de entrada:**
  - **Já navegam corretamente:** sugestões e resultados da busca;
    `NEW_FOLLOWER` / `FOLLOW_ACCEPTED` nas notificações.
  - **Bug corrigido:** `FriendsScreen` navegava sempre para `Profile`.
  - **Ganham navegação:** autor no `RecordaCard` (as duas abas do feed, via `FeedRow`),
    autor nos detalhes (`RecordaDetailView`) e autor de cada comentário.
- **Comentários:** `toFeedComment` passa a preservar o `user_id` que a API já envia.
- **Fora do escopo:** `features/recorda-view` (nenhuma rota leva até ela e ela usa dados
  simulados).

### 2.8 Badge de streak: ausência intencional

**Decisão definitiva.** A badge visual de streak aparece na #255 e nas referências
visuais, mas será feita numa task específica da **US35**, pela mesma desenvolvedora. Por
isso, nesta task:

- não há componente, lógica visual, animação, mock nem placeholder de streak;
- o campo `streak` continua no tipo `ProfileRead`, porque faz parte do contrato.

Quando a badge chegar, ela entra como uma prop opcional nova no `ProfileHeader`, sem
mudar as existentes.

### 2.9 Estratégia de entrega

- Tudo é desenvolvido nesta branch, em incrementos pequenos e com testes.
- A entrega será um **Draft PR**, com o merge bloqueado até a integração e validação com
  o backend #109.
- Commits, push e PR só com autorização da responsável.

## 3. Justificativas técnicas

- **Componentes visuais desacoplados:** o perfil próprio e o de terceiros recebem dados
  e permissões diferentes. Manter essa diferença na tela deixa os componentes
  reutilizáveis sem flags específicas de cada contexto.
- **Variante visual em vez de botão novo:** o `FollowButton` já trata os três estados e
  tem testes. Duplicar a lógica criaria duas fontes de verdade para o follow.
- **Invalidação dentro do `useFollowMutation`:** é o único lugar que sabe quando a
  mutation terminou. Passar um callback pelo `FollowButton` exigiria nova API nele só
  para repetir o que o hook já faz com as outras queries.
- **Sem dados simulados em `src/`:** telas e hooks são testados simulando o service com
  `jest.mock`, no mesmo padrão das features de busca e notificações.

## 4. Fora de escopo

| Item                                                             | Onde fica |
| ---------------------------------------------------------------- | --------- |
| Badge visual de streak (componente, animação, apresentação)      | US35      |
| Cards de métricas, estatísticas musicais, calendário interativo  | Épico 07  |
| Tela de Perfil Próprio, barra superior própria, edição de avatar | US28      |
| `features/recorda-view` (tela órfã)                              | —         |

## 5. Dependências ainda não disponíveis

| Dependência                                                     | Situação                                                                                                                                                       | Impacto na interface                                              |
| --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Endpoint de perfil de terceiros (T-E6.US29.BE.01, backend #109) | O path não está definido. O `profile_service.build_profile` das branches `feat/106` e `feat/113` lança `NotImplementedError` para quem não é o dono do perfil. | A tela não pode ser validada de ponta a ponta antes da #109.      |
| Endpoint de Recordas por usuário                                | Não existe, e o `ProfileRead` não inclui Recordas.                                                                                                             | A grade de Recordas não tem dados (§6.2).                         |
| Artistas favoritos de terceiros                                 | Não há campo no `ProfileRead`. O `GET /users/me/music-preferences` (#110) é só do próprio usuário.                                                             | O chip de artista não aparece.                                    |
| Gêneros favoritos de terceiros                                  | Mesma situação dos artistas.                                                                                                                                   | O chip de gênero não aparece. Só a música favorita tem dado hoje. |

## 6. Escolhas provisórias

### 6.1 Path do endpoint (provisório)

- O `profileService` usa `GET /users/{id}/profile`, isolado numa única função e marcado
  no código como **não confirmado**.
- O path foi escolhido por simetria com `GET /users/me/profile`. **Não é contrato
  aprovado.**
- Não há fallback para `/users/{id}` (rota administrativa) nem dados simulados.

### 6.2 Aba Recordas sem fonte de dados (estado temporário confirmado)

- Com acesso ao conteúdo, a aba Recordas mostra o mesmo "Em breve" das outras abas, em
  vez de uma grade vazia. Assim a tela não afirma que o usuário não tem Recordas.
- **Confirmado** como estado temporário. A grade será implementada quando houver endpoint
  de Recordas por usuário (§5).

### 6.3 Barra inferior (aprovada na validação visual)

- A tela usa o `BottomTabBar` existente com a aba "perfil" ativa, como nas referências
  visuais. Aprovada na validação visual no Expo Go.
- Toques levam a `Camera`, `Feed` e `Profile`.

## 7. Divergências contratuais pendentes

1. **Streak em perfil privado sem acesso.**
   - O trecho compartilhado do C-2 indica `streak = null` quando
     `can_view_content = false`; a #109 e a #255 indicam o streak preservado.
   - No código (`feat/106` e `feat/113`), o `None` do schema é justificado como "null até
     a #113".
   - **Pendente.** Não bloqueia esta task (§2.8), mas precisa ser fechada antes da US35.
2. **Contadores em perfil privado.** O código da `feat/106` anota `counts: None` para
   perfil privado na #109, o que bate com a referência visual. **Pendente** de
   confirmação no contrato final da #109.
3. **Cancelamento de solicitação.**
   - A #255 usa `DELETE /users/{id}/follow`. A #109 menciona `DELETE /follow-requests/{id}`,
     que exige `relationship.follow_id`.
   - O frontend mantém o comportamento atual (§2.4).
   - **Pendente:** saber se a #109 pretende mudar a rota oficial.
4. **Critérios de aceite da #255.**
   - "Um único indicador de streak" foi transferido para a US35 (§2.8).
   - "Chips de artistas/gêneros" estão bloqueados por falta de fonte de dados (§5).
   - **Pendente:** registrar essa distribuição no aceite com a equipe.

## 8. Estratégia de integração com o backend

- **Tipos:** espelham o `ProfileRead` de `app/schemas/profile.py` na branch de backend
  `feat/113-calculo-streak-de-publicacoes`, com comentário apontando a origem.
  - Campos anuláveis no backend (`counts`, `streak`) continuam anuláveis no frontend.
  - O schema antigo de `GET /users/me/profile` (em `dev`) **não** é usado.
- **Path:** isolado no `profileService` (§6.1). Depois da #109, a única mudança esperada
  é confirmar o path.
- **Erros:**
  - 404 vira "perfil indisponível";
  - os demais `ApiError` mostram o erro genérico com opção de tentar de novo;
  - nenhum erro é tratado como perfil privado, porque a privacidade vem só de
    `can_view_content`.
- **Validação:** a implementação **não** está validada de ponta a ponta enquanto a #109
  não estiver disponível e testada contra o backend real.

## 9. Detalhes de implementação

Escolhas técnicas feitas durante a implementação, sem impacto de produto:

- **Plural nos contadores:** os rótulos usam plural do i18next (`profile.counts.*_one` /
  `_other`), para não exibir "1 Seguidores".
- **Retry:** `useUserProfile` não repete 401, 403 e 404, seguindo o padrão das queries do
  admin. Os demais erros são repetidos uma vez, como o padrão global.
- **Autor e comentários:** o username é o controle acessível ("Abrir perfil de …"); o
  avatar só amplia a área de toque. Comentários sem `userId` (os locais, do
  `FeedContext`) não viram link.
- **Contadores sem acesso:** a tela só repassa `counts` ao `ProfileHeader` quando
  `can_view_content = true`. Se o backend enviar contadores num perfil sem acesso, eles
  continuam ocultos.
- **Menu de três pontos:** fica desabilitado enquanto o perfil não carregou. O item usa a
  chave nova `profile.report`, com o mesmo texto de `moderation.report.title.user`.

## 10. Mock de desenvolvimento do perfil de terceiros

> **Não é integração com o backend.** Os dados são fictícios e servem só para validar a
> interface no Expo Go. A US29 só estará validada depois de testada contra a #109.

**Motivação:** o endpoint de terceiros (#109) não existe, então qualquer perfil aberto mostra
"perfil indisponível" (404). O mock permite ver os estados da tela antes disso.

**Escopo:** só desenvolvimento. Fica ativo apenas com `__DEV__` **e**
`EXPO_PUBLIC_PROFILE_MOCK=true`. Em build de produção `__DEV__` é falso, então o mock nunca
liga, mesmo que a variável exista. Um erro HTTP nunca ativa o mock.

**Ativar e desativar:**

- Ativar: `EXPO_PUBLIC_PROFILE_MOCK=true` no `.env` local e reiniciar com
  `npx expo start -c` (variáveis `EXPO_PUBLIC_*` entram no bundle).
- Desativar: remover a linha (ou usar outro valor) e reiniciar com `-c`.

**Como funciona:**

- `src/features/profile/mocks/profileMocks.ts` tem os cinco perfis, no formato do
  `ProfileRead`, sem campos extras.
- O `profileService` responde localmente só a IDs que começam com `mock-profile-`. Qualquer
  outro ID continua indo ao HTTP.
- Com o mock ligado, o `RootNavigator` aceita o deep link
  `exp://<IP>:<porta>/--/mock-profile/<user_id>`, que abre `UserProfile` com esse ID. Os
  pontos de entrada reais não mudam.

**Seletor de perfis (forma recomendada de acesso):**

- Arquivo: `src/features/profile/mocks/ProfileMockPicker.mock.tsx`. É uma ferramenta só
  de desenvolvimento, para validação visual, e por isso tem textos fixos, sem i18n
  (convenção dos arquivos `*.mock.tsx`).
- Onde está: na tela `Profile` (aba "Perfil" da barra inferior do feed), que ainda é o
  placeholder da US28. Aparece um botão amarelo "DEV · Perfis de teste" perto da parte de
  baixo da tela.
- Como usar: tocar no botão abre a lista dos cinco cenários. Tocar num cenário abre a
  `UserProfileScreen` pela rota existente (`UserProfile`). "Voltar" retorna à tela
  `Profile`, onde se escolhe o próximo cenário, sem empilhar perfis.
- Com o mock desligado ou em produção, o componente não renderiza nada.
- Se a US28 substituir o placeholder antes da #109, o seletor precisa ser movido junto.

**Cenários:**

| `user_id`                        | Estado                             |
| -------------------------------- | ---------------------------------- |
| `mock-profile-public`            | Público, não seguindo              |
| `mock-profile-private`           | Privado, não seguindo (sem acesso) |
| `mock-profile-requested`         | Privado, solicitação pendente      |
| `mock-profile-private-following` | Privado, seguindo (com acesso)     |
| `mock-profile-public-following`  | Público, seguindo                  |

Nos perfis sem acesso, `counts` e `streak` são `null`. O valor de `streak` nos mocks não
resolve a divergência do §7.1; a tela não exibe streak de todo modo.

**Limitações de follow e denúncia:** `followService` e `reportService.reportUser` recusam
localmente qualquer ID `mock-profile-*`, sem fazer requisição.

- O botão de seguir mostra os três estados, e a confirmação de "deixar de seguir" aparece,
  mas a ação termina em erro silencioso e a tela não muda.
- A denúncia abre o diálogo existente, mas o envio termina no erro genérico do diálogo.
- Validar o efeito real dessas ações depende da #109.

**Isolamento da produção:**

- o mock exige `__DEV__` e a variável ao mesmo tempo;
- responde só a IDs `mock-profile-*`; IDs reais sempre vão ao HTTP, e um erro HTTP nunca
  cai para o mock;
- o seletor e o deep link não existem com o mock desligado;
- follow e denúncia nunca enviam IDs fictícios;
- limitação conhecida: os dados fictícios (pequenos) ficam no bundle de produção, embora
  nunca sejam usados lá.

**Por que não substitui a integração real:** o mock valida só a apresentação. Não exercita
o endpoint, o contrato real, a autenticação, a privacidade calculada pelo backend nem o
efeito de follow e denúncia.

**Decisão atual:** manter o mock temporariamente no Draft PR. Antes do merge, reavaliar a
remoção depois da integração com a #109.

**Critério de remoção:** quando a #109 estiver disponível e a tela validada contra ela,
remover `mocks/profileMocks.ts`, `mocks/ProfileMockPicker.mock.tsx` (e seu uso na tela
`Profile` do `RootNavigator`), a decisão no `profileService`, as guardas em
`followService` e `reportService`, o `linking` do `RootNavigator`, a variável em
`env.ts`/`env.d.ts` e os testes correspondentes.

## 11. Refinamentos visuais após a validação no Expo Go

Decisões confirmadas pela responsável pela implementação nesta rodada.

### 11.1 Brilho do avatar sem corte durante o scroll

- **Causa:** o `glow.png` (440 px) era desenhado dentro do `ProfileHeader`, centralizado
  numa área de avatar de 256 px, dentro do `ScrollView`. Ele passava 92 px acima do topo do
  conteúdo rolável, e o `ScrollView` recorta o que fica fora dos próprios limites. Isso
  criava uma linha reta logo abaixo da barra superior. Em repouso o corte caía numa parte
  fraca do degradê; ao rolar, o brilho subia e o corte passava pela parte mais intensa.
- **Correção:** o brilho virou uma camada fixa da tela (`ProfileGlow`), desenhada antes da
  barra superior e do `ScrollView`. É o mesmo padrão do `FeedGlow` no feed e nos detalhes.
  Nenhum container o recorta, e o conteúdo rola por cima dele.
- **Alinhamento:** o `ProfileHeader` exporta `PROFILE_AVATAR_CENTER_Y`, e a tela centraliza
  o brilho em `insets.top + altura da barra + PROFILE_AVATAR_CENTER_Y`. Em repouso, a
  composição é a mesma das referências. A US28 deve usar `ProfileGlow` do mesmo jeito.

### 11.2 Texto do perfil privado

- **Decisão de copy aprovada pelo senior:** "Siga este perfil para ver suas Recordas."
- Mesma chave (`profile.private.message`). Em inglês: "Follow this profile to see their
  Recordas."; em espanhol: "Sigue este perfil para ver sus Recordas.".

### 11.3 Diálogo de "deixar de seguir"

- O `Alert` nativo foi substituído pelo `UnfollowDialog`
  (`src/features/follow/components/UnfollowDialog.tsx`), feito sobre o
  `destructiveDialogStyles` compartilhado, no mesmo padrão do `DeleteCommentDialog`. Não
  há infraestrutura nova de diálogo.
- **Visual (Figma):** bloco vermelho com X branco, título "Deixar de seguir?", texto
  centralizado, "Cancelar" cinza e "Deixar de seguir" vermelho.
- **Texto:** a frase do Figma "Essa ação não pode ser revertida" não foi usada, porque é
  possível seguir de novo. A mensagem existente foi mantida ("Tem certeza que deseja deixar
  de seguir {{username}}?"). O título ganhou a interrogação do Figma
  (`follow.unfollowTitle`: "Deixar de seguir?" / "Unfollow?" / "¿Dejar de seguir?"). Isso
  substitui, só neste ponto, a decisão anterior de não mexer nos textos da confirmação.
- **Lógica preservada:**
  - a mutation só roda após "Deixar de seguir";
  - "Cancelar" fecha sem mutation;
  - "Solicitado" continua cancelando direto, sem diálogo;
  - erros continuam no `useFollowMutation`.
- **Confirmação duplicada:** o diálogo fica aberto até a requisição terminar
  (`onSettled`), com o botão de confirmar desabilitado enquanto ela está em andamento.
- Vale para as variantes `compact` (busca) e `block` (perfil).
- **Tipografia (ajuste após a validação no Expo Go):** a escala segue o `ReportDialog` e o
  `DeleteCommentDialog`, sem mudar o `destructiveDialogStyles` compartilhado.
  - Título: `headline4` em Bai Jamjuree semibold, a mesma escala de "Denunciar Recorda".
  - Mensagem: `body2` em Bai Jamjuree semibold, cinza, com `lineHeight` 18.
  - Botões: `buttonSmall`, como no `DeleteCommentDialog`, e respiro lateral de
    `spacing[3]`.
