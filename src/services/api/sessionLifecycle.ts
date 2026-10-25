// In-flight mutations must not write data into the next account's cache.
let generation = 0;
const requests = new Set<AbortController>();
const resets = new Set<() => void>();
const invalidSessions = new Set<() => void>();

export function getSessionGeneration() {
  return generation;
}

export function resetPrivateState() {
  generation += 1;
  requests.forEach((controller) => controller.abort());
  requests.clear();
  resets.forEach((reset) => reset());
}

export function onPrivateStateReset(reset: () => void) {
  resets.add(reset);
  return () => {
    resets.delete(reset);
  };
}

export function onInvalidSession(listener: () => void) {
  invalidSessions.add(listener);
  return () => {
    invalidSessions.delete(listener);
  };
}

export function notifyInvalidSession() {
  invalidSessions.forEach((listener) => listener());
}

export function trackSessionRequest() {
  const startedIn = generation;
  const controller = new AbortController();
  requests.add(controller);
  return {
    controller,
    isCurrent: () => generation === startedIn,
    release: () => {
      requests.delete(controller);
    }
  };
}
