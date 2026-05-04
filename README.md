# Hatch

A calmer, prettier reader for [Hacker News](https://news.ycombinator.com/).

Built because the original site is fast and functional but visually rough. Hatch keeps the same content and ranking, with a modern UI: dark-by-default, warm accent gradient, glassy cards, threaded comments with depth-coloured guides, and a single column tuned for reading.

## Stack

- [Vite](https://vitejs.dev/) + React 19 + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com/) (via the official Vite plugin)
- No router, no state library — hash routing and `useState` are enough

## Data sources

Two HN APIs, used where each is strongest:

- **Feed lists** come from the official [HN Firebase API](https://github.com/HackerNews/API) — `topstories.json`, `newstories.json`, `beststories.json`, `askstories.json`, `showstories.json`, `jobstories.json`. These match the live ranking on news.ycombinator.com.
- **Comment threads** come from the [HN Algolia API](https://hn.algolia.com/api) — `/items/<id>` returns the entire nested tree in one request, which is much faster than recursing through Firebase's `kids` arrays.

No API keys, no auth.

## Run locally

```sh
bun install
bun run dev
```

Then open http://localhost:5173/.

`npm`, `pnpm`, and `yarn` work too — the project has no Bun-specific code.

## Build

```sh
bun run build
bun run preview
```

The output is a static SPA in `dist/` — drop it on any static host (Vercel, Netlify, Cloudflare Pages, GitHub Pages, S3).

## Routes

Hash-based, so links are shareable without a server:

- `#/top` (default), `#/new`, `#/best`, `#/ask`, `#/show`, `#/jobs`
- `#/story/<id>` — story page with comments

## Project layout

```
src/
  App.tsx              # hash router + theme
  components/
    Header.tsx         # logo, feed tabs, theme toggle
    StoryList.tsx      # feed fetch + render
    StoryCard.tsx      # one row in the list
    StoryView.tsx      # story header + comment tree
    Comment.tsx        # recursive, collapsible
    Skeleton.tsx       # shimmering loading states
  lib/
    api.ts             # Firebase + Algolia clients
    format.ts          # time-ago, hostname, favicon
  index.css            # design tokens, gradient backdrop, animations
```

## Notes

- Comment HTML is rendered with `dangerouslySetInnerHTML`. HN serves pre-sanitised HTML, but if you fork this for an untrusted feed swap in [DOMPurify](https://github.com/cure53/DOMPurify).
- Theme preference is persisted to `localStorage` under the `theme` key. Initial value follows `prefers-color-scheme`.

## Licence

MIT. Not affiliated with Y Combinator.
