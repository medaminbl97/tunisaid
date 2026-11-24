# Compose project name. It names the containers and the volumes that hold the
# data (tunisaid-backend-v11_database, _uploads; the v11 keeps them apart from
# the old Directus 12 volumes), so keep it stable; override only for a
# disposable stack:
#   make up PROJECT=scratch
PROJECT ?= tunisaid-backend-v11
export PROJECT
COMPOSE = docker compose -p $(PROJECT) --env-file .env

.PHONY: up down restart reseed logs test revision migrate-status migrate-down migrate-stamp check

# Creates .env with random credentials on first use (never overwrites values).
.env:
	node tools/init-env.mjs

# Rebuilds the image (schemas, revisions, access, seeds and scripts are baked in)
# and waits until startup succeeded and the backend is healthy. Pending
# revisions are applied on the way.
up: .env
	$(COMPOSE) up --build -d --wait database directus

down:
	$(COMPOSE) down

# Re-runs startup on the running container (applies pending revisions again, for
# example after `make migrate-down`).
restart:
	$(COMPOSE) restart directus

# Wipes the database and uploads volumes so the next start applies the revisions
# and seeds from scratch. Destroys ALL data, including anything added in the
# Directus admin, and any static tokens. Needs an explicit confirmation:
#   make reseed CONFIRM=yes
reseed:
	@test "$(CONFIRM)" = yes || { \
	  echo "reseed deletes the database and uploads of project '$(PROJECT)'."; \
	  echo "Run 'make reseed CONFIRM=yes' if that is what you want."; exit 1; }
	$(COMPOSE) down -v
	$(COMPOSE) up --build -d --wait database directus

logs:
	$(COMPOSE) logs -f directus

# Unit tests; no Docker needed.
test:
	npm test

# Turns a change of schemas/ into the next revision folder in revisions/. Starts
# a throwaway database at the newest revision (project $(PROJECT)-gen, removed
# afterwards), so it never touches your data. Add up.sql / down.sql next to the
# generated files if data has to move, then commit the folder.
#   make revision m="goal to euros"
revision: .env
	@test -n "$(m)" || { echo 'Usage: make revision m="short name"'; exit 1; }
	tools/revision.sh "$(m)"

# Run inside the running container (the schema steps need the Directus server).
migrate-status:
	tools/revisions-cli.sh status

# Undoes the newest applied revision (down.sql, then the schema). Run it with
# the image that contains that revision, before deploying an older one.
migrate-down:
	tools/revisions-cli.sh down

# Records revisions as applied WITHOUT running them, for a database that already
# matches them (created by an earlier sync, or restored). `make migrate-stamp
# REV=0001_initial` stamps up to that revision; the default is head.
REV ?= head
migrate-stamp:
	tools/revisions-cli.sh stamp $(REV)

# Fails if the YAML has changes that no revision contains. Rebuilds first, since
# the YAML is baked into the image (CI runs tools/revisions-cli.sh check directly).
check: up
	tools/revisions-cli.sh check
