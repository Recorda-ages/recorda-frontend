import type { UserBasicResponse } from "@/features/auth/api/types";
import { ApiError, authApiClient } from "@/services/api";

import type { Account, AccountChanges } from "../types";

const TAKEN_USERNAMES = new Set(["admin", "recorda"]);
const TAKEN_EMAILS = new Set(["admin@recorda.app"]);

const accounts = new Map<string, Account>();

async function loadAccount(signal?: AbortSignal) {
  const user = await authApiClient.get<UserBasicResponse>("/auth/me", { signal });
  const account = accounts.get(user.user_id) ?? {
    email: "",
    name: user.name,
    username: user.username
  };

  return { account, userId: user.user_id };
}

function findConflicts(current: Account, changes: AccountChanges) {
  const fields: { field: keyof Account; message: string }[] = [];
  const username = changes.username?.toLowerCase();
  const email = changes.email?.toLowerCase();

  if (username && username !== current.username.toLowerCase() && TAKEN_USERNAMES.has(username)) {
    fields.push({ field: "username", message: "Username já está em uso." });
  }

  if (email && email !== current.email.toLowerCase() && TAKEN_EMAILS.has(email)) {
    fields.push({ field: "email", message: "Email já está em uso." });
  }

  return fields;
}

export const accountServiceMock = {
  async getAccount(signal?: AbortSignal): Promise<Account> {
    const { account } = await loadAccount(signal);
    return account;
  },
  async updateAccount(changes: AccountChanges): Promise<Account> {
    const { account, userId } = await loadAccount();
    const conflicts = findConflicts(account, changes);

    if (conflicts.length > 0) {
      throw new ApiError("CONFLICT", "Dados já em uso.", 409, { fields: conflicts });
    }

    const updated: Account = {
      email: changes.email ?? account.email,
      name: changes.name ?? account.name,
      username: changes.username ?? account.username
    };
    accounts.set(userId, updated);

    return updated;
  }
};

export function seedAccountMock(userId: string, account: Account) {
  accounts.set(userId, account);
}

export function resetAccountMock() {
  accounts.clear();
}
