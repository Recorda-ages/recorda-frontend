import { deleteOwnAccount } from "@/features/account/services/accountApi";
import { accountAdapter } from "@/features/account/services/accountAdapter";
import {
  accountServiceMock,
  resetAccountMock
} from "@/features/account/services/accountService.mock";
import { ApiError, authApiClient } from "@/services/api";

const currentUser = {
  name: "John Doe",
  onboarding_completed: true,
  role: "USER",
  user_id: "user-1",
  username: "john_doe"
};

describe("account services", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    resetAccountMock();
    jest.spyOn(authApiClient, "get").mockResolvedValue(currentUser);
  });

  it("deletes the signed-in account through the real API", async () => {
    const remove = jest.spyOn(authApiClient, "delete").mockResolvedValue(null);

    await deleteOwnAccount();

    expect(remove).toHaveBeenCalledWith("/users/me");
    expect(accountAdapter.deleteAccount).toBe(deleteOwnAccount);
  });

  it("starts the mock from the signed-in user", async () => {
    await expect(accountServiceMock.getAccount()).resolves.toEqual({
      email: "",
      name: "John Doe",
      username: "john_doe"
    });
    expect(authApiClient.get).toHaveBeenCalledWith("/auth/me", { signal: undefined });
  });

  it("keeps the saved changes and ignores the password", async () => {
    await accountServiceMock.updateAccount({
      email: "john@gmail.com",
      name: "John Silva",
      password: "novasenha1"
    });

    await expect(accountServiceMock.getAccount()).resolves.toEqual({
      email: "john@gmail.com",
      name: "John Silva",
      username: "john_doe"
    });
  });

  it("answers a conflict in the API error format for taken data", async () => {
    const attempt = accountServiceMock.updateAccount({
      email: "Admin@Recorda.app",
      username: "admin"
    });

    await expect(attempt).rejects.toBeInstanceOf(ApiError);
    await expect(attempt).rejects.toMatchObject({
      details: {
        fields: [
          { field: "username", message: expect.any(String) },
          { field: "email", message: expect.any(String) }
        ]
      },
      status: 409
    });
    await expect(accountServiceMock.getAccount()).resolves.toMatchObject({
      username: "john_doe"
    });
  });
});
