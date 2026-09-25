import { Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";

import { AppText } from "@/components/ui";
import { baseColors, colors, fontFamily, spacing } from "@/theme";

const MAX_BADGE = 99;

type FeedHeaderProps = Readonly<{
  onNotificationsPress: () => void;
  unreadCount: number;
}>;

export function FeedHeader({ onNotificationsPress, unreadCount }: FeedHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.header}>
      <AppText style={styles.logo}>{t("feed.logo")}</AppText>
      <View style={styles.actions}>
        <Pressable
          accessibilityLabel={
            unreadCount > 0
              ? t("feed.notificationsUnread", { count: unreadCount })
              : t("feed.notifications")
          }
          accessibilityRole="button"
          hitSlop={8}
          onPress={onNotificationsPress}
          testID="feed-notifications-button"
        >
          <Icon color={colors.primary[500]} size={26} source="bell-outline" />
          {unreadCount > 0 ? (
            <View style={styles.badge} testID="feed-notifications-badge">
              <AppText style={styles.badgeLabel}>
                {unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : unreadCount}
              </AppText>
            </View>
          ) : null}
        </Pressable>
        <Pressable accessibilityLabel={t("feed.search")} accessibilityRole="button" hitSlop={8}>
          <Icon color={colors.primary[500]} size={26} source="magnify" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: "row",
    gap: spacing[4]
  },
  badge: {
    alignItems: "center",
    backgroundColor: colors.primary[500],
    borderRadius: 9,
    height: 18,
    justifyContent: "center",
    minWidth: 18,
    paddingHorizontal: spacing[1],
    position: "absolute",
    right: -8,
    top: -6
  },
  badgeLabel: {
    color: baseColors.black,
    fontFamily: fontFamily.primary.bold,
    fontSize: 11
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3]
  },
  logo: {
    color: colors.primary[500],
    fontFamily: fontFamily.display.boldItalic,
    fontSize: 28
  }
});
