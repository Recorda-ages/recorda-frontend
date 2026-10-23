import { clearSession, saveSession } from "@/features/auth/session";
import {
  APP_LANGUAGE_KEY,
  chooseLanguage,
  PENDING_LANGUAGE_KEY,
  restoreSavedLanguage,
  syncLanguageWithAccount
} from "@/features/language/languagePreference";
import * as settingsService from "@/features/settings/services/settingsService";
import { i18n } from "@/i18n";
import { secureStorage } from "@/services/storage";

const mockStore = new Map<string, string>();

jest.mock("@/services/storage", () => ({
  secureStorage: {
    getItem: jest.fn(async (key: string) => mockStore.get(key) ?? null),
    removeItem: jest.fn(async (key: string) => {
      mockStore.delete(key);
    }),
    setItem: jest.fn(async (key: string, value: string) => {
      mockStore.set(key, value);
    })
  }
}));

const user = {
  name: "Gabriel",
  onboarding_completed: true,
  role: "USER" as const,
  user_id: "user-1",
  username: "gabriel"
};

function pending() {
  const raw = mockStore.get(PENDING_LANGUAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

describe("language preference", () => {
  let update: jest.SpyInstance;

  beforeEach(async () => {
    mockStore.clear();
    jest.clearAllMocks();
    update = jest
      .spyOn(settingsService, "updateSettings")
      .mockResolvedValue({ accepted_requests: 0, is_private: false, language: "en" });
    await i18n.changeLanguage("pt-BR");
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
  });

  it("prefers the language saved on the device over the device language", async () => {
    await i18n.changeLanguage("en");
    mockStore.set(APP_LANGUAGE_KEY, "es");

    await restoreSavedLanguage();

    expect(i18n.language).toBe("es");
  });

  it("keeps the device language when nothing valid was saved", async () => {
    await i18n.changeLanguage("en");

    await restoreSavedLanguage();
    expect(i18n.language).toBe("en");

    mockStore.set(APP_LANGUAGE_KEY, "fr");
    await restoreSavedLanguage();
    expect(i18n.language).toBe("en");
  });

  it("switches right away, saves on the device and on the account", async () => {
    await expect(chooseLanguage("en", "user-1")).resolves.toBe(true);

    expect(i18n.language).toBe("en");
    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("en");
    expect(update).toHaveBeenCalledWith({ language: "en" });
    expect(pending()).toBeNull();
  });

  it("keeps the new language and retries later when the account cannot be updated", async () => {
    update.mockRejectedValueOnce(new Error("offline"));

    await expect(chooseLanguage("es", "user-1")).resolves.toBe(false);

    expect(i18n.language).toBe("es");
    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("es");
    expect(pending()).toEqual({ language: "es", userId: "user-1" });
  });

  it("only saves on the device when nobody is signed in", async () => {
    await expect(chooseLanguage("en")).resolves.toBe(false);

    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("en");
    expect(update).not.toHaveBeenCalled();
  });

  it("follows the language saved on the account", async () => {
    mockStore.set(APP_LANGUAGE_KEY, "pt-BR");

    await syncLanguageWithAccount({ ...user, language: "es" });

    expect(i18n.language).toBe("es");
    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("es");
    expect(update).not.toHaveBeenCalled();
  });

  it("ignores an account without a valid language", async () => {
    await syncLanguageWithAccount({ ...user, language: "fr" });
    await syncLanguageWithAccount(user);

    expect(i18n.language).toBe("pt-BR");
  });

  it("sends a pending choice of the same account instead of going back", async () => {
    mockStore.set(PENDING_LANGUAGE_KEY, JSON.stringify({ language: "en", userId: "user-1" }));

    await syncLanguageWithAccount({ ...user, language: "pt-BR" });

    expect(update).toHaveBeenCalledWith({ language: "en" });
    expect(i18n.language).toBe("en");
    expect(pending()).toBeNull();
  });

  it("keeps the pending choice when the retry fails again", async () => {
    update.mockRejectedValueOnce(new Error("offline"));
    mockStore.set(PENDING_LANGUAGE_KEY, JSON.stringify({ language: "en", userId: "user-1" }));

    await syncLanguageWithAccount({ ...user, language: "pt-BR" });

    expect(i18n.language).toBe("en");
    expect(pending()).toEqual({ language: "en", userId: "user-1" });
  });

  it("drops a pending choice from another account", async () => {
    mockStore.set(PENDING_LANGUAGE_KEY, JSON.stringify({ language: "en", userId: "user-2" }));

    await syncLanguageWithAccount({ ...user, language: "es" });

    expect(update).not.toHaveBeenCalled();
    expect(i18n.language).toBe("es");
    expect(pending()).toBeNull();
  });

  it("applies the account language on sign in", async () => {
    await saveSession({
      access_token: "token",
      token_type: "bearer",
      user: { ...user, language: "en" }
    });

    expect(i18n.language).toBe("en");
    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("en");
  });

  it("keeps the device language on sign out", async () => {
    mockStore.set(APP_LANGUAGE_KEY, "es");

    await clearSession();

    expect(mockStore.get(APP_LANGUAGE_KEY)).toBe("es");
    expect(secureStorage.removeItem).not.toHaveBeenCalledWith(APP_LANGUAGE_KEY);
  });
});
