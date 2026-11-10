#!/usr/bin/env bash
# Runs directus/scripts/setup.mjs (migrations, seeds, donation-service user)
# against the deployed backend. Safe to repeat: applied migrations are skipped.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
project="${PROJECT_NAME:-tunisaid}"

tf_value() { echo "$1" | terraform console | tr -d '"'; }

DIRECTUS_URL="$(tf_value 'local.backend_url')"
ADMIN_EMAIL="$(tf_value 'var.directus_admin_email')"
secrets="$("$dir/bao.sh" kv get -mount=secret -format=json "$project/app" </dev/null | jq '.data.data')"
ADMIN_PASSWORD="$(jq -r '.directus_admin_password' <<<"$secrets")"
DONATION_SERVICE_TOKEN="$(jq -r '.donation_service_token' <<<"$secrets")"
export DIRECTUS_URL ADMIN_EMAIL ADMIN_PASSWORD DONATION_SERVICE_TOKEN

echo "Waiting for Directus at $DIRECTUS_URL ..."
for _ in $(seq 1 60); do
  if [ "$(curl -fsS --max-time 5 "$DIRECTUS_URL/server/ping" 2>/dev/null || true)" = "pong" ]; then
    ready=1
    break
  fi
  sleep 5
done
[ "${ready:-0}" = 1 ] || { echo "Directus did not answer within 5 minutes." >&2; exit 1; }

node "$dir/../../directus/scripts/setup.mjs"
