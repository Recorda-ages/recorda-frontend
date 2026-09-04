import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

type MockPlayer = {
  loop: boolean;
  pause: () => void;
  play: () => void;
  playing: boolean;
};

export function useVideoPlayer(_source: unknown, setup?: (player: MockPlayer) => void) {
  const player: MockPlayer = {
    loop: false,
    pause: () => undefined,
    play: () => undefined,
    playing: false
  };

  setup?.(player);

  return player;
}

type VideoViewProps = {
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function VideoView({ style, testID }: VideoViewProps) {
  return <View style={style} testID={testID ?? "mock-video-view"} />;
}
