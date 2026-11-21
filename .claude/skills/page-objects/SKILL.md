---
name: page-objects
description: >-
  Use when adding or changing a page object in catalog-e2e-test's `pages/` — a `<R>ListPage`, `<R>FormPage` (shared by add+edit), or `<R>DetailPage` for a new FE route. Covers locator/method
  ordering, the no-base-classes rule, the shared add/edit form shape, the FE selector contract, and nested-resource parent-uuid parameters in `goto`/`expectOpen`.
---

# Page objects

## Scope

`pages/<r>/<R>ListPage.ts`, `pages/<r>/<R>FormPage.ts`, optional `pages/<r>/<R>DetailPage.ts` — one page object per FE route, wrapping Playwright locators/actions/assertions for that route. No
page object imports `api/` — BE setup/cleanup lives only in specs (`resource-specs`).

Inline convention summary (full detail below): `export class <R><Role>Page`, `readonly Locator` fields declared first and assigned in `constructor(private readonly page: Page)`; method order is
`goto*` → actions → `row()`/locator-factory methods → `expect*`; no base classes anywhere — duplicated locator/assertion blocks are tolerated and marked `// noinspection DuplicatedCode`; one
`<R>FormPage` is shared by the add and edit routes; selectors follow the fixed contract in `conventions.md`; a nested resource's `goto`/`expectOpen` take the parent uuid(s) as leading parameters.

## Files (Genre reference)

| File                                                                 | Purpose                                                            |
| -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `pages/genres/GenreListPage.ts`                                      | list route page object                                             |
| `pages/genres/GenreFormPage.ts`                                      | add+edit shared form page object                                   |
| `pages/movies/MovieFormPage.ts`                                      | composite-variant reference (relations, picture modal, media rows) |
| `pages/movies/MovieDetailPage.ts`                                    | detail-route reference                                             |
| `pages/seasons/SeasonListPage.ts`, `pages/seasons/SeasonFormPage.ts` | nested-variant reference (parent uuid parameters)                  |

## Template: list page (verbatim, `pages/genres/GenreListPage.ts`)

```typescript
import { expect, type Locator, type Page } from '@playwright/test';

export class GenreListPage {

  readonly heading: Locator;
  readonly searchName: Locator;
  readonly searchButton: Locator;
  readonly listNavigation: Locator;
  readonly addNavigation: Locator;
  readonly table: Locator;
  readonly names: Locator;
  readonly count: Locator;
  readonly first: Locator;
  readonly previous: Locator;
  readonly pageInfo: Locator;
  readonly next: Locator;
  readonly last: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Genres'});
    this.searchName = page.locator('form #name');
    this.searchButton = page.locator('#search');
    this.listNavigation = page.locator('#genreListNavigation');
    this.addNavigation = page.locator('#addGenreNavigation');
    this.table = page.locator('#genres');
    this.names = page.locator('#genres tbody td[data-nav="name"]');
    // noinspection DuplicatedCode
    this.count = page.locator('#statistics td[data-nav="count"]');
    this.first = page.locator('#first');
    this.previous = page.locator('#previous');
    this.pageInfo = page.locator('#pageInfo');
    this.next = page.locator('#next');
    this.last = page.locator('#last');
  }

  async goto(): Promise<void> {
    await this.page.goto('/genres');
  }

  async openList(): Promise<void> {
    await this.listNavigation.click();
  }

  async openAdd(): Promise<void> {
    await this.addNavigation.click();
  }

  async search(name: string): Promise<void> {
    await this.searchName.fill(name);
    await this.searchButton.click();
  }

  row(name: string): Locator {
    return this.page.locator('#genres tbody tr').filter({has: this.page.locator('td[data-nav="name"]', {hasText: name})});
  }

  async edit(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="edit"] a').click();
  }

  async duplicate(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="duplicate"] a').click();
  }

  async remove(name: string): Promise<void> {
    await this.row(name).first().locator('td[data-nav="remove"] a').click();
  }

  async expectRowCount(name: string, count: number): Promise<void> {
    await expect(this.row(name)).toHaveCount(count);
  }

  async expectPage(info: string): Promise<void> {
    await expect(this.pageInfo).toHaveText(info);
  }

  async expectOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/genres$/);
    await expect(this.heading).toBeVisible();
  }

}
```

## Template: shared add/edit form page (verbatim, `pages/genres/GenreFormPage.ts`)

```typescript
import { expect, type Locator, type Page } from '@playwright/test';

export class GenreFormPage {

  readonly addHeading: Locator;
  readonly editHeading: Locator;
  readonly name: Locator;
  readonly createButton: Locator;
  readonly updateButton: Locator;
  readonly cancelButton: Locator;

  constructor(private readonly page: Page) {
    this.addHeading = page.getByRole('heading', {name: 'Add genre'});
    this.editHeading = page.getByRole('heading', {name: 'Edit genre'});
    this.name = page.locator('#name');
    this.createButton = page.locator('#create');
    this.updateButton = page.locator('#update');
    this.cancelButton = page.locator('#cancel');
  }

  async gotoAdd(): Promise<void> {
    await this.page.goto('/genres/add');
  }

  async gotoEdit(uuid: string): Promise<void> {
    await this.page.goto(`/genres/${uuid}`);
  }

  async create(name: string): Promise<void> {
    await this.name.fill(name);
    await this.createButton.click();
  }

  async update(name: string): Promise<void> {
    await this.name.fill(name);
    await this.updateButton.click();
  }

  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  async expectError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toBeVisible();
  }

  async expectNoError(message: string): Promise<void> {
    await expect(this.page.getByText(message, {exact: true})).toHaveCount(0);
  }

  async expectAddOpen(): Promise<void> {
    await expect(this.page).toHaveURL(/\/genres\/add$/);
    await expect(this.addHeading).toBeVisible();
    await expect(this.createButton).toBeVisible();
    await expect(this.updateButton).toHaveCount(0);
  }

  async expectEditOpen(uuid: string, name: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/genres/${uuid}$`));
    await expect(this.editHeading).toBeVisible();
    await expect(this.updateButton).toBeVisible();
    await expect(this.createButton).toHaveCount(0);
    await expect(this.name).toHaveValue(name);
  }

}
```

Rules:

- `export class <R><Role>Page` — `<Role>` is `List`, `Form`, or `Detail`. **No base classes** anywhere in `pages/` — every page object is a standalone class; shared-looking blocks between
  resources (statistics locator, paging locators, error-message assertions) are duplicated verbatim and marked `// noinspection DuplicatedCode` rather than factored into a shared helper or base
  class.
- Always a `pages/<r>/` subfolder once a resource has ≥ 2 pages (list + form at minimum); a single-page resource (none in the current catalog) would sit directly in `pages/`.
- Field declaration order: every `readonly Locator` field first, in the order it's assigned in the constructor; `constructor(private readonly page: Page)` assigns them all in the same order,
  immediately — no logic beyond locator construction in the constructor body.
- Method order within the class: `goto*` methods first, then user actions (`search`, `create`/`update`, `cancel`, `openAdd`, etc.), then `row()`/other locator-factory methods (parametrized
  `Locator`-returning methods, not `async`), then `expect*` assertion methods last.
- One `<R>FormPage` shared by both the add and edit routes: `gotoAdd()`/`gotoEdit(uuid)`, `create(values)`/`update(values)` (both call a shared private/internal `fill(values)` when there is more
  than one field — see the Movie variant below), `expectAddOpen()`/`expectEditOpen(uuid, values)`, plus `expectError(message)`/`expectNoError(message)` shared by both routes.
- Actions never assert — `create`/`update`/`search`/`edit`/`remove`/etc. only interact with the page; every assertion lives in an `expect*` method, called separately by the spec. Don't fold an
  `expect(...)` into an action method.
- Selectors follow the fixed FE contract — see `conventions.md` for the full table (table id, `data-nav` cells, row-operation links, navigation ids, statistics cells, paging ids, search form,
  form field/button ids). Don't invent a new selector shape for a new resource; find the matching row in the contract.

## Variant: multi-field / composite form (`pages/movies/MovieFormPage.ts`, condensed)

A resource with more than a couple of fields, relations, or a picture gets:

- An exported `interface <R>Values` describing every field `fill()`/`create()`/`update()`/`expectEditOpen()` take, with optional fields marked `?` (e.g. `subtitles?: string[]`, `note?: string`).
- Module-level constants for fixed option sets used by both filling and asserting (`const LANGUAGES = ['CZ', 'EN', 'FR', 'JP', 'SK'];`), plus small local helpers (`split(seconds)` for
  hours/minutes/seconds inputs).
- Locator-factory methods for repeated rows/options, parametrized by index or value (`language(value)`, `mediumHours(index)`, `removeMediumButton(index)`) — never a single locator per possible
  value.
- A private `fill(values)` shared by `create(values)`/`update(values)`, handling checkboxes (`setChecked`), dynamic row add/remove (`while` loops comparing current count to `values.X.length`), and
  a relations `<select multiple>` via `selectOption(values.relationUuids)`.
- Picture-modal members when the resource has a picture: `picture`, `choosePictureButton`, `removePictureButton`, `pictureModal`, `pictureModalChooseButton`, `pictureModalCross`, plus
  `pictureOption(uuid)`, `openPictureModal()`, `closePictureModalWith{Cross,Escape}()`, `choosePicture(uuid)`, `removePicture()` — copy `MovieFormPage`'s shape verbatim, adjusting the `alt`/class
  selectors for the new resource.
- `expect.poll(async () => (await this.selectedRelations()).sort()).toEqual([...values.relationUuids].sort())` to assert a multi-select's selection order-independently (see
  `selectedGenres()`/its use in `expectEditOpen`) instead of a plain `toHaveValue`.

```typescript
export interface MovieValues {
  czechName: string;
  originalName: string;
  year: number | string;
  languages: string[];
  subtitles?: string[];
  media: number[];
  // ...optional fields, then the relation
  genres: string[];
}
```

## Variant: detail page (`pages/movies/MovieDetailPage.ts`, verbatim)

```typescript
import { expect, type Locator, type Page } from '@playwright/test';

export class MovieDetailPage {

  readonly heading: Locator;
  readonly picture: Locator;
  readonly csfdLink: Locator;
  readonly imdbLink: Locator;
  readonly wikiCzLink: Locator;
  readonly wikiEnLink: Locator;

  constructor(private readonly page: Page) {
    this.heading = page.getByRole('heading', {name: 'Movie detail'});
    this.picture = page.locator('img.picture');
    this.csfdLink = page.locator('tbody tr td[colspan="2"] a', {hasText: 'ČSFD'});
    this.imdbLink = page.locator('tbody tr td[colspan="2"] a', {hasText: 'IMDB'});
    this.wikiCzLink = page.locator('tbody tr td[colspan="2"] a', {hasText: 'Czech Wikipedia'});
    this.wikiEnLink = page.locator('tbody tr td[colspan="2"] a', {hasText: 'English Wikipedia'});
  }

  async goto(uuid: string): Promise<void> {
    await this.page.goto(`/movies/${uuid}/detail`);
  }

  row(title: string): Locator {
    return this.page.locator('tbody tr').filter({has: this.page.locator('td.title', {hasText: new RegExp(`^${title}$`)})});
  }

  value(title: string): Locator {
    return this.row(title).locator('td').nth(1);
  }

  async expectOpen(uuid: string): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/movies/${uuid}/detail$`));
    await expect(this.heading).toBeVisible();
  }

}
```

A detail page is read-only: no `create`/`update`, just `goto(uuid)`, a generic `row(title)`/`value(title)` pair for reading labeled rows, any resource-specific link locators, and `expectOpen(uuid)`.

## Variant: nested resource (`pages/seasons/SeasonListPage.ts`, `pages/seasons/SeasonFormPage.ts`)

Every `goto*`/`expectOpen*` method on a nested resource's page objects takes the parent uuid(s) as the leading parameter(s), matching the nested URL shape:

```typescript
async goto(showUuid: string): Promise<void> {
  await this.page.goto(`/shows/${showUuid}/seasons`);
}

async expectOpen(showUuid: string): Promise<void> {
  await expect(this.page).toHaveURL(new RegExp(`/shows/${showUuid}/seasons$`));
  await expect(this.heading).toBeVisible();
}
```

`SeasonFormPage.gotoAdd(showUuid)` / `gotoEdit(showUuid, uuid)` / `expectAddOpen(showUuid)` / `expectEditOpen(showUuid, uuid, values)` follow the same pattern; a doubly-nested resource (e.g.
`EpisodeFormPage` under Show→Season) takes both parent uuids, outermost first: `gotoAdd(showUuid, seasonUuid)`.

## Pitfalls

- Don't create a base class or shared helper module for page objects, even when two resources' locators/methods are identical — duplicate and mark `// noinspection DuplicatedCode` instead.
- Don't assert inside an action method (`create`, `search`, `edit`, ...) — assertions belong only in `expect*` methods, called separately by the spec.
- Don't give a nested resource's page objects a parent-less `goto()`/`expectOpen()` — the parent uuid is always a required leading parameter, never optional.
- Don't use a plain `toHaveValue`/`toEqual` on a multi-select's current selection — use `expect.poll(...)` with both sides sorted, since option order isn't guaranteed.
- Don't skip the `pages/<r>/` subfolder once a resource has both a list and a form page.

## Checklist

- [ ] One subclass per route (`List`/`Form`/`Detail`), no base class, in `pages/<r>/`.
- [ ] Locator fields declared first, assigned in constructor in the same order; methods ordered `goto*` → actions → locator factories → `expect*`.
- [ ] One `<R>FormPage` shared by add+edit; multi-field resources get an exported `<R>Values` interface and a private shared `fill()`.
- [ ] Selectors match the contract in `conventions.md` exactly (table id, `data-nav`, navigation ids, paging ids, form field/button ids).
- [ ] Nested resource: parent uuid(s) are leading parameters on every `goto*`/`expect*` method.
- [ ] No assertions inside action methods.
