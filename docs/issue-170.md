# #170 — Detalhes da Recorda

A tela `PublishedRecorda` abre pelo toque na mídia ou no botão de comentários do Feed.
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

O Feed desta base utiliza `mockFeedPosts`. A implementação local foi acordada para
esta etapa da #170. Antes da integração real, substituir a identidade de demonstração
pela sessão autenticada e conectar leitura, curtidas, comentários e exclusão à API.

`RecordaShare` recebe `{ postId }` e é o destino reservado ao Épico 8 (#200, #202,
#204). `RecordaReport` recebe o mesmo contrato para o fluxo de denúncia. As telas
temporárias informam que essas funções estão indisponíveis; não simulam exportação
nem confirmação de denúncia enviada. Substituir seus componentes no navegador ao
integrar essas tarefas.

Não há player de música no Feed atual. A tela de detalhes não cria, reinicia ou
reposiciona um player. O critério de continuidade musical precisa ser validado com
o player compartilhado quando ele existir; exibir título e artista não comprova
continuidade de reprodução. As mídias dos exemplos atuais são imagens.

## Verificação manual

1. Abrir o Feed e tocar na primeira mídia; conferir conteúdo e data de publicação.
2. Curtir e comentar, voltar e reabrir para conferir o estado local.
3. Na Recorda de Lucas, abrir Mais opções, Excluir e cancelar; conferir preservação.
4. Repetir e confirmar; conferir remoção do Feed.
5. Na Recorda de John, conferir que só Denunciar aparece como ação no menu.
6. Abrir Compartilhar e Denunciar e conferir a indicação de integração pendente.
7. Verificar teclado, rolagem e área segura em Android/iOS, inclusive texto ampliado.

## Validação desta implementação

- Lint e TypeScript: aprovados.
- Suíte completa: 38 suítes, 218 testes aprovados, executados com cobertura e
  `--forceExit`, como no workflow existente. Cobertura global de linhas: 91,09%.
- Após o ajuste visual final: 14 testes de Feed/detalhes aprovados, com
  `--detectOpenHandles` e encerramento normal.
- Cobertura de instruções dos novos arquivos: de 85% a 100%.
- Exportação web aprovada; navegação, curtida, comentário e menu de autoria
  conferidos na prévia web. Validação em Android/iOS ainda pendente.
- Prettier global aprovado após normalizar o checkout local e corrigir somente a
  formatação de duas asserções em `OnboardingMusicScreen.test.tsx` e uma em
  `OnboardingArtistsScreen.test.tsx`.
- Evidências web: [tela](evidence/170/details-web.png) e
  [ações e comentários](evidence/170/details-comments-web.png).
- Saída real da execução dos testes: [log](evidence/170/test-output.txt).
