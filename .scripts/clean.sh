#!/usr/bin/env bash

# Fail on any error, unset variable, or failed pipe
set -euo pipefail

# Fetch and prune remote-tracking branches
git fetch --prune

# Collect local branches whose upstream is gone
git branch -vv | awk '/: gone]/{print $1}' > .git/branches-to-delete || true

if [ -s .git/branches-to-delete ]; then
  current_branch="$(git rev-parse --abbrev-ref HEAD)"
  while read -r b; do
    if [ "${b}" != "${current_branch}" ]; then
      git branch -D "${b}" || true
    else
      echo "Skipping current branch: ${b}"
    fi
  done < .git/branches-to-delete
else
  echo "No local branches to delete"
fi

rm -rf .git/branches-to-delete || true

# Cleanup build artifacts and deps
rm -rf dist node_modules coverage || true

exit 0