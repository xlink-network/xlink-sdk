#!/usr/bin/env bash

check_jq_exists() {
  if ! command -v jq &> /dev/null; then
      echo "Error: command jq is required"
      exit 1
  fi
}

check_jq_exists

cd "$(git rev-parse --show-toplevel)"

version="$(cat package.json | jq -r '.version' | cut -d'.' -f1-2)"
releaseBranch="releases/v$version"

git fetch origin
git checkout -b releases/latest
git reset --hard origin/$releaseBranch
git push -f origin releases/latest:releases/latest

echo "Synced $releaseBranch to releases/latest"

