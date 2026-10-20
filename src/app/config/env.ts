const DEFAULT_API_URL = "http://localhost:8000";

export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_URL,
  /** Development only: see src/features/profile/IMPLEMENTATION_NOTES.md. */
  profileMock: process.env.EXPO_PUBLIC_PROFILE_MOCK === "true"
};
