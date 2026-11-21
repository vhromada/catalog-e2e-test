---
name: new-resource
description: >-
  Use when adding a complete new resource to catalog-e2e-test (or a nested child resource) — orchestrates the API client, test data factory, page objects, route specs and cross-cutting wiring,
  in the right order. Also use to decide whether the resource is simple (Genre-like), composite (Movie-like) or nested (Season-like) before starting.
---

# New resource (orchestrator)

## Scope

Adding an entire new resource to the e2e suite end-to-end — the BE API client, test-data factory, FE page objects, per-route specs, and the cross-cutting registries a finished resource must be
wired into. This skill sequences the five other `.claude/skills/` layer skills; it does not duplicate their content. Read `.claude/skills/new-resource/conventions.md` first — it's the shared
reference every layer skill also links back to.

## 1. Gather the resource spec before writing anything

Pin these down (ask the user if ambiguous) before invoking any layer skill:

- **Name**: singular/plural PascalCase (e.g. `Director`/`Directors`), FE routes (`/<plural>`, `/<plural>/add`, `/<plural>/:uuid`, optional `/<plural>/:uuid/detail`), BE REST path
  (`rest/<plural>`).
- **Fields**: name + TypeScript type + required/optional for each field of `Change<R>Request`; which field the list search filters on.
- **Relations**: any fields that are uuids or `string[]` of uuids referencing another resource (e.g. Movie's `genres: string[]`).
- **Picture**: does the resource have a picture-choice flow (Movie-shaped)?
- **Detail page**: does the resource have a `/<plural>/:uuid/detail` route?
- **Shape**: simple, composite with detail, nested child, or special — see the decision table below.

### Shape decision table

| Shape                     | Reference                  | Characteristics                                                                                                                                                |
| ------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Simple (canonical)        | Genre                      | single field, list+form, no detail page, no relations                                                                                                          |
| Composite with detail     | Movie                      | relations, picture modal, repeated rows (media), `<R>Values` interface, detail page                                                                            |
| Nested child              | Season                     | parent uuid as leading parameter in API methods and page `goto`s; no `search`/`statistics`/`deleteBy` API; parent chain built in spec `beforeEach`/`afterEach` |
| Special (do not template) | cheats, pictures, accounts | singleton-per-parent, binary upload, or admin-gated/no-create-delete shapes — skills only point at the real files for these, there is no template to follow    |

## 2. Invoke the layer skills, in this order

1. **`api-client`** — types first; the factory, page objects, and specs all import `<R>`/`Change<R>Request` from it and use the client for setup/cleanup.
2. **`test-data`** — the factory needs `Change<R>Request` from step 1.
3. **`page-objects`** — independent of steps 1–2, but can run after them for convenience; specs need all three of 1–3 to exist.
4. **`resource-specs`** — needs the API client, factory, and page objects (1–3) all in place.
5. **`catalog-wiring`** — last, since it registers the finished routes/pages from steps 1–4 into the shared registries. Mandatory, not an afterthought — see its own Pitfalls section.

## 3. Final step

Run `npm run lint` and `npm run type-check`. Running the new specs needs the Docker stack: `npm run docker:up` + `npm run wait` (then `npm run test`), or the full `npm run test:e2e` cycle.

Non-blocking reminder — mention to the user, don't block on it: `README.md`/`AGENTS.md` describe the project structure generically; no per-resource edits are needed there beyond what
`catalog-wiring` already covers.

## File-count sanity table

For a simple (Genre-like) resource, expect roughly 6 new files (~710 lines: API client ~57, `ListPage` ~82, `FormPage` ~66, `list.spec.ts` ~221, `add.spec.ts` ~120, `edit.spec.ts` ~167) plus
factory/registry edits across `utils/testData.ts` and the `catalog-wiring` files. A Movie-like (composite + detail) resource adds ~2 more files (`DetailPage` ~39, `detail.spec.ts` ~115) and grows
the form/specs to roughly 250 lines (form) and 300–440 lines (add/list specs) given the extra relation/picture/media coverage.

## Pitfalls

- Don't skip straight to specs before the API client/factory/page objects exist — the sequence above exists because later steps' imports and method calls depend on earlier steps' types and
  signatures, not an arbitrary preference.
- Don't treat `catalog-wiring` as optional or deferrable — see its own Pitfalls section for why it's the most commonly forgotten step.
- See each individual layer skill's own Pitfalls section for layer-specific mistakes (no update method, alphabetical factory placement, no base classes, `mockResponse` restricted to
  `tests/catalog/*`, etc.) — this orchestrator doesn't repeat them.

## Verification

1. Diff the generated files against the layer skills' Genre-derived (or Movie/Season-derived, for composite/nested resources) template sections — selectors, method/field ordering, and file
   structure should match the pattern exactly, with only resource-specific names/fields substituted.
2. Every new/edited file passes `npm run lint` and `npm run type-check`.
3. Optional — offer this to the user, don't do it unprompted: dry-run the skill chain by scaffolding the new resource on a scratch branch, run the stack and the new specs, and discard the branch
   if it was only meant as a dry run before committing to the real implementation.
