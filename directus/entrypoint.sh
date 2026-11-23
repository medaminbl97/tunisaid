#!/bin/sh
# Bootstraps Directus, applies the baked-in schemas, access policies and seeds
# on a private loopback server, then starts the public server. The public port
# stays closed until the synchronization has succeeded.
set -eu

internal_port="${SYNC_PORT:-8057}"
temporary_pid=""

stop_temporary() {
  if [ -n "$temporary_pid" ]; then
    kill "$temporary_pid" 2>/dev/null || true
    wait "$temporary_pid" 2>/dev/null || true
    temporary_pid=""
  fi
}
trap 'stop_temporary; exit 143' TERM INT
trap stop_temporary EXIT

node cli.js bootstrap

HOST=127.0.0.1 PORT="$internal_port" node cli.js start >/dev/null 2>&1 &
temporary_pid=$!

DIRECTUS_URL="http://127.0.0.1:$internal_port" \
  node /opt/tunisaid/scripts/apply-schemas.js

stop_temporary
trap - EXIT TERM INT
exec pm2-runtime start ecosystem.config.cjs
