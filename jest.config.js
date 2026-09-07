module.exports = {
  moduleNameMapper: {
    "^expo-camera$": "<rootDir>/tests/mocks/expoCamera.tsx",
    "^expo-font$": "<rootDir>/tests/mocks/expoFont.ts",
    "^expo-image-manipulator$": "<rootDir>/tests/mocks/expoImageManipulator.ts",
    "^expo-image-picker$": "<rootDir>/tests/mocks/expoImagePicker.ts",
    "^expo-media-library$": "<rootDir>/tests/mocks/expoMediaLibrary.ts",
    "^expo-splash-screen$": "<rootDir>/tests/mocks/expoSplashScreen.ts",
    "^expo-video$": "<rootDir>/tests/mocks/expoVideo.tsx",
    "^react-native-safe-area-context$": "<rootDir>/tests/mocks/safeAreaContext.tsx",
    "^react-native-screens$": "<rootDir>/tests/mocks/reactNativeScreens.tsx",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"]
};
