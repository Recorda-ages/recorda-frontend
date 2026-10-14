import {
  AdminIdentity,
  AdminModerationActionResult,
  AdminUserDetail,
  AdminUserRow,
  ReactivateUserRequest,
  ReportStatus,
  SuspendUserRequest,
  UserModerationActionItem
} from "../types";

export class AdminModerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminModerationError";
  }
}

type ModerationStore = {
  details: Record<string, AdminUserDetail>;
  users: AdminUserRow[];
};

const initialUsers: AdminUserRow[] = [
  {
    email: "user1@recorda.app",
    name: "User Normal",
    profile_picture_url: null,
    reports_count: 2,
    role: "USER",
    status: "ACTIVE",
    user_id: "user-1",
    username: "usernormal"
  },
  {
    email: "user2@recorda.app",
    name: "User Suspenso",
    profile_picture_url: null,
    reports_count: 0,
    role: "USER",
    status: "SUSPENDED",
    user_id: "user-2",
    username: "usersuspenso"
  },
  {
    email: "admin2@recorda.app",
    name: "Outro Admin",
    profile_picture_url: null,
    reports_count: 0,
    role: "ADMIN",
    status: "ACTIVE",
    user_id: "admin-2",
    username: "outroadmin"
  },
  {
    email: "admin3@recorda.app",
    name: "Admin Suspenso",
    profile_picture_url: null,
    reports_count: 0,
    role: "ADMIN",
    status: "SUSPENDED",
    user_id: "admin-3",
    username: "adminsuspenso"
  }
];

const initialDetails: Record<string, AdminUserDetail> = {
  "user-1": {
    actions: [],
    created_at: "2026-01-01T00:00:00.000Z",
    email: "user1@recorda.app",
    name: "User Normal",
    profile_picture_url: null,
    reports_count: 2,
    reports_received: [
      {
        created_at: "2026-02-01T00:00:00.000Z",
        id: "rep-1",
        reason: "Spam em comentários",
        status: "OPEN",
        target_id: "user-1",
        target_type: "USER"
      },
      {
        created_at: "2026-02-02T00:00:00.000Z",
        id: "rep-2",
        reason: "Foto inadequada",
        status: "OPEN",
        target_id: "rec-1",
        target_type: "RECORDA"
      }
    ],
    role: "USER",
    status: "ACTIVE",
    user_id: "user-1",
    username: "usernormal"
  },
  "user-2": {
    actions: [],
    created_at: "2026-01-05T00:00:00.000Z",
    email: "user2@recorda.app",
    name: "User Suspenso",
    profile_picture_url: null,
    reports_count: 0,
    reports_received: [],
    role: "USER",
    status: "SUSPENDED",
    user_id: "user-2",
    username: "usersuspenso"
  }
};

let store: ModerationStore = {
  details: JSON.parse(JSON.stringify(initialDetails)),
  users: JSON.parse(JSON.stringify(initialUsers))
};

export const resetModerationMockStore = () => {
  store = {
    details: JSON.parse(JSON.stringify(initialDetails)),
    users: JSON.parse(JSON.stringify(initialUsers))
  };
};

export const getModerationMockStore = () => store;

const validateModerationRules = (
  targetUserId: string,
  admin: AdminIdentity,
  reason: string,
  isSuspend: boolean
): { targetIndex: number; targetUser: AdminUserRow } => {
  if (admin.user_id === targetUserId) {
    throw new AdminModerationError(
      isSuspend
        ? "Você não pode suspender a própria conta."
        : "Você não pode reativar a própria conta."
    );
  }

  const trimmedReason = reason.trim();
  if (!trimmedReason || trimmedReason.length > 500) {
    throw new AdminModerationError("Motivo deve ter entre 1 e 500 caracteres.");
  }

  const targetIndex = store.users.findIndex((u) => u.user_id === targetUserId);
  if (targetIndex === -1) {
    throw new AdminModerationError("Usuário não encontrado.");
  }

  const targetUser = store.users[targetIndex];
  if (isSuspend && targetUser.role === "ADMIN") {
    throw new AdminModerationError("Não é permitido suspender outro administrador.");
  }

  return { targetIndex, targetUser };
};

export const adminModerationMockService = {
  async suspendUser(
    userId: string,
    admin: AdminIdentity,
    payload: SuspendUserRequest
  ): Promise<AdminModerationActionResult> {
    const { targetIndex, targetUser } = validateModerationRules(
      userId,
      admin,
      payload.reason,
      true
    );

    const updatedUser: AdminUserRow = { ...targetUser, status: "SUSPENDED" };
    store.users[targetIndex] = updatedUser;

    const actionItem: UserModerationActionItem = {
      action_type: "SUSPEND",
      admin_id: admin.user_id,
      admin_username: admin.username,
      created_at: new Date().toISOString(),
      id: `act-${Date.now()}`,
      reason: payload.reason.trim(),
      resolved_reports_count: payload.resolve_open_reports ? 1 : 0
    };

    let detail = store.details[userId];
    if (detail) {
      const updatedReports = payload.resolve_open_reports
        ? detail.reports_received.map((rep) =>
            rep.target_type === "USER" && rep.status === "OPEN"
              ? { ...rep, status: "RESOLVED" as ReportStatus }
              : rep
          )
        : detail.reports_received;

      detail = {
        ...detail,
        actions: [actionItem, ...detail.actions],
        reports_received: updatedReports,
        status: "SUSPENDED"
      };
      store.details[userId] = detail;
    }

    return { detail, user: updatedUser };
  },

  async reactivateUser(
    userId: string,
    admin: AdminIdentity,
    payload: ReactivateUserRequest
  ): Promise<AdminModerationActionResult> {
    const { targetIndex, targetUser } = validateModerationRules(
      userId,
      admin,
      payload.reason,
      false
    );

    const updatedUser: AdminUserRow = { ...targetUser, status: "ACTIVE" };
    store.users[targetIndex] = updatedUser;

    const actionItem: UserModerationActionItem = {
      action_type: "REACTIVATE",
      admin_id: admin.user_id,
      admin_username: admin.username,
      created_at: new Date().toISOString(),
      id: `act-${Date.now()}`,
      reason: payload.reason.trim(),
      resolved_reports_count: 0
    };

    let detail = store.details[userId];
    if (detail) {
      detail = {
        ...detail,
        actions: [actionItem, ...detail.actions],
        status: "ACTIVE"
      };
      store.details[userId] = detail;
    }

    return { detail, user: updatedUser };
  }
};
