#!/usr/bin/env bash
# Generates the missing secrets and writes them to OpenBao at secret/<project>/app.
# Existing values are never replaced, except database_password, which always
# mirrors the Terraform state because Postgres is configured from there.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
bao="$dir/bao.sh"
project="${PROJECT_NAME:-tunisaid}"
path="$project/app"

database_password="${DATABASE_PASSWORD:-$(echo 'nonsensitive(random_password.database.result)' | terraform console | tr -d '"')}"
[ -n "$database_password" ] || { echo "No database password in the Terraform state; run make bootstrap." >&2; exit 1; }

existing="$("$bao" kv get -mount=secret -format=json "$path" </dev/null 2>/dev/null | jq '.data.data' || true)"
[ -n "$existing" ] && [ "$existing" != "null" ] || existing='{}'

hex() { openssl rand -hex 32; }
password() { openssl rand -base64 24 | tr -d '/+=\n'; }

merged="$(jq -n \
  --argjson existing "$existing" \
  --arg db "$database_password" \
  --arg secret "$(hex)" \
  --arg admin "$(password)" \
  --arg token "$(hex)" \
  --arg signing "$(hex)" \
  '{
     directus_secret: $secret,
     directus_admin_password: $admin,
     donation_service_token: $token,
     donation_signing_secret: $signing
   } + $existing + {database_password: $db}')"

if [ "$(jq -S . <<<"$merged")" = "$(jq -S . <<<"$existing")" ]; then
  echo "Secrets in OpenBao are up to date."
else
  printf '%s' "$merged" | "$bao" kv put -mount=secret "$path" - >/dev/null
  echo "Secrets written to OpenBao ($path)."
fi
