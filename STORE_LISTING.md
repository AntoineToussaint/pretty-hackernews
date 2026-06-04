# Chrome Web Store listing — Hatch

Upload package: `build/chrome-mv3-prod.zip` (run `bun run plasmo:zip` to regenerate).

## Name
Hatch — a calmer Hacker News

## Summary (≤132 chars)
A calmer, modern Hacker News — in place. Themes, keyboard nav, inline article previews, and vote/comment on your own account.

## Category
Productivity (or News & Weather)

## Detailed description
Hatch restyles news.ycombinator.com in place — same page, same links, your
existing login — into a calm, modern reader. It renders its own clean UI over
HN's data, so you get a real design instead of a recolor.

Features
• Named themes including a faithful, dense "Classic" look as the default —
  switchable from the in-page settings.
• Instant, no-reload navigation between feeds and stories; back/forward work.
• Keyboard navigation — j/k to move, o/Enter to open, u to upvote.
• Upvote, comment, and reply on your real HN account (no passwords stored).
• Read/seen dimming so you don't re-read the same stories.
• Velocity badges on fast-rising stories and an "OP" badge on submitter comments.
• Save stories, mute domains, collapse comment threads, set a default feed.
• Optional inline article previews — read the linked page (clean text + image)
  without leaving HN.
• Optional AI digest (off by default, bring your own key) — summarizes a thread
  and matches stories to your interests. It only helps you read; it never writes
  comments or votes for you.

Local-first: no accounts, no servers of our own, no tracking. Your settings,
bookmarks, history — and, if you use AI, your key — live only in your browser.
The full source is open and the network calls are listed in the privacy policy.

Not affiliated with Y Combinator.

## Permission justifications (Web Store review form)
- Host access to news.ycombinator.com: to render the reader on HN and to vote/
  comment using your existing HN session.
- storage: to save your theme, seen-stories, bookmarks, muted domains, and
  default feed locally on your device.
- declarativeNetRequest: to remove HN's Content-Security-Policy on HN's own
  pages so the reader can display site icons, the Inter font, and article
  preview images. No network requests are blocked or redirected. (It also strips
  the Origin header on the extension's own calls to api.anthropic.com so keys on
  zero-data-retention orgs work — scoped to the extension's requests, never
  other sites'.)
- Host access to api.anthropic.com / api.openai.com: used only if you turn on AI
  and trigger it, to call the provider you chose with your own key.
- Optional broad host access (requested only if you turn on "Article previews"):
  to fetch a single linked page when you click "Preview", so its text can be
  shown inline. Nothing is fetched unless you click Preview.

## Privacy / data use
- We operate no servers and run no analytics; we collect no user data.
- Settings, bookmarks, history, and (if used) your AI key are stored only in
  your browser via chrome.storage.local.
- Network calls, in full: news.ycombinator.com (the feed/comments and, when you
  choose, voting/commenting with your existing login); Hacker News's own public
  data APIs hacker-news.firebaseio.com and hn.algolia.com (anonymous reads);
  fonts.googleapis.com for the Inter font (site icons are drawn locally, no
  favicon requests); the page you click "Preview" on (only if previews are
  enabled); and api.anthropic.com / api.openai.com (only if you enable AI and
  trigger it, called directly with your key).
- AI is opt-in and used only to summarize/match for reading — never to write
  comments or vote. See the LICENSE covenant.
- Full source and the complete network list: see the privacy policy + repo.

## Assets still needed
- 1–5 screenshots, 1280×800 or 640×400 (capture from a real logged-in session:
  the feed, a story with comments, the settings modal, an open preview).
- A small promo tile (440×280) is optional but recommended.
- A privacy policy URL (a short GitHub Pages / gist page restating the above).
