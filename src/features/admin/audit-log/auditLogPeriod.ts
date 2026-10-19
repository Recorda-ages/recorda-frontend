export type AuditLogPeriod = "all" | "today" | "lastMonth";

export type AuditLogDateRange = {
  dateFrom?: string;
  dateTo?: string;
};

// The API reads dates as calendar days in America/Sao_Paulo, so send the
// admin's local day instead of the UTC day from toISOString().
export function auditLogPeriodRange(period: AuditLogPeriod, now = new Date()): AuditLogDateRange {
  if (period === "all") {
    return {};
  }

  const today = toLocalDate(now);

  if (period === "today") {
    return { dateFrom: today, dateTo: today };
  }

  return { dateFrom: toLocalDate(oneMonthBefore(now)), dateTo: today };
}

function oneMonthBefore(date: Date) {
  const lastDayOfPreviousMonth = new Date(date.getFullYear(), date.getMonth(), 0).getDate();

  return new Date(
    date.getFullYear(),
    date.getMonth() - 1,
    Math.min(date.getDate(), lastDayOfPreviousMonth)
  );
}

function toLocalDate(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${date.getFullYear()}-${month}-${day}`;
}
