import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button, ErrorState, Loading } from "@/components/ui";
import { generalFeedMock } from "@/mocks/recordaMock";
import { colors, spacing } from "@/theme";

import { BottomTabBar, type BottomTab } from "../components/BottomTabBar";
import { FeedEmptyState } from "../components/FeedEmptyState";
import { FeedHeader } from "../components/FeedHeader";
import { FeedTabs } from "../components/FeedTabs";
import { RecordaCard } from "../components/RecordaCard";
import { useFollowingFeed } from "../hooks/useFollowingFeed";
import type { FeedItem, FeedTab } from "../types";

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FeedTab>("geral");
  const followingFeedQuery = useFollowingFeed(activeTab === "following");
  const followingItems = followingFeedQuery.data?.pages.flatMap((page) => page.items) ?? [];

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") {
      navigation.navigate("Camera");
    }

    if (tab === "profile") {
      navigation.navigate("Profile");
    }
  };

  const handleCardPress = (item: FeedItem) => {
    navigation.navigate("RecordaView", { recordaId: item.recorda_id });
  };

  const handleEndReached = () => {
    if (
      followingFeedQuery.hasNextPage &&
      !followingFeedQuery.isFetchingNextPage &&
      !followingFeedQuery.isFetchNextPageError
    ) {
      void followingFeedQuery.fetchNextPage();
    }
  };

  return (
    <View style={styles.screen} testID="feed-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <FeedHeader />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "geral" ? (
          <View style={styles.generalFeed}>
            <RecordaCard item={generalFeedMock} onPress={() => handleCardPress(generalFeedMock)} />
          </View>
        ) : null}
        {activeTab === "following" ? (
          <>
            {followingFeedQuery.isPending ? <Loading label={t("feed.loading")} /> : null}
            {followingFeedQuery.isError && followingItems.length === 0 ? (
              <View style={styles.feedback}>
                <ErrorState message={t("feed.loadError")} />
                <Button
                  label={t("feed.retry")}
                  onPress={() => void followingFeedQuery.refetch()}
                  variant="secondary"
                />
              </View>
            ) : null}
            {followingFeedQuery.isSuccess && followingItems.length === 0 ? (
              <FeedEmptyState />
            ) : null}
            {followingItems.length > 0 ? (
              <FlatList
                contentContainerStyle={styles.list}
                data={followingItems}
                keyExtractor={(item) => item.recorda_id}
                ListFooterComponent={
                  followingFeedQuery.isFetchingNextPage ? (
                    <Loading label={t("feed.loadingMore")} />
                  ) : followingFeedQuery.isFetchNextPageError ? (
                    <View style={styles.paginationError}>
                      <ErrorState message={t("feed.loadMoreError")} />
                      <Button
                        label={t("feed.retry")}
                        onPress={() => void followingFeedQuery.fetchNextPage()}
                        variant="secondary"
                      />
                    </View>
                  ) : null
                }
                onEndReached={handleEndReached}
                onEndReachedThreshold={0.4}
                renderItem={({ item }) => (
                  <RecordaCard item={item} onPress={() => handleCardPress(item)} />
                )}
                showsVerticalScrollIndicator={false}
                testID="following-feed-list"
              />
            ) : null}
          </>
        ) : null}
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
  generalFeed: {
    paddingTop: spacing[2]
  },
  list: {
    gap: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[2]
  },
  paginationError: {
    gap: spacing[3],
    paddingHorizontal: spacing[4]
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  }
});
