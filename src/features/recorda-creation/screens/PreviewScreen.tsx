import { Ionicons } from "@expo/vector-icons";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { useVideoPlayer, VideoView } from "expo-video";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "@/app/navigation/RootNavigator";
import { Button } from "@/components/ui";
import { useRecordaDraft } from "@/features/recorda-creation/context/RecordaDraftContext";

export function PreviewScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, "Preview">>();
  const { type, uri } = route.params;
  const { setMedia } = useRecordaDraft();

  const player = useVideoPlayer(uri, (playerInstance) => {
    playerInstance.loop = true;
    playerInstance.play();
  });

  function handleDiscard() {
    navigation.goBack();
  }

  async function handleConfirm() {
    let finalUri = uri;

    if (type === "photo") {
      const context = ImageManipulator.manipulate(uri);
      const manipulatedImage = await context.renderAsync();
      const result = await manipulatedImage.saveAsync({
        compress: 0.6,
        format: SaveFormat.JPEG
      });

      finalUri = result.uri;
      context.release();
      manipulatedImage.release();
    }

    setMedia({ type, uri: finalUri });
    navigation.navigate("Home");
  }

  return (
    <View style={styles.container}>
      {type === "video" ? (
        <VideoView player={player} style={StyleSheet.absoluteFill} />
      ) : (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} />
      )}

      <SafeAreaView style={styles.overlay}>
        <TouchableOpacity
          onPress={handleDiscard}
          style={styles.discardButton}
          testID="preview-discard-button"
        >
          <Ionicons color="white" name="close" size={28} />
        </TouchableOpacity>

        <View style={styles.bottomBar}>
          <Button label="Avançar" onPress={handleConfirm} />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBar: {
    bottom: 24,
    paddingHorizontal: 24,
    position: "absolute",
    width: "100%"
  },
  container: {
    backgroundColor: "black",
    flex: 1
  },
  discardButton: {
    left: 16,
    position: "absolute",
    top: 16
  },
  overlay: {
    flex: 1
  }
});
