# Contributing to `@codein/sdk`

## Setup

```bash
npm install
npm run build
npm test
```

## Guidelines

- Keep the public API small and typed
- Prefer `fetch`-compatible clients (works in Node 18+ and browsers)
- Add a test for every new method
- No secrets in fixtures

## PR checklist

- [ ] `npm run typecheck` passes
- [ ] `npm test` passes
- [ ] README updated if API changed
