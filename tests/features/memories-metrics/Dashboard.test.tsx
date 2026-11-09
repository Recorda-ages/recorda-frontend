import { fireEvent, render, screen } from "@testing-library/react-native";
import { DynamicMetricsDashboard } from "@/features/memories-metrics/components/DynamicMetricsDashboard";
import { useUserMetrics } from "@/features/memories-metrics/hooks/useUserMetrics";
import {
  emptyProfileMetricsMock,
  profileMetricsMock
} from "@/features/memories-metrics/mocks/metricsMock";

jest.mock("@/features/memories-metrics/hooks/useUserMetrics");
jest.mock("@/features/memories-metrics/components/widgets/TopArtistHighlightCard", () => ({
  TopArtistHighlightCard: () => null
}));
jest.mock("@/features/memories-metrics/components/widgets/TopGenresRankingCard", () => ({
  TopGenresRankingCard: () => null
}));
jest.mock("@/features/memories-metrics/components/widgets/DailyStreakCard", () => ({
  DailyStreakCard: () => null
}));

const metrics = jest.mocked(useUserMetrics);
const response = (data: unknown, isLoading = false, isError = false) =>
  ({ data, isLoading, isError, refetch: jest.fn(), errorMessage: "Erro" }) as unknown as ReturnType<
    typeof useUserMetrics
  >;

test("selects the requested period", () => {
  metrics.mockReturnValue(response(profileMetricsMock));
  render(<DynamicMetricsDashboard onCreateRecorda={jest.fn()} />);
  fireEvent.press(screen.getByText("90 dias"));
  expect(metrics).toHaveBeenLastCalledWith("last_90_days", undefined);
});

test("shows the empty state and opens creation", () => {
  metrics.mockReturnValue(response(emptyProfileMetricsMock));
  const create = jest.fn();
  render(<DynamicMetricsDashboard onCreateRecorda={create} />);
  fireEvent.press(screen.getByText("Criar Recorda"));
  expect(create).toHaveBeenCalledTimes(1);
});

test("shows a skeleton during initial loading", () => {
  metrics.mockReturnValue(response(undefined, true));
  render(<DynamicMetricsDashboard onCreateRecorda={jest.fn()} />);
  expect(screen.getByTestId("metrics-skeleton")).toBeTruthy();
});

test("shows an error and retries", () => {
  const result = response(undefined, false, true);
  metrics.mockReturnValue(result);
  render(<DynamicMetricsDashboard onCreateRecorda={jest.fn()} />);
  expect(screen.getByText("Erro")).toBeTruthy();
  fireEvent.press(screen.getByText("Tentar novamente"));
  expect(result.refetch).toHaveBeenCalledTimes(1);
});

test("loads another user's metrics without nudging to create a Recorda", () => {
  metrics.mockReturnValue(response(emptyProfileMetricsMock));
  render(<DynamicMetricsDashboard userId="user-2" />);
  expect(metrics).toHaveBeenLastCalledWith("last_30_days", "user-2");
  expect(screen.getByText("Este perfil ainda não tem Recordas neste período.")).toBeTruthy();
  expect(screen.queryByText("Criar Recorda")).toBeNull();
});
