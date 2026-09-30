export function formatFeedDate(isoDate: string, locale: string) {
  const date = new Date(isoDate);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat(locale, { day: "2-digit", month: "long" }).format(date);
}
