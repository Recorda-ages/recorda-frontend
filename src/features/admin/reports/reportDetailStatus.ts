import type { AdminReportEntry, AdminReportStatus } from "../types";

export function currentReportStatus(
  reports: readonly AdminReportEntry[]
): AdminReportStatus | null {
  if (reports.length === 0) {
    return null;
  }

  if (reports.some((report) => report.status === "OPEN")) {
    return "OPEN";
  }

  const [latest] = [...reports].sort((a, b) =>
    (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? "")
  );
  return latest.status;
}

export function availableStatusChanges(reports: readonly AdminReportEntry[]): AdminReportStatus[] {
  const status = currentReportStatus(reports);

  if (status === null) {
    return [];
  }

  return status === "OPEN" ? ["RESOLVED", "DISMISSED"] : ["OPEN"];
}
