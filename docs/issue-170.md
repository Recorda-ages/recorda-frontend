# #170 — Detalhes da Recorda

A tela `PublishedRecorda` abre pelo toque no card do Feed Seguindo.
A rota recebe somente `postId`; as duas telas leem a mesma instância de `FeedProvider`.
A tela `RecordaDetails` existente continua sendo a etapa de criação antes da publicação.

## Escopo da demonstração

- Mídia, autor, música, descrição, data de publicação e lista de comentários.
- Curtidas e comentários mantidos em memória entre Feed e detalhes.
- Usuário de demonstração: `lucas_almeida` (`demo-lucas`).
- Recordas desse usuário oferecem Excluir, com confirmação antes da remoção local.
- Recordas dos demais autores oferecem Denunciar.
- Nenhuma data da memória, localização ou marcação é apresentada.
- Os dados locais são reiniciados ao reiniciar o app; nenhuma alteração é enviada ao servidor.

## Integrações pendentes

O Feed Seguindo agora lê itens da API. A tela recebe o item selecionado no estado
compartilhado e usa a identidade da sessão autenticada para decidir entre Excluir e
Denunciar. Curtidas, comentários e exclusão ainda são locais nesta etapa da #170;
os exemplos em `mockFeedPosts` permanecem apenas para prévia e testes. Falta conectar
essas ações à API e atualizar a lista remota após a exclusão.

`RecordaShare` recebe `{ postId }` e é o destino reservado ao Épico 8 (#200, #202,
#204). `RecordaReport` recebe o mesmo contrato para o fluxo de denúncia. As telas
temporárias informam que essas funções estão indisponíveis; não simulam exportação
nem confirmação de denúncia enviada. Substituir seus componentes no navegador ao
integrar essas tarefas.

Não há player compartilhado de música no Feed atual. A tela de detalhes não cria, reinicia ou
reposiciona um player. O critério de continuidade musical precisa ser validado com
o player compartilhado quando ele existir; exibir título e artista não comprova
continuidade de reprodução. A tela também aceita foto e vídeo dos itens da API.

## Verificação manual

1. Abrir o Feed, escolher Seguindo e tocar em um card; conferir conteúdo e data de publicação.
2. Curtir e comentar, voltar e reabrir para conferir o estado local.
3. Na prévia de Lucas, abrir Mais opções, Excluir e cancelar; conferir preservação.
4. Repetir e confirmar; conferir remoção do Feed.
5. Em uma Recorda de outro autor, conferir que só Denunciar aparece como ação no menu.
6. Abrir Compartilhar e Denunciar e conferir a indicação de integração pendente.
7. Verificar teclado, rolagem e área segura em Android/iOS, inclusive texto ampliado.

## Validação desta implementação

- Lint e TypeScript: aprovados.
- Após o rebase e o ajuste visual: 41 suítes, 241 testes aprovados com
  `--coverage --runInBand --forceExit`.
- Cobertura de instruções dos novos arquivos: de 84% a 100%; cobertura global
  de linhas: 90,85%.
- Exportação web aprovada; navegação, curtida, comentário, menu de autoria e
  degradê superior conferidos na prévia web. Validação em Android/iOS ainda pendente.
- Prettier global aprovado com `--end-of-line auto` no checkout Windows.
- Nova prévia do degradê: [tela](evidence/170/details-gradient-preview.png).
- Evidências web: [tela](evidence/170/details-web.png) e
  [ações e comentários](evidence/170/details-comments-web.png).
- Saída real da execução dos testes: [log](evidence/170/test-output.txt).
