import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button, ErrorState, Loading } from "@/components/ui";
import { resolveApiAssetUrl } from "@/services/api";
import { useNotifications } from "@/features/notifications";
import { colors, spacing } from "@/theme";

import { BottomTabBar, type BottomTab } from "../components/BottomTabBar";
import { FeedEmptyState } from "../components/FeedEmptyState";
import { FeedHeader } from "../components/FeedHeader";
import { FeedTabs } from "../components/FeedTabs";
import { RecordaCard } from "../components/RecordaCard";
import { useFollowingFeed } from "../hooks/useFollowingFeed";
import { useGeneralFeed } from "../hooks/useGeneralFeed";
import { useFeed } from "../state/FeedContext";
import type { FeedItem, FeedTab } from "../types";

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { deletedIds, openFeedItem } = useFeed();
  const [activeTab, setActiveTab] = useState<FeedTab>("geral");
  const generalFeedQuery = useGeneralFeed(activeTab === "geral");
  const followingFeedQuery = useFollowingFeed(activeTab === "following");
  const unreadCount = useNotifications().data?.pages[0]?.unread_count ?? 0;

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") {
      navigation.navigate("Camera");
    }

    if (tab === "profile") {
      navigation.navigate("Profile");
    }
  };

  const handleCardShare = (item: FeedItem) => {
    navigation.navigate("ShareCard", {
      artistName: item.song_artist_name,
      coverUrl: item.song_cover_url || null,
      mediaUri: resolveApiAssetUrl(item.media_url),
      mediaType: item.media_type === "VIDEO" ? "video" : "photo",
      songTitle: item.song_title
    });
  };

  const handleCardPress = (item: FeedItem) => {
    openFeedItem(item);
    navigation.navigate("PublishedRecorda", { postId: item.recorda_id });
  };

  const renderFeed = (tab: FeedTab, query: typeof generalFeedQuery) => {
    const isActive = activeTab === tab;
    const variant = tab === "geral" ? "general" : "following";
    const items =
      query.data?.pages
        .flatMap((page) => page.items)
        .filter((item) => !deletedIds.includes(item.recorda_id)) ?? [];

    const footer = query.isFetchingNextPage ? (
      <Loading label={t("feed.loadingMore")} />
    ) : query.isFetchNextPageError ? (
      <View style={styles.paginationError}>
        <ErrorState message={t("feed.loadMoreError")} />
        <Button
          label={t("feed.retry")}
          onPress={() => void query.fetchNextPage()}
          variant="secondary"
        />
      </View>
    ) : null;

    return (
      <View
        accessibilityElementsHidden={!isActive}
        importantForAccessibility={isActive ? "auto" : "no-hide-descendants"}
        key={tab}
        pointerEvents={isActive ? "auto" : "none"}
        style={[styles.panel, !isActive && styles.hiddenPanel]}
        testID={`${variant}-feed-panel`}
      >
        {query.isPending ? <Loading label={t("feed.loading")} /> : null}
        {query.isError && !query.isFetchNextPageError ? (
          <View style={styles.feedback}>
            <ErrorState message={t("feed.loadError")} />
            <Button
              label={t("feed.retry")}
              onPress={() => void query.refetch()}
              variant="secondary"
            />
          </View>
        ) : null}
        {query.isSuccess || items.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.list}
            data={items}
            keyExtractor={(item) => item.recorda_id}
            ListEmptyComponent={<FeedEmptyState variant={variant} />}
            ListFooterComponent={footer}
            onEndReached={() => {
              if (
                isActive &&
                query.hasNextPage &&
                !query.isFetching &&
                !query.isFetchNextPageError
              ) {
                void query.fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.4}
            onRefresh={() => void query.refetch()}
            refreshing={query.isRefetching}
            renderItem={({ item }) => (
              <RecordaCard
                item={item}
                onPress={() => handleCardPress(item)}
                onShare={() => handleCardShare(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            testID={`${variant}-feed-list`}
          />
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.screen} testID="feed-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <FeedHeader
          onNotificationsPress={() => navigation.navigate("Notifications")}
          unreadCount={unreadCount}
        />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
        <View style={styles.panelContainer}>
          {renderFeed("geral", generalFeedQuery)}
          {renderFeed("following", followingFeedQuery)}
        </View>
      </SafeAreaView>
      <BottomTabBar activeTab="feed" onPress={handleTabBarPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  feedback: {
    gap: spacing[3],
    padding: spacing[4]
  },
  list: {
    flexGrow: 1,
    gap: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[2]
  },
  paginationError: {
    gap: spacing[3],
    paddingHorizontal: spacing[4]
  },
  panel: {
    flex: 1
  },
  panelContainer: {
    flex: 1
  },
  hiddenPanel: {
    bottom: 0,
    left: 0,
    opacity: 0,
    position: "absolute",
    right: 0,
    top: 0
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  }
});
