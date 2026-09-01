export function isLoaded() {
  return true;
}

export async function loadAsync() {
  return Promise.resolve();
}

export function useFonts() {
  return [true, null] as const;
}
