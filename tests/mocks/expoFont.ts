export function useFonts() {
  return [true, null] as const;
}

export function isLoaded() {
  return true;
}

export function loadAsync() {
  return Promise.resolve();
}
