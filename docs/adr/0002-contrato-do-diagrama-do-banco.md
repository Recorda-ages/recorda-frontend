# Integração com o schema do diagrama oficial do banco

Substitui o [ADR 0001](./0001-integracao-publicacao-schema-legado.md). O backend adotou o schema do diagrama oficial (ver `docs/adr/0001-alinhamento-ao-diagrama-do-banco.md` no backend), e o adaptador de `recordaPublishApi.ts` agora envia o payload rico sem conversão: `media_url`, `song_title`, `song_artist_name`, `song_cover_url` e `song_preview_url`. `toDraftSong` passou a manter o `preview_url` da faixa, que antes era descartado.

## Consequências

- `UserBasicResponse` expõe `user_id` (UUID em string) e `role` (`USER`/`ADMIN`) no lugar de `id` e `account_type`. A sessão grava `role` no secure storage e, no logout, também remove a chave antiga `account_type`.
- O onboarding envia `picture_url` de gêneros e artistas, e a música favorita completa (`title`, `artist_name`, `cover_url`, `preview_url`), necessária para preencher `app_user.fav_song_*`. A tela de gêneros não mudou.
- Todo token emitido antes da mudança é recusado com 401. A Splash já trata esse caso e leva o usuário ao Login.
- As Recordas criadas no schema legado não foram migradas: a migration do backend recria as tabelas.
