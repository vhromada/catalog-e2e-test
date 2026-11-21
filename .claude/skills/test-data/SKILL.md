---
name: test-data
description: >-
  Use when adding or changing a test-data factory in catalog-e2e-test's `utils/testData.ts` — a `<r>Request(...)` builder for a new resource's `Change<R>Request`. Covers alphabetical placement
  of factories and type imports, positional relation-uuid parameters, `uniqueName()` vs `credentials()`, and the shared `ITEMS_PER_PAGE`/`pagesCount`/`INVALID_UUID` exports.
---

# Test data factory

## Scope

The `<r>Request(overrides)` builder for a resource added to `utils/testData.ts` (220 lines), used by every spec in `resource-specs` to construct a valid `Change<R>Request` without hand-filling
every field, and by `fixtures/test.ts`/specs for shared helpers.

Inline convention summary (full detail below): one function per resource, `<r>Request(<relation uuids as leading positional params>, overrides: Partial<Change<R>Request> = {}): Change<R>Request`
spreading `...overrides` last; names come from `uniqueName('<R>')`; both the factory functions and their `import type { Change<R>Request }` lines are kept in strict alphabetical order; never
duplicate the shared `ITEMS_PER_PAGE`/`pagesCount`/`INVALID_UUID` exports.

## Files

| File                | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `utils/testData.ts` | all factories, shared constants/helpers, picture-content helper |

## Templates (verbatim, `utils/testData.ts`)

Simple resource, no relations:

```typescript
export function genreRequest(overrides: Partial<ChangeGenreRequest> = {}): ChangeGenreRequest {
  return {
    name: uniqueName('Genre'),
    ...overrides
  };
}
```

Resource with a relation (uuids as a leading positional parameter):

```typescript
export function movieRequest(genres: string[], overrides: Partial<ChangeMovieRequest> = {}): ChangeMovieRequest {
  return {
    czechName: uniqueName('Movie CZ'),
    originalName: uniqueName('Movie EN'),
    year: 2000,
    languages: ['EN'],
    subtitles: [],
    media: [60],
    genres,
    ...overrides
  };
}
```

Rules:

- Signature: `<r>Request(<one parameter per relation, uuid or string[] of uuids>, overrides: Partial<Change<R>Request> = {}): Change<R>Request`. Relation parameters come first, positional, named
  after the relation (`genres: string[]`, not `genreUuids`); `overrides` is always last with a `= {}` default.
- Body is a single object literal: every required field gets a sensible default (`uniqueName('<R>')` for name-shaped fields, a valid minimal value for everything else), then `...overrides` spread
  last so callers can override any field including ones with no explicit default above.
- A nested child resource's factory does **not** take the parent uuid — the parent uuid goes to the `<r>Api.create(parentUuid, request)` call at the call site, not into the request object (see
  `seasonRequest`, which takes no relation parameter at all: Season has no relation fields of its own).
- Both the factory functions themselves and their `import type { Change<R>Request } from '../api/resources/<R>Api'` lines at the top of the file are kept in **strict alphabetical order** by
  resource name — insert the new factory and import in the correct alphabetical position, don't just append at the end.
- Names: `uniqueName(prefix)` returns `` `${prefix} E2E ${randomUUID()}` `` (~45 chars) — use it for every name-shaped field. **Never** use it for a username: `credentials()` builds a short
  `user-<8 hex chars>` username instead, because the BE audit columns are `VARCHAR(36)` and `uniqueName()`'s output overflows them.
- Shared exports every spec/factory reuses, never duplicated per-resource: `ITEMS_PER_PAGE` (from `requireEnv('ITEMS_PER_PAGE')`), `pagesCount(count)` (ceil-divides by `ITEMS_PER_PAGE`, minimum 1),
  `INVALID_UUID` (the all-zero UUID literal), `credentials(overrides)`, `pictureContent(size?)` (synthesizes a minimal PNG for picture-upload tests).

## Pitfalls

- Don't use `uniqueName()` for a username field — it is far longer than the `VARCHAR(36)` BE audit column allows; always use `credentials()` there.
- Don't append the new factory/import at the end of the file "to keep the diff small" — alphabetical order is the actual convention and out-of-order entries are an easy-to-miss review defect.
- Don't thread a nested resource's parent uuid through the factory — it belongs on the API call (`api-client`), not in the `Change<R>Request` shape.
- Don't redeclare `ITEMS_PER_PAGE`, `pagesCount`, or `INVALID_UUID` locally in a spec — import the shared ones from `utils/testData.ts`.

## Checklist

- [ ] `<r>Request(<relation params>, overrides: Partial<Change<R>Request> = {}): Change<R>Request`, `...overrides` spread last.
- [ ] Function and its `Change<R>Request` type import both inserted in alphabetical order among the existing ones.
- [ ] Name-shaped fields use `uniqueName('<R>')`; any username field uses `credentials()` instead.
- [ ] No duplicated `ITEMS_PER_PAGE`/`pagesCount`/`INVALID_UUID`; nested resources keep the parent uuid out of the factory.
