import { auditLogPeriodRange } from "@/features/admin/audit-log/auditLogPeriod";

describe("auditLogPeriodRange", () => {
  it("does not restrict dates for all records", () => {
    expect(auditLogPeriodRange("all", new Date(2026, 9, 18))).toEqual({});
  });

  it("uses the local day for today, even late at night", () => {
    expect(auditLogPeriodRange("today", new Date(2026, 9, 18, 23, 30))).toEqual({
      dateFrom: "2026-10-18",
      dateTo: "2026-10-18"
    });
  });

  it("covers the last month up to today", () => {
    expect(auditLogPeriodRange("lastMonth", new Date(2026, 9, 18, 8))).toEqual({
      dateFrom: "2026-09-18",
      dateTo: "2026-10-18"
    });
  });

  it("clamps to the end of a shorter previous month", () => {
    expect(auditLogPeriodRange("lastMonth", new Date(2026, 2, 31))).toEqual({
      dateFrom: "2026-02-28",
      dateTo: "2026-03-31"
    });
  });

  it("crosses the year boundary", () => {
    expect(auditLogPeriodRange("lastMonth", new Date(2026, 0, 15))).toEqual({
      dateFrom: "2025-12-15",
      dateTo: "2026-01-15"
    });
  });
});
