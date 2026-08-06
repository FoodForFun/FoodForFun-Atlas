# FoodForFun Atlas — Initial MVP Data Model

**Document Version:** 0.2

**Project Version:** 0.1

**Status:** Implemented locally, not yet applied to a remote database

**Last Updated:** August 2026

---

## 1. Purpose and Scope

This document describes the initial MVP database schema defined by
`supabase/migrations/20260805062835_initialize_core_schema.sql`.

The schema supports the minimum Source-to-Story publishing model with seven
tables:

```text
stories
places
themes
sources
story_places
story_themes
story_sources
```

The four entity tables use generated UUID primary keys. The three relationship
tables use composite primary keys. All timestamps use `timestamptz`.

The migration is stored locally but has not been applied to PostgreSQL or a
remote Supabase project.

---

## 2. Relationship Overview

```text
stories --< story_places  >-- places
stories --< story_themes  >-- themes
stories --< story_sources >-- sources

places  -- optional parent_place_id --> places
```

- Stories and Places have a many-to-many relationship.
- Stories and Themes have a many-to-many relationship.
- Stories and Sources have a many-to-many relationship.
- A Place may optionally reference another Place as its parent.
- Relationship rows contain references and creation time only; they do not
  duplicate Story or entity content.

---

## 3. Story Status Model

The initial schema intentionally supports only two Story statuses:

| Status | Meaning | Publicly readable |
| --- | --- | --- |
| `draft` | Work that has not been published | No |
| `published` | Story content eligible for publication | At or after `published_at` |

`draft` is the default. A check constraint rejects any other status, and a
Story cannot have `published` status without a `published_at` value. Public
visibility begins only when `published_at` is less than or equal to the current
database time. This supports future publication times without adding a scheduled
status.

The broader editorial workflow described elsewhere in the project may include
review, approval, or archival concepts. Those workflow statuses are not
implemented in this initial database schema. There is no separate workflow
engine.

---

## 4. `stories`

### Purpose

Stores the edited narratives published by FoodForFun Atlas. Draft and published
content share this table and are separated for public access by Row Level
Security.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Yes | `gen_random_uuid()` | Primary identifier. |
| `title` | `text` | Yes | None | Public Story title. |
| `slug` | `text` | Yes | None | Stable, unique URL identifier. |
| `summary` | `text` | Yes | None | Short Story summary. |
| `body` | `text` | Yes | None | Main Story content. |
| `status` | `text` | Yes | `draft` | Either `draft` or `published`. |
| `cover_image_url` | `text` | No | `null` | Optional cover-image reference; no upload system is implemented. |
| `published_at` | `timestamptz` | No for drafts; required for published Stories | `null` | Publication time and public-visibility boundary. |
| `created_at` | `timestamptz` | Yes | `now()` | Creation time. |
| `updated_at` | `timestamptz` | Yes | `now()` | Last update time, maintained by a trigger. |

### Keys, Constraints, and Indexes

- Primary key: `id`.
- Unique constraint: `stories_slug_key` on `slug`.
- Check constraint: `stories_status_check` permits only `draft` and
  `published`.
- Check constraint: `stories_published_at_check` requires `published_at` for a
  published Story.
- No foreign keys originate from this table.
- Indexes: the primary-key index, unique slug index, `stories_status_idx`,
  `stories_published_at_idx`, and the partial `stories_published_lookup_idx` on
  publication time for published Stories.

### Deletion and Public Read Behavior

Deleting a Story cascades to its rows in all three relationship tables. It does
not delete connected Places, Themes, or Sources.

Anonymous and ordinary authenticated public clients may select only rows whose
status is `published` and whose `published_at` is not in the future. Draft and
future-published Stories are not publicly readable. Public clients have no
insert, update, or delete permission.

---

## 5. `places`

### Purpose

Stores geographic entities connected to Stories, including hierarchical
relationships between Places.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Yes | `gen_random_uuid()` | Primary identifier. |
| `name` | `text` | Yes | None | Place name. |
| `slug` | `text` | Yes | None | Unique public identifier. |
| `place_type` | `text` | No | `null` | Optional classification such as city or neighborhood. |
| `parent_place_id` | `uuid` | No | `null` | Optional reference to a parent Place. |
| `country_code` | `text` | No | `null` | Optional two-letter uppercase country code. |
| `latitude` | `numeric(9,6)` | No | `null` | Optional latitude from -90 through 90. |
| `longitude` | `numeric(9,6)` | No | `null` | Optional longitude from -180 through 180. |
| `location_precision` | `text` | No | `null` | One of `exact`, `neighborhood`, `city`, `region`, or `hidden`. |
| `is_verified` | `boolean` | Yes | `false` | Whether the Place information has been verified. |
| `created_at` | `timestamptz` | Yes | `now()` | Creation time. |
| `updated_at` | `timestamptz` | Yes | `now()` | Last update time, maintained by a trigger. |

### Keys, Constraints, and Indexes

- Primary key: `id`.
- Foreign key: `parent_place_id` references `places.id`.
- Unique constraint: `places_slug_key` on `slug`.
- Check constraints validate country-code format, coordinate ranges, and the
  allowed location-precision values.
- `places_coordinates_precision_check` requires latitude and longitude to be
  both absent or both present. Coordinates may be stored only for `exact`,
  `neighborhood`, `city`, or `region` precision. A Place with `hidden` precision
  cannot store coordinates.
- Indexes: the primary-key index, unique slug index, and
  `places_parent_place_id_idx`.

### Deletion and Public Read Behavior

Deleting a parent Place sets its children's `parent_place_id` to `null`.
Deleting a Place cascades to matching `story_places` rows but does not delete
Stories.

All Place rows are selectable by anonymous and authenticated public clients.
Public clients have no insert, update, or delete permission.

---

## 6. `themes`

### Purpose

Stores reusable editorial concepts used to group and connect Stories.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Yes | `gen_random_uuid()` | Primary identifier. |
| `name` | `text` | Yes | None | Theme name. |
| `slug` | `text` | Yes | None | Unique public identifier. |
| `description` | `text` | No | `null` | Optional explanation of the Theme. |
| `theme_group` | `text` | No | `null` | Optional editorial grouping. |
| `is_active` | `boolean` | Yes | `true` | Whether the Theme remains active for editorial use. |
| `created_at` | `timestamptz` | Yes | `now()` | Creation time. |
| `updated_at` | `timestamptz` | Yes | `now()` | Last update time, maintained by a trigger. |

### Keys, Constraints, and Indexes

- Primary key: `id`.
- Unique constraint: `themes_slug_key` on `slug`.
- No foreign keys originate from this table.
- Indexes: the primary-key index and unique slug index.

### Deletion and Public Read Behavior

Deleting a Theme cascades to matching `story_themes` rows but does not delete
Stories.

Only active Theme rows (`is_active = true`) are selectable by anonymous and
authenticated public clients. Inactive Themes are not publicly readable. Public
clients have no insert, update, or delete permission.

---

## 7. `sources`

### Purpose

Stores original evidence and supporting material separately from edited Story
content.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `id` | `uuid` | Yes | `gen_random_uuid()` | Primary identifier. |
| `source_type` | `text` | Yes | None | Source classification. |
| `original_title` | `text` | No | `null` | Original source title. |
| `source_url` | `text` | No | `null` | Original source URL. |
| `external_id` | `text` | No | `null` | Identifier from an external platform. |
| `publisher` | `text` | No | `null` | Original publisher or channel. |
| `original_published_at` | `timestamptz` | No | `null` | Original publication time. |
| `original_language` | `text` | No | `null` | Original language identifier. |
| `original_description` | `text` | No | `null` | Description supplied by the original source. |
| `raw_transcript` | `text` | No | `null` | Original transcript text. |
| `cleaned_transcript` | `text` | No | `null` | Separately preserved cleaned transcript. |
| `transcript_quality` | `text` | No | `null` | Optional transcript-quality label. |
| `processing_status` | `text` | Yes | `pending` | Current source-processing label. |
| `availability_status` | `text` | No | `null` | Optional source-availability label. |
| `rights_note` | `text` | No | `null` | Optional rights or usage note. |
| `collected_at` | `timestamptz` | Yes | `now()` | Time the Source was collected. |
| `created_at` | `timestamptz` | Yes | `now()` | Record creation time. |
| `updated_at` | `timestamptz` | Yes | `now()` | Last update time, maintained by a trigger. |

### Keys, Constraints, and Indexes

- Primary key: `id`.
- No foreign keys originate from this table.
- No unique constraint is defined for URL or external identifier in the initial
  schema.
- The primary-key index is the only index on this table.

### Deletion and Public Read Behavior

Deleting a Source cascades to matching `story_sources` rows but does not delete
Stories.

A Source row is selectable by anonymous and authenticated public clients only
when it is connected through `story_sources` to at least one Story that is
published and has reached its `published_at` time. A Source connected only to
draft or future-published Stories is not publicly readable.

Public clients may select only these Source metadata columns:

```text
id
source_type
original_title
source_url
external_id
publisher
original_published_at
original_language
original_description
availability_status
```

The transcript, processing, rights, collection, and record-timestamp columns do
not have public `SELECT` grants. Public clients must explicitly request only the
permitted metadata columns and cannot use `select *` against `sources`. Public
clients have no insert, update, or delete permission.

---

## 8. `story_places`

### Purpose

Joins Stories and Places to implement their many-to-many relationship.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `story_id` | `uuid` | Yes | None | References the connected Story. |
| `place_id` | `uuid` | Yes | None | References the connected Place. |
| `created_at` | `timestamptz` | Yes | `now()` | Relationship creation time. |

### Keys, Constraints, and Indexes

- Composite primary key: (`story_id`, `place_id`), preventing duplicate links.
- Foreign key: `story_id` references `stories.id` with `ON DELETE CASCADE`.
- Foreign key: `place_id` references `places.id` with `ON DELETE CASCADE`.
- No optional columns and no separate unique constraint.
- Indexes: the composite primary-key index and `story_places_place_id_idx` for
  reverse Place lookups.

### Deletion and Public Read Behavior

The relationship row is deleted when either referenced Story or Place is
deleted. Anonymous and authenticated public clients may read a relationship row
only when its connected Story has published status and has reached its
`published_at` time. Public clients have no insert, update, or delete permission.

---

## 9. `story_themes`

### Purpose

Joins Stories and Themes to implement their many-to-many relationship.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `story_id` | `uuid` | Yes | None | References the connected Story. |
| `theme_id` | `uuid` | Yes | None | References the connected Theme. |
| `created_at` | `timestamptz` | Yes | `now()` | Relationship creation time. |

### Keys, Constraints, and Indexes

- Composite primary key: (`story_id`, `theme_id`), preventing duplicate links.
- Foreign key: `story_id` references `stories.id` with `ON DELETE CASCADE`.
- Foreign key: `theme_id` references `themes.id` with `ON DELETE CASCADE`.
- No optional columns and no separate unique constraint.
- Indexes: the composite primary-key index and `story_themes_theme_id_idx` for
  reverse Theme lookups.

### Deletion and Public Read Behavior

The relationship row is deleted when either referenced Story or Theme is
deleted. Anonymous and authenticated public clients may read a relationship row
only when its connected Story has published status and has reached its
`published_at` time. Public clients have no insert, update, or delete permission.

---

## 10. `story_sources`

### Purpose

Joins Stories and Sources to implement their many-to-many relationship.

### Columns

| Column | Type | Required | Default | Description |
| --- | --- | --- | --- | --- |
| `story_id` | `uuid` | Yes | None | References the connected Story. |
| `source_id` | `uuid` | Yes | None | References the connected Source. |
| `created_at` | `timestamptz` | Yes | `now()` | Relationship creation time. |

### Keys, Constraints, and Indexes

- Composite primary key: (`story_id`, `source_id`), preventing duplicate links.
- Foreign key: `story_id` references `stories.id` with `ON DELETE CASCADE`.
- Foreign key: `source_id` references `sources.id` with `ON DELETE CASCADE`.
- No optional columns and no separate unique constraint.
- Indexes: the composite primary-key index and `story_sources_source_id_idx` for
  reverse Source lookups.

### Deletion and Public Read Behavior

The relationship row is deleted when either referenced Story or Source is
deleted. Anonymous and authenticated public clients may read a relationship row
only when its connected Story has published status and has reached its
`published_at` time. Public clients have no insert, update, or delete permission.

---

## 11. Updated Timestamps

The reusable trigger function `public.set_updated_at()` sets `updated_at` to the
current database time before an update. It is applied only to the four entity
tables that contain an `updated_at` column:

- `stories`
- `places`
- `themes`
- `sources`

The function is a security-invoker function with an explicitly empty
`search_path`. Public execution permission is revoked.

---

## 12. Row Level Security and Grants

Row Level Security is enabled on all seven tables. The `anon` and
`authenticated` roles have their table privileges explicitly revoked before the
intended read grants are applied. Most public tables receive table-level
`SELECT`; `sources` receives column-level `SELECT` only for approved public
metadata.

The public read model is:

- `stories`: only published rows whose `published_at` is not in the future are
  readable;
- `places`: all rows are readable;
- `themes`: only active rows are readable;
- `sources`: only approved metadata columns are readable, and only for Sources
  connected to at least one currently published Story;
- `story_places`: readable only when the connected Story is currently published;
- `story_themes`: readable only when the connected Story is currently published;
  and
- `story_sources`: readable only when the connected Story is currently published.

There are no public insert, update, or delete policies. Anonymous and ordinary
authenticated clients therefore cannot create, modify, or delete rows. They
also cannot read draft or future-published Stories, relationship rows for those
Stories, inactive Themes, or Sources connected only to non-public Stories.

Administrative access is not defined by this migration. Supabase's privileged
service role is outside the public-client policy model and must never be exposed
to browser clients.

---

## 13. Current Limitations

The initial schema intentionally does not include:

- an application authentication schema;
- an administrator or editor authorization model;
- a storage bucket;
- image-upload behavior;
- seed content;
- a soft-delete field;
- a full editorial workflow engine;
- People, Organizations, Foods, or Media tables;
- search-specific database structures; or
- AI-specific fields or vector storage.

`cover_image_url` is only an optional text reference. It does not create a
storage bucket or implement uploads.

These limitations keep the first migration focused on validating the minimum
Source-to-Story data relationships and public publication boundary.
