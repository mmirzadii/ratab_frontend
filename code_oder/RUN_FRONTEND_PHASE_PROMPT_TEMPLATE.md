# Run Frontend Phase Prompt Template

Copy this prompt into Codex and change `PHASE_NUMBER`.

---

You are working inside the Ratab frontend repository root.

The product name is **ratab / رتب**.

Technology:

```text
React + TypeScript + Vite + Redux Toolkit + RTK Query + Tailwind CSS
```

Execute exactly ONE frontend phase of v0.0.

```text
PHASE_NUMBER = 1
```

The current phase folder is:

```text
code_oder/v0.0/phaze{PHASE_NUMBER}/
```

## Strict scope rules

- Work ONLY on this phase.
- Do NOT execute previous or next phases.
- Do NOT create backend code.
- Do NOT modify backend source files.
- Do NOT configure production deployment.
- Do NOT commit or push.
- Do NOT put secrets in git.
- Do NOT hardcode backend URLs inside React components.
- Do NOT assume `ratab.ir` is active.
- Do NOT invent endpoints, payloads, or responses.

## Required pre-read

```text
AI_CODE_PRINCIPLES.md
backend_docs/v0.0/frontend_handoff_v0_0.md
backend_docs/v0.0/ratab v0.0 Backend API.yaml
code_oder/COMMON_FRONTEND_CODEX_RULES.md
code_oder/v0.0/reference/main_updated.html
code_oder/v0.0/reference/UI_THEME_NOTES.md
code_oder/v0.0/reference/PRODUCT_FLOW_NOTES.md
code_oder/v0.0/phaze{PHASE_NUMBER}/
```

At the start, print:

```text
My understanding of frontend phase {PHASE_NUMBER}
```

Then implement only the current phase.

## Backend schema requirement

The backend OpenAPI schema file is available and must be used:

```text
backend_docs/v0.0/ratab v0.0 Backend API.yaml
```

If useful, generate TypeScript API types to:

```text
src/shared/api/generated/schema.ts
```

Suggested tool: `openapi-typescript`.

## Docker goal

Local development:

```bash
npm run dev
```

Online dev/demo deployment:

```text
Vite build -> dist -> nginx/static server -> Docker image -> Hamravesh frontend app -> public link for testers
```

Do NOT publicly deploy Vite dev server.

If PHASE_NUMBER = 1, include online-dev Docker static deployment support:

```text
docker/frontend/Dockerfile
docker/frontend/nginx.conf
.dockerignore
```

Document:

```powershell
docker build --build-arg VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir -t registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main -f docker/frontend/Dockerfile .
docker push registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main
```

Hamravesh app:

```text
App name: ratab-frontend-dev
Image: registry.hamdocker.ir/momirzadi2004/ratab-frontend-dev:main
Port: 80
```

After frontend URL is assigned, project owner must update backend CORS manually.

## Reports

Create/update only:

```text
code_oder/v0.0/phaze{PHASE_NUMBER}/REPORT.md
code_oder/v0.0/phaze{PHASE_NUMBER}/TEST_RESULTS.md
```

REPORT.md must include:

```text
# Frontend Phase {PHASE_NUMBER} Report

## Summary
## Scope
## Files Created
## Files Modified
## Implementation Details
## UI/UX Notes
## API Contract Notes
## Docker / Online Dev Deployment Notes
## Issues and Findings
## Risks and Assumptions
## User Actions Required
## Suggested Commit Message
## Next Step
```

TEST_RESULTS.md must include:

```text
# Frontend Phase {PHASE_NUMBER} Test Results

## Commands Run
## Results
## Failed Tests
## Tests Not Run
## Notes
```

## Final response

Print:

```text
Summary
User actions required
Suggested commit message
```

Stop after this phase.
