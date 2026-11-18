#!/bin/bash
set -euo pipefail
umask 077

if [ "$#" -ne 3 ]; then
  printf 'Usage: %s <private snapshot> <key file> <dedicated bare Git repo>\n' "$0" >&2
  exit 2
fi

snapshot=$1
key=$2
repo=$3
script_dir="$(cd "$(dirname "$0")" && pwd)"
temporary="$(mktemp -d)"
trap 'rm -rf -- "$temporary"' EXIT
export GIT_INDEX_FILE="$temporary/index"

git_repo() {
  git --git-dir="$repo" "$@"
}

mkdir "$temporary/public"
node "$script_dir/seal-dashboard.mjs" "$snapshot" "$key" "$temporary"

for attempt in 1 2 3; do
  git_repo fetch --quiet origin refs/heads/main
  base="$(git_repo rev-parse FETCH_HEAD)"

  if ! git_repo cat-file -e "$base:api/dashboard.ts"; then
    printf 'Dashboard authentication must be on main before publishing snapshots.\n' >&2
    exit 1
  fi
  if git_repo cat-file -e "$base:public/dashboard.json" 2>/dev/null; then
    printf 'Refusing to publish while the legacy raw dashboard path exists on main.\n' >&2
    exit 1
  fi
  if git_repo show "$base:public/dashboard-summary.json" 2>/dev/null | cmp -s - "$temporary/public/dashboard-summary.json"; then
    exit 0
  fi

  git_repo read-tree "$base"
  for path in public/dashboard-summary.json server/dashboard/snapshot.enc.json; do
    hash="$(git_repo hash-object -w "$temporary/$path")"
    git_repo update-index --add --cacheinfo "100644,$hash,$path"
  done
  tree="$(git_repo write-tree)"
  commit="$(git_repo commit-tree "$tree" -p "$base" -m 'dashboard: refresh protected snapshot')"
  if git_repo push --quiet origin "$commit:refs/heads/main"; then
    exit 0
  fi
done

exit 1
