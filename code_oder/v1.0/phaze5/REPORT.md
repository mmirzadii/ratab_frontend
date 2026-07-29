# Phase 5 Report — Private Files and Message Attachments

Date: 2026-07-28  
Frontend active version: `v1.0`  
Backend contract: `backend_docs/current/` (`BACKEND_VERSION` = `v1.0`)  
Primary authority: `code_oder/v1.0/phaze5/FRONTEND_PHASE_05_INSTRUCTIONS.md`

## Understanding

Add Backend v1 private-file upload and message attachment types `file` | `financial_document` onto the Phase 4 group messaging UI. Open/download only through authorized API endpoints with session cookies. Never invent public storage URLs.

## Contract sources used

- `OPENAPI.yaml` — companies files upload, message attachments retrieve/open/download, storage-files open/download, `GroupMessageCreateRequest.attachments`
- `FRONTEND_HANDOFF.md` — upload then reference; types; no public URLs
- `PERMISSIONS.md` — attachment open requires active group membership
- `ERROR_CODES.md` — file validation 400; storage 503; access 403/404
- Generated `schema.ts` (not hand-edited)

## Implementation

### New modules

| File | Responsibility |
| --- | --- |
| `src/features/companies/companyFilesApi.ts` | Multipart upload mutation |
| `src/shared/api/authorizedBinary.ts` | Credentialed binary/JSON fetch helpers |
| `src/features/companies/MessageAttachmentCard.tsx` | Open/download UI for received attachments |
| `src/features/companies/AttachFinancialDocumentModal.tsx` | Project → document picker |

### Updated

- `MessagesSection` — attach menu (upload file / attach document / create cost report), pending attachments, send with `attachments[]`
- `CompanyDashboardPage` / `CostReportWizardPage` — seed pending financial-document attachment into messages (replaces Phase 4 toast workaround)
- `baseApi` tag type: `PrivateFile`

### Endpoints used

- `POST /api/companies/{company_id}/files/` (multipart `file`, optional `checksum_sha256`)
- `POST /api/company-groups/{group_id}/messages/` with `{ text?, attachments: [{attachment_type, resource_id}] }`
- `GET /api/message-attachments/{id}/open/`
- `GET /api/message-attachments/{id}/download/` (files only; financial docs open as data)

Storage-file endpoints exist in the contract and are available via the same authorized helper pattern; the messaging UI prefers **message-attachment** open/download so group membership context is enforced.

### Behavior

- Upload → require `upload_status === "ready"` before pending attach (handles duplicate `200` + `duplicate: true`).
- Send text-only, attachment-only, or combined.
- Received attachments: show metadata; if `is_available` false, block actions.
- File open: authorized binary inline; file download: authorized download disposition.
- Financial document open: authorized JSON → navigate to cost-report wizard with `existingDocument`.
- Upload/send progress via loading states; errors via toasts (`getApiErrorMessage` / status-specific binary errors).
- No permanent public URLs constructed from IDs.

### Removed workarounds

- Phase 4 “attachments later” placeholder text and toast-only wizard return replaced by real pending `financial_document` attachment seeding.

## Preserved Phase 1–4 behavior

- Session + CSRF, members/roles/groups, projects/cost reports, text messaging + pagination + quota-on-send handling unchanged in intent.
- No wallet / 5-token / subscription / payment UI.

## Intentionally out of scope

- Standalone company file manager / file list UI (no list-files endpoint in contract)
- Wallet / subscriptions / payments
- Invented MIME/size client limits (backend validates)

## Contract notes / mismatches

1. OpenAPI provides **upload** for company files but **no list/delete** private-files collection endpoint. Frontend therefore supports upload-for-attach only, not a general file browser.
2. Message-attachment `/download/` returns 400 for financial-document types — UI only offers download for `file` attachments and opens documents via `/open/`.
3. `tokenAuth` still listed beside `cookieAuth`; frontend continues session + CSRF only.

## Risks / remaining limitations

- Live storage backend must be available; `503 storage_unavailable` is surfaced without leaking storage internals.
- Opening large binaries uses blob object URLs (revoked after open/download).
- Automated upload/download tests are not available in this repo.

## Stop point

Phase 5 complete for review. Phase 6 not started. No commit/push performed.

---

## Post-v1 correction (2026-07-28) — no project message attachments

Compose/create paths remain limited to `file` and `financial_document` per OpenAPI `AttachmentTypeEnum`.

- No project-attachment action in the plus menu.
- Historical unsupported attachment types render read-only (no create/open/download actions invented).
- File upload and financial-document attach flows are unchanged.

