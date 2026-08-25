import { render, screen } from "@testing-library/react-native";
import { Text } from "react-native";
import { useTheme } from "react-native-paper";

import { AppProviders } from "@/app/providers/AppProviders";
import { colors } from "@/theme";

function PaperThemeConsumer() {
  const theme = useTheme();

  return <Text testID="paper-primary-color">{theme.colors.primary}</Text>;
}

describe("AppProviders", () => {
  it("provides the Recorda Paper theme", () => {
    render(
      <AppProviders>
        <PaperThemeConsumer />
      </AppProviders>
    );

    expect(screen.getByTestId("paper-primary-color")).toHaveTextContent(colors.primary);
  });
});
