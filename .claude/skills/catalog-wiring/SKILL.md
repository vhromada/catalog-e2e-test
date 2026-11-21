---
name: catalog-wiring
description: >-
  Use when adding or changing the cross-cutting registries a finished resource must be wired into in catalog-e2e-test — `pages/CatalogPage.ts` navigation, `tests/catalog/catalog.spec.ts`,
  `tests/catalog/not-existing.spec.ts`, `tests/catalog/no-data.spec.ts`, `tests/catalog/result-error.spec.ts`, `tests/notFound/not-found.spec.ts`. Covers the exact entry shape for each registry
  and why this is the most commonly forgotten step.
---

# Catalog wiring

## Scope

The shared, cross-cutting files that every finished resource must be registered in **on top of** its own API client, factory, page objects and specs — a resource is not actually done until this
step runs. None of these files belong to one resource; each is a flat registry with one entry per resource (or per route, for route-shaped registries).

Inline convention summary (full detail below): add a navigation locator + `open<R>()` + menu-expectation lines to `pages/CatalogPage.ts`; add one main-menu navigation test to
`tests/catalog/catalog.spec.ts`; add a `routes` entry to `tests/catalog/not-existing.spec.ts` for each edit/detail route; add a `lists` entry to `tests/catalog/no-data.spec.ts` only when the list
can't be emptied for real; add a URL-regex constant + `mockResponse` 500 test to `tests/catalog/result-error.spec.ts`; touch `tests/notFound/not-found.spec.ts` only if the route shape is unusual.

## Files

| File                                 | Purpose                                                                                         |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- |
| `pages/CatalogPage.ts`               | main menu page object — navigation locators, `open<R>()`, `expectMainMenu`/`expectAdminMenu`    |
| `tests/catalog/catalog.spec.ts`      | main-menu navigation coverage, one test per top-level resource                                  |
| `tests/catalog/not-existing.spec.ts` | a shared `routes` table: non-existent uuid on an edit/detail route shows the result error modal |
| `tests/catalog/no-data.spec.ts`      | a shared `lists` table: empty-list rendering for lists that can't be emptied for real           |
| `tests/catalog/result-error.spec.ts` | per-resource `mockResponse` 500 coverage of the result error modal                              |
| `tests/notFound/not-found.spec.ts`   | unknown-route handling — rarely needs a per-resource change                                     |

## 1. `pages/CatalogPage.ts`

```typescript
readonly genresNavigation: Locator;
// in the constructor:
this.genresNavigation = page.locator('#genresNavigation');
// a dedicated open method:
async openGenres(): Promise<void> {
  await this.genresNavigation.click();
}
// in expectMainMenu() (and expectAdminMenu() too, if the resource is visible to admins):
await expect(this.genresNavigation).toBeVisible();
```

Add the navigation `Locator` field (constructor-assigned alongside the existing ones, any position), an `open<R>()` action method, and a `toBeVisible()`/`toHaveCount(0)` line in
`expectMainMenu()` — and in `expectAdminMenu()` too if the resource should also show there (most do; `expectAdminMenu()` is a narrower subset — compare the two methods' current bodies before
deciding).

## 2. `tests/catalog/catalog.spec.ts`

```typescript
test('opens genres from the main menu', async ({authedPage}) => {
  const catalogPage = new CatalogPage(authedPage);
  await catalogPage.goto();
  await catalogPage.openGenres();

  await new GenreListPage(authedPage).expectOpen();
});
```

One test per top-level resource, this exact shape, plus the matching `import { <R>ListPage } from '../../pages/<r>/<R>ListPage';` line kept alphabetically grouped with the other page-object
imports.

## 3. `tests/catalog/not-existing.spec.ts`

```typescript
const routes = [
  // ...
  {name: 'edit genre', path: `/genres/${INVALID_UUID}`},
  // ...
];
```

Add one `{name, path}` entry per edit route and, separately, per detail route (if the resource has one) — e.g. Movie contributes both `'edit movie'` and `'movie detail'`. A nested resource's path
interpolates `INVALID_UUID` for **every** dynamic segment, parent included (see the `season`/`episode` entries). Keep the array's existing grouping (roughly alphabetical by resource) when
inserting. Admin-only routes (account roles) are handled by the separate `adminPage` test below the array, not by adding to `routes` — only touch that if the new resource is itself admin-gated.

## 4. `tests/catalog/no-data.spec.ts`

```typescript
const lists = [
  // ...
  {name: 'seasons', path: `/shows/${INVALID_UUID}/seasons`, api: /\/rest\/shows\/[^/]+\/seasons(\?.*)?$/, heading: 'Seasons', message: 'No seasons'}
];
```

Add a `{name, path, api, heading, message}` entry **only** when the list genuinely cannot be emptied for a real test — shared with parallel workers (pictures), or nested under a parent that's
expensive to set up with zero children (seasons, episodes, songs, book items). A resource whose list a spec can legitimately empty via `search` + no-match (the common case — see `GenreListPage`'s
own `'shows no table when search finds nothing'` test in `resource-specs`) does **not** need an entry here; that empty-list behavior is already covered by its own `list.spec.ts`.

## 5. `tests/catalog/result-error.spec.ts`

```typescript
const GENRES = /\/rest\/genres(\/[^/]+)?(\?.*)?$/;
```

Define one URL-regex constant per resource shaped `` /\/rest\/<plural>(\/[^/]+)?(\?.*)?$/ `` (nested: prefix with the parent segment, e.g. `` /\/rest\/shows\/[^/]+\/seasons(\/[^/]+)?(\?.*)?$/ ``),
then add this spec's own `test.describe` block for the resource, covering (mirroring the existing Genre block): list load failure (500 shows the modal, table absent); add failure keeps the form
and its entered values; update failure keeps the form and its entered values; remove/duplicate failure leaves BE data unchanged; an item that doesn't exist in BE on the edit route shows a 404
modal. Use `mockResponse(page, urlRegex, method, status, body?)` from `utils/mock.ts` for every mocked response — this file is the **only** place per-resource specs are allowed to use it.

## 6. `tests/notFound/not-found.spec.ts`

This file tests the unknown-route (`/unknown/page`) fallback, which is route-shape-agnostic — a new resource almost never needs a change here. Only touch it if the new resource introduces an
unusual routing shape (e.g. a catch-all pattern) that could interact with the not-found fallback differently than existing routes.

## Pitfalls

- **This is the most easily forgotten step.** A resource with a complete API client, factory, page objects and specs is still incomplete until it's wired into every applicable registry above —
  treat it as mandatory, not an afterthought, and do it last (after `resource-specs`) since it references the finished routes/pages.
- Don't add a `tests/catalog/no-data.spec.ts` entry for a list a spec can legitimately empty for real via search — that just duplicates coverage `list.spec.ts` already has.
- Don't use `mockResponse` anywhere outside `tests/catalog/result-error.spec.ts` (within these registries) or outside per-resource specs' own BE-mocking needs — it is a `tests/catalog/*`-only
  tool, never a per-resource `resource-specs` tool.
- Don't forget the admin-menu visibility line in `CatalogPage.expectAdminMenu()` for a resource that's visible there too — check both `expectMainMenu()` and `expectAdminMenu()`, not just one.

## Checklist

- [ ] `CatalogPage.ts`: navigation locator, `open<R>()`, line in `expectMainMenu()` (and `expectAdminMenu()` if applicable).
- [ ] `tests/catalog/catalog.spec.ts`: one main-menu navigation test + import.
- [ ] `tests/catalog/not-existing.spec.ts`: one `routes` entry per edit/detail route, `INVALID_UUID` on every dynamic segment.
- [ ] `tests/catalog/no-data.spec.ts`: entry added only if the list truly can't be emptied for a real test.
- [ ] `tests/catalog/result-error.spec.ts`: URL-regex constant + full failure-mode test block.
- [ ] `tests/notFound/not-found.spec.ts` touched only if the route shape is unusual.
