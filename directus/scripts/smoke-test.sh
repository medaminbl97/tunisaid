#!/bin/sh
# Smoke test against a running, freshly synchronized backend.
# Usage: ADMIN_EMAIL=... ADMIN_PASSWORD=... [DONATION_SERVICE_TOKEN=...] \
#          scripts/smoke-test.sh [base_url]
#   SMOKE_COLLECTIONS         collections the admin must be able to read
#   SMOKE_SEEDED_COLLECTIONS  collections that must also hold rows (CMS_ENV=dev)
# The deeper checks live in verify.mjs; this script only proves the stack serves.
set -eu

BASE_URL="${1:-http://127.0.0.1:${DIRECTUS_PORT:-8056}}"
: "${ADMIN_EMAIL:?ADMIN_EMAIL is required}"
: "${ADMIN_PASSWORD:?ADMIN_PASSWORD is required}"
SMOKE_COLLECTIONS="${SMOKE_COLLECTIONS:-languages categories projects campaigns donation_purposes checkouts}"
SMOKE_SEEDED_COLLECTIONS="${SMOKE_SEEDED_COLLECTIONS:-languages categories projects campaigns donation_purposes}"

fail() { echo "FAIL: $*" >&2; exit 1; }
status() { curl -s -o /dev/null -w '%{http_code}' "$@"; }

health=$(curl -fsS "$BASE_URL/server/health") || fail "/server/health unreachable"
echo "$health" | grep -q '"status":"ok"' || fail "unhealthy: $health"
echo "OK /server/health"

# The credentials go in a JSON body from stdin so they never reach a process list.
login=$(printf '{"email":"%s","password":"%s"}' "$ADMIN_EMAIL" "$ADMIN_PASSWORD" |
  curl -fsS -H 'Content-Type: application/json' -d @- "$BASE_URL/auth/login") \
  || fail "admin login failed"
token=$(echo "$login" | sed -n 's/.*"access_token":"\([^"]*\)".*/\1/p')
[ -n "$token" ] || fail "admin login returned no access token"
echo "OK admin login"

for collection in $SMOKE_COLLECTIONS; do
  body=$(curl -fsS -H "Authorization: Bearer $token" "$BASE_URL/items/$collection?limit=1") \
    || fail "GET /items/$collection failed"
  echo "$body" | grep -q '"data"' || fail "/items/$collection returned no data key"
  echo "OK /items/$collection"
done

for collection in $SMOKE_SEEDED_COLLECTIONS; do
  body=$(curl -fsS -H "Authorization: Bearer $token" "$BASE_URL/items/$collection?limit=1")
  case "$body" in
    *'"data":[]'*) fail "$collection has no seeded rows (CMS_ENV=dev required)" ;;
  esac
  echo "OK seeded $collection"
done

# Anonymous users may read published content but nothing private.
code=$(status "$BASE_URL/items/projects")
[ "$code" = "200" ] || fail "anonymous read of projects returned $code, expected 200"
echo "OK anonymous read of published content"
for collection in checkouts donors payment_events refunds; do
  code=$(status "$BASE_URL/items/$collection")
  [ "$code" = "403" ] || [ "$code" = "401" ] \
    || fail "anonymous read of $collection returned $code, expected 401 or 403"
done
echo "OK anonymous access to private collections denied"

code=$(status -H "Authorization: Bearer invalid-token" "$BASE_URL/items/projects")
[ "$code" = "401" ] || fail "invalid token returned $code, expected 401"
echo "OK invalid token rejected"
