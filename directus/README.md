# Directus backend

The backend is a custom Directus image built from [`Dockerfile`](Dockerfile). It
extends the pinned `directus/directus` image and bakes in everything that
defines the backend: collection schemas, access policies, seeds and the loader
that applies them. Nothing is mounted at runtime; to ship a change, rebuild the
image.

The root `docker-compose.yml` includes `directus/compose.yaml`, which builds the
image and owns the backend services and volumes. Images are pinned to Directus
11.17.4 and PostgreSQL 17.6 Alpine. Check Directus's current licensing terms for
your organization before production deployment.

Schema caching is disabled: Directus 11.17.4 relation updates can otherwise fail
when altering cached, read-only constraint metadata.

## Start

From the repository root, with Docker Compose 2.20+ (for `include`) and Node.js 20.6+:

```bash
node directus/tools/init-env.mjs
docker compose --env-file directus/.env up -d --build --wait database directus
```

The initializer creates git-ignored, owner-readable `directus/.env` and root
`.env` files with random database, administrator, signing and donation-service
credentials. It only adds missing keys and never changes existing values, so it
is safe to rerun after upgrading. The root `.env` holds the website server's
settings (see the root `.env.example`). Edit it locally to choose a real administrator email or change
`DIRECTUS_PORT` if needed. Do not commit or share it. The blank example documents
the required variables; do not use blank/example credentials in a deployment.

The [`Makefile`](Makefile) wraps these commands. Run it from `directus/`:

| Target                    | What it does                                                          |
| ------------------------- | --------------------------------------------------------------------- |
| `make up`                 | Creates `.env` if missing, rebuilds the image and waits until healthy |
| `make revision m="..."`   | Writes the next revision for a change of `schemas/` (see Revisions)   |
| `make migrate-status`     | Lists revisions as applied, pending or partial                        |
| `make migrate-down`       | Undoes the newest applied revision (run before deploying an older one) |
| `make migrate-stamp`      | Records revisions as applied without running them (adoption only)     |
| `make check`              | Fails if `schemas/` has changes that no revision contains             |
| `make down`               | Stops the stack and keeps its data                                    |
| `make restart`            | Restarts Directus (reruns startup, applying pending revisions)        |
| `make logs`               | Follows the Directus logs                                             |
| `make test`               | Runs the unit tests (no Docker)                                       |
| `make reseed CONFIRM=yes` | **Deletes the database and uploads**, then starts from scratch        |

The project name defaults to `tunisaid-backend-v11` and names the containers and
the volumes (`tunisaid-backend-v11_database`, `tunisaid-backend-v11_uploads`); the
`v11` keeps them apart from the old Directus 12 volumes. `compose.yaml` pins no
names, so a disposable stack (`make up PROJECT=scratch`) gets its own volumes, and
`make revision` can run its throwaway `tunisaid-backend-v11-gen` project without
touching yours. Keep the project name stable: it owns your data.

Open **http://localhost:8056** and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
from that local file. PostgreSQL has no published host port, and Directus binds
only to loopback. Another stack using port 8055 is unaffected.

Rebuild after changing anything in `schemas/`, `revisions/`, `access/`, `seeds/` or `scripts/`:
`docker compose --env-file directus/.env up -d --build directus`.

### What the container does on start

[`entrypoint.sh`](entrypoint.sh) runs these steps and stops on the first error:

1. `directus bootstrap` installs or upgrades Directus's own system tables and
   creates the first administrator.
2. A temporary Directus server starts on loopback only (`SYNC_PORT`, default 8057).
3. [`scripts/sync.js`](scripts/sync.js) validates the YAML and the revisions, logs in with
   `ADMIN_EMAIL` / `ADMIN_PASSWORD`, applies pending revisions (schema, then data),
   then the access policies, and seeds missing rows.
4. The temporary server stops and the public server starts through pm2.

The public port stays closed until startup has succeeded, so a failed revision
leaves the container exiting with an error instead of serving a half-configured
backend. The healthcheck (and `up --wait`) therefore passes only after startup.
Check the result with:

```bash
docker compose --env-file directus/.env ps -a
docker compose --env-file directus/.env logs --tail 80 directus
```

Administrator credentials are initialization inputs, not a password reset
mechanism for an existing database. Keep them synchronized with the admin account
used by the sync. Do not run several instances against one database at the same
time.

## Model

| Area          | Collections                                                       |
| ------------- | ----------------------------------------------------------------- |
| Content       | `languages`, `categories`, `partners`, `projects`, `campaigns`    |
| Relationships | `campaign_projects` (campaign ↔ project many-to-many)             |
| Catalog       | `donation_purposes` (optional link to one project)                |
| EN/DE content | `*_translations` for categories, projects, campaigns and purposes |
| Donor intent  | `donors`, `checkouts`, `donations`, `donation_items`              |
| Payments      | `payment_attempts`, `payment_events`, `refunds`                   |

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

Amounts are **EUR with two decimal places**, stored as PostgreSQL
`decimal(12,2)` (`unit_amount`, `goal_amount`, `total_amount`, `amount`), never
as floating-point numbers, so sums and refund splits stay exact. The maximum is
9,999,999,999.99. Directus returns a decimal as a string such as `"35.00"`, so
clients must parse it. The website converts to integer cents when it reads these
fields and back when it writes them, and uses cents only for its own arithmetic
and for Stripe. Provider events use a unique
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

## Schemas, access and seeds

```text
directus/
├── Dockerfile                   image: pinned Directus + the folders below
├── entrypoint.sh                bootstrap → sync on loopback → start
├── schemas/                     the model: one YAML file per collection
│   ├── content/
│   └── donations/
├── revisions/                   one folder per schema change (generated + up/down.sql)
├── access/                      public policy and the donation-service role/user
├── seeds/
│   ├── reference/               always loaded (languages)
│   └── examples/                demo content, only when CMS_ENV=dev
├── scripts/                     baked into the image, except the tests and smoke test
│   ├── sync.js                  run by the entrypoint: revisions, then policies, then seeds
│   ├── schema-model.js          loads and validates the YAML, builds the desired snapshot
│   ├── revisions.js             generate / upgrade / down / status / stamp / check
│   ├── seed-data.js             creates missing seed rows
│   ├── apply-policies.js        policies, roles, permissions, service user
│   ├── *.test.js                unit tests (not in the image)
│   └── smoke-test.sh            quick stack check used by CI (not in the image)
└── tools/                       local helpers, not in the image
    ├── init-env.mjs             local .env generator
    ├── verify.mjs               live check of a running stack
    ├── revision.sh              behind `make revision`
    └── revisions-cli.sh         behind `make migrate-*` and `make check`
```

Folders under `schemas/` and `seeds/` only organize files; collection names are
global. Each schema file has the collection, its fields and its `relations`
(foreign keys with delete rules and the editor aliases on the other side).

**Schemas and revisions.** `schemas/` is the model and the only place you edit
it. The YAML is the complete definition of every collection it declares. A change
becomes a **revision**, a folder in `revisions/` like an Alembic revision:

```text
revisions/0002_goal_to_euros/
  schema.json     generated: the Directus schema after this revision
  changes.json    generated: `+ added`, `- removed` (loses data), `~ changed`
  up.sql          optional, yours: data step; down.sql undoes it
```

Workflow: edit `schemas/`, run `make revision m="goal to euros"` (it starts a
throwaway stack, so your data is never touched, and prints the change list),
add `up.sql` / `down.sql` if data has to move, run `make up`, and commit the
whole folder with the YAML. `schema.json` and `changes.json` are generated, and
a revision that has been applied anywhere is never edited.

On start, pending revisions apply in three steps: add what is new, run
`up.sql` (old and new fields both exist, so it can copy), then drop what was
removed. `up.sql` / `down.sql` move data only: `ALTER`, `CREATE`, `DROP` and
`directus_*` tables are refused. A rename is one revision: the generator shows
`- old` and `+ new`, and `up.sql` copies the values. An interrupted start
continues where it stopped (`make migrate-status` shows `partial`).

To roll back, run `make migrate-down` (newest first) **before** deploying an older
image; an image that lacks revisions the database has applied refuses to start.
Collections that no revision ever contained are never touched. Removing a
collection's YAML produces a `- name` line in the next revision. A YAML change
without a revision logs a warning at startup, and `make check` and CI fail.

**Access.** Policies, the Public read permissions and the donation-service
permissions are declared in `access/`. The sync overwrites them, so changes made
to these policies in the Directus UI do not survive a restart.

**Seeds.** Seeds create only missing rows, identified by their stable primary
key, and never overwrite editor changes. A seeded row that an editor deleted is
created again on the next start. Reference data (EN/DE languages) is always
seeded. Example data (three categories, three projects based on the
[existing TunisAid homepage](https://tunisaid.org/), two clearly labelled
**demo** campaigns and four **illustrative** purposes, with no invented donors or
payments) is only seeded when `CMS_ENV=dev`. `CMS_ENV` defaults to `prod`, and
the compose file sets it to `dev` for local use (`CMS_ENV=prod` in `directus/.env`
turns it off). Example rows are drafts unless `SEED_PUBLISH_DEMO=true`, which
publishes seed rows that are still drafts (never use it for production content).
Seed files are applied in file-name order, so prefix them `01-`, `02-`, … to
create referenced rows first.

To change the model: edit or add a YAML file and run `make revision m="..."`
(see above). To add content that must exist everywhere, add it under
`seeds/reference/`. Seeds create rows only, so a revision's `up.sql` is what
fixes existing rows.

### Recreating a local database

The app is not deployed anywhere, so a local database can always be recreated
from `revisions/` and `seeds/`. A database created before revisions existed
already matches `0001_initial`, so the first start with revisions changes
nothing (`make migrate-stamp` is only needed for data steps that must not run
again). To start over:

```bash
cd directus && make reseed CONFIRM=yes
```

`make reseed` erases this backend's local database and uploads.

## Tests and CI

```bash
cd directus && npm ci && npm test
```

The unit tests need no Docker. They load the real YAML (schemas, access, seeds),
check that invalid definitions are rejected, and cover the snapshot builder
(unmanaged collections preserved), the revision rules and state machine
(including interrupted runs) and the seeder (idempotent, never overwrites).
Applying revisions needs a live Directus, so it is covered by the stack checks
below.

[`scripts/smoke-test.sh`](scripts/smoke-test.sh) checks a running stack: health,
admin login, readable and seeded collections, anonymous access limited to
published content, and rejection of an invalid token. The workflow
`.github/workflows/directus-smoke-test.yml` runs the unit tests, starts a
disposable stack with random credentials, runs the smoke test, `make check`'s command and `tools/verify.mjs`,
and removes only that stack (`down -v` on its unique project name) on pull
requests that touch `directus/`.

## Validation

```bash
docker compose --env-file directus/.env config --quiet
set -a; . directus/.env; set +a
DIRECTUS_URL=http://127.0.0.1:8056 CMS_ENV=dev SEED_PUBLISH_DEMO=true \
  node directus/tools/verify.mjs
```

Run the live check against a fresh local database, not a production or edited
catalog. It reads the same YAML as the image and checks that every collection,
relation (target, delete rule, editor alias), field type/interface and rich-text
field exists as defined; that anonymous users can only read published projects,
campaigns, categories, purposes, their translations and campaign/project links
(with the permitted fields) while every other collection denies anonymous reads
and writes; that every seed row has its YAML values (examples only with
`CMS_ENV=dev`; use the same `SEED_PUBLISH_DEMO` value as the container); amount
and status validation; deletion protection and cascades; event uniqueness; and
that a refund leaves the stored checkout status `paid`. With
`DONATION_SERVICE_TOKEN` set it also checks that the service user cannot read
donor emails, refund reasons or users, and cannot create empty refunds or paid
checkouts. Synthetic fixtures are removed afterwards; Directus audit
history remains.

## Persistence and shutdown

Database and uploaded files live in the named volumes `tunisaid-backend-v11_database`
and `tunisaid-backend-v11_uploads` (the Compose project name plus the volume).
Containers can be recreated without losing content:

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

`access/public.yaml` gives the Directus **Public** policy read-only access to
`projects`, `campaigns`, `categories`, `donation_purposes`, their translations and
`campaign_projects`, limited to `published` rows (a campaign/project link only
when both sides are published) and to the fields the website requests. Purposes
expose their category and project ids so the website can follow them. Example
records are drafts unless the container started with `SEED_PUBLISH_DEMO=true`, so
the website shows its empty states until an editor publishes content. Directus files (cover
images) stay private.

CORS allows `GET` requests from `CORS_ORIGIN` (default `http://localhost:3000`,
the website dev server). Set `CORS_ORIGIN` in `directus/.env` for other origins.

## Donation service

`access/donation-service.yaml` creates the **Donation service** role and policy.
The sync attaches it to a `donation-service` user whose static token is
`DONATION_SERVICE_TOKEN` (skipped when blank). The website server uses this token
only from server functions; it is never sent to the browser. The policy can:

- read published purposes/campaigns, campaign/project links, and the checkout,
  donation and refund fields needed for attribution, receipts and raised totals;
- create donors, `pending` checkouts, their per-campaign donations and items, and
  `pending` payment attempts;
- move open attempts and `pending` checkouts to a final status, and create and
  process payment events (unique per `provider:event` key).

- create refunds and move their `pending` status to `succeeded` or `failed`,
  which the Stripe refund webhook uses.

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
policy. The website supports Stripe (checkout and refund webhooks, handled by the
website server) and a **mock** provider for local testing that is refused in
production unless explicitly allowed. There are no email receipts and no
background job that expires abandoned `pending` checkouts.

Before production, add least-privilege editorial policies, rate limiting on the
checkout server functions and donor consent/retention rules. Receipt issuance,
email delivery, reconciliation and background jobs are deferred. Add TLS, external secrets, backups with restore
tests, storage policy, monitoring, rate limiting and an upgrade process before
exposing the service publicly.
