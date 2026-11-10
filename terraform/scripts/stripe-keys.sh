#!/usr/bin/env bash
# Stores the Stripe secret key and webhook signing secret in OpenBao.
# Values come from STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET or a hidden prompt.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
bao="$dir/bao.sh"
project="${PROJECT_NAME:-tunisaid}"
path="$project/app"

ask() {
  local name="$1" label="$2" pattern="$3" value="${!1:-}"
  if [ -z "$value" ]; then
    read -r -s -p "$label: " value
    echo >&2
  fi
  [[ "$value" =~ $pattern ]] || { echo "$name does not look right (expected $pattern)." >&2; exit 1; }
  printf '%s' "$value"
}

secret_key="$(ask STRIPE_SECRET_KEY "Stripe secret key (sk_test_... or sk_live_...)" '^[rs]k_(test|live)_[A-Za-z0-9_]{10,}$')"
webhook_secret="$(ask STRIPE_WEBHOOK_SECRET "Stripe webhook signing secret (whsec_...)" '^whsec_[A-Za-z0-9_]{10,}$')"

existing="$("$bao" kv get -mount=secret -format=json "$path" </dev/null 2>/dev/null | jq '.data.data' || true)"
[ -n "$existing" ] && [ "$existing" != "null" ] || existing='{}'

jq -n --argjson existing "$existing" --arg key "$secret_key" --arg hook "$webhook_secret" \
  '$existing + {stripe_secret_key: $key, stripe_webhook_secret: $hook}' |
  "$bao" kv put -mount=secret "$path" - >/dev/null
mode="live"
[[ "$secret_key" == *_test_* ]] && mode="test"
echo "Stripe keys stored in OpenBao ($mode mode). Run make deploy to apply them."
