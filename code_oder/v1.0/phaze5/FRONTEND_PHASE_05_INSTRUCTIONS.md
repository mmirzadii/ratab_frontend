# Phase 5 — Private Files and Message Attachments

Read the common rules, private-file and attachment contract, prior reports, and the completed messaging implementation.

## Goal

Add secure private-file handling and the supported message attachment types.

## Work

- Integrate private file upload, metadata, authorized opening/downloading, and backend validation errors.
- Add message attachments for `file` and `financial_document` exactly as defined by the backend contract.
- Reuse existing financial-document selection/display patterns where practical.
- Handle upload/send progress, retry, forbidden/not-found states, and unavailable private resources.
- Remove old route-state or local attachment workarounds after the server-backed flow is proven.
- Never construct public/private file URLs from raw IDs or assume a public storage URL exists.

Run the relevant checks, update `phaze5/` reports, and stop.
