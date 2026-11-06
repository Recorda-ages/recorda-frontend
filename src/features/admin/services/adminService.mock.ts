import { ApiError } from "@/services/api";

import type {
  AdminActionReason,
  AdminAuditPage,
  AdminReportDetail,
  AdminReportFilters,
  AdminReportGroup,
  AdminReportStatus,
  AdminReportStatusChange,
  AdminService,
  AdminTargetType,
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

const REPORT_DETAILS: Readonly<Record<string, AdminReportDetail>> = {
  "RECORDA:recorda-1042": {
    actions: [],
    reports: [
      {
        createdAt: "2026-10-05T18:30:00Z",
        description: "A legenda tem ofensas contra outra pessoa.",
        reportId: "report-1",
        reporterUsername: "paulo",
        resolvedAt: null,
        status: "OPEN"
      },
      {
        createdAt: "2026-10-04T09:12:00Z",
        description: null,
        reportId: "report-2",
        reporterUsername: "bia",
        resolvedAt: null,
        status: "OPEN"
      },
      {
        createdAt: "2026-10-03T21:40:00Z",
        description: "Parece spam, a mesma foto foi postada várias vezes.",
        reportId: "report-3",
        reporterUsername: "carlos",
        resolvedAt: null,
        status: "OPEN"
      }
    ],
    target: {
      recorda: {
        author: {
          avatarUrl: null,
          deletedAt: null,
          status: "ACTIVE",
          userId: "user-1124",
          username: "marina"
        },
        createdAt: "2026-10-02T22:15:00Z",
        deletedAt: null,
        description: "Um passeio depois da chuva, guardado ao som de uma música especial.",
        mediaType: "PHOTO",
        mediaUrl: "https://picsum.photos/seed/recorda-1042/720/960",
        recordaId: "recorda-1042",
        songArtist: "Dua Lipa",
        songCoverUrl:
          "https://cdn-images.dzcdn.net/images/cover/2e018122cb56986277102d2041a592c8/500x500-000000-80-0-0.jpg",
        songTitle: "Levitating"
      },
      type: "RECORDA"
    }
  },
  "USER:user-1088": {
    actions: [
      {
        actionId: "action-1",
        actionType: "SUSPEND_USER",
        adminUsername: "moderador",
        createdAt: "2026-10-04T16:00:00Z",
        reason: "Perfil usado para divulgar golpes.",
        toStatus: null
      }
    ],
    reports: [
      {
        createdAt: "2026-10-04T15:10:00Z",
        description: "Está pedindo dinheiro por mensagem.",
        reportId: "report-4",
        reporterUsername: "bia",
        resolvedAt: null,
        status: "OPEN"
      },
      {
        createdAt: "2026-10-03T11:25:00Z",
        description: null,
        reportId: "report-5",
        reporterUsername: "ana",
        resolvedAt: null,
        status: "OPEN"
      },
      {
        createdAt: "2026-10-02T08:05:00Z",
        description: "Foto de perfil imprópria.",
        reportId: "report-6",
        reporterUsername: "lucas",
        resolvedAt: null,
        status: "OPEN"
      },
      {
        createdAt: "2026-10-01T19:45:00Z",
        description: "Conta falsa se passando por um artista.",
        reportId: "report-7",
        reporterUsername: "pedro",
        resolvedAt: null,
        status: "OPEN"
      }
    ],
    target: {
      type: "USER",
      user: {
        avatarUrl: null,
        createdAt: "2025-03-14T13:00:00Z",
        deletedAt: null,
        email: "usuario2@example.com",
        isPrivate: true,
        name: "Usuário Dois",
        status: "SUSPENDED",
        userId: "user-1088",
        username: "usuario2"
      }
    }
  },
  "RECORDA:recorda-1124": {
    actions: [],
    reports: [
      {
        createdAt: "2026-10-01T20:05:00Z",
        description: "Vídeo com conteúdo violento.",
        reportId: "report-8",
        reporterUsername: "carol",
        resolvedAt: null,
        status: "OPEN"
      },
      {
        createdAt: "2026-09-30T17:30:00Z",
        description: null,
        reportId: "report-9",
        reporterUsername: "rafa",
        resolvedAt: null,
        status: "OPEN"
      }
    ],
    target: {
      recorda: {
        author: {
          avatarUrl: null,
          deletedAt: null,
          status: "ACTIVE",
          userId: "user-1190",
          username: "lucas"
        },
        createdAt: "2026-09-29T23:50:00Z",
        deletedAt: "2026-10-02T10:00:00Z",
        description: "Show inesquecível ontem.",
        mediaType: "VIDEO",
        mediaUrl: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
        recordaId: "recorda-1124",
        songArtist: "The Weeknd",
        songCoverUrl:
          "https://cdn-images.dzcdn.net/images/cover/fd00ebd6d30d7253f813dba3bb1c66a9/500x500-000000-80-0-0.jpg",
        songTitle: "Blinding Lights"
      },
      type: "RECORDA"
    }
  },
  "USER:user-1201": {
    actions: [
      {
        actionId: "action-2",
        actionType: "CHANGE_REPORT_STATUS",
        adminUsername: "admin",
        createdAt: "2026-09-28T10:00:00Z",
        reason: "Usuário removeu o conteúdo ofensivo do perfil.",
        toStatus: "RESOLVED"
      }
    ],
    reports: [
      {
        createdAt: "2026-09-27T12:00:00Z",
        description: "Bio com xingamentos.",
        reportId: "report-10",
        reporterUsername: "ana",
        resolvedAt: "2026-09-28T10:00:00Z",
        status: "RESOLVED"
      },
      {
        createdAt: "2026-09-26T18:20:00Z",
        description: null,
        reportId: "report-11",
        reporterUsername: "paulo",
        resolvedAt: "2026-09-28T10:00:00Z",
        status: "RESOLVED"
      },
      {
        createdAt: "2026-09-25T09:00:00Z",
        description: "Comentários agressivos.",
        reportId: "report-12",
        reporterUsername: "bia",
        resolvedAt: "2026-09-28T10:00:00Z",
        status: "RESOLVED"
      }
    ],
    target: {
      type: "USER",
      user: {
        avatarUrl: null,
        createdAt: "2024-11-02T15:30:00Z",
        deletedAt: null,
        email: "usuario1@example.com",
        isPrivate: false,
        name: "Usuário Um",
        status: "ACTIVE",
        userId: "user-1201",
        username: "usuario1"
      }
    }
  },
  "RECORDA:recorda-1300": {
    actions: [
      {
        actionId: "action-3",
        actionType: "CHANGE_REPORT_STATUS",
        adminUsername: "admin",
        createdAt: "2026-09-21T09:30:00Z",
        reason: "Não viola as regras da comunidade.",
        toStatus: "DISMISSED"
      }
    ],
    reports: [
      {
        createdAt: "2026-09-20T16:00:00Z",
        description: "Não gostei da música.",
        reportId: "report-13",
        reporterUsername: "pedro",
        resolvedAt: "2026-09-21T09:30:00Z",
        status: "DISMISSED"
      }
    ],
    target: {
      recorda: {
        author: {
          avatarUrl: null,
          deletedAt: null,
          status: "ACTIVE",
          userId: "user-1300",
          username: "gabriel"
        },
        createdAt: "2026-09-18T20:00:00Z",
        deletedAt: null,
        description: null,
        mediaType: "PHOTO",
        mediaUrl: "https://picsum.photos/seed/recorda-1300/720/960",
        recordaId: "recorda-1300",
        songArtist: "Coldplay",
        songCoverUrl:
          "https://cdn-images.dzcdn.net/images/cover/970dce98eeea6729244c0ae71707a83d/500x500-000000-80-0-0.jpg",
        songTitle: "Yellow"
      },
      type: "RECORDA"
    }
  }
};

const NO_REPORTS_TO_UPDATE_MESSAGE = "Não há denúncias neste status para alterar.";
const RECORDA_ALREADY_REMOVED_MESSAGE = "Esta Recorda já foi removida.";
const MOCK_ADMIN_USERNAME = "admin";

type MockState = {
  actionCount: number;
  details: Record<string, AdminReportDetail>;
  groups: AdminReportGroup[];
};

let state = createState();

export function resetAdminServiceMock() {
  state = createState();
}

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
    const items = state.groups
      .filter(
        (group) =>
          group.status === status &&
          (filters.targetType === undefined || group.targetType === filters.targetType) &&
          (query === "" ||
            group.targetUsername.toLocaleLowerCase().includes(query) ||
            group.contentSummary.toLocaleLowerCase().includes(query) ||
            group.targetLabel.toLocaleLowerCase().includes(query))
      )
      .sort(
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

  async getReportDetail(targetType: AdminTargetType, targetId: string, signal?: AbortSignal) {
    throwIfAborted(signal);
    return deepClone(findDetail(targetType, targetId));
  },

  async updateReportStatus(
    targetType: AdminTargetType,
    targetId: string,
    change: AdminReportStatusChange
  ) {
    const detail = findDetail(targetType, targetId);
    const affected = detail.reports.filter((report) =>
      change.status === "OPEN" ? report.status !== "OPEN" : report.status === "OPEN"
    );

    if (affected.length === 0) {
      throw new ApiError("CONFLICT", NO_REPORTS_TO_UPDATE_MESSAGE, 409, {
        detail: NO_REPORTS_TO_UPDATE_MESSAGE
      });
    }

    const now = new Date().toISOString();
    for (const report of affected) {
      report.status = change.status;
      report.resolvedAt = change.status === "OPEN" ? null : now;
    }
    state.actionCount += 1;
    detail.actions.unshift({
      actionId: `mock-action-${state.actionCount}`,
      actionType: "CHANGE_REPORT_STATUS",
      adminUsername: MOCK_ADMIN_USERNAME,
      createdAt: now,
      reason: change.reason,
      toStatus: change.status
    });
    syncGroup(targetType, targetId, detail, change.status);

    return { status: change.status, updatedCount: affected.length };
  },
  async removeRecorda(recordaId: string, payload: AdminActionReason) {
    const detail = findDetail("RECORDA", recordaId);
    const { target } = detail;

    if (target.type !== "RECORDA") {
      throw new ApiError("NOT_FOUND", "Recorda não encontrada.", 404, null);
    }
    if (target.recorda.deletedAt) {
      throw new ApiError("CONFLICT", RECORDA_ALREADY_REMOVED_MESSAGE, 409, null);
    }

    const now = new Date().toISOString();
    const openReports = detail.reports.filter((report) => report.status === "OPEN");
    for (const report of openReports) {
      report.status = "RESOLVED";
      report.resolvedAt = now;
    }
    target.recorda.deletedAt = now;
    state.actionCount += 1;
    detail.actions.unshift({
      actionId: `mock-action-${state.actionCount}`,
      actionType: "REMOVE_RECORDA",
      adminUsername: MOCK_ADMIN_USERNAME,
      createdAt: now,
      reason: payload.reason,
      toStatus: null
    });
    syncGroup("RECORDA", recordaId, detail, "RESOLVED");

    return { deletedAt: now, recordaId, resolvedReports: openReports.length };
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
  async listAuditLog(_filters = {}, signal?: AbortSignal): Promise<AdminAuditPage> {
    throwIfAborted(signal);
    return { items: [], total: 0 };
  }
} satisfies AdminService & {
  listUsers: (
    filters?: AdminUserFilters,
    signal?: AbortSignal
  ) => Promise<{ items: AdminUserSummary[]; nextCursor: null }>;
};

function createState(): MockState {
  return {
    actionCount: 0,
    details: deepClone(REPORT_DETAILS),
    groups: clone(REPORT_GROUPS)
  };
}

function findDetail(targetType: AdminTargetType, targetId: string) {
  const detail = state.details[`${targetType}:${targetId}`];

  if (!detail) {
    throw new ApiError("NOT_FOUND", "Nenhuma denúncia para este alvo.", 404, null);
  }

  return detail;
}

function syncGroup(
  targetType: AdminTargetType,
  targetId: string,
  detail: AdminReportDetail,
  appliedStatus: AdminReportStatus
) {
  const group = state.groups.find(
    (item) => item.targetType === targetType && item.targetId === targetId
  );

  if (!group) {
    return;
  }

  const openCount = detail.reports.filter((report) => report.status === "OPEN").length;
  group.status = openCount > 0 ? "OPEN" : appliedStatus;
  group.openReportCount =
    openCount > 0
      ? openCount
      : detail.reports.filter((report) => report.status === appliedStatus).length;
}

function deepClone<TValue>(value: TValue): TValue {
  return JSON.parse(JSON.stringify(value)) as TValue;
}

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
