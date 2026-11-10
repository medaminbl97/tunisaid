#!/usr/bin/env bash
# Initialises OpenBao once, unseals it, and prepares the KV store, a read-only
# policy and the token Dokploy uses. Safe to run again.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
bao="$dir/bao.sh"
secrets_dir=".secrets"
init_file="$secrets_dir/openbao-init.json"
project="${PROJECT_NAME:-tunisaid}"

umask 077
mkdir -p "$secrets_dir"

# Exit code 0: initialised, 2: not initialised, anything else: a real error
# such as a failed SSH login or a stopped container.
rc=0
"$bao" operator init -status </dev/null >/dev/null 2>&1 || rc=$?
if [ "$rc" -eq 2 ]; then
  if [ -s "$init_file" ]; then
    echo "OpenBao is uninitialised but $init_file exists. Refusing to overwrite it." >&2
    exit 1
  fi
  echo "Initialising OpenBao (3 key shares, 2 needed to unseal)..."
  "$bao" operator init -key-shares=3 -key-threshold=2 -format=json </dev/null >"$init_file.tmp"
  mv "$init_file.tmp" "$init_file"
  jq -r '.root_token' "$init_file" >"$secrets_dir/root-token"
elif [ "$rc" -ne 0 ]; then
  echo "Cannot reach OpenBao (exit code $rc). Check SSH access and that the container runs:" >&2
  "$bao" operator init -status </dev/null >&2 || true
  exit 1
fi

"$dir/unseal.sh"

if ! "$bao" secrets list -format=json </dev/null | jq -e '."secret/"' >/dev/null; then
  "$bao" secrets enable -path=secret -version=2 kv </dev/null
fi

"$bao" policy write dokploy-read - <<POLICY
path "secret/data/$project/*" {
  capabilities = ["read"]
}
path "secret/metadata/*" {
  capabilities = ["list"]
}
POLICY

if [ ! -f "$secrets_dir/dokploy-token" ]; then
  "$bao" token create -policy=dokploy-read -period=87600h -display-name=dokploy \
    -orphan -format=json </dev/null | jq -r '.auth.client_token' >"$secrets_dir/dokploy-token"
  echo "Created the read-only token for Dokploy."
fi
echo "OpenBao is ready."
