import { formatReportTime } from "@/features/admin/reports/formatReportDate";
import {
  availableStatusChanges,
  currentReportStatus
} from "@/features/admin/reports/reportDetailStatus";
import type { AdminReportEntry, AdminReportStatus } from "@/features/admin/types";

function report(status: AdminReportStatus, resolvedAt: string | null = null): AdminReportEntry {
  return {
    createdAt: "2026-10-01T12:00:00Z",
    description: null,
    reportId: `${status}-${resolvedAt}`,
    reporterUsername: "paulo",
    resolvedAt,
    status
  };
}

describe("report detail status", () => {
  it("is open while any report is open and offers to resolve or dismiss", () => {
    const reports = [report("RESOLVED", "2026-10-02T12:00:00Z"), report("OPEN")];

    expect(currentReportStatus(reports)).toBe("OPEN");
    expect(availableStatusChanges(reports)).toEqual(["RESOLVED", "DISMISSED"]);
  });

  it("takes the latest decision when every report is closed and offers to reopen", () => {
    const reports = [
      report("RESOLVED", "2026-10-02T12:00:00Z"),
      report("DISMISSED", "2026-10-05T12:00:00Z")
    ];

    expect(currentReportStatus(reports)).toBe("DISMISSED");
    expect(availableStatusChanges(reports)).toEqual(["OPEN"]);
  });

  it("offers nothing without reports", () => {
    expect(currentReportStatus([])).toBeNull();
    expect(availableStatusChanges([])).toEqual([]);
  });
});

describe("formatReportTime", () => {
  it("formats hours and minutes in the device timezone", () => {
    const iso = "2026-10-05T12:07:00Z";
    const expected = new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(new Date(iso));

    expect(formatReportTime(iso, "pt-BR")).toBe(expected);
    expect(formatReportTime("not-a-date", "pt-BR")).toBe("");
  });
});
