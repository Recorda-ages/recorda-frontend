# Profile metrics data — #285

## Design and scope

Implement the exact profile contracts from #285, an authenticated service and a
TanStack Query v5 hook. Reuse the existing API client (which adds `/api/v1`) and
current-user cache. The query key contains user ID and period; cancellation reaches
the API. Expose the original query state plus a translated `errorMessage`.

Use explicit typed fixtures and a mock service for downstream widget development.
Never enable mocks automatically after API errors. No profile screen, widgets or
backend changes belong to this task (#286 and FE.03 own those).

`period` remains a required string because the issue does not define an enum. The
caller supplies values supported by the API. Sample fixtures use `7d` and `30d`;
these are development examples, not confirmed backend period values. Artist photos
are null to exercise the future widget fallback without depending on external media.

## Implementation plan

- [x] Add service and hook tests; verify they fail before implementation.
- [x] Add `types.ts`, `services/userMetricsService.ts`, `hooks/useUserMetrics.ts`
      and `mocks/metricsMock.ts`, plus translated errors in the three locales.
- [x] Cover period changes, cancellation, loading/refetching, failures, session
      isolation, empty fixtures and mutation isolation between mock responses.
- [x] Run lint, format, typecheck, full Jest suite with coverage (80%+ for new code)
      and Expo export. Capture a temporary hook demo and actual coverage terminal.
- [x] Obtain visual approval before commit, rebase, push and PR to dev.

## Integration limits

The checked local backend does not implement `/users/me/metrics`. Real API
integration and the profile UI are deferred to FE.03. The temporary evidence demo
uses fixtures explicitly; it is not a shipped screen or proof of backend integration.

The mock adapter returns the same sample totals for any period and copies nested
objects so consumers cannot mutate subsequent responses. It does not simulate
server-side filtering. Use `emptyProfileMetricsMock` for the no-data scenario.

## Usage

```ts
const metrics = useUserMetrics(period);
// metrics.data, isLoading, isRefetching, isError, errorMessage, refetch

// Explicit fixture access for isolated widget development/tests:
const sample = await userMetricsServiceMock.getProfileMetrics("30d");
```

Import the hook from `hooks/useUserMetrics`, the real service from
`services/userMetricsService` and fixtures from `mocks/metricsMock` inside this
feature. The hook uses the real service and only runs when the current user exists.

## Validation (2026-10-29)

- `npm run lint`: passed, zero warnings.
- `npm run format:check`: passed. Windows checkout CRLF endings were normalized
  locally; unchanged files are absent from the content diff.
- `npm run typecheck`: passed.
- `npm test -- --coverage --runInBand --forceExit --testTimeout=30000`:
  109 suites, 929 tests passed.
- Targeted Jest coverage with
  `--testPathPattern=memories-metrics --collectCoverageFrom=src/features/memories-metrics/**/*.ts`:
  14 tests passed, 100% statements, branches, functions and lines for executable
  feature code. `types.ts` contains type declarations only.
- `npx expo export --platform all --output-dir dist`: passed (Android, iOS, Web).
- Independent static review: no actionable findings.

The account-switch regression test revealed that `useCurrentUser` notified React
for unrelated query-cache events during rendering. Its subscription now filters
the auth query hash. A pre-existing comment test also needed to await the create
request before checking its UI result; the assertions on the displayed comment
remain in place. Both fixes are covered by the passing full suite.

## Evidence

Real Expo Web captures from a temporary fixture-driven hook demo (the original
`App.tsx` was restored before final validation):

- [Loaded profile metrics](evidence/285/hook-data.png)
- [Empty metrics](evidence/285/hook-empty.png)
- [Localized error](evidence/285/hook-error.png)
- [Actual Jest terminal and coverage](evidence/285/test-coverage.png)

No device-native manual test or real metrics backend integration was performed.
The user approved the implementation and evidence before commit, push and PR creation.
