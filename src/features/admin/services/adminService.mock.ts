import type {
  AdminReportFilters,
  AdminReportGroup,
  AdminService,
  AdminUserFilters,
  AdminUserSummary
} from "../types";

const REPORT_GROUPS: readonly AdminReportGroup[] = [
  {
    contentSummary: "Levitating",
    imageUrl:
      "https://cdn-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500-000000-80-0-0.jpg",
    latestReportedAt: "2026-10-05T18:30:00Z",
    latestReporterUsername: "paulo",
    openReportCount: 3,
    status: "OPEN",
    targetId: "recorda-1042",
    targetLabel: "Levitating",
    targetType: "RECORDA",
    targetUsername: "marina"
  },
  {
    contentSummary: "Usuário Dois",
    imageUrl: null,
    latestReportedAt: "2026-10-04T15:10:00Z",
    latestReporterUsername: "bia",
    openReportCount: 4,
    status: "OPEN",
    targetId: "user-1088",
    targetLabel: "Usuário Dois",
    targetType: "USER",
    targetUsername: "usuario2"
  },
  {
    contentSummary: "Blinding Lights",
    imageUrl:
      "https://cdn-images.dzcdn.net/images/cover/fd00ebd6d30d7253f813dba3bb1c66a9/500x500-000000-80-0-0.jpg",
    latestReportedAt: "2026-10-01T20:05:00Z",
    latestReporterUsername: "carol",
    openReportCount: 2,
    status: "OPEN",
    targetId: "recorda-1124",
    targetLabel: "Blinding Lights",
    targetType: "RECORDA",
    targetUsername: "lucas"
  },
  {
    contentSummary: "Usuário Um",
    imageUrl: null,
    latestReportedAt: "2026-09-27T12:00:00Z",
    latestReporterUsername: "ana",
    openReportCount: 3,
    status: "RESOLVED",
    targetId: "user-1201",
    targetLabel: "Usuário Um",
    targetType: "USER",
    targetUsername: "usuario1"
  },
  {
    contentSummary: "Yellow",
    imageUrl:
      "https://cdn-images.dzcdn.net/images/cover/970dce98eeea6729244c0ae71707a83d/500x500-000000-80-0-0.jpg",
    latestReportedAt: "2026-09-20T16:00:00Z",
    latestReporterUsername: "pedro",
    openReportCount: 1,
    status: "DISMISSED",
    targetId: "recorda-1300",
    targetLabel: "Yellow",
    targetType: "RECORDA",
    targetUsername: "gabriel"
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

export const adminServiceMock = {
  supportsReportSearch: true,
  async listReportGroups(filters: AdminReportFilters = {}, signal?: AbortSignal) {
    throwIfAborted(signal);
    const query = filters.query?.trim().toLocaleLowerCase() ?? "";
    const status = filters.status ?? "OPEN";
    const direction = filters.order === "asc" ? 1 : -1;
    const items = REPORT_GROUPS.filter(
      (group) =>
        group.status === status &&
        (filters.targetType === undefined || group.targetType === filters.targetType) &&
        (query === "" ||
          group.targetUsername.toLocaleLowerCase().includes(query) ||
          group.contentSummary.toLocaleLowerCase().includes(query) ||
          group.targetLabel.toLocaleLowerCase().includes(query))
    ).sort(
      (a, b) =>
        direction *
        (a.latestReportedAt.localeCompare(b.latestReportedAt) ||
          a.targetId.localeCompare(b.targetId))
    );

    const offset = Number(filters.cursor ?? 0);
    const limit = filters.limit ?? 20;
    return {
      items: clone(items.slice(offset, offset + limit)),
      nextCursor: offset + limit < items.length ? String(offset + limit) : null,
      total: items.length
    };
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
  },
  async listAdmins(signal?: AbortSignal) {
    throwIfAborted(signal);
    return [{ user_id: "admin-1", username: "admin" }];
  },
  async listAuditLog(_filters = {}, signal?: AbortSignal) {
    throwIfAborted(signal);
    return { items: [], total: 0 };
  }
} satisfies AdminService & {
  listUsers: (
    filters?: AdminUserFilters,
    signal?: AbortSignal
  ) => Promise<{ items: AdminUserSummary[]; nextCursor: null }>;
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
