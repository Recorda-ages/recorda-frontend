import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { FlatList, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { AppText, Button, ErrorState, Loading } from "@/components/ui";
import { colors, fontFamily, spacing } from "@/theme";

import { NotificationRow } from "../components/NotificationRow";
import {
  NOTIFICATIONS_QUERY_KEY,
  useMarkAllNotificationsAsRead,
  useNotifications,
  useRespondFollowRequest
} from "../hooks/useNotifications";
import type { NotificationItem } from "../types";

export function NotificationsScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const notifications = useNotifications();
  const { mutate: markAllAsRead } = useMarkAllNotificationsAsRead();
  const respond = useRespondFollowRequest();
  const markedRef = useRef(false);
  const unreadCount = notifications.data?.unread_count ?? 0;

  useEffect(() => {
    if (markedRef.current || !notifications.isSuccess || unreadCount === 0) {
      return;
    }

    markedRef.current = true;
    markAllAsRead();
  }, [markAllAsRead, notifications.isSuccess, unreadCount]);

  useEffect(
    () => () => {
      void queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
    [queryClient]
  );

  const pressHandlerFor = (item: NotificationItem) => {
    if (item.recorda_id && ["COMMENT", "LIKE", "MENTION"].includes(item.type)) {
      const recordaId = item.recorda_id;

      return () => navigation.navigate("RecordaView", { recordaId });
    }

    if (item.type === "NEW_FOLLOWER" || item.type === "FOLLOW_ACCEPTED") {
      return () => navigation.navigate("Profile");
    }

    return undefined;
  };

  const items = notifications.data?.items ?? [];

  return (
    <View style={styles.screen} testID="notifications-screen">
      <StatusBar style="light" />
      <SafeAreaView edges={["top"]} style={styles.content}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel={t("notifications.back")}
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => navigation.goBack()}
            testID="notifications-back"
          >
            <Icon color={colors.neutrals[100]} size={28} source="chevron-left" />
          </Pressable>
          <AppText style={styles.title}>{t("notifications.title")}</AppText>
          <View style={styles.headerSpacer} />
        </View>

        {notifications.isPending ? <Loading label={t("notifications.loading")} /> : null}

        {notifications.isError ? (
          <View style={styles.feedback}>
            <ErrorState message={t("notifications.loadError")} />
            <Button
              label={t("notifications.retry")}
              onPress={() => void notifications.refetch()}
              variant="secondary"
            />
          </View>
        ) : null}

        {notifications.isSuccess ? (
          <FlatList
            data={items}
            keyExtractor={(item) => item.notification_id}
            ListEmptyComponent={
              <AppText style={styles.empty} testID="notifications-empty">
                {t("notifications.empty")}
              </AppText>
            }
            renderItem={({ item }) => (
              <NotificationRow
                item={item}
                onPress={pressHandlerFor(item)}
                onRespond={(decision) => respond.mutate({ decision, notification: item })}
                responding={
                  respond.isPending &&
                  respond.variables?.notification.notification_id === item.notification_id
                }
              />
            )}
            showsVerticalScrollIndicator={false}
          />
        ) : null}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1
  },
  empty: {
    color: colors.neutrals[300],
    padding: spacing[6],
    textAlign: "center"
  },
  feedback: {
    gap: spacing[3],
    padding: spacing[4]
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[4]
  },
  headerSpacer: {
    width: 28
  },
  screen: {
    backgroundColor: colors.neutrals[900],
    flex: 1
  },
  title: {
    color: colors.neutrals[100],
    fontFamily: fontFamily.primary.bold,
    fontSize: 20,
    textAlign: "center"
  }
});
