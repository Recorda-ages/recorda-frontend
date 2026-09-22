import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { ErrorState, Loading } from "@/components/ui";
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
  const followingItems = followingFeedQuery.data?.items ?? [];

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

  return (
    <View style={styles.screen} testID="feed-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <FeedHeader />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === "following" ? (
          <>
            {followingFeedQuery.isPending ? <Loading label={t("feed.loading")} /> : null}
            {followingFeedQuery.isError ? <ErrorState message={t("feed.loadError")} /> : null}
            {followingFeedQuery.isSuccess && followingItems.length === 0 ? (
              <FeedEmptyState />
            ) : null}
            {followingItems.length > 0 ? (
              <FlatList
                contentContainerStyle={styles.list}
                data={followingItems}
                keyExtractor={(item) => item.recorda_id}
                renderItem={({ item }) => (
                  <RecordaCard item={item} onPress={() => handleCardPress(item)} />
                )}
                showsVerticalScrollIndicator={false}
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
  list: {
    gap: spacing[4],
    paddingTop: spacing[2]
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  }
});
