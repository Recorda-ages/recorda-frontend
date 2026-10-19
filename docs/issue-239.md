# Validação da integração do detalhe de denúncias (#239)

A tela usa `adminAdapter` → `adminService` → `authApiClient`. Os métodos existentes
`getReportDetail` e `updateReportStatus` correspondem ao GET e PATCH da task.
O cliente adiciona `/api/v1` e autenticação. Não é necessário ativar mocks.

## Ambiente

Use um backend que contenha as tasks BE.02 e BE.03 (ambas presentes no
`origin/dev` consultado durante esta implementação). A branch local
`feat/85-admin-report-detail` não contém o PATCH.

Configure `EXPO_PUBLIC_API_URL` conforme o README e entre com uma conta ADMIN.
Prepare alvos com denúncias OPEN: um usuário, uma Recorda PHOTO e uma VIDEO.
Use dados descartáveis para a validação das mutações.

## Roteiro com backend e banco reais

1. Abra cada alvo pela lista de denúncias. Confira autor/perfil, email quando
   aplicável, status, datas, música, denúncias individuais e histórico.
2. Confira foto e capa. Inicie o vídeo manualmente e confirme que começa mudo,
   sem autoplay. Valide também mídias protegidas pela autenticação.
3. Resolva um alvo e descarte outro com motivo. Confira o feedback, o status
   atualizado e o motivo no histórico. Volte à lista OPEN: o grupo tratado deve
   desaparecer. Nos filtros RESOLVED/DISMISSED, deve aparecer no novo status.
4. Reabra o detalhe: o estado deve continuar persistido. No banco, confira os
   registros de report alterados e a ação CHANGE_REPORT_STATUS em
   moderation_action, com admin, alvo, motivo e details.to/report_count.
5. Abra o mesmo alvo OPEN em duas sessões administrativas. Trate-o na primeira
   e confirme a ação na segunda: espere 409, o alerta "Este conteúdo já foi
   tratado" e a recarga do estado atual.
6. Confira que motivo vazio ou só com espaços bloqueia confirmação e que a
   entrada limita 500 caracteres. Por cliente HTTP autenticado, envie motivo
   vazio, só espaços e 501 caracteres: espere 422 e nenhuma alteração no banco.

## Evidências automatizadas e limites

`AdminReportDetailScreen.api.test.tsx` usa tela, hooks, adapter e serviço reais,
com **fetch simulado**. Cobre autenticação, mapeamento de dados, fontes de mídia,
vídeo configurado mudo, RESOLVED/DISMISSED, histórico recarregado, invalidação da
lista, 409 e correção após 422. Não comprova streaming nativo nem PostgreSQL.

Os testes existentes de ReasonDialog cobrem limites de entrada. Os testes de
backend `test_admin_report_detail_routes.py` e
`test_admin_report_status_routes.py` exercitam os endpoints e persistência em
SQLite. A validação manual acima complementa esses testes em ambiente real.

## Validação executada com PostgreSQL (18/10/2026)

O Docker disponível estava saudável, mas executava uma versão antiga sem as
rotas administrativas. A validação foi feita em um ambiente separado, projeto
Compose `recorda239`, com backend `origin/dev` (`7d9b3b2`), API em
`http://localhost:8001` e volume PostgreSQL próprio. O ambiente original não foi
alterado. Dados e mídias de teste permanecem apenas no ambiente separado.

Foram confirmados por HTTP e consultas ao PostgreSQL: GET de RECORDA e USER,
PATCH para RESOLVED e DISMISSED, motivo normalizado, status e resolved_at
persistidos, ação única de auditoria com administrador/motivo/alvo, atualização
das listagens filtradas, 409 na tentativa de outro administrador e 422 para
motivo vazio, só espaços e 501 caracteres.

Também foram enviados uma foto PNG e um vídeo MP4 reais. O detalhe retornou as
URLs persistidas e o administrador conseguiu ler as mídias de autor privado.
O vídeo respondeu 206 ao pedido Range bytes=0-1023, com Content-Range e bytes
corretos. Isso valida o transporte de streaming; a reprodução visual e o áudio
no player nativo ainda precisam de conferência em dispositivo/emulador.

Resultados: [postgres-validation.json](evidence/239/postgres-validation.json).

## Atualização do ambiente principal

Após a validação isolada, a pedido do usuário, o backend local foi atualizado
para `dev` (`7d9b3b2`) e a imagem da API principal foi reconstruída. A API
`http://localhost:8000` está saudável, com GET de detalhe e PATCH de status no
OpenAPI e acesso autenticado à lista confirmado (HTTP 200). O banco `recorda`
e seus cinco usuários foram preservados. Foi criado um backup em
`/private/tmp/recorda-before-api-update.dump` antes da atualização.

Na revisão final, a leitura de `alembic_version` do backup confirmou a versão
anterior `0005_notification`. O banco atual está em `0009_content_removed`,
alinhado ao head do código. A inicialização aplicou as migrations existentes
de comentários, denúncias, auditoria e suporte à notificação CONTENT_REMOVED.
Nenhuma migration nova foi escrita para esta task.

## Validação manual no iOS

O usuário executou o app no simulador e confirmou resolução, atualização dos
filtros da lista, persistência após reabrir o app e vídeo iniciado mudo. Os
prints apresentados mostram perfil, foto e vídeo carregados, descarte com
confirmação e motivo/administrador/data no histórico. A ausência de autoplay
está coberta pelo teste automatizado, mas não foi explicitamente confirmada
no retorno manual. A tela de destino de "Abrir usuário" permanece como
placeholder nesta versão e pertence ao fluxo separado de usuários.
