import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { BottomTabBar, type BottomTab } from "@/features/feed/components/BottomTabBar";
import { FollowButton } from "@/features/follow";
import { useReportDialog } from "@/features/moderation";
import { ApiError } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { ProfileGlow } from "../components/ProfileGlow";
import { PROFILE_AVATAR_CENTER_Y, ProfileHeader } from "../components/ProfileHeader";
import { ProfilePrivateNotice } from "../components/ProfilePrivateNotice";
import { ProfileTabs, type ProfileTab } from "../components/ProfileTabs";
import { useUserProfile } from "../hooks/useUserProfile";
import type { ProfileRead } from "../types";

const BAR_ICON_SIZE = 28;
const BAR_BUTTON_SIZE = 40;
const TOP_BAR_HEIGHT = BAR_BUTTON_SIZE + spacing[2] * 2;
const MENU_ICON_SIZE = 20;

/**
 * Another user's profile (#255). What the viewer may see comes only from
 * `can_view_content`; follow state and counters always come from the query, which the
 * follow mutation invalidates. The signed-in user is sent on to "Profile".
 */
export function UserProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { params } = useRoute<RouteProp<RootStackParamList, "UserProfile">>();
  const { userId } = params;
  const { t } = useTranslation();
  const currentUser = useCurrentUser();
  // Known locally, so the own profile is never requested from the third-party endpoint.
  const isOwnRoute = currentUser?.user_id === userId;
  const profile = useUserProfile(userId, !isOwnRoute);
  // Fallback for when the signed-in user isn't cached yet.
  const isSelf = isOwnRoute || profile.data?.relationship.is_self === true;
  const [activeTab, setActiveTab] = useState<ProfileTab>("recordas");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { openReport, reportDialog } = useReportDialog();
  const insets = useSafeAreaInsets();
  const redirected = useRef(false);

  useEffect(() => {
    if (isSelf && !redirected.current) {
      redirected.current = true;
      navigation.replace("Profile");
    }
  }, [isSelf, navigation]);

  if (isSelf) {
    return <View style={styles.screen} testID="user-profile-redirecting" />;
  }

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") navigation.navigate("Camera");
    else if (tab === "feed") navigation.navigate("Feed");
    else navigation.navigate("Profile");
  };

  const data = profile.data;

  return (
    <View style={styles.screen} testID="user-profile-screen">
      <StatusBar style="light" />
      {/* Fixed behind the top bar and the scroll, centered on the avatar at rest. */}
      <ProfileGlow centerY={insets.top + TOP_BAR_HEIGHT + PROFILE_AVATAR_CENTER_Y} />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityLabel={t("profile.back")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            style={styles.barButton}
          >
            <Icon color={colors.neutrals[100]} size={BAR_ICON_SIZE} source="chevron-left" />
          </Pressable>
          <AppText numberOfLines={1} style={styles.topBarTitle} variant="headline4">
            {data?.name ?? ""}
          </AppText>
          <Pressable
            accessibilityLabel={t("feed.more")}
            accessibilityRole="button"
            disabled={!data}
            hitSlop={8}
            onPress={() => setIsMenuOpen(true)}
            style={styles.barButton}
          >
            <Icon color={colors.neutrals[100]} size={BAR_ICON_SIZE} source="dots-horizontal" />
          </Pressable>
        </View>

        {data ? (
          <ProfileContent activeTab={activeTab} onTabChange={setActiveTab} profile={data} />
        ) : (
          <ProfileStatus profile={profile} />
        )}
      </SafeAreaView>
      <BottomTabBar activeTab="profile" onPress={handleTabBarPress} />

      {isMenuOpen ? (
        <ProfileMenu
          onClose={() => setIsMenuOpen(false)}
          onReport={() => {
            setIsMenuOpen(false);
            openReport({ type: "USER", userId });
          }}
        />
      ) : null}
      {reportDialog}
    </View>
  );
}

function ProfileContent({
  activeTab,
  onTabChange,
  profile
}: Readonly<{
  activeTab: ProfileTab;
  onTabChange: (tab: ProfileTab) => void;
  profile: ProfileRead;
}>) {
  const { t } = useTranslation();
  const song = profile.favorite_song;

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <ProfileHeader
        actionSlot={
          <FollowButton
            size="block"
            status={profile.relationship.follow_status}
            userId={profile.user_id}
            username={profile.username}
          />
        }
        avatarUrl={profile.profile_picture_url}
        counts={profile.can_view_content ? profile.counts : null}
        favoriteSong={{ artistName: song.artist_name, coverUrl: song.cover_url, title: song.title }}
        name={profile.name}
        username={profile.username}
      />
      <View style={styles.tabs}>
        <ProfileTabs activeTab={activeTab} onChange={onTabChange} />
      </View>
      {profile.can_view_content ? (
        // Recordas have no data source yet and Metrics/Calendar belong to Epic 07, so no
        // tab pretends to be an empty list (IMPLEMENTATION_NOTES.md, §2.5 and §6.2).
        <AppText style={styles.comingSoon} testID={`profile-coming-soon-${activeTab}`}>
          {t("profile.comingSoon")}
        </AppText>
      ) : (
        <ProfilePrivateNotice />
      )}
    </ScrollView>
  );
}

function ProfileStatus({ profile }: Readonly<{ profile: ReturnType<typeof useUserProfile> }>) {
  const { t } = useTranslation();

  if (profile.isError) {
    if (profile.error instanceof ApiError && profile.error.status === 404) {
      return (
        <AppText style={styles.unavailable} testID="profile-unavailable">
          {t("profile.unavailable")}
        </AppText>
      );
    }

    return (
      <View style={styles.feedback}>
        <ErrorState message={t("profile.loadError")} />
        <Button
          label={t("profile.retry")}
          onPress={() => void profile.refetch()}
          variant="secondary"
        />
      </View>
    );
  }

  return <Loading label={t("profile.loading")} />;
}

function ProfileMenu({
  onClose,
  onReport
}: Readonly<{ onClose: () => void; onReport: () => void }>) {
  const { t } = useTranslation();

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible>
      <Pressable
        accessibilityLabel={t("publishedRecorda.cancel")}
        onPress={onClose}
        style={StyleSheet.absoluteFill}
        testID="profile-menu-backdrop"
      />
      <SafeAreaView edges={["top"]} pointerEvents="box-none" style={styles.menuArea}>
        <View style={styles.menu} testID="profile-menu">
          <Pressable accessibilityRole="button" onPress={onReport} style={styles.menuItem}>
            <Icon color={colors.error[200]} size={MENU_ICON_SIZE} source="message-alert-outline" />
            <AppText style={styles.menuLabel}>{t("profile.report")}</AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  barButton: {
    alignItems: "center",
    height: BAR_BUTTON_SIZE,
    justifyContent: "center",
    width: BAR_BUTTON_SIZE
  },
  comingSoon: {
    color: colors.neutrals[300],
    paddingVertical: spacing[8],
    textAlign: "center"
  },
  content: {
    flex: 1
  },
  feedback: {
    gap: spacing[3],
    padding: spacing[5]
  },
  menu: {
    backgroundColor: colors.neutrals[800],
    borderRadius: radius.lg,
    paddingVertical: spacing[1]
  },
  // Below the top bar, aligned with the three-dots button.
  menuArea: {
    alignItems: "flex-end",
    paddingHorizontal: spacing[3],
    paddingTop: TOP_BAR_HEIGHT
  },
  menuItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    minHeight: 48,
    paddingHorizontal: spacing[4]
  },
  menuLabel: {
    color: colors.error[200],
    fontFamily: fontFamily.display.medium
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  scrollContent: {
    paddingBottom: spacing[6],
    paddingHorizontal: spacing[5]
  },
  tabs: {
    marginTop: spacing[6]
  },
  topBar: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing[2],
    height: TOP_BAR_HEIGHT,
    paddingHorizontal: spacing[3]
  },
  topBarTitle: {
    color: colors.neutrals[100],
    flex: 1,
    fontFamily: fontFamily.primary.bold,
    textAlign: "center"
  },
  unavailable: {
    color: colors.neutrals[100],
    padding: spacing[6],
    textAlign: "center"
  }
});
