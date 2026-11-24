#!/bin/bash
# Runs `node scripts/revisions.js <args>` inside the running directus container of
# a Compose project (the schema steps need the Directus server).
#   PROJECT=<compose project> tools/revisions-cli.sh status | down | check |
#                                                    stamp <id|head> | generate <dir>
# The output goes through a file, because `docker exec` output is unreliable in
# some dev containers. The exit code is the command's.
set -euo pipefail
cd "$(dirname "$0")/.."
project=${PROJECT:?Set PROJECT to the Compose project name (the Makefile does)}
id=$(docker compose -p "$project" --env-file .env ps -q directus)
[ -n "$id" ] || { echo "The backend is not running: make up"; exit 1; }
file=/tmp/revisions.$$.$RANDOM   # unique per call, so an old result is never read
docker exec -d "$id" sh -c "cd /opt/schema-loader && DIRECTUS_URL=http://127.0.0.1:8055 node scripts/revisions.js $* > $file.part 2>&1; echo \"exit=\$?\" >> $file.part; mv $file.part $file.txt"
for _ in $(seq 600); do
  docker exec "$id" test -f "$file.txt" 2>/dev/null && break
  sleep 1
done
out=$(docker exec "$id" cat "$file.txt")
printf '%s\n' "$out" | grep -v '^exit=' || true
printf '%s\n' "$out" | grep -q '^exit=0'
