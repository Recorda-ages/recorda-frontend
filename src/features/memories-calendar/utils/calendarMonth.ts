export type CalendarSlot = { date: string; day: number } | null;

const DAYS_IN_WEEK = 7;
const FIRST_SUNDAY = new Date(2023, 0, 1, 12);

export function toDateKey(year: number, month: number, day: number) {
  return [
    String(year).padStart(4, "0"),
    String(month).padStart(2, "0"),
    String(day).padStart(2, "0")
  ].join("-");
}

export function getDaysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function getFirstWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay();
}

export function buildCalendarWeeks(year: number, month: number): CalendarSlot[][] {
  const slots: CalendarSlot[] = [
    ...Array.from({ length: getFirstWeekday(year, month) }, () => null),
    ...Array.from({ length: getDaysInMonth(year, month) }, (_, index) => ({
      date: toDateKey(year, month, index + 1),
      day: index + 1
    }))
  ];

  while (slots.length % DAYS_IN_WEEK !== 0) {
    slots.push(null);
  }

  return Array.from({ length: slots.length / DAYS_IN_WEEK }, (_, week) =>
    slots.slice(week * DAYS_IN_WEEK, (week + 1) * DAYS_IN_WEEK)
  );
}

export function shiftMonth(year: number, month: number, delta: number) {
  const index = year * 12 + month - 1 + delta;
  return { month: (index % 12) + 1, year: Math.floor(index / 12) };
}

function capitalize(value: string, locale: string) {
  return value.charAt(0).toLocaleUpperCase(locale) + value.slice(1);
}

export function formatMonthName(year: number, month: number, locale: string) {
  const name = new Intl.DateTimeFormat(locale, { month: "long" }).format(
    new Date(year, month - 1, 1, 12)
  );
  return capitalize(name, locale);
}

export function createDayFormatter(locale: string) {
  const formatter = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long" });
  return (year: number, month: number, day: number) =>
    formatter.format(new Date(year, month - 1, day, 12));
}

export function getWeekdayLabels(locale: string) {
  const narrow = new Intl.DateTimeFormat(locale, { weekday: "narrow" });
  const long = new Intl.DateTimeFormat(locale, { weekday: "long" });

  return Array.from({ length: DAYS_IN_WEEK }, (_, index) => {
    const date = new Date(FIRST_SUNDAY);
    date.setDate(FIRST_SUNDAY.getDate() + index);
    return { long: long.format(date), short: narrow.format(date).toLocaleUpperCase(locale) };
  });
}
