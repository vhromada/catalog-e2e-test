---
description: Update the project version in all places it is defined
argument-hint: <version, e.g. 26.5 or 26.5-SNAPSHOT>
allowed-tools: Read, Edit, Grep, Glob, Bash(git diff:*), Bash(git status:*)
---

Update the version of Catalog E2E Test to the new version `$ARGUMENTS`.

## 1. Validate the input

The new version is required and must match `^\d+\.\d+(-SNAPSHOT)?$` (e.g. `26.5` or `26.5-SNAPSHOT`).
If `$ARGUMENTS` is empty or does not match, stop and ask the user for a valid version. Do not change anything.

The version is used exactly as given (including the `-SNAPSHOT` suffix) in all files.

## 2. Find the current version

Read the current `"version": "..."` from `package.json`. It is used for searching in step 3.

## 3. Edit the files

| File                | Change                                                                                                        |
|---------------------|---------------------------------------------------------------------------------------------------------------|
| `package.json`      | top-level `"version": "<version>"`                                                                            |
| `package-lock.json` | top-level `"version"` (line 3) and `"version"` of `packages[""]` (line 9) — edit by hand, do not run `npm install` |

Verify with Grep that exactly these three occurrences of the old version were replaced.
Do not touch any other version string (dependency versions in `package.json` or `package-lock.json`).

## 4. Report

Show `git diff` and summarize what changed. Do not commit — the version is usually committed together with the dependency update.
