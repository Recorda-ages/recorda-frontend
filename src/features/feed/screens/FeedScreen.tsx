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

type GeneralTabContentProps = {
  onCardPress: (item: FeedItem) => void;
};

function GeneralTabContent({ onCardPress }: Readonly<GeneralTabContentProps>) {
  return (
    <View style={styles.generalFeed}>
      <RecordaCard item={generalFeedMock} onPress={() => onCardPress(generalFeedMock)} />
    </View>
  );
}

type FollowingTabContentProps = {
  items: FeedItem[];
  onCardPress: (item: FeedItem) => void;
  onEndReached: () => void;
  query: ReturnType<typeof useFollowingFeed>;
};

function FollowingTabContent({
  items,
  onCardPress,
  onEndReached,
  query
}: Readonly<FollowingTabContentProps>) {
  const { t } = useTranslation();

  if (query.isPending) {
    return <Loading label={t("feed.loading")} />;
  }

  if (query.isError && items.length === 0) {
    return (
      <View style={styles.feedback}>
        <ErrorState message={t("feed.loadError")} />
        <Button label={t("feed.retry")} onPress={() => void query.refetch()} variant="secondary" />
      </View>
    );
  }

  if (query.isSuccess && items.length === 0) {
    return <FeedEmptyState />;
  }

  if (items.length === 0) {
    return null;
  }

  const renderFooter = () => {
    if (query.isFetchingNextPage) {
      return <Loading label={t("feed.loadingMore")} />;
    }

    if (query.isFetchNextPageError) {
      return (
        <View style={styles.paginationError}>
          <ErrorState message={t("feed.loadMoreError")} />
          <Button
            label={t("feed.retry")}
            onPress={() => void query.fetchNextPage()}
            variant="secondary"
          />
        </View>
      );
    }

    return null;
  };

  return (
    <FlatList
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => item.recorda_id}
      ListFooterComponent={renderFooter()}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      renderItem={({ item }) => <RecordaCard item={item} onPress={() => onCardPress(item)} />}
      showsVerticalScrollIndicator={false}
      testID="following-feed-list"
    />
  );
}

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
        {activeTab === "geral" ? <GeneralTabContent onCardPress={handleCardPress} /> : null}
        {activeTab === "following" ? (
          <FollowingTabContent
            items={followingItems}
            onCardPress={handleCardPress}
            onEndReached={handleEndReached}
            query={followingFeedQuery}
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
