type MockPermissionResponse = {
  canAskAgain: boolean;
  granted: boolean;
  status: "denied" | "granted" | "undetermined";
};

type MockImagePickerAsset = {
  duration?: null | number;
  height: number;
  type?: "image" | "video";
  uri: string;
  width: number;
};

type MockImagePickerResult =
  | {
      assets: MockImagePickerAsset[];
      canceled: false;
    }
  | {
      assets: null;
      canceled: true;
    };

type MockImagePickerOptions = {
  allowsEditing?: boolean;
  allowsMultipleSelection?: boolean;
  aspect?: [number, number];
  mediaTypes?: string[];
  quality?: number;
  selectionLimit?: number;
  videoMaxDuration?: number;
};

const grantedPermission: MockPermissionResponse = {
  canAskAgain: true,
  granted: true,
  status: "granted"
};

export const mockGetMediaLibraryPermissionsAsync = jest.fn<Promise<MockPermissionResponse>, []>();
export const mockRequestMediaLibraryPermissionsAsync = jest.fn<
  Promise<MockPermissionResponse>,
  []
>();
export const mockLaunchImageLibraryAsync = jest.fn<
  Promise<MockImagePickerResult>,
  [MockImagePickerOptions?]
>();
export const mockGetCameraPermissionsAsync = jest.fn<Promise<MockPermissionResponse>, []>();
export const mockRequestCameraPermissionsAsync = jest.fn<Promise<MockPermissionResponse>, []>();
export const mockLaunchCameraAsync = jest.fn<
  Promise<MockImagePickerResult>,
  [MockImagePickerOptions?]
>();

export function resetImagePickerMock() {
  mockGetMediaLibraryPermissionsAsync.mockReset();
  mockGetMediaLibraryPermissionsAsync.mockResolvedValue(grantedPermission);

  mockRequestMediaLibraryPermissionsAsync.mockReset();
  mockRequestMediaLibraryPermissionsAsync.mockResolvedValue(grantedPermission);

  mockLaunchImageLibraryAsync.mockReset();
  mockLaunchImageLibraryAsync.mockResolvedValue({
    assets: null,
    canceled: true
  });

  mockGetCameraPermissionsAsync.mockReset();
  mockGetCameraPermissionsAsync.mockResolvedValue(grantedPermission);

  mockRequestCameraPermissionsAsync.mockReset();
  mockRequestCameraPermissionsAsync.mockResolvedValue(grantedPermission);

  mockLaunchCameraAsync.mockReset();
  mockLaunchCameraAsync.mockResolvedValue({
    assets: null,
    canceled: true
  });
}

resetImagePickerMock();

export const getMediaLibraryPermissionsAsync = mockGetMediaLibraryPermissionsAsync;
export const requestMediaLibraryPermissionsAsync = mockRequestMediaLibraryPermissionsAsync;
export const launchImageLibraryAsync = mockLaunchImageLibraryAsync;
export const getCameraPermissionsAsync = mockGetCameraPermissionsAsync;
export const requestCameraPermissionsAsync = mockRequestCameraPermissionsAsync;
export const launchCameraAsync = mockLaunchCameraAsync;
