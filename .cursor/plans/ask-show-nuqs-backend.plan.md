# Ask and Show pages: nuqs + backend filtering (plan update)

This plan **replaces** the previous "placeholder only" approach for Ask and Show. It also **removes** Submit and Jobs from scope: no new pages for `/submit` or `/jobs`.

---

## Scope

- **Ask** (`/ask`) and **Show** (`/show`): real list pages with filtered feed and **query-param state** via **nuqs**.
- **Backend**: Filter posts by title prefix (`Ask HN:` / `Show HN:`); no new DB column.
- **No** `/submit` or `/jobs` pages; header nav should not link to them.

---

## 1. Install and wire nuqs

- **Package**: Add `nuqs` to the project (`bun add nuqs` or `npm i nuqs`).
- **Adapter**: In [src/app/layout.tsx](src/app/layout.tsx), wrap `children` in `<NuqsAdapter>` from `nuqs/adapters/next/app` so URL query state works across the app.

---

## 2. Query-param state (nuqs)

- **Server-side**: Use **createSearchParamsCache** from `nuqs/server` so Ask/Show pages can read `sort` (and optionally `page`/`offset`) from the URL and stay server-rendered.
- **Shared module**: Create e.g. `src/lib/search-params.ts` and define:
  - `sort`: `parseAsStringLiteral(['top','new','discussed']).withDefault('top')`
  - Optionally `page` or `offset`: `parseAsInteger.withDefault(1)` (if you add pagination later).
- **Usage in pages**: In `/ask` and `/show` server components, call `await searchParamsCache.parse(searchParams)` and pass the parsed `sort` (and `offset` if used) into `getFeed`. The URL is the source of truth.
- **Optional client UI**: If you add sort tabs or a dropdown, use **useQueryStates** with the same parsers (export the parser object or use the cache’s keyMap) so client updates the URL and the server re-renders with the new params. See nuqs docs: `createSearchParamsCache`, `parseAsStringLiteral`, `useQueryState` / `useQueryStates`.

---

## 3. Backend: filter Ask and Show posts

- **Convention** (HN-style):
  - **Ask** = posts where title starts with `"Ask HN:"` (case-insensitive).
  - **Show** = posts where title starts with `"Show HN:"` (case-insensitive).
- **No schema change**: Filter in the query; no new column on `posts`.

**Validator** ([src/lib/validators/posts.ts](src/lib/validators/posts.ts)):

- Add to `listPostsQuerySchema`: `type: z.enum(['ask','show']).optional()`.

**DB** ([src/db/queries/posts.ts](src/db/queries/posts.ts)):

- Extend `listPosts` options with `type?: 'ask' | 'show'`.
- When `type === 'ask'`: add `and(ilike(posts.title, 'Ask HN:%'))`.
- When `type === 'show'`: add `and(ilike(posts.title, 'Show HN:%'))`.
- Use Drizzle’s `ilike` for case-insensitive match; import `and`/`ilike` as needed.

**Service** ([src/posts/service.ts](src/posts/service.ts)):

- In `getFeed`, pass `type` from `ListPostsQuery` through to `listPosts` so filtered results use the same sorting/ranking logic as the main feed.

---

## 4. Ask and Show pages

- **`/ask`** ([src/app/ask/page.tsx](src/app/ask/page.tsx)):
  - Server component.
  - Parse query state with the nuqs cache (`sort`, and `offset` if you added it).
  - Call `getFeed({ sort, limit, offset, type: 'ask' })`.
  - Render the same list UI as the home page (number, upvote, title, domain, metadata line). Optional: short “Ask” banner text.
- **`/show`** ([src/app/show/page.tsx](src/app/show/page.tsx)):
  - Same as Ask but `getFeed(..., type: 'show')` and optional “Show HN” banner.
- Reuse the home list item markup (or extract a shared `PostList` / row component) so layout and behavior stay consistent with the main feed.

---

## 5. Header nav

- In the layout, **do not** add links for **jobs** or **submit**.
- Nav items: **new | threads | past | comments | ask | show** (and “Agent onboarding” if desired).

---

## Summary of files

| File | Change |
|------|--------|
| `package.json` | Add dependency `nuqs`. |
| [src/app/layout.tsx](src/app/layout.tsx) | Wrap `children` in `<NuqsAdapter>`. Omit jobs/submit from nav. |
| `src/lib/search-params.ts` | New: `createSearchParamsCache` with `sort` (and optional `page`/`offset`) parsers. |
| [src/lib/validators/posts.ts](src/lib/validators/posts.ts) | Add optional `type: z.enum(['ask','show'])` to `listPostsQuerySchema`. |
| [src/db/queries/posts.ts](src/db/queries/posts.ts) | Add optional `type` filter to `listPosts` using `ilike` on title. |
| [src/posts/service.ts](src/posts/service.ts) | Pass `type` from query to `listPosts` in `getFeed`. |
| `src/app/ask/page.tsx` | New: server page, nuqs parse, `getFeed(..., type: 'ask')`, reuse list UI. |
| `src/app/show/page.tsx` | New: server page, nuqs parse, `getFeed(..., type: 'show')`, reuse list UI. |

No new pages or routes for **submit** or **jobs**.
