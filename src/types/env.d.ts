declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_META_APP_ID?: string;
    EXPO_PUBLIC_PROFILE_MOCK?: string;
  };
};

declare module "*.png" {
  const value: number;
  export default value;
}
