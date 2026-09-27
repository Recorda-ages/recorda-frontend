import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useState } from "react";
import { Pressable, Text } from "react-native";
import { useTheme } from "react-native-paper";

import { AppProviders } from "@/app/providers/AppProviders";
import { queryClient } from "@/app/providers/queryClient";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import { useFeed } from "@/features/feed/state/FeedContext";
import type { FeedItem } from "@/features/feed/types";
import { semanticColors } from "@/theme";

const PRIVATE_RECORDA: FeedItem = {
  author: {
    profile_picture_url: null,
    user_id: "private-author",
    username: "private_author"
  },
  created_at: "2026-09-26T12:00:00Z",
  description: "Private session snapshot",
  is_liked: false,
  likes_count: 0,
  media_type: "PHOTO",
  media_url: "/private.jpg",
  recorda_id: "private-session-recorda",
  song_artist_name: "Artist",
  song_cover_url: "",
  song_preview_url: null,
  song_title: "Song"
};

let feedConsumerMounts = 0;

function PaperThemeConsumer() {
  const theme = useTheme();

  return <Text testID="paper-primary-color">{theme.colors.primary}</Text>;
}

function FeedSessionConsumer() {
  const { openFeedItem, posts } = useFeed();
  const [mountId] = useState(() => ++feedConsumerMounts);

  return (
    <>
      <Text testID="feed-consumer-mount">{mountId}</Text>
      <Text testID="session-feed-posts">{posts.map((post) => post.id).join(",")}</Text>
      <Pressable onPress={() => openFeedItem(PRIVATE_RECORDA)}>
        <Text>Open private Recorda</Text>
      </Pressable>
    </>
  );
}

describe("AppProviders", () => {
  beforeEach(() => {
    feedConsumerMounts = 0;
    queryClient.clear();
  });
  afterEach(() => act(() => queryClient.clear()));

  it("provides the Recorda Paper theme", () => {
    render(
      <AppProviders>
        <PaperThemeConsumer />
      </AppProviders>
    );

    expect(screen.getByTestId("paper-primary-color")).toHaveTextContent(
      semanticColors.actionPrimary
    );
  });

  it("resets the local Feed state when the authenticated session ends", async () => {
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, {
      name: "First user",
      onboarding_completed: true,
      role: "USER",
      user_id: "first-user",
      username: "first_user"
    });
    render(
      <AppProviders>
        <FeedSessionConsumer />
      </AppProviders>
    );

    fireEvent.press(screen.getByText("Open private Recorda"));
    expect(screen.getByTestId("session-feed-posts")).toHaveTextContent(/private-session-recorda/);

    act(() => queryClient.removeQueries({ queryKey: AUTH_ME_QUERY_KEY }));

    await waitFor(() =>
      expect(screen.getByTestId("session-feed-posts")).not.toHaveTextContent(
        /private-session-recorda/
      )
    );
    expect(screen.getByTestId("feed-consumer-mount")).toHaveTextContent("1");
  });
});
