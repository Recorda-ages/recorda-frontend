import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { CurrentUser } from "@/features/auth/api/getCurrentUser";
import { AppText, Button, ErrorState } from "@/components/ui";
import { ApiError } from "@/services/api/errors";
import { colors, spacing } from "@/theme";

import { FriendCard } from "../components/FriendCard";
import { FriendsSearchBar } from "../components/FriendsSearchBar";
import { FriendsTabBar } from "../components/FriendsTabBar";
import { useFollowers } from "../hooks/useFollowers";
import { useFollowing } from "../hooks/useFollowing";
import { useRemoveFollower } from "../hooks/useRemoveFollower";
import type { FriendProfile, FriendsTab } from "../types";

export function FriendsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Friends">>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<FriendsTab>("seguidores");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: AUTH_ME_QUERY_KEY,
    enabled: false
  });
  const ownUserId = currentUser?.user_id ?? "";
  const userId = route.params?.userId ?? ownUserId;
  const isOwnAccount = !!ownUserId && userId === ownUserId;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const followersQuery = useFollowers(userId, debouncedSearch, activeTab === "seguidores");
  const followingQuery = useFollowing(userId, debouncedSearch, activeTab === "seguindo");
  const removeFollowerMutation = useRemoveFollower(userId);

  const activeQuery = activeTab === "seguidores" ? followersQuery : followingQuery;
  const data = activeQuery.data?.pages.flat() ?? [];
  const privateAccount = activeQuery.error instanceof ApiError && activeQuery.error.status === 403;

  const handleRemove = (profile: FriendProfile) => {
    if (activeTab === "seguidores" && isOwnAccount) {
      removeFollowerMutation.mutate(profile.id);
    }
  };

  const handleProfilePress = (_profile: FriendProfile) => {
    navigation.navigate("Profile");
  };

  return (
    <View style={styles.screen}>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable hitSlop={8} onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons color={colors.neutrals[100]} name="chevron-back" size={24} />
          </Pressable>
          <AppText style={styles.title} variant="headline4">
            {t("friends.title")}
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <FriendsTabBar activeTab={activeTab} onChange={setActiveTab} />

        <View style={styles.content}>
          <FriendsSearchBar value={search} onChangeText={setSearch} />
          {activeQuery.isPending ? (
            <ActivityIndicator color={colors.neutrals[100]} style={styles.loader} />
          ) : activeQuery.isError && data.length === 0 ? (
            <View style={styles.feedback}>
              <ErrorState
                message={t(privateAccount ? "friends.privateError" : "friends.loadError")}
              />
              <Button
                label={t("friends.retry")}
                onPress={() => void activeQuery.refetch()}
                variant="secondary"
              />
            </View>
          ) : data.length === 0 ? (
            <AppText color="muted" style={styles.empty}>
              {t(debouncedSearch ? "friends.searchEmpty" : "friends.empty")}
            </AppText>
          ) : (
            <FlatList
              contentContainerStyle={styles.list}
              data={data}
              keyExtractor={(item) => item.id}
              ListFooterComponent={
                activeQuery.isFetchingNextPage ? (
                  <ActivityIndicator color={colors.neutrals[100]} style={styles.footerLoader} />
                ) : activeQuery.isFetchNextPageError ? (
                  <View style={styles.feedback}>
                    <ErrorState message={t("friends.loadMoreError")} />
                    <Button
                      label={t("friends.retry")}
                      onPress={() => void activeQuery.fetchNextPage()}
                      variant="secondary"
                    />
                  </View>
                ) : null
              }
              onEndReached={() => {
                if (
                  activeQuery.hasNextPage &&
                  !activeQuery.isFetchingNextPage &&
                  !activeQuery.isFetchNextPageError
                ) {
                  void activeQuery.fetchNextPage();
                }
              }}
              onEndReachedThreshold={0.4}
              renderItem={({ item }) => (
                <FriendCard
                  profile={item}
                  showRemove={activeTab === "seguidores" && isOwnAccount}
                  onPress={handleProfilePress}
                  onRemove={handleRemove}
                />
              )}
              showsVerticalScrollIndicator={false}
              testID="friends-list"
            />
          )}
          {removeFollowerMutation.isError ? (
            <ErrorState message={t("friends.removeError")} />
          ) : null}
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    height: 32,
    justifyContent: "center",
    width: 32
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing[5]
  },
  empty: {
    paddingVertical: spacing[8],
    textAlign: "center"
  },
  feedback: {
    gap: spacing[3],
    paddingVertical: spacing[4]
  },
  footerLoader: {
    marginVertical: spacing[4]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[5],
    paddingVertical: spacing[4]
  },
  headerSpacer: {
    width: 32
  },
  safeArea: {
    flex: 1
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  loader: {
    marginTop: spacing[8]
  },
  list: {
    paddingBottom: spacing[4]
  },
  title: {
    color: colors.neutrals[100],
    fontWeight: "700"
  }
});
