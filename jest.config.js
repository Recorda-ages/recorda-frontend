module.exports = {
  moduleNameMapper: {
    "^expo-font$": "<rootDir>/tests/mocks/expoFont.ts",
    "^@expo/vector-icons$": "<rootDir>/tests/mocks/expoVectorIcons.tsx",
    "^expo-video$": "<rootDir>/tests/mocks/expoVideo.tsx",
    "^expo-splash-screen$": "<rootDir>/tests/mocks/expoSplashScreen.ts",
    "^react-native-safe-area-context$": "<rootDir>/tests/mocks/safeAreaContext.tsx",
    "^react-native-screens$": "<rootDir>/tests/mocks/reactNativeScreens.tsx",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"]
};
