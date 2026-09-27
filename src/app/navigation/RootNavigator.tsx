import { StyleSheet, View } from "react-native";
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
import { useTranslation } from "react-i18next";

import { AppText, Button } from "@/components/ui";
import { PasswordRecoveryScreen } from "@/features/auth/screens/PasswordRecoveryScreen";
import { SignInScreen } from "@/features/auth/screens/SignInScreen";
import { SignUpScreen } from "@/features/auth/screens/SignUpScreen";
import { clearSession } from "@/features/auth/session";
import { FeedScreen, PublishedRecordaScreen, RecordaIntegrationScreen } from "@/features/feed";
import { useFeedAudio } from "@/features/feed/state/FeedAudioContext";
import { NotificationsScreen } from "@/features/notifications";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { OnboardingGenresRoute } from "@/features/onboarding/screens/OnboardingGenresRoute";
import { OnboardingMusicRoute } from "@/features/onboarding/screens/OnboardingMusicRoute";
import { useOnboarding } from "@/features/onboarding/state/OnboardingContext";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { RecordaDetailsScreen } from "@/features/recorda-creation/screens/RecordaDetailsScreen";
import { RecordaMusicScreen } from "@/features/recorda-creation/screens/RecordaMusicScreen";
import { FriendsScreen } from "@/features/friends";
import { RecordaViewScreen } from "@/features/recorda-view";
import { ShareCardScreen } from "@/features/share/screens/ShareCardScreen";
import { SplashScreen } from "@/features/splash";
import { UserSearchScreen } from "@/features/user-search";
import { baseColors, colors, navigationTheme, spacing } from "@/theme";

export type RootStackParamList = {
  Splash: undefined;
  Admin: undefined;
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
  RecordaReport: { postId: string };
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
  SignUp: undefined;
  UserProfile: { userId: string };
  UserSearch: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

type SessionPlaceholderScreenProps = {
  testID: string;
  title: string;
};

function SessionPlaceholderScreen({ testID, title }: SessionPlaceholderScreenProps) {
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const onboarding = useOnboarding();
  const recordaDraft = useRecordaDraft();

  const signOut = async () => {
    await clearSession();
    onboarding.reset();
    recordaDraft.reset();
    navigation.reset({ index: 0, routes: [{ name: "Login" }] });
  };

  return (
    <View style={styles.placeholder} testID={testID}>
      <AppText style={styles.placeholderTitle} variant="headline3">
        {title}
      </AppText>
      <Button label={t("auth.signOut")} onPress={() => void signOut()} testID="sign-out-button" />
    </View>
  );
}

function AdminPlaceholderScreen() {
  const { t } = useTranslation();

  return <SessionPlaceholderScreen testID="admin-screen" title={t("admin.title")} />;
}

function ProfilePlaceholderScreen() {
  const { t } = useTranslation();

  return <SessionPlaceholderScreen testID="profile-screen" title={t("profile.title")} />;
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
  const { setActiveRoute } = useFeedAudio();
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
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
        <Stack.Screen name="OnboardingArtists" component={OnboardingArtistsScreen} />
        <Stack.Screen name="OnboardingGenres" component={OnboardingGenresRoute} />
        <Stack.Screen name="OnboardingMusic" component={OnboardingMusicRoute} />
        <Stack.Screen name="Feed" component={FeedScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="PublishedRecorda" component={PublishedRecordaScreen} />
        <Stack.Screen name="RecordaShare" component={RecordaIntegrationScreen} />
        <Stack.Screen name="RecordaReport" component={RecordaIntegrationScreen} />
        <Stack.Screen name="Profile" component={ProfilePlaceholderScreen} />
        <Stack.Screen name="Friends" component={FriendsScreen} />
        <Stack.Screen name="Admin" component={AdminPlaceholderScreen} />
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
  placeholderTitle: {
    color: colors.neutrals[100]
  }
});
