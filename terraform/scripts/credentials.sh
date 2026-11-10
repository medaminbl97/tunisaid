#!/usr/bin/env bash
# Prints every generated secret from OpenBao.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
project="${PROJECT_NAME:-tunisaid}"

"$dir/bao.sh" kv get -mount=secret -format=json "$project/app" </dev/null |
  jq -r '.data.data | to_entries[] | "\(.key)=\(.value)"'
