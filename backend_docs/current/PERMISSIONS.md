# Permissions — backend-enforced matrix

Backend version: `v1.0` cumulative. UI may hide actions; **security is enforced
by the backend**. Knowing a raw numeric ID never grants access.

Roles: `owner`, `admin`, `employee`.

Legend: **Y** = allowed when other preconditions hold · **N** = denied ·
**—** = not applicable

## Company workspace

| Action | Anonymous | Auth non-member | Employee | Admin | Owner |
| --- | :---: | :---: | :---: | :---: | :---: |
| List/create own companies | N | Y create / list own | Y | Y | Y |
| View company detail | N | N | Y | Y | Y |
| Update company / slug | N | N | N | Y | Y |
| List members | N | N | Y | Y | Y |
| Add member | N | N | N | employees only | any role |
| Change member role | N | N | N | employees only | any role |
| Deactivate / remove member | N | N | N | employees only | any (except last owner) |
| Demote/remove last active owner | N | N | N | N | N |
| View slug history | N | N | Y | Y | Y |
| Access another company's data | N | N | N | N | N |

## Groups

| Action | Employee non-member | Employee member/creator | Admin/Owner |
| --- | :---: | :---: | :---: |
| Create group | Y (becomes member) | Y | Y |
| List groups | only groups they belong to | same | all active company groups |
| Update / deactivate group | only if creator **and** still member | same | Y |
| Add / remove group members | only if creator **and** still member | same | Y |

## Messaging and attachments

Stricter than group administration:

| Action | Company admin not in group | Active group member | Non-member |
| --- | :---: | :---: | :---: |
| List/create messages | N | Y | N |
| Open file attachment | N | Y | N |
| Open financial-document attachment | N | Y | N |

Active attachment types: `file`, `financial_document` only.

## Projects, pricebooks, financial documents

| Action | Active company member | Non-member / other company |
| --- | :---: | :---: |
| List/create projects in company | Y | N |
| Browse pricebooks / calculate preview | Y (authenticated) | N if unauthenticated |
| Create/edit financial docs/lines in company | Y | N |
| Lock / preview / export metadata | Y | N |
| Open export download | Y with document access | N |

Locked documents reject mutating line operations (backend returns conflict /
validation denial). Frontend should disable edit UI after lock, but must handle
backend denial.

## Private files

| Action | Active member of file's company | Other company / anonymous |
| --- | :---: | :---: |
| Upload to company | Y | N |
| Open / download | Y | N |

Responses never expose storage keys, credentials, or permanent public URLs.

## Wallet, subscription, quota, payments

| Resource | Visibility |
| --- | --- |
| Token wallet / ledger | Authenticated user sees **own** wallet only |
| Subscription / message quota | Authenticated user sees **own** status only |
| Subscription plans list | Authenticated; active plans only |
| Start payment order | Authenticated, but currently always `PAYMENTS_DISABLED` |
| Grant tokens / activate subscription | **Admin/operator only** — not frontend APIs |

## Cross-company and raw-ID rules

- Company A users never read company B projects, documents, files, groups, or
  messages.
- Attachment open verifies message + group membership context.
- Frontend must treat 403/404 as opaque access failures and must not probe IDs.
