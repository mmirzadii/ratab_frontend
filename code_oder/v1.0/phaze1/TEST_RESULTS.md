# Phase 1 Test Results

Date: 2026-07-28

## Commands and results

### Documentation structure validation

```bash
npm run validate:docs
```

Result:

```text
STATUS: CURRENT_BACKEND_CONTRACT_SYNCED
history canonical OPENAPI sha256: 4471c1316b7cfe3f656245212da13bf98d239766c931052435a019c8c0f112ce
OK: documentation structure checks passed
```

Exit code: **0**

### OpenAPI validation

No dedicated OpenAPI lint/validate npm script exists in this repository.

Contract checks performed instead:

- Required `backend_docs/current/` files present
- `BACKEND_VERSION` = `v1.0`
- OpenAPI parses as YAML (`openapi: 3.0.3`, title `ratab v1.0 Backend API`, version `1.0`)
- Auth paths in `AUTH_AND_CSRF.md` exist in `OPENAPI.yaml`
- `openapi-typescript` generation succeeded (implicit structural acceptance by the generator)

Backend-documented OpenAPI generation warnings (23 warnings / 17 unique on the backend side) are noted in `KNOWN_LIMITATIONS.md` and are not treated as frontend Phase 1 failures.

### API type generation

```bash
npm run generate:api
```

Result:

```text
✨ openapi-typescript 7.13.0
🚀 .../backend_docs/current/OPENAPI.yaml → .../src/shared/api/generated/schema.ts
```

Exit code: **0**

Source confirmed: `backend_docs/current/OPENAPI.yaml`  
Output confirmed: `src/shared/api/generated/schema.ts`  
Manual schema edits: **none**

### TypeScript check

```bash
npx tsc -b
```

Exit code: **0** (after minimal null-safety adjustments listed in `REPORT.md`)

### ESLint

```bash
npx eslint .
```

Exit code: **0**

### Tests

```text
Not run: no test script in package.json
```

### Production build

```bash
npm run build
```

Result: `generate:api` succeeded, `tsc -b` succeeded, Vite production build succeeded (`✓ 1699 modules transformed`).

Exit code: **0**

## Summary

| Check | Result |
| --- | --- |
| validate:docs | pass (`CURRENT_BACKEND_CONTRACT_SYNCED`) |
| OpenAPI dedicated validator | Not run (no project script); YAML parse + generate used |
| generate:api | pass |
| tsc -b | pass |
| eslint | pass |
| npm test | Not run (no script) |
| npm run build | pass |
