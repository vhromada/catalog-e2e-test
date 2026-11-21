---
name: resource-specs
description: >-
  Use when writing or changing Playwright specs in catalog-e2e-test's `tests/<resource>/` — `list.spec.ts`, `add.spec.ts`, `edit.spec.ts`, optional `detail.spec.ts` for a FE route. Covers the
  auth-redirect-first rule, try/finally BE cleanup (including nested parent-chain setup/teardown), the `toPass()` pattern for shared/parallel data, the paging test shape, and per-route test
  rosters for rendering, persistence, validation, paging, filtering and navigation.
---

# Resource specs

## Scope

`tests/<r>/list.spec.ts`, `add.spec.ts`, `edit.spec.ts`, optional `detail.spec.ts` — one spec file per FE route, each covering everything that route offers end-to-end against the real BE+FE
Docker stack. Needs the API client (`api-client`), the factory (`test-data`), and the page objects (`page-objects`) for the resource to already exist.

Inline convention summary (full detail below): `test.describe('<lowercase route> (/<path>)')`; the first test in every spec is the unauthenticated redirect using plain `page` (edit/detail specs
navigate with `INVALID_UUID`); every other test uses `authedPage` (`adminPage` for admin-only routes) with page objects constructed inline per test; BE data created in a test (or
`beforeEach`/`afterEach` for a nested resource's parent chain) is removed in `try/finally`; reads of data shared with parallel test runs are wrapped in `toPass()`; `mockResponse` is **never** used
here — it belongs only to `tests/catalog/*` (see `catalog-wiring`).

## Files (Genre reference)

| File                        | Purpose                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| `tests/genres/list.spec.ts` | list route, template source                                                              |
| `tests/genres/add.spec.ts`  | add route, template source                                                               |
| `tests/genres/edit.spec.ts` | edit route, template source                                                              |
| `tests/movies/*.spec.ts`    | composite-variant reference (relations, picture, media rows, detail page, bigger paging) |
| `tests/seasons/add.spec.ts` | nested-variant reference (parent chain `beforeEach`/`afterEach`)                         |

## Shared structure (every spec)

```typescript
import { genreApi } from '../../api/resources/GenreApi';
import { expect, test } from '../../fixtures/test';
import { CatalogPage } from '../../pages/CatalogPage';
import { GenreFormPage } from '../../pages/genres/GenreFormPage';
import { GenreListPage } from '../../pages/genres/GenreListPage';
import { LoginPage } from '../../pages/LoginPage';
import { genreRequest, ITEMS_PER_PAGE, pagesCount } from '../../utils/testData';

test.describe('genre list (/genres)', () => {

  test('redirects unauthenticated user to login', async ({page}) => {
    await page.goto('/genres');

    await new LoginPage(page).expectOpen();
  });

  // every other test uses authedPage (or adminPage), page objects constructed inline
  test('shows genres stored in BE', async ({authedPage}) => {
    const genre = await genreApi.create(genreRequest());
    try {
      const genreListPage = new GenreListPage(authedPage);
      await genreListPage.goto();
      await genreListPage.search(genre.name);

      await genreListPage.expectRowCount(genre.name, 1);
    } finally {
      await genreApi.delete(genre.uuid);
    }
  });

});
```

Rules:

- `test`/`expect` always imported from `../../fixtures/test`, never `@playwright/test` directly, in a spec.
- `test.describe('<lowercase thing> (/<path>)')` — e.g. `'genre list (/genres)'`, `'add genre (/genres/add)'`, `'edit genre (/genres/:uuid)'`, `'movie detail (/movies/:uuid/detail)'`. Use the
  FE route's own path shape, `:uuid` for a dynamic segment.
- The **first** test of every spec is `'redirects unauthenticated user to login'` using plain `page` — `page.goto(path)` then `new LoginPage(page).expectOpen()`. An edit/detail spec navigates with
  `INVALID_UUID` (`` `/genres/${INVALID_UUID}` ``) since no real uuid is needed to prove the redirect.
- Every other test destructures `authedPage` (or `adminPage` for an admin-gated route, e.g. account role editing) from the fixture and constructs whatever page objects it needs **inline**, at the
  top of the test body — never via a shared fixture or `beforeEach` (except the nested-resource parent chain below).
- Any BE data a test creates is removed in `try/finally`, keyed by the identifier the API exposes for cleanup — `api.delete(uuid)` when the row's uuid is known, or `api.deleteBy<Field>(value)`
  when the UI might have created duplicates of it (duplicate/remove tests, validation-error tests that search by a not-yet-created name).

## Reading shared/parallel data: `toPass()`

Statistics and "first page" reads race other workers' tests running against the same BE, so wrap a before/after BE read around the FE read and retry the whole block until they agree
(`tests/genres/list.spec.ts`):

```typescript
test('shows count of genres from BE', async ({authedPage}) => {
  const genreListPage = new GenreListPage(authedPage);

  await expect(async () => {
    const before = await genreApi.statistics();
    await genreListPage.goto();
    await expect(genreListPage.count).toHaveText(/\d+/);
    const shown = await genreListPage.count.innerText();
    const after = await genreApi.statistics();

    expect(after.count).toBe(before.count);
    expect(shown).toBe(String(before.count));
  }).toPass();
});
```

Use this shape — BE read, FE action, FE read, BE read again, assert the two BE reads agree before trusting the FE value — for any assertion against BE-computed aggregate data (statistics, first
page of a shared list) that isn't scoped to a uuid the test itself created.

## Cleanup pattern for a nested resource (`tests/seasons/add.spec.ts`)

A nested resource's parent chain is built in `beforeEach` and torn down in `afterEach`, not per-test try/finally, since every test in the file needs the same parent:

```typescript
let genre: Genre;
let show: Show;

test.beforeEach(async () => {
  genre = await genreApi.create(genreRequest());
  show = await showApi.create(showRequest([genre.uuid]));
});

test.afterEach(async () => {
  await showApi.delete(show.uuid);
  await genreApi.delete(genre.uuid);
});
```

Teardown order is the reverse of setup (child-of-child first). A test's own data (the season itself) still gets its own `try/finally` or is asserted via `seasonApi.list(show.uuid)` and cleaned up
implicitly by the parent's deletion cascading — follow whichever the real `tests/seasons/*.spec.ts` files do for that exact case rather than assuming.

## Paging test shape (`tests/movies/list.spec.ts`)

```typescript
test('pages through search results', async ({authedPage}) => {
  const prefix = movieRequest([genre.uuid]).czechName;
  const movies = await Promise.all(Array.from({length: ITEMS_PER_PAGE + 1}, (_, i) => movieApi.create(movieRequest([genre.uuid], {czechName: `${prefix} ${i}`}))));
  try {
    const movieListPage = new MovieListPage(authedPage);
    await movieListPage.goto();
    await movieListPage.search({czechName: prefix});

    await movieListPage.expectRowCount(prefix, ITEMS_PER_PAGE);
    await movieListPage.expectPage('1 / 2');
    await expect(movieListPage.first).toHaveCount(0);
    await expect(movieListPage.previous).toHaveCount(0);

    await movieListPage.next.click();
    // ... assert page 2, then previous/last/first back to page 1
  } finally {
    await Promise.all(movies.map((movie) => movieApi.delete(movie.uuid)));
  }
});
```

Always create `ITEMS_PER_PAGE + 1` rows sharing a common prefix (never a literal count) so the test stays correct regardless of the configured page size; assert `'1 / 2'`, that `first`/`previous`
are absent on page 1, click through `next` → `previous` → `last` → `first`, asserting row count and page info at each stop, and that `next`/`last` are absent on the final page.

## Test rosters per route

**`list.spec.ts`**: auth redirect; heading + search form + statistics render; statistics count from BE (`toPass()`); first page of items from BE (`toPass()`); a stored item is visible via search;
search finds the right item and excludes another; search with no match hides the table entirely (`toHaveCount(0)`, not empty); main menu + resource menu visible; opens add form from the menu;
returns to list from the menu; opens edit form with the item (and detail, if the resource has one); duplicate increases the row count and is reflected in BE; remove decreases the row count and is
reflected in BE; no paging shown for a single page of results; paging through search results (shape above).

**`add.spec.ts`**: auth redirect; shows an empty form with every field's default value and the cancel button; adds an item and it is stored in BE with the exact submitted values; adds an item
with only the required fields filled (multi-field resources — assert the optional fields come back falsy); adds an item with maximum field values (`padEnd`/`repeat` to each field's max length);
cancel returns to the list without saving (BE search confirms nothing was created); main menu + resource menu visible; one test per required-field validation error (all fired errors asserted,
a non-required field's error asserted absent via `expectNoError`); one test per too-long-field validation error (BE search confirms nothing was created); errors clear after the fields are
corrected. A composite/relational resource additionally covers: picking relations (listing them from BE in the select, selecting one/many), adding/removing repeated rows (media), range
validation (year/IMDB/medium length boundaries), and the picture-modal flow (open/choose/remove/change/close-with-cross/close-with-escape) when the resource has a picture — see
`tests/movies/add.spec.ts` for the full worked set.

**`edit.spec.ts`**: auth redirect (navigate with `INVALID_UUID`); prefills the form with the item's current values from BE; updates the item and it is stored in BE; updates with maximum field
values; saving without any change keeps the entity byte-for-byte equal (`expect(await <r>Api.get(uuid)).toEqual(entity)` after clicking update with no edits); cancel returns to the list without
saving (BE confirms unchanged); main menu + resource menu visible; the same required/too-long/clears-errors validation trio as `add.spec.ts`, each confirming BE is unchanged afterward.

**`detail.spec.ts`** (only for resources with a detail page, e.g. Movie): auth redirect; every displayed field's value matches BE; navigation back to the list/edit route works from the detail
page.

## Pitfalls

- Don't use `mockResponse` in a per-resource spec — it is reserved for `tests/catalog/*` registries (see `catalog-wiring`); per-resource specs exercise the real BE.
- Don't assert an absolute count anywhere that touches accounts — accounts cannot be deleted through the API, so any account-count assertion is inherently flaky across runs.
- Don't construct page objects via a shared fixture or module-level variable — always inline, at the top of each test body (the nested-resource parent entities in `beforeEach`/`afterEach` are the
  only exception, and those are API-created domain objects, not page objects).
- Don't assert a BE-shared aggregate (statistics, first page) without the `toPass()` double-read guard — a flaky failure here is very likely a missed guard, not a product bug.
- Don't hardcode a literal row count in the paging test — always `ITEMS_PER_PAGE + 1` created rows, so the test is correct for any configured page size.

## Checklist

- [ ] `describe` title matches the route's own path shape; first test is the unauthenticated redirect with plain `page`.
- [ ] Every other test uses `authedPage`/`adminPage`, page objects constructed inline, BE data cleaned up in `try/finally` (or nested `beforeEach`/`afterEach` for a parent chain).
- [ ] Shared/parallel BE reads wrapped in `toPass()` with a before/after BE read.
- [ ] Paging test creates `ITEMS_PER_PAGE + 1` rows with a shared prefix, not a literal count.
- [ ] Full roster for the route covered per the lists above; no `mockResponse` used.
