#!/usr/bin/env bash
# Runs the bao CLI inside the OpenBao container.
#   SSH_TARGET           user@host of the Dokploy server (empty: local Docker)
#   DOCKER_CMD           docker command on the server, for example "sudo -n docker"
#   SSH_OPTS             extra ssh options, for example "-i ~/.ssh/server_key"
#   BAO_CONTAINER        name filter of the OpenBao container (default: from Terraform)
#   BAO_TOKEN_FILE       file with the token to use (optional)
# The token and any stdin payload travel over stdin, never on a command line.
set -euo pipefail

secrets_dir=".secrets"
if [ -z "${BAO_CONTAINER:-}" ]; then
  cache="$secrets_dir/openbao-container"
  if [ ! -s "$cache" ]; then
    mkdir -p "$secrets_dir"
    echo 'dokploy_application.openbao.app_name' | terraform console | tr -d '"' >"$cache"
  fi
  BAO_CONTAINER="$(cat "$cache")"
fi
[ -n "$BAO_CONTAINER" ] || { echo "Could not determine the OpenBao container; run make bootstrap." >&2; exit 1; }
token_file="${BAO_TOKEN_FILE:-$secrets_dir/root-token}"
token=""
[ -f "$token_file" ] && token="$(cat "$token_file")"

# The container reads the token from the first line of stdin, so it survives
# sudo's environment reset and never appears in a process list.
inner='filter=$1; docker_cmd=$2; shift 2
container=$($docker_cmd ps -q -f "name=$filter" | head -n1)
[ -n "$container" ] || { echo "OpenBao container \"$filter\" is not running" >&2; exit 1; }
exec $docker_cmd exec -i -e BAO_ADDR=http://127.0.0.1:8200 "$container" \
  sh -c '"'"'IFS= read -r BAO_TOKEN; export BAO_TOKEN; exec bao "$@"'"'"' _ "$@"'

feed() {
  printf '%s\n' "$token"
  [ -t 0 ] || cat
}

if [ -n "${SSH_TARGET:-}" ]; then
  # shellcheck disable=SC2086
  feed | ssh -o BatchMode=yes ${SSH_OPTS:-} "$SSH_TARGET" \
    "bash -c $(printf '%q' "$inner") _ $(printf '%q ' "$BAO_CONTAINER" "${DOCKER_CMD:-docker}" "$@")"
else
  feed | bash -c "$inner" _ "$BAO_CONTAINER" "${DOCKER_CMD:-docker}" "$@"
fi
