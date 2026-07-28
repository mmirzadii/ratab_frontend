# ratab v0.0 Backend Frontend Handoff

This document is the backend handoff for starting frontend development against the current online dev/demo backend.

This is not production.

## Backend Base URL

Use the current online dev/demo backend:

```text
https://hw2momirzadipayload.darkube.ir
```

There is no active custom `ratab.ir` backend deployment connected to this app. Do not use `api-dev.ratab.ir` or `dev.ratab.ir` as active URLs yet.

`GET /api/` returns `404 Not Found`; this is expected because the backend does not define an API root route. Use the explicit routes below.

## Frontend Environment

Use one of these depending on the frontend framework:

```env
VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

```env
NEXT_PUBLIC_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

Only one should be used, based on the actual frontend stack. No frontend app exists in this backend repository.

## Authentication

The backend uses DRF token authentication for v0.0 dev work.

Send authenticated requests with:

```text
Authorization: Token <token>
```

Temporary dev login is available on online dev/demo only while `ENABLE_DEV_LOGIN=true`.

### Dev Login

`POST /api/auth/dev-login/`

Auth required: no.

Request fields:

- `phone_number`: string, required, max 20.
- `display_name`: string, optional, max 160, may be blank.

Example request:

```bash
curl -i -X POST "$API_BASE_URL/api/auth/dev-login/" \
  -H "Content-Type: application/json" \
  -d '{"phone_number":"09120000000","display_name":"Frontend Dev User"}'
```

Example response:

```json
{
  "token": "<dev-token>",
  "created": true,
  "user": {
    "id": 1,
    "phone_number": "09120000000",
    "display_name": "Frontend Dev User",
    "is_active": true,
    "is_staff": false,
    "created_at": "2026-06-06T08:00:00+03:30",
    "updated_at": "2026-06-06T08:00:00+03:30"
  },
  "temporary_auth": true
}
```

Frontend dev handling:

- Store the token only for the dev session.
- Send `Authorization: Token <token>` on all protected API requests.
- Do not treat dev-login as production auth, OTP, or password login.
- If dev-login is disabled, the endpoint returns `404`.

### Current User

`GET /api/auth/me/`

Auth required: yes.

Example request:

```bash
curl -i "$API_BASE_URL/api/auth/me/" \
  -H "Authorization: Token <dev-token>"
```

Example response:

```json
{
  "id": 1,
  "phone_number": "09120000000",
  "display_name": "Frontend Dev User",
  "is_active": true,
  "is_staff": false,
  "created_at": "2026-06-06T08:00:00+03:30",
  "updated_at": "2026-06-06T08:00:00+03:30"
}
```

## Route Inventory

All routes below are relative to `https://hw2momirzadipayload.darkube.ir`.

| Method | Route | Auth | Notes |
| --- | --- | --- | --- |
| GET | `/api/health/` | No | Public health JSON. |
| POST | `/api/auth/dev-login/` | No | Dev-only token login. |
| GET | `/api/auth/me/` | Yes | Current user. |
| GET | `/api/companies/` | Yes | Paginated company list. |
| POST | `/api/companies/` | Yes | Create company and owner membership. |
| GET | `/api/companies/{id}/` | Yes | Company detail, company-isolated. |
| PATCH | `/api/companies/{id}/` | Yes | Partial company update. |
| GET | `/api/companies/{id}/members/` | Yes | Company members. |
| GET | `/api/companies/{id}/projects/` | Yes | Project list for company. |
| POST | `/api/companies/{id}/projects/` | Yes | Create project for company. |
| GET | `/api/projects/{id}/` | Yes | Project detail, company-isolated. |
| PATCH | `/api/projects/{id}/` | Yes | Partial project update. |
| GET | `/api/pricebooks/` | Yes | Paginated active pricebooks. |
| GET | `/api/pricebooks/{id}/editions/` | Yes | Editions for a pricebook. |
| GET | `/api/pricebook-editions/{id}/chapters/` | Yes | Chapters for an edition. |
| GET | `/api/pricebook-chapters/{id}/groups/` | Yes | Groups for a chapter. |
| GET | `/api/pricebook-items/` | Yes | Paginated item list. Supports filters. |
| GET | `/api/pricebook-items/{id}/` | Yes | Item detail with rows, requirements, footnotes. |
| POST | `/api/pricebook-items/{id}/calculate/` | Yes | Calculate one simple priced item. |
| GET | `/api/projects/{id}/coefficient-sets/` | Yes | Coefficient sets for project. |
| POST | `/api/projects/{id}/coefficient-sets/` | Yes | Create coefficient set. |
| GET | `/api/coefficient-sets/{id}/values/` | Yes | Coefficient values for set. |
| POST | `/api/coefficient-sets/{id}/values/` | Yes | Create coefficient value. |
| PATCH | `/api/coefficient-values/{id}/` | Yes | Partial coefficient value update. |
| DELETE | `/api/coefficient-values/{id}/` | Yes | Delete coefficient value. |
| GET | `/api/projects/{id}/financial-documents/` | Yes | Financial documents for project. |
| POST | `/api/projects/{id}/financial-documents/` | Yes | Create financial document. |
| GET | `/api/financial-documents/{id}/` | Yes | Financial document detail. |
| PATCH | `/api/financial-documents/{id}/` | Yes | Partial document update while draft. |
| POST | `/api/financial-documents/{id}/lines/` | Yes | Add pricebook line while draft. |
| POST | `/api/financial-documents/{id}/recalculate/` | Yes | Recalculate totals while draft. |
| POST | `/api/financial-documents/{id}/lock/` | Yes | Lock document. |
| PATCH | `/api/financial-document-lines/{id}/` | Yes | Update line quantity while draft. |
| DELETE | `/api/financial-document-lines/{id}/` | Yes | Delete line while draft. |
| GET | `/api/financial-documents/{id}/preview/` | Yes | Server-rendered HTML preview. |
| POST | `/api/financial-documents/{id}/exports/` | Yes | Create export metadata. PDF file generation is blocked. |
| GET | `/api/financial-document-exports/{id}/download/` | Yes | Download ready export file. Current blocked PDF exports return `409`. |

## Response Shape Notes

DRF pagination is enabled with page size 50.

Top-level list endpoints implemented with DRF list mixins return:

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": []
}
```

Nested custom list actions usually return plain arrays, for example `/api/companies/{id}/projects/` and `/api/pricebooks/{id}/editions/`.

## Core Flows

### Flow A: Dev Login

1. `POST /api/auth/dev-login/` with `phone_number` and optional `display_name`.
2. Store `token` from the response for the dev session.
3. Call `GET /api/auth/me/` with `Authorization: Token <token>`.

### Flow B: Company And Project Setup

1. `GET /api/companies/` to list accessible companies.
2. If none exists, `POST /api/companies/`.
3. `GET /api/companies/{company_id}/projects/` to list projects.
4. `POST /api/companies/{company_id}/projects/` to create a project.
5. Company/project APIs enforce membership isolation. A user cannot access another company's projects, documents, coefficients, exports, or files.

### Flow C: Browse Pricebook

1. `GET /api/pricebooks/` to list active pricebooks.
2. `GET /api/pricebooks/{pricebook_id}/editions/` to list editions and their active/default price set when available.
3. `GET /api/pricebook-editions/{edition_id}/chapters/` to list chapters.
4. `GET /api/pricebook-chapters/{chapter_id}/groups/` to list groups.
5. `GET /api/pricebook-items/?edition_id={edition_id}&chapter_id={chapter_id}&group_id={group_id}&q={search}` to list items.
6. `GET /api/pricebook-items/{item_id}/` to get rows, requirements, and footnotes.

Pricebook item filters:

- `edition_id`: optional integer.
- `chapter_id`: optional integer.
- `group_id`: optional integer.
- `q`: optional text search across item key, item name, row code, and row title.

### Flow D: Calculate A Pricebook Item

1. Select an item from `GET /api/pricebook-items/` or item detail.
2. Submit `POST /api/pricebook-items/{item_id}/calculate/` with `quantity`.
3. Without coefficients, backend returns `base_amount`, `coefficient_amount="0"`, and `total_amount=base_amount`.
4. With `coefficient_set_id`, backend applies active matching coefficients and returns `applied_coefficients`.
5. If the row has no official price, backend returns a validation error with `requires_manual_unit_price=true`. The frontend must not treat missing prices as zero.

### Flow E: Coefficients

1. Create a coefficient set with `POST /api/projects/{project_id}/coefficient-sets/`.
2. Add values with `POST /api/coefficient-sets/{set_id}/values/`.
3. Use only these active v0.0 coefficient keys in frontend flows:
   - `regional`
   - `overhead`
   - `floor`
   - `proposal`
   - `custom_1`
   - `custom_2`
4. Supported v0.0 scopes:
   - `project`
   - `chapter`
   - `row`
5. Deterministic application order:
   - `regional`
   - `overhead`
   - `floor`
   - `proposal`
   - `custom_1`
   - `custom_2`

The backend validator currently accepts some future keys, but the v0.0 resolver only applies the active keys above. The frontend should not expose future keys yet.

### Flow F: Financial Documents

1. `GET /api/projects/{project_id}/financial-documents/` to list documents.
2. `POST /api/projects/{project_id}/financial-documents/` to create a `cost_report`.
3. `POST /api/financial-documents/{document_id}/lines/` to add pricebook item lines.
4. `POST /api/financial-documents/{document_id}/recalculate/` to refresh totals.
5. `POST /api/financial-documents/{document_id}/lock/` to lock. Locked documents reject further edits in v0.0.
6. `GET /api/financial-documents/{document_id}/preview/` to render HTML preview.

Use `active_price_set.id` from `GET /api/pricebooks/{pricebook_id}/editions/` as `price_set_id` when creating a financial document. If `active_price_set` is `null`, the frontend may browse and calculate supported pricebook items, but should not create a financial document until an active price set exists for the selected edition.

### Flow G: HTML Preview And Export

1. Open `GET /api/financial-documents/{document_id}/preview/` in an authenticated browser request or fetch the HTML and render it.
2. Create export metadata with `POST /api/financial-documents/{document_id}/exports/`.
3. PDF binary generation is not available in v0.0. Export creation records failed PDF metadata with a render snapshot and error message.
4. `GET /api/financial-document-exports/{export_id}/download/` may return `409 Conflict` if the export is not ready, failed, or has no file.

## Request And Response Examples

All IDs are placeholders. Use returned IDs from prior requests.

### Company Create

Request:

```http
POST /api/companies/
Authorization: Token <token>
Content-Type: application/json
```

```json
{
  "name": "Demo Company",
  "legal_name": "Demo Company LLC",
  "registration_number": "REG-001",
  "national_id": "NAT-001",
  "active_slug": "demo-company"
}
```

Response `201`:

```json
{
  "id": 10,
  "name": "Demo Company",
  "legal_name": "Demo Company LLC",
  "registration_number": "REG-001",
  "national_id": "NAT-001",
  "active_slug": "demo-company",
  "owner_member_id": 21,
  "is_active": true,
  "created_at": "2026-06-06T08:00:00+03:30",
  "updated_at": "2026-06-06T08:00:00+03:30"
}
```

### Company List

`GET /api/companies/`

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 10,
      "name": "Demo Company",
      "legal_name": "Demo Company LLC",
      "registration_number": "REG-001",
      "national_id": "NAT-001",
      "active_slug": "demo-company",
      "owner_member_id": 21,
      "is_active": true,
      "created_at": "2026-06-06T08:00:00+03:30",
      "updated_at": "2026-06-06T08:00:00+03:30"
    }
  ]
}
```

### Project Create

`POST /api/companies/{company_id}/projects/`

```json
{
  "project_code": "PRJ-001",
  "name": "Demo Project",
  "contract_number": "CON-001",
  "employer_name": "Demo Employer",
  "consultant_name": "Demo Consultant",
  "contractor_name": "Demo Contractor",
  "executive_agency_name": "Demo Agency",
  "base_year": 1404,
  "status": "draft",
  "starts_on": "2026-06-01",
  "ends_on": null,
  "description": "Dev test project"
}
```

Response `201`:

```json
{
  "id": 20,
  "company_id": 10,
  "created_by_member_id": 21,
  "project_code": "PRJ-001",
  "name": "Demo Project",
  "contract_number": "CON-001",
  "employer_name": "Demo Employer",
  "consultant_name": "Demo Consultant",
  "contractor_name": "Demo Contractor",
  "executive_agency_name": "Demo Agency",
  "base_year": 1404,
  "status": "draft",
  "starts_on": "2026-06-01",
  "ends_on": null,
  "description": "Dev test project",
  "created_at": "2026-06-06T08:00:00+03:30",
  "updated_at": "2026-06-06T08:00:00+03:30"
}
```

### Project List

`GET /api/companies/{company_id}/projects/`

```json
[
  {
    "id": 20,
    "company_id": 10,
    "created_by_member_id": 21,
    "project_code": "PRJ-001",
    "name": "Demo Project",
    "contract_number": "CON-001",
    "employer_name": "Demo Employer",
    "consultant_name": "Demo Consultant",
    "contractor_name": "Demo Contractor",
    "executive_agency_name": "Demo Agency",
    "base_year": 1404,
    "status": "draft",
    "starts_on": "2026-06-01",
    "ends_on": null,
    "description": "Dev test project",
    "created_at": "2026-06-06T08:00:00+03:30",
    "updated_at": "2026-06-06T08:00:00+03:30"
  }
]
```

### Pricebook Browse

`GET /api/pricebooks/`

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "code": "ABN1404",
      "title_fa": "<Persian pricebook title>",
      "discipline": "",
      "is_active": true
    }
  ]
}
```

`GET /api/pricebooks/{pricebook_id}/editions/`

```json
[
  {
    "id": 2,
    "pricebook_id": 1,
    "code": "ABN1404-1404",
    "year": 1404,
    "title_fa": "<Persian edition title>",
    "currency_code": "IRR",
    "is_locked": true,
    "active_price_set": {
      "id": 7,
      "code": "ABN1404-1404-prices",
      "title_fa": "Unit prices 1404",
      "is_active": true
    }
  }
]
```

If no active price set exists for the edition, `active_price_set` is `null`.

`GET /api/pricebook-editions/{edition_id}/chapters/`

```json
[
  {
    "id": 3,
    "edition_id": 2,
    "chapter_code": "01",
    "title_fa": "<Persian chapter title>",
    "sort_order": 1
  }
]
```

`GET /api/pricebook-chapters/{chapter_id}/groups/`

```json
[
  {
    "id": 4,
    "chapter_id": 3,
    "group_code": "01",
    "title_fa": "<Persian group title>",
    "sort_order": 1
  }
]
```

`GET /api/pricebook-items/?edition_id=2&chapter_id=3&group_id=4&q=010101`

```json
{
  "count": 1,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 5,
      "item_key": "0101-1",
      "short_name_fa": "<Persian item title>",
      "unit": "m3",
      "group_id": 4,
      "chapter_id": 3,
      "edition_id": 2,
      "unit_price": "12345.0000",
      "has_more_details": false
    }
  ]
}
```

`GET /api/pricebook-items/{item_id}/`

```json
{
  "id": 5,
  "item_key": "0101-1",
  "short_name_fa": "<Persian item title>",
  "unit": "m3",
  "rows": [
    {
      "id": 6,
      "row_code": "010101",
      "title_fa": "<Persian row title>",
      "short_title_fa": "<Persian short row title>",
      "unit": "m3",
      "unit_price": "12345.0000",
      "currency_code": "IRR",
      "min_value": "0.000000",
      "max_value": null,
      "selection_rule": "",
      "requires_manual_unit_price": false
    }
  ],
  "unit_price": "12345.0000",
  "requirements": [],
  "footnotes": [],
  "has_more_details": false
}
```

### Item Calculate Without Coefficients

`POST /api/pricebook-items/{item_id}/calculate/`

```json
{
  "quantity": "10"
}
```

Response `200`:

```json
{
  "item_id": 5,
  "item_key": "0101-1",
  "row_id": 6,
  "row_code": "010101",
  "quantity": "10.000000",
  "unit": "m3",
  "unit_price": "12345.0000",
  "currency_code": "IRR",
  "base_amount": "123450.0000000000",
  "coefficient_amount": "0",
  "total_amount": "123450.0000000000",
  "applied_coefficients": [],
  "calculation_input": {
    "quantity": "10.000000",
    "coefficient_set_id": null
  },
  "calculation_output": {
    "base_amount": "123450.0000000000",
    "coefficient_amount": "0",
    "total_amount": "123450.0000000000",
    "applied_coefficients": [],
    "formula": "quantity * unit_price"
  },
  "requires_manual_unit_price": false
}
```

Manual-price error shape:

```json
{
  "detail": "No official unit price is available for this item.",
  "requires_manual_unit_price": true
}
```

### Item Calculate With Coefficients

`POST /api/pricebook-items/{item_id}/calculate/`

```json
{
  "quantity": "10",
  "coefficient_set_id": 30
}
```

Response `200`:

```json
{
  "item_id": 5,
  "item_key": "0101-1",
  "row_id": 6,
  "row_code": "010101",
  "quantity": "10.000000",
  "unit": "m3",
  "unit_price": "12345.0000",
  "currency_code": "IRR",
  "base_amount": "123450.0000000000",
  "coefficient_amount": "37035.0000000000",
  "total_amount": "160485.0000000000",
  "applied_coefficients": [
    {
      "coefficient_value_id": 31,
      "coefficient_key": "overhead",
      "label_fa": "Overhead",
      "scope": "project",
      "multiplier": "1.30000000",
      "amount_before": "123450.0000000000",
      "amount_after": "160485.0000000000",
      "effect_amount": "37035.0000000000"
    }
  ],
  "calculation_input": {
    "quantity": "10.000000",
    "coefficient_set_id": 30
  },
  "calculation_output": {
    "base_amount": "123450.0000000000",
    "coefficient_amount": "37035.0000000000",
    "total_amount": "160485.0000000000",
    "applied_coefficients": [
      {
        "coefficient_value_id": 31,
        "coefficient_key": "overhead",
        "label_fa": "Overhead",
        "scope": "project",
        "multiplier": "1.30000000",
        "amount_before": "123450.0000000000",
        "amount_after": "160485.0000000000",
        "effect_amount": "37035.0000000000"
      }
    ],
    "formula": "quantity * unit_price"
  },
  "requires_manual_unit_price": false
}
```

### Coefficient Set Create

`POST /api/projects/{project_id}/coefficient-sets/`

```json
{
  "name": "Main coefficients",
  "is_default": true
}
```

Response `201`:

```json
{
  "id": 30,
  "project_id": 20,
  "name": "Main coefficients",
  "is_default": true,
  "created_by_member_id": 21,
  "created_at": "2026-06-06T08:00:00+03:30"
}
```

### Coefficient Value Create

`POST /api/coefficient-sets/{set_id}/values/`

Project scope:

```json
{
  "coefficient_key": "overhead",
  "scope": "project",
  "label_fa": "Overhead",
  "multiplier": "1.30000000",
  "is_active": true
}
```

Chapter scope:

```json
{
  "coefficient_key": "regional",
  "scope": "chapter",
  "chapter_id": 3,
  "label_fa": "Regional chapter coefficient",
  "multiplier": "1.10000000",
  "is_active": true
}
```

Row scope:

```json
{
  "coefficient_key": "floor",
  "scope": "row",
  "row_id": 6,
  "label_fa": "Floor row coefficient",
  "multiplier": "1.05000000",
  "is_active": true
}
```

Response `201`:

```json
{
  "id": 31,
  "coefficient_set_id": 30,
  "coefficient_key": "overhead",
  "scope": "project",
  "chapter_id": null,
  "row_id": null,
  "label_fa": "Overhead",
  "multiplier": "1.30000000",
  "is_active": true,
  "created_at": "2026-06-06T08:00:00+03:30"
}
```

### Financial Document Create

`POST /api/projects/{project_id}/financial-documents/`

```json
{
  "document_type": "cost_report",
  "document_number": "CR-001",
  "title": "Cost report 001",
  "report_title": "Monthly report",
  "document_date": "2026-06-06",
  "period_start_on": "2026-06-01",
  "period_end_on": "2026-06-30",
  "pricebook_edition_id": 2,
  "price_set_id": 7,
  "coefficient_set_id": 30
}
```

Response `201`:

```json
{
  "id": 40,
  "company_id": 10,
  "project_id": 20,
  "document_type": "cost_report",
  "document_label_fa": "<Persian cost report label>",
  "document_number": "CR-001",
  "title": "Cost report 001",
  "report_title": "Monthly report",
  "document_date": "2026-06-06",
  "period_start_on": "2026-06-01",
  "period_end_on": "2026-06-30",
  "status": "draft",
  "pricebook_edition_id": 2,
  "price_set_id": 7,
  "coefficient_set_id": 30,
  "created_by_member_id": 21,
  "calculated_at": null,
  "locked_at": null,
  "locked_by_member_id": null,
  "totals_snapshot_json": {
    "line_count": 0,
    "chapter_count": 0,
    "pricebook_amount": "0.0000",
    "coefficient_amount": "0.0000",
    "total_amount": "0.0000"
  },
  "lines": [],
  "chapter_totals": [],
  "created_at": "2026-06-06T08:00:00+03:30",
  "updated_at": "2026-06-06T08:00:00+03:30"
}
```

### Financial Document Line Create

`POST /api/financial-documents/{document_id}/lines/`

```json
{
  "pricebook_item_id": 5,
  "quantity": "10"
}
```

Response `201`:

```json
{
  "id": 50,
  "document_id": 40,
  "line_no": 1,
  "line_source": "pricebook",
  "pricebook_item_id": 5,
  "pricebook_row_id": 6,
  "row_code_snapshot": "010101",
  "chapter_code_snapshot": "01",
  "chapter_title_snapshot": "<Persian chapter title>",
  "description_snapshot": "<Persian row title>",
  "unit_snapshot": "m3",
  "quantity": "10.000000",
  "unit_price_snapshot": "12345.0000",
  "base_amount_snapshot": "123450.0000",
  "coefficient_amount_snapshot": "37035.0000",
  "total_amount_snapshot": "160485.0000",
  "calculation_input_json": {
    "pricebook_item_id": 5,
    "quantity": "10.000000",
    "price_set_id": 7,
    "coefficient_set_id": 30
  },
  "calculation_output_json": {
    "base_amount": "123450.0000",
    "coefficient_amount": "37035.0000",
    "total_amount": "160485.0000",
    "applied_coefficients": [
      {
        "coefficient_value_id": 31,
        "coefficient_key": "overhead",
        "label_fa": "Overhead",
        "scope": "project",
        "multiplier": "1.30000000",
        "amount_before": "123450.0000",
        "amount_after": "160485.0000",
        "effect_amount": "37035.0000"
      }
    ],
    "formula": "quantity * unit_price_snapshot"
  },
  "line_coefficients": [
    {
      "id": 60,
      "coefficient_key": "overhead",
      "label_fa": "Overhead",
      "multiplier": "1.30000000",
      "applied_amount": "37035.0000",
      "source_coefficient_value_id": 31
    }
  ],
  "created_at": "2026-06-06T08:00:00+03:30",
  "updated_at": "2026-06-06T08:00:00+03:30"
}
```

Manual-price line error:

```json
{
  "detail": "No official unit price is available for this item in the document price set.",
  "requires_manual_unit_price": true
}
```

### HTML Preview Request

`GET /api/financial-documents/{document_id}/preview/`

Response:

```text
HTTP 200
Content-Type: text/html; charset=utf-8
```

Body is server-rendered HTML with:

```html
<html lang="fa" dir="rtl">
```

### Export Request And Blocked Download

`POST /api/financial-documents/{document_id}/exports/`

Request body may be empty:

```json
{}
```

Response `201` in v0.0:

```json
{
  "id": 70,
  "document_id": 40,
  "template_id": 80,
  "export_format": "pdf",
  "status": "failed",
  "file_id": null,
  "render_snapshot_json": {
    "document": {
      "id": 40,
      "title": "Cost report 001"
    },
    "pdf_renderer": {
      "status": "unavailable",
      "reason": "PDF rendering is unavailable in this backend environment. Install and approve Playwright/Chromium or another supported renderer before generating PDF files."
    }
  },
  "error_message": "PDF rendering is unavailable in this backend environment. Install and approve Playwright/Chromium or another supported renderer before generating PDF files.",
  "requested_by_member_id": 21,
  "requested_at": "2026-06-06T08:00:00+03:30",
  "finished_at": "2026-06-06T08:00:00+03:30"
}
```

`GET /api/financial-document-exports/{export_id}/download/`

Current blocked PDF response:

```json
{
  "detail": "The export file is not ready. PDF rendering is currently unavailable."
}
```

Status: `409 Conflict`.

## Known v0.0 Limitations And Frontend Warnings

- No active custom `ratab.ir` domain exists for this app.
- The online dev URL is currently the Darkube URL.
- `/api/` returns `404`; this is expected.
- Most endpoints require `Authorization: Token <token>`.
- Dev-login is temporary and must not be treated as production auth.
- Chapter 99 blank-price rows and all blank official-price rows require manual-price handling in future work.
- Blank Excel prices must not be treated as official zero prices.
- Frontend must not assume every pricebook item has an official unit price.
- Current backend rejects manual-price calculations with `requires_manual_unit_price=true`.
- Financial document creation needs `price_set_id`; use the selected edition's `active_price_set.id`. If `active_price_set` is `null`, do not create the document yet.
- PDF binary generation is not available in v0.0.
- Export metadata can be created, but download may return `409 Conflict`.
- Frontend should display backend validation errors clearly.
- Persian-first and RTL UI is expected.
- Convert Persian digits in user input to Latin digits before API submission where practical, especially for quantities, dates, and numeric IDs.
- Decimal values are returned as strings. Keep them as decimal-safe values in UI code.

## Safe Demo Workflow

1. Use the current Darkube base URL.
2. Create or reuse a dev user with `POST /api/auth/dev-login/`.
3. Store the dev token for the session.
4. Create a company.
5. Create a project.
6. Browse ABN1404 pricebook.
7. Calculate a priced item.
8. Create coefficient set and values if needed.
9. Create a financial document only if the selected edition includes a non-null `active_price_set`.
10. Add lines, recalculate, preview HTML, and test export metadata.
11. Expect PDF download to return `409` until a PDF renderer is approved.

## API Schema and Interactive Docs

Current online dev/demo backend URL:

```text
https://hw2momirzadipayload.darkube.ir
```

After this backend add-on is deployed and API docs are enabled, frontend developers can use:

```text
GET /api/schema/
GET /api/docs/
GET /api/redoc/
```

Schema and docs references:

- OpenAPI schema endpoint: `/api/schema/`
- Swagger UI endpoint: `/api/docs/`
- ReDoc endpoint: `/api/redoc/`
- Static schema file in this repository (historical canonical after reorganization): `backend_docs/history/v0.0/OPENAPI.yaml`

Authentication header for protected API requests:

```http
Authorization: Token <token>
```

API docs security is controlled by backend environment variables:

```env
ENABLE_API_DOCS=true
API_DOCS_PUBLIC=false
```

Recommended online dev setting:

```env
ENABLE_API_DOCS=true
API_DOCS_PUBLIC=false
```

Temporary public online dev docs may be enabled only if the project owner explicitly chooses it for frontend work:

```env
ENABLE_API_DOCS=true
API_DOCS_PUBLIC=true
```

Do not expose public API docs in production by default. Production examples keep:

```env
ENABLE_API_DOCS=false
API_DOCS_PUBLIC=false
```

Frontend env recommendation:

```env
VITE_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

or, for Next.js:

```env
NEXT_PUBLIC_API_BASE_URL=https://hw2momirzadipayload.darkube.ir
```

Only one of these should be used, depending on the frontend framework.
