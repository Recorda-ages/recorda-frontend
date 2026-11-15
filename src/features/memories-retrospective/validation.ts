import type { RetrospectivePeriodSelection } from "./types";

export function isValidRetrospectivePeriod(period: RetrospectivePeriodSelection) {
  if (!Number.isInteger(period.year) || period.year < 1 || period.year > 9999) {
    return false;
  }

  if (period.period_type === "YEARLY") {
    return period.month === null;
  }

  return (
    period.period_type === "MONTHLY" &&
    Number.isInteger(period.month) &&
    period.month !== null &&
    period.month >= 1 &&
    period.month <= 12
  );
}

export function assertRetrospectivePeriod(period: RetrospectivePeriodSelection) {
  if (!isValidRetrospectivePeriod(period)) {
    throw new RangeError("Expected a month between 1 and 12, or a year without a month.");
  }
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const error = new Error("Retrospective request aborted.");
    error.name = "AbortError";
    throw error;
  }
}

export function toRetrospectiveQuery(period: RetrospectivePeriodSelection) {
  const params = new URLSearchParams({
    period_type: period.period_type,
    year: String(period.year)
  });

  if (period.period_type === "MONTHLY" && period.month !== null) {
    params.set("month", String(period.month));
  }

  return params.toString();
}
