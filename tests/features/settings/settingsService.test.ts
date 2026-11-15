import { getSettings, updateSettings } from "@/features/settings/services/settingsService";
import { authApiClient } from "@/services/api";

jest.mock("@/services/api", () => ({
  authApiClient: { get: jest.fn(), patch: jest.fn() }
}));

afterEach(() => jest.clearAllMocks());

it("loads the authenticated account settings with cancellation", async () => {
  const settings = { is_private: true, language: "pt-BR" };
  const signal = new AbortController().signal;
  jest.mocked(authApiClient.get).mockResolvedValue(settings);
  await expect(getSettings(signal)).resolves.toEqual(settings);
  expect(authApiClient.get).toHaveBeenCalledWith("/users/me/settings", { signal });
});

it("patches only the changed fields and preserves the accepted requests count", async () => {
  const response = { is_private: false, language: "pt-BR", accepted_requests: 3 };
  jest.mocked(authApiClient.patch).mockResolvedValue(response);
  await expect(updateSettings({ is_private: false })).resolves.toEqual(response);
  expect(authApiClient.patch).toHaveBeenCalledWith("/users/me/settings", { is_private: false });
});

it("propagates read and write failures", async () => {
  const error = new Error("offline");
  jest.mocked(authApiClient.get).mockRejectedValue(error);
  jest.mocked(authApiClient.patch).mockRejectedValue(error);
  await expect(getSettings()).rejects.toBe(error);
  await expect(updateSettings({ is_private: true })).rejects.toBe(error);
});
