# Phase 2 — User Actions Required

## Required for local Vite on port 1000

Ensure the running local backend trusts the frontend origin. Non-secret env values:

```env
CSRF_TRUSTED_ORIGINS=http://localhost:1000,http://127.0.0.1:1000
CORS_ALLOWED_ORIGINS=http://localhost:1000,http://127.0.0.1:1000
CORS_ALLOW_CREDENTIALS=true
SESSION_COOKIE_SAMESITE=Lax
CSRF_COOKIE_SAMESITE=Lax
SIGNUP_VERIFICATION_MODE=local_any_code
```

If the backend runs via `docker-compose.local.yml`, recreate/restart the `backend` service after changing those values so the container environment updates.

Frontend:

```env
VITE_API_BASE_URL=http://localhost:15000
```

(See `.env.example` for the same guidance.)

## Already applied during this Phase 2 fix

- Backend local compose + `.env.local` updated to include `http://localhost:1000`
- Backend container recreated and verified with `printenv CSRF_TRUSTED_ORIGINS`
- Frontend CSRF client uses `/api/auth/csrf/` JSON token + HTML 403 sanitization

## Optional

- Confirm browser signup at `http://localhost:1000/signup` once after a hard refresh.
- Approve Phase 3 only after that smoke check if desired.
