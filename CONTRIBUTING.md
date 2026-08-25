# Fluxo de Desenvolvimento - Frontend

Este documento descreve o **fluxo completo de desenvolvimento** adotado no repositório de **front-end** do projeto Recorda.  
Todo o processo utiliza boas práticas de desenvolvimento, arquitetura feature-first, convenção de branches, linting, tipagem estática, testes automatizados e integração contínua (CI).

Para garantir que sua contribuição seja aprovada rapidamente, siga os seguintes passos:

## 1. Selecionar Task

- Acesse o [**board do projeto**](https://github.com/orgs/Recorda-ages/projects/1) no GitHub.
- Escolha uma tarefa disponível na coluna **To Do**.
- Clique em **Assign** e atribua a si mesmo (e a quem mais estiver fazendo a task com você).
- Arraste a task para a coluna **In Progress**.

> ⚠️ **IMPORTANTE:** Apenas atribua uma tarefa ao seu nome e a coloque em progresso quando de fato tiver disponibilidade para trabalhar nela.

## 2. Criar Feature-Branch

Você pode criar a sua feature-branch de duas maneiras, mas ela **sempre** deve ser criada a partir da branch **`dev`** e seguir a convenção de nomenclatura (em **INGLÊS**):

```bash
<tipo>/<issue-id>-<descricao-em-kebab-case>
```

**Tipos de branch:**

- `feat`: nova funcionalidade
- `fix`: correção de bug
- `docs`: documentação
- `style`: formatação
- `refactor`: refatoração
- `test`: testes
- `chore`: manutenção / dependências / infraestrutura

**Exemplos:**

- `feat/123-login-screen`
- `fix/456-audio-player-crash`

### Opção A: Pela interface do GitHub (Recomendado)

No card da sua Issue, no campo `Development` (na barra lateral direita), clique em `Create a branch`.

> ⚠️ **Atenção:** Certifique-se de selecionar a branch **`dev`** como base (source branch), e não a `main`.

### Opção B: Pelo Terminal (Localmente)

Se preferir criar via linha de comando, garanta que sua base `dev` está atualizada antes de criar a nova ramificação:

```bash
git checkout dev                  # Garante que está na branch dev
git pull origin dev               # Atualiza sua branch dev local
git checkout -b <nome-da-branch>  # Cria a branch a partir da dev e troca para ela
```

## 3. Acessar e Sincronizar o Repositório

### Baixando a Branch (Caso tenha usado a Opção A)

Como você criou a branch pela interface do GitHub, o seu computador local ainda não sabe que ela existe. Para baixar e acessar sua branch, execute:

```bash
git fetch origin                      # Baixa as informações mais recentes do GitHub
git checkout <nome-da-sua-branch>     # Entra na branch da sua tarefa
```

> _(Se você usou a Opção B, você já está na branch e pode pular este passo)._

### Sincronizando o Repositório

A branch `dev` receberá novos códigos de outros colegas frequentemente. Para manter seu histórico limpo e evitar quebras de pipeline, **SEMPRE** antes de abrir ou atualizar seu PR, sincronize sua branch puxando as novidades da `dev` com **rebase**:

```bash
git fetch origin dev            # Busca as últimas atualizações da dev remota
git rebase origin/dev           # Aplica seus commits no topo da dev mais recente
```

> ℹ️ **DICA:** Se ocorrerem conflitos durante o rebase, o terminal avisará. Abra o VS Code, aceite as mudanças corretas, execute `git add <arquivo-resolvido>` e continue com `git rebase --continue`. **NUNCA** use `git commit` durante um rebase!

## 4. Desenvolvimento

- Implemente POR COMPLETO a funcionalidade descrita na task
- Siga as boas práticas de código do projeto (clean code, SOLID)
- Mantenha o código organizado e legível

## 5. Qualidade e Testes

**Obrigatório:** toda funcionalidade ou correção deve conter testes automatizados (unitários e/ou de componentes) e passar em todas as validações estáticas.

⚠️ Não serão aceitos PRs sem validação de lint, checagem de tipos e testes bem-sucedidos.

**Comandos de Validação Local:**

```bash
npm run lint           # Valida regras de lint com ESLint (--max-warnings=0)
npm run format:check   # Valida formatação com Prettier (use 'npm run format' para auto-formatar)
npm run typecheck      # Valida tipos estáticos com TypeScript (tsc --noEmit)
npm test -- --coverage # Executa os testes (Jest + Testing Library) com relatório de cobertura
```

**Requisitos mínimos:**

- ✅ Todos os testes devem passar.
- ✅ Zero erros de TypeScript (`npm run typecheck`).
- ✅ Zero avisos/erros no linter (`npm run lint`).
- ✅ Cobertura de testes mínima de **80%** no código implementado.

## 6. Commit

Utilize o padrão de **Conventional Commits:**

```text
<tipo>[escopo opcional]: <descrição curta>
```

**Exemplos:**

```text
feat(auth): add login screen with email validation
fix(profile): adjust avatar image cropping
test(feed): add unit tests for memory card component
chore(deps): update expo packages
```

## 7. Push

Envie sua branch para o repositório remoto:

```bash
git push origin <nome-da-branch>
```

_(Se você fez rebase após já ter feito push anteriormente, utilize `git push --force-with-lease origin <nome-da-branch>`)_.

## 8. Verificar CI (GitHub Actions)

1. Acesse a aba **Actions** no repositório do GitHub.
2. Confirme que todos os workflows executaram com sucesso:
   - **Validação e Lint:** Verifica conformidade do código (`npm run lint`, `npm run format:check`).
   - **Typecheck:** Garante tipagem correta (`npm run typecheck`).
   - **Testes & Cobertura:** Execução dos testes e validação da cobertura mínima de 80%.

## 9. Abrir Pull Request (PR)

- Abra o PR apontando da sua branch para a branch **`dev`** (e **não** para a `main`).
- **Título:** Claro e conciso seguindo Conventional Commits (ex: `feat(player): add audio memory player`).
- **Descrição:** Explique o que foi feito, decisões tomadas e contexto da issue.
- **Evidências obrigatórias:**
  - 📸 **Prints da tela/feature funcionando no app (Android/iOS/Web).**
  - 📊 **Screenshot do terminal com a cobertura de testes (80%+).**
- Após abrir o PR, mova o card no board para **Ready for Review**.

## 10. Solicitar Review

- Atribua um revisor (AGES III).
- Avise no Discord no canal `#pull-requests` marcando os revisores (@AGESIII).

## 11. Code Review

Os AGES III (e eventualmente os AGES IV) irão analisar o PR.

### ✅ Aprovado

- O revisor move o card para **Done**.
- O PR é mesclado na branch **`dev`**.

### ❌ Reprovado / Alterações Solicitadas

- Os comentários e pontos de ajuste serão indicados diretamente no PR.
- O card retorna para **In Progress** no board.
- Você será notificado no Discord.

**Se houver correções solicitadas:**

- Corrija os pontos levantados.
- Repita o fluxo a partir do passo 5 (Qualidade e Testes) até a aprovação (é chato, eu sei 😓).

## 12. Pós-Merge (Integração Contínua)

Após o merge na branch `dev`:

- A pipeline de CI valida a integração contínua do repositório.
- Futuramente, as entregas acumuladas em `dev` serão mescladas na `main` para lançamentos de release e deploys.

---

## Pronto! 🥳

Seguindo este documento, sua contribuição será integrada com qualidade, rapidez e sem surpresas.

> _**P.S.:** Qualquer dúvida, favor acionar os AGES III e IV no Discord._
