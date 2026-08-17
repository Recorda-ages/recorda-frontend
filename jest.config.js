module.exports = {
  moduleNameMapper: {
    "^react-native-safe-area-context$": "<rootDir>/tests/mocks/safeAreaContext.tsx",
    "^react-native-screens$": "<rootDir>/tests/mocks/reactNativeScreens.tsx",
    "^@/(.*)$": "<rootDir>/src/$1"
  },
  preset: "jest-expo",
  testMatch: ["<rootDir>/tests/**/*.test.ts?(x)"]
};
