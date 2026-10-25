import { Pressable, StyleSheet, View } from "react-native";
import { useEffect } from "react";
import {
  NavigationContainer,
  useNavigationContainerRef,
  type RouteProp,
  useNavigation,
  useRoute
} from "@react-navigation/native";
import {
  createNativeStackNavigator,
  type NativeStackNavigationProp
} from "@react-navigation/native-stack";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Icon } from "react-native-paper";
import type { PropsWithChildren } from "react";

import { AppText, Button } from "@/components/ui";
import { AccountScreen } from "@/features/account";
import { LanguageSettingsScreen } from "@/features/language";
import {
  AdminAccessGuard,
  AdminAuditLogScreen,
  AdminHomeScreen,
  AdminReportDetailScreen,
  AdminReportsScreen
} from "@/features/admin";
import type { AdminUserRow } from "@/features/admin/types";
import { AdminScreenLayout } from "@/features/admin/components/AdminScreenLayout";
import { AdminUserDetailScreen } from "@/features/admin/users/screens/AdminUserDetailScreen";
import { AdminUsersScreen } from "@/features/admin/users/screens/AdminUsersScreen";
import { ADMIN_USERS_QUERY_KEY } from "@/features/admin/users/queryKeys";
import { adminModerationService } from "@/features/admin/services/adminUserService";
import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useSignOut } from "@/features/auth/hooks/useSignOut";
import { FeedScreen, PublishedRecordaScreen, RecordaIntegrationScreen } from "@/features/feed";
import { useFeedAudioActions } from "@/features/feed/state/FeedAudioContext";
import { NotificationsScreen } from "@/features/notifications";
import { OnboardingArtistsRoute } from "@/features/onboarding/screens/OnboardingArtistsRoute";
import { EditMusicPreferencesRoute } from "@/features/onboarding/screens/EditMusicPreferencesRoute";
import { OnboardingGenresRoute } from "@/features/onboarding/screens/OnboardingGenresRoute";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import { RecordaMusicScreen } from "@/features/recorda-creation/screens/RecordaMusicScreen";
import { FriendsScreen } from "@/features/friends";
import { AdminUserActions } from "@/features/moderation/components/AdminUserActions";
import { RecordaViewScreen } from "@/features/recorda-view";
import { ShareCardScreen } from "@/features/share/screens/ShareCardScreen";
import { SettingsScreen, SettingsPendingScreen } from "@/features/settings";
import { SplashScreen } from "@/features/splash";
import { clearSession } from "@/features/auth/session";
import { onInvalidSession } from "@/services/api/sessionLifecycle";
import { UserSearchScreen } from "@/features/user-search";
import { baseColors, colors, navigationTheme, spacing } from "@/theme";

export type RootStackParamList = {
  Splash: undefined;
  Account: undefined;
  LanguageSettings: undefined;
  Admin: undefined;
  AdminAuditLog: undefined;
  AdminReportDetail: { targetId: string; targetType: "RECORDA" | "USER" };
  AdminReports: undefined;
  AdminUserDetail: { userId: string };
  AdminUsers: undefined;
  Camera: undefined;
  Feed: undefined;
  Login: undefined;
  Notifications: undefined;
  OnboardingArtists: undefined;
  OnboardingGenres: undefined;
  OnboardingMusic: undefined;
  PasswordRecovery: undefined;
  Preview: { uri: string; type: "photo" | "video" };
  Profile: undefined;
  Friends: { userId?: string } | undefined;
  PublishedRecorda: { postId: string };
  RecordaShare: { postId: string };
  RecordaDetails: undefined;
  RecordaMusic: undefined;
  RecordaView: { recordaId: string };
  ShareCard: {
    mediaUri: string;
    mediaType: "photo" | "video";
    songTitle: string;
    artistName: string;
    coverUrl: string | null;
  };
  Settings: { notice?: string } | undefined;
  SettingsPending: { destination: "account" | "music" | "language" };
  EditMusicPreferences: undefined;
  SignUp: undefined;
  UserProfile: { userId: string };
  UserSearch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type SessionPlaceholderScreenProps = PropsWithChildren<{
  testID: string;
  title: string;
}>;

function SettingsRoute() {
  const signOut = useSignOut();
  return <SettingsScreen onSignOut={signOut} />;
}

function SessionPlaceholderScreen({ children, testID, title }: SessionPlaceholderScreenProps) {
  const { t } = useTranslation();
  const signOut = useSignOut();
  return (
    <View style={styles.placeholder} testID={testID}>
      <AppText style={styles.placeholderTitle} variant="headline3">
        {title}
      </AppText>
      {children}
      <Button label={t("auth.signOut")} onPress={() => void signOut()} testID="sign-out-button" />
    </View>
  );
}

function ProfilePlaceholderScreen() {
  const { t } = useTranslation();

  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  return (
    <SessionPlaceholderScreen testID="profile-screen" title={t("profile.title")}>
      <Pressable
        accessibilityLabel={t("settings.title")}
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => navigation.navigate("Settings")}
        style={styles.settingsButton}
      >
        <Icon color={colors.neutrals[100]} size={28} source="cog-outline" />
      </Pressable>
    </SessionPlaceholderScreen>
  );
}

function AdminHomeRoute() {
  return (
    <AdminAccessGuard>
      <AdminHomeScreen />
    </AdminAccessGuard>
  );
}

function AdminReportsRoute() {
  return (
    <AdminAccessGuard>
      <AdminReportsScreen />
    </AdminAccessGuard>
  );
}

function AdminUsersRoute() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  const renderModerationActions = (user: AdminUserRow) => (
    <View style={styles.userModerationActions}>
      <AdminUserActions
        compact
        currentAdmin={
          currentUser
            ? {
                role: currentUser.role,
                user_id: currentUser.user_id,
                username: currentUser.username
              }
            : null
        }
        moderationService={adminModerationService}
        onMutationSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
          void queryClient.invalidateQueries({
            queryKey: [...ADMIN_USERS_QUERY_KEY, "detail"]
          });
        }}
        targetUser={user}
      />
    </View>
  );

  return (
    <AdminAccessGuard>
      <AdminScreenLayout
        activeTab="users"
        showBackButton={false}
        showUsername={false}
        title={t("admin.users.title")}
        testID="admin-users-route"
        visibleTabs={["users", "reports"]}
      >
        <AdminUsersScreen
          onViewHistory={(userId) => navigation.navigate("AdminUserDetail", { userId })}
          renderModerationActions={renderModerationActions}
        />
      </AdminScreenLayout>
    </AdminAccessGuard>
  );
}

function AdminReportDetailRoute() {
  const route = useRoute<RouteProp<RootStackParamList, "AdminReportDetail">>();

  return (
    <AdminAccessGuard>
      <AdminReportDetailScreen
        targetId={route.params.targetId}
        targetType={route.params.targetType}
      />
    </AdminAccessGuard>
  );
}

function AdminUserDetailRoute() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "AdminUserDetail">>();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate("AdminUsers");
  };
  const renderModerationActions = (user: AdminUserRow) => (
    <View style={styles.userModerationActions}>
      <AdminUserActions
        currentAdmin={
          currentUser
            ? {
                role: currentUser.role,
                user_id: currentUser.user_id,
                username: currentUser.username
              }
            : null
        }
        moderationService={adminModerationService}
        onMutationSuccess={() => {
          void queryClient.invalidateQueries({ queryKey: ADMIN_USERS_QUERY_KEY });
          void queryClient.invalidateQueries({
            queryKey: [...ADMIN_USERS_QUERY_KEY, "detail"]
          });
        }}
        targetUser={user}
      />
    </View>
  );

  return (
    <AdminAccessGuard>
      <AdminScreenLayout
        activeTab="users"
        back={{ label: t("admin.userDetail.back"), onPress: goBack }}
        showUsername={false}
        title={t("admin.userDetail.title")}
        testID="admin-user-detail-route"
        visibleTabs={["users", "reports"]}
      >
        <AdminUserDetailScreen
          onBack={goBack}
          onCopyUserId={async (userId) => {
            const { setStringAsync } = await import("expo-clipboard");
            const copied = await setStringAsync(userId);
            if (!copied) throw new Error("Clipboard unavailable.");
          }}
          renderModerationActions={renderModerationActions}
          userId={route.params.userId}
        />
      </AdminScreenLayout>
    </AdminAccessGuard>
  );
}

function AdminAuditLogRoute() {
  return (
    <AdminAccessGuard>
      <AdminAuditLogScreen />
    </AdminAccessGuard>
  );
}

function UserProfilePlaceholderScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "UserProfile">>();

  return (
    <View style={styles.placeholder} testID="user-profile-screen">
      <AppText style={styles.placeholderTitle} variant="headline3">
        {t("profile.title")}
      </AppText>
      <AppText style={styles.placeholderTitle}>{route.params.userId}</AppText>
      <Button label={t("userSearch.back")} onPress={() => navigation.goBack()} />
    </View>
  );
}

export function RootNavigator() {
  const { setActiveRoute } = useFeedAudioActions();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  useEffect(
    () =>
      onInvalidSession(() => {
        void clearSession().then(() => {
          if (navigationRef.isReady()) {
            navigationRef.reset({ index: 0, routes: [{ name: "Login" }] });
          }
        });
      }),
    [navigationRef]
  );
  // A prévia só toca no Feed e nos Detalhes; sair para qualquer outra tela
  // silencia. `onReady` cobre a rota inicial, que `onStateChange` não emite.
  const syncActiveRoute = () => setActiveRoute(navigationRef.getCurrentRoute()?.name);

  return (
    <NavigationContainer
      onReady={syncActiveRoute}
      onStateChange={syncActiveRoute}
      ref={navigationRef}
      theme={navigationTheme}
    >
      <Stack.Navigator initialRouteName="Splash" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="Login" component={SignInScreen} />
        <Stack.Screen name="PasswordRecovery" component={PasswordRecoveryScreen} />
        <Stack.Screen name="OnboardingArtists" component={OnboardingArtistsRoute} />
        <Stack.Screen name="OnboardingGenres" component={OnboardingGenresRoute} />
        <Stack.Screen name="OnboardingMusic" component={OnboardingMusicRoute} />
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PublishedRecorda" component={PublishedRecordaScreen} />
        <Stack.Screen name="RecordaShare" component={RecordaIntegrationScreen} />
        <Stack.Screen name="Profile" component={ProfilePlaceholderScreen} />
        <Stack.Screen name="Settings" component={SettingsRoute} />
        <Stack.Screen name="SettingsPending" component={SettingsPendingScreen} />
        <Stack.Screen name="EditMusicPreferences" component={EditMusicPreferencesRoute} />
        <Stack.Screen name="Account" component={AccountScreen} />
        <Stack.Screen name="LanguageSettings" component={LanguageSettingsScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Admin" component={AdminHomeRoute} />
        <Stack.Screen name="AdminReports" component={AdminReportsRoute} />
        <Stack.Screen name="AdminReportDetail" component={AdminReportDetailRoute} />
        <Stack.Screen name="AdminUsers" component={AdminUsersRoute} />
        <Stack.Screen name="AdminUserDetail" component={AdminUserDetailRoute} />
        <Stack.Screen name="AdminAuditLog" component={AdminAuditLogRoute} />
        <Stack.Screen name="Camera" component={CameraScreen} />
        <Stack.Screen name="Preview" component={PreviewScreen} />
        <Stack.Screen name="RecordaMusic" component={RecordaMusicScreen} />
        <Stack.Screen name="RecordaDetails" component={RecordaDetailsScreen} />
        <Stack.Screen name="RecordaView" component={RecordaViewScreen} />
        <Stack.Screen name="ShareCard" component={ShareCardScreen} />
        <Stack.Screen name="UserSearch" component={UserSearchScreen} />
        <Stack.Screen name="UserProfile" component={UserProfilePlaceholderScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: "center",
    backgroundColor: baseColors.black,
    flex: 1,
    gap: spacing[6],
    justifyContent: "center",
    paddingHorizontal: spacing[6]
  },
  settingsButton: {
    position: "absolute",
    top: spacing[8],
    right: spacing[5],
    minHeight: 48,
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center"
  },
  placeholderTitle: {
    color: colors.neutrals[100]
  },
  userModerationActions: { width: "100%" }
});
