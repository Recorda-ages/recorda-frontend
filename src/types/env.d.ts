declare const process: {
  env: {
    EXPO_PUBLIC_API_URL?: string;
  };
};

declare module "*.png" {
  const value: number;
  export default value;
}
