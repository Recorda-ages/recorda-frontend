import type { AdminUserDetail, AdminUserRow, AdminUsersPage } from "../../types";

const users: AdminUserRow[] = [
  {
    deleted_at: null,
    email: "usuario1@email.com",
    name: "Usuário Um",
    profile_picture_url: null,
    reports_count: 2,
    role: "USER",
    status: "ACTIVE",
    user_id: "00000000-0000-4000-8000-000000001042",
    username: "usuario1"
  },
  {
    deleted_at: null,
    email: "usuario2@email.com",
    name: "Usuário Dois",
    profile_picture_url: null,
    reports_count: 4,
    role: "USER",
    status: "SUSPENDED",
    user_id: "00000000-0000-4000-8000-000000001088",
    username: "usuario2"
  },
  {
    deleted_at: null,
    email: "marina@email.com",
    name: "Marina Silva",
    profile_picture_url: null,
    reports_count: 0,
    role: "USER",
    status: "ACTIVE",
    user_id: "00000000-0000-4000-8000-000000001124",
    username: "marina"
  },
  {
    deleted_at: null,
    email: "lucas@email.com",
    name: "Lucas Costa",
    profile_picture_url: null,
    reports_count: 1,
    role: "USER",
    status: "ACTIVE",
    user_id: "00000000-0000-4000-8000-000000001190",
    username: "lucas"
  },
  {
    deleted_at: null,
    email: "admin@email.com",
    name: "Admin Recorda",
    profile_picture_url: null,
    reports_count: 0,
    role: "ADMIN",
    status: "ACTIVE",
    user_id: "00000000-0000-4000-8000-000000001201",
    username: "admin"
  },
  {
    deleted_at: null,
    email: "gabriel@email.com",
    name: "Gabriel Lima",
    profile_picture_url: null,
    reports_count: 3,
    role: "USER",
    status: "ACTIVE",
    user_id: "00000000-0000-4000-8000-000000001233",
    username: "gabriel"
  }
];

const action = {
  action_id: "action-1042-1",
  action_type: "SUSPEND_USER",
  admin_id: "00000000-0000-4000-8000-000000001201",
  admin_username: "admin",
  created_at: "2026-10-19T13:00:00.000Z",
  details: { reports_resolved: 4 },
  reason: "Perfil usado para divulgar golpes.",
  target_recorda_id: null,
  target_user_id: users[1].user_id
};

const report = {
  first_reported_at: "2026-10-18T09:00:00.000Z",
  last_reported_at: "2026-10-19T12:30:00.000Z",
  preview: {
    image_url: null,
    subtitle: "Conta falsa se passando por um artista.",
    title: "Perfil denunciado"
  },
  report_count: 2,
  status: "OPEN" as const,
  target_id: users[1].user_id,
  target_type: "USER" as const
};

const recordaReport = {
  first_reported_at: "2026-10-17T10:00:00.000Z",
  last_reported_at: "2026-10-18T15:00:00.000Z",
  preview: {
    image_url: "https://picsum.photos/seed/recorda-preview/120/120",
    subtitle: "Dua Lipa • Levitating",
    title: "Recorda denunciada"
  },
  report_count: 2,
  status: "OPEN" as const,
  target_id: "00000000-0000-4000-8000-000000008042",
  target_type: "RECORDA" as const
};

export const adminUserFixtures: AdminUserDetail[] = users.map((user, index) => ({
  ...user,
  actions: index === 1 ? [{ ...action }] : [],
  created_at: `202${index + 1}-01-15T12:00:00.000Z`,
  is_private: index === 2,
  recordas_count: [12, 5, 8, 14, 0, 3][index],
  reports_received:
    index === 1
      ? [
          { ...report, preview: { ...report.preview } },
          { ...recordaReport, preview: { ...recordaReport.preview } }
        ]
      : []
}));

export const adminUserRows: AdminUserRow[] = adminUserFixtures.map(({ actions, ...user }) => user);

export const emptyAdminUsersFixture: AdminUsersPage = { items: [], total: 0 };
