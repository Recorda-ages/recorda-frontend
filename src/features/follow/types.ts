/**
 * Estado da relação entre o usuário autenticado e outra pessoa.
 *
 * Os valores vêm em português porque o backend os define assim
 * (`FollowStatus` em `app/schemas/user.py`); traduzir aqui só criaria um
 * mapa a mais para manter em sincronia.
 */
export type FollowStatus = "nenhuma" | "seguindo" | "solicitado";

/** Resposta esperada das rotas de follow/unfollow (BE#43). */
export type FollowMutationResult = {
  follow_status: FollowStatus;
};

export type FollowAction = "follow" | "unfollow";

export type FollowMutationInput = {
  action: FollowAction;
  /**
   * Relationship before an unfollow: tells cancelling a request ("solicitado") apart from
   * unfollowing ("seguindo"). Optional; when absent, the own profile is refreshed anyway.
   */
  previousStatus?: FollowStatus;
  userId: string;
};
