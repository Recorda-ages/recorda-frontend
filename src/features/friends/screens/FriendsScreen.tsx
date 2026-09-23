import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AUTH_ME_QUERY_KEY } from "@/features/auth/api/getCurrentUser";
import type { CurrentUser } from "@/features/auth/api/getCurrentUser";
import { AppText } from "@/components/ui";
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
  const [activeTab, setActiveTab] = useState<FriendsTab>("seguidores");
  const [search, setSearch] = useState("");

  const { data: currentUser } = useQuery<CurrentUser>({
    queryKey: AUTH_ME_QUERY_KEY,
    enabled: false,
  });
  const userId = currentUser?.user_id ?? "";

  const followersQuery = useFollowers(userId, search);
  const followingQuery = useFollowing(userId, search);
  const removeFollowerMutation = useRemoveFollower(userId);

  const activeQuery = activeTab === "seguidores" ? followersQuery : followingQuery;
  const data = activeQuery.data ?? [];

  const handleRemove = (profile: FriendProfile) => {
    if (activeTab === "seguidores") {
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
            Amigos
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <FriendsTabBar activeTab={activeTab} onChange={setActiveTab} />

        <View style={styles.content}>
          <FriendsSearchBar value={search} onChangeText={setSearch} />
          {activeQuery.isLoading ? (
            <ActivityIndicator color={colors.neutrals[100]} style={styles.loader} />
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <FriendCard
                  profile={item}
                  onPress={handleProfilePress}
                  onRemove={handleRemove}
                />
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
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
  title: {
    color: colors.neutrals[100],
    fontWeight: "700"
  }
});
