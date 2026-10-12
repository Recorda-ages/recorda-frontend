import {
  AdminIdentity,
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

let mockStore: MockModerationStore = {
  details: { ...initialMockDetails },
  users: [...initialMockUsers]
};

export const resetModerationMockStore = () => {
  mockStore = {
    details: JSON.parse(JSON.stringify(initialMockDetails)),
    users: JSON.parse(JSON.stringify(initialMockUsers))
  };
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

export const adminModerationMockService = {
  async suspendUser(
    targetUserId: string,
    admin: AdminIdentity,
    payload: SuspendUserRequest
  ): Promise<{ detail?: AdminUserDetail; user: AdminUserRow }> {
    const cleanReason = payload.reason.trim();
    if (!cleanReason || cleanReason.length < 1 || cleanReason.length > 500) {
      throw new AdminModerationError("INVALID_REASON", "Motivo deve ter entre 1 e 500 caracteres.");
    }

    if (targetUserId === admin.user_id) {
      throw new AdminModerationError(
        "SELF_ACTION_NOT_ALLOWED",
        "Você não pode suspender a própria conta."
      );
    }

    const userIndex = mockStore.users.findIndex((u) => u.user_id === targetUserId);
    if (userIndex === -1) {
      throw new AdminModerationError("NOT_FOUND", "Usuário não encontrado.");
    }

    const targetUser = mockStore.users[userIndex];

    if (targetUser.role === "ADMIN") {
      throw new AdminModerationError(
        "ADMIN_ACTION_NOT_ALLOWED",
        "Não é permitido suspender outro administrador."
      );
    }

    if (targetUser.status === "SUSPENDED") {
      throw new AdminModerationError("CONFLICT", "A conta já se encontra suspensa.");
    }

    const updatedUser: AdminUserRow = { ...targetUser, status: "SUSPENDED" };
    mockStore.users[userIndex] = updatedUser;

    let updatedDetail: AdminUserDetail | undefined;
    if (mockStore.details[targetUserId]) {
      const currentDetail = mockStore.details[targetUserId];
      const resolveReports = payload.resolve_open_reports ?? true;
      const updatedReports = currentDetail.reports_received.map((rep) => {
        if (resolveReports && rep.target_type === "USER" && rep.status === "OPEN") {
          return { ...rep, status: "RESOLVED" as const };
        }
        return rep;
      });

      updatedDetail = {
        ...currentDetail,
        status: "SUSPENDED",
        reports_received: updatedReports,
        actions: [
          ...currentDetail.actions,
          {
            action_id: `act-${Date.now()}`,
            action_type: "SUSPEND",
            admin_id: admin.user_id,
            admin_username: admin.username,
            created_at: new Date().toISOString(),
            reason: cleanReason,
            target_user_id: targetUserId
          }
        ]
      };
      mockStore.details[targetUserId] = updatedDetail;
    }

    return { user: updatedUser, detail: updatedDetail };
  },

  async reactivateUser(
    targetUserId: string,
    admin: AdminIdentity,
    payload: ReactivateUserRequest
  ): Promise<{ detail?: AdminUserDetail; user: AdminUserRow }> {
    const cleanReason = payload.reason.trim();
    if (!cleanReason || cleanReason.length < 1 || cleanReason.length > 500) {
      throw new AdminModerationError("INVALID_REASON", "Motivo deve ter entre 1 e 500 caracteres.");
    }

    if (targetUserId === admin.user_id) {
      throw new AdminModerationError(
        "SELF_ACTION_NOT_ALLOWED",
        "Você não pode reativar a própria conta."
      );
    }

    const userIndex = mockStore.users.findIndex((u) => u.user_id === targetUserId);
    if (userIndex === -1) {
      throw new AdminModerationError("NOT_FOUND", "Usuário não encontrado.");
    }

    const targetUser = mockStore.users[userIndex];

    if (targetUser.status === "ACTIVE") {
      throw new AdminModerationError("CONFLICT", "A conta já se encontra ativa.");
    }

    const updatedUser: AdminUserRow = { ...targetUser, status: "ACTIVE" };
    mockStore.users[userIndex] = updatedUser;

    let updatedDetail: AdminUserDetail | undefined;
    if (mockStore.details[targetUserId]) {
      const currentDetail = mockStore.details[targetUserId];
      updatedDetail = {
        ...currentDetail,
        status: "ACTIVE",
        actions: [
          ...currentDetail.actions,
          {
            action_id: `act-${Date.now()}`,
            action_type: "REACTIVATE",
            admin_id: admin.user_id,
            admin_username: admin.username,
            created_at: new Date().toISOString(),
            reason: cleanReason,
            target_user_id: targetUserId
          }
        ]
      };
      mockStore.details[targetUserId] = updatedDetail;
    }

    return { user: updatedUser, detail: updatedDetail };
  }
};
