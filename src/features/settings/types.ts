export type UserSettings = {
  is_private: boolean;
  language: string;
};

export type SettingsUpdate = Partial<Pick<UserSettings, "is_private">>;

export type SettingsUpdateResponse = UserSettings & {
  accepted_requests: number;
};
