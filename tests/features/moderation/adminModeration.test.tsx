import React from "react";
import { act, render, fireEvent, waitFor } from "@testing-library/react-native";
import {
  AdminUserActions,
  UserModerationForm,
  adminModerationMockService,
  resetModerationMockStore,
  getModerationMockStore,
  AdminIdentity,
  AdminModerationService,
  AdminUserRow
} from "@/features/moderation";

const currentAdmin: AdminIdentity = {
  role: "ADMIN",
  user_id: "admin-1",
  username: "adminmaster"
};

const activeUser: AdminUserRow = {
  email: "user1@recorda.app",
  name: "User Normal",
  profile_picture_url: null,
  reports_count: 2,
  role: "USER",
  status: "ACTIVE",
  user_id: "user-1",
  username: "usernormal"
};

const suspendedUser: AdminUserRow = {
  email: "user2@recorda.app",
  name: "User Suspenso",
  profile_picture_url: null,
  reports_count: 0,
  role: "USER",
  status: "SUSPENDED",
  user_id: "user-2",
  username: "usersuspenso"
};

const activeAdmin: AdminUserRow = {
  email: "admin2@recorda.app",
  name: "Outro Admin",
  profile_picture_url: null,
  reports_count: 0,
  role: "ADMIN",
  status: "ACTIVE",
  user_id: "admin-2",
  username: "outroadmin"
};

const suspendedAdmin: AdminUserRow = {
  email: "admin3@recorda.app",
  name: "Admin Suspenso",
  profile_picture_url: null,
  reports_count: 0,
  role: "ADMIN",
  status: "SUSPENDED",
  user_id: "admin-3",
  username: "adminsuspenso"
};

describe("US 46 - Moderação de Usuários (Mock Service & UI)", () => {
  beforeEach(() => {
    resetModerationMockStore();
  });

  afterEach(() => jest.restoreAllMocks());

  describe("adminModerationMockService", () => {
    it("suspende usuário comum e resolve denúncias abertas de perfil quando resolve_open_reports=true", async () => {
      const result = await adminModerationMockService.suspendUser("user-1", currentAdmin, {
        reason: "Comportamento abusivo",
        resolve_open_reports: true
      });

      expect(result.user.status).toBe("SUSPENDED");
      expect(result.detail?.status).toBe("SUSPENDED");

      const userReport = result.detail?.reports_received.find((r) => r.target_type === "USER");
      const recordaReport = result.detail?.reports_received.find(
        (r) => r.target_type === "RECORDA"
      );

      expect(userReport?.status).toBe("RESOLVED");
      expect(recordaReport?.status).toBe("OPEN");
    });

    it("suspende preservando denúncias abertas se resolve_open_reports=false", async () => {
      const result = await adminModerationMockService.suspendUser("user-1", currentAdmin, {
        reason: "Suspensão temporária",
        resolve_open_reports: false
      });

      expect(result.user.status).toBe("SUSPENDED");
      const userReport = result.detail?.reports_received.find((r) => r.target_type === "USER");
      expect(userReport?.status).toBe("OPEN");
    });

    it("publica um novo snapshot da lista e do detalhe após sucesso", async () => {
      const before = getModerationMockStore();
      const previousUser = before.users.find((user) => user.user_id === "user-1");
      const previousDetail = before.details["user-1"];

      await adminModerationMockService.suspendUser("user-1", currentAdmin, {
        reason: "Comportamento abusivo"
      });

      const after = getModerationMockStore();
      expect(after).not.toBe(before);
      expect(after.users).not.toBe(before.users);
      expect(after.details).not.toBe(before.details);
      expect(after.users.find((user) => user.user_id === "user-1")?.status).toBe("SUSPENDED");
      expect(after.details["user-1"].status).toBe("SUSPENDED");
      expect(previousUser?.status).toBe("ACTIVE");
      expect(previousDetail.status).toBe("ACTIVE");
    });

    it("reativa conta com sucesso mantendo histórico", async () => {
      const result = await adminModerationMockService.reactivateUser("user-2", currentAdmin, {
        reason: "Recurso aceito"
      });

      expect(result.user.status).toBe("ACTIVE");
      expect(result.detail?.status).toBe("ACTIVE");
      expect(result.detail?.actions).toHaveLength(1);
      expect(result.detail?.actions[0].action_type).toBe("REACTIVATE");
    });

    it("impede auto-suspensão ou auto-reativação", async () => {
      await expect(
        adminModerationMockService.suspendUser("admin-1", currentAdmin, { reason: "Teste" })
      ).rejects.toThrow("Você não pode suspender a própria conta.");
    });

    it("impede suspender outro administrador", async () => {
      await expect(
        adminModerationMockService.suspendUser("admin-2", currentAdmin, { reason: "Teste" })
      ).rejects.toThrow("Não é permitido suspender outro administrador.");
    });

    it("impede uma identidade comum de executar mutações", async () => {
      const commonIdentity: AdminIdentity = { ...currentAdmin, role: "USER" };

      await expect(
        adminModerationMockService.suspendUser("user-1", commonIdentity, { reason: "Teste" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        adminModerationMockService.reactivateUser("user-2", commonIdentity, { reason: "Teste" })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(getModerationMockStore().users.find((user) => user.user_id === "user-1")?.status).toBe(
        "ACTIVE"
      );
    });

    it("mantém a lista e o detalhe intactos em conflito", async () => {
      await adminModerationMockService.suspendUser("user-1", currentAdmin, { reason: "Primeira" });
      const before = getModerationMockStore();
      const user = before.users.find((item) => item.user_id === "user-1");
      const detail = before.details["user-1"];

      await expect(
        adminModerationMockService.suspendUser("user-1", currentAdmin, { reason: "Segunda" })
      ).rejects.toMatchObject({ code: "CONFLICT" });
      expect(getModerationMockStore().users.find((item) => item.user_id === "user-1")).toBe(user);
      expect(getModerationMockStore().details["user-1"]).toBe(detail);
    });

    it("preserva denúncias, histórico e deleted_at ao reativar", async () => {
      const store = getModerationMockStore();
      store.details["user-2"].deleted_at = "2026-10-01T12:00:00Z";
      const reports = store.details["user-2"].reports_received;

      const result = await adminModerationMockService.reactivateUser("user-2", currentAdmin, {
        reason: "  Recurso aceito  "
      });

      expect(result.detail?.deleted_at).toBe("2026-10-01T12:00:00Z");
      expect(result.detail?.reports_received).toBe(reports);
      expect(result.detail?.actions[0]).toMatchObject({ reason: "Recurso aceito" });
    });

    it("valida comprimento e espaços no motivo", async () => {
      await expect(
        adminModerationMockService.suspendUser("user-1", currentAdmin, { reason: "   " })
      ).rejects.toThrow("Motivo deve ter entre 1 e 500 caracteres.");
    });
  });

  describe("UserModerationForm Component", () => {
    it("desabilita botão de confirmação se motivo for vazio ou apenas espaços", () => {
      const mockSubmit = jest.fn();
      const { getByTestId } = render(
        <UserModerationForm
          action="SUSPEND"
          targetUser={activeUser}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
        />
      );

      const submitButton = getByTestId("moderation-submit-button");
      fireEvent.press(submitButton);
      expect(mockSubmit).not.toHaveBeenCalled();

      const input = getByTestId("moderation-reason-input");
      fireEvent.changeText(input, "     ");
      fireEvent.press(submitButton);
      expect(mockSubmit).not.toHaveBeenCalled();
    });

    it("permite envio com motivo válido e checkbox marcado na suspensão", () => {
      const mockSubmit = jest.fn();
      const { getByTestId } = render(
        <UserModerationForm
          action="SUSPEND"
          targetUser={activeUser}
          onSubmit={mockSubmit}
          onCancel={jest.fn()}
        />
      );

      fireEvent.changeText(getByTestId("moderation-reason-input"), "Motivo da punição");
      fireEvent.press(getByTestId("moderation-submit-button"));

      expect(mockSubmit).toHaveBeenCalledWith({
        reason: "Motivo da punição",
        resolve_open_reports: true
      });
    });

    it("não exibe checkbox de resolver denúncias na reativação", () => {
      const { queryByTestId } = render(
        <UserModerationForm
          action="REACTIVATE"
          targetUser={suspendedUser}
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(queryByTestId("resolve-reports-toggle")).toBeNull();
    });

    it("exibe mensagem de erro e preserva motivo digitado em falha", () => {
      const { getByText } = render(
        <UserModerationForm
          action="SUSPEND"
          targetUser={activeUser}
          errorMessage="Erro simulado de teste"
          onSubmit={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(getByText("Erro simulado de teste")).toBeTruthy();
    });
  });

  describe("AdminUserActions Component", () => {
    it("não renderiza nada se identidade do admin for indefinida", () => {
      const { queryByTestId } = render(
        <AdminUserActions targetUser={activeUser} currentAdmin={null} />
      );
      expect(queryByTestId("admin-user-actions")).toBeNull();
    });

    it("não libera ações para uma identidade que não é admin", () => {
      const { queryByTestId } = render(
        <AdminUserActions
          targetUser={activeUser}
          currentAdmin={{ ...currentAdmin, role: "USER" }}
        />
      );
      expect(queryByTestId("admin-user-actions")).toBeNull();
    });

    it("não exibe ações quando a conta-alvo é o próprio admin", () => {
      const selfUser: AdminUserRow = { ...activeUser, user_id: currentAdmin.user_id };
      const { queryByTestId } = render(
        <AdminUserActions targetUser={selfUser} currentAdmin={currentAdmin} />
      );
      expect(queryByTestId("admin-user-actions")).toBeNull();
    });

    it("exibe aviso explicativo para outro admin ativo", () => {
      const { getByTestId, getByText } = render(
        <AdminUserActions targetUser={activeAdmin} currentAdmin={currentAdmin} />
      );
      expect(getByTestId("admin-action-notice")).toBeTruthy();
      expect(getByText("Não é permitido suspender outro administrador.")).toBeTruthy();
    });

    it("exibe botão de suspender para usuário ativo e abre formulário", () => {
      const { getByTestId } = render(
        <AdminUserActions targetUser={activeUser} currentAdmin={currentAdmin} />
      );

      const trigger = getByTestId("suspend-action-trigger");
      expect(trigger).toBeTruthy();

      fireEvent.press(trigger);
      expect(getByTestId("user-moderation-form")).toBeTruthy();
    });

    it("impede que o toque na ação se propague para o card", () => {
      const stopPropagation = jest.fn();
      const { getByTestId } = render(
        <AdminUserActions targetUser={activeUser} currentAdmin={currentAdmin} />
      );

      fireEvent.press(getByTestId("suspend-action-trigger"), { stopPropagation });
      expect(stopPropagation).toHaveBeenCalledTimes(1);
    });

    it("exibe botão de reativar para outro admin suspenso", () => {
      const { getByTestId } = render(
        <AdminUserActions targetUser={suspendedAdmin} currentAdmin={currentAdmin} />
      );
      expect(getByTestId("reactivate-action-trigger")).toBeTruthy();
    });

    it("reativa enviando apenas o motivo", async () => {
      const reactivate = jest.spyOn(adminModerationMockService, "reactivateUser");
      const { getByTestId } = render(
        <AdminUserActions targetUser={suspendedAdmin} currentAdmin={currentAdmin} />
      );

      fireEvent.press(getByTestId("reactivate-action-trigger"));
      fireEvent.changeText(getByTestId("moderation-reason-input"), "  Recurso aceito  ");
      fireEvent.press(getByTestId("moderation-submit-button"));

      await waitFor(() => expect(reactivate).toHaveBeenCalledTimes(1));
      expect(reactivate).toHaveBeenCalledWith("admin-3", currentAdmin, {
        reason: "Recurso aceito"
      });
      await waitFor(() => expect(getByTestId("admin-action-notice")).toBeTruthy());
    });

    it("aceita outro service sem alterar o componente", async () => {
      const suspendUser = jest.fn().mockResolvedValue({
        user: { ...activeUser, status: "SUSPENDED" }
      });
      const service: AdminModerationService = {
        suspendUser,
        reactivateUser: jest.fn()
      };
      const { getByTestId } = render(
        <AdminUserActions
          targetUser={activeUser}
          currentAdmin={currentAdmin}
          moderationService={service}
        />
      );

      fireEvent.press(getByTestId("suspend-action-trigger"));
      fireEvent.changeText(getByTestId("moderation-reason-input"), "Motivo válido");
      fireEvent.press(getByTestId("moderation-submit-button"));

      await waitFor(() => expect(getByTestId("reactivate-action-trigger")).toBeTruthy());
      expect(suspendUser).toHaveBeenCalledTimes(1);
      expect(getModerationMockStore().users.find((user) => user.user_id === "user-1")?.status).toBe(
        "ACTIVE"
      );
    });

    it("executa mutação de suspensão com sucesso via mock service", async () => {
      const onSuccess = jest.fn();
      const { getByTestId } = render(
        <AdminUserActions
          targetUser={activeUser}
          currentAdmin={currentAdmin}
          onMutationSuccess={onSuccess}
        />
      );

      fireEvent.press(getByTestId("suspend-action-trigger"));
      fireEvent.changeText(getByTestId("moderation-reason-input"), "Suspensão por violar regras");
      fireEvent.press(getByTestId("moderation-submit-button"));

      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
        const store = getModerationMockStore();
        const userInStore = store.users.find((u) => u.user_id === activeUser.user_id);
        expect(userInStore?.status).toBe("SUSPENDED");
      });
      expect(getByTestId("reactivate-action-trigger")).toBeTruthy();
    });

    it("preserva motivo e opção quando a mutação falha", async () => {
      jest
        .spyOn(adminModerationMockService, "suspendUser")
        .mockRejectedValueOnce(new Error("Conflito simulado"));
      const onError = jest.fn();
      const { getByTestId, getByText } = render(
        <AdminUserActions
          targetUser={activeUser}
          currentAdmin={currentAdmin}
          onMutationError={onError}
        />
      );

      fireEvent.press(getByTestId("suspend-action-trigger"));
      fireEvent.changeText(getByTestId("moderation-reason-input"), "Motivo preservado");
      fireEvent.press(getByTestId("resolve-reports-toggle"));
      fireEvent.press(getByTestId("moderation-submit-button"));

      await waitFor(() => expect(getByText("Conflito simulado")).toBeTruthy());
      expect(getByTestId("moderation-reason-input").props.value).toBe("Motivo preservado");
      expect(getByTestId("resolve-reports-toggle").props.accessibilityState.checked).toBe(false);
      expect(onError).toHaveBeenCalledTimes(1);
    });

    it("envia a mutação uma única vez mesmo com dois toques imediatos", async () => {
      const suspend = jest.spyOn(adminModerationMockService, "suspendUser");
      const { getByTestId } = render(
        <AdminUserActions targetUser={activeUser} currentAdmin={currentAdmin} />
      );
      fireEvent.press(getByTestId("suspend-action-trigger"));
      fireEvent.changeText(getByTestId("moderation-reason-input"), "Motivo válido");

      act(() => {
        fireEvent.press(getByTestId("moderation-submit-button"));
        fireEvent.press(getByTestId("moderation-submit-button"));
      });

      await waitFor(() => expect(getByTestId("reactivate-action-trigger")).toBeTruthy());
      expect(suspend).toHaveBeenCalledTimes(1);
    });
  });
});
