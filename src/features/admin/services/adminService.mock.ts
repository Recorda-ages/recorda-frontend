import type {
  AdminReportFilters,
  AdminReportGroup,
  AdminService,
  AdminUserFilters,
  AdminUserSummary
} from "../types";

const REPORT_GROUPS: readonly AdminReportGroup[] = [
  {
    contentSummary: "Erro ao postar Recorda",
    latestReportedAt: "2026-10-05T18:30:00Z",
    latestReporterUsername: "paulo",
    openReportCount: 3,
    status: "OPEN",
    targetId: "recorda-1042",
    targetLabel: "Post de @marina",
    targetType: "RECORDA",
    targetUsername: "marina"
  },
  {
    contentSummary: "Perfil denunciado",
    latestReportedAt: "2026-10-04T15:10:00Z",
    latestReporterUsername: "bia",
    openReportCount: 2,
    status: "OPEN",
    targetId: "user-1088",
    targetLabel: "@usuario2",
    targetType: "USER",
    targetUsername: "usuario2"
  },
  {
    contentSummary: "Publicação denunciada",
    latestReportedAt: "2026-09-28T12:00:00Z",
    latestReporterUsername: "carol",
    openReportCount: 0,
    status: "RESOLVED",
    targetId: "recorda-1124",
    targetLabel: "Post de @lucas",
    targetType: "RECORDA",
    targetUsername: "lucas"
  },
  {
    contentSummary: "Solicitação concluída",
    latestReportedAt: "2026-09-27T12:00:00Z",
    latestReporterUsername: "ana",
    openReportCount: 0,
    status: "DISMISSED",
    targetId: "user-1201",
    targetLabel: "@usuario1",
    targetType: "USER",
    targetUsername: "usuario1"
  }
];

const USERS: readonly AdminUserSummary[] = [
  {
    email: "marina@example.com",
    reportCount: 0,
    status: "ACTIVE",
    userId: "user-1124",
    username: "marina"
  },
  {
    email: "usuario2@example.com",
    reportCount: 4,
    status: "SUSPENDED",
    userId: "user-1088",
    username: "usuario2"
  },
  {
    email: "lucas@example.com",
    reportCount: 1,
    status: "ACTIVE",
    userId: "user-1190",
    username: "lucas"
  }
];

export const adminServiceMock: AdminService = {
  async listReportGroups(filters: AdminReportFilters = {}, signal?: AbortSignal) {
    throwIfAborted(signal);
    const query = filters.query?.trim().toLocaleLowerCase() ?? "";
    const items = REPORT_GROUPS.filter(
      (group) =>
        (filters.status === undefined || group.status === filters.status) &&
        (filters.targetType === undefined || group.targetType === filters.targetType) &&
        (query === "" ||
          group.targetUsername.toLocaleLowerCase().includes(query) ||
          group.contentSummary.toLocaleLowerCase().includes(query) ||
          group.targetLabel.toLocaleLowerCase().includes(query))
    );

    return { items: clone(items), nextCursor: null };
  },

  async listUsers(filters: AdminUserFilters = {}, signal?: AbortSignal) {
    throwIfAborted(signal);
    const query = filters.query?.trim().toLocaleLowerCase() ?? "";
    const items = USERS.filter(
      (user) =>
        (filters.status === undefined || user.status === filters.status) &&
        (query === "" ||
          user.username.toLocaleLowerCase().includes(query) ||
          user.email.toLocaleLowerCase().includes(query))
    );

    return { items: clone(items), nextCursor: null };
  }
};

function clone<TItem extends object>(items: readonly TItem[]): TItem[] {
  return items.map((item) => ({ ...item }));
}

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) {
    return;
  }

  const error = new Error("The operation was aborted.");
  error.name = "AbortError";
  throw error;
}
