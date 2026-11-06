import { cleanup } from "@testing-library/react-native";
import { queryClient } from "@/app/providers/queryClient";
import { i18n } from "@/i18n";

// Device locale varies across machines; individual English tests override this.
beforeEach(async () => {
  await i18n.changeLanguage("pt-BR");
});
afterEach(() => {
  cleanup();
  // Session helpers use the app client even when a test supplies a separate provider.
  queryClient.clear();
});
