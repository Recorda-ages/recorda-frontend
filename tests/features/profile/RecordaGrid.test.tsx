import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react-native";
import type { ComponentProps } from "react";
import { I18nextProvider } from "react-i18next";

import { canLoadMore, RecordaGrid } from "@/features/profile/components/RecordaGrid";
import type { RecordaGridItem } from "@/features/profile/types";
import { i18n } from "@/i18n";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";

function photo(id: string, createdAt: string): RecordaGridItem {
  return {
    created_at: createdAt,
    media_type: "PHOTO",
    media_url: `/api/v1/recordas/media/${id}.jpg`,
    recorda_id: id,
    song_artist_name: "Muse",
    song_cover_url: "https://cdn-images.dzcdn.net/images/cover/starlight/500x500.jpg",
    song_title: "Starlight"
  };
}

function video(id: string, createdAt: string, coverUrl: string): RecordaGridItem {
  return {
    created_at: createdAt,
    media_type: "VIDEO",
    media_url: `/api/v1/recordas/media/${id}.mp4`,
    recorda_id: id,
    song_artist_name: "Imagine Dragons",
    song_cover_url: coverUrl,
    song_title: "Believer"
  };
}

// Newest first, as the backend sends them.
const ITEMS: RecordaGridItem[] = [
  photo("r7", "2026-10-27T12:00:00Z"),
  video("r6", "2026-10-26T12:00:00Z", "https://cdn-images.dzcdn.net/images/cover/believer.jpg"),
  photo("r5", "2026-10-25T12:00:00Z"),
  photo("r4", "2026-10-24T12:00:00Z"),
  photo("r3", "2026-10-23T12:00:00Z"),
  photo("r2", "2026-10-22T12:00:00Z"),
  video("r1", "2026-10-21T12:00:00Z", "")
];

type Props = ComponentProps<typeof RecordaGrid>;

function renderGrid(props: Partial<Props> = {}) {
  const handlers = {
    onLoadMore: jest.fn(),
    onPressItem: jest.fn(),
    onRetry: jest.fn()
  };
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });
  // Images read the auth token asynchronously; seeding it keeps renders synchronous.
  client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);

  render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <RecordaGrid
          hasNextPage={false}
          isFetchNextPageError={false}
          isFetchingNextPage={false}
          items={ITEMS}
          status="success"
          {...handlers}
          {...props}
        />
      </QueryClientProvider>
    </I18nextProvider>
  );

  return handlers;
}

function tileIds() {
  return screen
    .getAllByTestId(/^recorda-grid-item-/)
    .map((tile) => String(tile.props.testID).replace("recorda-grid-item-", ""));
}

describe("RecordaGrid", () => {
  it("lays the Recordas out in rows of three, short last row included", () => {
    renderGrid();

    const rows = screen.getAllByTestId("recorda-grid-row");
    expect(rows).toHaveLength(3);
    expect(rows.map((row) => within(row).getAllByTestId(/^recorda-grid-item-/).length)).toEqual([
      3, 3, 1
    ]);
  });

  it("keeps the order it receives", () => {
    renderGrid();

    expect(tileIds()).toEqual(["r7", "r6", "r5", "r4", "r3", "r2", "r1"]);
  });

  it("shows a photo from its media URL, resolved against the API", () => {
    renderGrid();

    expect(screen.getByTestId("recorda-grid-image-r7")).toHaveProp("source", [
      { uri: "http://localhost:8000/api/v1/recordas/media/r7.jpg" }
    ]);
    expect(
      screen.queryByTestId("recorda-grid-video-r7", { includeHiddenElements: true })
    ).toBeNull();
  });

  it("shows a video as its song cover with a play indicator", () => {
    renderGrid();

    expect(screen.getByTestId("recorda-grid-image-r6")).toHaveProp("source", [
      { uri: "https://cdn-images.dzcdn.net/images/cover/believer.jpg" }
    ]);
    // Decorative, so hidden from screen readers.
    expect(
      screen.getByTestId("recorda-grid-video-r6", { includeHiddenElements: true })
    ).toBeTruthy();
  });

  it("falls back to a music icon for a video without a cover", () => {
    renderGrid();

    expect(screen.queryByTestId("recorda-grid-image-r1")).toBeNull();
    expect(
      screen.getByTestId("recorda-grid-video-r1", { includeHiddenElements: true })
    ).toBeTruthy();
  });

  it("labels each tile for screen readers, telling photos and videos apart", () => {
    renderGrid();

    expect(
      screen.getAllByRole("button", { name: "Recorda com foto: Starlight, de Muse" })
    ).toHaveLength(5);
    expect(
      screen.getAllByRole("button", { name: "Recorda em vídeo: Believer, de Imagine Dragons" })
    ).toHaveLength(2);
  });

  it("reports the pressed Recorda", () => {
    const { onPressItem } = renderGrid();

    fireEvent.press(screen.getByTestId("recorda-grid-item-r5"));

    expect(onPressItem).toHaveBeenCalledWith("r5");
  });

  describe("states", () => {
    it("shows a loader while the first page loads", () => {
      renderGrid({ items: [], status: "pending" });

      expect(screen.getByTestId("recorda-grid-loading")).toBeTruthy();
      expect(screen.getByText("Carregando Recordas")).toBeTruthy();
      expect(screen.queryByTestId("recorda-grid-empty")).toBeNull();
    });

    it("shows an error with a retry when the first page fails", () => {
      const { onRetry } = renderGrid({ items: [], status: "error" });

      expect(screen.getByText("Não foi possível carregar as Recordas.")).toBeTruthy();
      expect(screen.queryByTestId("recorda-grid-empty")).toBeNull();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("shows the empty message only after a successful empty load", () => {
      renderGrid({ items: [] });

      expect(screen.getByText("Nenhuma Recorda publicada ainda.")).toBeTruthy();
      expect(screen.queryByText("Não foi possível carregar as Recordas.")).toBeNull();
    });

    it("accepts a custom empty message", () => {
      renderGrid({ emptyMessage: "Sua primeira Recorda aparece aqui.", items: [] });

      expect(screen.getByText("Sua primeira Recorda aparece aqui.")).toBeTruthy();
    });

    it("keeps the tiles while the next page loads", () => {
      renderGrid({ hasNextPage: true, isFetchingNextPage: true });

      expect(screen.getByTestId("recorda-grid-loading-more")).toBeTruthy();
      expect(tileIds()).toHaveLength(ITEMS.length);
    });

    it("keeps the tiles and offers a retry when the next page fails", () => {
      const { onLoadMore } = renderGrid({ hasNextPage: true, isFetchNextPageError: true });

      expect(tileIds()).toHaveLength(ITEMS.length);
      expect(screen.getByText("Não foi possível carregar mais Recordas.")).toBeTruthy();
      fireEvent.press(screen.getByRole("button", { name: "Tentar novamente" }));

      expect(onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("shows no footer when there is nothing more to load", () => {
      renderGrid();

      expect(screen.queryByTestId("recorda-grid-loading-more")).toBeNull();
      expect(screen.queryByTestId("recorda-grid-load-more-error")).toBeNull();
    });
  });
});

describe("canLoadMore", () => {
  it.each([
    [true, false, false, true],
    [false, false, false, false],
    [true, true, false, false],
    [true, false, true, false]
  ])(
    "hasNextPage=%s, fetching=%s, failed=%s gives %s",
    (hasNextPage, isFetchingNextPage, isFetchNextPageError, expected) => {
      expect(canLoadMore({ hasNextPage, isFetchNextPageError, isFetchingNextPage })).toBe(expected);
    }
  );
});
