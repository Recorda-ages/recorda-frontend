# Issue #260 — Badge de streak no cabeçalho do perfil (US35)

Implementação na branch `feat/260-profile-streak-badge`, baseada em `origin/dev` (`18409d7`),
em 05/11/2026. Sem alterações no backend nem código da US29.

## O que foi implementado

- **`StreakBadge`** (`features/profile/components/StreakBadge.tsx`): um único indicador de
  streak, com ícone de chama e texto, exibido como chip do cabeçalho.
- **`StreakHint`** (mesmo arquivo): a dica de publicação, como texto auxiliar abaixo da grade
  de chips.
- Os dois recebem o `ProfileRead` como vem da API (`streak`, `can_view_content`,
  `relationship.is_self`) e compartilham as regras de exibição no mesmo arquivo, sem lógica
  nas telas.
- **`MyProfileScreen`** passa `streakSlot={<StreakBadge profile={data} />}` e
  `streakHintSlot={<StreakHint profile={data} />}`.
- **Traduções** em pt-BR, en e es (`profile.streak`), com plural `_one` / `_other`:
  "1 dia de streak" / "12 dias de streak", "1-day streak" / "12-day streak" e
  "1 día de racha" / "12 días de racha".

## Estados e privacidade

| Situação                                                | Exibição                                                     |
| ------------------------------------------------------- | ------------------------------------------------------------ |
| `streak = null`                                         | Nada                                                         |
| `can_view_content = false`                              | Nada, mesmo que o backend envie o streak                     |
| `current_days = 0`                                      | "Sem sequência", fundo cinza-escuro, ícone e texto discretos |
| `current_days > 0`                                      | "N dia(s) de streak", fundo verde-escuro, chama destacada    |
| Perfil próprio, `current_days = 0`                      | Dica "Publique hoje para começar"                            |
| Perfil próprio, `current_days > 0`, `published_today` ✗ | Dica "Publique hoje para manter"                             |
| Perfil próprio, `current_days > 0`, `published_today` ✓ | Sem dica                                                     |
| Perfil de terceiros                                     | Nunca mostra dicas                                           |

O valor e a dica não são calculados no app: vêm de `streak.current_days` e
`streak.published_today`, apurados pelo backend no fuso `America/Sao_Paulo`.

Fora do escopo: conquistas, rankings e outros badges.

## `ProfileInfoChip` e `ProfileHeader`

- **`ProfileInfoChip`**: a apresentação dos chips de informação (formato, dimensões, ícone ou
  imagem e texto em uma linha com "…"), extraída do `ProfileHeader`. Os chips de música,
  artista e gênero e o streak usam o mesmo componente, com três tons:
  - `default`: chips de música, sem mudança visual.
  - `highlight`: streak ativo, com fundo verde-escuro (`primary[800]`).
  - `muted`: streak zerado, com o fundo cinza-escuro dos chips de música e ícone e texto
    discretos.
- **`ProfileHeader`** ganhou dois slots opcionais, como previsto em `docs/issue-253.md`:
  - `streakSlot`: a primeira célula da grade de chips.
  - `streakHintSlot`: o texto logo abaixo da grade.
  - Os dois são renderizados sem wrapper, então um conteúdo oculto não deixa célula vazia.
    O header continua sem conhecer streak, privacidade ou quem está olhando.

## Validação

**Visual:** aprovada em 06/11/2026 no Expo Go, no perfil próprio da conta de QA
`qa255_viewer`, com o badge ativo (12 dias), o estado zerado, os textos e a organização dos
chips. Para o estado de 12 dias foram criados registros temporários só no banco local; eles
já foram removidos e não fazem parte desta entrega.

**Automatizada:**

| Verificação            | Resultado                          |
| ---------------------- | ---------------------------------- |
| `npm test`             | 122 suítes, 1.125 testes aprovados |
| Testes de perfil       | 7 suítes, 107 testes aprovados     |
| `npm run typecheck`    | Aprovado                           |
| `npm run lint`         | Aprovado, zero avisos/erros        |
| `npm run format:check` | Aprovado                           |

Cobertura nova:

- `StreakBadge.test.tsx`: streak ausente, zerado, ativo com e sem publicação hoje, perfil de
  terceiros, privacidade, plural em pt-BR, en e es, fundo e cor de texto de cada estado e
  texto em uma linha.
- `ProfileComponents.test.tsx`: posição dos slots e fundo dos chips de música.
- `MyProfileScreen.test.tsx`: integração com o perfil próprio.

## Pendências

- **Integração com `UserProfileScreen`: não realizada.** A tela é da US29 (#255, PR #268),
  que não estava na `dev` quando esta branch foi criada. Quando estiver, falta passar
  `streakSlot={<StreakBadge profile={profile} />}` ao `ProfileHeader` dessa tela e cobrir com
  um teste de integração. O `streakHintSlot` é opcional ali, porque terceiros nunca têm dica.
  As regras de terceiros e de privacidade já estão no componente, com testes unitários.
- **Privacidade: alinhamento com o time.** A decisão D-06 do backend (PR #152) envia o streak
  mesmo sem acesso ("identidade, música favorita e streak são sempre visíveis"). Esta entrega
  segue provisoriamente o critério de aceite da #260 e oculta o streak quando
  `can_view_content === false`. Se o time mantiver a D-06, basta ajustar `visibleStreak` em
  `StreakBadge.tsx`.
