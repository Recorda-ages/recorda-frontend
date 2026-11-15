import { render } from "@testing-library/react-native";
import { RecordaViewScreen } from "@/features/recorda-view";
const mockReplace = jest.fn();
jest.mock("@react-navigation/native", () => ({
  useNavigation: () => ({ replace: mockReplace }),
  useRoute: () => ({ params: { recordaId: "recorda-id" } })
}));
it("forwards the recorda identifier to the integrated details route", () => {
  render(<RecordaViewScreen />);
  expect(mockReplace).toHaveBeenCalledWith("PublishedRecorda", { postId: "recorda-id" });
});
