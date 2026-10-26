import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

// expo-secure-store has no web implementation (every call throws), so the browser build
// keeps the session in localStorage instead. Browser storage can be unavailable (private
// mode, blocked site data); reads then come back empty and writes are skipped.
const webStorage = {
  getItem: async (key: string) => {
    try {
      return globalThis.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      globalThis.localStorage.removeItem(key);
    } catch {
      // Nothing stored to remove.
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      globalThis.localStorage.setItem(key, value);
    } catch {
      // Session lasts only while the page is open.
    }
  }
};

const nativeStorage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  removeItem: (key: string) => SecureStore.deleteItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value)
};

export const secureStorage = Platform.OS === "web" ? webStorage : nativeStorage;
