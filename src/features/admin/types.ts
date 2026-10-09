export type AdminTargetType = "RECORDA" | "USER";

export type AdminReportStatus = "DISMISSED" | "OPEN" | "RESOLVED";

export type AdminUserStatus = "ACTIVE" | "SUSPENDED";

export type AdminStatus = AdminReportStatus | AdminUserStatus;

export type AdminActionReason = {
  reason: string;
};

export type AdminPage<TItem> = {
  items: TItem[];
  nextCursor: string | null;
};

export type AdminReportGroup = {
  contentSummary: string;
  latestReportedAt: string;
  latestReporterUsername: string;
  openReportCount: number;
  status: AdminReportStatus;
  targetId: string;
  targetLabel: string;
  targetType: AdminTargetType;
  targetUsername: string;
};

export type AdminReportFilters = {
  query?: string;
  status?: AdminReportStatus;
  targetType?: AdminTargetType;
};

export type AdminUserSummary = {
  email: string;
  reportCount: number;
  status: AdminUserStatus;
  userId: string;
  username: string;
};

export type AdminUserFilters = {
  query?: string;
  status?: AdminUserStatus;
};

/**
 * Interface estável usada pelas telas e pelos testes administrativos.
 *
 * O adapter HTTP será adicionado quando o contrato C-2 definir paths e schemas.
 * Até lá, o mock é o único adapter concreto e evita cristalizar um contrato de
 * backend que ainda não existe.
 */
export type AdminService = {
  listReportGroups: (
    filters?: AdminReportFilters,
    signal?: AbortSignal
  ) => Promise<AdminPage<AdminReportGroup>>;
  listUsers: (
    filters?: AdminUserFilters,
    signal?: AbortSignal
  ) => Promise<AdminPage<AdminUserSummary>>;
};
