import type { StyleProp, ViewStyle } from "react-native";
import { View } from "react-native";

type MockPlayer = {
  addListener: (event: string, listener: (payload: { status: string }) => void) => {
    remove: () => void;
  };
  loop: boolean;
  pause: () => void;
  play: jest.Mock<void, []>;
  playing: boolean;
};

type MockVideoSource = null | number | string | Record<string, unknown>;

function createMockPlayer(): MockPlayer {
  return {
    addListener: () => ({ remove: () => undefined }),
    loop: false,
    pause: () => undefined,
    play: jest.fn(),
    playing: false
  };
}

export const mockUseVideoPlayer = jest.fn<
  MockPlayer,
  [MockVideoSource, ((player: MockPlayer) => void)?]
>();
export const mockGenerateVideoThumbnails = jest.fn();
export const mockReleaseVideoPlayer = jest.fn();
export const mockReplaceVideoAsync = jest.fn(async (_source: MockVideoSource) => undefined);
export const mockCreateVideoPlayer = jest.fn((_source: MockVideoSource) => ({
  generateThumbnailsAsync: mockGenerateVideoThumbnails,
  release: mockReleaseVideoPlayer,
  replaceAsync: mockReplaceVideoAsync
}));

export function resetVideoMock() {
  mockUseVideoPlayer.mockReset();
  mockUseVideoPlayer.mockImplementation((source, setup) => {
    const player = createMockPlayer();

    if (setup) {
      setup(player);
    }

    return player;
  });
}

resetVideoMock();

export function useVideoPlayer(source: MockVideoSource, setup?: (player: MockPlayer) => void) {
  return mockUseVideoPlayer(source, setup);
}

export function createVideoPlayer(source: MockVideoSource) {
  return mockCreateVideoPlayer(source);
}

type VideoViewProps = {
  player?: MockPlayer;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function VideoView({ style, testID }: VideoViewProps) {
  return <View style={style} testID={testID ?? "mock-video-view"} />;
}
