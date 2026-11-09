import { useEffect, useState } from "react";

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
  release: jest.Mock<void, []>;
  replace: jest.Mock<void, [MockAudioSource]>;
};

function createMockPlayer(): MockAudioPlayer {
  const listeners = new Set<MockStatusListener>();
  let released = false;
  const assertAlive = () => {
    if (released) {
      throw new Error("ERR_NATIVE_SHARED_OBJECT_NOT_FOUND");
    }
  };

  return {
    addListener: jest.fn((_event: string, listener: MockStatusListener) => {
      assertAlive();
      listeners.add(listener);
      return { remove: () => listeners.delete(listener) };
    }),
    emitStatus: (status) => listeners.forEach((listener) => listener(status)),
    loop: false,
    muted: false,
    pause: jest.fn(() => {
      assertAlive();
    }),
    play: jest.fn(() => {
      assertAlive();
    }),
    release: jest.fn(() => {
      released = true;
    }),
    replace: jest.fn((_source: MockAudioSource) => {
      assertAlive();
    })
  };
}

/** Player único compartilhado entre o render e as assertivas do teste. */
export let mockAudioPlayer: MockAudioPlayer = createMockPlayer();
let mockAudioPlayerClaimed = false;

export const mockUseAudioPlayer = jest.fn<MockAudioPlayer, [MockAudioSource?]>();

export function resetAudioMock() {
  mockAudioPlayer = createMockPlayer();
  mockAudioPlayerClaimed = false;
  mockUseAudioPlayer.mockReset();
  mockUseAudioPlayer.mockImplementation(() => {
    if (mockAudioPlayerClaimed) {
      mockAudioPlayer = createMockPlayer();
    }
    mockAudioPlayerClaimed = true;
    return mockAudioPlayer;
  });
}

resetAudioMock();

export function useAudioPlayer(source?: MockAudioSource) {
  const [player] = useState(() => mockUseAudioPlayer(source));
  useEffect(() => {
    return () => {
      player.release();
    };
  }, [player]);
  return player;
}

export function setAudioModeAsync() {
  return Promise.resolve();
}
