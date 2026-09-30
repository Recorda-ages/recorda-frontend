type MockAudioSource = null | number | string | Record<string, unknown>;

type MockPlaybackStatus = { isLoaded: boolean; playing: boolean };
type MockStatusListener = (status: MockPlaybackStatus) => void;

export type MockAudioPlayer = {
  addListener: jest.Mock<{ remove: () => void }, [string, MockStatusListener]>;
  /** Emits a native `playbackStatusUpdate` to the subscribed listeners. */
  emitStatus: (status: MockPlaybackStatus) => void;
  loop: boolean;
  muted: boolean;
  pause: jest.Mock<void, []>;
  play: jest.Mock<void, []>;
  replace: jest.Mock<void, [MockAudioSource]>;
};

function createMockPlayer(): MockAudioPlayer {
  const listeners = new Set<MockStatusListener>();
  return {
    addListener: jest.fn((_event: string, listener: MockStatusListener) => {
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    }),
    emitStatus: (status) => listeners.forEach((listener) => listener(status)),
    loop: false,
    muted: false,
    pause: jest.fn(),
    play: jest.fn(),
    replace: jest.fn()
  };
}

/** Player único compartilhado entre o render e as assertivas do teste. */
export let mockAudioPlayer: MockAudioPlayer = createMockPlayer();

export const mockUseAudioPlayer = jest.fn<MockAudioPlayer, [MockAudioSource?]>();

export function resetAudioMock() {
  mockAudioPlayer = createMockPlayer();
  mockUseAudioPlayer.mockReset();
  mockUseAudioPlayer.mockImplementation(() => mockAudioPlayer);
}

resetAudioMock();

export function useAudioPlayer(source?: MockAudioSource) {
  return mockUseAudioPlayer(source);
}

export function setAudioModeAsync() {
  return Promise.resolve();
}
