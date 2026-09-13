export type UserBasicResponse = {
  account_type: string;
  id: number;
  name: string;
  onboarding_completed: boolean;
  username: string;
};

export type AuthSessionResponse = {
  access_token: string;
  token_type: string;
  user: UserBasicResponse;
};
