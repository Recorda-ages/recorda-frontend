import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Animated, FlatList, Pressable, StyleSheet, View } from "react-native";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { useFollowMutation, type FollowStatus } from "@/features/follow";
import { ApiError, resolveApiAssetUrl, useAuthImageSource } from "@/services/api";
import { colors, fontFamily, spacing } from "@/theme";

import { useUserSuggestions } from "../hooks/useUserSuggestions";
import type { SuggestedUserItem } from "../types";

const AVATAR_SIZE = 64;

type SuggestedProfilesProps = Readonly<{
  onOpenProfile: (userId: string) => void;
}>;

export function SuggestedProfiles({ onOpenProfile }: SuggestedProfilesProps) {
  const { t } = useTranslation();
  const suggestions = useUserSuggestions(true);
  const followMutation = useFollowMutation();
  const [statuses, setStatuses] = useState<Record<string, FollowStatus>>({});
  const [pendingIds, setPendingIds] = useState<string[]>([]);

  if (suggestions.isPending) {
    return (
      <ActivityIndicator
        color={colors.primary[500]}
        style={styles.loading}
        testID="suggested-profiles-loading"
      />
    );
  }

  // A failed or empty suggestion list just stays out of the way of the search.
  if (!suggestions.data?.length) {
    return null;
  }

  const toggleFollow = (userId: string) => {
    if (pendingIds.includes(userId)) return;
    const previous = statuses[userId] ?? "nenhuma";
    const action = previous === "nenhuma" ? "follow" : "unfollow";

    setStatuses((current) => ({
      ...current,
      [userId]: action === "follow" ? "seguindo" : "nenhuma"
    }));
    setPendingIds((current) => [...current, userId]);

    followMutation.mutate(
      { action, userId },
      {
        onError: (error) => {
          // 409 on follow / 404 on unfollow mean the server already has the state we wanted.
          const alreadyApplied =
            error instanceof ApiError &&
            ((action === "follow" && error.status === 409) ||
              (action === "unfollow" && error.status === 404));
          if (!alreadyApplied) {
            setStatuses((current) => ({ ...current, [userId]: previous }));
          }
        },
        onSettled: () => setPendingIds((current) => current.filter((id) => id !== userId)),
        onSuccess: (result) => {
          if (result?.follow_status) {
            setStatuses((current) => ({ ...current, [userId]: result.follow_status }));
          }
        }
      }
    );
  };

  return (
    <View style={styles.section} testID="suggested-profiles">
      <AppText style={styles.title}>{t("userSearch.suggestions")}</AppText>
      <FlatList
        contentContainerStyle={styles.list}
        data={suggestions.data}
        horizontal
        keyExtractor={(item) => item.user_id}
        renderItem={({ item }) => (
          <SuggestedProfile
            item={item}
            onOpen={() => onOpenProfile(item.user_id)}
            onToggleFollow={() => toggleFollow(item.user_id)}
            status={statuses[item.user_id] ?? "nenhuma"}
          />
        )}
        showsHorizontalScrollIndicator={false}
        style={styles.carousel}
      />
    </View>
  );
}

type SuggestedProfileProps = Readonly<{
  item: SuggestedUserItem;
  onOpen: () => void;
  onToggleFollow: () => void;
  status: FollowStatus;
}>;

function SuggestedProfile({ item, onOpen, onToggleFollow, status }: SuggestedProfileProps) {
  const { t } = useTranslation();
  const avatarSource = useAuthImageSource(
    item.avatar_url ? resolveApiAssetUrl(item.avatar_url) : null
  );
  const followLabel =
    status === "seguindo"
      ? t("follow.followingA11y", { username: item.username })
      : status === "solicitado"
        ? t("follow.requestedA11y", { username: item.username })
        : t("follow.followA11y", { username: item.username });

  const [progress] = useState(() => new Animated.Value(1));
  const [animatedStatus, setAnimatedStatus] = useState(status);

  if (animatedStatus !== status) {
    setAnimatedStatus(status);
    progress.setValue(0);
  }

  useEffect(() => {
    Animated.spring(progress, {
      friction: 4,
      tension: 180,
      toValue: 1,
      useNativeDriver: true
    }).start();
  }, [animatedStatus, progress]);

  const badgeScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
  const iconRotation = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["-90deg", "0deg"]
  });

  return (
    <View style={styles.profile}>
      <View>
        <Pressable
          accessibilityLabel={item.username}
          accessibilityRole="button"
          onPress={onOpen}
          testID={`suggested-profile-${item.user_id}`}
        >
          {avatarSource ? (
            <Image contentFit="cover" source={avatarSource} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Icon color={colors.neutrals[400]} size={32} source="account" />
            </View>
          )}
        </Pressable>
        <Animated.View style={[styles.followBadge, { transform: [{ scale: badgeScale }] }]}>
          <Pressable
            accessibilityLabel={followLabel}
            accessibilityRole="button"
            accessibilityState={{ selected: status !== "nenhuma" }}
            hitSlop={6}
            onPress={onToggleFollow}
            style={styles.followBadgeButton}
            testID={`suggested-follow-${item.user_id}`}
          >
            <Animated.View style={{ transform: [{ rotate: iconRotation }] }}>
              <Icon
                color={colors.neutrals[900]}
                size={18}
                source={
                  status === "seguindo"
                    ? "check"
                    : status === "solicitado"
                      ? "clock-outline"
                      : "plus"
                }
              />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
      {/* The carousel has a fixed height; capping the scale keeps large text from being cut. */}
      <AppText maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.username}>
        {item.username}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    borderRadius: AVATAR_SIZE / 2,
    height: AVATAR_SIZE,
    width: AVATAR_SIZE
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[800],
    justifyContent: "center"
  },
  // Explicit height: a horizontal list inside an auto-height parent can collapse to zero
  // on the new architecture. Covers avatar + badge overhang + gap + one line of username.
  carousel: {
    flexGrow: 0,
    height: AVATAR_SIZE + 4 + spacing[2] + 20
  },
  followBadge: {
    backgroundColor: colors.primary[500],
    borderRadius: 13,
    bottom: -2,
    height: 26,
    position: "absolute",
    right: -2,
    width: 26
  },
  followBadgeButton: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center"
  },
  list: {
    gap: spacing[3],
    paddingHorizontal: spacing[4]
  },
  loading: {
    paddingVertical: spacing[4]
  },
  profile: {
    alignItems: "center",
    gap: spacing[2],
    width: AVATAR_SIZE + spacing[2]
  },
  section: {
    flexShrink: 0,
    gap: spacing[3],
    paddingBottom: spacing[2],
    paddingTop: spacing[3]
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 16,
    paddingHorizontal: spacing[4]
  },
  username: {
    color: colors.neutrals[100],
    fontSize: 12,
    maxWidth: AVATAR_SIZE + spacing[2],
    textAlign: "center"
  }
});
