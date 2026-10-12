import type { AdminService } from "../types";
import { adminServiceMock } from "./adminService.mock";

// PR #247 delivers the administrative shell with temporary report fixtures.
// Switch to the HTTP service only in the backend integration delivery.
export const adminAdapter: AdminService = adminServiceMock;
