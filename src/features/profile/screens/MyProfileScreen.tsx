import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
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
import { MemoryCalendarTab } from "@/features/memories-calendar/components/MemoryCalendarTab";
import { DynamicMetricsDashboard } from "@/features/memories-metrics/components/DynamicMetricsDashboard";
import { RetrospectiveButton } from "@/features/memories-retrospective/components/RetrospectiveButton";
import { RetrospectiveFlow } from "@/features/memories-retrospective/components/RetrospectiveFlow";
import { useRetrospectivePeriods } from "@/features/memories-retrospective/hooks/useRetrospectivePeriods";
import { getMusicPreferences } from "@/features/onboarding/api/music";
import { MUSIC_PREFERENCES_QUERY_KEY } from "@/features/onboarding/queryKeys";
import { colors, fontFamily, spacing } from "@/theme";

import { AvatarPickerMenu } from "../components/AvatarPickerMenu";
import { ProfileGlow } from "../components/ProfileGlow";
import { PROFILE_AVATAR_CENTER_Y, ProfileHeader } from "../components/ProfileHeader";
import { ProfileTabs, type ProfileTab } from "../components/ProfileTabs";
import { canLoadMore, RecordaGrid } from "../components/RecordaGrid";
import { RemoveAvatarDialog } from "../components/RemoveAvatarDialog";
import { StreakBadge, StreakHint } from "../components/StreakBadge";
import { isIncompleteProfileError, useMyProfile } from "../hooks/useMyProfile";
import { useRemoveAvatarMutation } from "../hooks/useRemoveAvatarMutation";
import { useUploadAvatarMutation } from "../hooks/useUploadAvatarMutation";
import { useProfileRecordas } from "../hooks/useProfileRecordas";
import type { ProfileRead } from "../types";

const BAR_ICON_SIZE = 28;
const BAR_BUTTON_SIZE = 40;
const TOP_BAR_HEIGHT = BAR_BUTTON_SIZE + spacing[2] * 2;
// How close to the end of the scroll the next page of the grid is requested.
const LOAD_MORE_THRESHOLD = 400;

/**
 * The signed-in user's profile (#253): header, tabs and the Recordas grid in a single
 * ScrollView. Profile, grid and music preferences load independently; only the profile
 * blocks the screen. A 409 (incomplete onboarding) sends the user to onboarding once.
 */
export function MyProfileScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const myUserId = useCurrentUser()?.user_id;
  const profile = useMyProfile();
  const isIncomplete = isIncompleteProfileError(profile.error);
  const recordas = useProfileRecordas(myUserId, !isIncomplete);
  const retrospectivePeriods = useRetrospectivePeriods();
  const hasRetrospective = (retrospectivePeriods.data?.periods.length ?? 0) > 0;
  // Same query and cache as the music preferences editor; failures only hide the chips.
  const preferences = useQuery({
    enabled: Boolean(myUserId) && !isIncomplete,
    queryFn: ({ signal }) => getMusicPreferences(signal),
    queryKey: MUSIC_PREFERENCES_QUERY_KEY
  });
  const [activeTab, setActiveTab] = useState<ProfileTab>("recordas");
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [isAvatarMenuVisible, setIsAvatarMenuVisible] = useState(false);
  const [isRemoveDialogVisible, setIsRemoveDialogVisible] = useState(false);
  const [isRetrospectiveOpen, setIsRetrospectiveOpen] = useState(false);
  const redirected = useRef(false);

  const uploadAvatar = useUploadAvatarMutation(myUserId ?? "");
  const removeAvatar = useRemoveAvatarMutation(myUserId ?? "");

  useEffect(() => {
    if (isIncomplete && !redirected.current) {
      redirected.current = true;
      navigation.reset({ index: 0, routes: [{ name: "OnboardingArtists" }] });
    }
  }, [isIncomplete, navigation]);

  const handleTabBarPress = (tab: BottomTab) => {
    if (tab === "camera") navigation.navigate("Camera");
    else if (tab === "feed") navigation.navigate("Feed");
  };

  const refresh = async () => {
    setIsPullRefreshing(true);
    try {
      await Promise.all([profile.refetch(), recordas.refetch(), preferences.refetch()]);
    } finally {
      setIsPullRefreshing(false);
    }
  };

  const loadMore = () => {
    // cancelRefetch: false ignores a second request while a page is still on its way, even if
    // a scroll event arrives before the screen re-renders with isFetchingNextPage.
    if (canLoadMore(recordas)) void recordas.fetchNextPage({ cancelRefetch: false });
  };

  const handleScroll = ({ nativeEvent }: { nativeEvent: NativeScrollEvent }) => {
    const { contentOffset, contentSize, layoutMeasurement } = nativeEvent;
    const nearEnd =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - LOAD_MORE_THRESHOLD;
    if (activeTab === "recordas" && nearEnd) loadMore();
  };

  const data = profile.data;

  return (
    <View style={styles.screen} testID="profile-screen">
      <StatusBar style="light" />
      {/* Fixed behind the top bar and the scroll, centered on the avatar at rest. */}
      <ProfileGlow centerY={insets.top + TOP_BAR_HEIGHT + PROFILE_AVATAR_CENTER_Y} />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <View style={styles.topBar}>
          {hasRetrospective ? (
            <RetrospectiveButton
              onPress={() => setIsRetrospectiveOpen(true)}
              size={BAR_ICON_SIZE}
              style={styles.barButton}
            />
          ) : (
            <View style={styles.barButton} />
          )}
          <AppText numberOfLines={1} style={styles.topBarTitle} variant="headline4">
            {t("profile.title")}
          </AppText>
          <Pressable
            accessibilityLabel={t("settings.title")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.navigate("Settings")}
            style={styles.barButton}
          >
            <Icon color={colors.neutrals[100]} size={BAR_ICON_SIZE} source="cog-outline" />
          </Pressable>
        </View>

        {data && myUserId ? (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            onScroll={handleScroll}
            refreshControl={
              <RefreshControl
                onRefresh={() => void refresh()}
                refreshing={isPullRefreshing}
                tintColor={colors.neutrals[100]}
              />
            }
            scrollEventThrottle={100}
            showsVerticalScrollIndicator={false}
            testID="profile-scroll"
          >
            <AvatarPickerMenu
              anchor={
                <ProfileHeader
                  avatarUrl={data.profile_picture_url}
                  counts={data.counts}
                  // First item only, for now (#253 review); the header accepts more.
                  favoriteArtists={preferences.data?.artists.slice(0, 1)}
                  favoriteGenres={preferences.data?.genres.slice(0, 1)}
                  favoriteSong={toHeaderSong(data.favorite_song)}
                  name={data.name}
                  onEditAvatar={() => {
                    // One avatar operation at a time, so a DELETE can't land after a newer PUT.
                    if (!uploadAvatar.isPending && !removeAvatar.isPending) {
                      setIsAvatarMenuVisible(true);
                    }
                  }}
                  onPressFollowers={() =>
                    navigation.navigate("Friends", { tab: "seguidores", userId: myUserId })
                  }
                  onPressFollowing={() =>
                    navigation.navigate("Friends", { tab: "seguindo", userId: myUserId })
                  }
                  streakHintSlot={<StreakHint profile={data} />}
                  streakSlot={<StreakBadge profile={data} />}
                  username={data.username}
                  avatarUploadingOverlay={uploadAvatar.isPending}
                />
              }
              hasAvatar={Boolean(data.profile_picture_url)}
              onDismiss={() => setIsAvatarMenuVisible(false)}
              onPick={(uri) => uploadAvatar.mutate(uri)}
              onRemove={() => setIsRemoveDialogVisible(true)}
              visible={isAvatarMenuVisible}
            />
            <RemoveAvatarDialog
              onCancel={() => setIsRemoveDialogVisible(false)}
              onConfirm={() => {
                setIsRemoveDialogVisible(false);
                removeAvatar.mutate();
              }}
              removing={removeAvatar.isPending}
              visible={isRemoveDialogVisible}
            />
            <View style={styles.tabs}>
              <ProfileTabs
                activeTab={activeTab}
                calendarContent={
                  <MemoryCalendarTab onCreateRecorda={() => navigation.navigate("Camera")} />
                }
                metricsContent={
                  <DynamicMetricsDashboard onCreateRecorda={() => navigation.navigate("Camera")} />
                }
                onChange={setActiveTab}
              />
            </View>
            {activeTab === "recordas" ? (
              <View style={styles.tabContent}>
                <RecordaGrid
                  hasNextPage={recordas.hasNextPage}
                  isFetchNextPageError={recordas.isFetchNextPageError}
                  isFetchingNextPage={recordas.isFetchingNextPage}
                  items={recordas.data?.pages.flatMap((page) => page.items) ?? []}
                  onLoadMore={loadMore}
                  onPressItem={(recordaId) =>
                    navigation.navigate("PublishedRecorda", { postId: recordaId })
                  }
                  onRetry={() => void recordas.refetch()}
                  status={gridStatus(recordas)}
                />
              </View>
            ) : null}
          </ScrollView>
        ) : profile.isError && !isIncomplete ? (
          <View style={styles.feedback}>
            <ErrorState message={t("profile.loadError")} />
            <Button
              label={t("profile.retry")}
              onPress={() => void profile.refetch()}
              variant="secondary"
            />
          </View>
        ) : (
          <Loading label={t("profile.loading")} />
        )}
      </SafeAreaView>
      <BottomTabBar activeTab="profile" onPress={handleTabBarPress} />
      <RetrospectiveFlow
        onClose={() => setIsRetrospectiveOpen(false)}
        visible={isRetrospectiveOpen}
      />
    </View>
  );
}

function toHeaderSong(song: ProfileRead["favorite_song"]) {
  return { artistName: song.artist_name, coverUrl: song.cover_url, title: song.title };
}

function gridStatus(query: ReturnType<typeof useProfileRecordas>) {
  if (query.data) return "success";
  return query.isError ? "error" : "pending";
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
  }
});
