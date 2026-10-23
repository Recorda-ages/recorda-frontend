import type { AccountService } from "../types";
import { deleteOwnAccount } from "./accountApi";
import { accountServiceMock } from "./accountService.mock";

export const accountAdapter: AccountService = {
  deleteAccount: deleteOwnAccount,
  getAccount: accountServiceMock.getAccount,
  updateAccount: accountServiceMock.updateAccount
};
