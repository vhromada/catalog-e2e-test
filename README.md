# Catalog E2E Test

Playwright end-to-end tests for the Catalog application. The application (Catalog BE + FE) can be started in Docker from this project.

## Prerequisites

- Node.js (latest LTS)
- Docker (to run the application)
- Sibling checkouts `../catalog-be` and `../catalog-fe` (needed to build the Docker stack)

## Setup

```bash
npm install
npx playwright install chromium
echo "HASH_SALT=<salt>" > .env.local   # secret, see Configuration
```

## Configuration

| Variable           | File         | Used by                   | Description                                                                                                                  |
|--------------------|--------------|---------------------------|------------------------------------------------------------------------------------------------------------------------------|
| `FE_BASE_URL`      | `.env`       | tests, `wait`             | URL of the Catalog FE under test (falls back to `http://localhost:8010` when unset)                                          |
| `BE_BASE_URL`      | `.env`       | tests, `build:fe`, `wait` | URL of the Catalog BE (test data API, FE `config.json`, health check; tests and `wait` fall back to `http://localhost:8110`) |
| `CATALOG_USERNAME` | `.env`       | `build:fe`                | BE username written to the FE `config.json` (required)                                                                       |
| `CATALOG_PASSWORD` | `.env`       | `build:fe`                | BE password written to the FE `config.json` (required)                                                                       |
| `ITEMS_PER_PAGE`   | `.env`       | `build:fe`, tests         | Items per page of the FE list views (FE `config.json`; tests derive page counts from it) (required)                          |
| `HASH_SALT`        | `.env.local` | `build:fe`                | Salt for client-side password hashing in the FE (required)                                                                   |

Configuration is split into two files:

- `.env` - values shared across the code (including the test BE credentials), committed.
- `.env.local` - secrets (`HASH_SALT`), git-ignored; create it manually. Its values override `.env`.

Real environment variables take precedence over both files. `CATALOG_USERNAME` and `CATALOG_PASSWORD` must match the BE security settings (BE default: `catalog`/`catalog`).

## Commands

| Command                | Description                                                               |
|------------------------|---------------------------------------------------------------------------|
| `npm run test`         | Run all tests (the application must be running)                           |
| `npm run test:ui`      | Run tests in Playwright UI mode                                           |
| `npm run test:e2e`     | Full cycle: build BE + FE, start Docker stack, wait, run tests, tear down |
| `npm run build:be`     | Build the BE jar (`gradlew bootJar` in `../catalog-be`)                   |
| `npm run build:fe`     | Build the FE bundle from `../catalog-fe` and write the test `config.json` |
| `npm run build:docker` | Build the Docker images                                                   |
| `npm run docker:up`    | Start the Docker stack                                                    |
| `npm run docker:down`  | Stop the Docker stack and remove volumes                                  |
| `npm run wait`         | Wait until BE and FE are ready                                            |
| `npm run lint`         | ESLint (with autofix)                                                     |
| `npm run type-check`   | TypeScript check                                                          |

## Running the application in Docker

The stack (`docker/compose.yaml`) consists of PostgreSQL, `catalog-be` and `catalog-fe` (nginx). Ports: FE `8010`, BE `8110`.

```bash
npm run build:be
npm run build:fe
npm run build:docker
npm run docker:up
npm run wait
npm run test
npm run docker:down   # when done
```

`npm run test:e2e` does all of this in one go (requires `.env.local`) and always tears the stack down, even when tests fail.

## Structure

```
tests/                 Playwright specs (grouped per resource, one spec file per FE route: list, add, edit, detail, ...; plus catalog, login, registration and notFound)
pages/                 Page objects (one per FE page or modal; a form shared by add and edit is one page; subfolder per resource only when it has more than one page)
fixtures/              Playwright fixtures (authedPage logs in via the BE API, one account per worker)
api/                   BE REST client for test data setup and cleanup (axios; one API class per resource in `api/resources/`)
utils/                 Test data factories (unique names, credentials, picture content, `ITEMS_PER_PAGE` and paging helpers) and `mock.ts` (BE response mocking via `page.route`)
docker/                Docker Compose stack (postgres, catalog-be, catalog-fe)
docker/fe/             FE image (nginx); dist/ is generated by build:fe and git-ignored
scripts/               Build and orchestration scripts (build-be, build-fe, wait-for-health, run-e2e)
scripts/lib/           Shared helpers (run.mjs - command runner, env.mjs - loads .env.local and .env)
playwright.config.ts   Playwright configuration
.env                   Configuration (committed)
.env.local             Secrets (git-ignored)
```
