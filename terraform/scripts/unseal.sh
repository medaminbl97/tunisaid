#!/usr/bin/env bash
# Unseals OpenBao with the keys saved by vault-init.sh.
set -euo pipefail

dir="$(cd "$(dirname "$0")" && pwd)"
bao="$dir/bao.sh"
init_file=".secrets/openbao-init.json"

sealed="$("$bao" status -format=json </dev/null 2>/dev/null | jq -r '.sealed' || true)"
if [ "$sealed" = "false" ]; then
  exit 0
fi
[ -f "$init_file" ] || { echo "Missing $init_file: cannot unseal." >&2; exit 1; }

echo "Unsealing OpenBao..."
# bao refuses to read the key from stdin, so it goes on the command line. It is
# one share of a 2-of-3 threshold and is visible only for the moment of the call.
for key in $(jq -r '.unseal_keys_b64[0:2][]' "$init_file"); do
  "$bao" operator unseal "$key" </dev/null >/dev/null
done
