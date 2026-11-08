import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react-native";
import * as ExpoImageManipulator from "expo-image-manipulator";
import * as ExpoImagePicker from "expo-image-picker";
import { I18nextProvider } from "react-i18next";
import type { PropsWithChildren } from "react";
import { Alert } from "react-native";
import { PaperProvider } from "react-native-paper";

import { ToastProvider } from "@/components/ui/ToastProvider";
import { AvatarPickerMenu } from "@/features/profile/components/AvatarPickerMenu";
import { RemoveAvatarDialog } from "@/features/profile/components/RemoveAvatarDialog";
import { useRemoveAvatarMutation } from "@/features/profile/hooks/useRemoveAvatarMutation";
import { useUploadAvatarMutation } from "@/features/profile/hooks/useUploadAvatarMutation";
import { profileQueryKey } from "@/features/profile/queryKeys";
import { profileService } from "@/features/profile/services/profileService";
import { i18n } from "@/i18n";
import { paperTheme } from "@/theme";

import type * as ExpoImageManipulatorMock from "../../mocks/expoImageManipulator";
import type * as ExpoImagePickerMock from "../../mocks/expoImagePicker";

const imageManipulatorMock = ExpoImageManipulator as unknown as typeof ExpoImageManipulatorMock;
const imagePickerMock = ExpoImagePicker as unknown as typeof ExpoImagePickerMock;

jest.mock("@/features/profile/services/profileService", () => ({
  profileService: {
    uploadAvatar: jest.fn(),
    deleteAvatar: jest.fn(),
    getMyProfile: jest.fn(),
    getUserRecordas: jest.fn()
  }
}));

const mockedUploadAvatar = profileService.uploadAvatar as jest.Mock;
const mockedDeleteAvatar = profileService.deleteAvatar as jest.Mock;

const USER_ID = "user-123";
const EXISTING_AVATAR_URL = "https://cdn.example.com/avatar.jpg";
const LOCAL_URI = "file:///tmp/picked.jpg";
const COMPRESSED_URI = "file://compressed.jpg";
const SERVER_URL = "https://cdn.example.com/new-avatar.jpg";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      mutations: { gcTime: Infinity, retry: false },
      queries: { gcTime: Infinity, retry: false }
    }
  });
}

function makeWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: PropsWithChildren) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <PaperProvider theme={paperTheme}>
            <ToastProvider>{children}</ToastProvider>
          </PaperProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  };
}

const BASE_PROFILE = {
  can_view_content: true,
  counts: null,
  favorite_song: {
    artist_name: "",
    cover_url: "",
    deezer_track_id: "",
    preview_url: null,
    title: ""
  },
  is_private: false,
  name: "Test",
  profile_picture_url: EXISTING_AVATAR_URL,
  relationship: { follow_id: null, follow_status: "nenhuma" as const, is_self: true },
  streak: null,
  user_id: USER_ID,
  username: "test"
};

describe("AvatarPickerMenu", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    imagePickerMock.resetImagePickerMock();
    imageManipulatorMock.resetImageManipulatorMock();
  });

  afterEach(() => {
    queryClient.clear();
  });

  function renderMenu({
    hasAvatar = true,
    onPick = jest.fn(),
    onRemove = jest.fn()
  }: Partial<{
    hasAvatar: boolean;
    onPick: jest.Mock;
    onRemove: jest.Mock;
  }> = {}) {
    return render(
      <AvatarPickerMenu
        anchor={<></>}
        hasAvatar={hasAvatar}
        onDismiss={jest.fn()}
        onPick={onPick}
        onRemove={onRemove}
        visible={true}
      />,
      { wrapper: makeWrapper(queryClient) }
    );
  }

  describe("menu items visibility", () => {
    it("shows camera, gallery and remove when user has a photo", () => {
      renderMenu({ hasAvatar: true });
      expect(screen.getByTestId("avatar-menu-camera")).toBeTruthy();
      expect(screen.getByTestId("avatar-menu-gallery")).toBeTruthy();
      expect(screen.getByTestId("avatar-menu-remove")).toBeTruthy();
    });

    it("hides remove when user has no photo", () => {
      renderMenu({ hasAvatar: false });
      expect(screen.queryByTestId("avatar-menu-remove")).toBeNull();
    });
  });

  describe("gallery pick", () => {
    it("calls onPick with the compressed URI after the user picks an image", async () => {
      imagePickerMock.mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        assets: [{ height: 1000, uri: LOCAL_URI, width: 1000 }],
        canceled: false
      });
      const onPick = jest.fn();
      renderMenu({ onPick });

      await act(async () => {
        fireEvent.press(screen.getByTestId("avatar-menu-gallery"));
      });

      await waitFor(() => expect(onPick).toHaveBeenCalledWith(COMPRESSED_URI));
    });

    it("does not call onPick when the user cancels", async () => {
      imagePickerMock.mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        assets: null,
        canceled: true
      });
      const onPick = jest.fn();
      renderMenu({ onPick });

      await act(async () => {
        fireEvent.press(screen.getByTestId("avatar-menu-gallery"));
      });

      expect(onPick).not.toHaveBeenCalled();
    });

    it("shows a settings alert when gallery permission is denied", async () => {
      imagePickerMock.mockGetMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        canAskAgain: false,
        granted: false,
        status: "denied"
      });
      imagePickerMock.mockRequestMediaLibraryPermissionsAsync.mockResolvedValueOnce({
        canAskAgain: false,
        granted: false,
        status: "denied"
      });
      const alertSpy = jest.spyOn(Alert, "alert");
      renderMenu();

      await act(async () => {
        fireEvent.press(screen.getByTestId("avatar-menu-gallery"));
      });

      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      alertSpy.mockRestore();
    });
  });

  describe("camera pick", () => {
    it("calls onPick with the compressed URI after the user takes a photo", async () => {
      imagePickerMock.mockLaunchCameraAsync.mockResolvedValueOnce({
        assets: [{ height: 1000, uri: LOCAL_URI, width: 1000 }],
        canceled: false
      });
      const onPick = jest.fn();
      renderMenu({ onPick });

      await act(async () => {
        fireEvent.press(screen.getByTestId("avatar-menu-camera"));
      });

      await waitFor(() => expect(onPick).toHaveBeenCalledWith(COMPRESSED_URI));
    });

    it("shows a settings alert when camera permission is denied", async () => {
      imagePickerMock.mockGetCameraPermissionsAsync.mockResolvedValueOnce({
        canAskAgain: false,
        granted: false,
        status: "denied"
      });
      imagePickerMock.mockRequestCameraPermissionsAsync.mockResolvedValueOnce({
        canAskAgain: false,
        granted: false,
        status: "denied"
      });
      const alertSpy = jest.spyOn(Alert, "alert");
      renderMenu();

      await act(async () => {
        fireEvent.press(screen.getByTestId("avatar-menu-camera"));
      });

      await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
      alertSpy.mockRestore();
    });
  });

  describe("image compression", () => {
    it("passes resize(512×512) and JPEG quality 0.8 to the manipulator", async () => {
      imagePickerMock.mockLaunchImageLibraryAsync.mockResolvedValueOnce({
        assets: [{ height: 2000, uri: LOCAL_URI, width: 2000 }],
        canceled: false
      });
      renderMenu({ onPick: jest.fn() });

      await act(async () => {
        fireEvent.press(screen.getByTestId("avatar-menu-gallery"));
      });

      await waitFor(() => {
        expect(imageManipulatorMock.mockManipulate).toHaveBeenCalledWith(LOCAL_URI);
        expect(imageManipulatorMock.mockResize).toHaveBeenCalledWith({ height: 512, width: 512 });
        expect(imageManipulatorMock.mockSaveAsync).toHaveBeenCalledWith({
          compress: 0.8,
          format: "jpeg"
        });
      });
    });
  });

  describe("remove option", () => {
    it("calls onRemove when the user presses Remove photo", () => {
      const onRemove = jest.fn();
      renderMenu({ hasAvatar: true, onRemove });
      fireEvent.press(screen.getByTestId("avatar-menu-remove"));
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });
});

describe("useUploadAvatarMutation (optimistic update)", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    mockedUploadAvatar.mockReset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  function seedProfile(avatarUrl: string | null) {
    queryClient.setQueryData(profileQueryKey(USER_ID), {
      ...BASE_PROFILE,
      profile_picture_url: avatarUrl
    });
  }

  it("shows local URI optimistically before the server responds", async () => {
    seedProfile(EXISTING_AVATAR_URL);

    let resolveUpload!: (value: { profile_picture_url: string }) => void;
    mockedUploadAvatar.mockReturnValueOnce(
      new Promise((res) => {
        resolveUpload = res;
      })
    );

    const { result } = renderHook(() => useUploadAvatarMutation(USER_ID), {
      wrapper: makeWrapper(queryClient)
    });

    act(() => {
      result.current.mutate(LOCAL_URI);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<{ profile_picture_url: string | null }>(
        profileQueryKey(USER_ID)
      );
      expect(cached?.profile_picture_url).toBe(LOCAL_URI);
    });

    await act(async () => {
      resolveUpload({ profile_picture_url: SERVER_URL });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<{ profile_picture_url: string | null }>(
        profileQueryKey(USER_ID)
      );
      expect(cached?.profile_picture_url).toBe(SERVER_URL);
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("rolls back to the previous avatar on error", async () => {
    seedProfile(EXISTING_AVATAR_URL);
    mockedUploadAvatar.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useUploadAvatarMutation(USER_ID), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      result.current.mutate(LOCAL_URI);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<{ profile_picture_url: string | null }>(
      profileQueryKey(USER_ID)
    );
    expect(cached?.profile_picture_url).toBe(EXISTING_AVATAR_URL);
  });

  it("offers 'try again' on upload failure, which resends the same photo", async () => {
    seedProfile(EXISTING_AVATAR_URL);
    mockedUploadAvatar
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce({ profile_picture_url: SERVER_URL });
    const alertSpy = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);

    const { result } = renderHook(() => useUploadAvatarMutation(USER_ID), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      result.current.mutate(LOCAL_URI);
    });

    await waitFor(() => expect(alertSpy).toHaveBeenCalledTimes(1));
    const buttons = alertSpy.mock.calls[0]?.[2] ?? [];
    const retry = buttons.find((button) => button.text === i18n.t("profile.retry"));

    await act(async () => {
      retry?.onPress?.();
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<{ profile_picture_url: string | null }>(
        profileQueryKey(USER_ID)
      );
      expect(cached?.profile_picture_url).toBe(SERVER_URL);
      expect(result.current.isSuccess).toBe(true);
    });
    expect(mockedUploadAvatar).toHaveBeenNthCalledWith(2, LOCAL_URI);
    alertSpy.mockRestore();
  });
});

describe("useRemoveAvatarMutation", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = makeQueryClient();
    mockedDeleteAvatar.mockReset();
  });

  afterEach(() => {
    queryClient.clear();
  });

  function seedProfile(avatarUrl: string | null) {
    queryClient.setQueryData(profileQueryKey(USER_ID), {
      ...BASE_PROFILE,
      profile_picture_url: avatarUrl
    });
  }

  it("sets profile_picture_url to null on success", async () => {
    seedProfile(EXISTING_AVATAR_URL);
    mockedDeleteAvatar.mockResolvedValueOnce(null);

    const { result } = renderHook(() => useRemoveAvatarMutation(USER_ID), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    const cached = queryClient.getQueryData<{ profile_picture_url: string | null }>(
      profileQueryKey(USER_ID)
    );
    expect(cached?.profile_picture_url).toBeNull();
  });

  it("rolls back to the previous avatar on error", async () => {
    seedProfile(EXISTING_AVATAR_URL);
    mockedDeleteAvatar.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRemoveAvatarMutation(USER_ID), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<{ profile_picture_url: string | null }>(
      profileQueryKey(USER_ID)
    );
    expect(cached?.profile_picture_url).toBe(EXISTING_AVATAR_URL);
  });

  it("shows an error toast on delete failure", async () => {
    seedProfile(EXISTING_AVATAR_URL);
    mockedDeleteAvatar.mockRejectedValueOnce(new Error("Network error"));

    const { result } = renderHook(() => useRemoveAvatarMutation(USER_ID), {
      wrapper: makeWrapper(queryClient)
    });

    await act(async () => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("RemoveAvatarDialog", () => {
  it("renders the confirmation copy when visible", () => {
    render(
      <RemoveAvatarDialog
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
        removing={false}
        visible={true}
      />,
      { wrapper: makeWrapper(makeQueryClient()) }
    );

    expect(screen.getByTestId("remove-avatar-dialog")).toBeTruthy();
    expect(screen.getByTestId("remove-avatar-cancel")).toBeTruthy();
    expect(screen.getByTestId("remove-avatar-confirm")).toBeTruthy();
  });

  it("calls onConfirm when the confirm button is pressed", () => {
    const onConfirm = jest.fn();
    render(
      <RemoveAvatarDialog
        onCancel={jest.fn()}
        onConfirm={onConfirm}
        removing={false}
        visible={true}
      />,
      { wrapper: makeWrapper(makeQueryClient()) }
    );

    fireEvent.press(screen.getByTestId("remove-avatar-confirm"));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when the cancel button is pressed", () => {
    const onCancel = jest.fn();
    render(
      <RemoveAvatarDialog
        onCancel={onCancel}
        onConfirm={jest.fn()}
        removing={false}
        visible={true}
      />,
      { wrapper: makeWrapper(makeQueryClient()) }
    );

    fireEvent.press(screen.getByTestId("remove-avatar-cancel"));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("disables both buttons while removing", () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    render(
      <RemoveAvatarDialog
        onCancel={onCancel}
        onConfirm={onConfirm}
        removing={true}
        visible={true}
      />,
      { wrapper: makeWrapper(makeQueryClient()) }
    );

    fireEvent.press(screen.getByTestId("remove-avatar-confirm"));
    fireEvent.press(screen.getByTestId("remove-avatar-cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});
