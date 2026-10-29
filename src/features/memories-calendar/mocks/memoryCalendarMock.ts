import type { DayRecordaDetail, MemoryCalendarService } from "../types";
import { assertDate, assertMonth, throwIfAborted } from "../validation";

// Fixed local calendar dates and times: do not convert date-only values through the device timezone.
const dates = [
  "2026-09-30",
  "2026-10-01",
  "2026-10-03",
  "2026-10-12",
  "2026-10-18",
  "2026-10-29",
  "2026-11-02"
];
function createMemories(date: string, index: number): DayRecordaDetail[] {
  return Array.from({ length: (index % 3) + 1 }, (_, post) => {
    const id = `memory-${date}-${post + 1}`;
    const time = `${String(10 + post * 3).padStart(2, "0")}:30`;
    const isVideo = post === 1 || (post === 0 && index % 2 === 1);
    const thumbnail = `https://picsum.photos/seed/${id}/480/640`;
    return {
      recorda_id: id,
      author: { user_id: "mock-calendar-user", username: "marina", avatar_url: null },
      created_at: `${date}T${time}:00-03:00`,
      formatted_time: time,
      description: [
        "Café e uma música boa",
        "Fim de tarde com os amigos",
        "Um momento para guardar"
      ][post],
      media_type: isVideo ? "VIDEO" : "PHOTO",
      media_url: isVideo
        ? "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4"
        : thumbnail,
      thumbnail_url: thumbnail,
      deezer_track_id: "3135556",
      song_title: "Harder, Better, Faster, Stronger",
      song_artist_name: "Daft Punk",
      song_cover_url: "https://picsum.photos/seed/discovery/300/300",
      song_preview_url: "/api/v1/music/tracks/3135556/preview",
      is_liked: post === 0,
      likes_count: 4 + index + post,
      comments_count: post === 0 ? 1 : 0,
      comments:
        post === 0
          ? [
              {
                comment_id: `comment-${id}`,
                user_id: "mock-friend",
                username: "pedro",
                avatar_url: null,
                content: "Que lembrança boa!",
                created_at: `${date}T18:00:00-03:00`
              }
            ]
          : []
    };
  });
}
// Recreated on every read so callers cannot mutate shared fixtures.
function entries() {
  return dates.map((date, index) => ({ date, memories: createMemories(date, index) }));
}
export const memoryCalendarMock: MemoryCalendarService = {
  async getMonthCalendar(year, month, signal) {
    assertMonth(year, month);
    throwIfAborted(signal);
    const prefix = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-`;
    const days = entries()
      .filter(({ date }) => date.startsWith(prefix))
      .map(({ date, memories }) => ({
        date,
        day: Number(date.slice(-2)),
        count: memories.length,
        thumbnail_url: memories[0].thumbnail_url,
        media_type: memories[0].media_type,
        first_recorda_id: memories[0].recorda_id
      }));
    return {
      year,
      month,
      total_memories: days.reduce((sum, day) => sum + day.count, 0),
      active_days_count: days.length,
      days
    };
  },
  async getDayMemories(date, signal) {
    assertDate(date);
    throwIfAborted(signal);
    const memories = entries().find((entry) => entry.date === date)?.memories ?? [];
    return {
      date,
      total_count: memories.length,
      memories,
      previous_date_with_memories: dates.filter((value) => value < date).pop() ?? null,
      next_date_with_memories: dates.find((value) => value > date) ?? null
    };
  }
};
