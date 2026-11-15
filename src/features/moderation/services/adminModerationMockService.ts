import {
  AdminUserAction,
  AdminIdentity,
  AdminModerationResult,
  AdminModerationService,
  AdminUserDetail,
  AdminUserRow,
  ReactivateUserRequest,
  SuspendUserRequest
} from "../types";

export type MockModerationStore = {
  details: Record<string, AdminUserDetail>;
  users: AdminUserRow[];
};

export const initialMockUsers: AdminUserRow[] = [
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
    reports_count: 1,
    role: "USER",
    status: "SUSPENDED",
    user_id: "user-2",
    username: "usersuspenso"
  },
  {
    email: "admin2@recorda.app",
    name: "Outro Admin Ativo",
    profile_picture_url: null,
    reports_count: 0,
    role: "ADMIN",
    status: "ACTIVE",
    user_id: "admin-2",
    username: "outroadmin"
  },
  {
    email: "admin3@recorda.app",
    name: "Outro Admin Suspenso",
    profile_picture_url: null,
    reports_count: 0,
    role: "ADMIN",
    status: "SUSPENDED",
    user_id: "admin-3",
    username: "adminsuspenso"
  }
];

export const initialMockDetails: Record<string, AdminUserDetail> = {
  "user-1": {
    ...initialMockUsers[0],
    actions: [],
    created_at: new Date().toISOString(),
    is_private: false,
    recordas_count: 5,
    reports_received: [
      {
        first_reported_at: new Date().toISOString(),
        last_reported_at: new Date().toISOString(),
        report_count: 2,
        status: "OPEN",
        target_id: "user-1",
        target_type: "USER"
      },
      {
        first_reported_at: new Date().toISOString(),
        last_reported_at: new Date().toISOString(),
        report_count: 1,
        status: "OPEN",
        target_id: "rec-1",
        target_type: "RECORDA"
      }
    ]
  },
  "user-2": {
    ...initialMockUsers[1],
    actions: [],
    created_at: new Date().toISOString(),
    is_private: false,
    recordas_count: 2,
    reports_received: []
  },
  "admin-2": {
    ...initialMockUsers[2],
    actions: [],
    created_at: new Date().toISOString(),
    is_private: false,
    recordas_count: 0,
    reports_received: []
  },
  "admin-3": {
    ...initialMockUsers[3],
    actions: [],
    created_at: new Date().toISOString(),
    is_private: false,
    recordas_count: 0,
    reports_received: []
  }
};

function createMockStore(): MockModerationStore {
  return {
    details: Object.fromEntries(
      Object.entries(initialMockDetails).map(([id, detail]) => [
        id,
        {
          ...detail,
          actions: detail.actions.map((action) => ({ ...action })),
          reports_received: detail.reports_received.map((report) => ({ ...report }))
        }
      ])
    ),
    users: initialMockUsers.map((user) => ({ ...user }))
  };
}

let mockStore = createMockStore();
let nextActionId = 0;

export const resetModerationMockStore = () => {
  mockStore = createMockStore();
  nextActionId = 0;
};

export const getModerationMockStore = (): MockModerationStore => mockStore;

export class AdminModerationError extends Error {
  constructor(
    public code: string,
    message: string
  ) {
    super(message);
    this.name = "AdminModerationError";
  }
}

function validateReason(reason: string): string {
  const cleanReason = reason.trim();
  if (cleanReason.length < 1 || cleanReason.length > 500) {
    throw new AdminModerationError("INVALID_REASON", "Motivo deve ter entre 1 e 500 caracteres.");
  }
  return cleanReason;
}

function findTargetUser(
  targetUserId: string,
  admin: AdminIdentity,
  actionType: "SUSPEND" | "REACTIVATE"
) {
  if (admin.role !== "ADMIN") {
    throw new AdminModerationError("FORBIDDEN", "Apenas administradores podem moderar contas.");
  }
  if (targetUserId === admin.user_id) {
    const action = actionType === "SUSPEND" ? "suspender" : "reativar";
    throw new AdminModerationError(
      "SELF_ACTION_NOT_ALLOWED",
      `Você não pode ${action} a própria conta.`
    );
  }

  const index = mockStore.users.findIndex((user) => user.user_id === targetUserId);
  if (index === -1) {
    throw new AdminModerationError("NOT_FOUND", "Usuário não encontrado.");
  }
  return { index, user: mockStore.users[index] };
}

function updateUser(
  index: number,
  status: AdminUserRow["status"],
  actionType: "SUSPEND" | "REACTIVATE",
  admin: AdminIdentity,
  reason: string,
  reports?: AdminUserDetail["reports_received"]
): AdminModerationResult {
  const user = { ...mockStore.users[index], status };
  const currentDetail = mockStore.details[user.user_id];
  const action: AdminUserAction = {
    action_id: `act-${Date.now()}-${++nextActionId}`,
    action_type: actionType,
    admin_id: admin.user_id,
    admin_username: admin.username,
    created_at: new Date().toISOString(),
    reason,
    target_user_id: user.user_id
  };
  const detail = currentDetail
    ? {
        ...currentDetail,
        status,
        reports_received: reports ?? currentDetail.reports_received,
        actions: [...currentDetail.actions, action]
      }
    : undefined;

  mockStore = {
    users: mockStore.users.map((item, itemIndex) => (itemIndex === index ? user : item)),
    details: detail ? { ...mockStore.details, [user.user_id]: detail } : mockStore.details
  };
  return { user, detail };
}

function runMockMutation(operation: () => ReturnType<typeof updateUser>) {
  return Promise.resolve().then(operation);
}

export const adminModerationMockService = {
  suspendUser(
    targetUserId: string,
    admin: AdminIdentity,
    payload: SuspendUserRequest
  ): Promise<AdminModerationResult> {
    return runMockMutation(() => {
      const reason = validateReason(payload.reason);
      const { index, user } = findTargetUser(targetUserId, admin, "SUSPEND");
      if (user.role === "ADMIN") {
        throw new AdminModerationError(
          "ADMIN_ACTION_NOT_ALLOWED",
          "Não é permitido suspender outro administrador."
        );
      }
      if (user.status === "SUSPENDED") {
        throw new AdminModerationError("CONFLICT", "A conta já se encontra suspensa.");
      }

      const reports = mockStore.details[targetUserId]?.reports_received.map((report) =>
        (payload.resolve_open_reports ?? true) &&
        report.target_type === "USER" &&
        report.status === "OPEN"
          ? { ...report, status: "RESOLVED" as const }
          : report
      );
      return updateUser(index, "SUSPENDED", "SUSPEND", admin, reason, reports);
    });
  },

  reactivateUser(
    targetUserId: string,
    admin: AdminIdentity,
    payload: ReactivateUserRequest
  ): Promise<AdminModerationResult> {
    return runMockMutation(() => {
      const reason = validateReason(payload.reason);
      const { index, user } = findTargetUser(targetUserId, admin, "REACTIVATE");
      if (user.status === "ACTIVE") {
        throw new AdminModerationError("CONFLICT", "A conta já se encontra ativa.");
      }
      return updateUser(index, "ACTIVE", "REACTIVATE", admin, reason);
    });
  }
} satisfies AdminModerationService;
