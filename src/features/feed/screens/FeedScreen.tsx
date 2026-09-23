import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button, ErrorState, Loading } from "@/components/ui";
import { colors, spacing } from "@/theme";

import { BottomTabBar, type BottomTab } from "../components/BottomTabBar";
import { FeedEmptyState } from "../components/FeedEmptyState";
import { FeedHeader } from "../components/FeedHeader";
import { FeedTabs } from "../components/FeedTabs";
import { RecordaCard } from "../components/RecordaCard";
import { useFollowingFeed } from "../hooks/useFollowingFeed";
import { useGeneralFeed } from "../hooks/useGeneralFeed";
import type { FeedItem, FeedTab } from "../types";

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FeedTab>("geral");
  const generalFeedQuery = useGeneralFeed(activeTab === "geral");
  const followingFeedQuery = useFollowingFeed(activeTab === "following");
  const activeQuery = activeTab === "geral" ? generalFeedQuery : followingFeedQuery;
  const feedVariant = activeTab === "geral" ? "general" : "following";
  const items = activeQuery.data?.pages.flatMap((page) => page.items) ?? [];

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
      activeQuery.hasNextPage &&
      !activeQuery.isFetchingNextPage &&
      !activeQuery.isFetchNextPageError
    ) {
      void activeQuery.fetchNextPage();
    }
  };

  return (
    <View style={styles.screen} testID="feed-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <FeedHeader />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeQuery.isPending ? <Loading label={t("feed.loading")} /> : null}
        {activeQuery.isError && items.length === 0 ? (
          <View style={styles.feedback}>
            <ErrorState message={t("feed.loadError")} />
            <Button
              label={t("feed.retry")}
              onPress={() => void activeQuery.refetch()}
              variant="secondary"
            />
          </View>
        ) : null}
        {activeQuery.isSuccess && items.length === 0 ? (
          <FeedEmptyState variant={feedVariant} />
        ) : null}
        {items.length > 0 ? (
          <FlatList
            contentContainerStyle={styles.list}
            data={items}
            keyExtractor={(item) => item.recorda_id}
            ListFooterComponent={
              activeQuery.isFetchingNextPage ? (
                <Loading label={t("feed.loadingMore")} />
              ) : activeQuery.isFetchNextPageError ? (
                <View style={styles.paginationError}>
                  <ErrorState message={t("feed.loadMoreError")} />
                  <Button
                    label={t("feed.retry")}
                    onPress={() => void activeQuery.fetchNextPage()}
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
            testID={`${feedVariant}-feed-list`}
          />
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
