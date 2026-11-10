# Directus backend foundation

The root `docker-compose.yml` includes `directus/compose.yaml`, which owns the
backend services, mounts and volumes. Mount paths resolve relative to the
`directus/` folder. The previous root services have been removed.
Images are pinned to Directus 11.17.4 and PostgreSQL
17.6 Alpine. Check Directus's current licensing
terms for your organization before production deployment.

Schema caching is disabled in this local stack: Directus 11.17.4 relation updates
can otherwise fail when altering cached, read-only constraint metadata.

## Start

From the repository root, with Docker Compose 2.20+ (for `include`) and Node.js 20.6+:

```bash
node directus/scripts/init-env.mjs
docker compose --env-file directus/.env up -d --wait database directus
docker compose --env-file directus/.env run --rm setup
```

The initializer creates git-ignored, owner-readable `directus/.env` and root
`.env` files with random database, administrator, signing and donation-service
credentials. It only adds missing keys and never changes existing values, so it
is safe to rerun after upgrading. The root `.env` holds the website server's
settings (see the root `.env.example`). Edit it locally to choose a real administrator email or change
`DIRECTUS_PORT` if needed. Do not commit or share it. The blank example documents
the required variables; do not use blank/example credentials in a deployment.

Open **http://localhost:8056** and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from that local file. PostgreSQL has no published host port, and Directus binds
only to loopback. Another stack using port 8055 is unaffected.

The database healthcheck gates Directus bootstrap. Bootstrap installs/upgrades
Directus's own system schema; the ping check gates the one-shot setup service.
Setup must exit **0** before the backend is ready. `up --wait` alone is not proof
that application setup has completed. Inspect status and setup failures with:

```bash
docker compose --env-file directus/.env ps -a
docker compose --env-file directus/.env logs --tail 80 setup
```

Administrator credentials are initialization inputs, not a password reset
mechanism for an existing database. Keep them synchronized with the admin account
used by setup. A failed bootstrap is not necessarily rolled back; inspect logs
and use the Directus user-management CLI to recover rather than deleting data.

## Model

| Area          | Collections                                                       |
| ------------- | ----------------------------------------------------------------- |
| Content       | `languages`, `categories`, `partners`, `projects`, `campaigns`    |
| Relationships | `campaign_projects` (campaign ↔ project many-to-many)             |
| Catalog       | `donation_purposes` (optional link to one project)                |
| EN/DE content | `*_translations` for categories, projects, campaigns and purposes |
| Donor intent  | `donors`, `checkouts`, `donations`, `donation_items`              |
| Payments      | `payment_attempts`, `payment_events`, `refunds`                   |
| Setup history | `backend_migrations`                                              |

How the records link (all through foreign keys, no duplicated state):

- A campaign groups projects through `campaign_projects`; a project can belong to
  several campaigns or none. Editors see both sides (`campaigns.projects`,
  `projects.campaigns`) and the purposes linked to a project (`projects.purposes`).
- A donation purpose optionally points to one project. Without a project it is a
  general purpose. The link records donor intent; it does not move money.
- A **checkout** is one basket and one payment: it holds the public reference,
  the donor, the total and the payment lifecycle `status` (`pending`, `paid`,
  `failed`, `cancelled`, `expired`). Payment attempts and events point to it.
- A checkout is split into one **donation per campaign**. Each basket line's
  campaign is derived, never chosen: purpose → project → the project's open
  (published, not yet ended) campaign. Lines whose purpose has no project, whose
  project has no open campaign, and flexible amounts are grouped into one
  donation with no campaign. Donations have no status of their own; they are
  paid when their checkout is paid.
- Editor rule: a project may be in **at most one open campaign** at a time.
  Otherwise its campaign is ambiguous and checkout is refused with
  `campaign_conflict` until an editor fixes the links.
- Donation items snapshot each purpose's title and price, so catalog edits never
  rewrite history.
- Refunds point to the donation (campaign share) they reduce. Whether a paid
  checkout is partially or fully refunded is **derived** from its donations'
  succeeded refunds when a receipt or campaign total is calculated, so it can
  never drift out of sync.

Example: a basket with a €40 purpose of a project in the Ramadan campaign, a €25
purpose of a project in the Winter campaign and a €10 flexible amount is one
€75 checkout and one payment, recorded as three donations: €40 (Ramadan), €25
(Winter) and €10 (no campaign). Each campaign's raised total sums its paid
donations minus their succeeded refunds.

Amounts are **integer EUR cents**, not floating-point euros (PostgreSQL signed
32-bit range, maximum 2,147,483,647 cents). Provider events use a unique
`provider:event-id` key; checkout and refund operations have unique idempotency
keys.

Deletion rules: translations and `campaign_projects` links belong to their parent
and are removed with it (`CASCADE`). Every other reference is `RESTRICT`, so a
project with purposes, a purpose used in a donation, or a checkout or donation
with records attached cannot be deleted; archive it instead.

### Rich text

Every body or description rendered by the website is a rich-text HTML field:
`projects_translations.body`, `campaigns_translations.body` (headings, lists,
links, tables, images) and `donation_purposes_translations.description`
(inline formatting, lists and links). HTML is stored as `text`; the website
sanitizes it before rendering. Short labels (titles, summaries, impact lines,
units, alt text) stay plain text.

In Directus, open a record, choose EN or DE in Translations, and edit Body or
Description. Use the image toolbar button to select/upload an image and provide
meaningful alt text. No administrator credentials should be embedded in image URLs.

## Migrations and seeds

```text
directus/
├── migrations/
│   └── 001-initial-schema.mjs   collections, fields, relations, editor metadata,
│                                public read access and the donation-service policy
├── seeds/                       one module per collection, run in dependency order
│   ├── languages.mjs
│   ├── categories.mjs
│   ├── projects.mjs
│   ├── campaigns.mjs            campaigns + campaign_projects links
│   └── donation-purposes.mjs
└── scripts/
    ├── setup.mjs                migrate → seed → donation-service user
    ├── migrate.mjs              runs migrations/ in order with a checksum ledger
    ├── seed.mjs                 global seed runner (order lives in `seedSteps`)
    ├── schema.mjs               field/relation/permission helpers
    └── verify.mjs               live verification against a running stack
```

These are **application API migrations**, not Knex files for Directus's
`MIGRATIONS_PATH`. After bootstrap, setup authenticates using environment
credentials and applies the schema through the supported Directus API. Each
migration is recorded with a SHA-256 checksum only after success; an interrupted
run resumes existing collections/fields/relations, and incompatible types or
relation targets fail explicitly. Do not run multiple setup jobs concurrently.

`001-initial-schema.mjs` is the single deployable baseline. Once it has been
applied anywhere that matters, never edit it: add `002-….mjs` for later changes.

Seeds only create missing rows (identified by slug, or parent + language) and
never overwrite editor changes. They create EN/DE languages, three categories,
three projects based on the [existing TunisAid homepage](https://tunisaid.org/)
(paraphrased copy, a source link and a review notice), two clearly labelled
**demo** campaigns with illustrative goals and dates, and four **illustrative**
purposes: Koffa → Ramadan food boxes, wheelchair shares → wheelchairs for
students, school bags → school supplies, and warmth as a general purpose. There
are no invented donors, payments or fundraising progress. To add a collection's
seed, create `seeds/<collection>.mjs` and register it in `seedSteps`.

Seed records are drafts by default. To see them on the local website, publish
them with an explicit opt-in (never for production content):

```bash
SEED_PUBLISH_DEMO=true docker compose --env-file directus/.env run --rm setup
```

With the flag, setup changes only seed-identified records that are still `draft`
to `published`.

### Existing local databases

The baseline replaces the earlier ten development migrations (001–010), which
also created allocation, material-donation, project-update and project-partner
collections. A database set up with those migrations fails with "Applied
migration changed". Back up anything you want to keep, then recreate the local
backend from scratch:

```bash
docker compose --env-file directus/.env down --volumes
docker compose --env-file directus/.env up -d --wait database directus
docker compose --env-file directus/.env run --rm setup
```

`--volumes` erases this backend's local database and uploads.

## Validation

```bash
node --test directus/scripts/schema.test.mjs
docker compose --env-file directus/.env config --quiet
docker compose --env-file directus/.env run --rm \
  --entrypoint node setup /directus/project/scripts/verify.mjs
```

If you seeded with `SEED_PUBLISH_DEMO=true`, pass the same flag to the
verification (`run --rm -e SEED_PUBLISH_DEMO=true ...`) so it expects published
seed records.

Run the live check against a fresh local seed, not a production or edited
catalog. It checks that removed collections are absent; that every relation has
the expected target, delete rule and editor alias; that rich-text fields use the
HTML editor; that anonymous users can only read published projects, campaigns,
categories, purposes, their translations and campaign/project links (with the
permitted fields) while every other collection denies anonymous reads/writes;
exact seed prices, translations and links; amount/status validation; deletion
protection and cascades; event uniqueness; and that a refund leaves the stored
checkout status `paid`. When `DONATION_SERVICE_TOKEN` is set, it also checks that
the service user cannot read donor emails, refund reasons or users, and cannot
create refunds or paid checkouts. Synthetic fixtures are removed afterwards;
Directus audit history remains.

## Persistence and shutdown

Database and uploaded files use the explicit version-specific named volumes
`tunisaid-backend-v11_database` and `tunisaid-backend-v11_uploads`. Containers can
be recreated without losing content:

```bash
docker compose --env-file directus/.env down
```

Do not add `--volumes` unless you deliberately intend to erase this backend's
database and uploads. Back up both; an environment file is not a data backup.

The earlier Directus 12 stack was stopped without deleting its
`tunisaid-backend_database` and `tunisaid-backend_uploads` volumes. Directus 11
starts with a fresh database and draft seeds: this is not an in-place database
downgrade. Do not mount the version 12 database into version 11.

## Public access

The baseline migration gives the Directus **Public** policy read-only access to
`projects`, `campaigns`, `categories`, `donation_purposes`, their translations and
`campaign_projects`, limited to `published` rows (a campaign/project link only
when both sides are published) and to the fields the website requests. Purposes
expose their category and project ids so the website can follow them. Seed
records are drafts unless setup ran with `SEED_PUBLISH_DEMO=true`, so the website
shows its empty states until an editor publishes content. Directus files (cover
images) stay private.

CORS allows `GET` requests from `CORS_ORIGIN` (default `http://localhost:3000`,
the website dev server). Set `CORS_ORIGIN` in `directus/.env` for other origins.

## Donation service

The baseline migration creates the **Donation service** role and policy. Setup
attaches it to a `donation-service` user whose static token is
`DONATION_SERVICE_TOKEN` (skipped when blank). The website server uses this token
only from server functions; it is never sent to the browser. The policy can:

- read published purposes/campaigns, campaign/project links, and the checkout,
  donation and refund fields needed for attribution, receipts and raised totals;
- create donors, `pending` checkouts, their per-campaign donations and items, and
  `pending` payment attempts;
- move open attempts and `pending` checkouts to a final status, and create and
  process payment events (unique per `provider:event` key).

- create refunds (migration `002-stripe-refunds`) and move their `pending` status
  to `succeeded` or `failed`, which the Stripe refund webhook uses.

It cannot read donor emails, other users or refund reasons, cannot change a
donation after creation, and cannot create checkouts that are already paid.

With Stripe, refunds issued in the Stripe dashboard are recorded automatically
by the website's webhook. Each refund is split across the checkout's campaign
shares in proportion to what each can still give back, as one row per share keyed
`<refund id>:<donation id>`. Staff can still record a refund by hand (for example
after a bank transfer). No custom hook is installed: relationships are enforced by
foreign keys, and refund state is derived rather than copied onto the donation.
Foreign keys cannot enforce a sum rule; the webhook never allocates more than a
share's paid amount, and the website clamps campaign totals at zero.

## Intentionally not enabled

All other application collections remain **private**, with no public write
policy. Checkout uses a **mock** payment provider for local testing only: there
is no real payment provider, no webhook endpoint, no email receipts and no
background job that expires abandoned `pending` checkouts.

Before production, add a hosted payment provider with verified idempotent
webhooks (which should create refund records automatically), least-privilege
editorial policies, rate limiting on the checkout server functions and donor
consent/retention rules. Receipt issuance, email delivery, reconciliation and
background jobs are deferred. Add TLS, external secrets, backups with restore
tests, storage policy, monitoring, rate limiting and an upgrade process before
exposing the service publicly.
