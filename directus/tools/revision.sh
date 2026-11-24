#!/bin/bash
# make revision m="short name": builds the image from the current schemas/ and
# revisions/, starts a throwaway database at the newest revision, diffs the YAML
# against it and writes the new revision folder into revisions/.
# The throwaway stack is its own Compose project (<project>-gen): your data and
# volumes are never touched.
set -euo pipefail
cd "$(dirname "$0")/.."
project=${PROJECT:?Set PROJECT to the Compose project name (the Makefile does)}
slug=$(printf '%s' "${1:?usage: make revision m=\"short name\"}" | tr 'A-Z' 'a-z' | tr -cs 'a-z0-9' '_' | sed 's/^_//; s/_$//')
[ -n "$slug" ] || { echo 'Give the revision a short name: make revision m="add price"'; exit 1; }
last=$(ls revisions 2>/dev/null | grep -E '^[0-9]{4}_' | sort | tail -1 || true)
number=${last%%_*}
next=$(printf '%04d' $((10#${number:-0} + 1)))
dir="revisions/${next}_${slug}"
mkdir -p revisions

gen="${project}-gen"
compose="docker compose -p $gen --env-file .env"
cleanup() { $compose down -v >/dev/null 2>&1 || true; }
trap cleanup EXIT

# The throwaway stack must not share anything with your real one. Fixed volume
# names (`name:` in compose.yaml) would attach it to your database, and the
# cleanup below runs `down -v`. Resolved names must all start with the gen project.
shared=$($compose config | grep -E '^    name: ' | grep -v "^    name: ${gen}_" || true)
if [ -n "$shared" ]; then
  echo "compose.yaml pins names that are not project-scoped, so the throwaway stack would share them:"
  echo "$shared"
  echo "Remove the fixed 'name:' lines (volumes, networks) and use the Compose project name instead."
  exit 1
fi

echo "Starting a throwaway database at ${last:-the empty schema}..."
DIRECTUS_PORT=0 REVISIONS_ONLY=true $compose up --build -d --wait database directus >/dev/null 2>&1 \
  || { $compose logs directus | tail -8; exit 1; }
PROJECT=$gen tools/revisions-cli.sh generate /tmp/rev
id=$($compose ps -q directus)
if docker exec "$id" test -f /tmp/rev/changes.json; then
  docker cp "$id:/tmp/rev/." "$dir"
  echo
  echo "Created $dir"
  echo "Add $dir/up.sql and down.sql if data has to move, then commit the folder."
fi
