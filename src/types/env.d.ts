declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
    EXPO_PUBLIC_META_APP_ID?: string;
  };
};

declare module "*.png" {
  const value: number;
  export default value;
}
