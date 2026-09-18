export type UserRole = "ADMIN" | "USER";

export type UserBasicResponse = {
  name: string;
  onboarding_completed: boolean;
  role: UserRole;
  user_id: string;
  username: string;
};

export type AuthSessionResponse = {
  access_token: string;
  token_type: string;
  user: UserBasicResponse;
};
