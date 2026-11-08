import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { useTranslation } from "react-i18next";
import { Alert, Linking, Platform } from "react-native";
import { Menu } from "react-native-paper";

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.8;

type AvatarPickerMenuProps = {
  anchor: React.ReactElement;
  hasAvatar: boolean;
  onDismiss: () => void;
  onPick: (localUri: string) => void;
  onRemove: () => void;
  visible: boolean;
};

/**
 * Menu opened when the user taps the avatar edit button (US28).
 * Captures or selects a square image, compresses to 512×512 JPEG.
 * Handles permission denial with an openSettings shortcut.
 */
export function AvatarPickerMenu({
  anchor,
  hasAvatar,
  onDismiss,
  onPick,
  onRemove,
  visible
}: AvatarPickerMenuProps) {
  const { t } = useTranslation();

  async function compress(uri: string): Promise<string> {
    const context = ImageManipulator.manipulate(uri);
    context.resize({ height: AVATAR_SIZE, width: AVATAR_SIZE });
    const image = await context.renderAsync();
    const result = await image.saveAsync({ compress: AVATAR_QUALITY, format: SaveFormat.JPEG });
    image.release();
    context.release();
    return result.uri;
  }

  function showPermissionDenied(titleKey: string, messageKey: string) {
    Alert.alert(t(titleKey), t(messageKey), [
      { style: "cancel", text: t("profile.avatarPermissionCancel") },
      { onPress: () => void Linking.openSettings(), text: t("profile.avatarPermissionSettings") }
    ]);
  }

  async function takePhoto() {
    onDismiss();

    if (Platform.OS === "web") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.capture = "environment";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const uri = URL.createObjectURL(file);
        const compressedUri = await compress(uri);
        onPick(compressedUri);
      };
      input.click();
      return;
    }

    const current = await ImagePicker.getCameraPermissionsAsync();
    const permission = current.granted
      ? current
      : await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      showPermissionDenied(
        "profile.avatarCameraPermissionTitle",
        "profile.avatarCameraPermissionMessage"
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 1
    });

    if (result.canceled || !result.assets[0]) return;

    const compressedUri = await compress(result.assets[0].uri);
    onPick(compressedUri);
  }

  async function chooseFromGallery() {
    onDismiss();
    const current = await ImagePicker.getMediaLibraryPermissionsAsync();
    const permission = current.granted
      ? current
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      showPermissionDenied(
        "profile.avatarGalleryPermissionTitle",
        "profile.avatarGalleryPermissionMessage"
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ["images"],
      quality: 1
    });

    if (result.canceled || !result.assets[0]) return;

    const compressedUri = await compress(result.assets[0].uri);
    onPick(compressedUri);
  }

  function handleRemove() {
    onDismiss();
    onRemove();
  }

  return (
    <Menu anchor={anchor} onDismiss={onDismiss} visible={visible}>
      <Menu.Item
        leadingIcon="camera"
        onPress={() => void takePhoto()}
        testID="avatar-menu-camera"
        title={t("profile.avatarMenuCamera")}
      />
      <Menu.Item
        leadingIcon="image"
        onPress={() => void chooseFromGallery()}
        testID="avatar-menu-gallery"
        title={t("profile.avatarMenuGallery")}
      />
      {hasAvatar ? (
        <Menu.Item
          leadingIcon="delete"
          onPress={handleRemove}
          testID="avatar-menu-remove"
          title={t("profile.avatarMenuRemove")}
        />
      ) : null}
    </Menu>
  );
}
