import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText } from "@/components/ui";
import { colors, spacing } from "@/theme";

import { FriendCard } from "../components/FriendCard";
import { FriendsSearchBar } from "../components/FriendsSearchBar";
import { FriendsTabBar } from "../components/FriendsTabBar";
import { mockFollowers, mockFollowing } from "../mocks/friendsMocks";
import type { FriendProfile, FriendsTab } from "../types";

export function FriendsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState<FriendsTab>("seguidores");
  const [search, setSearch] = useState("");
  const [followers, setFollowers] = useState(mockFollowers);
  const [following, setFollowing] = useState(mockFollowing);

  const source = activeTab === "seguidores" ? followers : following;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return source;
    return source.filter(
      (p) =>
        p.displayName.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
    );
  }, [source, search]);

  const handleRemove = (profile: FriendProfile) => {
    if (activeTab === "seguidores") {
      setFollowers((prev) => prev.filter((p) => p.id !== profile.id));
    } else {
      setFollowing((prev) => prev.filter((p) => p.id !== profile.id));
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
          <FlatList
            data={filtered}
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
  title: {
    color: colors.neutrals[100],
    fontWeight: "700"
  }
});
