import type {
  AdminIdentity,
  AdminModerationResult,
  AdminModerationService
} from "@/features/moderation/types";

import { adminUserFixtures, emptyAdminUsersFixture } from "../fixtures/adminUsers";
import type {
  AdminUserDetail,
  AdminUserReportGroup,
  AdminUserRow,
  AdminUsersFilters,
  AdminUsersPage,
  AdminUsersService
} from "../../types";

type AdminUsersMockStore = { details: Record<string, AdminUserDetail>; users: AdminUserRow[] };

function cloneStore(): AdminUsersMockStore {
  const details = Object.fromEntries(
    adminUserFixtures.map((detail) => [detail.user_id, cloneDetail(detail)])
  );

  return { details, users: adminUserFixtures.map(cloneRow) };
}

let store = cloneStore();
let nextActionId = 0;

export function resetAdminUsersMock() {
  store = cloneStore();
  nextActionId = 0;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const error = new Error("The request was aborted.");
    error.name = "AbortError";
    throw error;
  }
}

function cloneRow(user: AdminUserRow): AdminUserRow {
  return { ...user };
}

function cloneDetail(detail: AdminUserDetail): AdminUserDetail {
  return {
    ...detail,
    actions: detail.actions.map((action) => ({ ...action })),
    reports_received: detail.reports_received.map((report) => ({
      ...report,
      preview: { ...report.preview }
    }))
  };
}

function findTarget(targetUserId: string, admin: AdminIdentity) {
  if (admin.role !== "ADMIN") {
    throw new Error("Apenas administradores podem moderar contas.");
  }
  if (targetUserId === admin.user_id) {
    throw new Error("Você não pode moderar a própria conta.");
  }

  const index = store.users.findIndex((user) => user.user_id === targetUserId);
  if (index < 0) throw new Error("Usuário não encontrado.");
  const user = store.users[index];
  if (user.role === "ADMIN") throw new Error("Não é permitido moderar outro administrador.");

  return { index, user };
}

function updateStatus(
  targetUserId: string,
  admin: AdminIdentity,
  status: AdminUserRow["status"],
  actionType: "SUSPEND_USER" | "REACTIVATE_USER",
  reason: string,
  resolveOpenReports = false
): AdminModerationResult {
  const cleanReason = reason.trim();
  if (cleanReason.length < 1 || cleanReason.length > 500) {
    throw new Error("Informe um motivo de 1 a 500 caracteres.");
  }

  const { index, user } = findTarget(targetUserId, admin);
  if (user.status === status) {
    throw new Error(
      status === "SUSPENDED" ? "A conta já está suspensa." : "A conta já está ativa."
    );
  }

  const updatedUser = { ...user, status };
  const detail = store.details[targetUserId];
  const reportsReceived: AdminUserReportGroup[] = detail.reports_received.map((report) =>
    resolveOpenReports && report.target_type === "USER" && report.status === "OPEN"
      ? { ...report, status: "RESOLVED" }
      : report
  );
  const action = {
    action_id: `action-${Date.now()}-${++nextActionId}`,
    action_type: actionType,
    admin_id: admin.user_id,
    admin_username: admin.username,
    created_at: new Date().toISOString(),
    details: null,
    reason: cleanReason,
    target_recorda_id: null,
    target_user_id: targetUserId
  };
  const updatedDetail: AdminUserDetail = {
    ...detail,
    ...updatedUser,
    actions: [...detail.actions, action],
    reports_received: reportsReceived
  };

  store = {
    details: { ...store.details, [targetUserId]: updatedDetail },
    users: store.users.map((current, currentIndex) =>
      currentIndex === index ? updatedUser : current
    )
  };

  return { detail: cloneDetail(updatedDetail), user: cloneRow(updatedUser) };
}

async function listUsers(
  filters: AdminUsersFilters,
  signal?: AbortSignal
): Promise<AdminUsersPage> {
  throwIfAborted(signal);
  const query = filters.q?.trim().toLocaleLowerCase();
  const matching = store.users.filter((user) => {
    const matchesQuery =
      !query ||
      user.username.toLocaleLowerCase().includes(query) ||
      user.name.toLocaleLowerCase().includes(query) ||
      user.email.toLocaleLowerCase().includes(query);
    const matchesStatus = !filters.status || user.status === filters.status;
    return matchesQuery && matchesStatus;
  });
  if (matching.length === 0) return { ...emptyAdminUsersFixture };
  const items = matching.slice(filters.offset, filters.offset + filters.limit).map(cloneRow);

  return { items, total: matching.length };
}

async function getUserDetail(userId: string, signal?: AbortSignal): Promise<AdminUserDetail> {
  throwIfAborted(signal);
  const detail = store.details[userId];
  if (!detail) throw new Error("Usuário não encontrado.");
  return cloneDetail(detail);
}

export const adminUsersServiceMock = {
  getUserDetail,
  listUsers,
  reactivateUser(
    targetUserId: string,
    admin: AdminIdentity,
    payload: { reason: string }
  ): Promise<AdminModerationResult> {
    return Promise.resolve().then(() =>
      updateStatus(targetUserId, admin, "ACTIVE", "REACTIVATE_USER", payload.reason)
    );
  },
  suspendUser(
    targetUserId: string,
    admin: AdminIdentity,
    payload: { reason: string; resolve_open_reports?: boolean }
  ): Promise<AdminModerationResult> {
    return Promise.resolve().then(() =>
      updateStatus(
        targetUserId,
        admin,
        "SUSPENDED",
        "SUSPEND_USER",
        payload.reason,
        payload.resolve_open_reports ?? true
      )
    );
  }
} satisfies AdminUsersService & AdminModerationService;
