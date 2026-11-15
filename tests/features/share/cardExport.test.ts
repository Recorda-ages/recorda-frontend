import * as MediaLibrary from "expo-media-library";
import * as Sharing from "expo-sharing";

import {
  saveCardToGallery,
  shareCardToInstagramStories
} from "@/features/share/services/cardExport";

jest.mock("expo-media-library", () => ({
  requestPermissionsAsync: jest.fn(),
  Asset: { create: jest.fn() }
}));

jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn()
}));

const requestPermissions = MediaLibrary.requestPermissionsAsync as jest.Mock;
const createAsset = MediaLibrary.Asset.create as jest.Mock;
const isSharingAvailable = Sharing.isAvailableAsync as jest.Mock;
const shareAsync = Sharing.shareAsync as jest.Mock;
const previousMetaAppId = process.env.EXPO_PUBLIC_META_APP_ID;

describe("card export without Meta App ID", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.EXPO_PUBLIC_META_APP_ID;
    isSharingAvailable.mockResolvedValue(true);
    shareAsync.mockResolvedValue(undefined);
    createAsset.mockResolvedValue(undefined);
  });

  afterAll(() => {
    if (previousMetaAppId === undefined) {
      delete process.env.EXPO_PUBLIC_META_APP_ID;
    } else {
      process.env.EXPO_PUBLIC_META_APP_ID = previousMetaAppId;
    }
  });

  it("opens the system share sheet when there is no Meta App ID", async () => {
    await expect(shareCardToInstagramStories("file://card.png")).resolves.toBe("fallback");

    expect(shareAsync).toHaveBeenCalledWith(
      "file://card.png",
      expect.objectContaining({ mimeType: "image/png" })
    );
  });

  it("saves the card after write-only gallery permission is granted", async () => {
    requestPermissions.mockResolvedValue({ granted: true });

    await expect(saveCardToGallery("file://card.png")).resolves.toBe("saved");

    expect(requestPermissions).toHaveBeenCalledWith(true, ["photo"]);
    expect(createAsset).toHaveBeenCalledWith("file://card.png");
  });

  it("does not save the card when gallery permission is denied", async () => {
    requestPermissions.mockResolvedValue({ granted: false });

    await expect(saveCardToGallery("file://card.png")).resolves.toBe("permission-denied");

    expect(createAsset).not.toHaveBeenCalled();
  });
});
