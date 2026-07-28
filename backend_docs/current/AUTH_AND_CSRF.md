# Authentication and CSRF — current contract

Backend version: see `BACKEND_VERSION` (`v1.0` cumulative).

## Browser auth model (required)

```text
Signup: phone -> verification screen -> password -> authenticated session
Login:  phone + password -> authenticated session
Return: valid session cookie -> no login required
Logout: invalidates server session and expires cookie
```

## Endpoints

| Method | Path | Auth | CSRF |
| --- | --- | --- | --- |
| GET | `/api/auth/csrf/` | no | n/a (issues CSRF cookie) |
| POST | `/api/auth/signup/start/` | no | yes |
| POST | `/api/auth/signup/verify/` | no | yes |
| POST | `/api/auth/signup/complete/` | no | yes |
| POST | `/api/auth/login/` | no | yes |
| GET | `/api/auth/me/` | session or legacy token | n/a |
| POST | `/api/auth/logout/` | **session required** | yes |

### Request fields

- Signup start: `phone_number`
- Signup verify: `challenge_id`, `phone_number`, `verification_code` (digits only)
- Signup complete: `signup_ticket`, `password`, `password_confirmation`, optional `display_name`
- Login: `phone_number`, `password`

Phone numbers are normalized server-side (Persian/Arabic digits, `+98` / `0098`
prefixes to `09…`). Identity is the normalized phone number.

## Cookies and headers

| Name / header | Role |
| --- | --- |
| `sessionid` (default Django name) | HttpOnly server-side session cookie |
| `csrftoken` (default Django name) | Readable CSRF cookie |
| `X-CSRFToken` | Must send the masked CSRF token on mutating session requests |

### Required browser client behavior

1. Call `GET /api/auth/csrf/` first (or ensure the CSRF cookie is present).
2. Always send `credentials: "include"`.
3. On `POST` / `PUT` / `PATCH` / `DELETE` while using the session, send
   `X-CSRFToken: <masked-token-from-cookie-or-/csrf/>`.
4. After signup complete or login, call `GET /api/auth/me/` to bootstrap the UI.
5. On logout, expect HTTP `204` and treat the session as gone.

### Session persistence

- Sessions are stored in the database.
- Default max age is 14 days (`SESSION_COOKIE_AGE`), configurable by backend env.
- Default `SESSION_EXPIRE_AT_BROWSER_CLOSE=false` (session can survive browser reopen).
- Sliding renewal is **off** unless the backend enables `SESSION_SAVE_EVERY_REQUEST`.
- Cookie `SameSite` defaults to `Lax`; Secure flags depend on environment.

## Local verification mode (local development only)

When `SIGNUP_VERIFICATION_MODE=local_any_code` **and** local debug settings are
active, signup verify accepts **any non-empty numeric** `verification_code`
without comparing a delivered OTP.

This is **local-development-only**. Dev and production settings reject that mode.
The frontend must still collect and submit a verification code field; do not
remove the verification step from UX.

## Explicitly forbidden for the current frontend

Do **not**:

- store passwords in `localStorage` or `sessionStorage`;
- store session IDs in `localStorage` or `sessionStorage`;
- use `Authorization: Token …` as the normal browser auth method;
- use `POST /api/auth/dev-login/` as the normal v1 authentication method;
- treat a client-held token as the primary session mechanism.

Legacy DRF Token authentication may still authenticate some APIs for
compatibility, but the **current frontend contract is session cookies + CSRF**.

## Expected failure handling

| Situation | Typical HTTP | Frontend action |
| --- | ---: | --- |
| Not logged in | 401 | Redirect to login; clear client auth state |
| CSRF missing/invalid | 403 | Refresh CSRF (`/api/auth/csrf/`) and retry once |
| Wrong phone/password | 401 | Show generic invalid-credentials message |
| Forbidden resource | 403 | Show access denied; do not retry as another user |
| Signup challenge/ticket invalid/expired | 400 | Restart signup from start |

## Minimal CSRF-protected POST example

```http
POST /api/auth/login/ HTTP/1.1
Content-Type: application/json
X-CSRFToken: <masked-csrf-token>
Cookie: csrftoken=<csrf-cookie>; sessionid=<optional-existing>

{"phone_number":"09120000000","password":"ExamplePass123!"}
```

Use only fake credentials in examples and fixtures.
