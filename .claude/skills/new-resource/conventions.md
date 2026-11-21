# Catalog E2E Test shared conventions

Referenced by every layer skill in `.claude/skills/`. Each layer skill also carries a short inline summary of the parts that matter most for that layer, so it works standalone — read this file
when you need the full picture or a cross-layer rule. When in doubt, re-read the real file — don't rely on a skill's snippet from memory, since the snippet may lag the code.

## Canonical reference resource: Genre

Genre is the simplest resource in the codebase (a single `name` field, no relations, no parent, no detail page) and is the primary template source for every layer skill. Secondary references
cover the variants Genre doesn't: Movie (composite — relations, picture, detail page) and Season (nested child of Show).

| Layer        | File(s)                                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API client   | `api/resources/GenreApi.ts` (Genre), `api/resources/SeasonApi.ts` (nested variant), `api/ApiClient.ts` (shared client)                                          |
| Test data    | `utils/testData.ts` — `genreRequest()` (Genre), `movieRequest(genres, overrides)` (relation variant)                                                            |
| Page objects | `pages/genres/GenreListPage.ts`, `pages/genres/GenreFormPage.ts`; `pages/movies/MovieFormPage.ts`, `MovieDetailPage.ts` (composite); `pages/seasons/*` (nested) |
| Specs        | `tests/genres/{list,add,edit}.spec.ts`; `tests/movies/*.spec.ts` (composite); `tests/seasons/add.spec.ts` (nested)                                              |
| Wiring       | `pages/CatalogPage.ts`, `tests/catalog/{catalog,not-existing,no-data,result-error}.spec.ts`, `tests/notFound/not-found.spec.ts`                                 |

## FE selector contract

Every page object's locators follow this fixed shape — don't invent a new one for a new resource:

| Element                | Selector                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------- |
| List table             | `#<plural>`                                                                                  |
| List table data cell   | `td[data-nav="<field>"]` inside the table body                                               |
| Row operation link     | `td[data-nav="edit\|duplicate\|remove"] a` inside the matched row                            |
| List-route menu link   | `#<r>ListNavigation`                                                                         |
| Add-route menu link    | `#add<R>Navigation`                                                                          |
| Statistics cell        | `#statistics td[data-nav="count"]` (and other stat fields, e.g. `mediaCount`, `totalLength`) |
| Paging controls        | `#first`, `#previous`, `#pageInfo`, `#next`, `#last`                                         |
| Empty list message     | `#noData`                                                                                    |
| Search submit / inputs | `#search` button; inputs at `form #<field>`                                                  |
| Form field             | `#<field>`                                                                                   |
| Form buttons           | `#create`, `#update`, `#cancel`                                                              |

## Fixtures

`fixtures/test.ts` provides `authedPage`/`adminPage` (BE API login via `accountApi.checkCredentials`, session seeded into `sessionStorage`, one account per worker) and re-exports
`expect`/`test` — always import both from here, never from `@playwright/test` directly in a spec. Plain `page` is used only for the unauthenticated-redirect test and the login/registration UI
specs. Never add a per-resource fixture — a new resource needs no changes to `fixtures/test.ts`.

## Test-data rules

- BE data is created through the API client and removed in `try/finally` (or `beforeEach`/`afterEach` for a nested resource's parent chain) — never left behind for a later test to clean up.
- Usernames always use `credentials()`, never `uniqueName()` — the BE audit columns are `VARCHAR(36)` and `uniqueName()`'s output is far longer.
- Never assert an absolute account count — accounts cannot be deleted through the API, so the count only ever grows across the whole suite's lifetime.
- `mockResponse` (`utils/mock.ts`, wraps `page.route`) is used **only** in `tests/catalog/result-error.spec.ts` (and the other `tests/catalog/*` registries where noted) — never inside a
  per-resource spec in `tests/<r>/`.

## Spec idioms

- `test.describe('<lowercase route> (/<path>)')`; first test is always the unauthenticated redirect with plain `page`.
- Reads of BE-shared/parallel aggregate data (statistics, first page) are wrapped in `await expect(async () => {...}).toPass()` with a before/after BE read proving the data didn't change
  mid-test.
- `ITEMS_PER_PAGE`, `pagesCount(count)`, `INVALID_UUID` all come from `utils/testData.ts` — never redeclare them locally in a spec.
- The paging test always creates `ITEMS_PER_PAGE + 1` rows with a shared prefix, never a literal row count.

## Verification commands

- `npm run lint` — ESLint.
- `npm run type-check` — `tsc --noEmit`.
- `npm run test` (application/Docker stack must already be running) or the full `npm run test:e2e` cycle (build, start stack, test, tear down) to actually run specs.
- Never commit generated `docker/fe/dist/`.

## Markdown rule

Every `.md` file in this repo (including these skills) keeps lines at most 200 characters, except table rows; fill each line as close to 200 chars as possible before wrapping, indent
continuation lines of a list item, and align table `|` separators with spaces, separator rows filled with `-` to the full column width.
