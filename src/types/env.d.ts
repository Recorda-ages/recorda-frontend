declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_META_APP_ID?: string;
    EXPO_PUBLIC_MEMORY_CALENDAR_MOCK?: string;
    EXPO_PUBLIC_MEMORY_CALENDAR_MOCK_FALLBACK?: string;
  };
};

declare module "*.png" {
  const value: number;
  export default value;
}
