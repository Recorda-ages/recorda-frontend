import { updateSettings } from "@/features/settings/services/settingsService";
import { type AppLanguage, defaultLanguage, i18n, isAppLanguage } from "@/i18n";
import { secureStorage } from "@/services/storage";

export const APP_LANGUAGE_KEY = "app_language";
export const PENDING_LANGUAGE_KEY = "app_language_pending";

type PendingLanguage = { language: AppLanguage; userId: string };

type AccountUser = { language?: string; user_id: string };

export function getCurrentLanguage(): AppLanguage {
  return isAppLanguage(i18n.language) ? i18n.language : defaultLanguage;
}

export async function applyLanguage(language: AppLanguage) {
  if (i18n.language !== language) {
    await i18n.changeLanguage(language);
  }

  try {
    await secureStorage.setItem(APP_LANGUAGE_KEY, language);
  } catch {
    return;
  }
}

export async function restoreSavedLanguage() {
  try {
    const saved = await secureStorage.getItem(APP_LANGUAGE_KEY);

    if (isAppLanguage(saved) && saved !== i18n.language) {
      await i18n.changeLanguage(saved);
    }
  } catch {
    return;
  }
}

async function readPendingLanguage(): Promise<PendingLanguage | null> {
  try {
    const raw = await secureStorage.getItem(PENDING_LANGUAGE_KEY);
    const pending: unknown = raw ? JSON.parse(raw) : null;

    if (
      typeof pending === "object" &&
      pending !== null &&
      "language" in pending &&
      "userId" in pending &&
      isAppLanguage(pending.language) &&
      typeof pending.userId === "string"
    ) {
      return { language: pending.language, userId: pending.userId };
    }
  } catch {
    return null;
  }

  return null;
}

async function savePendingLanguage(pending: PendingLanguage) {
  try {
    await secureStorage.setItem(PENDING_LANGUAGE_KEY, JSON.stringify(pending));
  } catch {
    return;
  }
}

async function clearPendingLanguage() {
  try {
    await secureStorage.removeItem(PENDING_LANGUAGE_KEY);
  } catch {
    return;
  }
}

export async function chooseLanguage(language: AppLanguage, userId?: string) {
  await applyLanguage(language);

  if (!userId) {
    return false;
  }

  try {
    await updateSettings({ language });
    await clearPendingLanguage();
    return true;
  } catch {
    await savePendingLanguage({ language, userId });
    return false;
  }
}

export async function syncLanguageWithAccount(user: AccountUser) {
  try {
    const pending = await readPendingLanguage();

    if (pending?.userId === user.user_id) {
      await applyLanguage(pending.language);

      try {
        await updateSettings({ language: pending.language });
        await clearPendingLanguage();
      } catch {
        return;
      }

      return;
    }

    if (pending) {
      await clearPendingLanguage();
    }

    if (isAppLanguage(user.language)) {
      await applyLanguage(user.language);
    }
  } catch {
    return;
  }
}
