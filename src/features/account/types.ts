export type Account = {
  email: string;
  name: string;
  username: string;
};

export type AccountChanges = Partial<Account> & {
  password?: string;
};

export type AccountService = {
  deleteAccount: () => Promise<void>;
  getAccount: (signal?: AbortSignal) => Promise<Account>;
  updateAccount: (changes: AccountChanges) => Promise<Account>;
};
