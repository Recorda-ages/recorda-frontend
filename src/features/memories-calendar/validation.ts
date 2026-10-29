export function isValidMonth(year: number, month: number) {
  return (
    Number.isInteger(year) &&
    year >= 1 &&
    year <= 9999 &&
    Number.isInteger(month) &&
    month >= 1 &&
    month <= 12
  );
}
export function isValidDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const [year, month, day] = date.split("-").map(Number);
  return (
    isValidMonth(year, month) && day >= 1 && day <= new Date(Date.UTC(year, month, 0)).getUTCDate()
  );
}
export function assertMonth(year: number, month: number) {
  if (!isValidMonth(year, month)) throw new RangeError("Expected year 1–9999 and month 1–12.");
}
export function assertDate(date: string) {
  if (!isValidDate(date)) throw new RangeError("Expected a valid YYYY-MM-DD date.");
}
export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    const error = new Error("Calendar request aborted.");
    error.name = "AbortError";
    throw error;
  }
}
