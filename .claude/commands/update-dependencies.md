---
description: Update npm dependencies (Playwright, axios, TypeScript, ESLint, libraries) to their latest stable versions
allowed-tools: Read, Edit, Grep, Glob, WebSearch, WebFetch, mcp__context7__resolve-library-id, mcp__context7__query-docs, Bash(npm outdated:*), Bash(npm install:*), Bash(npm run:*), Bash(npx playwright install:*), Bash(git diff:*), Bash(git status:*)
---

Update the dependencies of Catalog E2E Test to their latest stable versions. The command has no arguments — look up all versions yourself.
Do not change the project version (`"version"` in `package.json`); that is done by `/update-version`.

## 1. Read the current state

Read `dependencies` and `devDependencies` in `package.json` (versions have the form `^x.y.z`; `typescript` is pinned without `^`) and run `npm outdated` to see the available versions.

`@types/node` stays on major 26 (Node 26) unless the user explicitly asks otherwise.

## 2. Look up the latest stable versions

Use `npm outdated` and, where needed, the web (npm registry, release notes) for the newest **stable** version of each package.
Ignore alpha, beta, rc, next and canary versions. Use the Context7 MCP for library documentation and migration guides where useful.

- Check compatibility: `eslint` ↔ `@eslint/js`/`globals`, `@typescript-eslint/*` ↔ `eslint`/`typescript`, `@playwright/test` ↔ the installed Chromium.
- Read the release notes / migration guides of every major or minor upgrade for breaking changes (for Playwright also deprecated or changed locator/assertion APIs).
- For a new **major** version of any package, report it to the user in the table instead of applying it, unless the major bump is clearly intended.

Show a table `item | old | new` before editing anything.

## 3. Apply the updates

1. Edit `package.json` — keep the `^` prefix (and the pin of `typescript`) and the 4-space indentation.
2. Run `npm install` so that `package-lock.json` is updated too.
3. If `@playwright/test` changed, run `npx playwright install chromium`.

## 4. Verify

Run `npm run type-check` and `npm run lint`. Fix breaking changes following `AGENTS.md` (strict TypeScript, no `any`, page objects in `pages/`, specs import from `fixtures/test`)
and re-run until everything is green. If a fix is not obvious, stop and ask the user.
`npm run lint` uses `--fix`, so check `git diff` afterwards for unrelated changes.
The E2E tests need the Docker stack (`npm run test` against a running application, or `npm run test:e2e` for the full cycle); ask the user before running them and recommend them after
Playwright upgrades.

## 5. Report

Do not commit or push. Report:
- the table of updated versions,
- code changes made because of breaking changes,
- the result of type-check, lint and (if run) tests,
- the suggested commit message in the style of the git history: a short imperative sentence (e.g. `Update dependencies: Playwright 1.65.0, axios 1.21.0`, naming only the key packages that
  changed).
