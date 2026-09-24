import { Image } from "expo-image";
import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, radius, spacing } from "@/theme";

import type { FollowRequestDecision, NotificationItem } from "../types";

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

type NotificationRowProps = Readonly<{
  item: NotificationItem;
  onPress?: () => void;
  onRespond: (decision: FollowRequestDecision) => void;
  responding: boolean;
}>;

export function NotificationRow({ item, onPress, onRespond, responding }: NotificationRowProps) {
  const { t } = useTranslation();
  const elapsed = elapsedSince(item.created_at);
  const username = item.sender?.username;

  return (
    <Pressable
      accessibilityRole={onPress ? "button" : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={`notification-${item.notification_id}`}
    >
      {item.sender?.profile_picture_url ? (
        <Image
          contentFit="cover"
          source={item.sender.profile_picture_url}
          style={styles.avatar}
          transition={150}
        />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <AppText style={styles.avatarInitial}>{username?.charAt(0).toUpperCase()}</AppText>
        </View>
      )}

      <View style={styles.body}>
        <AppText numberOfLines={2} style={styles.message}>
          {username ? <AppText style={styles.username}>{username} </AppText> : null}
          {t(`notifications.types.${item.type}`)}
        </AppText>

        {item.type === "FOLLOW_REQUEST" ? (
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: responding }}
              disabled={responding}
              onPress={() => onRespond("accept")}
              style={[styles.action, styles.accept, responding && styles.disabled]}
              testID={`notification-accept-${item.notification_id}`}
            >
              <AppText style={styles.acceptLabel}>{t("notifications.accept")}</AppText>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: responding }}
              disabled={responding}
              onPress={() => onRespond("decline")}
              style={[styles.action, styles.decline, responding && styles.disabled]}
              testID={`notification-decline-${item.notification_id}`}
            >
              <AppText style={styles.declineLabel}>{t("notifications.decline")}</AppText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <AppText style={styles.time}>{t(`notifications.time.${elapsed.unit}`, elapsed)}</AppText>
    </Pressable>
  );
}

function elapsedSince(createdAt: string) {
  const elapsed = Math.max(0, Date.now() - Date.parse(createdAt));

  if (elapsed < MINUTE_MS) {
    return { count: 0, unit: "now" };
  }

  if (elapsed < HOUR_MS) {
    return { count: Math.floor(elapsed / MINUTE_MS), unit: "minutes" };
  }

  if (elapsed < DAY_MS) {
    return { count: Math.floor(elapsed / HOUR_MS), unit: "hours" };
  }

  return { count: Math.floor(elapsed / DAY_MS), unit: "days" };
}

const styles = StyleSheet.create({
  accept: {
    backgroundColor: colors.primary[500]
  },
  acceptLabel: {
    color: baseColors.black,
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 12
  },
  action: {
    borderRadius: radius.md,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1]
  },
  actions: {
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2]
  },
  avatar: {
    borderRadius: 20,
    height: 40,
    width: 40
  },
  avatarFallback: {
    alignItems: "center",
    backgroundColor: colors.neutrals[700],
    justifyContent: "center"
  },
  avatarInitial: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold
  },
  body: {
    flex: 1
  },
  decline: {
    backgroundColor: colors.neutrals[700]
  },
  declineLabel: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.semiBold,
    fontSize: 12
  },
  disabled: {
    opacity: 0.5
  },
  message: {
    color: colors.neutrals[100],
    fontSize: 13
  },
  pressed: {
    opacity: 0.7
  },
  row: {
    alignItems: "center",
    borderBottomColor: colors.neutrals[700],
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing[3],
    marginHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  time: {
    color: colors.neutrals[300],
    fontSize: 12
  },
  username: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 13
  }
});
