# Hatch

A calmer, modern reader for [Hacker News](https://news.ycombinator.com/) — that
runs **in place on the real site**.

Hatch is a browser extension that takes over news.ycombinator.com's feed and
item pages and renders its own clean UI over HN's data: dark-by-default with a
warm accent, threaded comments with depth-coloured guides, and a single reading
column. Same URLs, same links, your existing HN login — so you can upvote,
comment, and reply on your own account without leaving. There's also a
standalone web build of the same reader.

## Features

- Renders in place on news.ycombinator.com (feed + item pages; other HN pages
  stay native)
- Five themes (dark + light), switched from an in-page settings popover
- Instant client-side navigation — no full reloads; back/forward work
- Keyboard nav — `j`/`k` move, `o`/`Enter` open, `u` upvote
- **Upvote, comment, and reply** on your real HN account (no passwords stored)
- Read/seen dimming, velocity 🔥 badges, "OP" badges on submitter comments
- Save/bookmark, mute domains, collapse threads, default feed
- Optional **inline article previews** — read the linked page (clean text +
  image) without leaving HN
- Local-first: no servers, no analytics; preferences live in `chrome.storage`

## Stack

- [Plasmo](https://www.plasmo.com/) (MV3 extension) — content script, background
  worker, popup
- React 19 + TypeScript, [Tailwind CSS v4](https://tailwindcss.com/)
- [@mozilla/readability](https://github.com/mozilla/readability) +
  [DOMPurify](https://github.com/cure53/DOMPurify) for inline previews
- [Vite](https://vitejs.dev/) for the standalone web build

## Run the extension (dev)

```sh
bun install
bun run css:watch    # terminal 1 — recompiles Tailwind on change
bun run plasmo:dev   # terminal 2 — Plasmo dev server with hot reload
```

Then load it once:

1. Open `chrome://extensions`
2. Enable **Developer mode**
3. **Load unpacked** → select `build/chrome-mv3-dev`
4. Open **https://news.ycombinator.com**

Edits hot-reload. (Tailwind is decoupled from Plasmo's bundler — `css:watch`
regenerates `src/compiled.css`, which the content script injects into its Shadow
DOM. See *How it works*.)

## Build / package the extension

```sh
bun run plasmo:build   # → build/chrome-mv3-prod
bun run plasmo:zip     # → build/chrome-mv3-prod.zip  (upload to the Web Store)
```

See [`STORE_LISTING.md`](./STORE_LISTING.md) for listing copy + permission
justifications, and [`TESTING.md`](./TESTING.md) for sharing a test build.

## Run the standalone web reader

```sh
bun run dev      # http://localhost:5173/
bun run build    # static SPA in dist/ (GitHub Pages)
```

The web build is the same reader as a normal SPA (no in-page voting/commenting —
that needs the extension's same-origin session). It also serves
`public/privacy.html`.

## How it works

- **In place, not a separate tab.** A Plasmo content script (`src/contents/hn.tsx`)
  mounts the React reader as a full-screen Shadow-DOM overlay on HN's feed/item
  pages and hides HN's own markup. Shadow DOM isolates our styles from HN's CSS.
- **Same session.** Because it runs on news.ycombinator.com, voting and
  commenting reuse your real login via same-origin requests — vote tokens and
  comment-form `hmac` tokens are read from HN's DOM / fetched same-origin
  (`src/sources/hn/auth.ts`). No CORS, no credentials handled by the extension.
- **Background worker** (`src/background.ts`) strips HN's `Content-Security-Policy`
  on HN pages (via `declarativeNetRequest`) so favicons, the Inter font, and
  preview images can load — and fetches article HTML for previews (cross-origin
  fetches must run in the worker under MV3).
- **Inline previews** (`src/sources/hn/article.ts`, `ArticlePeek.tsx`) fetch the
  linked page, extract it with Readability, sanitize with DOMPurify, and render
  it inline. The broad host permission is **optional** and requested just-in-time
  from the toolbar **popup** (`src/popup.tsx`).
- **Data:** feeds from the official
  [HN Firebase API](https://github.com/HackerNews/API); comment trees from the
  [HN Algolia API](https://hn.algolia.com/api).

## Project layout

The reader is built around pluggable **sources** — each owns both its data
adapter and its own presentation ("skin"). Today there's one: Hacker News.

```
src/
  contents/hn.tsx       # the in-place reader (Plasmo content script)
  background.ts         # CSP strip + article fetch (Plasmo background)
  popup.tsx             # toolbar popup: opt-in to article previews
  App.tsx               # standalone web entry (source-aware router + theme)
  components/           # shared chrome: Header, ThemeSwitcher, SettingsPopover…
  sources/
    types.ts            # the Source contract every skin implements
    registry.ts         # installed sources
    hn/                 # the Hacker News skin
      index.ts          # hnSource: Source
      api.ts            # Firebase + Algolia clients
      auth.ts           # vote / comment / reply via the user's session
      article.ts        # fetch + Readability + DOMPurify for previews
      Feed.tsx Story.tsx StoryCard.tsx Comment.tsx ArticlePeek.tsx CommentBox.tsx
      voteContext / seenContext / prefsContext  # state, persisted to chrome.storage
  lib/
    themes.ts format.ts runtime.ts
  index.css             # design tokens, themes, gradient backdrop
```

## Permissions

- **news.ycombinator.com** — render the reader; vote/comment with your session.
- **storage** — save preferences locally.
- **declarativeNetRequest** — relax HN's CSP on HN's pages so icons/fonts/preview
  images load (no requests blocked or redirected).
- **broad host access (optional)** — requested only if you enable Article
  previews; used solely to fetch a page you click "Preview" on.

## Licence

MIT. Not affiliated with Y Combinator.
