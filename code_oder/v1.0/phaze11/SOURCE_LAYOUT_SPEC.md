# Canonical Pricebook Source Layout — Phase 11

## Family root

Each family lives under one stable directory:

```text
data/
  building_pricebook/
  mechanical_pricebook/
  electrical_pricebook/
  ...
```

Each active family root contains `pricebook.json`.

Example:

```json
{
  "schema_version": 1,
  "family_code": "building",
  "title_fa": "ابنیه",
  "official_title_fa": "فهرست‌بهای واحد پایه رشته ابنیه",
  "base_year": 1404,
  "discipline": "building",
  "currency_code": "IRR",
  "sort_order": 10,
  "legacy_aliases": ["ABN1404"]
}
```

Rules:

- `family_code` is stable, ASCII, lowercase, and contains no year;
- `title_fa` is the short dropdown label;
- `official_title_fa` is used to build Edition/document titles;
- `base_year` is data-owned, not hardcoded in services or React;
- folder name and family code are mapped by manifest, not inferred through fragile string slicing.

## Base year layout

The base year is complete:

```text
data/building_pricebook/1404/
  chapters/
    CH01.json
    CH02.json
    ...
  groups/
    0101.json
    0102.json
    ...
  rows/
    0101-1/
      properties.json
      calculate.py
      footnotes/          # where applicable
      requirments/        # preserve existing spelling
    ...
  prices.xlsx
  final_calculate.py
  building_1404.docx      # optional archival/source document
```

Base-year requirements:

- no tombstone directories;
- chapters/groups/rows must be complete;
- all references must resolve;
- `prices.xlsx` is complete;
- required calculation files must exist;
- row codes remain strings.

## Non-base direct overlay

Example year 1405:

```text
data/building_pricebook/1405/
  chapters/
    CH07.json             # complete changed/new chapter
    CH15/                 # empty or only .deleted => chapter absent in 1405
  groups/
    0102.json             # complete changed/new group
    0312/                 # empty or only .deleted => group absent in 1405
  rows/
    0102-4/               # complete changed/new item directory
      properties.json
      calculate.py
      ...
    0201-3/               # empty or only .deleted => item absent in 1405
  prices.xlsx             # complete prices for 1405; always required
  final_calculate.py      # optional override; otherwise inherit 1404
```

## Overlay resolution

For `chapters`, `groups`, and `rows`:

1. Start from the complete base-year entity map.
2. Apply only the selected target year's overlay.
3. Do not inspect or inherit any intermediate year.
4. A missing target entity inherits the base entity.
5. A complete target entity replaces the base entity.
6. An empty deletion directory removes the base entity.
7. A new target entity is added.

### Chapter entity key

Canonical base/override file:

```text
chapters/CH01.json
```

Deletion tombstone:

```text
chapters/CH01/
```

or:

```text
chapters/CH01/.deleted
```

### Group entity key

Canonical base/override file:

```text
groups/0101.json
```

Deletion tombstone:

```text
groups/0101/
```

or:

```text
groups/0101/.deleted
```

### Item/logical-row entity key

Canonical base/override directory:

```text
rows/0101-1/
```

Deletion tombstone is the same directory but truly empty or containing only `.deleted`.

A non-empty changed/new item directory must contain the complete source required by its current schema. Partial item-directory patches are invalid.

## Tombstone validation

Reject:

- file and tombstone with the same entity key;
- `.deleted` plus any other content;
- tombstone for an unknown base entity unless explicitly allowed by schema;
- child overrides under a deleted chapter/group;
- entity filename/code mismatch;
- accidental housekeeping files that make deletion ambiguous;
- empty non-base directories that are not valid entity tombstones.

## Root files

Resolve supported root files independently:

```text
resolved_file(year, path) = target-year file if present, otherwise base-year file
```

This applies to `final_calculate.py` and other explicitly registered root source files.

It never applies to `prices.xlsx`.

## Effective-source fingerprint

Materialization must calculate deterministic hashes for:

- family manifest;
- base structural source;
- target overlay source;
- resolved effective structure;
- target `prices.xlsx`;
- effective root calculation files;
- importer/schema version.

Hashes and provenance must be recorded so a source change can mark an Edition stale and prevent silent drift.
