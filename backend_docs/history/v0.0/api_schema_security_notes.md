# API Schema Security Notes

This document covers secure use of the ratab v0.0 API schema and interactive docs.

## Production Default

API schema/docs are disabled in production by default:

```env
ENABLE_API_DOCS=false
API_DOCS_PUBLIC=false
```

Production must not expose public Swagger/ReDoc/schema pages by default because they reveal endpoint structure, request fields, and protected workflow names. Even without secrets, that information should not be public unless the project owner explicitly approves a controlled exception.

## Dev Enablement

Recommended online dev/demo setting:

```env
ENABLE_API_DOCS=true
API_DOCS_PUBLIC=false
```

With this setting, schema/docs require authenticated staff/admin access.

Temporary public docs for frontend work are possible only in dev/demo:

```env
ENABLE_API_DOCS=true
API_DOCS_PUBLIC=true
```

Use public docs only for the shortest practical time, then switch `API_DOCS_PUBLIC=false`.

## Secrets

Never place real secrets in OpenAPI examples, generated YAML, handoff docs, reports, or UI screenshots. This includes:

- real tokens;
- `SECRET_KEY`;
- database URLs;
- Redis URLs;
- S3 access keys or secret keys;
- Hamravesh/Hamdocker credentials.

The static schema at `backend_docs/history/v0.0/OPENAPI.yaml` (and the archived non-canonical `OPENAPI.NON_CANONICAL.openapi_v0_0.yaml`) uses placeholder auth descriptions only and does not need runtime credentials.

## Token Authentication

Protected v0.0 endpoints use DRF token authentication:

```http
Authorization: Token <token>
```

The OpenAPI schema represents this as the `tokenAuth` security scheme with an `Authorization` header.

Public schema operations are limited to:

- `GET /api/health/`
- `POST /api/auth/dev-login/` when dev-login is enabled

Protected endpoints must continue requiring token authentication even if docs are public.

## Public Docs Checklist

Before enabling `API_DOCS_PUBLIC=true` in online dev/demo, verify:

- the deployment is not production;
- no real tokens or secrets appear in schema examples;
- `ENABLE_DEV_LOGIN=true` is acceptable for the current dev window;
- protected routes still return `401` or `403` without auth;
- public docs are needed for frontend work and can be disabled afterward;
- there is no active production/custom domain pointing at the same app unexpectedly.

## Known v0.0 Limitations

- No real PDF binary generation exists yet; export creation records blocked/failed metadata.
- Export download may return `409 Conflict` while PDF rendering remains unavailable.
- Manual-price rows need frontend handling; blank Excel prices must not be treated as official zero prices.
- There is no active custom `ratab.ir` dev domain connected to this app yet.
- Current online dev/demo URL is `https://hw2momirzadipayload.darkube.ir`.
