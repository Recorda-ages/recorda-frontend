type MockAudioSource = null | number | string | Record<string, unknown>;

export type MockAudioPlayer = {
  loop: boolean;
  muted: boolean;
  pause: jest.Mock<void, []>;
  play: jest.Mock<void, []>;
  replace: jest.Mock<void, [MockAudioSource]>;
};

function createMockPlayer(): MockAudioPlayer {
  return {
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
