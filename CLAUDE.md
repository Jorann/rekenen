# Regenboog Rekenen

iPad maths practice app for Nomi (8). See README.md for how it works and how to run it.

## Changelog

- Every user-visible change gets a line under `## [Unreleased]` in `CHANGELOG.md`, in the same commit as the change.
- Write entries for Joran (a parent), not for developers: what changed for Nomi or for him, in plain words.

## Releasing

A pushed `v*` tag publishes the Docker image; the Release workflow fails if `CHANGELOG.md` has no section for that version. To release:

1. Pick the version with semver: patch for fixes, minor for new features, major for changes that need action on the server (e.g. config or data changes).
2. In `CHANGELOG.md`, rename `## [Unreleased]` to `## [X.Y.Z] - YYYY-MM-DD`, add a fresh empty `## [Unreleased]` above it, and update the compare links at the bottom.
3. Commit as `Release vX.Y.Z`, push `master`, then `git tag -a vX.Y.Z -m "Regenboog Rekenen X.Y.Z"` and push the tag.
4. Watch the Release workflow (`gh run watch`) and report the result.

## Data

The Postgres database in the local `docker compose` stack holds Nomi's real sessions. Never test against it or clear it: create a separate database (e.g. `rekenen_test`) and point a server at it with `DATABASE_URL`.
