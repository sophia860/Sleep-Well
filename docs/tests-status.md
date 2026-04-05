# Tests Status

> Last audited: 2026-04-05

## Summary

No automated test suite is configured in this project.

## Scripts

| Script | Command | Status |
|--------|---------|--------|
| `check` | `tsc` | Active — TypeScript type-checking. Run before every PR. |
| `build` | `tsx script/build.ts` | Active — full production build. CI should run this. |
| `dev` | `tsx server/index.ts` | Active — development server. |
| `db:push` | `drizzle-kit push` | Active — schema migration. |

## Test Framework

No test runner (Vitest, Jest, Playwright, etc.) is installed or configured.

## Lint

No ESLint or Prettier config files were found at the repo root. Linting is not automated.

## Recommended next steps

1. Add Vitest for unit tests of hooks and utilities
2. Add Playwright or Cypress for E2E testing of critical flows (Sign In, Garden, Submissions)
3. Add ESLint config (`.eslintrc.cjs` or `eslint.config.js`)
4. Wire type-check and build into a GitHub Actions CI workflow

## Known TypeScript issues

The TypeScript build (`npm run check`) may surface errors related to:
- Implicit `any` in hook callbacks (flagged during org pass)
- Some Drizzle schema types not perfectly inferred

These are non-blocking but should be resolved incrementally.
