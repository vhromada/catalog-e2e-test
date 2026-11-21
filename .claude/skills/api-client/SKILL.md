---
name: api-client
description: >-
  Use when adding or changing a BE API client in catalog-e2e-test — a new `api/resources/<R>Api.ts` used by specs and factories to create, fetch, search and clean up test data. Covers the
  interface/Page/ChangeRequest/object-literal shape, the shared `apiClient`, the deliberate absence of an update method, and the nested-resource parent-uuid variant.
---

# API client

## Scope

`api/resources/<R>Api.ts` — a plain object literal over the shared axios `apiClient` (`api/ApiClient.ts`) that specs and `utils/testData.ts` factories use to create, fetch, search and delete test
data against the BE REST API. This is the only layer that talks to the BE directly; page objects never import it for anything but assertions/cleanup in specs.

Inline convention summary (full detail below): one file per resource, `export interface <R>` (uuid first) → optional `export interface Statistics` → non-exported `interface <R>Page` →
`export interface Change<R>Request` (no uuid) → `export const <r>Api = {create, get, search, list, statistics, delete, deleteBy<Field>}`; paths are relative to the base URL ending in `/rest/`;
there is deliberately no update method; a nested resource takes the parent uuid as the leading parameter of every method.

## Files (Genre reference)

| File                         | Purpose                                                  |
| ---------------------------- | -------------------------------------------------------- |
| `api/ApiClient.ts`           | shared axios instance (`apiClient`), `requireEnv`        |
| `api/resources/GenreApi.ts`  | template source, 57 lines                                |
| `api/resources/SeasonApi.ts` | nested-variant reference (parent uuid leading parameter) |

## Template (verbatim, `api/resources/GenreApi.ts`)

```typescript
import { apiClient } from '../ApiClient';

export interface Genre {
  uuid: string;
  name: string;
}

export interface Statistics {
  count: number;
}

interface GenrePage {
  data: Genre[];
  pagingInfo: { pageNumber: number; pagesCount: number };
}

export interface ChangeGenreRequest {
  name: string;
}

export const genreApi = {

  async create(request: ChangeGenreRequest): Promise<Genre> {
    const response = await apiClient.post<Genre>('genres', request);
    return response.data;
  },

  async get(uuid: string): Promise<Genre> {
    const response = await apiClient.get<Genre>(`genres/${uuid}`);
    return response.data;
  },

  async search(name: string): Promise<Genre[]> {
    const response = await apiClient.get<{ data: Genre[] }>('genres', {params: {name}});
    return response.data.data;
  },

  async list(page: number, limit = 50): Promise<GenrePage> {
    const response = await apiClient.get<GenrePage>('genres', {params: {page, limit}});
    return response.data;
  },

  async statistics(): Promise<Statistics> {
    const response = await apiClient.get<Statistics>('genres/statistics');
    return response.data;
  },

  async delete(uuid: string): Promise<void> {
    await apiClient.delete(`genres/${uuid}`);
  },

  async deleteByName(name: string): Promise<void> {
    const genres = await this.search(name);
    await Promise.all(genres.map((genre) => this.delete(genre.uuid)));
  }

};
```

Rules:

- File order is fixed: `export interface <R>` (always `uuid: string` first field) → `export interface Statistics` (top-level resources only — skip it for a resource with no `statistics` endpoint,
  e.g. `SeasonApi`) → non-exported `interface <R>Page { data: <R>[]; pagingInfo: { pageNumber: number; pagesCount: number } }` → `export interface Change<R>Request` (every field the add/edit form
  submits, **never** `uuid`; relations are `string[]` of uuids, e.g. Movie's `genres: string[]`) → `export const <r>Api = {...}`.
- `apiClient` (from `api/ApiClient.ts`) is a single shared axios instance with basic auth and an `X-Request-Id` interceptor already wired up — import and reuse it, never construct a new axios
  instance or call `createApiClient()` again.
- Paths passed to `apiClient` are relative to the client's base URL, which already ends in `/rest/` — write `'genres'` / `` `genres/${uuid}` ``, never a leading slash or `rest/` prefix.
- `create`/`get`/`search`/`list`/`statistics`/`delete` are the baseline method set for a top-level resource; `search` takes the one searched field as a plain parameter (not an object) and returns
  `<R>[]` by unwrapping `response.data.data`; `list` takes `(page, limit = 50)` and returns the full page object (data + pagingInfo) unwrapped.
- `deleteBy<Field>(value)` — only add this when a spec's cleanup needs to remove every row matching a non-unique field (the UI can create duplicates in a test, e.g. `duplicate`/validation-error
  tests); it is `search` + `Promise.all(...delete)`. Don't add it speculatively for every resource — only when a spec in `resource-specs` actually needs it.

## Nested-resource variant (`api/resources/SeasonApi.ts`)

```typescript
export const seasonApi = {

  async create(showUuid: string, request: ChangeSeasonRequest): Promise<Season> {
    const response = await apiClient.post<Season>(`shows/${showUuid}/seasons`, request);
    return response.data;
  },

  async get(showUuid: string, uuid: string): Promise<Season> {
    const response = await apiClient.get<Season>(`shows/${showUuid}/seasons/${uuid}`);
    return response.data;
  },

  async list(showUuid: string, page = 1, limit = 50): Promise<SeasonPage> {
    const response = await apiClient.get<SeasonPage>(`shows/${showUuid}/seasons`, {params: {page, limit}});
    return response.data;
  },

  async delete(showUuid: string, uuid: string): Promise<void> {
    await apiClient.delete(`shows/${showUuid}/seasons/${uuid}`);
  }

};
```

A nested child resource (reached only through a parent, e.g. Season under Show) takes the parent's uuid as the **leading** parameter of every method, path
`` `<parent plural>/${parentUuid}/<plural>` ``. It gets **no** `statistics`, `search`, or `deleteBy<Field>` method — only `create`/`get`/`list`/`delete`. `list` defaults `page = 1` (not 0) since the
FE paging starts at page 1 for nested lists.

## Pitfalls

- Don't export `<R>Page` — it's an internal return-type shape for `list`, never imported elsewhere; keep it a non-exported `interface`.
- Don't add an `update` method — editing is exercised only through the FE UI by design; no spec or factory calls a BE update endpoint directly.
- Don't construct a new axios instance per resource — always import and reuse `apiClient` from `api/ApiClient.ts`.
- Don't give a nested resource `statistics`/`search`/`deleteBy<Field>` — see `SeasonApi` for the exact method set a nested resource gets.
- Don't put `uuid` in `Change<R>Request` — it never changes after creation and the request type is also used by the FE form.

## Checklist

- [ ] File order: `<R>` interface (uuid first) → `Statistics` (if applicable) → non-exported `<R>Page` → `Change<R>Request` (no uuid) → `<r>Api` object literal.
- [ ] All paths relative, no leading slash, reusing the shared `apiClient`.
- [ ] `search` returns `<R>[]`; `list` returns the full page; no `update` method anywhere.
- [ ] Nested resource: parent uuid is the leading parameter on every method; no `statistics`/`search`/`deleteBy<Field>`.
- [ ] `deleteBy<Field>` added only when a spec in `resource-specs` actually needs it.
