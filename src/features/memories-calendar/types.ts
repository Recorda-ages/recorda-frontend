import type { RecordaCommentResponse, RecordaDetailResponse } from "@/features/feed";

export type CalendarDaySummary = {
  date: string;
  day: number;
  count: number;
  thumbnail_url: string;
  media_type: "PHOTO" | "VIDEO";
  first_recorda_id: string;
};
export type MonthlyCalendarResponse = {
  year: number;
  month: number;
  total_memories: number;
  active_days_count: number;
  days: CalendarDaySummary[];
};
// Provisional extension of the existing Recorda wire contract; confirm with backend.
export type DayRecordaDetail = RecordaDetailResponse & {
  thumbnail_url: string;
  comments: RecordaCommentResponse[];
  comments_count: number;
  formatted_time: string;
};
export type DailyMemoriesResponse = {
  date: string;
  total_count: number;
  memories: DayRecordaDetail[];
  previous_date_with_memories: string | null;
  next_date_with_memories: string | null;
};
export type MemoryCalendarService = {
  getMonthCalendar: (
    year: number,
    month: number,
    signal?: AbortSignal
  ) => Promise<MonthlyCalendarResponse>;
  getDayMemories: (date: string, signal?: AbortSignal) => Promise<DailyMemoriesResponse>;
};
