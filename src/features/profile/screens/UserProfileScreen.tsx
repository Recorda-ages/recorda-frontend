import { type RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import {
  Modal,
  type NativeScrollEvent,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View
} from "react-native";
import { Icon } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { BottomTabBar, type BottomTab } from "@/features/feed/components/BottomTabBar";
import { FollowButton } from "@/features/follow";
import { MemoryCalendarTab } from "@/features/memories-calendar/components/MemoryCalendarTab";
import { DynamicMetricsDashboard } from "@/features/memories-metrics/components/DynamicMetricsDashboard";
import { MEMORY_CALENDAR_QUERY_KEY } from "@/features/memories-calendar/queryKeys";
import { USER_METRICS_QUERY_KEY } from "@/features/memories-metrics/queryKeys";
import { useReportDialog } from "@/features/moderation";
import { ApiError } from "@/services/api";
import { colors, fontFamily, radius, spacing } from "@/theme";

import { ProfileGlow } from "../components/ProfileGlow";
import { PROFILE_AVATAR_CENTER_Y, ProfileHeader } from "../components/ProfileHeader";
import { ProfilePrivateNotice } from "../components/ProfilePrivateNotice";
import { ProfileTabs, type ProfileTab } from "../components/ProfileTabs";
import { canLoadMore, RecordaGrid } from "../components/RecordaGrid";
import { StreakBadge } from "../components/StreakBadge";
import { type ProfileMusicChips, useProfileMusicTastes } from "../hooks/useProfileMusicTastes";
import { useProfileRecordas } from "../hooks/useProfileRecordas";
import { useUserProfile } from "../hooks/useUserProfile";
import { profileMusicTastesQueryKey, profileRecordasQueryKey } from "../queryKeys";
import type { ProfileRead } from "../types";

const BAR_ICON_SIZE = 28;
const BAR_BUTTON_SIZE = 40;
const TOP_BAR_HEIGHT = BAR_BUTTON_SIZE + spacing[2] * 2;
const MENU_ICON_SIZE = 20;
// How close to the end of the scroll the next page of the grid is requested.
const LOAD_MORE_THRESHOLD = 400;

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
  // The grid is only ever requested when the backend says the viewer may see the content.
  const canViewContent = profile.data?.can_view_content === true;
  const recordas = useProfileRecordas(userId, !isSelf && canViewContent);
  // Chips only: a failure just leaves them out.
  const tastes = useProfileMusicTastes(userId, !isSelf && canViewContent);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ProfileTab>("recordas");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const { openReport, reportDialog } = useReportDialog();
  const insets = useSafeAreaInsets();
  const redirected = useRef(false);

  useEffect(() => {
    if (isSelf && !redirected.current) {
      redirected.current = true;
      navigation.replace("Profile");
    }
  }, [isSelf, navigation]);

  // Access lost (e.g. unfollowed a private account): drop the Recordas already cached, so
  // nothing restricted stays around to show up if access comes back.
  const hasProfile = profile.data !== undefined;
  useEffect(() => {
    if (hasProfile && !canViewContent) {
      queryClient.removeQueries({ exact: true, queryKey: profileRecordasQueryKey(userId) });
      queryClient.removeQueries({ exact: true, queryKey: profileMusicTastesQueryKey(userId) });
      queryClient.removeQueries({ queryKey: [...USER_METRICS_QUERY_KEY, "profile", userId] });
      queryClient.removeQueries({
        queryKey: [...MEMORY_CALENDAR_QUERY_KEY],
        predicate: (query) => query.queryKey.includes(userId)
      });
    }
  }, [canViewContent, hasProfile, queryClient, userId]);

  if (isSelf) {
    return <View style={styles.screen} testID="user-profile-redirecting" />;
  }

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") navigation.navigate("Camera");
    else if (tab === "feed") navigation.navigate("Feed");
    else navigation.navigate("Profile");
  };

  const refresh = async () => {
    setIsPullRefreshing(true);
    try {
      // `refetch` ignores `enabled`: the grid is refreshed only when it may be seen.
      await Promise.all([
        profile.refetch(),
        canViewContent ? recordas.refetch() : null,
        canViewContent ? tastes.refetch() : null
      ]);
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const loadMore = () => {
    // cancelRefetch: false ignores a second request while a page is still on its way, even if
    // a scroll event arrives before the screen re-renders with isFetchingNextPage.
    if (canViewContent && canLoadMore(recordas)) {
      void recordas.fetchNextPage({ cancelRefetch: false });
    }
  };

  const handleScroll = ({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const nearEnd =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD;
    if (activeTab === "recordas" && nearEnd) loadMore();
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
          <ProfileContent
            activeTab={activeTab}
            isRefreshing={isPullRefreshing}
            onLoadMore={loadMore}
            onPressRecorda={(recordaId) =>
              navigation.navigate("PublishedRecorda", { postId: recordaId })
            }
            onRefresh={() => void refresh()}
            onScroll={handleScroll}
            onTabChange={setActiveTab}
            profile={data}
            recordas={recordas}
            tastes={tastes.data}
          />
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

type ProfileContentProps = Readonly<{
  activeTab: ProfileTab;
  isRefreshing: boolean;
  onLoadMore: () => void;
  onPressRecorda: (recordaId: string) => void;
  onRefresh: () => void;
  onScroll: (event: { nativeEvent: NativeScrollEvent }) => void;
  onTabChange: (tab: ProfileTab) => void;
  profile: ProfileRead;
  recordas: ReturnType<typeof useProfileRecordas>;
  tastes: ProfileMusicChips | undefined;
}>;

function ProfileContent({
  activeTab,
  isRefreshing,
  onLoadMore,
  onPressRecorda,
  onRefresh,
  onScroll,
  onTabChange,
  profile,
  recordas,
  tastes
}: ProfileContentProps) {
  const song = profile.favorite_song;
  const privateNotice = profile.can_view_content ? undefined : <ProfilePrivateNotice />;

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      onScroll={onScroll}
      refreshControl={
        <RefreshControl
          onRefresh={onRefresh}
          refreshing={isRefreshing}
          tintColor={colors.neutrals[100]}
        />
      }
      scrollEventThrottle={100}
      showsVerticalScrollIndicator={false}
      testID="user-profile-scroll"
    >
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
        // First item only, as on the own profile.
        favoriteArtists={tastes?.artists.slice(0, 1)}
        favoriteGenres={tastes?.genres.slice(0, 1)}
        favoriteSong={{ artistName: song.artist_name, coverUrl: song.cover_url, title: song.title }}
        name={profile.name}
        streakSlot={<StreakBadge profile={profile} />}
        username={profile.username}
      />
      <View style={styles.tabs}>
        <ProfileTabs
          activeTab={activeTab}
          calendarContent={privateNotice ?? <MemoryCalendarTab userId={profile.user_id} />}
          metricsContent={privateNotice ?? <DynamicMetricsDashboard userId={profile.user_id} />}
          onChange={onTabChange}
        />
      </View>
      {activeTab === "recordas" ? (
        <View style={styles.tabContent}>
          {privateNotice ?? (
            <RecordaGrid
              hasNextPage={recordas.hasNextPage}
              isFetchNextPageError={recordas.isFetchNextPageError}
              isFetchingNextPage={recordas.isFetchingNextPage}
              items={recordas.data?.pages.flatMap((page) => page.items) ?? []}
              onLoadMore={onLoadMore}
              onPressItem={onPressRecorda}
              onRetry={() => void recordas.refetch()}
              status={gridStatus(recordas)}
            />
          )}
        </View>
      ) : null}
    </ScrollView>
  );
}

function gridStatus(query: ReturnType<typeof useProfileRecordas>) {
  if (query.data) return "success";
  return query.isError ? "error" : "pending";
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
  tabContent: {
    marginTop: spacing[4]
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
