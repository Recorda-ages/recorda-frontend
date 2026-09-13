import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useMemo, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { colors, spacing } from "@/theme";

import { BottomTabBar, type BottomTab } from "../components/BottomTabBar";
import { FeedHeader } from "../components/FeedHeader";
import { FeedTabs } from "../components/FeedTabs";
import { RecordaCard } from "../components/RecordaCard";
import { mockFeedPosts } from "../mocks/feedPosts";
import type { FeedTab } from "../types";

export function FeedScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<FeedTab>("following");
  const posts = useMemo(
    () => mockFeedPosts.filter((post) => post.tabs.includes(activeTab)),
    [activeTab]
  );

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") {
      navigation.navigate("Camera");
    }

    if (tab === "profile") {
      navigation.navigate("Profile");
    }
  };

  return (
    <View style={styles.screen} testID="feed-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <FeedHeader />
        <FeedTabs activeTab={activeTab} onChange={setActiveTab} />
        <FlatList
          contentContainerStyle={styles.list}
          data={posts}
          keyExtractor={(post) => post.id}
          renderItem={({ item }) => <RecordaCard post={item} />}
          showsVerticalScrollIndicator={false}
        />
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
