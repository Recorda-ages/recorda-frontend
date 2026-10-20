import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import * as ExpoCamera from "expo-camera";
import * as ExpoImagePicker from "expo-image-picker";
import { Alert } from "react-native";
import { I18nextProvider } from "react-i18next";

import { passwordRecoverySchema } from "@/features/auth/validation/passwordRecoverySchema";
import { signInSchema } from "@/features/auth/validation/signInSchema";
import { signUpSchema } from "@/features/auth/validation/signUpSchema";
import { AdminUserActions, UserModerationForm, type AdminUserRow } from "@/features/moderation";
import { musicService } from "@/features/music/services/musicService";
import { OnboardingArtistsScreen } from "@/features/onboarding/screens/OnboardingArtistsScreen";
import { ProfileHeader, ProfilePrivateNotice, ProfileTabs } from "@/features/profile";
import { OnboardingProvider } from "@/features/onboarding/state/OnboardingContext";
import { CameraScreen } from "@/features/recorda-creation/screens/CameraScreen";
import { PreviewScreen } from "@/features/recorda-creation/screens/PreviewScreen";
import { i18n } from "@/i18n";
import en from "@/i18n/locales/en.json";
import ptBR from "@/i18n/locales/pt-BR.json";
import { AUTH_TOKEN_QUERY_KEY } from "@/services/api";

import type * as ExpoCameraMock from "../mocks/expoCamera";
import type * as ExpoImagePickerMock from "../mocks/expoImagePicker";

const expoCameraMock = ExpoCamera as unknown as typeof ExpoCameraMock;
const expoImagePickerMock = ExpoImagePicker as unknown as typeof ExpoImagePickerMock;

jest.mock("@react-navigation/native", () => {
  const actual = jest.requireActual("@react-navigation/native");
  const React = jest.requireActual("react");

  return {
    ...actual,
    useFocusEffect: (effect: () => undefined | (() => void)) => {
      React.useEffect(effect, [effect]);
    },
    useIsFocused: () => true,
    useNavigation: () => ({
      canGoBack: () => true,
      goBack: jest.fn(),
      navigate: jest.fn(),
      reset: jest.fn()
    }),
    useRoute: () => ({ params: { type: "photo", uri: "file://photo.jpg" } })
  };
});

jest.mock("@/features/auth/session", () => ({
  clearSession: jest.fn(async () => undefined)
}));

jest.mock("@/features/music/services/musicService", () => ({
  musicService: {
    getPopularArtists: jest.fn(),
    searchArtists: jest.fn()
  }
}));

jest.mock("@/features/recorda-creation/context/RecordaDraftContext", () => ({
  useRecordaDraft: () => ({ clearMedia: jest.fn(), media: null, setMedia: jest.fn() })
}));

const mockGetPopularArtists = musicService.getPopularArtists as jest.Mock;
const mockSearchArtists = musicService.searchArtists as jest.Mock;

type TranslationTree = { [key: string]: string | TranslationTree };

function flatten(tree: TranslationTree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((result, [key, value]) => {
    const path = `${prefix}${key}`;
    return typeof value === "string"
      ? { ...result, [path]: value }
      : { ...result, ...flatten(value, `${path}.`) };
  }, {});
}

const englishTexts = flatten(en);
const portugueseOnlyTexts = new Set(
  Object.entries(flatten(ptBR))
    .filter(([key, value]) => englishTexts[key] !== value)
    .map(([, value]) => value)
);

type RenderedNode = {
  children: (RenderedNode | string)[] | null;
  props: Record<string, unknown>;
};

function visibleTexts(node: RenderedNode | RenderedNode[] | string | null): string[] {
  if (!node) return [];
  if (typeof node === "string") return [node];
  if (Array.isArray(node)) return node.flatMap(visibleTexts);

  const { accessibilityLabel, placeholder } = node.props;
  const ownTexts = [accessibilityLabel, placeholder].filter(
    (value): value is string => typeof value === "string"
  );

  return [...ownTexts, ...(node.children ?? []).flatMap(visibleTexts)];
}

function expectNoPortuguese() {
  const tree = screen.toJSON() as RenderedNode | RenderedNode[] | null;
  const texts = visibleTexts(tree).map((text) => text.trim());

  expect(texts.filter((text) => portugueseOnlyTexts.has(text))).toEqual([]);
  expect(texts.filter((text) => /[ãõçâêô]/i.test(text))).toEqual([]);
}

function renderArtists() {
  const client = new QueryClient({
    defaultOptions: { queries: { gcTime: Infinity, retry: false } }
  });

  return render(
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={client}>
        <OnboardingProvider>
          <OnboardingArtistsScreen />
        </OnboardingProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
}

async function renderCamera() {
  render(<CameraScreen />);
  await act(async () => undefined);
}

const otherAdmin: AdminUserRow = {
  email: "admin2@recorda.app",
  name: "Other Admin",
  profile_picture_url: null,
  reports_count: 0,
  role: "ADMIN",
  status: "ACTIVE",
  user_id: "admin-2",
  username: "otheradmin"
};

const regularUser: AdminUserRow = {
  ...otherAdmin,
  name: "Regular User",
  role: "USER",
  user_id: "user-1",
  username: "regularuser"
};

describe("screens with the app in English", () => {
  beforeAll(async () => {
    await i18n.changeLanguage("en");
  });

  afterAll(async () => {
    await i18n.changeLanguage("pt-BR");
  });

  beforeEach(() => {
    jest.restoreAllMocks();
    expoCameraMock.resetCameraMock();
    expoImagePickerMock.resetImagePickerMock();
    mockGetPopularArtists.mockResolvedValue([
      { id: 1, name: "Anitta", picture_url: null },
      { id: 2, name: "Djavan", picture_url: null }
    ]);
    mockSearchArtists.mockResolvedValue([]);
  });

  it("shows the artists onboarding step in English", async () => {
    renderArtists();

    expect(await screen.findByText("Anitta")).toBeTruthy();
    expect(screen.getByText("Artists")).toBeTruthy();
    expect(screen.getByText("STEP 1 OF 3")).toBeTruthy();
    expect(screen.getByText("Who is part of your story?")).toBeTruthy();
    expect(
      screen.getByText("Choose at least 3 artists to personalize your memories.")
    ).toBeTruthy();
    expect(screen.getByPlaceholderText("Search artists")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Back" })).toBeTruthy();
    expectNoPortuguese();
  });

  it("shows the artists search feedback in English", async () => {
    renderArtists();
    await screen.findByText("Anitta");

    fireEvent.changeText(screen.getByLabelText("Search artists"), "nobody");

    expect(await screen.findByText("No artists found.")).toBeTruthy();
    expect(screen.getByLabelText("Clear search")).toBeTruthy();

    mockSearchArtists.mockRejectedValueOnce(new Error("offline"));
    fireEvent.changeText(screen.getByLabelText("Search artists"), "offline");

    expect(
      await screen.findByText("Could not search artists. Check your connection.")
    ).toBeTruthy();
    expectNoPortuguese();
  });

  it("shows the popular artists error in English", async () => {
    mockGetPopularArtists.mockRejectedValueOnce(new Error("offline"));
    renderArtists();

    expect(await screen.findByText("Could not load popular artists.")).toBeTruthy();
    expectNoPortuguese();
  });

  it("asks for camera access in English", () => {
    const deniedPermission = {
      canAskAgain: true,
      expires: "never" as const,
      granted: false,
      status: "denied" as ExpoCamera.PermissionStatus
    };
    jest
      .spyOn(ExpoCamera, "useCameraPermissions")
      .mockReturnValue([deniedPermission, jest.fn(), jest.fn()]);

    render(<CameraScreen />);

    expect(
      screen.getByText("We need the camera and microphone to create your Recorda.")
    ).toBeTruthy();
    expect(screen.getByText("Allow access")).toBeTruthy();
    expectNoPortuguese();
  });

  it("labels the capture button in English", async () => {
    await renderCamera();

    expect(screen.getByLabelText("Take photo")).toBeTruthy();
    expectNoPortuguese();
  });

  it("warns about the gallery permission in English", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const deniedPermission = { canAskAgain: false, granted: false, status: "denied" as const };
    expoImagePickerMock.mockGetMediaLibraryPermissionsAsync.mockResolvedValue(deniedPermission);
    expoImagePickerMock.mockRequestMediaLibraryPermissionsAsync.mockResolvedValue(deniedPermission);
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(
        "Permission needed",
        "Allow gallery access to choose a photo or video."
      )
    );
  });

  it("warns about a long video in English", async () => {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    expoImagePickerMock.mockLaunchImageLibraryAsync.mockResolvedValue({
      assets: [{ duration: 90000, height: 100, type: "video", uri: "file://long.mp4", width: 100 }],
      canceled: false
    });
    await renderCamera();

    fireEvent.press(screen.getByTestId("camera-gallery-button"));

    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith("Video too long", "Choose a video up to 60 seconds long.")
    );
  });

  it("shows the preview confirmation in English", () => {
    render(<PreviewScreen />);

    expect(screen.getByRole("button", { name: "Next" })).toBeTruthy();
    expect(screen.getByText("Next")).toBeTruthy();
    expectNoPortuguese();
  });

  it("shows the profile header, tabs and private notice in English", () => {
    const client = new QueryClient({
      defaultOptions: { queries: { gcTime: Infinity, retry: false } }
    });
    client.setQueryData(AUTH_TOKEN_QUERY_KEY, null);
    render(
      <I18nextProvider i18n={i18n}>
        <QueryClientProvider client={client}>
          <ProfileHeader
            avatarUrl={null}
            counts={{ followers: 1, following: 2, recordas: 3 }}
            favoriteSong={{ artistName: "Muse", coverUrl: null, title: "Starlight" }}
            name="Lucas Almeida"
            username="lucas_almeida"
          />
          <ProfileTabs activeTab="recordas" onChange={jest.fn()} />
          <ProfilePrivateNotice />
        </QueryClientProvider>
      </I18nextProvider>
    );

    expect(screen.getByLabelText("1 Follower")).toBeTruthy();
    expect(screen.getByLabelText("3 Recordas")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Metrics" })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Calendar" })).toBeTruthy();
    expect(screen.getByText("This account is private")).toBeTruthy();
    expect(screen.getByText("Follow this profile to see their Recordas.")).toBeTruthy();
    expectNoPortuguese();
  });

  it("shows the account moderation form in English", () => {
    render(
      <UserModerationForm
        action="SUSPEND"
        onCancel={jest.fn()}
        onSubmit={jest.fn()}
        targetUser={regularUser}
      />
    );

    expect(screen.getByText("Suspend Account")).toBeTruthy();
    expect(screen.getByText(/User:/)).toBeTruthy();
    expect(screen.getByText("Reason (required):")).toBeTruthy();
    expect(screen.getByLabelText("Moderation reason")).toBeTruthy();
    expect(
      screen.getByPlaceholderText("Enter the reason for this action (max. 500 characters)...")
    ).toBeTruthy();
    expect(screen.getByText("Mark the profile's open reports as resolved")).toBeTruthy();
    expect(screen.getByText("Cancel")).toBeTruthy();
    expect(screen.getByText("Confirm Suspension")).toBeTruthy();
    expectNoPortuguese();
  });

  it("explains in English that another admin cannot be suspended", () => {
    render(
      <AdminUserActions
        currentAdmin={{ role: "ADMIN", user_id: "admin-1", username: "admin" }}
        targetUser={otherAdmin}
      />
    );

    expect(screen.getByText("Suspending another administrator is not allowed.")).toBeTruthy();
    expectNoPortuguese();
  });

  it("validates the auth forms in English", () => {
    const signIn = signInSchema.safeParse({ password: "", username: "" });
    const signUp = signUpSchema.safeParse({
      email: "invalid",
      name: "",
      password: "short",
      username: "with space"
    });
    const recovery = passwordRecoverySchema.safeParse({
      confirmPassword: "different1",
      email: "",
      newPassword: "password1"
    });

    expect(signIn.error?.issues.map((issue) => issue.message)).toEqual([
      "Enter your password.",
      "Enter your username."
    ]);
    expect(signUp.error?.issues.map((issue) => issue.message)).toEqual([
      "Enter your name.",
      "Your username can't contain spaces.",
      "Enter a valid email.",
      "Your password must be at least 8 characters long."
    ]);
    expect(recovery.error?.issues.map((issue) => issue.message)).toEqual([
      "Enter your email.",
      "Enter a valid email.",
      "The passwords must match."
    ]);
  });
});
