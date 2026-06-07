# Frontend Phase 1 Test Results

## Commands Run

- `npm install`
- `npm run generate:api`
- `npm run build`
- `npm run lint`
- `rg --files -g "!node_modules/**" -g "!dist/**" -g "*.test.*" -g "*.spec.*" -g "vitest.config.*" -g "jest.config.*"`
- `rg -n "(^|/)(src|code_oder|backend_docs|package\\.json|package-lock\\.json|docker|.*migrations|data/building_pricebook)" .gitignore .dockerignore`
- `docker build --build-arg VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir -t ratab-frontend-dev:test -f docker/frontend/Dockerfile .`
- Started Vite dev server with `VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir` on `http://127.0.0.1:5173/`
- `Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -UseBasicParsing -TimeoutSec 10`

## Results

- `npm install`: passed; 275 packages installed; 0 vulnerabilities reported.
- `npm run generate:api`: passed; generated `src/shared/api/generated/schema.ts` from `backend_docs/v0.0/openapi_v0_0.yaml`.
- `npm run build`: passed; generated API types, TypeScript build, and Vite production build completed.
- `npm run lint`: passed; generated API types and ESLint completed with no reported issues.
- Test-file scan: no test/spec files or test config found outside `node_modules` and `dist`.
- Ignore verification: no `.gitignore` or `.dockerignore` rule was found that ignores `src`, `code_oder`, `backend_docs`, `package.json`, `package-lock.json`, `docker`, migrations-like paths, or `data/building_pricebook`.
- Docker build: passed; local image `ratab-frontend-dev:test` was built with nginx static serving and build-time `VITE_API_BASE_URL`.
- Dev server check: `http://127.0.0.1:5173/` responded with HTTP 200.

## Failed Tests

Not applicable.

## Tests Not Run

- `npm test` was not run because this Phase 1 scaffold does not include a test script, test files, or test configuration yet.

## Notes

- The prompt-required schema filename was absent; `backend_docs/v0.0/openapi_v0_0.yaml` is the available schema file.
- `node_modules/` and `dist/` were produced locally by verification commands and are ignored.
- `vite-dev.log` and `vite-dev.err.log` were produced by the background dev server and are ignored by the `*.log` rule.
- Docker push was intentionally not run.
