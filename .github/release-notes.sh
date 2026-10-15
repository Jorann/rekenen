#!/bin/sh
# Prints the CHANGELOG.md section for one version, used as the GitHub release notes.
# Fails when the changelog has no section for that version.
# Usage: sh .github/release-notes.sh 1.2.0
set -eu
version="$1"

awk -v v="$version" '
  index($0, "## [" v "]") == 1 { on = 1; next }
  on && (/^## \[/ || /^\[[^]]+\]: /) { exit }
  on { lines[++n] = $0 }
  END {
    first = 1; while (first <= n && lines[first] ~ /^[[:space:]]*$/) first++
    last = n; while (last >= first && lines[last] ~ /^[[:space:]]*$/) last--
    if (first > last) { print "::error::CHANGELOG.md has no \"## [" v "]\" section" > "/dev/stderr"; exit 1 }
    for (i = first; i <= last; i++) print lines[i]
  }
' CHANGELOG.md

printf '\n**Docker image:** `ghcr.io/jorann/rekenen:%s`\n' "$version"
