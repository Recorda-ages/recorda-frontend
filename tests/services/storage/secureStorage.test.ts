import type { Platform } from "react-native";

type StorageModule = typeof import("@/services/storage/secureStorage");
type SecureStoreModule = typeof import("expo-secure-store");

// The React Native test environment has no browser storage.
function installLocalStorage() {
  const values = new Map<string, string>();
  const localStorage = {
    getItem: jest.fn((key: string) => values.get(key) ?? null),
    removeItem: jest.fn((key: string) => void values.delete(key)),
    setItem: jest.fn((key: string, value: string) => void values.set(key, value))
  };
  Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorage });
  return localStorage;
}

// Platform is read when the module loads, so each test loads its own copy.
function load(os: typeof Platform.OS) {
  let storage!: StorageModule["secureStorage"];
  let secureStore!: SecureStoreModule;
  jest.isolateModules(() => {
    const reactNative = jest.requireActual<typeof import("react-native")>("react-native");
    jest.replaceProperty(reactNative.Platform, "OS", os);
    secureStore = jest.requireActual<SecureStoreModule>("expo-secure-store");
    storage = jest.requireActual<StorageModule>("@/services/storage/secureStorage").secureStorage;
  });
  return { secureStore, storage };
}

afterEach(() => {
  jest.restoreAllMocks();
  Reflect.deleteProperty(globalThis, "localStorage");
});

describe("secureStorage", () => {
  it("uses the device's secure store on native platforms", async () => {
    const { secureStore, storage } = load("ios");
    const setItem = jest.spyOn(secureStore, "setItemAsync").mockResolvedValue();

    await storage.setItem("token", "abc");

    expect(setItem).toHaveBeenCalledWith("token", "abc");
  });

  // expo-secure-store throws on web, which made signing in from the browser fail.
  describe("on web", () => {
    it("keeps values in localStorage instead of the secure store", async () => {
      installLocalStorage();
      const { secureStore, storage } = load("web");
      const setItem = jest.spyOn(secureStore, "setItemAsync");

      await storage.setItem("token", "abc");
      expect(await storage.getItem("token")).toBe("abc");
      expect(setItem).not.toHaveBeenCalled();

      await storage.removeItem("token");
      expect(await storage.getItem("token")).toBeNull();
    });

    it("degrades quietly when browser storage is blocked", async () => {
      const localStorage = installLocalStorage();
      const blocked = () => {
        throw new Error("SecurityError");
      };
      localStorage.getItem.mockImplementation(blocked);
      localStorage.setItem.mockImplementation(blocked);
      localStorage.removeItem.mockImplementation(blocked);
      const { storage } = load("web");

      await expect(storage.setItem("token", "abc")).resolves.toBeUndefined();
      await expect(storage.getItem("token")).resolves.toBeNull();
      await expect(storage.removeItem("token")).resolves.toBeUndefined();
    });
  });
});
