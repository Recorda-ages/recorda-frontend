const dateFormatters = new Map<string, Intl.DateTimeFormat>();
const timeFormatters = new Map<string, Intl.DateTimeFormat>();

export function formatReportDate(isoDate: string, language: string) {
  return format(isoDate, language, dateFormatters, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function formatReportTime(isoDate: string, language: string) {
  return format(isoDate, language, timeFormatters, {
    hour: "2-digit",
    minute: "2-digit"
  });
}

function format(
  isoDate: string,
  language: string,
  cache: Map<string, Intl.DateTimeFormat>,
  options: Intl.DateTimeFormatOptions
) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  let formatter = cache.get(language);

  if (!formatter) {
    formatter = new Intl.DateTimeFormat(language, options);
    cache.set(language, formatter);
  }

  return formatter.format(date);
}
