import { apiClient } from "@/services/api/client";
import { ApiError } from "@/services/api/errors";

const fetchMock = jest.fn();
globalThis.fetch = fetchMock as unknown as typeof fetch;

function abortError() {
  const error = new Error("Aborted");
  error.name = "AbortError";
  return error;
}

function abortableFetch(_url: string, init: { signal: AbortSignal }) {
  return new Promise((_resolve, reject) => {
    if (init.signal.aborted) {
      reject(abortError());
      return;
    }

    init.signal.addEventListener("abort", () => reject(abortError()));
  });
}

describe("apiClient timeouts", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(abortableFetch);
  });

  it("still enforces the timeout when the caller passes its own signal", async () => {
    const controller = new AbortController();

    await expect(
      apiClient.get("/slow", { signal: controller.signal, timeoutMs: 10 })
    ).rejects.toMatchObject({ code: "REQUEST_TIMEOUT", status: 408 });
  });

  it("propagates the caller cancellation as an abort instead of a timeout", async () => {
    const controller = new AbortController();
    const request = apiClient.get("/slow", { signal: controller.signal, timeoutMs: 10_000 });

    controller.abort();

    const error = await request.catch((caught: unknown) => caught);
    expect(error).not.toBeInstanceOf(ApiError);
    expect((error as Error).name).toBe("AbortError");
  });

  it("aborts immediately when the caller signal is already aborted", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      apiClient.get("/slow", { signal: controller.signal, timeoutMs: 10_000 })
    ).rejects.toMatchObject({ name: "AbortError" });
  });
});
