import { authApiClient } from "@/services/api";

import type { SettingsUpdate, SettingsUpdateResponse, UserSettings } from "../types";

const SETTINGS_PATH = "/users/me/settings";

export function getSettings(signal?: AbortSignal) {
  return authApiClient.get<UserSettings>(SETTINGS_PATH, { signal });
}

export function updateSettings(partial: SettingsUpdate) {
  return authApiClient.patch<SettingsUpdateResponse>(SETTINGS_PATH, partial);
}
