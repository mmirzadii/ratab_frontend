# Phase 11 — Approved Product Decisions

These decisions are final for this phase and must not be reinterpreted by the implementation agent.

## 1. Family and year are separate

A pricebook is a family/type, for example:

- `building` → `ابنیه`
- `mechanical` → `تأسیسات مکانیکی`
- `electrical` → `تأسیسات برقی`
- future families are manifest-driven and must not require hardcoded frontend logic.

A year is a separate integer such as `1396`, `1403`, `1404`, or `1405`.

A persisted financial document references one concrete PricebookEdition. The client selects family + year, but submits the resolved edition ID.

## 2. Base year

The base year for every family is currently `1404`.

The base year is stored per family in its manifest so it can change later without a code deployment.

The base-year source must be complete and self-contained.

## 3. Direct inheritance only

For every non-base year `Y`, including years before and after 1404:

```text
effective(Y) = complete base(1404) + overlay(Y)
```

There is no chain inheritance.

Examples:

```text
1403 = 1404 + overlay(1403)
1405 = 1404 + overlay(1405)
1406 = 1404 + overlay(1406)
```

1406 must never inherit from 1405.

## 4. Complete yearly prices

Every available year folder must contain one complete:

```text
prices.xlsx
```

The price file is not sparse and must not fall back to 1404.

## 5. Sparse structural overlays

For non-base years:

- unchanged chapter/group/item source is absent and inherited directly from 1404;
- a changed or newly added chapter/group/item is present in the year folder;
- a changed/new item directory is complete, not a partial patch;
- a changed chapter/group JSON file is complete;
- a deleted entity is represented by an empty directory with the same entity identifier.

Because Git cannot retain a truly empty directory, a directory containing only `.deleted` is the repository-safe equivalent of an empty deletion directory. Both forms mean deletion. No other file may coexist with `.deleted`.

## 6. Root-file inheritance

For root-level source files such as `final_calculate.py`:

- if target year has the file, it overrides base;
- if absent, it inherits directly from base 1404.

The same rule may be applied to explicitly supported root metadata/source files after validation.

`prices.xlsx` is excluded from inheritance and is always required per year.

## 7. Full database materialization

Files may be sparse. The database must not be sparse.

Every imported PricebookEdition must contain a complete effective set of:

- chapters;
- groups;
- raw pricebook rows;
- logical items;
- item-row mappings;
- notes/footnotes/requirements;
- one active official price set and complete row prices.

API reads must not assemble an edition from multiple years at request time.

## 8. Calculation-source provenance

Every effective calculation source must be resolvable safely.

The engine must not assume every file exists under `edition.source_dir/rows/...`.

For inherited items, source provenance points to base 1404. For overridden items, it points to the target year. Root `final_calculate.py` provenance follows the approved override rule.

No `/tmp`, pytest temporary, developer-absolute, or deleted path may be persisted.

## 9. Base-year changes

When a family manifest changes its `base_year`, all editions of that family must be rebuilt from the new base before activation.

The system must detect stale materializations and fail closed. It must not silently serve editions built from the former base.

## 10. Price sets

The data model may continue supporting multiple price sets, but normal yearly import creates exactly one active official set equivalent to:

```text
official-<year>
```

There must be at most one active official price set per edition.

## 11. Frontend display

Family dropdown examples:

```text
ابنیه
تأسیسات مکانیکی
تأسیسات برقی
```

Do not include year in the family label.

Year dropdown contains only numeric available years for the selected family.

Default year is the newest imported active year that actually exists for that family.

## 12. Document immutability

After FinancialDocument creation, its pricebook family/year/edition is immutable.

Opening an existing document must retain its saved edition even when newer editions exist.

Changing family/year requires creating a new document.

## 13. Current data reset

The project owner authorizes a Local-development scoped reset of the current pricebook catalog and dependent cost-report development data so the new architecture starts cleanly.

This does not authorize dropping the whole database or deleting accounts, companies, memberships, groups, ordinary messages, wallets, subscriptions, or unrelated files.

The reset must be backup-first, dependency-aware, explicit, Local-only, and fail closed outside Local/DEBUG.
